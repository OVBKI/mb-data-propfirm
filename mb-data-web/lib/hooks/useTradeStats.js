'use client'
// useTradeStats — solde et plus haut de chaque compte, recalculés à partir des
// trades du journal. Même calcul que la page Santé et le cron drawdown-guardian
// (lib/drawdownHealth) : la jauge du dashboard, celle de la page Santé et
// l'alerte push affichent donc la même marge.
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { computeStatsByAccount, fetchTradePnl } from '../drawdownHealth'

export function useTradeStats(user, firms) {
  const [trades, setTrades] = useState(null)
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    fetchTradePnl(supabase, { userId: user.id }).then(({ data }) => {
      if (!cancelled) setTrades(data || [])
    })
    return () => { cancelled = true }
  }, [user?.id])

  return useMemo(() => {
    if (!trades) return null
    const byId = {}
    for (const f of firms || []) for (const a of f.accounts || []) byId[a.id] = a
    return computeStatsByAccount(trades, byId)
  }, [trades, firms])
}
