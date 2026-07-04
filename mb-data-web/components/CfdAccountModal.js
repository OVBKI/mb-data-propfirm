'use client'
// components/CfdAccountModal.js — reusable CFD add-account modal.
//
// Extracted from the former in-app /app/cfd tab (AddCfdAccountModal) so the
// global Futures⇄CFD toggle can open it from the dashboard "+ Ajouter PropFirm"
// button when marketMode === 'cfd'. ALL the validated creation behavior is kept:
//   - firm picker from getCfdFirmsOrdered()
//   - model / size / phase(step) / platform selectors
//   - rule fields prefilled from the firm's flagship (editable)
//   - firm-ensure step (find market='cfd' firm by user_id+name via maybeSingle,
//     else insert { user_id, name, color, market:'cfd' })
//   - account insert with market:'cfd' + all cfd_* columns
//   - {error} checks before every success toast
// On success it calls onSaved() (the layout passes loadFirms) so the dashboard
// refreshes and the new CFD account appears in the firm cards.
//
// Props: { open, onClose, onSaved, user, showToast }

import { useMemo, useState } from 'react'
import { useT } from './LanguageProvider'
import { supabase } from '../lib/supabase'
import { C as THEME } from '../lib/theme'
import {
  CFD_PROPFIRM_RULES,
  CFD_REPUTATION,
  CFD_DAILY_BASIS_LABEL,
  CFD_MAX_BASIS_LABEL,
} from '../lib/cfdConstants'
import { getCfdFirmsOrdered } from '../lib/cfdSlugs'

const FIRM_COLORS_CFD = ['#4d8fff', '#1db87a', '#fac775', '#a78bfa', '#e8504a', '#22d3ee', '#f472b6', '#34d399', '#fb923c']

// ── Shared inline styles (mirror layout.js S object + theme.js) ──
const S = {
  card: { background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)' },
  input: { width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', color: 'var(--text)', outline: 'none', transition: 'border-color 0.2s, background 0.2s', fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: '10.5px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: '6px' },
  btnPrimary: { padding: '9px 18px', fontSize: '12.5px', fontWeight: '500', background: 'var(--text)', color: '#0a0c10', border: '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.005em', boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)', transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s' },
  btnGhost: { padding: '8px 14px', fontSize: '12px', fontWeight: '500', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--text2)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.005em', transition: 'color 0.2s, border-color 0.2s, background 0.2s' },
}

// Stored status literals — NEVER translate (these are DB values).
const STATUS_VALUES = ['Challenge', 'Financé', 'Échoué']

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

const currencySymbol = (cur) => (cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : cur === 'CHF' ? 'CHF' : '$')

// Currency string in the catalog can be "multi (EUR base, …)" — normalize to a clean code.
function cleanCurrency(raw) {
  if (!raw) return 'USD'
  const m = String(raw).match(/^[A-Z]{3}/)
  return m ? m[0] : 'USD'
}

// Format a $ account size as a plan label: 50000 → "50K", 2500 → "2.5K", 500000 → "500K".
function fmtSize(n) {
  const v = Number(n)
  if (!isFinite(v)) return String(n)
  if (v >= 1000) {
    const k = v / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1)}K`
  }
  return String(v)
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

export default function CfdAccountModal({ open, onClose, onSaved, user, showToast }) {
  if (!open) return null
  return <CfdAccountModalInner onClose={onClose} onSaved={onSaved} user={user} showToast={showToast} />
}

// Inner component so form state resets cleanly each time the modal opens
// (mount/unmount on `open`), preserving the original per-open default behavior.
function CfdAccountModalInner({ onClose, onSaved, user, showToast }) {
  const t = useT()
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

  // Changement de modèle. Les `otherModels` du catalogue sont des libellés descriptifs
  // (pas de chiffres structurés par modèle), donc impossible de re-dériver les règles :
  //   - retour au modèle phare → restaure proprement les prefills du flagship (règles,
  //     taille, target, split, levier) en conservant les champs non liés aux règles ;
  //   - autre modèle → on garde les valeurs (éditables) MAIS un avertissement visible
  //     s'affiche sous le sélecteur (voir isNonFlagshipModel plus bas).
  function onPickModel(model) {
    setForm(p => {
      const cat = CFD_PROPFIRM_RULES[firmName]
      if (cat?.flagship?.model && model === cat.flagship.model) {
        const d = buildDefaults(cat)
        return {
          ...p,
          cfd_model: model,
          account_size: d.account_size,
          cfd_step: d.cfd_step,
          profit_target_pct: d.profit_target_pct,
          daily_loss_pct: d.daily_loss_pct,
          daily_loss_basis: d.daily_loss_basis,
          max_loss_pct: d.max_loss_pct,
          max_loss_basis: d.max_loss_basis,
          profit_split: d.profit_split,
          leverage_forex: d.leverage_forex,
        }
      }
      return { ...p, cfd_model: model }
    })
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

  // Modèle non-phare sélectionné → les prefills affichés sont ceux du flagship.
  const isNonFlagshipModel = !!(flagship?.model && form.cfd_model && form.cfd_model !== flagship.model)
  // Libellé descriptif du modèle sélectionné dans otherModels (rappel des vraies règles).
  const selectedModelHint = isNonFlagshipModel
    ? (catalog?.otherModels || []).find(m => String(m).split('(')[0].split('—')[0].trim() === form.cfd_model) || null
    : null

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
      onClose()
      if (onSaved) await onSaved()
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
                  {rep && <span style={{ width: 8, height: 8, borderRadius: '50%', background: rep.color, flexShrink: 0 }} title={repTierLabel(t, f.reputation, rep)} />}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={S.label}>{t('app.cfd.model')}</label>
            <select value={form.cfd_model} onChange={e => onPickModel(e.target.value)} style={S.input}>
              {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Avertissement : les règles pré-remplies ci-dessous sont celles du modèle phare. */}
          {isNonFlagshipModel && (
            <div style={{
              gridColumn: '1/-1',
              padding: '10px 12px',
              background: 'rgba(250,199,117,0.08)',
              border: `1px solid ${THEME.amber}55`,
              borderRadius: 8,
              fontSize: 12,
              color: THEME.amber,
              lineHeight: 1.5,
            }}>
              <strong>{t('app.cfd.nonFlagshipWarnStrong').replace('{flagship}', flagship.model)}</strong>{' '}
              {t('app.cfd.nonFlagshipWarnBody').replace('{model}', form.cfd_model)}
              {selectedModelHint && (
                <div style={{ marginTop: 4, color: 'var(--text2)' }}>{t('app.cfd.catalogHint')} {selectedModelHint}</div>
              )}
            </div>
          )}

          <div>
            <label style={S.label}>{t('app.cfd.accountSize')} ({form.currency})</label>
            <select value={form.account_size} onChange={set('account_size')} style={S.input}>
              {(flagship?.accountSizes || []).map(s => (
                <option key={s} value={s}>{fmtSize(s)}</option>
              ))}
            </select>
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
            <label style={S.label}>{t('app.cfd.dailyLoss')} — {dailyBasisLabel(t, form.daily_loss_basis) || '—'}</label>
            <select value={form.daily_loss_basis} onChange={set('daily_loss_basis')} style={S.input}>
              <option value="">—</option>
              {Object.keys(CFD_DAILY_BASIS_LABEL).map(k => <option key={k} value={k}>{dailyBasisLabel(t, k)}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>{t('app.cfd.maxLoss')} — {maxBasisLabel(t, form.max_loss_basis) || '—'}</label>
            <select value={form.max_loss_basis} onChange={set('max_loss_basis')} style={S.input}>
              <option value="">—</option>
              {Object.keys(CFD_MAX_BASIS_LABEL).map(k => <option key={k} value={k}>{maxBasisLabel(t, k)}</option>)}
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
