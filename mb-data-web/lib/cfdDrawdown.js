// lib/cfdDrawdown.js — pure CFD drawdown engine (no DB, no React).
//
// CFD propfirms express limits very differently from futures. This computes, for a
// CFD account, how much of the MAX loss and the DAILY loss allowance is consumed,
// the breach floor, and a health status — handling the three max-loss bases
// (static / trailing-relative / eod-trailing) and the daily-loss bases used across
// firms (balance / equity / higher-of / balance+intraday-profit).
//
// All amounts are in the account currency. Percentages are 0–100 numbers.

// ─────────────────────────────────────────────────────────────────────────────
// MAX LOSS
// initialBalance : starting balance of the account ($ size).
// currentEquity  : current equity (balance + floating P&L).
// highWater      : highest balance/equity reached (for trailing). Defaults to initial.
// maxLossPct     : e.g. 10 → 10%.
// basis          : 'static' | 'trailing-relative' | 'eod-trailing'.
//
// floor = the equity level that triggers a breach.
//   static            : initial − lossAmount (fixed).
//   trailing-relative : (highWater − lossAmount), capped so it never exceeds initial
//                       (i.e. it trails up then LOCKS at the initial balance).
//   eod-trailing      : same formula, with highWater = end-of-day high-water (caller's
//                       responsibility to pass the EOD value).
// ─────────────────────────────────────────────────────────────────────────────
export function cfdMaxLoss({ initialBalance, currentEquity, highWater, maxLossPct, basis = 'static' }) {
  const init = Number(initialBalance) || 0
  const eq = Number(currentEquity)
  const pct = Number(maxLossPct) || 0
  const lossAmount = init * (pct / 100)
  if (init <= 0 || !isFinite(eq) || lossAmount <= 0) {
    return { floor: null, lossAmount, buffer: null, usedPct: null, status: 'unknown', breached: false }
  }

  const hw = Math.max(Number(highWater) || init, init)
  let floor
  if (basis === 'trailing-relative' || basis === 'eod-trailing') {
    // trails up with the high-water, but locks once it would rise above the initial balance
    floor = Math.min(hw - lossAmount, init)
  } else {
    floor = init - lossAmount // static
  }

  // Anchor from which the consumable band is measured (floor + lossAmount).
  const anchor = floor + lossAmount
  const used = Math.max(0, anchor - eq)
  const usedPct = clampPct((used / lossAmount) * 100)
  const buffer = eq - floor
  const breached = eq <= floor + 1e-9

  return { floor, lossAmount, buffer, used, usedPct, status: statusFromPct(usedPct, breached), breached }
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY LOSS
// initialBalance      : account starting balance ($ size).
// currentEquity       : current equity.
// dayStartBalance     : balance at the start of the trading day (daily reset).
// dayStartEquity      : equity at the start of the trading day (some firms anchor on equity).
// intradayBookedProfit: closed profit booked so far today (for 'balance+intraday-profit').
// dailyLossPct        : e.g. 5 → 5%.
// basis               : 'balance' | 'equity' | 'higher-of-balance-equity' | 'balance+intraday-profit'.
//
// How the $ limit is SIZED depends on the basis:
//   'balance' / 'balance+intraday-profit' (FTMO, FundedNext…): fixed $ amount = pct of
//     the INITIAL balance. For 'balance+intraday-profit' the allowance additionally
//     EXPANDS by profit booked that day.
//   'equity' / 'higher-of-balance-equity' (FundingPips, The5ers, Blueberry…): pct of the
//     DAY-START snapshot — the same anchor the day's loss is measured from (day-start
//     equity, resp. max(day-start balance, day-start equity)). E.g. a 100K account at a
//     96K day-start with 5% daily → limit $4 800, breach at 91 200.
// The anchor (the reference the day's loss is measured from) always varies by basis.
// ─────────────────────────────────────────────────────────────────────────────
export function cfdDailyLoss({
  initialBalance,
  currentEquity,
  dayStartBalance,
  dayStartEquity,
  intradayBookedProfit = 0,
  dailyLossPct,
  basis = 'balance',
}) {
  const init = Number(initialBalance) || 0
  const eq = Number(currentEquity)
  const pct = Number(dailyLossPct) || 0
  const baseLimit = init * (pct / 100)
  if (init <= 0 || !isFinite(eq) || baseLimit <= 0) {
    return { limit: baseLimit, anchor: null, used: null, usedPct: null, status: 'unknown', breached: false }
  }

  const sb = isFinite(Number(dayStartBalance)) ? Number(dayStartBalance) : init
  const se = isFinite(Number(dayStartEquity)) ? Number(dayStartEquity) : sb

  let anchor
  switch (basis) {
    case 'equity':
      anchor = se
      break
    case 'higher-of-balance-equity':
      anchor = Math.max(sb, se)
      break
    case 'balance+intraday-profit':
    case 'balance':
    default:
      anchor = sb
      break
  }

  // Size the allowance (see doc comment): anchor-sized for the day-start-snapshot bases,
  // initial-sized (optionally expanded by booked intraday profit) for the others.
  let limit
  if (basis === 'equity' || basis === 'higher-of-balance-equity') {
    limit = anchor * (pct / 100)
  } else if (basis === 'balance+intraday-profit') {
    limit = baseLimit + Math.max(0, Number(intradayBookedProfit) || 0)
  } else {
    limit = baseLimit
  }
  if (limit <= 0) {
    return { limit, anchor, used: null, usedPct: null, status: 'unknown', breached: false }
  }

  const used = Math.max(0, anchor - eq)
  const usedPct = clampPct((used / limit) * 100)
  const breached = used >= limit - 1e-9

  return { limit, anchor, used, usedPct, status: statusFromPct(usedPct, breached), breached }
}

// Health status from consumed %.
function statusFromPct(pct, breached) {
  if (breached) return 'breached'
  if (pct == null) return 'unknown'
  if (pct >= 90) return 'danger'
  if (pct >= 60) return 'caution'
  return 'safe'
}

function clampPct(p) {
  if (!isFinite(p)) return null
  return Math.max(0, Math.min(100, p))
}
