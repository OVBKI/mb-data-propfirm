// Page 404 custom — affichée pour toute URL inexistante (/foo, /random, etc.)
// Next.js 14 App Router : appelée automatiquement quand aucune route ne match,
// ou via `notFound()` depuis un server component.
//
// Pas 'use client' : c'est un server component (plus rapide, SEO-friendly).
// Branding cohérent avec layout.js (dark #0d0f14, accent #2d6fff).

import Link from 'next/link'

export const metadata = {
  title: 'Page introuvable — 404',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0f14',
      color: '#f0ede8',
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
          background: 'linear-gradient(135deg, #2d6fff 0%, #4d8fff 100%)',
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
          Page introuvable
        </h1>

        <p style={{
          fontSize: 15, color: '#9098b0', lineHeight: 1.6,
          marginTop: 0, marginBottom: 32,
        }}>
          Cette page n'existe pas, ou elle a été déplacée.
          {' '}Retourne à l'accueil ou ouvre ton tableau de bord pour continuer.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            padding: '12px 22px',
            fontSize: 14, fontWeight: 600,
            background: '#2d6fff', color: 'white',
            border: 'none', borderRadius: 8,
            textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}>
            Retour à l'accueil
          </Link>
          <Link href="/app" style={{
            padding: '12px 22px',
            fontSize: 14, fontWeight: 600,
            background: 'transparent', color: '#9098b0',
            border: '1px solid rgba(255,255,255,0.13)', borderRadius: 8,
            textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}>
            Ouvrir mon dashboard
          </Link>
        </div>

        {/* Suggestions de pages populaires */}
        <div style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          fontSize: 12,
          color: '#565e78',
        }}>
          <div style={{ marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            Pages populaires
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/pricing" style={{ color: '#9098b0', textDecoration: 'none' }}>Tarifs</Link>
            <Link href="/integrations" style={{ color: '#9098b0', textDecoration: 'none' }}>Intégrations</Link>
            <Link href="/docs" style={{ color: '#9098b0', textDecoration: 'none' }}>Documentation</Link>
            <Link href="/security" style={{ color: '#9098b0', textDecoration: 'none' }}>Sécurité</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
