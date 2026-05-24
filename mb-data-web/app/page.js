// Landing page — Server component wrapper.
// The actual interactive landing lives in components/landing/LandingPage.js ('use client').
// This file stays as a server component so we can export metadata for SEO,
// render an SEO-friendly fallback for crawlers, and lazy-load the heavy client bundle.

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Page-specific metadata — overrides layout.js defaults for the landing route.
// Layout already provides OG images, twitter cards, robots, icons, etc.
export const metadata = {
  title: 'Quantara — Tableau de bord PropFirm intelligent',
  description: 'Suis tes comptes PropFirm, analyse tes trades, gère tes payouts. Dashboard multi-firmes, journal de trading, calendrier économique. Gratuit.',
  alternates: {
    canonical: 'https://quantara.tech',
    languages: { 'fr': 'https://quantara.tech', 'en': 'https://quantara.tech' },
  },
}

const LandingPage = dynamic(() => import('../components/landing/LandingPage'), {
  ssr: false,
  loading: () => <LandingFallback />,
})

// SEO fallback — visible to crawlers while JS loads
function LandingFallback() {
  return (
    <div style={{ minHeight: '100vh', background: '#0d0f14', color: '#f0ede8' }}>
      <header style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontWeight: 800, letterSpacing: '0.12em', fontSize: 13 }}>QUANTARA</span>
      </header>
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 24 }}>
          Ton cockpit<br />PropFirm
        </h1>
        <p style={{ fontSize: 18, color: '#9098b0', lineHeight: 1.6, marginBottom: 40 }}>
          Suis tes comptes, analyse tes trades, gère tes payouts. Le tableau de bord que chaque trader PropFirm mérite.
        </p>
        <a href="/app" style={{ padding: '14px 32px', background: '#f0ede8', color: '#0a0c10', borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
          Commencer gratuitement →
        </a>
        <noscript>
          <h2 style={{ marginTop: 60, fontSize: 24 }}>Fonctionnalités</h2>
          <ul style={{ textAlign: 'left', maxWidth: 500, margin: '20px auto', lineHeight: 2 }}>
            <li>Multi PropFirm — Topstep, Apex, FTMO, et plus</li>
            <li>Journal de trading avec screenshots et tags</li>
            <li>Courbe d equity en temps réel</li>
            <li>Suivi des payouts et dépenses</li>
            <li>Alertes de prélèvement par push notification</li>
            <li>Calendrier économique intégré</li>
          </ul>
        </noscript>
      </main>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<LandingFallback />}>
      <LandingPage />
    </Suspense>
  )
}
