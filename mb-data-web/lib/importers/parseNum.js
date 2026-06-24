// Shared numeric parser for Rithmic CSV exports (R|Trader Pro).
//
// Rithmic exports use either US (1,234.56) or EU (1.234,56 / 1234,56) decimal
// conventions depending on the user's locale. This normalizes both without
// inflating values — the regression guard against the "1234,56 -> 123456 x100" bug.
//
// Used by both rithmic-pnl.js and rithmic-dashboard.js (previously duplicated).
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
