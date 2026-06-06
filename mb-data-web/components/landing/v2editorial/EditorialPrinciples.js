'use client'
// EditorialPrinciples — three columns. Each: tiny italic number, italic serif
// title, one body paragraph. No icons, no cards, no dividers between columns.
// Generous spacing carries the eye left to right.

import Reveal from './Reveal'
import { editorial } from './tokens'

const PRINCIPLES = [
  {
    number: '01',
    title: 'Clarté',
    body: 'Une seule vue pour tous vos comptes. Les chiffres parlent en premier. Les couleurs n\'interviennent que quand la décision l\'exige.',
  },
  {
    number: '02',
    title: 'Discipline',
    body: 'Les règles de chaque firme sont vivantes : trailing drawdown, consistency, payouts. Quantara les suit pour vous, en silence.',
  },
  {
    number: '03',
    title: 'Souveraineté',
    body: 'Vos données restent à vous. Aucun broker, aucune surface marketing. Vous fermez l\'onglet, il ne reste rien — sauf votre lucidité.',
  },
]

export default function EditorialPrinciples() {
  return (
    <section
      style={{
        background: editorial.bg,
        padding: `${editorial.sectionPaddingY} ${editorial.sectionPaddingX}`,
      }}
    >
      <div style={{ maxWidth: editorial.maxWidth, margin: '0 auto' }}>
        <Reveal>
          <p
            style={{
              fontFamily: editorial.sans,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: editorial.inkSoft,
              margin: 0,
              marginBottom: 'clamp(72px, 10vw, 120px)',
            }}
          >
            Trois principes
          </p>
        </Reveal>

        <div
          className="qte-principles-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            columnGap: 'clamp(40px, 6vw, 96px)',
            rowGap: 'clamp(64px, 8vw, 96px)',
            alignItems: 'start',
          }}
        >
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.number} delay={i * 140}>
              <div>
                <div
                  style={{
                    fontFamily: editorial.serif,
                    fontStyle: 'italic',
                    fontWeight: 400,
                    fontSize: 18,
                    color: editorial.inkMuted,
                    marginBottom: 28,
                    letterSpacing: '0.02em',
                  }}
                >
                  {p.number}
                </div>
                <h3
                  style={{
                    fontFamily: editorial.serif,
                    fontStyle: 'italic',
                    fontWeight: 400,
                    fontSize: 'clamp(36px, 4.5vw, 56px)',
                    lineHeight: 1.0,
                    letterSpacing: '-0.03em',
                    color: editorial.ink,
                    margin: 0,
                    marginBottom: 28,
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontFamily: editorial.sans,
                    fontSize: 16,
                    fontWeight: 400,
                    lineHeight: 1.65,
                    letterSpacing: '-0.005em',
                    color: editorial.inkSoft,
                    margin: 0,
                    maxWidth: '34ch',
                  }}
                >
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .qte-principles-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
