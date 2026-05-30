// /legal/privacy — wrapper Server Component pour les metadata.
import PrivacyClient from './PrivacyClient'

export const metadata = {
  title: 'Politique de Confidentialité — Quantara',
  description: 'Comment Quantara collecte, utilise et protège tes données personnelles. RGPD-compliant. Hébergement EU.',
  alternates: {
    canonical: 'https://quantara.tech/legal/privacy',
  },
  openGraph: {
    title: 'Politique de Confidentialité — Quantara',
    description: 'Comment Quantara collecte, utilise et protège tes données personnelles. RGPD-compliant. Hébergement EU.',
    url: 'https://quantara.tech/legal/privacy',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Politique de Confidentialité — Quantara',
    description: 'Comment Quantara collecte, utilise et protège tes données personnelles. RGPD-compliant. Hébergement EU.',
  },
}

export default function PrivacyPage() {
  return <PrivacyClient />
}
