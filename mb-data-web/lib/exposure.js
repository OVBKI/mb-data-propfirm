// lib/exposure.js — exposition réelle quand un trade est répliqué.
//
// Prendre 2 NQ sur cinq comptes, c'est 10 NQ sur le marché. Le journal ne le
// montrait nulle part : chaque compte semblait raisonnable pris seul.
// L'équivalent micro sert à comparer des minis et des micros entre eux.

// Mini → micro et rapport de taille (combien de micros font un mini).
const MINI_TO_MICRO = {
  ES: ['MES', 10], NQ: ['MNQ', 10], RTY: ['M2K', 10], YM: ['MYM', 10],
  GC: ['MGC', 10], CL: ['MCL', 10], SI: ['SIL', 5], HG: ['MHG', 10],
  '6E': ['M6E', 10], '6B': ['M6B', 10], BTC: ['MBT', 50], ETH: ['MET', 50],
}
const MICRO_TO_MINI = Object.fromEntries(Object.entries(MINI_TO_MICRO).map(([mini, [micro, r]]) => [micro, [mini, r]]))

// Racine d'un symbole : « NQM6 », « MNQZ25 », « NQ 06-26 », « mnq » → NQ / MNQ.
export function instrumentRoot(symbol) {
  const s = String(symbol || '').toUpperCase().replace(/\s+\d{2}-\d{2}$/, '').replace(/\s+/g, '')
  if (!s) return ''
  const m = s.match(/^([A-Z0-9]+?)(?:[FGHJKMNQUVXZ]\d{1,2})?$/)
  return m ? m[1] : s
}

// { root, contracts, micro, microSymbol } — micro = équivalent en micros, ou
// null si l'instrument n'a pas de micro connu.
export function replicationExposure(instrument, quantity, accountCount) {
  const qty = Number(quantity)
  const n = Number(accountCount)
  if (!(qty > 0) || !(n > 0)) return null
  const root = instrumentRoot(instrument)
  const contracts = qty * n
  if (MINI_TO_MICRO[root]) {
    const [microSymbol, ratio] = MINI_TO_MICRO[root]
    return { root, contracts, micro: contracts * ratio, microSymbol }
  }
  if (MICRO_TO_MINI[root]) return { root, contracts, micro: contracts, microSymbol: root }
  return { root, contracts, micro: null, microSymbol: null }
}
