// Page /docs — wrapper Server Component qui exporte les metadata.
// Le rendu client est délégué à DocsClient pour pouvoir utiliser useT() / useState().

import DocsClient from './DocsClient'

export const metadata = {
  title: 'Documentation & FAQ — Quantara',
  description: 'Everything you need to know about Quantara: getting started, PropFirm setup, trading journal, drawdown tracking, payouts, and frequently asked questions.',
  alternates: {
    canonical: 'https://quantara.tech/docs',
  },
}

export default function DocsPage() {
  return <DocsClient />
}
