'use client'
// app/app/trades/page.js — Trade Log: all trades (manual + sync) with advanced filters
import { useApp } from '../AppContext'
import TradesPage from '../../../../components/TradesPage'

export default function TradesRoute() {
  const { firms, user, showToast, reload } = useApp()

  return (
    <TradesPage
      firms={firms}
      user={user}
      showToast={showToast}
      onReload={reload}
    />
  )
}
