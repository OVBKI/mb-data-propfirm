// Page /pricing — wrapper Server Component pour exporter les metadata.
import PricingClient from './PricingClient'

export const revalidate = 3600 // ISR: revalidate every hour

export const metadata = {
  title: 'Pricing — Quantara',
  description: 'Free during beta. Pro at €9/mo for auto-sync and advanced analytics. Lifetime deal at €99. The PropFirm trading journal that fits your budget.',
  alternates: {
    canonical: 'https://quantara.tech/pricing',
  },
  openGraph: {
    title: 'Pricing — Quantara',
    description: 'Free during beta. Pro at €9/mo for auto-sync and advanced analytics. Lifetime deal at €99. The PropFirm trading journal that fits your budget.',
    url: 'https://quantara.tech/pricing',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Quantara',
    description: 'Free during beta. Pro at €9/mo for auto-sync and advanced analytics. Lifetime deal at €99.',
  },
}

export default function PricingPage() {
  return <PricingClient />
}
