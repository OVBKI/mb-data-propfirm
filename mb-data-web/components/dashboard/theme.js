// Design system Quantara — tokens partagés pour toutes les pages /app, /admin, etc.
//
// Toutes les couleurs pointent vers un jeton CSS (app/globals.css) : c'est ce qui
// leur permet de suivre le thème clair. Ne jamais remettre une valeur en dur.
// Importer T (theme) et utiliser dans les inline styles ou les composants partagés.
//
// Usage : import { T } from '@/components/dashboard/theme'  → T.color.blue, T.font.mono...

export const T = {
  // === COULEURS ===
  // Palette cosmic Quantara : dark + bleus + accents états
  color: {
    // Fond
    bg:         'var(--bg)',           // fond de page
    bg2:        'var(--bg)',           // alt fond
    surface:    'var(--surface)',       // cards
    surfaceSolid: 'var(--surface)',    // cards opaques (modals, dropdowns)
    surface2:   'var(--surface2)',     // cards nested
    surface2Solid: 'var(--surface2)',

    // Bordures
    border:     'var(--border)',
    borderHover: 'var(--blue-border)',
    borderStrong: 'var(--border2)',

    // Texte
    text:       'var(--text)',         // primary (titres, valeurs)
    text2:      'var(--text2)',        // secondary (labels, sous-titres)
    text3:      'var(--text3)',        // tertiary (meta info, placeholders)

    // Marque
    blue:       'var(--blue)',         // bleu Quantara principal
    blueLight:  'var(--blue-light)',   // hover / accents
    blueSoft:   'var(--blue-bg)',      // backgrounds hover, badges info
    blueRing:   'var(--blue-border)',  // focus rings, borders actifs

    // États
    green:      'var(--green)',
    greenSoft:  'var(--green-bg)',
    red:        'var(--red)',
    redSoft:    'var(--red-bg)',
    amber:      'var(--amber)',
    amberSoft:  'var(--amber-bg)',

    // Frosted glass effect
    glassBg:    'var(--surface)',
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
    glow: '0 0 32px var(--blue-bg)',
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
