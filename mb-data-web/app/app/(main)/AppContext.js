'use client'
import { createContext, useContext } from 'react'

// Shared context for all /app/* pages.
// Provided by app/app/layout.js — consumed via useApp() in page components.
export const AppContext = createContext(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp() must be used within <AppContext.Provider> (app/app/layout.js)')
  return ctx
}
