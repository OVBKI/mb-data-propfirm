// lib/tradeReplication.js — enregistrer UN trade sur PLUSIEURS comptes.
//
// Le cas d'usage : un trader qui suit la même stratégie sur trois comptes
// financés obtient trois fois le même résultat, et devait jusqu'ici le saisir
// trois fois. La saisie répétée n'est pas seulement pénible : c'est là que les
// écarts se glissent (une date décalée, un montant retapé de travers), et un
// journal qui ne correspond plus aux relevés de la firme ne sert plus à rien.
//
// Ce module ne fait que DEUX choses, volontairement pures pour être testables
// hors navigateur : lister les comptes vers lesquels on peut répliquer, et
// fabriquer les payloads. L'écriture en base reste dans le composant.

// Les comptes candidats à la réplication, groupés par firme.
//
// Deux exclusions :
//   • le compte SOURCE — se répliquer sur soi-même créerait un doublon exact,
//     que rien ne distinguerait ensuite dans la liste des trades ;
//   • les comptes ÉCHOUÉS — on n'écrit pas un trade sur un compte mort. C'est
//     la même règle que le sélecteur principal du modal, et elle doit le rester :
//     proposer ici un compte absent de là-bas serait incohérent.
//
// Les firmes sans compte éligible ne sont pas rendues : un groupe vide est du
// bruit dans une liste à cocher.
export function replicationTargets(firms, excludeAccountId = null, labelFor = a => a.name || '') {
  if (!Array.isArray(firms)) return []
  const groups = []
  for (const firm of firms) {
    const accounts = (firm?.accounts || [])
      .filter(a => a && a.id && a.id !== excludeAccountId && a.status !== 'Échoué')
      .map(a => ({ id: a.id, label: labelFor(a), status: a.status || '' }))
    if (accounts.length > 0) {
      groups.push({ firmId: firm.id, firmName: firm.name || '', accounts })
    }
  }
  return groups
}

// Combien de comptes au total dans ces groupes.
export function countTargets(groups) {
  if (!Array.isArray(groups)) return 0
  return groups.reduce((n, g) => n + (g.accounts?.length || 0), 0)
}

// Tous les identifiants, à plat — pour « tout cocher ».
export function allTargetIds(groups) {
  if (!Array.isArray(groups)) return []
  return groups.flatMap(g => (g.accounts || []).map(a => a.id))
}

// Une sélection peut survivre à un changement de compte source ou à un
// rechargement des firmes. La nettoyer évite d'écrire sur un compte qui n'est
// plus proposé — ou pire, sur le compte source lui-même après qu'on en a changé.
export function pruneSelection(selectedIds, groups) {
  const valid = new Set(allTargetIds(groups))
  return (Array.isArray(selectedIds) ? selectedIds : []).filter(id => valid.has(id))
}

// Les payloads à insérer, un par compte cible.
//
// ⚠️ `id` est retiré s'il traîne dans la base : dupliquer une entrée EXISTANTE
// en gardant son identifiant ferait écraser l'original par le dernier écrit au
// lieu de créer des copies. Le reste est recopié tel quel — même date, même
// montant, même capture — parce que c'est précisément ce que l'utilisateur
// demande : le même résultat, pas une estimation proportionnelle à la taille du
// compte. Une mise à l'échelle serait une invention, et elle serait invisible.
export function buildReplicaPayloads(basePayload, accountIds) {
  if (!basePayload || !Array.isArray(accountIds)) return []
  const { id, created_at, ...rest } = basePayload
  const seen = new Set()
  const out = []
  for (const accountId of accountIds) {
    // Un même compte coché deux fois (état incohérent) ne doit pas produire
    // deux lignes identiques.
    if (!accountId || seen.has(accountId)) continue
    seen.add(accountId)
    out.push({ ...rest, account_id: accountId })
  }
  return out
}
