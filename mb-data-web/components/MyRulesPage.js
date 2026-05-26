'use client'
//
// components/MyRulesPage.js — Page "Mes règles" du trader.
//
// 3 onglets :
//   1. Plan       — textarea autosave, plan de trading global (1 row trading_plan)
//   2. Setups     — cards CRUD (nom + description + conditions + screenshot)
//   3. Règles     — checklist par catégorie (risk/mindset/execution/other)
//
// Tables DB : trading_plan, trading_setups, trading_rule_items (créées via SQL).
// Compatible avec /app?p=myrules — rendu depuis app/app/page.js.

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { uploadFile } from '../lib/uploadFile'
import { useT } from './LanguageProvider'
import Skeleton from './Skeleton'

const C = {
  surface:   'rgba(20,23,32,0.65)',
  surface2:  'rgba(28,32,48,0.7)',
  border:    'rgba(255,255,255,0.07)',
  border2:   'rgba(255,255,255,0.13)',
  text:      '#f0ede8',
  text2:     '#9098b0',
  text3:     '#5a6275',
  green:     '#1db87a',
  red:       '#e8504a',
  amber:     '#fac775',
  blue:      '#2d6fff',
  blueLt:    '#4d8fff',
  purple:    '#a78bfa',
}

const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }
const inputS = { width: '100%', padding: '10px 12px', fontSize: 13, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 8, background: 'rgba(255,255,255,0.02)', color: C.text, outline: 'none', fontFamily: 'inherit' }
const labelS = { fontSize: 10.5, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 6 }
const btnPrimary = { padding: '8px 16px', fontSize: 12.5, fontWeight: 500, background: C.text, color: '#0a0c10', border: '1px solid transparent', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' }
const btnGhost = { padding: '7px 13px', fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.10)', color: C.text2, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }
const btnDanger = { padding: '6px 11px', fontSize: 11, fontWeight: 500, background: 'rgba(232,80,74,0.08)', border: '1px solid rgba(232,80,74,0.25)', color: C.red, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }

const RULE_CATEGORIES = [
  { k: 'risk',      lk: 'catRisk',      color: '#e8504a' },
  { k: 'mindset',   lk: 'catMindset',   color: '#a78bfa' },
  { k: 'execution', lk: 'catExecution',  color: '#1db87a' },
  { k: 'other',     lk: 'catOther',     color: '#9098b0' },
]

const TABS = [
  { k: 'plan',    lk: 'tabPlan' },
  { k: 'setups',  lk: 'tabSetups' },
  { k: 'rules',   lk: 'tabRules' },
]

export default function MyRulesPage({ user, showToast }) {
  const t = useT()
  const [tab, setTab] = useState('plan')

  if (!user?.id) {
    return (
      <div style={{ padding: '0 4px', maxWidth: 1100, margin: '0 auto' }}>
        <Skeleton width={140} height={22} style={{ marginBottom: 8 }} />
        <Skeleton width={400} height={13} style={{ marginBottom: 20 }} />
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} width={130} height={36} />)}
        </div>
        <Skeleton width="100%" height={300} style={{ borderRadius: 10 }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '0 4px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, marginBottom: 4 }}>
          {t('app.myrules.title')}
        </h2>
        <p style={{ fontSize: 13, color: C.text2, margin: 0 }}>
          {t('app.myrules.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(t_tab => (
          <button
            key={t_tab.k}
            onClick={() => setTab(t_tab.k)}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: tab === t_tab.k ? 600 : 500,
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === t_tab.k ? C.blueLt : 'transparent'}`,
              color: tab === t_tab.k ? C.blueLt : C.text2,
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: -1,
            }}
          >{t('app.myrules.' + t_tab.lk)}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'plan'   && <PlanTab   user={user} showToast={showToast} />}
      {tab === 'setups' && <SetupsTab user={user} showToast={showToast} />}
      {tab === 'rules'  && <RulesTab  user={user} showToast={showToast} />}
    </div>
  )
}

// ============================================================================
// TAB 1 : Plan de trading (textarea avec autosave debounced)
// ============================================================================
function PlanTab({ user, showToast }) {
  const t = useT()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [savedAt, setSavedAt] = useState(null)
  const saveTimer = useRef(null)
  const lastSavedContent = useRef('')

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('trading_plan')
        .select('content, updated_at')
        .eq('user_id', user.id)
        .single()
      if (error && error.code !== 'PGRST116') {
        console.warn('[plan load]', error)
      }
      const c = data?.content || ''
      setContent(c)
      lastSavedContent.current = c
      if (data?.updated_at) setSavedAt(new Date(data.updated_at))
      setLoading(false)
    })()
  }, [user.id])

  // Autosave debounced 1.5s après dernière édit
  useEffect(() => {
    if (loading) return
    if (content === lastSavedContent.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from('trading_plan')
        .upsert({ user_id: user.id, content, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (error) {
        console.error('[plan save]', error)
        showToast?.(t('app.myrules.planSaveError'))
        return
      }
      lastSavedContent.current = content
      setSavedAt(new Date())
    }, 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [content, loading, user.id])

  if (loading) return (
    <div style={{ ...card, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Skeleton width={200} height={14} />
        <Skeleton width={100} height={11} />
      </div>
      <Skeleton width="100%" height={300} style={{ borderRadius: 8 }} />
    </div>
  )

  return (
    <div>
      <div style={{ ...card, padding: 18, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{t('app.myrules.planTitle')}</h3>
          {savedAt && (
            <span style={{ fontSize: 11, color: C.text3 }}>
              {t('app.myrules.planSavedAt')} {savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={t('app.myrules.planPlaceholder')}
          style={{ ...inputS, minHeight: 400, resize: 'vertical', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: 13, lineHeight: 1.6 }}
        />
        <div style={{ marginTop: 8, fontSize: 11, color: C.text3, textAlign: 'right' }}>
          {content.length} {t('app.myrules.planChars')} · {t('app.myrules.planAutosave')}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TAB 2 : Setups (cards CRUD)
// ============================================================================
function SetupsTab({ user, showToast }) {
  const t = useT()
  const [setups, setSetups] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)  // null | 'new' | setup object

  async function loadSetups() {
    setLoading(true)
    const { data, error } = await supabase
      .from('trading_setups')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) {
      console.error('[setups load]', error)
      showToast?.(t('app.myrules.setupsLoadError'))
      setLoading(false)
      return
    }
    setSetups(data || [])
    setLoading(false)
  }

  useEffect(() => { loadSetups() }, [user.id])

  async function saveSetup(form) {
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      description: form.description.trim(),
      conditions: form.conditions.trim(),
      screenshot_url: form.screenshot_url || null,
      active: form.active !== false,
      sort_order: form.sort_order || 0,
      updated_at: new Date().toISOString(),
    }
    let res
    if (form.id) {
      res = await supabase.from('trading_setups').update(payload).eq('id', form.id)
    } else {
      res = await supabase.from('trading_setups').insert(payload)
    }
    if (res.error) {
      console.error('[setup save]', res.error)
      showToast?.(t('app.myrules.setupSaveError'))
      return
    }
    showToast?.(form.id ? t('app.myrules.setupUpdated') : t('app.myrules.setupAdded'))
    setEditing(null)
    await loadSetups()
  }

  async function deleteSetup(id) {
    if (!confirm(t('app.myrules.setupConfirmDelete'))) return
    const { error } = await supabase.from('trading_setups').delete().eq('id', id)
    if (error) { showToast?.(t('app.myrules.setupDeleteError')); return }
    showToast?.(t('app.myrules.setupDeleted'))
    await loadSetups()
  }

  if (loading) return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <Skeleton width={140} height={14} />
        <Skeleton width={120} height={32} style={{ borderRadius: 7 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ ...card, padding: 16 }}>
            <Skeleton width="100%" height={120} style={{ borderRadius: 6, marginBottom: 10 }} />
            <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton.Text lines={2} />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      {/* Header + Add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>
          {t('app.myrules.setupsTitle')} <span style={{ color: C.text3, fontWeight: 500, marginLeft: 6 }}>({setups.length})</span>
        </h3>
        <button onClick={() => setEditing('new')} style={btnPrimary}>{t('app.myrules.setupsNew')}</button>
      </div>

      {/* Liste */}
      {setups.length === 0 ? (
        <div style={{ ...card, padding: 32, textAlign: 'center', color: C.text2 }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>🎯</div>
          <div style={{ fontWeight: 600, color: C.text, marginBottom: 4 }}>{t('app.myrules.setupsEmptyTitle')}</div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>{t('app.myrules.setupsEmptyBody')}</div>
          <button onClick={() => setEditing('new')} style={btnPrimary}>{t('app.myrules.setupsCreate')}</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {setups.map(s => (
            <SetupCard key={s.id} setup={s} onEdit={() => setEditing(s)} onDelete={() => deleteSetup(s.id)} />
          ))}
        </div>
      )}

      {/* Modal édit/création */}
      {editing && (
        <SetupModal
          user={user}
          setup={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={saveSetup}
          showToast={showToast}
        />
      )}
    </div>
  )
}

function SetupCard({ setup, onEdit, onDelete }) {
  const t = useT()
  return (
    <div style={{ ...card, padding: 16, position: 'relative', opacity: setup.active === false ? 0.5 : 1 }}>
      {setup.screenshot_url && (
        <img
          src={setup.screenshot_url}
          alt={setup.name}
          style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6, marginBottom: 10, border: `1px solid ${C.border}` }}
        />
      )}
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>{setup.name}</div>
      {setup.description && (
        <div style={{ fontSize: 12, color: C.text2, marginBottom: 8, lineHeight: 1.5 }}>{setup.description}</div>
      )}
      {setup.conditions && (
        <div style={{ fontSize: 11, color: C.text3, whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: 10, padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 4, borderLeft: `2px solid ${C.blueLt}` }}>
          {setup.conditions}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button onClick={onEdit} style={btnGhost}>{t('app.myrules.setupEdit')}</button>
        <button onClick={onDelete} style={btnDanger}>🗑</button>
      </div>
    </div>
  )
}

function SetupModal({ user, setup, onClose, onSave, showToast }) {
  const t = useT()
  const [form, setForm] = useState({
    id: setup?.id,
    name: setup?.name || '',
    description: setup?.description || '',
    conditions: setup?.conditions || '',
    screenshot_url: setup?.screenshot_url || '',
    active: setup?.active !== false,
    sort_order: setup?.sort_order || 0,
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleUpload(file) {
    if (!file) return
    setUploading(true)
    const { url, error } = await uploadFile({ bucket: 'trade-screenshots', file, userId: user.id })
    setUploading(false)
    if (error) { alert(error); return }
    setForm(p => ({ ...p, screenshot_url: url }))
  }

  async function handleSave() {
    if (!form.name.trim()) { showToast?.(t('app.myrules.setupNameRequired')); return }
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ ...card, padding: 24, width: 560, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18 }}>
          {setup ? t('app.myrules.setupModalEdit') : t('app.myrules.setupModalNew')}
        </h3>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={labelS}>{t('app.myrules.setupName')}</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder={t('app.myrules.setupNamePH')}
              style={inputS}
              autoFocus
            />
          </div>
          <div>
            <label style={labelS}>{t('app.myrules.setupDesc')}</label>
            <input
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder={t('app.myrules.setupDescPH')}
              style={inputS}
            />
          </div>
          <div>
            <label style={labelS}>{t('app.myrules.setupConditions')}</label>
            <textarea
              rows={6}
              value={form.conditions}
              onChange={e => setForm(p => ({ ...p, conditions: e.target.value }))}
              placeholder={t('app.myrules.setupConditionsPH')}
              style={{ ...inputS, resize: 'vertical', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: 12 }}
            />
          </div>
          <div>
            <label style={labelS}>{t('app.myrules.setupScreenshot')}</label>
            {form.screenshot_url ? (
              <div style={{ position: 'relative' }}>
                <img src={form.screenshot_url} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.border}` }} />
                <button
                  onClick={() => setForm(p => ({ ...p, screenshot_url: '' }))}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 9px', fontSize: 11, cursor: 'pointer' }}
                >✕</button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, border: `1px dashed ${C.border2}`, borderRadius: 8, cursor: uploading ? 'wait' : 'pointer', background: C.surface2, color: C.text2, fontSize: 12 }}>
                {uploading ? t('app.myrules.setupUploading') : t('app.myrules.setupUploadCTA')}
                <input type="file" accept="image/*" disabled={uploading} onChange={e => handleUpload(e.target.files?.[0])} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="setup-active"
              checked={form.active}
              onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
            />
            <label htmlFor="setup-active" style={{ fontSize: 12, color: C.text2, cursor: 'pointer' }}>{t('app.myrules.setupActive')}</label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={btnGhost} disabled={saving}>{t('app.myrules.setupCancel')}</button>
          <button onClick={handleSave} style={btnPrimary} disabled={saving}>
            {saving ? '...' : setup ? t('app.myrules.setupSave') : t('app.myrules.setupCreate')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TAB 3 : Règles (checklist par catégorie)
// ============================================================================
function RulesTab({ user, showToast }) {
  const t = useT()
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [newRule, setNewRule] = useState({ text: '', category: 'risk' })

  async function loadRules() {
    setLoading(true)
    const { data, error } = await supabase
      .from('trading_rule_items')
      .select('*')
      .eq('user_id', user.id)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) {
      console.error('[rules load]', error)
      showToast?.(t('app.myrules.rulesLoadError'))
      setLoading(false)
      return
    }
    setRules(data || [])
    setLoading(false)
  }

  useEffect(() => { loadRules() }, [user.id])

  async function addRule() {
    if (!newRule.text.trim()) return
    const { error } = await supabase.from('trading_rule_items').insert({
      user_id: user.id,
      rule_text: newRule.text.trim(),
      category: newRule.category,
      active: true,
      sort_order: rules.filter(r => r.category === newRule.category).length,
    })
    if (error) { showToast?.(t('app.myrules.rulesAddError')); return }
    setNewRule({ text: '', category: newRule.category })
    await loadRules()
  }

  async function toggleActive(rule) {
    const { error } = await supabase
      .from('trading_rule_items')
      .update({ active: !rule.active })
      .eq('id', rule.id)
    if (error) { showToast?.(t('app.myrules.rulesToggleError')); return }
    await loadRules()
  }

  async function deleteRule(id) {
    if (!confirm(t('app.myrules.rulesConfirmDelete'))) return
    const { error } = await supabase.from('trading_rule_items').delete().eq('id', id)
    if (error) { showToast?.(t('app.myrules.rulesDeleteError')); return }
    showToast?.(t('app.myrules.rulesDeleted'))
    await loadRules()
  }

  if (loading) return (
    <div style={{ display: 'grid', gap: 14 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ ...card, padding: 16 }}>
          <Skeleton width={140} height={12} style={{ marginBottom: 12 }} />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} style={{ display: 'flex', gap: 10, padding: '8px 10px', marginBottom: 4 }}>
              <Skeleton width={16} height={16} />
              <Skeleton width="80%" height={13} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )

  // Group rules par catégorie
  const grouped = RULE_CATEGORIES.reduce((acc, cat) => {
    acc[cat.k] = rules.filter(r => r.category === cat.k)
    return acc
  }, {})

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0, marginBottom: 4 }}>
          {t('app.myrules.rulesTitle')} <span style={{ color: C.text3, fontWeight: 500, marginLeft: 6 }}>({rules.length})</span>
        </h3>
        <div style={{ fontSize: 12, color: C.text3 }}>
          {t('app.myrules.rulesSubtitle')}
        </div>
      </div>

      {/* Add new */}
      <div style={{ ...card, padding: 14, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <select
          value={newRule.category}
          onChange={e => setNewRule(p => ({ ...p, category: e.target.value }))}
          style={{ ...inputS, width: 200 }}
        >
          {RULE_CATEGORIES.map(c => <option key={c.k} value={c.k}>{t('app.myrules.' + c.lk)}</option>)}
        </select>
        <input
          value={newRule.text}
          onChange={e => setNewRule(p => ({ ...p, text: e.target.value }))}
          onKeyDown={e => { if (e.key === 'Enter') addRule() }}
          placeholder={t('app.myrules.rulesPlaceholder')}
          style={{ ...inputS, flex: 1 }}
        />
        <button onClick={addRule} style={btnPrimary} disabled={!newRule.text.trim()}>{t('app.myrules.rulesAdd')}</button>
      </div>

      {/* Liste par catégorie */}
      <div style={{ display: 'grid', gap: 14 }}>
        {RULE_CATEGORIES.map(cat => {
          const catRules = grouped[cat.k]
          return (
            <div key={cat.k} style={{ ...card, padding: 16 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: cat.color,
                marginBottom: 12, letterSpacing: '0.02em',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>{t('app.myrules.' + cat.lk)}</span>
                <span style={{ color: C.text3, fontSize: 11, fontWeight: 500 }}>{catRules.length} règle{catRules.length > 1 ? 's' : ''}</span>
              </div>
              {catRules.length === 0 ? (
                <div style={{ fontSize: 12, color: C.text3, fontStyle: 'italic', padding: 6 }}>
                  {t('app.myrules.rulesEmpty')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {catRules.map(r => (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px',
                      background: r.active ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
                      borderRadius: 6,
                      opacity: r.active ? 1 : 0.5,
                      borderLeft: `2px solid ${r.active ? cat.color : 'transparent'}`,
                    }}>
                      <input
                        type="checkbox"
                        checked={r.active}
                        onChange={() => toggleActive(r)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{
                        fontSize: 13, color: r.active ? C.text : C.text3,
                        textDecoration: r.active ? 'none' : 'line-through',
                        flex: 1,
                      }}>{r.rule_text}</span>
                      <button onClick={() => deleteRule(r.id)} style={{ background: 'transparent', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 14, padding: 2 }} title="Supprimer">🗑</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
