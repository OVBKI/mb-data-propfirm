// lib/format.js — Shared formatting utilities
//
// Unifies duplicated formatting functions found across:
//   - app/app/page.js        (toEUR, fmtE, fmtENet)
//   - components/TradesPage.js   (fmtMoney, todayISO, daysAgoISO)
//   - components/JournalPage.js  (fmtMoney, todayISO)
//   - components/HeatmapPage.js  (fmtMoney, fmtMoneyFull)
//   - components/TradeCard.js    (fmtDate)
//   - components/TradeEntryModal.js (todayISO)

/**
 * Format a number as money with sign prefix.
 * "+1,234.56 $" or "-1,234.56 $"
 *
 * Handles null/undefined/NaN gracefully (treats as 0).
 *
 * @param {number} val - The value to format
 * @param {number} [dec=2] - Decimal places
 * @returns {string}
 */
export function fmtMoney(val, dec = 2) {
  const v = Number(val) || 0
  return (v >= 0 ? '+' : '') + v.toFixed(dec) + ' $'
}

/**
 * Format a number as euros (no sign prefix).
 * "1,234.56 €"
 *
 * @param {number} val - The value to format
 * @param {number} [dec=2] - Decimal places
 * @returns {string}
 */
export function fmtE(val, dec = 2) {
  const v = Number(val) || 0
  return v.toFixed(dec) + ' €'
}

/**
 * Format a number as euros with sign prefix.
 * "+1,234.56 €" or "-1,234.56 €"
 *
 * @param {number} val - The value to format
 * @param {number} [dec=2] - Decimal places
 * @returns {string}
 */
export function fmtENet(val, dec = 2) {
  const v = Number(val) || 0
  return (v >= 0 ? '+' : '') + v.toFixed(dec) + ' €'
}

/**
 * Convert an amount to EUR using the provided exchange rates.
 *
 * @param {number} amount - The amount to convert
 * @param {string} currency - Source currency code (e.g. 'USD', 'GBP')
 * @param {Object} rates - Map of currency code → multiplier to EUR (e.g. { USD: 0.9259, EUR: 1 })
 * @returns {number} The amount in EUR
 */
export function toEUR(amount, currency, rates) {
  return amount * (rates[currency] || 1)
}

/**
 * Return today's date as a YYYY-MM-DD string.
 *
 * @returns {string} e.g. "2026-05-24"
 */
export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Return a date N days ago as a YYYY-MM-DD string.
 *
 * @param {number} n - Number of days to subtract
 * @returns {string} e.g. "2026-05-17"
 */
export function daysAgoISO(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/**
 * Format an ISO date string for display in French locale.
 * "2026-05-24" → "24 mai 2026"
 *
 * Appends 'T00:00:00' before parsing to avoid timezone-shift issues
 * where a bare date string can roll back a day in negative UTC offsets.
 *
 * Returns empty string for falsy input.
 *
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted date
 */
export function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
