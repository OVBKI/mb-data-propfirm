// Landing page — Server component wrapper.
// The actual interactive landing lives in components/landing/LandingPage.js ('use client').
// This file stays as a server component so we can export metadata for SEO,
// render an SEO-friendly fallback for crawlers, and lazy-load the heavy client bundle.

import { Suspense } from 'react'
import JsonLd, { SOFTWARE_SCHEMA, FAQ_SCHEMA } from '../components/JsonLd'
import LandingPage from '../components/landing/LandingPageLazy'
import LandingFallback from '../components/landing/LandingFallback'

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



export default function Page() {
  return (
    <>
      {/* JSON-LD rendu côté SERVEUR (le landing client est ssr:false → invisible aux
          crawlers). Organization + WebSite sont déjà émis dans layout.js. */}
      <JsonLd data={SOFTWARE_SCHEMA} />
      <JsonLd data={FAQ_SCHEMA} />
      {/* La landing est ÉPINGLÉE en sombre : son star field Three.js, ses dégradés
          mesh et ses mockups sont dessinés pour du noir — en clair ils deviennent
          illisibles. data-theme sur ce conteneur redéfinit les jetons pour tout le
          sous-arbre, quel que soit le choix de l'utilisateur. */}
      <div data-theme="dark" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <Suspense fallback={<LandingFallback />}>
          <LandingPage />
        </Suspense>
      </div>
    </>
  )
}
