'use client'
// FrostedCard — generic frosted glass surface with lift-on-hover.
// Uses framer-motion for the cubic-bezier hover lift the spec calls for.

import { motion } from 'framer-motion'
import { mist } from './tokens'

export default function FrostedCard({
  children,
  padding = 36,
  borderRadius = 24,
  hoverLift = true,
  style = {},
  glow = false,
  as = 'div',
  className,
}) {
  const Component = motion[as] || motion.div

  const base = {
    background: mist.glassBg,
    backdropFilter: mist.glassBlur,
    WebkitBackdropFilter: mist.glassBlur,
    border: mist.glassBorder,
    borderRadius,
    padding,
    boxShadow: glow
      ? `${mist.softShadow}, 0 0 0 2px ${mist.peach}55, 0 0 40px -10px ${mist.peach}66`
      : mist.softShadow,
    transition: `box-shadow 0.4s ${mist.ease}`,
    ...style,
  }

  if (!hoverLift) {
    return (
      <Component className={className} style={base}>
        {children}
      </Component>
    )
  }

  return (
    <Component
      className={className}
      style={base}
      whileHover={{
        y: -4,
        boxShadow: glow
          ? `${mist.softShadowLift}, 0 0 0 2px ${mist.peach}66, 0 0 50px -10px ${mist.peach}88`
          : mist.softShadowLift,
        transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      }}
    >
      {children}
    </Component>
  )
}
