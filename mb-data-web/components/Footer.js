// Footer pro 4 colonnes — partagé entre la landing et les pages annexes
// (security, docs, integrations, legal). Mobile : se stack en vertical via lp-footer-cols.

import Link from 'next/link'
import Logo from './Logo'

const C = {
  surface: '#141720',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blueLight: '#4d8fff',
}

const SECTIONS = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '/#features' },
      { label: 'Tableau de bord', href: '/app' },
      { label: 'Calendrier économique', href: '/app' },
      { label: 'Roadmap', href: '/docs#roadmap' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'PropFirms supportées', href: '/integrations' },
      { label: 'FAQ', href: '/docs#faq' },
      { label: 'Statut système', href: 'https://www.vercel-status.com/', external: true },
    ],
  },
  {
    title: 'Sécurité & Légal',
    links: [
      { label: 'Sécurité', href: '/security' },
      { label: 'CGU', href: '/legal/cgu' },
      { label: 'Confidentialité', href: '/legal/privacy' },
      { label: 'Mentions légales', href: '/legal/imprint' },
      { label: 'Cookies', href: '/legal/privacy#cookies' },
    ],
  },
  {
    title: 'Société',
    links: [
      { label: 'À propos', href: '/#why' },
      { label: 'Contact', href: 'mailto:contact@quantara.tech', external: true },
      { label: 'Sécurité (signaler)', href: 'mailto:security@quantara.tech', external: true },
      { label: 'Discord', href: '#', external: true, soon: true },
    ],
  },
]

export default function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${C.border}`,
      background: C.surface,
      padding: '56px 24px 24px',
      marginTop: 'auto',
    }}>
      <div className="lp-footer" style={{
        maxWidth: 1200, margin: '0 auto',
      }}>
        {/* Top : 4 colonnes (Produit / Ressources / Légal / Société) */}
        <div className="lp-footer-cols" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1.3fr) repeat(4, minmax(140px, 1fr))',
          gap: 40,
          marginBottom: 40,
        }}>
          {/* Branding */}
          <div>
            <Link href="/" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              textDecoration: 'none', color: C.text, marginBottom: 14,
            }}>
              <Logo size={36} glow="normal" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1, letterSpacing: '0.08em' }}>QUANTARA</div>
                <div style={{ fontSize: 9, color: C.text3, marginTop: 3, letterSpacing: '0.05em' }}>TRACK · ANALYZE · GROW</div>
              </div>
            </Link>
            <p style={{
              fontSize: 12, color: C.text2, lineHeight: 1.5, marginTop: 12,
              maxWidth: 280,
            }}>
              Le journal de trading des PropFirms futures. Suis tes drawdowns trailing,
              ta consistency, et tes payouts en temps réel.
            </p>
          </div>

          {/* Colonnes liens */}
          {SECTIONS.map(section => (
            <div key={section.title}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: C.text3,
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14,
              }}>
                {section.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {section.links.map(link => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 13, color: C.text2, textDecoration: 'none',
                          opacity: link.soon ? 0.5 : 1,
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        {link.label}
                        {link.soon && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, background: 'rgba(45,111,255,0.15)', color: C.blueLight }}>Bientôt</span>}
                      </a>
                    ) : (
                      <Link href={link.href} style={{
                        fontSize: 13, color: C.text2, textDecoration: 'none',
                      }}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom : copyright + meta */}
        <div style={{
          paddingTop: 24, borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
          fontSize: 11, color: C.text3,
        }}>
          <div>
            © {new Date().getFullYear()} <strong style={{ color: C.text2 }}>Quantara LLC</strong> — Track. Analyze. Grow.
            <span style={{ marginLeft: 8, opacity: 0.7 }}>A Texas limited liability company.</span>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>🇫🇷 Français</span>
            <span>·</span>
            <span>🇺🇸 Quantara LLC · 🇪🇺 Hébergé en EU</span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1db87a', boxShadow: '0 0 6px rgba(29,184,122,0.6)' }} />
              Tous les services opérationnels
            </span>
          </div>
        </div>

        {/* Disclaimer financier */}
        <div style={{
          marginTop: 18, padding: '12px 16px',
          background: 'rgba(250,199,117,0.05)', border: '1px solid rgba(250,199,117,0.15)',
          borderRadius: 8, fontSize: 11, color: C.text3, lineHeight: 1.5,
        }}>
          <strong style={{ color: '#fac775' }}>⚠️ Avertissement :</strong> Quantara est un outil de journalisation et d'analyse.
          Il ne fournit pas de conseil financier ni d'investissement. Le trading de futures comporte des risques substantiels
          et n'est pas adapté à tous les investisseurs. Les performances passées ne préjugent pas des résultats futurs.
        </div>
      </div>
    </footer>
  )
}
