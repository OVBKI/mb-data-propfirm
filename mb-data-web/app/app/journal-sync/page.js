'use client'
// JOURNAL SYNC — panel dédié aux trades importés automatiquement via CSV.
//
// Différent du journal manuel : ici on affiche uniquement les trades qui ont
// le marker [rithmic:ENTRY/EXIT] dans leur colonne `notes`. Toutes les
// métadonnées Rithmic (qty totale, nb fills, hold time, order IDs) sont
// extraites du notes string et affichées en table dense.
//
// Design : cohérent avec landing + JournalPage. Off-white primary (pas de gradient
// AI-vibe), mono accents pour les chiffres, frosted glass cards, dense tabular layout.

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { T } from '../../../components/dashboard/theme'
import { Card, Btn, Badge, PageHeader, Section, UIStyles, LiveDot } from '../../../components/dashboard/ui'

// ============================================================================
// Helpers : extraction des métadonnées Rithmic depuis la colonne `notes`
// ============================================================================
// Notes format produit par l'import :
//   "[rithmic:98779385/98785343] qty=5 fills=4 hold=15.4s entry=2026-05-15 15:40:26 exit=2026-05-15 15:40:42"
function parseRithmicMeta(notes) {
  if (!notes) return null
  const markerMatch = notes.match(/\[rithmic:(\d+)\/(\d+)\]/)
  if (!markerMatch) return null
  const qty       = parseInt((notes.match(/qty=(\d+)/) || [])[1] || 0)
  const fills     = parseInt((notes.match(/fills=(\d+)/) || [])[1] || 0)
  const hold      = parseFloat((notes.match(/hold=([\d.]+)s/) || [])[1] || 0)
  const entryTime = (notes.match(/entry=([\d-]+ [\d:]+)/) || [])[1] || null
  const exitTime  = (notes.match(/exit=([\d-]+ [\d:]+)/) || [])[1] || null
  return {
    entryOrderId: markerMatch[1],
    exitOrderId: markerMatch[2],
    qty, fills, holdSeconds: hold, entryTime, exitTime,
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
  // "2026-05-15 15:40:26" → "15:40:26"
  const parts = iso.split(' ')
  return parts[1] || iso
}

// ============================================================================
// Composant principal
// ============================================================================
export default function JournalSyncPage() {
  const [user, setUser] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [trades, setTrades] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)

  // === Filtres ===
  const [filterAccount, setFilterAccount] = useState('all')
  const [filterSide, setFilterSide] = useState('all')
  const [filterInstrument, setFilterInstrument] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // === Auth ===
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user || null)
      setLoadingAuth(false)
      if (session?.user) loadData()
    })

    async function loadData() {
      setLoading(true)
      const [tradesRes, accountsRes] = await Promise.all([
        supabase
          .from('journal_entries')
          .select('id, account_id, date, pnl, instrument, side, entry_price, exit_price, notes')
          .like('notes', '%[rithmic:%')
          .order('date', { ascending: false })
          .limit(2000),
        supabase
          .from('accounts')
          .select('id, name, plan_size, status, firm_id, rithmic_account_id, firms(name, color)'),
      ])
      if (!mounted) return
      setTrades(tradesRes.data || [])
      setAccounts(accountsRes.data || [])
      setLoading(false)
    }

    return () => { mounted = false }
  }, [])

  // === Lookup compte par ID ===
  const accountById = useMemo(() => {
    const m = {}
    for (const a of accounts) m[a.id] = a
    return m
  }, [accounts])

  // === Liste instruments uniques (pour filtre) ===
  const instruments = useMemo(() => {
    const set = new Set()
    for (const t of trades) if (t.instrument) set.add(t.instrument)
    return Array.from(set).sort()
  }, [trades])

  // === Trades filtrés ===
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (filterAccount !== 'all' && t.account_id !== filterAccount) return false
      if (filterSide !== 'all' && t.side !== filterSide) return false
      if (filterInstrument !== 'all' && t.instrument !== filterInstrument) return false
      if (filterDateFrom && t.date < filterDateFrom) return false
      if (filterDateTo && t.date > filterDateTo) return false
      return true
    })
  }, [trades, filterAccount, filterSide, filterInstrument, filterDateFrom, filterDateTo])

  // === Stats agrégées ===
  const stats = useMemo(() => {
    let totalPnl = 0
    let wins = 0
    let losses = 0
    let scratched = 0
    let totalQty = 0
    let totalFills = 0
    let bestTrade = -Infinity
    let worstTrade = Infinity
    const pnlByDate = {}

    for (const t of filteredTrades) {
      const pnl = Number(t.pnl) || 0
      totalPnl += pnl
      if (pnl > 0) wins++
      else if (pnl < 0) losses++
      else scratched++
      if (pnl > bestTrade) bestTrade = pnl
      if (pnl < worstTrade) worstTrade = pnl

      const meta = parseRithmicMeta(t.notes)
      if (meta) {
        totalQty += meta.qty || 0
        totalFills += meta.fills || 0
      }

      pnlByDate[t.date] = (pnlByDate[t.date] || 0) + pnl
    }

    const tradeCount = filteredTrades.length
    const winRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0
    const avgTrade = tradeCount > 0 ? totalPnl / tradeCount : 0
    const bestDay = Object.entries(pnlByDate).reduce((acc, [date, pnl]) => {
      return !acc || pnl > acc.pnl ? { date, pnl } : acc
    }, null)
    const worstDay = Object.entries(pnlByDate).reduce((acc, [date, pnl]) => {
      return !acc || pnl < acc.pnl ? { date, pnl } : acc
    }, null)

    return {
      tradeCount, totalPnl, wins, losses, scratched,
      winRate, avgTrade,
      bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
      worstTrade: worstTrade === Infinity ? 0 : worstTrade,
      totalQty, totalFills,
      bestDay, worstDay,
      activeDays: Object.keys(pnlByDate).length,
    }
  }, [filteredTrades])

  // === Gardes ===
  if (loadingAuth) return <FullPageState>Vérification...</FullPageState>
  if (!user) return (
    <FullPageState>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Connexion requise</h1>
      <Link href="/app" style={{ color: T.color.blueLight, textDecoration: 'none' }}>← Page de connexion</Link>
    </FullPageState>
  )

  // === Reset filtres ===
  function resetFilters() {
    setFilterAccount('all')
    setFilterSide('all')
    setFilterInstrument('all')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  const hasFilters = filterAccount !== 'all' || filterSide !== 'all' || filterInstrument !== 'all' || filterDateFrom || filterDateTo

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <div style={{
      minHeight: '100vh',
      background: T.color.bg,
      color: T.color.text,
      padding: '32px 24px',
      fontFamily: T.font.sans,
    }}>
      <UIStyles />
      <PageStyles />

      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <PageHeader
          eyebrow="SYNC · CSV IMPORT"
          title="Journal Sync"
          subtitle="Trades importés automatiquement depuis Rithmic. Distinct du journal manuel — chaque trade ici provient d'un export CSV."
          actions={
            <>
              <Link href="/app/import-lab" style={{ textDecoration: 'none' }}>
                <Btn variant="primary" size="sm">+ Importer un CSV</Btn>
              </Link>
              <Link href="/app" style={{ textDecoration: 'none' }}>
                <Btn variant="ghost" size="sm">← Retour app</Btn>
              </Link>
            </>
          }
        />

        {/* === STATS GRID === */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
          marginBottom: 28,
        }}>
          <KpiCard
            label="Net total"
            value={fmtMoney(stats.totalPnl)}
            valueColor={stats.totalPnl >= 0 ? T.color.green : T.color.red}
            hint={`${stats.tradeCount} trade${stats.tradeCount > 1 ? 's' : ''}`}
          />
          <KpiCard
            label="Win rate"
            value={`${stats.winRate.toFixed(1)}%`}
            valueColor={stats.winRate >= 50 ? T.color.green : T.color.amber}
            hint={`${stats.wins}W · ${stats.losses}L${stats.scratched ? ` · ${stats.scratched}S` : ''}`}
          />
          <KpiCard
            label="Trade moyen"
            value={fmtMoney(stats.avgTrade)}
            valueColor={stats.avgTrade >= 0 ? T.color.green : T.color.red}
          />
          <KpiCard
            label="Meilleur trade"
            value={fmtMoney(stats.bestTrade)}
            valueColor={T.color.green}
          />
          <KpiCard
            label="Pire trade"
            value={fmtMoney(stats.worstTrade)}
            valueColor={T.color.red}
          />
          <KpiCard
            label="Jours actifs"
            value={String(stats.activeDays)}
            hint={stats.bestDay ? `Meilleur : ${stats.bestDay.date.slice(5)} (${fmtMoney(stats.bestDay.pnl)})` : '—'}
          />
          <KpiCard
            label="Contrats tradés"
            value={String(stats.totalQty)}
            hint={`${stats.totalFills} fills bruts`}
          />
        </div>

        {/* === FILTRES === */}
        <Section
          title="Filtres"
          action={hasFilters && (
            <button onClick={resetFilters} style={resetBtnStyle}>↺ Reset</button>
          )}
        >
          <Card padding="md">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              alignItems: 'end',
            }}>
              <FilterField label="Compte">
                <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} style={selectStyle}>
                  <option value="all" style={optStyle}>Tous les comptes</option>
                  {accounts.filter(a => trades.some(t => t.account_id === a.id)).map((a) => (
                    <option key={a.id} value={a.id} style={optStyle}>
                      {a.name || `Sans nom · ${a.id.slice(0, 6)}`}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Side">
                <div style={{ display: 'flex', gap: 4 }}>
                  {['all', 'LONG', 'SHORT'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterSide(s)}
                      style={chipBtn(filterSide === s, s === 'LONG' ? T.color.green : s === 'SHORT' ? T.color.red : null)}
                    >
                      {s === 'all' ? 'Tous' : s}
                    </button>
                  ))}
                </div>
              </FilterField>

              <FilterField label="Instrument">
                <select value={filterInstrument} onChange={(e) => setFilterInstrument(e.target.value)} style={selectStyle}>
                  <option value="all" style={optStyle}>Tous</option>
                  {instruments.map((i) => (
                    <option key={i} value={i} style={optStyle}>{i}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Date — de">
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} style={selectStyle} />
              </FilterField>

              <FilterField label="Date — à">
                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} style={selectStyle} />
              </FilterField>
            </div>
          </Card>
        </Section>

        {/* === TABLE === */}
        <Section
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              Trades importés
              <span style={{ fontSize: 11, color: T.color.text3, fontFamily: T.font.mono, fontWeight: 500, letterSpacing: '0.05em' }}>
                ({filteredTrades.length} {hasFilters && trades.length !== filteredTrades.length ? `sur ${trades.length}` : ''})
              </span>
            </span>
          }
          action={loading && <LiveDot color={T.color.blueLight} label="LOADING" />}
        >
          {filteredTrades.length === 0 && !loading ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            <Card padding="sm">
              <div style={{ overflowX: 'auto', borderRadius: T.radius.md }}>
                <table className="js-table" style={{
                  width: '100%',
                  fontSize: 12,
                  fontFamily: T.font.mono,
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                }}>
                  <thead>
                    <tr style={{
                      background: 'rgba(255,255,255,0.025)',
                      borderBottom: `1px solid ${T.color.border}`,
                    }}>
                      <th style={th}>Date</th>
                      <th style={th}>Compte</th>
                      <th style={th}>Inst.</th>
                      <th style={th}>Side</th>
                      <th style={{ ...th, textAlign: 'right' }}>Qty</th>
                      <th style={{ ...th, textAlign: 'right' }}>Entrée</th>
                      <th style={{ ...th, textAlign: 'right' }}>Sortie</th>
                      <th style={{ ...th, textAlign: 'right' }}>Net P&L</th>
                      <th style={th}>Heures</th>
                      <th style={{ ...th, textAlign: 'right' }}>Hold</th>
                      <th style={{ ...th, textAlign: 'right' }}>Fills</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrades.slice(0, 500).map((t) => {
                      const meta = parseRithmicMeta(t.notes)
                      const acc = accountById[t.account_id]
                      const pnl = Number(t.pnl) || 0
                      const isLong = t.side === 'LONG'
                      return (
                        <tr key={t.id} className="js-row">
                          <td style={td}>{t.date}</td>
                          <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {acc?.firms?.color && (
                                <span style={{
                                  width: 6, height: 6, borderRadius: '50%',
                                  background: acc.firms.color, flexShrink: 0,
                                }} />
                              )}
                              <span style={{ color: T.color.text2 }}>
                                {acc?.name || (acc ? `· ${acc.id.slice(0, 6)}` : '?')}
                              </span>
                            </div>
                          </td>
                          <td style={{ ...td, color: T.color.text }}>{t.instrument || '—'}</td>
                          <td style={{
                            ...td,
                            color: isLong ? T.color.green : T.color.red,
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                          }}>
                            {t.side === 'LONG' ? '▲ LONG' : t.side === 'SHORT' ? '▼ SHORT' : t.side || '—'}
                          </td>
                          <td style={{ ...td, textAlign: 'right' }}>{meta?.qty ?? '—'}</td>
                          <td style={{ ...td, textAlign: 'right', color: T.color.text2 }}>
                            {t.entry_price ?? '—'}
                          </td>
                          <td style={{ ...td, textAlign: 'right', color: T.color.text2 }}>
                            {t.exit_price ?? '—'}
                          </td>
                          <td style={{
                            ...td, textAlign: 'right',
                            color: pnl >= 0 ? T.color.green : T.color.red,
                            fontWeight: 600,
                          }}>
                            {fmtMoney(pnl)}
                          </td>
                          <td style={{ ...td, color: T.color.text3, fontSize: 11 }}>
                            {meta?.entryTime && meta?.exitTime
                              ? `${fmtTime(meta.entryTime)} → ${fmtTime(meta.exitTime)}`
                              : '—'
                            }
                          </td>
                          <td style={{ ...td, textAlign: 'right', color: T.color.text3 }}>
                            {meta?.holdSeconds ? fmtHold(meta.holdSeconds) : '—'}
                          </td>
                          <td style={{ ...td, textAlign: 'right', color: T.color.text3 }}>
                            {meta?.fills ?? '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {filteredTrades.length > 500 && (
                <div style={{
                  padding: 16, textAlign: 'center',
                  fontSize: 11, color: T.color.text3, fontFamily: T.font.mono,
                  borderTop: `1px solid ${T.color.border}`,
                }}>
                  Affichage des 500 premiers · {filteredTrades.length - 500} trades supplémentaires masqués. Affine les filtres pour voir le reste.
                </div>
              )}
            </Card>
          )}
        </Section>

        {/* === Footer === */}
        <div style={{
          marginTop: 32,
          padding: '20px 0',
          borderTop: `1px solid ${T.color.border}`,
          fontSize: 11,
          color: T.color.text3,
          fontFamily: T.font.mono,
          letterSpacing: '0.05em',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <span>
            JOURNAL SYNC · QUANTARA · v0.1 BETA
          </span>
          <span>
            Source unique : marker <code style={{ color: T.color.text2 }}>[rithmic:...]</code> dans <code style={{ color: T.color.text2 }}>journal_entries.notes</code>
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function KpiCard({ label, value, hint, valueColor }) {
  return (
    <div style={{
      padding: '14px 16px',
      background: T.color.surface,
      backdropFilter: T.color.glassBlur,
      WebkitBackdropFilter: T.color.glassBlur,
      border: `1px solid ${T.color.border}`,
      borderRadius: T.radius.lg,
    }}>
      <div style={{
        fontSize: 10,
        color: T.color.text3,
        fontFamily: T.font.mono,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 20,
        fontWeight: 700,
        fontFamily: T.font.mono,
        letterSpacing: '-0.01em',
        color: valueColor || T.color.text,
        lineHeight: 1.1,
      }}>
        {value}
      </div>
      {hint && (
        <div style={{
          fontSize: 10,
          color: T.color.text3,
          fontFamily: T.font.mono,
          marginTop: 6,
          letterSpacing: '0.04em',
        }}>
          {hint}
        </div>
      )}
    </div>
  )
}

function FilterField({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        color: T.color.text3,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: 6,
        fontFamily: T.font.mono,
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ hasFilters }) {
  return (
    <Card padding="lg">
      <div style={{
        padding: 32,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.6 }}>—</div>
        <div style={{ fontSize: 14, color: T.color.text2, marginBottom: 8 }}>
          {hasFilters ? 'Aucun trade ne correspond à ces filtres.' : 'Aucun trade importé pour le moment.'}
        </div>
        <div style={{ fontSize: 12, color: T.color.text3, marginBottom: 18 }}>
          {hasFilters
            ? 'Essaie de retirer ou modifier les filtres.'
            : 'Importe ton premier CSV Rithmic depuis l\'Import Lab pour commencer.'}
        </div>
        {!hasFilters && (
          <Link href="/app/import-lab" style={{ textDecoration: 'none' }}>
            <Btn variant="primary" size="md">→ Aller à l'Import Lab</Btn>
          </Link>
        )}
      </div>
    </Card>
  )
}

function FullPageState({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: T.color.bg, color: T.color.text,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center',
      fontFamily: T.font.sans,
    }}>{children}</div>
  )
}

// Styles globaux pour la table (hover effect)
function PageStyles() {
  return (
    <style>{`
      .js-table tbody tr {
        border-bottom: 1px solid ${T.color.border};
        transition: background 0.12s ease;
      }
      .js-table tbody tr:last-child {
        border-bottom: none;
      }
      .js-table tbody tr:hover {
        background: rgba(255,255,255,0.025);
      }
      .js-table tbody tr.js-row td {
        padding: 9px 12px;
      }
    `}</style>
  )
}

// ============================================================================
// STYLES INLINE
// ============================================================================

const th = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 10,
  fontWeight: 600,
  color: T.color.text3,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontFamily: T.font.mono,
}

const td = {
  padding: '9px 12px',
  color: T.color.text2,
  fontFamily: T.font.mono,
}

const selectStyle = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 13,
  background: T.color.surfaceSolid,
  color: T.color.text,
  border: `1px solid ${T.color.borderStrong}`,
  borderRadius: T.radius.md,
  fontFamily: T.font.sans,
  outline: 'none',
}

const optStyle = {
  background: T.color.surfaceSolid,
  color: T.color.text,
}

function chipBtn(active, accent) {
  return {
    padding: '7px 12px',
    fontSize: 11,
    cursor: 'pointer',
    borderRadius: 99,
    border: `1px solid ${active ? (accent ? `${accent}66` : T.color.blueRing) : T.color.border}`,
    fontFamily: T.font.mono,
    fontWeight: active ? 600 : 500,
    background: active ? (accent ? `${accent}22` : T.color.blueSoft) : 'transparent',
    color: active ? (accent || T.color.blueLight) : T.color.text2,
    letterSpacing: '0.05em',
    transition: 'all 0.15s',
  }
}

const resetBtnStyle = {
  padding: '5px 12px',
  fontSize: 10,
  background: 'transparent',
  color: T.color.text3,
  border: `1px solid ${T.color.border}`,
  borderRadius: T.radius.sm,
  cursor: 'pointer',
  fontFamily: T.font.mono,
  letterSpacing: '0.08em',
}
