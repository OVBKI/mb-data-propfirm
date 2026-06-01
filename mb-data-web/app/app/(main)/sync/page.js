'use client'
// app/app/sync/page.js — redirects to the unified Journal Sync hub.
import { useEffect } from 'react'
import { useApp } from '../AppContext'

export default function SyncRoute() {
  const { navigateTo } = useApp()
  useEffect(() => {
    navigateTo('journal-sync')
  }, [navigateTo])
  return null
}
