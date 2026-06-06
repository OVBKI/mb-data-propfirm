'use client'
// AtmoNav — Slim top nav for the Atmospheric Dark landing.
// Wordmark left, 3 nav links centred, single coral-bordered CTA right.
// Backdrop-blur with a hairline border-bottom. Nav links collapse on
// narrow viewports via a media query in the inline <style>.

import Link from 'next/link'
import { ATMO } from './atmoTheme'

export default function AtmoNav({ t }) {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      padding: '14px 28px',
      background: 'rgba(10, 14, 26, 0.72)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      borderBottom: `1px solid ${ATMO.hairline}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <Link href="/" style={{
        textDecoration: 'none',
        fontFamily: ATMO.serif,
        fontStyle: 'italic',
        fontWeight: 500,
        fontSize: 20,
        color: ATMO.text,
        letterSpacing: '-0.01em',
      }}>
        Quantara
      </Link>

      <nav className="atmo-nav" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <Link href="/pricing" className="atmo-navlink" style={navLinkStyle}>Tarifs</Link>
        <Link href="/demo" className="atmo-navlink" style={navLinkStyle}>Démo</Link>
        <Link href="/docs" className="atmo-navlink" style={navLinkStyle}>Docs</Link>
      </nav>

      <Link href="/auth?mode=signup" className="atmo-cta-mini" style={{
        padding: '9px 18px',
        fontSize: 12.5,
        fontFamily: ATMO.sans,
        fontWeight: 500,
        color: ATMO.text,
        textDecoration: 'none',
        border: `1px solid ${ATMO.hairlineStrong}`,
        borderRadius: 999,
        background: 'transparent',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        transition: `border-color 220ms ${ATMO.ease}, color 220ms ${ATMO.ease}, box-shadow 220ms ${ATMO.ease}, background 220ms ${ATMO.ease}`,
      }}>
        Commencer
        <span className="atmo-cta-arrow" style={{
          fontFamily: ATMO.mono,
          fontSize: 12,
          transition: `transform 280ms ${ATMO.ease}`,
        }}>→</span>
      </Link>

      <style>{`
        .atmo-navlink:hover { color: ${ATMO.text} !important; }
        .atmo-cta-mini:hover {
          border-color: ${ATMO.accent} !important;
          color: ${ATMO.accent} !important;
          box-shadow: 0 0 24px ${ATMO.accentGlow};
          background: rgba(255, 122, 89, 0.04);
        }
        .atmo-cta-mini:hover .atmo-cta-arrow { transform: translateX(3px); }
        @media (max-width: 720px) {
          .atmo-nav { display: none !important; }
        }
      `}</style>
    </header>
  )
}

const navLinkStyle = {
  fontFamily: ATMO.sans,
  fontSize: 13,
  fontWeight: 400,
  color: ATMO.text2,
  textDecoration: 'none',
  transition: `color 200ms ${ATMO.ease}`,
}
