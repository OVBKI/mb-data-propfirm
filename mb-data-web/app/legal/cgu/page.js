// /legal/cgu — wrapper Server Component pour les metadata.
import CGUClient from './CGUClient'

export const metadata = {
  title: 'Conditions Générales d\'Utilisation — Quantara',
  description: 'CGU de Quantara Technologies LLC : règles d\'utilisation du service de journal de trading PropFirm. Régies par le droit du New Mexico, USA.',
}

export default function CGUPage() {
  return <CGUClient />
}
