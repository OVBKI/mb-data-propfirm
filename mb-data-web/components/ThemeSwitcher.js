'use client'
// components/ThemeSwitcher.js — Sélecteur Sombre / Clair / Système.
//
// USAGE :
//   <ThemeSwitcher />              // 3 options (réglages)
//   <ThemeSwitcher compact />      // version dense pour la top bar
//   <ThemeToggle />                // bouton unique ☾/☀ (bascule directe)
//
// Le sombre reste le défaut de l'app ; « Système » est un choix explicite, pas
// un comportement automatique.

import { useTheme } from './ThemeProvider'

const OPTIONS = [
  { value: 'dark', icon: '☾', label: 'Sombre' },
  { value: 'light', icon: '☀', label: 'Clair' },
  { value: 'system', icon: '⌘', label: 'Système' },
]

export default function ThemeSwitcher({ compact = false }) {
  const { preference, setTheme } = useTheme()

  const size = compact ? { pad: '3px 8px', font: 10 } : { pad: '6px 12px', font: 11.5 }

  const btnStyle = (isActive) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: size.pad,
    minHeight: 32,
    fontSize: size.font,
    fontWeight: 600,
    background: isActive ? 'var(--tint3)' : 'transparent',
    color: isActive ? 'var(--text)' : 'var(--text3)',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.02em',
    transition: 'color 0.15s, background 0.15s',
  })

  return (
    <div
      role="group"
      aria-label="Thème"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--hairline)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--tint1)',
        verticalAlign: 'middle',
      }}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setTheme(opt.value)}
          style={btnStyle(preference === opt.value)}
          aria-pressed={preference === opt.value}
          aria-label={opt.label}
          title={opt.label}
        >
          <span aria-hidden="true" style={{ fontSize: size.font + 1, lineHeight: 1 }}>{opt.icon}</span>
          {!compact && opt.label}
        </button>
      ))}
    </div>
  )
}

// Bouton unique — bascule sombre ↔ clair sans passer par « Système ».
// Pratique dans une barre d'outils où trois boutons ne rentrent pas.
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const next = theme === 'light' ? 'sombre' : 'clair'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Passer en thème ${next}`}
      title={`Passer en thème ${next}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, minWidth: 32, minHeight: 32,
        borderRadius: 8, cursor: 'pointer', fontSize: 14, lineHeight: 1,
        background: 'var(--tint1)',
        border: '1px solid var(--hairline)',
        color: 'var(--text2)',
        transition: 'color 0.15s, background 0.15s, border-color 0.15s',
      }}
    >
      <span aria-hidden="true">{theme === 'light' ? '☀' : '☾'}</span>
    </button>
  )
}
