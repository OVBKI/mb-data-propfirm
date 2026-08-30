// lib/programSegment.test.js — lire la valeur d'UN programme dans une cellule.
//
// Ce parseur décide quels chiffres l'app attribue au compte d'un utilisateur.
// Une erreur ici ne se voit pas : elle rend un montant plausible, simplement
// celui d'un autre programme.

import { describe, it, expect } from 'vitest'
import { extractModelSegment, hasExplicitProgramSegments } from './programSegment'

describe('extractModelSegment', () => {
  it('lit le style « Étiquette : valeur »', () => {
    const cell = 'EOD/Intraday : $2,000 · Legacy : $2,500'
    expect(extractModelSegment(cell, 'EOD')).toBe('$2,000')
    expect(extractModelSegment(cell, 'Intraday')).toBe('$2,000')
    expect(extractModelSegment(cell, 'Legacy')).toBe('$2,500')
  })

  it('rend null pour un programme absent d’une cellule composite', () => {
    // Le point crucial : ne JAMAIS retomber sur la valeur d'un autre programme.
    expect(extractModelSegment('Legacy : $2,750', 'EOD')).toBeNull()
  })

  it('rend la valeur globale quand aucun programme n’est cité', () => {
    expect(extractModelSegment('$2,000', 'XFA Standard')).toBe('$2,000')
  })

  it('gère un libellé qui se termine par un SIGNE', () => {
    // \b n'est une frontière qu'entre deux caractères de mot. Après le « + » de
    // PRO+ il n'y en a pas : /\bPRO\+\b/ ne trouvait jamais « PRO+ : 90/10 », et
    // le porteur d'un compte PRO+ héritait du split de PRO, 10 points plus bas.
    const cell = 'PRO : 80/20 · PRO+ : 90/10'
    expect(extractModelSegment(cell, 'PRO')).toBe('80/20')
    expect(extractModelSegment(cell, 'PRO+')).toBe('90/10')
  })

  it('exige le libellé ENTIER, pas un préfixe', () => {
    const cell = 'Rapid Pro : $800 · Rapid Daily : $1,200'
    expect(extractModelSegment(cell, 'Rapid Pro')).toBe('$800')
    expect(extractModelSegment(cell, 'Rapid Daily')).toBe('$1,200')
  })

  it('traite les entrées vides sans lever', () => {
    expect(extractModelSegment(null, 'EOD')).toBeNull()
    expect(extractModelSegment(undefined, 'EOD')).toBeNull()
  })
})

describe('hasExplicitProgramSegments', () => {
  it('distingue une cellule composite d’une cellule globale', () => {
    // Sur cette distinction repose le choix entre « rendre null » (le programme
    // n'est pas vendu ici) et « retomber sur la valeur commune ».
    expect(hasExplicitProgramSegments('Legacy : $2,750')).toBe(true)
    expect(hasExplicitProgramSegments('$2,000 — EOD seulement (PAS intraday)')).toBe(false)
    expect(hasExplicitProgramSegments(null)).toBe(false)
  })
})
