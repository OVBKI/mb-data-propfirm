'use client'
// app/app/heatmaps/page.js — Heatmaps: pattern analysis by hour, day, session, instrument
import { useApp } from '../AppContext'
import HeatmapPage from '../../../../components/HeatmapPage'

export default function HeatmapsRoute() {
  const { firms, user, showToast } = useApp()

  return (
    <HeatmapPage
      firms={firms}
      user={user}
      showToast={showToast}
    />
  )
}
