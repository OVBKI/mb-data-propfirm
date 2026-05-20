'use client'
// TODO i18n v3.1 — Composant FR-only pour l'instant. Strings à traduire :
// header, filtres, labels jours/sessions, vide état, tooltips.
//
// components/HeatmapPage.js — Vue analytique heatmaps avancées.
//
// 6 visualisations :
//   1. Day of Week        — bar chart 7 jours (Mon-Sun), P&L net + count
//   2. Hour of Day        — bar chart 24h (0-23h), P&L net + count
//   3. Day × Hour Matrix  — grille 7×24 colorée par intensité P&L (killer chart)
//   4. Instrument         — top 10 instruments par P&L cumulé
//   5. Long vs Short      — comparaison side
//   6. Sessions           — 4 cards : Asia / London / NY morning / NY afternoon
//
// Source data : table journal_entries (Supabase), avec colonne traded_at TIMESTAMPTZ.
// Trades sans traded_at sont ignorés des heatmaps hour-based (mais comptés en day-of-week).
//
// COMPATIBLE avec /app?p=heatmaps — rendu depuis app/app/page.js

import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  surface:   'rgba(20,23,32,0.65)',
  surface2:  'rgba(28,32,48,0.7)',
  border:    'rgba(255,255,255,0.07)',
  border2:   'rgba(255,255,255,0.13)',
  text:      '#f0ede8',
  text2:     '#9098b0',
  text3:     '#5a6275',
  green:     '#1db87a',
  greenSoft: 'rgba(29,184,122,0.15)',
  red:       '#e8504a',
  redSoft:   'rgba(232,80,74,0.15)',
  amber:     '#fac775',
  blue:      '#2d6fff',
  blueLt:    '#4d8fff',
  neutral:   'rgba(255,255,255,0.04)',
}

const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }
const inputS = { padding: '7px 10px', fontSize: 12, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 6, background: 'rgba(255,255,255,0.02)', color: C.text, outline: 'none', fontFamily: 'inherit' }

// Filtres période
const PERIOD_PRESETS = [
  { k: 'all',   l: 'Tout',        days: null },
  { k: '30d',   l: '30 jours',    days: 30 },
  { k: '90d',   l: '3 mois',      days: 90 },
  { k: '180d',  l: '6 mois',      days: 180 },
  { k: '365d',  l: '1 an',        days: 365 },
]

// Filtres statut compte (les statuts FR sont stockés tels quels en DB)
const STATUS_PRESETS = [
  { k: 'all',       l: 'Tous',        color: C => C.text2 },
  { k: 'Challenge', l: 'Challenge',   color: C => C.amber },
  { k: 'Financé',   l: 'Financé',     color: C => C.green },
  { k: 'Échoué',    l: 'Échoué',      color: C => C.red },
]

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']  // index = getDay() 0-6
const DAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

// Sessions trading (heure locale de l'user — auto-détectée via navigator)
// Note : pour un trader belge ces sessions sont en heure EU.
// Asia/London/NY sont labellés selon la session active en parallèle dans le monde.
const SESSIONS = [
  { k: 'asia',   l: '🌏 Asia',        emoji: '🌏', range: [0, 7],   desc: '00:00 — 07:00 (locale)' },
  { k: 'london', l: '🇬🇧 London',     emoji: '🇬🇧', range: [7, 13],  desc: '07:00 — 13:00 (locale)' },
  { k: 'nyAM',   l: '🇺🇸 NY Morning', emoji: '🇺🇸', range: [13, 17], desc: '13:00 — 17:00 (locale)' },
  { k: 'nyPM',   l: '🇺🇸 NY After',   emoji: '🇺🇸', range: [17, 24], desc: '17:00 — 24:00 (locale)' },
]

function fmtMoney(n, dec = 0) {
  const v = Number(n) || 0
  return (v >= 0 ? '+' : '') + v.toFixed(dec) + ' $'
}
function fmtMoneyFull(n, dec = 2) {
  const v = Number(n) || 0
  return (v >= 0 ? '+' : '') + v.toFixed(dec) + ' $'
}

// Colorise une cellule selon le P&L net (vert = profit, rouge = perte, neutre = 0)
// `magnitude` = ratio 0-1 par rapport au max abs P&L (intensité)
function pnlColor(pnl, magnitude) {
  if (pnl === 0 || magnitude === 0) return C.neutral
  const intensity = Math.min(1, magnitude * 0.85 + 0.15)  // 0.15-1.0 (jamais transparent)
  if (pnl > 0) return `rgba(29,184,122,${intensity})`
  return `rgba(232,80,74,${intensity})`
}

function pnlTextColor(pnl) {
  if (pnl > 0) return C.green
  if (pnl < 0) return C.red
  return C.text3
}

export default function HeatmapPage({ user, firms, showToast }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('90d')
  const [accountFilter, setAccountFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Comptes plat pour le filtre
  const allAccounts = useMemo(() => {
    return firms.flatMap(f => (f.accounts || []).map(a => ({
      ...a,
      firmName: f.name,
      firmColor: f.color,
    })))
  }, [firms])

  // Map account_id → status pour le filtre statut (lookup O(1) au filtrage)
  const accountStatusMap = useMemo(() => {
    const m = new Map()
    for (const a of allAccounts) m.set(a.id, a.status || 'Challenge')
    return m
  }, [allAccounts])

  // === Fetch trades ===
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, account_id, date, traded_at, pnl, instrument, side')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      if (cancelled) return
      if (error) {
        console.error('[heatmap] fetch error:', error)
        showToast?.('Erreur chargement trades')
        setLoading(false)
        return
      }
      setEntries(data || [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [user?.id])

  // === Filtre par période + compte + statut ===
  const filtered = useMemo(() => {
    const preset = PERIOD_PRESETS.find(p => p.k === period)
    let cutoff = null
    if (preset?.days != null) {
      const d = new Date()
      d.setDate(d.getDate() - preset.days)
      cutoff = d.toISOString().slice(0, 10)
    }
    return entries.filter(e => {
      if (cutoff && e.date < cutoff) return false
      if (accountFilter !== 'all' && e.account_id !== accountFilter) return false
      if (statusFilter !== 'all') {
        const st = accountStatusMap.get(e.account_id)
        if (st !== statusFilter) return false
      }
      return true
    })
  }, [entries, period, accountFilter, statusFilter, accountStatusMap])

  // === Agrégations ===
  const stats = useMemo(() => {
    const dayOfWeek = Array.from({ length: 7 }, () => ({ pnl: 0, count: 0, wins: 0 }))
    const hourOfDay = Array.from({ length: 24 }, () => ({ pnl: 0, count: 0, wins: 0 }))
    const matrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ pnl: 0, count: 0 })))
    const instrumentMap = new Map()  // instrument -> { pnl, count, wins }
    const sideMap = { Long: { pnl: 0, count: 0, wins: 0 }, Short: { pnl: 0, count: 0, wins: 0 } }
    const sessions = SESSIONS.reduce((acc, s) => ({ ...acc, [s.k]: { pnl: 0, count: 0, wins: 0 } }), {})

    for (const e of filtered) {
      const pnl = Number(e.pnl) || 0
      const isWin = pnl > 0

      // Day of week — depuis la date (toujours dispo)
      const dateObj = new Date(e.date + 'T00:00:00')
      const dow = dateObj.getDay()
      if (!isNaN(dow)) {
        dayOfWeek[dow].pnl += pnl
        dayOfWeek[dow].count++
        if (isWin) dayOfWeek[dow].wins++
      }

      // Hour-based (nécessite traded_at)
      if (e.traded_at) {
        const tradedDate = new Date(e.traded_at)
        if (!isNaN(tradedDate.getTime())) {
          const hh = tradedDate.getHours()
          const dd = tradedDate.getDay()
          // Hour of day
          hourOfDay[hh].pnl += pnl
          hourOfDay[hh].count++
          if (isWin) hourOfDay[hh].wins++
          // Matrix Day × Hour
          matrix[dd][hh].pnl += pnl
          matrix[dd][hh].count++
          // Sessions
          for (const s of SESSIONS) {
            if (hh >= s.range[0] && hh < s.range[1]) {
              sessions[s.k].pnl += pnl
              sessions[s.k].count++
              if (isWin) sessions[s.k].wins++
              break
            }
          }
        }
      }

      // Instrument
      if (e.instrument) {
        const key = e.instrument.trim().toUpperCase()
        if (!instrumentMap.has(key)) instrumentMap.set(key, { pnl: 0, count: 0, wins: 0 })
        const o = instrumentMap.get(key)
        o.pnl += pnl
        o.count++
        if (isWin) o.wins++
      }

      // Side
      if (e.side === 'Long' || e.side === 'Short') {
        sideMap[e.side].pnl += pnl
        sideMap[e.side].count++
        if (isWin) sideMap[e.side].wins++
      }
    }

    // Top 10 instruments par P&L absolu
    const instrumentList = Array.from(instrumentMap.entries())
      .map(([k, v]) => ({ name: k, ...v }))
      .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
      .slice(0, 10)

    return { dayOfWeek, hourOfDay, matrix, instrumentList, sideMap, sessions }
  }, [filtered])

  // Compte de trades sans traded_at (informer l'user)
  const missingTimeCount = useMemo(() => {
    return filtered.filter(e => !e.traded_at).length
  }, [filtered])

  if (loading) {
    return (
      <div style={{ padding: 24, color: C.text2 }}>
        Chargement des heatmaps...
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>📊 Heatmaps</h2>
        <div style={{ ...card, padding: 24, textAlign: 'center', color: C.text2 }}>
          <div style={{ fontSize: 38, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 600, color: C.text, marginBottom: 6 }}>Aucun trade à analyser</div>
          <div style={{ fontSize: 13 }}>
            Ajoute des trades dans le journal pour voir tes patterns par heure, jour et session.
          </div>
        </div>
      </div>
    )
  }

  // === Calculs auxiliaires pour les visualisations ===
  const maxAbsDow = Math.max(1, ...stats.dayOfWeek.map(d => Math.abs(d.pnl)))
  const maxAbsHour = Math.max(1, ...stats.hourOfDay.map(h => Math.abs(h.pnl)))
  const maxAbsMatrix = Math.max(1, ...stats.matrix.flat().map(c => Math.abs(c.pnl)))
  const maxAbsInstr = Math.max(1, ...stats.instrumentList.map(i => Math.abs(i.pnl)))

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, marginBottom: 4 }}>
          📊 Heatmaps
        </h2>
        <p style={{ fontSize: 13, color: C.text2, margin: 0 }}>
          Découvre tes patterns par heure, jour et session de trading.
        </p>
      </div>

      {/* Filtres */}
      <div style={{ ...card, padding: 14, marginBottom: 16, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Période */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: C.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Période</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {PERIOD_PRESETS.map(p => (
              <button
                key={p.k}
                onClick={() => setPeriod(p.k)}
                style={{
                  padding: '5px 10px', fontSize: 11, fontWeight: 500,
                  background: period === p.k ? 'rgba(45,111,255,0.15)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${period === p.k ? 'rgba(45,111,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: period === p.k ? C.blueLt : C.text2,
                  borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{p.l}</button>
            ))}
          </div>
        </div>

        {/* Statut compte */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: C.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUS_PRESETS.map(s => {
              const col = s.color(C)
              const active = statusFilter === s.k
              // Couleur active : teintée selon le statut (amber/green/red), bleue pour "Tous"
              const activeBg = s.k === 'all' ? 'rgba(45,111,255,0.15)'
                : s.k === 'Challenge' ? 'rgba(250,199,117,0.15)'
                : s.k === 'Financé'   ? 'rgba(29,184,122,0.15)'
                : 'rgba(232,80,74,0.15)'
              const activeBorder = s.k === 'all' ? 'rgba(45,111,255,0.4)'
                : s.k === 'Challenge' ? 'rgba(250,199,117,0.4)'
                : s.k === 'Financé'   ? 'rgba(29,184,122,0.4)'
                : 'rgba(232,80,74,0.4)'
              return (
                <button
                  key={s.k}
                  onClick={() => setStatusFilter(s.k)}
                  style={{
                    padding: '5px 10px', fontSize: 11, fontWeight: 500,
                    background: active ? activeBg : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? activeBorder : 'rgba(255,255,255,0.08)'}`,
                    color: active ? col : C.text2,
                    borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{s.l}</button>
              )
            })}
          </div>
        </div>

        {/* Compte spécifique */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: C.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compte</span>
          <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} style={{ ...inputS, fontSize: 12 }}>
            <option value="all">Tous les comptes</option>
            {allAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.firmName} · {a.name || 'Compte'} ({a.status})</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 12, color: C.text3 }}>
          <strong style={{ color: C.text2 }}>{filtered.length}</strong> trade{filtered.length > 1 ? 's' : ''} analysé{filtered.length > 1 ? 's' : ''}
          {missingTimeCount > 0 && (
            <span style={{ marginLeft: 10, color: C.amber, fontSize: 11 }}>
              ⚠ {missingTimeCount} sans heure (exclus des vues horaires)
            </span>
          )}
        </div>
      </div>

      {/* Grid 2 colonnes pour les vues secondaires */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* === 1. DAY OF WEEK === */}
        <div style={{ ...card, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>📅 Par jour de semaine</h3>
            <span style={{ fontSize: 10, color: C.text3 }}>P&L net</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
            {stats.dayOfWeek.map((d, i) => {
              const mag = Math.abs(d.pnl) / maxAbsDow
              const h = d.count > 0 ? Math.max(8, mag * 100) : 4
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600,
                    color: pnlTextColor(d.pnl),
                    fontFamily: 'ui-monospace, monospace',
                  }}>
                    {d.count > 0 ? fmtMoney(d.pnl) : '—'}
                  </div>
                  <div style={{
                    width: '80%', height: `${h}px`,
                    background: pnlColor(d.pnl, mag),
                    borderRadius: '4px 4px 0 0',
                    border: d.count > 0 ? `1px solid ${d.pnl >= 0 ? 'rgba(29,184,122,0.4)' : 'rgba(232,80,74,0.4)'}` : '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s',
                  }} title={`${DAYS_FULL[i]} · ${d.count} trade${d.count > 1 ? 's' : ''} · ${fmtMoneyFull(d.pnl)}${d.count > 0 ? ` · WR ${(d.wins / d.count * 100).toFixed(0)}%` : ''}`} />
                  <div style={{ fontSize: 11, color: C.text3, fontWeight: 600 }}>{DAYS_FR[i]}</div>
                  <div style={{ fontSize: 9, color: C.text3 }}>{d.count}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* === 5. LONG vs SHORT === */}
        <div style={{ ...card, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>🔁 Long vs Short</h3>
            <span style={{ fontSize: 10, color: C.text3 }}>P&L · Win rate</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {['Long', 'Short'].map(side => {
              const s = stats.sideMap[side]
              const wr = s.count > 0 ? (s.wins / s.count * 100) : 0
              return (
                <div key={side} style={{
                  padding: 14,
                  background: side === 'Long' ? 'rgba(29,184,122,0.06)' : 'rgba(232,80,74,0.06)',
                  border: `1px solid ${side === 'Long' ? 'rgba(29,184,122,0.25)' : 'rgba(232,80,74,0.25)'}`,
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: side === 'Long' ? C.green : C.red, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {side === 'Long' ? '↑ Long' : '↓ Short'}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: pnlTextColor(s.pnl), fontFamily: 'ui-monospace, monospace', marginBottom: 6 }}>
                    {fmtMoneyFull(s.pnl)}
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.text3 }}>
                    <span><strong style={{ color: C.text2 }}>{s.count}</strong> trades</span>
                    <span>WR <strong style={{ color: wr >= 50 ? C.green : C.red }}>{wr.toFixed(0)}%</strong></span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* === 2. HOUR OF DAY === */}
      <div style={{ ...card, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>⏰ Par heure de la journée</h3>
          <span style={{ fontSize: 10, color: C.text3 }}>Heure locale · P&L net</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140 }}>
          {stats.hourOfDay.map((h, i) => {
            const mag = Math.abs(h.pnl) / maxAbsHour
            const barH = h.count > 0 ? Math.max(6, mag * 100) : 3
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0 }}>
                <div style={{
                  width: '90%', height: `${barH}px`,
                  background: pnlColor(h.pnl, mag),
                  borderRadius: '3px 3px 0 0',
                  border: h.count > 0 ? `1px solid ${h.pnl >= 0 ? 'rgba(29,184,122,0.4)' : 'rgba(232,80,74,0.4)'}` : '1px solid rgba(255,255,255,0.05)',
                }} title={`${i}h · ${h.count} trade${h.count > 1 ? 's' : ''} · ${fmtMoneyFull(h.pnl)}${h.count > 0 ? ` · WR ${(h.wins / h.count * 100).toFixed(0)}%` : ''}`} />
                <div style={{ fontSize: 9, color: C.text3, fontFamily: 'ui-monospace, monospace' }}>
                  {String(i).padStart(2, '0')}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 9, color: C.text3 }}>
          <span>00h (minuit)</span>
          <span>06h</span>
          <span>12h (midi)</span>
          <span>18h</span>
          <span>23h</span>
        </div>
      </div>

      {/* === 3. DAY × HOUR MATRIX (killer chart) === */}
      <div style={{ ...card, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>🔥 Matrice Jour × Heure</h3>
          <span style={{ fontSize: 10, color: C.text3 }}>Intensité = P&L magnitude</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'inline-block', minWidth: '100%' }}>
            {/* Header heures */}
            <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(24, 1fr)', gap: 2, marginBottom: 4 }}>
              <div></div>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} style={{ fontSize: 9, color: C.text3, textAlign: 'center', fontFamily: 'ui-monospace, monospace' }}>
                  {String(h).padStart(2, '0')}
                </div>
              ))}
            </div>
            {/* Lignes : 1 = Lun, 2 = Mar, ..., 5 = Ven, 6 = Sam, 0 = Dim */}
            {[1, 2, 3, 4, 5, 6, 0].map(dow => (
              <div key={dow} style={{ display: 'grid', gridTemplateColumns: '40px repeat(24, 1fr)', gap: 2, marginBottom: 2 }}>
                <div style={{ fontSize: 11, color: C.text3, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  {DAYS_FR[dow]}
                </div>
                {Array.from({ length: 24 }, (_, h) => {
                  const cell = stats.matrix[dow][h]
                  const mag = Math.abs(cell.pnl) / maxAbsMatrix
                  return (
                    <div
                      key={h}
                      style={{
                        aspectRatio: '1',
                        background: pnlColor(cell.pnl, mag),
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.03)',
                        position: 'relative',
                        cursor: cell.count > 0 ? 'help' : 'default',
                        transition: 'transform 0.15s, border-color 0.15s',
                      }}
                      title={cell.count > 0 ? `${DAYS_FULL[dow]} ${String(h).padStart(2, '0')}h · ${cell.count} trade${cell.count > 1 ? 's' : ''} · ${fmtMoneyFull(cell.pnl)}` : `${DAYS_FULL[dow]} ${String(h).padStart(2, '0')}h · aucun trade`}
                      onMouseEnter={ev => { if (cell.count > 0) { ev.currentTarget.style.transform = 'scale(1.4)'; ev.currentTarget.style.zIndex = '10'; ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)' } }}
                      onMouseLeave={ev => { ev.currentTarget.style.transform = 'scale(1)'; ev.currentTarget.style.zIndex = '1'; ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)' }}
                    >
                      {cell.count > 0 && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
                          pointerEvents: 'none',
                        }}>
                          {cell.count}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, fontSize: 10, color: C.text3 }}>
          <span>Légende :</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(29,184,122,0.85)', borderRadius: 2 }}></span> Profit fort
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(29,184,122,0.3)', borderRadius: 2 }}></span> Profit léger
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: C.neutral, borderRadius: 2 }}></span> Aucun
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(232,80,74,0.3)', borderRadius: 2 }}></span> Perte légère
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(232,80,74,0.85)', borderRadius: 2 }}></span> Perte forte
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 9 }}>Chiffre dans la case = nb trades</span>
        </div>
      </div>

      {/* === Grid 2 colonnes : Instruments + Sessions === */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        {/* === 4. INSTRUMENTS === */}
        <div style={{ ...card, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>📈 Top instruments</h3>
            <span style={{ fontSize: 10, color: C.text3 }}>Top 10 · P&L cumulé</span>
          </div>
          {stats.instrumentList.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.text3, fontSize: 12, padding: 24 }}>
              Aucun instrument renseigné dans tes trades.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.instrumentList.map((inst, i) => {
                const mag = Math.abs(inst.pnl) / maxAbsInstr
                const wr = inst.count > 0 ? (inst.wins / inst.count * 100) : 0
                return (
                  <div key={inst.name} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                    <div style={{ width: 50, fontWeight: 700, color: C.text, fontFamily: 'ui-monospace, monospace' }}>
                      {inst.name}
                    </div>
                    <div style={{ flex: 1, height: 18, background: 'rgba(255,255,255,0.02)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                      <div style={{
                        position: 'absolute', inset: 0, width: `${mag * 100}%`,
                        background: pnlColor(inst.pnl, mag),
                        borderRadius: 4,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <div style={{ width: 80, textAlign: 'right', color: pnlTextColor(inst.pnl), fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>
                      {fmtMoney(inst.pnl)}
                    </div>
                    <div style={{ width: 60, textAlign: 'right', color: C.text3, fontSize: 10 }}>
                      {inst.count}t · {wr.toFixed(0)}%
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* === 6. SESSIONS === */}
        <div style={{ ...card, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>🌐 Par session</h3>
            <span style={{ fontSize: 10, color: C.text3 }}>Heure locale</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SESSIONS.map(s => {
              const v = stats.sessions[s.k]
              const wr = v.count > 0 ? (v.wins / v.count * 100) : 0
              return (
                <div key={s.k} style={{
                  padding: 12,
                  background: v.count > 0 ? (v.pnl >= 0 ? 'rgba(29,184,122,0.05)' : 'rgba(232,80,74,0.05)') : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${v.count > 0 ? (v.pnl >= 0 ? 'rgba(29,184,122,0.2)' : 'rgba(232,80,74,0.2)') : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{s.l}</div>
                    <div style={{ fontSize: 9, color: C.text3 }}>{s.desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: pnlTextColor(v.pnl), fontFamily: 'ui-monospace, monospace' }}>
                      {v.count > 0 ? fmtMoneyFull(v.pnl) : '—'}
                    </span>
                    {v.count > 0 && (
                      <span style={{ fontSize: 10, color: C.text3 }}>
                        {v.count} trades · WR <strong style={{ color: wr >= 50 ? C.green : C.red }}>{wr.toFixed(0)}%</strong>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
