'use client'
// Global error boundary — catch les erreurs même dans le root layout.
// Next.js 14 App Router : ce composant remplace TOUT (html, body inclus), donc
// il faut redéfinir <html> et <body> manuellement.
//
// Différence avec error.js :
//   - error.js : catch erreurs dans les routes enfants (rare : crash composant)
//   - global-error.js : catch erreurs dans le root layout lui-même (catastrophique)
//
// Branding minimal — pas de Provider, pas de font Inter (peut être casser),
// styles inline uniquement pour garantir le rendu même si la CSS est cassée.

import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Quantara GLOBAL error:', error?.message, error?.digest)
  }, [error])

  return (
    <html lang="fr">
      <body style={{
        margin: 0,
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 20, lineHeight: 1 }}>💥</div>

          <h1 style={{
            fontSize: 28, fontWeight: 700, margin: 0,
            letterSpacing: '-0.02em', marginBottom: 12,
          }}>
            Erreur critique
          </h1>

          <p style={{
            fontSize: 15, color: 'var(--text2)', lineHeight: 1.6,
            marginTop: 0, marginBottom: 28,
          }}>
            Quantara a rencontré une erreur inattendue. Tu peux recharger la page,
            ou nous contacter à{' '}
            <a href="mailto:support@quantara.tech" style={{
              color: 'var(--blue-light)', textDecoration: 'none',
            }}>support@quantara.tech</a>{' '}
            si le problème persiste.
          </p>

          {process.env.NODE_ENV !== 'production' && error?.message && (
            <pre style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8, padding: 12, fontSize: 11,
              color: 'var(--amber)', textAlign: 'left',
              overflow: 'auto', maxHeight: 200, marginBottom: 24,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          )}

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
              Réessayer
            </button>
            <a href="/" style={{
              padding: '12px 22px',
              fontSize: 14, fontWeight: 600,
              background: 'transparent', color: 'var(--text2)',
              border: '1px solid var(--border2)', borderRadius: 8,
              textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center',
            }}>
              Recharger
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
