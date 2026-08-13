'use client'
// components/ThemeProvider.js — Context React pour le thème sombre / clair.
//
// USAGE :
//   const { theme, setTheme, toggleTheme } = useTheme()   // theme: 'dark' | 'light'
//
// COMPORTEMENT :
//   - Le SOMBRE est le défaut. Un utilisateur qui n'a jamais touché au réglage
//     voit exactement ce qu'il voyait avant.
//   - Le choix est persisté dans localStorage et appliqué en posant
//     `data-theme` sur <html> ; toute la palette (app/globals.css) en découle.
//   - Le thème est déjà posé sur <html> par le script inline de app/layout.js,
//     AVANT le premier paint. Ce provider ne fait que relire cette valeur, donc
//     il n'y a ni flash blanc ni mismatch d'hydratation.
//
// POURQUOI PAS prefers-color-scheme PAR DÉFAUT :
//   L'app est dessinée en sombre depuis le départ. Basculer automatiquement les
//   utilisateurs en OS clair changerait l'apparence sous leurs yeux sans qu'ils
//   aient rien demandé. Le réglage OS reste disponible via le choix « Système ».

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export const THEME_STORAGE_KEY = 'quantara_theme'
export const THEMES = ['dark', 'light', 'system']

const ThemeContext = createContext({
  theme: 'dark',          // thème RÉSOLU, jamais 'system'
  preference: 'dark',     // ce que l'utilisateur a choisi, 'system' compris
  setTheme: () => {},
  toggleTheme: () => {},
})

function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function resolve(preference) {
  return preference === 'system' ? systemTheme() : preference
}

function applyToDocument(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
  // Aligne la couleur de la barre d'adresse mobile sur le fond réel.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f7fa' : '#0d0f14')
}

export function ThemeProvider({ children }) {
  // On démarre en 'dark' des deux côtés (serveur ET premier rendu client) pour
  // ne pas provoquer de mismatch. La vraie préférence est lue au mount.
  const [preference, setPreferenceState] = useState('dark')
  const [theme, setThemeResolved] = useState('dark')

  useEffect(() => {
    let stored = null
    try { stored = localStorage.getItem(THEME_STORAGE_KEY) } catch {}
    const pref = THEMES.includes(stored) ? stored : 'dark'
    const resolved = resolve(pref)
    setPreferenceState(pref)
    setThemeResolved(resolved)
    applyToDocument(resolved)
  }, [])

  // En mode « Système », suivre les changements d'OS en direct.
  useEffect(() => {
    if (preference !== 'system' || typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => {
      const resolved = systemTheme()
      setThemeResolved(resolved)
      applyToDocument(resolved)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preference])

  const setTheme = useCallback((next) => {
    if (!THEMES.includes(next)) return
    const resolved = resolve(next)
    setPreferenceState(next)
    setThemeResolved(resolved)
    applyToDocument(resolved)
    try { localStorage.setItem(THEME_STORAGE_KEY, next) } catch {}
    // Les charts peignent dans un canvas et ne suivent pas var() : ils doivent
    // se reconstruire. Ceux qui écoutent cet événement le font.
    try { window.dispatchEvent(new CustomEvent('quantara:themechange', { detail: { theme: resolved } })) } catch {}
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, preference, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
