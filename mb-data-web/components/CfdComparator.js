'use client'
// components/CfdComparator.js — In-app CFD PropFirm RULES comparator.
// Rendered inside the /app/rules tab when the global marketMode is 'cfd'.
// Mirrors the FuturesRulesComparator visual language: a two-tier grouped table
// (CHALLENGE / FINANCÉ), one row per firm, compact full-width styling. Multi-model
// firms expose a per-firm model selector (flagship first) that re-derives the row's
// rules from getCfdModels(firm) — sub-models inherit firm-wide infra but only surface
// the rules their catalog entry states.
// READ-ONLY: renders only data from lib/cfdConstants.js + lib/cfdSlugs.js.
// Never mixes CFD with futures firms — driven solely by getCfdFirmsOrdered().
// '—' wherever a value is absent. No invented rules.

import { useState } from 'react'
import Link from 'next/link'
import { useT } from './LanguageProvider'
import {
  CFD_REPUTATION,
} from '../lib/cfdConstants'
import { getCfdFirmsOrdered, getCfdModelsFromFirm, CFD_FIRM_TAGLINE, cfdFirmToSlug } from '../lib/cfdSlugs'
import { useManagedCfdFirms } from '../lib/managedFirms'

// Inline "visually hidden" style (screen readers only).
const SR_ONLY = {
  position: 'absolute', width: 1, height: 1, overflow: 'hidden',
  clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
}

const C = {
  surface: 'var(--surface)',
  surface2: 'var(--surface2, rgba(255,255,255,0.025))',
  border: 'var(--border)',
  border2: 'var(--border2, rgba(255,255,255,0.05))',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--accent, #2d6fff)',
  amber: '#fac775',
  green: '#10b981',
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

// Reputation label/note: i18n key first (keyed by tier), constant (FR) as fallback.
function repLabel(t, tier, rep) {
  const key = `app.cfd.reputation.${tier}`
  const v = t(key)
  return v !== key ? v : rep?.label
}
function repNote(t, tier, rep) {
  const key = `app.cfd.reputation.${tier}Note`
  const v = t(key)
  return v !== key ? v : rep?.note
}

function ReputationBadge({ reputation }) {
  const t = useT()
  const rep = CFD_REPUTATION[reputation]
  if (!rep) return null
  return (
    <span
      title={repNote(t, reputation, rep)}
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
      {repLabel(t, reputation, rep)}
    </span>
  )
}

// === Cell value derivation (null-safe; '—' where absent) ====================

// Short drawdown-type label from the max-loss basis.
function ddTypeShort(f) {
  const b = f.maxLoss?.basis
  if (b === 'static') return 'Static'
  if (b === 'trailing-relative') return 'Trailing'
  if (b === 'eod-trailing') return 'EOD'
  return '—'
}

// Max drawdown (e.g. '10%').
function maxLossText(f) {
  const p = f.maxLoss?.pct
  return p === null || p === undefined ? '—' : `${p}%`
}

// Daily loss (e.g. '5%').
function dailyLossText(f) {
  const p = f.dailyLoss?.pct
  return p === null || p === undefined ? '—' : `${p}%`
}

// Profit targets joined (e.g. '8% / 5%').
function profitTargetsText(f) {
  return Array.isArray(f.profitTargets) && f.profitTargets.length
    ? f.profitTargets.map((p) => `${p}%`).join(' / ')
    : '—'
}

// Consistency — short text + full text in title tooltip (truncate long sentences).
function consistencyCell(f) {
  const raw = f.consistency
  if (raw === null || raw === undefined || raw === '') return { text: '—', title: '' }
  const full = String(raw)
  const text = full.length > 22 ? full.slice(0, 21).trimEnd() + '…' : full
  return { text, title: full !== text ? full : '' }
}

// Profit split 'from–to%' (or single '%' when from===to).
function splitText(f) {
  const s = f.profitSplit
  if (!s || s.from === null || s.from === undefined) return '—'
  if (s.to === null || s.to === undefined || s.from === s.to) return `${s.from}%`
  return `${s.from}–${s.to}%`
}

// Min trading days (integer; else '—').
function minDaysText(f) {
  const d = f.minTradingDays
  return d === null || d === undefined ? '—' : String(d)
}

// Short payout summary from payout.cycle; prepend 'J+N · ' when firstDays present.
// Full payout object detail goes into the title tooltip. Fragments are i18n'd
// (app.cfd.comparator.dayPlus / tipFirstPayout / tipCycle / tipMin).
function payoutCell(f, t) {
  const p = f.payout
  if (!p) return { text: '—', title: '' }
  const cycle = p.cycle === null || p.cycle === undefined || p.cycle === '' ? '' : String(p.cycle)
  const short = cycle.length > 18 ? cycle.slice(0, 17).trimEnd() + '…' : cycle
  let text = short
  if (p.firstDays !== null && p.firstDays !== undefined) {
    text = `${t('app.cfd.comparator.dayPlus')}${p.firstDays}${short ? ' · ' + short : ''}`
  }
  if (!text) text = '—'
  // Build full tooltip from the payout object detail.
  const parts = []
  if (p.firstDays !== null && p.firstDays !== undefined) parts.push(`${t('app.cfd.comparator.tipFirstPayout')}${p.firstDays}`)
  if (cycle) parts.push(`${t('app.cfd.comparator.tipCycle')} ${cycle}`)
  if (p.min !== null && p.min !== undefined && p.min !== '') parts.push(`${t('app.cfd.comparator.tipMin')} ${p.min}`)
  const title = parts.join(' · ')
  return { text, title: title !== text ? title : '' }
}

// === Column definitions (array-derived colSpans so they can't drift) ========
// Labels are i18n keys under app.cfd.comparator.*.
// CHALLENGE group (5) — each maps from the firm's flagship.
const CHALLENGE_COLS = [
  { key: 'type', labelKey: 'colType' },
  { key: 'drawdown', labelKey: 'colDrawdown' },
  { key: 'dailyLoss', labelKey: 'colDailyLoss' },
  { key: 'objectif', labelKey: 'colProfitTarget' },
  { key: 'consistance', labelKey: 'colConsistency' },
]
// FINANCÉ group (3).
const FUNDED_COLS = [
  { key: 'split', labelKey: 'colSplit' },
  { key: 'jourMin', labelKey: 'colMinDays' },
  { key: 'payout', labelKey: 'colPayout' },
]
// Total columns: 1 + CHALLENGE_COLS.length (5) + FUNDED_COLS.length (3) = 9.

export default function CfdComparator() {
  const t = useT()
  const managed = useManagedCfdFirms()
  // A custom firm with a static firm's name OVERRIDES it (edit-existing), not duplicates.
  const managedNames = new Set(managed.map(f => f.name))
  const firms = [...getCfdFirmsOrdered().filter(f => !managedNames.has(f.name)), ...managed]

  // Displayed model per firm (multi-model firms). Key = firm name, value = index
  // into getCfdModels(firm). Default = 0 (flagship) when unset. Mirrors the futures
  // comparator's modelByFirm.
  const [modelByFirm, setModelByFirm] = useState({})

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

      {/* Grouped comparison table : PROPFIRM | CHALLENGE (5) | FINANCÉ (3) */}
      <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 14, background: C.surface }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse', minWidth: 820,
          tableLayout: 'auto', fontSize: 12, color: C.text,
        }}>
          <thead>
            <tr>
              <th rowSpan={2} scope="col" style={groupHeadCell('left')}>{t('app.cfd.comparator.colFirm')}</th>
              <th colSpan={CHALLENGE_COLS.length} scope="colgroup" style={{
                ...groupHeadCell(),
                color: C.amber, borderLeft: `1px solid ${C.border2}`,
              }}>{t('app.cfd.comparator.groupChallenge')}</th>
              <th colSpan={FUNDED_COLS.length} scope="colgroup" style={{
                ...groupHeadCell(),
                color: C.green, borderLeft: `1px solid ${C.border2}`,
              }}>{t('app.cfd.comparator.groupFunded')}</th>
            </tr>
            <tr>
              {CHALLENGE_COLS.map((col, i) => (
                <th key={'c-' + col.key} scope="col" style={{
                  ...subHeadCell(),
                  borderLeft: i === 0 ? `1px solid ${C.border2}` : undefined,
                }}>{t(`app.cfd.comparator.${col.labelKey}`)}</th>
              ))}
              {FUNDED_COLS.map((col, i) => (
                <th key={'f-' + col.key} scope="col" style={{
                  ...subHeadCell(),
                  borderLeft: i === 0 ? `1px solid ${C.border2}` : undefined,
                }}>{t(`app.cfd.comparator.${col.labelKey}`)}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {firms.map((firm, firmIdx) => {
              const models = getCfdModelsFromFirm(firm)
              const multi = models.length > 1
              const selIdx = Math.min(modelByFirm[firm.name] ?? 0, Math.max(models.length - 1, 0))
              // Selected model (flagship at index 0). Its rules come from the catalog:
              // sub-models inherit firm-wide infra but only expose rules they state.
              const f = models[selIdx] || firm.flagship || {}
              const slug = firm.slug || cfdFirmToSlug(firm.name)
              const color = CFD_REPUTATION[firm.reputation]?.color || C.blue
              const rowBg = firmIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'

              const consistance = consistencyCell(f)
              const payout = payoutCell(f, t)

              // CHALLENGE cells (text + optional tooltip), order matches CHALLENGE_COLS.
              const challengeCells = [
                { text: ddTypeShort(f), title: '' },
                { text: maxLossText(f), title: '' },
                { text: dailyLossText(f), title: '' },
                { text: profitTargetsText(f), title: '' },
                consistance,
              ]
              // FINANCÉ cells, order matches FUNDED_COLS.
              const fundedCells = [
                { text: splitText(f), title: '' },
                { text: minDaysText(f), title: '' },
                payout,
              ]

              return (
                <tr key={slug} style={{
                  background: rowBg,
                  borderTop: `1px solid ${C.border2}`,
                  verticalAlign: 'top',
                }}>
                  {/* Firm cell : avatar + name (link) + reputation badge + flagship model */}
                  <td style={{
                    padding: '8px 10px', verticalAlign: 'top',
                    borderRight: `1px solid ${C.border2}`,
                    minWidth: 170, background: C.surface,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {firm.logoUrl
                        ? <img src={firm.logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                        : <InitialAvatar name={firm.name} color={color} size={28} />}
                      <div style={{ minWidth: 0 }}>
                        {firm.__custom ? (
                          // Custom firms have no public /cfd/[slug] SSG page → plain label.
                          <span title={firm.tagline || undefined} style={{ color: C.text, fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{firm.name}</span>
                        ) : (
                          <Link
                            href={`/cfd/${slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={CFD_FIRM_TAGLINE[firm.name] || undefined}
                            style={{ color: C.text, fontWeight: 700, textDecoration: 'none', fontSize: 13, lineHeight: 1.2 }}
                          >
                            {firm.name}
                          </Link>
                        )}
                        <div style={{ marginTop: 4 }}><ReputationBadge reputation={firm.reputation} /></div>
                        {/* Single model → label. Multi → selector (switches the row's
                            rules to that sub-model). Selected model's FR summary sits in
                            title= as a tooltip. */}
                        {!multi && f.name && (
                          <div style={{
                            fontSize: 10, color: C.text3, fontWeight: 600,
                            marginTop: 5, letterSpacing: '0.03em', textTransform: 'uppercase',
                            maxWidth: 170, lineHeight: 1.3,
                          }}>{f.name}</div>
                        )}
                        {multi && (
                          <select
                            value={selIdx}
                            onChange={(e) => setModelByFirm((prev) => ({ ...prev, [firm.name]: Number(e.target.value) }))}
                            aria-label={t('app.cfd.comparator.modelSelectAria').replace('{firm}', firm.name)}
                            title={f.desc || undefined}
                            style={{
                              marginTop: 6, maxWidth: 168,
                              fontSize: 11, fontFamily: 'inherit', fontWeight: 600,
                              color: C.blue, cursor: 'pointer',
                              background: C.surface2, border: `1px solid ${C.border2}`,
                              borderRadius: 7, padding: '4px 8px', minHeight: 32,
                            }}>
                            {models.map((m, i) => (
                              <option key={m.name || i} value={i} style={{ color: C.text, background: C.surface }}>
                                {m.name}{m.isFlagship ? ` · ${t('app.cfd.comparator.flagshipTag')}` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* CHALLENGE data cells */}
                  {challengeCells.map((cell, ci) => (
                    <DataCell key={'c-' + CHALLENGE_COLS[ci].key} cell={cell} firstOfGroup={ci === 0} />
                  ))}
                  {/* FINANCÉ data cells */}
                  {fundedCells.map((cell, ci) => (
                    <DataCell key={'f-' + FUNDED_COLS[ci].key} cell={cell} firstOfGroup={ci === 0} />
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: C.text3, marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
        {t('app.cfd.comparator.footnote')} {' '}
        {t('app.cfd.comparator.hoverHint')}
      </p>
    </div>
  )
}

// === Data cell =============================================================
function DataCell({ cell, firstOfGroup }) {
  const text = cell && cell.text ? cell.text : '—'
  const title = cell && cell.title ? cell.title : ''
  // Truncated cell: keep the mouse tooltip (title=) and also expose the full
  // rule to screen readers through a visually-hidden span.
  const truncated = !!title && title !== text
  return (
    <td
      title={title || undefined}
      style={{
        padding: '8px 9px', whiteSpace: 'nowrap',
        verticalAlign: 'top',
        borderLeft: firstOfGroup ? `1px solid ${C.border2}` : `1px solid ${C.border}`,
        color: text === '—' ? C.text3 : C.text2,
        cursor: title ? 'help' : 'default',
      }}>
      <div aria-hidden={truncated || undefined}>{text}</div>
      {truncated && <span style={SR_ONLY}>{title}</span>}
    </td>
  )
}

// === Header styles =========================================================
function groupHeadCell(align) {
  return {
    padding: '10px 10px',
    fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: C.text2,
    textAlign: align === 'left' ? 'left' : 'center',
    background: C.surface2,
    borderBottom: `1px solid ${C.border2}`,
  }
}
function subHeadCell() {
  return {
    padding: '8px 9px',
    fontSize: 10, fontWeight: 600, letterSpacing: '0.03em',
    textTransform: 'uppercase',
    color: C.text3, textAlign: 'left', lineHeight: 1.2,
    background: C.surface2,
    borderBottom: `1px solid ${C.border2}`,
  }
}
