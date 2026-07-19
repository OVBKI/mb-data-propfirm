'use client'
// Admin PropFirms CMS — add / edit / delete custom firms (futures + CFD) with a
// STRUCTURED form (no raw JSON): named fields for the CFD flagship + sub-models,
// and a plans × rules table for futures. Assembles the `data` blob on save.
// Overlays the static catalog; the in-app merge reads these via anon key.

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { uploadFile } from '../../../lib/uploadFile'
import { PROPFIRM_RULES } from '../../../lib/constants'
import { CFD_PROPFIRM_RULES } from '../../../lib/cfdConstants'
import { CFD_FIRM_TAGLINE } from '../../../lib/cfdSlugs'

const C = {
  bg: '#0d0f14', surface: '#141720', surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8', text2: '#9098b0', text3: '#7b839b',
  blue: '#2d6fff', blueLight: '#4d8fff', green: '#1db87a', amber: '#fac775', red: '#e8504a',
}

const REPUTATIONS = [{ v: '', label: '—' }, { v: 'solid', label: 'Fiable' }, { v: 'ok', label: 'Correct' }, { v: 'caution', label: 'Prudence' }]
const DAILY_BASES = [
  { v: 'balance', label: 'Solde (début de journée)' },
  { v: 'equity', label: 'Equity' },
  { v: 'higher-of-balance-equity', label: 'Le + haut solde/equity' },
  { v: 'balance+intraday-profit', label: 'Solde + profit intraday' },
]
const MAX_BASES = [
  { v: 'static', label: 'Statique' },
  { v: 'trailing-relative', label: 'Trailing relatif' },
  { v: 'eod-trailing', label: 'Trailing EOD' },
]

const input = { width: '100%', padding: '9px 11px', fontSize: 13, border: `1px solid ${C.border2}`, borderRadius: 8, background: C.surface2, color: C.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const label = { fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }
const btn = (bg, col = '#fff') => ({ padding: '9px 16px', fontSize: 12.5, fontWeight: 600, borderRadius: 8, background: bg, color: col, border: 'none', cursor: 'pointer', fontFamily: 'inherit' })
const ghost = { padding: '8px 14px', fontSize: 12, fontWeight: 500, background: 'transparent', border: `1px solid ${C.border2}`, color: C.text2, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }
const sectionTitle = { fontSize: 11, fontWeight: 700, color: C.blueLight, textTransform: 'uppercase', letterSpacing: '0.6px', margin: '22px 0 12px' }

// ── helpers to convert between structured form <-> data blob ──
const csvNums = (s) => String(s || '').split(',').map(x => parseFloat(x.trim())).filter(Number.isFinite)
const csvStr = (s) => String(s || '').split(',').map(x => x.trim()).filter(Boolean)
const num = (s) => { const n = parseFloat(s); return Number.isFinite(n) ? n : null }
const intOrNull = (s) => (s === '' || s == null ? null : (parseInt(s, 10) || 0))

const emptyFlagship = () => ({ model: '', steps: 2, accountSizes: '', currency: 'USD', profitTargets: '', dailyPct: '', dailyBasis: 'balance', maxPct: '', maxBasis: 'static', splitFrom: '', splitTo: '', minDays: '', consistency: '', leverageForex: '', payoutCycle: '', payoutFirstDays: '', payoutMin: '' })
const emptyOther = () => ({ name: '', desc: '', steps: '', profitTargets: '', dailyPct: '', dailyBasis: '', maxPct: '', maxBasis: '' })
// Futures firms have one or more PROGRAMS (e.g. Lucid FLEX / PRO / INSTANT), each with
// its own account-size plans + a plans × rules table.
const emptyProgram = () => ({ name: '', plans: '', rules: [] })
const emptyForm = (market = 'cfd') => ({ id: null, market, name: '', slug: '', logo_url: '', website: '', reputation: '', tagline: '', is_active: true, sort_order: 100, platforms: '', instruments: '', flagship: emptyFlagship(), otherModels: [], programs: market === 'futures' ? [emptyProgram()] : [] })

function parseForm(f) {
  const base = { id: f.id, market: f.market, name: f.name, slug: f.slug || '', logo_url: f.logo_url || '', website: f.website || '', reputation: f.reputation || '', tagline: f.tagline || '', is_active: f.is_active !== false, sort_order: f.sort_order ?? 100, platforms: '', instruments: '', flagship: emptyFlagship(), otherModels: [], programs: [] }
  const d = f.data || {}
  if (f.market === 'cfd') {
    base.platforms = (d.platforms || []).join(', ')
    base.instruments = (d.instruments || []).join(', ')
    const fl = d.flagship || {}
    base.flagship = {
      model: fl.model || '', steps: fl.steps ?? 2, accountSizes: (fl.accountSizes || []).join(', '), currency: fl.currency || 'USD',
      profitTargets: (fl.profitTargets || []).join(', '),
      dailyPct: fl.dailyLoss?.pct ?? '', dailyBasis: fl.dailyLoss?.basis || 'balance',
      maxPct: fl.maxLoss?.pct ?? '', maxBasis: fl.maxLoss?.basis || 'static',
      splitFrom: fl.profitSplit?.from ?? '', splitTo: fl.profitSplit?.to ?? '',
      minDays: fl.minTradingDays ?? '', consistency: fl.consistency || '', leverageForex: fl.leverage?.forex ?? '',
      payoutCycle: fl.payout?.cycle || '', payoutFirstDays: fl.payout?.firstDays ?? '', payoutMin: fl.payout?.min || '',
    }
    base.otherModels = (d.otherModels || []).map(o => typeof o === 'string'
      ? { ...emptyOther(), name: o.split('(')[0].split('—')[0].trim(), desc: o }
      : { name: o.name || '', desc: o.desc || '', steps: o.steps ?? '', profitTargets: (o.profitTargets || []).join(', '), dailyPct: o.dailyLoss?.pct ?? '', dailyBasis: o.dailyLoss?.basis || '', maxPct: o.maxLoss?.pct ?? '', maxBasis: o.maxLoss?.basis || '' })
  } else {
    // Futures: one or more programs. Back-compat with the old flat { plans, rules }.
    const progs = Array.isArray(d.programs) && d.programs.length
      ? d.programs
      : (((d.plans && d.plans.length) || Object.keys(d.rules || {}).length) ? [{ name: '', plans: d.plans, rules: d.rules }] : [])
    base.programs = progs.map(p => ({ name: p.name || '', plans: (p.plans || []).join(', '), rules: Object.entries(p.rules || {}).map(([lbl, values]) => ({ label: lbl, values: values || {} })) }))
    if (!base.programs.length) base.programs = [emptyProgram()]
  }
  return base
}

function buildData(form) {
  if (form.market === 'cfd') {
    const fl = form.flagship
    const flagship = {
      model: fl.model || '', steps: parseInt(fl.steps, 10) || 1,
      accountSizes: csvNums(fl.accountSizes), currency: fl.currency || 'USD',
      profitTargets: csvNums(fl.profitTargets),
      dailyLoss: { pct: num(fl.dailyPct), basis: fl.dailyBasis || null },
      maxLoss: { pct: num(fl.maxPct), basis: fl.maxBasis || null },
      profitSplit: { from: num(fl.splitFrom), to: num(fl.splitTo) },
      minTradingDays: intOrNull(fl.minDays), consistency: fl.consistency || null,
      payout: { cycle: fl.payoutCycle || null, firstDays: intOrNull(fl.payoutFirstDays), min: fl.payoutMin || null },
    }
    if (fl.leverageForex !== '') flagship.leverage = { forex: parseInt(fl.leverageForex, 10) || null }
    const otherModels = form.otherModels.filter(o => (o.name || '').trim()).map(o => {
      const m = { name: o.name.trim(), desc: (o.desc || '').trim() || o.name.trim() }
      if (o.steps !== '') m.steps = parseInt(o.steps, 10)
      if (o.profitTargets) m.profitTargets = csvNums(o.profitTargets)
      if (o.dailyPct !== '') m.dailyLoss = { pct: num(o.dailyPct), basis: o.dailyBasis || null }
      if (o.maxPct !== '') m.maxLoss = { pct: num(o.maxPct), basis: o.maxBasis || null }
      return m
    })
    return { platforms: csvStr(form.platforms), instruments: csvStr(form.instruments), flagship, otherModels }
  }
  const programs = (form.programs || [])
    .filter(p => (p.plans || '').trim() || (p.rules || []).some(r => (r.label || '').trim()))
    .map(p => {
      const rules = {}
      ;(p.rules || []).filter(r => (r.label || '').trim()).forEach(r => { rules[r.label.trim()] = r.values || {} })
      return { name: (p.name || '').trim(), plans: csvStr(p.plans), rules }
    })
  return { programs }
}

// Static catalog firms, for the "edit an existing firm" (override) flow.
const STATIC_FIRMS = [
  ...Object.keys(CFD_PROPFIRM_RULES).map(name => ({ market: 'cfd', name })),
  ...Object.keys(PROPFIRM_RULES).map(name => ({ market: 'futures', name })),
]

// Build the editor form from a STATIC catalog firm. Saving writes a custom_propfirms
// row with the same name → the in-app merge prioritizes it (= edit the existing firm).
function importStaticFirm(market, name) {
  const entry = market === 'cfd' ? CFD_PROPFIRM_RULES[name] : PROPFIRM_RULES[name]
  if (!entry) return emptyForm(market)
  return parseForm({
    id: null, market, name,
    slug: '', logo_url: '',
    website: entry.website || '',
    reputation: entry.reputation || '',
    tagline: market === 'cfd' ? (CFD_FIRM_TAGLINE[name] || '') : '',
    is_active: true, sort_order: 100,
    data: entry,
  })
}

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }
}

export default function AdminPropfirmsPage() {
  const [firms, setFirms] = useState(null)
  const [err, setErr] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/propfirms', { headers: await authHeaders() })
      const j = await res.json()
      if (!res.ok) { setErr(j.error || ('HTTP ' + res.status)); return }
      setFirms(j.firms || []); setErr(null)
    } catch (e) { setErr(e.message) }
  }, [])
  useEffect(() => { load() }, [load])

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const setFl = (k) => (e) => setForm(p => ({ ...p, flagship: { ...p.flagship, [k]: e.target.value } }))
  const setOther = (i, k, v) => setForm(p => ({ ...p, otherModels: p.otherModels.map((o, idx) => idx === i ? { ...o, [k]: v } : o) }))

  async function onLogo(e) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const r = await uploadFile({ bucket: 'propfirm-logos', file, userId: session?.user?.id })
      if (r.error) { alert(r.error); return }
      setForm(p => ({ ...p, logo_url: r.url }))
    } finally { setUploading(false) }
  }

  async function save() {
    if (saving) return
    if (!(form.name || '').trim()) { alert('Le nom est requis.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/propfirms', {
        method: 'POST', headers: await authHeaders(),
        body: JSON.stringify({
          id: form.id, market: form.market, name: form.name, slug: form.slug,
          logo_url: form.logo_url, website: form.website, reputation: form.reputation || null,
          tagline: form.tagline, is_active: form.is_active, sort_order: parseInt(form.sort_order, 10) || 100,
          data: buildData(form),
        }),
      })
      const j = await res.json()
      if (!res.ok) { alert('Échec : ' + (j.error || res.status)); return }
      setForm(null); load()
    } finally { setSaving(false) }
  }

  async function remove(f) {
    if (!confirm(`Supprimer "${f.name}" (${f.market}) ? Définitif.`)) return
    const res = await fetch(`/api/admin/propfirms?id=${f.id}`, { method: 'DELETE', headers: await authHeaders() })
    const j = await res.json()
    if (!res.ok) { alert('Échec : ' + (j.error || res.status)); return }
    load()
  }

  // ── FORM ──
  if (form) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 900 }}>
        <div style={{ fontSize: 11, color: C.red, letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>Admin · PropFirms</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 20 }}>{form.id ? 'Modifier la firme' : 'Nouvelle firme'}</h1>

        {/* Identité */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Marché"><select value={form.market} onChange={e => setForm(p => ({ ...p, market: e.target.value }))} style={input} disabled={!!form.id}><option value="cfd">CFD / Forex</option><option value="futures">Futures</option></select></Field>
          <Field label="Réputation"><select value={form.reputation} onChange={set('reputation')} style={input}>{REPUTATIONS.map(r => <option key={r.v} value={r.v}>{r.label}</option>)}</select></Field>
          <Field label="Nom *"><input value={form.name} onChange={set('name')} style={input} placeholder="Ex : My New Firm" /></Field>
          <Field label="Slug (URL)"><input value={form.slug} onChange={set('slug')} style={input} placeholder="my-new-firm" /></Field>
          <Field label="Site web" span><input value={form.website} onChange={set('website')} style={input} placeholder="https://…" /></Field>
          <Field label="Tagline (1 ligne)" span><input value={form.tagline} onChange={set('tagline')} style={input} /></Field>

          <Field label="Logo" span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {form.logo_url
                ? <img src={form.logo_url} alt="logo" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: `1px solid ${C.border2}` }} />
                : <div style={{ width: 48, height: 48, borderRadius: 10, background: C.surface2, border: `1px dashed ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3, fontSize: 18 }}>?</div>}
              <label style={{ ...ghost, cursor: uploading ? 'wait' : 'pointer' }}>{uploading ? '⏳ Upload…' : (form.logo_url ? 'Changer le logo' : 'Uploader un logo')}<input type="file" accept="image/*" onChange={onLogo} style={{ display: 'none' }} disabled={uploading} /></label>
              {form.logo_url && <button onClick={() => setForm(p => ({ ...p, logo_url: '' }))} style={ghost}>Retirer</button>}
            </div>
          </Field>
          <Field label="Ordre d’affichage"><input type="number" value={form.sort_order} onChange={set('sort_order')} style={input} /></Field>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text2, cursor: 'pointer' }}><input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />Active (visible in-app)</label>
          </div>
        </div>

        {form.market === 'cfd' ? (
          <>
            <div style={sectionTitle}>Modèle phare</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Nom du modèle" span3><input value={form.flagship.model} onChange={setFl('model')} style={input} placeholder="Ex : 2-Step Challenge" /></Field>
              <Field label="Étapes"><input type="number" value={form.flagship.steps} onChange={setFl('steps')} style={input} /></Field>
              <Field label="Devise"><input value={form.flagship.currency} onChange={setFl('currency')} style={input} /></Field>
              <Field label="Levier forex"><input type="number" value={form.flagship.leverageForex} onChange={setFl('leverageForex')} style={input} /></Field>
              <Field label="Tailles de compte (séparées par ,)" span3><input value={form.flagship.accountSizes} onChange={setFl('accountSizes')} style={input} placeholder="10000, 25000, 50000, 100000" /></Field>
              <Field label="Profit targets % (par étape, ,)" span3><input value={form.flagship.profitTargets} onChange={setFl('profitTargets')} style={input} placeholder="8, 5" /></Field>
              <Field label="Daily loss %"><input type="number" step="0.1" value={form.flagship.dailyPct} onChange={setFl('dailyPct')} style={input} /></Field>
              <Field label="Base daily" span2><select value={form.flagship.dailyBasis} onChange={setFl('dailyBasis')} style={input}>{DAILY_BASES.map(b => <option key={b.v} value={b.v}>{b.label}</option>)}</select></Field>
              <Field label="Max loss %"><input type="number" step="0.1" value={form.flagship.maxPct} onChange={setFl('maxPct')} style={input} /></Field>
              <Field label="Base max" span2><select value={form.flagship.maxBasis} onChange={setFl('maxBasis')} style={input}>{MAX_BASES.map(b => <option key={b.v} value={b.v}>{b.label}</option>)}</select></Field>
              <Field label="Split de %"><input type="number" value={form.flagship.splitFrom} onChange={setFl('splitFrom')} style={input} placeholder="80" /></Field>
              <Field label="Split à %"><input type="number" value={form.flagship.splitTo} onChange={setFl('splitTo')} style={input} placeholder="90" /></Field>
              <Field label="Jours min"><input type="number" value={form.flagship.minDays} onChange={setFl('minDays')} style={input} /></Field>
              <Field label="Consistance" span3><input value={form.flagship.consistency} onChange={setFl('consistency')} style={input} placeholder="Ex : 40% best-day (ou vide)" /></Field>
              <Field label="Payout — cycle"><input value={form.flagship.payoutCycle} onChange={setFl('payoutCycle')} style={input} placeholder="14 jours" /></Field>
              <Field label="Payout — 1er (J+)"><input type="number" value={form.flagship.payoutFirstDays} onChange={setFl('payoutFirstDays')} style={input} /></Field>
              <Field label="Payout — min"><input value={form.flagship.payoutMin} onChange={setFl('payoutMin')} style={input} placeholder="$100" /></Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <Field label="Plateformes (,)"><input value={form.platforms} onChange={set('platforms')} style={input} placeholder="MT5, cTrader" /></Field>
              <Field label="Instruments (,)"><input value={form.instruments} onChange={set('instruments')} style={input} placeholder="Forex, Indices, Métaux" /></Field>
            </div>

            <div style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 10 }}>
              Autres modèles ({form.otherModels.length})
              <button onClick={() => setForm(p => ({ ...p, otherModels: [...p.otherModels, emptyOther()] }))} style={{ ...ghost, padding: '4px 10px' }}>+ Ajouter</button>
            </div>
            {form.otherModels.map((o, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 8 }}>
                  <input value={o.name} onChange={e => setOther(i, 'name', e.target.value)} style={input} placeholder="Nom du modèle" />
                  <input type="number" value={o.steps} onChange={e => setOther(i, 'steps', e.target.value)} style={input} placeholder="Étapes" />
                  <input value={o.profitTargets} onChange={e => setOther(i, 'profitTargets', e.target.value)} style={input} placeholder="Targets % (,)" />
                  <button onClick={() => setForm(p => ({ ...p, otherModels: p.otherModels.filter((_, idx) => idx !== i) }))} style={{ ...ghost, color: C.red, borderColor: 'rgba(232,80,74,0.4)' }}>Retirer</button>
                  <input value={o.dailyPct} onChange={e => setOther(i, 'dailyPct', e.target.value)} style={input} placeholder="Daily %" />
                  <select value={o.dailyBasis} onChange={e => setOther(i, 'dailyBasis', e.target.value)} style={input}><option value="">Base daily…</option>{DAILY_BASES.map(b => <option key={b.v} value={b.v}>{b.label}</option>)}</select>
                  <input value={o.maxPct} onChange={e => setOther(i, 'maxPct', e.target.value)} style={input} placeholder="Max %" />
                  <select value={o.maxBasis} onChange={e => setOther(i, 'maxBasis', e.target.value)} style={input}><option value="">Base max…</option>{MAX_BASES.map(b => <option key={b.v} value={b.v}>{b.label}</option>)}</select>
                  <input value={o.desc} onChange={e => setOther(i, 'desc', e.target.value)} style={{ ...input, gridColumn: '1/-1' }} placeholder="Description (affichée sur la fiche)" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 10 }}>
              Programmes ({form.programs.length})
              <button onClick={() => setForm(p => ({ ...p, programs: [...p.programs, emptyProgram()] }))} style={{ ...ghost, padding: '4px 10px' }}>+ Programme</button>
            </div>
            <div style={{ fontSize: 11, color: C.text3, marginBottom: 12 }}>Un programme = une famille de comptes (ex : Lucid FLEX / PRO / INSTANT), avec ses tailles de compte et son tableau de règles.</div>
            {form.programs.map((prog, pi) => {
              const plans = csvStr(prog.plans)
              const setProg = (k, v) => setForm(p => ({ ...p, programs: p.programs.map((x, idx) => idx === pi ? { ...x, [k]: v } : x) }))
              const setRuleField = (ri, updater) => setForm(p => ({ ...p, programs: p.programs.map((x, idx) => idx === pi ? { ...x, rules: x.rules.map((r, j) => j === ri ? updater(r) : r) } : x) }))
              return (
                <div key={pi} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}><label style={label}>Nom du programme</label><input value={prog.name} onChange={e => setProg('name', e.target.value)} style={input} placeholder="Ex : FLEX" /></div>
                    <div style={{ flex: 2 }}><label style={label}>Plans / tailles (,)</label><input value={prog.plans} onChange={e => setProg('plans', e.target.value)} style={input} placeholder="25k, 50k, 100k, 150k" /></div>
                    {form.programs.length > 1 && <button onClick={() => setForm(p => ({ ...p, programs: p.programs.filter((_, idx) => idx !== pi) }))} style={{ ...ghost, color: C.red, borderColor: 'rgba(232,80,74,0.4)' }}>Retirer</button>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 8px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Règles ({prog.rules.length})</span>
                    <button onClick={() => setProg('rules', [...prog.rules, { label: '', values: {} }])} style={{ ...ghost, padding: '3px 9px' }}>+ Ligne</button>
                  </div>
                  {plans.length === 0
                    ? <div style={{ fontSize: 12, color: C.text3 }}>Renseigne les plans ci-dessus pour afficher les colonnes.</div>
                    : prog.rules.length > 0 && (
                      <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 10 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                          <thead><tr><th style={{ ...thStyle, minWidth: 150 }}>Règle</th>{plans.map(pl => <th key={pl} style={thStyle}>{pl.toUpperCase()}</th>)}<th style={thStyle} /></tr></thead>
                          <tbody>
                            {prog.rules.map((r, ri) => (
                              <tr key={ri}>
                                <td style={tdStyle}><input value={r.label} onChange={e => setRuleField(ri, x => ({ ...x, label: e.target.value }))} style={{ ...input, background: C.surface2 }} placeholder="Ex : Drawdown trailing max" /></td>
                                {plans.map(pl => <td key={pl} style={tdStyle}><input value={r.values[pl] || ''} onChange={e => setRuleField(ri, x => ({ ...x, values: { ...x.values, [pl]: e.target.value } }))} style={{ ...input, background: C.surface2 }} placeholder="—" /></td>)}
                                <td style={tdStyle}><button onClick={() => setProg('rules', prog.rules.filter((_, j) => j !== ri))} style={{ ...ghost, color: C.red, borderColor: 'rgba(232,80,74,0.4)', padding: '6px 10px' }}>✕</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
              )
            })}
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={save} disabled={saving} style={{ ...btn(C.blue), opacity: saving ? 0.6 : 1 }}>{saving ? '⏳' : '💾'} Enregistrer</button>
          <button onClick={() => setForm(null)} style={ghost}>Annuler</button>
        </div>
      </div>
    )
  }

  // ── LIST ──
  const byMarket = { cfd: [], futures: [] }
  ;(firms || []).forEach(f => { (byMarket[f.market] || (byMarket[f.market] = [])).push(f) })

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: C.red, letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>Admin</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>PropFirms</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value="" onChange={e => { if (!e.target.value) return; const [m, ...rest] = e.target.value.split('|'); setForm(importStaticFirm(m, rest.join('|'))) }} style={{ ...input, width: 'auto', maxWidth: 260 }}>
            <option value="">✎ Éditer une firme du catalogue…</option>
            <optgroup label="CFD / Forex">{STATIC_FIRMS.filter(s => s.market === 'cfd').map(s => <option key={'cfd|' + s.name} value={'cfd|' + s.name}>{s.name}</option>)}</optgroup>
            <optgroup label="Futures">{STATIC_FIRMS.filter(s => s.market === 'futures').map(s => <option key={'futures|' + s.name} value={'futures|' + s.name}>{s.name}</option>)}</optgroup>
          </select>
          <button onClick={() => setForm(emptyForm('cfd'))} style={btn(C.blue)}>+ Nouvelle firme</button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: C.text3, marginBottom: 22 }}>Ajoute de nouvelles firmes ou <b>édite une firme du catalogue</b> (crée un override prioritaire). Visibles in-app une fois actives.</p>

      {err && (
        <div style={{ padding: '12px 16px', background: 'rgba(232,80,74,0.08)', border: `1px solid ${C.red}`, borderRadius: 10, fontSize: 12.5, color: C.red, marginBottom: 20, whiteSpace: 'pre-wrap' }}>
          ⚠ {err}
          {/not.*exist|relation|table/i.test(err) && <div style={{ color: C.text2, marginTop: 6 }}>La table <code>custom_propfirms</code> n’existe pas encore — lance le SQL (voir CLAUDE.md).</div>}
        </div>
      )}

      {firms === null ? <div style={{ color: C.text3 }}>⏳ Chargement…</div>
        : firms.length === 0 && !err ? <div style={{ color: C.text3, fontSize: 13 }}>Aucune firme custom. Clique « + Nouvelle firme ».</div>
          : ['cfd', 'futures'].map(market => (byMarket[market]?.length > 0 && (
            <div key={market} style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>{market === 'cfd' ? 'CFD / Forex' : 'Futures'} ({byMarket[market].length})</div>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {byMarket[market].map((f, i) => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: i < byMarket[market].length - 1 ? `1px solid ${C.border}` : 'none', opacity: f.is_active ? 1 : 0.5 }}>
                    {f.logo_url ? <img src={f.logo_url} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 34, height: 34, borderRadius: 8, background: C.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3, fontWeight: 700, flexShrink: 0 }}>{(f.name || '?')[0]}</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{f.name} {!f.is_active && <span style={{ fontSize: 10, color: C.text3 }}>(inactive)</span>}</div>
                      <div style={{ fontSize: 11, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.tagline || f.slug || '—'}</div>
                    </div>
                    {f.reputation && <span style={{ fontSize: 11, color: C.text3 }}>{f.reputation}</span>}
                    <button onClick={() => setForm(parseForm(f))} style={ghost}>Modifier</button>
                    <button onClick={() => remove(f)} style={{ ...ghost, color: C.red, borderColor: 'rgba(232,80,74,0.4)' }}>Supprimer</button>
                  </div>
                ))}
              </div>
            </div>
          )))}
    </div>
  )
}

function Field({ label: lbl, children, span, span2, span3 }) {
  const gc = span3 ? '1/-1' : span2 ? 'span 2' : span ? '1/-1' : undefined
  return <div style={gc ? { gridColumn: gc } : undefined}><label style={label}>{lbl}</label>{children}</div>
}
const thStyle = { padding: '8px 10px', fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, background: C.surface2, whiteSpace: 'nowrap' }
const tdStyle = { padding: '6px 8px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' }
