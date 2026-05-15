'use client'
// CTA luxury : sobre, restraint, hover subtle.
// Pas de magnetic, pas de glow pulse — la beauté est dans la simplicité et le détail.

import Link from 'next/link'
import { useState } from 'react'

const C = {
  text: '#f0ede8',
  text2: '#9098b0',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.14)',
}

export default function QuietCTA({ href, children, primary = false, large = false }) {
  const [hovered, setHovered] = useState(false)

  const padding = large ? '18px 36px' : '12px 24px'
  const fontSize = large ? 15 : 13
  const letterSpacing = '0.02em'

  const primaryStyle = {
    background: hovered ? '#fff' : C.text,
    color: '#000',
    border: '1px solid transparent',
  }

  const secondaryStyle = {
    background: 'transparent',
    color: hovered ? C.text : C.text2,
    border: `1px solid ${hovered ? C.border2 : C.border}`,
  }

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding,
        fontSize,
        fontWeight: 500,
        fontFamily: 'var(--font-geist)',
        letterSpacing,
        borderRadius: 99,
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background 0.3s cubic-bezier(0.16,1,0.3,1), color 0.3s, border-color 0.3s, transform 0.3s',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        ...(primary ? primaryStyle : secondaryStyle),
      }}
    >
      <span>{children}</span>
      <span style={{
        display: 'inline-block',
        transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        transform: hovered ? 'translateX(3px)' : 'translateX(0)',
      }}>→</span>
    </Link>
  )
}
