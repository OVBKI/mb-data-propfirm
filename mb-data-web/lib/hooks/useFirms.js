'use client'
// lib/hooks/useFirms.js — Shared hook for loading firms, accounts, and payouts
//
// Unifies the firm-loading logic duplicated across:
//   - app/app/page.js            (loadFirms function + allAccounts helper)
//   - components/TradesPage.js   (allAccounts useMemo)
//   - components/JournalPage.js  (allAccounts useMemo)
//   - components/HeatmapPage.js  (allAccounts useMemo)
//
// The `allAccounts` flattening pattern (firms.flatMap → accounts with firmName/firmColor)
// is duplicated in every component that consumes firm data. This hook centralizes both
// the Supabase loading and the flattening into one reusable primitive.

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../supabase'
import { FIRM_COLORS } from '../constants'

/**
 * Custom hook that loads firms with their nested accounts and payouts from Supabase.
 *
 * @param {Object|null} user - The authenticated user object (must have `user.id`).
 *   Pass null/undefined before auth is resolved — the hook will no-op until a user is present.
 *
 * @returns {{
 *   firms: Array<Object>,
 *   allAccounts: Array<Object>,
 *   loading: boolean,
 *   reload: () => Promise<void>
 * }}
 *
 * - `firms` — Array of firm objects, each with:
 *     - All columns from the `firms` table
 *     - `color` — Assigned color (from DB or auto-cycled from FIRM_COLORS)
 *     - `accounts` — Array of account objects belonging to this firm, each with:
 *         - All columns from the `accounts` table
 *         - `payouts` — Array of payout objects belonging to this account
 *
 * - `allAccounts` — Flattened array of every account across all firms, each decorated with:
 *     - `firmId` — The parent firm's ID
 *     - `firmName` — The parent firm's name
 *     - `firmColor` — The parent firm's color
 *     (This is the same pattern as the `firms.flatMap(...)` found in TradesPage,
 *      JournalPage, and HeatmapPage.)
 *
 * - `loading` — `true` while the initial load or a reload is in progress.
 *
 * - `reload` — Stable callback to re-fetch all data (firms + accounts + payouts).
 *   Safe to pass as a dependency or prop without causing re-renders.
 */
export function useFirms(user) {
  const [firms, setFirms] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    try {
      // Explicit user_id filter on all queries — required because admin RLS
      // (read-all) would otherwise expose all users' data to admin accounts.
      const { data: fd } = await supabase
        .from('firms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at')
      if (!fd) { setLoading(false); return }

      const { data: ad } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('buy_date')

      const { data: pd } = await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', user.id)
        .order('date')

      setFirms(
        fd.map((f, i) => ({
          ...f,
          color: f.color || FIRM_COLORS[i % FIRM_COLORS.length],
          accounts: (ad || [])
            .filter(a => a.firm_id === f.id)
            .map(a => ({
              ...a,
              payouts: (pd || []).filter(p => p.account_id === a.id),
            })),
        }))
      )
    } catch (err) {
      console.error('[useFirms] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Auto-load when user changes
  useEffect(() => {
    reload()
  }, [reload])

  // Flattened accounts — same pattern as every consumer component
  const allAccounts = useMemo(() => {
    return firms.flatMap(f =>
      (f.accounts || []).map(a => ({
        ...a,
        firmId: f.id,
        firmName: f.name,
        firmColor: f.color,
      }))
    )
  }, [firms])

  return { firms, allAccounts, loading, reload }
}
