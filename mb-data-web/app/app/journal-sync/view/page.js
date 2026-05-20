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
import Link from 'next/link'
import { supabase } from '../../../../lib/supabase'
import JournalPage from '../../../../components/JournalPage'
import QLogoIcon from '../../../../components/QLogoIcon'
import SpaceBackground from '../../../../components/dashboard/SpaceBackground'
import ProfileModal from '../../../../components/ProfileModal'
import { FIRM_COLORS } from '../../../../lib/constants'
import { getFirmLogo } from '../../../../lib/firmLogos'

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

// Mêmes emails que app/admin/layout.js — affichage conditionnel du lien admin
import { ADMIN_EMAILS } from '../../../../lib/admins'

// Navigation sidebar — sync avec app/app/page.js (restructure mai 2026).
// 3 sections : Vue d'ensemble / Mes Trades (avec sous-groupe Journal) / PropFirms.
// Flags : subHeader (label non cliquable), indent (item indenté), disabled (grisé).
const NAV_ITEMS = [
  // Vue d'ensemble
  { key: 'dashboard', icon: '◫', label: 'Dashboard',        section: 'Vue' },
  { key: 'analytics', icon: '◐', label: 'Analytics',        section: 'Vue' },
  { key: 'calendar',  icon: '◳', label: 'Calendrier éco',   section: 'Vue' },
  // Mes Trades — sous-groupe Journal
  { subHeader: true, icon: '☰', label: 'Journal',            section: 'Trades' },
  { key: 'journal',            label: 'Journal manuel',      section: 'Trades', indent: true },
  { href: '/app/journal-sync', label: 'Journal Sync',        section: 'Trades', indent: true },
  {                            label: 'Sync auto API',       section: 'Trades', indent: true, disabled: true, badgeLabel: '🔒' },
  // Mes Trades — autres items
  { key: 'trades',   icon: '⊞', label: 'Trade Log',          section: 'Trades' },
  { key: 'heatmaps', icon: '▦', label: 'Heatmaps',           section: 'Trades' },
  { key: 'myrules',  icon: '⊡', label: 'Mes règles',         section: 'Trades' },
  // PropFirms
  { key: 'rules',  icon: '◊', label: 'Règles firmes',        section: 'PropFirm' },
  { key: 'alerts', icon: '◉', label: 'Alertes',              section: 'PropFirm' },
]
const SECTIONS = ['Vue', 'Trades', 'PropFirm']
const SECTION_LABELS = {
  'Vue':      "Vue d'ensemble",
  'Trades':   'Mes trades',
  'PropFirm': 'PropFirms',
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function JournalSyncPage() {
  const [user, setUser] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [firms, setFirms] = useState([])
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Charge le profil (pseudo + display_name) pour l'affichage sidebar
  const loadProfile = useCallback(async (userId) => {
    if (!userId) return
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('user_id', userId)
      .single()
    setProfile(data || { username: null, display_name: null, avatar_url: null })
  }, [])

  // Charge firms+accounts+payouts (même shape que /app/page.js loadFirms)
  // Filtre EXPLICITEMENT par user_id (anti-leak admin RLS).
  const loadFirms = useCallback(async (userId) => {
    if (!userId) return
    const [fd, ad, pd] = await Promise.all([
      supabase.from('firms').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('accounts').select('*').eq('user_id', userId).order('buy_date'),
      supabase.from('payouts').select('*').eq('user_id', userId).order('date'),
    ])
    const firmsRaw = fd.data || []
    const accountsRaw = ad.data || []
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
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user || null
      setUser(u)
      setLoadingAuth(false)
      if (u) {
        loadFirms(u.id)
        loadProfile(u.id)
      }
    })
    return () => { mounted = false }
  }, [loadFirms, loadProfile])

  function showToast(msg) {
    if (typeof window !== 'undefined') console.log('[journal-sync]', msg)
  }

  function onReload() {
    if (user?.id) loadFirms(user.id)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/app'
  }

  // === Gardes ===
  if (loadingAuth) {
    return (
      <div style={{
        minHeight:'100vh', background:'var(--bg)', color:'var(--text)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <div style={{ color:'var(--text3)', fontSize:13 }}>⏳ Chargement...</div>
      </div>
    )
  }
  if (!user) {
    return (
      <div style={{
        minHeight:'100vh', background:'var(--bg)', color:'var(--text)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:32, textAlign:'center',
      }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <h1 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Connexion requise</h1>
        <Link href="/app" style={{ color:'var(--blue-light)', textDecoration:'none' }}>← Page de connexion</Link>
      </div>
    )
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email)

  // ==========================================================================
  // Render principal — même shell que /app (topbar + sidebar + content)
  // ==========================================================================
  return (
    <div style={{ minHeight:'100vh', background:'transparent', position:'relative' }}>
      <SpaceBackground />
      <div style={{ height:'2px', background:'linear-gradient(90deg,var(--blue) 0%,transparent 100%)', position:'relative', zIndex:1 }} />

      {/* TOPBAR */}
      <div className="top-bar" style={{
        height:'52px', background:'rgba(13,15,20,0.78)',
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 24px', position:'sticky', top:0, zIndex:200,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          <button className="nav-burger" aria-label="Menu" onClick={()=>setMobileNavOpen(o=>!o)}>☰</button>
          <Link href="/app" style={{ display:'flex', alignItems:'center', gap:'10px', textDecoration:'none', color:'var(--text)' }}>
            <QLogoIcon size={44} color="#4d8fff" />
            <div style={{ display:'flex', alignItems:'baseline', gap:'10px' }}>
              <div style={{ fontWeight:'700', fontSize:'14px', letterSpacing:'0.14em', color:'var(--text)' }}>QUANTARA</div>
              <span className="top-bar-brand-sub" style={{ fontSize:'10px', color:'var(--text3)', letterSpacing:'0.18em' }}>TRACK · ANALYZE · GROW</span>
            </div>
          </Link>
        </div>
        <div className="top-bar-actions" style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <button onClick={signOut} style={{
            fontSize:'12px', padding:'7px 14px', background:'rgba(255,255,255,0.025)',
            border:'1px solid rgba(255,255,255,0.10)', color:'var(--text2)',
            borderRadius:'8px', cursor:'pointer', fontFamily:'inherit',
          }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ display:'flex', minHeight:'calc(100vh - 50px)' }}>
        {/* SIDEBAR */}
        <nav className={'app-nav'+(mobileNavOpen?' open':'')} style={{
          width:'210px', flexShrink:0, background:'rgba(13,15,20,0.65)',
          backdropFilter:'blur(26px)', WebkitBackdropFilter:'blur(26px)',
          borderRight:'1px solid rgba(255,255,255,0.05)',
          padding:'18px 0', position:'sticky', top:'52px',
          height:'calc(100vh - 52px)', overflowY:'auto',
        }}>
          {SECTIONS.map(section => (
            <div key={section}>
              <div className="nav-section-label" style={{
                padding:'12px 18px 6px', fontSize:'10px', fontWeight:'700',
                color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.14em',
              }}>{SECTION_LABELS[section] || section}</div>
              {NAV_ITEMS.filter(i => i.section === section).map((item, idx) => {
                // === SUB-HEADER (non cliquable, label du sous-groupe) ===
                if (item.subHeader) {
                  return (
                    <div key={`sub-${section}-${idx}`} style={{
                      padding:'8px 18px 4px',
                      fontSize:'12px', fontWeight:'600', color:'var(--text2)',
                      display:'flex', alignItems:'center', gap:'10px',
                    }}>
                      <span style={{ fontSize:'13px', color:'var(--text3)', width:'18px', textAlign:'center', lineHeight:1 }}>{item.icon}</span>
                      {item.label}
                    </div>
                  )
                }
                // Padding adapté selon indent
                const padL = item.indent ? '36px' : '18px'
                const fontS = item.indent ? '12px' : '13px'
                // === DISABLED ITEM (feature à venir) ===
                if (item.disabled) {
                  return (
                    <div key={`dis-${section}-${idx}`} style={{
                      display:'flex', alignItems:'center', gap:'11px',
                      padding:`8px 18px 8px ${padL}`, width:'100%',
                      color:'var(--text3)', fontSize:fontS, fontWeight:'500',
                      opacity:0.5, cursor:'not-allowed',
                      borderLeft:'2px solid transparent',
                      fontFamily:'inherit',
                    }} title="Bientôt disponible">
                      {item.icon && <span style={{ fontSize:'14px', color:'var(--text3)', width:'18px', display:'inline-block', textAlign:'center', lineHeight:1 }}>{item.icon}</span>}
                      {item.label}
                      {item.badgeLabel && (
                        <span style={{ marginLeft:'auto', background:'rgba(255,255,255,0.06)', color:'var(--text3)', fontSize:'9px', fontWeight:'700', padding:'2px 7px', borderRadius:'99px', letterSpacing:'0.08em' }}>{item.badgeLabel}</span>
                      )}
                    </div>
                  )
                }
                // === Item EXTERNE (href) ===
                if (item.href) {
                  const isActive = item.href === '/app/journal-sync'
                  return (
                    <a key={item.href} href={item.href} style={{
                      display:'flex', alignItems:'center', gap:'11px',
                      padding:`9px 18px 9px ${padL}`, width:'100%',
                      background: isActive ? 'rgba(45,111,255,0.12)' : 'transparent',
                      color: isActive ? 'var(--blue-light)' : 'var(--text2)',
                      fontSize:fontS, fontWeight: isActive ? 600 : 500,
                      textDecoration:'none',
                      borderLeft:`2px solid ${isActive?'var(--blue)':'transparent'}`,
                      transition:'all 0.15s', fontFamily:'inherit',
                    }}>
                      {item.icon && <span style={{ fontSize:'14px', color: isActive ? 'var(--blue-light)' : 'var(--text3)', width:'18px', display:'inline-block', textAlign:'center', lineHeight:1 }}>{item.icon}</span>}
                      {item.label}
                      {item.badgeLabel && (
                        <span style={{ marginLeft:'auto', background:'rgba(45,111,255,0.15)', color:'var(--blue-light)', fontSize:'9px', fontWeight:'700', padding:'2px 7px', borderRadius:'99px', letterSpacing:'0.08em' }}>{item.badgeLabel}</span>
                      )}
                    </a>
                  )
                }
                // === Item INTERNE (key → /app?p=key) ===
                return (
                  <a key={item.key} href={`/app?p=${item.key}`} style={{
                    display:'flex', alignItems:'center', gap:'11px',
                    padding:`9px 18px 9px ${padL}`, width:'100%',
                    background:'transparent', color:'var(--text2)',
                    fontSize:fontS, fontWeight:500,
                    textDecoration:'none',
                    borderLeft:'2px solid transparent',
                    transition:'all 0.15s', fontFamily:'inherit',
                  }}>
                    {item.icon && <span style={{ fontSize:'14px', color:'var(--text3)', width:'18px', display:'inline-block', textAlign:'center', lineHeight:1 }}>{item.icon}</span>}
                    {item.label}
                  </a>
                )
              })}
            </div>
          ))}

          {/* Admin panel (si admin) */}
          {isAdmin && (
            <div style={{ padding:'8px 12px', marginTop:'12px', borderTop:'1px solid var(--border)' }}>
              <a href="/admin" style={{
                display:'flex', alignItems:'center', gap:'10px',
                padding:'10px 12px', borderRadius:'8px',
                background:'rgba(232,80,74,0.08)', border:'1px solid rgba(232,80,74,0.25)',
                color:'var(--red-text)', fontSize:'12px', fontWeight:'600', textDecoration:'none',
              }}>🔧 Admin Panel</a>
            </div>
          )}

          {/* Footer sidebar : carte profil cliquable */}
          <div style={{ position:'absolute', bottom:'12px', left:0, right:0, padding:'0 12px' }}>
            <button
              onClick={()=>setShowProfileModal(true)}
              style={{
                width:'100%', padding:'9px 11px',
                background:'rgba(255,255,255,0.025)',
                border:'1px solid rgba(255,255,255,0.07)',
                borderRadius:'8px', cursor:'pointer',
                textAlign:'left', color:'var(--text)',
                fontFamily:'inherit', transition:'all 0.15s',
                overflow:'hidden',
              }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(45,111,255,0.08)';e.currentTarget.style.borderColor='rgba(45,111,255,0.25)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.025)';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}}
            >
              <div style={{
                fontSize:'12px', fontWeight:600,
                color: profile?.username ? 'var(--text)' : 'var(--blue-light)',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>
                {profile?.display_name || (profile?.username ? `@${profile.username}` : '⊕ Définir un pseudo')}
              </div>
              <div style={{
                fontSize:'10px', color:'var(--text3)', marginTop:'2px',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}>{user?.email}</div>
            </button>
          </div>
        </nav>

        {mobileNavOpen && <div className="nav-backdrop" onClick={()=>setMobileNavOpen(false)} />}

        {/* CONTENT — JournalPage + historique en dessous */}
        <div style={{ flex:1, overflow:'auto' }}>
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
      </div>

      {/* Modal Profil */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={()=>setShowProfileModal(false)}
          onUpdated={()=>loadProfile(user.id)}
        />
      )}
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
