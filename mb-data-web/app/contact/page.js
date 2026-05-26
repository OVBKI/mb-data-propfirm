import Link from 'next/link'

export const metadata = {
  title: 'Contact',
  description: 'Contactez l\'équipe Quantara pour toute question ou suggestion.',
}

export default function ContactPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0d0f14', color: '#f0ede8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'inherit',
    }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#9098b0', marginBottom: 32, textDecoration: 'none',
        }}>
          ← Retour à l'accueil
        </Link>

        <h1 style={{
          fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em',
          marginBottom: 8, lineHeight: 1.1,
        }}>
          Contactez-nous
        </h1>
        <p style={{ fontSize: 15, color: '#9098b0', lineHeight: 1.6, marginBottom: 40 }}>
          Une question, un bug, une suggestion ? On est là pour t'aider.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div style={{
            padding: '20px 24px', background: '#141720',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, color: '#565e78', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontWeight: 600 }}>
              Email
            </div>
            <a href="mailto:support@quantara.tech" style={{
              fontSize: 16, fontWeight: 600, color: '#4d8fff', textDecoration: 'none',
            }}>
              support@quantara.tech
            </a>
            <div style={{ fontSize: 12, color: '#9098b0', marginTop: 6 }}>
              Réponse sous 24-48h en moyenne.
            </div>
          </div>

          {/* Réseaux */}
          <div style={{
            padding: '20px 24px', background: '#141720',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, color: '#565e78', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontWeight: 600 }}>
              Réseaux sociaux
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <a href="https://x.com/quantara_tech" target="_blank" rel="noopener noreferrer" style={{
                fontSize: 14, fontWeight: 500, color: '#9098b0', textDecoration: 'none',
              }}>
                X (Twitter)
              </a>
              <a href="https://discord.gg/quantara" target="_blank" rel="noopener noreferrer" style={{
                fontSize: 14, fontWeight: 500, color: '#9098b0', textDecoration: 'none',
              }}>
                Discord
              </a>
            </div>
          </div>

          {/* Info entreprise */}
          <div style={{
            padding: '20px 24px', background: '#141720',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, color: '#565e78', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontWeight: 600 }}>
              Entreprise
            </div>
            <div style={{ fontSize: 14, color: '#9098b0', lineHeight: 1.6 }}>
              Quantara LLC<br />
              Texas, USA
            </div>
          </div>
        </div>

        <div style={{ marginTop: 40, fontSize: 12, color: '#565e78', textAlign: 'center' }}>
          <Link href="/legal/privacy" style={{ color: '#565e78', textDecoration: 'underline' }}>Politique de confidentialité</Link>
          {' · '}
          <Link href="/legal/cgu" style={{ color: '#565e78', textDecoration: 'underline' }}>CGU</Link>
        </div>
      </div>
    </div>
  )
}
