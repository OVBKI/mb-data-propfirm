'use client'
// OnboardingModal — Wizard d'accueil multi-étapes pour nouveaux users (refactor mai 2026)
//
// 4 étapes :
//   1. Welcome        — value props + intro
//   2. Profil trader  — style (scalper/day/swing) + propfirms ciblées (optionnel, pas sauvé en DB)
//   3. Choisis ta voie — 3 options : firm réelle / démo / tutoriel
//   4. Done (démo)    — confirmation + next actions (uniquement après démo)
//
// Affiché quand : firms.length === 0 ET pas dismissed via localStorage.
// Les réponses du step 2 ne sont PAS persistées (per user request) — juste UX.
//
// i18n v3.1 (mai 2026) : tous les strings migrés vers app.onboarding.* — FR + EN supportés.

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getFirmLogo } from '../lib/firmLogos'
import { useT } from './LanguageProvider'
import { useDialog } from './useDialog'
import {
  defaultPayoutTarget, defaultMinTradingDays, defaultChallengePrice,
  defaultMinDailyProfit, defaultDdType,
} from '../lib/constants'

const C = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  surface3: '#222637',
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
  purple: '#a78bfa',
}

// Liste des firmes pour la sélection step 2 (alimente le grid clickable)
const FIRM_SUGGESTIONS = [
  { name: 'Topstep',                color: '#ff8c42' },
  { name: 'Apex Trader Funding',    color: '#a78bfa' },
  { name: 'Lucid Trading',          color: 'var(--blue-light)' },
  { name: 'Take Profit Trader',     color: 'var(--amber)' },
  { name: 'My Funded Futures',      color: '#fb923c' },
  { name: 'Bulenox',                color: 'var(--red)' },
  { name: 'Tradeify',               color: 'var(--green)' },
  { name: 'Phidias Propfirm',       color: '#1e2a4a' },
  { name: 'Funded Futures Network', color: '#a86bff' },
  { name: 'FuturesELites',          color: '#f472b6' },
  { name: 'Alpha Futures',          color: '#0a3a2a' },
]

// Génère 30 trades fictifs réalistes pour le compte démo
function generateDemoTrades() {
  const trades = []
  const today = new Date()
  const instruments = ['NQ', 'ES', 'MNQ', 'MES', 'GC', 'CL']
  const sides = ['Long', 'Short']
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - Math.floor(Math.random() * 30))
    const isWin = Math.random() < 0.62
    const pnl = isWin
      ? Math.floor(Math.random() * 280) + 30
      : -Math.floor(Math.random() * 180) - 20
    const hour = Math.random() < 0.7
      ? 15 + Math.floor(Math.random() * 7)
      : 8 + Math.floor(Math.random() * 6)
    const minute = Math.floor(Math.random() * 60)
    const dateStr = date.toISOString().slice(0, 10)
    const timeStr = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00`
    trades.push({
      date: dateStr,
      traded_at: `${dateStr}T${timeStr}`,
      pnl,
      instrument: instruments[Math.floor(Math.random() * instruments.length)],
      side: sides[Math.floor(Math.random() * sides.length)],
      notes: '',
    })
  }
  return trades.sort((a, b) => a.date.localeCompare(b.date))
}

export default function OnboardingModal({ user, onComplete, onAddFirm, onStartTutorial, showToast }) {
  const t = useT()
  const dialogRef = useDialog({ open: true, onClose: onComplete })
  // Step du wizard : 'welcome' | 'profile' | 'choose' | 'demo-loading' | 'done'
  const [step, setStep] = useState('welcome')
  const [creating, setCreating] = useState(false)
  // Réponses step 2 (NON sauvées en DB, juste UX)
  const [tradingStyle, setTradingStyle] = useState(null)
  const [selectedFirms, setSelectedFirms] = useState([])

  // Trading styles — construits avec t() pour i18n, identifiants emoji + key
  const TRADING_STYLES = [
    { k: 'scalper',  label: t('app.onboarding.styleScalper'),  emoji: '⚡', desc: t('app.onboarding.styleScalperDesc') },
    { k: 'day',      label: t('app.onboarding.styleDay'),      emoji: '📊', desc: t('app.onboarding.styleDayDesc') },
    { k: 'swing',    label: t('app.onboarding.styleSwing'),    emoji: '🌊', desc: t('app.onboarding.styleSwingDesc') },
    { k: 'mixed',    label: t('app.onboarding.styleMixed'),    emoji: '🎯', desc: t('app.onboarding.styleMixedDesc') },
  ]

  function handleSkip() {
    localStorage.setItem('quantara_onboarding_dismissed', '1')
    onComplete()
  }

  function handleAddFirm() {
    localStorage.setItem('quantara_onboarding_dismissed', '1')
    onComplete()
    onAddFirm()
  }

  function handleTutorial() {
    localStorage.setItem('quantara_onboarding_dismissed', '1')
    onStartTutorial?.()
  }

  function toggleFirm(name) {
    setSelectedFirms(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    )
  }

  async function handleDemo() {
    setCreating(true)
    setStep('demo-loading')
    try {
      const { data: firm, error: firmErr } = await supabase
        .from('firms')
        // Démo 100% futures (Topstep) — market explicite pour rester hors du scope CFD.
        .insert({ name: t('app.onboarding.demoFirmName'), color: '#ff8c42', user_id: user.id, market: 'futures' })
        .select()
        .single()
      if (firmErr) throw firmErr

      const tg = defaultPayoutTarget('Topstep', '50k')
      const md = defaultMinTradingDays('Topstep', '50k')
      const pr = defaultChallengePrice('Topstep', '50k')
      const mdp = defaultMinDailyProfit('Topstep', '50k')
      const buyDate = new Date()
      buyDate.setDate(buyDate.getDate() - 30)

      const { data: account, error: acctErr } = await supabase
        .from('accounts')
        .insert({
          firm_id: firm.id,
          user_id: user.id,
          market: 'futures',
          buy_date: buyDate.toISOString().slice(0, 10),
          currency: 'USD',
          spent: pr || 49,
          status: 'Challenge',
          plan_size: '50k',
          name: t('app.onboarding.demoAccountName'),
          dd_type: defaultDdType('Topstep'),
          payout_target: tg,
          min_trading_days: md,
          min_daily_profit: mdp,
          notes: t('app.onboarding.demoNotes'),
        })
        .select()
        .single()
      if (acctErr) throw acctErr

      const trades = generateDemoTrades().map(tr => ({
        ...tr,
        user_id: user.id,
        account_id: account.id,
      }))
      const { error: tradesErr } = await supabase.from('journal_entries').insert(trades)
      if (tradesErr) throw tradesErr

      localStorage.setItem('quantara_onboarding_dismissed', '1')
      setStep('done')
      setCreating(false)
    } catch (err) {
      console.error('[OnboardingModal demo]', err)
      alert(t('app.onboarding.demoError') + (err.message || t('app.onboarding.demoErrorUnknown')))
      setCreating(false)
      setStep('choose')
    }
  }

  function handleDoneAction(action) {
    if (action === 'tutorial') {
      onStartTutorial?.()
      // On reload après le démarrage du tuto pour avoir les nouvelles data en mémoire
      setTimeout(() => window.location.reload(), 400)
      return
    }
    onComplete()
    setTimeout(() => window.location.reload(), 400)
  }

  // Progress indicator (3 dots pour les 3 steps wizard, sauf demo-loading et done)
  const showProgress = ['welcome', 'profile', 'choose'].includes(step)
  const currentStepNum = step === 'welcome' ? 1 : step === 'profile' ? 2 : 3

  // Helper pour la singularisation EN/FR (1 sélectionnée vs 2 sélectionnées)
  const firmsSelectedLabel = selectedFirms.length > 1
    ? t('app.onboarding.firmsSelectedPlural')
    : t('app.onboarding.firmsSelected')

  // Helper pour le subtitle step 3 avec interpolation {n} + {s}
  const chooseSubtitle = selectedFirms.length > 0
    ? t('app.onboarding.chooseSubtitleWithFirms')
        .replace('{n}', selectedFirms.length)
        .replace('{s}', selectedFirms.length > 1 ? 's' : '')
    : t('app.onboarding.chooseSubtitleNoFirms')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} aria-label={t('app.onboarding.welcomeTitle')} style={{
        width: '100%', maxWidth: 720,
        background: C.surface, borderRadius: 16,
        border: `1px solid ${C.border2}`,
        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Halo gradient en background */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.5,
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(45,111,255,0.18), transparent 60%)`,
          pointerEvents: 'none',
        }} />

        {/* Progress dots (étapes 1-3) */}
        {showProgress && (
          <div style={{
            position: 'relative', display: 'flex', justifyContent: 'center',
            gap: 8, padding: '20px 0 0', marginBottom: -10,
          }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                width: n === currentStepNum ? 28 : 8,
                height: 8, borderRadius: 99,
                background: n <= currentStepNum ? C.blueLight : 'var(--hairline)',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        )}

        {/* === STEP 1 : WELCOME === */}
        {step === 'welcome' && (
          <div style={{ position: 'relative', padding: '40px 40px 32px' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>👋</div>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.015em' }}>
                {t('app.onboarding.welcomeTitle')}
              </h1>
              {/* welcomeSubtitle contient <strong> — dangerouslySetInnerHTML safe car content sous notre contrôle (i18n.js) */}
              <p
                style={{ fontSize: 14, color: C.text2, maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: t('app.onboarding.welcomeSubtitle') }}
              />
            </div>

            {/* 3 value props */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
              {[
                { icon: '🎯', title: t('app.onboarding.vpTrackTitle'),   desc: t('app.onboarding.vpTrackDesc') },
                { icon: '📊', title: t('app.onboarding.vpAnalyzeTitle'), desc: t('app.onboarding.vpAnalyzeDesc') },
                { icon: '🌱', title: t('app.onboarding.vpGrowTitle'),    desc: t('app.onboarding.vpGrowDesc') },
              ].map((vp, i) => (
                <div key={i} style={{
                  padding: '16px 14px',
                  background: 'var(--tint1)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{vp.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4, letterSpacing: '0.02em' }}>{vp.title}</div>
                  <div style={{ fontSize: 10.5, color: C.text3, lineHeight: 1.4 }}>{vp.desc}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
              <button
                onClick={() => setStep('profile')}
                style={{
                  padding: '12px 32px', fontSize: 14, fontWeight: 600,
                  background: C.text, color: 'var(--text-inverse)',
                  border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 8px 20px rgba(0,0,0,0.3)',
                  transition: 'transform 0.15s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {t('app.onboarding.btnContinue')} <span style={{ fontFamily: 'monospace' }}>→</span>
              </button>
              <button
                onClick={handleSkip}
                style={{
                  background: 'none', border: 'none', color: C.text3,
                  fontSize: 11, cursor: 'pointer', textDecoration: 'underline',
                  fontFamily: 'inherit', marginTop: 4,
                }}
              >{t('app.onboarding.skipLater')}</button>
            </div>
          </div>
        )}

        {/* === STEP 2 : PROFIL TRADER === */}
        {step === 'profile' && (
          <div style={{ position: 'relative', padding: '32px 40px 28px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.01em' }}>
                {t('app.onboarding.profileTitle')}
              </h2>
              <p style={{ fontSize: 13, color: C.text2 }}>
                {t('app.onboarding.profileSubtitle')}
              </p>
            </div>

            {/* Trading style */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                {t('app.onboarding.styleHeader')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {TRADING_STYLES.map(s => (
                  <button
                    key={s.k}
                    onClick={() => setTradingStyle(tradingStyle === s.k ? null : s.k)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 8,
                      background: tradingStyle === s.k ? 'rgba(45,111,255,0.12)' : 'var(--tint1)',
                      border: `1px solid ${tradingStyle === s.k ? C.blueLight : C.border}`,
                      color: C.text, cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 20 }} role="img" aria-label={s.label}>{s.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
                      <div style={{ fontSize: 10.5, color: C.text3, marginTop: 2 }}>{s.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* PropFirms used */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                {t('app.onboarding.firmsHeader')}
                {selectedFirms.length > 0 && (
                  <span style={{ color: C.blueLight, marginLeft: 6 }}>
                    · {selectedFirms.length} {firmsSelectedLabel}
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {FIRM_SUGGESTIONS.map(f => {
                  const isSelected = selectedFirms.includes(f.name)
                  return (
                    <button
                      key={f.name}
                      onClick={() => toggleFirm(f.name)}
                      title={f.name}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 6, padding: '12px 6px', borderRadius: 8,
                        background: isSelected ? 'rgba(45,111,255,0.1)' : 'var(--tint1)',
                        border: `1px solid ${isSelected ? C.blueLight : C.border}`,
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s', position: 'relative',
                      }}
                    >
                      {getFirmLogo(f.name, f.color, 28)}
                      <div style={{
                        fontSize: 9, color: isSelected ? C.blueLight : C.text3,
                        fontWeight: isSelected ? 700 : 500,
                        textAlign: 'center', lineHeight: 1.1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        width: '100%',
                      }}>{f.name.split(' ')[0]}</div>
                      {isSelected && (
                        <div style={{
                          position: 'absolute', top: 4, right: 4,
                          width: 14, height: 14, borderRadius: 99,
                          background: C.blueLight, color: '#fff',
                          fontSize: 9, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>✓</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Nav buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setStep('welcome')}
                style={{
                  background: 'none', border: 'none', color: C.text3,
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <span style={{ fontFamily: 'monospace' }}>←</span> {t('app.onboarding.back')}
              </button>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => setStep('choose')}
                  style={{
                    background: 'none', border: 'none', color: C.text3,
                    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                    textDecoration: 'underline',
                  }}
                >{t('app.onboarding.skip')}</button>
                <button
                  onClick={() => setStep('choose')}
                  style={{
                    padding: '10px 24px', fontSize: 13, fontWeight: 600,
                    background: C.text, color: 'var(--text-inverse)',
                    border: 'none', borderRadius: 7,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {t('app.onboarding.btnContinue')} <span style={{ fontFamily: 'monospace' }}>→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === STEP 3 : CHOISIS TA VOIE === */}
        {step === 'choose' && (
          <div style={{ position: 'relative', padding: '32px 40px 28px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.01em' }}>
                {t('app.onboarding.chooseTitle')}
              </h2>
              <p style={{ fontSize: 13, color: C.text2 }}>
                {chooseSubtitle}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {/* Option 1 : Ajouter ma vraie firme */}
              <button
                onClick={handleAddFirm}
                disabled={creating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px', borderRadius: 11,
                  background: C.text,
                  border: '1px solid transparent', color: 'var(--text-inverse)', cursor: creating ? 'wait' : 'pointer',
                  textAlign: 'left', fontFamily: 'inherit',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 8px 20px rgba(0,0,0,0.25)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => { if(!creating) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 9, flexShrink: 0,
                  background: 'rgba(45,111,255,0.15)',
                  border: '1px solid rgba(45,111,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: C.blue,
                }}>→</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{t('app.onboarding.optAddFirmTitle')}</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(10,12,16,0.7)' }}>
                    {t('app.onboarding.optAddFirmDesc')}
                  </div>
                </div>
                <span style={{ fontSize: 16, color: 'rgba(10,12,16,0.55)' }}>↗</span>
              </button>

              {/* Option 2 : Démo */}
              <button
                onClick={handleDemo}
                disabled={creating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px', borderRadius: 11,
                  background: C.surface2, border: `1px solid ${C.border2}`,
                  color: C.text, cursor: creating ? 'wait' : 'pointer',
                  textAlign: 'left', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if(!creating){ e.currentTarget.style.borderColor = C.green; e.currentTarget.style.background = C.surface3 } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.background = C.surface2 }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 9, flexShrink: 0,
                  background: 'rgba(29,184,122,0.12)', border: `1px solid ${C.green}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>🎮</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                    {t('app.onboarding.optDemoTitle')}
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(29,184,122,0.18)', color: C.green, marginLeft: 8, verticalAlign: 'middle' }}>{t('app.onboarding.optDemoBadge')}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: C.text2 }}>
                    {t('app.onboarding.optDemoDesc')}
                  </div>
                </div>
                <span style={{ fontSize: 16, color: C.text3 }}>→</span>
              </button>

              {/* Option 3 : Tutoriel */}
              <button
                onClick={handleTutorial}
                disabled={creating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px', borderRadius: 11,
                  background: C.surface2, border: `1px solid ${C.border2}`,
                  color: C.text, cursor: creating ? 'wait' : 'pointer',
                  textAlign: 'left', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if(!creating){ e.currentTarget.style.borderColor = C.blueLight; e.currentTarget.style.background = C.surface3 } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.background = C.surface2 }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 9, flexShrink: 0,
                  background: 'rgba(45,111,255,0.12)', border: `1px solid ${C.blueLight}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>🎓</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                    {t('app.onboarding.optTutorialTitle')}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.text2 }}>
                    {t('app.onboarding.optTutorialDesc')}
                  </div>
                </div>
                <span style={{ fontSize: 16, color: C.text3 }}>→</span>
              </button>
            </div>

            {/* Nav buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setStep('profile')}
                style={{
                  background: 'none', border: 'none', color: C.text3,
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <span style={{ fontFamily: 'monospace' }}>←</span> {t('app.onboarding.back')}
              </button>
              <button
                onClick={handleSkip}
                disabled={creating}
                style={{
                  background: 'none', border: 'none', color: C.text3,
                  fontSize: 11, cursor: 'pointer', textDecoration: 'underline',
                  fontFamily: 'inherit',
                }}
              >{t('app.onboarding.skipLater')}</button>
            </div>
          </div>
        )}

        {/* === DEMO LOADING === */}
        {step === 'demo-loading' && (
          <div style={{ position: 'relative', padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 18, animation: 'spin 2s linear infinite' }}>⚙️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{t('app.onboarding.demoLoadingTitle')}</h2>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 24 }}>
              {t('app.onboarding.demoLoadingSubtitle')}
            </p>
            <div style={{ fontSize: 11, color: C.text3 }}>{t('app.onboarding.demoLoadingFooter')}</div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* === STEP 4 : DONE (après démo) === */}
        {step === 'done' && (
          <div style={{ position: 'relative', padding: '40px 40px 32px' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.01em' }}>
                {t('app.onboarding.doneTitle')}
              </h2>
              {/* doneSubtitle contient <br /> — dangerouslySetInnerHTML safe car content sous notre contrôle */}
              <p
                style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}
                dangerouslySetInnerHTML={{ __html: t('app.onboarding.doneSubtitle') }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { k: 'dashboard', icon: '📊', title: t('app.onboarding.actDashboardTitle'), desc: t('app.onboarding.actDashboardDesc') },
                { k: 'heatmaps',  icon: '🔥', title: t('app.onboarding.actHeatmapsTitle'),  desc: t('app.onboarding.actHeatmapsDesc') },
                { k: 'tutorial',  icon: '🎓', title: t('app.onboarding.actTutorialTitle'),  desc: t('app.onboarding.actTutorialDesc') },
              ].map(action => (
                <button
                  key={action.k}
                  onClick={() => handleDoneAction(action.k)}
                  style={{
                    padding: '18px 14px', borderRadius: 11,
                    background: C.surface2, border: `1px solid ${C.border2}`,
                    color: C.text, cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'center', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.blueLight; e.currentTarget.style.background = C.surface3 }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.background = C.surface2 }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{action.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{action.title}</div>
                  <div style={{ fontSize: 10.5, color: C.text3, lineHeight: 1.4 }}>{action.desc}</div>
                </button>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => handleDoneAction('dashboard')}
                style={{
                  background: 'none', border: 'none', color: C.text3,
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  textDecoration: 'underline',
                }}
              >{t('app.onboarding.closeExplore')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
