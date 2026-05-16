// Mockup landing — vibe Stripe / Plaid / Bloomberg.
// Page TEST isolée, accessible via /mockup. PAS indexée.
// Si validée → on l'applique à la vraie landing. Sinon → on jette.

export const metadata = {
  title: 'Mockup — Quantara',
  robots: { index: false, follow: false },
}

// === Palette restreinte (Stripe DNA: peu de couleurs, beaucoup de gris) ===
const c = {
  bg: '#0a0c10',           // fond très sombre
  surface: '#11141b',      // cards
  surface2: '#171a22',     // cards hover / nested
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.16)',
  text: '#f0f1f5',
  text2: '#a0a8b8',
  text3: '#5a6275',
  accent: '#2d6fff',
  accentSoft: 'rgba(45,111,255,0.12)',
  green: '#10b981',
  red: '#ef4444',
  amber: '#fac775',
}

const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'
const sans = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'

export default function Mockup() {
  return (
    <div style={{
      minHeight: '100vh',
      background: c.bg,
      color: c.text,
      fontFamily: sans,
      position: 'relative',
      overflow: 'hidden',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    }}>
      {/* Background pattern : trame de points TRÈS subtile (Stripe DNA) */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: `radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        opacity: 0.4,
        pointerEvents: 'none',
      }} />

      {/* Halo gradient en haut (très soft) */}
      <div style={{
        position: 'absolute',
        top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '1100px', height: '600px',
        background: `radial-gradient(ellipse at center top, rgba(45,111,255,0.15), transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* === TOP NAV === */}
      <header style={{
        position: 'relative', zIndex: 10,
        padding: '20px 32px',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            <div style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em' }}>
              Quantara
            </div>
            <nav style={{ display: 'flex', gap: 28, fontSize: 14, color: c.text2 }}>
              <a href="#" style={navLink}>Produit</a>
              <a href="#" style={navLink}>PropFirms</a>
              <a href="#" style={navLink}>Tarifs</a>
              <a href="#" style={navLink}>Docs</a>
            </nav>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <a href="#" style={{ color: c.text2, fontSize: 14, textDecoration: 'none' }}>
              Se connecter
            </a>
            <a href="#" style={btnPrimary}>
              Commencer →
            </a>
          </div>
        </div>
      </header>

      {/* === HERO === */}
      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: 980, margin: '0 auto',
        padding: '100px 32px 120px',
        textAlign: 'center',
      }}>
        {/* Badge BETA */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px',
          background: c.accentSoft,
          border: `1px solid rgba(45,111,255,0.25)`,
          borderRadius: 99,
          fontSize: 12, fontWeight: 500, color: '#7fa9ff',
          marginBottom: 36,
          fontFamily: mono, letterSpacing: '0.05em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.green }} />
          BETA · GRATUIT
        </div>

        <h1 style={{
          fontSize: 'clamp(40px, 7vw, 76px)',
          fontWeight: 600, letterSpacing: '-0.035em', lineHeight: 1.02,
          marginBottom: 28,
        }}>
          Le journal de trading<br />
          pour traders <span style={{
            background: `linear-gradient(135deg, #ffffff 25%, ${c.accent} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>PropFirm futures.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 1.6vw, 19px)',
          color: c.text2, maxWidth: 580,
          margin: '0 auto 44px', lineHeight: 1.55,
        }}>
          Suis drawdowns, payouts et consistency sur Topstep, Apex, Lucid et 5 autres
          PropFirms. Conçu par des traders prop, pour des traders prop.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#" style={btnPrimaryLarge}>Commencer gratuitement →</a>
          <a href="#" style={btnGhostLarge}>Voir la démo</a>
        </div>

        {/* Trust row monospace */}
        <div style={{
          marginTop: 72,
          display: 'flex', justifyContent: 'center', gap: 28,
          fontSize: 11, color: c.text3,
          fontFamily: mono,
          letterSpacing: '0.12em',
          flexWrap: 'wrap',
        }}>
          <span>8 PROPFIRMS</span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span>SANS CARTE BANCAIRE</span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span>FR · EN · ES</span>
        </div>
      </section>

      {/* === LIVE DATA SAMPLE (Stripe code-box DNA appliqué à du data trader) === */}
      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1100, margin: '0 auto 140px',
        padding: '0 32px',
      }}>
        <div style={{
          background: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
        }}>
          {/* Window chrome */}
          <div style={{
            padding: '12px 18px',
            background: c.surface2,
            borderBottom: `1px solid ${c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={dot('#ff5f57')} />
              <span style={dot('#febc2e')} />
              <span style={dot('#28c840')} />
            </div>
            <div style={{ fontSize: 12, color: c.text3, fontFamily: mono }}>
              quantara.tech/app
            </div>
            <div style={{ width: 50 }} />
          </div>

          {/* Header de la "table" */}
          <div style={{
            padding: '20px 24px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${c.border}`,
          }}>
            <div>
              <div style={{
                fontSize: 11, color: c.text3, letterSpacing: '0.12em',
                fontFamily: mono, marginBottom: 4,
              }}>
                COMPTES PROPFIRM · LIVE
              </div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Vue d'ensemble</div>
            </div>
            <div style={{
              fontSize: 11, color: c.text3, fontFamily: mono,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.green }} />
              SYNC · IL Y A 2S
            </div>
          </div>

          {/* Rows */}
          <div>
            {[
              { firm: 'TOPSTEP', plan: '50K',  bal: '+$2,340', dd: '$1,250',  cons: '28%', days: '5/15',  status: 'OK',     color: c.green },
              { firm: 'APEX',    plan: '100K', bal: '+$3,820', dd: '$2,400',  cons: '34%', days: '8/30',  status: 'OK',     color: c.green },
              { firm: 'LUCID',   plan: '50K',  bal: '-$340',   dd: '$1,900',  cons: '—',   days: '3/15',  status: 'WARN',   color: c.amber },
              { firm: 'MFFU',    plan: '150K', bal: '+$6,210', dd: '$4,200',  cons: '25%', days: '12/30', status: 'OK',     color: c.green },
              { firm: 'TRADEIFY',plan: '100K', bal: '+$890',   dd: '$2,800',  cons: '22%', days: '4/30',  status: 'OK',     color: c.green },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '120px 70px 110px 110px 80px 90px 1fr',
                gap: 16, alignItems: 'center',
                padding: '16px 24px',
                borderBottom: i === 4 ? 'none' : `1px solid ${c.border}`,
                fontFamily: mono,
                fontSize: 13,
                transition: 'background 0.15s',
              }}>
                <div style={{ color: c.text, fontWeight: 600, letterSpacing: '0.02em' }}>
                  {row.firm}
                </div>
                <div style={{ color: c.text2 }}>{row.plan}</div>
                <div style={{ color: row.bal.startsWith('+') ? c.green : c.red, fontWeight: 600 }}>
                  {row.bal}
                </div>
                <div style={{ color: c.text2 }}>
                  <span style={{ color: c.text3, fontSize: 10, marginRight: 4 }}>DD</span>
                  {row.dd}
                </div>
                <div style={{ color: c.text2 }}>{row.cons}</div>
                <div style={{ color: c.text3, fontSize: 11 }}>{row.days}j</div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: row.color, fontSize: 11, justifySelf: 'end',
                  letterSpacing: '0.08em',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.color }} />
                  {row.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURES (3 colonnes, séparateurs, "Learn more →") === */}
      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1100, margin: '0 auto 140px',
        padding: '0 32px',
      }}>
        <div style={{ marginBottom: 64 }}>
          <div style={{
            fontSize: 11, color: c.accent, fontFamily: mono,
            letterSpacing: '0.14em', marginBottom: 14,
          }}>
            FONCTIONNALITÉS
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 600, letterSpacing: '-0.025em',
            maxWidth: 640, lineHeight: 1.15,
          }}>
            Tout ce qu'il faut pour passer tes challenges et garder tes funded accounts.
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 0,
          borderTop: `1px solid ${c.border}`,
        }}>
          {[
            {
              t: 'Suivi multi-firms',
              d: 'Topstep, Apex, Lucid, Tradeify, MFFU, Phidias, TPT, Bulenox — règles pré-configurées par firme.',
              l: 'Voir les firmes supportées',
            },
            {
              t: 'Trailing drawdown',
              d: 'Moteur EOD ou intraday, lock au starting balance quand applicable. Mis à jour en temps réel.',
              l: 'Comment ça marche',
            },
            {
              t: 'Consistency live',
              d: 'Ratio meilleur jour / total calculé en continu. Sache si tu peux demander ton payout.',
              l: 'En savoir plus',
            },
            {
              t: 'Payouts & ROI',
              d: 'Chaque payout enregistré. ROI par firme calculé. Export CSV à tout moment.',
              l: 'Voir les rapports',
            },
            {
              t: 'Calendrier économique',
              d: 'NFP, FOMC, CPI — évite les news à fort impact. Filtre par sévérité et devise.',
              l: 'Voir le calendrier',
            },
            {
              t: 'Notifications push',
              d: 'Alerte navigateur 48h avant chaque prélèvement mensuel. Plus de mauvaise surprise.',
              l: 'Configurer les alertes',
            },
          ].map((f, i) => (
            <div key={i} style={{
              padding: '32px 28px',
              borderRight: (i + 1) % 3 === 0 ? 'none' : `1px solid ${c.border}`,
              borderBottom: i < 3 ? `1px solid ${c.border}` : 'none',
            }}>
              <h3 style={{
                fontSize: 17, fontWeight: 600,
                marginBottom: 12, letterSpacing: '-0.01em',
              }}>
                {f.t}
              </h3>
              <p style={{
                fontSize: 14, color: c.text2,
                lineHeight: 1.6, marginBottom: 18,
              }}>
                {f.d}
              </p>
              <a href="#" style={{
                fontSize: 13, color: c.accent,
                textDecoration: 'none', fontWeight: 500,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {f.l} <span style={{ fontSize: 12 }}>→</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* === STATS (Bloomberg-ish, monospace, sobre) === */}
      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1100, margin: '0 auto 140px',
        padding: '0 32px',
      }}>
        <div style={{
          background: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          padding: '48px 40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 40,
        }}>
          {[
            { v: '8',    l: 'PROPFIRMS SUPPORTÉES' },
            { v: '3',    l: 'LANGUES NATIVES' },
            { v: '∞',    l: 'COMPTES PAR USER' },
            { v: '100%', l: 'PRIVACY PAR DÉFAUT' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{
                fontSize: 44, fontWeight: 600,
                fontFamily: mono,
                letterSpacing: '-0.03em',
                marginBottom: 10,
                color: c.text,
              }}>
                {s.v}
              </div>
              <div style={{
                fontSize: 11, color: c.text3,
                fontFamily: mono,
                letterSpacing: '0.12em',
              }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === CTA FINAL === */}
      <section style={{
        position: 'relative', zIndex: 1,
        maxWidth: 720, margin: '0 auto',
        padding: '0 32px 120px',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 600, letterSpacing: '-0.025em',
          lineHeight: 1.1, marginBottom: 22,
        }}>
          Track comme un pro.
        </h2>
        <p style={{
          fontSize: 17, color: c.text2,
          marginBottom: 36, lineHeight: 1.55,
        }}>
          Gratuit pendant la beta. Sans carte bancaire. Tes données restent privées.
        </p>
        <a href="#" style={btnPrimaryLarge}>Commencer gratuitement →</a>
      </section>

      {/* === FOOTER === */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: `1px solid ${c.border}`,
        padding: '32px',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          fontSize: 13, color: c.text3,
        }}>
          <div style={{ fontFamily: mono, letterSpacing: '0.05em' }}>
            © 2026 QUANTARA LLC · TEXAS, USA
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// === Styles partagés (inline pour rester self-contained) ===

const navLink = {
  color: 'inherit',
  textDecoration: 'none',
  transition: 'color 0.15s',
}

const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: '#f0ede8', color: '#0a0c10',
  padding: '8px 16px', borderRadius: 6,
  fontSize: 13, fontWeight: 500, textDecoration: 'none',
  border: '1px solid rgba(0,0,0,0.1)',
}

const btnPrimaryLarge = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: '#f0ede8', color: '#0a0c10',
  padding: '13px 24px', borderRadius: 8,
  fontSize: 15, fontWeight: 500, textDecoration: 'none',
  border: '1px solid rgba(0,0,0,0.1)',
  boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
}

const btnGhostLarge = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  background: 'transparent', color: '#f0f1f5',
  padding: '13px 24px', borderRadius: 8,
  fontSize: 15, fontWeight: 500, textDecoration: 'none',
  border: '1px solid rgba(255,255,255,0.16)',
}

const dot = (color) => ({
  width: 12, height: 12, borderRadius: '50%', background: color,
})
