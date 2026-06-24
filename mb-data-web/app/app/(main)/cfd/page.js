'use client'
// /app/cfd — CFD / forex PropFirm tracker (Phase 2, LIGHT version).
//
// Fully isolated from the futures dashboard: this page manages its OWN data
// (CFD firms+accounts+payouts where market='cfd') and never reads the shared
// futures `firms` context (which is filtered to futures-only in layout.js).
//
// NO live drawdown computation in this LIGHT version. The engine lib/cfdDrawdown.js
// exists but is NOT wired here yet.
// TODO(cfd-drawdown): wire lib/cfdDrawdown.js to compute a live drawdown gauge per
// account once live balance/equity tracking is available for CFD accounts.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '../AppContext'
import { useT } from '../../../../components/LanguageProvider'
import { supabase } from '../../../../lib/supabase'
import Skeleton from '../../../../components/Skeleton'
import {
  CFD_PROPFIRM_RULES,
  CFD_REPUTATION,
  CFD_DAILY_BASIS_LABEL,
  CFD_MAX_BASIS_LABEL,
} from '../../../../lib/cfdConstants'
import { getCfdFirmsOrdered } from '../../../../lib/cfdSlugs'

const FIRM_COLORS_CFD = ['#4d8fff', '#1db87a', '#fac775', '#a78bfa', '#e8504a', '#22d3ee', '#f472b6', '#34d399', '#fb923c']

// ── Shared inline styles (mirror layout.js S object + theme.js) ──
const S = {
  card: { background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)' },
  input: { width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', color: 'var(--text)', outline: 'none', transition: 'border-color 0.2s, background 0.2s', fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: '10.5px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: '6px' },
  btnPrimary: { padding: '9px 18px', fontSize: '12.5px', fontWeight: '500', background: 'var(--text)', color: '#0a0c10', border: '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.005em', boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)', transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s' },
  btnGhost: { padding: '8px 14px', fontSize: '12px', fontWeight: '500', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--text2)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.005em', transition: 'color 0.2s, border-color 0.2s, background 0.2s' },
  // Status badge (futures convention reused; stored values are FR literals)
  badge: (status) => ({ display: 'inline-block', fontSize: '10.5px', fontWeight: '600', padding: '3px 9px', borderRadius: '99px', letterSpacing: '0.3px', background: status === 'Financé' ? 'var(--green-bg)' : status === 'Challenge' ? 'var(--amber-bg)' : 'var(--red-bg)', color: status === 'Financé' ? 'var(--green-text)' : status === 'Challenge' ? 'var(--amber-text)' : 'var(--red-text)' }),
}

// Stored status literals — NEVER translate (these are DB values).
const STATUS_VALUES = ['Challenge', 'Financé', 'Échoué']

const currencySymbol = (cur) => (cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : cur === 'CHF' ? 'CHF' : '$')

// Currency string in the catalog can be "multi (EUR base, …)" — normalize to a clean code.
function cleanCurrency(raw) {
  if (!raw) return 'USD'
  const m = String(raw).match(/^[A-Z]{3}/)
  return m ? m[0] : 'USD'
}

export default function CfdPage() {
  const { user, showToast } = useApp()
  const t = useT()

  const [firms, setFirms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [payoutFor, setPayoutFor] = useState(null) // account id we're adding a payout to
  const [payoutFD, setPayoutFD] = useState({ date: '', amount: '', note: '' })

  const reload = useCallback(async () => {
    if (!user) { setLoading(false); return }
    const { data, error } = await supabase
      .from('firms')
      .select('*, accounts(*, payouts(*))')
      .eq('user_id', user.id)
      .eq('market', 'cfd')
      .order('created_at', { ascending: true })
    if (error) {
      showToast(t('app.cfd.toastAccountFailed') + (error.message || t('app.cfd.toastUnknownError')))
      setLoading(false)
      return
    }
    setFirms((data || []).map((f, i) => ({
      ...f,
      color: f.color || FIRM_COLORS_CFD[i % FIRM_COLORS_CFD.length],
      accounts: (f.accounts || [])
        .slice()
        .sort((a, b) => (a.buy_date || '').localeCompare(b.buy_date || ''))
        .map(a => ({ ...a, payouts: (a.payouts || []).slice().sort((x, y) => (x.date || '').localeCompare(y.date || '')) })),
    })))
    setLoading(false)
  }, [user, showToast, t])

  useEffect(() => { reload() }, [reload])

  // Flatten accounts (each enriched with its firm) for rendering.
  const accounts = useMemo(() => {
    const list = []
    for (const f of firms) {
      for (const a of (f.accounts || [])) list.push({ ...a, firmName: f.name, firmColor: f.color })
    }
    return list
  }, [firms])

  // ── Status change ──
  async function changeStatus(acctId, newStatus) {
    const { error } = await supabase.from('accounts').update({ status: newStatus }).eq('id', acctId)
    if (error) { showToast(t('app.cfd.toastStatusFailed') + (error.message || t('app.cfd.toastUnknownError'))); return }
    await reload()
    showToast(t('app.cfd.toastStatusUpdated'))
  }

  // ── Delete account ──
  async function deleteAccount(acctId) {
    if (!confirm(t('app.cfd.confirmDeleteAccount'))) return
    const { error } = await supabase.from('accounts').delete().eq('id', acctId)
    if (error) { showToast(t('app.cfd.toastAccountFailed') + (error.message || t('app.cfd.toastUnknownError'))); return }
    await reload()
    showToast(t('app.cfd.toastAccountDeleted'))
  }

  // ── Payouts ──
  async function savePayout() {
    if (!payoutFor) return
    if (!payoutFD.date || !payoutFD.amount) { showToast(t('app.cfd.toastDateAmountRequired')); return }
    const amount = parseFloat(payoutFD.amount) || 0
    const { error } = await supabase.from('payouts').insert({ account_id: payoutFor, user_id: user.id, date: payoutFD.date, amount, note: payoutFD.note || null })
    if (error) { showToast(t('app.cfd.toastPayoutFailed') + (error.message || t('app.cfd.toastUnknownError'))); return }
    setPayoutFor(null); setPayoutFD({ date: '', amount: '', note: '' })
    await reload()
    showToast(t('app.cfd.toastPayoutAdded'))
  }

  async function deletePayout(payoutId) {
    if (!confirm(t('app.cfd.confirmDeletePayout'))) return
    const { error } = await supabase.from('payouts').delete().eq('id', payoutId)
    if (error) { showToast(t('app.cfd.toastPayoutFailed') + (error.message || t('app.cfd.toastUnknownError'))); return }
    await reload()
    showToast(t('app.cfd.toastPayoutDeleted'))
  }

  return (
    <div style={{ padding: '24px 28px 60px', maxWidth: 1280, width: '100%', boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, marginBottom: 6, color: 'var(--text)' }}>
            {t('app.cfd.title')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5, margin: 0, maxWidth: 640 }}>
            {t('app.cfd.subtitle')}
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} style={S.btnPrimary}>+ {t('app.cfd.addAccount')}</button>
      </header>

      {loading ? (
        <Skeleton.Grid count={4} />
      ) : accounts.length === 0 ? (
        <div style={{ padding: '40px 28px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{t('app.cfd.emptyTitle')}</div>
          <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.55, margin: '0 auto 18px', maxWidth: 440 }}>{t('app.cfd.emptyBody')}</p>
          <button onClick={() => setModalOpen(true)} style={S.btnPrimary}>+ {t('app.cfd.emptyCta')}</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 14 }}>
          {accounts.map((a) => (
            <CfdAccountCard
              key={a.id}
              account={a}
              t={t}
              onChangeStatus={changeStatus}
              onDelete={deleteAccount}
              onAddPayout={() => { setPayoutFor(a.id); setPayoutFD({ date: new Date().toISOString().slice(0, 10), amount: '', note: '' }) }}
              onDeletePayout={deletePayout}
              payoutOpen={payoutFor === a.id}
              payoutFD={payoutFD}
              setPayoutFD={setPayoutFD}
              onSavePayout={savePayout}
              onCancelPayout={() => setPayoutFor(null)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <AddCfdAccountModal
          user={user}
          t={t}
          showToast={showToast}
          onClose={() => setModalOpen(false)}
          onSaved={async () => { setModalOpen(false); await reload() }}
        />
      )}
    </div>
  )
}

// ── Per-account card ──
function CfdAccountCard({ account: a, t, onChangeStatus, onDelete, onAddPayout, onDeletePayout, payoutOpen, payoutFD, setPayoutFD, onSavePayout, onCancelPayout }) {
  const catalog = CFD_PROPFIRM_RULES[a.firmName]
  const rep = catalog ? CFD_REPUTATION[catalog.reputation] : null
  const sym = currencySymbol(a.currency)
  const totalPayouts = (a.payouts || []).reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const spent = Number(a.spent) || 0
  const net = totalPayouts - spent
  const roi = spent > 0 ? (net / spent) * 100 : null

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, padding: '4px 0' }}>
      <span style={{ color: 'var(--text3)' }}>{label}</span>
      <span style={{ color: 'var(--text2)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )

  return (
    <div style={{ ...S.card, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header: firm name + reputation + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: a.firmColor, flexShrink: 0 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.firmName}</span>
          {rep && (
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: rep.color + '22', color: rep.color, whiteSpace: 'nowrap' }}>{rep.label}</span>
          )}
        </div>
        <span style={S.badge(a.status)}>{a.status}</span>
      </div>

      {a.name && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: -4 }}>{a.name}</div>}

      {/* Size + model headline */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          {a.account_size != null ? Number(a.account_size).toLocaleString('en-US') : '—'} {a.currency || ''}
        </span>
        {a.cfd_model && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{a.cfd_model}</span>}
      </div>

      {/* Rule thresholds */}
      <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px' }}>
        {a.profit_target_pct != null && <Row label={t('app.cfd.profitTarget')} value={`${a.profit_target_pct}%`} />}
        {a.daily_loss_pct != null && <Row label={t('app.cfd.dailyLoss')} value={`${a.daily_loss_pct}%${a.daily_loss_basis ? ` · ${CFD_DAILY_BASIS_LABEL[a.daily_loss_basis] || a.daily_loss_basis}` : ''}`} />}
        {a.max_loss_pct != null && <Row label={t('app.cfd.maxLoss')} value={`${a.max_loss_pct}%${a.max_loss_basis ? ` · ${CFD_MAX_BASIS_LABEL[a.max_loss_basis] || a.max_loss_basis}` : ''}`} />}
        {a.profit_split != null && <Row label={t('app.cfd.profitSplit')} value={`${a.profit_split}%`} />}
        {a.leverage_forex != null && <Row label={t('app.cfd.leverage')} value={`1:${a.leverage_forex}`} />}
        {a.platform && <Row label={t('app.cfd.platform')} value={a.platform} />}
        <Row label={t('app.cfd.phase')} value={a.cfd_step === 0 || a.cfd_step == null ? t('app.cfd.funded') : `${a.cfd_step}`} />
        {a.buy_date && <Row label={t('app.cfd.buyDate')} value={a.buy_date} />}
      </div>

      {/* Money summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
        <span style={{ color: 'var(--text3)' }}>{t('app.cfd.spent')}: <strong style={{ color: 'var(--red)' }}>{spent.toFixed(2)} {sym}</strong></span>
        <span style={{ color: 'var(--text3)' }}>{t('app.cfd.net')}: <strong style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>{net >= 0 ? '+' : ''}{net.toFixed(2)} {sym}</strong></span>
        {roi != null && <span style={{ color: 'var(--text3)' }}>{t('app.cfd.roi')}: <strong style={{ color: roi >= 0 ? 'var(--green)' : 'var(--red)' }}>{roi >= 0 ? '+' : ''}{roi.toFixed(0)}%</strong></span>}
      </div>

      {/* Payouts */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('app.cfd.payouts')}</span>
          <button onClick={onAddPayout} style={{ ...S.btnGhost, padding: '4px 10px', fontSize: 11 }}>+ {t('app.cfd.addPayout')}</button>
        </div>
        {payoutOpen && (
          <div style={{ background: 'var(--surface3)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <div style={S.label}>{t('app.cfd.payoutDate')}</div>
                <input type="date" value={payoutFD.date} onChange={e => setPayoutFD(p => ({ ...p, date: e.target.value }))} style={{ ...S.input, background: 'var(--surface2)' }} />
              </div>
              <div>
                <div style={S.label}>{t('app.cfd.payoutAmount')}</div>
                <input type="number" value={payoutFD.amount} onChange={e => setPayoutFD(p => ({ ...p, amount: e.target.value }))} style={{ ...S.input, background: 'var(--surface2)' }} />
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={S.label}>{t('app.cfd.payoutNote')}</div>
              <input value={payoutFD.note} onChange={e => setPayoutFD(p => ({ ...p, note: e.target.value }))} style={{ ...S.input, background: 'var(--surface2)' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onCancelPayout} style={S.btnGhost}>{t('app.cfd.cancel')}</button>
              <button onClick={onSavePayout} style={S.btnPrimary}>{t('app.cfd.save')}</button>
            </div>
          </div>
        )}
        {(a.payouts || []).length === 0 && !payoutOpen && (
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t('app.cfd.noPayout')}</div>
        )}
        {(a.payouts || []).slice().sort((x, y) => (y.date || '').localeCompare(x.date || '')).map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--surface2)', borderRadius: 8, marginBottom: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{t('app.cfd.payoutPrefix')} {p.date}</div>
              {p.note && <div style={{ fontSize: 10.5, color: 'var(--text3)' }}>{p.note}</div>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>+{(Number(p.amount) || 0).toFixed(2)} {sym}</div>
            <button onClick={() => onDeletePayout(p.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '2px 6px', fontSize: 13 }}>✕</button>
          </div>
        ))}
      </div>

      {/* Actions: status + delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '0.5px solid var(--border)' }}>
        <select value={a.status} onChange={e => onChangeStatus(a.id, e.target.value)} style={{ ...S.input, padding: '7px 10px', flex: 1 }} aria-label={t('app.cfd.changeStatus')}>
          {STATUS_VALUES.map(s => (
            <option key={s} value={s}>{s === 'Challenge' ? t('app.cfd.statusChallenge') : s === 'Financé' ? t('app.cfd.statusFunded') : t('app.cfd.statusFailed')}</option>
          ))}
        </select>
        <button onClick={() => onDelete(a.id)} title={t('app.cfd.deleteAccount')} style={{ ...S.btnGhost, padding: '7px 12px', color: 'var(--red-text)', borderColor: 'rgba(232,80,74,0.3)' }}>✕</button>
      </div>
    </div>
  )
}

// ── Add CFD account modal ──
function AddCfdAccountModal({ user, t, showToast, onClose, onSaved }) {
  const firmsCatalog = useMemo(() => getCfdFirmsOrdered(), [])
  const [firmName, setFirmName] = useState(firmsCatalog[0]?.name || '')
  const catalog = CFD_PROPFIRM_RULES[firmName]
  const flagship = catalog?.flagship

  // Form state
  const [form, setForm] = useState(() => buildDefaults(catalog))
  const [saving, setSaving] = useState(false)

  // Rebuild prefilled defaults when the firm changes.
  function onPickFirm(name) {
    setFirmName(name)
    setForm(buildDefaults(CFD_PROPFIRM_RULES[name]))
  }

  // When the phase (step) changes, re-derive the profit target prefill.
  function onPickStep(step) {
    setForm(p => {
      const fl = CFD_PROPFIRM_RULES[firmName]?.flagship
      const pt = fl ? (fl.profitTargets?.[step - 1] ?? fl.profitTargets?.[0]) : p.profit_target_pct
      return { ...p, cfd_step: step, profit_target_pct: step === 0 ? p.profit_target_pct : (pt != null ? String(pt) : p.profit_target_pct) }
    })
  }

  const modelOptions = useMemo(() => {
    if (!catalog) return []
    const opts = []
    if (flagship?.model) opts.push(flagship.model)
    for (const m of (catalog.otherModels || [])) {
      // otherModels entries are descriptive strings; use the leading name fragment.
      const name = String(m).split('(')[0].split('—')[0].trim()
      if (name && !opts.includes(name)) opts.push(name)
    }
    return opts
  }, [catalog, flagship])

  const stepOptions = useMemo(() => {
    const steps = flagship?.steps || 1
    const opts = [0]
    for (let i = 1; i <= steps; i++) opts.push(i)
    return opts
  }, [flagship])

  async function save() {
    if (saving) return
    setSaving(true)
    try {
      // a. Ensure a CFD firm row exists (user_id + name + market='cfd').
      let firmId
      const { data: existing, error: findErr } = await supabase
        .from('firms')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', firmName)
        .eq('market', 'cfd')
        .maybeSingle()
      if (findErr) { showToast(t('app.cfd.toastFirmFailed') + (findErr.message || t('app.cfd.toastUnknownError'))); setSaving(false); return }
      if (existing?.id) {
        firmId = existing.id
      } else {
        // Mirror createFirm() in layout.js: { name, color, user_id } + market.
        const color = FIRM_COLORS_CFD[Math.floor(Math.random() * FIRM_COLORS_CFD.length)]
        const { data: inserted, error: insErr } = await supabase
          .from('firms')
          .insert({ user_id: user.id, name: firmName, color, market: 'cfd' })
          .select()
          .single()
        if (insErr || !inserted) { showToast(t('app.cfd.toastFirmFailed') + (insErr?.message || t('app.cfd.toastUnknownError'))); setSaving(false); return }
        firmId = inserted.id
      }

      // b. Insert the account.
      const payload = {
        user_id: user.id,
        firm_id: firmId,
        market: 'cfd',
        buy_date: form.buy_date || new Date().toISOString().slice(0, 10),
        currency: form.currency || 'USD',
        spent: parseFloat(form.spent) || 0,
        status: form.status || 'Challenge',
        name: (form.name || '').trim() || null,
        notes: (form.notes || '').trim() || null,
        cfd_model: form.cfd_model || null,
        account_size: form.account_size ? parseFloat(form.account_size) : null,
        cfd_step: form.cfd_step != null ? parseInt(form.cfd_step, 10) : 1,
        profit_target_pct: form.profit_target_pct !== '' && form.profit_target_pct != null ? parseFloat(form.profit_target_pct) : null,
        daily_loss_pct: form.daily_loss_pct !== '' && form.daily_loss_pct != null ? parseFloat(form.daily_loss_pct) : null,
        daily_loss_basis: form.daily_loss_basis || null,
        max_loss_pct: form.max_loss_pct !== '' && form.max_loss_pct != null ? parseFloat(form.max_loss_pct) : null,
        max_loss_basis: form.max_loss_basis || null,
        profit_split: form.profit_split !== '' && form.profit_split != null ? parseInt(form.profit_split, 10) : null,
        platform: form.platform || null,
        leverage_forex: form.leverage_forex !== '' && form.leverage_forex != null ? parseInt(form.leverage_forex, 10) : null,
      }
      const { error: acctErr } = await supabase.from('accounts').insert(payload)
      if (acctErr) { showToast(t('app.cfd.toastAccountFailed') + (acctErr.message || t('app.cfd.toastUnknownError'))); setSaving(false); return }

      showToast(t('app.cfd.toastAccountAdded'))
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 12px', overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-label={t('app.cfd.formTitle')} onClick={e => e.stopPropagation()} style={{ ...S.card, padding: 28, width: 560, maxWidth: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>{t('app.cfd.formTitle')}</h3>

        {/* Firm picker */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>{t('app.cfd.formFirm')}</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {firmsCatalog.map(f => {
              const rep = CFD_REPUTATION[f.reputation]
              const selected = f.name === firmName
              return (
                <button type="button" key={f.name} onClick={() => onPickFirm(f.name)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '10px 10px', borderRadius: 8, background: selected ? 'rgba(45,111,255,0.12)' : 'var(--surface2)', border: `1px solid ${selected ? 'var(--blue-light)' : 'var(--border2)'}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 12, fontWeight: selected ? 700 : 500, color: selected ? 'var(--blue-light)' : 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  {rep && <span style={{ width: 8, height: 8, borderRadius: '50%', background: rep.color, flexShrink: 0 }} title={rep.label} />}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={S.label}>{t('app.cfd.model')}</label>
            <select value={form.cfd_model} onChange={set('cfd_model')} style={S.input}>
              {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label style={S.label}>{t('app.cfd.accountSize')} ({form.currency})</label>
            <input list="cfd-sizes" type="number" value={form.account_size} onChange={set('account_size')} style={S.input} />
            <datalist id="cfd-sizes">
              {(flagship?.accountSizes || []).map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div>
            <label style={S.label}>{t('app.cfd.formStep')}</label>
            <select value={form.cfd_step} onChange={e => onPickStep(parseInt(e.target.value, 10))} style={S.input}>
              {stepOptions.map(s => <option key={s} value={s}>{s === 0 ? t('app.cfd.stepFunded') : `${t('app.cfd.stepPhase')} ${s}`}</option>)}
            </select>
          </div>

          <div>
            <label style={S.label}>{t('app.cfd.platform')}</label>
            <select value={form.platform} onChange={set('platform')} style={S.input}>
              <option value="">—</option>
              {(catalog?.platforms || []).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label style={S.label}>{t('app.cfd.currency')}</label>
            <select value={form.currency} onChange={set('currency')} style={S.input}>
              <option>USD</option><option>EUR</option><option>GBP</option><option>CHF</option>
            </select>
          </div>

          <div>
            <label style={S.label}>{t('app.cfd.buyDate')}</label>
            <input type="date" value={form.buy_date} onChange={set('buy_date')} style={S.input} />
          </div>

          <div>
            <label style={S.label}>{t('app.cfd.fee')} ({currencySymbol(form.currency)})</label>
            <input type="number" value={form.spent} onChange={set('spent')} style={S.input} />
          </div>

          {/* Rule thresholds (prefilled, editable) */}
          <div>
            <label style={S.label}>{t('app.cfd.profitTarget')} (%)</label>
            <input type="number" step="0.1" value={form.profit_target_pct} onChange={set('profit_target_pct')} style={S.input} />
          </div>
          <div>
            <label style={S.label}>{t('app.cfd.profitSplit')} (%)</label>
            <input type="number" value={form.profit_split} onChange={set('profit_split')} style={S.input} />
          </div>
          <div>
            <label style={S.label}>{t('app.cfd.dailyLoss')} (%)</label>
            <input type="number" step="0.1" value={form.daily_loss_pct} onChange={set('daily_loss_pct')} style={S.input} />
          </div>
          <div>
            <label style={S.label}>{t('app.cfd.maxLoss')} (%)</label>
            <input type="number" step="0.1" value={form.max_loss_pct} onChange={set('max_loss_pct')} style={S.input} />
          </div>
          <div>
            <label style={S.label}>{t('app.cfd.dailyLoss')} — {CFD_DAILY_BASIS_LABEL[form.daily_loss_basis] || '—'}</label>
            <select value={form.daily_loss_basis} onChange={set('daily_loss_basis')} style={S.input}>
              <option value="">—</option>
              {Object.entries(CFD_DAILY_BASIS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>{t('app.cfd.maxLoss')} — {CFD_MAX_BASIS_LABEL[form.max_loss_basis] || '—'}</label>
            <select value={form.max_loss_basis} onChange={set('max_loss_basis')} style={S.input}>
              <option value="">—</option>
              {Object.entries(CFD_MAX_BASIS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>{t('app.cfd.leverage')}</label>
            <input type="number" value={form.leverage_forex} onChange={set('leverage_forex')} style={S.input} />
          </div>
          <div>
            <label style={S.label}>{t('app.cfd.status')}</label>
            <select value={form.status} onChange={set('status')} style={S.input}>
              {STATUS_VALUES.map(s => <option key={s} value={s}>{s === 'Challenge' ? t('app.cfd.statusChallenge') : s === 'Financé' ? t('app.cfd.statusFunded') : t('app.cfd.statusFailed')}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <label style={S.label}>{t('app.cfd.name')}</label>
            <input value={form.name} onChange={set('name')} style={S.input} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={S.label}>{t('app.cfd.notes')}</label>
            <input value={form.notes} onChange={set('notes')} style={S.input} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={S.btnGhost}>{t('app.cfd.cancel')}</button>
          <button onClick={save} disabled={saving} style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }}>{t('app.cfd.save')}</button>
        </div>
      </div>
    </div>
  )
}

// Build the prefilled (editable) form defaults from a firm's flagship model.
function buildDefaults(catalog) {
  const fl = catalog?.flagship
  const step = 1
  const pt = fl ? (fl.profitTargets?.[step - 1] ?? fl.profitTargets?.[0]) : null
  return {
    cfd_model: fl?.model || '',
    account_size: fl?.accountSizes?.[0] != null ? String(fl.accountSizes[0]) : '',
    cfd_step: step,
    platform: catalog?.platforms?.[0] || '',
    currency: cleanCurrency(fl?.currency),
    buy_date: new Date().toISOString().slice(0, 10),
    spent: '',
    status: 'Challenge',
    name: '',
    notes: '',
    profit_target_pct: pt != null ? String(pt) : '',
    daily_loss_pct: fl?.dailyLoss?.pct != null ? String(fl.dailyLoss.pct) : '',
    daily_loss_basis: fl?.dailyLoss?.basis || '',
    max_loss_pct: fl?.maxLoss?.pct != null ? String(fl.maxLoss.pct) : '',
    max_loss_basis: fl?.maxLoss?.basis || '',
    profit_split: fl?.profitSplit?.from != null ? String(fl.profitSplit.from) : '',
    leverage_forex: fl?.leverage?.forex != null ? String(fl.leverage.forex) : '',
  }
}
