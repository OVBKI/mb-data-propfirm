// lib/theme.js — Shared color constants and style objects
//
// Unifies duplicated theme definitions found across:
//   - components/TradesPage.js   (C, card, inputS, btnGhost, btnPrimary)
//   - components/JournalPage.js  (card, inputS, labelS, btnPrimary, btnGhost)
//   - components/HeatmapPage.js  (C, card, inputS)
//   - components/TradeCard.js    (C)
//   - components/CalendarPage.js (IC, card)
//   - app/app/page.js            (cardS)
//
// Toutes les couleurs pointent vers un jeton CSS défini dans app/globals.css.
// C'est ce qui rend le thème clair possible : `style={{ color: C.text }}` produit
// `color: var(--text)`, qui suit le `data-theme` posé sur <html>.
//
// NE JAMAIS remettre une valeur en dur ici (ni ailleurs dans un style inline) :
// elle resterait sombre en thème clair. Seule exception documentée : les couleurs
// passées à Chart.js, qui peint dans un canvas et ne résout pas var() — utiliser
// chartColors() pour celles-là.

/**
 * Unified color palette.
 *
 * Contains every color key found across TradesPage, JournalPage, HeatmapPage,
 * TradeCard, and CalendarPage — merged into one canonical object.
 */
export const C = {
  // Backgrounds / surfaces
  bg:        'var(--bg)',
  surface:   'var(--surface)',
  surface2:  'var(--surface2)',
  surface3:  'var(--tint1)',
  neutral:   'var(--tint2)',

  // Borders
  border:    'var(--border)',
  border2:   'var(--border2)',

  // Text
  text:      'var(--text)',
  text2:     'var(--text2)',
  text3:     'var(--text3)',

  // Accent colors
  blue:      'var(--blue)',
  blueLight: 'var(--blue-light)',
  blueLt:    'var(--blue-light)',   // alias kept for backward compatibility

  green:     'var(--green)',
  greenSoft: 'var(--green-bg)',

  red:       'var(--red)',
  redSoft:   'var(--red-bg)',

  amber:     'var(--amber)',
}

/**
 * Couleurs résolues pour un CANVAS (Chart.js).
 *
 * Chart.js peint dans un <canvas> : il reçoit des chaînes de couleur brutes et
 * ne résout PAS `var(--x)`. Passer C.text à un dataset donne un trait invisible.
 * Cette fonction lit les valeurs calculées sur <html>, donc elle suit le thème.
 *
 * À rappeler quand le thème change (les charts doivent être reconstruits).
 * Renvoie la palette sombre côté serveur, où getComputedStyle n'existe pas.
 */
export function chartColors() {
  const fallback = { grid: 'rgba(255,255,255,0.04)', tick: '#7b839b', text: '#f0ede8' }
  if (typeof window === 'undefined') return fallback
  const cs = getComputedStyle(document.documentElement)
  const read = (name, dflt) => (cs.getPropertyValue(name) || '').trim() || dflt
  return {
    grid: read('--chart-grid', fallback.grid),
    tick: read('--chart-tick', fallback.tick),
    text: read('--text', fallback.text),
  }
}

/**
 * Shared card style — the most common card appearance across the app.
 *
 * Uses CSS variables for easy theming. Matches the pattern used in
 * JournalPage, CalendarPage, and app/page.js (cardS).
 */
export const cardStyle = {
  background: 'var(--surface)',
  border:     '1px solid var(--border)',
  borderRadius: '10px',
  boxShadow:  'var(--shadow-card)',
}

/**
 * Lightweight card style variant — used in the dashboard (app/page.js cardS).
 * Thinner border, no box-shadow, uses CSS variable for border-radius.
 */
export const cardStyleLight = {
  background: 'var(--surface)',
  border:     '0.5px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
}

/**
 * Primary button style — off-white inverted button matching the cosmic theme.
 * Used in JournalPage, TradesPage for primary actions.
 */
export const btnPrimary = {
  padding:       '9px 18px',
  fontSize:      '12.5px',
  fontWeight:    '500',
  background:    'var(--text)',
  color:         'var(--text-inverse)',
  border:        '1px solid transparent',
  borderRadius:  '8px',
  cursor:        'pointer',
  fontFamily:    'inherit',
  letterSpacing: '0.005em',
  boxShadow:     'var(--shadow-card)',
  transition:    'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s',
}

/**
 * Ghost button style — subtle bordered button for secondary actions.
 * Used in JournalPage, TradesPage for filters and secondary controls.
 */
export const btnGhost = {
  padding:       '8px 14px',
  fontSize:      '12px',
  fontWeight:    '500',
  background:    'var(--tint1)',
  border:        '1px solid var(--hairline)',
  color:         'var(--text2)',
  borderRadius:  '8px',
  cursor:        'pointer',
  fontFamily:    'inherit',
  letterSpacing: '0.005em',
  transition:    'color 0.2s, border-color 0.2s, background 0.2s',
}

/**
 * Shared input style — form inputs, search boxes, filter dropdowns.
 * Used in JournalPage, TradesPage, HeatmapPage.
 */
export const inputStyle = {
  width:        '100%',
  padding:      '10px 12px',
  fontSize:     '13px',
  border:       '1px solid var(--hairline)',
  borderRadius: '8px',
  background:   'var(--tint1)',
  color:        'var(--text)',
  outline:      'none',
  transition:   'border-color 0.2s, background 0.2s',
  fontFamily:   'inherit',
}

/**
 * Compact input style variant — used in HeatmapPage and TradesPage
 * where inputs are smaller (filter bars).
 */
export const inputStyleCompact = {
  padding:      '7px 10px',
  fontSize:     '12px',
  border:       '1px solid var(--hairline)',
  borderRadius: '6px',
  background:   'var(--tint1)',
  color:        C.text,
  outline:      'none',
  fontFamily:   'inherit',
}

/**
 * Label style — uppercase micro-labels above form fields.
 * Used in JournalPage for modal form labels.
 */
export const labelStyle = {
  fontSize:       '10.5px',
  fontWeight:     '600',
  color:          'var(--text3)',
  textTransform:  'uppercase',
  letterSpacing:  '0.12em',
  display:        'block',
  marginBottom:   '6px',
}

/**
 * Chip/pill toggle button factory — returns a style object based on active state.
 * Used in JournalPage and CalendarPage for filter chips.
 *
 * @param {boolean} active - Whether the chip is currently selected
 * @returns {Object} Style object
 */
export function chipBtn(active) {
  return {
    padding:      '7px 14px',
    fontSize:     '12px',
    cursor:       'pointer',
    borderRadius: '99px',
    border:       `1px solid ${active ? 'var(--blue-border)' : 'var(--hairline)'}`,
    fontFamily:   'inherit',
    fontWeight:   active ? '600' : '500',
    background:   active ? 'var(--blue-bg)' : 'transparent',
    color:        active ? 'var(--blue-light)' : 'var(--text2)',
    transition:   'all 0.15s',
  }
}
