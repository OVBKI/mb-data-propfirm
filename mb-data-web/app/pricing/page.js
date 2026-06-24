// Page /pricing — wrapper Server Component pour exporter les metadata.
import PricingClient from './PricingClient'

export const revalidate = 3600 // ISR: revalidate every hour

export const metadata = {
  title: 'Pricing — Quantara',
  description: 'Free during public beta. Pro at €19/mo for auto-sync and advanced analytics — beta users lock in 50% off for life. The PropFirm trading journal that fits your budget.',
  alternates: {
    canonical: 'https://quantara.tech/pricing',
  },
  openGraph: {
    title: 'Pricing — Quantara',
    description: 'Free during public beta. Pro at €19/mo for auto-sync and advanced analytics — beta users lock in 50% off for life. The PropFirm trading journal that fits your budget.',
    url: 'https://quantara.tech/pricing',
    type: 'website',
    images: ['/og-image.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing — Quantara',
    description: 'Free during public beta. Pro at €19/mo — beta users lock in 50% off for life.',
  },
}

export default function PricingPage() {
  return <PricingClient />
}
