'use client'
import Link from 'next/link'
import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'
import { getGuidesOrdered } from '../../lib/guides'

const C = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  border: 'var(--border)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
  green: 'var(--green)',
}

const CATEGORY_COLORS = {
  'Risk management': C.blue,
  'Règles': 'var(--violet)',
  'Guide PropFirm': 'var(--amber)',
  'Payouts': C.green,
  'CFD / Forex': '#22d3ee',
}

export default function GuidesIndexClient() {
  const guides = getGuidesOrdered()

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />
      <main style={{ flex: 1, padding: '60px 24px 80px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
            GUIDES PROPFIRM · 2026
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, marginBottom: 16 }}>
            Guides éducatifs PropFirm futures
          </h1>
          <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.6, maxWidth: 640, margin: '0 auto' }}>
            Trailing drawdown, consistency rule, payouts, comment passer Topstep : tous les fondamentaux,
            expliqués clairement et vérifiés mai 2026.
          </p>
        </div>

        {/* Guides list */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16,
          marginBottom: 56,
        }}>
          {guides.map((g) => {
            const color = CATEGORY_COLORS[g.category] || C.blue
            return (
              <Link key={g.slug} href={`/guides/${g.slug}`} style={{
                display: 'flex',
                flexDirection: 'column',
                padding: 22,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 14,
                textDecoration: 'none',
                color: C.text,
                transition: 'transform 0.15s, border-color 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color,
                  }}>
                    {g.category}
                  </span>
                  <span style={{ fontSize: 11, color: C.text3 }}>·</span>
                  <span style={{ fontSize: 11, color: C.text3 }}>{g.readingTime} min de lecture</span>
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3, margin: 0, marginBottom: 10, color: C.text }}>
                  {g.title}
                </h2>
                <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, margin: 0, flex: 1 }}>
                  {g.description}
                </p>
                <div style={{ marginTop: 14, fontSize: 12, color: C.blueLight, fontWeight: 600 }}>
                  Lire le guide →
                </div>
              </Link>
            )
          })}
        </div>

        {/* CTA */}
        <section style={{
          textAlign: 'center',
          padding: '40px 24px',
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 12 }}>
            Tracke tout ce que tu lis ici
          </h2>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, marginBottom: 22, lineHeight: 1.6 }}>
            Trailing drawdown, consistency, payouts : Quantara calcule tout automatiquement pour chaque
            PropFirm. Gratuit pendant la beta.
          </p>
          <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/auth?mode=signup" style={{
              padding: '12px 26px',
              background: C.blue,
              color: '#fff',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}>Commencer gratuitement →</Link>
            <Link href="/firms" style={{
              padding: '12px 26px',
              background: 'transparent',
              color: C.text2,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              border: `1px solid ${C.border}`,
            }}>Voir les PropFirms</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
