// lib/importers/firmDetection.js
// Détection automatique de la PropFirm depuis un account ID Rithmic.
//
// Pattern Rithmic typique : préfixe alphabétique (firme-specific) + numéros + chiffres.
// Chaque PropFirm a son préfixe distinct dans Rithmic. On match avec une regex
// par firme, et un fallback générique pour les firmes inconnues.
//
// USAGE :
//   import { detectFirm, isAccountId } from '@/lib/importers/firmDetection'
//   const firmName = detectFirm('PA-389226-04')   // → "Apex Trader Funding"
//   const isAcct   = isAccountId('TPT-12345')      // → true
//
// EXTENSIBILITÉ : pour ajouter une nouvelle PropFirm, ajouter une entrée
// dans FIRM_PATTERNS ci-dessous. Aucune autre modification de code requise.

// ============================================================================
// PATTERNS PAR PROPFIRM
// ============================================================================
// Important : les noms de firme doivent correspondre exactement à ceux utilisés
// dans lib/firmLogos.js (clé FIRM_LOGOS) et dans la DB (firms.name).
//
// L'ordre compte : on teste les patterns les plus spécifiques en premier
// pour éviter qu'un pattern trop large absorbe un cas spécifique.
export const FIRM_PATTERNS = [
  // ── Lucid Trading ──
  // Ex: LFE050-SQA26F07-TEST017, LFF050-579ZNFS2-PRO006
  // L + F|E + F? + 3 chiffres + - + alphanumeric + - + lettres + chiffres
  { firm: 'Lucid Trading', pattern: /^L[FE]F?\d{3}-[A-Z0-9]+-[A-Z]+\d+$/i },

  // ── Apex Trader Funding ──
  // Ex: PA-389226-04, APEX-389226-04
  { firm: 'Apex Trader Funding', pattern: /^(PA|APEX)[-_][A-Z0-9]+(-[A-Z0-9]+)*$/i },

  // ── Take Profit Trader (TPT) ──
  // Challenge/EVAL : TPT-12345, TPT12345
  // Funded         : TPTPRO-12345, TPTPRO12345 (préfixe "PRO" concaténé)
  { firm: 'Take Profit Trader', pattern: /^TPT(PRO)?[-_]?[A-Z0-9-]*$/i },

  // ── Topstep ──
  // Ex: TSP-12345, TS-12345, PRO-12345, PRO007, EFA-50K-12345, COMBINE-50K
  { firm: 'Topstep', pattern: /^(TSP|TS|PRO|EFA|COMBINE|EXPRESS|TOPSTEP)[-_]?[A-Z0-9]+(-[A-Z0-9]+)*$/i },

  // ── Bulenox ──
  // Ex: BX-12345, BULENOX-12345
  { firm: 'Bulenox', pattern: /^(BX|BULENOX)[-_][A-Z0-9-]+$/i },

  // ── Tradeify ──
  // Ex: TF-12345, TRADEIFY-12345
  // Attention : TF doit avoir un séparateur pour ne pas matcher des trucs random
  { firm: 'Tradeify', pattern: /^(TF|TRADEIFY)[-_][A-Z0-9-]+$/i },

  // ── My Funded Futures (MFFU) ──
  // Ex: MFFU-12345, MFF-12345
  { firm: 'My Funded Futures', pattern: /^(MFFU|MFF)[-_]?[A-Z0-9-]+$/i },

  // ── Funded Futures Network (FFN) ──
  // Ex: FFN-12345
  { firm: 'Funded Futures Network', pattern: /^FFN[-_][A-Z0-9-]+$/i },

  // ── FuturesElites ──
  // Ex: FE-12345, FELITES-12345
  { firm: 'FuturesELites', pattern: /^(FE|FELITES)[-_][A-Z0-9-]+$/i },

  // ── Phidias Propfirm ──
  // Challenge/EVAL : PP, PP-12345, PHI-12345, PHIDIAS-12345
  // Funded         : PP CASH-12345, PPCASH-12345, PP_CASH-12345
  // Pattern : "PP" (avec CASH optionnel concaténé) OU "PHI"/"PHIDIAS"
  // suivi d'un séparateur optionnel ([-_ ]) puis du reste de l'ID.
  { firm: 'Phidias Propfirm', pattern: /^(PP(CASH)?|PHI(DIAS)?)([-_ ][A-Z0-9-]+)?$/i },

  // Note : Alpha Futures utilise DXtrade (broker direct), pas Rithmic.
  // Aucune détection auto via CSV Rithmic possible pour Alpha Futures.
  // Saisie manuelle ou (futur) parser DXtrade CSV à implémenter.
]

// Pattern générique de fallback : permet d'identifier qu'une chaîne ressemble
// à un account ID Rithmic même si la firme est inconnue.
// Format : 2-10 lettres + séparateur + au moins 3 chiffres + alphanumeric optionnel.
// Volontairement large pour capter les nouveaux formats sans bloquer l'import.
export const GENERIC_ACCOUNT_PATTERN = /^[A-Z]{2,10}[-_]?\d{3,}[-_]?[A-Z0-9-]*$/i

// ============================================================================
// API publique
// ============================================================================

// Détecte la firme depuis un account ID. Retourne null si aucun pattern ne match.
export function detectFirm(rithmicId) {
  if (!rithmicId || typeof rithmicId !== 'string') return null
  const id = rithmicId.trim()
  for (const { firm, pattern } of FIRM_PATTERNS) {
    if (pattern.test(id)) return firm
  }
  return null
}

// Teste si une chaîne ressemble à un account ID Rithmic (firme connue OU format générique).
// Utilisé par les parsers CSV pour distinguer les lignes "account row" des autres lignes
// (headers, breakdown instruments, totaux, etc.).
export function isAccountId(s) {
  if (!s || typeof s !== 'string') return false
  const id = s.trim()
  if (!id) return false
  // Match si correspond à un pattern firme connu
  for (const { pattern } of FIRM_PATTERNS) {
    if (pattern.test(id)) return true
  }
  // Sinon fallback générique
  return GENERIC_ACCOUNT_PATTERN.test(id)
}

// Liste des noms de firmes supportés (utile pour UI dropdown / mapping manuel).
export const SUPPORTED_FIRMS = FIRM_PATTERNS.map(p => p.firm)
