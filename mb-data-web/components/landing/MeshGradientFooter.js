'use client'
// Footer landing avec mesh gradient sophistiqué (radial blobs animés).
// Inspiration : stripe.com, vercel.com.
// Contenu : aligné avec components/Footer.js (4 colonnes + disclaimer + bottom bar).

import { motion } from 'framer-motion'
import Link from 'next/link'
import QLogoIcon from '../QLogoIcon'
import { useT } from '../LanguageProvider'

const C = {
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
  border: 'rgba(255,255,255,0.07)',
}

// Sections nav — construites dynamiquement depuis i18n (FR/EN).
// Chaque clé i18n est dans lib/i18n.js sous footer.sections + footer.links.
function buildSections(t) {
  return [
    {
      title: t('footer.sections.product'),
      links: [
        { label: t('footer.links.features'),   href: '/#features' },
        { label: t('footer.links.compare'),    href: '/compare' },
        { label: t('footer.links.dashboard'),  href: '/app' },
        { label: t('footer.links.pricing'),    href: '/pricing' },
      ],
    },
    {
      title: t('footer.sections.resources'),
      links: [
        { label: t('footer.links.docs'),         href: '/docs' },
        { label: t('footer.links.integrations'), href: '/integrations' },
        { label: t('footer.links.faq'),          href: '/docs#faq' },
        { label: t('footer.links.status'),       href: 'https://www.vercel-status.com/', external: true },
      ],
    },
    {
      title: t('footer.sections.legal'),
      links: [
        { label: t('footer.links.security'), href: '/security' },
        { label: t('footer.links.cgu'),      href: '/legal/cgu' },
        { label: t('footer.links.privacy'),  href: '/legal/privacy' },
        { label: t('footer.links.imprint'),  href: '/legal/imprint' },
        { label: t('footer.links.cookies'),  href: '/legal/privacy#cookies' },
      ],
    },
    {
      title: t('footer.sections.company'),
      links: [
        { label: t('footer.links.about'),     href: '/#why' },
        { label: t('footer.links.contact'),   href: 'mailto:contact@quantara.tech', external: true },
        { label: t('footer.links.reportSec'), href: 'mailto:security@quantara.tech', external: true },
        { label: t('footer.links.discord'),   href: '#', external: true, soon: true },
      ],
    },
  ]
}

export default function MeshGradientFooter() {
  const t = useT()
  const SECTIONS = buildSections(t)
  return (
    <footer style={{
      position: 'relative',
      padding: '80px 24px 24px',
      overflow: 'hidden',
      borderTop: `1px solid ${C.border}`,
      marginTop: 60,
    }}>
      {/* Mesh gradient background — 3 blobs qui pulsent en boucle décalée */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.55 }}>
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '20%', left: '10%',
            width: 500, height: 500,
            background: `radial-gradient(circle, ${C.blue}40, transparent 60%)`,
            filter: 'blur(80px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 20, -30, 0],
            scale: [1, 0.8, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{
            position: 'absolute',
            top: '40%', right: '15%',
            width: 600, height: 600,
            background: `radial-gradient(circle, ${C.blueLight}30, transparent 60%)`,
            filter: 'blur(100px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, 30, -10, 0],
            y: [0, 30, -10, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          style={{
            position: 'absolute',
            bottom: '-10%', left: '40%',
            width: 500, height: 500,
            background: `radial-gradient(circle, ${C.green}25, transparent 60%)`,
            filter: 'blur(90px)',
          }}
        />
      </div>

      {/* Grain texture overlay (subtle noise pour un look "non-flat") */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      {/* Contenu */}
      <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto' }}>
        {/* === TOP : Branding + 4 colonnes de liens === */}
        <div className="lp-footer-cols" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 1.3fr) repeat(4, minmax(140px, 1fr))',
          gap: 40,
          marginBottom: 40,
        }}>
          {/* Branding column */}
          <div>
            <Link href="/" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              textDecoration: 'none', color: C.text, marginBottom: 14,
            }}>
              <QLogoIcon size={44} color="#4d8fff" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1, letterSpacing: '0.08em' }}>QUANTARA</div>
                <div style={{ fontSize: 9, color: C.text3, marginTop: 3, letterSpacing: '0.05em' }}>TRACK · ANALYZE · GROW</div>
              </div>
            </Link>
            <p style={{
              fontSize: 12, color: C.text2, lineHeight: 1.55, marginTop: 12,
              maxWidth: 280,
            }}>
              {t('footer.tagline')}
            </p>
          </div>

          {/* Nav columns */}
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
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => { if (!link.soon) e.currentTarget.style.color = C.text }}
                        onMouseLeave={e => e.currentTarget.style.color = C.text2}
                      >
                        {link.label}
                        {link.soon && (
                          <span style={{
                            fontSize: 9, padding: '1px 6px', borderRadius: 99,
                            background: 'rgba(45,111,255,0.15)', color: C.blueLight,
                          }}>{t('footer.badges.soon')}</span>
                        )}
                      </a>
                    ) : (
                      <Link href={link.href} style={{
                        fontSize: 13, color: C.text2, textDecoration: 'none',
                        transition: 'color 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.color = C.text}
                        onMouseLeave={e => e.currentTarget.style.color = C.text2}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* === BOTTOM bar : copyright + meta === */}
        <div style={{
          paddingTop: 24, borderTop: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
          fontSize: 11, color: C.text3,
        }}>
          <div>
            © {new Date().getFullYear()} <strong style={{ color: C.text2 }}>Quantara Technologies LLC</strong> — {t('footer.bottom.copyright').replace('Quantara Technologies LLC — ', '')}
            <span style={{ marginLeft: 8, opacity: 0.7 }}>{t('footer.bottom.texas')}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>🇺🇸 Quantara Technologies LLC · 🇪🇺 {t('footer.bottom.eu')}</span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#1db87a',
                boxShadow: '0 0 6px rgba(29,184,122,0.6)',
              }} />
              {t('footer.bottom.allOk')}
            </span>
          </div>
        </div>

        {/* === Disclaimer financier (légal — required for finance-adjacent service) === */}
        <div style={{
          marginTop: 18, padding: '12px 16px',
          background: 'rgba(250,199,117,0.05)',
          border: '1px solid rgba(250,199,117,0.15)',
          borderRadius: 8, fontSize: 11, color: C.text3, lineHeight: 1.55,
        }}>
          <strong style={{ color: C.amber }}>{t('footer.disclaimer.title')}</strong> {t('footer.disclaimer.body')}
        </div>
      </div>
    </footer>
  )
}
