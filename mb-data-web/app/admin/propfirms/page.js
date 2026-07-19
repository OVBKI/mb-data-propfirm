'use client'
// Admin PropFirms CMS — add / edit / delete custom firms (futures + CFD),
// upload a logo, edit the rule blob. Overlays the static catalog; the in-app
// merge reads these via the anon key (RLS public-read).
//
// Backed by /api/admin/propfirms (verifyAdmin + service role) and the
// `propfirm-logos` Supabase Storage bucket (public).

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { uploadFile } from '../../../lib/uploadFile'

const C = {
  bg: '#0d0f14', surface: '#141720', surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8', text2: '#9098b0', text3: '#7b839b',
  blue: '#2d6fff', blueLight: '#4d8fff', green: '#1db87a', amber: '#fac775', red: '#e8504a',
}

const REPUTATIONS = [
  { v: '', label: '—' },
  { v: 'solid', label: 'Fiable' },
  { v: 'ok', label: 'Correct' },
  { v: 'caution', label: 'Prudence' },
]

// Starter rule blobs shown in the JSON editor for a new firm (guidance only).
const DATA_TEMPLATE = {
  cfd: {
    platforms: ['MT5', 'cTrader'],
    instruments: ['Forex', 'Indices'],
    flagship: {
      model: '2-Step Challenge', steps: 2, accountSizes: [10000, 25000, 50000, 100000],
      currency: 'USD', profitTargets: [8, 5],
      dailyLoss: { pct: 5, basis: 'balance' }, maxLoss: { pct: 10, basis: 'static' },
      minTradingDays: 3, profitSplit: { from: 80, to: 90 },
      payout: { firstDays: 14, cycle: '14 jours', min: '$100' }, consistency: null,
    },
    otherModels: [],
  },
  futures: {
    plans: ['50k', '100k', '150k'],
    rules: { 'Max Loss Limit': { '50k': '$2,000', '100k': '$3,000', '150k': '$4,500' } },
  },
}

const emptyForm = (market = 'cfd') => ({
  id: null, market, name: '', slug: '', logo_url: '', website: '',
  reputation: '', tagline: '', is_active: true, sort_order: 100,
  dataText: JSON.stringify(DATA_TEMPLATE[market], null, 2),
})

const input = { width: '100%', padding: '9px 11px', fontSize: 13, border: `1px solid ${C.border2}`, borderRadius: 8, background: C.surface2, color: C.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const label = { fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }
const btn = (bg, col = '#fff') => ({ padding: '9px 16px', fontSize: 12.5, fontWeight: 600, borderRadius: 8, background: bg, color: col, border: 'none', cursor: 'pointer', fontFamily: 'inherit' })
const ghost = { padding: '8px 14px', fontSize: 12, fontWeight: 500, background: 'transparent', border: `1px solid ${C.border2}`, color: C.text2, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` }
}

export default function AdminPropfirmsPage() {
  const [firms, setFirms] = useState(null)
  const [err, setErr] = useState(null)
  const [form, setForm] = useState(null) // null = list view; object = editing
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/propfirms', { headers: await authHeaders() })
      const j = await res.json()
      if (!res.ok) { setErr(j.error || ('HTTP ' + res.status)); return }
      setFirms(j.firms || [])
      setErr(null)
    } catch (e) { setErr(e.message) }
  }, [])

  useEffect(() => { load() }, [load])

  function openNew() { setForm(emptyForm('cfd')) }
  function openEdit(f) {
    setForm({
      id: f.id, market: f.market, name: f.name, slug: f.slug || '', logo_url: f.logo_url || '',
      website: f.website || '', reputation: f.reputation || '', tagline: f.tagline || '',
      is_active: f.is_active !== false, sort_order: f.sort_order ?? 100,
      dataText: JSON.stringify(f.data || {}, null, 2),
    })
  }
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  async function onLogo(e) {
    const file = e.target.files?.[0]
    if (!file) return
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
    let data
    try { data = form.dataText.trim() ? JSON.parse(form.dataText) : {} }
    catch { alert('Le JSON des règles est invalide. Corrige-le avant d’enregistrer.'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/propfirms', {
        method: 'POST', headers: await authHeaders(),
        body: JSON.stringify({
          id: form.id, market: form.market, name: form.name, slug: form.slug,
          logo_url: form.logo_url, website: form.website, reputation: form.reputation || null,
          tagline: form.tagline, is_active: form.is_active,
          sort_order: parseInt(form.sort_order, 10) || 100, data,
        }),
      })
      const j = await res.json()
      if (!res.ok) { alert('Échec : ' + (j.error || res.status)); return }
      setForm(null)
      load()
    } finally { setSaving(false) }
  }

  async function remove(f) {
    if (!confirm(`Supprimer "${f.name}" (${f.market}) ? Cette action est définitive.`)) return
    const res = await fetch(`/api/admin/propfirms?id=${f.id}`, { method: 'DELETE', headers: await authHeaders() })
    const j = await res.json()
    if (!res.ok) { alert('Échec : ' + (j.error || res.status)); return }
    load()
  }

  // ── Form view ──
  if (form) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: 760 }}>
        <div style={{ fontSize: 11, color: C.red, letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>Admin · PropFirms</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 20 }}>{form.id ? 'Modifier la firme' : 'Nouvelle firme'}</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={label}>Marché</label>
            <select value={form.market} onChange={e => setForm(p => ({ ...p, market: e.target.value }))} style={input} disabled={!!form.id}>
              <option value="cfd">CFD / Forex</option>
              <option value="futures">Futures</option>
            </select>
          </div>
          <div>
            <label style={label}>Réputation</label>
            <select value={form.reputation} onChange={set('reputation')} style={input}>
              {REPUTATIONS.map(r => <option key={r.v} value={r.v}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Nom *</label>
            <input value={form.name} onChange={set('name')} style={input} placeholder="Ex : My New Firm" />
          </div>
          <div>
            <label style={label}>Slug (URL)</label>
            <input value={form.slug} onChange={set('slug')} style={input} placeholder="my-new-firm" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={label}>Site web</label>
            <input value={form.website} onChange={set('website')} style={input} placeholder="https://…" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={label}>Tagline (1 ligne)</label>
            <input value={form.tagline} onChange={set('tagline')} style={input} />
          </div>

          {/* Logo */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={label}>Logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {form.logo_url
                ? <img src={form.logo_url} alt="logo" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: `1px solid ${C.border2}` }} />
                : <div style={{ width: 48, height: 48, borderRadius: 10, background: C.surface2, border: `1px dashed ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3, fontSize: 18 }}>?</div>}
              <label style={{ ...ghost, cursor: uploading ? 'wait' : 'pointer' }}>
                {uploading ? '⏳ Upload…' : (form.logo_url ? 'Changer le logo' : 'Uploader un logo')}
                <input type="file" accept="image/*" onChange={onLogo} style={{ display: 'none' }} disabled={uploading} />
              </label>
              {form.logo_url && <button onClick={() => setForm(p => ({ ...p, logo_url: '' }))} style={ghost}>Retirer</button>}
            </div>
            <input value={form.logo_url} onChange={set('logo_url')} style={{ ...input, marginTop: 8, fontSize: 11, color: C.text3 }} placeholder="…ou colle une URL de logo" />
          </div>

          <div>
            <label style={label}>Ordre d’affichage</label>
            <input type="number" value={form.sort_order} onChange={set('sort_order')} style={input} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text2, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} />
              Active (visible in-app)
            </label>
          </div>

          {/* Rules JSON */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={label}>Règles (JSON) — structure spécifique au marché</label>
            <textarea value={form.dataText} onChange={set('dataText')} rows={14} spellCheck={false}
              style={{ ...input, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5, resize: 'vertical', minHeight: 220 }} />
            <div style={{ fontSize: 11, color: C.text3, marginTop: 6, lineHeight: 1.5 }}>
              CFD : <code>flagship</code> + <code>otherModels</code> (voir <code>lib/cfdConstants.js</code>). Futures : <code>plans</code> + <code>rules</code> (voir <code>lib/constants.js</code>). Le template est pré-rempli pour une nouvelle firme.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button onClick={save} disabled={saving} style={{ ...btn(C.blue), opacity: saving ? 0.6 : 1 }}>{saving ? '⏳' : '💾'} Enregistrer</button>
          <button onClick={() => setForm(null)} style={ghost}>Annuler</button>
        </div>
      </div>
    )
  }

  // ── List view ──
  const byMarket = { cfd: [], futures: [] }
  ;(firms || []).forEach(f => { (byMarket[f.market] || (byMarket[f.market] = [])).push(f) })

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: C.red, letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>Admin</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>PropFirms</h1>
        </div>
        <button onClick={openNew} style={btn(C.blue)}>+ Nouvelle firme</button>
      </div>
      <p style={{ fontSize: 13, color: C.text3, marginBottom: 22 }}>
        Firmes gérées par l’admin (en plus du catalogue codé en dur). Elles apparaissent in-app une fois actives.
      </p>

      {err && (
        <div style={{ padding: '12px 16px', background: 'rgba(232,80,74,0.08)', border: `1px solid ${C.red}`, borderRadius: 10, fontSize: 12.5, color: C.red, marginBottom: 20, whiteSpace: 'pre-wrap' }}>
          ⚠ {err}
          {/not.*exist|relation|table/i.test(err) && <div style={{ color: C.text2, marginTop: 6 }}>La table <code>custom_propfirms</code> n’existe pas encore — lance le SQL (voir CLAUDE.md).</div>}
        </div>
      )}

      {firms === null ? (
        <div style={{ color: C.text3 }}>⏳ Chargement…</div>
      ) : firms.length === 0 && !err ? (
        <div style={{ color: C.text3, fontSize: 13 }}>Aucune firme custom. Clique « + Nouvelle firme » pour commencer.</div>
      ) : (
        ['cfd', 'futures'].map(market => (
          byMarket[market]?.length > 0 && (
            <div key={market} style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
                {market === 'cfd' ? 'CFD / Forex' : 'Futures'} ({byMarket[market].length})
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {byMarket[market].map((f, i) => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: i < byMarket[market].length - 1 ? `1px solid ${C.border}` : 'none', opacity: f.is_active ? 1 : 0.5 }}>
                    {f.logo_url
                      ? <img src={f.logo_url} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 34, height: 34, borderRadius: 8, background: C.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3, fontWeight: 700, flexShrink: 0 }}>{(f.name || '?')[0]}</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{f.name} {!f.is_active && <span style={{ fontSize: 10, color: C.text3 }}>(inactive)</span>}</div>
                      <div style={{ fontSize: 11, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.tagline || f.slug || '—'}</div>
                    </div>
                    {f.reputation && <span style={{ fontSize: 11, color: C.text3 }}>{f.reputation}</span>}
                    <button onClick={() => openEdit(f)} style={ghost}>Modifier</button>
                    <button onClick={() => remove(f)} style={{ ...ghost, color: C.red, borderColor: 'rgba(232,80,74,0.4)' }}>Supprimer</button>
                  </div>
                ))}
              </div>
            </div>
          )
        ))
      )}
    </div>
  )
}
