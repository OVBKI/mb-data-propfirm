'use client'
import Link from 'next/link'
import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'
import { getFirmLogo } from '../../lib/firmLogos'
import { FIRM_SUGGESTION_COLORS } from '../../lib/constants'
import { getFirmsOrdered } from '../../lib/firmSlugs'

const C = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--tint1)',
  border: 'var(--border)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
  green: 'var(--green)',
  amber: 'var(--amber)',
}

export default function FirmsIndexClient() {
  const firms = getFirmsOrdered()

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />
      <main style={{ flex: 1, padding: '60px 24px 80px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
            PROPFIRM REVIEWS · MAI 2026
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, marginBottom: 16 }}>
            Toutes les PropFirms futures, vérifiées en 2026
          </h1>
          <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.6, maxWidth: 680, margin: '0 auto' }}>
            Topstep, Apex, Lucid, Tradeify, MFFU, Bulenox, TPT, Alpha Futures et plus : règles à jour, drawdown,
            profit split, payouts, prix. Tout sourcé depuis les docs officielles, vérifié mai 2026.
          </p>
        </div>

        {/* Firms grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 56,
        }}>
          {firms.map(({ name, slug, meta, plans }) => {
            const color = FIRM_SUGGESTION_COLORS[name] || C.blue
            return (
              <Link
                key={slug}
                href={`/firms/${slug}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 20,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  textDecoration: 'none',
                  color: C.text,
                  transition: 'border-color 0.15s, transform 0.15s',
                  minHeight: 200,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${color}55`
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  {getFirmLogo(name, color, 40)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{name}</div>
                    <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                      {meta?.ddType ? meta.ddType.replace(/\s*\(.*\)/, '') : 'PropFirm futures'}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5, margin: 0, marginBottom: 14, flex: 1 }}>
                  {meta?.tagline || `Règles complètes ${name} 2026.`}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {plans.slice(0, 4).map((p) => (
                    <span key={p} style={{
                      padding: '3px 8px',
                      background: 'rgba(45,111,255,0.08)',
                      border: '1px solid rgba(45,111,255,0.18)',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.blueLight,
                    }}>{p.toUpperCase()}</span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: C.blueLight, fontWeight: 600 }}>
                  Voir règles & FAQ →
                </div>
              </Link>
            )
          })}
        </div>

        {/* Editorial intro for SEO */}
        <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '28px 32px', marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 14 }}>Comment choisir sa PropFirm futures en 2026</h2>
          <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, margin: 0, marginBottom: 12 }}>
            {`Le marché PropFirm futures s'est massivement consolidé en 2025-2026 autour de 3 types de drawdown : `}
            <strong style={{ color: C.text }}>End-of-Day (EOD)</strong>
            {` chez Topstep et Tradeify (le seuil ne se calcule qu'à la clôture), `}
            <strong style={{ color: C.text }}>trailing intraday</strong>
            {` chez Apex et Lucid (tick par tick), et `}
            <strong style={{ color: C.text }}>trailing avec cap au balance initial</strong>
            {` chez MFFU (intermédiaire). Le choix du type de drawdown est le premier critère qui détermine si une firm vous convient.`}
          </p>
          <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, margin: 0, marginBottom: 12 }}>
            {`Les autres dimensions clés sont le `}
            <strong style={{ color: C.text }}>profit split</strong>
            {` (90/10 standard, sauf Apex 4.0 qui propose 100% cappé puis uncapped), la `}
            <strong style={{ color: C.text }}>cadence des payouts</strong>
            {` (hebdo chez Apex/Topstep/Lucid/Tradeify, mensuelle chez Bulenox/Phidias), les `}
            <strong style={{ color: C.text }}>règles consistency</strong>
            {` (Topstep impose un cap sur le best day, d'autres pas), et les `}
            <strong style={{ color: C.text }}>instruments autorisés</strong>
            {` (ES/NQ partout, crypto futures partiellement). Toutes les fiches ci-dessus détaillent ces points firm par firm.`}
          </p>
          <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, margin: 0 }}>
            {`Quantara tracke automatiquement les règles spécifiques à chacune de ces 11 firmes : drawdown, consistency, profit target, payouts éligibles. C'est la seule façon en 2026 d'avoir une vue unifiée quand on diversifie ses comptes sur plusieurs PropFirms.`}
          </p>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: '40px 24px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 12 }}>Track ta PropFirm avec Quantara</h2>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, marginBottom: 22, lineHeight: 1.6 }}>
            Les 11 firmes ci-dessus sont pré-configurées dans Quantara avec leurs règles à jour. Setup en 90 secondes, gratuit pendant la beta.
          </p>
          <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/auth?mode=signup" style={{
              padding: '12px 28px',
              background: C.blue,
              color: '#fff',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}>Commencer gratuitement →</Link>
            <Link href="/compare" style={{
              padding: '12px 28px',
              background: 'transparent',
              color: C.text2,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              border: `1px solid ${C.border}`,
            }}>Comparer les règles</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
