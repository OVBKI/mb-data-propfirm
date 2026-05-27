import DrawdownSimulatorClient from './DrawdownSimulatorClient'
import JsonLd, { ORGANIZATION_SCHEMA } from '../../../components/JsonLd'

export const metadata = {
  title: 'Trailing Drawdown Simulator — Free PropFirm Calculator | Quantara',
  description:
    'Free trailing drawdown calculator for PropFirm futures traders. Simulate EOD and intraday drawdown on Topstep, Apex, MFFU and more. See exactly how much room you have before blowing your account.',
  alternates: { canonical: 'https://quantara.tech/tools/drawdown-simulator' },
  openGraph: {
    title: 'Trailing Drawdown Simulator — Quantara',
    description: 'Simulate your PropFirm trailing drawdown (EOD vs Intraday). Free, no signup required.',
    url: 'https://quantara.tech/tools/drawdown-simulator',
    type: 'website',
  },
}

const TOOL_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Trailing Drawdown Simulator',
  url: 'https://quantara.tech/tools/drawdown-simulator',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: 'Free trailing drawdown calculator for PropFirm futures traders. Simulate EOD and intraday drawdown scenarios.',
  publisher: { '@id': 'https://quantara.tech/#org' },
}

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the difference between EOD and intraday trailing drawdown?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'End-of-Day (EOD) trailing drawdown only updates at market close. Your drawdown floor moves up only when you end the day at a new high. Intraday trailing drawdown updates tick-by-tick during the session — any intraday high watermark raises the floor immediately. EOD is more forgiving because temporary spikes during the session don\'t affect your drawdown.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does trailing drawdown work in PropFirm accounts?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Trailing drawdown starts at a fixed distance below your initial balance (e.g., $3,000 below on a $150K Topstep account). As your account balance grows, the drawdown floor trails upward with it. Once the floor reaches your initial balance, it locks there permanently. If your balance ever drops to the drawdown floor, your account is terminated.',
      },
    },
  ],
}

export default function DrawdownSimulatorPage() {
  return (
    <>
      <JsonLd data={TOOL_SCHEMA} />
      <JsonLd data={FAQ_SCHEMA} />
      <JsonLd data={ORGANIZATION_SCHEMA} />
      <DrawdownSimulatorClient />
    </>
  )
}
