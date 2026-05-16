// Landing page Quantara — V1 (ton identité d'origine)
// Logo + particules + hero centré + ton layout existant
// Tous les composants V1 sont actifs et utilisés.

import Link from 'next/link'
import dynamic from 'next/dynamic'
import DashboardPreview from '../components/DashboardPreview'
import ParticlesField from '../components/landing/ParticlesField'
import HeroSection from '../components/landing/HeroSection'
import MagneticButton from '../components/landing/MagneticButton'
import FlipFeatureCards from '../components/landing/FlipFeatureCards'
import EquityCurveSelfDraw from '../components/landing/EquityCurveSelfDraw'
import MeshGradientFooter from '../components/landing/MeshGradientFooter'
import LandingScrollEffects from '../components/landing/LandingScrollEffects'
// Polish layers (A-F + grain non-AI)
import ScrollProgress from '../components/landing/ScrollProgress'
import SmoothScrollProvider from '../components/landing/SmoothScrollProvider'
import AnimatedStats from '../components/landing/AnimatedStats'
import EnhancedSteps from '../components/landing/EnhancedSteps'

// 3D stars — lazy-loaded côté client uniquement (Three.js ~600KB, on évite le SSR + on
// retire ce poids du first paint pour ne pas dégrader le LCP).
const StarField3D = dynamic(() => import('../components/landing/StarField3D'), {
  ssr: false,
  loading: () => null, // pas de loader visible — le fond reste juste noir le temps que ça charge
})

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
      position: 'relative',
    }}>
      {/* Polish layers — invisible mais cassent le côté "AI-default" */}
      <SmoothScrollProvider />
      <ScrollProgress />

      {/* Grain noise très subtil — sans mix-blend-mode pour éviter coût GPU compositing */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        opacity: 0.018,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      {/* Top bar minimaliste — style refined cohérent avec MagneticButton */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '14px 24px',
        background: 'rgba(13,15,20,0.65)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontWeight: 800, letterSpacing: '0.12em', fontSize: 13, color: colors.text }}>QUANTARA</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Se connecter — ghost subtle */}
          <Link href="/app" className="qt-topbtn-ghost" style={{
            padding: '8px 16px', fontSize: 12.5, fontWeight: 500,
            borderRadius: 8,
            color: colors.text2,
            textDecoration: 'none',
            border: '0.5px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.02)',
            transition: 'color 0.2s, border-color 0.2s, background 0.2s',
            letterSpacing: '0.005em',
          }}>Se connecter</Link>
          {/* Démarrer — INVERSÉ premium (off-white sur sombre) */}
          <Link href="/app" className="qt-topbtn-primary" style={{
            padding: '8px 18px', fontSize: 12.5, fontWeight: 500,
            borderRadius: 8,
            background: colors.text,
            color: '#0a0c10',
            textDecoration: 'none',
            border: '1px solid transparent',
            boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s',
            letterSpacing: '0.005em',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            Démarrer
            <span style={{
              fontFamily: 'monospace', fontSize: 11, opacity: 0.7,
              transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
            }} className="qt-topbtn-arrow">→</span>
          </Link>
        </div>
        <style>{`
          .qt-topbtn-ghost:hover {
            color: ${colors.text} !important;
            border-color: rgba(255,255,255,0.18) !important;
            background: rgba(255,255,255,0.05) !important;
          }
          .qt-topbtn-primary:hover { transform: translateY(-1px); box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset, 0 6px 18px rgba(0,0,0,0.4) !important; }
          .qt-topbtn-primary:hover .qt-topbtn-arrow { transform: translateX(2px); }
        `}</style>
      </div>

      {/* === HERO avec fond 3D parallax + particules 2D légères au-dessus === */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* COUCHE 1 (profonde) — Champ d'étoiles 3D avec parallax souris */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <StarField3D />
        </div>

        {/* COUCHE 2 (proche) — Particules 2D pour halo souris et interaction directe.
            Densité réduite (40 vs 90 avant) pour ne pas saturer visuellement le 3D dessous. */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <ParticlesField density={40} color="77,143,255" />
        </div>

        {/* Vignette pour adoucir les bords */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: `radial-gradient(ellipse at center, transparent 30%, ${colors.bg} 80%)`,
          pointerEvents: 'none',
        }} />

        {/* hideLogo : le logo 2D est remplacé par la planète 3D rendue dans StarField3D.
            HeroSection insère à la place un spacer vertical pour réserver l'espace. */}
        <HeroSection hideLogo>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <MagneticButton href="/app" primary large>
              Démarrer gratuitement
            </MagneticButton>
            <MagneticButton href="#features" large>
              Voir les features
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

      {/* === STATS strip avec compteurs animés au scroll === */}
      <AnimatedStats stats={STATS} />

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

      {/* === HOW IT WORKS (steps avec ligne lumineuse + hover) === */}
      <EnhancedSteps steps={STEPS} />

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
            Démarrer maintenant
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
