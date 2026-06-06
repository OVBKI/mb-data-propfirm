'use client'
// EditorialFooter — minimal. Hairline rule, then a single row of small text:
// legal links, social, copyright. Cream background, ink-soft type.

import Link from 'next/link'
import HairlineRule from './HairlineRule'
import { editorial } from './tokens'

const LEGAL_LINKS = [
  { href: '/legal/cgu', label: 'CGU' },
  { href: '/legal/privacy', label: 'Confidentialité' },
  { href: '/legal/mentions', label: 'Mentions' },
  { href: '/contact', label: 'Contact' },
]

const SOCIAL_LINKS = [
  { href: 'https://x.com/quantara_tech', label: 'X' },
  { href: 'https://www.linkedin.com/company/quantara-tech', label: 'LinkedIn' },
]

export default function EditorialFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        background: editorial.bg,
        padding: `clamp(64px, 8vw, 96px) ${editorial.sectionPaddingX} clamp(40px, 5vw, 56px)`,
      }}
    >
      <div style={{ maxWidth: editorial.maxWidth, margin: '0 auto' }}>
        <HairlineRule marginY={0} />

        <div
          className="qte-footer-rows"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            paddingTop: 'clamp(40px, 5vw, 56px)',
          }}
        >
          <div
            className="qte-footer-row"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                fontFamily: editorial.sans,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: editorial.ink,
              }}
            >
              Quantara
            </div>

            <nav
              style={{
                display: 'flex',
                gap: 28,
                flexWrap: 'wrap',
                rowGap: 12,
              }}
            >
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="qte-footer-link"
                  style={{
                    fontFamily: editorial.sans,
                    fontSize: 13,
                    color: editorial.inkSoft,
                    textDecoration: 'none',
                    transition: `color 250ms ${editorial.easeOut}`,
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <nav style={{ display: 'flex', gap: 20 }}>
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="qte-footer-link"
                  style={{
                    fontFamily: editorial.sans,
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: editorial.inkSoft,
                    textDecoration: 'none',
                    transition: `color 250ms ${editorial.easeOut}`,
                  }}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div
            className="qte-footer-row"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 24,
              flexWrap: 'wrap',
              paddingTop: 8,
            }}
          >
            <p
              style={{
                fontFamily: editorial.sans,
                fontSize: 12,
                color: editorial.inkMuted,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              &copy; {year} Quantara Technologies LLC &middot; New Mexico
            </p>
            <p
              style={{
                fontFamily: editorial.sans,
                fontSize: 12,
                color: editorial.inkMuted,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              1209 Mountain Road PL NE, STE R &middot; Albuquerque, NM 87110
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .qte-footer-link:hover {
          color: ${editorial.ink} !important;
        }
      `}</style>
    </footer>
  )
}
