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
// Colors use raw values for components that inline them, and CSS variable
// references (var(--surface), etc.) where the existing code already does.
// The raw values below match the CSS custom properties defined in globals.css.

/**
 * Unified color palette.
 *
 * Contains every color key found across TradesPage, JournalPage, HeatmapPage,
 * TradeCard, and CalendarPage — merged into one canonical object.
 */
export const C = {
  // Backgrounds / surfaces
  bg:        'rgba(10,12,16,1)',
  surface:   'rgba(20,23,32,0.65)',
  surface2:  'rgba(28,32,48,0.7)',
  surface3:  'rgba(255,255,255,0.02)',
  neutral:   'rgba(255,255,255,0.04)',

  // Borders
  border:    'rgba(255,255,255,0.07)',
  border2:   'rgba(255,255,255,0.13)',

  // Text
  text:      '#f0ede8',
  text2:     '#9098b0',
  text3:     '#5a6275',

  // Accent colors
  blue:      '#2d6fff',
  blueLight: '#4d8fff',
  blueLt:    '#4d8fff',   // alias kept for backward compatibility

  green:     '#1db87a',
  greenSoft: 'rgba(29,184,122,0.15)',

  red:       '#e8504a',
  redSoft:   'rgba(232,80,74,0.15)',

  amber:     '#fac775',
}

/**
 * Shared card style — the most common card appearance across the app.
 *
 * Uses CSS variables for easy theming. Matches the pattern used in
 * JournalPage, CalendarPage, and app/page.js (cardS).
 */
export const cardStyle = {
  background: 'var(--surface)',
  border:     '1px solid rgba(255,255,255,0.06)',
  borderRadius: '10px',
  boxShadow:  '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)',
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
  color:         '#0a0c10',
  border:        '1px solid transparent',
  borderRadius:  '8px',
  cursor:        'pointer',
  fontFamily:    'inherit',
  letterSpacing: '0.005em',
  boxShadow:     '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)',
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
  background:    'rgba(255,255,255,0.025)',
  border:        '1px solid rgba(255,255,255,0.10)',
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
  border:       '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  background:   'rgba(255,255,255,0.02)',
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
  border:       '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  background:   'rgba(255,255,255,0.02)',
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
    border:       `1px solid ${active ? 'rgba(45,111,255,0.4)' : 'rgba(255,255,255,0.10)'}`,
    fontFamily:   'inherit',
    fontWeight:   active ? '600' : '500',
    background:   active ? 'rgba(45,111,255,0.15)' : 'transparent',
    color:        active ? 'var(--blue-light)' : 'var(--text2)',
    transition:   'all 0.15s',
  }
}
