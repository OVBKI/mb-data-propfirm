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
import { useT, useLanguage } from './LanguageProvider'
import { supabase } from '../lib/supabase'
import { planLimitMessage } from '../lib/planLimits'
import { C as THEME } from '../lib/theme'
import {
  CFD_REPUTATION,
  CFD_DAILY_BASIS_LABEL,
  CFD_MAX_BASIS_LABEL,
} from '../lib/cfdConstants'
import { getCfdFirmsOrdered, getCfdModelsFromFirm } from '../lib/cfdSlugs'
import { useManagedCfdFirms } from '../lib/managedFirms'

const FIRM_COLORS_CFD = ['var(--blue-light)', 'var(--green)', 'var(--amber)', 'var(--violet)', 'var(--red)', '#22d3ee', '#f472b6', '#34d399', '#fb923c']

// ── Shared inline styles (mirror layout.js S object + theme.js) ──
const S = {
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: '0 1px 0 var(--tint1) inset, 0 8px 24px rgba(0,0,0,0.15)' },
  input: { width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid var(--hairline)', borderRadius: '8px', background: 'var(--tint1)', color: 'var(--text)', outline: 'none', transition: 'border-color 0.2s, background 0.2s', fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: '10.5px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: '6px' },
  btnPrimary: { padding: '9px 18px', fontSize: '12.5px', fontWeight: '500', background: 'var(--text)', color: 'var(--text-inverse)', border: '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.005em', boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)', transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s' },
  btnGhost: { padding: '8px 14px', fontSize: '12px', fontWeight: '500', background: 'var(--tint1)', border: '1px solid var(--hairline)', color: 'var(--text2)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.005em', transition: 'color 0.2s, border-color 0.2s, background 0.2s' },
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

// Bulk-create names (mirror of layout.js generateAccountNames): increments a
// trailing "-N" in the base name, else appends "-001", "-002"… Empty base → [''].
function generateCfdAccountNames(baseName, quantity) {
  const qty = Math.max(1, parseInt(quantity, 10) || 1)
  const trimmed = (baseName || '').trim()
  if (!trimmed) return Array(qty).fill('')
  const match = trimmed.match(/^(.*-)(\d+)$/)
  if (match) {
    const prefix = match[1]
    const startNum = parseInt(match[2], 10)
    const padWidth = match[2].length
    return Array.from({ length: qty }, (_, i) => prefix + String(startNum + i).padStart(padWidth, '0'))
  }
  return Array.from({ length: qty }, (_, i) => `${trimmed}-${String(i + 1).padStart(3, '0')}`)
}

// Only the rule/size fields that depend on the selected MODEL (used both when the
// model changes and when the phase does). A null rule → '' (blank & editable) so a
// sub-model that doesn't document a value never inherits a stale one from another model.
function modelRuleFields(model, step = 1) {
  const pt = model ? (model.profitTargets?.[step - 1] ?? model.profitTargets?.[0] ?? null) : null
  return {
    account_size: model?.accountSizes?.[0] != null ? String(model.accountSizes[0]) : '',
    profit_target_pct: pt != null ? String(pt) : '',
    daily_loss_pct: model?.dailyLoss?.pct != null ? String(model.dailyLoss.pct) : '',
    daily_loss_basis: model?.dailyLoss?.basis || '',
    max_loss_pct: model?.maxLoss?.pct != null ? String(model.maxLoss.pct) : '',
    max_loss_basis: model?.maxLoss?.basis || '',
    profit_split: model?.profitSplit?.from != null ? String(model.profitSplit.from) : '',
    leverage_forex: model?.leverage?.forex != null ? String(model.leverage.forex) : '',
  }
}

// Build the prefilled (editable) form defaults from a normalized model (getCfdModels
// entry). `catalog` supplies the firm's platform default.
function buildDefaultsFromModel(model, catalog) {
  return {
    cfd_model: model?.name || '',
    cfd_step: 1,
    platform: catalog?.platforms?.[0] || '',
    currency: cleanCurrency(model?.currency),
    buy_date: new Date().toISOString().slice(0, 10),
    spent: '',
    status: 'Challenge',
    name: '',
    notes: '',
    quantity: '1',
    activation_fee: '',
    activation_date: '',
    ...modelRuleFields(model, 1),
  }
}

// Firm-level defaults = its flagship model. `firm` is a catalog entry (static OR
// admin-managed custom firm) carrying flagship/otherModels/platforms.
function buildDefaults(firm) {
  return buildDefaultsFromModel(getCfdModelsFromFirm(firm)[0], firm)
}

// `account` (optional) switches the modal to EDIT mode: it pre-fills from an
// existing CFD account row (must carry `firmName`) and UPDATEs it instead of
// inserting. Null/undefined → the original create flow.
export default function CfdAccountModal({ open, onClose, onSaved, user, showToast, account }) {
  if (!open) return null
  // key forces a clean remount (fresh form state) when switching target account.
  return <CfdAccountModalInner key={account?.id || 'new'} account={account || null} onClose={onClose} onSaved={onSaved} user={user} showToast={showToast} />
}

// Build the editable form from an existing account row (EDIT mode prefill).
function buildFormFromAccount(a) {
  return {
    cfd_model: a.cfd_model || '',
    account_size: a.account_size != null ? String(a.account_size) : '',
    cfd_step: a.cfd_step != null ? a.cfd_step : 1,
    platform: a.platform || '',
    currency: a.currency || 'USD',
    buy_date: a.buy_date || new Date().toISOString().slice(0, 10),
    spent: a.spent != null ? String(a.spent) : '',
    status: a.status || 'Challenge',
    name: a.name || '',
    notes: a.notes || '',
    quantity: '1', // edit = single account
    activation_fee: a.activation_fee != null && a.activation_fee !== 0 ? String(a.activation_fee) : '',
    activation_date: a.activation_date || '',
    profit_target_pct: a.profit_target_pct != null ? String(a.profit_target_pct) : '',
    daily_loss_pct: a.daily_loss_pct != null ? String(a.daily_loss_pct) : '',
    daily_loss_basis: a.daily_loss_basis || '',
    max_loss_pct: a.max_loss_pct != null ? String(a.max_loss_pct) : '',
    max_loss_basis: a.max_loss_basis || '',
    profit_split: a.profit_split != null ? String(a.profit_split) : '',
    leverage_forex: a.leverage_forex != null ? String(a.leverage_forex) : '',
  }
}

// Inner component so form state resets cleanly each time the modal opens
// (mount/unmount on `open`), preserving the original per-open default behavior.
function CfdAccountModalInner({ account, onClose, onSaved, user, showToast }) {
  const isEdit = !!account
  const t = useT()
  const { locale } = useLanguage()
  // Static catalog + admin-managed custom firms (loaded async; merged reactively).
  const managed = useManagedCfdFirms()
  const staticCatalog = useMemo(() => getCfdFirmsOrdered(), [])
  // A custom firm with a static firm's name OVERRIDES it (edit-existing), not duplicates.
  const firmsCatalog = useMemo(() => {
    const names = new Set(managed.map(f => f.name))
    return [...staticCatalog.filter(f => !names.has(f.name)), ...managed]
  }, [staticCatalog, managed])
  // In edit mode the firm is fixed (moving an account across firms would change its
  // firm_id) — seed from the account and keep the picker read-only.
  const [firmName, setFirmName] = useState(
    isEdit ? (account.firmName || staticCatalog[0]?.name || '') : (staticCatalog[0]?.name || ''),
  )
  // The selected firm entry (works for static + custom firms).
  const catalog = useMemo(() => firmsCatalog.find(f => f.name === firmName) || null, [firmsCatalog, firmName])

  // Normalized [flagship, ...sub-models] for this firm. Each carries real per-model
  // rules (sub-models inherit firm-wide infra, expose only the rules they document).
  const models = useMemo(() => getCfdModelsFromFirm(catalog), [catalog])

  // Form state (prefilled from the account in edit mode, else from the flagship).
  const [form, setForm] = useState(() => (isEdit ? buildFormFromAccount(account) : buildDefaults(catalog)))
  const [saving, setSaving] = useState(false)

  const selectedModel = useMemo(
    () => models.find(m => m.name === form.cfd_model) || models[0] || null,
    [models, form.cfd_model],
  )

  // Rebuild prefilled defaults when the firm changes (defaults to its flagship).
  function onPickFirm(name) {
    setFirmName(name)
    setForm(buildDefaults(firmsCatalog.find(f => f.name === name)))
  }

  // Changement de modèle → pré-remplit les VRAIES règles du sous-modèle (daily/max
  // loss + bases, target, taille). Une règle non documentée par ce modèle est remise
  // à vide (éditable) plutôt que d'hériter d'une valeur périmée.
  function onPickModel(name) {
    const model = models.find(m => m.name === name)
    setForm(p => ({ ...p, cfd_model: name, cfd_step: 1, ...modelRuleFields(model, 1) }))
  }

  // When the phase (step) changes, re-derive the profit target prefill from the model.
  function onPickStep(step) {
    setForm(p => {
      const model = models.find(m => m.name === p.cfd_model)
      const pt = model ? (model.profitTargets?.[step - 1] ?? model.profitTargets?.[0]) : null
      return { ...p, cfd_step: step, profit_target_pct: step === 0 ? p.profit_target_pct : (pt != null ? String(pt) : p.profit_target_pct) }
    })
  }

  // Options always keep the current value selectable (edit mode / custom firm).
  const modelOptions = useMemo(() => {
    const opts = models.map(m => m.name)
    if (form.cfd_model && !opts.includes(form.cfd_model)) opts.unshift(form.cfd_model)
    return opts
  }, [models, form.cfd_model])

  const sizeOptions = useMemo(() => {
    const opts = (selectedModel?.accountSizes || []).map(String)
    if (form.account_size && !opts.includes(String(form.account_size))) opts.unshift(String(form.account_size))
    return opts
  }, [selectedModel, form.account_size])

  const stepOptions = useMemo(() => {
    const steps = selectedModel?.steps || 1
    const opts = [0]
    for (let i = 1; i <= steps; i++) opts.push(i)
    const cur = Number(form.cfd_step)
    if (Number.isFinite(cur) && !opts.includes(cur)) opts.push(cur)
    return opts
  }, [selectedModel, form.cfd_step])

  // Sous-modèle sélectionné (≠ phare) → on affiche son résumé catalogue en rappel.
  const isNonFlagshipModel = !!(selectedModel && !selectedModel.isFlagship)
  const selectedModelHint = isNonFlagshipModel ? (selectedModel.desc || null) : null

  // Editable account columns shared by insert (create) and update (edit).
  function accountFields() {
    return {
      buy_date: form.buy_date || new Date().toISOString().slice(0, 10),
      currency: form.currency || 'USD',
      spent: parseFloat(form.spent) || 0,
      status: form.status || 'Challenge',
      name: (form.name || '').trim() || null,
      notes: (form.notes || '').trim() || null,
      activation_fee: parseFloat(form.activation_fee) || 0,
      activation_date: form.activation_date || null,
      cfd_model: form.cfd_model || null,
      account_size: form.account_size ? parseFloat(form.account_size) : null,
      // Funded accounts are phase 0 — keep step coherent with status (audit fix).
      cfd_step: form.status === 'Financé' ? 0 : (form.cfd_step != null ? parseInt(form.cfd_step, 10) : 1),
      profit_target_pct: form.profit_target_pct !== '' && form.profit_target_pct != null ? parseFloat(form.profit_target_pct) : null,
      daily_loss_pct: form.daily_loss_pct !== '' && form.daily_loss_pct != null ? parseFloat(form.daily_loss_pct) : null,
      daily_loss_basis: form.daily_loss_basis || null,
      max_loss_pct: form.max_loss_pct !== '' && form.max_loss_pct != null ? parseFloat(form.max_loss_pct) : null,
      max_loss_basis: form.max_loss_basis || null,
      profit_split: form.profit_split !== '' && form.profit_split != null ? parseInt(form.profit_split, 10) : null,
      platform: form.platform || null,
      leverage_forex: form.leverage_forex !== '' && form.leverage_forex != null ? parseInt(form.leverage_forex, 10) : null,
    }
  }

  async function save() {
    if (saving) return
    setSaving(true)
    try {
      // EDIT: update the existing account in place (firm unchanged).
      if (isEdit) {
        const { error: updErr } = await supabase.from('accounts').update(accountFields()).eq('id', account.id)
        if (updErr) { showToast(t('app.cfd.toastAccountFailed') + (updErr.message || t('app.cfd.toastUnknownError'))); setSaving(false); return }
        showToast(t('app.cfd.toastAccountUpdated'))
        onClose()
        if (onSaved) await onSaved()
        return
      }

      // CREATE — a. Ensure a CFD firm row exists (user_id + name + market='cfd').
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

      // b. Insert the account(s) — quantity > 1 bulk-creates with generated names.
      const qty = Math.max(1, parseInt(form.quantity, 10) || 1)
      const base = { user_id: user.id, firm_id: firmId, market: 'cfd', ...accountFields() }
      let acctErr
      if (qty > 1) {
        const rows = generateCfdAccountNames(form.name, qty).map(n => ({ ...base, name: (n || '').trim() || null }))
        acctErr = (await supabase.from('accounts').insert(rows)).error
      } else {
        acctErr = (await supabase.from('accounts').insert(base)).error
      }
      if (acctErr) {
        const quota = planLimitMessage(acctErr, locale)
        showToast(quota || t('app.cfd.toastAccountFailed') + (acctErr.message || t('app.cfd.toastUnknownError')))
        setSaving(false); return
      }

      showToast(qty > 1 ? t('app.cfd.toastAccountsAdded').replace('{n}', qty) : t('app.cfd.toastAccountAdded'))
      onClose()
      if (onSaved) await onSaved()
    } finally {
      setSaving(false)
    }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 12px', overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-label={isEdit ? t('app.cfd.editTitle') : t('app.cfd.formTitle')} onClick={e => e.stopPropagation()} style={{ ...S.panel, padding: 28, width: 560, maxWidth: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20 }}>{isEdit ? t('app.cfd.editTitle') : t('app.cfd.formTitle')}</h3>

        {/* Firm picker — read-only in edit mode (the account's firm is fixed). */}
        <div style={{ marginBottom: 16 }}>
          <label style={S.label}>{t('app.cfd.formFirm')}</label>
          {isEdit ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
              {CFD_REPUTATION[catalog?.reputation] && <span style={{ width: 8, height: 8, borderRadius: '50%', background: CFD_REPUTATION[catalog.reputation].color, flexShrink: 0 }} />}
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{firmName}</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
              {firmsCatalog.map(f => {
                const rep = CFD_REPUTATION[f.reputation]
                const selected = f.name === firmName
                return (
                  <button type="button" key={f.name} onClick={() => onPickFirm(f.name)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '10px 10px', borderRadius: 8, background: selected ? 'var(--blue-bg)' : 'var(--surface2)', border: `1px solid ${selected ? 'var(--blue-light)' : 'var(--border2)'}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <span style={{ fontSize: 12, fontWeight: selected ? 700 : 500, color: selected ? 'var(--blue-light)' : 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    {rep && <span style={{ width: 8, height: 8, borderRadius: '50%', background: rep.color, flexShrink: 0 }} title={repTierLabel(t, f.reputation, rep)} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={S.label}>{t('app.cfd.model')}</label>
            <select value={form.cfd_model} onChange={e => onPickModel(e.target.value)} style={S.input}>
              {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Sous-modèle sélectionné : les champs de règles sont pré-remplis d'après le
              catalogue pour CE modèle ; rappel de vérifier + résumé catalogue. */}
          {isNonFlagshipModel && (
            <div style={{
              gridColumn: '1/-1',
              padding: '10px 12px',
              background: 'var(--amber-bg)',
              border: `1px solid ${THEME.amber}55`,
              borderRadius: 8,
              fontSize: 12,
              color: THEME.amber,
              lineHeight: 1.5,
            }}>
              <strong>{t('app.cfd.nonFlagshipWarnStrong').replace('{model}', form.cfd_model)}</strong>{' '}
              {t('app.cfd.nonFlagshipWarnBody')}
              {selectedModelHint && (
                <div style={{ marginTop: 4, color: 'var(--text2)' }}>{t('app.cfd.catalogHint')} {selectedModelHint}</div>
              )}
            </div>
          )}

          <div>
            <label style={S.label}>{t('app.cfd.accountSize')} ({form.currency})</label>
            <select value={form.account_size} onChange={set('account_size')} style={S.input}>
              {sizeOptions.map(s => (
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

          {/* Funded section — activation date + fee, shown once the account is financé. */}
          {form.status === 'Financé' && (
            <div style={{ gridColumn: '1/-1', background: 'var(--green-bg)', border: '0.5px solid #1db87a55', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{'✅'} {t('app.cfd.fundedSection')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={S.label}>{t('app.cfd.activationDate')}</label>
                  <input type="date" value={form.activation_date} onChange={set('activation_date')} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>{t('app.cfd.activationFee')} ({currencySymbol(form.currency)})</label>
                  <input type="number" value={form.activation_fee} onChange={set('activation_fee')} style={S.input} />
                </div>
              </div>
            </div>
          )}

          <div style={{ gridColumn: '1/-1' }}>
            <label style={S.label}>{t('app.cfd.name')}</label>
            <input value={form.name} onChange={set('name')} style={S.input} />
          </div>

          {/* Quantity — bulk-create N accounts (create mode only). */}
          {!isEdit && (
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>{t('app.cfd.quantity')}</label>
              <input type="number" min="1" value={form.quantity} onChange={set('quantity')} style={S.input} />
              {Number(form.quantity) > 1 && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{t('app.cfd.quantityHint')}</div>
              )}
            </div>
          )}
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
