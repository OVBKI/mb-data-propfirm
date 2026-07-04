// /cfd — Index page listing the 9 CFD / forex PropFirms (comparison table + cards).
// Server component (static, ISR 1h) for SEO; client child does the visuals.
// Mirrors the futures /firms pattern (lib/cfdConstants.js + lib/cfdSlugs.js).

import CfdIndexClient from './CfdIndexClient'
import JsonLd from '../../components/JsonLd'
import { getAllCfdSlugs, cfdSlugToFirm } from '../../lib/cfdSlugs'

export const revalidate = 3600

export const metadata = {
  title: 'PropFirms CFD / Forex 2026 — FTMO, FundedNext, The5ers… | Quantara',
  description:
    'Comparatif des 9 PropFirms CFD / forex en 2026 : règles, daily loss, max loss (statique vs trailing), profit split, payouts, plateformes. Data vérifiées juin 2026.',
  alternates: { canonical: 'https://quantara.tech/cfd' },
  openGraph: {
    title: 'PropFirms CFD / Forex 2026 — comparatif complet',
    description:
      'FTMO, FundedNext, The5ers, E8 Markets, FundingPips, Alpha Capital, Funded Trading Plus, Blueberry, The Funded Trader — règles 2026 vérifiées.',
    url: 'https://quantara.tech/cfd',
    type: 'website',
    images: ['/og-image.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PropFirms CFD / Forex 2026',
    description: '9 PropFirms CFD comparées, règles vérifiées juin 2026.',
  },
}

const SLUGS = getAllCfdSlugs()

const ITEM_LIST_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'PropFirms CFD / Forex 2026',
  description: 'Liste des 9 PropFirms CFD / forex couvertes par Quantara.',
  numberOfItems: SLUGS.length,
  itemListElement: SLUGS.map((slug, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `https://quantara.tech/cfd/${slug}`,
    name: cfdSlugToFirm(slug),
  })),
}

const BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://quantara.tech' },
    { '@type': 'ListItem', position: 2, name: 'PropFirms CFD', item: 'https://quantara.tech/cfd' },
  ],
}

export default function Page() {
  return (
    <>
      {/* Organization + WebSite sont déjà émis globalement par le root layout — pas de doublon ici. */}
      <JsonLd data={ITEM_LIST_SCHEMA} />
      <JsonLd data={BREADCRUMB_SCHEMA} />
      <CfdIndexClient />
    </>
  )
}
