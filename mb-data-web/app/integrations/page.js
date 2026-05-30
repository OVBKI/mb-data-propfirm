// Page /integrations — wrapper Server Component pour exporter les metadata.
import IntegrationsClient from './IntegrationsClient'

export const revalidate = 3600 // ISR: revalidate every hour

export const metadata = {
  title: 'PropFirms supportées — Quantara',
  description: '11 PropFirms futures supportées : Topstep, Apex, Lucid, Bulenox, Tradeify, MFFU, Phidias, FFN, FuturesElite, TPT, Alpha Futures. Import CSV Rithmic actif. API broker en développement.',
  alternates: {
    canonical: 'https://quantara.tech/integrations',
  },
  openGraph: {
    title: 'PropFirms supportées — Quantara',
    description: '11 PropFirms futures supportées : Topstep, Apex, Lucid, Bulenox, Tradeify, MFFU, Phidias, FFN, FuturesElite, TPT, Alpha Futures. Import CSV Rithmic actif. API broker en développement.',
    url: 'https://quantara.tech/integrations',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PropFirms supportées — Quantara',
    description: '11 PropFirms futures supportées : Topstep, Apex, Lucid, Bulenox, Tradeify, MFFU, Phidias, FFN, FuturesElite, TPT, Alpha Futures.',
  },
}

export default function IntegrationsPage() {
  return <IntegrationsClient />
}
