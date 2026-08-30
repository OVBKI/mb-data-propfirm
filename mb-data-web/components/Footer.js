'use client'
// Footer pro 4 colonnes — partagé entre la landing et les pages annexes
// (security, docs, integrations, legal). Mobile : se stack en vertical via lp-footer-cols.

import Link from 'next/link'
import QLogoIcon from './QLogoIcon'
import { useT } from './LanguageProvider'

const C = {
  surface: 'var(--surface)',
  border: 'var(--border)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blueLight: 'var(--blue-light)',
}

export default function Footer() {
  const t = useT()

  // Sections de liens construites dynamiquement avec les libellés traduits.
  const SECTIONS = [
    {
      title: t('pages.footer.cols.product'),
      links: [
        { label: t('pages.footer.links.features'),  href: '/#features' },
        { label: t('pages.footer.links.compare'),   href: '/compare' },
        { label: t('pages.footer.links.dashboard'), href: '/app' },
        { label: t('pages.footer.links.calendar'),  href: '/app' },
        { label: t('pages.footer.links.roadmap'),   href: '/docs#roadmap' },
      ],
    },
    {
      title: t('pages.footer.cols.resources'),
      links: [
        { label: t('pages.footer.links.docs'),         href: '/docs' },
        { label: t('pages.footer.links.integrations'), href: '/integrations' },
        { label: t('pages.footer.links.faq'),          href: '/docs#faq' },
        { label: t('pages.footer.links.status'),       href: 'https://www.vercel-status.com/', external: true },
      ],
    },
    {
      title: t('pages.footer.cols.securityLegal'),
      links: [
        { label: t('pages.footer.links.security'), href: '/security' },
        { label: t('pages.footer.links.cgu'),      href: '/legal/cgu' },
        { label: t('pages.footer.links.privacy'),  href: '/legal/privacy' },
        { label: t('pages.footer.links.imprint'),  href: '/legal/imprint' },
        { label: t('pages.footer.links.cookies'),  href: '/legal/privacy#cookies' },
      ],
    },
    {
      title: t('pages.footer.cols.company'),
      links: [
        { label: t('pages.footer.links.about'),     href: '/#why' },
        { label: t('pages.footer.links.contact'),   href: 'mailto:contact@quantara.tech', external: true },
        { label: t('pages.footer.links.reportSec'), href: 'mailto:security@quantara.tech', external: true },
        { label: t('pages.footer.links.discord'),   href: '#', external: true, soon: true },
      ],
    },
  ]

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
        {/* Top : 4 colonnes */}
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
              <QLogoIcon size={44} color="var(--blue-light)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1, letterSpacing: '0.08em' }}>QUANTARA</div>
                <div style={{ fontSize: 9, color: C.text3, marginTop: 3, letterSpacing: '0.05em' }}>TRACK · ANALYZE · GROW</div>
              </div>
            </Link>
            <p style={{
              fontSize: 12, color: C.text2, lineHeight: 1.5, marginTop: 12,
              maxWidth: 280,
            }}>
              {t('pages.footer.tagline')}
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
                    {/* ⚠️ Une entrée « Soon » n'est PAS un lien : son href vaut '#',
                        elle ne mène nulle part. La rendre en <a> donnait un lien
                        actif au clavier qui ne fait rien, et l'`opacity: 0.5`
                        faisait passer son texte sous le seuil de contraste — sur
                        TOUTES les pages publiques, puisque c'est le pied de page.
                        Un <span> dit la vérité : ce n'est pas encore cliquable. */}
                    {link.soon ? (
                      <span style={{
                        fontSize: 13, color: C.text3,
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                      }}>
                        {link.label}
                        <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 99, background: 'var(--blue-bg)', color: C.blueLight }}>{t('pages.footer.badges.soon')}</span>
                      </span>
                    ) : link.external ? (
                      <a
                        href={link.href}
                        target={link.href.startsWith('mailto:') ? undefined : '_blank'}
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 13, color: C.text2, textDecoration: 'none',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        {link.label}
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
            © {new Date().getFullYear()} <strong style={{ color: C.text2 }}>Quantara Technologies LLC</strong> {t('pages.footer.bottom.copyrightSuffix')}
            <span style={{ marginLeft: 8, color: 'var(--text3)' }}>{t('pages.footer.bottom.texas')}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>🇺🇸 Quantara Technologies LLC · 🇪🇺 {t('pages.footer.bottom.eu')}</span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green-bg)' }} />
              {t('pages.footer.bottom.allOk')}
            </span>
          </div>
        </div>

        {/* Disclaimer financier */}
        <div style={{
          marginTop: 18, padding: '12px 16px',
          background: 'var(--amber-bg)', border: '1px solid var(--amber-bg)',
          // ⚠️ --text3 sur le fond ambre translucide donnait 4.33:1, juste sous
          // le seuil AA de 4.5 — et ce bloc est le pied de page de TOUTES les
          // pages publiques, donc l'écart se comptait treize fois. C'est un
          // avertissement légal : il doit se lire.
          borderRadius: 8, fontSize: 11, color: C.text2, lineHeight: 1.5,
        }}>
          <strong style={{ color: 'var(--amber)' }}>{t('pages.footer.disclaimer.title')}</strong> {t('pages.footer.disclaimer.body')}
        </div>
      </div>
    </footer>
  )
}
