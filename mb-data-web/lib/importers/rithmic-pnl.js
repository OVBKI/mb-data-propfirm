// Parser pour les exports Rithmic R|Trader Pro "Performance" (PnL Statement).
//
// Le CSV a une structure hiérarchique imbriquée :
//   [HEADER summary : Account, Trade P&L, Commission & Fees, ...]
//   [Account 1 - ligne summary : ID + totaux]
//   [Account 1 - ligne breakdown instrument : ex MNQM6 + totaux]
//   [HEADER trade-level : Trade Date, Entry Order Number, ...]
//   [Account 1 - N lignes de fills (une par exécution partielle)]
//   [Account 2 - summary]
//   [Account 2 - breakdown instrument]
//   [HEADER trade-level]
//   [Account 2 - N fills]
//   ... etc
//
// Le parser :
//   1. Détecte les changements de schéma (header summary vs header trade-level)
//   2. Identifie chaque compte par son ID (LFE*** / LFF*** pour Lucid)
//   3. Groupe les fills par paire (Entry Order, Exit Order) → 1 "trade logique"
//      (l'utilisateur a choisi cette stratégie de grouping)
//   4. Calcule pour chaque trade : qty totale, P&L net, prix moyens pondérés par qty
//
// Retourne une structure normalisée pour la page /app/import-lab.

// ============================================================================
// Patterns de détection
// ============================================================================

// Détection account ID & firme : module partagé multi-propfirms (mai 2026).
// Supporte Lucid, Apex (PA-/APEX-), TPT, Topstep (PRO/TSP/EFA/COMBINE), Bulenox,
// Tradeify, MFFU, FFN, FuturesElites, Phidias + fallback générique.
import { isAccountId as isFirmAccountId, detectFirm } from './firmDetection'

// Header de la table summary (commence par "Account")
const SUMMARY_HEADER_FIRST_CELL = 'Account'

// Header de la table trade-level (commence par "Trade Date")
const TRADE_HEADER_FIRST_CELL = 'Trade Date'

// ============================================================================
// Helpers
// ============================================================================

// Parse une ligne CSV en respectant les guillemets et virgules échappées
function parseCSVLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      // Double quote escapée : "" → "
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === ',' && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += c
    }
  }
  cells.push(current)
  return cells.map(c => c.trim())
}

// Parse "20260515" (YYYYMMDD) → "2026-05-15"
function parseRithmicDate(s) {
  if (!s || s.length !== 8 || !/^\d{8}$/.test(s)) return null
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

// Construit un timestamp ISO depuis le entryTime Rithmic pour la colonne traded_at.
//
// Rithmic R|Trader Pro exporte `entryTime` au format "YYYY-MM-DD HH:MM:SS" (timestamp
// complet). Certains exports legacy donnent juste l'heure ("HH:MM:SS" ou "HHMMSS").
// On gère les 3 cas + fallback midi si parsing impossible.
function combineDateAndTime(date, time) {
  if (!date) return null
  if (!time || typeof time !== 'string') return `${date}T12:00:00`
  const trimmed = time.trim()

  // Cas 1 : timestamp complet "YYYY-MM-DD HH:MM:SS" ou "YYYY-MM-DDTHH:MM:SS"
  const fullMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[\sT](\d{2}:\d{2}:\d{2})/)
  if (fullMatch) {
    return `${fullMatch[1]}T${fullMatch[2]}`
  }

  // Cas 2 : juste l'heure avec colons "HH:MM:SS" ou "HH:MM"
  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (colonMatch) {
    const hh = String(colonMatch[1]).padStart(2, '0')
    const mm = colonMatch[2]
    const ss = colonMatch[3] || '00'
    return `${date}T${hh}:${mm}:${ss}`
  }

  // Cas 3 : HHMMSS sans séparateur (legacy)
  const digits = trimmed.replace(/[^\d]/g, '')
  if (digits.length >= 4) {
    const padded = digits.padEnd(6, '0').slice(0, 6)
    const hh = padded.slice(0, 2)
    const mm = padded.slice(2, 4)
    const ss = padded.slice(4, 6)
    const hhNum = parseInt(hh, 10)
    if (!isNaN(hhNum) && hhNum <= 23) {
      return `${date}T${hh}:${mm}:${ss}`
    }
  }

  // Fallback : midi (heure neutre)
  return `${date}T12:00:00`
}

// Parse une string-nombre avec guillemets et signes négatifs
// Gère les séparateurs US (1,234.56) ET EU (1.234,56 / 1234,56).
export function parseNum(s) {
  if (s === null || s === undefined) return 0
  let str = String(s).replace(/["\s$€£]/g, '').trim()
  if (!str) return 0
  const hasDot = str.includes('.')
  const hasComma = str.includes(',')
  if (hasDot && hasComma) {
    str = (str.lastIndexOf(',') > str.lastIndexOf('.'))
      ? str.replace(/\./g, '').replace(',', '.')
      : str.replace(/,/g, '')
  } else if (hasComma) {
    const parts = str.split(',')
    str = (parts.length === 2 && parts[1].length !== 3)
      ? parts[0] + '.' + parts[1]
      : str.replace(/,/g, '')
  }
  const n = parseFloat(str)
  return isFinite(n) ? n : 0
}

// Détecte le type de compte à partir de l'ID Rithmic
function detectAccountType(rithmicId) {
  if (rithmicId.includes('-TEST')) return 'EVAL'
  if (rithmicId.includes('-PRO')) return 'FUNDED'
  if (rithmicId.startsWith('LFE')) return 'EVAL'
  if (rithmicId.startsWith('LFF')) return 'FUNDED'
  return 'UNKNOWN'
}

function isAccountRow(cells) {
  return cells[0] && isFirmAccountId(cells[0])
}

function isInstrumentBreakdownRow(cells, mode, hasCurrentAccount) {
  // Seulement après une ligne account summary, dans le mode 'summary'
  // Première cellule = ticker court (3-7 chars, pas de tiret, pas de pattern Account)
  return (
    mode === 'summary' &&
    hasCurrentAccount &&
    cells[0] &&
    cells[0].length <= 7 &&
    /^[A-Z][A-Z0-9]{1,6}$/.test(cells[0]) &&
    !isFirmAccountId(cells[0])
  )
}

function isSummaryHeader(cells) {
  return cells[0] === SUMMARY_HEADER_FIRST_CELL
}

function isTradeHeader(cells) {
  return cells[0] === TRADE_HEADER_FIRST_CELL
}

// Arrondit à n décimales
function round(n, dec) {
  const k = Math.pow(10, dec)
  return Math.round(n * k) / k
}

// ============================================================================
// Parser principal
// ============================================================================

export function parseRithmicPnL(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    throw new Error('CSV vide ou invalide')
  }

  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0)

  if (lines.length === 0) {
    throw new Error('CSV ne contient aucune ligne')
  }

  const accounts = []
  const warnings = []
  let currentAccount = null
  let currentInstrument = null
  let currentFills = []
  let mode = 'summary' // 'summary' | 'trade'

  // Flush l'account en cours (groupe ses fills en trades)
  function flushAccount() {
    if (!currentAccount) return
    currentAccount.trades = groupFillsIntoTrades(currentFills)
    accounts.push(currentAccount)
    currentAccount = null
    currentInstrument = null
    currentFills = []
  }

  for (let i = 0; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i])

    // Skip lignes vides ou contenant que des virgules
    if (cells.every(c => !c)) continue

    // === HEADER SUMMARY → on entre en mode 'summary' ===
    if (isSummaryHeader(cells)) {
      mode = 'summary'
      continue
    }

    // === HEADER TRADE-LEVEL → on entre en mode 'trade' ===
    if (isTradeHeader(cells)) {
      mode = 'trade'
      continue
    }

    // === LIGNE ACCOUNT SUMMARY → nouveau compte ===
    if (isAccountRow(cells)) {
      flushAccount() // sauvegarde le précédent
      currentAccount = {
        rithmicId: cells[0],
        type: detectAccountType(cells[0]),
        firm: detectFirm(cells[0]),
        summary: {
          tradePnL: parseNum(cells[1]),
          commissions: parseNum(cells[2]),
          netPnL: parseNum(cells[3]),
          fillCount: parseNum(cells[4]),
          winningTrades: parseNum(cells[5]),
          losingTrades: parseNum(cells[6]),
          winRate: parseNum(cells[7]),
          loseRate: parseNum(cells[8]),
          scratchedTrades: parseNum(cells[9]),
        },
        instruments: [],
        trades: [],
      }
      mode = 'summary'
      continue
    }

    // === LIGNE INSTRUMENT BREAKDOWN (après account summary) ===
    if (isInstrumentBreakdownRow(cells, mode, !!currentAccount)) {
      if (!currentAccount.instruments.includes(cells[0])) {
        currentAccount.instruments.push(cells[0])
      }
      currentInstrument = cells[0]
      continue
    }

    // === LIGNE TRADE FILL (mode 'trade') ===
    if (mode === 'trade' && currentAccount && cells.length >= 14) {
      const date = parseRithmicDate(cells[0])
      if (!date) {
        warnings.push(`Ligne ${i + 1} : date invalide "${cells[0]}", ignorée`)
        continue
      }
      const fill = {
        date,
        entryOrderId: cells[1],
        entrySide: cells[2], // 'B' (buy) ou 'S' (sell)
        entryTime: cells[3],
        entryPrice: parseNum(cells[4]),
        exitOrderId: cells[5],
        exitSide: cells[6],
        exitTime: cells[7],
        exitPrice: parseNum(cells[8]),
        holdSeconds: parseNum(cells[9]),
        fillSize: parseNum(cells[10]),
        tradePnL: parseNum(cells[11]),
        commissions: parseNum(cells[12]),
        netPnL: parseNum(cells[13]),
        instrument: currentInstrument || 'UNKNOWN',
      }
      currentFills.push(fill)
      continue
    }

    // Ligne non reconnue → warning silencieux
    // (on n'avertit pas pour les lignes vides/débris en fin de fichier)
  }

  // Flush le dernier compte
  flushAccount()

  if (accounts.length === 0) {
    throw new Error('Aucun compte détecté dans le CSV. Vérifie que le format est bien un export Rithmic R|Trader Pro "Performance".')
  }

  return {
    source: 'rithmic-pnl',
    parsedAt: new Date().toISOString(),
    accounts,
    warnings,
    totals: {
      accountCount: accounts.length,
      tradeCount: accounts.reduce((s, a) => s + a.trades.length, 0),
      fillCount: accounts.reduce((s, a) => s + a.summary.fillCount, 0),
      netPnL: round(accounts.reduce((s, a) => s + a.summary.netPnL, 0), 2),
    },
  }
}

// ============================================================================
// Grouping : fills → trades
// Stratégie choisie : par paire (entryOrderId, exitOrderId)
// Tous les fills partageant le même Entry Order + même Exit Order = 1 trade
// ============================================================================

function groupFillsIntoTrades(fills) {
  if (fills.length === 0) return []

  const groups = new Map()
  for (const f of fills) {
    const key = `${f.entryOrderId}__${f.exitOrderId}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(f)
  }

  const trades = []
  for (const [key, group] of groups) {
    const first = group[0]
    let totalQty = 0
    let totalGross = 0
    let totalCommissions = 0
    let totalNet = 0
    let weightedEntryPx = 0
    let weightedExitPx = 0

    for (const f of group) {
      totalQty += f.fillSize
      totalGross += f.tradePnL
      totalCommissions += f.commissions
      totalNet += f.netPnL
      weightedEntryPx += f.entryPrice * f.fillSize
      weightedExitPx += f.exitPrice * f.fillSize
    }

    const avgEntry = totalQty > 0 ? weightedEntryPx / totalQty : first.entryPrice
    const avgExit = totalQty > 0 ? weightedExitPx / totalQty : first.exitPrice

    trades.push({
      date: first.date,
      instrument: first.instrument,
      side: first.entrySide === 'B' ? 'LONG' : 'SHORT',
      entryTime: first.entryTime,
      entryPrice: round(avgEntry, 4),
      exitTime: first.exitTime,
      exitPrice: round(avgExit, 4),
      qty: totalQty,
      grossPnL: round(totalGross, 2),
      commissions: round(totalCommissions, 2),
      netPnL: round(totalNet, 2),
      fillCount: group.length,
      entryOrderId: first.entryOrderId,
      exitOrderId: first.exitOrderId,
      holdSeconds: round(first.holdSeconds, 1),
      // ISO timestamp pour la colonne traded_at (heatmaps par heure/session)
      tradedAt: combineDateAndTime(first.date, first.entryTime),
    })
  }

  // Tri par date + heure d'entrée
  trades.sort((a, b) => {
    if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '')
    return (a.entryTime || '').localeCompare(b.entryTime || '')
  })

  return trades
}
