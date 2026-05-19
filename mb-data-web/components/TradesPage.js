'use client'
// TODO i18n v3.1 — Composant non traduit. Strings FR : header (Trade Log,
// Toutes tes opérations…), filtres (Période, Compte, Tags, Search), stats
// rapides, vide état, bouton "Nouveau trade".
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
import { supabase } from '../lib/supabase'
import { accountLabel } from '../lib/constants'
import { computeRStats, computeRMultiple, computeRiskReward } from '../lib/tradeMath'
import { TRADE_TAGS } from '../lib/tradeTags'
import TradeCard from './TradeCard'
import TradeEntryModal from './TradeEntryModal'
import TagSelector from './TagSelector'

const C = {
  surface:  'rgba(20,23,32,0.65)',
  border:   'rgba(255,255,255,0.07)',
  text:     '#f0ede8',
  text2:    '#9098b0',
  text3:    '#5a6275',
  green:    '#1db87a',
  red:      '#e8504a',
  amber:    '#fac775',
  blue:     '#2d6fff',
  blueLt:   '#4d8fff',
}

const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }
const inputS = { width: '100%', padding: '8px 10px', fontSize: 12, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 6, background: 'rgba(255,255,255,0.02)', color: C.text, outline: 'none', fontFamily: 'inherit' }
const btnGhost = { padding: '7px 12px', fontSize: 11, fontWeight: 500, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.10)', color: C.text2, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }
const btnPrimary = { padding: '8px 16px', fontSize: 12, fontWeight: 500, background: C.text, color: '#0a0c10', border: '1px solid transparent', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)' }

function fmtMoney(n, dec = 2) {
  const v = Number(n) || 0
  return (v >= 0 ? '+' : '') + v.toFixed(dec) + ' $'
}
function todayISO() { return new Date().toISOString().slice(0, 10) }
function daysAgoISO(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// Filtres période rapides
const PERIOD_PRESETS = [
  { k: 'all',    l: 'Tout',          days: null },
  { k: 'today',  l: "Aujourd'hui",   days: 0 },
  { k: '7d',     l: '7 jours',       days: 7 },
  { k: '30d',    l: '30 jours',      days: 30 },
  { k: '90d',    l: '3 mois',        days: 90 },
]

// Tri options
const SORT_OPTIONS = [
  { k: 'date_desc', l: 'Date ↓ (plus récent)' },
  { k: 'date_asc',  l: 'Date ↑ (plus ancien)' },
  { k: 'pnl_desc',  l: 'PnL ↓ (plus gros gain)' },
  { k: 'pnl_asc',   l: 'PnL ↑ (plus grosse perte)' },
  { k: 'r_desc',    l: 'R-multiple ↓' },
  { k: 'r_asc',     l: 'R-multiple ↑' },
]

export default function TradesPage({ user, firms, showToast, onReload }) {
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
      setLoadError(error.message || 'Erreur chargement')
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
    showToast?.(`📥 ${filteredEntries.length} trades exportés`)
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
            Trades détaillés
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Trade Log
          </h1>
          <div style={{ fontSize: 12, color: C.text3, marginTop: 6 }}>
            Toutes tes opérations · tri, filtres avancés &amp; analyse R-multiple
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={exportCSV} style={btnGhost} disabled={filteredEntries.length === 0}>
            ↓ CSV
          </button>
          <button onClick={() => setEditing({})} style={btnPrimary}>
            + Nouveau trade
          </button>
        </div>
      </div>

      {/* === Stats résumé (4 KPIs + ligne coûts si applicable) === */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10 }} className="trades-stats">
        <StatCard label="Trades" value={String(stats.total)} />
        <StatCard label="PnL total" value={fmtMoney(stats.totalPnl)} color={stats.totalPnl >= 0 ? C.green : C.red} />
        <StatCard label="Win rate" value={stats.total > 0 ? stats.winRate.toFixed(1) + '%' : '—'} color={stats.winRate >= 50 ? C.green : C.amber} />
        <StatCard label="R moyen" value={stats.avgR != null ? (stats.avgR >= 0 ? '+' : '') + stats.avgR.toFixed(2) + 'R' : '—'} color={stats.avgR != null && stats.avgR >= 0.5 ? C.green : stats.avgR != null && stats.avgR >= 0 ? C.amber : C.red} />
      </div>

      {/* Coûts cumulés — affiché uniquement si > 0 (typiquement pour les imports Rithmic) */}
      {(stats.totalCommissions > 0 || stats.totalSlippage > 0) && (
        <div style={{ ...card, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', fontSize: 11, color: C.text3 }}>
          <span style={{ fontWeight: 700, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 9 }}>
            💸 Coûts cumulés (filtrés)
          </span>
          {stats.totalCommissions > 0 && (
            <span>Commissions : <strong style={{ color: C.red, fontFamily: 'ui-monospace, monospace' }}>−${stats.totalCommissions.toFixed(2)}</strong></span>
          )}
          {stats.totalSlippage > 0 && (
            <span>Slippage : <strong style={{ color: C.red, fontFamily: 'ui-monospace, monospace' }}>−${stats.totalSlippage.toFixed(2)}</strong></span>
          )}
          <span style={{ marginLeft: 'auto' }}>
            Gross : <strong style={{ color: stats.totalPnl + stats.totalCommissions + stats.totalSlippage >= 0 ? C.green : C.red, fontFamily: 'ui-monospace, monospace' }}>
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
                {p.l}
              </button>
            ))}
          </div>

          <div style={{ flex: '1 1 200px', minWidth: 160 }}>
            <input
              type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="🔍 Rechercher (notes, instrument, tag)…"
              style={inputS}
            />
          </div>

          <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...inputS, width: 'auto', minWidth: 180 }}>
            {SORT_OPTIONS.map(s => <option key={s.k} value={s.k}>{s.l}</option>)}
          </select>

          <button onClick={() => setShowFilters(s => !s)} style={btnGhost}>
            {showFilters ? '▲' : '▼'} Filtres avancés
          </button>
        </div>

        {/* Ligne 2 : filtres avancés (collapse) */}
        {showFilters && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: 5 }}>Firme</label>
              <select value={firmFilter} onChange={e => setFirmFilter(e.target.value)} style={inputS}>
                <option value="all">Toutes</option>
                {firms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: 5 }}>Compte</label>
              <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} style={{ ...inputS, opacity: firmFilter === 'all' ? 0.5 : 1 }} disabled={firmFilter === 'all'}>
                <option value="all">Tous</option>
                {accountsForFirm.map(a => <option key={a.id} value={a.id}>{accountLabel(a)} · {a.status}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: 5 }}>Instrument</label>
              <select value={instrumentFilter} onChange={e => setInstrumentFilter(e.target.value)} style={inputS}>
                <option value="all">Tous</option>
                {availableInstruments.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: 5 }}>Side</label>
              <select value={sideFilter} onChange={e => setSideFilter(e.target.value)} style={inputS}>
                <option value="all">Tous</option>
                <option value="Long">Long uniquement</option>
                <option value="Short">Short uniquement</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: 5 }}>Résultat</label>
              <select value={resultFilter} onChange={e => setResultFilter(e.target.value)} style={inputS}>
                <option value="all">Tous</option>
                <option value="win">Gagnants uniquement</option>
                <option value="loss">Perdants uniquement</option>
                <option value="be">Break-even (0)</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: 5 }}>Tags (AND)</label>
              <TagSelector value={tagFilter} onChange={setTagFilter} compact />
            </div>
          </div>
        )}

        {/* Compteur + reset */}
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: C.text3 }}>
          <span>
            <strong style={{ color: C.text2 }}>{filteredEntries.length}</strong> trade{filteredEntries.length > 1 ? 's' : ''} affiché{filteredEntries.length > 1 ? 's' : ''}
            {decoratedEntries.length > filteredEntries.length && ` sur ${decoratedEntries.length}`}
          </span>
          {hasActiveFilters && (
            <button onClick={resetAllFilters} style={{ ...btnGhost, padding: '4px 10px', fontSize: 10 }}>
              ✕ Reset filtres
            </button>
          )}
        </div>
      </div>

      {/* === Liste des cards === */}
      {loading ? (
        <div style={{ ...card, padding: 60, textAlign: 'center', color: C.text3 }}>⏳ Chargement…</div>
      ) : loadError ? (
        <div style={{ ...card, padding: 40, textAlign: 'center', color: C.red }}>{loadError}</div>
      ) : filteredEntries.length === 0 ? (
        <div style={{ ...card, padding: 60, textAlign: 'center', color: C.text3 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 13, color: C.text2, marginBottom: 16 }}>
            {hasActiveFilters ? 'Aucun trade ne correspond aux filtres.' : 'Aucun trade pour le moment.'}
          </div>
          {!hasActiveFilters && (
            <button onClick={() => setEditing({})} style={btnPrimary}>
              + Ajouter ton premier trade
            </button>
          )}
        </div>
      ) : (
        <div className="trades-grid" style={{
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
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out',
          }}
        >
          <img src={lightboxUrl} alt="Screenshot" style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setLightboxUrl(null)} style={{
            position: 'absolute', top: 20, right: 20,
            background: 'rgba(255,255,255,0.1)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600,
          }}>✕ Fermer</button>
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
