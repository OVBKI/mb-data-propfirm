'use client'
// LandingPage — Atmospheric Dark variant.
// Cinematic premium dark mode: deep navy bg + warm coral accent + italic
// serif headlines (Fraunces) + Inter body + JetBrains Mono for numerics.
// Each section feels like a separate "act". Subtle motion only — no neon,
// no springs, only smooth cubic-bezier(0.16,1,0.3,1) eases.
//
// All helpers live in components/landing/v2atmo/ and share atmoTheme.js.

import Link from 'next/link'
import { useT } from '../LanguageProvider'
import { ATMO, SECTION_PAD, MAX_W } from './v2atmo/atmoTheme'
import AtmoNav from './v2atmo/AtmoNav'
import ScrollProgressBar from './v2atmo/ScrollProgressBar'
import RevealLine from './v2atmo/RevealLine'
import CountUpNumber from './v2atmo/CountUpNumber'

// =====================================================================
//  STATIC CONTENT — eyebrows / titles / bodies that don't (yet) live in
//  the shared i18n bundle. French is the primary language per CLAUDE.md.
// =====================================================================

const STATS = [
  { label: 'PROPFIRMS SUPPORTÉES', value: '11', suffix: '' },
  { label: 'COÛT POUR DÉMARRER',   value: '$0', suffix: '' },
  { label: 'DONNÉES PRIVÉES',      value: '100', suffix: '%' },
  { label: 'TEMPS DE SETUP',       value: '2', suffix: ' min' },
]

const PILLARS = [
  {
    num: '01',
    title: 'Clarté.',
    body: 'Voir vos comptes comme ils sont, pas comme vous voudriez qu’ils soient. Balance, drawdown, consistency — affichés sans ornement. Pas de gamification, pas de fausse euphorie. La réalité, en chiffres.',
  },
  {
    num: '02',
    title: 'Discipline.',
    body: 'Tracez chaque trade. Mesurez chaque règle. Apprenez de chaque erreur. Un journal qui ne juge pas mais qui vous renvoie votre image — et qui transforme vos décisions en données exploitables.',
  },
  {
    num: '03',
    title: 'Souveraineté.',
    body: 'Vos données. Vos comptes. Aucun intermédiaire. Pas de broker affilié, pas de revente, pas de tracking publicitaire. Quantara est un outil — vous restez propriétaire de votre carrière de trader.',
  },
]

const FEATURES = [
  {
    title: 'Multi-PropFirms',
    body: 'Topstep, Apex, MFFU, Bulenox, Lucid et 6 autres. Suivez tous vos comptes depuis un seul cockpit.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="2" y="2" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="2" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="11" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="11" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: 'Drawdown live',
    body: 'Trailing, EOD ou intraday — la règle exacte de chaque firme appliquée à votre balance en temps réel.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M2 14 L7 9 L11 13 L18 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 4 L18 4 L18 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Journal sans friction',
    body: 'Saisie en 10 secondes, filtres puissants, calendrier PnL, export CSV. Vos trades cessent d’être anecdotiques.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="3" y="2" width="14" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 7h8M6 11h8M6 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Consistency monitor',
    body: 'La règle de cohérence de chaque firme, surveillée jour par jour. Vous saurez avant eux si vous décrochez.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6 L10 10 L13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Calendrier macro',
    body: 'NFP, FOMC, CPI, Powell — codé par impact. Anticipez la volatilité avant qu’elle ne vide vos comptes.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="3" y="4" width="14" height="13" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 8 L17 8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 2 L7 6 M13 2 L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Notifications push',
    body: 'Alertes drawdown proche, échéances de paiement, payouts éligibles — directement sur votre téléphone.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M5 8 a5 5 0 0 1 10 0 v4 l2 2 H3 l2 -2 z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 17 a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Créez un compte en 30 secondes.',
    body: 'Aucune carte bancaire, aucune installation. Email + mot de passe. C’est tout.',
  },
  {
    num: '02',
    title: 'Ajoutez vos comptes PropFirm.',
    body: 'Sélectionnez la firme, le plan, votre balance actuelle. Quantara applique automatiquement les règles de drawdown et de consistency.',
  },
  {
    num: '03',
    title: 'Tradez — et regardez vos chiffres parler.',
    body: 'Journal, analytics, alertes — tout se met à jour à mesure que vous avancez. Votre cockpit s’affine avec vous.',
  },
]

// =====================================================================
//  LAYOUT PRIMITIVES
// =====================================================================

function Eyebrow({ children, style }) {
  return (
    <div style={{
      fontFamily: ATMO.mono,
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: ATMO.accent,
      marginBottom: 24,
      ...style,
    }}>
      {children}
    </div>
  )
}

// SectionTitle — huge italic Fraunces title. Always italic — signature.
function SectionTitle({ children, style }) {
  return (
    <h2 style={{
      fontFamily: ATMO.serif,
      fontStyle: 'italic',
      fontWeight: 400,
      fontSize: 'clamp(40px, 5.5vw, 76px)',
      lineHeight: 1.02,
      letterSpacing: '-0.025em',
      color: ATMO.text,
      margin: 0,
      ...style,
    }}>
      {children}
    </h2>
  )
}

function Section({ children, padding = SECTION_PAD, style }) {
  return (
    <section style={{
      padding,
      position: 'relative',
      ...style,
    }}>
      <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
        {children}
      </div>
    </section>
  )
}

// =====================================================================
//  PAGE
// =====================================================================

export default function LandingPage() {
  const t = useT()

  // Hero headline arrives as "Tous tes comptes PropFirm.\nUn seul dashboard."
  // We respect the \n for the italic line break — splits into two lines.
  const heroLines = String(t('hero.headline') || '').split('\n')

  return (
    <div style={{
      minHeight: '100vh',
      background: ATMO.bg,
      color: ATMO.text,
      fontFamily: ATMO.sans,
      fontSize: 16,
      lineHeight: 1.65,
      overflowX: 'hidden',
      position: 'relative',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    }}>
      {/* Google Fonts — kept inside JSX as instructed; Next will hoist into <head>. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap"
        rel="stylesheet"
      />

      {/* Dot grid background — fades out near the hero so it stays clean. */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        maskImage: 'linear-gradient(to bottom, transparent 0, transparent 320px, black 720px, black 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, transparent 320px, black 720px, black 100%)',
      }} />

      {/* Soft coral halo behind the hero — single warm light source. */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '120vw', height: 900, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 30%, rgba(255, 122, 89, 0.07), transparent 60%)',
      }} />

      <ScrollProgressBar />
      <AtmoNav t={t} />

      {/* =========================================================
          HERO — left-aligned, eyebrow + huge italic headline +
          subtitle + 2 CTAs. The vertical coral line draws on mount.
          ========================================================= */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '180px 28px 140px',
        minHeight: '92vh',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto', width: '100%' }}>
          <RevealLine lineHeight={120}>
            <Eyebrow style={{ color: ATMO.accent }}>
              BETA · PROPFIRM TRADING ANALYTICS
            </Eyebrow>
            <h1 style={{
              fontFamily: ATMO.serif,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(48px, 7.5vw, 120px)',
              lineHeight: 1.0,
              letterSpacing: '-0.025em',
              color: ATMO.text,
              margin: 0,
              maxWidth: 900,
            }}>
              {heroLines.map((line, i) => (
                <span key={i} style={{ display: 'block' }}>{line}</span>
              ))}
            </h1>
            <p style={{
              marginTop: 32,
              fontSize: 19,
              lineHeight: 1.55,
              color: ATMO.text2,
              maxWidth: 620,
              fontFamily: ATMO.sans,
            }}>
              {t('hero.subtitle')}
            </p>
            <div style={{ marginTop: 44, display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/auth?mode=signup" className="atmo-cta-primary" style={primaryCtaStyle}>
                Commencer maintenant
                <span className="atmo-cta-primary-arrow" style={{
                  fontFamily: ATMO.mono, fontSize: 13,
                  transition: `transform 280ms ${ATMO.ease}`,
                }}>→</span>
              </Link>
              <Link href="/demo" className="atmo-link-secondary" style={secondaryLinkStyle}>
                Voir la démo
                <span className="atmo-link-secondary-arrow" style={{
                  fontFamily: ATMO.mono, fontSize: 12,
                  transition: `transform 280ms ${ATMO.ease}`,
                }}>→</span>
              </Link>
            </div>
          </RevealLine>
        </div>
      </section>

      {/* =========================================================
          STATS strip — 4 KPIs, numbers count up on viewport entry.
          ========================================================= */}
      <Section padding="60px 28px 100px" style={{ zIndex: 1 }}>
        <div style={{
          borderTop: `1px solid ${ATMO.hairline}`,
          borderBottom: `1px solid ${ATMO.hairline}`,
          padding: '48px 0',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
        }} className="atmo-stats-row">
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '0 8px',
              borderLeft: i === 0 ? 'none' : `1px solid ${ATMO.hairline}`,
            }} className="atmo-stat-cell">
              <div style={{
                fontFamily: ATMO.mono, fontSize: 10.5, fontWeight: 600,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: ATMO.text3, marginBottom: 14,
              }}>
                {s.label}
              </div>
              <div style={{
                fontFamily: ATMO.mono, fontSize: 'clamp(40px, 4.5vw, 56px)',
                fontWeight: 600, lineHeight: 1, color: ATMO.text,
                fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
              }}>
                <CountUpNumber value={s.value + s.suffix} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* =========================================================
          PILLARS — Trois piliers. Stacked rows with hairlines.
          ========================================================= */}
      <Section style={{ zIndex: 1 }}>
        <RevealLine>
          <Eyebrow>L’APPROCHE</Eyebrow>
          <SectionTitle style={{ marginBottom: 80 }}>Trois piliers.</SectionTitle>
        </RevealLine>
        <div style={{ borderTop: `1px solid ${ATMO.hairline}` }}>
          {PILLARS.map((p, i) => (
            <div key={p.num} style={{
              padding: '56px 0',
              borderBottom: `1px solid ${ATMO.hairline}`,
              display: 'grid',
              gridTemplateColumns: '100px 1fr 1fr',
              gap: 40,
              alignItems: 'baseline',
            }} className="atmo-pillar-row">
              <div style={{
                fontFamily: ATMO.mono, fontSize: 13, fontWeight: 600,
                color: ATMO.accent, letterSpacing: '0.08em',
              }}>
                {p.num}
              </div>
              <h3 style={{
                fontFamily: ATMO.serif, fontStyle: 'italic',
                fontWeight: 400, fontSize: 'clamp(28px, 3.5vw, 44px)',
                lineHeight: 1.05, letterSpacing: '-0.02em',
                color: ATMO.text, margin: 0,
              }}>
                {p.title}
              </h3>
              <p style={{
                fontFamily: ATMO.sans, fontSize: 15.5,
                lineHeight: 1.65, color: ATMO.text2, margin: 0,
              }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* =========================================================
          FEATURES — 2-column grid. Hover lights up coral border.
          ========================================================= */}
      <Section style={{ zIndex: 1 }}>
        <RevealLine>
          <Eyebrow>FONCTIONS</Eyebrow>
          <SectionTitle style={{ marginBottom: 80 }}>
            Tout ce qu’il faut, rien de plus.
          </SectionTitle>
        </RevealLine>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1,
          background: ATMO.hairline,
          border: `1px solid ${ATMO.hairline}`,
        }} className="atmo-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="atmo-feature-card" style={{
              padding: '36px 32px',
              background: ATMO.bg,
              transition: `background 320ms ${ATMO.ease}, box-shadow 320ms ${ATMO.ease}`,
              position: 'relative',
              cursor: 'default',
            }}>
              <div style={{
                color: ATMO.accent,
                marginBottom: 18,
                display: 'inline-flex',
              }}>
                {f.icon}
              </div>
              <h4 style={{
                fontFamily: ATMO.serif, fontStyle: 'italic',
                fontWeight: 500, fontSize: 22,
                lineHeight: 1.2, color: ATMO.text,
                margin: '0 0 10px 0', letterSpacing: '-0.01em',
              }}>
                {f.title}
              </h4>
              <p style={{
                fontFamily: ATMO.sans, fontSize: 14.5,
                lineHeight: 1.6, color: ATMO.text2, margin: 0,
              }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* =========================================================
          HOW IT WORKS — vertical timeline with coral dots + line.
          ========================================================= */}
      <Section style={{ zIndex: 1 }}>
        <RevealLine>
          <Eyebrow>FLOW</Eyebrow>
          <SectionTitle style={{ marginBottom: 80 }}>
            Trois étapes, deux minutes.
          </SectionTitle>
        </RevealLine>
        <div style={{ position: 'relative', paddingLeft: 32 }}>
          {/* Vertical hairline running through all dots. */}
          <span aria-hidden style={{
            position: 'absolute', left: 5, top: 8, bottom: 8,
            width: 1, background: ATMO.hairlineStrong,
          }} />
          {STEPS.map((step, i) => (
            <div key={step.num} style={{
              position: 'relative',
              paddingBottom: i === STEPS.length - 1 ? 0 : 56,
            }}>
              {/* Coral dot anchored to the timeline line. */}
              <span aria-hidden style={{
                position: 'absolute', left: -32, top: 4,
                width: 11, height: 11, borderRadius: '50%',
                background: ATMO.accent,
                boxShadow: `0 0 16px ${ATMO.accentGlow}`,
                border: `2px solid ${ATMO.bg}`,
              }} />
              <div style={{
                fontFamily: ATMO.mono, fontSize: 11.5, fontWeight: 600,
                color: ATMO.accent, letterSpacing: '0.15em',
                marginBottom: 10, textTransform: 'uppercase',
              }}>
                Étape {step.num}
              </div>
              <h3 style={{
                fontFamily: ATMO.serif, fontStyle: 'italic',
                fontWeight: 500, fontSize: 'clamp(24px, 2.8vw, 32px)',
                lineHeight: 1.15, color: ATMO.text,
                margin: '0 0 12px 0', letterSpacing: '-0.015em',
              }}>
                {step.title}
              </h3>
              <p style={{
                fontFamily: ATMO.sans, fontSize: 16,
                lineHeight: 1.6, color: ATMO.text2,
                margin: 0, maxWidth: 640,
              }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* =========================================================
          MANIFESTO — single italic pull quote, centered.
          ========================================================= */}
      <Section padding="180px 28px" style={{ zIndex: 1, textAlign: 'center' }}>
        <RevealLine lineHeight={60}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Eyebrow style={{ color: ATMO.text3 }}>MANIFESTE</Eyebrow>
          </div>
          <blockquote style={{
            fontFamily: ATMO.serif, fontStyle: 'italic',
            fontWeight: 400, fontSize: 'clamp(34px, 5vw, 64px)',
            lineHeight: 1.15, letterSpacing: '-0.02em',
            color: ATMO.text, margin: 0, maxWidth: 900,
            marginInline: 'auto',
          }}>
            Le marché ne récompense pas la chance.
            <br />
            <span style={{ color: ATMO.accent }}>Quantara non plus.</span>
          </blockquote>
        </RevealLine>
      </Section>

      {/* =========================================================
          FINAL CTA — eyebrow + huge italic title + coral button.
          ========================================================= */}
      <Section padding="100px 28px 180px" style={{ zIndex: 1 }}>
        <RevealLine>
          <Eyebrow>COMMENCER</Eyebrow>
          <SectionTitle style={{ marginBottom: 40, maxWidth: 880 }}>
            Vos comptes méritent mieux qu’un tableur.
          </SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginTop: 16 }}>
            <Link href="/auth?mode=signup" className="atmo-cta-primary" style={primaryCtaStyle}>
              Créer mon compte
              <span className="atmo-cta-primary-arrow" style={{
                fontFamily: ATMO.mono, fontSize: 13,
                transition: `transform 280ms ${ATMO.ease}`,
              }}>→</span>
            </Link>
            <div style={{
              fontFamily: ATMO.mono, fontSize: 11, fontWeight: 400,
              letterSpacing: '0.08em', color: ATMO.text3,
              textTransform: 'uppercase',
            }}>
              Pas de carte bancaire · 100% privé
            </div>
          </div>
        </RevealLine>
      </Section>

      {/* =========================================================
          FOOTER — 4 columns of small links + wordmark.
          ========================================================= */}
      <footer style={{
        borderTop: `1px solid ${ATMO.hairline}`,
        padding: '64px 28px 48px',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr repeat(4, 1fr)',
            gap: 40,
            marginBottom: 48,
          }} className="atmo-footer-grid">
            <div>
              <div style={{
                fontFamily: ATMO.serif, fontStyle: 'italic',
                fontWeight: 500, fontSize: 22, color: ATMO.text,
                letterSpacing: '-0.01em', marginBottom: 12,
              }}>
                Quantara
              </div>
              <div style={{
                fontFamily: ATMO.sans, fontSize: 13,
                lineHeight: 1.6, color: ATMO.text3, maxWidth: 240,
              }}>
                PropFirm trading analytics. Conçu pour les traders qui prennent leur métier au sérieux.
              </div>
            </div>
            <FooterCol title="Produit" links={[
              ['Démo', '/demo'],
              ['Tarifs', '/pricing'],
              ['Comparateur', '/compare'],
              ['Simulateur DD', '/tools/drawdown-simulator'],
            ]} />
            <FooterCol title="Ressources" links={[
              ['Documentation', '/docs'],
              ['Guides', '/guides'],
              ['PropFirms', '/firms'],
              ['Statut', '/status'],
            ]} />
            <FooterCol title="Entreprise" links={[
              ['À propos', '/about'],
              ['Contact', '/contact'],
              ['Sécurité', '/security'],
              ['Intégrations', '/integrations'],
            ]} />
            <FooterCol title="Légal" links={[
              ['Confidentialité', '/legal/privacy'],
              ['CGU', '/legal/terms'],
              ['Mentions', '/legal/imprint'],
            ]} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 28,
            borderTop: `1px solid ${ATMO.hairline}`,
            fontFamily: ATMO.mono, fontSize: 11,
            color: ATMO.text3, letterSpacing: '0.08em',
            textTransform: 'uppercase',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div>© {new Date().getFullYear()} Quantara Technologies LLC</div>
            <div>Albuquerque, NM · USA</div>
          </div>
        </div>
      </footer>

      {/* =========================================================
          Global keyframes + interactions for this variant.
          ========================================================= */}
      <style>{`
        @keyframes atmoCoralPulse {
          0%, 100% { box-shadow: 0 0 0 0 ${ATMO.accentGlow}; }
          50%       { box-shadow: 0 0 28px 4px ${ATMO.accentGlow}; }
        }
        .atmo-cta-primary:hover {
          background: #ff8d70 !important;
          box-shadow: 0 0 32px 2px ${ATMO.accentGlow}, 0 8px 24px rgba(255, 122, 89, 0.22) !important;
          transform: translateY(-1px);
        }
        .atmo-cta-primary:hover .atmo-cta-primary-arrow { transform: translateX(4px); }
        .atmo-cta-primary {
          animation: atmoCoralPulse 2.5s ${ATMO.ease} infinite;
        }
        .atmo-link-secondary:hover { color: ${ATMO.accent} !important; }
        .atmo-link-secondary:hover .atmo-link-secondary-arrow { transform: translateX(4px); }
        .atmo-feature-card:hover {
          background: rgba(20, 25, 40, 0.55) !important;
          box-shadow: inset 0 0 0 1px ${ATMO.accent}, 0 0 32px ${ATMO.accentGlow};
        }
        .atmo-footer-link:hover { color: ${ATMO.text} !important; }

        /* Smaller viewports — collapse the dense grids gracefully. */
        @media (max-width: 900px) {
          .atmo-stats-row { grid-template-columns: repeat(2, 1fr) !important; gap: 40px !important; }
          .atmo-stat-cell { border-left: none !important; }
          .atmo-pillar-row {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .atmo-features-grid { grid-template-columns: 1fr !important; }
          .atmo-footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 520px) {
          .atmo-footer-grid { grid-template-columns: 1fr !important; }
        }

        /* Honour reduced motion globally — kill the pulse + arrow slides. */
        @media (prefers-reduced-motion: reduce) {
          .atmo-cta-primary { animation: none !important; }
          .atmo-cta-primary-arrow,
          .atmo-link-secondary-arrow,
          .atmo-cta-arrow { transition: none !important; }
        }
      `}</style>
    </div>
  )
}

// =====================================================================
//  SHARED BUTTON / LINK STYLES (keep next to the component that owns them).
// =====================================================================

const primaryCtaStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 10,
  padding: '14px 28px',
  fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
  color: '#0a0e1a',
  background: ATMO.accent,
  border: 'none',
  borderRadius: 999,
  textDecoration: 'none',
  letterSpacing: '0.005em',
  transition: `background 220ms ${ATMO.ease}, box-shadow 220ms ${ATMO.ease}, transform 220ms ${ATMO.ease}`,
  cursor: 'pointer',
}

const secondaryLinkStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
  color: ATMO.text2,
  textDecoration: 'none',
  transition: `color 220ms ${ATMO.ease}`,
}

// FooterCol — column of links with a small uppercase header.
function FooterCol({ title, links }) {
  return (
    <div>
      <div style={{
        fontFamily: ATMO.mono, fontSize: 10.5, fontWeight: 600,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: ATMO.text3, marginBottom: 18,
      }}>
        {title}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="atmo-footer-link" style={{
              fontFamily: ATMO.sans, fontSize: 13.5,
              color: ATMO.text2, textDecoration: 'none',
              transition: `color 200ms ${ATMO.ease}`,
            }}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
