# ESCLAB - Gestion des Commandes Internes (🚀 Premium Edition)

Cette application professionnelle est conçue pour être hébergée sur votre propre nom de domaine. Elle utilise **Next.js 14**, **TypeScript** et un système de design **Vanilla CSS** sur-mesure.

## 🌟 Fonctionnalités incluses
- **Authentification sécurisée** : Login avec gestion des sessions locales (simulée).
- **Dashboard Premium** : Statistiques, indicateurs de performance et activité récente.
- **Gestion des Commandes** : Tableau interactif avec filtrage et création de demandes via modal.
- **Design Adaptatif** : Optimisé pour PC, tablettes et mobiles avec mode sombre natif.
- **Rôles Utilisateurs** : Navigation dynamique basée sur le rôle (Admin, Validateur, Utilisateur).

## 🛠️ Installation Locale
1. Assurez-vous d'avoir [Node.js](https://nodejs.org/) installé.
2. Ouvrez un terminal dans le dossier `esclab-orders`.
3. Installez les dépendances :
   ```bash
   npm install
   ```
4. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
5. Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🌐 Déploiement sur votre Nom de Domaine

### Option 1 : Vercel (Recommandé)
Vercel est la plateforme officielle pour Next.js. C'est la plus simple et la plus performante.
1. Créez un compte sur [Vercel.com](https://vercel.com/).
2. Installez l'outil CLI : `npm i -g vercel`.
3. Dans le dossier `esclab-orders`, lancez : `vercel`.
4. Suivez les instructions pour lier votre domaine (ex: `commandes.esclab-algerie.com`) dans les paramètres Vercel.

### Option 2 : Serveur de fichiers statiques (Netlify / GitHub Pages)
Cette application peut être exportée comme un site statique :
1. Modifiez `next.config.mjs` pour ajouter `output: 'export'`.
2. Lancez `npm run build`.
3. Le dossier `out` contient votre application prête à être uploadée par FTP sur votre hébergeur.

## 💾 Connexion à une Base de Données (Production)
Pour rendre l'application 100% fonctionnelle avec persistence de données sur le long terme :
1. Créez un projet sur **[Supabase](https://supabase.com/)** (PostgreSQL gratuit).
2. Utilisez les variables d'environnement `.env.local` pour stocker vos clés API.
3. Remplacez les simulations `localStorage` et `setTimeout` par des appels fetch vers `API Routes`.

---
© 2026 ESCLAB Algérie - Développé avec excellence.
