import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Custom storage adapter pour le toggle "Rester connecté".
// - Si l'utilisateur a coché "Rester connecté" (login) : token stocké dans localStorage
//   → persiste après fermeture du navigateur
// - Sinon : token stocké dans sessionStorage
//   → effacé à la fermeture de l'onglet
//
// La préférence est stockée dans localStorage sous la clé `quantara_persist_session`.
// Par défaut (1ère visite) : true (= rester connecté).
const PERSIST_KEY = 'quantara_persist_session'

const hybridStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null
    // Lit depuis sessionStorage en priorité (cas non-persistant), sinon localStorage
    return window.sessionStorage.getItem(key) || window.localStorage.getItem(key)
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return
    const persist = window.localStorage.getItem(PERSIST_KEY) !== 'false' // par défaut true
    if (persist) {
      window.localStorage.setItem(key, value)
      window.sessionStorage.removeItem(key)
    } else {
      window.sessionStorage.setItem(key, value)
      window.localStorage.removeItem(key)
    }
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  },
}

// Helper pour permettre au composant Auth de switcher la préférence
export function setSessionPersistence(persist) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PERSIST_KEY, persist ? 'true' : 'false')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: hybridStorage,
    autoRefreshToken: true,
    persistSession: true,        // Supabase gère le refresh même en sessionStorage
    detectSessionInUrl: true,    // Pour les redirects email confirmation
  },
})
