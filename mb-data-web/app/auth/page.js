import AuthClient from './AuthClient'

export const metadata = {
  title: 'Sign in — Quantara',
  description: 'Sign in or create your free Quantara account. Track all your PropFirm accounts in one dashboard.',
  // La page existe aussi en ?mode=signup : sans canonique, Google indexe deux
  // URLs pour un même contenu et dilue le signal.
  alternates: { canonical: 'https://quantara.tech/auth' },
}

export default async function AuthPage({ searchParams }) {
  const params = await searchParams
  return <AuthClient initialMode={params?.mode || 'login'} />
}
