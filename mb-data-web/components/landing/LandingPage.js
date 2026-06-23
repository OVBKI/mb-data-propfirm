'use client'
// LandingPage — Full client-side landing page component.
// Extracted from app/page.js to allow the route to be a server component
// (enabling metadata export + SEO fallback). This file keeps ALL original
// logic, JSX and imports intact; heavy below-fold components are lazy-loaded.

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useT, useLanguage } from '../LanguageProvider'
import LanguageSwitcher from '../LanguageSwitcher'
import ParticlesField from './ParticlesField'
import HeroSection from './HeroSection'
import MagneticButton from './MagneticButton'
import LandingScrollEffects from './LandingScrollEffects'
// Polish layers (A-F + grain non-AI)
import ScrollProgress from './ScrollProgress'
import SmoothScrollProvider from './SmoothScrollProvider'
import AnimatedStats from './AnimatedStats'
import SocialProof from './SocialProof'
import Tilted3DFrame from './Tilted3DFrame'
// SEO — JSON-LD Schema.org pour rich results Google + citations AI search

// Heavy below-fold components — lazy loaded to reduce initial bundle
const AnalyticsMockup = dynamic(() => import('./AnalyticsMockup'), { ssr: false, loading: () => <div style={{ height: 400 }} /> })
const JournalMockup = dynamic(() => import('./JournalMockup'), { ssr: false, loading: () => <div style={{ height: 400 }} /> })
const EconomicCalendarMockup = dynamic(() => import('./EconomicCalendarMockup'), { ssr: false, loading: () => <div style={{ height: 400 }} /> })
const EquityCurveDemo = dynamic(() => import('./EquityCurveDemo'), { ssr: false, loading: () => <div style={{ height: 400 }} /> })
const NotificationMockup = dynamic(() => import('./NotificationMockup'), { ssr: false, loading: () => <div style={{ height: 400 }} /> })
const DashboardMockup = dynamic(() => import('./DashboardMockup'), { ssr: false, loading: () => <div style={{ height: 400 }} /> })
const EnhancedSteps = dynamic(() => import('./EnhancedSteps'), { ssr: false })
const FlipFeatureCards = dynamic(() => import('./FlipFeatureCards'), { ssr: false })
const MeshGradientFooter = dynamic(() => import('./MeshGradientFooter'), { ssr: false })

// 3D stars — lazy-loaded côté client uniquement (Three.js ~600KB, on évite le SSR + on
// retire ce poids du first paint pour ne pas dégrader le LCP).
const StarField3D = dynamic(() => import('./StarField3D'), {
  ssr: false,
  loading: () => null, // pas de loader visible — le fond reste juste noir le temps que ça charge
})

const colors = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#7b839b',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  red: '#e8504a',
  amber: '#fac775',
}

// Keys i18n pour les 6 features/3 steps/4 stats (résolues via useT dans le composant).
// On garde icons + numéros ici (non traduits), le texte vient de lib/i18n.js.
const FEATURE_KEYS = [
  { icon: '🏢', key: 'multipropfirms' },
  { icon: '📔', key: 'journal' },
  { icon: '📈', key: 'equity' },
  { icon: '💰', key: 'payouts' },
  { icon: '🔔', key: 'notifications' },
  { icon: '📅', key: 'calendar' },
]

const STEP_KEYS = [
  { n: 1, key: 'step1' },
  { n: 2, key: 'step2' },
  { n: 3, key: 'step3' },
]

const STAT_KEYS = ['propfirms', 'accounts', 'langs', 'privacy']

// ============================================================================
// Helper layout pour chaque section "vraie page produit" :
// label monospace + titre + sous-titre + mockup 3D tilt en dessous.
// Utilisé par les 6 pages (Dashboard, Analytics, Journal, Calendar, Equity, Notif).
// ============================================================================
// Helper compact pour rendre une section via sa clé i18n (ex: sectionKey="dashboard"
// → translate sections.dashboard.label, .title, .subtitle automatiquement).
function I18nProductSection({ sectionKey, labelColor, children }) {
  const t = useT()
  return (
    <ProductSection
      label={t(`sections.${sectionKey}.label`)}
      labelColor={labelColor}
      title={t(`sections.${sectionKey}.title`)}
      subtitle={t(`sections.${sectionKey}.subtitle`)}
    >
      {children}
    </ProductSection>
  )
}

function ProductSection({ label, labelColor, title, subtitle, children }) {
  return (
    <section className="lp-product-section" style={{ padding: '80px 24px 60px', position: 'relative' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Intro text centrée */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: labelColor,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            marginBottom: 14, fontFamily: 'ui-monospace, monospace',
          }}>
            {label}
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 800, letterSpacing: '-0.025em',
            marginBottom: 16, color: colors.text, lineHeight: 1.15,
          }}>
            {title}
          </h2>
          <p style={{
            fontSize: 16, color: colors.text2, lineHeight: 1.55,
            maxWidth: 700, margin: '0 auto',
          }}>
            {subtitle}
          </p>
        </div>

        {/* Mockup 3D tilted en dessous */}
        {children}
      </div>
    </section>
  )
}

export default function LandingPage() {
  const t = useT()
  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      color: colors.text,
      overflowX: 'hidden',
      position: 'relative',
    }}>
      {/* JSON-LD : désormais rendu côté SERVEUR (app/page.js + layout.js) pour être
          visible des crawlers — ce composant client est ssr:false. */}

      {/* Polish layers — invisible mais cassent le côté "AI-default" */}
      <SmoothScrollProvider />
      <ScrollProgress />

      {/* Grain noise très subtil — sans mix-blend-mode pour éviter coût GPU compositing */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        opacity: 0.018,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      {/* Top bar — logo + nav liens + CTAs */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        padding: '14px 24px',
        background: 'rgba(13,15,20,0.65)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontWeight: 800, letterSpacing: '0.12em', fontSize: 13, color: colors.text }}>QUANTARA</div>

        {/* Nav links desktop */}
        <nav className="qt-topnav" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href="/compare" style={{ fontSize: 12.5, color: colors.text2, textDecoration: 'none', transition: 'color 0.15s' }} className="qt-navlink">{t('nav.compare')}</Link>
          <Link href="/tools/drawdown-simulator" style={{ fontSize: 12.5, color: colors.text2, textDecoration: 'none', transition: 'color 0.15s' }} className="qt-navlink">{t('nav.simulator')}</Link>
          <Link href="/pricing" style={{ fontSize: 12.5, color: colors.text2, textDecoration: 'none', transition: 'color 0.15s' }} className="qt-navlink">{t('nav.pricing')}</Link>
          <Link href="/demo" style={{ fontSize: 12.5, color: colors.text2, textDecoration: 'none', transition: 'color 0.15s' }} className="qt-navlink">{t('nav.demo')}</Link>
        </nav>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <LanguageSwitcher compact />
          <Link href="/app" className="qt-topbtn-ghost" style={{
            padding: '8px 16px', fontSize: 12.5, fontWeight: 500,
            borderRadius: 8,
            color: colors.text2,
            textDecoration: 'none',
            border: '0.5px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.02)',
            transition: 'color 0.2s, border-color 0.2s, background 0.2s',
            letterSpacing: '0.005em',
          }}>{t('nav.login')}</Link>
          <Link href="/auth?mode=signup" className="qt-topbtn-primary" style={{
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
            {t('nav.start')}
            <span style={{
              fontFamily: 'monospace', fontSize: 11, opacity: 0.7,
              transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
            }} className="qt-topbtn-arrow">→</span>
          </Link>
        </div>
        <style>{`
          .qt-navlink:hover { color: ${colors.text} !important; }
          .qt-topbtn-ghost:hover {
            color: ${colors.text} !important;
            border-color: rgba(255,255,255,0.18) !important;
            background: rgba(255,255,255,0.05) !important;
          }
          .qt-topbtn-primary:hover { transform: translateY(-1px); box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset, 0 6px 18px rgba(0,0,0,0.4) !important; }
          .qt-topbtn-primary:hover .qt-topbtn-arrow { transform: translateX(2px); }
          @media (max-width: 768px) {
            .qt-topnav { display: none !important; }
            .qt-topbtn-ghost { display: none !important; }
          }
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

        {/* Logo Q 2D + halos repris (l'utilisateur adore). La planète Earth 3D rendue
            dans StarField3D apparaît en bas, derrière, comme vue depuis l'orbite. */}
        <HeroSection>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <MagneticButton href="/auth?mode=signup" primary large>
              {t('hero.ctaPrimary')}
            </MagneticButton>
            <MagneticButton href="/demo" large>
              {t('hero.ctaSecondary')}
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
          {t('hero.scrollHint')}
        </div>
      </section>

      {/* === SOCIAL PROOF — beta counter + testimonials === */}
      <SocialProof />

      {/* === STATS strip avec compteurs animés au scroll === */}
      <AnimatedStats stats={STAT_KEYS.map(k => ({
        v: t(`stats.${k}.value`),
        l: t(`stats.${k}.label`),
      }))} />

      {/* ============================================================
          6 VRAIES PAGES PRODUIT en 3D incliné (Tilted3DFrame).
          Chaque section : intro text au-dessus + mockup tilted en dessous.
          Le `flip` alterne le sens du tilt pour rythmer visuellement.
          ============================================================ */}

      {/* === PAGE 1 : TABLEAU DE BORD === */}
      <I18nProductSection sectionKey="dashboard" labelColor={colors.blueLight}>
        <Tilted3DFrame title="quantara.tech/app">
          <DashboardMockup />
        </Tilted3DFrame>
      </I18nProductSection>

      {/* === PAGE 2 : ANALYTICS === */}
      <I18nProductSection sectionKey="analytics" labelColor={colors.blueLight}>
        <Tilted3DFrame title="quantara.tech/app?p=analytics" flip>
          <AnalyticsMockup />
        </Tilted3DFrame>
      </I18nProductSection>

      {/* === PAGE 3 : JOURNAL DE TRADING === */}
      <I18nProductSection sectionKey="journal" labelColor={colors.green}>
        <Tilted3DFrame title="quantara.tech/app/journal">
          <JournalMockup />
        </Tilted3DFrame>
      </I18nProductSection>

      {/* === PAGE 4 : CALENDRIER ÉCONOMIQUE === */}
      <I18nProductSection sectionKey="calendar" labelColor={colors.amber}>
        <Tilted3DFrame title="quantara.tech/app/calendar" flip>
          <EconomicCalendarMockup />
        </Tilted3DFrame>
      </I18nProductSection>

      {/* === PAGE 5 : EQUITY CURVE === */}
      <I18nProductSection sectionKey="equity" labelColor={colors.green}>
        <Tilted3DFrame title="quantara.tech/app/equity">
          <EquityCurveDemo />
        </Tilted3DFrame>
      </I18nProductSection>

      {/* === PAGE 6 : NOTIFICATIONS PUSH === */}
      <section style={{ padding: '60px 24px 80px', position: 'relative' }}>
        <NotificationMockup />
      </section>

      {/* === FEATURES === */}
      <section id="features" style={{ padding: '80px 24px', position: 'relative' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: colors.blueLight,
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12,
            }}>{t('features.eyebrow')}</div>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800, marginBottom: 14,
              letterSpacing: '-0.02em',
            }}>{t('features.heading')}</h2>
            <p style={{ fontSize: 16, color: colors.text2, maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
              {t('features.subheading')}
            </p>
          </div>
          <FlipFeatureCards features={FEATURE_KEYS.map(f => ({
            icon: f.icon,
            title: t(`features.${f.key}.title`),
            desc:  t(`features.${f.key}.desc`),
          }))} />
        </div>
      </section>

      {/* === HOW IT WORKS (steps avec ligne lumineuse + hover) === */}
      <EnhancedSteps steps={STEP_KEYS.map(s => ({
        n: s.n,
        title: t(`steps.${s.key}.title`),
        desc:  t(`steps.${s.key}.desc`),
      }))} />

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
            {t('finalCTA.titleStart')}<span style={{
              background: `linear-gradient(135deg, ${colors.blue}, ${colors.blueLight}, ${colors.green})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>{t('finalCTA.titleHighlight')}</span>{t('finalCTA.titleEnd')}
          </h2>
          <p style={{
            fontSize: 17, color: colors.text2, marginBottom: 36,
            lineHeight: 1.6,
          }}>
            {t('finalCTA.subtitle')}
          </p>
          <MagneticButton href="/auth?mode=signup" primary large>
            {t('finalCTA.button')}
          </MagneticButton>
          <p style={{ marginTop: 20, fontSize: 12, color: colors.text3 }}>
            {t('finalCTA.trustLine')}
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
