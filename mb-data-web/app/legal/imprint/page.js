import PageHeader from '../../../components/PageHeader'
import Footer from '../../../components/Footer'
import Reveal from '../../../components/Reveal'

export const metadata = {
  title: 'Mentions Légales — Quantara',
  description: 'Mentions légales de Quantara LLC, Texas. Hébergement Vercel + Supabase EU. Contact, propriétaire, identification du site.',
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
}

// TODO: remplacer par l'adresse réelle du Registered Agent Quantara LLC (visible publiquement sur le Texas SOS)
const BLOCS = [
  {
    title: 'Éditeur du site',
    rows: [
      ['Raison sociale', 'Quantara LLC'],
      ['Forme juridique', 'Limited Liability Company (LLC)'],
      ['Juridiction', 'État du Texas, États-Unis'],
      ['Adresse', 'Quantara LLC, c/o Registered Agent, 1100 Congress Ave, Suite 400, Austin, TX 78701, United States'],
      ['Pays', 'États-Unis (Texas)'],
      ['Représentant légal', 'Omar Bakkali, Membre-Gérant (Managing Member)'],
      ['Email contact', 'contact@quantara.tech'],
      ['Email sécurité', 'security@quantara.tech'],
    ],
  },
  {
    title: 'Hébergement',
    rows: [
      ['Frontend', 'Vercel Inc. — 340 S Lemon Ave #4133, Walnut, CA 91789, USA — vercel.com'],
      ['Région edge', 'Frankfurt, Allemagne (cdg1/fra1)'],
      ['Base de données', 'Supabase Inc. — 970 Toa Payoh North #07-04, Singapour — supabase.com'],
      ['Région DB', 'EU Central (Frankfurt, Allemagne)'],
      ['Anti-bot', 'Cloudflare Inc. (Turnstile) — 101 Townsend St, San Francisco, CA 94107, USA'],
    ],
  },
  {
    title: 'Propriété intellectuelle',
    rows: [
      ['Marque', 'Quantara™ — usage par Quantara LLC'],
      ['Code source', 'Propriétaire — Quantara LLC. Tous droits réservés.'],
      ['Données utilisateur', 'Propriété des utilisateurs respectifs (voir CGU)'],
      ['Logos PropFirms', 'Marques de leurs propriétaires respectifs (Topstep®, Apex®, Lucid Trading®, etc.). Utilisés à titre informatif uniquement.'],
    ],
  },
  {
    title: 'Activité',
    rows: [
      ['Nature', 'Service SaaS de journal de trading et d\'analyse pour traders sur comptes PropFirm'],
      ['Statut financier', 'Quantara N\'EST PAS un conseiller financier régulé. Pas de PSI, pas d\'AMF, pas de SEC.'],
      ['Statut', 'Outil informatique — pas de produit financier proposé.'],
    ],
  },
]

export default function ImprintPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />

      <main style={{ flex: 1 }}>
        {/* HERO */}
        <section style={{ padding: '80px 24px 40px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>
              Légal
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, marginBottom: 14 }}>
              Mentions Légales
            </h1>
            <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6 }}>
              Informations légales de Quantara LLC · Mise à jour mai 2026
            </p>
          </Reveal>
        </section>

        {/* BLOCS */}
        <section style={{ padding: '0 24px 60px', maxWidth: 820, margin: '0 auto' }}>
          {BLOCS.map((bloc, i) => (
            <Reveal key={i}>
              <div style={{
                marginBottom: 18,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '14px 22px',
                  background: 'rgba(255,255,255,0.025)',
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <h2 style={{
                    fontSize: 14, fontWeight: 700,
                    color: C.blueLight, margin: 0,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    fontFamily: 'ui-monospace, monospace',
                  }}>
                    {bloc.title}
                  </h2>
                </div>
                <div>
                  {bloc.rows.map((r, j) => (
                    <div key={j} style={{
                      padding: '12px 22px',
                      borderTop: j > 0 ? `1px solid ${C.border}` : 'none',
                      display: 'grid',
                      gridTemplateColumns: '180px 1fr',
                      gap: 16, alignItems: 'baseline',
                      fontSize: 13,
                    }}>
                      <span style={{
                        color: C.text3, fontFamily: 'ui-monospace, monospace',
                        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{r[0]}</span>
                      <span style={{ color: C.text, lineHeight: 1.6 }}>{r[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </section>

        {/* DROIT À L'IMAGE */}
        <section style={{ padding: '20px 24px 40px', maxWidth: 820, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              padding: '20px 24px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0, marginBottom: 10, letterSpacing: '-0.01em' }}>
                Droit applicable
              </h2>
              <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, margin: 0 }}>
                Le présent site est régi par le droit de l'État du Texas, États-Unis, sous réserve des dispositions impératives applicables aux consommateurs résidant dans l'Union Européenne (notamment le RGPD pour la protection des données personnelles). Pour les utilisateurs EU, les juridictions compétentes restent celles du pays de résidence du consommateur pour les litiges relatifs à la protection des données.
              </p>
            </div>
          </Reveal>
        </section>

        {/* MARQUE PROPFIRMS */}
        <section style={{ padding: '20px 24px 40px', maxWidth: 820, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              padding: '18px 22px',
              background: 'rgba(45,111,255,0.04)',
              border: '1px solid rgba(45,111,255,0.20)',
              borderRadius: 10,
              fontSize: 12, color: C.text2, lineHeight: 1.7,
            }}>
              <strong style={{ color: C.blueLight }}>Indépendance vis-à-vis des PropFirms :</strong> Quantara LLC est un éditeur de logiciel indépendant. Quantara n'est ni partenaire officiel, ni affilié, ni sponsorisé par Topstep, Apex Trader Funding, Lucid Trading, Bulenox, Tradeify, My Funded Futures, Take Profit Trader, Phidias Propfirm, Funded Futures Network, FuturesElite, ou toute autre PropFirm mentionnée sur le site. Les marques citées appartiennent à leurs propriétaires respectifs.
            </div>
          </Reveal>
        </section>

        {/* CONTACT */}
        <section style={{ padding: '20px 24px 80px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 12, letterSpacing: '-0.015em' }}>
              Une question ?
            </h2>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 18 }}>
              Contact général : <a href="mailto:contact@quantara.tech" style={{ color: C.blueLight, textDecoration: 'none' }}>contact@quantara.tech</a>
              <br />
              Sécurité / faille : <a href="mailto:security@quantara.tech" style={{ color: C.blueLight, textDecoration: 'none' }}>security@quantara.tech</a>
            </p>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  )
}
