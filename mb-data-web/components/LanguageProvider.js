'use client'
// components/LanguageProvider.js — Context React pour gérer la locale active.
//
// USAGE :
//   // Au top de l'app (layout.js ou app/page.js) :
//   <LanguageProvider><App /></LanguageProvider>
//
//   // Dans n'importe quel composant client :
//   import { useT, useLanguage } from '@/components/LanguageProvider'
//   const t = useT()
//   const { locale, setLocale } = useLanguage()
//
// COMPORTEMENT :
//   - Au mount : détecte automatiquement la langue (navigator.language ou localStorage)
//   - À chaque setLocale : persiste dans localStorage + met à jour <html lang="">
//   - Avant le mount client : utilise DEFAULT_LOCALE (FR) côté serveur — pas de mismatch
//     car le HTML initial est toujours FR, le switch EN se fait après hydratation.

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { translate, getInitialLocale, persistLocale, DEFAULT_LOCALE } from '../lib/i18n'

const LanguageContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }) {
  // Démarre toujours en DEFAULT_LOCALE pour éviter hydration mismatch.
  // Le bon locale est détecté + appliqué dans useEffect après mount client.
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE)

  // Hydratation : détecte navigator.language ou localStorage au mount
  useEffect(() => {
    const detected = getInitialLocale()
    if (detected !== locale) {
      setLocaleState(detected)
      if (typeof document !== 'undefined') {
        document.documentElement.lang = detected
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLocale = useCallback((newLocale) => {
    persistLocale(newLocale)
    setLocaleState(newLocale)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale
    }
  }, [])

  // Bound `t` function — re-créée à chaque changement de locale pour invalider les memos
  const t = useCallback((key) => translate(key, locale), [locale])

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// Hook principal pour récupérer la fonction de traduction
export function useT() {
  return useContext(LanguageContext).t
}

// Hook complet pour avoir aussi accès au locale courant + setter
export function useLanguage() {
  return useContext(LanguageContext)
}
