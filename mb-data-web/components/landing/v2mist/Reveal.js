'use client'
// Reveal — fade-up + slight scale-in on viewport entry.
// Wraps framer-motion's whileInView with the spec's exact transform deltas
// (opacity 0 → 1, translateY 40 → 0, scale 0.985 → 1) and cubic-bezier easing.

import { motion } from 'framer-motion'

export default function Reveal({
  children,
  delay = 0,
  y = 40,
  scale = 0.985,
  duration = 0.9,
  once = true,
  amount = 0.2,
  as = 'div',
  style,
}) {
  const Tag = motion[as] || motion.div
  return (
    <Tag
      style={style}
      initial={{ opacity: 0, y, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  )
}
