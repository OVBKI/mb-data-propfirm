'use client'
// components/LanguageSwitcher.js — Toggle FR ↔ EN.
//
// USAGE : <LanguageSwitcher /> n'importe où sous <LanguageProvider>.
//
// Style : pill avec 2 boutons côte à côte (FR | EN), le sélectionné en surbrillance.
//         Très compact pour intégration dans la top bar.

import { useLanguage } from './LanguageProvider'

// Jetons CSS et non valeurs en dur : sans ça le switcher reste sombre quand
// l'utilisateur passe l'app en thème clair.
const C = {
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  border: 'var(--hairline)',
  active: 'var(--tint3)',
}

export default function LanguageSwitcher({ compact = false }) {
  const { locale, setLocale } = useLanguage()

  const size = compact
    ? { pad: '3px 8px', font: 10 }
    : { pad: '5px 10px', font: 11 }

  const btnStyle = (isActive) => ({
    padding: size.pad,
    fontSize: size.font,
    fontWeight: 600,
    background: isActive ? C.active : 'transparent',
    color: isActive ? C.text : C.text3,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    transition: 'color 0.15s, background 0.15s',
  })

  return (
    <div
      role="group"
      aria-label="Language"
      style={{
        display: 'inline-flex',
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        overflow: 'hidden',
        background: 'var(--tint1)',
        verticalAlign: 'middle',
      }}
    >
      <button
        type="button"
        onClick={() => setLocale('fr')}
        style={btnStyle(locale === 'fr')}
        aria-pressed={locale === 'fr'}
        aria-label="Français"
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        style={btnStyle(locale === 'en')}
        aria-pressed={locale === 'en'}
        aria-label="English"
      >
        EN
      </button>
    </div>
  )
}
