'use client'
// EditorialPullQuote — large centered italic serif sentence, attribution
// underneath in small caps. Sits on the cream, no quotes, no box.

import Reveal from './Reveal'
import WordReveal from './WordReveal'
import { editorial } from './tokens'

const QUOTE = 'Le drawdown ne pardonne pas l\'inattention. Il salue la lucidité.'
const ATTRIBUTION = 'Manifesto Quantara'

export default function EditorialPullQuote() {
  return (
    <section
      style={{
        background: editorial.bg,
        padding: `${editorial.sectionPaddingY} ${editorial.sectionPaddingX}`,
      }}
    >
      <figure
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: 0,
          textAlign: 'center',
        }}
      >
        <WordReveal
          text={QUOTE}
          as="blockquote"
          style={{
            fontFamily: editorial.serif,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(34px, 5.2vw, 68px)',
            lineHeight: 1.15,
            letterSpacing: '-0.025em',
            color: editorial.ink,
            margin: 0,
            // Quote marks are decorative noise here — the italic serif and
            // the centred layout already say "this is a pull quote".
          }}
        />

        <Reveal delay={400}>
          <figcaption
            style={{
              marginTop: 'clamp(40px, 5vw, 64px)',
              fontFamily: editorial.sans,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: editorial.inkMuted,
            }}
          >
            {/* Em-dash is a hairline ornament — single character, no SVG. */}
            <span style={{ marginRight: 12, color: editorial.inkMuted }}>—</span>
            {ATTRIBUTION}
          </figcaption>
        </Reveal>
      </figure>
    </section>
  )
}
