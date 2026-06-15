// /landing/clickfunded — Concept #7 (v3), reproduction fidèle du style ClickFunded
// (vu via la vidéo envoyée) : fond NOIR, accent ORANGE/AMBRE, layout centré
// minimaliste, pill countdown, titre bicolore, 3 stats encadrées de lauriers,
// checklist + capture email, rangée sociale, accents d'angle. Adapté Quantara.
//
// Standalone, server component, CSS-only. Fonts self-hosted via next/font (CSP-ok).
// Preview dev uniquement, jamais mergé sur main.

import { Sora, Manrope } from 'next/font/google'

const display = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-display', display: 'swap' })
const body = Manrope({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' })

const C = {
  bg: '#050505',
  text: '#f6f4ef',
  text2: '#9b958a',
  text3: '#6a655d',
  amber: '#ef9a3a',
  amberLt: '#f7bd66',
  amberDk: '#d97f24',
  green: '#37c98a',
  line: 'rgba(245,180,90,0.22)',
  lineN: 'rgba(255,255,255,0.10)',
}
const GOLD = 'linear-gradient(180deg, #f9c877 0%, #ef9a3a 55%, #d97f24 100%)'

// ── Laurier (branche), miroir pour le côté droit ──
function Laurel({ flip = false }) {
  return (
    <svg width="24" height="56" viewBox="0 0 24 56" aria-hidden style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
      <path d="M18 4 C 8 16, 6 36, 13 52" fill="none" stroke="rgba(247,189,102,0.6)" strokeWidth="1.4" strokeLinecap="round" />
      {[[16, 10, -38], [13.5, 18, -30], [11.5, 27, -20], [11, 36, -8], [12, 45, 6]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx="5.5" ry="2.3" transform={`rotate(${r} ${x} ${y})`} fill="rgba(247,189,102,0.5)" />
      ))}
    </svg>
  )
}

function Stat({ big, small, gold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Laurel />
      <div style={{ textAlign: 'center', minWidth: 96, padding: '0 2px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: gold ? 17 : 22, lineHeight: 1.05, color: gold ? C.amberLt : C.text, letterSpacing: '-0.01em' }}>{big}</div>
        <div style={{ fontSize: 10.5, color: C.text2, marginTop: 5, lineHeight: 1.3 }}>{small}</div>
      </div>
      <Laurel flip />
    </div>
  )
}

const Dot = ({ c }) => <span style={{ width: 8, height: 8, borderRadius: 99, background: c, flexShrink: 0, boxShadow: `0 0 8px ${c}` }} />

function SocialIcon({ d }) {
  return (
    <a href="#" aria-label="social" style={{ color: C.text2, display: 'inline-flex', transition: 'color .15s' }} className="cf-soc">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>
    </a>
  )
}

export default function ClickfundedLanding() {
  return (
    <div className={`${display.variable} ${body.variable}`} style={{ background: C.bg, color: C.text, minHeight: '100vh', fontFamily: 'var(--font-body)', overflowX: 'hidden', position: 'relative' }}>
      <style>{`
        .cf-bg{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
        .cf-glow{position:absolute;border-radius:50%;filter:blur(120px)}
        .cf-glow-top{width:760px;height:520px;left:50%;top:-220px;transform:translateX(-50%);background:radial-gradient(ellipse at center, rgba(239,154,58,.18), transparent 70%);animation:cfBreathe 8s ease-in-out infinite}
        .cf-glow-low{width:620px;height:420px;left:50%;top:46%;transform:translateX(-50%);background:radial-gradient(ellipse at center, rgba(239,154,58,.08), transparent 70%);animation:cfBreathe 11s ease-in-out infinite reverse}
        .cf-grain{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:160px}
        .cf-corner{position:fixed;width:120px;height:120px;z-index:1;pointer-events:none;border-color:${C.line};opacity:.7}
        .cf-tl{top:18px;left:18px;border-top:1px solid;border-left:1px solid;border-top-left-radius:4px}
        .cf-tr{top:18px;right:18px;border-top:1px solid;border-right:1px solid;border-top-right-radius:4px}
        .cf-bl{bottom:18px;left:18px;border-bottom:1px solid;border-left:1px solid;border-bottom-left-radius:4px}
        .cf-br{bottom:18px;right:18px;border-bottom:1px solid;border-right:1px solid;border-bottom-right-radius:4px}

        @keyframes cfBreathe{0%,100%{opacity:.65}50%{opacity:1}}
        @keyframes cfRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .cf-rise{animation:cfRise .8s cubic-bezier(.2,.7,.2,1) both}

        .cf-pill{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:${C.amberLt};
          border:1px solid ${C.line};border-radius:99px;padding:7px 15px;background:rgba(239,154,58,.06);
          box-shadow:0 0 22px rgba(239,154,58,.14), inset 0 0 12px rgba(239,154,58,.05)}
        .cf-badge{display:inline-flex;align-items:center;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;
          color:${C.text2};border:1px solid ${C.lineN};border-radius:99px;padding:6px 16px;background:rgba(255,255,255,.02)}
        .cf-input{background:rgba(255,255,255,.04);border:1px solid ${C.lineN};border-radius:11px;padding:13px 15px;color:${C.text};font-size:14px;font-family:inherit;width:100%;outline:none;transition:border-color .15s}
        .cf-input:focus{border-color:${C.amber}}
        .cf-input::placeholder{color:${C.text3}}
        .cf-join{background:${GOLD};color:#1b1206;font-weight:700;border:none;border-radius:11px;padding:13px 22px;font-size:14px;cursor:pointer;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;box-shadow:0 8px 26px rgba(239,154,58,.35), inset 0 1px 0 rgba(255,255,255,.45);transition:transform .16s ease, box-shadow .16s ease}
        .cf-join:hover{transform:translateY(-1px);box-shadow:0 12px 34px rgba(239,154,58,.5), inset 0 1px 0 rgba(255,255,255,.45)}
        .cf-soc:hover{color:${C.amberLt}}
        h1,h2{font-family:var(--font-display)}
        @media(prefers-reduced-motion:reduce){.cf-glow-top,.cf-glow-low,.cf-rise{animation:none !important}}
        @media(max-width:760px){
          .cf-h1{font-size:42px !important}
          .cf-stats{flex-direction:column !important;gap:18px !important}
          .cf-bottom{grid-template-columns:1fr !important;gap:30px !important}
        }
      `}</style>

      {/* FOND */}
      <div className="cf-bg" aria-hidden>
        <div className="cf-glow cf-glow-top" />
        <div className="cf-glow cf-glow-low" />
      </div>
      <div className="cf-grain" aria-hidden />
      <div className="cf-corner cf-tl" aria-hidden />
      <div className="cf-corner cf-tr" aria-hidden />
      <div className="cf-corner cf-bl" aria-hidden />
      <div className="cf-corner cf-br" aria-hidden />

      {/* CONTENU */}
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Logo centré en haut */}
        <div style={{ padding: '26px 0 0', textAlign: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: GOLD, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(239,154,58,.4)' }}>
              <span style={{ color: '#1b1206', fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-display)' }}>Q</span>
            </span>
            <span style={{ fontWeight: 700, letterSpacing: '0.06em', fontSize: 14 }}>Quantara</span>
          </span>
        </div>

        {/* HERO centré */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 24px 60px', maxWidth: 760, margin: '0 auto', width: '100%' }}>
          <div className="cf-pill cf-rise" style={{ animationDelay: '.05s' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg>
            Offre early · −50% à vie
          </div>

          <div className="cf-badge cf-rise" style={{ animationDelay: '.1s', marginTop: 18 }}>Le cockpit des traders PropFirm</div>

          <h1 className="cf-h1 cf-rise" style={{ animationDelay: '.16s', fontSize: 64, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.02, margin: '22px 0 30px' }}>
            <span style={{ background: GOLD, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Financé.</span>{' '}
            <span style={{ color: C.text }}>En un coup d&apos;œil.</span>
          </h1>

          {/* 3 stats + lauriers */}
          <div className="cf-stats cf-rise" style={{ animationDelay: '.24s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, marginBottom: 40 }}>
            <Stat big="11" small={<>PropFirms<br />supportées</>} />
            <Stat big="0 €" small={<>pendant<br />la beta</>} />
            <Stat gold big={<>Multi-firmes.</>} small={<>Un seul dashboard.</>} />
          </div>

          {/* Bas : checklist + capture email */}
          <div className="cf-bottom" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', width: '100%', maxWidth: 620, textAlign: 'left', marginTop: 6 }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['Suivi drawdown automatique', C.amber], ['Consistency & payouts en temps réel', C.amber], ['Gratuit pendant toute la beta', C.green]].map(([t, c], i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: C.text2 }}>
                  <Dot c={c} /> {t}
                </li>
              ))}
            </ul>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: C.text }}>Rejoins la beta gratuite</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="cf-input" placeholder="email@exemple.com" aria-label="email" />
                <a className="cf-join" href="/auth?mode=signup">Commencer</a>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="cf-rise" style={{ animationDelay: '.34s', marginTop: 48, display: 'flex', alignItems: 'center', gap: 14, color: C.text3 }}>
            <span style={{ fontSize: 12 }}>Suivez-nous</span>
            <SocialIcon d="M20.3 4.4A19 19 0 0 0 15.7 3l-.2.5a17 17 0 0 1 4 1.3 13 13 0 0 0-11 0 17 17 0 0 1 4-1.3L12.3 3a19 19 0 0 0-4.6 1.4C4.3 9.5 3.4 14.5 3.8 19.4a19 19 0 0 0 5.8 2.9l.6-1a12 12 0 0 1-2-1l.5-.4a13 13 0 0 0 11 0l.5.4a12 12 0 0 1-2 1l.6 1a19 19 0 0 0 5.8-2.9c.5-5.7-.8-10.6-3.9-15zM9.5 16c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm5 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z" />
            <SocialIcon d="M18.2 2H21l-6.6 7.6L22 22h-6l-4.7-6.2L5.9 22H3l7-8L2 2h6.2l4.3 5.7L18.2 2zm-1 18h1.6L7.8 3.7H6.1L17.2 20z" />
            <SocialIcon d="M12 2.2c3.2 0 3.6 0 4.9.07 3.3.15 4.8 1.7 5 5 .06 1.3.07 1.6.07 4.8s0 3.5-.07 4.8c-.15 3.3-1.7 4.8-5 5-1.3.06-1.6.07-4.9.07s-3.6 0-4.9-.07c-3.3-.15-4.8-1.7-5-5C2.04 15.5 2 15.2 2 12s0-3.5.07-4.8c.15-3.3 1.7-4.8 5-5C8.4 2.2 8.8 2.2 12 2.2zm0 3.2A6.6 6.6 0 1 0 12 18.6 6.6 6.6 0 0 0 12 5.4zm0 10.9A4.3 4.3 0 1 1 12 7.7a4.3 4.3 0 0 1 0 8.6zm6.8-11.2a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
            <SocialIcon d="M23 7.5a3 3 0 0 0-2.1-2.1C19 4.8 12 4.8 12 4.8s-7 0-8.9.6A3 3 0 0 0 1 7.5 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.5a3 3 0 0 0 2.1 2.1c1.9.6 8.9.6 8.9.6s7 0 8.9-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.5 12 31 31 0 0 0 23 7.5zM9.8 15.3V8.7l5.7 3.3-5.7 3.3z" />
          </div>
        </div>
      </div>
    </div>
  )
}
