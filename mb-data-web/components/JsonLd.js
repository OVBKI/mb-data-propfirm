// Composant JSON-LD réutilisable pour Schema.org markup.
// Usage : <JsonLd data={mySchema} /> dans n'importe quelle page.
//
// IMPORTANT : Schema.org structured data nourrit :
//  - Google rich results (étoiles, breadcrumb, FAQ accordion)
//  - AI citations (ChatGPT, Claude, Perplexity adorent les data structurées)
//  - Knowledge Graph entries
//
// Les schemas exportés ci-dessous sont prêts à l'emploi pour Quantara.

export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
    />
  )
}

// ============================================================================
// SCHEMAS PRÉ-CONFIGURÉS POUR QUANTARA
// ============================================================================

const SITE = 'https://quantara.tech'

// Organization — décrit Quantara LLC comme entité business.
// Apparaît dans le Knowledge Panel Google si entité reconnue.
export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE}/#org`,
  name: 'Quantara LLC',
  alternateName: 'Quantara',
  url: SITE,
  logo: `${SITE}/quantara-logo.webp`,
  description: 'Éditeur de Quantara, le journal de trading SaaS pour traders PropFirm futures.',
  foundingDate: '2026',
  address: {
    '@type': 'PostalAddress',
    addressRegion: 'TX',
    addressCountry: 'US',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'admin@quantara.tech',
    contactType: 'customer support',
    availableLanguage: ['French', 'English', 'Spanish'],
  },
  // sameAs : à compléter au fur et à mesure que les profils sociaux sont créés
  sameAs: [
    // 'https://x.com/quantara_tech',
    // 'https://www.linkedin.com/company/quantara/',
    // 'https://www.youtube.com/@quantara',
  ],
}

// WebSite — permet le sitelinks searchbox Google
export const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  url: SITE,
  name: 'Quantara',
  description: 'Journal de trading PropFirm futures',
  publisher: { '@id': `${SITE}/#org` },
  inLanguage: 'fr-FR',
}

// SoftwareApplication — décrit le produit Quantara comme app.
// Active rich result "Software" sur Google Search.
export const SOFTWARE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${SITE}/#app`,
  name: 'Quantara',
  description: 'Journal de trading pour traders PropFirm futures : suivi multi-comptes, trailing drawdown automatique, consistency rule, payouts et ROI.',
  applicationCategory: 'FinanceApplication',
  applicationSubCategory: 'Trading Journal',
  operatingSystem: 'Web, iOS Safari, Android Chrome',
  url: SITE,
  image: `${SITE}/og-image.webp`,
  publisher: { '@id': `${SITE}/#org` },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    description: 'Beta gratuite — aucune carte bancaire requise',
  },
  featureList: [
    'Suivi multi-comptes PropFirm (8+ firmes supportées)',
    'Calcul automatique du trailing drawdown (End-of-Day et Intraday)',
    'Audit consistency rule en temps réel',
    'Journal de trades manuel détaillé',
    'Calendrier économique intégré (FR/EN/ES)',
    'Tracking payouts et ROI par PropFirm',
    'Multi-langue : Français, Anglais, Espagnol',
    'Mobile-friendly (PWA)',
  ],
  // À activer quand on aura des reviews authentiques (sinon = pénalité Google)
  // aggregateRating: {
  //   '@type': 'AggregateRating',
  //   ratingValue: '4.8',
  //   reviewCount: '42',
  // },
}

// FAQPage — chaque Q&A devient un rich result + très bien cité par AI.
// Compose les questions importantes de la landing en FAQ structurée.
export const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Quelles PropFirms sont supportées par Quantara ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Quantara supporte plus de 8 PropFirms futures incluant Topstep, Apex Trader Funding, Lucid Trading, Bulenox, Tradeify, MyFundedFutures (MFFU), Phidias et Take Profit Trader (TPT). Les règles spécifiques de drawdown et de consistency de chaque PropFirm sont pré-configurées.",
      },
    },
    {
      '@type': 'Question',
      name: 'Quantara calcule-t-il le trailing drawdown automatiquement ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui. Quantara calcule automatiquement le trailing drawdown selon les règles spécifiques de chaque PropFirm : End-of-Day pour Topstep et Tradeify, Intraday ou EOD au choix pour Apex Trader Funding (selon le type de compte). La courbe de drawdown trailing est visualisée en temps réel et se fige au balance initial quand applicable.",
      },
    },
    {
      '@type': 'Question',
      name: "Combien coûte Quantara ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Quantara est actuellement en beta gratuite. Aucune carte bancaire n'est requise pour l'inscription. Tous les utilisateurs beta auront un accès privilégié aux futures versions payantes.",
      },
    },
    {
      '@type': 'Question',
      name: 'Quantara est-il disponible en français ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui. Quantara est disponible en trois langues : Français, Anglais et Espagnol. Le calendrier économique est également traduit dans ces trois langues.",
      },
    },
    {
      '@type': 'Question',
      name: 'Que veut dire la consistency rule des PropFirms ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "La consistency rule mesure la régularité de tes gains : c'est le ratio entre ton meilleur jour de gains et le total de tes gains. La plupart des PropFirms exigent ce ratio sous 30% à 40% pour valider un payout. Quantara calcule automatiquement ce ratio pour chacun de tes comptes.",
      },
    },
  ],
}

// Schema combiné — usage principal sur la landing
export const LANDING_SCHEMAS = [
  ORGANIZATION_SCHEMA,
  WEBSITE_SCHEMA,
  SOFTWARE_SCHEMA,
  FAQ_SCHEMA,
]
