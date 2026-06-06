'use client'
// MistHero — centered hero with eyebrow, oversized headline, soft subtitle and
// two CTAs. Includes a subtle scroll-driven parallax on the subtitle so the
// hero feels alive without flashing or jarring the user.

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { mist, fonts } from './tokens'

export default function MistHero({ t }) {
  const subtitleRef = useRef(null)
  const [scrollY, setScrollY] = useState(0)

  // Subtle scroll parallax on subtitle. SSR-safe via useEffect.
  useEffect(() => {
    let raf = 0
    const update = () => {
      setScrollY(window.scrollY)
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  // Hero subtitle drifts up at ~20% of scroll, capped so it never escapes.
  const parallax = Math.max(-60, -scrollY * 0.2)

  // Split headline on \n so it renders multi-line gracefully.
  const headline = t('hero.headline') || ''
  const headlineLines = headline.split('\n')

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '160px 24px 120px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 920, margin: '0 auto', width: '100%' }}>
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: mist.text2,
            opacity: 0.7,
            marginBottom: 28,
          }}
        >
          Beta privée
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: fonts.title,
            fontSize: 'clamp(48px, 7vw, 96px)',
            fontWeight: 500,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: mist.text,
            margin: '0 auto 28px',
            maxWidth: 18 * 60, // soft optical cap
          }}
        >
          {headlineLines.map((line, i) => (
            <span key={i} style={{ display: 'block' }}>
              {line}
            </span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          ref={subtitleRef}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: fonts.body,
            fontSize: 18,
            lineHeight: 1.65,
            letterSpacing: '-0.005em',
            color: mist.text2,
            maxWidth: 640,
            margin: '0 auto 44px',
            transform: `translateY(${parallax}px)`,
            transition: 'transform 0.05s linear',
          }}
        >
          {t('hero.subtitle')}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            gap: 22,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Link
            href="/auth?mode=signup"
            className="mist-hero-cta-primary"
            style={{
              fontFamily: fonts.body,
              fontSize: 15,
              fontWeight: 500,
              color: '#fff',
              textDecoration: 'none',
              padding: '15px 30px',
              borderRadius: 999,
              background: mist.peach,
              boxShadow: `0 14px 36px -12px ${mist.peach}`,
              transition: `background 0.4s ${mist.ease}, transform 0.4s ${mist.ease}, box-shadow 0.4s ${mist.ease}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Commencer maintenant
            <span style={{ fontSize: 14, opacity: 0.9 }}>→</span>
          </Link>

          <Link
            href="/demo"
            className="mist-hero-cta-secondary"
            style={{
              fontFamily: fonts.body,
              fontSize: 15,
              fontWeight: 500,
              color: mist.text2,
              textDecoration: 'none',
              padding: '15px 18px',
              position: 'relative',
              transition: `color 0.3s ${mist.ease}`,
            }}
          >
            Voir la démo
          </Link>
        </motion.div>
      </div>

      <style>{`
        .mist-hero-cta-primary:hover {
          background: ${mist.peachHover} !important;
          transform: translateY(-2px);
          box-shadow: 0 18px 42px -10px ${mist.peachHover} !important;
        }
        .mist-hero-cta-secondary { display: inline-flex; align-items: center; gap: 6px; }
        .mist-hero-cta-secondary::after {
          content: '→';
          font-size: 14px;
          opacity: 0.6;
          transition: transform 0.4s ${mist.ease}, opacity 0.4s ${mist.ease};
        }
        .mist-hero-cta-secondary:hover { color: ${mist.text} !important; }
        .mist-hero-cta-secondary:hover::after {
          transform: translateX(4px);
          opacity: 1;
        }
      `}</style>
    </section>
  )
}
