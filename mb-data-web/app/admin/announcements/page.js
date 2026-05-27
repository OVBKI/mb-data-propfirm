'use client'
// Admin Announcements — CRUD sur les bannières globales du site.
// Les annonces actives sont affichées sur /app via <AnnouncementBanner />.

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

// Helper pour appeler les routes API admin avec le token Bearer de la session courante
async function adminFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Non authentifié')
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  surface3: '#222637',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#7b839b',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
  red: '#e8504a',
}

const TYPES = [
  { value: 'info',    label: 'ℹ️ Info',    color: C.blueLight, bg: 'rgba(45,111,255,0.10)' },
  { value: 'success', label: '✅ Succès',  color: C.green,     bg: 'rgba(29,184,122,0.10)' },
  { value: 'warn',    label: '⚠️ Attention',color: C.amber,     bg: 'rgba(250,199,117,0.10)' },
  { value: 'promo',   label: '🎉 Promo',   color: '#f472b6',   bg: 'rgba(244,114,182,0.10)' },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
function toDateTimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  // Format YYYY-MM-DDTHH:mm pour input datetime-local
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const emptyForm = {
  title: '',
  message: '',
  type: 'info',
  active: true,
  starts_at: '',
  ends_at: '',
  link_url: '',
  link_label: '',
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | item | 'new'
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true); setError('')
    try {
      const json = await adminFetch('/api/admin/announcements')
      setItems(json.data || [])
    } catch (err) {
      setError(err.message)
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm({ ...emptyForm, starts_at: toDateTimeLocal(new Date().toISOString()) })
    setEditing('new')
  }
  function openEdit(item) {
    setForm({
      title: item.title || '',
      message: item.message || '',
      type: item.type || 'info',
      active: item.active,
      starts_at: toDateTimeLocal(item.starts_at),
      ends_at: toDateTimeLocal(item.ends_at),
      link_url: item.link_url || '',
      link_label: item.link_label || '',
    })
    setEditing(item)
  }
  function closeEdit() {
    setEditing(null)
    setForm(emptyForm)
  }

  async function save() {
    if (!form.title.trim()) { alert('Titre requis'); return }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      type: form.type,
      active: form.active,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      link_url: form.link_url.trim() || null,
      link_label: form.link_label.trim() || null,
    }
    try {
      if (editing === 'new') {
        await adminFetch('/api/admin/announcements', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      } else {
        await adminFetch('/api/admin/announcements', {
          method: 'PUT',
          body: JSON.stringify({ ...payload, id: editing.id }),
        })
      }
      closeEdit()
      load()
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
    setSaving(false)
  }

  async function toggleActive(item) {
    try {
      await adminFetch('/api/admin/announcements', {
        method: 'PUT',
        body: JSON.stringify({ id: item.id, active: !item.active }),
      })
      load()
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
  }

  async function remove(item) {
    if (!confirm(`Supprimer l'annonce "${item.title}" ?`)) return
    try {
      await adminFetch(`/api/admin/announcements?id=${item.id}`, {
        method: 'DELETE',
      })
      load()
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
  }

  function isLive(item) {
    if (!item.active) return false
    const now = Date.now()
    const starts = item.starts_at ? new Date(item.starts_at).getTime() : 0
    const ends = item.ends_at ? new Date(item.ends_at).getTime() : Infinity
    return starts <= now && now <= ends
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', fontSize: 13,
    background: C.surface2, border: `1px solid ${C.border2}`,
    borderRadius: 8, color: C.text, outline: 'none', fontFamily: 'inherit',
  }
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600, color: C.text3,
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
  }

  return (
    <div style={{ padding: '32px 32px' }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#e8504a', letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>
          Admin
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8, gap: 14, flexWrap: 'wrap',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Annonces / Bannières</h1>
        <button onClick={openNew} style={{
          padding: '10px 18px', fontSize: 13, fontWeight: 500, borderRadius: 8,
          background: '#f0ede8', color: '#0a0c10', border: '1px solid transparent', cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)',
        }}>+ Nouvelle annonce</button>
      </div>
      <p style={{ fontSize: 13, color: C.text3, marginBottom: 22 }}>
        Crée des bannières visibles par tous les users connectés. Utile pour annoncer des promos,
        des nouveautés, ou des maintenances.
      </p>

      {error && (
        <div style={{
          padding: 16, marginBottom: 20, background: 'rgba(232,80,74,0.08)',
          border: `1px solid ${C.red}`, borderRadius: 10, fontSize: 13, color: C.red,
        }}>⚠ {error}</div>
      )}

      {/* Liste des annonces */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>⏳ Chargement...</div>
      ) : items.length === 0 ? (
        <div style={{
          padding: 60, textAlign: 'center', background: C.surface,
          border: `1px dashed ${C.border2}`, borderRadius: 12, color: C.text3, fontSize: 14,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          Aucune annonce créée pour l'instant.<br />
          <button onClick={openNew} style={{
            marginTop: 16, padding: '10px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8,
            background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>+ Créer ma 1ère annonce</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(item => {
            const typeMeta = TYPES.find(t => t.value === item.type) || TYPES[0]
            const live = isLive(item)
            return (
              <div key={item.id} style={{
                background: C.surface, border: `1px solid ${live ? typeMeta.color : C.border}`,
                borderRadius: 12, padding: 18,
                opacity: item.active ? 1 : 0.5,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                        background: typeMeta.bg, color: typeMeta.color,
                      }}>{typeMeta.label}</span>
                      {live ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(29,184,122,0.15)', color: C.green }}>
                          🟢 LIVE
                        </span>
                      ) : item.active ? (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(250,199,117,0.15)', color: C.amber }}>
                          ⏰ Programmé / Expiré
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: C.surface2, color: C.text3 }}>
                          ⏸ Désactivé
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
                    {item.message && (
                      <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, marginBottom: 6 }}>{item.message}</div>
                    )}
                    <div style={{ fontSize: 11, color: C.text3, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span>📅 Du {formatDate(item.starts_at)}</span>
                      <span>→ {item.ends_at ? formatDate(item.ends_at) : 'illimité'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => toggleActive(item)} title={item.active ? 'Désactiver' : 'Activer'} style={{
                      padding: '6px 10px', fontSize: 11, borderRadius: 6, border: `1px solid ${C.border2}`,
                      background: 'transparent', color: C.text2, cursor: 'pointer', fontFamily: 'inherit',
                    }}>{item.active ? '⏸' : '▶'}</button>
                    <button onClick={() => openEdit(item)} style={{
                      padding: '6px 10px', fontSize: 11, borderRadius: 6, border: `1px solid ${C.border2}`,
                      background: 'transparent', color: C.text2, cursor: 'pointer', fontFamily: 'inherit',
                    }}>✏ Éditer</button>
                    <button onClick={() => remove(item)} style={{
                      padding: '6px 10px', fontSize: 11, borderRadius: 6, border: `1px solid ${C.red}`,
                      background: 'transparent', color: C.red, cursor: 'pointer', fontFamily: 'inherit',
                    }}>🗑</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal édition / création */}
      {editing && (
        <div onClick={closeEdit} style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: C.surface, borderRadius: 14, padding: 28,
            width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
            border: `1px solid ${C.border2}`,
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              {editing === 'new' ? '+ Nouvelle annonce' : '✏ Éditer l\'annonce'}
            </h3>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Titre *</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                placeholder="Ex : 🎉 Promo Apex -50% ce mois-ci !"
                style={inputStyle} autoFocus />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Message (optionnel)</label>
              <textarea rows={3} value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                placeholder="Description détaillée..."
                style={{...inputStyle, resize: 'vertical', fontFamily: 'inherit'}} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inputStyle}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Statut</label>
                <select value={form.active ? '1' : '0'} onChange={e => setForm({...form, active: e.target.value === '1'})} style={inputStyle}>
                  <option value="1">✓ Active</option>
                  <option value="0">⏸ Désactivée</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Démarre le</label>
                <input type="datetime-local" value={form.starts_at} onChange={e => setForm({...form, starts_at: e.target.value})} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Termine le (optionnel)</label>
                <input type="datetime-local" value={form.ends_at} onChange={e => setForm({...form, ends_at: e.target.value})} style={inputStyle} />
              </div>
            </div>

            <div style={{
              padding: 12, marginBottom: 14, background: C.surface2, borderRadius: 8,
              fontSize: 11, color: C.text3, lineHeight: 1.5,
            }}>
              💡 <strong style={{ color: C.text2 }}>Lien d'action</strong> (optionnel) : ajoute un bouton CTA dans la bannière.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
              <div>
                <label style={labelStyle}>URL du lien</label>
                <input type="url" value={form.link_url} onChange={e => setForm({...form, link_url: e.target.value})}
                  placeholder="https://apex.com/promo" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Texte du bouton</label>
                <input type="text" value={form.link_label} onChange={e => setForm({...form, link_label: e.target.value})}
                  placeholder="Voir l'offre →" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={closeEdit} disabled={saving} style={{
                padding: '10px 18px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                background: 'transparent', color: C.text2, border: `1px solid ${C.border2}`,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Annuler</button>
              <button onClick={save} disabled={saving} style={{
                padding: '10px 22px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                background: C.blue, color: '#fff', border: 'none',
                cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(45,111,255,0.35)',
              }}>{saving ? '⏳ Enregistrement...' : (editing === 'new' ? '✓ Créer' : '✓ Enregistrer')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
