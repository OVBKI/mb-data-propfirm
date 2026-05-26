// Page /pricing — wrapper Server Component pour exporter les metadata.
import PricingClient from './PricingClient'

export const metadata = {
  title: 'Pricing — Quantara',
  description: 'Free during beta. Pro at €9/mo for auto-sync and advanced analytics. Lifetime deal at €99. The PropFirm trading journal that fits your budget.',
  alternates: {
    canonical: 'https://quantara.tech/pricing',
  },
}

export default function PricingPage() {
  return <PricingClient />
}
