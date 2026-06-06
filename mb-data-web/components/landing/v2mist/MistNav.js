'use client'
// MistNav — floating frosted pill, centered at the top of the viewport.
// Holds the wordmark, three primary links, and the peach "Commencer" CTA.

import Link from 'next/link'
import { mist, fonts } from './tokens'

const linkBase = {
  fontFamily: fonts.body,
  fontSize: 14,
  fontWeight: 500,
  color: mist.text2,
  textDecoration: 'none',
  position: 'relative',
  padding: '6px 2px',
  letterSpacing: '-0.005em',
  transition: `color 0.3s ${mist.ease}`,
}

export default function MistNav({ t }) {
  return (
    <nav
      aria-label="Primary"
      style={{
        position: 'fixed',
        top: 18,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        padding: '10px 14px 10px 22px',
        borderRadius: 999,
        background: mist.glassBg,
        backdropFilter: mist.glassBlur,
        WebkitBackdropFilter: mist.glassBlur,
        border: mist.glassBorder,
        boxShadow: mist.softShadow,
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: fonts.title,
          fontWeight: 700,
          letterSpacing: '0.18em',
          fontSize: 14,
          color: mist.text,
          textDecoration: 'none',
        }}
      >
        QUANTARA
      </Link>

      <div className="mist-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <Link href="/compare" className="mist-link" style={linkBase}>
          {t('nav.compare')}
        </Link>
        <Link href="/pricing" className="mist-link" style={linkBase}>
          {t('nav.pricing')}
        </Link>
        <Link href="/demo" className="mist-link" style={linkBase}>
          {t('nav.demo')}
        </Link>
      </div>

      <Link
        href="/auth?mode=signup"
        style={{
          fontFamily: fonts.body,
          fontSize: 14,
          fontWeight: 500,
          color: '#fff',
          textDecoration: 'none',
          padding: '9px 18px',
          borderRadius: 999,
          background: mist.peach,
          boxShadow: `0 8px 24px -10px ${mist.peach}`,
          transition: `background 0.3s ${mist.ease}, transform 0.3s ${mist.ease}, box-shadow 0.3s ${mist.ease}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = mist.peachHover
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = `0 12px 28px -10px ${mist.peachHover}`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = mist.peach
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = `0 8px 24px -10px ${mist.peach}`
        }}
      >
        Commencer
      </Link>

      <style>{`
        .mist-link::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 1.5px;
          background: ${mist.peach};
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ${mist.ease};
        }
        .mist-link:hover { color: ${mist.text} !important; }
        .mist-link:hover::after { transform: scaleX(1); }

        @media (max-width: 720px) {
          .mist-nav-links { display: none !important; }
        }
      `}</style>
    </nav>
  )
}
