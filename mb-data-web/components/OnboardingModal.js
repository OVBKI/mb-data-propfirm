'use client'
// Modal d'accueil pour les nouveaux users — affiché quand :
//   - L'user vient de se connecter pour la 1ère fois (firms.length === 0)
//   - ET qu'il n'a pas déjà skip via localStorage
//
// 3 chemins :
//   1. "Ajouter ma 1ère PropFirm" → ouvre le firmModal existant
//   2. "Voir avec données démo" → crée Topstep 50K + 30 trades fictifs
//   3. "Plus tard" → dismiss (localStorage flag)

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getFirmLogo } from '../lib/firmLogos'
import { defaultPayoutTarget, defaultMinTradingDays, defaultChallengePrice, defaultMinDailyProfit, defaultDdType } from '../lib/constants'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  surface3: '#222637',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
  red: '#e8504a',
}

// Suggestions de firmes affichées dans le wizard (les plus populaires en premier)
const FIRM_SUGGESTIONS = [
  { name: 'Topstep',                color: '#ff8c42' },
  { name: 'Apex Trader Funding',    color: '#a78bfa' },
  { name: 'Lucid Trading',          color: '#4d8fff' },
  { name: 'Take Profit Trader',     color: '#fac775' },
  { name: 'My Funded Futures',      color: '#fb923c' },
  { name: 'Bulenox',                color: '#e8504a' },
  { name: 'Tradeify',               color: '#1db87a' },
  { name: 'Phidias Propfirm',       color: '#1e2a4a' },
  { name: 'Funded Futures Network', color: '#a86bff' },
  { name: 'FuturesELites',          color: '#f472b6' },
]

// Génère 30 trades fictifs réalistes pour le compte démo
// Distribution : ~60% gagnants, PnL entre -200 et +300 typiquement
// Heures réalistes pour les heatmaps : majoritairement 14h-22h (session NY)
function generateDemoTrades() {
  const trades = []
  const today = new Date()
  const instruments = ['NQ', 'ES', 'MNQ', 'MES', 'GC', 'CL']
  const sides = ['Long', 'Short']
  // Génère 30 trades sur les 30 derniers jours
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - Math.floor(Math.random() * 30))
    // 60% chance de gain, 40% perte
    const isWin = Math.random() < 0.62
    const pnl = isWin
      ? Math.floor(Math.random() * 280) + 30  // +30 à +310
      : -Math.floor(Math.random() * 180) - 20 // -20 à -200
    // Heure réaliste : 70% pendant session NY (15h-22h locale FR), 30% Asia/London
    const hour = Math.random() < 0.7
      ? 15 + Math.floor(Math.random() * 7)  // 15h-21h
      : 8 + Math.floor(Math.random() * 6)   // 8h-13h
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
  const [creating, setCreating] = useState(false)
  const [step, setStep] = useState('welcome') // welcome | demo-loading

  function handleSkip() {
    localStorage.setItem('quantara_onboarding_dismissed', '1')
    onComplete()
  }

  function handleAddFirm() {
    localStorage.setItem('quantara_onboarding_dismissed', '1')
    onComplete()
    // Ouvre le firmModal du parent
    onAddFirm()
  }

  function handleTutorial() {
    localStorage.setItem('quantara_onboarding_dismissed', '1')
    onStartTutorial?.()
  }

  // Crée une firme Topstep + un compte 50K + 30 trades démo
  async function handleDemo() {
    setCreating(true)
    setStep('demo-loading')
    try {
      // 1. Crée la firme Topstep
      const { data: firm, error: firmErr } = await supabase
        .from('firms')
        .insert({ name: 'Topstep (Démo)', color: '#ff8c42', user_id: user.id })
        .select()
        .single()
      if (firmErr) throw firmErr

      // 2. Crée un compte 50K Challenge avec règles auto
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
          buy_date: buyDate.toISOString().slice(0, 10),
          currency: 'USD',
          spent: pr || 49,
          status: 'Challenge',
          plan_size: '50k',
          name: 'Compte démo (à supprimer)',
          dd_type: defaultDdType('Topstep'),
          payout_target: tg,
          min_trading_days: md,
          min_daily_profit: mdp,
          notes: 'Compte créé automatiquement avec 30 trades fictifs pour découvrir Quantara. Tu peux le supprimer à tout moment.',
        })
        .select()
        .single()
      if (acctErr) throw acctErr

      // 3. Crée 30 trades démo
      const trades = generateDemoTrades().map(t => ({
        ...t,
        user_id: user.id,
        account_id: account.id,
      }))
      const { error: tradesErr } = await supabase.from('journal_entries').insert(trades)
      if (tradesErr) throw tradesErr

      localStorage.setItem('quantara_onboarding_dismissed', '1')
      showToast?.('🎉 Démo créée ! Explore le dashboard et le journal.')
      onComplete()
      // Reload pour afficher les nouvelles données
      setTimeout(() => window.location.reload(), 600)
    } catch (err) {
      console.error('[OnboardingModal demo]', err)
      alert('Erreur création démo : ' + (err.message || 'inconnue'))
      setCreating(false)
      setStep('welcome')
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
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

        {step === 'welcome' && (
          <div style={{ position: 'relative', padding: '48px 40px 36px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>👋</div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.01em' }}>
                Bienvenue sur Quantara
              </h1>
              <p style={{ fontSize: 14, color: C.text2, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
                Le journal de trading pensé pour les <strong style={{ color: C.text }}>traders PropFirm futures</strong>.
                Avant de commencer, comment veux-tu démarrer ?
              </p>
            </div>

            {/* Les 3 chemins */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {/* Option 1 : Ajouter ma vraie firme — off-white inverted (cohérent landing/dashboard) */}
              <button
                onClick={handleAddFirm}
                disabled={creating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '20px 24px', borderRadius: 12,
                  background: C.text,
                  border: '1px solid transparent', color: '#0a0c10', cursor: creating ? 'wait' : 'pointer',
                  textAlign: 'left', fontFamily: 'inherit',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 12px 28px rgba(0,0,0,0.3)',
                  transition: 'transform 0.15s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { if(!creating) e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(45,111,255,0.15)',
                  border: '1px solid rgba(45,111,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: '#2d6fff',
                }}>→</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Ajouter ma 1ère PropFirm</div>
                  <div style={{ fontSize: 12, color: 'rgba(10,12,16,0.75)' }}>
                    Configuration en 30 sec — règles drawdown/payout pré-remplies
                  </div>
                </div>
                <span style={{ fontSize: 18, color: 'rgba(10,12,16,0.6)' }}>↗</span>
              </button>

              {/* Option 2 : Voir avec données démo */}
              <button
                onClick={handleDemo}
                disabled={creating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '20px 24px', borderRadius: 12,
                  background: C.surface2, border: `1px solid ${C.border2}`,
                  color: C.text, cursor: creating ? 'wait' : 'pointer',
                  textAlign: 'left', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if(!creating){ e.currentTarget.style.borderColor = C.blueLight; e.currentTarget.style.background = C.surface3 } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.background = C.surface2 }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(29,184,122,0.12)', border: `1px solid ${C.green}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                }}>🎮</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
                    Voir avec données démo
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(29,184,122,0.18)', color: C.green, marginLeft: 8, verticalAlign: 'middle' }}>RECOMMANDÉ</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.text2 }}>
                    Topstep 50K + 30 trades fictifs pour explorer toutes les fonctionnalités
                  </div>
                </div>
                <span style={{ fontSize: 18, color: C.text3 }}>→</span>
              </button>

              {/* Option 3 : Tutoriel guidé */}
              <button
                onClick={handleTutorial}
                disabled={creating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '20px 24px', borderRadius: 12,
                  background: C.surface2, border: `1px solid ${C.border2}`,
                  color: C.text, cursor: creating ? 'wait' : 'pointer',
                  textAlign: 'left', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if(!creating){ e.currentTarget.style.borderColor = C.blueLight; e.currentTarget.style.background = C.surface3 } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.background = C.surface2 }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(45,111,255,0.12)', border: `1px solid ${C.blueLight}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                }}>🎓</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
                    Suivre le tutoriel interactif
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'rgba(45,111,255,0.18)', color: C.blueLight, marginLeft: 8, verticalAlign: 'middle' }}>NOUVEAU</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.text2 }}>
                    11 étapes en ~5 min — tu crées RÉELLEMENT ta firme, un compte, un trade, un payout (guidé pas à pas)
                  </div>
                </div>
                <span style={{ fontSize: 18, color: C.text3 }}>→</span>
              </button>
            </div>

            {/* Aperçu des firmes supportées */}
            <div style={{
              padding: '16px 20px', borderRadius: 10,
              background: C.surface2, border: `1px solid ${C.border}`,
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                10 PropFirms supportées
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {FIRM_SUGGESTIONS.map(f => (
                  <div key={f.name} title={f.name} style={{ flexShrink: 0 }}>
                    {getFirmLogo(f.name, f.color, 28)}
                  </div>
                ))}
              </div>
            </div>

            {/* Skip link */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleSkip}
                disabled={creating}
                style={{
                  background: 'none', border: 'none', color: C.text3,
                  fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
                  fontFamily: 'inherit',
                }}
              >Plus tard, je veux explorer librement</button>
            </div>
          </div>
        )}

        {step === 'demo-loading' && (
          <div style={{ position: 'relative', padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 18 }}>⚙️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Création de la démo en cours...</h2>
            <p style={{ fontSize: 13, color: C.text2, marginBottom: 24 }}>
              On crée ta firme Topstep démo + 30 trades fictifs réalistes.
            </p>
            <div style={{ fontSize: 11, color: C.text3 }}>
              Cela prend ~3 secondes...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
