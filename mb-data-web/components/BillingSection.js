'use client'

// components/BillingSection.js — bloc "Mon abonnement" de /app/settings.
//
// Affiche le palier courant, la prochaine échéance, les boutons d'upgrade
// (→ Checkout Stripe) et l'historique des factures (→ PDF Stripe).
//
// Le plan affiché vient de /api/stripe/subscription, qui le lit dans `profiles`
// (écrit par le webhook). Rien ici ne fait autorité : c'est de l'affichage.

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { C, cardStyle } from '../lib/theme'

const PLAN_LABEL = {
  free: 'Free',
  beta: 'Beta — fondateur',
  pro: 'Pro',
  elite: 'Elite',
  business: 'Business',
}

// Libellés FR des statuts Stripe bruts renvoyés par le webhook.
const STATUS_LABEL = {
  active: 'Actif',
  trialing: 'Période d’essai',
  past_due: 'Paiement en retard',
  canceled: 'Résilié',
  unpaid: 'Impayé',
  incomplete: 'Paiement incomplet',
  incomplete_expired: 'Paiement expiré',
  paused: 'En pause',
}

function fmtAmount(cents, currency) {
  if (cents == null) return '—'
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: (currency || 'eur').toUpperCase() })
      .format(cents / 100)
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency || ''}`
  }
}

function fmtDate(value) {
  if (!value) return '—'
  const d = typeof value === 'number' ? new Date(value * 1000) : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Session expirée')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }
}

export default function BillingSection({ onError }) {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null) // 'portal' | 'pro' | 'elite' | …
  const [interval, setInterval] = useState('month')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/subscription', { headers: await authHeaders() })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setState(json)
    } catch (err) {
      onError?.(err.message)
    } finally {
      setLoading(false)
    }
  }, [onError])

  useEffect(() => { load() }, [load])

  async function startCheckout(plan) {
    setBusy(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ plan, interval }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      window.location.href = json.url
    } catch (err) {
      onError?.(err.message)
      setBusy(null)
    }
  }

  async function openPortal() {
    setBusy('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST', headers: await authHeaders() })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      window.location.href = json.url
    } catch (err) {
      onError?.(err.message)
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div style={{ ...cardStyle, padding: 20, marginBottom: 20, fontSize: 12, color: C.text3 }}>
        Chargement de l’abonnement…
      </div>
    )
  }
  if (!state) return null

  const plan = state.plan || 'free'
  const isPaid = ['pro', 'elite', 'business'].includes(plan)
  const accent = plan === 'beta' ? C.amber : isPaid ? C.blueLight : C.text3

  return (
    <div style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>

      {/* ── Palier courant ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
            Plan actuel
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: accent, letterSpacing: '-0.02em' }}>
            {PLAN_LABEL[plan] || plan}
          </div>
        </div>
        {state.planStatus && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 999,
            color: state.planStatus === 'past_due' ? C.amber : C.text2,
            background: state.planStatus === 'past_due' ? 'var(--amber-bg)' : 'var(--tint2)',
            border: `1px solid ${state.planStatus === 'past_due' ? 'var(--amber)' : C.border}`,
          }}>
            {STATUS_LABEL[state.planStatus] || state.planStatus}
          </span>
        )}
      </div>

      {state.betaGrandfather && (
        <div style={{ marginTop: 12, fontSize: 12, color: C.amber, lineHeight: 1.5 }}>
          🏅 Tu fais partie des bêta-testeurs : ton accès illimité est conservé à vie.
        </div>
      )}

      {state.expiresAt && (
        <div style={{ marginTop: 10, fontSize: 12, color: C.text3 }}>
          {state.cancelAtPeriodEnd
            ? `Se termine le ${fmtDate(state.expiresAt)} — pas de reconduction.`
            : `Prochaine échéance : ${fmtDate(state.expiresAt)}`}
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {state.hasCustomer && (
          <button
            onClick={openPortal}
            disabled={busy === 'portal'}
            style={btn(false, busy === 'portal')}
          >
            {busy === 'portal' ? '…' : 'Gérer mon abonnement'}
          </button>
        )}

        {!isPaid && (
          <>
            <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--tint2)', borderRadius: 8, border: `1px solid ${C.border}` }}>
              {[['month', 'Mensuel'], ['year', 'Annuel −35%']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setInterval(val)}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6,
                    border: 'none', cursor: 'pointer',
                    background: interval === val ? C.blue : 'transparent',
                    color: interval === val ? '#fff' : C.text3,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => startCheckout('pro')} disabled={busy === 'pro'} style={btn(true, busy === 'pro')}>
              {busy === 'pro' ? '…' : 'Passer à Pro'}
            </button>
            <button onClick={() => startCheckout('elite')} disabled={busy === 'elite'} style={btn(false, busy === 'elite')}>
              {busy === 'elite' ? '…' : 'Passer à Elite'}
            </button>
          </>
        )}
      </div>

      {/* ── Factures ── */}
      {state.invoices?.length > 0 && (
        <>
          <div style={{ height: 1, background: C.border, margin: '20px 0 16px' }} />
          <div style={{ fontSize: 11, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Factures
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {state.invoices.map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 12, padding: '9px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12,
                }}
              >
                <span style={{ color: C.text3, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11 }}>
                  {inv.number || inv.id}
                </span>
                <span style={{ color: C.text3, flex: 1, textAlign: 'center' }}>{fmtDate(inv.created)}</span>
                <span style={{ color: C.text, fontWeight: 600 }}>{fmtAmount(inv.total, inv.currency)}</span>
                {inv.pdfUrl && (
                  <a
                    href={inv.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: C.blueLight, textDecoration: 'none', fontSize: 11, fontWeight: 600, minWidth: 32, minHeight: 32, display: 'inline-flex', alignItems: 'center' }}
                  >
                    PDF ↓
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function btn(primary, disabled) {
  return {
    fontSize: 12, fontWeight: 600, padding: '9px 16px', borderRadius: 8,
    minHeight: 32, cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    background: primary ? C.blue : 'var(--blue-bg)',
    color: primary ? '#fff' : C.blueLight,
    border: primary ? 'none' : '1px solid var(--blue-border)',
    transition: 'all 0.15s',
  }
}
