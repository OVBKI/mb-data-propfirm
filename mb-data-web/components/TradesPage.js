'use client'
// components/TradesPage.js — Vue analytique de TOUS les trades en cards.
//
// Architecture :
//   - Header : titre + bouton "Nouveau trade"
//   - Toolbar : filtres (période, compte, instrument, side, win/loss, tags, search)
//                + tri + compteur résultats + export CSV
//   - Stats résumé : 4 KPIs (Total PnL, Trades, Win rate, R moyen)
//   - Grid cards : 2 colonnes responsive, infini scroll
//   - Modal édit : réutilise TradeEntryModal
//
// COMPATIBLE avec /app?p=trades — rendu depuis app/app/page.js

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import { accountLabel } from '../lib/constants'
import { computeRStats, computeRMultiple, computeRiskReward } from '../lib/tradeMath'
import { TRADE_TAGS, getTagMeta } from '../lib/tradeTags'
import TradeCard from './TradeCard'
import TradeEntryModal from './TradeEntryModal'
import TagSelector from './TagSelector'
import { C } from '../lib/theme'
import { fmtMoney, todayISO, daysAgoISO } from '../lib/format'
import { useT } from './LanguageProvider'
import Skeleton from './Skeleton'

const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }
// Local variants — differ from shared theme (smaller padding/fontSize/borderRadius, no transitions)
const inputS = { width: '100%', padding: '8px 10px', fontSize: 12, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 6, background: 'rgba(255,255,255,0.02)', color: C.text, outline: 'none', fontFamily: 'inherit' }
const btnGhost = { padding: '7px 12px', fontSize: 11, fontWeight: 500, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.10)', color: C.text2, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }
const btnPrimary = { padding: '8px 16px', fontSize: 12, fontWeight: 500, background: C.text, color: '#0a0c10', border: '1px solid transparent', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)' }

// Filtres période rapides
const PERIOD_PRESETS = [
  { k: 'all',    lk: 'periodAll',    days: null },
  { k: 'today',  lk: 'periodToday',  days: 0 },
  { k: '7d',     lk: 'period7d',     days: 7 },
  { k: '30d',    lk: 'period30d',    days: 30 },
  { k: '90d',    lk: 'period90d',    days: 90 },
]

// Tri options
const SORT_OPTIONS = [
  { k: 'date_desc', lk: 'sortDateDesc' },
  { k: 'date_asc',  lk: 'sortDateAsc' },
  { k: 'pnl_desc',  lk: 'sortPnlDesc' },
  { k: 'pnl_asc',   lk: 'sortPnlAsc' },
  { k: 'r_desc',    lk: 'sortRDesc' },
  { k: 'r_asc',     lk: 'sortRAsc' },
]

export default function TradesPage({ user, firms, showToast, onReload }) {
  const t = useT()
  // === Données ===
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [editing, setEditing] = useState(null) // null | { entry?: ..., defaultDate?, defaultAccountId? }

  // === Filtres ===
  const [period, setPeriod] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [firmFilter, setFirmFilter] = useState('all')
  const [instrumentFilter, setInstrumentFilter] = useState('all')
  const [sideFilter, setSideFilter] = useState('all')   // all | Long | Short
  const [resultFilter, setResultFilter] = useState('all') // all | win | loss | be
  const [tagFilter, setTagFilter] = useState([])
  const [searchQ, setSearchQ] = useState('')
  const [sort, setSort] = useState('date_desc')
  const [showFilters, setShowFilters] = useState(false) // mobile/UX : masquer par défaut sur petit écran

  // View mode for the trade log: 'cards' (default, screenshot-friendly),
  // 'compact' (one trade per row, dense), 'table' (true table for power
  // users who want to scan many trades fast). Persisted across visits.
  const [viewMode, setViewMode] = useState('cards')
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem('tradesPage.viewMode')
    if (saved === 'cards' || saved === 'compact' || saved === 'table') setViewMode(saved)
  }, [])
  function changeViewMode(mode) {
    setViewMode(mode)
    if (typeof window !== 'undefined') window.localStorage.setItem('tradesPage.viewMode', mode)
  }

  // === Comptes plat (pour résolution name + filtres) ===
  const allAccounts = useMemo(() => {
    return firms.flatMap(f => (f.accounts || []).map(a => ({
      ...a,
      firmId: f.id, firmName: f.name, firmColor: f.color,
    })))
  }, [firms])

  // === Load entries ===
  async function loadEntries() {
    if (!user) { setLoading(false); return }
    setLoading(true); setLoadError('')
    // Filtre user_id explicite (anti-leak admin)
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('[trades load]', error)
      setLoadError(error.message || t('app.trades.loadError'))
      return
    }
    setEntries(data || [])
  }
  useEffect(() => { loadEntries() }, [user?.id])

  // === Entries enrichies avec compte/firme ===
  const decoratedEntries = useMemo(() => {
    return entries
      .filter(e => allAccounts.some(a => a.id === e.account_id))
      .map(e => {
        const acc = allAccounts.find(a => a.id === e.account_id)
        return {
          ...e,
          _firmId: acc?.firmId,
          _firmName: acc?.firmName || 'Firme ?',
          _firmColor: acc?.firmColor || C.text3,
          _accountLabel: acc ? `${acc.firmName} · ${accountLabel(acc)}` : 'Compte supprimé',
        }
      })
  }, [entries, allAccounts])

  // === Filtres appliqués ===
  const filteredEntries = useMemo(() => {
    let arr = decoratedEntries

    // Période
    const period_def = PERIOD_PRESETS.find(p => p.k === period)
    if (period_def && period_def.days !== null) {
      const cutoff = daysAgoISO(period_def.days)
      arr = arr.filter(e => e.date >= cutoff)
    }

    // Firme + compte
    if (firmFilter !== 'all') arr = arr.filter(e => e._firmId === firmFilter)
    if (accountFilter !== 'all') arr = arr.filter(e => e.account_id === accountFilter)

    // Instrument
    if (instrumentFilter !== 'all') {
      arr = arr.filter(e => (e.instrument || '').toUpperCase() === instrumentFilter.toUpperCase())
    }

    // Side
    if (sideFilter !== 'all') arr = arr.filter(e => e.side === sideFilter)

    // Résultat win/loss/be
    if (resultFilter === 'win') arr = arr.filter(e => Number(e.pnl) > 0)
    else if (resultFilter === 'loss') arr = arr.filter(e => Number(e.pnl) < 0)
    else if (resultFilter === 'be') arr = arr.filter(e => Number(e.pnl) === 0)

    // Tags (AND)
    if (tagFilter.length > 0) {
      arr = arr.filter(e => {
        if (!Array.isArray(e.tags) || e.tags.length === 0) return false
        return tagFilter.every(t => e.tags.includes(t))
      })
    }

    // Search (notes + instrument + tags)
    const q = searchQ.trim().toLowerCase()
    if (q) {
      arr = arr.filter(e => {
        return (e.notes || '').toLowerCase().includes(q)
          || (e.instrument || '').toLowerCase().includes(q)
          || (Array.isArray(e.tags) && e.tags.some(t => t.toLowerCase().includes(q)))
      })
    }

    // Tri
    const withR = (e) => computeRMultiple({ entry: e.entry_price, exit: e.exit_price, stop: e.stop_loss, side: e.side, pnl: e.pnl })
    arr = [...arr].sort((a, b) => {
      switch (sort) {
        case 'date_asc':  return a.date.localeCompare(b.date)
        case 'pnl_desc':  return Number(b.pnl) - Number(a.pnl)
        case 'pnl_asc':   return Number(a.pnl) - Number(b.pnl)
        case 'r_desc':    return (withR(b) ?? -Infinity) - (withR(a) ?? -Infinity)
        case 'r_asc':     return (withR(a) ?? Infinity)  - (withR(b) ?? Infinity)
        case 'date_desc':
        default:          return b.date.localeCompare(a.date)
      }
    })

    return arr
  }, [decoratedEntries, period, firmFilter, accountFilter, instrumentFilter, sideFilter, resultFilter, tagFilter, searchQ, sort])

  // === Stats résumé (sur entries filtrées) ===
  const stats = useMemo(() => {
    const total = filteredEntries.length
    const totalPnl = filteredEntries.reduce((s, e) => s + (Number(e.pnl) || 0), 0)
    const wins = filteredEntries.filter(e => Number(e.pnl) > 0).length
    const winRate = total > 0 ? (wins / total * 100) : 0
    const rStats = computeRStats(filteredEntries)
    // Coûts cumulés (commissions + slippage)
    const totalCommissions = filteredEntries.reduce((s, e) => s + (Number(e.commissions) || 0), 0)
    const totalSlippage    = filteredEntries.reduce((s, e) => s + (Number(e.slippage)    || 0), 0)
    return { total, totalPnl, winRate, totalCommissions, totalSlippage, ...rStats }
  }, [filteredEntries])

  // === Liste unique des instruments présents (pour le dropdown filter) ===
  const availableInstruments = useMemo(() => {
    const set = new Set()
    decoratedEntries.forEach(e => {
      if (e.instrument) set.add(e.instrument.toUpperCase())
    })
    return Array.from(set).sort()
  }, [decoratedEntries])

  // === Accounts du filtre firme (si firme sélectionnée) ===
  const accountsForFirm = useMemo(() => {
    if (firmFilter === 'all') return allAccounts
    return allAccounts.filter(a => a.firmId === firmFilter)
  }, [firmFilter, allAccounts])

  // Reset compte si la firme change
  useEffect(() => {
    if (firmFilter !== 'all' && accountFilter !== 'all') {
      const acc = allAccounts.find(a => a.id === accountFilter)
      if (!acc || acc.firmId !== firmFilter) setAccountFilter('all')
    }
  }, [firmFilter, accountFilter, allAccounts])

  // === Export CSV ===
  function exportCSV() {
    const rows = [['Date', 'Firme', 'Compte', 'Instrument', 'Side', 'PnL net', 'Commissions', 'Slippage', 'PnL gross', 'Entry', 'Exit', 'Stop', 'TP', 'R réalisé', 'R:R visé', 'Tags', 'Notes']]
    filteredEntries.forEach(e => {
      const r = computeRMultiple({ entry: e.entry_price, exit: e.exit_price, stop: e.stop_loss, side: e.side, pnl: e.pnl })
      const rr = computeRiskReward({ entry: e.entry_price, takeProfit: e.take_profit, stop: e.stop_loss, side: e.side, pnl: e.pnl, exit: e.exit_price })
      const comm = Number(e.commissions) || 0
      const slip = Number(e.slippage) || 0
      const gross = Number(e.pnl) + comm + slip
      rows.push([
        e.date, e._firmName, e._accountLabel, e.instrument || '', e.side || '', String(e.pnl),
        comm > 0 ? comm.toFixed(2) : '', slip > 0 ? slip.toFixed(2) : '', gross.toFixed(2),
        e.entry_price ?? '', e.exit_price ?? '', e.stop_loss ?? '', e.take_profit ?? '',
        r != null ? r.toFixed(2) : '', rr != null ? rr.toFixed(2) : '',
        Array.isArray(e.tags) ? e.tags.join(', ') : '',
        e.notes || '',
      ])
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('﻿' + csv)
    a.download = `quantara-trades-${todayISO()}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    showToast?.(`📥 ${filteredEntries.length} ${t('app.trades.exported')}`)
  }

  // Reset tous les filtres
  function resetAllFilters() {
    setPeriod('all'); setAccountFilter('all'); setFirmFilter('all')
    setInstrumentFilter('all'); setSideFilter('all'); setResultFilter('all')
    setTagFilter([]); setSearchQ('')
  }

  const hasActiveFilters = period !== 'all' || firmFilter !== 'all' || accountFilter !== 'all'
    || instrumentFilter !== 'all' || sideFilter !== 'all' || resultFilter !== 'all'
    || tagFilter.length > 0 || searchQ !== ''

  // ===== RENDER =====
  return (
    <div style={{ padding: '0 4px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, color: C.blueLt, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
            {t('app.trades.eyebrow')}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            {t('app.trades.title')}
          </h1>
          <div style={{ fontSize: 12, color: C.text3, marginTop: 6 }}>
            {t('app.trades.subtitle')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={exportCSV} style={btnGhost} disabled={filteredEntries.length === 0}>
            {t('app.trades.btnExport')}
          </button>
          <button onClick={() => setEditing({})} style={btnPrimary}>
            {t('app.trades.btnNew')}
          </button>
        </div>
      </div>

      {/* === Stats résumé (4 KPIs + ligne coûts si applicable) === */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }} className="trades-stats qt-stagger">
        <StatCard label={t('app.trades.statTrades')} value={String(stats.total)} />
        <StatCard label={t('app.trades.statPnl')} value={fmtMoney(stats.totalPnl)} color={stats.totalPnl >= 0 ? C.green : C.red} />
        <StatCard label={t('app.trades.statWinRate')} value={stats.total > 0 ? stats.winRate.toFixed(1) + '%' : '—'} color={stats.winRate >= 50 ? C.green : C.amber} />
        <StatCard label={t('app.trades.statAvgR')} value={stats.avgR != null ? (stats.avgR >= 0 ? '+' : '') + stats.avgR.toFixed(2) + 'R' : '—'} color={stats.avgR != null && stats.avgR >= 0.5 ? C.green : stats.avgR != null && stats.avgR >= 0 ? C.amber : C.red} />
      </div>

      {/* Coûts cumulés — affiché uniquement si > 0 (typiquement pour les imports Rithmic) */}
      {(stats.totalCommissions > 0 || stats.totalSlippage > 0) && (
        <div style={{ ...card, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', fontSize: 11, color: C.text3 }}>
          <span style={{ fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 9 }}>
            {t('app.trades.costs')}
          </span>
          {stats.totalCommissions > 0 && (
            <span>{t('app.trades.commLabel')} : <strong style={{ color: C.red, fontFamily: 'ui-monospace, monospace' }}>−${stats.totalCommissions.toFixed(2)}</strong></span>
          )}
          {stats.totalSlippage > 0 && (
            <span>{t('app.trades.slipLabel')} : <strong style={{ color: C.red, fontFamily: 'ui-monospace, monospace' }}>−${stats.totalSlippage.toFixed(2)}</strong></span>
          )}
          <span style={{ marginLeft: 'auto' }}>
            {t('app.trades.grossLabel')} : <strong style={{ color: stats.totalPnl + stats.totalCommissions + stats.totalSlippage >= 0 ? C.green : C.red, fontFamily: 'ui-monospace, monospace' }}>
              {fmtMoney(stats.totalPnl + stats.totalCommissions + stats.totalSlippage)}
            </strong>
          </span>
        </div>
      )}

      {/* === Toolbar filtres === */}
      <div style={{ ...card, padding: '14px 16px', marginBottom: 14 }}>
        {/* Ligne 1 : période chips + search + sort + toggle filtres avancés */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {PERIOD_PRESETS.map(p => (
              <button
                key={p.k}
                onClick={() => setPeriod(p.k)}
                style={{
                  padding: '5px 10px', fontSize: 11, fontWeight: 600,
                  borderRadius: 99,
                  background: period === p.k ? 'rgba(45,111,255,0.15)' : 'transparent',
                  color: period === p.k ? C.blueLt : C.text2,
                  border: `1px solid ${period === p.k ? 'rgba(45,111,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  cursor: 'pointer',
                }}
              >
                {t('app.trades.' + p.lk)}
              </button>
            ))}
          </div>

          <div style={{ flex: '1 1 200px', minWidth: 160 }}>
            <input
              type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder={t('app.trades.searchPlaceholder')}
              style={inputS}
            />
          </div>

          <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...inputS, width: 'auto', minWidth: 180 }}>
            {SORT_OPTIONS.map(s => <option key={s.k} value={s.k}>{t('app.trades.' + s.lk)}</option>)}
          </select>

          <button onClick={() => setShowFilters(s => !s)} style={btnGhost}>
            {showFilters ? '▲' : '▼'} {t('app.trades.advancedFilters')}
          </button>

          {/* View mode picker (cards / compact / table) — persists in localStorage */}
          <div role="group" aria-label="Vue" style={{
            display: 'flex',
            gap: 0,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: 2,
            marginLeft: 'auto',
          }}>
            {[
              { v: 'cards',   label: 'Cartes',  icon: '▦' },
              { v: 'compact', label: 'Compact', icon: '☰' },
              { v: 'table',   label: 'Tableau', icon: '▤' },
            ].map(opt => (
              <button
                key={opt.v}
                onClick={() => changeViewMode(opt.v)}
                title={`Vue ${opt.label}`}
                aria-pressed={viewMode === opt.v}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  background: viewMode === opt.v ? 'rgba(45,111,255,0.18)' : 'transparent',
                  color: viewMode === opt.v ? C.blueLt : C.text2,
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{opt.icon}</span><span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ligne 2 : filtres avancés (collapse) */}
        {showFilters && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: 5 }}>{t('app.trades.filterFirm')}</label>
              <select value={firmFilter} onChange={e => setFirmFilter(e.target.value)} style={inputS}>
                <option value="all">{t('app.trades.optAllFem')}</option>
                {firms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: 5 }}>{t('app.trades.filterAccount')}</label>
              <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} style={{ ...inputS, opacity: firmFilter === 'all' ? 0.5 : 1 }} disabled={firmFilter === 'all'}>
                <option value="all">{t('app.trades.optAll')}</option>
                {accountsForFirm.map(a => <option key={a.id} value={a.id}>{accountLabel(a)} · {a.status}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: 5 }}>{t('app.trades.filterInstrument')}</label>
              <select value={instrumentFilter} onChange={e => setInstrumentFilter(e.target.value)} style={inputS}>
                <option value="all">{t('app.trades.optAll')}</option>
                {availableInstruments.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: 5 }}>{t('app.trades.filterSide')}</label>
              <select value={sideFilter} onChange={e => setSideFilter(e.target.value)} style={inputS}>
                <option value="all">{t('app.trades.optAll')}</option>
                <option value="Long">{t('app.trades.longOnly')}</option>
                <option value="Short">{t('app.trades.shortOnly')}</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: 5 }}>{t('app.trades.filterResult')}</label>
              <select value={resultFilter} onChange={e => setResultFilter(e.target.value)} style={inputS}>
                <option value="all">{t('app.trades.optAll')}</option>
                <option value="win">{t('app.trades.winnersOnly')}</option>
                <option value="loss">{t('app.trades.losersOnly')}</option>
                <option value="be">{t('app.trades.breakeven')}</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: 5 }}>{t('app.trades.filterTags')}</label>
              <TagSelector value={tagFilter} onChange={setTagFilter} compact />
            </div>
          </div>
        )}

        {/* Compteur + reset */}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: C.text3 }}>
          <span>
            <strong style={{ color: C.text2 }}>{filteredEntries.length}</strong> trade{filteredEntries.length > 1 ? 's' : ''} {filteredEntries.length > 1 ? t('app.trades.displayedPlural') : t('app.trades.displayed')}
            {decoratedEntries.length > filteredEntries.length && ` ${t('app.trades.ofTotal')} ${decoratedEntries.length}`}
          </span>
          {hasActiveFilters && (
            <button onClick={resetAllFilters} style={{ ...btnGhost, padding: '4px 10px', fontSize: 10 }}>
              {t('app.trades.resetFilters')}
            </button>
          )}
        </div>
      </div>

      {/* === Liste des cards === */}
      {loading ? (
        <div>
          {/* Stats skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton.Card key={i} height={70} />)}
          </div>
          {/* Filter bar skeleton */}
          <div style={{ ...card, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} width={70} height={28} style={{ borderRadius: 99 }} />)}
              <div style={{ flex: 1 }}><Skeleton width="100%" height={32} /></div>
            </div>
          </div>
          {/* Trade cards skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ ...card, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Skeleton width={120} height={14} />
                  <Skeleton width={60} height={20} />
                </div>
                <Skeleton.Text lines={3} />
              </div>
            ))}
          </div>
        </div>
      ) : loadError ? (
        <div style={{ ...card, padding: 40, textAlign: 'center', color: C.red }}>{loadError}</div>
      ) : filteredEntries.length === 0 ? (
        <div style={{ ...card, padding: 60, textAlign: 'center', color: C.text3 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 13, color: C.text2, marginBottom: 16 }}>
            {hasActiveFilters ? t('app.trades.emptyFiltered') : t('app.trades.emptyAll')}
          </div>
          {!hasActiveFilters && (
            <button onClick={() => setEditing({})} style={btnPrimary}>
              {t('app.trades.addFirst')}
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <TradeTableView
          entries={filteredEntries}
          onEdit={(e) => setEditing({ entry: e })}
          C={C}
          card={card}
        />
      ) : viewMode === 'compact' ? (
        <TradeCompactView
          entries={filteredEntries}
          onEdit={(e) => setEditing({ entry: e })}
          C={C}
          card={card}
        />
      ) : (
        <div className="trades-grid qt-stagger" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: 12,
        }}>
          {filteredEntries.map(e => (
            <TradeCard
              key={e.id}
              entry={e}
              accountLabel={e._accountLabel}
              firmColor={e._firmColor}
              onEdit={() => setEditing({ entry: e })}
              onLightbox={url => setLightboxUrl(url)}
            />
          ))}
        </div>
      )}

      {/* === Lightbox screenshot plein écran === */}
      {lightboxUrl && (
        <div
          className="qt-modal-backdrop"
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'relative', width: '95%', height: '95%' }}>
            <Image src={lightboxUrl} alt="Screenshot" fill sizes="95vw" style={{ objectFit: 'contain', borderRadius: 8 }} />
          </div>
          <button onClick={() => setLightboxUrl(null)} style={{
            position: 'absolute', top: 20, right: 20,
            background: 'rgba(255,255,255,0.1)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600,
          }}>{t('app.trades.close')}</button>
        </div>
      )}

      {/* === Modal trade (créer / éditer) === */}
      <TradeEntryModal
        open={!!editing}
        entry={editing?.entry}
        defaultDate={editing?.defaultDate}
        defaultAccountId={editing?.defaultAccountId}
        firms={firms}
        user={user}
        onClose={() => setEditing(null)}
        onSaved={async () => { await loadEntries(); if (onReload) await onReload() }}
        onLightbox={url => setLightboxUrl(url)}
        showToast={showToast}
      />

      {/* Responsive stats grid */}
      <style>{`
        @media (max-width: 720px) {
          .trades-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 500px) {
          .trades-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...card, padding: '12px 14px' }}>
      <div style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: color || C.text, letterSpacing: '-0.015em', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
        {value}
      </div>
    </div>
  )
}

// Helper: format ISO date "2026-06-04" → "04 juin" (short, scannable).
// Uses browser locale, falls back to raw string if Intl fails.
function fmtShortDate(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
  } catch { return iso }
}

// Helper: render up to 2 tag pills inline + a "+N" overflow indicator.
// Uses getTagMeta() to color-match the trade-tag taxonomy when known,
// falls back to neutral grey pill for free-form tags.
function TagPills({ tags, max = 2 }) {
  if (!Array.isArray(tags) || tags.length === 0) return null
  const visible = tags.slice(0, max)
  const overflow = tags.length - visible.length
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', flexWrap: 'nowrap' }}>
      {visible.map((tag, i) => {
        const meta = getTagMeta(tag)
        const color = meta?.color || C.text2
        const bg = meta?.bg || 'rgba(144,152,176,0.14)'
        const label = meta?.label || tag
        return (
          <span key={i} style={{
            padding: '2px 7px', borderRadius: 5,
            background: bg, color,
            fontSize: 10, fontWeight: 600,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
          }}>{label}</span>
        )
      })}
      {overflow > 0 && (
        <span style={{
          padding: '2px 6px', borderRadius: 5,
          background: 'rgba(255,255,255,0.04)', color: C.text3,
          fontSize: 10, fontWeight: 600,
        }}>+{overflow}</span>
      )}
    </span>
  )
}

// Helper: side badge (LONG/SHORT) as a Notion-style pill.
function SideBadge({ side }) {
  if (!side) return <span style={{ color: C.text3, fontSize: 11 }}>—</span>
  const isLong = side === 'long'
  const color = isLong ? C.green : C.red
  const bg = isLong ? 'rgba(29,184,122,0.15)' : 'rgba(232,80,74,0.15)'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 5,
      background: bg, color,
      fontSize: 10, fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }}>
      <span style={{ fontSize: 9 }}>{isLong ? '↗' : '↘'}</span>
      {side}
    </span>
  )
}

// ── OPTION A : List view (Notion-style aérée) ──────────────────────────────
// Two-line rows, ~62px high. Left border in side color. Symbol prominent.
// Tags as colored pills. PnL big on the right. Click row to edit.
function TradeCompactView({ entries, onEdit, C, card }) {
  return (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      {entries.map((e, idx) => {
        const pnl = Number(e.pnl) || 0
        const pnlColor = pnl > 0 ? C.green : pnl < 0 ? C.red : C.text2
        const sideAccent = e.side === 'long' ? C.green : e.side === 'short' ? C.red : C.text3
        const rMult = e.r_multiple != null ? Number(e.r_multiple) : null
        return (
          <div
            key={e.id}
            onClick={() => onEdit(e)}
            role="button"
            tabIndex={0}
            onKeyDown={ev => { if (ev.key === 'Enter') onEdit(e) }}
            className="qt-list-row"
            style={{
              display: 'grid',
              gridTemplateColumns: '4px 1fr auto',
              gap: 0,
              alignItems: 'stretch',
              borderBottom: idx < entries.length - 1 ? `1px solid ${C.border}` : 'none',
              cursor: 'pointer',
              transition: 'background 0.15s, padding-left 0.15s',
              position: 'relative',
            }}
          >
            {/* Side accent bar — full height, color = trade side */}
            <div style={{ background: sideAccent, opacity: 0.55 }} />

            {/* Body — 2 lines */}
            <div style={{ padding: '14px 18px', minWidth: 0 }}>
              {/* Line 1 — symbol + account + tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, minWidth: 0 }}>
                {/* Symbol monospace, prominent */}
                <span style={{
                  color: C.text,
                  fontFamily: 'ui-monospace, SF Mono, monospace',
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  minWidth: 64,
                }}>
                  {e.instrument || '—'}
                </span>
                {/* Firm dot + account label */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  color: C.text2, fontSize: 13,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  minWidth: 0,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: e._firmColor || C.blueLt, flexShrink: 0,
                  }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e._accountLabel || '—'}
                  </span>
                </span>
                {/* Tag pills — push right with margin-left auto */}
                <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <TagPills tags={e.tags} max={2} />
                </span>
              </div>

              {/* Line 2 — date + side badge + qty */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, color: C.text3 }}>
                <span style={{ fontFamily: 'ui-monospace, monospace' }}>{fmtShortDate(e.date)}</span>
                <span style={{ color: C.border, fontSize: 10 }}>·</span>
                <SideBadge side={e.side} />
                {e.quantity != null && (
                  <>
                    <span style={{ color: C.border, fontSize: 10 }}>·</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                      {e.quantity}<span style={{ color: C.text3, marginLeft: 2 }}>ct</span>
                    </span>
                  </>
                )}
                {e.entry_price != null && e.exit_price != null && (
                  <>
                    <span style={{ color: C.border, fontSize: 10 }}>·</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', color: C.text3 }}>
                      {Number(e.entry_price)} → {Number(e.exit_price)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* PnL block — big number + R multiple */}
            <div style={{
              padding: '14px 22px 14px 18px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'flex-end', justifyContent: 'center',
              minWidth: 110,
              borderLeft: `1px solid ${C.border}`,
            }}>
              <span style={{
                color: pnlColor,
                fontWeight: 700,
                fontSize: 16,
                fontFamily: 'ui-monospace, SF Mono, monospace',
                letterSpacing: '-0.01em',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {fmtMoney(pnl)}
              </span>
              {rMult != null && (
                <span style={{
                  color: rMult >= 0 ? C.green : C.red,
                  opacity: 0.75,
                  fontSize: 10.5, fontWeight: 600,
                  fontFamily: 'ui-monospace, monospace',
                  marginTop: 2,
                  letterSpacing: '0.02em',
                }}>
                  {rMult >= 0 ? '+' : ''}{rMult.toFixed(2)}R
                </span>
              )}
            </div>
          </div>
        )
      })}
      <style>{`
        .qt-list-row:hover {
          background: rgba(255,255,255,0.025);
        }
        .qt-list-row:hover > div:first-child {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}

// ── OPTION B : Table Pro (Notion-style) ────────────────────────────────────
// Column-type icons in headers, side/tag pills, mini PnL bar inline,
// hover row reveals 2px blue left border (Notion signature).
// Click row to edit.
function TradeTableView({ entries, onEdit, C, card }) {
  // Max abs PnL across visible entries — used to scale the inline PnL bar.
  // Min 1 to avoid div-by-zero and keep tiny bars from looking weird.
  const maxAbsPnl = useMemo(() => {
    let m = 1
    for (const e of entries) {
      const a = Math.abs(Number(e.pnl) || 0)
      if (a > m) m = a
    }
    return m
  }, [entries])

  const th = {
    textAlign: 'left',
    padding: '12px 14px',
    fontSize: 10,
    color: C.text3,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
    background: 'rgba(13,15,20,0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: `1px solid ${C.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 1,
    whiteSpace: 'nowrap',
    userSelect: 'none',
  }
  const td = {
    padding: '12px 14px',
    fontSize: 12.5,
    color: C.text,
    borderBottom: `1px solid ${C.border}`,
    verticalAlign: 'middle',
    fontVariantNumeric: 'tabular-nums',
  }
  // Column-type icon helper — Notion uses small glyphs to hint at the
  // type of each column. Keeps the header scannable.
  const Hdr = ({ icon, children, right }) => (
    <th style={{ ...th, textAlign: right ? 'right' : 'left' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, opacity: 0.85 }}>
        <span style={{ fontSize: 11, opacity: 0.7 }}>{icon}</span>
        {children}
      </span>
    </th>
  )

  return (
    <div style={{ ...card, padding: 0, overflow: 'auto', maxHeight: '72vh' }}>
      <table className="qt-table-pro" style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        fontFamily: 'inherit',
      }}>
        <thead>
          <tr>
            <Hdr icon="📅">Date</Hdr>
            <Hdr icon="●">Compte</Hdr>
            <Hdr icon="#">Symbole</Hdr>
            <Hdr icon="▾">Side</Hdr>
            <Hdr icon="#" right>Qty</Hdr>
            <Hdr icon="→">Entrée → Sortie</Hdr>
            <Hdr icon="◈" right>R</Hdr>
            <Hdr icon="$" right>PnL</Hdr>
            <Hdr icon="⊕">Tags</Hdr>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => {
            const pnl = Number(e.pnl) || 0
            const pnlColor = pnl > 0 ? C.green : pnl < 0 ? C.red : C.text2
            const barWidth = Math.min(100, (Math.abs(pnl) / maxAbsPnl) * 100)
            const rMult = e.r_multiple != null ? Number(e.r_multiple) : null
            return (
              <tr
                key={e.id}
                onClick={() => onEdit(e)}
                className="qt-table-row"
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <td style={{ ...td, color: C.text2, fontFamily: 'ui-monospace, monospace', fontSize: 11.5, whiteSpace: 'nowrap', position: 'relative' }}>
                  {/* Hover left-accent bar — Notion signature */}
                  <span className="qt-row-accent" style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: 2, background: C.blueLt,
                    transform: 'scaleY(0)', transformOrigin: 'center',
                    transition: 'transform 0.18s ease-out',
                  }} />
                  {fmtShortDate(e.date)}
                </td>
                <td style={td}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: e._firmColor || C.blueLt }} />
                    <span style={{ color: C.text2 }}>{e._accountLabel || '—'}</span>
                  </span>
                </td>
                <td style={{ ...td, color: C.text, fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>
                  {e.instrument || ''}
                </td>
                <td style={td}>
                  <SideBadge side={e.side} />
                </td>
                <td style={{ ...td, textAlign: 'right', fontFamily: 'ui-monospace, monospace', color: C.text2 }}>
                  {e.quantity != null ? e.quantity : ''}
                </td>
                <td style={{ ...td, color: C.text3, fontFamily: 'ui-monospace, monospace', fontSize: 11.5, whiteSpace: 'nowrap' }}>
                  {e.entry_price != null && e.exit_price != null
                    ? <span><span style={{ color: C.text2 }}>{Number(e.entry_price)}</span> <span style={{ color: C.text3 }}>→</span> <span style={{ color: C.text2 }}>{Number(e.exit_price)}</span></span>
                    : <span style={{ color: C.text3 }}>—</span>}
                </td>
                <td style={{ ...td, textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: 11.5 }}>
                  {rMult != null ? (
                    <span style={{
                      color: rMult >= 0 ? C.green : C.red,
                      fontWeight: 600,
                    }}>{rMult >= 0 ? '+' : ''}{rMult.toFixed(2)}R</span>
                  ) : <span style={{ color: C.text3 }}>—</span>}
                </td>
                <td style={{ ...td, textAlign: 'right', minWidth: 140 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    {/* Inline mini bar — width proportional to |pnl|/maxAbsPnl */}
                    <div style={{
                      width: 56, height: 6, background: 'rgba(255,255,255,0.04)',
                      borderRadius: 3, overflow: 'hidden', position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: pnl >= 0 ? '50%' : `${50 - barWidth / 2}%`,
                        top: 0, bottom: 0,
                        width: `${barWidth / 2}%`,
                        background: pnlColor,
                        opacity: 0.85,
                        borderRadius: 2,
                      }} />
                      {/* Center divider — separates wins from losses on the same axis */}
                      <div style={{
                        position: 'absolute', left: '50%', top: 0, bottom: 0,
                        width: 1, background: 'rgba(255,255,255,0.08)',
                      }} />
                    </div>
                    <span style={{
                      color: pnlColor, fontWeight: 700,
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 13, minWidth: 60, textAlign: 'right',
                    }}>{fmtMoney(pnl)}</span>
                  </div>
                </td>
                <td style={{ ...td, paddingRight: 18 }}>
                  <TagPills tags={e.tags} max={3} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <style>{`
        .qt-table-pro tbody tr:hover { background: rgba(255,255,255,0.025); }
        .qt-table-pro tbody tr:hover .qt-row-accent { transform: scaleY(1) !important; }
      `}</style>
    </div>
  )
}
