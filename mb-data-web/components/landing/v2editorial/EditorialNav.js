'use client'
// EditorialNav — minimal top bar. Wordmark left, single CTA right.
// No menu, no clutter. Cream background, hairline bottom border.

import Link from 'next/link'
import { useT } from '../../LanguageProvider'
import { editorial } from './tokens'

export default function EditorialNav() {
  const t = useT()

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: editorial.bg,
        borderBottom: `1px solid ${editorial.rule}`,
      }}
    >
      <div
        style={{
          maxWidth: editorial.maxWidth,
          margin: '0 auto',
          padding: `18px ${editorial.sectionPaddingX}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          aria-label="Quantara"
          style={{
            fontFamily: editorial.sans,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.22em',
            color: editorial.ink,
            textDecoration: 'none',
          }}
        >
          QUANTARA
        </Link>

        <Link
          href="/auth?mode=signup"
          className="qte-nav-cta"
          style={{
            fontFamily: editorial.sans,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: editorial.ink,
            textDecoration: 'none',
            paddingBottom: 4,
            borderBottom: `1px solid ${editorial.ink}`,
            transition: `color 300ms ${editorial.easeOut}, border-color 300ms ${editorial.easeOut}`,
          }}
        >
          {t('nav.start') || 'Commencer'}
        </Link>

        <style>{`
          .qte-nav-cta:hover {
            color: ${editorial.accent} !important;
            border-color: ${editorial.accent} !important;
          }
        `}</style>
      </div>
    </header>
  )
}
