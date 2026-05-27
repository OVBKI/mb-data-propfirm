import DemoClient from './DemoClient'

export const metadata = {
  title: 'Demo — Quantara PropFirm Dashboard',
  description:
    'Try Quantara without signing up. See how the PropFirm dashboard tracks your trailing drawdown, consistency, payouts and accounts across Topstep, Apex, MFFU and more.',
  alternates: { canonical: 'https://quantara.tech/demo' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Demo — Quantara PropFirm Dashboard',
    description: 'Try Quantara without signing up. See how the PropFirm dashboard tracks your trailing drawdown, consistency, payouts and accounts across Topstep, Apex, MFFU and more.',
    url: 'https://quantara.tech/demo',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Demo — Quantara PropFirm Dashboard',
    description: 'Try Quantara without signing up. See how the PropFirm dashboard tracks your trailing drawdown, consistency, payouts and accounts.',
  },
}

export default function DemoPage() {
  return <DemoClient />
}
