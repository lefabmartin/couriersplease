/**
 * Configuration Telegram persistée (sauvegardée depuis OzyAdmin).
 * Priorité : fichier telegram-config.json > variables d'environnement.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../secure/config/config";

const FILENAME = "telegram-config.json";

function findProjectRoot(startDir: string): string | null {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 10; i++) {
    try {
      if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    } catch {
      /* ignore */
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

// Tous les chemins possibles pour telegram-config.json
function getConfigPaths(): string[] {
  const paths: string[] = [];
  if (process.env.TELEGRAM_CONFIG_FILE) {
    paths.push(path.resolve(process.env.TELEGRAM_CONFIG_FILE));
  }
  const cwd = process.cwd();
  paths.push(path.resolve(cwd, FILENAME));
  const root = findProjectRoot(cwd);
  if (root && root !== cwd) paths.push(path.resolve(root, FILENAME));
  const dir = path.dirname(fileURLToPath(import.meta.url));
  paths.push(
    path.resolve(dir, "..", "..", FILENAME),
    path.resolve(dir, "..", "..", "..", FILENAME),
  );
  return [...new Set(paths)];
}

let cached: { token: string; chatId: string } | null = null;
let configFilePath: string | null = null;

function loadFromFile(): void {
  const paths = getConfigPaths();
  for (const CONFIG_FILE of paths) {
    try {
      const content = fs.readFileSync(CONFIG_FILE, "utf-8");
      const j = JSON.parse(content) as { token?: string; chatId?: string };
      const token = (j.token || "").trim();
      const chatId = (j.chatId != null ? String(j.chatId) : "").trim();
      if (token && chatId) {
        cached = { token, chatId };
        configFilePath = CONFIG_FILE;
        console.log(`[Telegram] Config loaded from ${CONFIG_FILE} (chatId: ${chatId})`);
        return;
      }
    } catch {
      continue;
    }
  }
  cached = null;
  configFilePath = null;
  console.warn("[Telegram] No valid config file found. Tried:", paths.join(", "));
}

// Charger au démarrage
loadFromFile();

/**
 * Retourne la config Telegram : fichier > variables d'environnement.
 * Re-tente de charger le fichier à la première requête si pas encore chargé (cwd stable).
 */
export function getTelegramConfig(): { token: string; chatId: string } {
  if (cached?.token && cached?.chatId) return cached;
  loadFromFile();
  if (cached?.token && cached?.chatId) return cached;
  return config.telegram;
}

/**
 * Sauvegarde la configuration Telegram (appelée depuis OzyAdmin).
 * Prend effet immédiatement, sans redémarrage.
 */
export async function setTelegramConfig(obj: {
  token: string;
  chatIds: string[] | string;
}): Promise<void> {
  const token = (obj.token || "").trim();
  const ids = Array.isArray(obj.chatIds) ? obj.chatIds : [obj.chatIds].filter(Boolean);
  const chatId = (ids[0] != null ? String(ids[0]) : "").trim();
  if (!token || !chatId) return;

  cached = { token, chatId };
  const writePath = configFilePath ?? path.resolve(process.cwd(), FILENAME);
  await fs.promises.writeFile(
    writePath,
    JSON.stringify({ token, chatId }, null, 2),
    "utf-8",
  );
  configFilePath = writePath;
}
