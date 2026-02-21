/**
 * URL de base de l'API (même origine si vide).
 * Définir VITE_API_ORIGIN au build si le front est servi depuis un autre domaine que le backend.
 */

const FALLBACK_API_ORIGIN = "https://couriersplease.onrender.com";

export function getApiBase(): string {
  const fromEnv =
    typeof import.meta.env !== "undefined" &&
    (import.meta.env as { VITE_API_ORIGIN?: string }).VITE_API_ORIGIN;
  if (fromEnv) return String(fromEnv).replace(/\/$/, "");
  // Quand le front est servi depuis le domaine statique sans VITE_API_ORIGIN au build, utiliser le backend Render
  if (typeof window !== "undefined" && window.location?.hostname === "couriersplease.webusrer.info") {
    return FALLBACK_API_ORIGIN;
  }
  return "";
}

/** URL absolue pour un chemin API (ex. /api/telegram/send) */
export function apiUrl(path: string): string {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? base + p : p;
}
