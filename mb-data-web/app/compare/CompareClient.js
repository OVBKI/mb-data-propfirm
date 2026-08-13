'use client'
import PropfirmComparator from '../../components/PropfirmComparator'
import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'

export default function CompareClient() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />
      <main style={{ flex: 1 }}>
        <PropfirmComparator user={null} />
      </main>
      <Footer />
    </div>
  )
}
