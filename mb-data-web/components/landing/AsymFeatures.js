'use client'
// Features asymmétriques — grille NON régulière, certaines cards plus larges, scroll reveal.
// Brise les patterns "3 colonnes égales" génériques.

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const C = {
  surface: 'rgba(20,23,32,0.6)',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(77,143,255,0.3)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blueLight: '#4d8fff',
  green: '#1db87a',
}

const LUXURY_EASE = [0.16, 1, 0.3, 1]

function FeatureItem({ feature, index, size = 'normal' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const padding = size === 'large' ? 40 : 28
  const titleSize = size === 'large' ? 26 : 19
  const numFontSize = size === 'large' ? 14 : 12

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, delay: index * 0.07, ease: LUXURY_EASE }}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        padding,
        borderRadius: 4,
        backdropFilter: 'blur(20px)',
        position: 'relative',
        transition: 'border-color 0.4s, transform 0.4s',
        cursor: 'default',
        overflow: 'hidden',
        height: '100%',
      }}
      whileHover={{ borderColor: C.borderHover, y: -2 }}
    >
      {/* Index numéroté façon éditoriale */}
      <div style={{
        fontFamily: 'var(--font-geist-mono)',
        fontSize: numFontSize,
        color: C.text3,
        letterSpacing: '0.15em',
        marginBottom: 24,
      }}>
        {String(index + 1).padStart(2, '0')} / 06
      </div>

      {/* Icon (minimal, pas d'emoji circle) */}
      <div style={{
        fontSize: size === 'large' ? 36 : 28,
        marginBottom: 20,
        filter: 'grayscale(0.3)',
      }}>{feature.icon}</div>

      {/* Title with serif italic accent */}
      <h3 style={{
        fontFamily: 'var(--font-geist-sans)',
        fontWeight: 500,
        fontSize: titleSize,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
        color: C.text,
        marginBottom: 14,
      }}>{feature.title}</h3>

      <p style={{
        fontFamily: 'var(--font-geist-sans)',
        fontSize: size === 'large' ? 15 : 13.5,
        lineHeight: 1.65,
        color: C.text2,
        fontWeight: 400,
      }}>{feature.desc}</p>

      {/* Ligne accent qui se révèle au scroll */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1.2, delay: 0.4 + index * 0.07, ease: LUXURY_EASE }}
        style={{
          position: 'absolute',
          bottom: 0, left: padding, right: padding,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${C.blueLight}, transparent)`,
          transformOrigin: 'left',
          opacity: 0.4,
        }}
      />
    </motion.div>
  )
}

export default function AsymFeatures({ features }) {
  // Layout : 2 colonnes principales, mais avec quelques cards qui span 2 colonnes
  // Pattern : [LARGE, SMALL] [SMALL, LARGE] [SMALL, SMALL] — donne du rythme
  return (
    <section style={{
      padding: 'clamp(60px, 10vh, 120px) clamp(24px, 6vw, 96px)',
      maxWidth: 1400,
      margin: '0 auto',
    }}>
      <div style={{ marginBottom: 80, maxWidth: 720 }}>
        <div style={{
          fontFamily: 'var(--font-geist-mono)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: C.text3,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ width: 28, height: 1, background: C.blueLight, opacity: 0.6 }} />
          <span>Features · 06</span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(40px, 6vw, 76px)',
          lineHeight: 1,
          letterSpacing: '-0.03em',
          color: C.text,
          marginBottom: 24,
        }}>
          Tout, sauf le superflu.
        </h2>
        <p style={{
          fontFamily: 'var(--font-geist-sans)',
          fontSize: 'clamp(15px, 1.4vw, 18px)',
          color: C.text2,
          lineHeight: 1.6,
          maxWidth: 540,
        }}>
          Conçu par et pour les traders PropFirm. Chaque feature résout un problème réel — pas une fonctionnalité gadget.
        </p>
      </div>

      {/* Grid asymétrique */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 18,
      }}
      className="asym-grid"
      >
        {/* Card 1 : grande (4 cols) */}
        <div style={{ gridColumn: 'span 4' }}>
          <FeatureItem feature={features[0]} index={0} size="large" />
        </div>
        {/* Card 2 : petite (2 cols) */}
        <div style={{ gridColumn: 'span 2' }}>
          <FeatureItem feature={features[1]} index={1} />
        </div>
        {/* Card 3 : petite (2 cols) */}
        <div style={{ gridColumn: 'span 2' }}>
          <FeatureItem feature={features[2]} index={2} />
        </div>
        {/* Card 4 : grande (4 cols) */}
        <div style={{ gridColumn: 'span 4' }}>
          <FeatureItem feature={features[3]} index={3} size="large" />
        </div>
        {/* Card 5 : 3 cols */}
        <div style={{ gridColumn: 'span 3' }}>
          <FeatureItem feature={features[4]} index={4} />
        </div>
        {/* Card 6 : 3 cols */}
        <div style={{ gridColumn: 'span 3' }}>
          <FeatureItem feature={features[5]} index={5} />
        </div>
      </div>

      {/* Mobile : tout en 1 col */}
      <style>{`
        @media (max-width: 900px) {
          .asym-grid {
            grid-template-columns: 1fr !important;
          }
          .asym-grid > div {
            grid-column: span 1 !important;
          }
        }
      `}</style>
    </section>
  )
}
