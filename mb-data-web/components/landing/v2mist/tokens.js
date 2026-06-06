// v2mist/tokens.js — shared Mist & Mesh design tokens (JS only).
// Values are copied verbatim from the spec, do not refactor to variables.

export const mist = {
  // Mesh stops
  rose: '#f4d4d0',
  lavender: '#d4c4f4',
  sky: '#c4d8f4',
  cream: '#fff5e8',

  // Base
  bg: '#fbf7f2',

  // Text
  text: '#2d2a3e',
  text2: '#5d5870',
  text3: '#9c97a8',

  // Accent
  peach: '#e8b394',
  peachHover: '#d99a78',

  // Glass
  glassBg: 'rgba(255, 255, 255, 0.55)',
  glassBorder: '1px solid rgba(255, 255, 255, 0.5)',
  glassBlur: 'blur(20px)',

  // Soft shadow
  softShadow: '0 20px 60px -20px rgba(45, 42, 62, 0.15)',
  softShadowLift: '0 30px 80px -20px rgba(45, 42, 62, 0.22)',

  // Smooth fluid easing
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
}

export const fonts = {
  title: '"Cabinet Grotesk", "Fraunces", "Inter", system-ui, sans-serif',
  body: '"Inter", system-ui, -apple-system, sans-serif',
}

// Reusable inline-style helper for frosted glass surface.
export function glassStyle(extra = {}) {
  return {
    background: mist.glassBg,
    backdropFilter: mist.glassBlur,
    WebkitBackdropFilter: mist.glassBlur,
    border: mist.glassBorder,
    borderRadius: 24,
    boxShadow: mist.softShadow,
    ...extra,
  }
}
