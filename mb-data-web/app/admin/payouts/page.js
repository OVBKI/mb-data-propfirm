'use client'
// Page admin /admin/payouts — analyse des payouts de tous les users (mai 2026)
//
// 3 vues :
//   1. Stats cards (total $, nb users, moyenne, top user)
//   2. Table users : email | total | nb | last payout | [Voir détail]
//   3. Modal drill-down : tous les payouts d'un user (date, firm, account, amount, note)
//
// Filtre temporel : dropdown "Mois en cours" / "X mois" / "All time".
// Données via /api/admin/payouts (service_role bypass RLS — fonctionne même si
// les RLS admin policies du Sprint Sécurité ne sont pas encore appliquées).

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'

const C = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  surface3: 'var(--surface3)',
  border: 'var(--border)',
  border2: 'var(--border2)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
  green: 'var(--green)',
  greenSoft: 'var(--green-bg)',
  amber: 'var(--amber)',
  red: 'var(--red)',
}

// Génère la liste des 12 derniers mois pour le dropdown (YYYY-MM + label)
function buildMonthOptions() {
  const opts = [{ value: '', label: 'Tout (depuis toujours)' }]
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    opts.push({
      value: `${yyyy}-${mm}`,
      label: `${monthNames[d.getMonth()]} ${yyyy}`,
    })
  }
  return opts
}

// Helper format date FR
function fmtDate(s) {
  if (!s) return '—'
  try {
    const d = new Date(s)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return s }
}

// Helper format devise (USD par défaut)
function fmtAmount(n, currency = 'USD') {
  const num = Number(n) || 0
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'
  return symbol + num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function AdminPayoutsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Filtre par défaut : mois en cours
  const monthOptions = useMemo(() => buildMonthOptions(), [])
  const currentMonth = new Date()
  const defaultMonth = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth)
  const [sortKey, setSortKey] = useState('totalAmount') // totalAmount | count | lastPayoutDate | email
  const [sortDir, setSortDir] = useState('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [drillUser, setDrillUser] = useState(null) // user object pour le modal

  // Fetch data quand le filtre change
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          if (!cancelled) {
            setError('Session expirée — reconnecte-toi.')
            setLoading(false)
          }
          return
        }
        const params = new URLSearchParams()
        if (selectedMonth) params.set('month', selectedMonth)
        const res = await fetch(`/api/admin/payouts?${params}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
        if (!cancelled) {
          setData(json)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Erreur de chargement')
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [selectedMonth])

  // Filtrage + tri des users
  const visibleUsers = useMemo(() => {
    if (!data?.users) return []
    const q = searchQuery.trim().toLowerCase()
    let list = q
      ? data.users.filter(u => (u.email || '').toLowerCase().includes(q))
      : data.users.slice()
    list.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey]
      if (sortKey === 'email') {
        av = String(av || '').toLowerCase()
        bv = String(bv || '').toLowerCase()
      }
      if (sortKey === 'lastPayoutDate') {
        av = av ? new Date(av).getTime() : 0
        bv = bv ? new Date(bv).getTime() : 0
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [data, sortKey, sortDir, searchQuery])

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'email' ? 'asc' : 'desc')
    }
  }

  // Top user (pour stats)
  const topUser = data?.users?.[0] || null
  const avgPerUser = data?.usersWithPayouts > 0
    ? data.totalAmount / data.usersWithPayouts
    : 0

  return (
    <div style={{ padding: 32, maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
          Payouts admin
        </h1>
        <p style={{ fontSize: 13, color: C.text3, marginTop: 6 }}>
          Vue globale des payouts de tous les users · données live via service_role
        </p>
      </div>

      {/* Filtres */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div>
          <label style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Période
          </label>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{
              background: C.surface, color: C.text, border: `1px solid ${C.border2}`,
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
              minWidth: 220, cursor: 'pointer',
            }}
          >
            {monthOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Rechercher (email)
          </label>
          <input
            type="text"
            placeholder="user@example.com"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: C.surface, color: C.text, border: `1px solid ${C.border2}`,
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Stats cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12, marginBottom: 28,
      }}>
        <StatCard label="Total payouts" value={loading ? '…' : fmtAmount(data?.totalAmount || 0)} accent={C.green} />
        <StatCard label="Nombre de payouts" value={loading ? '…' : (data?.totalCount || 0)} accent={C.blueLight} />
        <StatCard label="Users avec payout" value={loading ? '…' : (data?.usersWithPayouts || 0)} accent={C.amber} />
        <StatCard
          label="Moyenne par user"
          value={loading ? '…' : (data?.usersWithPayouts > 0 ? fmtAmount(avgPerUser) : '—')}
          accent={C.text}
        />
      </div>

      {/* Top user banner */}
      {!loading && topUser && (
        <div style={{
          marginBottom: 20, padding: '12px 16px',
          background: C.greenSoft, border: `1px solid ${C.green}`, borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
        }}>
          <span style={{ fontSize: 20 }}>🏆</span>
          <div style={{ flex: 1 }}>
            <span style={{ color: C.text3 }}>Top user de la période : </span>
            <strong style={{ color: C.text, fontFamily: 'monospace' }}>{topUser.email}</strong>
            <span style={{ color: C.text2 }}> · {fmtAmount(topUser.totalAmount)} sur {topUser.count} payout{topUser.count > 1 ? 's' : ''}</span>
          </div>
          <button
            onClick={() => setDrillUser(topUser)}
            style={{
              padding: '6px 12px', fontSize: 11, fontWeight: 600,
              background: C.green, color: 'var(--text-inverse)', border: 'none', borderRadius: 6,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Voir détail →</button>
        </div>
      )}

      {/* Errors */}
      {error && (
        <div style={{
          marginBottom: 20, padding: '14px 18px',
          background: 'rgba(239,68,68,0.1)', border: `1px solid ${C.red}`, borderRadius: 10,
          color: C.red, fontSize: 13,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Table users */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 20px', fontSize: 11, color: C.text3,
          letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600,
          borderBottom: `1px solid ${C.border}`,
        }}>
          Détail par utilisateur · {visibleUsers.length} {visibleUsers.length > 1 ? 'users' : 'user'}
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: C.text3, fontSize: 13 }}>
            ⏳ Chargement des payouts…
          </div>
        ) : visibleUsers.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: C.text3, fontSize: 13 }}>
            Aucun payout sur cette période.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.surface2 }}>
                <SortableHeader label="Email" colKey="email" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <SortableHeader label="Total" colKey="totalAmount" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                <SortableHeader label="Nb" colKey="count" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                <SortableHeader label="Dernier payout" colKey="lastPayoutDate" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                <th style={{ padding: '12px 18px', fontSize: 11, color: C.text3, fontWeight: 600, textAlign: 'right', letterSpacing: '0.06em' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u, i) => (
                <tr
                  key={u.user_id}
                  onClick={() => setDrillUser(u)}
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.surface2 }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: C.text }}>{u.email}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', color: C.green, fontWeight: 600 }}>{fmtAmount(u.totalAmount)}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', color: C.text2 }}>{u.count}</td>
                  <td style={{ padding: '12px 18px', color: C.text2 }}>{fmtDate(u.lastPayoutDate)}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                    <span style={{ color: C.blueLight, fontSize: 11, fontWeight: 600 }}>Voir détail →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal drill-down */}
      {drillUser && (
        <UserPayoutsDrillModal
          user={drillUser}
          monthLabel={monthOptions.find(o => o.value === selectedMonth)?.label || 'Tout'}
          onClose={() => setDrillUser(null)}
        />
      )}
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      padding: 16, borderRadius: 12,
    }}>
      <div style={{
        fontSize: 10, color: C.text3, letterSpacing: '0.10em',
        textTransform: 'uppercase', fontWeight: 600, marginBottom: 8,
      }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: accent || C.text,
        letterSpacing: '-0.01em',
      }}>{value}</div>
    </div>
  )
}

function SortableHeader({ label, colKey, sortKey, sortDir, onClick, align }) {
  const active = sortKey === colKey
  return (
    <th
      onClick={() => onClick(colKey)}
      style={{
        padding: '12px 18px', fontSize: 11, color: active ? C.blueLight : C.text3,
        fontWeight: 600, textAlign: align || 'left', letterSpacing: '0.06em',
        cursor: 'pointer', userSelect: 'none',
      }}>
      {label}{active && (sortDir === 'asc' ? ' ↑' : ' ↓')}
    </th>
  )
}

function UserPayoutsDrillModal({ user, monthLabel, onClose }) {
  // Ferme avec Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 760, maxHeight: '85vh',
          background: C.bg, borderRadius: 14,
          border: `1px solid ${C.border2}`,
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
        }}>
        {/* Header modal */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 11, color: C.text3, letterSpacing: '0.10em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
              Détail payouts · {monthLabel}
            </div>
            <h2 style={{
              fontSize: 18, fontWeight: 700, margin: 0,
              fontFamily: 'monospace', color: C.text,
            }}>
              {user.email}
            </h2>
            <div style={{ fontSize: 12, color: C.text2, marginTop: 6 }}>
              <strong style={{ color: C.green }}>{fmtAmount(user.totalAmount)}</strong> sur {user.count} payout{user.count > 1 ? 's' : ''}
              {user.lastPayoutDate && (
                <> · dernier le {fmtDate(user.lastPayoutDate)}</>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: `1px solid ${C.border2}`,
              color: C.text2, cursor: 'pointer',
              width: 32, height: 32, borderRadius: 8,
              fontSize: 16, lineHeight: 1, fontFamily: 'inherit',
            }}>✕</button>
        </div>

        {/* Liste payouts */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.surface }}>
                <th style={{ padding: '10px 24px', fontSize: 10, color: C.text3, fontWeight: 600, textAlign: 'left', letterSpacing: '0.06em' }}>Date</th>
                <th style={{ padding: '10px 18px', fontSize: 10, color: C.text3, fontWeight: 600, textAlign: 'left', letterSpacing: '0.06em' }}>Firm</th>
                <th style={{ padding: '10px 18px', fontSize: 10, color: C.text3, fontWeight: 600, textAlign: 'left', letterSpacing: '0.06em' }}>Compte</th>
                <th style={{ padding: '10px 18px', fontSize: 10, color: C.text3, fontWeight: 600, textAlign: 'right', letterSpacing: '0.06em' }}>Montant</th>
                <th style={{ padding: '10px 24px', fontSize: 10, color: C.text3, fontWeight: 600, textAlign: 'left', letterSpacing: '0.06em' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {user.payouts.map(p => (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '10px 24px', color: C.text2, whiteSpace: 'nowrap' }}>{fmtDate(p.date)}</td>
                  <td style={{ padding: '10px 18px', color: C.text }}>{p.firm_name}</td>
                  <td style={{ padding: '10px 18px', color: C.text2 }}>
                    {p.account_name}
                    {p.account_size && <span style={{ color: C.text3, marginLeft: 6, fontSize: 10 }}>· {p.account_size}</span>}
                  </td>
                  <td style={{ padding: '10px 18px', textAlign: 'right', color: C.green, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {fmtAmount(p.amount, p.currency)}
                  </td>
                  <td style={{ padding: '10px 24px', color: C.text3, fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.note}>
                    {p.note || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer modal */}
        <div style={{
          padding: '14px 24px', borderTop: `1px solid ${C.border}`,
          fontSize: 11, color: C.text3, textAlign: 'right',
        }}>
          Esc pour fermer
        </div>
      </div>
    </div>
  )
}
