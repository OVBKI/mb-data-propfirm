'use client'
// HUB JOURNAL SYNC — deux cartes : Import CSV, Voir le journal.
//
// Il n'y a plus AUCUNE synchronisation automatique ici. Les tentatives Rithmic
// (service Python) et Tradovate (OAuth) ont été retirées en attendant d'y
// revenir proprement ; seul l'import CSV subsiste, et c'est lui qui remplit
// journal_entries.

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useApp } from '../AppContext'

const C = {
  surface: 'var(--glass)', border: 'var(--border)', border2: 'var(--border2)',
  text: 'var(--text)', text2: 'var(--text2)', text3: 'var(--text3)', green: 'var(--green)', blue: 'var(--blue)', blueLt: 'var(--blue-light)',
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
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, marginBottom: 6, letterSpacing: '-0.02em' }}>
            {'◰'} Journal Sync
          </h1>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, maxWidth: 600 }}>
            Importe un export CSV de ta plateforme, ou consulte ton journal importé.
            {tradeCount != null && tradeCount > 0 && (
              <span style={{ marginLeft: 8, color: C.blueLt }}>
                {'·'} <strong>{tradeCount}</strong> trade{tradeCount > 1 ? 's' : ''} déjà importé{tradeCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          <Link href="/app/import-lab" style={{ display: 'block', padding: 28, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, textDecoration: 'none', color: C.text, transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={ev => { ev.currentTarget.style.borderColor = 'var(--blue-border)'; ev.currentTarget.style.transform = 'translateY(-2px)'; ev.currentTarget.style.boxShadow = '0 12px 32px var(--blue-bg)' }}
            onMouseLeave={ev => { ev.currentTarget.style.borderColor = C.border; ev.currentTarget.style.transform = 'translateY(0)'; ev.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ fontSize: 48, marginBottom: 14 }}>{'\u{1F4E5}'}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.blueLt, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Importer</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 8 }}>Importer un CSV</h3>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5, margin: 0, marginBottom: 14 }}>
              Upload un export CSV depuis Rithmic R|Trader Pro (Performance ou Trader Dashboard) pour ajouter tes trades au journal.
            </p>
            <div style={{ fontSize: 11, color: C.text3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 8px', background: 'var(--blue-bg)', color: C.blueLt, borderRadius: 99, fontWeight: 600 }}>BETA</span>
              <span>Rithmic supporté</span><span>{'·'}</span><span>11+ propfirms détectées</span>
            </div>
            <div style={{ position: 'absolute', bottom: 16, right: 18, color: C.blueLt, fontSize: 18 }}>{'→'}</div>
          </Link>

          <Link href="/app/journal-sync/view" style={{ display: 'block', padding: 28, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, textDecoration: 'none', color: C.text, transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={ev => { ev.currentTarget.style.borderColor = 'var(--green)'; ev.currentTarget.style.transform = 'translateY(-2px)'; ev.currentTarget.style.boxShadow = '0 12px 32px var(--green-bg)' }}
            onMouseLeave={ev => { ev.currentTarget.style.borderColor = C.border; ev.currentTarget.style.transform = 'translateY(0)'; ev.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ fontSize: 48, marginBottom: 14 }}>{'\u{1F4CA}'}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Consulter</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 8 }}>Accéder au journal importé</h3>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5, margin: 0, marginBottom: 14 }}>
              Vois tes trades importés avec leurs métadonnées Rithmic complètes : entry/exit prices, fills, hold time, etc.
            </p>
            <div style={{ fontSize: 11, color: C.text3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tradeCount != null && <span style={{ padding: '3px 8px', background: 'var(--green-bg)', color: C.green, borderRadius: 99, fontWeight: 600 }}>{tradeCount} trade{tradeCount > 1 ? 's' : ''}</span>}
              <span>Filtres avancés</span><span>{'·'}</span><span>Stats Rithmic</span>
            </div>
            <div style={{ position: 'absolute', bottom: 16, right: 18, color: C.green, fontSize: 18 }}>{'→'}</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
