'use client'
// HUB JOURNAL SYNC — Import CSV uniquement.
// La sync Rithmic live + la gestion des comptes Rithmic ont été retirées du hub
// jusqu'à nouvel ordre (juin 2026). Les routes /journal-sync/rithmic et
// /journal-sync/accounts existent toujours et sont accessibles par URL directe
// mais ne sont plus mises en avant.

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useApp } from '../AppContext'

const C = {
  surface: 'rgba(20,23,32,0.65)', border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8', text2: '#9098b0', text3: '#5a6275', green: '#1db87a', blue: '#2d6fff', blueLt: '#4d8fff',
}

export default function JournalSyncHub() {
  const { user } = useApp()
  const [tradeCount, setTradeCount] = useState(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const { count } = await supabase
        .from('journal_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .like('notes', '%[rithmic:%')
      if (!cancelled) setTradeCount(count || 0)
    })()
    return () => { cancelled = true }
  }, [user])

  return (
    <div style={{ padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, marginBottom: 6, letterSpacing: '-0.02em' }}>
            {'◰'} Journal Sync
          </h1>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, maxWidth: 600 }}>
            Importe tes trades depuis ta plateforme propfirm via un export CSV.
            {tradeCount != null && tradeCount > 0 && (
              <span style={{ marginLeft: 8, color: C.blueLt }}>
                {'·'} <strong>{tradeCount}</strong> trade{tradeCount > 1 ? 's' : ''} déjà synchronisé{tradeCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        <Link href="/app/import-lab" style={{ display: 'block', padding: 28, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, textDecoration: 'none', color: C.text, transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
          onMouseEnter={ev => { ev.currentTarget.style.borderColor = 'rgba(45,111,255,0.5)'; ev.currentTarget.style.transform = 'translateY(-2px)'; ev.currentTarget.style.boxShadow = '0 12px 32px rgba(45,111,255,0.15)' }}
          onMouseLeave={ev => { ev.currentTarget.style.borderColor = C.border; ev.currentTarget.style.transform = 'translateY(0)'; ev.currentTarget.style.boxShadow = 'none' }}
        >
          <div style={{ fontSize: 48, marginBottom: 14 }}>{'\u{1F4E5}'}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.blueLt, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Synchroniser</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 8 }}>Importer un CSV</h3>
          <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5, margin: 0, marginBottom: 14 }}>
            Upload un export CSV depuis Rithmic R|Trader Pro (Performance ou Trader Dashboard) pour synchroniser tes trades automatiquement.
          </p>
          <div style={{ fontSize: 11, color: C.text3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 8px', background: 'rgba(45,111,255,0.1)', color: C.blueLt, borderRadius: 99, fontWeight: 600 }}>BETA</span>
            <span>Rithmic supporté</span><span>{'·'}</span><span>11+ propfirms détectées</span>
          </div>
          <div style={{ position: 'absolute', bottom: 16, right: 18, color: C.blueLt, fontSize: 18 }}>{'→'}</div>
        </Link>
      </div>
    </div>
  )
}
