import CompareClient from './CompareClient'
import JsonLd from '../../components/JsonLd'
import { ORGANIZATION_SCHEMA } from '../../components/JsonLd'

export const revalidate = 3600 // ISR: revalidate every hour

export const metadata = {
  title: 'Compare PropFirm Rules — Topstep, Apex, Lucid, MFFU & More | Quantara',
  description:
    'Compare 10+ PropFirm futures rules side-by-side: trailing drawdown (EOD vs intraday), profit split, payout speed, consistency rules, and pricing. Free, no login required.',
  alternates: {
    canonical: 'https://quantara.tech/compare',
  },
  openGraph: {
    title: 'Compare PropFirm Rules — Quantara',
    description:
      'Side-by-side comparison of Topstep, Apex Trader Funding, Lucid, MFFU, Tradeify, Bulenox and more. Drawdown types, profit split, payout speed — all verified.',
    url: 'https://quantara.tech/compare',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare PropFirm Rules — Quantara',
    description:
      'Side-by-side comparison of 10+ PropFirm futures rules. Trailing drawdown, profit split, payout speed — all in one place.',
  },
}

const COMPARE_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is trailing drawdown in PropFirm trading?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Trailing drawdown is the maximum allowed loss that follows your account\'s peak balance. When your balance increases, the drawdown floor rises with it. There are two types: End-of-Day (EOD) trailing, which only updates at market close (used by Topstep, Tradeify), and Intraday trailing, which updates tick-by-tick during the session (used by Apex, Lucid). EOD trailing is generally more forgiving for active traders.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which PropFirm has the best profit split?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Several PropFirms offer up to 100% profit split, including Topstep, Apex Trader Funding, and Bulenox. However, the split often starts lower (80-90%) and increases based on account tenure or payout milestones. Quantara tracks your effective split for each account automatically.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the consistency rule in PropFirm accounts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The consistency rule requires that no single trading day\'s profit exceeds a certain percentage (typically 30-40%) of your total profits. This ensures traders are consistently profitable rather than relying on a single lucky trade. Not all PropFirms enforce this rule — Topstep and Apex do not, while firms like Bulenox and MFFU do.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I choose the right PropFirm?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Key factors to compare: (1) Drawdown type — EOD is more forgiving than intraday, (2) Profit split — look at the maximum achievable split, (3) Pricing — one-time fee vs monthly subscription, (4) Payout speed — some firms pay within 24h, others take 7-14 days, (5) Consistency rule — firms without it give more flexibility. Use Quantara\'s free comparator to see all rules side-by-side.',
      },
    },
  ],
}

const COMPARE_WEBPAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://quantara.tech/compare',
  url: 'https://quantara.tech/compare',
  name: 'Compare PropFirm Rules — Quantara',
  description: 'Side-by-side comparison of 10+ PropFirm futures rules: drawdown, profit split, payout speed, consistency rules.',
  isPartOf: { '@id': 'https://quantara.tech/#website' },
  about: {
    '@type': 'Thing',
    name: 'PropFirm comparison',
    description: 'Comparison of proprietary trading firm rules for futures traders',
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://quantara.tech' },
      { '@type': 'ListItem', position: 2, name: 'Compare PropFirms', item: 'https://quantara.tech/compare' },
    ],
  },
}

export default function ComparePage() {
  return (
    <>
      <JsonLd data={COMPARE_FAQ_SCHEMA} />
      <JsonLd data={COMPARE_WEBPAGE_SCHEMA} />
      <JsonLd data={ORGANIZATION_SCHEMA} />
      <CompareClient />
    </>
  )
}
