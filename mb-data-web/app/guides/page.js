// /guides — Index of educational PropFirm guides.
// Server component, static generation with ISR (1h revalidate).

import GuidesIndexClient from './GuidesIndexClient'
import JsonLd, { ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from '../../components/JsonLd'
import { getGuidesOrdered, GUIDE_ORDER } from '../../lib/guides'

export const revalidate = 3600

export const metadata = {
  title: 'Guides PropFirm 2026 — Trailing Drawdown, Consistency, Payouts | Quantara',
  description:
    'Guides éducatifs PropFirm futures 2026 : trailing drawdown, EOD vs intraday, consistency rule, comment passer Topstep, méthodes de payout. Vérifié mai 2026.',
  alternates: { canonical: 'https://quantara.tech/guides' },
  openGraph: {
    title: 'Guides PropFirm — Quantara',
    description:
      'Trailing drawdown, consistency rule, payout methods : tous les guides éducatifs pour traders PropFirm futures.',
    url: 'https://quantara.tech/guides',
    type: 'website',
    images: ['/og-image.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guides PropFirm 2026 — Quantara',
    description: 'Guides éducatifs PropFirm futures vérifiés mai 2026.',
  },
}

const guides = getGuidesOrdered()

const ITEM_LIST_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Guides PropFirm Quantara',
  description: 'Guides éducatifs pour traders PropFirm futures.',
  numberOfItems: GUIDE_ORDER.length,
  itemListElement: guides.map((g, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `https://quantara.tech/guides/${g.slug}`,
    name: g.title,
  })),
}

const BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Quantara', item: 'https://quantara.tech' },
    { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://quantara.tech/guides' },
  ],
}

export default function Page() {
  return (
    <>
      <JsonLd data={ITEM_LIST_SCHEMA} />
      <JsonLd data={BREADCRUMB_SCHEMA} />
      <JsonLd data={ORGANIZATION_SCHEMA} />
      <JsonLd data={WEBSITE_SCHEMA} />
      <GuidesIndexClient />
    </>
  )
}
