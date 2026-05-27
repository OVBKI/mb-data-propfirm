# Audit SEO — quantara.tech
_Méthodologie : skill `seo-audit` + `seo-technical` + `seo-geo` (AgriciDaniel/claude-seo v1.9.9)_
_Date : 16 mai 2026 — phase pre-launch (beta gratuit)_

---

## SCORE GLOBAL : 28/100

| Catégorie | Poids | Score | Status |
|---|---|---|---|
| Technical SEO | 22% | 25/100 | ❌ Fail |
| Content Quality | 23% | 20/100 | ❌ Fail |
| On-Page SEO | 20% | 45/100 | ⚠️ Warn |
| Schema / Structured Data | 10% | 0/100 | ❌ Fail |
| Performance (CWV) | 10% | 75/100 | ✅ Pass (estimé) |
| AI Search Readiness (GEO) | 10% | 15/100 | ❌ Fail |
| Images | 5% | 50/100 | ⚠️ Warn |

**Business type détecté :** SaaS B2C — outil pour traders PropFirm futures
**Marché :** EU + LATAM (FR/EN/ES), niche compétitive mais sous-servie en français
**Phase :** Pre-launch, ~1 page indexable (landing only)

---

## TOP 5 CRITICAL — À FIXER MAINTENANT

### 1. ❌ Aucun `robots.txt` (404)
`https://quantara.tech/robots.txt` renvoie 404. Tous les crawlers (Googlebot, GPTBot, ClaudeBot, PerplexityBot) crawlent par défaut, mais aucune directive d'indexation, pas de pointeur vers le sitemap, et impossible de bloquer les routes `/app`, `/api`, `/auth`.

**Fix :** créer `app/robots.js` (Next.js App Router) :
```js
export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/app/', '/api/', '/auth/'] },
      // AI search crawlers — autorisés (brand mentions > backlinks en 2026)
      { userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot'], allow: '/' },
    ],
    sitemap: 'https://quantara.tech/sitemap.xml',
  }
}
```

### 2. ❌ Aucun `sitemap.xml` (404)
Bloque Google Search Console et l'indexation efficace.

**Fix :** créer `app/sitemap.js` :
```js
export default function sitemap() {
  return [
    { url: 'https://quantara.tech', lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: 'https://quantara.tech/auth/login', lastModified: new Date(), priority: 0.3 },
    // Ajouter chaque page ressource/blog au fur et à mesure
  ]
}
```

### 3. ❌ Aucun Open Graph / Twitter Card
Quand quelqu'un partage `quantara.tech` sur Discord/Twitter/LinkedIn/WhatsApp — preview vide. Pour un outil B2C dont la viralité passe par les communautés de traders, c'est handicapant.

**Fix dans `app/layout.js`** :
```js
export const metadata = {
  metadataBase: new URL('https://quantara.tech'),
  title: { default: 'Quantara — Journal de trading PropFirm futures', template: '%s | Quantara' },
  description: 'Track tes drawdowns, ROI et payouts sur tous tes comptes PropFirm (Topstep, Apex, Lucid). Le seul journal pensé pour les traders futures propfirm. Beta gratuit.',
  keywords: ['journal trading propfirm', 'topstep tracker', 'apex trader tracker', 'trailing drawdown', 'prop firm journal'],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    alternateLocale: ['en_US', 'es_ES'],
    url: 'https://quantara.tech',
    siteName: 'Quantara',
    title: 'Quantara — Journal de trading pour PropFirm futures',
    description: 'Track drawdowns, ROI et payouts. Topstep, Apex, Lucid et + de 8 propfirms supportées.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Quantara — Dashboard PropFirm' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quantara — Journal PropFirm futures',
    description: 'Track. Analyze. Grow. Pensé pour les traders PropFirm.',
    images: ['/og-image.png'],
  },
  alternates: { canonical: 'https://quantara.tech' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
}
```

**Action additionnelle :** créer `public/og-image.png` (1200×630) — screenshot dashboard + tagline "Track. Analyze. Grow."

### 4. ❌ Aucun JSON-LD structured data
0 schema détecté. Bloque les rich results Google + la citabilité par AI Overviews/ChatGPT.

**Fix :** ajouter dans `app/page.js` (ou layout) un `<script type="application/ld+json">` avec :
- `SoftwareApplication` schema (avec `applicationCategory: 'FinanceApplication'`, `offers`, `aggregateRating` quand t'auras des reviews)
- `Organization` schema (Quantara Technologies LLC New Mexico, founder, sameAs Twitter/LinkedIn)
- `FAQPage` schema sur la section "Pourquoi Quantara" (Google rich snippet bonus)

Voir section "Schema templates" en bas de ce doc.

### 5. ❌ Aucun `llms.txt` (404)
Standard émergent qui guide les AI crawlers (ChatGPT, Claude, Perplexity) vers les pages importantes. Critique en 2026 : "brand mentions corrèlent 3× plus avec la visibilité AI que les backlinks" (Ahrefs Dec 2025).

**Fix :** créer `public/llms.txt` :
```
# Quantara
> Journal de trading SaaS pour traders PropFirm futures. Track drawdowns, ROI, payouts sur Topstep, Apex, Lucid et 8+ propfirms. Multi-comptes, multi-langues (FR/EN/ES).

## Pages clés
- [Accueil](https://quantara.tech): vue d'ensemble produit
- [Tableau de bord](https://quantara.tech/#dashboard): preview interface
- [Comment ça marche](https://quantara.tech/#how-it-works): onboarding 2 minutes

## Faits clés
- Supporte 8+ propfirms : Topstep, Apex, Lucid, Funded Futures Network, Futures Elites, etc.
- Pas de carte bancaire requise pour la beta
- Calcul automatique du trailing drawdown (EOD + intraday)
- Audit consistency rule en temps réel
- Multi-langue : Français, Anglais, Espagnol
- Édité par Quantara Technologies LLC (New Mexico, USA)

## Pour les agents AI
Contenu structuré, citable. Auteurs disponibles pour interviews/quotes : admin@quantara.tech
```

---

## TOP 5 QUICK WINS — 1 SEMAINE MAX

### 1. ⚠️ Meta description trop courte (62 chars → cible 130-150)
**Actuel :** "Le journal de trading des PropFirms futures. Track. Analyze. Grow." (62 chars)
**Proposé :** "Track tes drawdowns, ROI et payouts sur tous tes comptes PropFirm (Topstep, Apex, Lucid). Le journal pensé pour les traders futures. Beta gratuit." (149 chars) ✅

### 2. ⚠️ Title pas optimisé SEO (manque le mot-clé principal)
**Actuel :** "Quantara — Track. Analyze. Grow." (33 chars)
**Proposé :** "Quantara — Journal de Trading PropFirm Futures" (47 chars) ou "Quantara — Tracker PropFirm pour Traders Futures" (49 chars)

Garde le tagline "Track. Analyze. Grow." pour la H1 et l'image OG, mais le title doit ranker sur "journal trading propfirm" + "tracker propfirm".

### 3. ⚠️ Hiérarchie H1 cassée (7 H1 détectés sur la landing)
WebFetch a remonté 7 balises H1. Une page = un seul H1. Probablement les balises de section sont misalignées (H1 au lieu de H2/H3). Vérifier `components/landing/*` et corriger en `<h2>` pour les sections.

### 4. ⚠️ Pas de page `/about` ni `/legal/privacy` ni `/legal/terms`
- E-E-A-T faible (qui édite ? Quantara Technologies LLC New Mexico → personne ne le sait depuis la landing)
- Mentions légales requises pour vendre en EU (RGPD)
- ChatGPT cite plus volontiers les sites avec page About claire

Crée :
- `app/about/page.js` — Qui on est, fondateur, mission, contact
- `app/legal/privacy/page.js`
- `app/legal/terms/page.js`
- `app/legal/cookies/page.js`

### 5. ⚠️ Pas de section blog/ressources
0 contenu indexable au-delà de la landing = 0 ranking long-tail possible. Marché propfirm = beaucoup de queries éducatives ("trailing drawdown explained", "topstep vs apex", "consistency rule") → opportunité énorme.

Crée `app/blog/[slug]/page.js` + 3 articles initiaux (voir briefs joints).

---

## DÉTAIL PAR CATÉGORIE

### Technical SEO (25/100)

| Critère | Status | Note |
|---|---|---|
| HTTPS enforced | ✅ Pass | Vercel auto-SSL |
| robots.txt valid | ❌ Fail | 404 |
| XML sitemap | ❌ Fail | 404 |
| Canonical tags | ❌ Fail | Aucun défini |
| Hreflang (multi-langue) | ❌ Fail | Site est FR/EN/ES mais aucune balise `hreflang` |
| Mobile responsive | ✅ Pass | Viewport configuré |
| Security headers (CSP, HSTS, X-Frame-Options) | ⚠️ Warn | Vercel default seulement |
| URL structure | ✅ Pass | Clean, pas de params |
| Crawl depth | ✅ Pass | 1 niveau (site = 1 page) |
| AI crawlers managed | ❌ Fail | Pas de directive (par défaut ouvert, mais non-stratégique) |

**Hreflang à ajouter** (quand version EN/ES sera live sur sous-routes) :
```js
alternates: {
  canonical: 'https://quantara.tech',
  languages: {
    'fr-FR': 'https://quantara.tech',
    'en-US': 'https://quantara.tech/en',
    'es-ES': 'https://quantara.tech/es',
  },
}
```

### Content Quality (20/100)

- ✅ Langage clair, sans jargon excessif
- ❌ Aucun signal E-E-A-T (pas d'auteur, pas de date, pas de bio, pas de credentials)
- ❌ Pas de contenu chiffré citable (zéro stat, zéro % d'amélioration claim, zéro étude)
- ❌ Pas de FAQ
- ❌ Pas de testimonials (mais beta donc OK pour l'instant)
- ⚠️ Word count landing : ~250 mots (faible — viser 800-1200 sur landing SaaS B2C)

### On-Page SEO (45/100)

- ✅ Title présent
- ⚠️ Title pas optimisé pour mot-clé cible
- ⚠️ Description sous le min (62 chars vs 130 min)
- ❌ Hiérarchie H1-H6 cassée (7 H1)
- ✅ URL clean (`/`)
- ❌ Aucun lien interne (1 page seulement)
- ⚠️ Alt text images : pas vérifiable depuis SSR (à check sur la version client)

### Schema / Structured Data (0/100)

Aucun JSON-LD. Aucun Microdata. Aucun RDFa. C'est le low-hanging fruit le plus impactant.

**Templates prêts à coller dans `app/page.js`** (voir section "Schema templates" en fin de doc).

### Performance — CWV (75/100 estimé)

Pas de données CrUX disponibles (site low-traffic). Estimation à partir du code :
- ✅ Next.js 14 + Vercel = SSR/SSG optimal
- ✅ Image Optimization de Next.js disponible (à utiliser pour le logo + screenshots)
- ⚠️ Cloudflare Turnstile chargé `afterInteractive` → ralentit LCP marginalement
- ⚠️ Framer Motion + Lenis + canvas particles = JS bundle lourd → INP potentiellement >200ms sur mobile bas de gamme
- ✅ Pas de mix-blend-mode (perf killer évité)
- ✅ Service Worker chargé async

**À mesurer une fois indexé** : `npx unlighthouse https://quantara.tech` pour Lighthouse complet.

### AI Search Readiness — GEO (15/100)

**Critique pour 2026.** 56% des sessions de recherche passent désormais par AI assistants (45 milliards de prompts/mois). Quantara n'est citable nulle part.

| Critère GEO | Status |
|---|---|
| Citability (134-167 word passages) | ❌ Fail — pas de blocs auto-suffisants |
| Structural readability (Q-based H2/H3, lists, tables) | ⚠️ Warn — quelques listes mais pas de FAQ structurée |
| Multi-modal content | ⚠️ Warn — screenshots OK mais pas de vidéo, pas d'infographie |
| Authority signals (auteur, dates, sources) | ❌ Fail — anonymat total |
| Technical access (SSR, robots AI, llms.txt) | ⚠️ Warn — SSR OK mais llms.txt absent |
| Brand presence (Wikipedia, Reddit, YouTube, LinkedIn) | ❌ Fail — entité inexistante hors site |

**Action plan GEO :**
1. Créer `/llms.txt` (voir Critical #5)
2. Ajouter pages Person schema pour le founder
3. Créer présence Reddit (`r/Trading`, `r/propfirms`, `r/Daytrading`, `r/algotrading`) — partager des analyses, pas de spam
4. Lancer YouTube channel "Quantara — PropFirm Insights" (le signal #1 corrélé citations AI : ~0.737)
5. Page Wikipedia "Quantara Technologies LLC" après 6-12 mois (notabilité construite)
6. Profil LinkedIn Company + posts hebdo founder

### Images (50/100)

- ✅ Logo `quantara-logo.png.png` présent (note : nom de fichier `.png.png` à corriger en `.png`)
- ✅ Firms logos `funded-futures-network.png`, `futureselites.png`
- ❌ Aucune image OpenGraph `/og-image.png` (1200×630)
- ❌ Pas d'icônes PWA `icon-192.png` `icon-512.png` (référencés dans manifest mais inexistants)
- ❌ Pas de favicon dédié (Next.js par défaut)
- ⚠️ Alt text non vérifiables sans inspection client

---

## SCHEMA TEMPLATES — À COLLER

À ajouter dans `app/page.js` (ou dans un composant `<JsonLd />` réutilisable) :

```jsx
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://quantara.tech/#org",
      "name": "Quantara Technologies LLC",
      "url": "https://quantara.tech",
      "logo": "https://quantara.tech/quantara-logo.png",
      "foundingDate": "2026",
      "founder": { "@type": "Person", "name": "[TON NOM]" },
      "address": { "@type": "PostalAddress", "addressRegion": "TX", "addressCountry": "US" },
      "contactPoint": { "@type": "ContactPoint", "email": "admin@quantara.tech", "contactType": "customer support" },
      "sameAs": [
        "https://x.com/quantara_tech",
        "https://www.linkedin.com/company/quantara/",
        "https://www.youtube.com/@quantara"
      ]
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://quantara.tech/#app",
      "name": "Quantara",
      "applicationCategory": "FinanceApplication",
      "applicationSubCategory": "Trading Journal",
      "operatingSystem": "Web",
      "url": "https://quantara.tech",
      "publisher": { "@id": "https://quantara.tech/#org" },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Beta gratuite"
      },
      "featureList": [
        "Suivi multi-comptes PropFirm",
        "Calcul trailing drawdown (EOD + intraday)",
        "Audit consistency rule en temps réel",
        "Tracking payouts et ROI",
        "Calendrier économique intégré",
        "Multi-langue FR/EN/ES"
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Quelles PropFirms sont supportées par Quantara ?",
          "acceptedAnswer": { "@type": "Answer", "text": "Quantara supporte 8+ PropFirms incluant Topstep, Apex Trader Funding, Lucid Trading, Funded Futures Network, et Futures Elites." }
        },
        {
          "@type": "Question",
          "name": "Quantara calcule-t-il le trailing drawdown automatiquement ?",
          "acceptedAnswer": { "@type": "Answer", "text": "Oui. Quantara calcule le trailing drawdown End-of-Day (Topstep, Tradeify) et Intraday (Apex évaluations) selon les règles propres à chaque PropFirm." }
        }
      ]
    }
  ]
}

return (
  <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    {/* reste de la landing */}
  </>
)
```

---

## ROADMAP PRIORITAIRE — ORDRE D'EXÉCUTION

| # | Tâche | Effort | Impact | Quand |
|---|---|---|---|---|
| 1 | Créer `app/robots.js` + `app/sitemap.js` | 15 min | 🔴 Critical | Jour 1 |
| 2 | Ajouter OG/Twitter/canonical/JSON-LD dans `layout.js` + `page.js` | 1h | 🔴 Critical | Jour 1 |
| 3 | Créer `public/og-image.png` (1200×630) | 30 min | 🔴 Critical | Jour 1 |
| 4 | Créer `public/llms.txt` | 10 min | 🔴 Critical | Jour 1 |
| 5 | Fix H1 cassé (7 → 1) | 30 min | 🟠 High | Jour 2 |
| 6 | Title + description optimisés | 5 min | 🟠 High | Jour 2 |
| 7 | Créer pages `/about`, `/legal/*` | 3h | 🟠 High | Semaine 1 |
| 8 | Setup Google Search Console + Bing Webmaster + IndexNow | 30 min | 🟠 High | Semaine 1 |
| 9 | Setup blog `/blog/[slug]` + publier 3 articles (briefs joints) | 2 jours | 🟡 Medium | Semaine 2-3 |
| 10 | Lancer présence Reddit + YouTube + LinkedIn | continu | 🟡 Medium | Semaine 4+ |

---

## SOURCES & RÉFÉRENCES

Données et compétiteurs identifiés via :
- [Best Trading Journal for Prop Firms 2026 — TradersSecondBrain](https://traderssecondbrain.com/guides/best-trading-journal-for-prop-firms)
- [TradesViz — Prop Firm Journal](https://www.tradesviz.com/prop-firm-journal/)
- [Tradezella — Prop Firm Trading Journal Guide](https://www.tradezella.com/blog/prop-firm-trading-journal)
- [PropJournal](https://propjournal.net)
- [PassTraq](https://www.passtraq.com/)
- [PropTally](https://proptally.app/)
- [JournalPlus — Topstep vs Apex](https://journalplus.co/compare/topstep-vs-apex-trader-funding/)
- [Trailing Drawdown Guide — PropFirmApp](https://propfirmapp.com/learn/trailing-drawdown)
- [Topstep Drawdown Rules](https://www.topstep.com/blog/prop-firm-drawdown-rules/)
- [ProTradingData — concurrent français](https://protradingdata.com/)
- [FocusPips — concurrent français](https://focuspips.com/)
- [AI Search Market Share 2026 — Sedestral](https://sedestral.com/en/blog/ai-search-market-share-2026)

Skill `seo-audit` v1.9.9 — AgriciDaniel/claude-seo (MIT)
