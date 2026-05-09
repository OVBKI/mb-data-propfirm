import Link from 'next/link'
import Logo from '../components/Logo'
import Reveal from '../components/Reveal'
import Counter from '../components/Counter'
import DashboardPreview from '../components/DashboardPreview'
import Footer from '../components/Footer'

export const metadata = {
  title: 'Quantara — Track. Analyze. Grow.',
  description: 'Suis tes PropFirms, journalise tes trades, garde l\'œil sur ton drawdown trailing et ta consistency. Quantara : Track. Analyze. Grow.',
}

// Styles inline pour rester cohérent avec le reste de l'app
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
    icon: '📊',
    title: 'Suivi multi-PropFirms',
    desc: 'Topstep, Apex, Bulenox, Lucid, Tradeify, MFFU, Phidias, TPT — gère tous tes comptes en un seul endroit avec leurs règles spécifiques pré-configurées.',
  },
  {
    icon: '📔',
    title: 'Journal manuel détaillé',
    desc: 'Saisie rapide de chaque trade : date, instrument, side, PnL, notes. Calendrier visuel mensuel coloré vert/rouge selon ton PnL journalier.',
  },
  {
    icon: '📈',
    title: 'Courbes de balance live',
    desc: 'Visualise l\'évolution de chaque compte avec ligne de drawdown trailing intelligente : suit ton balance peak et se fige automatiquement au balance initial.',
  },
  {
    icon: '🎯',
    title: 'Consistency tracking',
    desc: 'Mesure ta régularité avec le ratio meilleur jour / total des gains. Critère essentiel pour valider tes payouts (la plupart des firmes exigent < 40%).',
  },
  {
    icon: '📅',
    title: 'Calendrier économique',
    desc: 'Annonces ForexFactory en temps réel, traduites en français/espagnol. Filtre par devise, par impact (NFP, FOMC, CPI...). Anticipe la volatilité.',
  },
  {
    icon: '💰',
    title: 'Payouts & ROI',
    desc: 'Suis chaque payout reçu, calcule ton ROI réel par firme, exporte en CSV. Sache exactement ce que chaque PropFirm te rapporte (ou te coûte).',
  },
]

const STEPS = [
  {
    n: 1,
    title: 'Crée ton compte',
    desc: 'Inscription en 30 secondes. Aucune carte bancaire requise — l\'outil reste gratuit pendant la beta.',
  },
  {
    n: 2,
    title: 'Configure tes PropFirms',
    desc: 'Ajoute tes firmes (Topstep, Apex...) et tes comptes avec le plan correspondant (50K, 100K...). Les règles DD sont déjà connues.',
  },
  {
    n: 3,
    title: 'Trade & analyse',
    desc: 'Saisis tes trades chaque jour, surveille ton drawdown sur le graphique, et améliore ta consistency pour décrocher tes payouts.',
  },
]

const STATS = [
  { v: '8', l: 'PropFirms supportées' },
  { v: '∞', l: 'Comptes par utilisateur' },
  { v: '3', l: 'Langues (FR/EN/ES)' },
  { v: '100%', l: 'Tes données t\'appartiennent' },
]

function Btn({ href, primary, children, large }) {
  const padding = large ? '14px 28px' : '10px 20px'
  const fontSize = large ? '15px' : '13px'
  const style = primary
    ? {
        background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.blueLight} 100%)`,
        color: '#fff',
        boxShadow: '0 4px 14px rgba(45,111,255,0.35)',
      }
    : {
        background: 'transparent',
        color: colors.text,
        border: `1px solid ${colors.border2}`,
      }
  return (
    <Link href={href} className="lp-btn" style={{
      display: 'inline-block',
      padding,
      fontSize,
      fontWeight: 600,
      borderRadius: 99,
      textDecoration: 'none',
      ...style,
    }}>{children}</Link>
  )
}

export default function Landing() {
  return (
    <div style={{ background: colors.bg, color: colors.text, minHeight: '100vh', overflow: 'hidden' }}>
      {/* === Top nav === */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(13,15,20,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div className="lp-nav" style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: colors.text }}>
            <Logo size={52} glow="strong" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1, letterSpacing: '0.08em' }}>QUANTARA</div>
              <div style={{ fontSize: 10, color: colors.text3, marginTop: 3, letterSpacing: '0.05em' }}>TRACK · ANALYZE · GROW</div>
            </div>
          </Link>
          <nav className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#features" style={{ fontSize: 13, color: colors.text2, textDecoration: 'none' }}>Fonctionnalités</a>
            <a href="#how" style={{ fontSize: 13, color: colors.text2, textDecoration: 'none' }}>Comment ça marche</a>
            <a href="#why" style={{ fontSize: 13, color: colors.text2, textDecoration: 'none' }}>Pourquoi Quantara</a>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Btn href="/app">Se connecter</Btn>
            <Btn href="/app" primary>Commencer →</Btn>
          </div>
        </div>
      </header>

      {/* === HERO === */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Halo gradient animé en fond */}
        <div className="lp-halo-animated" style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(45,111,255,0.18), transparent 60%)`,
          pointerEvents: 'none',
        }} />
        <div className="lp-hero" style={{
          maxWidth: 1100, margin: '0 auto',
          padding: '96px 24px 80px',
          textAlign: 'center', position: 'relative', zIndex: 1,
        }}>
          <div className="lp-anim-fadeDown lp-anim-pulse" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 99,
            background: 'rgba(45,111,255,0.10)', border: `1px solid ${colors.blue}`,
            fontSize: 12, fontWeight: 600, color: colors.blueLight,
            marginBottom: 24,
          }}>
            <span className="lp-anim-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: colors.green }} />
            Beta gratuite — Plus de 8 PropFirms supportées
          </div>
          <h1 className="lp-h1 lp-anim-fadeUp lp-delay-1" style={{
            fontSize: 'clamp(32px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.05,
            marginBottom: 20, letterSpacing: '-0.02em',
          }}>
            Journalise tes trades,<br />
            <span className="lp-gradient-text">débloque tes payouts.</span>
          </h1>
          <p className="lp-anim-fadeUp lp-delay-2" style={{
            fontSize: 'clamp(15px, 2vw, 18px)', color: colors.text2,
            maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.55,
          }}>
            Le tableau de bord pensé pour les traders prop. Suis tes drawdowns trailing en temps réel,
            mesure ta consistency, et garde une vision claire sur tes performances par PropFirm.
          </p>
          <div className="lp-anim-fadeUp lp-delay-3" style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Btn href="/app" primary large>🚀 Commencer maintenant</Btn>
            <Btn href="#features" large>Voir les fonctionnalités</Btn>
          </div>

          {/* Mockup card simulé — floating */}
          <div className="lp-mockup lp-anim-fadeUp lp-delay-4 lp-mockup-float" style={{
            marginTop: 64, position: 'relative',
            background: colors.surface, border: `1px solid ${colors.border2}`,
            borderRadius: 16, padding: 14, maxWidth: 980, margin: '64px auto 0',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(45,111,255,0.1)',
          }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            </div>
            <div style={{ background: colors.bg, borderRadius: 10, padding: 24, minHeight: 320 }}>
              {/* Mini stats grid */}
              <div className="lp-mockup-stats" style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18,
              }}>
                {[
                  { l: 'Balance', v: '$52,345', c: colors.green },
                  { l: 'PnL filtré', v: '+$2,345', c: colors.green },
                  { l: 'Win rate', v: '64%', c: colors.green },
                  { l: 'Consistency', v: '28%', c: colors.green },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: colors.surface, border: `1px solid ${colors.border}`,
                    borderRadius: 10, padding: 12,
                  }}>
                    <div style={{ fontSize: 10, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>{s.l}</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>
              {/* Mini calendrier */}
              <div className="lp-mockup-cal" style={{
                background: colors.surface, border: `1px solid ${colors.border}`,
                borderRadius: 10, padding: 14,
              }}>
                <div style={{ fontSize: 12, color: colors.text2, marginBottom: 10, fontWeight: 600 }}>📅 Calendrier PnL — Avril 2026</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {[
                    null, null, { v: '+$340', g: 1 }, { v: '+$120', g: 1 }, { v: '-$85', g: -1 }, null, null,
                    null, { v: '+$520', g: 1 }, { v: '+$180', g: 1 }, null, { v: '+$240', g: 1 }, null, null,
                    null, { v: '-$140', g: -1 }, { v: '+$420', g: 1 }, { v: '+$95', g: 1 }, { v: '+$310', g: 1 }, null, null,
                  ].map((d, i) => (
                    <div key={i} style={{
                      height: 38, borderRadius: 6,
                      background: !d ? 'transparent' : d.g > 0 ? 'rgba(29,184,122,0.15)' : 'rgba(232,80,74,0.15)',
                      border: !d ? `1px solid ${colors.border}` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700,
                      color: !d ? colors.text3 : d.g > 0 ? colors.green : colors.red,
                    }}>{d?.v || ''}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === Stats bar === */}
      <section style={{ padding: '40px 24px', borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
        <div className="lp-stats" style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, textAlign: 'center',
        }}>
          {STATS.map((s, i) => {
            // On parse la valeur pour animer si c'est un nombre
            const numMatch = String(s.v).match(/^(\d+)(.*)$/)
            const isNumeric = numMatch && !s.v.startsWith('∞')
            const numValue = isNumeric ? parseInt(numMatch[1], 10) : null
            const suffix = isNumeric ? numMatch[2] : ''
            return (
              <Reveal key={i} delay={i * 100}>
                <div>
                  <div style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, background: `linear-gradient(135deg, ${colors.blueLight} 0%, ${colors.green} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {isNumeric
                      ? <Counter to={numValue} suffix={suffix} duration={1400} />
                      : s.v}
                  </div>
                  <div style={{ fontSize: 12, color: colors.text2, marginTop: 4 }}>{s.l}</div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* === Aperçu dashboard === */}
      <DashboardPreview />

      {/* === Features grid === */}
      <section id="features" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.blueLight, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>FONCTIONNALITÉS</div>
              <h2 className="lp-h2" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.01em' }}>
                Tout ce qu'il te faut pour <span style={{ color: colors.green }}>réussir</span> tes challenges
              </h2>
              <p style={{ fontSize: 16, color: colors.text2, maxWidth: 600, margin: '0 auto', lineHeight: 1.5 }}>
                Conçu par des traders prop, pour des traders prop. Pas de fonctionnalités gadget : juste ce qui compte.
              </p>
            </div>
          </Reveal>
          <div className="lp-features" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20,
          }}>
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{
                  background: colors.surface, border: `1px solid ${colors.border}`,
                  borderRadius: 16, padding: 28,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'rgba(45,111,255,0.10)', border: `1px solid ${colors.blue}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, marginBottom: 18,
                  }}>{f.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: colors.text2, lineHeight: 1.55 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* === How it works === */}
      <section id="how" style={{ padding: '96px 24px', background: colors.surface, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.green, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>EN 3 ÉTAPES</div>
              <h2 className="lp-h2" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.01em' }}>
                Démarre en moins de <span style={{ color: colors.blueLight }}>2 minutes</span>
              </h2>
            </div>
          </Reveal>
          <div className="lp-steps" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24,
          }}>
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 150}>
                <div style={{
                  background: colors.bg, border: `1px solid ${colors.border}`,
                  borderRadius: 16, padding: 28, position: 'relative',
                }}>
                  <div className="lp-anim-pulse" style={{
                    position: 'absolute', top: -18, left: 28,
                    width: 36, height: 36, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.blueLight} 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 16, color: '#fff',
                  }}>{s.n}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 14, marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: colors.text2, lineHeight: 1.55 }}>{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* === Why Quantara === */}
      <section id="why" style={{ padding: '96px 24px' }}>
        <div className="lp-why" style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center',
        }}>
          <Reveal>
            <div style={{ fontSize: 12, fontWeight: 700, color: colors.amber, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>POURQUOI QUANTARA</div>
            <h2 className="lp-h2" style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, marginBottom: 24, letterSpacing: '-0.01em' }}>
              Conçu pour les <span style={{ color: colors.amber }}>vraies</span> contraintes des PropFirms
            </h2>
            <p style={{ fontSize: 15, color: colors.text2, lineHeight: 1.6, marginBottom: 24 }}>
              Les outils génériques ne comprennent pas les nuances : trailing drawdown qui se fige au balance initial,
              consistency rule, plans variables (50K, 100K, 150K), payouts mensuels…
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Drawdown trailing intelligent (suit ton peak puis se fige)',
                'Règles préchargées pour Topstep, Apex, Bulenox, Lucid, MFFU…',
                'Consistency calculée automatiquement',
                'Calendrier économique intégré (FR/EN/ES)',
                'Multi-comptes, multi-firmes, payouts trackés',
                'Mobile-friendly : suis tes trades depuis ton téléphone',
              ].map((item, i) => (
                <li key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '8px 0', fontSize: 14, color: colors.text,
                }}>
                  <span style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                    background: 'rgba(29,184,122,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: colors.green, fontWeight: 700,
                  }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={200} style={{
            background: colors.surface, border: `1px solid ${colors.border2}`,
            borderRadius: 16, padding: 24,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: 12, color: colors.text3, marginBottom: 8 }}>📈 Lucid 50K · Plan trailing</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: colors.green, marginBottom: 4 }}>$51,500</div>
            <div style={{ fontSize: 12, color: colors.green, marginBottom: 18 }}>+$1,500 (+3.00%)</div>
            <svg viewBox="0 0 300 120" style={{ width: '100%', height: 'auto' }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.green} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={colors.green} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 0 80 L 60 60 L 120 50 L 180 35 L 240 25 L 300 20 L 300 120 L 0 120 Z" fill="url(#g1)" />
              <path d="M 0 80 L 60 60 L 120 50 L 180 35 L 240 25 L 300 20" stroke={colors.green} strokeWidth="2" fill="none" />
              {/* DD trailing line stepped */}
              <path d="M 0 95 L 60 95 L 60 88 L 120 88 L 120 80 L 180 80 L 180 70 L 240 70 L 240 70 L 300 70" stroke={colors.red} strokeWidth="1.5" fill="none" strokeDasharray="4,3" />
            </svg>
            <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11, color: colors.text2, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 2, background: colors.green }} />Balance
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 2, background: colors.red, borderTop: `1px dashed ${colors.red}` }} />DD trailing → balance initial
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* === CTA final === */}
      <section style={{ padding: '96px 24px', position: 'relative', overflow: 'hidden' }}>
        <div className="lp-halo-animated" style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, rgba(45,111,255,0.20), transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <Reveal style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <h2 className="lp-h2" style={{
            fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, marginBottom: 18, letterSpacing: '-0.01em', lineHeight: 1.1,
          }}>
            Prêt à reprendre le contrôle<br />de ton <span className="lp-gradient-text">trading prop</span> ?
          </h2>
          <p style={{ fontSize: 16, color: colors.text2, marginBottom: 32, lineHeight: 1.5 }}>
            Inscription gratuite. Aucune carte bancaire. Tes données restent privées.
          </p>
          <Btn href="/app" primary large>🚀 Commencer maintenant — c'est gratuit</Btn>
        </Reveal>
      </section>

      {/* === Footer pro (composant partagé avec /security, /docs, /integrations) === */}
      <Footer />
    </div>
  )
}
