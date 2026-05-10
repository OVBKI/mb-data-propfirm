import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'
import { getFirmLogo } from '../../lib/firmLogos'
import { PROPFIRM_RULES } from '../../lib/constants'

export const metadata = {
  title: 'PropFirms supportées — Quantara',
  description: 'Topstep, Apex Trader Funding, Lucid Trading, Bulenox, Tradeify, MFFU, Phidias, FFN, FuturesElite — toutes les firmes futures supportées par Quantara.',
}

const C = {
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
  amber: '#fac775',
}

// PropFirms : on prend la liste depuis PROPFIRM_RULES + on ajoute le statut intégration
const FIRMS = [
  { name: 'Topstep',                color: '#ff8c42', status: 'live',   apiVendor: 'TopstepX (ProjectX)' },
  { name: 'Apex Trader Funding',    color: '#a78bfa', status: 'pending', apiVendor: 'Rithmic / Tradovate' },
  { name: 'Bulenox',                color: '#e8504a', status: 'pending', apiVendor: 'Rithmic' },
  { name: 'Lucid Trading',          color: '#4d8fff', status: 'pending', apiVendor: 'Rithmic / Tradovate / NinjaTrader' },
  { name: 'Tradeify',               color: '#1db87a', status: 'live',   apiVendor: 'Tradeify (ProjectX)' },
  { name: 'Take Profit Trader',     color: '#fac775', status: 'live',   apiVendor: 'TPT (ProjectX)' },
  { name: 'My Funded Futures',      color: '#fb923c', status: 'live',   apiVendor: 'MFFU (ProjectX)' },
  { name: 'Phidias Propfirm',       color: '#1e2a4a', status: 'pending', apiVendor: 'Rithmic' },
  { name: 'Funded Futures Network', color: '#a86bff', status: 'pending', apiVendor: 'Rithmic / Tradovate' },
  { name: 'FuturesELites',          color: '#f472b6', status: 'pending', apiVendor: 'Rithmic' },
]

const PLATFORMS = [
  { name: 'NinjaTrader', desc: 'Plateforme phare pour futures, supportée par toutes les PropFirms majeures.' },
  { name: 'Tradovate',   desc: 'Web-based, ergonomique. Compatible Apex, Lucid, FFN, Bulenox.' },
  { name: 'Rithmic',     desc: 'Flux de marché professionnel ultra rapide, utilisé par la plupart des firmes.' },
  { name: 'CQG',         desc: 'Alternative à Rithmic, supportée par TPT, MFFU, et certains plans Topstep.' },
  { name: 'TradingView', desc: 'Charts pour analyse technique, accès via certaines firmes (Tradeify, TPT...).' },
  { name: 'ProjectX',    desc: 'API moderne unifiée — Topstep, Tradeify, TPT, MFFU, TradeDay, UProfit.' },
  { name: 'R|Trader Pro',desc: 'Plateforme Rithmic native, populaire pour le scalping bas-latence.' },
  { name: 'Quantower',   desc: 'Plateforme multi-actifs, supportée par TPT et certaines autres firmes.' },
]

const StatusBadge = ({ status }) => {
  if(status === 'live') return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
      background: 'rgba(29,184,122,0.15)', color: C.green,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
      ✓ Tracking actif
    </span>
  )
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
      background: 'rgba(250,199,117,0.12)', color: C.amber,
    }}>
      ⏳ API bientôt disponible
    </span>
  )
}

export default function IntegrationsPage() {
  const liveCount    = FIRMS.filter(f => f.status === 'live').length
  const pendingCount = FIRMS.filter(f => f.status === 'pending').length

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader active="integrations" />

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="lp-halo-animated" style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(45,111,255,0.15), transparent 60%)`,
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px 40px', textAlign: 'center', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 99,
            background: 'rgba(45,111,255,0.10)', border: `1px solid ${C.blue}`,
            fontSize: 12, fontWeight: 600, color: C.blueLight,
            marginBottom: 24,
          }}>
            🔌 Intégrations
          </div>
          <h1 className="lp-h1" style={{
            fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.1,
            marginBottom: 16, letterSpacing: '-0.02em',
          }}>
            <span className="lp-gradient-text">{FIRMS.length} PropFirms</span> supportées,<br />
            8 plateformes compatibles
          </h1>
          <p style={{
            fontSize: 16, color: C.text2,
            maxWidth: 640, margin: '0 auto 24px', lineHeight: 1.5,
          }}>
            Saisis tes trades manuellement dès aujourd'hui sur n'importe quelle PropFirm.
            Le tracking automatique via API arrive progressivement, firme par firme.
          </p>
          <div style={{ display: 'inline-flex', gap: 16, alignItems: 'center', fontSize: 13, color: C.text3 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }} />
              {liveCount} live
            </span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.amber }} />
              {pendingCount} en attente d'API
            </span>
          </div>
        </div>
      </section>

      {/* PropFirms grid */}
      <section style={{ padding: '40px 24px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.blueLight, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>PROPFIRMS</div>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>Toutes les firmes que tu peux suivre</h2>
              <p style={{ fontSize: 14, color: C.text2, marginTop: 6 }}>
                Chaque firme a ses règles pré-configurées (drawdowns, profit targets, payouts, contrats max).
                Pas besoin de retenir tout par cœur.
              </p>
            </div>
          </Reveal>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16,
          }}>
            {FIRMS.map((firm, i) => {
              const plans = PROPFIRM_RULES[firm.name]?.plans || []
              return (
                <Reveal key={firm.name} delay={i * 50}>
                  <div className="dp-card" style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: 18,
                    height: '100%', display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {getFirmLogo(firm.name, firm.color, 44)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firm.name}</div>
                        <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{firm.apiVendor}</div>
                      </div>
                    </div>
                    {plans.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {plans.map(p => (
                          <span key={p} style={{
                            fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                            background: C.surface2, color: C.text2,
                          }}>{p.toUpperCase()}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                      <StatusBadge status={firm.status} />
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Plateformes */}
      <section style={{ padding: '60px 24px', background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>PLATEFORMES</div>
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>Compatibles avec ton setup actuel</h2>
              <p style={{ fontSize: 14, color: C.text2, marginTop: 6, maxWidth: 640 }}>
                Quantara fonctionne en saisie manuelle (CSV, drag & drop) avec n'importe quelle plateforme.
                L'intégration directe via API est en cours de développement pour ces 8 plateformes.
              </p>
            </div>
          </Reveal>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14,
          }}>
            {PLATFORMS.map((p, i) => (
              <Reveal key={p.name} delay={i * 40}>
                <div style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: 16,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>{p.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 24px' }}>
        <Reveal style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, marginBottom: 12 }}>
            Ta firme n'est pas listée ?
          </h2>
          <p style={{ fontSize: 14, color: C.text2, marginBottom: 24, lineHeight: 1.5 }}>
            Quantara fonctionne avec toutes les PropFirms en mode saisie manuelle. Tu peux ajouter une PropFirm
            personnalisée depuis le dashboard et configurer ses règles toi-même.
          </p>
          <a href="mailto:contact@quantara.tech?subject=Demande%20d'ajout%20PropFirm" style={{
            display: 'inline-block', padding: '12px 28px',
            fontSize: 14, fontWeight: 600, borderRadius: 99,
            background: `linear-gradient(135deg, ${C.blue} 0%, ${C.blueLight} 100%)`,
            color: '#fff', textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(45,111,255,0.35)',
          }}>Suggérer une PropFirm</a>
        </Reveal>
      </section>

      <Footer />
    </div>
  )
}
