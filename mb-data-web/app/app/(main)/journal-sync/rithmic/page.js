'use client'
// Rithmic Live Sync — manage MULTIPLE Rithmic credentials sets per user.
// Each set is identified by a unique `label`.

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

// system_name values to pick from. Use EXACTLY what R|Trader Pro shows.
const SYSTEMS = [
  { value: 'Rithmic Test', label: 'Rithmic Test (free demo)' },
  { value: 'Rithmic Paper Trading', label: 'Rithmic Paper Trading' },
  { value: 'Rithmic 04 Colo', label: 'Rithmic 04 Colo (production)' },
  { value: 'Rithmic 01', label: 'Rithmic 01' },
  { value: 'Rithmic 04', label: 'Rithmic 04' },
  { value: 'TopstepTrader', label: 'Topstep' },
  { value: 'Apex', label: 'Apex Trader Funding' },
  { value: 'LucidTrading', label: 'Lucid Trading' },
  { value: 'My Funded Futures', label: 'My Funded Futures' },
  { value: 'Tradeify', label: 'Tradeify' },
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

  // List of saved credentials sets
  const [credsList, setCredsList] = useState([])
  const [credsLoading, setCredsLoading] = useState(true)
  const [credsError, setCredsError] = useState(null)

  // Form state for adding/editing a connection (null = no form open)
  const [editingLabel, setEditingLabel] = useState(null)  // label of the one being edited, or '__new__' for new
  const [formLabel, setFormLabel] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formSystem, setFormSystem] = useState(SYSTEMS[0].value)
  const [formAutoSync, setFormAutoSync] = useState(false)
  const [formDaysWindow, setFormDaysWindow] = useState(7)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)

  // Sync state — one job at a time displayed
  const [days, setDays] = useState(90)
  const [syncLabel, setSyncLabel] = useState('')  // '' = sync all
  const [syncing, setSyncing] = useState(false)
  const [currentJob, setCurrentJob] = useState(null)
  const [syncError, setSyncError] = useState(null)

  // Mapped accounts (from useApp.firms)
  const mappedAccounts = []
  for (const f of (firms || [])) {
    for (const a of (f.accounts || [])) {
      if (a.rithmic_account_id) mappedAccounts.push({ ...a, firmName: f.name })
    }
  }

  async function loadCreds() {
    setCredsError(null)
    try {
      const res = await authedFetch('/api/rithmic/credentials')
      const data = await res.json()
      if (!res.ok) {
        setCredsError(data?.error || data?.detail || `HTTP ${res.status}`)
        setCredsList([])
      } else {
        setCredsList(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      setCredsError(e.message)
    } finally {
      setCredsLoading(false)
    }
  }

  useEffect(() => { loadCreds() }, [])

  // Poll job status every 3s when a sync is running
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

  function openNewForm() {
    setEditingLabel('__new__')
    setFormLabel('')
    setFormUsername('')
    setFormPassword('')
    setFormSystem(SYSTEMS[0].value)
    setFormAutoSync(false)
    setFormDaysWindow(7)
    setSaveMsg(null)
  }

  function openEditForm(creds) {
    setEditingLabel(creds.label)
    setFormLabel(creds.label)
    setFormUsername('')
    setFormPassword('')
    setFormSystem(creds.system_name)
    setFormAutoSync(!!creds.auto_sync_enabled)
    setFormDaysWindow(creds.auto_sync_days_window || 7)
    setSaveMsg(null)
  }

  function closeForm() {
    setEditingLabel(null)
    setSaveMsg(null)
  }

  async function saveForm(e) {
    e?.preventDefault?.()
    if (!formLabel || !formUsername || !formPassword || !formSystem) {
      setSaveMsg({ type: 'error', text: 'Tous les champs sont requis (label, user, password, système)' })
      return
    }
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await authedFetch('/api/rithmic/credentials', {
        method: 'POST',
        body: JSON.stringify({
          label: formLabel,
          username: formUsername,
          password: formPassword,
          system_name: formSystem,
          auto_sync_enabled: formAutoSync,
          auto_sync_days_window: formDaysWindow,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || data?.detail || `HTTP ${res.status}`)
      await loadCreds()
      closeForm()
    } catch (e) {
      setSaveMsg({ type: 'error', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  async function deleteCreds(label) {
    if (!confirm(`Supprimer la connexion "${label}" ?`)) return
    try {
      const res = await authedFetch(`/api/rithmic/credentials?label=${encodeURIComponent(label)}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
      await loadCreds()
    } catch (e) {
      alert(`Erreur suppression : ${e.message}`)
    }
  }

  async function startSync(label = '') {
    setSyncing(true)
    setSyncError(null)
    setCurrentJob(null)
    try {
      const res = await authedFetch('/api/rithmic/sync', {
        method: 'POST',
        body: JSON.stringify({ days, label: label || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || data?.detail || `HTTP ${res.status}`)
      setCurrentJob(data)
      setSyncLabel(label)
    } catch (e) {
      setSyncError(e.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div style={{ padding: '40px 24px 80px', maxWidth: 900, margin: '0 auto' }}>
      <nav style={{ fontSize: 12, color: C.text3, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/app/journal-sync" style={{ color: C.text3, textDecoration: 'none' }}>Journal Sync</Link>
        <span>›</span>
        <span style={{ color: C.text2 }}>Rithmic Live</span>
      </nav>

      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, marginBottom: 8, letterSpacing: '-0.02em' }}>
        ⚡ Rithmic Live Sync
      </h1>
      <p style={{ fontSize: 14, color: C.text2, margin: 0, marginBottom: 32, lineHeight: 1.6 }}>
        Connecte plusieurs PropFirms en parallèle (une connexion par paire de credentials Rithmic).
        Quantara importe ensuite tes trades automatiquement via l&apos;API officielle Rithmic Protocol Buffer.
      </p>

      {/* Section 1 — Connexions */}
      <section style={sectionStyle}>
        <SectionHeader number="1" title="Connexions Rithmic" />

        {credsError && (
          <div style={{ fontSize: 13, color: C.red, lineHeight: 1.6, marginBottom: 12 }}>
            Service rithmic-sync indisponible : {credsError}
          </div>
        )}

        {credsLoading ? (
          <div style={{ fontSize: 13, color: C.text3 }}>Chargement…</div>
        ) : (
          <>
            {/* List of saved credentials */}
            {credsList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {credsList.map((creds) => (
                  <CredentialsCard
                    key={creds.id}
                    creds={creds}
                    onSync={() => startSync(creds.label)}
                    onEdit={() => openEditForm(creds)}
                    onDelete={() => deleteCreds(creds.label)}
                    syncDisabled={syncing || (currentJob && currentJob.status === 'running')}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                padding: 18, background: 'rgba(255,255,255,0.02)', border: `1px dashed ${C.border2}`, borderRadius: 10,
                fontSize: 13, color: C.text3, marginBottom: 14, textAlign: 'center',
              }}>
                Aucune connexion configurée. Ajoute une connexion ci-dessous pour commencer.
              </div>
            )}

            {/* Add new / Edit form */}
            {editingLabel ? (
              <form onSubmit={saveForm} style={{
                background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16,
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.purple }}>
                  {editingLabel === '__new__' ? '➕ Nouvelle connexion' : `✏ Modifier "${editingLabel}"`}
                </div>
                <Field label="Label (nom de la connexion)">
                  <input
                    type="text"
                    value={formLabel}
                    onChange={e => setFormLabel(e.target.value)}
                    placeholder="ex : Lucid main, TPT, Topstep eval"
                    disabled={editingLabel !== '__new__'}
                    style={inputStyle}
                  />
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
                    Un nom à toi pour distinguer tes connexions. Unique par utilisateur.
                  </div>
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Username Rithmic">
                    <input
                      type="text"
                      value={formUsername}
                      onChange={e => setFormUsername(e.target.value)}
                      placeholder="ex : LT-63Q7ULJ4"
                      autoComplete="off"
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Password Rithmic">
                    <input
                      type="password"
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      style={inputStyle}
                    />
                  </Field>
                </div>
                <Field label="Système Rithmic">
                  <select value={formSystem} onChange={e => setFormSystem(e.target.value)} style={inputStyle}>
                    {SYSTEMS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
                    Ce que tu sélectionnes dans la liste &quot;System&quot; de R|Trader Pro / TopstepX au login.
                  </div>
                </Field>

                {/* Auto-sync toggle */}
                <div style={{
                  background: 'rgba(167,139,250,0.06)',
                  border: `1px solid rgba(167,139,250,0.18)`,
                  borderRadius: 8,
                  padding: 12,
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formAutoSync}
                      onChange={e => setFormAutoSync(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.purple }}
                    />
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
                      🕒 Sync automatique toutes les 15 min
                    </span>
                  </label>
                  {formAutoSync && (
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11.5, color: C.text2 }}>Fenêtre à sync à chaque tour :</span>
                      <select
                        value={formDaysWindow}
                        onChange={e => setFormDaysWindow(parseInt(e.target.value, 10))}
                        style={{ ...inputStyle, width: 'auto', padding: '4px 8px', fontSize: 12 }}
                      >
                        <option value={1}>1 jour</option>
                        <option value={3}>3 jours</option>
                        <option value={7}>7 jours</option>
                        <option value={14}>14 jours</option>
                        <option value={30}>30 jours</option>
                      </select>
                      <span style={{ fontSize: 11, color: C.text3 }}>
                        (recommandé : 7j — suffisant pour rattraper toute activité récente)
                      </span>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 8, lineHeight: 1.5 }}>
                    Quand activé, le cron Vercel sync cette connexion toutes les 15 min sans intervention.
                    Tes trades arrivent automatiquement dans le journal.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" disabled={saving} style={{
                    padding: '9px 18px', background: saving ? C.text3 : C.purple, color: '#fff', border: 'none',
                    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                  }}>
                    {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                  </button>
                  <button type="button" onClick={closeForm} style={{
                    padding: '9px 14px', background: 'transparent', color: C.text2, border: `1px solid ${C.border2}`,
                    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                    Annuler
                  </button>
                </div>
                {saveMsg && (
                  <div style={{ fontSize: 12, color: saveMsg.type === 'error' ? C.red : C.green }}>
                    {saveMsg.text}
                  </div>
                )}
              </form>
            ) : (
              <button onClick={openNewForm} style={{
                padding: '10px 18px', background: 'transparent', color: C.purple, border: `1px dashed ${C.purple}66`,
                borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%',
              }}>
                + Ajouter une connexion
              </button>
            )}

            <div style={{
              marginTop: 16, padding: 12, background: 'rgba(45,111,255,0.04)', border: `1px dashed ${C.border2}`,
              borderRadius: 10, fontSize: 11.5, color: C.text3, lineHeight: 1.6,
            }}>
              🔐 Chaque paire de credentials est chiffrée (AES-128 Fernet) côté serveur avant insertion en DB.
              La clé maître n&apos;est jamais commitée et vit uniquement en variable d&apos;environnement Railway.
            </div>
          </>
        )}
      </section>

      {/* Section 2 — Mapping accounts */}
      <section style={sectionStyle}>
        <SectionHeader number="2" title="Mapper tes comptes Rithmic" />
        <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, margin: 0, marginBottom: 14 }}>
          Pour chaque compte Quantara, indique l&apos;<strong>account_id Rithmic</strong> (visible dans
          R|Trader Pro ou TopstepX, typiquement <code>LFF050-XXXXXXX</code> ou <code>APEX-XXXXX</code>).
          Cette étape se fait dans la page de chaque compte sur le dashboard.
        </p>
        {mappedAccounts.length === 0 ? (
          <div style={{
            padding: 16, background: 'rgba(250,199,117,0.08)', border: `1px solid ${C.amber}30`,
            borderRadius: 10, fontSize: 13, color: C.text2, lineHeight: 1.6,
          }}>
            Aucun compte n&apos;a de <code>rithmic_account_id</code> rempli. Édite tes comptes depuis le{' '}
            <Link href="/app/dashboard" style={{ color: C.blueLt }}>Dashboard</Link> pour ajouter cette info.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mappedAccounts.map(a => (
              <li key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                background: C.surface2, borderRadius: 8,
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

      {/* Section 3 — Lancer une sync */}
      <section style={sectionStyle}>
        <SectionHeader number="3" title="Lancer une sync" />

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 6 }}>
          <Field label="Période (jours)" style={{ flex: '0 0 140px' }}>
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
            onClick={() => startSync('')}
            disabled={syncing || credsList.length === 0 || mappedAccounts.length === 0 || (currentJob && currentJob.status === 'running')}
            style={{
              padding: '10px 22px',
              background: (syncing || credsList.length === 0 || mappedAccounts.length === 0) ? C.text3 : C.purple,
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: (syncing || credsList.length === 0 || mappedAccounts.length === 0) ? 'not-allowed' : 'pointer',
            }}
          >
            {syncing ? 'Démarrage…' : (currentJob?.status === 'running' ? 'Sync en cours…' : '⚡ Sync TOUTES les connexions')}
          </button>
        </div>
        <p style={{ fontSize: 11.5, color: C.text3, margin: 0, marginBottom: 14 }}>
          Tu peux aussi lancer une sync sur <strong>une seule connexion</strong> en cliquant le bouton ⚡ Sync à droite de chaque connexion ci-dessus.
        </p>

        {syncError && <div style={{ fontSize: 13, color: C.red, marginBottom: 10 }}>{syncError}</div>}

        {currentJob && (
          <div style={{
            marginTop: 8, padding: 16, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10,
          }}>
            <div style={{ fontSize: 12, color: C.text3, marginBottom: 8, fontFamily: 'monospace' }}>
              Job ID : {currentJob.job_id}{syncLabel ? ` · sync ciblée : "${syncLabel}"` : ' · sync globale (toutes les connexions)'}
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
                ✓ Vois tes trades dans <Link href="/app/journal-sync/view" style={{ color: C.blueLt }}>le journal sync</Link>.
              </div>
            )}
          </div>
        )}
      </section>

      <Link href="/app/journal-sync" style={{ fontSize: 12, color: C.text3, textDecoration: 'none' }}>← Retour à Journal Sync</Link>
    </div>
  )
}

function CredentialsCard({ creds, onSync, onEdit, onDelete, syncDisabled }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
      background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          {creds.label}
          {creds.auto_sync_enabled && (
            <span style={{
              padding: '2px 8px',
              background: 'rgba(29,184,122,0.12)',
              color: C.green,
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }} title="Sync auto activé">🕒 AUTO</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
          Système : <span style={{ color: C.purple, fontFamily: 'monospace' }}>{creds.system_name}</span>
          {creds.last_synced_at && (
            <span style={{ marginLeft: 8 }}>· Dernière sync : {timeAgo(creds.last_synced_at)}</span>
          )}
        </div>
      </div>
      <button onClick={onSync} disabled={syncDisabled} title="Lancer une sync sur cette connexion seulement" style={{
        padding: '7px 12px', background: syncDisabled ? C.text3 : C.purple, color: '#fff', border: 'none',
        borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: syncDisabled ? 'not-allowed' : 'pointer',
      }}>⚡ Sync</button>
      <button onClick={onEdit} title="Modifier les credentials" style={{
        padding: '7px 10px', background: 'transparent', color: C.text2, border: `1px solid ${C.border2}`,
        borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
      }}>✏</button>
      <button onClick={onDelete} title="Supprimer cette connexion" style={{
        padding: '7px 10px', background: 'transparent', color: C.red, border: `1px solid ${C.red}33`,
        borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
      }}>🗑</button>
    </div>
  )
}

function timeAgo(iso) {
  try {
    const then = new Date(iso).getTime()
    const diffMs = Date.now() - then
    const min = Math.floor(diffMs / 60_000)
    if (min < 1) return "à l'instant"
    if (min < 60) return `il y a ${min} min`
    const hours = Math.floor(min / 60)
    if (hours < 24) return `il y a ${hours} h`
    const days = Math.floor(hours / 24)
    return `il y a ${days} j`
  } catch {
    return ''
  }
}

function SectionHeader({ number, title }) {
  return (
    <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, background: C.purple, color: '#fff', borderRadius: '50%', fontSize: 13,
      }}>{number}</span>
      {title}
    </h2>
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

const sectionStyle = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: '24px 26px',
  marginBottom: 20,
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
