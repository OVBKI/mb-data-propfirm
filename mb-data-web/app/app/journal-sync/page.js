'use client'
// HUB JOURNAL SYNC (mai 2026)
//
// Page d'accueil quand l'user clique "Journal Sync" dans la sidebar.
// 2 cards :
//   1. 📥 Importer un CSV → /app/import-lab
//   2. 📊 Voir mon journal Sync → /app/journal-sync/view
//
// Garde le même shell que /app (topbar minimaliste + sidebar conservée en parent).

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

const C = {
  bg:        '#0d0f14',
  surface:   'rgba(20,23,32,0.65)',
  surface2:  'rgba(28,32,48,0.7)',
  border:    'rgba(255,255,255,0.07)',
  border2:   'rgba(255,255,255,0.13)',
  text:      '#f0ede8',
  text2:     '#9098b0',
  text3:     '#5a6275',
  green:     '#1db87a',
  blue:      '#2d6fff',
  blueLt:    '#4d8fff',
}

export default function JournalSyncHub() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tradeCount, setTradeCount] = useState(null)

  // Récupère l'user + compte les trades synchronisés (preview)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      setUser(session?.user || null)
      if (session?.user) {
        // Compte les trades Rithmic (notes contiennent [rithmic:...])
        const { count } = await supabase
          .from('journal_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .like('notes', '%[rithmic:%')
        if (!cancelled) setTradeCount(count || 0)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Chargement...
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <h2>Connexion requise</h2>
        <Link href="/app" style={{ color: C.blueLt }}>← Retour à /app</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Back */}
        <div style={{ marginBottom: 20 }}>
          <Link href="/app" style={{ color: C.text3, fontSize: 12, textDecoration: 'none' }}>
            ← Retour à l'app
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, marginBottom: 6, letterSpacing: '-0.02em' }}>
            ◰ Journal Sync
          </h1>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, maxWidth: 600 }}>
            Synchronise tes trades depuis ta plateforme propfirm, ou consulte ton journal synchronisé.
            {tradeCount != null && tradeCount > 0 && (
              <span style={{ marginLeft: 8, color: C.blueLt }}>
                · <strong>{tradeCount}</strong> trade{tradeCount > 1 ? 's' : ''} déjà synchronisé{tradeCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        {/* 2 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          {/* Card 1 — Import CSV */}
          <Link
            href="/app/import-lab"
            style={{
              display: 'block',
              padding: 28,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              textDecoration: 'none',
              color: C.text,
              transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={ev => {
              ev.currentTarget.style.borderColor = 'rgba(45,111,255,0.5)'
              ev.currentTarget.style.transform = 'translateY(-2px)'
              ev.currentTarget.style.boxShadow = '0 12px 32px rgba(45,111,255,0.15)'
            }}
            onMouseLeave={ev => {
              ev.currentTarget.style.borderColor = C.border
              ev.currentTarget.style.transform = 'translateY(0)'
              ev.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 14 }}>📥</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.blueLt, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Synchroniser
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 8, color: C.text }}>
              Importer un CSV
            </h3>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5, margin: 0, marginBottom: 14 }}>
              Upload un export CSV depuis Rithmic R|Trader Pro (Performance ou Trader Dashboard) pour synchroniser tes trades automatiquement.
            </p>
            <div style={{ fontSize: 11, color: C.text3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 8px', background: 'rgba(45,111,255,0.1)', color: C.blueLt, borderRadius: 99, fontWeight: 600 }}>BETA</span>
              <span>Rithmic supporté</span>
              <span>·</span>
              <span>11+ propfirms détectées</span>
            </div>
            <div style={{ position: 'absolute', bottom: 16, right: 18, color: C.blueLt, fontSize: 18 }}>→</div>
          </Link>

          {/* Card 2 — View journal */}
          <Link
            href="/app/journal-sync/view"
            style={{
              display: 'block',
              padding: 28,
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              textDecoration: 'none',
              color: C.text,
              transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={ev => {
              ev.currentTarget.style.borderColor = 'rgba(29,184,122,0.5)'
              ev.currentTarget.style.transform = 'translateY(-2px)'
              ev.currentTarget.style.boxShadow = '0 12px 32px rgba(29,184,122,0.15)'
            }}
            onMouseLeave={ev => {
              ev.currentTarget.style.borderColor = C.border
              ev.currentTarget.style.transform = 'translateY(0)'
              ev.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 14 }}>📊</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Consulter
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 8, color: C.text }}>
              Accéder au journal Sync
            </h3>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5, margin: 0, marginBottom: 14 }}>
              Vois tes trades synchronisés avec leurs métadonnées Rithmic complètes : entry/exit prices, fills, hold time, etc.
            </p>
            <div style={{ fontSize: 11, color: C.text3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tradeCount != null && (
                <span style={{ padding: '3px 8px', background: 'rgba(29,184,122,0.1)', color: C.green, borderRadius: 99, fontWeight: 600 }}>
                  {tradeCount} trade{tradeCount > 1 ? 's' : ''}
                </span>
              )}
              <span>Filtres avancés</span>
              <span>·</span>
              <span>Stats Rithmic</span>
            </div>
            <div style={{ position: 'absolute', bottom: 16, right: 18, color: C.green, fontSize: 18 }}>→</div>
          </Link>
        </div>

        {/* Future : Sync auto API teaser */}
        <div style={{
          marginTop: 24,
          padding: 18,
          background: 'rgba(255,255,255,0.02)',
          border: `1px dashed ${C.border2}`,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <div style={{ fontSize: 28, opacity: 0.5 }}>🔒</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text2, marginBottom: 2 }}>
              Sync auto via API <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 7px', background: 'rgba(255,255,255,0.06)', color: C.text3, borderRadius: 99, letterSpacing: '0.08em' }}>BIENTÔT</span>
            </div>
            <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.5 }}>
              Synchronisation automatique en temps réel via ProjectX Gateway (Topstep, TPT, MFFU, Tradeify, FFN, Phidias). Q3 2026.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
