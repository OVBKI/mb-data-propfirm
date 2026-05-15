// Landing page Quantara — version "wow"
// Hero parallax + particles + magnetic CTA + flip cards + self-drawing equity curve + mesh gradient footer
// Garde les couleurs et le contenu existants.

import Link from 'next/link'
import DashboardPreview from '../components/DashboardPreview'
import ParticlesField from '../components/landing/ParticlesField'
import HeroSection from '../components/landing/HeroSection'
import MagneticButton from '../components/landing/MagneticButton'
import FlipFeatureCards from '../components/landing/FlipFeatureCards'
import EquityCurveSelfDraw from '../components/landing/EquityCurveSelfDraw'
import MeshGradientFooter from '../components/landing/MeshGradientFooter'
import LandingScrollEffects from '../components/landing/LandingScrollEffects'

export const metadata = {
  title: 'Quantara — Track. Analyze. Grow.',
  description: 'Le journal de trading pensé pour les traders PropFirm futures. Drawdown trailing, profit split, payouts — tout est tracké automatiquement.',
}

const colors = {
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
  red: '#e8504a',
  amber: '#fac775',
}

const FEATURES = [
  {
    icon: '🏢',
    title: 'Suivi multi-PropFirms',
    desc: 'Topstep, Apex, Bulenox, Lucid, Tradeify, MFFU, Phidias, TPT et plus. Règles drawdown / profit split / payout target pré-remplies pour 10+ firmes.',
  },
  {
    icon: '📔',
    title: 'Journal de trading complet',
    desc: 'PnL, prix entry/exit, instrument, side, screenshot. Calendrier mensuel coloré vert/rouge. Filtres par compte, par PropFirm, par période.',
  },
  {
    icon: '📈',
    title: 'Equity curve & drawdown live',
    desc: 'Visualise l\'évolution de chaque compte. Ligne de DD intelligent : Static, EOD (End of Day) ou Trailing intraday selon les règles de ta firme.',
  },
  {
    icon: '💰',
    title: 'Payouts & cash flow',
    desc: 'Suis chaque payout reçu, calcule ton ROI réel, vois ton bilan net (payouts − dépenses). Recap email automatique chaque 1er du mois.',
  },
  {
    icon: '🔔',
    title: 'Notifications intelligentes',
    desc: 'Push browser 2 jours avant chaque prélèvement mensuel. Alerts in-app pour payout dispo, challenges trop longs, ROI excellent. Plus jamais de surprise.',
  },
  {
    icon: '📅',
    title: 'Calendrier économique intégré',
    desc: 'NFP, FOMC, CPI, jobless claims — les news macro à fort impact sur futures. Filtre par devise & sévérité. Évite de trader pendant les pièges.',
  },
]

const STEPS = [
  {
    n: 1,
    title: 'Crée ton compte',
    desc: 'Inscription en 30 secondes. Aucune carte bancaire. L\'outil reste gratuit pendant la beta.',
  },
  {
    n: 2,
    title: 'Configure tes PropFirms',
    desc: 'Tape "Topstep", choisis ton plan. Les règles drawdown, profit split et payout target sont déjà pré-remplies.',
  },
  {
    n: 3,
    title: 'Trade & analyse',
    desc: 'Logge tes trades, vois ta courbe en temps réel, reçois des alertes proactives, optimise ta consistency.',
  },
]

const STATS = [
  { v: '10+', l: 'PropFirms supportées' },
  { v: '∞', l: 'Comptes par utilisateur' },
  { v: '3', l: 'Langues (FR/EN/ES)' },
  { v: '100%', l: 'Tes données t\'appartiennent' },
]

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      color: colors.text,
      overflowX: 'hidden',
    }}>
      {/* Top bar minimaliste */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '14px 24px',
        background: 'rgba(13,15,20,0.6)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontWeight: 800, letterSpacing: '0.1em', fontSize: 14 }}>QUANTARA</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/app" style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            borderRadius: 99, color: colors.text2,
            textDecoration: 'none', border: `1px solid ${colors.border2}`,
          }}>Se connecter</Link>
          <Link href="/app" style={{
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            borderRadius: 99,
            background: `linear-gradient(135deg, ${colors.blue}, ${colors.blueLight})`,
            color: '#fff', textDecoration: 'none',
          }}>Démarrer</Link>
        </div>
      </div>

      {/* === HERO avec particles background === */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Particles canvas en arrière-plan */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <ParticlesField density={70} color="77,143,255" />
        </div>

        {/* Vignette pour adoucir les bords */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: `radial-gradient(ellipse at center, transparent 30%, ${colors.bg} 80%)`,
          pointerEvents: 'none',
        }} />

        <HeroSection>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <MagneticButton href="/app" primary large>
              🚀 Démarrer gratuitement
            </MagneticButton>
            <MagneticButton href="#features" large>
              Voir les features ↓
            </MagneticButton>
          </div>
        </HeroSection>

        {/* Indicateur scroll */}
        <div style={{
          position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          zIndex: 2,
          fontSize: 11, color: colors.text3,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          animation: 'qtFloat 2s ease-in-out infinite',
        }}>
          ↓ Scroll
        </div>
      </section>

      {/* === STATS strip === */}
      <section style={{
        padding: '60px 24px',
        position: 'relative',
        background: `linear-gradient(180deg, transparent, ${colors.surface}40, transparent)`,
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 24,
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 800,
                background: `linear-gradient(135deg, ${colors.blue}, ${colors.blueLight})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: 6,
                letterSpacing: '-0.02em',
              }}>{s.v}</div>
              <div style={{ fontSize: 12, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === DASHBOARD PREVIEW === */}
      <section style={{ padding: '60px 24px 80px', position: 'relative' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: colors.blueLight,
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12,
            }}>👀 Aperçu</div>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800, marginBottom: 14,
              letterSpacing: '-0.02em',
            }}>Le dashboard pensé pour les traders sérieux</h2>
            <p style={{ fontSize: 16, color: colors.text2, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
              Stats globales, top firms, calendrier de transactions, et beaucoup plus.
            </p>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* === EQUITY CURVE SELF-DRAW === */}
      <section style={{ padding: '60px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: colors.green,
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12,
            }}>📈 Visualisation</div>
            <h2 style={{
              fontSize: 'clamp(26px, 3.5vw, 36px)',
              fontWeight: 800, marginBottom: 14,
              letterSpacing: '-0.02em',
            }}>Equity curve & drawdown en temps réel</h2>
            <p style={{ fontSize: 15, color: colors.text2, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
              La ligne de DD trailing suit ton balance peak et se fige automatiquement au balance initial.
            </p>
          </div>
          <EquityCurveSelfDraw />
        </div>
      </section>

      {/* === FEATURES === */}
      <section id="features" style={{ padding: '80px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: colors.blueLight,
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12,
            }}>✨ Features</div>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800, marginBottom: 14,
              letterSpacing: '-0.02em',
            }}>Tout ce dont tu as besoin. Rien de superflu.</h2>
            <p style={{ fontSize: 16, color: colors.text2, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
              Conçu par et pour les traders PropFirm. Chaque feature résout un problème réel.
            </p>
          </div>
          <FlipFeatureCards features={FEATURES} />
        </div>
      </section>

      {/* === HOW IT WORKS (3 steps) === */}
      <section style={{ padding: '80px 24px', position: 'relative', background: `linear-gradient(180deg, transparent, ${colors.surface}30, transparent)` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: colors.amber,
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12,
            }}>🚀 Comment ça marche</div>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800, marginBottom: 14,
              letterSpacing: '-0.02em',
            }}>3 étapes. 90 secondes. Démarre maintenant.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28 }}>
            {STEPS.map(step => (
              <div key={step.n} style={{
                background: 'rgba(20,23,32,0.5)',
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 28,
                position: 'relative',
                backdropFilter: 'blur(20px)',
              }}>
                <div style={{
                  position: 'absolute', top: -16, left: 28,
                  width: 36, height: 36,
                  background: `linear-gradient(135deg, ${colors.blue}, ${colors.blueLight})`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 14, color: '#fff',
                  boxShadow: `0 6px 16px ${colors.blue}66`,
                }}>{step.n}</div>
                <div style={{ height: 16 }} />
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: colors.text2, lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative' }}>
        {/* Halo dramatique */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse at center, ${colors.blue}25, transparent 60%)`,
        }} />
        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 900,
            marginBottom: 18,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}>
            Prêt à <span style={{
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.blueLight}, ${colors.green})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>tracker comme un pro</span> ?
          </h2>
          <p style={{
            fontSize: 17, color: colors.text2, marginBottom: 36,
            lineHeight: 1.6,
          }}>
            Inscription gratuite. Pas de carte bancaire. Configure ta 1ère PropFirm en 90 secondes.
          </p>
          <MagneticButton href="/app" primary large>
            🚀 Démarrer maintenant
          </MagneticButton>
          <p style={{ marginTop: 20, fontSize: 12, color: colors.text3 }}>
            🔒 Tes données t'appartiennent · 🇺🇸 Quantara LLC Texas · 🛡 RGPD compliant
          </p>
        </div>
      </section>

      {/* === FOOTER === */}
      <MeshGradientFooter />

      {/* Keyframes globales */}
      <LandingScrollEffects />
    </div>
  )
}
