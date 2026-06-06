'use client'
// EditorialManifesto — eyebrow on the left (3 cols), body on the right (7 cols).
// Three short paragraphs at 20px set the tone: precision, calm, sovereignty.

import Reveal from './Reveal'
import { editorial } from './tokens'

const PARAGRAPHS = [
  'Le trading PropFirm est un métier de précision. La gestion devrait l\'être aussi.',
  'Quantara rassemble vos comptes, vos firmes, vos règles et vos marges dans une seule lecture — sans bruit, sans surcouche, sans drame.',
  'L\'outil disparaît. Reste ce qui compte : la décision, le sang-froid, la suite.',
]

export default function EditorialManifesto() {
  return (
    <section
      style={{
        background: editorial.bg,
        padding: `${editorial.sectionPaddingY} ${editorial.sectionPaddingX}`,
      }}
    >
      <div
        className="qte-manifesto-grid"
        style={{
          maxWidth: editorial.maxWidth,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          columnGap: 'clamp(24px, 4vw, 64px)',
          rowGap: 'clamp(40px, 6vw, 72px)',
          alignItems: 'start',
        }}
      >
        <Reveal style={{ gridColumn: 'span 3' }}>
          <p
            style={{
              fontFamily: editorial.sans,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: editorial.inkSoft,
              margin: 0,
              paddingTop: 12,
            }}
          >
            Manifesto
          </p>
        </Reveal>

        <div
          className="qte-manifesto-body"
          style={{
            gridColumn: 'span 8',
            gridColumnStart: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(28px, 3vw, 40px)',
          }}
        >
          {PARAGRAPHS.map((text, i) => (
            <Reveal key={i} delay={100 + i * 120}>
              <p
                style={{
                  fontFamily: editorial.sans,
                  fontSize: 20,
                  fontWeight: 400,
                  lineHeight: 1.55,
                  letterSpacing: '-0.005em',
                  color: i === 0 ? editorial.ink : editorial.inkSoft,
                  margin: 0,
                  maxWidth: '52ch',
                }}
              >
                {text}
              </p>
            </Reveal>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .qte-manifesto-grid > * {
            grid-column: 1 / -1 !important;
          }
          .qte-manifesto-body {
            grid-column-start: auto !important;
          }
        }
      `}</style>
    </section>
  )
}
