'use client'
// Drawdown Health Card — visual fuel gauge per funded account.
// Color codes:
//   > 70% room  → green  (safe)
//   50-70%      → amber  (caution)
//   < 50%       → red    (danger zone)
//   no data     → grey   (need balance + dd_floor)

import { planSizeNum, maxDrawdown } from '../../lib/constants'
import { getFirmLogo } from '../../lib/firmLogos'
import { FIRM_SUGGESTION_COLORS } from '../../lib/constants'

const C = {
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  border: 'var(--border)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  grey: '#565e78',
}

function statusColor(roomPct) {
  if (roomPct == null) return C.grey
  if (roomPct >= 0.7) return C.green
  if (roomPct >= 0.5) return C.amber
  return C.red
}

function statusLabel(roomPct) {
  if (roomPct == null) return 'Pas de data'
  if (roomPct >= 0.7) return 'Safe'
  if (roomPct >= 0.5) return 'Caution'
  if (roomPct >= 0.15) return 'Danger zone'
  return 'Compte critique'
}

export default function DrawdownHealthCard({ account, firmName }) {
  const initialBalance = planSizeNum(account.plan_size)
  const balance = account.balance
  const ddFloor = account.dd_floor
  // Max drawdown allowance: per-account override (account.custom_drawdown,
  // set in the account edit modal) takes precedence over the PropFirm default
  // pulled from PROPFIRM_RULES. Lets a trader run tighter than the firm's
  // official threshold — e.g. force 2000 or 2500 on a 50K instead of 2500.
  const customDD = account.custom_drawdown != null && account.custom_drawdown > 0
    ? Number(account.custom_drawdown)
    : null
  const maxDD = customDD ?? maxDrawdown(firmName, account.plan_size)

  const hasData = balance != null && ddFloor != null && maxDD > 0
  const room = hasData ? Math.max(0, balance - ddFloor) : null
  // roomPct = how much of the DD allowance is left (1.0 = full safety margin)
  // Note: peut > 1.0 sur comptes trailing au-dessus du starting balance (DD floor capped)
  const roomPct = hasData ? Math.min(1, Math.max(0, room / maxDD)) : null
  const color = statusColor(roomPct)
  const label = statusLabel(roomPct)
  const firmColor = FIRM_SUGGESTION_COLORS[firmName] || 'var(--blue)'

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {getFirmLogo(firmName, firmColor, 32)}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {firmName}
          </div>
          <div style={{ fontSize: 11, color: C.text3 }}>
            Plan {(account.plan_size || '').toUpperCase()} · {account.status}
          </div>
        </div>
        <div style={{
          padding: '4px 10px',
          background: `${color}15`,
          border: `1px solid ${color}33`,
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 700,
          color,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {label}
        </div>
      </div>

      {/* Gauge bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.text3, marginBottom: 6 }}>
          <span>Room de drawdown</span>
          <span style={{ color, fontWeight: 600 }}>
            {hasData ? `${(roomPct * 100).toFixed(0)}%` : '—'}
          </span>
        </div>
        <div style={{
          height: 10,
          background: 'var(--tint2)',
          borderRadius: 6,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {hasData && (
            <div style={{
              width: `${roomPct * 100}%`,
              height: '100%',
              background: color,
              borderRadius: 6,
              transition: 'width 0.3s ease',
            }} />
          )}
        </div>
      </div>

      {/* Data row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 12 }}>
        <div>
          <div style={{ color: C.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Balance</div>
          <div style={{ color: C.text, fontWeight: 600 }}>
            {balance != null ? `$${Number(balance).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
          </div>
        </div>
        <div>
          <div style={{ color: C.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>DD floor</div>
          <div style={{ color: C.text, fontWeight: 600 }}>
            {ddFloor != null ? `$${Number(ddFloor).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
          </div>
        </div>
        <div>
          <div style={{ color: C.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Room</div>
          <div style={{ color, fontWeight: 600 }}>
            {room != null ? `$${Math.round(room).toLocaleString('en-US')}` : '—'}
          </div>
        </div>
      </div>

      {!hasData && (
        <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5 }}>
          {!maxDD
            ? <>Pas de règle drawdown trouvée pour <strong style={{ color: C.text2 }}>{firmName}</strong>. Vérifie que le compte est lié à une firm supportée.</>
            : <>Logue des trades ou sync Rithmic pour activer le tracking automatique.</>
          }
        </div>
      )}
    </div>
  )
}
