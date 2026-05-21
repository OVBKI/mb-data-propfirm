// Page /integrations — wrapper Server Component pour exporter les metadata.
import IntegrationsClient from './IntegrationsClient'

export const metadata = {
  title: 'PropFirms supportées — Quantara',
  description: '11 PropFirms futures supportées : Topstep, Apex, Lucid, Bulenox, Tradeify, MFFU, Phidias, FFN, FuturesElite, TPT, Alpha Futures. Import CSV Rithmic actif. API broker en développement.',
}

export default function IntegrationsPage() {
  return <IntegrationsClient />
}
