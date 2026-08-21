'use client'
// Rendu client de la page 404 — séparé de not-found.js pour que ce dernier reste
// un server component qui exporte `metadata` (SEO), tout en permettant useT() ici.

import Link from 'next/link'
import { useT } from '../components/LanguageProvider'

export default function NotFoundClient() {
  const t = useT()
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'inherit',
    }}>
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        {/* Gros 404 stylé */}
        <div style={{
          fontSize: 96, fontWeight: 800, lineHeight: 1,
          letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg, var(--blue) 0%, #4d8fff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 8,
        }}>
          404
        </div>

        <h1 style={{
          fontSize: 24, fontWeight: 700, margin: 0,
          letterSpacing: '-0.02em', marginBottom: 12,
        }}>
          {t('errorPages.notFoundTitle')}
        </h1>

        <p style={{
          fontSize: 15, color: 'var(--text2)', lineHeight: 1.6,
          marginTop: 0, marginBottom: 32,
        }}>
          {t('errorPages.notFoundBody')}
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            padding: '12px 22px',
            fontSize: 14, fontWeight: 600,
            background: 'var(--blue)', color: 'white',
            border: 'none', borderRadius: 8,
            textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}>
            {t('errorPages.backHome')}
          </Link>
          <Link href="/app" style={{
            padding: '12px 22px',
            fontSize: 14, fontWeight: 600,
            background: 'transparent', color: 'var(--text2)',
            border: '1px solid var(--border2)', borderRadius: 8,
            textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}>
            {t('errorPages.openDashboard')}
          </Link>
        </div>

        {/* Suggestions de pages populaires */}
        <div style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: '1px solid var(--border)',
          fontSize: 12,
          color: 'var(--text3)',
        }}>
          <div style={{ marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            {t('errorPages.popularPages')}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/pricing" style={{ color: 'var(--text2)', textDecoration: 'none' }}>{t('errorPages.linkPricing')}</Link>
            <Link href="/integrations" style={{ color: 'var(--text2)', textDecoration: 'none' }}>{t('errorPages.linkIntegrations')}</Link>
            <Link href="/docs" style={{ color: 'var(--text2)', textDecoration: 'none' }}>{t('errorPages.linkDocs')}</Link>
            <Link href="/security" style={{ color: 'var(--text2)', textDecoration: 'none' }}>{t('errorPages.linkSecurity')}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
