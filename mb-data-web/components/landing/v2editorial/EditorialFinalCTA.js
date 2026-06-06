'use client'
// EditorialFinalCTA — closing italic headline + small body + single burgundy
// underline link. The page ends on a quiet imperative, not a shout.

import Link from 'next/link'
import { useT } from '../../LanguageProvider'
import WordReveal from './WordReveal'
import Reveal from './Reveal'
import { editorial } from './tokens'

export default function EditorialFinalCTA() {
  const t = useT()

  return (
    <section
      style={{
        background: editorial.bg,
        padding: `${editorial.sectionPaddingY} ${editorial.sectionPaddingX}`,
        textAlign: 'left',
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(40px, 5vw, 64px)',
        }}
      >
        <WordReveal
          text="Reprenez le contrôle."
          as="h2"
          style={{
            fontFamily: editorial.serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(56px, 8vw, 120px)',
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            color: editorial.ink,
            margin: 0,
            maxWidth: '12ch',
          }}
        />

        <Reveal delay={300}>
          <p
            style={{
              fontFamily: editorial.sans,
              fontSize: 18,
              fontWeight: 400,
              lineHeight: 1.6,
              letterSpacing: '-0.005em',
              color: editorial.inkSoft,
              margin: 0,
              maxWidth: '54ch',
            }}
          >
            Quelques minutes suffisent pour relier vos comptes et retrouver une lecture
            claire — sans installer, sans engager, sans bruit.
          </p>
        </Reveal>

        <Reveal delay={450}>
          <Link
            href="/auth?mode=signup"
            className="qte-final-cta"
            style={{
              fontFamily: editorial.serif,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 28,
              color: editorial.accent,
              textDecoration: 'none',
              borderBottom: `1px solid ${editorial.accent}`,
              paddingBottom: 6,
              alignSelf: 'flex-start',
              width: 'fit-content',
              transition: `letter-spacing 400ms ${editorial.easeOut}, color 300ms ${editorial.easeOut}`,
            }}
          >
            {t('finalCTA.button') || 'Commencer maintenant'}
          </Link>
        </Reveal>
      </div>

      <style>{`
        .qte-final-cta:hover {
          letter-spacing: 0.005em;
          color: ${editorial.ink} !important;
          border-color: ${editorial.ink} !important;
        }
      `}</style>
    </section>
  )
}
