'use client'
// EditorialHero — single massive italic serif headline with a word-by-word
// reveal, followed by a single short body line and ONE text-link CTA with a
// burgundy underline. No subtitle clutter, no image, no buttons.

import Link from 'next/link'
import { useT } from '../../LanguageProvider'
import WordReveal from './WordReveal'
import Reveal from './Reveal'
import { editorial } from './tokens'

export default function EditorialHero() {
  const t = useT()
  const headline = t('hero.headline') || 'Tous tes comptes PropFirm.\nUn seul dashboard.'

  return (
    <section
      style={{
        background: editorial.bg,
        padding: `clamp(120px, 16vw, 200px) ${editorial.sectionPaddingX} clamp(120px, 14vw, 180px)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: editorial.maxWidth, margin: '0 auto' }}>
        {/* Tiny eyebrow — gives the page an editorial dateline */}
        <Reveal>
          <p
            style={{
              fontFamily: editorial.sans,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: editorial.inkMuted,
              margin: 0,
              marginBottom: 'clamp(48px, 8vw, 80px)',
            }}
          >
            Quantara &nbsp;&middot;&nbsp; Édition {new Date().getFullYear()}
          </p>
        </Reveal>

        <WordReveal
          text={headline}
          as="h1"
          initialDelay={200}
          style={{
            fontFamily: editorial.serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(56px, 9vw, 140px)',
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            color: editorial.ink,
            margin: 0,
            // The headline occupies roughly 10 of 12 cols — leaves a quiet
            // gutter on the right that reads as breathing room, not as empty.
            maxWidth: '14ch',
          }}
        />

        <Reveal delay={500} style={{ marginTop: 'clamp(56px, 8vw, 96px)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr)',
              gap: 'clamp(28px, 4vw, 44px)',
              maxWidth: 640,
              // Offset right so the lead paragraph aligns optically with the
              // end of the headline rather than its start. Editorial layouts
              // do this to balance the page.
              marginLeft: 'auto',
            }}
          >
            <p
              style={{
                fontFamily: editorial.sans,
                fontSize: 18,
                lineHeight: 1.6,
                letterSpacing: '-0.005em',
                color: editorial.inkSoft,
                margin: 0,
              }}
            >
              Une lecture limpide de vos comptes, de vos règles et de votre marge —
              avant que les chiffres ne deviennent un problème.
            </p>

            <Link
              href="/auth?mode=signup"
              className="qte-hero-cta"
              style={{
                fontFamily: editorial.serif,
                fontStyle: 'italic',
                fontSize: 22,
                fontWeight: 400,
                color: editorial.accent,
                textDecoration: 'none',
                borderBottom: `1px solid ${editorial.accent}`,
                paddingBottom: 4,
                alignSelf: 'flex-start',
                width: 'fit-content',
                transition: `letter-spacing 400ms ${editorial.easeOut}, color 300ms ${editorial.easeOut}`,
              }}
            >
              Ouvrir un compte
            </Link>
          </div>
        </Reveal>
      </div>

      <style>{`
        .qte-hero-cta:hover {
          letter-spacing: 0.005em;
          color: ${editorial.ink} !important;
          border-color: ${editorial.ink} !important;
        }
      `}</style>
    </section>
  )
}
