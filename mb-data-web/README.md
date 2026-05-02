# Quantara — Track. Analyze. Grow. (Web Version)

## 🚀 Déploiement en 4 étapes

### Étape 1 — Base de données Supabase

1. Va sur https://supabase.com et ouvre ton projet
2. Clique sur **SQL Editor** (icône terminal à gauche)
3. Copie-colle tout le contenu du fichier `supabase-schema.sql`
4. Clique **Run** — les tables sont créées

### Étape 2 — GitHub

1. Va sur https://github.com et crée un compte si tu n'en as pas
2. Clique **New repository** → nom: `mb-data-propfirm` → Public → Create
3. Sur ton PC, installe Git: https://git-scm.com/download/win
4. Dans le dossier `mb-data-web`, ouvre un terminal et tape:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON-USERNAME/mb-data-propfirm.git
git push -u origin main
```

### Étape 3 — Vercel (hébergement)

1. Va sur https://vercel.com
2. Connecte-toi avec GitHub
3. Clique **Add New Project**
4. Sélectionne ton repo `mb-data-propfirm`
5. Dans **Environment Variables**, ajoute:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://wqxvufikmsaryofyaehg.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGci...` (ta clé complète)
6. Clique **Deploy**
7. Ton app est en ligne en 2 minutes sur `https://mb-data-propfirm.vercel.app`

### Étape 4 — Domaine personnalisé (optionnel)

Dans Vercel → Settings → Domains → ajoute ton domaine

---

## 📁 Structure du projet

```
mb-data-web/
├── app/
│   ├── layout.js       ← Structure HTML de base
│   ├── page.js         ← Application principale
│   └── globals.css     ← Styles globaux
├── components/
│   └── AuthPage.js     ← Page de connexion/inscription
├── lib/
│   └── supabase.js     ← Client Supabase
├── supabase-schema.sql ← Script SQL à exécuter
├── package.json
├── next.config.js
└── vercel.json
```

---

## 🔧 Développement local

```bash
npm install
npm run dev
```
Ouvre http://localhost:3000
