import AuthClient from './AuthClient'

export const metadata = {
  title: 'Sign in — Quantara',
  description: 'Sign in or create your free Quantara account. Track all your PropFirm accounts in one dashboard.',
}

export default async function AuthPage({ searchParams }) {
  const params = await searchParams
  return <AuthClient initialMode={params?.mode || 'login'} />
}
