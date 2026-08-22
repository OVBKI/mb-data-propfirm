// lib/futuresContracts.js — combien vaut un point, par contrat.
//
// Un broker donne des PRIX, pas des euros. Sans multiplicateur, un trade ES
// gagnant de 4 points vaut « 4 » au lieu de 200 $. C'est la conversion la plus
// silencieusement fausse qui soit : le chiffre paraît plausible, il est
// simplement d'un ordre de grandeur à côté.
//
// ⚠️ RÈGLE : un symbole inconnu rend `null`, JAMAIS une valeur par défaut.
// Deviner un multiplicateur produirait un P&L faux qui a l'air juste. L'appelant
// doit traiter le null — marquer le trade à compléter, pas l'inventer.

// Valeur d'UN point entier, en devise du contrat (USD sauf mention).
// Sources : spécifications CME/CBOT/NYMEX/COMEX.
const POINT_VALUE = {
  // Indices
  ES: 50, MES: 5,
  NQ: 20, MNQ: 2,
  RTY: 50, M2K: 5,
  YM: 5, MYM: 0.5,
  EMD: 100,
  NKD: 5,
  // Énergie
  CL: 1000, MCL: 100,
  NG: 10000, QG: 2500,
  RB: 42000, HO: 42000,
  // Métaux
  GC: 100, MGC: 10,
  SI: 5000, SIL: 1000,
  HG: 25000, MHG: 2500,
  PL: 50, PA: 100,
  // Taux
  ZT: 2000, ZF: 1000, ZN: 1000, TN: 1000, ZB: 1000, UB: 1000,
  // Devises (valeur nominale du contrat)
  '6E': 125000, '6B': 62500, '6A': 100000, '6C': 100000,
  '6S': 125000, '6J': 12500000, '6N': 100000, '6M': 500000,
  M6E: 12500, M6A: 10000, M6B: 6250,
  // Agricoles
  ZC: 50, ZS: 50, ZW: 50, ZL: 600, ZM: 100,
  HE: 400, LE: 400, GF: 500,
  // Crypto
  BTC: 5, MBT: 0.1, ETH: 50, MET: 0.1,
}

// Codes de mois CME. Nécessaires pour retrouver la racine d'un contrat : un nom
// Tradovate est « racine + mois + année », par exemple ESZ5 ou MNQH6.
const MONTH_CODES = 'FGHJKMNQUVXZ'

// Retire le suffixe d'échéance. Le piège : plusieurs racines SE TERMINENT par
// une lettre qui est aussi un code de mois — M2K, MNQ, MGC. On ne retire donc
// que la lettre suivie de chiffres EN FIN de chaîne, jamais une lettre isolée.
export function contractRoot(name) {
  const s = String(name || '').trim().toUpperCase()
  if (!s) return ''
  const m = s.match(new RegExp(`^(.*?)[${MONTH_CODES}]\\d{1,2}$`))
  return m ? m[1] : s
}

// Valeur d'un point pour un nom de contrat complet ou une racine.
// `null` = inconnu, et c'est une information, pas un échec à masquer.
export function pointValue(name) {
  const root = contractRoot(name)
  return Object.prototype.hasOwnProperty.call(POINT_VALUE, root) ? POINT_VALUE[root] : null
}

export function isKnownContract(name) {
  return pointValue(name) !== null
}

// P&L d'un aller-retour, en devise du contrat.
// `null` si le contrat est inconnu — voir la règle en tête de fichier.
export function tradePnL({ contract, side, entry, exit, qty }) {
  const pv = pointValue(contract)
  if (pv === null) return null
  const e = Number(entry), x = Number(exit), q = Number(qty)
  if (!Number.isFinite(e) || !Number.isFinite(x) || !Number.isFinite(q) || q <= 0) return null
  const dir = String(side).toLowerCase().startsWith('s') ? -1 : 1
  return +(((x - e) * dir) * pv * q).toFixed(2)
}

export const KNOWN_ROOTS = Object.keys(POINT_VALUE)
