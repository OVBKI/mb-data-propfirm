// lib/importers/detect.js — reconnaît le fichier déposé et appelle le bon parseur.
import { isTradovatePerformance, parseTradovatePerformance } from './tradovate'
import { isNinjaTraderTrades, parseNinjaTraderTrades } from './ninjatrader'
import { isTopstepXTrades, parseTopstepXTrades } from './projectx'
import { isMetaTraderReport, parseMetaTraderReport } from './metatrader'

export const PLATFORMS = {
  tradovate: { label: 'Tradovate', file: 'Performance.csv' },
  ninjatrader: { label: 'NinjaTrader 8', file: 'Trade Performance → Trades → Export CSV' },
  topstepx: { label: 'TopstepX', file: 'Trades → Export CSV' },
  mt5: { label: 'MetaTrader 5', file: 'Rapport HTML (historique)' },
  mt4: { label: 'MetaTrader 4', file: 'Rapport HTML (historique du compte)' },
  'topstepx-api': { label: 'TopstepX (API)', file: '' },
}

// Les rapports MetaTrader sont souvent en UTF-16 : on lit les octets et on
// décode selon la marque d'ordre des octets.
export function decodeFileBuffer(buffer) {
  const b = new Uint8Array(buffer)
  if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder('utf-16le').decode(b)
  if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder('utf-16be').decode(b)
  return new TextDecoder('utf-8').decode(b)
}

export function detectPlatform(text) {
  if (isMetaTraderReport(text)) return 'metatrader'
  if (isTopstepXTrades(text)) return 'topstepx'
  if (isTradovatePerformance(text)) return 'tradovate'
  if (isNinjaTraderTrades(text)) return 'ninjatrader'
  return null
}

export function parsePlatformFile(text) {
  const kind = detectPlatform(text)
  if (kind === 'metatrader') return parseMetaTraderReport(text)
  if (kind === 'topstepx') return parseTopstepXTrades(text)
  if (kind === 'tradovate') return parseTradovatePerformance(text)
  if (kind === 'ninjatrader') return parseNinjaTraderTrades(text)
  throw new Error('UNKNOWN_FORMAT')
}

// Marqueur de dédoublonnage écrit dans les notes du trade importé.
export function importMarker(platform, externalId) {
  return `[import:${platform}:${externalId}]`
}
export const IMPORT_MARKER_RE = /\[import:([a-z0-9-]+):([^\]]+)\]/
