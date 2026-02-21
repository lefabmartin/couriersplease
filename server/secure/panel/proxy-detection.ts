/**
 * Détection Tor/VPN/Proxy
 * Priorité : vérification par IP (ip-api.com) pour éviter les faux positifs
 * quand l'app est derrière un reverse proxy (Render, nginx) qui ajoute X-Forwarded-For, etc.
 */

import type { Request } from "express";
import { getRealIp } from "./ip-manager";

export interface ProxyDetectionResult {
  isProxy: boolean;
  isVPN: boolean;
  isTor: boolean;
  type?: "proxy" | "vpn" | "tor" | "datacenter";
  confidence: number; // 0-100
  details?: string;
}

// Headers que les CLIENT proxies ajoutent (on n'inclut pas x-forwarded-for, x-real-ip, forwarded, via
// car ils sont ajoutés par notre propre reverse proxy et provoquent des faux positifs)
const CLIENT_PROXY_HEADERS = [
  "proxy-connection",
  "x-proxy-id",
  "forwarded-for-ip",
  "x-cluster-client-ip",
  "client-ip",
];

// Organisations VPN connues (liste partielle)
const KNOWN_VPN_ORGANIZATIONS = [
  "nordvpn",
  "expressvpn",
  "surfshark",
  "cyberghost",
  "private internet access",
  "purevpn",
  "ipvanish",
  "vyprvpn",
  "tunnelbear",
  "windscribe",
  "protonvpn",
  "mullvad",
  "hidemyass",
  "hotspot shield",
];

// ASN connus pour les datacenters
const DATACENTER_ASNS = [
  "AS13335", // Cloudflare
  "AS15169", // Google
  "AS16509", // Amazon
  "AS8075", // Microsoft
  "AS32934", // Facebook
];

/** Vérifie si l'IP est un proxy/VPN connu via ip-api.com (évite les faux positifs des headers reverse proxy) */
export async function checkProxyByIP(ip: string): Promise<boolean | null> {
  if (!ip || ip.startsWith("127.") || ip === "::1") return false;
  const fields = "status,proxy";
  const urls = [
    `http://ip-api.com/json/${ip}?fields=${fields}`,
    `https://ip-api.com/json/${ip}?fields=${fields}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = (await res.json()) as { status?: string; proxy?: boolean };
        if (data.status === "success") return data.proxy === true;
        return false;
      }
    } catch {
      continue;
    }
  }
  return null; // API indisponible
}

/**
 * Détection proxy basée uniquement sur les headers (sans appel API).
 * Utilisée en fallback ou quand on ne peut pas appeler l'API.
 */
export function detectProxy(req: Request): ProxyDetectionResult {
  const ip = getRealIp(req) || "";
  const result: ProxyDetectionResult = {
    isProxy: false,
    isVPN: false,
    isTor: false,
    confidence: 0,
  };

  // 1. Headers typiquement ajoutés par un proxy côté CLIENT (pas par notre reverse proxy)
  let proxyHeadersFound = 0;
  for (const header of CLIENT_PROXY_HEADERS) {
    if (req.headers[header] || req.headers[header.toUpperCase()]) {
      proxyHeadersFound++;
    }
  }
  if (proxyHeadersFound > 0) {
    result.isProxy = true;
    result.type = "proxy";
    result.confidence = Math.min(proxyHeadersFound * 20, 85);
    result.details = `Client proxy headers: ${proxyHeadersFound}`;
  }

  // 2. User-Agent explicite Tor/Proxy/VPN
  const userAgent = req.headers["user-agent"]?.toLowerCase() || "";
  if (userAgent.includes("tor") || userAgent.includes("proxy") || userAgent.includes("vpn")) {
    result.isProxy = true;
    result.confidence = Math.max(result.confidence, 65);
    if (userAgent.includes("tor")) result.isTor = true;
  }

  // 3. VPN connu dans le host (peu fréquent)
  if (result.isProxy && !result.isTor) {
    const hostname = req.get("host") || "";
    if (KNOWN_VPN_ORGANIZATIONS.some((vpn) => hostname.toLowerCase().includes(vpn))) {
      result.isVPN = true;
      result.type = "vpn";
      result.confidence = Math.max(result.confidence, 80);
    }
  }

  return result;
}

/**
 * Détection proxy avec vérification par IP (ip-api.com) en priorité.
 * À utiliser dans l'antibot pour éviter les faux positifs (ex. IP 105.156.227.127).
 */
export async function detectProxyWithIPCheck(req: Request): Promise<ProxyDetectionResult> {
  const ip = getRealIp(req) || "";
  const headerResult = detectProxy(req);

  const proxyByIP = await checkProxyByIP(ip);
  if (proxyByIP === false) {
    // L'API dit que l'IP n'est pas un proxy → on fait confiance à l'API (pas de faux positif)
    return {
      isProxy: false,
      isVPN: false,
      isTor: headerResult.isTor,
      confidence: 0,
      details: "IP not flagged as proxy by ip-api.com",
    };
  }
  if (proxyByIP === true) {
    return {
      isProxy: true,
      isVPN: false,
      isTor: headerResult.isTor,
      type: "proxy",
      confidence: 90,
      details: "IP flagged as proxy by ip-api.com",
    };
  }
  // API indisponible : fallback sur les headers (sans x-forwarded-for / x-real-ip)
  return headerResult;
}

/**
 * Vérifie si une IP est un exit node Tor
 * Note: En production, utiliser une API ou une liste mise à jour
 */
async function isTorExitNode(ip: string): Promise<boolean> {
  // Simplification: en production, utiliser une API comme:
  // - https://check.torproject.org/api/exit-addresses
  // - https://www.dan.me.uk/torlist/
  
  // Pour l'instant, retourner false (à implémenter avec une vraie API)
  return false;
}

/**
 * Middleware Express pour détecter les proxies (synchrone, header-only)
 */
export function proxyDetectionMiddleware(
  req: Request,
  _res: unknown,
  next: () => void,
): void {
  const detection = detectProxy(req);

  // Ajouter les informations de détection à la requête
  (req as Request & { proxyDetection: ProxyDetectionResult }).proxyDetection =
    detection;

  // En développement, logger la détection
  if (process.env.NODE_ENV === "development" && detection.isProxy) {
    console.log(
      `[PROXY DETECTION] IP: ${getRealIp(req)}, Type: ${detection.type}, Confidence: ${detection.confidence}%`,
    );
  }

  next();
}
