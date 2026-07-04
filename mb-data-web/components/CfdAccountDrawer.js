'use client'
// components/CfdAccountDrawer.js — dedicated right-side drawer for a CFD account.
//
// Mirrors the futures account drawer's overlay + slide-in panel styling, but the
// body is CFD-specific: it reuses <CfdDrawdownCard> for the rules summary + balance
// editor + Max Loss / Daily Loss gauges (no gauge logic duplicated here), adds a
// status control (Challenge / Financé / Échoué — stored literals), a payouts list
// with add/delete, and a delete-account action.
//
// Props:
//   account   = currentAcct (a CFD account row: market='cfd', cfd_* + balance cols + nested `payouts`)
//   firm      = currentAcctFirm
//   onClose   = close the drawer (layout passes () => setAcctDrawer(null))
//   onChanged = reload firms after a mutation (layout passes loadFirms)
//   showToast = toast helper
//
// Every Supabase write checks { error } before the success toast, then onChanged().

import { useState } from 'react'
import { useT } from './LanguageProvider'
import { supabase } from '../lib/supabase'
import { useDialog } from './useDialog'
import CfdDrawdownCard from './health/CfdDrawdownCard'
import { CFD_REPUTATION, CFD_PROPFIRM_RULES } from '../lib/cfdConstants'
import { getFirmLogo } from '../lib/firmLogos'

// Stored status literals — NEVER translate (these are DB values).
const STATUS_VALUES = ['Challenge', 'Financé', 'Échoué']

function currencySymbol(cur) {
  if (cur === 'EUR') return '€'
  if (cur === 'GBP') return '£'
  if (cur === 'CHF') return 'CHF '
  return '$'
}

function fmtAmount(v, cur) {
  if (v == null || v === '' || !Number.isFinite(Number(v))) return '—'
  return `${currencySymbol(cur)}${Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

function statusLabel(t, status) {
  if (status === 'Challenge') return t('app.cfd.statusChallenge')
  if (status === 'Financé') return t('app.cfd.statusFunded')
  if (status === 'Échoué') return t('app.cfd.statusFailed')
  return status || '—'
}

// Reputation label: i18n key first (keyed by tier), FR constant as fallback.
function repTierLabel(t, tier, rep) {
  const key = `app.cfd.reputation.${tier}`
  const v = t(key)
  return v !== key ? v : rep?.label
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
  fontFamily: 'inherit',
}

const sectionTitleStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text2)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const btnGhost = { padding: '8px 14px', fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--text2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', minHeight: 32 }
const btnPrimary = { padding: '8px 16px', fontSize: 12, fontWeight: 600, background: 'var(--text)', color: '#0a0c10', border: '1px solid transparent', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', minHeight: 32 }

export default function CfdAccountDrawer({ account, firm, onClose, onChanged, showToast }) {
  const t = useT()
  const ref = useDialog({ open: true, onClose })

  const a = account || {}
  const firmName = firm?.name || ''
  const currency = a.currency || 'USD'

  // Reputation badge — guarded: firm may not be in the CFD catalog (custom name).
  const repKey = firmName ? CFD_PROPFIRM_RULES[firmName]?.reputation : null
  const repTier = repKey && CFD_REPUTATION[repKey] ? CFD_REPUTATION[repKey] : null

  const [savingStatus, setSavingStatus] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [payoutFD, setPayoutFD] = useState({ date: '', amount: '', note: '' })

  const payouts = Array.isArray(a.payouts) ? a.payouts : []
  const totalPayouts = payouts.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
  const spent = parseFloat(a.spent) || 0
  const net = totalPayouts - spent

  async function changeStatus(newStatus) {
    if (savingStatus || newStatus === a.status) return
    setSavingStatus(true)
    try {
      const { error } = await supabase.from('accounts').update({ status: newStatus }).eq('id', a.id)
      if (error) {
        showToast?.(t('app.cfd.toastStatusFailed') + (error.message || t('app.cfd.toastUnknownError')))
        return
      }
      showToast?.(t('app.cfd.toastStatusUpdated'))
      if (onChanged) await onChanged()
    } finally {
      setSavingStatus(false)
    }
  }

  async function addPayout() {
    if (!payoutFD.date || !payoutFD.amount) {
      showToast?.(t('app.cfd.toastDateAmountRequired'))
      return
    }
    const amount = parseFloat(payoutFD.amount) || 0
    const { error } = await supabase.from('payouts').insert({
      account_id: a.id,
      user_id: a.user_id,
      date: payoutFD.date,
      amount,
      note: payoutFD.note || null,
    })
    if (error) {
      showToast?.(t('app.cfd.toastPayoutFailed') + (error.message || t('app.cfd.toastUnknownError')))
      return
    }
    setPayoutOpen(false)
    setPayoutFD({ date: '', amount: '', note: '' })
    showToast?.(t('app.cfd.toastPayoutAdded'))
    if (onChanged) await onChanged()
  }

  async function deletePayout(payoutId) {
    if (!confirm(t('app.cfd.confirmDeletePayout'))) return
    const { error } = await supabase.from('payouts').delete().eq('id', payoutId)
    if (error) {
      showToast?.(t('app.cfd.toastPayoutFailed') + (error.message || t('app.cfd.toastUnknownError')))
      return
    }
    showToast?.(t('app.cfd.toastPayoutDeleted'))
    if (onChanged) await onChanged()
  }

  async function deleteAccount() {
    if (!confirm(t('app.cfd.confirmDeleteAccount'))) return
    const { error } = await supabase.from('accounts').delete().eq('id', a.id)
    if (error) {
      showToast?.(t('app.cfd.toastAccountFailed') + (error.message || t('app.cfd.toastUnknownError')))
      return
    }
    showToast?.(t('app.cfd.toastAccountDeleted'))
    onClose?.()
    if (onChanged) await onChanged()
  }

  const drawerTitle = `${firmName} ${accountName(a)}`.trim() || t('app.cfd.title')

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 450, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-label={drawerTitle}
        className="drawer"
        onClick={e => e.stopPropagation()}
        style={{ width: '500px', maxWidth: '95vw', height: '100vh', background: 'var(--surface)', borderLeft: '0.5px solid var(--border2)', overflowY: 'auto', padding: '28px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {getFirmLogo(firmName, '#4d8fff', 32)}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {firmName || '—'}
                </span>
                {repTier && (
                  <span style={{ padding: '1px 7px', background: `${repTier.color}18`, border: `1px solid ${repTier.color}40`, borderRadius: 5, fontSize: 10, fontWeight: 700, color: repTier.color }}>
                    {repTierLabel(t, repKey, repTier)}
                  </span>
                )}
                <span style={{ ...statusBadge(a.status) }}>{statusLabel(t, a.status)}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.cfd_model ? `${a.cfd_model} · ` : ''}{fmtAmount(a.account_size, currency)} {currency}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={btnGhost} aria-label={t('app.cfd.cancel')}>{'✕'}</button>
        </div>

        {/* Rules + balance + gauges (reused, single source of gauge logic) */}
        <CfdDrawdownCard
          account={{ ...a, firmName }}
          firmName={firmName}
          onSaved={onChanged}
          showToast={showToast}
        />

        {/* Status control */}
        <div style={{ marginTop: 18, borderTop: '0.5px solid var(--border)', paddingTop: 16 }}>
          <div style={{ ...sectionTitleStyle, marginBottom: 8 }}>{t('app.cfd.changeStatus')}</div>
          <select
            value={a.status || 'Challenge'}
            onChange={e => changeStatus(e.target.value)}
            disabled={savingStatus}
            style={{ ...inputStyle, opacity: savingStatus ? 0.6 : 1 }}
          >
            {STATUS_VALUES.map(s => <option key={s} value={s}>{statusLabel(t, s)}</option>)}
          </select>
        </div>

        {/* Payouts */}
        <div style={{ marginTop: 18, borderTop: '0.5px solid var(--border)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={sectionTitleStyle}>{t('app.cfd.payouts')}</div>
            <button onClick={() => { setPayoutOpen(true); setPayoutFD({ date: new Date().toISOString().slice(0, 10), amount: '', note: '' }) }} style={btnPrimary}>
              {t('app.cfd.addPayout')}
            </button>
          </div>

          {payoutOpen && (
            <div style={{ background: 'var(--surface3)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text3)' }}>
                  {t('app.cfd.payoutDate')}
                  <input type="date" value={payoutFD.date} onChange={e => setPayoutFD(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text3)' }}>
                  {t('app.cfd.payoutAmount')} ({currencySymbol(currency).trim() || '$'})
                  <input type="number" inputMode="decimal" value={payoutFD.amount} onChange={e => setPayoutFD(p => ({ ...p, amount: e.target.value }))} style={inputStyle} />
                </label>
              </div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>
                {t('app.cfd.payoutNote')}
                <input value={payoutFD.note} onChange={e => setPayoutFD(p => ({ ...p, note: e.target.value }))} style={inputStyle} />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setPayoutOpen(false)} style={btnGhost}>{t('app.cfd.cancel')}</button>
                <button onClick={addPayout} style={btnPrimary}>{t('app.cfd.save')}</button>
              </div>
            </div>
          )}

          {payouts.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface3)', borderRadius: 'var(--radius)', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{t('app.cfd.totalPayouts')}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                  {fmtAmount(totalPayouts, currency)} · <span style={{ color: net >= 0 ? '#1db87a' : '#e8504a' }}>{t('app.cfd.net')} {fmtAmount(net, currency)}</span>
                </span>
              </div>
              {payouts.slice().sort((x, y) => (y.date || '').localeCompare(x.date || '')).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius)', marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1db87a', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{t('app.cfd.payoutPrefix')} {p.date}</div>
                    {p.note && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.note}</div>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1db87a' }}>+{fmtAmount(p.amount, currency)}</div>
                  <button onClick={() => deletePayout(p.id)} aria-label={'✕'} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '2px 6px', fontSize: 14 }}>{'✕'}</button>
                </div>
              ))}
            </>
          ) : (
            !payoutOpen && <div style={{ color: 'var(--text3)', fontSize: 13, padding: '8px 0' }}>{t('app.cfd.noPayout')}</div>
          )}
        </div>

        {/* Delete account */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '0.5px solid var(--border)' }}>
          <button onClick={deleteAccount} style={{ background: 'var(--red-bg)', color: 'var(--red-text)', border: '0.5px solid var(--red-bg)', padding: '8px 16px', borderRadius: 'var(--radius)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            {t('app.cfd.deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  )
}

function accountName(a) {
  if (a?.name) return `— ${a.name}`
  if (a?.buy_date) return `— ${a.buy_date}`
  return ''
}

function statusBadge(status) {
  const map = {
    'Financé': { bg: 'var(--green-bg)', color: 'var(--green-text)' },
    'Challenge': { bg: 'var(--amber-bg)', color: 'var(--amber-text)' },
    'Échoué': { bg: 'var(--red-bg)', color: 'var(--red-text)' },
  }
  const c = map[status] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--text2)' }
  return { display: 'inline-block', fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 99, letterSpacing: '0.3px', background: c.bg, color: c.color }
}
