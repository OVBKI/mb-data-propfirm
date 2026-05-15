// Landing page Quantara — V2 Luxury / Editorial
// Direction esthétique : Apple-inspired, minimal restraint, asymmetric layouts
// Typo : Instrument Serif (italic display) + Geist (body) + Geist Mono (data)
// Pas de "AI-look" — typographie distinctive, composition asymmetric, breathing room généreux.

import Link from 'next/link'
import AtmosphereBackground from '../components/landing/AtmosphereBackground'
import ScrollProgress from '../components/landing/ScrollProgress'
import HeroLuxury from '../components/landing/HeroLuxury'
import QuietCTA from '../components/landing/QuietCTA'
import GiantStat from '../components/landing/GiantStat'
import AsymFeatures from '../components/landing/AsymFeatures'
import EquityImmersive from '../components/landing/EquityImmersive'
import EditorialFooter from '../components/landing/EditorialFooter'
import LandingScrollEffects from '../components/landing/LandingScrollEffects'

export const metadata = {
  title: 'Quantara — Track. Analyze. Grow.',
  description: 'Le journal de trading pensé pour les traders PropFirm futures. Drawdown trailing, profit split, payouts — tout est tracké automatiquement.',
}

const C = {
  bg: '#0d0f14',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  border: 'rgba(255,255,255,0.06)',
}

const FEATURES = [
  {
    icon: '🏢',
    title: 'Suivi multi-PropFirms',
    desc: 'Topstep, Apex, Bulenox, Lucid, Tradeify, MFFU, Phidias, TPT — 10 firmes pré-configurées avec leurs règles drawdown, profit split et payout target.',
  },
  {
    icon: '📔',
    title: 'Journal détaillé',
    desc: 'PnL, prix entry/exit, instrument, side, screenshot. Filtres par compte. Calendrier coloré.',
  },
  {
    icon: '📈',
    title: 'Equity & DD live',
    desc: 'Static, EOD ou Trailing intraday selon ta firme.',
  },
  {
    icon: '💰',
    title: 'Cash flow réel',
    desc: 'Suis chaque payout, calcule ton ROI, vois ton bilan net (payouts − dépenses). Récap mensuel automatique par email — chaque 1er du mois, sans rien faire.',
  },
  {
    icon: '🔔',
    title: 'Push intelligente',
    desc: '2 jours avant chaque prélèvement mensuel. Plus jamais de surprise sur ta carte.',
  },
  {
    icon: '📅',
    title: 'Calendrier macro',
    desc: 'NFP, FOMC, CPI. Filtré par devise. Évite les pièges de volatilité.',
  },
]

export default function LandingPage() {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: 'var(--font-geist)',
      overflowX: 'hidden',
    }}>
      {/* === Atmosphere background (fixed, derrière tout) === */}
      <AtmosphereBackground />

      {/* === Scroll progress bar (fixed top) === */}
      <ScrollProgress />

      {/* === Top bar minimal === */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '20px clamp(24px, 6vw, 96px)',
        background: 'rgba(13,15,20,0.7)',
        backdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 22,
          color: C.text,
          textDecoration: 'none',
          letterSpacing: '-0.02em',
        }}>Quantara</Link>
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/app" style={{
            padding: '8px 14px',
            fontSize: 13,
            color: C.text2,
            textDecoration: 'none',
            fontFamily: 'var(--font-geist)',
            transition: 'color 0.2s',
          }}>Se connecter</Link>
          <QuietCTA href="/app" primary>Démarrer</QuietCTA>
        </nav>
      </header>

      {/* === HERO LUXURY === */}
      <HeroLuxury>
        <QuietCTA href="/app" primary large>
          Démarrer gratuitement
        </QuietCTA>
        <QuietCTA href="#features" large>
          Voir les features
        </QuietCTA>
      </HeroLuxury>

      {/* === GIANT STAT 1 — left aligned === */}
      <GiantStat
        value="10+"
        label="PropFirms · Pré-configurées"
        sublabel={<>Topstep, Apex, Bulenox, Lucid, Tradeify, MFFU, Phidias, TPT, FFN, FuturesELites — <em style={{ fontFamily: 'var(--font-serif)', color: C.text }}>leurs règles drawdown et profit split sont déjà dans Quantara</em>.</>}
        align="left"
        accent="blue"
      />

      {/* === EQUITY IMMERSIVE — the signature moment === */}
      <EquityImmersive />

      {/* === GIANT STAT 2 — right aligned, asymmetry === */}
      <GiantStat
        value="$17,125"
        label="Payouts trackés · Beta privée"
        sublabel={<>Total NET reçu par les 10 premiers users en 30 jours. <em style={{ fontFamily: 'var(--font-serif)', color: C.text }}>Les chiffres ne mentent pas</em>.</>}
        align="right"
        accent="green"
      />

      {/* === FEATURES ASYMMETRIC === */}
      <div id="features">
        <AsymFeatures features={FEATURES} />
      </div>

      {/* === STEPS (3 — minimal vertical) === */}
      <section style={{
        padding: 'clamp(80px, 14vh, 160px) clamp(24px, 6vw, 96px)',
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        <div style={{ marginBottom: 80, maxWidth: 680 }}>
          <div style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: C.text3,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ width: 28, height: 1, background: C.blueLight, opacity: 0.6 }} />
            <span>Démarrer · 3 étapes</span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(40px, 6vw, 76px)',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
          }}>
            90 secondes. Pas plus.
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { n: '01', title: 'Crée ton compte', desc: 'Email + mot de passe. Pas de carte bancaire. Beta gratuite.' },
            { n: '02', title: 'Configure tes firmes', desc: 'Tape "Topstep", choisis ton plan. Toutes les règles sont déjà pré-remplies.' },
            { n: '03', title: 'Trade & analyse', desc: 'Logge tes trades, vois ta courbe en temps réel, reçois des push 2j avant chaque paiement.' },
          ].map((step, i, arr) => (
            <div key={step.n} style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr',
              gap: 'clamp(20px, 4vw, 48px)',
              padding: '32px 0',
              borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
              alignItems: 'baseline',
            }}>
              <div style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: 13,
                color: C.text3,
                letterSpacing: '0.1em',
              }}>{step.n} —</div>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 'clamp(28px, 4vw, 44px)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                  color: C.text,
                  marginBottom: 12,
                }}>{step.title}</h3>
                <p style={{
                  fontFamily: 'var(--font-geist)',
                  fontSize: 'clamp(14px, 1.2vw, 16px)',
                  color: C.text2,
                  lineHeight: 1.65,
                  maxWidth: 600,
                }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === FINAL CTA dramatic === */}
      <section style={{
        padding: 'clamp(80px, 16vh, 200px) clamp(24px, 6vw, 96px)',
        textAlign: 'left',
        position: 'relative',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
        }}>
          <div style={{ maxWidth: 900 }}>
            <div style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: C.text3,
              marginBottom: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{ width: 28, height: 1, background: C.blueLight, opacity: 0.6 }} />
              <span>Quantara — Beta gratuite</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(48px, 9vw, 140px)',
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              color: C.text,
              marginBottom: 32,
            }}>
              Track. <span style={{
                background: `linear-gradient(135deg, ${C.text} 30%, ${C.blueLight} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Analyze.</span> Grow.
            </h2>
            <p style={{
              fontFamily: 'var(--font-geist)',
              fontSize: 'clamp(16px, 1.5vw, 20px)',
              color: C.text2,
              lineHeight: 1.6,
              marginBottom: 48,
              maxWidth: 540,
            }}>
              Inscription gratuite. Configuration en 90 secondes. Tu reviendras pas en arrière.
            </p>
            <QuietCTA href="/app" primary large>
              Démarrer maintenant
            </QuietCTA>
          </div>
        </div>
      </section>

      {/* === EDITORIAL FOOTER === */}
      <EditorialFooter />

      {/* === Global keyframes & accessibility === */}
      <LandingScrollEffects />
    </div>
  )
}
