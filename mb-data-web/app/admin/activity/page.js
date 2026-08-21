'use client'
// Admin Activity Feed — flux temps réel de tous les évènements du site.
// Idéal pour piloter en solo et repérer les bugs / opportunities en live.
//
// Agrège : signups (via /api/admin/users), firmes créées, comptes créés,
// trades loggés, payouts, certificats, annonces publiées.

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

const C = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  surface3: '#222637',
  border: 'var(--border)',
  border2: 'var(--border2)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  pink: '#f472b6',
}

const EVENT_TYPES = {
  signup:         { icon: '🆕', color: C.blueLight, label: 'Inscription' },
  firm:           { icon: '🏢', color: C.blueLight, label: 'Firme ajoutée' },
  account_new:    { icon: '💼', color: C.amber,     label: 'Compte créé' },
  account_funded: { icon: '🚀', color: C.green,     label: 'Passé en Financé' },
  account_failed: { icon: '💔', color: C.red,       label: 'Compte échoué' },
  trade:          { icon: '📔', color: C.text2,     label: 'Trade loggé' },
  payout:         { icon: '💰', color: C.green,     label: 'Payout reçu' },
  certificate:    { icon: '🎓', color: C.amber,     label: 'Certificat uploadé' },
  announcement:   { icon: '📢', color: C.pink,      label: 'Annonce publiée' },
}

function formatRelative(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return "à l'instant"
  const min = Math.floor(sec / 60)
  if (min < 60) return `il y a ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `il y a ${hr}h`
  const days = Math.floor(hr / 24)
  if (days < 7) return `il y a ${days}j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatFullDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function chipStyle(active) {
  return {
    padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 99,
    background: active ? C.blue : C.surface2,
    color: active ? '#fff' : C.text2,
    border: `1px solid ${active ? C.blue : C.border2}`,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s',
  }
}

export default function AdminActivityPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const limit = 50

      // 1) Signups via /api/admin/users (service_role)
      let signups = []
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const res = await fetch('/api/admin/users?q=', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          if (res.ok) {
            const d = await res.json()
            signups = (d.users || []).slice(0, limit).map(u => ({
              type: 'signup',
              ts: u.created_at,
              data: { email: u.email, id: u.id },
              key: 'u_' + u.id,
            }))
          }
        }
      } catch {}

      // 2) Autres évènements via Supabase
      const [firmsRes, accountsRes, tradesRes, payoutsRes, certsRes, annRes] = await Promise.all([
        supabase.from('firms').select('id, name, user_id, created_at').order('created_at', { ascending: false }).limit(limit),
        supabase.from('accounts').select('id, name, status, user_id, firm_id, created_at, plan_size, funded_date').order('created_at', { ascending: false }).limit(limit),
        supabase.from('journal_entries').select('id, date, pnl, instrument, account_id, created_at, user_id').order('created_at', { ascending: false }).limit(limit),
        supabase.from('payouts').select('id, amount, date, account_id, created_at, user_id, note').order('created_at', { ascending: false }).limit(limit),
        supabase.from('certificates').select('id, type, created_at, user_id').order('created_at', { ascending: false }).limit(limit),
        supabase.from('announcements').select('id, title, created_at').order('created_at', { ascending: false }).limit(limit),
      ])

      const all = [...signups]
      ;(firmsRes.data || []).forEach(f => all.push({ type: 'firm', ts: f.created_at, data: f, key: 'f_' + f.id }))
      ;(accountsRes.data || []).forEach(a => {
        all.push({ type: 'account_new', ts: a.created_at, data: a, key: 'a_' + a.id })
        if (a.status === 'Financé' && a.funded_date) {
          all.push({ type: 'account_funded', ts: a.funded_date + 'T12:00:00Z', data: a, key: 'af_' + a.id })
        } else if (a.status === 'Échoué') {
          all.push({ type: 'account_failed', ts: a.created_at, data: a, key: 'aE_' + a.id })
        }
      })
      ;(tradesRes.data || []).forEach(t => all.push({ type: 'trade', ts: t.created_at, data: t, key: 't_' + t.id }))
      ;(payoutsRes.data || []).forEach(p => all.push({ type: 'payout', ts: p.created_at, data: p, key: 'p_' + p.id }))
      ;(certsRes.data || []).forEach(c => all.push({ type: 'certificate', ts: c.created_at, data: c, key: 'c_' + c.id }))
      ;(annRes.data || []).forEach(a => all.push({ type: 'announcement', ts: a.created_at, data: a, key: 'an_' + a.id }))

      all.sort((a, b) => new Date(b.ts) - new Date(a.ts))
      setEvents(all.slice(0, 200))
      setLastRefresh(new Date())
    } catch (err) {
      setError(err.message || 'Erreur chargement activité')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [autoRefresh])

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)

  function renderDetail(e) {
    switch (e.type) {
      case 'signup':
        return <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.text2 }}>{e.data.email}</span>
      case 'firm':
        return <span><strong>{e.data.name}</strong></span>
      case 'account_new':
        return <span>Compte <strong>{e.data.name || 'sans nom'}</strong> · Plan {(e.data.plan_size || '').toUpperCase()} · <span style={{ color: C.amber }}>Challenge</span></span>
      case 'account_funded':
        return <span>Compte <strong>{e.data.name || 'sans nom'}</strong> est passé <span style={{ color: C.green, fontWeight: 700 }}>Financé</span></span>
      case 'account_failed':
        return <span>Compte <strong>{e.data.name || 'sans nom'}</strong> est passé <span style={{ color: C.red, fontWeight: 700 }}>Échoué</span></span>
      case 'trade':
        return <span>PnL <strong style={{ color: e.data.pnl >= 0 ? C.green : C.red }}>{e.data.pnl >= 0 ? '+' : ''}{e.data.pnl} $</strong>{e.data.instrument ? ` · ${e.data.instrument}` : ''}</span>
      case 'payout':
        return <span>Net <strong style={{ color: C.green }}>+{e.data.amount} $</strong>{e.data.note ? ` · ${e.data.note}` : ''}</span>
      case 'certificate':
        return <span>Type : <strong>{e.data.type || 'document'}</strong></span>
      case 'announcement':
        return <span>« <strong>{e.data.title}</strong> »</span>
      default:
        return null
    }
  }

  return (
    <div style={{ padding: '32px 32px' }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--red)', letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>
          Admin · Live
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8, gap: 14, flexWrap: 'wrap',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Activité en temps réel</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.text2, cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            Auto-refresh 30s
          </label>
          <button onClick={load} disabled={loading} style={{
            padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
            background: C.blue, color: 'var(--text-inverse)', border: 'none',
            cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
          }}>{loading ? '⏳' : '↻'} Actualiser</button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: C.text3, marginBottom: 22 }}>
        Flux temps réel des évènements Quantara. {lastRefresh && <span style={{ color: C.text2 }}>· Dernière maj : {lastRefresh.toLocaleTimeString('fr-FR')}</span>}
      </p>

      {/* Filtre par type */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={chipStyle(filter === 'all')}>
          Tout ({events.length})
        </button>
        {Object.entries(EVENT_TYPES).map(([key, cfg]) => {
          const count = events.filter(e => e.type === key).length
          if (count === 0) return null
          return (
            <button key={key} onClick={() => setFilter(key)} style={chipStyle(filter === key)}>
              {cfg.icon} {cfg.label} ({count})
            </button>
          )
        })}
      </div>

      {error && (
        <div style={{
          padding: 16, marginBottom: 20, background: 'var(--red-bg)',
          border: `1px solid ${C.red}`, borderRadius: 10, fontSize: 13, color: C.red,
        }}>⚠ {error}</div>
      )}

      {/* Timeline */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: 'hidden',
      }}>
        {loading && events.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>⏳ Chargement de l'activité...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.text3 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🌙</div>
            Aucun évènement {filter !== 'all' ? 'pour ce filtre' : 'enregistré'}.
          </div>
        ) : filtered.map((e, idx) => {
          const cfg = EVENT_TYPES[e.type] || { icon: '•', color: C.text3, label: e.type }
          return (
            <div key={e.key} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 18px',
              borderBottom: idx < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={el => el.currentTarget.style.background = C.surface2}
            onMouseLeave={el => el.currentTarget.style.background = 'transparent'}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: `${cfg.color}1A`, border: `1px solid ${cfg.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>{cfg.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: 3 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: cfg.color,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>{cfg.label}</span>
                </div>
                <div style={{ fontSize: 13, color: C.text }}>{renderDetail(e)}</div>
              </div>
              <div style={{
                fontSize: 11, color: C.text3, flexShrink: 0, textAlign: 'right',
                whiteSpace: 'nowrap',
              }} title={formatFullDate(e.ts)}>
                {formatRelative(e.ts)}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        padding: '12px 16px', marginTop: 20,
        background: C.surface2, borderRadius: 8,
        fontSize: 11, color: C.text3, lineHeight: 1.5,
      }}>
        💡 <strong style={{ color: C.text2 }}>Limite</strong> : on charge les 50 derniers évènements par type (max 200 affichés au total). Active l'auto-refresh pour ne rien manquer.
      </div>
    </div>
  )
}
