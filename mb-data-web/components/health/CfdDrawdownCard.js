'use client'
// CfdDrawdownCard — drawdown "Santé" card for a single CFD account.
// Lets the trader store their current balance (and optional day-start balance —
// plus the day-start equity when the daily basis is 'equity' or
// 'higher-of-balance-equity', otherwise the anchor would silently degrade to the
// balance), then renders Max Loss + Daily Loss gauges via the pure
// lib/cfdDrawdown engine.
//
// Status colors mirror DrawdownHealthCard:
//   safe → green · caution → amber · danger/breached → red · unknown → grey

import { useState } from 'react'
import { useT } from '../LanguageProvider'
import { supabase } from '../../lib/supabase'
import { cfdMaxLoss, cfdDailyLoss } from '../../lib/cfdDrawdown'
import { CFD_REPUTATION, CFD_PROPFIRM_RULES, CFD_DAILY_BASIS_LABEL, CFD_MAX_BASIS_LABEL } from '../../lib/cfdConstants'
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

function statusColor(status) {
  if (status === 'safe') return C.green
  if (status === 'caution') return C.amber
  if (status === 'danger' || status === 'breached') return C.red
  return C.grey
}

// Display label for the stored DB status ('Challenge'/'Financé'/'Échoué' — never
// translate the stored values themselves; mirror CfdAccountDrawer's statusLabel()).
function accountStatusLabel(t, status) {
  if (status === 'Challenge') return t('app.cfd.statusChallenge')
  if (status === 'Financé') return t('app.cfd.statusFunded')
  if (status === 'Échoué') return t('app.cfd.statusFailed')
  return status || '—'
}

// i18n-first label helpers keyed by enum/tier, falling back to the FR constants
// (covers unknown/custom values while giving EN users English labels).
function repTierLabel(t, tier, rep) {
  const key = `app.cfd.reputation.${tier}`
  const v = t(key)
  return v !== key ? v : rep?.label
}
function dailyBasisLabel(t, basis) {
  const key = `app.cfd.basisDaily.${basis}`
  const v = t(key)
  return v !== key ? v : CFD_DAILY_BASIS_LABEL[basis]
}
function maxBasisLabel(t, basis) {
  const key = `app.cfd.basisMax.${basis}`
  const v = t(key)
  return v !== key ? v : CFD_MAX_BASIS_LABEL[basis]
}

function isFiniteNum(v) {
  return v != null && v !== '' && Number.isFinite(Number(v))
}

function currencySymbol(cur) {
  if (cur === 'EUR') return '€'
  if (cur === 'GBP') return '£'
  if (cur === 'CHF') return 'CHF '
  return '$'
}

function fmtMoney(v, cur) {
  if (!Number.isFinite(Number(v))) return '—'
  return `${currencySymbol(cur)}${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function pct1(v) {
  if (!Number.isFinite(Number(v))) return '—'
  return `${Number(v).toFixed(0)}%`
}

// One horizontal gauge bar (used by both max loss + daily loss).
function Gauge({ t, label, result, currency }) {
  const status = result?.status || 'unknown'
  const color = statusColor(status)
  const usedPct = Number.isFinite(Number(result?.usedPct)) ? Number(result.usedPct) : null
  const statusKey = {
    safe: 'statusSafe',
    caution: 'statusCaution',
    danger: 'statusDanger',
    breached: 'statusBreached',
    unknown: 'statusUnknown',
  }[status] || 'statusUnknown'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: C.text3 }}>
        <span style={{ fontWeight: 600, color: C.text2 }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>
          {t(`app.cfdHealth.${statusKey}`)} · {t('app.cfdHealth.consumed')} {pct1(usedPct)}
        </span>
      </div>
      <div style={{
        height: 10,
        background: 'var(--tint2)',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {usedPct != null && (
          <div style={{
            width: `${Math.max(0, Math.min(100, usedPct))}%`,
            height: '100%',
            background: color,
            borderRadius: 6,
            transition: 'width 0.3s ease',
          }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.text3 }}>
        <span>
          {result?.floor != null
            ? <>{t('app.cfdHealth.floor')}: <strong style={{ color: C.text2 }}>{fmtMoney(result.floor, currency)}</strong></>
            : (result?.limit != null
              ? <>{t('app.cfdHealth.limit')}: <strong style={{ color: C.text2 }}>{fmtMoney(result.limit, currency)}</strong></>
              : '—')}
        </span>
        <span>
          {result?.buffer != null
            ? <>{t('app.cfdHealth.buffer')}: <strong style={{ color }}>{fmtMoney(result.buffer, currency)}</strong></>
            : ''}
        </span>
      </div>
    </div>
  )
}

export default function CfdDrawdownCard({ account, onSaved, showToast, firmName: firmNameProp }) {
  const t = useT()
  const a = account || {}
  const firmName = firmNameProp || a.firmName || ''
  const currency = a.currency || 'USD'

  const [curBal, setCurBal] = useState(isFiniteNum(a.current_balance) ? String(a.current_balance) : '')
  const [dayStart, setDayStart] = useState(isFiniteNum(a.day_start_balance) ? String(a.day_start_balance) : '')
  const [dayStartEq, setDayStartEq] = useState(isFiniteNum(a.day_start_equity) ? String(a.day_start_equity) : '')
  const [saving, setSaving] = useState(false)

  // CFD_REPUTATION is keyed by tier label ('solid'|'ok'|'caution'). The firm catalog maps
  // firm → tier. Guarded: the firm may not be in CFD_PROPFIRM_RULES (custom firm name).
  const repCatalog = firmName ? CFD_PROPFIRM_RULES[firmName] : null
  const repKey = repCatalog?.reputation
  const repTier = repKey && CFD_REPUTATION[repKey] ? CFD_REPUTATION[repKey] : null

  const firmColor = FIRM_SUGGESTION_COLORS[firmName] || 'var(--blue)'

  const accountSize = isFiniteNum(a.account_size) ? Number(a.account_size) : null
  const hasBalance = isFiniteNum(a.current_balance)
  const currentBalance = hasBalance ? Number(a.current_balance) : null
  const highWater = isFiniteNum(a.balance_highwater) ? Number(a.balance_highwater) : accountSize
  const hasDayStart = isFiniteNum(a.day_start_balance)

  const maxLossPct = isFiniteNum(a.max_loss_pct) ? Number(a.max_loss_pct) : null
  const dailyLossPct = isFiniteNum(a.daily_loss_pct) ? Number(a.daily_loss_pct) : null

  // L'equity de début de journée n'est pertinente que pour les bases daily ancrées
  // sur l'equity — sinon on n'affiche pas l'input (UI compacte).
  const dailyBasis = a.daily_loss_basis || 'balance'
  const needsDayStartEquity = dailyBasis === 'equity' || dailyBasis === 'higher-of-balance-equity'

  // Engine results (only meaningful once balance is set + account size is known).
  const maxResult = (hasBalance && accountSize && maxLossPct != null)
    ? cfdMaxLoss({
        initialBalance: accountSize,
        currentEquity: currentBalance,
        highWater: highWater ?? accountSize,
        maxLossPct,
        basis: a.max_loss_basis || 'static',
      })
    : null

  const dailyResult = (hasBalance && hasDayStart && accountSize && dailyLossPct != null)
    ? cfdDailyLoss({
        initialBalance: accountSize,
        currentEquity: currentBalance,
        dayStartBalance: Number(a.day_start_balance),
        // Sans elle, 'higher-of-balance-equity' dégénérait silencieusement en ancre solde.
        dayStartEquity: isFiniteNum(a.day_start_equity) ? Number(a.day_start_equity) : undefined,
        dailyLossPct,
        basis: dailyBasis,
      })
    : null

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      const parsedCur = isFiniteNum(curBal) ? Number(curBal) : null
      const parsedDay = isFiniteNum(dayStart) ? Number(dayStart) : null
      const parsedDayEq = isFiniteNum(dayStartEq) ? Number(dayStartEq) : null
      const existingHw = isFiniteNum(a.balance_highwater)
        ? Number(a.balance_highwater)
        : (accountSize ?? 0)
      // High-water never decreases.
      const newHw = parsedCur != null ? Math.max(existingHw, parsedCur) : existingHw

      const { error } = await supabase
        .from('accounts')
        .update({
          current_balance: parsedCur,
          balance_highwater: newHw,
          day_start_balance: parsedDay,
          day_start_equity: parsedDayEq,
        })
        .eq('id', a.id)

      if (error) {
        showToast?.(t('app.cfdHealth.saveError') + ': ' + (error.message || ''))
        return
      }
      showToast?.(t('app.cfdHealth.saved'))
      if (onSaved) await onSaved()
    } catch (e) {
      showToast?.(t('app.cfdHealth.saveError') + (e?.message ? ': ' + e.message : ''))
    } finally {
      setSaving(false)
    }
  }

  const headerStatusColor = maxResult ? statusColor(maxResult.status) : C.grey

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${headerStatusColor}`,
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {getFirmLogo(firmName, firmColor, 32)}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {firmName || '—'}
            </span>
            {repTier && (
              <span style={{
                padding: '1px 7px',
                background: `${repTier.color}18`,
                border: `1px solid ${repTier.color}40`,
                borderRadius: 5,
                fontSize: 10,
                fontWeight: 700,
                color: repTier.color,
              }}>
                {repTierLabel(t, repKey, repTier)}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {a.cfd_model ? `${a.cfd_model} · ` : ''}{fmtMoney(accountSize, currency)} {currency}
          </div>
        </div>
        {a.status && (
          <div style={{
            padding: '4px 10px',
            background: 'var(--tint2)',
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            color: C.text2,
            whiteSpace: 'nowrap',
          }}>
            {accountStatusLabel(t, a.status)}
          </div>
        )}
      </div>

      {/* Rules summary */}
      <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.6, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: C.text3 }}>
          {t('app.cfdHealth.rulesTitle')}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4, color: C.text2 }}>
          {isFiniteNum(a.profit_target_pct) && (
            <span>{t('app.cfdHealth.profitTarget')}: <strong style={{ color: C.text }}>{Number(a.profit_target_pct)}%</strong></span>
          )}
          {dailyLossPct != null && (
            <span>
              {t('app.cfdHealth.dailyLoss')}: <strong style={{ color: C.text }}>{dailyLossPct}%</strong>
              {a.daily_loss_basis && dailyBasisLabel(t, a.daily_loss_basis)
                ? <span style={{ color: C.text3 }}> ({dailyBasisLabel(t, a.daily_loss_basis)})</span>
                : null}
            </span>
          )}
          {maxLossPct != null && (
            <span>
              {t('app.cfdHealth.maxLoss')}: <strong style={{ color: C.text }}>{maxLossPct}%</strong>
              {a.max_loss_basis && maxBasisLabel(t, a.max_loss_basis)
                ? <span style={{ color: C.text3 }}> ({maxBasisLabel(t, a.max_loss_basis)})</span>
                : null}
            </span>
          )}
          {isFiniteNum(a.profit_split) && (
            <span>{t('app.cfdHealth.profitSplit')}: <strong style={{ color: C.text }}>{Number(a.profit_split)}%</strong></span>
          )}
        </div>
      </div>

      {/* Balance editor */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: C.text3 }}>
          {t('app.cfdHealth.balanceTitle')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: C.text3 }}>
            {t('app.cfdHealth.currentBalanceLabel')} ({currency})
            <input
              type="number"
              inputMode="decimal"
              value={curBal}
              onChange={(e) => setCurBal(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: C.text3 }}>
            {t('app.cfdHealth.dayStartBalanceLabel')} {t('app.cfdHealth.dayStartBalanceOptional')}
            <input
              type="number"
              inputMode="decimal"
              value={dayStart}
              onChange={(e) => setDayStart(e.target.value)}
              style={inputStyle}
            />
          </label>
          {/* Equity de début de journée — seulement pour les bases daily 'equity' /
              'higher-of-balance-equity' (sinon l'ancre daily retombe sur le solde). */}
          {needsDayStartEquity && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, color: C.text3 }}>
              {t('app.cfdHealth.dayStartEquityLabel')} {t('app.cfdHealth.dayStartBalanceOptional')}
              <input
                type="number"
                inputMode="decimal"
                value={dayStartEq}
                onChange={(e) => setDayStartEq(e.target.value)}
                style={inputStyle}
              />
            </label>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            alignSelf: 'flex-start',
            minHeight: 32,
            padding: '7px 16px',
            background: firmColor,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? t('app.cfdHealth.saving') : t('app.cfdHealth.save')}
        </button>
      </div>

      {/* Gauges OR prompt */}
      {!hasBalance ? (
        <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          {t('app.cfdHealth.promptBalance')}
        </div>
      ) : (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Max loss gauge */}
          {maxResult
            ? <Gauge t={t} label={t('app.cfdHealth.maxLossGauge')} result={maxResult} currency={currency} />
            : <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5 }}>{t('app.cfdHealth.noMaxRule')}</div>}

          {/* Daily loss gauge — gated on day_start_balance */}
          {dailyLossPct == null
            ? <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5 }}>{t('app.cfdHealth.noDailyRule')}</div>
            : (hasDayStart
              ? (dailyResult
                ? <Gauge t={t} label={t('app.cfdHealth.dailyLossGauge')} result={dailyResult} currency={currency} />
                : null)
              : <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5 }}>{t('app.cfdHealth.dailyHint')}</div>)}
        </div>
      )}
    </div>
  )
}

const inputStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '7px 10px',
  fontSize: 13,
  color: 'var(--text)',
  minHeight: 32,
  width: '100%',
  boxSizing: 'border-box',
}
