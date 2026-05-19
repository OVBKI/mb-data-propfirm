// lib/i18n.js — Dictionnaire i18n FR/EN pour la landing Quantara.
//
// USAGE :
//   import { useT, LanguageProvider } from '@/components/LanguageProvider'
//   const t = useT()
//   <h1>{t('hero.title')}</h1>
//
// PHILOSOPHIE :
//   - Clés hiérarchiques en dot-notation : "section.subkey"
//   - Fallback automatique sur FR si une clé EN manque (pas de "missing translation")
//   - Aucun re-render serveur — toute la traduction est client-side
//   - Persistance localStorage + auto-détection navigateur au premier visit
//
// SCOPE v1 (mai 2026) :
//   ✅ Top bar landing (login, démarrer)
//   ✅ Hero (CTAs, scroll hint)
//   ✅ 6 ProductSections (labels, titles, subtitles)
//   ✅ FlipFeatureCards (3 features)
//   ✅ EnhancedSteps (3 steps)
//   ✅ AnimatedStats (4 stats)
//   ✅ MeshGradientFooter (4 colonnes nav + disclaimer)
//   ❌ Mockups internes (DashboardMockup, etc.) — restent FR en v1, traduits en v2
//   ❌ /pricing, /docs, /legal, /app — restent FR, traduits en v2/v3

export const SUPPORTED_LOCALES = ['fr', 'en']
export const DEFAULT_LOCALE = 'fr'

// ============================================================================
// FR — Source de vérité
// ============================================================================
const FR = {
  // === Top bar ===
  nav: {
    login: 'Se connecter',
    start: 'Démarrer',
    startArrow: '→',
  },

  // === Hero ===
  hero: {
    ctaPrimary: 'Démarrer gratuitement',
    ctaSecondary: 'Voir les features',
    scrollHint: '↓ Scroll',
    tagline: 'Track. Analyze. Grow.',
    subtitle: 'Le journal de trading pensé pour les traders PropFirm futures. Drawdown trailing, profit split, payouts — tout est tracké automatiquement.',
  },

  // === 6 ProductSections ===
  sections: {
    dashboard: {
      label: 'TABLEAU DE BORD',
      title: "Tous tes comptes PropFirm en un coup d'œil.",
      subtitle: 'Balance, drawdown, consistency, status. Sur 8+ PropFirms. Mis à jour en temps réel.',
    },
    analytics: {
      label: 'ANALYTICS',
      title: "L'évolution de tes dépenses, payouts et net cumulés.",
      subtitle: 'Courbe cumulée 12 mois + bilan annuel + perf mensuelle. Tu vois en un seul écran si tu es rentable, et depuis quand.',
    },
    journal: {
      label: 'JOURNAL DE TRADING',
      title: 'Chaque trade. Tracké. Filtré. Analysé.',
      subtitle: 'Date, instrument, side, PnL, notes. Filtre par firm, par date, par instrument. Export CSV à tout moment.',
    },
    calendar: {
      label: 'CALENDRIER ÉCONOMIQUE',
      title: 'Anticipe les news macro qui bougent les futures.',
      subtitle: 'NFP, FOMC, CPI, jobless claims, Powell speeches. Impact code couleur. Filtre par devise et sévérité. Source ForexFactory en live.',
    },
    equity: {
      label: 'EQUITY CURVE & DRAWDOWN LIVE',
      title: 'Vois ton compte vivre — balance + DD trailing en temps réel.',
      subtitle: 'Chaque compte a sa courbe avec la ligne de DD trailing (static, EOD ou intraday selon la firme). Tu sais exactement combien il te reste avant de sauter.',
    },
  },

  // === AnimatedStats — 4 chiffres ===
  stats: {
    propfirms: { value: '10+', label: 'PropFirms supportées' },
    accounts:  { value: '∞',   label: 'Comptes & trades' },
    langs:     { value: '3',   label: 'Langues (FR/EN/ES)' },
    privacy:   { value: '100%', label: 'Tes données t\'appartiennent' },
  },

  // === FlipFeatureCards — 6 features cards ===
  features: {
    eyebrow: '✨ Features',
    heading: 'Tout ce dont tu as besoin. Rien de superflu.',
    subheading: 'Conçu par et pour les traders PropFirm. Chaque feature résout un problème réel.',
    multipropfirms: {
      title: 'Suivi multi-PropFirms',
      desc: 'Topstep, Apex, Bulenox, Lucid, Tradeify, MFFU, Phidias, TPT et plus. Règles drawdown / profit split / payout target pré-remplies pour 10+ firmes.',
    },
    journal: {
      title: 'Journal de trading complet',
      desc: 'PnL, prix entry/exit, instrument, side, screenshot. Calendrier mensuel coloré vert/rouge. Filtres par compte, par PropFirm, par période.',
    },
    equity: {
      title: 'Equity curve & drawdown live',
      desc: 'Visualise l\'évolution de chaque compte. Ligne de DD intelligent : Static, EOD (End of Day) ou Trailing intraday selon les règles de ta firme.',
    },
    payouts: {
      title: 'Payouts & cash flow',
      desc: 'Suis chaque payout reçu, calcule ton ROI réel, vois ton bilan net (payouts − dépenses). Recap email automatique chaque 1er du mois.',
    },
    notifications: {
      title: 'Notifications intelligentes',
      desc: 'Push browser 2 jours avant chaque prélèvement mensuel. Alerts in-app pour payout dispo, challenges trop longs, ROI excellent. Plus jamais de surprise.',
    },
    calendar: {
      title: 'Calendrier économique intégré',
      desc: 'NFP, FOMC, CPI, jobless claims — les news macro à fort impact sur futures. Filtre par devise & sévérité. Évite de trader pendant les pièges.',
    },
  },

  // === EnhancedSteps — 3 étapes onboarding ===
  steps: {
    eyebrow: '🚀 Comment ça marche',
    heading: 'Trois étapes. Pas plus.',
    subheading: '5 minutes max entre l\'inscription et ton premier trade tracké.',
    step1: {
      title: 'Crée ton compte',
      desc: 'Inscription en 30 secondes. Aucune carte bancaire. L\'outil reste gratuit pendant la beta.',
    },
    step2: {
      title: 'Configure tes PropFirms',
      desc: 'Tape "Topstep", choisis ton plan. Les règles drawdown, profit split et payout target sont déjà pré-remplies.',
    },
    step3: {
      title: 'Trade & analyse',
      desc: 'Logge tes trades, vois ta courbe en temps réel, reçois des alertes proactives, optimise ta consistency.',
    },
  },

  // === Final CTA ===
  finalCTA: {
    titleStart: 'Prêt à ',
    titleHighlight: 'tracker comme un pro',
    titleEnd: ' ?',
    subtitle: 'Inscription gratuite. Pas de carte bancaire. Configure ta 1ère PropFirm en 90 secondes.',
    button: 'Démarrer maintenant',
    trustLine: '🔒 Tes données t\'appartiennent · 🇺🇸 Quantara LLC Texas · 🛡 RGPD compliant',
  },

  // === MeshGradientFooter ===
  footer: {
    tagline: 'Le journal de trading pensé pour les traders PropFirm futures.',
    sections: {
      product:  'Produit',
      resources: 'Ressources',
      legal:    'Légal',
      company:  'Société',
    },
    links: {
      features:      'Fonctionnalités',
      dashboard:     'Tableau de bord',
      calendar:      'Calendrier économique',
      pricing:       'Tarifs',
      docs:          'Documentation',
      integrations:  'PropFirms supportées',
      security:      'Sécurité',
      faq:           'FAQ',
      cgu:           'CGU',
      privacy:       'Confidentialité',
      cookies:       'Cookies',
      imprint:       'Mentions légales',
      about:         'À propos',
      contact:       'Contact',
      reportSec:     'Sécurité (signaler)',
      discord:       'Discord',
      status:        'Statut système',
    },
    badges: {
      soon: 'Bientôt',
    },
    bottom: {
      copyright: 'Quantara LLC — Track. Analyze. Grow.',
      texas:     'A Texas limited liability company.',
      eu:        'Hébergé en EU',
      allOk:     'Tous les services opérationnels',
    },
    disclaimer: {
      title: '⚠️ Avertissement :',
      body: "Quantara est un outil de journalisation et d'analyse. Il ne fournit pas de conseil financier ni d'investissement. Le trading de futures comporte des risques substantiels et n'est pas adapté à tous les investisseurs. Les performances passées ne préjugent pas des résultats futurs.",
    },
  },

  // === Language switcher ===
  switcher: {
    fr: 'Français',
    en: 'English',
    label: 'Langue',
  },
}

// ============================================================================
// EN — Traduction
// ============================================================================
const EN = {
  nav: {
    login: 'Sign in',
    start: 'Get started',
    startArrow: '→',
  },

  hero: {
    ctaPrimary: 'Start free',
    ctaSecondary: 'See features',
    scrollHint: '↓ Scroll',
    tagline: 'Track. Analyze. Grow.',
    subtitle: 'The trading journal built for PropFirm futures traders. Trailing drawdown, profit split, payouts — everything tracked automatically.',
  },

  sections: {
    dashboard: {
      label: 'DASHBOARD',
      title: 'All your PropFirm accounts at a glance.',
      subtitle: 'Balance, drawdown, consistency, status. Across 8+ PropFirms. Updated in real time.',
    },
    analytics: {
      label: 'ANALYTICS',
      title: 'See your spend, payouts and net evolve over time.',
      subtitle: '12-month cumulative curve + yearly summary + monthly performance. Know in a single screen if you\'re profitable, and since when.',
    },
    journal: {
      label: 'TRADING JOURNAL',
      title: 'Every trade. Tracked. Filtered. Analyzed.',
      subtitle: 'Date, instrument, side, PnL, notes. Filter by firm, date or instrument. CSV export anytime.',
    },
    calendar: {
      label: 'ECONOMIC CALENDAR',
      title: 'Anticipate the macro news that move futures.',
      subtitle: 'NFP, FOMC, CPI, jobless claims, Powell speeches. Color-coded impact. Filter by currency and severity. Live ForexFactory source.',
    },
    equity: {
      label: 'EQUITY CURVE & LIVE DRAWDOWN',
      title: 'Watch your account live — balance + trailing DD in real time.',
      subtitle: 'Each account has its curve with the trailing DD line (static, EOD or intraday per firm rules). Know exactly how much room you have before blowing up.',
    },
  },

  stats: {
    propfirms: { value: '10+', label: 'Supported PropFirms' },
    accounts:  { value: '∞',   label: 'Accounts & trades' },
    langs:     { value: '3',   label: 'Languages (FR/EN/ES)' },
    privacy:   { value: '100%', label: 'You own your data' },
  },

  features: {
    eyebrow: '✨ Features',
    heading: 'Everything you need. Nothing you don\'t.',
    subheading: 'Built by and for PropFirm traders. Every feature solves a real problem.',
    multipropfirms: {
      title: 'Multi-PropFirm tracking',
      desc: 'Topstep, Apex, Bulenox, Lucid, Tradeify, MFFU, Phidias, TPT and more. Drawdown / profit split / payout target rules pre-filled for 10+ firms.',
    },
    journal: {
      title: 'Complete trading journal',
      desc: 'PnL, entry/exit prices, instrument, side, screenshot. Monthly calendar colored green/red. Filter by account, PropFirm, period.',
    },
    equity: {
      title: 'Equity curve & live drawdown',
      desc: 'Watch each account evolve. Smart DD line: Static, EOD (End of Day) or Trailing intraday per your firm\'s rules.',
    },
    payouts: {
      title: 'Payouts & cash flow',
      desc: 'Track each payout received, compute your real ROI, see your net balance (payouts − spend). Automatic email recap on the 1st of each month.',
    },
    notifications: {
      title: 'Smart notifications',
      desc: 'Browser push 2 days before each monthly billing. In-app alerts for available payout, challenges running too long, excellent ROI. No more surprises.',
    },
    calendar: {
      title: 'Built-in economic calendar',
      desc: 'NFP, FOMC, CPI, jobless claims — high-impact macro news on futures. Filter by currency & severity. Avoid trading during traps.',
    },
  },

  steps: {
    eyebrow: '🚀 How it works',
    heading: 'Three steps. That\'s it.',
    subheading: '5 minutes max between signup and your first tracked trade.',
    step1: {
      title: 'Create your account',
      desc: 'Sign up in 30 seconds. No credit card. The tool stays free during beta.',
    },
    step2: {
      title: 'Set up your PropFirms',
      desc: 'Type "Topstep", pick your plan. The drawdown, profit split and payout target rules are already pre-filled.',
    },
    step3: {
      title: 'Trade & analyze',
      desc: 'Log your trades, watch your curve in real time, get proactive alerts, optimize your consistency.',
    },
  },

  finalCTA: {
    titleStart: 'Ready to ',
    titleHighlight: 'track like a pro',
    titleEnd: '?',
    subtitle: 'Free signup. No credit card. Set up your first PropFirm in 90 seconds.',
    button: 'Get started now',
    trustLine: '🔒 You own your data · 🇺🇸 Quantara LLC Texas · 🛡 GDPR compliant',
  },

  footer: {
    tagline: 'The trading journal built for PropFirm futures traders.',
    sections: {
      product:  'Product',
      resources: 'Resources',
      legal:    'Legal',
      company:  'Company',
    },
    links: {
      features:      'Features',
      dashboard:     'Dashboard',
      calendar:      'Economic calendar',
      pricing:       'Pricing',
      docs:          'Documentation',
      integrations:  'Supported PropFirms',
      security:      'Security',
      faq:           'FAQ',
      cgu:           'Terms of service',
      privacy:       'Privacy',
      cookies:       'Cookies',
      imprint:       'Legal notice',
      about:         'About',
      contact:       'Contact',
      reportSec:     'Report security issue',
      discord:       'Discord',
      status:        'System status',
    },
    badges: {
      soon: 'Soon',
    },
    bottom: {
      copyright: 'Quantara LLC — Track. Analyze. Grow.',
      texas:     'A Texas limited liability company.',
      eu:        'Hosted in EU',
      allOk:     'All services operational',
    },
    disclaimer: {
      title: '⚠️ Disclaimer:',
      body: "Quantara is a journaling and analytics tool. It does not provide financial or investment advice. Trading futures involves substantial risk and is not suitable for all investors. Past performance does not guarantee future results.",
    },
  },

  switcher: {
    fr: 'Français',
    en: 'English',
    label: 'Language',
  },
}

// ============================================================================
// Map des dictionnaires par locale
// ============================================================================
export const TRANSLATIONS = { fr: FR, en: EN }

// ============================================================================
// Helpers
// ============================================================================

// Résout une clé dot-notation dans un objet imbriqué.
// "hero.ctaPrimary" → dict.hero.ctaPrimary
function resolve(dict, key) {
  if (!key || !dict) return undefined
  const parts = key.split('.')
  let cur = dict
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = cur[p]
    } else {
      return undefined
    }
  }
  return cur
}

// translate(key, locale) → string ou objet (pour les clés racines tableau/objet)
// Fallback : si la clé n'existe pas en EN, on tombe sur FR. Si même pas en FR, on
// retourne la clé brute (pour repérer visuellement les translations manquantes).
export function translate(key, locale = DEFAULT_LOCALE) {
  const dict = TRANSLATIONS[locale] || TRANSLATIONS[DEFAULT_LOCALE]
  const v = resolve(dict, key)
  if (v !== undefined) return v
  // Fallback FR
  const fr = resolve(TRANSLATIONS[DEFAULT_LOCALE], key)
  if (fr !== undefined) return fr
  // Pas trouvé — retourne la clé brute pour debug
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[i18n] missing key:', key, 'in locale:', locale)
  }
  return key
}

// Détecte la langue préférée de l'utilisateur (au premier visit)
// Ordre de priorité :
//   1. localStorage 'quantara_lang' (choix explicite préservé)
//   2. navigator.language ('en-*' → 'en', sinon 'fr')
//   3. Default 'fr'
export function getInitialLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  try {
    const stored = localStorage.getItem('quantara_lang')
    if (stored && SUPPORTED_LOCALES.includes(stored)) return stored
  } catch {}
  const browser = (navigator.language || navigator.userLanguage || '').toLowerCase()
  if (browser.startsWith('en')) return 'en'
  return DEFAULT_LOCALE
}

// Persiste le choix de locale
export function persistLocale(locale) {
  if (typeof window === 'undefined') return
  if (!SUPPORTED_LOCALES.includes(locale)) return
  try {
    localStorage.setItem('quantara_lang', locale)
  } catch {}
}
