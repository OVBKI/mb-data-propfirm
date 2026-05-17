'use client'
// JOURNAL SYNC — panel dédié aux trades importés automatiquement via CSV.
//
// Strictement isolé du journal manuel : on n'affiche QUE les trades qui ont le
// marker [rithmic:ENTRY/EXIT] dans leur colonne `notes`. Idem pour les comptes :
// uniquement ceux avec rithmic_account_id renseigné.
//
// Sections :
//   1. KPIs résumé
//   2. Filtres (PropFirm, compte, side, instrument, dates)
//   3. Calendrier PnL mensuel (heatmap)
//   4. Equity curve par compte sélectionné (avec ligne DD trailing)
//   5. Table des trades avec métadonnées Rithmic complètes
//
// Design : cohérent landing/JournalPage. Off-white inverted primary, mono accents,
// frosted glass cards, geometric icons, terminal-style footer.

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { T } from '../../../components/dashboard/theme'
import { Card, Btn, Badge, PageHeader, Section, UIStyles, LiveDot } from '../../../components/dashboard/ui'

// ============================================================================
// Helpers
// ============================================================================

// Notes format produit par l'import :
//   "[rithmic:98779385/98785343] qty=5 fills=4 hold=15.4s entry=2026-05-15 15:40:26 exit=2026-05-15 15:40:42"
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

function fmtMoneyShort(n) {
  const v = Number(n) || 0
  const abs = Math.abs(v)
  if (abs >= 1000) return (v >= 0 ? '+' : '-') + (abs / 1000).toFixed(1) + 'k'
  return (v >= 0 ? '+' : '') + v.toFixed(0)
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

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

// ============================================================================
// Composant principal
// ============================================================================
export default function JournalSyncPage() {
  const [user, setUser] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [trades, setTrades] = useState([])
  const [accounts, setAccounts] = useState([])
  const [firms, setFirms] = useState([])
  const [loading, setLoading] = useState(false)

  // === Filtres ===
  const [filterFirm, setFilterFirm] = useState('all')
  const [filterAccount, setFilterAccount] = useState('all')
  const [filterSide, setFilterSide] = useState('all')
  const [filterInstrument, setFilterInstrument] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // === Calendrier : mois affiché ===
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())

  // === Auth + load ===
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user || null
      setUser(u)
      setLoadingAuth(false)
      if (u) loadData(u.id)
    })

    async function loadData(userId) {
      setLoading(true)
      const [tradesRes, accountsRes, firmsRes] = await Promise.all([
        supabase
          .from('journal_entries')
          .select('id, account_id, date, pnl, instrument, side, entry_price, exit_price, notes, user_id')
          .eq('user_id', userId)
          .like('notes', '%[rithmic:%')
          .order('date', { ascending: false })
          .limit(5000),
        // Uniquement les comptes synchronisés (qui ont un rithmic_account_id)
        supabase
          .from('accounts')
          .select('id, name, plan_size, status, firm_id, rithmic_account_id, rithmic_balance, rithmic_min_balance, liquidated_at, user_id, firms(name, color)')
          .eq('user_id', userId)
          .not('rithmic_account_id', 'is', null),
        supabase
          .from('firms')
          .select('id, name, color')
          .eq('user_id', userId)
          .order('name'),
      ])
      if (!mounted) return
      setTrades(tradesRes.data || [])
      setAccounts(accountsRes.data || [])
      setFirms(firmsRes.data || [])
      setLoading(false)
    }

    return () => { mounted = false }
  }, [])

  // === Lookups ===
  const accountById = useMemo(() => {
    const m = {}
    for (const a of accounts) m[a.id] = a
    return m
  }, [accounts])

  const firmById = useMemo(() => {
    const m = {}
    for (const f of firms) m[f.id] = f
    return m
  }, [firms])

  // === Firmes qui ont des comptes synced (pour le dropdown filtre) ===
  const syncedFirms = useMemo(() => {
    const ids = new Set(accounts.map(a => a.firm_id))
    return firms.filter(f => ids.has(f.id))
  }, [firms, accounts])

  // === Comptes filtrés par firme (pour le dropdown compte) ===
  const accountsForFirm = useMemo(() => {
    return filterFirm === 'all' ? accounts : accounts.filter(a => a.firm_id === filterFirm)
  }, [accounts, filterFirm])

  // === Reset filtre compte si la firme change et le compte n'est plus dispo ===
  useEffect(() => {
    if (filterAccount !== 'all' && !accountsForFirm.some(a => a.id === filterAccount)) {
      setFilterAccount('all')
    }
  }, [filterFirm, accountsForFirm, filterAccount])

  // === Instruments uniques ===
  const instruments = useMemo(() => {
    const set = new Set()
    for (const t of trades) if (t.instrument) set.add(t.instrument)
    return Array.from(set).sort()
  }, [trades])

  // === Trades filtrés ===
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (filterFirm !== 'all') {
        const acc = accountById[t.account_id]
        if (!acc || acc.firm_id !== filterFirm) return false
      }
      if (filterAccount !== 'all' && t.account_id !== filterAccount) return false
      if (filterSide !== 'all' && t.side !== filterSide) return false
      if (filterInstrument !== 'all' && t.instrument !== filterInstrument) return false
      if (filterDateFrom && t.date < filterDateFrom) return false
      if (filterDateTo && t.date > filterDateTo) return false
      return true
    })
  }, [trades, filterFirm, filterAccount, filterSide, filterInstrument, filterDateFrom, filterDateTo, accountById])

  // === Stats agrégées ===
  const stats = useMemo(() => {
    let totalPnl = 0, wins = 0, losses = 0, scratched = 0
    let totalQty = 0, totalFills = 0
    let bestTrade = -Infinity, worstTrade = Infinity
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
    const bestDay = Object.entries(pnlByDate).reduce((acc, [date, pnl]) =>
      !acc || pnl > acc.pnl ? { date, pnl } : acc, null)

    return {
      tradeCount, totalPnl, wins, losses, scratched, winRate, avgTrade,
      bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
      worstTrade: worstTrade === Infinity ? 0 : worstTrade,
      totalQty, totalFills, bestDay,
      activeDays: Object.keys(pnlByDate).length,
      pnlByDate,
    }
  }, [filteredTrades])

  // === Equity curve data (selon le compte filtré ou tous) ===
  const equityData = useMemo(() => {
    // Trie par date+heure pour ordre chronologique
    const sorted = [...filteredTrades].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      const ma = parseRithmicMeta(a.notes), mb = parseRithmicMeta(b.notes)
      return (ma?.entryTime || '').localeCompare(mb?.entryTime || '')
    })
    let cum = 0, peak = 0, maxDD = 0
    const points = sorted.map((t, i) => {
      cum += Number(t.pnl) || 0
      if (cum > peak) peak = cum
      const dd = peak - cum
      if (dd > maxDD) maxDD = dd
      return { i, date: t.date, cum, peak, dd }
    })
    return { points, maxDD, finalPnl: cum, peak }
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

  function resetFilters() {
    setFilterFirm('all'); setFilterAccount('all'); setFilterSide('all')
    setFilterInstrument('all'); setFilterDateFrom(''); setFilterDateTo('')
  }
  const hasFilters = filterFirm !== 'all' || filterAccount !== 'all' || filterSide !== 'all' || filterInstrument !== 'all' || filterDateFrom || filterDateTo

  // ==========================================================================
  return (
    <div style={{
      minHeight: '100vh', background: T.color.bg, color: T.color.text,
      padding: '32px 24px', fontFamily: T.font.sans,
    }}>
      <UIStyles />
      <PageStyles />

      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <PageHeader
          eyebrow="SYNC · CSV IMPORT"
          title="Journal Sync"
          subtitle="Trades importés depuis Rithmic. Isolé du journal manuel — chaque trade ici provient d'un export CSV."
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

        {/* === KPIs === */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12, marginBottom: 28,
        }}>
          <KpiCard label="Net total" value={fmtMoney(stats.totalPnl)} valueColor={stats.totalPnl >= 0 ? T.color.green : T.color.red} hint={`${stats.tradeCount} trade${stats.tradeCount > 1 ? 's' : ''}`} />
          <KpiCard label="Win rate" value={`${stats.winRate.toFixed(1)}%`} valueColor={stats.winRate >= 50 ? T.color.green : T.color.amber} hint={`${stats.wins}W · ${stats.losses}L${stats.scratched ? ` · ${stats.scratched}S` : ''}`} />
          <KpiCard label="Trade moyen" value={fmtMoney(stats.avgTrade)} valueColor={stats.avgTrade >= 0 ? T.color.green : T.color.red} />
          <KpiCard label="Drawdown max" value={fmtMoney(-equityData.maxDD)} valueColor={T.color.red} hint={`Peak $${equityData.peak.toFixed(0)}`} />
          <KpiCard label="Meilleur trade" value={fmtMoney(stats.bestTrade)} valueColor={T.color.green} />
          <KpiCard label="Pire trade" value={fmtMoney(stats.worstTrade)} valueColor={T.color.red} />
          <KpiCard label="Jours actifs" value={String(stats.activeDays)} hint={stats.bestDay ? `Best: ${stats.bestDay.date.slice(5)} (${fmtMoney(stats.bestDay.pnl)})` : '—'} />
          <KpiCard label="Contrats / Fills" value={`${stats.totalQty} / ${stats.totalFills}`} hint="qty totale · fills bruts" />
        </div>

        {/* === FILTRES === */}
        <Section
          title="Filtres"
          action={hasFilters && <button onClick={resetFilters} style={resetBtnStyle}>↺ Reset</button>}
        >
          <Card padding="md">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end' }}>
              <FilterField label="PropFirm">
                <select value={filterFirm} onChange={(e) => setFilterFirm(e.target.value)} style={selectStyle}>
                  <option value="all" style={optStyle}>Toutes les firmes</option>
                  {syncedFirms.map((f) => (
                    <option key={f.id} value={f.id} style={optStyle}>{f.name}</option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Compte">
                <select value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)} style={selectStyle}>
                  <option value="all" style={optStyle}>Tous les comptes</option>
                  {accountsForFirm.map((a) => (
                    <option key={a.id} value={a.id} style={optStyle}>
                      {a.name || `· ${a.id.slice(0, 6)}`} · {a.plan_size}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Side">
                <div style={{ display: 'flex', gap: 4 }}>
                  {['all', 'LONG', 'SHORT'].map((s) => (
                    <button key={s} onClick={() => setFilterSide(s)}
                      style={chipBtn(filterSide === s, s === 'LONG' ? T.color.green : s === 'SHORT' ? T.color.red : null)}
                    >{s === 'all' ? 'Tous' : s}</button>
                  ))}
                </div>
              </FilterField>

              <FilterField label="Instrument">
                <select value={filterInstrument} onChange={(e) => setFilterInstrument(e.target.value)} style={selectStyle}>
                  <option value="all" style={optStyle}>Tous</option>
                  {instruments.map((i) => <option key={i} value={i} style={optStyle}>{i}</option>)}
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

        {/* === GRID 2 colonnes : Calendrier + Equity Curve === */}
        <div className="js-charts-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28,
        }}>
          <PnlCalendar
            year={calYear} month={calMonth}
            pnlByDate={stats.pnlByDate}
            onPrev={() => {
              const d = new Date(calYear, calMonth - 1, 1)
              setCalYear(d.getFullYear()); setCalMonth(d.getMonth())
            }}
            onNext={() => {
              const d = new Date(calYear, calMonth + 1, 1)
              setCalYear(d.getFullYear()); setCalMonth(d.getMonth())
            }}
            onToday={() => {
              setCalYear(today.getFullYear()); setCalMonth(today.getMonth())
            }}
          />
          <EquityCurveCard data={equityData} />
        </div>

        {/* === TABLE === */}
        <Section
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              Trades importés
              <span style={{ fontSize: 11, color: T.color.text3, fontFamily: T.font.mono, fontWeight: 500, letterSpacing: '0.05em' }}>
                ({filteredTrades.length}{hasFilters && trades.length !== filteredTrades.length ? ` sur ${trades.length}` : ''})
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
                  width: '100%', fontSize: 12, fontFamily: T.font.mono,
                  borderCollapse: 'separate', borderSpacing: 0,
                }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.025)', borderBottom: `1px solid ${T.color.border}` }}>
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
                      const firm = acc?.firms || (acc ? firmById[acc.firm_id] : null)
                      const pnl = Number(t.pnl) || 0
                      const isLong = t.side === 'LONG'
                      return (
                        <tr key={t.id} className="js-row">
                          <td style={td}>{t.date}</td>
                          <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {firm?.color && (
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: firm.color, flexShrink: 0 }} />
                              )}
                              <span style={{ color: T.color.text2 }}>
                                {acc?.name || (acc ? `· ${acc.id.slice(0, 6)}` : '?')}
                              </span>
                            </div>
                          </td>
                          <td style={{ ...td, color: T.color.text }}>{t.instrument || '—'}</td>
                          <td style={{ ...td, color: isLong ? T.color.green : T.color.red, fontWeight: 600, letterSpacing: '0.05em' }}>
                            {t.side === 'LONG' ? '▲ LONG' : t.side === 'SHORT' ? '▼ SHORT' : t.side || '—'}
                          </td>
                          <td style={{ ...td, textAlign: 'right' }}>{meta?.qty ?? '—'}</td>
                          <td style={{ ...td, textAlign: 'right', color: T.color.text2 }}>{t.entry_price ?? '—'}</td>
                          <td style={{ ...td, textAlign: 'right', color: T.color.text2 }}>{t.exit_price ?? '—'}</td>
                          <td style={{ ...td, textAlign: 'right', color: pnl >= 0 ? T.color.green : T.color.red, fontWeight: 600 }}>
                            {fmtMoney(pnl)}
                          </td>
                          <td style={{ ...td, color: T.color.text3, fontSize: 11 }}>
                            {meta?.entryTime && meta?.exitTime ? `${fmtTime(meta.entryTime)} → ${fmtTime(meta.exitTime)}` : '—'}
                          </td>
                          <td style={{ ...td, textAlign: 'right', color: T.color.text3 }}>{meta?.holdSeconds ? fmtHold(meta.holdSeconds) : '—'}</td>
                          <td style={{ ...td, textAlign: 'right', color: T.color.text3 }}>{meta?.fills ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {filteredTrades.length > 500 && (
                <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: T.color.text3, fontFamily: T.font.mono, borderTop: `1px solid ${T.color.border}` }}>
                  Affichage des 500 premiers · {filteredTrades.length - 500} trades supplémentaires masqués. Affine les filtres pour voir le reste.
                </div>
              )}
            </Card>
          )}
        </Section>

        <div style={{
          marginTop: 32, padding: '20px 0', borderTop: `1px solid ${T.color.border}`,
          fontSize: 11, color: T.color.text3, fontFamily: T.font.mono, letterSpacing: '0.05em',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <span>JOURNAL SYNC · QUANTARA · v0.2 BETA</span>
          <span>Source : marker <code style={{ color: T.color.text2 }}>[rithmic:...]</code> + <code style={{ color: T.color.text2 }}>rithmic_account_id</code></span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// CALENDRIER PnL MENSUEL
// ============================================================================
function PnlCalendar({ year, month, pnlByDate, onPrev, onNext, onToday }) {
  // Calcule la grille du mois : commence le lundi (semaine FR)
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = (firstDay.getDay() + 6) % 7 // 0=Lun, 6=Dim
  const totalDays = lastDay.getDate()

  // Total du mois affiché
  let monthTotal = 0
  let activeDays = 0
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (pnlByDate[dateStr] !== undefined) {
      monthTotal += pnlByDate[dateStr]
      activeDays++
    }
  }

  // Max absolu pour normaliser l'intensité des couleurs
  const monthValues = []
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (pnlByDate[dateStr] !== undefined) monthValues.push(Math.abs(pnlByDate[dateStr]))
  }
  const maxAbs = monthValues.length > 0 ? Math.max(...monthValues) : 1

  // Construit les cellules : padding début + jours du mois
  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, dateStr, pnl: pnlByDate[dateStr] })
  }

  return (
    <Card padding="md">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: T.color.text3, fontFamily: T.font.mono, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            Calendrier PnL
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.color.text }}>
            {MONTHS_FR[month]} {year}
            <span style={{ marginLeft: 12, fontSize: 12, fontFamily: T.font.mono, color: monthTotal >= 0 ? T.color.green : T.color.red, fontWeight: 700 }}>
              {fmtMoney(monthTotal)}
            </span>
            <span style={{ marginLeft: 8, fontSize: 11, color: T.color.text3, fontFamily: T.font.mono }}>
              · {activeDays} jour{activeDays > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onPrev} style={navBtnStyle}>◀</button>
          <button onClick={onToday} style={{ ...navBtnStyle, fontSize: 10, padding: '4px 10px', letterSpacing: '0.08em' }}>AUJ</button>
          <button onClick={onNext} style={navBtnStyle}>▶</button>
        </div>
      </div>

      {/* Days header */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
        marginBottom: 6,
      }}>
        {DAYS_FR.map((d) => (
          <div key={d} style={{
            fontSize: 9, color: T.color.text3, textAlign: 'center', padding: '4px 0',
            fontFamily: T.font.mono, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((c, i) => {
          if (!c) return <div key={i} />
          const isToday = c.dateStr === new Date().toISOString().slice(0, 10)
          const hasPnl = c.pnl !== undefined
          // Intensité (0.10 à 0.55) selon |pnl| / maxAbs
          const intensity = hasPnl ? 0.12 + (Math.abs(c.pnl) / maxAbs) * 0.43 : 0
          const bgColor = !hasPnl
            ? 'rgba(255,255,255,0.025)'
            : c.pnl >= 0
              ? `rgba(16,185,129,${intensity})`
              : `rgba(239,68,68,${intensity})`
          return (
            <div key={i} title={hasPnl ? `${c.dateStr} : ${fmtMoney(c.pnl)}` : c.dateStr} style={{
              aspectRatio: '1.4',
              background: bgColor,
              borderRadius: 6,
              padding: '6px 7px',
              border: `1px solid ${isToday ? T.color.blueRing : 'rgba(255,255,255,0.04)'}`,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              fontFamily: T.font.mono,
              cursor: hasPnl ? 'help' : 'default',
            }}>
              <div style={{
                fontSize: 10, color: isToday ? T.color.blueLight : (hasPnl ? T.color.text : T.color.text3),
                fontWeight: isToday ? 700 : 500,
              }}>{c.day}</div>
              {hasPnl && (
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  color: c.pnl >= 0 ? T.color.green : T.color.red,
                  textAlign: 'right', lineHeight: 1,
                }}>
                  {fmtMoneyShort(c.pnl)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ============================================================================
// EQUITY CURVE
// ============================================================================
function EquityCurveCard({ data }) {
  const { points, maxDD, finalPnl, peak } = data
  const W = 480, H = 220, P = 20

  if (points.length < 2) {
    return (
      <Card padding="md">
        <div style={{ fontSize: 11, color: T.color.text3, fontFamily: T.font.mono, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Equity curve
        </div>
        <div style={{
          height: H, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.color.text3, fontSize: 12, fontFamily: T.font.mono,
        }}>
          Au moins 2 trades nécessaires
        </div>
      </Card>
    )
  }

  // Bornes
  const cums = points.map(p => p.cum)
  const peaks = points.map(p => p.peak)
  const ymin = Math.min(0, ...cums) - 5
  const ymax = Math.max(0, ...peaks) + 5
  const xstep = (W - 2 * P) / Math.max(1, points.length - 1)

  function xy(i, v) {
    const x = P + i * xstep
    const y = H - P - ((v - ymin) / (ymax - ymin)) * (H - 2 * P)
    return [x, y]
  }

  // Path cumulé
  const equityPath = points.map((p, i) => {
    const [x, y] = xy(i, p.cum)
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')

  // Aire sous la courbe (gradient fill)
  const areaPath = equityPath
    + ` L ${(P + (points.length - 1) * xstep).toFixed(1)} ${(H - P).toFixed(1)}`
    + ` L ${P} ${(H - P).toFixed(1)} Z`

  // Path peak (ligne max)
  const peakPath = points.map((p, i) => {
    const [x, y] = xy(i, p.peak)
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')

  // Ligne zéro
  const [, zeroY] = xy(0, 0)

  return (
    <Card padding="md">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: T.color.text3, fontFamily: T.font.mono, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            Equity curve
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.color.text }}>
            <span style={{ color: finalPnl >= 0 ? T.color.green : T.color.red, fontFamily: T.font.mono }}>{fmtMoney(finalPnl)}</span>
            <span style={{ marginLeft: 10, fontSize: 11, color: T.color.text3, fontFamily: T.font.mono }}>
              {points.length} trades · DD max <span style={{ color: T.color.red }}>−${maxDD.toFixed(0)}</span>
            </span>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.color.green} stopOpacity="0.25" />
            <stop offset="100%" stopColor={T.color.green} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ligne zéro pointillée */}
        <line x1={P} y1={zeroY} x2={W - P} y2={zeroY} stroke={T.color.text3} strokeWidth="0.5" strokeDasharray="3 3" opacity="0.5" />

        {/* Aire sous la courbe equity */}
        <path d={areaPath} fill="url(#equityGrad)" />

        {/* Peak line (en pointillé, indicatif du DD) */}
        <path d={peakPath} fill="none" stroke={T.color.amber} strokeWidth="1" strokeDasharray="2 3" opacity="0.55" />

        {/* Equity line */}
        <path d={equityPath} fill="none" stroke={finalPnl >= 0 ? T.color.green : T.color.red} strokeWidth="1.6" />

        {/* Labels axes */}
        <text x={P} y={12} fill={T.color.text3} fontSize="9" fontFamily="ui-monospace, monospace">
          ${ymax.toFixed(0)}
        </text>
        <text x={P} y={H - 4} fill={T.color.text3} fontSize="9" fontFamily="ui-monospace, monospace">
          ${ymin.toFixed(0)}
        </text>
        <text x={W - P} y={zeroY - 3} fill={T.color.text3} fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="end">
          $0
        </text>
      </svg>

      {/* Légende */}
      <div style={{
        display: 'flex', gap: 14, marginTop: 10,
        fontSize: 10, color: T.color.text3, fontFamily: T.font.mono, letterSpacing: '0.05em',
      }}>
        <LegendDot color={finalPnl >= 0 ? T.color.green : T.color.red} solid>Equity</LegendDot>
        <LegendDot color={T.color.amber}>Peak (DD ref)</LegendDot>
      </div>
    </Card>
  )
}

function LegendDot({ color, solid, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        width: 14, height: 1.5, background: color,
        borderRadius: 1, ...(solid ? {} : { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 6px)`, background: 'none' }),
      }} />
      {children}
    </span>
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
      <div style={{ fontSize: 10, color: T.color.text3, fontFamily: T.font.mono, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: T.font.mono, letterSpacing: '-0.01em', color: valueColor || T.color.text, lineHeight: 1.1 }}>
        {value}
      </div>
      {hint && (
        <div style={{ fontSize: 10, color: T.color.text3, fontFamily: T.font.mono, marginTop: 6, letterSpacing: '0.04em' }}>
          {hint}
        </div>
      )}
    </div>
  )
}

function FilterField({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.color.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, fontFamily: T.font.mono }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ hasFilters }) {
  return (
    <Card padding="lg">
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.6 }}>—</div>
        <div style={{ fontSize: 14, color: T.color.text2, marginBottom: 8 }}>
          {hasFilters ? 'Aucun trade ne correspond à ces filtres.' : 'Aucun trade importé pour le moment.'}
        </div>
        <div style={{ fontSize: 12, color: T.color.text3, marginBottom: 18 }}>
          {hasFilters ? 'Essaie de retirer ou modifier les filtres.' : 'Importe ton premier CSV Rithmic depuis l\'Import Lab pour commencer.'}
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
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center', fontFamily: T.font.sans,
    }}>{children}</div>
  )
}

function PageStyles() {
  return (
    <style>{`
      .js-table tbody tr {
        border-bottom: 1px solid ${T.color.border};
        transition: background 0.12s ease;
      }
      .js-table tbody tr:last-child { border-bottom: none; }
      .js-table tbody tr:hover { background: rgba(255,255,255,0.025); }
      .js-table tbody tr.js-row td { padding: 9px 12px; }
      @media (max-width: 900px) {
        .js-charts-grid { grid-template-columns: 1fr !important; }
      }
    `}</style>
  )
}

// ============================================================================
// STYLES
// ============================================================================
const th = { padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: T.color.text3, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: T.font.mono }
const td = { padding: '9px 12px', color: T.color.text2, fontFamily: T.font.mono }
const selectStyle = { width: '100%', padding: '8px 10px', fontSize: 13, background: T.color.surfaceSolid, color: T.color.text, border: `1px solid ${T.color.borderStrong}`, borderRadius: T.radius.md, fontFamily: T.font.sans, outline: 'none' }
const optStyle = { background: T.color.surfaceSolid, color: T.color.text }
const navBtnStyle = {
  padding: '6px 9px', fontSize: 11,
  background: 'rgba(255,255,255,0.04)', color: T.color.text2,
  border: `1px solid ${T.color.border}`, borderRadius: T.radius.sm,
  cursor: 'pointer', fontFamily: T.font.mono, letterSpacing: '0.05em',
}
function chipBtn(active, accent) {
  return {
    padding: '7px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 99,
    border: `1px solid ${active ? (accent ? `${accent}66` : T.color.blueRing) : T.color.border}`,
    fontFamily: T.font.mono, fontWeight: active ? 600 : 500,
    background: active ? (accent ? `${accent}22` : T.color.blueSoft) : 'transparent',
    color: active ? (accent || T.color.blueLight) : T.color.text2,
    letterSpacing: '0.05em', transition: 'all 0.15s',
  }
}
const resetBtnStyle = {
  padding: '5px 12px', fontSize: 10,
  background: 'transparent', color: T.color.text3,
  border: `1px solid ${T.color.border}`, borderRadius: T.radius.sm,
  cursor: 'pointer', fontFamily: T.font.mono, letterSpacing: '0.08em',
}
