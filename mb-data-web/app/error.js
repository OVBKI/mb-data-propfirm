'use client'
// Error boundary global pour erreurs runtime sur n'importe quelle route /app, /pricing, /docs, etc.
// Sauf erreurs dans le root layout — voir global-error.js pour celles-là.
//
// Next.js 14 App Router : ce fichier est automatiquement utilisé comme React Error Boundary
// autour de tous les segments enfants. Reset = retente le rendu.
//
// Branding cohérent avec layout.js (Inter font, dark theme #0d0f14, accent #2d6fff).

import { useEffect } from 'react'
import Link from 'next/link'
import { useT } from '../components/LanguageProvider'

export default function GlobalErrorBoundary({ error, reset }) {
  const t = useT()
  useEffect(() => {
    // Log côté client — en attendant Sentry, au moins on a la trace en DevTools console
    // En prod, ce log ne fuite rien d'identifiable (juste le message + digest hash)
    console.error('Quantara error boundary:', error?.message, error?.digest)
  }, [error])

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
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        {/* Icône d'erreur — emoji simple, pas de dépendance lib */}
        <div style={{ fontSize: 56, marginBottom: 20, lineHeight: 1 }}>⚠️</div>

        <h1 style={{
          fontSize: 28, fontWeight: 700, margin: 0,
          letterSpacing: '-0.02em', marginBottom: 12,
        }}>
          {t('errorPages.errorTitle')}
        </h1>

        <p style={{
          fontSize: 15, color: 'var(--text2)', lineHeight: 1.6,
          marginTop: 0, marginBottom: 28,
        }}>
          {t('errorPages.errorBodyPre')}
          <a href="mailto:support@quantara.tech" style={{
            color: 'var(--blue-light)', textDecoration: 'none',
          }}>support@quantara.tech</a>{t('errorPages.errorBodyPost')}
        </p>

        {/* Détail debug — seulement en dev, jamais en prod */}
        {process.env.NODE_ENV !== 'production' && error?.message && (
          <pre style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: 12, fontSize: 11,
            color: 'var(--amber)', textAlign: 'left',
            overflow: 'auto', maxHeight: 200, marginBottom: 24,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {error.message}
            {error.digest && `\n\nDigest: ${error.digest}`}
          </pre>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 22px',
              fontSize: 14, fontWeight: 600,
              background: 'var(--blue)', color: 'white',
              border: 'none', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t('errorPages.retry')}
          </button>
          <Link href="/" style={{
            padding: '12px 22px',
            fontSize: 14, fontWeight: 600,
            background: 'transparent', color: 'var(--text2)',
            border: '1px solid var(--border2)', borderRadius: 8,
            textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}>
            {t('errorPages.backHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
