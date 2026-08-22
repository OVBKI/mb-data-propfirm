// lib/tradovate.test.js — l'appariement des exécutions et le cycle du jeton.
//
// L'enjeu : Tradovate rend des EXÉCUTIONS, pas des trades, et aucun P&L en
// devise. Tout ce qui apparaîtra dans le journal de l'utilisateur est calculé
// ici. Une erreur d'appariement ne plante pas — elle produit un journal
// plausible et faux, ce qui est bien pire.

import { describe, it, expect } from 'vitest'
import {
  parseAuthResponse, isTokenUsable, authorizeUrl, tokenExchangeBody, oauthTokenUrl,
  normalizeFills, pairFills, toJournalEntry, TOKEN_SKEW_MS,
} from './tradovate'
import { contractRoot, pointValue, tradePnL } from './futuresContracts'

// Fabrique une exécution. `m` = minutes depuis une base fixe.
const fill = (id, contract, action, qty, price, m) => ({
  id, contract, action, qty, price,
  timestamp: new Date(Date.UTC(2026, 0, 5, 14, m)).toISOString(),
})

describe('contractRoot', () => {
  it('retire le mois et l année', () => {
    expect(contractRoot('ESZ5')).toBe('ES')
    expect(contractRoot('MNQH6')).toBe('MNQ')
    expect(contractRoot('6EM5')).toBe('6E')
  })

  it('ne mange pas une racine qui FINIT par un code de mois', () => {
    // M2K, MNQ et MGC finissent par K, Q et C — tous des codes de mois. Une
    // règle qui retirerait « la dernière lettre » les mutilerait.
    expect(contractRoot('M2KZ5')).toBe('M2K')
    expect(contractRoot('MNQZ5')).toBe('MNQ')
    expect(contractRoot('MGCG6')).toBe('MGC')
  })

  it('accepte une racine déjà nue', () => {
    expect(contractRoot('ES')).toBe('ES')
    expect(contractRoot('M2K')).toBe('M2K')
  })

  it('gère une année à deux chiffres', () => {
    expect(contractRoot('ESZ25')).toBe('ES')
  })
})

describe('pointValue', () => {
  it('connaît les contrats courants et leurs micros', () => {
    expect(pointValue('ESZ5')).toBe(50)
    expect(pointValue('MESZ5')).toBe(5)
    expect(pointValue('NQ')).toBe(20)
    expect(pointValue('MNQ')).toBe(2)
  })

  it('rend null sur un inconnu — jamais une valeur par défaut', () => {
    // C'est LA décision du module. Un multiplicateur inventé produit un P&L
    // faux qui a l'air juste, et personne ne le remarque.
    expect(pointValue('XYZZ5')).toBeNull()
    expect(pointValue('')).toBeNull()
  })
})

describe('tradePnL', () => {
  it('compte un long gagnant', () => {
    // 4 points sur 2 ES à 50 $ le point = 400 $.
    expect(tradePnL({ contract: 'ESZ5', side: 'Long', entry: 5000, exit: 5004, qty: 2 })).toBe(400)
  })

  it('compte un short gagnant', () => {
    expect(tradePnL({ contract: 'MNQZ5', side: 'Short', entry: 21000, exit: 20990, qty: 3 })).toBe(60)
  })

  it('rend null plutôt que de deviner', () => {
    expect(tradePnL({ contract: 'INCONNU', side: 'Long', entry: 1, exit: 2, qty: 1 })).toBeNull()
  })

  it('refuse une quantité absurde', () => {
    expect(tradePnL({ contract: 'ES', side: 'Long', entry: 1, exit: 2, qty: 0 })).toBeNull()
  })
})

describe('parseAuthResponse', () => {
  it('lit un succès', () => {
    const r = parseAuthResponse({ accessToken: 'abc', expirationTime: '2026-01-05T16:00:00Z', userId: 7 })
    expect(r.ok).toBe(true)
    expect(r.token).toBe('abc')
    expect(r.userId).toBe(7)
  })

  it('reconnaît la PÉNALITÉ, qui arrive en 200', () => {
    // Le piège : Tradovate limite les connexions avec un code 200 et un
    // « p-ticket ». Traité comme un succès, on repart avec un jeton vide et
    // l'erreur ne se manifeste que trois appels plus loin.
    const r = parseAuthResponse({ 'p-ticket': 'T1', 'p-time': 30 })
    expect(r.ok).toBe(false)
    expect(r.kind).toBe('penalty')
    expect(r.waitMs).toBe(30000)
    expect(r.message).toContain('30')
  })

  it('signale le captcha à part', () => {
    // Attendre ne sert à rien dans ce cas : il faut une action humaine.
    const r = parseAuthResponse({ 'p-ticket': 'T1', 'p-time': 5, 'p-captcha': true })
    expect(r.captcha).toBe(true)
    expect(r.message).toMatch(/captcha/i)
  })

  it('remonte un refus explicite', () => {
    const r = parseAuthResponse({ errorText: 'Invalid credentials' })
    expect(r.ok).toBe(false)
    expect(r.kind).toBe('rejected')
    expect(r.message).toBe('Invalid credentials')
  })

  it('refuse une réponse sans jeton', () => {
    expect(parseAuthResponse({}).ok).toBe(false)
    expect(parseAuthResponse(null).ok).toBe(false)
  })
})

describe('isTokenUsable', () => {
  const now = Date.UTC(2026, 0, 5, 14, 0)

  it('accepte un jeton largement valide', () => {
    expect(isTokenUsable({ token: 'x', expiresAt: now + 60 * 60 * 1000 }, now)).toBe(true)
  })

  it('REJETTE un jeton qui expire dans la marge', () => {
    // Un jeton encore valide 2 minutes est refusé : il peut mourir pendant la
    // requête, et le 401 qui en résulte est indiscernable d'un mauvais mot de
    // passe. On préfère renouveler pour rien.
    expect(isTokenUsable({ token: 'x', expiresAt: now + 2 * 60 * 1000 }, now)).toBe(false)
    expect(isTokenUsable({ token: 'x', expiresAt: now + TOKEN_SKEW_MS + 1000 }, now)).toBe(true)
  })

  it('rejette l absence de jeton ou d échéance', () => {
    expect(isTokenUsable(null, now)).toBe(false)
    expect(isTokenUsable({ token: 'x' }, now)).toBe(false)
  })
})

describe('OAuth', () => {
  const cfg = { clientId: 'abc 123', clientSecret: 's3c', redirectUri: 'https://quantara.tech/cb?x=1' }

  it('construit l URL d autorisation', () => {
    const u = new URL(authorizeUrl({ ...cfg, state: 'ST' }))
    expect(u.origin + u.pathname).toBe('https://trader.tradovate.com/oauth')
    expect(u.searchParams.get('response_type')).toBe('code')
    expect(u.searchParams.get('client_id')).toBe('abc 123')
    expect(u.searchParams.get('state')).toBe('ST')
  })

  it('ENCODE les paramètres', () => {
    // Une redirect_uri contenant « ? » ou « & » non encodée tronquerait l URL
    // et Tradovate refuserait l échange sans dire pourquoi.
    const u = authorizeUrl({ ...cfg, state: 'ST' })
    expect(u).toContain('redirect_uri=https%3A%2F%2Fquantara.tech%2Fcb%3Fx%3D1')
    expect(u).not.toContain('cb?x=1&response')
  })

  it('omet state quand il n y en a pas', () => {
    expect(authorizeUrl(cfg)).not.toContain('state=')
  })

  it('vise DEMO par défaut', () => {
    // Le piège n°1 : un compte PropFirm vit sur demo, même avec des payouts
    // réels. Viser live renvoie « identifiants invalides » sans explication.
    expect(oauthTokenUrl('demo')).toContain('demo.tradovateapi.com')
    expect(oauthTokenUrl(undefined)).toContain('demo.tradovateapi.com')
    expect(oauthTokenUrl('n importe quoi')).toContain('demo.tradovateapi.com')
    expect(oauthTokenUrl('live')).toContain('live.tradovateapi.com')
  })

  it('produit un corps FORM-URLENCODED', () => {
    // Ce point d entrée refuse le JSON, et son message d erreur ne le dit pas.
    const b = tokenExchangeBody({ code: 'C', ...cfg })
    expect(b).toBeInstanceOf(URLSearchParams)
    expect(b.get('grant_type')).toBe('authorization_code')
    expect(b.get('code')).toBe('C')
    expect(b.get('client_secret')).toBe('s3c')
  })
})

describe('normalizeFills', () => {
  it('accepte les variantes de nommage', () => {
    const out = normalizeFills([
      { id: 1, contractName: 'ESZ5', side: 'Buy', quantity: 1, fillPrice: 5000, time: '2026-01-05T14:00:00Z' },
    ])
    expect(out).toHaveLength(1)
    expect(out[0].contract).toBe('ESZ5')
    expect(out[0].price).toBe(5000)
  })

  it('ÉCARTE ce qui est inexploitable', () => {
    // Une exécution sans prix ni quantité ne peut pas être récupérée. La garder
    // ferait dérailler l'appariement sur toutes les suivantes du même contrat.
    const out = normalizeFills([
      { id: 1, contract: 'ESZ5', action: 'Buy', qty: 1, timestamp: '2026-01-05T14:00:00Z' }, // pas de prix
      { id: 2, contract: '', action: 'Buy', qty: 1, price: 5000, timestamp: '2026-01-05T14:00:00Z' },
      { id: 3, contract: 'ESZ5', action: 'Buy', qty: 0, price: 5000, timestamp: '2026-01-05T14:00:00Z' },
      { id: 4, contract: 'ESZ5', action: 'Buy', qty: 1, price: 5000, timestamp: 'pas une date' },
    ])
    expect(out).toHaveLength(0)
  })

  it('tolère une entrée qui n est pas un tableau', () => {
    expect(normalizeFills(null)).toEqual([])
    expect(normalizeFills({})).toEqual([])
  })
})

describe('pairFills — le cœur', () => {
  it('apparie un aller-retour simple', () => {
    const t = pairFills([
      fill(1, 'ESZ5', 'Buy', 1, 5000, 0),
      fill(2, 'ESZ5', 'Sell', 1, 5004, 5),
    ])
    expect(t).toHaveLength(1)
    expect(t[0]).toMatchObject({ side: 'Long', qty: 1, entry: 5000, exit: 5004, pnl: 200 })
  })

  it('compte UN trade quand la position se construit en plusieurs fois', () => {
    // 1 lot puis 1 lot, revendus ensemble. Compter par paires en verrait deux.
    const t = pairFills([
      fill(1, 'ESZ5', 'Buy', 1, 5000, 0),
      fill(2, 'ESZ5', 'Buy', 1, 5002, 1),
      fill(3, 'ESZ5', 'Sell', 2, 5006, 9),
    ])
    expect(t).toHaveLength(1)
    expect(t[0].qty).toBe(2)
    expect(t[0].entry).toBe(5001)          // moyenne pondérée
    expect(t[0].pnl).toBe(500)             // 5 points × 2 × 50
  })

  it('pondère la moyenne par la QUANTITÉ, pas par le nombre de lignes', () => {
    // 1 lot à 5000 et 3 lots à 5100 : la moyenne est 5075, pas 5050.
    const t = pairFills([
      fill(1, 'ESZ5', 'Buy', 1, 5000, 0),
      fill(2, 'ESZ5', 'Buy', 3, 5100, 1),
      fill(3, 'ESZ5', 'Sell', 4, 5200, 9),
    ])
    expect(t[0].entry).toBe(5075)
  })

  it('ferme un trade par sorties partielles', () => {
    const t = pairFills([
      fill(1, 'MNQZ5', 'Buy', 4, 21000, 0),
      fill(2, 'MNQZ5', 'Sell', 2, 21010, 3),
      fill(3, 'MNQZ5', 'Sell', 2, 21020, 6),
    ])
    expect(t).toHaveLength(1)
    expect(t[0].qty).toBe(4)
    expect(t[0].exit).toBe(21015)
    expect(t[0].pnl).toBe(120)             // 15 points × 4 × 2
  })

  it('gère un SHORT', () => {
    const t = pairFills([
      fill(1, 'ESZ5', 'Sell', 2, 5010, 0),
      fill(2, 'ESZ5', 'Buy', 2, 5000, 4),
    ])
    expect(t[0].side).toBe('Short')
    expect(t[0].pnl).toBe(1000)            // 10 points × 2 × 50
  })

  it('coupe une INVERSION en deux trades', () => {
    // Long 1, puis vente de 3 : ça ferme le long ET ouvre un short de 2.
    // Sans ce découpage, le trade suivant hériterait d'un prix d'entrée faux.
    const t = pairFills([
      fill(1, 'ESZ5', 'Buy', 1, 5000, 0),
      fill(2, 'ESZ5', 'Sell', 3, 5010, 5),
      fill(3, 'ESZ5', 'Buy', 2, 5006, 9),
    ])
    expect(t).toHaveLength(2)
    expect(t[0]).toMatchObject({ side: 'Long', qty: 1, pnl: 500 })
    expect(t[1]).toMatchObject({ side: 'Short', qty: 2, entry: 5010, exit: 5006, pnl: 400 })
  })

  it('N INSCRIT PAS une position encore ouverte', () => {
    // Elle n'a pas de résultat. L'écrire au journal fabriquerait un P&L.
    const t = pairFills([fill(1, 'ESZ5', 'Buy', 1, 5000, 0)])
    expect(t).toHaveLength(0)
  })

  it('sépare les contrats', () => {
    const t = pairFills([
      fill(1, 'ESZ5', 'Buy', 1, 5000, 0),
      fill(2, 'MNQZ5', 'Buy', 1, 21000, 1),
      fill(3, 'ESZ5', 'Sell', 1, 5002, 2),
      fill(4, 'MNQZ5', 'Sell', 1, 21005, 3),
    ])
    expect(t).toHaveLength(2)
    expect(t.map(x => x.contract).sort()).toEqual(['ESZ5', 'MNQZ5'])
  })

  it('remet les exécutions dans l ordre', () => {
    // L'API ne garantit pas l'ordre. Apparier dans le désordre inverserait
    // l'entrée et la sortie, donc le signe du P&L.
    const t = pairFills([
      fill(2, 'ESZ5', 'Sell', 1, 5004, 5),
      fill(1, 'ESZ5', 'Buy', 1, 5000, 0),
    ])
    expect(t[0].entry).toBe(5000)
    expect(t[0].pnl).toBe(200)
  })

  it('signale un contrat inconnu au lieu d inventer un P&L', () => {
    const t = pairFills([
      fill(1, 'ZZZZ5', 'Buy', 1, 100, 0),
      fill(2, 'ZZZZ5', 'Sell', 1, 110, 5),
    ])
    expect(t[0].pnl).toBeNull()
    expect(t[0].needsMultiplier).toBe(true)
  })

  it('rend les trades par ordre de clôture', () => {
    const t = pairFills([
      fill(1, 'ESZ5', 'Buy', 1, 5000, 0),
      fill(2, 'ESZ5', 'Sell', 1, 5001, 10),
      fill(3, 'MNQZ5', 'Buy', 1, 21000, 1),
      fill(4, 'MNQZ5', 'Sell', 1, 21001, 2),
    ])
    expect(t[0].contract).toBe('MNQZ5')
    expect(t[1].contract).toBe('ESZ5')
  })
})

describe('toJournalEntry', () => {
  const trade = pairFills([
    fill(1, 'ESZ5', 'Buy', 1, 5000, 0),
    fill(2, 'ESZ5', 'Sell', 1, 5004, 5),
  ])[0]

  it('produit une ligne complète', () => {
    const e = toJournalEntry(trade, { accountId: 'acc-1', userId: 'u-1' })
    expect(e).toMatchObject({
      account_id: 'acc-1', user_id: 'u-1',
      date: '2026-01-05', pnl: 200, instrument: 'ESZ5', side: 'Long', source: 'tradovate',
    })
  })

  it('donne un source_id STABLE', () => {
    // C'est lui qui rend la synchronisation idempotente : relancer sur la même
    // période met à jour au lieu de dupliquer. Sans ça, chaque passage
    // doublerait le journal.
    const a = toJournalEntry(trade, { accountId: 'acc-1', userId: 'u-1' })
    const b = toJournalEntry(trade, { accountId: 'acc-1', userId: 'u-1' })
    expect(a.source_id).toBe(b.source_id)
    expect(a.source_id).toContain('tradovate:ESZ5')
  })

  it('écrit une note quand le P&L n a pas pu être calculé', () => {
    const unknown = pairFills([
      fill(1, 'ZZZZ5', 'Buy', 1, 100, 0),
      fill(2, 'ZZZZ5', 'Sell', 1, 110, 5),
    ])[0]
    const e = toJournalEntry(unknown, { accountId: 'a', userId: 'u' })
    expect(e.pnl).toBe(0)
    expect(e.notes).toMatch(/multiplicateur/i)
  })
})
