'use client'
// JOURNAL SYNC — réutilise JournalPage en mode "sync" dans le shell /app
// (topbar + sidebar identiques à /app, deep-link via ?p= pour navigation interne).
//
// Hérite de TOUTE l'UI de JournalPage : filtres Statut/Firme/Compte, courbes
// de balance, calendrier, stats, etc.
//
// Ajoute en dessous (via renderExtraSection) un historique tabulaire dense
// des trades, avec colonnes Rithmic complètes (entry/exit, fills, hold).

import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../../AppContext'
import { supabase } from '../../../../../lib/supabase'
import JournalPage from '../../../../../components/JournalPage'
import { FIRM_COLORS } from '../../../../../lib/constants'
import { getFirmLogo } from '../../../../../lib/firmLogos'

// ============================================================================
// Helpers : extraction métadonnées Rithmic depuis notes
// ============================================================================
function parseRithmicMeta(notes) {
  if (!notes) return null
  const markerMatch = notes.match(/\[rithmic:(\d+)\/(\d+)\]/)
  if (!markerMatch) return null
  return {
    entryOrderId: markerMatch[1],
    exitOrderId: markerMatch[2],
    qty: parseInt((notes.match(/qty=(\d+)/) || [])[1] || 0),
    fills: parseInt((notes.match(/fills=(\d+)/) || [])[1] || 0),
    holdSeconds: parseFloat((notes.match(/hold=([\d.]+)s/) || [])[1] || 0),
    entryTime: (notes.match(/entry=([\d-]+ [\d:]+)/) || [])[1] || null,
    exitTime: (notes.match(/exit=([\d-]+ [\d:]+)/) || [])[1] || null,
  }
}

function fmtMoney(n) {
  const v = Number(n) || 0
  return (v >= 0 ? '+' : '') + v.toFixed(2) + ' $'
}

function fmtHold(s) {
  if (!s || s < 1) return '<1s'
  if (s < 60) return `${s.toFixed(0)}s`
  if (s < 3600) return `${(s / 60).toFixed(1)}m`
  return `${(s / 3600).toFixed(1)}h`
}

function fmtTime(iso) {
  if (!iso) return '—'
  const parts = iso.split(' ')
  return parts[1] || iso
}

// Sidebar partagée — définition unique dans components/AppSidebar.js

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function JournalSyncPage() {
  const { user } = useApp()
  const [firms, setFirms] = useState([])

  // Charge firms+accounts+payouts (rithmic only)
  const loadFirms = useCallback(async (userId) => {
    if (!userId) return
    const [fd, ad, pd] = await Promise.all([
      supabase.from('firms').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('accounts').select('*').eq('user_id', userId).order('buy_date'),
      supabase.from('payouts').select('*').eq('user_id', userId).order('date'),
    ])
    // Vue Rithmic = futures uniquement : on exclut les firms/comptes CFD.
    const firmsRaw = (fd.data || []).filter(f => f.market !== 'cfd')
    const accountsRaw = (ad.data || []).filter(a => a.market !== 'cfd')
    const payoutsRaw = pd.data || []

    const hydrated = firmsRaw.map((f, i) => ({
      ...f,
      color: f.color || FIRM_COLORS[i % FIRM_COLORS.length],
      accounts: accountsRaw
        .filter(a => a.firm_id === f.id)
        // FILTRE SYNC : ne garde QUE les comptes ayant rithmic_account_id rempli
        .filter(a => !!a.rithmic_account_id)
        .map(a => ({
          ...a,
          payouts: payoutsRaw.filter(p => p.account_id === a.id),
        })),
    }))
    setFirms(hydrated.filter(f => (f.accounts || []).length > 0))
  }, [])

  useEffect(() => {
    if (user) loadFirms(user.id)
  }, [user, loadFirms])

  function showToast(msg) {
    if (process.env.NODE_ENV !== 'production') console.log('[journal-sync]', msg)
  }

  function onReload() {
    if (user?.id) loadFirms(user.id)
  }




  return (
    <div>
          <JournalPage
            firms={firms}
            user={user}
            getFirmLogo={getFirmLogo}
            showToast={showToast}
            onReload={onReload}
            onlyRithmicEntries={true}
            addTradeHref="/app/import-lab"
            addTradeLabel="+ Importer un CSV"
            pageEyebrow="Journal Sync · CSV Import"
            pageTitle="Chaque trade importé. Tracké. Analysé."
            pageSubtitleSuffix="synchronisé depuis Rithmic"
            renderExtraSection={(ctx) => (
              <TradesHistory
                filteredEntries={ctx.filteredEntries}
                allAccounts={ctx.allAccounts}
              />
            )}
          />
    </div>
  )
}

// ============================================================================
// HISTORIQUE DES TRADES — table dense avec métadonnées Rithmic complètes
// ============================================================================
function TradesHistory({ filteredEntries, allAccounts }) {
  const accountById = {}
  for (const a of allAccounts) accountById[a.id] = a

  if (filteredEntries.length === 0) {
    return null
  }

  return (
    <div style={{ marginTop:'32px' }}>
      <div style={{
        fontSize:'15px', fontWeight:'600', marginBottom:'12px',
        display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap',
      }}>
        📋 Historique des trades
        <span style={{
          fontSize:'11px', color:'var(--text3)', fontFamily:'ui-monospace,monospace',
          fontWeight:'500', letterSpacing:'0.05em',
        }}>
          ({filteredEntries.length} trade{filteredEntries.length > 1 ? 's' : ''})
        </span>
      </div>

      <div style={{
        background:'var(--surface)',
        border:'1px solid rgba(255,255,255,0.06)',
        borderRadius:'10px',
        overflow:'hidden',
        boxShadow:'0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)',
      }}>
        <div style={{ overflowX:'auto', maxHeight:'600px' }}>
          <table style={{
            width:'100%', fontSize:'12px',
            fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace',
            borderCollapse:'separate', borderSpacing:0,
          }}>
            <thead>
              <tr style={{
                position:'sticky', top:0,
                background:'rgba(255,255,255,0.025)',
                borderBottom:'1px solid rgba(255,255,255,0.06)',
                zIndex:1,
              }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Compte</th>
                <th style={thStyle}>Inst.</th>
                <th style={thStyle}>Side</th>
                <th style={{ ...thStyle, textAlign:'right' }}>Qty</th>
                <th style={{ ...thStyle, textAlign:'right' }}>Entrée</th>
                <th style={{ ...thStyle, textAlign:'right' }}>Sortie</th>
                <th style={{ ...thStyle, textAlign:'right' }}>Net P&L</th>
                <th style={thStyle}>Heures</th>
                <th style={{ ...thStyle, textAlign:'right' }}>Hold</th>
                <th style={{ ...thStyle, textAlign:'right' }}>Fills</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.slice(0, 1000).map((t) => {
                const meta = parseRithmicMeta(t.notes)
                const acc = accountById[t.account_id]
                const pnl = Number(t.pnl) || 0
                const isLong = t.side === 'LONG'
                return (
                  <tr key={t.id} className="ts-row" style={{
                    borderTop:'1px solid rgba(255,255,255,0.04)',
                    transition:'background 0.12s ease',
                  }}>
                    <td style={tdStyle}>{t.date}</td>
                    <td style={tdStyle}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        {t._firmColor && (
                          <span style={{
                            width:6, height:6, borderRadius:'50%',
                            background: t._firmColor, flexShrink:0,
                          }} />
                        )}
                        <span style={{ color:'var(--text2)' }}>
                          {acc?.name || (acc ? `· ${acc.id.slice(0,6)}` : '?')}
                        </span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color:'var(--text)' }}>{t.instrument || '—'}</td>
                    <td style={{
                      ...tdStyle, fontWeight:600, letterSpacing:'0.05em',
                      color: isLong ? 'var(--green)' : 'var(--red)',
                    }}>
                      {t.side === 'LONG' ? '▲ LONG' : t.side === 'SHORT' ? '▼ SHORT' : t.side || '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign:'right' }}>{meta?.qty ?? '—'}</td>
                    <td style={{ ...tdStyle, textAlign:'right', color:'var(--text2)' }}>{t.entry_price ?? '—'}</td>
                    <td style={{ ...tdStyle, textAlign:'right', color:'var(--text2)' }}>{t.exit_price ?? '—'}</td>
                    <td style={{
                      ...tdStyle, textAlign:'right', fontWeight:600,
                      color: pnl >= 0 ? 'var(--green)' : 'var(--red)',
                    }}>{fmtMoney(pnl)}</td>
                    <td style={{ ...tdStyle, color:'var(--text3)', fontSize:11 }}>
                      {meta?.entryTime && meta?.exitTime
                        ? `${fmtTime(meta.entryTime)} → ${fmtTime(meta.exitTime)}`
                        : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign:'right', color:'var(--text3)' }}>
                      {meta?.holdSeconds ? fmtHold(meta.holdSeconds) : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign:'right', color:'var(--text3)' }}>{meta?.fills ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredEntries.length > 1000 && (
          <div style={{
            padding:'12px 16px', textAlign:'center', fontSize:11,
            color:'var(--text3)', fontFamily:'ui-monospace,monospace',
            borderTop:'1px solid rgba(255,255,255,0.06)',
          }}>
            Affichage des 1000 premiers · {filteredEntries.length - 1000} trades masqués. Affine les filtres pour voir le reste.
          </div>
        )}
      </div>

      {/* Hover effect via style tag */}
      <style>{`.ts-row:hover { background: rgba(255,255,255,0.025); }`}</style>
    </div>
  )
}

const thStyle = {
  padding:'10px 12px', textAlign:'left',
  fontSize:10, fontWeight:600, color:'var(--text3)',
  textTransform:'uppercase', letterSpacing:'0.1em',
}
const tdStyle = {
  padding:'9px 12px', color:'var(--text2)',
}
