// Page /security — wrapper Server Component qui exporte les metadata.
// Le rendu client est délégué à SecurityClient pour pouvoir utiliser useT().

import SecurityClient from './SecurityClient'

export const revalidate = 3600 // ISR: revalidate every hour

export const metadata = {
  title: 'Sécurité — Quantara',
  description: 'Comment Quantara protège tes données : RLS Postgres, hébergement EU, captcha Turnstile, JWT Supabase, zéro accès broker.',
  alternates: {
    canonical: 'https://quantara.tech/security',
  },
  openGraph: {
    title: 'Sécurité — Quantara',
    description: 'Comment Quantara protège tes données : RLS Postgres, hébergement EU, captcha Turnstile, JWT Supabase, zéro accès broker.',
    url: 'https://quantara.tech/security',
    type: 'website',
    images: ['/og-image.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sécurité — Quantara',
    description: 'Comment Quantara protège tes données : RLS Postgres, hébergement EU, captcha Turnstile, JWT Supabase, zéro accès broker.',
  },
}

export default function SecurityPage() {
  return <SecurityClient />
}
