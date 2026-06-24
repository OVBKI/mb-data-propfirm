// /firms — Index page listing all 11 PropFirms with cards.
// Server component (static, ISR 1h) for SEO; client lazy-loaded for interactivity.

import FirmsIndexClient from './FirmsIndexClient'
import JsonLd, { ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from '../../components/JsonLd'
import { FIRM_SUGGESTIONS } from '../../lib/constants'
import { firmToSlug, FIRM_META } from '../../lib/firmSlugs'

export const revalidate = 3600

export const metadata = {
  title: 'PropFirm Reviews 2026 — Topstep, Apex, Lucid, MFFU & More | Quantara',
  description:
    'Comparatif complet des 11 PropFirms futures en 2026 : règles, drawdown (EOD vs trailing), profit split, payouts, prix. Toutes les data vérifiées mai 2026.',
  alternates: { canonical: 'https://quantara.tech/firms' },
  openGraph: {
    title: 'PropFirm Reviews 2026 — Toutes les firmes futures comparées',
    description:
      'Topstep, Apex, Bulenox, Lucid, Tradeify, TPT, MFFU, Phidias, FFN, FuturesELites, Alpha Futures — règles 2026 vérifiées.',
    url: 'https://quantara.tech/firms',
    type: 'website',
    images: ['/og-image.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PropFirm Reviews 2026',
    description: '11 PropFirms futures comparées, règles vérifiées mai 2026.',
  },
}

const ITEM_LIST_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'PropFirm Futures Reviews 2026',
  description: 'Liste des 11 PropFirms futures couvertes par Quantara.',
  numberOfItems: FIRM_SUGGESTIONS.length,
  itemListElement: FIRM_SUGGESTIONS.map((name, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `https://quantara.tech/firms/${firmToSlug(name)}`,
    name,
  })),
}

const BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Quantara', item: 'https://quantara.tech' },
    { '@type': 'ListItem', position: 2, name: 'PropFirms', item: 'https://quantara.tech/firms' },
  ],
}

export default function Page() {
  return (
    <>
      <JsonLd data={ITEM_LIST_SCHEMA} />
      <JsonLd data={BREADCRUMB_SCHEMA} />
      <JsonLd data={ORGANIZATION_SCHEMA} />
      <JsonLd data={WEBSITE_SCHEMA} />
      <FirmsIndexClient />
    </>
  )
}
