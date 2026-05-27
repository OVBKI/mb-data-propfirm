import ComparisonClient from './ComparisonClient'
import JsonLd, { ORGANIZATION_SCHEMA } from '../../../components/JsonLd'

export const metadata = {
  title: 'Quantara vs Excel — Stop Tracking PropFirm Accounts in Spreadsheets',
  description:
    'Why a spreadsheet can\'t replace a PropFirm tracking tool. Quantara vs Excel/Google Sheets: trailing drawdown, consistency rule, payout tracking — all automatic.',
  alternates: { canonical: 'https://quantara.tech/compare/quantara-vs-excel' },
  openGraph: {
    title: 'Quantara vs Excel — PropFirm Tracking Comparison',
    description: 'Stop tracking your PropFirm accounts in spreadsheets. See why traders switch to Quantara.',
    url: 'https://quantara.tech/compare/quantara-vs-excel',
  },
}

const COMPARISON_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Quantara vs Excel — PropFirm Tracking Comparison',
  url: 'https://quantara.tech/compare/quantara-vs-excel',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://quantara.tech' },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://quantara.tech/compare' },
      { '@type': 'ListItem', position: 3, name: 'Quantara vs Excel', item: 'https://quantara.tech/compare/quantara-vs-excel' },
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
