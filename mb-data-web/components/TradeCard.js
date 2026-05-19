'use client'
// components/TradeCard.js — Carte verticale pour 1 trade (style TradeZella).
//
// USAGE :
//   <TradeCard
//     entry={entry}
//     accountLabel="Topstep · PRO 1"
//     firmColor="#e8504a"
//     onEdit={() => openEdit(entry)}
//     onLightbox={url => setLightboxUrl(url)}
//   />
//
// Affichage compact mais riche :
//   Header   : Date · Instrument · Side badge · PnL (gros, coloré)
//   Sous-tit : Compte · Firme color dot
//   Si screenshot : thumb 80×80 à gauche
//   Body     : 4 prix (Entry / Exit / SL / TP) en grid
//   Metrics  : R réalisé · R:R visé · Win/Loss badge
//   Tags     : badges colorés
//   Notes    : italic gris
//   Actions  : Edit (bouton crayon discret)

import { TagDisplay } from './TagSelector'
import { computeRMultiple, computeRiskReward, formatR, formatRR } from '../lib/tradeMath'
import { useT } from './LanguageProvider'

function fmtMoney(n, dec = 2) {
  const v = Number(n) || 0
  return (v >= 0 ? '+' : '') + v.toFixed(dec) + ' $'
}

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const C = {
  surface:  'rgba(20,23,32,0.65)',
  surface2: 'rgba(28,32,48,0.7)',
  border:   'rgba(255,255,255,0.07)',
  text:     '#f0ede8',
  text2:    '#9098b0',
  text3:    '#5a6275',
  green:    '#1db87a',
  red:      '#e8504a',
  amber:    '#fac775',
  blue:     '#2d6fff',
  blueLt:   '#4d8fff',
}

export default function TradeCard({ entry, accountLabel, firmColor, onEdit, onLightbox }) {
  const t = useT()
  const e = entry
  const pnl = Number(e.pnl) || 0
  const isWin = pnl > 0
  const isBreak = pnl === 0

  const r = computeRMultiple({
    entry: e.entry_price, exit: e.exit_price, stop: e.stop_loss,
    side: e.side, pnl: e.pnl,
  })
  const rr = computeRiskReward({
    entry: e.entry_price, takeProfit: e.take_profit, stop: e.stop_loss,
    side: e.side, pnl: e.pnl, exit: e.exit_price,
  })

  // Prix : on affiche uniquement ceux renseignés. `key` reste stable (React key),
  // `label` est traduit pour l'affichage.
  const prices = [
    { key: 'entry', label: t('app.trade.cardEntry'),  value: e.entry_price,  icon: '📍', color: C.text2 },
    { key: 'exit',  label: t('app.trade.cardExit'),   value: e.exit_price,   icon: '🏁', color: C.text2 },
    { key: 'stop',  label: t('app.trade.cardStop'),   value: e.stop_loss,    icon: '🛡', color: C.red },
    { key: 'tp',    label: t('app.trade.cardTP'),     value: e.take_profit,  icon: '🎯', color: C.green },
  ].filter(p => p.value != null && p.value !== '')

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: 16,
      boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)',
      position: 'relative',
      transition: 'border-color 0.2s, transform 0.2s',
    }}
      onMouseEnter={ev => { ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)' }}
      onMouseLeave={ev => { ev.currentTarget.style.borderColor = C.border }}
    >
      {/* === Header : Date + Instrument + Side + PnL === */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: C.text3, fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
            {fmtDate(e.date)}
          </span>
          {e.instrument && (
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '-0.005em' }}>
              {e.instrument}
            </span>
          )}
          {e.side && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: e.side === 'Long' ? 'rgba(29,184,122,0.15)' : 'rgba(232,80,74,0.15)',
              color: e.side === 'Long' ? C.green : C.red,
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              {e.side === 'Long' ? `↑ ${t('app.trade.sideLong')}` : `↓ ${t('app.trade.sideShort')}`}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 16, fontWeight: 800,
            color: isWin ? C.green : isBreak ? C.text3 : C.red,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            letterSpacing: '-0.015em',
          }}>
            {fmtMoney(pnl)}
          </span>
          <button
            onClick={onEdit}
            title={t('app.trade.modalEditTitle')}
            style={{
              padding: '4px 8px', fontSize: 11,
              background: 'rgba(255,255,255,0.04)', color: C.text2,
              border: `1px solid ${C.border}`, borderRadius: 6,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={ev => { ev.currentTarget.style.color = C.text; ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={ev => { ev.currentTarget.style.color = C.text2; ev.currentTarget.style.borderColor = C.border }}
          >
            ✏
          </button>
        </div>
      </div>

      {/* === Sous-header : compte === */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: firmColor || C.text3,
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 10, color: C.text3, fontWeight: 500 }}>
          {accountLabel || 'Compte supprimé'}
        </span>
      </div>

      {/* === Layout principal : screenshot à gauche + détails à droite === */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Thumbnail screenshot (optionnel) */}
        {e.screenshot_url && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={e.screenshot_url}
              alt="Screenshot trade"
              onClick={() => onLightbox?.(e.screenshot_url)}
              style={{
                width: 96, height: 96, objectFit: 'cover',
                borderRadius: 8, border: `1px solid ${C.border}`,
                cursor: 'zoom-in',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={ev => ev.currentTarget.style.opacity = '0.85'}
              onMouseLeave={ev => ev.currentTarget.style.opacity = '1'}
            />
          </div>
        )}

        {/* Détails à droite */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Prix grid */}
          {prices.length > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 6, marginBottom: 10,
            }}>
              {prices.map(p => (
                <div key={p.key} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 8px',
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  fontSize: 10,
                }}>
                  <span style={{ opacity: 0.7 }}>{p.icon}</span>
                  <span style={{ color: C.text3, fontWeight: 600 }}>{p.label}</span>
                  <span style={{
                    marginLeft: 'auto', color: p.color, fontWeight: 700,
                    fontFamily: 'ui-monospace, monospace',
                  }}>
                    {p.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Metrics ligne : R + R:R + commissions */}
          {(() => {
            const comm = Number(e.commissions) || 0
            const slip = Number(e.slippage) || 0
            const hasMetrics = r != null || rr != null || comm > 0 || slip > 0
            if (!hasMetrics) return null
            return (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 8,
                padding: '6px 10px', marginBottom: 8,
                background: 'rgba(45,111,255,0.04)',
                border: '1px solid rgba(45,111,255,0.15)',
                borderRadius: 6,
              }}>
                {r != null && (
                  <span style={{ fontSize: 11, color: C.text3 }}>
                    📐 R : <strong style={{ color: r >= 0 ? C.green : C.red, fontFamily: 'ui-monospace, monospace' }}>{formatR(r)}</strong>
                  </span>
                )}
                {rr != null && (
                  <span style={{ fontSize: 11, color: C.text3 }}>
                    ⚖ R:R : <strong style={{ color: rr >= 2 ? C.green : rr >= 1 ? C.amber : C.red, fontFamily: 'ui-monospace, monospace' }}>{formatRR(rr)}</strong>
                  </span>
                )}
                {comm > 0 && (
                  <span style={{ fontSize: 11, color: C.text3 }} title="Commissions payées sur ce trade">
                    💸 Comm : <strong style={{ color: C.red, fontFamily: 'ui-monospace, monospace' }}>−${comm.toFixed(2)}</strong>
                  </span>
                )}
                {slip > 0 && (
                  <span style={{ fontSize: 11, color: C.text3 }} title="Slippage estimé sur ce trade">
                    ⤵ Slip : <strong style={{ color: C.red, fontFamily: 'ui-monospace, monospace' }}>−${slip.toFixed(2)}</strong>
                  </span>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      {/* === Tags === */}
      {Array.isArray(e.tags) && e.tags.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <TagDisplay tags={e.tags} compact />
        </div>
      )}

      {/* === Notes === */}
      {e.notes && (
        <div style={{
          fontSize: 11, color: C.text2, fontStyle: 'italic',
          marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`,
          lineHeight: 1.5,
        }}>
          {e.notes}
        </div>
      )}
    </div>
  )
}
