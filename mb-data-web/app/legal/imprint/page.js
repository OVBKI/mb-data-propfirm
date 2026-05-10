import PageHeader from '../../../components/PageHeader'
import Footer from '../../../components/Footer'

export const metadata = {
  title: 'Mentions Légales — Quantara',
  description: 'Mentions légales de Quantara LLC — éditeur du service quantara.tech.',
}

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
}

const card = {
  background: '#141720',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12,
  padding: 22,
  marginBottom: 16,
}
const labelStyle = {
  fontSize: 11, fontWeight: 700, color: C.text3,
  textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6,
}
const valueStyle = { fontSize: 14, color: C.text2, lineHeight: 1.6 }

export default function ImprintPage() {
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />

      <section style={{ padding: '60px 24px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>LÉGAL</div>
            <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, marginBottom: 10 }}>
              Mentions Légales
            </h1>
            <div style={{ fontSize: 12, color: C.text3 }}>
              Conformes aux exigences EU (LCEN, art. 6) et US (Section 5 FTC Act)
            </div>
          </div>

          {/* Éditeur */}
          <div style={card}>
            <div style={labelStyle}>Éditeur du Service</div>
            <div style={valueStyle}>
              <strong style={{ color: C.text }}>Quantara LLC</strong><br />
              Limited Liability Company, immatriculée au Registre du Commerce de l'État du Texas, États-Unis<br />
              EIN : <em>[à compléter après obtention auprès de l'IRS]</em><br />
              Adresse du siège (registered agent) : <em>[à compléter — typiquement adresse du registered agent au Texas]</em>
            </div>
          </div>

          {/* Contacts */}
          <div style={card}>
            <div style={labelStyle}>Contacts</div>
            <div style={valueStyle}>
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: C.text }}>Contact général</strong> :{' '}
                <a href="mailto:contact@quantara.tech" style={{ color: '#4d8fff', textDecoration: 'none' }}>contact@quantara.tech</a>
              </div>
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: C.text }}>Privacy / RGPD</strong> :{' '}
                <a href="mailto:privacy@quantara.tech" style={{ color: '#4d8fff', textDecoration: 'none' }}>privacy@quantara.tech</a>
              </div>
              <div style={{ marginBottom: 6 }}>
                <strong style={{ color: C.text }}>Sécurité (responsible disclosure)</strong> :{' '}
                <a href="mailto:security@quantara.tech" style={{ color: '#4d8fff', textDecoration: 'none' }}>security@quantara.tech</a>
              </div>
              <div>
                <strong style={{ color: C.text }}>Légal</strong> :{' '}
                <a href="mailto:legal@quantara.tech" style={{ color: '#4d8fff', textDecoration: 'none' }}>legal@quantara.tech</a>
              </div>
            </div>
          </div>

          {/* Directeur de publication */}
          <div style={card}>
            <div style={labelStyle}>Directeur de la publication</div>
            <div style={valueStyle}>
              Le Managing Member de Quantara LLC<br />
              <em>[à compléter avec ton nom une fois la LLC formée]</em>
            </div>
          </div>

          {/* Hébergement */}
          <div style={card}>
            <div style={labelStyle}>Hébergement</div>
            <div style={valueStyle}>
              <strong style={{ color: C.text }}>Frontend</strong> : Vercel Inc.<br />
              440 N Barranca Ave #4133, Covina, CA 91723, USA<br />
              Régions : Frankfurt (DE) / Paris (FR)<br /><br />

              <strong style={{ color: C.text }}>Base de données + Storage</strong> : Supabase Inc.<br />
              970 Toa Payoh North #07-04, Singapore 318992<br />
              Région : Frankfurt (DE)
            </div>
          </div>

          {/* Marques */}
          <div style={card}>
            <div style={labelStyle}>Marques & Propriété intellectuelle</div>
            <div style={valueStyle}>
              « Quantara » et le logo Quantara sont des marques déposées (ou en cours de dépôt) de Quantara LLC.
              <br /><br />
              Les marques tierces mentionnées (Topstep®, Apex Trader Funding®, Lucid Trading®, Bulenox®, Tradeify®,
              Take Profit Trader®, My Funded Futures®, Phidias Propfirm®, Funded Futures Network®, FuturesElite®, etc.)
              appartiennent à leurs propriétaires respectifs et sont citées à des fins informatives uniquement.
              Quantara LLC n'est affilié à aucune de ces sociétés.
            </div>
          </div>

          {/* Médiation */}
          <div style={card}>
            <div style={labelStyle}>Médiation à la consommation (UE)</div>
            <div style={valueStyle}>
              Conformément à la directive 2013/11/UE, les utilisateurs résidents de l'Union Européenne peuvent recourir
              à la plateforme de Règlement en Ligne des Litiges (ODR) de la Commission Européenne :{' '}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#4d8fff', textDecoration: 'none' }}>ec.europa.eu/consumers/odr</a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
