// /legal/imprint — wrapper Server Component pour les metadata.
import ImprintClient from './ImprintClient'

export const metadata = {
  title: 'Mentions Légales — Quantara',
  description: 'Mentions légales de Quantara Technologies LLC, New Mexico. Hébergement Vercel + Supabase EU. Contact, propriétaire, identification du site.',
}

export default function ImprintPage() {
  return <ImprintClient />
}
