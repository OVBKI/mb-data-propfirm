'use client'
// Écran de connexion Tradovate — par OAUTH.
//
// Aucun mot de passe n'est saisi ici. L'utilisateur part sur Tradovate, autorise
// un accès en LECTURE SEULE, et nous revenons avec un jeton.
//
// ⚠️ « Démo » est le défaut, et ce n'est pas une erreur : les comptes PropFirm
// vivent sur l'environnement demo de Tradovate même quand les payouts sont
// réels. Choisir « live » renvoie « identifiants invalides » sans explication —
// d'où le libellé qui le dit franchement plutôt qu'un simple « Démo/Live ».

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../../../../lib/supabase'
import { useApp } from '../../AppContext'
import { planLimitMessage } from '../../../../../lib/planLimits'
import { useT, useLanguage } from '../../../../../components/LanguageProvider'

const EMPTY = { label: '', environment: 'demo' }

export default function TradovateSyncPage() {
  const { S, accts, showToast } = useApp()
  const t = useT()
  const { locale } = useLanguage()

  const [creds, setCreds] = useState([])
  const [configured, setConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(null)
  const [target, setTarget] = useState('')

  const authed = useCallback(async (path, init = {}) => {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    const res = await fetch(path, {
      ...init,
      headers: { ...(init.headers || {}), 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, json }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const { ok, json } = await authed('/api/tradovate/credentials')
    if (ok) { setCreds(json.credentials || []); setConfigured(json.configured !== false) }
    setLoading(false)
  }, [authed])

  useEffect(() => { load() }, [load])

  // On récupère l'URL d'autorisation puis on y envoie l'utilisateur. Une simple
  // redirection depuis un fetch authentifié perdrait l'en-tête Authorization —
  // d'où l'aller-retour en deux temps.
  async function connect(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    const q = new URLSearchParams({ label: form.label || 'Tradovate', environment: form.environment })
    const { ok, json } = await authed(`/api/tradovate/oauth/start?${q}`)
    setBusy(false)
    if (!ok) { showToast(json.error || 'Impossible de démarrer l’autorisation'); return }
    window.location.href = json.url
  }

  async function remove(id) {
    if (!confirm('Supprimer cette connexion ? Les identifiants sont effacés.')) return
    const { ok, json } = await authed(`/api/tradovate/credentials?id=${id}`, { method: 'DELETE' })
    if (!ok) { showToast(json.error || 'Suppression impossible'); return }
    load()
  }

  async function sync(credentialId) {
    if (!target) { showToast('Choisis d’abord le compte Quantara de destination'); return }
    setSyncing(credentialId)
    const { ok, json } = await authed('/api/tradovate/sync', {
      method: 'POST', body: JSON.stringify({ credentialId, accountId: target }),
    })
    setSyncing(null)
    if (!ok) {
      // Un dépassement de quota remonte en message brut de Postgres : on le
      // traduit, sinon l'utilisateur lit « PLAN_LIMIT_REACHED:maxTrades… ».
      showToast(planLimitMessage(json.error, locale) || json.error || 'Synchronisation échouée')
      return
    }
    showToast(json.imported
      ? `${json.imported} trade${json.imported > 1 ? 's' : ''} importé${json.imported > 1 ? 's' : ''}${json.incomplete ? ` · ${json.incomplete} à compléter` : ''}`
      : json.message || 'Rien de nouveau')
    load()
  }

  const label = { fontSize: 10.5, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text3)', display: 'block', marginBottom: 6 }

  return (
    <div style={{ padding: '40px 24px 80px', maxWidth: 900, margin: '0 auto' }}>
      <Link href="/app/journal-sync" style={{ fontSize: 13, color: 'var(--text3)', textDecoration: 'none' }}>‹ Journal Sync</Link>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', margin: '10px 0 6px' }}>Tradovate</h1>
      <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, maxWidth: '62ch', margin: '0 0 8px' }}>
        Importe automatiquement tes allers-retours depuis ton compte Tradovate — Apex, Lucid,
        Bulenox, Funded Futures Network et les autres firmes qui l’utilisent.
      </p>
      {/* Dit clairement ce qui est demandé et pourquoi. */}
      <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, maxWidth: '62ch', margin: '0 0 26px' }}>
        Tu autorises l’accès directement chez Tradovate : ton mot de passe ne passe jamais par
        Quantara. L’accès est en lecture seule — aucun ordre ne peut être passé — et il s’annule
        dès que tu supprimes la connexion.
      </p>

      {!configured && (
        <div style={{ ...S.card, padding: '16px 18px', marginBottom: 24, borderColor: 'var(--amber)' }}>
          <strong style={{ color: 'var(--amber)', fontSize: 13 }}>Configuration incomplète</strong>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: '6px 0 0', lineHeight: 1.55 }}>
            Les identifiants OAuth ne sont pas renseignés côté serveur. Ils sont délivrés après
            acceptation du dossier NinjaTrader Ecosystem, puis se posent dans les variables
            d’environnement (<code>TRADOVATE_CLIENT_ID</code>, <code>TRADOVATE_CLIENT_SECRET</code>).
          </p>
        </div>
      )}

      <form onSubmit={connect} style={{ ...S.card, padding: '22px 24px', marginBottom: 28 }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 18px' }}>Connecter un compte</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={label}>Nom de la connexion</label>
            <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="Apex 250k" style={S.input} required />
          </div>
          <div>
            <label style={label}>Type de compte</label>
            <select value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))} style={S.input}>
              <option value="demo">Compte PropFirm (évaluation ou financé)</option>
              <option value="live">Compte personnel Tradovate</option>
            </select>
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--text3)', lineHeight: 1.55, margin: '14px 0 0' }}>
          Tu vas être redirigé vers Tradovate pour autoriser l’accès. Tu saisis ton mot de passe
          chez eux, pas ici.
        </p>
        <button type="submit" disabled={busy || !configured}
          style={{ ...S.btnPrimary, marginTop: 16, opacity: busy || !configured ? 0.5 : 1 }}>
          {busy ? 'Redirection…' : 'Autoriser sur Tradovate →'}
        </button>
      </form>

      <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 14px' }}>Connexions</h2>

      {creds.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={label}>Compte Quantara de destination</label>
          <select value={target} onChange={e => setTarget(e.target.value)} style={{ ...S.input, maxWidth: 420 }}>
            <option value="">— choisir —</option>
            {(accts || []).map(a => (
              <option key={a.id} value={a.id}>{a.name || `Compte du ${a.buy_date}`} ({a.status})</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>Chargement…</p>
      ) : creds.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>Aucune connexion pour l’instant.</p>
      ) : creds.map(c => (
        <div key={c.id} style={{ ...S.card, padding: '16px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{c.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
              {c.username} · {c.environment === 'demo' ? 'Démo' : 'Live'}
              {c.last_synced_at && ` · dernière synchro ${new Date(c.last_synced_at).toLocaleString('fr-FR')}`}
            </div>
            {c.last_error && (
              <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 5 }}>{c.last_error}</div>
            )}
          </div>
          <button onClick={() => sync(c.id)} disabled={syncing === c.id} style={S.btnPrimary}>
            {syncing === c.id ? 'Synchro…' : 'Synchroniser'}
          </button>
          <button onClick={() => remove(c.id)} style={{ ...S.btnGhost, color: 'var(--red-text)' }}>Supprimer</button>
        </div>
      ))}
    </div>
  )
}
