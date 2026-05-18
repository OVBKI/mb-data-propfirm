'use client'
// Steps améliorés : ligne lumineuse verticale qui connecte les 3 cards + scroll reveal en cascade.
// Garde le design "card numérotée" mais ajoute du dynamisme.

import { useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { useT } from '../LanguageProvider'

const C = {
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  amber: '#fac775',
}

const LUXE_EASE = [0.16, 1, 0.3, 1]

function StepCard({ step, index, total }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: LUXE_EASE }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(20,23,32,0.5)',
        border: `1px solid ${hovered ? 'rgba(77,143,255,0.3)' : C.border}`,
        borderRadius: 14,
        padding: 32,
        position: 'relative',
        backdropFilter: 'blur(20px)',
        transition: 'border-color 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'default',
      }}
    >
      {/* Numéro avec halo */}
      <motion.div
        animate={hovered ? {
          boxShadow: `0 6px 20px ${C.blue}aa`,
          scale: 1.1,
        } : {
          boxShadow: `0 6px 16px ${C.blue}66`,
          scale: 1,
        }}
        transition={{ duration: 0.4, ease: LUXE_EASE }}
        style={{
          position: 'absolute', top: -18, left: 28,
          width: 38, height: 38,
          background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 14, color: '#fff',
          letterSpacing: '0.02em',
        }}
      >{step.n}</motion.div>

      <div style={{ height: 18 }} />
      <h3 style={{
        fontSize: 18,
        fontWeight: 700,
        marginBottom: 10,
        color: C.text,
        letterSpacing: '-0.01em',
      }}>{step.title}</h3>
      <p style={{ fontSize: 13.5, color: C.text2, lineHeight: 1.65 }}>{step.desc}</p>

      {/* Ligne accent en bas qui apparait au hover */}
      <motion.div
        animate={{ scaleX: hovered ? 1 : 0 }}
        transition={{ duration: 0.5, ease: LUXE_EASE }}
        style={{
          position: 'absolute',
          bottom: 0, left: 28, right: 28,
          height: 1.5,
          background: `linear-gradient(90deg, transparent, ${C.blueLight}, transparent)`,
          transformOrigin: 'left',
          borderRadius: 1,
        }}
      />
    </motion.div>
  )
}

export default function EnhancedSteps({ steps }) {
  const t = useT()
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  // Ligne lumineuse qui se construit selon le scroll
  const lineProgress = useTransform(scrollYProgress, [0.1, 0.6], [0, 1])

  return (
    <section ref={sectionRef} style={{
      padding: '80px 24px',
      position: 'relative',
      background: `linear-gradient(180deg, transparent, ${C.surface}30, transparent)`,
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: C.amber,
            textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12,
          }}>{t('steps.eyebrow')}</div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 800, marginBottom: 14,
            letterSpacing: '-0.02em',
            color: C.text,
          }}>{t('steps.heading')}</h2>
        </div>

        {/* Cards avec ligne de connexion derrière (visible sur desktop seulement) */}
        <div style={{ position: 'relative' }}>
          {/* Ligne horizontale lumineuse qui se construit au scroll (desktop only) */}
          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: '15%',
              right: '15%',
              height: 1,
              background: `linear-gradient(90deg, ${C.blue}66, ${C.blueLight}, ${C.blue}66)`,
              transformOrigin: 'left',
              scaleX: lineProgress,
              opacity: 0.4,
              filter: 'blur(0.5px)',
              zIndex: 0,
              pointerEvents: 'none',
            }}
            className="steps-connector"
          />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 28,
            position: 'relative',
            zIndex: 1,
          }}>
            {steps.map((step, i) => (
              <StepCard key={step.n} step={step} index={i} total={steps.length} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .steps-connector { display: none !important; }
        }
      `}</style>
    </section>
  )
}
