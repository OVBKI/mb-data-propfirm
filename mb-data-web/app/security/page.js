// Page /security — wrapper Server Component qui exporte les metadata.
// Le rendu client est délégué à SecurityClient pour pouvoir utiliser useT().

import SecurityClient from './SecurityClient'

export const metadata = {
  title: 'Sécurité — Quantara',
  description: 'Comment Quantara protège tes données : RLS Postgres, hébergement EU, captcha Turnstile, JWT Supabase, zéro accès broker.',
}

export default function SecurityPage() {
  return <SecurityClient />
}
