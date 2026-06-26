'use client'
// components/CfdComparator.js — In-app CFD PropFirm comparator.
// Rendered inside the /app/rules tab when the global marketMode is 'cfd'.
// Mirrors the public app/cfd/CfdIndexClient.js comparison table, but as an in-app
// component (no PageHeader/Footer) using the app theme CSS vars + i18n.
// READ-ONLY: renders only data from lib/cfdConstants.js + lib/cfdSlugs.js.
// Never mixes CFD with futures firms — driven solely by getCfdFirmsOrdered().

import Link from 'next/link'
import { useT } from './LanguageProvider'
import {
  CFD_REPUTATION,
  CFD_DAILY_BASIS_LABEL,
  CFD_MAX_BASIS_LABEL,
} from '../lib/cfdConstants'
import { getCfdFirmsOrdered, CFD_FIRM_TAGLINE, cfdFirmToSlug } from '../lib/cfdSlugs'

const C = {
  surface: 'var(--surface)',
  surface2: 'var(--surface2, rgba(255,255,255,0.025))',
  border: 'var(--border)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--accent, #2d6fff)',
  amber: '#fac775',
}

// Simple initial avatar (no CFD logos available — same approach as the public page).
function InitialAvatar({ name, color, size = 34 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 10,
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

function ReputationBadge({ reputation }) {
  const rep = CFD_REPUTATION[reputation]
  if (!rep) return null
  return (
    <span
      title={rep.note}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color: rep.color,
        background: `${rep.color}1f`,
        border: `1px solid ${rep.color}55`,
        whiteSpace: 'nowrap',
      }}
    >
      {rep.label}
    </span>
  )
}

function dash(v) {
  return v === null || v === undefined || v === '' ? '—' : v
}

function profitTargetsText(f) {
  return Array.isArray(f.profitTargets) && f.profitTargets.length
    ? f.profitTargets.map((p) => `${p}%`).join(' / ')
    : '—'
}

function splitText(f) {
  const s = f.profitSplit
  if (!s || s.from === null || s.from === undefined) return '—'
  if (s.to === null || s.to === undefined || s.from === s.to) return `${s.from}%`
  return `${s.from}–${s.to}%`
}

function platformsText(firm) {
  return Array.isArray(firm.platforms) && firm.platforms.length
    ? firm.platforms.join(', ')
    : '—'
}

export default function CfdComparator() {
  const t = useT()
  const firms = getCfdFirmsOrdered()

  const headers = [
    t('app.cfd.comparator.colFirm'),
    t('app.cfd.comparator.colModel'),
    t('app.cfd.comparator.colSteps'),
    t('app.cfd.comparator.colProfitTarget'),
    t('app.cfd.comparator.colDailyLoss'),
    t('app.cfd.comparator.colMaxLoss'),
    t('app.cfd.comparator.colSplit'),
    t('app.cfd.comparator.colPlatforms'),
  ]

  const cellStyle = {
    padding: '14px',
    borderBottom: `1px solid ${C.border}`,
    color: C.text2,
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', width: '100%' }}>
      {/* Header / intro */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, margin: 0, marginBottom: 10, letterSpacing: '-0.02em', color: C.text }}>
          {t('app.cfd.comparator.title')}
        </h1>
        <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, margin: 0, maxWidth: 760 }}>
          {t('app.cfd.comparator.intro')}
        </p>
      </div>

      {/* Notices */}
      <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
        <div style={{
          padding: '12px 16px',
          background: 'rgba(250,199,117,0.07)',
          border: `1px solid ${C.amber}44`,
          borderRadius: 10,
          fontSize: 13,
          color: C.text2,
          lineHeight: 1.5,
        }}>
          <strong style={{ color: C.amber }}>{t('app.cfd.comparator.noticePricesStrong')}</strong>{' '}
          {t('app.cfd.comparator.noticePrices')}
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
          {t('app.cfd.comparator.noticeDisclaimer')}
        </div>
      </div>

      {/* Comparison table (horizontally scrollable on small screens) */}
      <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 14, background: C.surface }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980, fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              {headers.map((h) => (
                <th key={h} style={{
                  padding: '12px 14px',
                  borderBottom: `1px solid ${C.border}`,
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.text3,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {firms.map((firm) => {
              const f = firm.flagship || {}
              const slug = firm.slug || cfdFirmToSlug(firm.name)
              const color = CFD_REPUTATION[firm.reputation]?.color || C.blue
              return (
                <tr key={slug} style={{ verticalAlign: 'top' }}>
                  <td style={{ padding: '14px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <InitialAvatar name={firm.name} color={color} size={34} />
                      <div style={{ minWidth: 0 }}>
                        <Link
                          href={`/cfd/${slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: C.text, fontWeight: 700, textDecoration: 'none' }}
                        >
                          {firm.name}
                        </Link>
                        <div style={{ marginTop: 4 }}><ReputationBadge reputation={firm.reputation} /></div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 5, maxWidth: 220, lineHeight: 1.4 }}>
                          {CFD_FIRM_TAGLINE[firm.name] || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={cellStyle}>{dash(f.model)}</td>
                  <td style={cellStyle}>{dash(f.steps)}</td>
                  <td style={cellStyle}>{profitTargetsText(f)}</td>
                  <td style={cellStyle}>
                    {f.dailyLoss ? (
                      <>
                        <strong style={{ color: C.text }}>{f.dailyLoss.pct}%</strong>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                          {CFD_DAILY_BASIS_LABEL[f.dailyLoss.basis] || f.dailyLoss.basis}
                        </div>
                      </>
                    ) : '—'}
                  </td>
                  <td style={cellStyle}>
                    {f.maxLoss ? (
                      <>
                        <strong style={{ color: C.text }}>{f.maxLoss.pct}%</strong>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                          {CFD_MAX_BASIS_LABEL[f.maxLoss.basis] || f.maxLoss.basis}
                        </div>
                      </>
                    ) : '—'}
                  </td>
                  <td style={cellStyle}>{splitText(f)}</td>
                  <td style={cellStyle}>{platformsText(firm)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 12, color: C.text3, marginTop: 10, marginBottom: 0 }}>
        {t('app.cfd.comparator.footnote')}
      </p>
    </div>
  )
}
