// lib/drawdownAlerts.js — quand prévenir d'un drawdown qui se consomme.
//
// Trois paliers sur la part du drawdown max consommée : 50 % (attention),
// 80 % (danger), plancher franchi (dépassé). On prévient UNE fois par palier
// franchi vers le haut : un compte qui reste à 85 % ne reçoit pas une alerte
// chaque matin. S'il remonte sous un palier, l'état redescend, et une nouvelle
// dégradation alertera de nouveau.
import { DD_WARN, DD_DANGER } from './ruleCheck'

export const LEVELS = ['warn', 'danger', 'breach']
const RANK = { none: 0, warn: 1, danger: 2, breach: 3 }

export function drawdownLevel(margin) {
  if (!margin || margin.roomPct == null) return 'none'
  if (margin.room <= 0) return 'breach'
  const used = 1 - margin.roomPct
  if (used >= DD_DANGER) return 'danger'
  if (used >= DD_WARN) return 'warn'
  return 'none'
}

// prev : niveau mémorisé (ou null), next : niveau calculé ce matin.
// → { notify, store } ; store === undefined : rien à écrire.
export function alertDecision(prev, next) {
  const p = RANK[prev || 'none'] ?? 0
  const n = RANK[next] ?? 0
  if (n > p) return { notify: true, store: next }
  if (n < p) return { notify: false, store: next }
  return { notify: false, store: undefined }
}
