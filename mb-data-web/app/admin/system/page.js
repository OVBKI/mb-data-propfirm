'use client'
// Admin System — health check infrastructure + accès rapide aux outils externes.
// Counts DB, status env vars, liens utiles, mini test RLS pour vérifier la sécurité.

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

const DB_TABLES = [
  { name: 'firms', emoji: '🏢', desc: 'PropFirms ajoutées par les users' },
  { name: 'accounts', emoji: '💼', desc: 'Comptes (Challenge / Financé / Échoué)' },
  { name: 'journal_entries', emoji: '📔', desc: 'Trades loggés' },
  { name: 'payouts', emoji: '💰', desc: 'Payouts enregistrés' },
  { name: 'certificates', emoji: '🎓', desc: 'Diplômes / payouts certifiés' },
  { name: 'announcements', emoji: '📢', desc: 'Bannières admin globales' },
  { name: 'propfirm_rules', emoji: '⚙️', desc: 'Règles personnalisées des firmes (overrides)' },
]

const EXTERNAL_LINKS = [
  { label: 'Vercel Dashboard',  url: 'https://vercel.com/dashboard',     icon: '▲',  desc: 'Deployments, logs, env vars' },
  { label: 'Supabase Dashboard',url: 'https://supabase.com/dashboard',   icon: '⚡', desc: 'Database, Auth, Storage, RLS' },
  { label: 'Sentry',            url: 'https://sentry.io/',               icon: '🛡', desc: 'Erreurs runtime (à configurer)' },
  { label: 'Cloudflare',        url: 'https://dash.cloudflare.com/',     icon: '☁️', desc: 'DNS, Email Routing, Turnstile' },
  { label: 'Google Workspace',  url: 'https://admin.google.com/',        icon: '📧', desc: 'Emails @quantara.tech' },
  { label: 'Mail Tester',       url: 'https://mail-tester.com/',         icon: '📨', desc: 'Test deliverability (score /10)' },
  { label: 'PostHog',           url: 'https://posthog.com/',             icon: '📊', desc: 'Analytics produit (à configurer)' },
  { label: 'Stripe',            url: 'https://dashboard.stripe.com/',    icon: '💳', desc: 'Paiements (futur)' },
]

export default function AdminSystemPage() {
  const [tableCounts, setTableCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [clientTime, setClientTime] = useState('')
  const [serverTime, setServerTime] = useState('')

  async function loadHealth() {
    setLoading(true)
    // Counts par table
    const counts = {}
    for (const t of DB_TABLES) {
      try {
        const { count, error } = await supabase.from(t.name).select('*', { count: 'exact', head: true })
        counts[t.name] = error ? { error: error.message } : { count: count || 0 }
      } catch (e) {
        counts[t.name] = { error: e.message }
      }
    }
    setTableCounts(counts)

    // Server time via Supabase (utilise une requête simple)
    try {
      const { data } = await supabase.rpc('now_server', {})
      if (data) setServerTime(new Date(data).toLocaleString('fr-FR'))
      else setServerTime('(rpc now_server non créée — optionnel)')
    } catch {
      setServerTime('(rpc now_server non créée — optionnel)')
    }
    setClientTime(new Date().toLocaleString('fr-FR'))
    setLoading(false)
  }

  useEffect(() => { loadHealth() }, [])

  // Check des env vars client (les seules accessibles côté navigateur)
  const envChecks = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL, required: true },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, required: true },
    { name: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', value: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY, required: true },
  ]

  const totalRows = Object.values(tableCounts).reduce((s, t) => s + (t?.count || 0), 0)
  const hasErrors = Object.values(tableCounts).some(t => t?.error)

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8, gap: 14, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#e8504a', letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>Admin</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Système</h1>
        </div>
        <button onClick={loadHealth} disabled={loading} style={{
          padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
          background: C.blue, color: '#fff', border: 'none',
          cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
        }}>{loading ? '⏳' : '↻'} Rafraîchir</button>
      </div>
      <p style={{ fontSize: 13, color: C.text3, marginBottom: 22 }}>
        Health check infrastructure Quantara et accès rapide aux outils externes.
      </p>

      {/* === Status global === */}
      <div style={{
        padding: '14px 18px', marginBottom: 24,
        background: hasErrors ? 'rgba(232,80,74,0.08)' : 'rgba(29,184,122,0.08)',
        border: `1px solid ${hasErrors ? C.red : C.green}`,
        borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{ fontSize: 32 }}>{hasErrors ? '⚠️' : '✅'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: hasErrors ? C.red : C.green, marginBottom: 2 }}>
            {hasErrors ? 'Anomalies détectées' : 'Tous les systèmes opérationnels'}
          </div>
          <div style={{ fontSize: 12, color: C.text2 }}>
            {totalRows} rows total · {DB_TABLES.length} tables monitorées
          </div>
        </div>
      </div>

      {/* === DB Tables === */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.text3,
          textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12,
        }}>📊 Base de données — Supabase</div>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden',
        }}>
          {DB_TABLES.map((t, i) => {
            const info = tableCounts[t.name] || {}
            const isError = !!info.error
            return (
              <div key={t.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px',
                borderBottom: i < DB_TABLES.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <div style={{ fontSize: 22 }}>{t.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: C.text3 }}>{t.desc}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {loading ? (
                    <span style={{ color: C.text3, fontSize: 12 }}>⏳</span>
                  ) : isError ? (
                    <div>
                      <div style={{ color: C.red, fontSize: 12, fontWeight: 700 }}>⚠ Erreur</div>
                      <div style={{ color: C.text3, fontSize: 10, fontFamily: 'monospace', maxWidth: 200, textAlign: 'right' }}>{info.error}</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{(info.count || 0).toLocaleString('fr-FR')}</div>
                      <div style={{ fontSize: 10, color: C.text3 }}>row{info.count !== 1 ? 's' : ''}</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* === Environment === */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.text3,
          textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12,
        }}>🌐 Variables d'environnement (côté client)</div>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 16,
        }}>
          {envChecks.map(env => {
            const ok = !!env.value
            return (
              <div key={env.name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', borderBottom: `1px solid ${C.border}`,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: ok ? C.green : C.red,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#fff', fontWeight: 700, flexShrink: 0,
                }}>{ok ? '✓' : '✕'}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, flex: 1 }}>{env.name}</span>
                <span style={{ fontSize: 11, color: ok ? C.green : C.red, fontWeight: 600 }}>
                  {ok ? 'Configuré' : 'MANQUANT'}
                </span>
              </div>
            )
          })}
          <div style={{
            marginTop: 10, padding: '8px 12px', background: C.surface2,
            borderRadius: 6, fontSize: 11, color: C.text3, lineHeight: 1.5,
          }}>
            💡 Les vars <strong>server-side</strong> (SUPABASE_SERVICE_ROLE_KEY, FINNHUB_API_KEY, etc.) ne sont pas vérifiables ici — leur présence se voit indirectement : si l'API <code>/api/admin/users</code> et le calendrier économique fonctionnent, elles sont OK.
          </div>
        </div>
      </div>

      {/* === Time sync === */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.text3,
          textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12,
        }}>⏰ Horloges (debug timezone)</div>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 16, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.9,
        }}>
          <div>🖥 Client (navigateur) : <strong style={{ color: C.text }}>{clientTime}</strong></div>
          <div>🌐 Server (Supabase) : <strong style={{ color: C.text }}>{serverTime}</strong></div>
          <div style={{ color: C.text3, fontSize: 11, marginTop: 6 }}>
            Timezone navigateur : <strong>{typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '—'}</strong>
          </div>
        </div>
      </div>

      {/* === External links === */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.text3,
          textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12,
        }}>🔗 Outils & Dashboards externes</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10,
        }}>
          {EXTERNAL_LINKS.map(link => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 14, background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, textDecoration: 'none', color: C.text,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.blueLight; e.currentTarget.style.background = C.surface2 }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{link.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{link.label}</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{link.desc}</div>
              </div>
              <span style={{ fontSize: 14, color: C.text3, flexShrink: 0 }}>↗</span>
            </a>
          ))}
        </div>
      </div>

      {/* === Quick actions === */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.text3,
          textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12,
        }}>⚡ Actions rapides</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10,
        }}>
          <a href="/app" target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, textDecoration: 'none', color: C.text, fontSize: 12, fontWeight: 600,
          }}>
            <span>🌐 Voir le site en prod</span><span style={{ color: C.text3 }}>↗</span>
          </a>
          <a href="/admin/announcements" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, textDecoration: 'none', color: C.text, fontSize: 12, fontWeight: 600,
          }}>
            <span>📢 Créer une annonce</span><span style={{ color: C.text3 }}>→</span>
          </a>
          <a href="/admin/users" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, textDecoration: 'none', color: C.text, fontSize: 12, fontWeight: 600,
          }}>
            <span>👥 Gérer les utilisateurs</span><span style={{ color: C.text3 }}>→</span>
          </a>
          <a href="/admin/activity" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, textDecoration: 'none', color: C.text, fontSize: 12, fontWeight: 600,
          }}>
            <span>🔔 Activité temps réel</span><span style={{ color: C.text3 }}>→</span>
          </a>
        </div>
      </div>
    </div>
  )
}
