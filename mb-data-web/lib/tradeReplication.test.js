// lib/tradeReplication.test.js
import { describe, it, expect } from 'vitest'
import {
  replicationTargets,
  countTargets,
  allTargetIds,
  pruneSelection,
  buildReplicaPayloads,
} from './tradeReplication'

const FIRMS = [
  {
    id: 'f1', name: 'Topstep',
    accounts: [
      { id: 'a1', name: '50K #1', status: 'Financé' },
      { id: 'a2', name: '50K #2', status: 'Challenge' },
      { id: 'a3', name: '50K mort', status: 'Échoué' },
    ],
  },
  {
    id: 'f2', name: 'Apex',
    accounts: [
      { id: 'b1', name: '100K', status: 'Financé' },
    ],
  },
  // Firme dont TOUS les comptes sont échoués : elle ne doit pas apparaître.
  {
    id: 'f3', name: 'Bulenox',
    accounts: [{ id: 'c1', name: '25K', status: 'Échoué' }],
  },
]

describe('replicationTargets', () => {
  it('exclut le compte SOURCE — se répliquer sur soi ferait un doublon exact', () => {
    const groups = replicationTargets(FIRMS, 'a1')
    expect(allTargetIds(groups)).not.toContain('a1')
    expect(allTargetIds(groups)).toContain('a2')
  })

  // Même règle que le sélecteur principal du modal : proposer ici un compte
  // absent de là-bas serait incohérent, et écrire sur un compte mort n'a
  // aucun sens.
  it('exclut les comptes ÉCHOUÉS', () => {
    const ids = allTargetIds(replicationTargets(FIRMS, null))
    expect(ids).not.toContain('a3')
    expect(ids).not.toContain('c1')
  })

  it('ne rend pas les firmes sans compte éligible', () => {
    const groups = replicationTargets(FIRMS, null)
    expect(groups.map(g => g.firmName)).toEqual(['Topstep', 'Apex'])
  })

  it('groupe par firme et compte correctement', () => {
    const groups = replicationTargets(FIRMS, 'a1')
    expect(groups).toHaveLength(2)
    expect(groups[0].accounts.map(a => a.id)).toEqual(['a2'])
    expect(countTargets(groups)).toBe(2)
  })

  // Le libellé vient du même helper que le sélecteur principal (accountLabel),
  // injecté plutôt qu'importé : ce module ne doit dépendre de rien.
  it('applique le formateur de libellé fourni', () => {
    const groups = replicationTargets(FIRMS, 'a1', a => `<<${a.name}>>`)
    expect(groups[0].accounts[0].label).toBe('<<50K #2>>')
  })

  it('encaisse une entrée absente ou malformée', () => {
    expect(replicationTargets(null)).toEqual([])
    expect(replicationTargets([{ id: 'x' }])).toEqual([])
    expect(countTargets(null)).toBe(0)
    expect(allTargetIds(undefined)).toEqual([])
  })
})

// ⚠️ Une sélection survit à un changement de compte source. Sans nettoyage, on
// écrirait sur un compte qui n'est plus proposé — ou sur le compte source
// lui-même après en avoir changé, ce qui créerait le doublon exact que
// l'exclusion cherche justement à éviter.
describe('pruneSelection', () => {
  it('retire les comptes qui ne sont plus des cibles valides', () => {
    const groups = replicationTargets(FIRMS, 'a2')   // a2 devient la source
    expect(pruneSelection(['a1', 'a2', 'b1'], groups)).toEqual(['a1', 'b1'])
  })

  it('retire un compte échoué resté coché', () => {
    const groups = replicationTargets(FIRMS, null)
    expect(pruneSelection(['a3', 'b1'], groups)).toEqual(['b1'])
  })

  it('rend un tableau vide sur une entrée absente', () => {
    expect(pruneSelection(null, [])).toEqual([])
    expect(pruneSelection(['a1'], [])).toEqual([])
  })
})

describe('buildReplicaPayloads', () => {
  const BASE = {
    user_id: 'u1', account_id: 'a1', date: '2026-08-31', pnl: 250.5,
    instrument: 'ES', side: 'long', notes: 'plan respecté',
    screenshot_url: 'https://x/y.png', tags: ['a-plus'],
    commissions: 4.2, slippage: 0,
  }

  it('crée un payload par compte, avec le bon account_id', () => {
    const out = buildReplicaPayloads(BASE, ['b1', 'a2'])
    expect(out).toHaveLength(2)
    expect(out.map(p => p.account_id)).toEqual(['b1', 'a2'])
  })

  // C'est la demande telle qu'elle est formulée : LE MÊME résultat. Mettre à
  // l'échelle selon la taille du compte serait une invention, et invisible.
  it('recopie le résultat À L’IDENTIQUE, sans mise à l’échelle', () => {
    const [copy] = buildReplicaPayloads(BASE, ['b1'])
    expect(copy.pnl).toBe(250.5)
    expect(copy.date).toBe('2026-08-31')
    expect(copy.instrument).toBe('ES')
    expect(copy.notes).toBe('plan respecté')
    expect(copy.screenshot_url).toBe('https://x/y.png')
    expect(copy.tags).toEqual(['a-plus'])
    expect(copy.commissions).toBe(4.2)
  })

  // ⚠️ Dupliquer une entrée EXISTANTE en gardant son id ferait écraser
  // l'original par le dernier écrit, au lieu de créer des copies.
  it('retire id et created_at du payload source', () => {
    const out = buildReplicaPayloads({ ...BASE, id: 'e1', created_at: '2026-01-01' }, ['b1'])
    expect(out[0]).not.toHaveProperty('id')
    expect(out[0]).not.toHaveProperty('created_at')
    expect(out[0].pnl).toBe(250.5)
  })

  it('dédoublonne les comptes cochés deux fois', () => {
    expect(buildReplicaPayloads(BASE, ['b1', 'b1', 'a2'])).toHaveLength(2)
  })

  it('ignore les identifiants vides', () => {
    expect(buildReplicaPayloads(BASE, ['', null, 'b1'])).toHaveLength(1)
  })

  it('rend un tableau vide sans base ou sans cible', () => {
    expect(buildReplicaPayloads(null, ['b1'])).toEqual([])
    expect(buildReplicaPayloads(BASE, [])).toEqual([])
    expect(buildReplicaPayloads(BASE, null)).toEqual([])
  })

  // Le payload source ne doit pas être modifié : le composant s'en sert ensuite
  // pour écrire la ligne du compte principal.
  it('ne mute pas le payload source', () => {
    const base = { ...BASE }
    buildReplicaPayloads(base, ['b1'])
    expect(base.account_id).toBe('a1')
  })
})
