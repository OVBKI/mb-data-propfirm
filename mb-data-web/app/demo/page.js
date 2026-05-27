import DemoClient from './DemoClient'

export const metadata = {
  title: 'Demo — Quantara PropFirm Dashboard',
  description:
    'Try Quantara without signing up. See how the PropFirm dashboard tracks your trailing drawdown, consistency, payouts and accounts across Topstep, Apex, MFFU and more.',
  alternates: { canonical: 'https://quantara.tech/demo' },
  robots: { index: true, follow: true },
}

export default function DemoPage() {
  return <DemoClient />
}
