'use client'
// Bannière globale d'annonce — affichée en haut de /app si une annonce est active.
// L'user peut dismisser (stocké en localStorage avec l'id de l'annonce → re-affiche si une nouvelle annonce arrive).

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { sanitizeUrl } from '../lib/sanitize'

const C = {
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  text: 'var(--text)',
}

const TYPE_STYLES = {
  info:    { bg: 'var(--blue-bg)',  border: 'var(--blue)', color: 'var(--blue-light)', icon: 'ℹ️' },
  success: { bg: 'var(--green-bg)',  border: 'var(--green)', color: 'var(--green)', icon: '✅' },
  warn:    { bg: 'var(--amber-bg)', border: 'var(--amber)', color: 'var(--amber)', icon: '⚠️' },
  promo:   { bg: 'rgba(244,114,182,0.10)', border: '#f472b6', color: '#f472b6', icon: '🎉' },
}

const DISMISSED_KEY = 'quantara_dismissed_announcements'

function getDismissedIds() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
  } catch { return [] }
}
function addDismissedId(id) {
  if (typeof window === 'undefined') return
  const current = getDismissedIds()
  if (!current.includes(id)) {
    current.push(id)
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(current.slice(-50))) // garde max 50 ids
  }
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      // Les RLS Supabase filtrent déjà sur active + dates valides
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5) // récupère les 5 dernières pour avoir un buffer si certaines sont dismissées
      if (!mounted) return
      if (error || !data || data.length === 0) {
        setLoading(false)
        return
      }
      const dismissed = getDismissedIds()
      // Trouve la 1ère non-dismissée
      const visible = data.find(a => !dismissed.includes(a.id))
      setAnnouncement(visible || null)
      setLoading(false)
    }
    load()
    // Refresh toutes les 5 min pour récupérer les nouvelles annonces
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  function dismiss() {
    if (announcement) {
      addDismissedId(announcement.id)
      setAnnouncement(null)
    }
  }

  if (loading || !announcement) return null

  const style = TYPE_STYLES[announcement.type] || TYPE_STYLES.info

  return (
    <div style={{
      background: style.bg,
      borderBottom: `1px solid ${style.border}`,
      padding: '10px 18px',
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      fontSize: 13, color: C.text,
      position: 'relative', zIndex: 100,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{style.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 700, color: style.color }}>{announcement.title}</span>
        {announcement.message && (
          <span style={{ marginLeft: 10, opacity: 0.85 }}>· {announcement.message}</span>
        )}
      </div>
      {sanitizeUrl(announcement.link_url) && (
        <a
          href={sanitizeUrl(announcement.link_url)}
          target="_blank" rel="noopener noreferrer"
          style={{
            padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
            background: style.color, color: '#fff', textDecoration: 'none',
            flexShrink: 0,
          }}
        >{announcement.link_label || 'En savoir +'}</a>
      )}
      <button
        onClick={dismiss}
        title="Masquer cette annonce"
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: C.text, fontSize: 14, padding: '4px 8px',
          opacity: 0.6, fontFamily: 'inherit', flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
      >✕</button>
    </div>
  )
}
