import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'
import Reveal from '../../components/Reveal'
import { getFirmLogo } from '../../lib/firmLogos'

export const metadata = {
  title: 'PropFirms supportées — Quantara',
  description: '10 PropFirms futures supportées : Topstep, Apex, Lucid, Bulenox, Tradeify, MFFU, Phidias, FFN, FuturesElite, TPT. Import CSV Rithmic actif. API broker en développement.',
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

// PropFirms — statut sync RÉEL.
//   'csv-rithmic' = supportée via import CSV Rithmic (Performance + Trader Dashboard)
//   'csv-soon'    = import CSV non implémenté pour ce format spécifique
//   'manual'      = saisie manuelle uniquement pour l'instant
// Toutes sont utilisables en saisie manuelle ; on indique juste si l'import auto est dispo.
const FIRMS = [
  { name: 'Topstep',                color: '#ff8c42', status: 'manual',       apiVendor: 'TopstepX (ProjectX)',         note: 'API ProjectX en roadmap Q3 2026' },
  { name: 'Apex Trader Funding',    color: '#a78bfa', status: 'csv-rithmic',  apiVendor: 'Rithmic / Tradovate',         note: 'Import CSV Rithmic R|Trader Pro' },
  { name: 'Bulenox',                color: '#e8504a', status: 'csv-rithmic',  apiVendor: 'Rithmic',                     note: 'Import CSV Rithmic' },
  { name: 'Lucid Trading',          color: '#4d8fff', status: 'csv-rithmic',  apiVendor: 'Rithmic / Tradovate / NinjaTrader', note: 'Import CSV Rithmic — testé en prod' },
  { name: 'Tradeify',               color: '#1db87a', status: 'manual',       apiVendor: 'Tradeify (ProjectX)',         note: 'API ProjectX en roadmap Q3 2026' },
  { name: 'Take Profit Trader',     color: '#fac775', status: 'manual',       apiVendor: 'TPT (ProjectX)',              note: 'API ProjectX en roadmap Q3 2026' },
  { name: 'My Funded Futures',      color: '#fb923c', status: 'manual',       apiVendor: 'MFFU (ProjectX)',             note: 'API ProjectX en roadmap Q3 2026' },
  { name: 'Phidias Propfirm',       color: '#1e2a4a', status: 'csv-rithmic',  apiVendor: 'Rithmic',                     note: 'Import CSV Rithmic' },
  { name: 'Funded Futures Network', color: '#a86bff', status: 'csv-rithmic',  apiVendor: 'Rithmic / Tradovate',         note: 'Import CSV Rithmic' },
  { name: 'FuturesElite',           color: '#f472b6', status: 'csv-rithmic',  apiVendor: 'Rithmic',                     note: 'Import CSV Rithmic' },
]

const PLATFORMS = [
  { name: 'NinjaTrader', desc: 'Plateforme phare pour futures, supportée par toutes les PropFirms majeures. Saisie manuelle.' },
  { name: 'Tradovate',   desc: 'Web-based, ergonomique. Compatible Apex, Lucid, FFN, Bulenox. Saisie manuelle pour l\'instant.' },
  { name: 'Rithmic',     desc: 'Flux de marché professionnel. ✓ Import CSV actif (Performance + Trader Dashboard).' },
  { name: 'CQG',         desc: 'Alternative à Rithmic, supportée par TPT, MFFU, et certains plans Topstep.' },
  { name: 'TradingView', desc: 'Charts pour analyse technique, accès via certaines firmes (Tradeify, TPT...).' },
  { name: 'ProjectX',    desc: 'API moderne unifiée Topstep, Tradeify, TPT, MFFU. Intégration en cours de développement.' },
  { name: 'R|Trader Pro',desc: 'Plateforme Rithmic native, populaire pour le scalping bas-latence. ✓ Import CSV.' },
  { name: 'Quantower',   desc: 'Plateforme multi-actifs, supportée par TPT et certaines autres firmes.' },
]

function StatusBadge({ status }) {
  const config = {
    'csv-rithmic': { label: '✓ Import CSV Rithmic actif', color: C.green, bg: 'rgba(29,184,122,0.10)', border: 'rgba(29,184,122,0.35)' },
    'manual':      { label: '⏳ API en roadmap',           color: C.amber, bg: 'rgba(250,199,117,0.10)', border: 'rgba(250,199,117,0.35)' },
    'csv-soon':    { label: '⏳ Import CSV bientôt',       color: C.text3, bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)' },
  }
  const s = config[status] || config.manual
  return (
    <span style={{
      display: 'inline-block', padding: '4px 10px',
      fontSize: 10, fontWeight: 600,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 6, letterSpacing: '0.04em',
    }}>{s.label}</span>
  )
}

export default function IntegrationsPage() {
  const csvCount = FIRMS.filter(f => f.status === 'csv-rithmic').length
  const manualCount = FIRMS.filter(f => f.status === 'manual').length

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader active="integrations" />

      <main style={{ flex: 1 }}>
        {/* HERO */}
        <section style={{ padding: '80px 24px 60px', textAlign: 'center', maxWidth: 880, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>
              Intégrations
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', margin: 0, marginBottom: 18 }}>
              <span style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.green})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>10 PropFirms</span> supportées,<br />
              <span style={{ color: C.text }}>4 via import CSV automatique</span>
            </h1>
            <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.6, maxWidth: 640, margin: '0 auto' }}>
              Toutes les PropFirms futures populaires fonctionnent en <strong style={{ color: C.text }}>saisie manuelle</strong>.
              Les firmes qui utilisent Rithmic supportent en plus <strong style={{ color: C.green }}>l'import CSV automatique</strong> (Performance Statement + Trader Dashboard).
              L'intégration API directe (ProjectX/TopstepX) arrive Q3 2026.
            </p>
            <div style={{ marginTop: 26, display: 'inline-flex', gap: 18, fontSize: 12, color: C.text3, letterSpacing: '0.04em', fontFamily: 'ui-monospace, monospace' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
                {csvCount} import CSV actif
              </span>
              <span style={{ color: C.text3 }}>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.amber }} />
                {manualCount} saisie manuelle (API en cours)
              </span>
            </div>
          </Reveal>
        </section>

        {/* PROPFIRMS GRID */}
        <section style={{ padding: '0 24px 60px', maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                PropFirms
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 6, letterSpacing: '-0.015em' }}>
                Toutes les firmes que tu peux suivre
              </h2>
              <p style={{ fontSize: 13, color: C.text3, margin: 0 }}>
                Chaque firme a ses règles pré-configurées (drawdowns, profit targets, payouts, contrats max). Pas besoin de retenir tout par cœur.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {FIRMS.map(firm => (
                <div key={firm.name} style={{
                  padding: 18,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {getFirmLogo(firm.name, firm.color, 32)}
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>{firm.name}</div>
                      <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{firm.apiVendor}</div>
                    </div>
                  </div>

                  <StatusBadge status={firm.status} />

                  <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.5 }}>
                    {firm.note}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* PLATEFORMES */}
        <section style={{ padding: '40px 24px 80px', maxWidth: 1200, margin: '0 auto', borderTop: `1px solid ${C.border}` }}>
          <Reveal>
            <div style={{ marginBottom: 28, paddingTop: 40 }}>
              <div style={{ fontSize: 11, color: C.green, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                Plateformes
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 6, letterSpacing: '-0.015em' }}>
                Compatibles avec ton setup actuel
              </h2>
              <p style={{ fontSize: 13, color: C.text3, margin: 0, maxWidth: 700 }}>
                Quantara fonctionne en saisie manuelle avec n'importe quelle plateforme. L'import CSV automatique est dispo pour Rithmic.
                L'intégration API directe arrive Q3 2026 pour ProjectX (TopstepX/Tradeify/TPT/MFFU).
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 14,
            }}>
              {PLATFORMS.map(p => (
                <div key={p.name} style={{
                  padding: 18,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.5 }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* CTA "ta firme n'est pas listée" */}
        <section style={{ padding: '40px 24px 80px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 12, letterSpacing: '-0.015em' }}>
              Ta firme n'est pas listée ?
            </h2>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
              Quantara fonctionne avec toutes les PropFirms en mode saisie manuelle. Tu peux ajouter une PropFirm personnalisée depuis le dashboard et configurer ses règles toi-même.
            </p>
            <a href="mailto:contact@quantara.tech?subject=Suggestion%20PropFirm" style={{
              display: 'inline-block', padding: '11px 24px',
              fontSize: 13, fontWeight: 500, borderRadius: 8,
              background: C.blue, color: '#fff', textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(45,111,255,0.3)',
            }}>Suggérer une PropFirm</a>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  )
}
