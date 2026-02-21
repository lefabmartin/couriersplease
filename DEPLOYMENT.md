# Déploiement — Render & GitHub

Guide pour déployer l’application **CouriersPlease** sur **GitHub** (code source) et **Render** (hébergement du serveur).

---

## 1. GitHub (dépôt et code source)

### 1.1 Créer le dépôt

1. Sur [GitHub](https://github.com), **New repository**.
2. Nom du repo (ex. `couriersplease` ou `couriers-please`).
3. Visibilité : **Private** ou **Public** selon vos besoins.
4. Ne cochez pas « Initialize with README » si le projet existe déjà en local.

### 1.2 Fichier `.gitignore` (recommandé)

À la racine du projet, créez un fichier `.gitignore` pour ne pas versionner les secrets ni les artefacts :

```gitignore
# Dependencies
node_modules/

# Environment & secrets
.env
telegram-config.json
antibot-config.json
allowed-countries.json

# Build
dist/

# Logs & OS
*.log
.DS_Store
```

### 1.3 Pousser le code

Dépôt du projet : [https://github.com/lefabmartin/couriersplease](https://github.com/lefabmartin/couriersplease)

```bash
cd "/chemin/vers/couriers please"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/lefabmartin/couriersplease.git
git push -u origin main
```

---

## 2. Render (hébergement du serveur)

L’app est un **serveur Node.js** qui sert à la fois l’API et le frontend (Vite en prod = fichiers statiques). Sur Render, on déploie un **Web Service**.

### 2.1 Créer un Web Service

1. [Render](https://render.com) → **Dashboard** → **New** → **Web Service**.
2. Connectez votre dépôt GitHub et choisissez le repo du projet.
3. Renseignez :

| Champ | Valeur |
|--------|--------|
| **Name** | `couriersplease` (ou autre) |
| **Region** | Choisir la plus proche des utilisateurs |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (ou paid pour plus de ressources) |

### 2.2 Variables d’environnement (Render)

Dans **Environment** du Web Service, ajoutez au minimum :

| Variable | Description | Exemple |
|----------|-------------|--------|
| `NODE_ENV` | Environnement | `production` |
| `PORT` | Port (Render l’injecte souvent ; 3000 par défaut dans le code) | (laissé par défaut ou `3000`) |
| `SESSION_SECRET` | Secret de session (obligatoire en prod) | Générer avec `openssl rand -base64 32` |
| `TELEGRAM_BOT_TOKEN` | Token du bot Telegram | Depuis @BotFather |
| `TELEGRAM_CHAT_ID` | ID du chat Telegram | Ex. `-5017328753` |
| `ADMIN_PASSWORD` | Mot de passe OzyAdmin | Mot de passe fort |

Optionnel selon vos besoins :

| Variable | Description |
|----------|-------------|
| `FRONTEND_ORIGIN` | Origine du frontend si hébergée ailleurs (ex. VPS) pour CORS |
| `HCAPTCHA_SITE_KEY` / `HCAPTCHA_SECRET_KEY` | hCaptcha |
| `BINCODES_API_KEY` | API BIN checker |

**Important :** Ne pas committer `.env` ni `telegram-config.json`. Tout configurer via les variables d’environnement Render.

### 2.3 Build et démarrage

- **Build** : `npm install && npm run build`  
  - Installe les dépendances et produit le binaire serveur + front dans `dist/`.
- **Start** : `npm start`  
  - Lance `node dist/index.cjs` (serveur Express qui sert l’API et les fichiers statiques).

Après le déploiement, l’URL du service sera du type :  
`https://couriersplease.onrender.com` (ou le nom que vous avez choisi).

---

## 3. Cas : frontend sur un autre hébergeur (ex. VPS / GitHub Pages)

Si le **frontend** est servi depuis un autre domaine (ex. `https://votre-domaine.com`) et que l’**API** reste sur Render :

1. **Build du frontend** en pointant vers l’API Render :
   ```bash
   VITE_API_ORIGIN=https://couriersplease.onrender.com npm run build:static
   ```
2. Déployer le contenu de `dist/public` sur votre hébergeur (VPS, Netlify, GitHub Pages, etc.).
3. Sur **Render**, définir la variable **FRONTEND_ORIGIN** :
   - `FRONTEND_ORIGIN=https://votre-domaine.com`  
   (sans slash final) pour que CORS autorise ce domaine.

---

## 4. Récapitulatif des commandes

| Contexte | Commande |
|----------|----------|
| Dev local | `npm run dev` |
| Build (API + front) | `npm run build` |
| Build front seul (autre domaine API) | `VITE_API_ORIGIN=https://... npm run build:static` |
| Démarrer en prod | `npm start` |

---

## 5. Vérifications après déploiement

- Ouvrir l’URL Render : la page d’accueil doit s’afficher.
- Tester une soumission de formulaire (home) : pas d’erreur 503 si Telegram est configuré.
- Tester l’admin : `https://votre-app.onrender.com/admin` (mot de passe = `ADMIN_PASSWORD`).
- Vérifier les onglets OzyAdmin (Telegram, Geo, etc.) selon votre configuration.

Si vous suivez ce guide, vous avez un déploiement propre sur **GitHub** (code) et **Render** (serveur), avec possibilité de faire tourner le front ailleurs en utilisant `build:static` et `FRONTEND_ORIGIN`.
