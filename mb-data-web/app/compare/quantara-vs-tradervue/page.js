import ComparisonClient from './ComparisonClient'
import JsonLd, { ORGANIZATION_SCHEMA } from '../../../components/JsonLd'

export const metadata = {
  title: 'Quantara vs Tradervue — Best Trading Journal for PropFirm Traders?',
  description:
    'Detailed comparison: Quantara vs Tradervue for PropFirm futures traders. Trailing drawdown tracking, profit split, payout monitoring, PropFirm rules — see which journal fits your needs.',
  alternates: { canonical: 'https://quantara.tech/compare/quantara-vs-tradervue' },
  openGraph: {
    title: 'Quantara vs Tradervue — PropFirm Journal Comparison',
    description: 'Which trading journal is best for PropFirm futures traders? Side-by-side comparison of features, pricing, and PropFirm support.',
    url: 'https://quantara.tech/compare/quantara-vs-tradervue',
  },
}

const COMPARISON_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Quantara vs Tradervue — PropFirm Trading Journal Comparison',
  url: 'https://quantara.tech/compare/quantara-vs-tradervue',
  description: 'Comparison of Quantara and Tradervue for PropFirm futures trading journals.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://quantara.tech' },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://quantara.tech/compare' },
      { '@type': 'ListItem', position: 3, name: 'Quantara vs Tradervue', item: 'https://quantara.tech/compare/quantara-vs-tradervue' },
    ],
  },
}

export default function Page() {
  return (
    <>
      <JsonLd data={COMPARISON_SCHEMA} />
      <JsonLd data={ORGANIZATION_SCHEMA} />
      <ComparisonClient />
    </>
  )
}
