'use client'
import { useState } from 'react'
import Link from 'next/link'
import PageHeader from '../../../components/PageHeader'
import Footer from '../../../components/Footer'
import {
  CFD_REPUTATION,
  CFD_DAILY_BASIS_LABEL,
  CFD_MAX_BASIS_LABEL,
} from '../../../lib/cfdConstants'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#7b839b',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
  red: '#e8504a',
}

function InitialAvatar({ name, color, size = 56 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        fontWeight: 800,
        color: '#fff',
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        border: `1px solid ${color}55`,
      }}
    >
      {initial}
    </div>
  )
}

function dash(v) {
  return v === null || v === undefined || v === '' ? '—' : v
}

function MetaCard({ label, children }) {
  return (
    <div style={{ padding: '14px 16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
      <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: C.text, lineHeight: 1.4, wordBreak: 'break-word' }}>
        {children}
      </div>
    </div>
  )
}

export default function CfdFirmClient({ firmName, firm, slug, tagline, faqs }) {
  const rep = CFD_REPUTATION[firm.reputation]
  const color = rep?.color || C.blue
  const f = firm.flagship || {}

  const splitStr = f.profitSplit
    ? (f.profitSplit.from === f.profitSplit.to ? `${f.profitSplit.from}%` : `${f.profitSplit.from}–${f.profitSplit.to}%`)
    : '—'

  const leverageEntries = f.leverage ? Object.entries(f.leverage) : []
  const priceText = f.priceIndicative?.note || (
    f.priceIndicative
      ? Object.entries(f.priceIndicative)
        .filter(([k]) => k !== 'note' && k !== 'confidence')
        .map(([k, v]) => `${k} = $${v}`)
        .join(', ')
      : null
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader active="cfd" />
      <main style={{ flex: 1, padding: '40px 24px 80px', maxWidth: 980, margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: C.text3, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: C.text3, textDecoration: 'none' }}>Accueil</Link>
          <span>›</span>
          <Link href="/cfd" style={{ color: C.text3, textDecoration: 'none' }}>PropFirms CFD</Link>
          <span>›</span>
          <span style={{ color: C.text2 }}>{firmName}</span>
        </nav>

        {/* Hero */}
        <header style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <InitialAvatar name={firmName} color={color} size={56} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
                PROPFIRM CFD · JUIN 2026
              </div>
              <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0 }}>
                {firmName} — Règles CFD 2026
              </h1>
            </div>
          </div>
          <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.6, margin: 0, marginBottom: 14 }}>{tagline}</p>

          {/* Reputation block */}
          {rep && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 16px',
              background: `${color}12`,
              border: `1px solid ${color}44`,
              borderRadius: 10,
            }}>
              <span style={{
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                color: color,
                background: `${color}22`,
                border: `1px solid ${color}55`,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>{rep.label}</span>
              <span style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>
                {firm.reputationNote || rep.note}
              </span>
            </div>
          )}
        </header>

        {/* Notices */}
        <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
          <div style={{
            padding: '12px 16px',
            background: 'rgba(250,199,117,0.07)',
            border: `1px solid ${C.amber}44`,
            borderRadius: 10,
            fontSize: 13,
            color: C.text2,
            lineHeight: 1.5,
          }}>
            <strong style={{ color: C.amber }}>Prix indicatifs.</strong>{' '}
            Vérifie toujours les tarifs et conditions sur le site officiel de la firme avant d’acheter.
          </div>
          <div style={{
            padding: '12px 16px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            fontSize: 13,
            color: C.text3,
            lineHeight: 1.5,
          }}>
            Quantara est un outil de journalisation et d’analyse, pas un conseil financier. Les règles
            des PropFirms changent fréquemment — vérifie toujours les conditions officielles.
          </div>
        </div>

        {/* Top metadata grid */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 36,
        }}>
          <MetaCard label="Pays / HQ">{dash(firm.country)}</MetaCard>
          <MetaCard label="Site officiel">
            {firm.website ? (
              <a href={firm.website} target="_blank" rel="noopener noreferrer nofollow" style={{ color: C.blueLight, textDecoration: 'none' }}>
                {firm.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            ) : '—'}
          </MetaCard>
          <MetaCard label="Plateformes">{firm.platforms?.length ? firm.platforms.join(', ') : '—'}</MetaCard>
          <MetaCard label="Instruments">{firm.instruments?.length ? firm.instruments.join(', ') : '—'}</MetaCard>
        </section>

        {/* Flagship model detail */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 6 }}>
            Modèle phare — {dash(f.model)}
          </h2>
          <p style={{ fontSize: 13, color: C.text3, marginTop: 0, marginBottom: 18 }}>
            Source : documentation officielle {firmName}, vérifiée {dash(firm.verified)}.
          </p>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
            {[
              { label: 'Étapes', value: dash(f.steps) },
              { label: 'Tailles de compte', value: f.accountSizes?.length ? f.accountSizes.map((s) => `$${s.toLocaleString('en-US')}`).join(', ') : '—' },
              { label: 'Devise', value: dash(f.currency) },
              { label: 'Profit target', value: f.profitTargets?.length ? f.profitTargets.map((p) => `${p}%`).join(' / ') : '—' },
              { label: 'Daily loss', value: f.dailyLoss ? `${f.dailyLoss.pct}% — ${CFD_DAILY_BASIS_LABEL[f.dailyLoss.basis] || f.dailyLoss.basis}` : '—' },
              { label: 'Max loss', value: f.maxLoss ? `${f.maxLoss.pct}% — ${CFD_MAX_BASIS_LABEL[f.maxLoss.basis] || f.maxLoss.basis}` : '—' },
              { label: 'Jours de trading min.', value: (f.minTradingDays === 0 || f.minTradingDays) ? f.minTradingDays : '—' },
              { label: 'Profit split', value: splitStr },
              { label: 'Payout', value: f.payout ? `${f.payout.firstDays ? `1er à J+${f.payout.firstDays}, ` : ''}cycle : ${dash(f.payout.cycle)}${f.payout.min ? `, min : ${f.payout.min}` : ''}` : '—' },
              { label: 'Consistency', value: dash(f.consistency) },
              { label: 'Refundable', value: f.refundable === true ? 'Oui (remboursé avec le 1er payout)' : f.refundable === false ? 'Non' : '—' },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(160px, 220px) 1fr',
                gap: 16,
                padding: '12px 18px',
                borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text2 }}>{row.label}</div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{row.value}</div>
              </div>
            ))}
          </div>

          {/* Leverage */}
          {leverageEntries.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, marginBottom: 10, color: C.text2 }}>Levier</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {leverageEntries.map(([k, v]) => (
                  <span key={k} style={{
                    padding: '6px 12px',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: C.text2,
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>{k}</span> : <strong style={{ color: C.text }}>1:{v}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Indicative price */}
          {priceText && (
            <div style={{ marginTop: 16, padding: '12px 16px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                Prix indicatif
              </div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                {priceText}
                <span style={{ color: C.amber, fontWeight: 600 }}> · indicatif — vérifier sur le site officiel</span>
              </div>
            </div>
          )}
        </section>

        {/* Other models */}
        {firm.otherModels?.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 14 }}>Autres modèles</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {firm.otherModels.map((m, i) => (
                <li key={i} style={{
                  padding: '10px 14px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  color: C.text2,
                  lineHeight: 1.5,
                }}>{m}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Notable */}
        {firm.notable && (
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 12 }}>À noter</h2>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 22px', fontSize: 14, color: C.text2, lineHeight: 1.7 }}>
              {firm.notable}
            </div>
          </section>
        )}

        {/* FAQs */}
        {faqs?.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 18 }}>FAQ — {firmName}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {faqs.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </section>
        )}

        {/* Sources */}
        {firm.sources?.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 12 }}>
              Sources (vérifié {dash(firm.verified)})
            </h2>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {firm.sources.map((s, i) => {
                const href = s.startsWith('http') ? s : `https://${s.split(' ')[0]}`
                return (
                  <li key={i} style={{ fontSize: 12, color: C.text3, lineHeight: 1.5 }}>
                    <a href={href} target="_blank" rel="noopener noreferrer nofollow" style={{ color: C.blueLight, textDecoration: 'none' }}>
                      {s}
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* CTA + cross-links */}
        <section style={{ textAlign: 'center', padding: '32px 24px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 10 }}>
            Track ton compte {firmName} avec Quantara
          </h2>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, marginBottom: 22, lineHeight: 1.6 }}>
            Journalise tes trades et garde un œil sur ton drawdown et ta consistency. Setup en 90s, gratuit pendant la beta.
          </p>
          <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/auth?mode=signup" style={{
              padding: '12px 26px', background: C.blue, color: '#fff', borderRadius: 8,
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>Commencer gratuitement →</Link>
            <Link href="/demo" style={{
              padding: '12px 26px', background: 'transparent', color: C.text2, borderRadius: 8,
              fontSize: 14, fontWeight: 600, textDecoration: 'none', border: `1px solid ${C.border}`,
            }}>Voir la démo</Link>
          </div>
        </section>

        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Link href="/cfd" style={{
            padding: '8px 14px', background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, fontSize: 13, color: C.blueLight, textDecoration: 'none',
          }}>← Toutes les PropFirms CFD</Link>
          <Link href="/firms" style={{
            padding: '8px 14px', background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, fontSize: 13, color: C.text2, textDecoration: 'none',
          }}>PropFirms futures →</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%', padding: '14px 18px', background: 'transparent', border: 'none',
          textAlign: 'left', color: C.text, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}
      >
        <span>{q}</span>
        <span style={{ color: C.text3, fontSize: 18, lineHeight: 1, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>+</span>
      </button>
      {open && (
        <div style={{
          padding: '0 18px 16px', fontSize: 13, color: C.text2, lineHeight: 1.7,
          borderTop: `1px solid ${C.border}`, paddingTop: 14,
        }}>
          {a}
        </div>
      )}
    </div>
  )
}
