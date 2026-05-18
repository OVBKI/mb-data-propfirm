'use client'
// Page /pricing — 3 cards (Free, Pro, Lifetime) + formulaire waitlist + FAQ.
// Free est déjà dispo (CTA → /auth?mode=signup) ; Pro et Lifetime sont en waitlist.
// Le formulaire POST sur /api/waitlist qui insère dans Supabase + envoie un email Resend.

import { useState } from 'react'
import Link from 'next/link'
import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
}

// Le compteur de places restantes pour Lifetime est statique pour l'instant.
// À terme on pourra l'alimenter depuis Supabase (count plan='lifetime').
const LIFETIME_TOTAL = 100
const LIFETIME_TAKEN = 0 // l'user peut bump ce nombre quand des places partent

const FAQ = [
  {
    q: 'Pourquoi Quantara est gratuit aujourd\'hui ?',
    a: 'On est en beta publique. L\'objectif : valider le produit avec de vrais traders PropFirm avant de monétiser. Aucun risque de te retrouver bloqué·e demain — tu garderas un accès gratuit à toutes les fonctions actuelles à vie, même quand le Pro sortira.',
  },
  {
    q: 'Quand le plan Pro sort ?',
    a: 'Q3 2026 (juillet-septembre). Il ajoutera la sync API broker auto (Rithmic puis ProjectX), des alertes push avancées, l\'analytics multi-comptes consolidée, l\'export PDF mensuel et le support prioritaire.',
  },
  {
    q: 'Que devient mon historique si je passe Pro ?',
    a: 'Tout est conservé. Le passage Free → Pro débloque juste de nouvelles fonctions sans toucher à tes données. Et si tu rétrogrades, tu gardes l\'accès à tout ce que tu as déjà loggé.',
  },
  {
    q: 'Je peux annuler quand je veux ?',
    a: 'Oui, abonnement mensuel résiliable en un clic depuis ton dashboard. Le Lifetime (one-time) n\'a évidemment rien à annuler — c\'est à vie. Pas de carte bancaire requise pour s\'inscrire à la waitlist.',
  },
]

export default function PricingPage() {
  const [waitlistPlan, setWaitlistPlan] = useState('pro')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null) // {type: 'ok'|'error', msg: string}

  const lifetimeRemaining = Math.max(0, LIFETIME_TOTAL - LIFETIME_TAKEN)

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return
    setSubmitResult(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), plan: waitlistPlan }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitResult({ type: 'error', msg: data?.error || 'Erreur — réessaie dans un instant.' })
      } else if (data.alreadyRegistered) {
        setSubmitResult({ type: 'ok', msg: 'Tu es déjà inscrit·e ✓ On te tient au courant.' })
      } else {
        setSubmitResult({ type: 'ok', msg: 'Inscrit·e ✓ Check tes mails pour la confirmation.' })
        setEmail('')
      }
    } catch (err) {
      setSubmitResult({ type: 'error', msg: 'Erreur réseau — réessaie.' })
    } finally {
      setSubmitting(false)
    }
  }

  function selectPlanFromCard(plan) {
    setWaitlistPlan(plan)
    // Scroll vers le formulaire
    if (typeof window !== 'undefined') {
      const el = document.getElementById('waitlist-form')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader active="pricing" />

      <main style={{ flex: 1 }}>
        {/* HERO */}
        <section style={{ padding: '80px 24px 50px', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>
              Tarifs
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0, marginBottom: 18 }}>
              <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Gratuit aujourd'hui</span>,<br />
              <span style={{ color: C.text }}>50% off à vie demain</span>
            </h1>
            <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
              Quantara reste gratuit pendant la beta. Inscris-toi à la waitlist pour avoir <strong style={{ color: C.text }}>50% off à vie</strong> sur le plan Pro quand il sortira.
            </p>
          </Reveal>
        </section>

        {/* PRICING CARDS */}
        <section style={{ padding: '0 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 18,
              alignItems: 'stretch',
            }}>
              {/* FREE */}
              <PricingCard
                badge="Disponible maintenant"
                badgeColor={C.green}
                title="Free"
                price="0€"
                priceSub="à vie pendant la beta"
                description="Tout ce qu'il faut pour traquer ton activité PropFirm et survivre tes premiers payouts."
                features={[
                  'Tracking illimité comptes & trades',
                  'Import CSV manuel (Rithmic)',
                  'Calendrier trading + journal',
                  'Comparateur PropFirms complet',
                  'Support communauté Discord',
                ]}
                cta={
                  <Link href="/auth?mode=signup" style={ctaPrimaryStyle()}>
                    Disponible maintenant →
                  </Link>
                }
              />

              {/* PRO (recommandée — gradient bleu) */}
              <PricingCard
                badge="Recommandé · Q3 2026"
                badgeColor={C.blueLight}
                highlighted="blue"
                title="Pro"
                price="9€"
                priceSub="/mois · ou 89€/an (-20%)"
                description="Pour les traders sérieux qui veulent la sync auto et l'analytics multi-comptes."
                features={[
                  'Tout le plan Free, plus :',
                  'Sync API Rithmic automatique',
                  'Alertes push avancées (drawdown, payout, breach)',
                  'Analytics multi-comptes consolidée',
                  'Export PDF mensuel auto',
                  'Support prioritaire (réponse < 24h)',
                ]}
                cta={
                  <button onClick={() => selectPlanFromCard('pro')} style={ctaPrimaryStyle()}>
                    Rejoindre la waitlist
                  </button>
                }
              />

              {/* LIFETIME (early bird) */}
              <PricingCard
                badge={`Early bird · ${lifetimeRemaining}/${LIFETIME_TOTAL} places`}
                badgeColor={C.amber}
                highlighted="lifetime"
                title="Lifetime"
                price="99€"
                priceSub="one-time · à vie"
                description="Pour les 100 premiers users. Toutes les fonctions Pro pour toujours, jamais d'abo."
                features={[
                  'Tout le plan Pro, à vie',
                  'Accès aux futures features sans surcoût',
                  'Badge "Founding member" sur Discord',
                  'Influence directe sur la roadmap',
                  `Limité à ${LIFETIME_TOTAL} places — first come, first served`,
                ]}
                cta={
                  <button onClick={() => selectPlanFromCard('lifetime')} style={ctaPrimaryStyle('lifetime')}>
                    Rejoindre la waitlist VIP
                  </button>
                }
              />
            </div>
          </Reveal>
        </section>

        {/* WAITLIST FORM */}
        <section id="waitlist-form" style={{ padding: '20px 24px 60px', maxWidth: 600, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              padding: 28,
              background: C.surface,
              border: `1px solid ${C.border2}`,
              borderRadius: 14,
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 8, letterSpacing: '-0.015em', textAlign: 'center' }}>
                Rejoins la waitlist
              </h2>
              <p style={{ fontSize: 13, color: C.text2, margin: 0, marginBottom: 22, lineHeight: 1.6, textAlign: 'center' }}>
                Aucune carte bancaire. On t'envoie un mail quand le plan est dispo, c'est tout.
              </p>

              <form onSubmit={handleSubmit}>
                {/* Plan radio */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <PlanRadio
                    value="pro"
                    label="Pro"
                    sub="9€/mois — 50% off à vie"
                    checked={waitlistPlan === 'pro'}
                    onChange={() => setWaitlistPlan('pro')}
                    color={C.blueLight}
                  />
                  <PlanRadio
                    value="lifetime"
                    label="Lifetime"
                    sub="99€ une fois — early bird"
                    checked={waitlistPlan === 'lifetime'}
                    onChange={() => setWaitlistPlan('lifetime')}
                    color={C.amber}
                  />
                </div>

                <input
                  type="email"
                  required
                  placeholder="ton@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 14,
                    background: C.surface2,
                    border: `1px solid ${C.border2}`,
                    borderRadius: 10,
                    color: C.text,
                    fontFamily: 'inherit',
                    outline: 'none',
                    marginBottom: 12,
                    boxSizing: 'border-box',
                  }}
                />

                <button
                  type="submit"
                  disabled={submitting || !email}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 14, fontWeight: 600,
                    background: submitting ? C.text3 : C.blue,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 4px 12px rgba(45,111,255,0.3)',
                    transition: 'opacity 0.15s',
                    opacity: (!email || submitting) ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Inscription…' : 'M\'inscrire'}
                </button>

                {submitResult && (
                  <div style={{
                    marginTop: 14,
                    padding: '10px 14px',
                    fontSize: 13,
                    borderRadius: 8,
                    textAlign: 'center',
                    background: submitResult.type === 'ok' ? 'rgba(29,184,122,0.12)' : 'rgba(232,80,74,0.12)',
                    color: submitResult.type === 'ok' ? C.green : '#e8504a',
                    border: `1px solid ${submitResult.type === 'ok' ? 'rgba(29,184,122,0.3)' : 'rgba(232,80,74,0.3)'}`,
                  }}>
                    {submitResult.msg}
                  </div>
                )}
              </form>
            </div>
          </Reveal>
        </section>

        {/* FAQ */}
        <section style={{ padding: '20px 24px 80px', maxWidth: 760, margin: '0 auto', borderTop: `1px solid ${C.border}` }}>
          <Reveal>
            <div style={{ paddingTop: 48 }}>
              <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>
                FAQ Pricing
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 32, letterSpacing: '-0.02em', textAlign: 'center' }}>
                Tes questions, nos réponses
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {FAQ.map((item, i) => (
                  <details key={i} style={{
                    padding: '18px 20px',
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                  }}>
                    <summary style={{
                      fontSize: 14, fontWeight: 600, color: C.text,
                      listStyle: 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: 14,
                    }}>
                      <span>{item.q}</span>
                      <span style={{ color: C.text3, fontSize: 18, lineHeight: 1 }}>+</span>
                    </summary>
                    <p style={{
                      fontSize: 13, color: C.text2, lineHeight: 1.65,
                      margin: '12px 0 0', paddingTop: 12,
                      borderTop: `1px solid ${C.border}`,
                    }}>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  )
}

// === Sous-composants ===

function PricingCard({ badge, badgeColor, highlighted, title, price, priceSub, description, features, cta }) {
  const isBlue = highlighted === 'blue'
  const isLifetime = highlighted === 'lifetime'

  let borderColor = C.border
  let background = C.surface
  let boxShadow = '0 4px 12px rgba(0,0,0,0.18)'

  if (isBlue) {
    borderColor = 'rgba(45,111,255,0.4)'
    background = `linear-gradient(180deg, rgba(45,111,255,0.08), ${C.surface} 60%)`
    boxShadow = '0 12px 32px rgba(0,0,0,0.32), 0 0 32px rgba(45,111,255,0.12)'
  } else if (isLifetime) {
    borderColor = 'rgba(250,199,117,0.35)'
    background = `linear-gradient(180deg, rgba(250,199,117,0.07), ${C.surface} 60%)`
    boxShadow = '0 12px 32px rgba(0,0,0,0.32), 0 0 32px rgba(250,199,117,0.10)'
  }

  return (
    <div style={{
      padding: 26,
      background,
      border: `1px solid ${borderColor}`,
      borderRadius: 16,
      boxShadow,
      display: 'flex', flexDirection: 'column', gap: 14,
      position: 'relative',
    }}>
      <div style={{
        display: 'inline-block', alignSelf: 'flex-start',
        padding: '4px 10px',
        fontSize: 10, fontWeight: 700,
        color: badgeColor,
        background: `${badgeColor}1a`,
        border: `1px solid ${badgeColor}55`,
        borderRadius: 6,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>{badge}</div>

      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em', marginBottom: 8 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{price}</div>
          <div style={{ fontSize: 12, color: C.text3 }}>{priceSub}</div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.55, margin: 0 }}>{description}</p>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
            <span style={{ color: isLifetime ? C.amber : C.green, flexShrink: 0, fontWeight: 700 }}>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 'auto', paddingTop: 6 }}>{cta}</div>
    </div>
  )
}

function PlanRadio({ value, label, sub, checked, onChange, color }) {
  return (
    <label style={{
      flex: 1,
      padding: 14,
      border: `1px solid ${checked ? color : C.border2}`,
      background: checked ? `${color}14` : C.surface2,
      borderRadius: 10,
      cursor: 'pointer',
      transition: 'all 0.15s',
      display: 'block',
    }}>
      <input
        type="radio"
        name="plan"
        value={value}
        checked={checked}
        onChange={onChange}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{
          width: 14, height: 14, borderRadius: '50%',
          border: `2px solid ${checked ? color : C.text3}`,
          background: checked ? color : 'transparent',
          flexShrink: 0,
          boxShadow: checked ? `inset 0 0 0 2px ${C.bg}` : 'none',
        }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{label}</span>
      </div>
      <div style={{ fontSize: 11, color: C.text3, paddingLeft: 22 }}>{sub}</div>
    </label>
  )
}

function ctaPrimaryStyle(variant) {
  const isLifetime = variant === 'lifetime'
  return {
    display: 'inline-block',
    width: '100%',
    padding: '12px 18px',
    fontSize: 13, fontWeight: 600,
    textAlign: 'center',
    background: isLifetime ? `linear-gradient(135deg, ${C.amber}, #f4a460)` : C.blue,
    color: isLifetime ? '#0a0c10' : '#fff',
    border: 'none',
    borderRadius: 10,
    textDecoration: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: isLifetime ? '0 4px 12px rgba(250,199,117,0.3)' : '0 4px 12px rgba(45,111,255,0.3)',
    boxSizing: 'border-box',
  }
}
