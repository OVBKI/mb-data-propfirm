// lib/cryptoBox.test.js — le chiffrement des identifiants broker.
//
// Ce module protège des mots de passe de vrais comptes de trading. Un bug ici ne
// se voit pas : le chiffré a l'air d'un chiffré même quand il ne protège rien.

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { encryptSecret, decryptSecret, secretEquals, redact } from './cryptoBox'

const KEY = Buffer.alloc(32, 7).toString('base64')

beforeEach(() => { process.env.TRADOVATE_ENC_KEY = KEY })
afterEach(() => { delete process.env.TRADOVATE_ENC_KEY })

describe('aller-retour', () => {
  it('rend le texte d origine', () => {
    const s = 'mot de passe très secret · éàü'
    expect(decryptSecret(encryptSecret(s))).toBe(s)
  })

  it('produit un chiffré DIFFÉRENT à chaque appel', () => {
    // L'IV est aléatoire. Deux chiffrés identiques révéleraient que deux
    // utilisateurs ont le même mot de passe.
    const a = encryptSecret('identique')
    const b = encryptSecret('identique')
    expect(a).not.toBe(b)
    expect(decryptSecret(a)).toBe(decryptSecret(b))
  })

  it('ne laisse pas le clair apparaître dans le chiffré', () => {
    expect(encryptSecret('ABCDEF')).not.toContain('ABCDEF')
  })
})

describe('intégrité', () => {
  it('REFUSE un chiffré altéré', () => {
    // C'est la raison d'utiliser GCM plutôt que CBC. En CBC, une altération
    // rendrait des octets aléatoires qu'on enverrait ensuite au broker comme
    // mot de passe.
    const packed = encryptSecret('secret')
    const parts = packed.split('.')
    const body = Buffer.from(parts[3], 'base64url')
    body[0] ^= 0xff
    parts[3] = body.toString('base64url')
    expect(() => decryptSecret(parts.join('.'))).toThrow()
  })

  it('refuse un tag d authentification remplacé', () => {
    const parts = encryptSecret('secret').split('.')
    parts[2] = Buffer.alloc(16, 1).toString('base64url')
    expect(() => decryptSecret(parts.join('.'))).toThrow()
  })

  it('refuse un format inconnu', () => {
    expect(() => decryptSecret('pas-du-tout')).toThrow(/format/i)
    expect(() => decryptSecret('v9.a.b.c')).toThrow(/format/i)
    expect(() => decryptSecret('')).toThrow()
  })
})

describe('la clé', () => {
  it('échoue clairement si elle manque', () => {
    delete process.env.TRADOVATE_ENC_KEY
    expect(() => encryptSecret('x')).toThrow(/manquante/i)
  })

  it('refuse une clé de mauvaise taille', () => {
    // Une clé trop courte donnerait un chiffrement plus faible que prévu, sans
    // le moindre signal.
    process.env.TRADOVATE_ENC_KEY = Buffer.alloc(16, 1).toString('base64')
    expect(() => encryptSecret('x')).toThrow(/32 octets/)
  })

  it('ne déchiffre pas avec une autre clé', () => {
    const packed = encryptSecret('secret')
    process.env.TRADOVATE_ENC_KEY = Buffer.alloc(32, 9).toString('base64')
    expect(() => decryptSecret(packed)).toThrow()
  })
})

describe('secretEquals', () => {
  it('compare correctement', () => {
    expect(secretEquals('abc', 'abc')).toBe(true)
    expect(secretEquals('abc', 'abd')).toBe(false)
    expect(secretEquals('abc', 'abcd')).toBe(false)
    expect(secretEquals(null, undefined)).toBe(true)   // deux vides
  })
})

describe('redact', () => {
  it('masque les champs sensibles, à tous les niveaux', () => {
    const r = redact({
      user: 'omar',
      password: 'hunter2',
      nested: { api_key: 'k', accessToken: 't', ok: 1 },
      list: [{ sec: 's' }],
    })
    expect(r.password).toBe('[masqué]')
    expect(r.nested.api_key).toBe('[masqué]')
    expect(r.nested.accessToken).toBe('[masqué]')
    expect(r.list[0].sec).toBe('[masqué]')
    // Ce qui n'est pas un secret doit rester lisible, sinon le journal ne sert
    // plus à rien pour diagnostiquer.
    expect(r.user).toBe('omar')
    expect(r.nested.ok).toBe(1)
  })

  it('ne boucle pas sur une structure profonde', () => {
    let deep = { v: 1 }
    for (let i = 0; i < 30; i++) deep = { child: deep }
    expect(() => redact(deep)).not.toThrow()
  })
})

describe('état OAuth signé', () => {
  it('fait l aller-retour', async () => {
    const { signState, verifyState } = await import('./cryptoBox')
    const s = signState({ uid: 'u-1', env: 'demo' })
    expect(verifyState(s)).toMatchObject({ uid: 'u-1', env: 'demo' })
  })

  it('REFUSE un état falsifié', async () => {
    // C'est tout l'intérêt : sans signature, n'importe qui pourrait rattacher
    // SON compte Tradovate à la session d'un autre via un lien de retour forgé.
    const { signState, verifyState } = await import('./cryptoBox')
    const s = signState({ uid: 'u-1' })
    const [body] = s.split('.')
    const forged = Buffer.from(JSON.stringify({ uid: 'victime', t: Date.now() })).toString('base64url')
    expect(verifyState(`${forged}.${s.split('.')[1]}`)).toBeNull()
    expect(verifyState(`${body}.mauvaisemac`)).toBeNull()
    expect(verifyState('n importe quoi')).toBeNull()
  })

  it('EXPIRE au bout de 10 minutes', async () => {
    // Un état sans expiration resterait rejouable indéfiniment.
    const { signState, verifyState } = await import('./cryptoBox')
    const s = signState({ uid: 'u-1' })
    expect(verifyState(s, Date.now() + 9 * 60 * 1000)).not.toBeNull()
    expect(verifyState(s, Date.now() + 11 * 60 * 1000)).toBeNull()
  })
})
