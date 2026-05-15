'use client'
// Footer éditorial luxury — typo serif italic en headline, navigation minimaliste,
// gros wordmark Quantara qui prend de l'espace. Magazine feel.

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const C = {
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blueLight: '#4d8fff',
  green: '#1db87a',
  border: 'rgba(255,255,255,0.06)',
}

const LUXURY_EASE = [0.16, 1, 0.3, 1]

export default function EditorialFooter() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <footer ref={ref} style={{
      position: 'relative',
      padding: 'clamp(80px, 14vh, 160px) clamp(24px, 6vw, 96px) 60px',
      marginTop: 80,
      borderTop: `1px solid ${C.border}`,
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative' }}>

        {/* Wordmark énorme en background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 2, delay: 0.3, ease: LUXURY_EASE }}
          style={{
            position: 'absolute',
            bottom: -40,
            left: -8,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 'clamp(120px, 24vw, 360px)',
            fontWeight: 400,
            lineHeight: 0.85,
            letterSpacing: '-0.06em',
            color: 'rgba(240,237,232,0.04)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >Quantara.</motion.div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Tagline et brand */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: LUXURY_EASE }}
            style={{ maxWidth: 700, marginBottom: 80 }}
          >
            <div style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: C.text3,
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{ width: 28, height: 1, background: C.blueLight, opacity: 0.6 }} />
              <span>Quantara LLC · Texas</span>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(36px, 5vw, 64px)',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: C.text,
              marginBottom: 24,
            }}>
              Une autre façon de tracker.
            </h2>
            <p style={{
              fontFamily: 'var(--font-geist-sans)',
              fontSize: 'clamp(14px, 1.2vw, 16px)',
              color: C.text2,
              lineHeight: 1.7,
              maxWidth: 460,
            }}>
              Pensé pour les traders qui prennent leur business au sérieux. Pas de gadget. Pas de gimmick. Juste les outils qui comptent.
            </p>
          </motion.div>

          {/* Grid de liens */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.3, ease: LUXURY_EASE }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 50,
              marginBottom: 80,
              maxWidth: 800,
            }}
          >
            {[
              {
                title: 'Produit',
                links: [
                  { label: 'Dashboard', href: '/app' },
                  { label: 'Roadmap', href: '#roadmap' },
                  { label: 'Changelog', href: '#changelog' },
                ],
              },
              {
                title: 'Légal',
                links: [
                  { label: 'CGU', href: '/legal/cgu' },
                  { label: 'Privacy', href: '/legal/privacy' },
                  { label: 'Imprint', href: '/legal/imprint' },
                ],
              },
              {
                title: 'Contact',
                links: [
                  { label: 'admin@quantara.tech', href: 'mailto:admin@quantara.tech' },
                  { label: 'support@quantara.tech', href: 'mailto:support@quantara.tech' },
                ],
              },
            ].map(group => (
              <div key={group.title}>
                <div style={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: 10,
                  fontWeight: 500,
                  color: C.text3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  marginBottom: 18,
                }}>{group.title}</div>
                {group.links.map(link => (
                  <Link
                    key={link.label}
                    href={link.href}
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-geist-sans)',
                      fontSize: 14,
                      color: C.text2,
                      marginBottom: 10,
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = C.text}
                    onMouseLeave={e => e.currentTarget.style.color = C.text2}
                  >{link.label}</Link>
                ))}
              </div>
            ))}
          </motion.div>

          {/* Bottom legal bar */}
          <div style={{
            paddingTop: 32,
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
            fontFamily: 'var(--font-geist-mono)',
            fontSize: 11,
            color: C.text3,
            letterSpacing: '0.05em',
          }}>
            <div>
              © 2026 Quantara LLC · A Texas limited liability company
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: C.green,
                boxShadow: `0 0 8px ${C.green}`,
              }} />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
