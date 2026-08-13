'use client'

import { useRouter } from 'next/navigation'
import AuthPage from '../../components/AuthPage'
import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'

export default function AuthClient({ initialMode }) {
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <PageHeader />
      <div style={{ flex: 1 }}>
        <AuthPage
          initialMode={initialMode}
          onAuth={() => router.push('/app')}
        />
      </div>
      <Footer />
    </div>
  )
}
