// /legal/cgu — wrapper Server Component pour les metadata.
import CGUClient from './CGUClient'

export const metadata = {
  title: 'Conditions Générales d\'Utilisation — Quantara',
  description: 'CGU de Quantara Technologies LLC : règles d\'utilisation du service de journal de trading PropFirm. Régies par le droit du New Mexico, USA.',
  alternates: {
    canonical: 'https://quantara.tech/legal/cgu',
  },
  openGraph: {
    title: 'Conditions Générales d\'Utilisation — Quantara',
    description: 'CGU de Quantara Technologies LLC : règles d\'utilisation du service de journal de trading PropFirm. Régies par le droit du New Mexico, USA.',
    url: 'https://quantara.tech/legal/cgu',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conditions Générales d\'Utilisation — Quantara',
    description: 'CGU de Quantara Technologies LLC : règles d\'utilisation du service de journal de trading PropFirm.',
  },
}

export default function CGUPage() {
  return <CGUClient />
}
