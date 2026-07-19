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
  const [recapDiag, setRecapDiag] = useState(null)

  async function runRecapDiag() {
    setRecapDiag('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/cron/monthly-recap?dry=1', { headers: { Authorization: `Bearer ${session?.access_token}` } })
      const j = await res.json()
      setRecapDiag(res.ok ? j : { error: j.error || ('HTTP ' + res.status) })
    } catch (e) { setRecapDiag({ error: e.message }) }
  }

  const [recapTest, setRecapTest] = useState(null)
  async function runRecapTest() {
    setRecapTest('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/cron/monthly-recap?test=self', { headers: { Authorization: `Bearer ${session?.access_token}` } })
      const j = await res.json()
      setRecapTest(res.ok ? j : { error: j.error || ('HTTP ' + res.status) })
    } catch (e) { setRecapTest({ error: e.message }) }
  }

  // ── Notifications diagnostics (email + push) ──
  const [notif, setNotif] = useState(null)
  const [notifBusy, setNotifBusy] = useState(null) // 'email' | 'push' | null
  async function loadNotif() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/notif-health', { headers: { Authorization: `Bearer ${session?.access_token}` } })
      const j = await res.json()
      setNotif(res.ok ? j : { error: j.error || ('HTTP ' + res.status) })
    } catch (e) { setNotif({ error: e.message }) }
  }
  async function sendNotifTest(type) {
    setNotifBusy(type)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/notif-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ type }),
      })
      const j = await res.json()
      if (j.ok) alert(type === 'email' ? `Email de test envoyé à ${j.to} ✓` : `Push de test envoyé (${j.sent} appareil·s) ✓`)
      else alert(`Échec : ${j.error || ('HTTP ' + res.status)}${j.hint ? '\n\n💡 ' + j.hint : ''}`)
      loadNotif()
    } catch (e) { alert('Erreur : ' + e.message) } finally { setNotifBusy(null) }
  }

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

  useEffect(() => { loadHealth(); loadNotif() }, [])

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

      {/* === Notifications (email + push) === */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.text3,
          textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12,
        }}>🔔 Notifications — email &amp; push</div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
          {!notif ? (
            <div style={{ color: C.text3, fontSize: 12 }}>⏳ Chargement…</div>
          ) : notif.error ? (
            <div style={{ color: C.red, fontSize: 12 }}>⚠ {notif.error}</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 14 }}>
                {Object.entries(notif.env).map(([k, ok]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span>{ok ? '✅' : '❌'}</span>
                    <span style={{ color: ok ? C.text2 : C.red, fontFamily: 'monospace', wordBreak: 'break-all' }}>{k}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: C.text2, marginBottom: 8 }}>
                Abonnements push : <b style={{ color: C.text }}>{notif.push.total}</b> au total · <b style={{ color: C.text }}>{notif.push.mine}</b> pour ton compte
              </div>
              <div style={{ fontSize: 12, color: C.text2, marginBottom: 14 }}>
                Cron quotidien — dernier run : {(() => {
                  const ts = notif.cron?.lastDailyRun
                  if (!ts) return <b style={{ color: C.red }}>jamais détecté (cron Vercel arrêté, ou table heartbeat pas encore créée)</b>
                  const d = new Date(ts)
                  const h = (Date.now() - d.getTime()) / 3600000
                  const color = h < 36 ? C.green : C.red
                  const rel = h < 1 ? 'il y a moins d’1h' : `il y a ~${Math.round(h)}h`
                  return <b style={{ color }}>{d.toLocaleString('fr-FR')} ({rel})</b>
                })()}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => sendNotifTest('email')} disabled={!!notifBusy} style={{
                  padding: '9px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                  background: C.blue, color: '#fff', border: 'none', cursor: notifBusy ? 'wait' : 'pointer',
                  fontFamily: 'inherit', opacity: notifBusy ? 0.6 : 1,
                }}>{notifBusy === 'email' ? '⏳' : '📧'} M&apos;envoyer un email de test</button>
                <button onClick={() => sendNotifTest('push')} disabled={!!notifBusy} style={{
                  padding: '9px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                  background: 'transparent', color: C.text2, border: `1px solid ${C.border}`,
                  cursor: notifBusy ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: notifBusy ? 0.6 : 1,
                }}>{notifBusy === 'push' ? '⏳' : '🔔'} M&apos;envoyer un push de test</button>
              </div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 10, lineHeight: 1.5 }}>
                Une var <b style={{ color: C.red }}>❌</b> = à ajouter dans Vercel (puis redéployer pour les <code>NEXT_PUBLIC_*</code>).
                Email en échec malgré la clé présente = domaine <code>quantara.tech</code> non vérifié dans Resend (DKIM/SPF).
                Le push de test exige un abonnement actif (toggle sur <code>/app/alerts</code>, même navigateur).
                Cron « jamais » ou dernier run &gt; 24h = le cron Vercel ne tourne pas → vérifie <b>Vercel → onglet Crons</b>.
                Le récap mensuel ne part que le 1er du mois (via ce cron).
              </div>
            </>
          )}
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

      {/* === Diagnostic récap email (dry-run, aucun envoi) === */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>📨 Diagnostic récap mensuel (dry-run — aucun email envoyé)</div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={runRecapDiag} disabled={recapDiag === 'loading'} style={{ padding: '9px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, background: C.blue, color: '#fff', border: 'none', cursor: recapDiag === 'loading' ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {recapDiag === 'loading' ? '⏳ Analyse…' : '▶ Lancer le diagnostic (mois précédent)'}
            </button>
            <button onClick={runRecapTest} disabled={recapTest === 'loading'} style={{ padding: '9px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, background: 'transparent', color: C.amber, border: `1px solid ${C.amber}`, cursor: recapTest === 'loading' ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {recapTest === 'loading' ? '⏳ Envoi…' : '✉️ Envoyer un test à moi-même'}
            </button>
          </div>
          {recapTest && recapTest !== 'loading' && (
            <div style={{ marginTop: 12, fontSize: 12, fontFamily: 'monospace' }}>
              {recapTest.sent
                ? <span style={{ color: C.green }}>✅ Test envoyé à {recapTest.to} → clé Resend VALIDE. Le récap a donc échoué ailleurs (cron Hobby non firé le 1er juin le plus probable).</span>
                : <span style={{ color: C.red }}>⚠ Échec envoi : {recapTest.error} → si c&apos;est un 401, la clé Resend est INVALIDE/restreinte → régénère-la et mets à jour RESEND_API_KEY.</span>}
            </div>
          )}
          {recapDiag && recapDiag !== 'loading' && (
            recapDiag.error ? (
              <div style={{ marginTop: 12, color: C.red, fontSize: 12, fontFamily: 'monospace' }}>⚠ {recapDiag.error}</div>
            ) : (
              <div style={{ marginTop: 14, fontSize: 12, lineHeight: 1.9, fontFamily: 'monospace' }}>
                <div>Mois analysé : <strong style={{ color: C.text }}>{recapDiag.month}</strong> ({recapDiag.window?.start} → {recapDiag.window?.end})</div>
                <div>CRON_SECRET : {recapDiag.env?.CRON_SECRET ? <span style={{ color: C.green }}>✓</span> : <span style={{ color: C.red }}>✗</span>} · RESEND_API_KEY : {recapDiag.env?.RESEND_API_KEY ? <span style={{ color: C.green }}>✓</span> : <span style={{ color: C.red }}>✗</span>}</div>
                <div>Domaine Resend : <strong style={{ color: recapDiag.resendDomain === 'verified' ? C.green : C.amber }}>{String(recapDiag.resendDomain)}</strong></div>
                <div>Users total : <strong style={{ color: C.text }}>{recapDiag.usersTotal}</strong> · activité du mois — trades {recapDiag.activityCounts?.trades}, payouts {recapDiag.activityCounts?.payouts}, firms {recapDiag.activityCounts?.newFirms}, comptes {recapDiag.activityCounts?.newAccounts}</div>
                <div style={{ marginTop: 6, fontSize: 14 }}>📬 Destinataires éligibles : <strong style={{ color: recapDiag.eligibleRecipients > 0 ? C.green : C.amber }}>{recapDiag.eligibleRecipients}</strong></div>
                {recapDiag.sample?.length > 0 && <div style={{ color: C.text3 }}>Échantillon : {recapDiag.sample.join(', ')}</div>}
                <div style={{ marginTop: 10, padding: '8px 12px', background: C.surface2, borderRadius: 6, color: C.text3, fontFamily: 'inherit', lineHeight: 1.5 }}>
                  {recapDiag.eligibleRecipients > 0
                    ? "Des destinataires existaient pour ce mois → si personne n'a reçu l'email, le cron Hobby n'a probablement pas firé ce jour-là (ou échec Resend). Pistes : bouton « Run » sur Vercel pour ce mois, ou passer Vercel Pro."
                    : "0 destinataire éligible → c'est NORMAL que personne n'ait reçu le récap : aucun user n'avait d'activité (trade / payout / firme / compte créé) sur la période."}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
