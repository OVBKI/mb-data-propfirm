// Page /docs — wrapper Server Component qui exporte les metadata.
// Le rendu client est délégué à DocsClient pour pouvoir utiliser useT() / useState().

import DocsClient from './DocsClient'
import JsonLd from '../../components/JsonLd'

export const revalidate = 3600 // ISR: revalidate every hour

export const metadata = {
  title: 'Documentation & FAQ — Quantara',
  description: 'Everything you need to know about Quantara: getting started, PropFirm setup, trading journal, drawdown tracking, payouts, and frequently asked questions.',
  alternates: {
    canonical: 'https://quantara.tech/docs',
  },
  openGraph: {
    title: 'Documentation & FAQ — Quantara',
    description: 'Everything you need to know about Quantara: getting started, PropFirm setup, trading journal, drawdown tracking, payouts, and frequently asked questions.',
    url: 'https://quantara.tech/docs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Documentation & FAQ — Quantara',
    description: 'Everything you need to know about Quantara: getting started, PropFirm setup, trading journal, drawdown tracking, payouts, and frequently asked questions.',
  },
}

const DOCS_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I import my trades from Rithmic into Quantara?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Go to /app/import-lab from the SYNC sidebar. Two tabs are available: "Account state" where you drag a Trader Dashboard export to auto-create accounts with balance, drawdown and status, and "Trades" where you drag a Performance Statement export to add trades to existing accounts. The system deduplicates automatically via a rithmic marker in trade notes.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which PropFirms are supported by Quantara?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '10 firms are pre-configured: Topstep, Apex Trader Funding, Bulenox, Lucid Trading, Tradeify, Take Profit Trader, My Funded Futures, Phidias Propfirm, Funded Futures Network, and FuturesElite. Each firm has auto-filled rules for drawdown, profit targets, and minimum trading days. See /integrations for CSV sync status details.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the trailing drawdown calculation work in Quantara?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The dashboard displays your current balance and the live-computed drawdown threshold for each account. Journal equity curves show the trailing drawdown line — static, End-of-Day or Intraday depending on the PropFirm rules. Quantara calculates this automatically based on each firm\'s specific drawdown type.',
      },
    },
    {
      '@type': 'Question',
      name: 'What amount should I enter when logging a payout?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Enter the NET amount you receive on your bank account (after the profit split). Quantara computes the gross amount automatically (net divided by split percentage) to deduct from your simulated balance. For example, receiving $1,800 on Lucid with a 90/10 split means your balance drops by $2,000.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need a credit card to sign up for Quantara?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Quantara is free during beta — no credit card required. All beta users will have privileged access to future paid versions. You can explore the full demo at /demo without creating an account.',
      },
    },
  ],
}

export default function DocsPage() {
  return (
    <>
      <JsonLd data={DOCS_FAQ_SCHEMA} />
      <DocsClient />
    </>
  )
}
