'use client'
// Admin Dashboard — vue d'ensemble des stats du site.
// Affiche les KPIs principaux et l'activité récente.

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

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
  amber: 'var(--amber)',
  red: 'var(--red)',
}

function StatCard({ label, value, sublabel, color = C.text, icon }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 20, minHeight: 100,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: C.text3,
          textTransform: 'uppercase', letterSpacing: '0.6px',
        }}>{label}</span>
        {icon && <span style={{ fontSize: 20, opacity: 0.6 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
      {sublabel && <div style={{ fontSize: 11, color: C.text3 }}>{sublabel}</div>}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        // Stats : on agrège plusieurs requêtes en parallèle pour la performance
        const now = new Date()
        const day1 = new Date(now); day1.setDate(now.getDate() - 1)
        const day7 = new Date(now); day7.setDate(now.getDate() - 7)
        const day30 = new Date(now); day30.setDate(now.getDate() - 30)

        // Récupère le token d'auth pour appeler l'API admin avec Bearer
        const { data: { session } } = await supabase.auth.getSession()
        const authHeader = session ? { Authorization: `Bearer ${session.access_token}` } : {}

        // ⚠ On ne peut pas requêter auth.users en direct (RLS limit), on passe par /api/admin/users
        const [firmsRes, accountsRes, tradesRes, payoutsRes, certsRes,
               tradesWeek, tradesMonth, accountsByFirm, signupsRes] = await Promise.all([
          supabase.from('firms').select('id', { count: 'exact', head: true }),
          supabase.from('accounts').select('id', { count: 'exact', head: true }),
          supabase.from('journal_entries').select('id', { count: 'exact', head: true }),
          supabase.from('payouts').select('id', { count: 'exact', head: true }),
          supabase.from('certificates').select('id', { count: 'exact', head: true }),
          supabase.from('journal_entries').select('id', { count: 'exact', head: true }).gte('created_at', day7.toISOString()),
          supabase.from('journal_entries').select('id', { count: 'exact', head: true }).gte('created_at', day30.toISOString()),
          supabase.from('firms').select('name'),
          // Appel API admin avec Bearer token (sinon 401 → users stats vides)
          fetch('/api/admin/users?summary=1', { headers: authHeader }).then(r => r.ok ? r.json() : null).catch(() => null),
        ])

        // Top 3 firmes par usage
        const firmCounts = {}
        ;(accountsByFirm.data || []).forEach(f => { firmCounts[f.name] = (firmCounts[f.name] || 0) + 1 })
        const topFirms = Object.entries(firmCounts).sort((a,b) => b[1]-a[1]).slice(0, 5)

        if (!mounted) return
        setStats({
          totalFirms: firmsRes.count || 0,
          totalAccounts: accountsRes.count || 0,
          totalTrades: tradesRes.count || 0,
          totalPayouts: payoutsRes.count || 0,
          totalCerts: certsRes.count || 0,
          tradesWeek: tradesWeek.count || 0,
          tradesMonth: tradesMonth.count || 0,
          topFirms,
          totalUsers: signupsRes?.total || null,
          newUsersWeek: signupsRes?.newWeek || null,
          newUsersMonth: signupsRes?.newMonth || null,
          activeUsers7d: signupsRes?.active7d || null,
        })
      } catch (err) {
        if (mounted) setError(err.message || 'Erreur chargement stats')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div style={{ padding: '32px 32px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: 'var(--red)', letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>
          Admin
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', margin: 0, marginBottom: 6 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>
          Vue d'ensemble de l'activité Quantara — données live depuis Supabase.
        </p>
      </div>

      {error && (
        <div style={{
          padding: 16, marginBottom: 24, background: 'var(--red-bg)',
          border: `1px solid ${C.red}`, borderRadius: 10, fontSize: 13, color: C.red,
        }}>⚠ {error}</div>
      )}

      {/* === Section Users === */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.text3,
          textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12,
        }}>👥 Utilisateurs</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14,
        }}>
          <StatCard
            label="Total inscriptions"
            value={loading ? '...' : (stats?.totalUsers ?? '—')}
            sublabel={stats?.totalUsers === null ? 'API /admin/users non configurée' : 'depuis le lancement'}
            color={C.blueLight}
            icon="👥"
          />
          <StatCard
            label="Nouveaux (7j)"
            value={loading ? '...' : (stats?.newUsersWeek ?? '—')}
            sublabel="signups cette semaine"
            color={C.green}
            icon="🆕"
          />
          <StatCard
            label="Nouveaux (30j)"
            value={loading ? '...' : (stats?.newUsersMonth ?? '—')}
            sublabel="signups ce mois"
            color={C.green}
            icon="📈"
          />
          <StatCard
            label="Actifs (7j)"
            value={loading ? '...' : (stats?.activeUsers7d ?? '—')}
            sublabel="ont saisi un trade récemment"
            color={C.amber}
            icon="⚡"
          />
        </div>
      </div>

      {/* === Section Activité === */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.text3,
          textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12,
        }}>📊 Activité globale</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14,
        }}>
          <StatCard
            label="PropFirms ajoutées"
            value={loading ? '...' : stats?.totalFirms}
            sublabel="tous users confondus"
            icon="🏢"
          />
          <StatCard
            label="Comptes actifs"
            value={loading ? '...' : stats?.totalAccounts}
            sublabel="Challenge + Financé + Échoué"
            icon="💼"
          />
          <StatCard
            label="Trades enregistrés"
            value={loading ? '...' : stats?.totalTrades}
            sublabel={loading ? '' : `${stats?.tradesWeek || 0} sur 7j · ${stats?.tradesMonth || 0} sur 30j`}
            color={C.green}
            icon="📔"
          />
          <StatCard
            label="Payouts enregistrés"
            value={loading ? '...' : stats?.totalPayouts}
            sublabel="net reçu par les users"
            color={C.green}
            icon="💰"
          />
          <StatCard
            label="Certificats uploadés"
            value={loading ? '...' : stats?.totalCerts}
            sublabel="diplômes / payouts certifiés"
            color={C.amber}
            icon="🎓"
          />
        </div>
      </div>

      {/* === Top 5 firmes === */}
      {stats?.topFirms?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: C.text3,
            textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12,
          }}>🏆 Top 5 PropFirms (par nb de comptes)</div>
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 4,
          }}>
            {stats.topFirms.map(([name, count], i) => {
              const max = stats.topFirms[0][1]
              const pct = max > 0 ? (count / max) * 100 : 0
              return (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px',
                  borderBottom: i < stats.topFirms.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: i === 0 ? C.amber : C.text3,
                    width: 24, textAlign: 'center',
                  }}>#{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0 }}>{name}</span>
                  <div style={{ flex: 2, height: 8, background: C.surface2, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: `linear-gradient(90deg, ${C.blue}, ${C.blueLight})`,
                    }} />
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: C.text2,
                    minWidth: 50, textAlign: 'right',
                  }}>{count} compte{count > 1 ? 's' : ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{
        padding: '12px 16px', background: C.surface2, borderRadius: 8,
        fontSize: 11, color: C.text3, lineHeight: 1.5,
      }}>
        💡 <strong style={{ color: C.text2 }}>Auto-refresh</strong> : recharge la page pour des stats à jour.
        Pour des stats temps réel, configure Supabase Realtime sur les tables concernées.
      </div>
    </div>
  )
}
