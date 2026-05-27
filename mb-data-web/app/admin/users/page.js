'use client'
// Admin Users page — liste, recherche, détails et suppression des utilisateurs.

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

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

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function relativeTime(iso) {
  if (!iso) return 'jamais'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days < 1) return 'aujourd\'hui'
  if (days < 7) return `il y a ${days}j`
  if (days < 30) return `il y a ${Math.floor(days / 7)}sem`
  return `il y a ${Math.floor(days / 30)} mois`
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true); setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Pas de session active')
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        // Erreur spécifique service_role manquant
        if (data.hint) {
          setError(`${data.error}\n\n${data.hint}`)
        } else {
          throw new Error(data.error || 'Erreur API')
        }
        return
      }
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  // Recherche : debounce simple sur 400ms
  useEffect(() => {
    const t = setTimeout(load, 400)
    return () => clearTimeout(t)
  }, [search])

  async function handleDelete(userId, email) {
    if (!confirm(`⚠ Supprimer définitivement le compte de ${email} ?\n\nToutes ses données (firms, trades, payouts, certificats) seront supprimées en cascade.\n\nCette action est IRRÉVERSIBLE.`)) return
    if (!confirm('Es-tu vraiment sûr ? Dernière confirmation.')) return

    setDeleting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur suppression')
      setSelected(null)
      await load()
      alert('✓ User supprimé')
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
    setDeleting(false)
  }

  return (
    <div style={{ padding: '32px 32px' }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#e8504a', letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>
          Admin
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Utilisateurs</h1>
          <div style={{ fontSize: 12, color: C.text3 }}>
            {loading ? '⏳ Chargement...' : `${users.length} user${users.length > 1 ? 's' : ''} affichés`}
          </div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: C.text3, marginBottom: 22 }}>
        Liste de tous les comptes Quantara. Tu peux supprimer un user (cascade sur toutes ses données).
      </p>

      {/* Search */}
      <div style={{ marginBottom: 18 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher par email..."
          style={{
            width: '100%', maxWidth: 400,
            padding: '10px 14px', fontSize: 13,
            background: C.surface, border: `1px solid ${C.border2}`,
            borderRadius: 8, color: C.text, outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Erreur */}
      {error && (
        <div style={{
          padding: 16, marginBottom: 20, background: 'rgba(232,80,74,0.08)',
          border: `1px solid ${C.red}`, borderRadius: 10, fontSize: 13, color: C.red,
          whiteSpace: 'pre-wrap', lineHeight: 1.5,
        }}>⚠ {error}</div>
      )}

      {/* Table users */}
      {!error && (
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.surface2 }}>
                {['Email', 'Inscrit le', 'Dernière connexion', 'Firms', 'Trades', 'Statut', ''].map(h => (
                  <th key={h} style={{
                    padding: '12px 14px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, color: C.text3,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    borderBottom: `1px solid ${C.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.text3 }}>⏳ Chargement...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.text3 }}>Aucun user trouvé.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} onClick={() => setSelected(u)} style={{
                  borderBottom: `1px solid ${C.border}`,
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500 }}>{u.email}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.text2 }}>{formatDate(u.created_at)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.text2 }} title={u.last_sign_in_at || ''}>{relativeTime(u.last_sign_in_at)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.text2 }}>{u.firms}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, color: C.text2 }}>{u.trades}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11 }}>
                    {u.banned ? (
                      <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(232,80,74,0.15)', color: C.red, fontWeight: 600 }}>Banni</span>
                    ) : !u.email_confirmed_at ? (
                      <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(250,199,117,0.15)', color: C.amber, fontWeight: 600 }}>Non confirmé</span>
                    ) : (
                      <span style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(29,184,122,0.15)', color: C.green, fontWeight: 600 }}>Actif</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <span style={{ fontSize: 16, color: C.text3 }}>→</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer détails user */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 480, maxWidth: '95vw', height: '100vh',
            background: C.surface, borderLeft: `1px solid ${C.border2}`,
            padding: 28, overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Détails user</h2>
              <button onClick={() => setSelected(null)} style={{
                background: 'transparent', border: `1px solid ${C.border2}`,
                color: C.text2, padding: '6px 10px', borderRadius: 6,
                cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
              }}>✕ Fermer</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 15, fontWeight: 600, wordBreak: 'break-all' }}>{selected.email}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                ['Inscrit le', formatDate(selected.created_at)],
                ['Email confirmé', selected.email_confirmed_at ? '✓ Oui' : '⚠ Non'],
                ['Dernière connexion', relativeTime(selected.last_sign_in_at)],
                ['Statut', selected.banned ? '🚫 Banni' : '✓ Actif'],
                ['Nb firms', selected.firms],
                ['Nb trades', selected.trades],
              ].map(([label, value], i) => (
                <div key={i} style={{
                  padding: '12px 14px', background: C.surface2, borderRadius: 8,
                }}>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>User ID</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace', color: C.text3, wordBreak: 'break-all' }}>{selected.id}</div>
            </div>

            <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                ⚠ Zone dangereuse
              </div>
              <a href={`mailto:${selected.email}`} style={{
                display: 'block', textAlign: 'center', padding: '10px 16px',
                fontSize: 13, fontWeight: 600, borderRadius: 8, marginBottom: 8,
                background: 'transparent', color: C.text,
                border: `1px solid ${C.border2}`, textDecoration: 'none',
              }}>✉ Envoyer un email</a>
              <button onClick={() => handleDelete(selected.id, selected.email)} disabled={deleting} style={{
                width: '100%', padding: '10px 16px',
                fontSize: 13, fontWeight: 600, borderRadius: 8,
                background: 'rgba(232,80,74,0.08)', color: C.red,
                border: `1px solid ${C.red}`,
                cursor: deleting ? 'wait' : 'pointer', fontFamily: 'inherit',
              }}>
                {deleting ? '⏳ Suppression...' : '🗑 Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
