'use client'
// Page /pricing — 4 tiers (Free, Pro, Elite, Business) + formulaire waitlist + FAQ.
// Free est déjà dispo (CTA → /auth?mode=signup) ; Pro/Elite/Business sont en waitlist.
// Le formulaire POST sur /api/waitlist qui insère dans Supabase + envoie un email Resend.

import { useState } from 'react'
import Link from 'next/link'
import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'
import { useT } from '../../components/LanguageProvider'

const C = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  border: 'var(--border)',
  border2: 'var(--border2)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
  green: 'var(--green)',
  amber: 'var(--amber)',
}

export default function PricingClient() {
  const t = useT()
  const [waitlistPlan, setWaitlistPlan] = useState('pro')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)

  // Récupération des listes de features depuis i18n (objet retourné par translate).
  const freeFeatures = t('pages.pricing.planFree.features')
  const proFeatures = t('pages.pricing.planPro.features')
  const eliteFeatures = t('pages.pricing.planElite.features')
  const businessFeatures = t('pages.pricing.planBusiness.features')

  const faqItems = t('pages.pricing.faq.items')

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
        setSubmitResult({ type: 'error', msg: data?.error || t('pages.pricing.waitlist.errorGeneric') })
      } else if (data.alreadyRegistered) {
        setSubmitResult({ type: 'ok', msg: t('pages.pricing.waitlist.already') })
      } else {
        setSubmitResult({ type: 'ok', msg: t('pages.pricing.waitlist.success') })
        setEmail('')
      }
    } catch (err) {
      setSubmitResult({ type: 'error', msg: t('pages.pricing.waitlist.errorNetwork') })
    } finally {
      setSubmitting(false)
    }
  }

  function selectPlanFromCard(plan) {
    setWaitlistPlan(plan)
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
              {t('pages.pricing.eyebrow')}
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0, marginBottom: 18 }}>
              <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('pages.pricing.titleA')}</span>,<br />
              <span style={{ color: C.text }}>{t('pages.pricing.titleB')}</span>
            </h1>
            <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.6, maxWidth: 600, margin: '0 auto' }}>
              {t('pages.pricing.subtitle')} <strong style={{ color: C.text }}>{t('pages.pricing.subtitleHighlight')}</strong> {t('pages.pricing.subtitleSuffix')}
            </p>
          </Reveal>
        </section>

        {/* COMPETITOR ANCHOR */}
        <section style={{ padding: '0 24px 24px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '8px 18px', borderRadius: 20,
              background: 'rgba(45,111,255,0.06)', border: `1px solid rgba(45,111,255,0.18)`,
              fontSize: 12, color: C.text2, fontWeight: 500,
            }}>
              <span style={{ fontSize: 14 }}>💰</span>
              <span>{t('pages.pricing.competitorAnchor')}</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <span style={{
                display: 'inline-block', padding: '6px 16px', borderRadius: 20,
                fontSize: 12, fontWeight: 600, color: C.green,
                background: 'rgba(29,184,122,0.08)', border: `1px solid rgba(29,184,122,0.25)`,
              }}>
                {t('pages.pricing.guaranteeBadge')}
              </span>
            </div>
          </Reveal>
        </section>

        {/* PRICING CARDS */}
        <section style={{ padding: '0 24px 60px', maxWidth: 1280, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 16,
              alignItems: 'stretch',
            }}>
              {/* FREE */}
              <PricingCard
                badge={t('pages.pricing.planFree.badge')}
                badgeColor={C.green}
                title={t('pages.pricing.planFree.name')}
                price={t('pages.pricing.planFree.price')}
                priceSub={t('pages.pricing.planFree.priceSub')}
                description={t('pages.pricing.planFree.description')}
                features={freeFeatures}
                cta={
                  <Link href="/auth?mode=signup" style={ctaPrimaryStyle()}>
                    {t('pages.pricing.planFree.cta')}
                  </Link>
                }
              />

              {/* PRO */}
              <PricingCard
                badge={t('pages.pricing.planPro.badge')}
                badgeColor={C.blueLight}
                highlighted="blue"
                title={t('pages.pricing.planPro.name')}
                price={t('pages.pricing.planPro.price')}
                priceSub={t('pages.pricing.planPro.priceSub')}
                description={t('pages.pricing.planPro.description')}
                features={proFeatures}
                cta={
                  <button onClick={() => selectPlanFromCard('pro')} style={ctaPrimaryStyle()}>
                    {t('pages.pricing.planPro.cta')}
                  </button>
                }
              />

              {/* ELITE */}
              <PricingCard
                badge={t('pages.pricing.planElite.badge')}
                badgeColor="var(--violet)"
                title={t('pages.pricing.planElite.name')}
                price={t('pages.pricing.planElite.price')}
                priceSub={t('pages.pricing.planElite.priceSub')}
                description={t('pages.pricing.planElite.description')}
                features={eliteFeatures}
                cta={
                  <button onClick={() => selectPlanFromCard('elite')} style={ctaPrimaryStyle()}>
                    {t('pages.pricing.planElite.cta')}
                  </button>
                }
              />

              {/* BUSINESS */}
              <PricingCard
                badge={t('pages.pricing.planBusiness.badge')}
                badgeColor="var(--cyan)"
                title={t('pages.pricing.planBusiness.name')}
                price={t('pages.pricing.planBusiness.price')}
                priceSub={t('pages.pricing.planBusiness.priceSub')}
                description={t('pages.pricing.planBusiness.description')}
                features={businessFeatures}
                cta={
                  <button onClick={() => selectPlanFromCard('business')} style={ctaPrimaryStyle()}>
                    {t('pages.pricing.planBusiness.cta')}
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
                {t('pages.pricing.waitlist.title')}
              </h2>
              <p style={{ fontSize: 13, color: C.text2, margin: 0, marginBottom: 22, lineHeight: 1.6, textAlign: 'center' }}>
                {t('pages.pricing.waitlist.subtitle')}
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                  <PlanRadio
                    value="pro"
                    label={t('pages.pricing.waitlist.radioProLabel')}
                    sub={t('pages.pricing.waitlist.radioProSub')}
                    checked={waitlistPlan === 'pro'}
                    onChange={() => setWaitlistPlan('pro')}
                    color={C.blueLight}
                  />
                  <PlanRadio
                    value="elite"
                    label="Elite"
                    sub="39€/mois — early access"
                    checked={waitlistPlan === 'elite'}
                    onChange={() => setWaitlistPlan('elite')}
                    color="var(--violet)"
                  />
                  <PlanRadio
                    value="business"
                    label="Business"
                    sub="129€/mo — 10 seats"
                    checked={waitlistPlan === 'business'}
                    onChange={() => setWaitlistPlan('business')}
                    color="var(--cyan)"
                  />
                </div>

                <input
                  type="email"
                  required
                  placeholder={t('pages.pricing.waitlist.emailPlaceholder')}
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
                  {submitting ? t('pages.pricing.waitlist.submitting') : t('pages.pricing.waitlist.submit')}
                </button>

                {submitResult && (
                  <div style={{
                    marginTop: 14,
                    padding: '10px 14px',
                    fontSize: 13,
                    borderRadius: 8,
                    textAlign: 'center',
                    background: submitResult.type === 'ok' ? 'rgba(29,184,122,0.12)' : 'rgba(232,80,74,0.12)',
                    color: submitResult.type === 'ok' ? C.green : 'var(--red)',
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
                {t('pages.pricing.faq.eyebrow')}
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0, marginBottom: 32, letterSpacing: '-0.02em', textAlign: 'center' }}>
                {t('pages.pricing.faq.heading')}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.isArray(faqItems) && faqItems.map((item, i) => (
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
        {(features || []).map((f, i) => (
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
    color: isLifetime ? 'var(--text-inverse)' : '#fff',
    border: 'none',
    borderRadius: 10,
    textDecoration: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: isLifetime ? '0 4px 12px rgba(250,199,117,0.3)' : '0 4px 12px rgba(45,111,255,0.3)',
    boxSizing: 'border-box',
  }
}
