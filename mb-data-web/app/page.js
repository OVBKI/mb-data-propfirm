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

// SEO fallback — visible to crawlers while JS loads.
// ~300 words of real content + internal links so Google indexes substance even with ssr:false.
function LandingFallback() {
  return (
    <div style={{ minHeight: '100vh', background: '#0d0f14', color: '#f0ede8' }}>
      <header style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 800, letterSpacing: '0.12em', fontSize: 13 }}>QUANTARA</span>
        <nav style={{ display: 'flex', gap: 18, fontSize: 13 }}>
          <a href="/compare" style={{ color: '#9098b0', textDecoration: 'none' }}>Comparateur</a>
          <a href="/pricing" style={{ color: '#9098b0', textDecoration: 'none' }}>Tarifs</a>
          <a href="/docs" style={{ color: '#9098b0', textDecoration: 'none' }}>Docs</a>
          <a href="/integrations" style={{ color: '#9098b0', textDecoration: 'none' }}>Intégrations</a>
          <a href="/demo" style={{ color: '#9098b0', textDecoration: 'none' }}>Demo</a>
        </nav>
      </header>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '100px 24px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 24 }}>
            Ton cockpit<br />PropFirm
          </h1>
          <p style={{ fontSize: 18, color: '#9098b0', lineHeight: 1.6, marginBottom: 40 }}>
            Suis tes comptes, analyse tes trades, gère tes payouts. Le tableau de bord que chaque trader PropFirm mérite.
          </p>
          <a href="/auth?mode=signup" style={{ padding: '14px 32px', background: '#f0ede8', color: '#0a0c10', borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
            Commencer gratuitement →
          </a>
        </div>

        <section style={{ marginBottom: 40, lineHeight: 1.7, fontSize: 15, color: '#c0c5d4' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f0ede8', marginBottom: 16 }}>Le journal de trading conçu pour les PropFirms</h2>
          <p>
            Quantara est un tableau de bord intelligent pour les traders PropFirm futures. Connecte tous tes comptes
            — <strong>Topstep, Apex Trader Funding, Lucid Trading, Bulenox, Tradeify, MFFU, Phidias, Take Profit Trader</strong> et plus
            — dans une interface unifiée. Importe tes trades via <strong>CSV Rithmic</strong> ou saisis-les manuellement dans le journal intégré.
          </p>
          <p style={{ marginTop: 12 }}>
            Le <strong>trailing drawdown</strong> est calculé automatiquement selon les règles propres à chaque firme : End-of-Day pour Topstep,
            Intraday pour Apex, statique pour Lucid. La <strong>consistency rule</strong> est auditée en temps réel pour que tu saches
            exactement où tu en es avant de demander un payout. Utilise le{' '}
            <a href="/tools/drawdown-simulator" style={{ color: '#4d8fff', textDecoration: 'none' }}>simulateur de drawdown</a>{' '}
            pour tester des scénarios avant de trader.
          </p>
          <p style={{ marginTop: 12 }}>
            Visualise ta performance avec des <strong>courbes d'equity</strong>, un <strong>calendrier PnL heatmap</strong>,
            des analytics cumulées par firme et des statistiques de win rate et consistency.
            Le <strong>calendrier économique intégré</strong> (données Finnhub, FR/EN/ES) t'aide à anticiper la volatilité avant chaque session.
          </p>
          <p style={{ marginTop: 12 }}>
            <a href="/compare" style={{ color: '#4d8fff', textDecoration: 'none' }}>Compare les 11 PropFirms supportées</a> côte à côte :
            tailles de comptes, drawdown types, profit splits et frais. Consulte la{' '}
            <a href="/pricing" style={{ color: '#4d8fff', textDecoration: 'none' }}>page tarifs</a> — Quantara est <strong>gratuit pendant la beta</strong>,
            sans carte bancaire. Explore le{' '}
            <a href="/demo" style={{ color: '#4d8fff', textDecoration: 'none' }}>mode demo</a> sans inscription pour voir le dashboard en action,
            ou parcours la <a href="/docs" style={{ color: '#4d8fff', textDecoration: 'none' }}>documentation complète</a> et la FAQ.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0ede8', marginBottom: 16 }}>Fonctionnalités clés</h2>
          <ul style={{ lineHeight: 2, fontSize: 14, color: '#c0c5d4', paddingLeft: 20 }}>
            <li>Multi PropFirm — 11 firmes pré-configurées avec règles auto-remplies</li>
            <li>Import CSV Rithmic (Performance Statement + Trader Dashboard)</li>
            <li>Journal de trading avec screenshots, tags et courbes equity</li>
            <li>Trailing drawdown automatique (EOD, Intraday, Statique)</li>
            <li>Consistency rule calculée en temps réel</li>
            <li>Suivi des payouts, dépenses et ROI par firme</li>
            <li>Calendrier PnL mensuel heatmap</li>
            <li>Calendrier économique intégré (Finnhub, 3 langues)</li>
            <li>Alertes drawdown par push notification</li>
            <li><a href="/integrations" style={{ color: '#4d8fff', textDecoration: 'none' }}>Voir toutes les intégrations</a></li>
          </ul>
        </section>
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
