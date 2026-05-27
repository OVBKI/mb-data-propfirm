'use client'
import Link from 'next/link'
import PageHeader from './PageHeader'
import Footer from './Footer'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  red: '#e8504a',
  amber: '#fac775',
}

export default function ComparisonPage({ title, subtitle, quantaraName, competitorName, rows, verdict, ctaText, ctaButton }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />
      <main style={{ flex: 1, padding: '60px 24px 80px', maxWidth: 860, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
            COMPARISON
          </div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0, marginBottom: 12 }}>
            {title}
          </h1>
          <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
            {subtitle}
          </p>
        </div>

        {/* Comparison table */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
          overflow: 'hidden', marginBottom: 32,
        }}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            borderBottom: `1px solid ${C.border}`,
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ padding: '14px 18px', fontSize: 12, color: C.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Feature</div>
            <div style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: C.blueLight, textAlign: 'center' }}>{quantaraName}</div>
            <div style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: C.text2, textAlign: 'center' }}>{competitorName}</div>
          </div>

          {/* Data rows */}
          {rows.map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <div style={{ padding: '12px 18px', fontSize: 13, color: C.text2 }}>{row.feature}</div>
              <div style={{ padding: '12px 18px', fontSize: 13, textAlign: 'center', color: row.quantaraWins ? C.green : C.text }}>
                {row.quantara}
              </div>
              <div style={{ padding: '12px 18px', fontSize: 13, textAlign: 'center', color: row.competitorWins ? C.green : C.text3 }}>
                {row.competitor}
              </div>
            </div>
          ))}
        </div>

        {/* Verdict */}
        <div style={{
          padding: '24px', background: `${C.blue}08`, border: `1px solid ${C.blue}20`,
          borderRadius: 14, marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 12 }}>Verdict</h2>
          <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, margin: 0 }}>{verdict}</p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '32px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14 }}>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, marginBottom: 16, lineHeight: 1.6 }}>{ctaText}</p>
          <Link href="/app" style={{
            display: 'inline-block', padding: '12px 28px',
            background: C.blue, color: '#fff', borderRadius: 8,
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}>{ctaButton}</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
