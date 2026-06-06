'use client'
// atmoTheme.js — Shared design tokens for the Atmospheric Dark landing variant.
// Centralised so every helper component renders the same warm-coral / deep-navy
// system without re-declaring constants. Plain JS object, no runtime cost.

export const ATMO = {
  bg: '#0a0e1a',
  cardBg: 'linear-gradient(180deg, rgba(20,25,40,0.5), rgba(14,18,28,0.35))',
  text: '#f4f0e8',
  text2: '#a8a4b8',
  text3: '#6b6878',
  accent: '#ff7a59',
  accentGlow: 'rgba(255, 122, 89, 0.18)',
  hairline: 'rgba(244, 240, 232, 0.08)',
  hairlineStrong: 'rgba(244, 240, 232, 0.14)',
  serif: '"Fraunces", "Times New Roman", serif',
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
}

// Section vertical rhythm constants — keep sections breathing.
export const SECTION_PAD = '140px 24px'
export const MAX_W = 1100
