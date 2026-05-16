// Design system Quantara — tokens partagés pour toutes les pages /app, /admin, etc.
// Importer T (theme) et utiliser dans les inline styles ou les composants partagés.
//
// Usage : import { T } from '@/components/dashboard/theme'  → T.color.blue, T.font.mono...

export const T = {
  // === COULEURS ===
  // Palette cosmic Quantara : dark + bleus + accents états
  color: {
    // Fond
    bg:         '#0a0c10',      // fond le plus sombre (page background)
    bg2:        '#0d0f14',      // alt fond
    surface:    'rgba(20,23,32,0.65)',     // cards (frosted glass quand sur SpaceBackground)
    surfaceSolid: '#141720',    // cards opaques (modals, dropdowns)
    surface2:   'rgba(28,32,48,0.7)',      // cards nested
    surface2Solid: '#1c2030',

    // Bordures
    border:     'rgba(255,255,255,0.07)',
    borderHover: 'rgba(45,111,255,0.35)',
    borderStrong: 'rgba(255,255,255,0.13)',

    // Texte
    text:       '#f0ede8',      // primary (titres, valeurs)
    text2:      '#9098b0',      // secondary (labels, sous-titres)
    text3:      '#5a6275',      // tertiary (meta info, placeholders)

    // Marque
    blue:       '#2d6fff',      // bleu Quantara principal
    blueLight:  '#4d8fff',      // hover / accents
    blueSoft:   'rgba(45,111,255,0.12)',   // backgrounds hover, badges info
    blueRing:   'rgba(45,111,255,0.4)',    // focus rings, borders actifs

    // États
    green:      '#10b981',
    greenSoft:  'rgba(16,185,129,0.15)',
    red:        '#ef4444',
    redSoft:    'rgba(239,68,68,0.15)',
    amber:      '#fac775',
    amberSoft:  'rgba(250,199,117,0.15)',

    // Frosted glass effect
    glassBg:    'rgba(20,23,32,0.55)',
    glassBlur:  'blur(20px)',
  },

  // === TYPOGRAPHIE ===
  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace',
  },

  // === ESPACEMENT ===
  // Échelle 4px (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
  space: {
    xs:  4,
    sm:  8,
    md:  12,
    lg:  16,
    xl:  20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
  },

  // === BORDER RADIUS ===
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 14,
    pill: 99,
  },

  // === OMBRES ===
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.2)',
    md: '0 4px 12px rgba(0,0,0,0.25)',
    lg: '0 12px 32px rgba(0,0,0,0.4)',
    glow: '0 0 32px rgba(45,111,255,0.15)',
  },

  // === TRANSITIONS ===
  transition: {
    fast: 'all 0.15s ease',
    base: 'all 0.2s ease',
    slow: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  },

  // === Z-INDEX (ordre des layers) ===
  z: {
    bg: 0,
    content: 1,
    topbar: 50,
    sidebar: 60,
    modal: 100,
    toast: 200,
  },
}
