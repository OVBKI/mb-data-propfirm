'use client'
// Rithmic Live Sync — UI to connect Rithmic credentials + trigger historical sync.
// Talks to the FastAPI service via /api/rithmic/* Next.js proxy routes.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../../../../lib/supabase'
import { useApp } from '../../AppContext'

const C = {
  bg: '#0d0f14',
  surface: 'rgba(20,23,32,0.65)',
  surface2: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#7b839b',
  blue: '#2d6fff',
  blueLt: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
  red: '#e8504a',
  purple: '#a78bfa',
}

// The list of Rithmic system_name values traders typically need to pick.
// Source: Rithmic OS connect dropdown.
const SYSTEMS = [
  { value: 'Rithmic Paper Trading', label: 'Rithmic Paper Trading (test)' },
  { value: 'Rithmic 04 Colo', label: 'Rithmic 04 Colo (production)' },
  { value: 'TopstepTrader', label: 'TopstepTrader' },
  { value: 'Apex', label: 'Apex Trader Funding' },
  { value: 'My Funded Futures', label: 'My Funded Futures' },
  { value: 'Tradeify', label: 'Tradeify' },
  { value: 'Lucid Trading', label: 'Lucid Trading' },
  { value: 'Take Profit Trader', label: 'Take Profit Trader' },
  { value: 'Bulenox', label: 'Bulenox' },
]

async function authedFetch(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Not authenticated')
  return fetch(path, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      'Authorization': `Bearer ${token}`,
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
}

export default function RithmicSyncPage() {
  const { firms, user } = useApp()
  const [credsStatus, setCredsStatus] = useState(null)  // { has_credentials, system_name }
  const [credsLoading, setCredsLoading] = useState(true)
  const [credsError, setCredsError] = useState(null)

  // Form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [systemName, setSystemName] = useState(SYSTEMS[0].value)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)

  // Sync state
  const [days, setDays] = useState(90)
  const [syncing, setSyncing] = useState(false)
  const [currentJob, setCurrentJob] = useState(null)
  const [syncError, setSyncError] = useState(null)

  // Accounts that have a rithmic_account_id (computed from useApp.firms)
  const mappedAccounts = []
  for (const f of (firms || [])) {
    for (const a of (f.accounts || [])) {
      if (a.rithmic_account_id) mappedAccounts.push({ ...a, firmName: f.name })
    }
  }

  // Load credentials status on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await authedFetch('/api/rithmic/credentials')
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setCredsError(data?.error || `HTTP ${res.status}`)
        } else {
          setCredsStatus(data)
          if (data?.system_name) setSystemName(data.system_name)
        }
      } catch (e) {
        if (!cancelled) setCredsError(e.message)
      } finally {
        if (!cancelled) setCredsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Poll job status every 3s when a sync is in progress
  useEffect(() => {
    if (!currentJob || currentJob.status === 'completed' || currentJob.status === 'failed') return
    const interval = setInterval(async () => {
      try {
        const res = await authedFetch(`/api/rithmic/sync?job_id=${encodeURIComponent(currentJob.job_id)}`)
        const data = await res.json()
        if (res.ok) setCurrentJob(data)
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [currentJob])

  async function saveCredentials(e) {
    e?.preventDefault?.()
    if (!username || !password || !systemName) {
      setSaveMsg({ type: 'error', text: 'Username, password et système requis' })
      return
    }
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await authedFetch('/api/rithmic/credentials', {
        method: 'POST',
        body: JSON.stringify({ username, password, system_name: systemName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setCredsStatus(data)
      setSaveMsg({ type: 'success', text: 'Credentials chiffrés et sauvegardés ✓' })
      setUsername('')
      setPassword('')
    } catch (e) {
      setSaveMsg({ type: 'error', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  async function deleteCredentials() {
    if (!confirm('Supprimer les credentials Rithmic ? La sync sera désactivée.')) return
    try {
      const res = await authedFetch('/api/rithmic/credentials', { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
      setCredsStatus({ has_credentials: false, system_name: '' })
      setSaveMsg({ type: 'success', text: 'Credentials supprimés' })
    } catch (e) {
      setSaveMsg({ type: 'error', text: e.message })
    }
  }

  async function startSync() {
    setSyncing(true)
    setSyncError(null)
    setCurrentJob(null)
    try {
      const res = await authedFetch('/api/rithmic/sync', {
        method: 'POST',
        body: JSON.stringify({ days }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      setCurrentJob(data)
    } catch (e) {
      setSyncError(e.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div style={{ padding: '40px 24px 80px', maxWidth: 900, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 12, color: C.text3, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/app/journal-sync" style={{ color: C.text3, textDecoration: 'none' }}>Journal Sync</Link>
        <span>›</span>
        <span style={{ color: C.text2 }}>Rithmic Live</span>
      </nav>

      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, marginBottom: 8, letterSpacing: '-0.02em' }}>
        ⚡ Rithmic Live Sync
      </h1>
      <p style={{ fontSize: 14, color: C.text2, margin: 0, marginBottom: 32, lineHeight: 1.6 }}>
        Connecte ton compte Rithmic une fois — Quantara importe ensuite tes trades automatiquement
        via l&apos;API officielle Rithmic Protocol Buffer (le même flux que TopstepX, RTrader Pro, etc.).
        Pas de CSV à exporter, jusqu&apos;à 365 jours d&apos;historique en un clic.
      </p>

      {/* Step 1 — Credentials */}
      <section style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '24px 26px',
        marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, background: C.purple, color: '#fff', borderRadius: '50%', fontSize: 13 }}>1</span>
          Credentials Rithmic
          {credsStatus?.has_credentials && (
            <span style={{ marginLeft: 'auto', fontSize: 11, padding: '3px 10px', background: 'rgba(29,184,122,0.12)', color: C.green, borderRadius: 99, fontWeight: 600 }}>
              ✓ Connecté ({credsStatus.system_name})
            </span>
          )}
        </h2>

        {credsLoading ? (
          <div style={{ fontSize: 13, color: C.text3 }}>Chargement…</div>
        ) : credsError ? (
          <div style={{ fontSize: 13, color: C.red, lineHeight: 1.6 }}>
            Service rithmic-sync indisponible : {credsError}
            <div style={{ fontSize: 12, color: C.text3, marginTop: 6 }}>
              Demande à l&apos;admin de configurer la variable d&apos;environnement <code>RITHMIC_SYNC_URL</code> sur Vercel.
            </div>
          </div>
        ) : (
          <form onSubmit={saveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Username Rithmic">
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={credsStatus?.has_credentials ? '••••••• (déjà saved)' : 'ex : your_rithmic_login'}
                  autoComplete="username"
                  style={inputStyle}
                />
              </Field>
              <Field label="Password Rithmic">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={credsStatus?.has_credentials ? '••••••• (déjà saved)' : '••••••••'}
                  autoComplete="new-password"
                  style={inputStyle}
                />
              </Field>
            </div>
            <Field label="Système Rithmic">
              <select value={systemName} onChange={e => setSystemName(e.target.value)} style={inputStyle}>
                {SYSTEMS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
                Le système est ce que tu sélectionnes dans la liste déroulante de R|Trader Pro / TopstepX au login.
              </div>
            </Field>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button type="submit" disabled={saving} style={{
                padding: '10px 20px',
                background: saving ? C.text3 : C.purple,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? 'Sauvegarde...' : (credsStatus?.has_credentials ? 'Mettre à jour' : 'Sauvegarder')}
              </button>
              {credsStatus?.has_credentials && (
                <button type="button" onClick={deleteCredentials} style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  color: C.red,
                  border: `1px solid ${C.red}40`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  Déconnecter
                </button>
              )}
            </div>
            {saveMsg && (
              <div style={{
                fontSize: 12,
                color: saveMsg.type === 'error' ? C.red : C.green,
                marginTop: 4,
              }}>
                {saveMsg.text}
              </div>
            )}
          </form>
        )}

        <div style={{
          marginTop: 20,
          padding: 14,
          background: 'rgba(45,111,255,0.04)',
          border: `1px dashed ${C.border2}`,
          borderRadius: 10,
          fontSize: 12,
          color: C.text3,
          lineHeight: 1.6,
        }}>
          🔐 Tes credentials sont chiffrés (AES-128 Fernet) avant insertion en base. Personne — pas même
          l&apos;équipe Quantara — ne peut les lire en clair. La clé maître vit uniquement en variable
          d&apos;environnement sur le serveur Rithmic Sync.
        </div>
      </section>

      {/* Step 2 — Map accounts */}
      <section style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '24px 26px',
        marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, background: C.purple, color: '#fff', borderRadius: '50%', fontSize: 13 }}>2</span>
          Mapper tes comptes Rithmic
        </h2>
        <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, margin: 0, marginBottom: 14 }}>
          Pour chaque compte Quantara, indique l&apos;<strong>account_id Rithmic</strong> (visible dans
          R|Trader Pro ou TopstepX, généralement un code type <code>APEX-1234567</code>). Sans ce mapping,
          la sync ne saura pas où ranger tes trades.
        </p>
        {mappedAccounts.length === 0 ? (
          <div style={{
            padding: 16,
            background: 'rgba(250,199,117,0.08)',
            border: `1px solid ${C.amber}30`,
            borderRadius: 10,
            fontSize: 13,
            color: C.text2,
            lineHeight: 1.6,
          }}>
            Aucun compte n&apos;a de <code>rithmic_account_id</code> rempli. Va dans <Link href="/app/dashboard" style={{ color: C.blueLt }}>Dashboard</Link>,
            édite chacun de tes comptes financés et renseigne le champ. Tu peux aussi le faire directement
            dans Supabase en éditant la colonne <code>accounts.rithmic_account_id</code>.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mappedAccounts.map(a => (
              <li key={a.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: C.surface2,
                borderRadius: 8,
              }}>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{a.firmName}</span>
                <span style={{ fontSize: 12, color: C.text3 }}>· {(a.plan_size || '').toUpperCase()}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: C.purple, fontFamily: 'monospace' }}>
                  {a.rithmic_account_id}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Step 3 — Trigger sync */}
      <section style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '24px 26px',
        marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, background: C.purple, color: '#fff', borderRadius: '50%', fontSize: 13 }}>3</span>
          Lancer la sync historique
        </h2>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <Field label="Période (jours)" style={{ flex: '0 0 160px' }}>
            <input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={e => setDays(Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 90)))}
              style={inputStyle}
            />
          </Field>
          <button
            type="button"
            onClick={startSync}
            disabled={syncing || !credsStatus?.has_credentials || mappedAccounts.length === 0 || (currentJob && currentJob.status === 'running')}
            style={{
              padding: '10px 22px',
              background: (syncing || !credsStatus?.has_credentials || mappedAccounts.length === 0) ? C.text3 : C.purple,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: (syncing || !credsStatus?.has_credentials || mappedAccounts.length === 0) ? 'not-allowed' : 'pointer',
            }}
          >
            {syncing ? 'Démarrage...' : (currentJob?.status === 'running' ? 'Sync en cours...' : 'Lancer la sync')}
          </button>
        </div>

        {syncError && (
          <div style={{ marginTop: 14, fontSize: 13, color: C.red }}>{syncError}</div>
        )}

        {currentJob && (
          <div style={{
            marginTop: 18,
            padding: 16,
            background: C.surface2,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 12, color: C.text3, marginBottom: 8, fontFamily: 'monospace' }}>
              Job ID : {currentJob.job_id}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <Stat label="Statut" value={currentJob.status} color={statusColor(currentJob.status)} />
              <Stat label="Trades importés" value={currentJob.trades_imported || 0} color={C.green} />
              <Stat label="Comptes synchronisés" value={currentJob.accounts_synced || 0} color={C.text} />
            </div>
            {currentJob.error && (
              <div style={{ marginTop: 10, fontSize: 12, color: C.red, lineHeight: 1.5 }}>
                ⚠ {currentJob.error}
              </div>
            )}
            {currentJob.status === 'completed' && (currentJob.trades_imported || 0) > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: C.green }}>
                ✓ Tu peux voir tes trades dans <Link href="/app/journal-sync/view" style={{ color: C.blueLt }}>le journal sync</Link>.
              </div>
            )}
          </div>
        )}
      </section>

      <Link href="/app/journal-sync" style={{ fontSize: 12, color: C.text3, textDecoration: 'none' }}>← Retour à Journal Sync</Link>
    </div>
  )
}

function Field({ label, children, style }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <span style={{ fontSize: 11, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        {label}
      </span>
      {children}
    </label>
  )
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: '-0.01em' }}>
        {value}
      </div>
    </div>
  )
}

function statusColor(status) {
  if (status === 'completed') return C.green
  if (status === 'running') return C.amber
  if (status === 'failed') return C.red
  return C.text3
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${C.border2}`,
  borderRadius: 8,
  color: C.text,
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}
