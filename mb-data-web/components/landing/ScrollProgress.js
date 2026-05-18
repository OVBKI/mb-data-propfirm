'use client'
// Barre de progression scroll très fine en haut de page.
// Signature détail luxury — tu sais où tu es dans la page sans avoir besoin d'une scrollbar visible.

import { motion, useScroll, useSpring } from 'framer-motion'

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <motion.div
      style={{
        scaleX,
        transformOrigin: '0%',
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 1.5,
        background: 'linear-gradient(90deg, #2d6fff, #4d8fff)',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    />
  )
}
