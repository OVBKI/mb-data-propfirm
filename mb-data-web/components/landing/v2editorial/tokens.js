'use client'
// Editorial Whisper — shared design tokens for the v2 landing page.
// Single source of truth for palette, typography, easings, spacing.

export const editorial = {
  // Palette — warm cream + ink, with sparing burgundy accent
  bg: '#faf8f4',
  ink: '#0e0e0e',
  inkSoft: '#5a534a',
  inkMuted: '#9b9389',
  accent: '#6b2737',
  rule: 'rgba(14,14,14,0.12)',
  ruleStrong: 'rgba(14,14,14,0.24)',
  accentSoft: 'rgba(107,39,55,0.12)',

  // Typography stacks (Google Fonts loaded once at the root of the page)
  serif: '"Instrument Serif", "Iowan Old Style", Georgia, serif',
  sans:  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

  // Eases — only smooth cubic-beziers, no springs
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOut: 'cubic-bezier(0.65, 0.05, 0.36, 1)',

  // Layout
  maxWidth: 1280,
  sectionPaddingY: 'clamp(120px, 18vw, 200px)',
  sectionPaddingX: 'clamp(24px, 5vw, 80px)',
}

// Eyebrow label style — 11px UPPERCASE, wide tracking, Inter 600
export const eyebrowStyle = {
  fontFamily: editorial.sans,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: editorial.inkSoft,
  margin: 0,
}

// Body paragraph — 16/17 px, 1.65 line-height, max 65ch
export const bodyStyle = {
  fontFamily: editorial.sans,
  fontSize: 17,
  fontWeight: 400,
  lineHeight: 1.65,
  letterSpacing: '-0.005em',
  color: editorial.inkSoft,
  maxWidth: '65ch',
  margin: 0,
}
