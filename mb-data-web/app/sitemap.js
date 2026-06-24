// Sitemap.xml généré dynamiquement par Next.js App Router.
// Servi automatiquement à https://quantara.tech/sitemap.xml
// À updater à chaque nouvelle page indexable ajoutée.

import { getAllFirmSlugs, getAllFirmPairs } from '../lib/firmSlugs'
import { getAllGuideSlugs, GUIDES } from '../lib/guides'
import { getAllCfdSlugs } from '../lib/cfdSlugs'

const BASE_URL = 'https://quantara.tech'

// Date de dernière vérification du contenu (firmes/guides/légal « vérifié mai 2026 »).
// On l'utilise comme lastModified stable plutôt que `new Date()` au build : sinon chaque
// redéploiement fait bouger toutes les dates sans réelle modif de contenu, ce que Google
// interprète comme du bruit et qui dilue le signal de fraîcheur des pages réellement mises à jour.
const CONTENT_DATE = new Date('2026-05-01T00:00:00Z')

export default function sitemap() {
  const now = CONTENT_DATE

  // Programmatic SEO : 1 index /firms + 11 pages /firms/[slug] générées depuis PROPFIRM_RULES
  const firmPages = [
    {
      url: `${BASE_URL}/firms`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...getAllFirmSlugs().map((slug) => ({
      url: `${BASE_URL}/firms/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    })),
  ]

  // Phase 3.2 : 55 pages /compare/[firmA]-vs-[firmB] générées depuis toutes les paires (11 choose 2)
  const compareFirmPages = getAllFirmPairs().map(({ slug }) => ({
    url: `${BASE_URL}/compare/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.75,
  }))

  // Phase 3.3 : 1 index /guides + N pages /guides/[slug] éducatives
  const guidePages = [
    {
      url: `${BASE_URL}/guides`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    ...getAllGuideSlugs().map((slug) => ({
      url: `${BASE_URL}/guides/${slug}`,
      lastModified: GUIDES[slug]?.updatedDate ? new Date(GUIDES[slug].updatedDate) : CONTENT_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
  ]

  // CFD / forex vertical : 1 index /cfd + 9 pages /cfd/[slug] depuis CFD_PROPFIRM_RULES
  const cfdPages = [
    {
      url: `${BASE_URL}/cfd`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    ...getAllCfdSlugs().map((slug) => ({
      url: `${BASE_URL}/cfd/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
  ]

  return [
    ...firmPages,
    ...compareFirmPages,
    ...guidePages,
    ...cfdPages,
    // Landing — priorité max, change quand on update marketing
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },

    // Pages produit / institutionnelles
    {
      url: `${BASE_URL}/security`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/docs`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/integrations`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    // Demo (Ghost Mode, no login)
    {
      url: `${BASE_URL}/demo`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // Comparateur PropFirm (public, no login)
    {
      url: `${BASE_URL}/compare`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },

    // Comparison pages
    {
      url: `${BASE_URL}/compare/quantara-vs-tradervue`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/compare/quantara-vs-excel`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // Tools
    {
      url: `${BASE_URL}/tools/drawdown-simulator`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // Pages légales — utile pour trust mais priorité basse
    {
      url: `${BASE_URL}/legal/cgu`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/legal/imprint`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },

    // À ajouter au fur et à mesure de la roadmap SEO :
    // - /about
    // - /guides/trailing-drawdown, /guides/consistency-rule, etc.
    // - /compare/topstep-vs-apex, etc. (firm-vs-firm)
    // - /blog/[slug]
    // - /tools/trailing-drawdown-calculator, etc.
  ]
}
