// /legal/imprint — wrapper Server Component pour les metadata.
import ImprintClient from './ImprintClient'

export const metadata = {
  title: 'Mentions Légales — Quantara',
  description: 'Mentions légales de Quantara Technologies LLC, New Mexico. Hébergement Vercel + Supabase EU. Contact, propriétaire, identification du site.',
  alternates: {
    canonical: 'https://quantara.tech/legal/imprint',
  },
  openGraph: {
    title: 'Mentions Légales — Quantara',
    description: 'Mentions légales de Quantara Technologies LLC, New Mexico. Hébergement Vercel + Supabase EU. Contact, propriétaire, identification du site.',
    url: 'https://quantara.tech/legal/imprint',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mentions Légales — Quantara',
    description: 'Mentions légales de Quantara Technologies LLC, New Mexico. Hébergement Vercel + Supabase EU.',
  },
}

export default function ImprintPage() {
  return <ImprintClient />
}
