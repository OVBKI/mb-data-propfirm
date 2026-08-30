// lib/programSegment.js — lire la valeur d'UN programme dans une cellule de règle.
//
// Une firme vend souvent plusieurs programmes sous la même taille de compte :
// Apex EOD contre Apex Intraday, LucidFlex contre LucidPro, FundedNext Flex
// contre Legacy contre Rapid. Les règles les empilent dans une seule chaîne, et
// ce fichier sait en extraire le segment d'un programme donné.
//
// ⚠️ POURQUOI UN MODULE À PART : constants.js en a besoin (pour rendre les
// montants dépendants du programme choisi) et futuresComparison.js aussi.
// futuresComparison importe constants ; mettre ce code dans l'un ou l'autre
// créerait un cycle d'imports. Ce module ne dépend de RIEN — c'est ce qui le
// rend importable des deux côtés.

export function stripNonDispoNote(val) {
  return val.replace(/\s*\([^)]*non\s+dispo[^)]*\)\s*$/i, '').trim()
}

// Vrai si la valeur (une fois une éventuelle note entre parenthèses retirée)
// est un marqueur d'indisponibilité pour le modèle LUI-MÊME :
// 'non dispo', '— non dispo en 25K', 'n/a', '—', '-'. 'AUCUN(E)' (une vraie
// règle « aucune limite ») n'est PAS un marqueur d'indisponibilité.
export function isUnavailableValue(val) {
  const core = val.replace(/\s*\([^)]*\)\s*$/, '').trim()
  if (core === '' || core === '—' || core === '-') return true
  if (/^n\/a$/i.test(core)) return true
  if (/^[—–-]?\s*non\s+dispo/i.test(core)) return true
  return false
}

// Per-model extractor for firms whose rule values pack several models into one
// composite string. Trois styles coexistent dans constants.js :
//   Alpha         : 'Premium: $3,000 · Zero: $3,000 · Advanced: $4,000'
//   Phidias       : '$3,000 (E2L) · $4,000 (Fundamental/Premium)'
//   FuturesElites : 'Starter ~$3,000 · Pro ~$4,000' (préfixe sans deux-points)
// Given such a string and a model label, returns the segment value for that
// model, or null if the model is not available at that plan size.
// Une note '(… non dispo …)' en fin de valeur est retirée (elle concerne les
// autres modèles) ; 'non dispo' ne rend null QUE si la valeur du modèle
// lui-même est un marqueur d'indisponibilité, ou si la parenthèse cite
// explicitement CE modèle comme non dispo.
export function extractModelSegment(rawValue, modelLabel) {
  if (rawValue === null || rawValue === undefined) return null
  const str = String(rawValue).trim()
  const raw = String(modelLabel)
  const esc = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // ⚠️ `\b` n'est une frontière de mot QU'ENTRE un caractère de mot et un autre.
  // Un libellé qui se termine par un signe — « PRO+ » — n'en a pas après le « + » :
  // /\bPRO\+\b/ ne trouvait donc jamais « PRO+ : 90/10 », et le porteur d'un
  // compte PRO+ se voyait attribuer le split de PRO, 10 points plus bas.
  const head = /^\w/.test(raw) ? '\\b' : ''
  const tail = /\w$/.test(raw) ? '\\b' : '(?![\\w+])'
  const labelRe = new RegExp(head + esc + tail, 'i')
  // Split on the firm's segment separator '·'
  const segments = str.split('·').map(s => s.trim()).filter(Boolean)

  // Vrai si la chaîne est composite (segments ciblant des modèles) : dans ce
  // cas, un modèle sans segment est indisponible à cette taille → null.
  let sawModelTargetedSegment = false

  for (const seg of segments) {
    const colonIdx = seg.indexOf(':')
    if (colonIdx > 0) {
      // Style 'Model: valeur' — le préfixe peut lister plusieurs modèles
      // (ex: 'Select/Growth Eval : $1,500').
      sawModelTargetedSegment = true
      if (labelRe.test(seg.slice(0, colonIdx))) {
        const val = stripNonDispoNote(seg.slice(colonIdx + 1).trim())
        return isUnavailableValue(val) ? null : val
      }
      continue
    }
    // Style 'valeur (ModelA/ModelB)' — note finale entre parenthèses.
    const pm = seg.match(/^(.*?)\s*\(([^)]*)\)$/)
    if (pm && labelRe.test(pm[2])) {
      // La parenthèse cite CE modèle : indisponibilité explicite ou valeur.
      if (/non\s+dispo/i.test(pm[2])) return null
      const val = pm[1].trim()
      return isUnavailableValue(val) ? null : val
    }
    if (pm && /^[A-ZÀ-Ý]/.test(pm[2].trim()) && !/non\s+dispo/i.test(pm[2])) {
      // Parenthèse « garde-modèle » citant d'AUTRES modèles → pas pour nous.
      sawModelTargetedSegment = true
      continue
    }
    // Style 'Model valeur' sans deux-points (ex: 'Starter ~$3,000').
    const lm = seg.match(new RegExp('^' + esc + '\\s+(.+)$', 'i'))
    if (lm) {
      const val = stripNonDispoNote(lm[1].trim())
      return isUnavailableValue(val) ? null : val
    }
  }

  // Aucun segment ne cible ce modèle.
  if (sawModelTargetedSegment) return null // composite : modèle absent ici
  // Chaîne globale (s'applique à tous les modèles) — sauf marqueur d'indispo.
  const val = stripNonDispoNote(str)
  return isUnavailableValue(val) ? null : val
}

// Resolve a cell described by a mapping descriptor.
// Descriptor forms:
//   null                       → cell has no source → null
//   { helper: 'maxDrawdown' }  → call the named constants helper
//   { key: 'Rule Name' }       → raw PROPFIRM_RULES value at [key][plan]
//   { key: 'Rule Name', model: 'Premium' } → composite-string per-model segment

// La cellule cible-t-elle EXPLICITEMENT des programmes ?
//
// Sert à distinguer deux situations que rien ne séparait :
//   « Legacy : $2,750 »            → composite : un programme absent est ABSENT
//   « $2,000 — EOD seulement (…) » → globale   : la valeur vaut pour tous
//
// Sans ce test, la seconde était prise pour la première à cause de la
// parenthèse, et Topstep rendait null pour ses deux programmes — donc une jauge
// de drawdown vide sur toute la firme.
//
// Seul le style « Étiquette : valeur » compte comme ciblage explicite. Une
// parenthèse est trop ambiguë pour porter cette décision.
export function hasExplicitProgramSegments(rawValue) {
  if (rawValue === null || rawValue === undefined) return false
  return String(rawValue).split('·').some(seg => {
    const i = seg.indexOf(':')
    return i > 0 && seg.slice(0, i).trim().length > 0
  })
}
