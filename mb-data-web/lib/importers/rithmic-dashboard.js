import { detectFirm } from './firmDetection'

// Parser pour Rithmic R|Trader Pro "Trader Dashboard" export CSV.
// Format : 1 ligne header + 1 ligne par compte (pas de structure imbriquée).
// Beaucoup plus simple que le PnL Statement.
//
// Détection firme : déléguée au module partagé multi-propfirms.
// Supporte Lucid, Apex (PA-/APEX-), TPT, Topstep, Bulenox, Tradeify, MFFU,
// FFN, FuturesElites, Phidias + fallback générique.
//
// Colonnes extraites :
//   Account                          → ID Rithmic (ex: LFF050-...)
//   Account Name                     → Master/trader ID (ex: LT-63Q7ULJ4)
//   Account Balance                  → Solde actuel
//   Min Account Balance              → Seuil trailing DD ⚠️ CLÉ
//   Cash On Hand                     → Cash disponible (= balance si flat)
//   Cash On Hand (Previous EOD)      → Cash de fin de journée précédente
//   Account Currency                 → USD/EUR/etc.
//   Available Margin                 → Marge dispo
//   Net Position                     → Position ouverte (0 = flat)
//   Auto Liquidate                   → "Enabled" / "Disabled"
//   Total Commission                 → Commissions accumulées
//   Auto Liquidate Trigger Status    → "" ou "account successfully liquidated"
//   Auto Liquidate Trigger Time      → "" ou "YYYY-MM-DD HH:MM:SS"
//
// Calcule :
//   bufferDD  = balance - minBalance  (> 0 = safe, < 0 = en dépassement)
//   status    = LIQUIDATED | AT_RISK | ACTIVE

// ============================================================================
// Helpers (partagés conceptuellement avec rithmic-pnl.js, dupliqués pour
// garder ce module autonome et testable)
// ============================================================================

function parseCSVLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
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

// Gère les séparateurs US (1,234.56) ET EU (1.234,56 / 1234,56).
function parseNum(s) {
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

function round(n, dec) {
  const k = Math.pow(10, dec)
  return Math.round(n * k) / k
}

// Convertit "2026-05-15 15:40:42" → "2026-05-15T15:40:42" (format ISO)
// Rithmic donne du local time sans timezone — on garde tel quel et on
// laisse Postgres l'interpréter avec timezone du serveur (Europe/Brussels).
function parseRithmicDateTime(s) {
  if (!s) return null
  const cleaned = s.trim().replace(/^"|"$/g, '')
  if (!cleaned) return null
  // Format "YYYY-MM-DD HH:MM:SS" → ISO en remplaçant l'espace par T
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(cleaned)) {
    return cleaned.replace(' ', 'T')
  }
  return null
}

// Détecte le type (eval/funded) à partir de l'ID Rithmic.
// Mai 2026 : étendu pour TPT (TPT=EVAL, TPTPRO=FUNDED) et Phidias (PP=EVAL, PP CASH=FUNDED).
function detectAccountType(rithmicId) {
  const id = (rithmicId || '').toUpperCase()

  // ── Patterns FUNDED (à vérifier EN PREMIER car certains sont sous-chaînes des EVAL) ──
  if (id.startsWith('TPTPRO'))                  return 'FUNDED'  // Take Profit Trader Funded
  if (id.startsWith('PPCASH'))                  return 'FUNDED'  // Phidias Funded (concaténé)
  if (id.startsWith('PP CASH') || id.startsWith('PP_CASH')) return 'FUNDED'  // Phidias Funded (séparé)
  if (id.startsWith('LFF'))                     return 'FUNDED'  // Lucid Funded
  if (id.includes('-PRO'))                      return 'FUNDED'  // Pattern générique -PRO

  // ── Patterns EVAL ──
  if (id.startsWith('TPT'))                     return 'EVAL'    // Take Profit Trader Challenge
  if (id.startsWith('PP'))                      return 'EVAL'    // Phidias Challenge
  if (id.startsWith('LFE'))                     return 'EVAL'    // Lucid Eval
  if (id.includes('-TEST'))                     return 'EVAL'    // Pattern générique -TEST

  return 'UNKNOWN'
}

// ============================================================================
// Parser principal
// ============================================================================

export function parseRithmicDashboard(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    throw new Error('CSV vide ou invalide')
  }

  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length < 2) {
    throw new Error('CSV doit contenir au moins un header + 1 ligne de données.')
  }

  // === Parse header ===
  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim())
  const colIdx = (name) => headers.indexOf(name)

  // Vérification des colonnes essentielles
  const required = ['Account', 'Account Balance', 'Min Account Balance']
  const missing = required.filter(r => colIdx(r) === -1)
  if (missing.length > 0) {
    throw new Error(
      `Colonnes manquantes : ${missing.join(', ')}. ` +
      `Vérifie que c'est bien un export "Trader Dashboard" Rithmic R|Trader Pro.`
    )
  }

  // === Parse data rows ===
  const accounts = []
  const warnings = []

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]).map(c => c.replace(/^"|"$/g, ''))
    if (!cells[0] || cells.every(c => !c)) continue

    const rithmicId = cells[colIdx('Account')]
    if (!rithmicId) {
      warnings.push(`Ligne ${i + 1} : Account vide, ignorée`)
      continue
    }

    const balance = parseNum(cells[colIdx('Account Balance')])
    const minBalance = parseNum(cells[colIdx('Min Account Balance')])
    const triggerTimeRaw = colIdx('Auto Liquidate Trigger Time') >= 0
      ? cells[colIdx('Auto Liquidate Trigger Time')]
      : ''
    const triggerStatus = colIdx('Auto Liquidate Trigger Status') >= 0
      ? cells[colIdx('Auto Liquidate Trigger Status')]
      : ''
    const triggerTime = parseRithmicDateTime(triggerTimeRaw)
    const liquidated = !!(triggerTime && triggerStatus)

    // Status calculé
    let status
    if (liquidated) status = 'LIQUIDATED'
    else if (balance <= minBalance) status = 'AT_RISK' // a touché le seuil sans être marqué liquidé
    else status = 'ACTIVE'

    accounts.push({
      rithmicId,
      accountName: colIdx('Account Name') >= 0 ? cells[colIdx('Account Name')] : '',
      type: detectAccountType(rithmicId),
      firm: detectFirm(rithmicId),
      balance: round(balance, 2),
      minBalance: round(minBalance, 2),
      bufferDD: round(balance - minBalance, 2),
      cashOnHand: round(parseNum(cells[colIdx('Cash On Hand')] || ''), 2),
      cashOnHandPrevEOD: round(parseNum(cells[colIdx('Cash On Hand (Previous EOD)')] || ''), 2),
      availableMargin: round(parseNum(cells[colIdx('Available Margin')] || ''), 2),
      netPosition: parseNum(cells[colIdx('Net Position')] || ''),
      currency: cells[colIdx('Account Currency')] || 'USD',
      autoLiquidate: (cells[colIdx('Auto Liquidate')] || '').toLowerCase() === 'enabled',
      totalCommission: round(parseNum(cells[colIdx('Total Commission')] || ''), 2),
      liquidated,
      triggerTime,
      triggerStatus: liquidated ? triggerStatus : null,
      riskAlgorithm: cells[colIdx('Risk Algorithm')] || '',
      status,
    })
  }

  if (accounts.length === 0) {
    throw new Error('Aucun compte détecté dans le CSV.')
  }

  return {
    source: 'rithmic-dashboard',
    parsedAt: new Date().toISOString(),
    accounts,
    warnings,
    totals: {
      accountCount: accounts.length,
      totalBalance: round(accounts.reduce((s, a) => s + a.balance, 0), 2),
      activeCount: accounts.filter(a => a.status === 'ACTIVE').length,
      atRiskCount: accounts.filter(a => a.status === 'AT_RISK').length,
      liquidatedCount: accounts.filter(a => a.liquidated).length,
      totalBufferDD: round(accounts.reduce((s, a) => s + a.bufferDD, 0), 2),
    },
  }
}
