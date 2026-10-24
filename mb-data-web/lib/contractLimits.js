// lib/contractLimits.js — nombre maximal de contrats d'un compte, lu dans le
// catalogue (PROPFIRM_RULES).
//
// Les clés varient d'une firme à l'autre (« Contrats max (mini) », « Max
// contracts (Combine) », « Contrats max éval (mini) », « Contrats sim funded »…)
// et beaucoup de cellules décrivent un plan d'échelle (« 3 → 15 »), un solde
// (« selon le solde ») ou plusieurs programmes séparés par « / ». On ne rend une
// limite que si la cellule est lisible SANS ambiguïté : une alerte « tu dépasses
// ta limite » fondée sur un chiffre mal lu serait pire que pas d'alerte.
import { firmRules } from './constants'
import { extractModelSegment, hasExplicitProgramSegments, isUnavailableValue } from './programSegment'
import { programsForFirm, defaultProgramFor } from './futuresComparison'
import { accountPhase } from './accountRules'

const KEY_RE = /^(contrats? max|max contracts|contrats sim funded|contrats pa post-safety)/i
const AMBIGUOUS = /→|->|selon|scaling|~|inchangé|idem|n\/a|non dispo/i

function keyPhase(key) {
  if (/é?val|eval|combine/i.test(key)) return 'challenge'
  if (/financ|funded|\bpa\b|lfa/i.test(key)) return 'funded'
  return 'any'
}
function keySize(key) {
  return /micro/i.test(key) ? 'micro' : 'mini'
}

// Lit une cellule : { mini, micro } (l'un ou l'autre peut manquer), ou null.
export function parseContractCell(raw, size = 'mini') {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s || AMBIGUOUS.test(s) || isUnavailableValue(s)) return null
  const mini = s.match(/(\d+)\s*minis?\b/i)
  const micro = s.match(/(\d+)\s*micros?\b/i)
  if (mini || micro) {
    // « 4 (Starter) / 5 (Pro) » n'a pas de libellé mini/micro : déjà écarté plus bas.
    return { mini: mini ? Number(mini[1]) : null, micro: micro ? Number(micro[1]) : null }
  }
  if (/\//.test(s)) return null // plusieurs valeurs sans étiquette
  const plain = s.match(/^(\d+)(?:\s*\([^)]*\))?\s*$/)
  if (!plain) return null
  return size === 'micro' ? { mini: null, micro: Number(plain[1]) } : { mini: Number(plain[1]), micro: null }
}

// → { mini, micro, source } ou null. `phase` : 'challenge' | 'funded'.
export function maxContracts(firmName, plan, program, phase) {
  const rules = firmRules(firmName)?.rules
  if (!rules || !plan || !phase) return null
  // Nom court d'un programme pour le reconnaître dans une clé :
  // « Option 1 (No Scaling) » → « Option 1 ».
  const core = (p) => String(p || '').replace(/\s*\(.*\)\s*/g, '').trim()
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const mentions = (key, p) => core(p) && new RegExp(`(^|[^\\w])${esc(core(p))}($|[^\\w])`, 'i').test(key)
  const programs = programsForFirm(firmName, plan) || []
  const others = programs.filter((p) => p && p !== program)
  const out = { mini: null, micro: null, source: [] }
  // Clés propres à la phase d'abord, puis les clés générales.
  const keys = Object.keys(rules).filter((k) => KEY_RE.test(k))
    // Comptes live (LFA), limites d'avant une date, avant le safety net : pas la
    // limite courante d'un compte suivi ici.
    .filter((k) => !/avant|pre-safety|live|\blfa\b/i.test(k))
    .filter((k) => keyPhase(k) === phase || keyPhase(k) === 'any')
    .sort((a, b) => (keyPhase(a) === phase ? 0 : 1) - (keyPhase(b) === phase ? 0 : 1))
  for (const key of keys) {
    // Une clé nommée d'après un AUTRE programme ne concerne pas ce compte.
    if (others.some((o) => mentions(key, o)) && !mentions(key, program)) continue
    let cell = rules[key]?.[plan]
    if (cell == null) continue
    // Cellule étiquetée par programme (« Rapid : 3 · Pro : 2 ») : on n'en garde
    // que le segment du compte. Un deux-points sans nom de programme (« ratio
    // 10:1 ») ne fait pas d'une cellule une liste par programme.
    if (hasExplicitProgramSegments(cell) && programs.some((p) => mentions(cell, p))) {
      if (!program) continue
      cell = extractModelSegment(cell, program)
    }
    const v = parseContractCell(cell, keySize(key))
    if (!v) continue
    if (out.mini == null && v.mini != null) { out.mini = v.mini; out.source.push(key) }
    if (out.micro == null && v.micro != null) { out.micro = v.micro; out.source.push(key) }
    if (out.mini != null && out.micro != null) break
  }
  if (out.mini == null && out.micro == null) return null
  return out
}

export function accountMaxContracts(account, firmName) {
  const plan = account?.plan_size
  const program = account?.program || defaultProgramFor(firmName, plan) || null
  return maxContracts(firmName, plan, program, accountPhase(account))
}
