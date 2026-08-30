import { describe, it, expect } from 'vitest'
import {
  FIRM_COMPARISON_MAP,
  getFirmsWithComparison,
  getFuturesComparison,
  extractModelSegment,
  cleanCell,
  extractMoney,
  fmtMoney,
  programsForFirm,
  defaultProgramFor,
} from './futuresComparison'
import { FIRM_SUGGESTIONS, plansForFirm, PROPFIRM_RULES, maxDrawdown } from './constants'

// Récupère un modèle par nom dans le résultat résolu.
const modelOf = (firm, plan, name) => {
  const { models } = getFuturesComparison(firm, plan)
  return models.find(m => m.name === name)
}

// Vrai si une valeur est la sentinelle 'idem' (même décorée d'un emoji).
const looksLikeIdem = v =>
  typeof v === 'string' && /^idem\b/i.test(v.trim().replace(/^[^a-zà-ÿ0-9]+/i, ''))

// ---------------------------------------------------------------------------
// (a) Intégrité : toutes les firmes suggérées sont couvertes
// ---------------------------------------------------------------------------
describe('getFirmsWithComparison', () => {
  it('retourne toutes les firmes futures, dans l’ordre de FIRM_SUGGESTIONS', () => {
    // Pas de longueur en dur : ajouter une firme au catalogue ne doit pas casser
    // ce test, seulement OUBLIER de la mapper doit le casser.
    const firms = getFirmsWithComparison()
    expect(firms.length).toBeGreaterThanOrEqual(11)
    expect(firms).toEqual(FIRM_SUGGESTIONS.filter(f => FIRM_COMPARISON_MAP[f]))
    // Chaque firme suggérée est bien mappée (aucune perdue par le filter).
    expect(firms).toEqual(FIRM_SUGGESTIONS)
  })
})

// ---------------------------------------------------------------------------
// (b) Intégrité : firme × modèle × plan — jamais 'idem' littéral, jamais 'n/a',
//     jamais d'exception.
// ---------------------------------------------------------------------------
describe('résolution complète sur les données réelles', () => {
  const cellsOf = model => [
    model.ddType,
    ...Object.values(model.challenge),
    ...Object.values(model.funded),
  ]

  for (const firm of getFirmsWithComparison()) {
    for (const plan of plansForFirm(firm)) {
      it(`${firm} @ ${plan} : cellules sans sentinelle 'idem'/'n/a'`, () => {
        const { models } = getFuturesComparison(firm, plan)
        expect(models.length).toBeGreaterThan(0)
        for (const model of models) {
          for (const v of cellsOf(model)) {
            expect(looksLikeIdem(v)).toBe(false)
            if (typeof v === 'string') expect(v.trim().toLowerCase()).not.toBe('n/a')
            // cleanCell ne doit jamais lever, quel que soit le kind.
            for (const kind of ['money', 'pct', 'days', 'buffer', 'type']) {
              expect(() => cleanCell(v, kind)).not.toThrow()
            }
          }
        }
      })
    }
  }

  // Le comparateur pointait sur 'Buffer post-payout', une phrase de conseil
  // (« laisser $1,000-$1,500 au-dessus du MLL »). La colonne BUFFER en tirait
  // « $1,000 » — un chiffre qui n'est pas le buffer mais une marge de sécurité
  // recommandée. Le help center publie le vrai seuil : solde de départ + MLL
  // initiale + $100, en dessous duquel aucun retrait n'est possible.
  it("Lucid affiche le SEUIL de buffer, pas la marge conseillée", () => {
    expect(modelOf('Lucid Trading', '100k', 'LucidPro').funded.buffer).toMatch(/\$103,100/)
    // LucidDirect a une MLL plus large en 100K : son buffer est plus haut.
    expect(modelOf('Lucid Trading', '100k', 'LucidDirect').funded.buffer).toMatch(/\$103,600/)
    expect(modelOf('Lucid Trading', '150k', 'LucidDaily').funded.buffer).toMatch(/\$154,600/)
  })

  it("FuturesELites 'DLL Instant' 100k résout la valeur 50k (pas 'idem')", () => {
    const m = modelOf('FuturesELites', '100k', 'Instant Funded')
    expect(m.funded.dailyDrawdown).toMatch(/Non documenté/i)
  })
})

// ---------------------------------------------------------------------------
// (c) Régressions sur les bugs vérifiés
// ---------------------------------------------------------------------------
describe('régressions extractModelSegment (données réelles)', () => {
  // Alpha a renommé sa gamme en août 2026 (vérifié sur alpha-futures.com) :
  // Premium / Zero / Advanced sont devenus Zero / Standard / Direct.
  it('Alpha Standard @150k : objectif = $9,000', () => {
    const m = modelOf('Alpha Futures', '150k', 'Standard')
    expect(m.challenge.objectif).toBe('$9,000')
    expect(cleanCell(m.challenge.objectif, 'money').text).toBe('9 000 $')
  })

  it('Alpha Zero @25k : objectif = $1,500 (pas null malgré "Premium/Advanced non dispo")', () => {
    const m = modelOf('Alpha Futures', '25k', 'Zero')
    expect(m.challenge.objectif).toBe('$1,500')
    expect(cleanCell(m.challenge.objectif, 'money').text).toBe('1 500 $')
  })

  it('Alpha : modèles réellement indisponibles → null (Zero @150k, Standard @25k)', () => {
    // Zero s'arrête à 100K, Standard commence à 50K. Direct couvre les quatre.
    expect(modelOf('Alpha Futures', '150k', 'Zero').challenge.objectif).toBeNull()
    expect(modelOf('Alpha Futures', '25k', 'Standard').challenge.objectif).toBeNull()
    expect(modelOf('Alpha Futures', '25k', 'Direct').challenge.drawdown).toMatch(/^\$1,000\b/)
  })

  it("Tradeify Select @25k : jours min funded = '3 jours' → '3' (pas '1')", () => {
    const m = modelOf('Tradeify', '25k', 'Select Daily')
    expect(m.funded.jourMin).toMatch(/^3 jours/)
    expect(cleanCell(m.funded.jourMin, 'days').text).toBe('3')
  })

  it("Tradeify Select @50k : 'idem' résolu puis segmenté → toujours '3'", () => {
    const m = modelOf('Tradeify', '50k', 'Select Flex')
    expect(cleanCell(m.funded.jourMin, 'days').text).toBe('3')
  })

  it("Tradeify Growth : consistance eval = AUCUNE ('—') et funded = 35 %", () => {
    const m = modelOf('Tradeify', '50k', 'Growth')
    expect(cleanCell(m.challenge.consistance, 'pct').text).toBe('—')
    expect(cleanCell(m.funded.consistance, 'pct').text).toBe('35 %')
  })

  // Phidias 2.0 (2026) : la famille Static est devenue E2L et couvre les quatre
  // tailles ; Swing est devenue Premium. Les objectifs diffèrent par programme et
  // ne sont PAS proportionnels — E2L demande beaucoup moins parce que son
  // drawdown est statique et minuscule.
  it('Phidias @50k : objectif E2L = $2,500, Fundamental et Premium = $4,000', () => {
    expect(modelOf('Phidias Propfirm', '50k', 'E2L').challenge.objectif).toBe('$2,500')
    expect(modelOf('Phidias Propfirm', '50k', 'Fundamental').challenge.objectif).toBe('$4,000')
    expect(modelOf('Phidias Propfirm', '50k', 'Premium').challenge.objectif).toBe('$4,000')
  })

  it('Phidias : Fundamental et Premium ne sont pas vendus en 25K → null', () => {
    // E2L, lui, existe bien aux quatre tailles depuis Phidias 2.0.
    expect(modelOf('Phidias Propfirm', '100k', 'E2L').challenge.objectif).toBe('$3,500')
    expect(modelOf('Phidias Propfirm', '25k', 'Fundamental').challenge.objectif).toBeNull()
    expect(modelOf('Phidias Propfirm', '25k', 'Premium').challenge.drawdown).toBeNull()
  })

  it('FuturesELites @50k : objectif Starter = ~$3,000 et Pro = ~$4,000', () => {
    expect(cleanCell(modelOf('FuturesELites', '50k', 'Starter').challenge.objectif, 'money').text).toBe('3 000 $')
    expect(cleanCell(modelOf('FuturesELites', '50k', 'Pro').challenge.objectif, 'money').text).toBe('4 000 $')
  })

  it("Apex funded @25k : consistance '50% — aucun jour > 50%…' → '50 %' (pas '—')", () => {
    const { models } = getFuturesComparison('Apex Trader Funding', '25k')
    expect(cleanCell(models[0].funded.consistance, 'pct').text).toBe('50 %')
  })
})

describe('extractModelSegment (unitaire)', () => {
  it("style Alpha 'Model: valeur' avec note non-dispo sur d'autres modèles", () => {
    const s = 'Premium: $9,000 · Advanced: $12,000 (Zero non dispo)'
    expect(extractModelSegment(s, 'Advanced')).toBe('$12,000')
    expect(extractModelSegment(s, 'Premium')).toBe('$9,000')
    expect(extractModelSegment(s, 'Zero')).toBeNull()
  })

  it('garde une parenthèse informative qui ne parle pas de dispo', () => {
    expect(extractModelSegment('Advanced: $1,750 (3.5%)', 'Advanced')).toBe('$1,750 (3.5%)')
    expect(extractModelSegment('Zero: 40% (rare en Qualified !)', 'Zero')).toBe('40% (rare en Qualified !)')
  })

  it("style Phidias 'valeur (ModelA/ModelB)'", () => {
    const s = '$3,000 (E2L) · $4,000 (Fundamental/Premium)'
    expect(extractModelSegment(s, 'E2L')).toBe('$3,000')
    expect(extractModelSegment(s, 'Fundamental')).toBe('$4,000')
    expect(extractModelSegment(s, 'Premium')).toBe('$4,000')
    // Modèle absent d'une chaîne « gardée » par modèles → null
    expect(extractModelSegment('$1,500 (Static/E2L)', 'Fundamental')).toBeNull()
  })

  it("style FuturesElites 'Model valeur' sans deux-points", () => {
    const s = 'Starter ~$3,000 · Pro ~$4,000 · Instant : 5% buffer (décompo Starter vs Pro non publique)'
    expect(extractModelSegment(s, 'Starter')).toBe('~$3,000')
    expect(extractModelSegment(s, 'Pro')).toBe('~$4,000')
    expect(extractModelSegment(s, 'Instant')).toBe('5% buffer (décompo Starter vs Pro non publique)')
  })

  it("valeurs 'AUCUNE' conservées (vraie règle), marqueurs d'indispo → null", () => {
    expect(extractModelSegment('Premium: 50% · Zero: AUCUNE · Advanced: 50%', 'Zero')).toBe('AUCUNE')
    expect(extractModelSegment('Lightning : n/a (instant) · Select/Growth Eval : $1,500 (6%)', 'Lightning')).toBeNull()
    expect(extractModelSegment('Lightning : n/a (instant) · Select/Growth Eval : $1,500 (6%)', 'Select')).toBe('$1,500 (6%)')
  })

  it('chaîne globale sans marqueur de modèle → renvoyée pour tous les modèles', () => {
    expect(extractModelSegment('AUCUN', 'Premium')).toBe('AUCUN')
    expect(extractModelSegment('non dispo', 'Premium')).toBeNull()
    expect(extractModelSegment(null, 'Premium')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// (d) extractMoney / cleanCell money : jamais de montant inventé sans '$'
// ---------------------------------------------------------------------------
describe('extractMoney', () => {
  it('exige un montant ancré par $ — sinon null', () => {
    expect(extractMoney('EOD trailing · LOCK à starting balance APRÈS 1er payout (différenciateur)')).toBeNull()
    expect(extractMoney('Non documenté précisément à 3 sources')).toBeNull()
    expect(extractMoney('AUCUNE')).toBeNull()
  })

  it('extrait les montants $ avec séparateurs de milliers', () => {
    expect(extractMoney('$2,500')).toBe(2500)
    expect(extractMoney('5 winning days ≥ $150')).toBe(150)
    expect(extractMoney('$1,000 (4% intraday trailing)')).toBe(1000)
    expect(extractMoney('~$4,000')).toBe(4000)
  })

  it("cleanCell ne fabrique jamais '1 $' / '3 $' depuis des chiffres non monétaires", () => {
    const buffer = cleanCell('EOD trailing · LOCK à starting balance APRÈS 1er payout', 'buffer')
    expect(buffer.text).not.toMatch(/^\d[\d ]*\$$/)
    expect(buffer.text).not.toBe('1 $')
    const money = cleanCell('Non documenté précisément à 3 sources', 'money')
    expect(money.text).not.toBe('3 $')
    expect(money.text).toBe('Non documenté pré…')
  })

  it('fmtMoney formate en fr', () => {
    expect(fmtMoney(2500)).toBe('2 500 $')
    expect(fmtMoney(150)).toBe('150 $')
    expect(fmtMoney(-1200)).toBe('-1 200 $')
  })
})

// ---------------------------------------------------------------------------
// (e) pct : 'aucun' seulement en tête de valeur
// ---------------------------------------------------------------------------
describe('cleanCell pct', () => {
  it("extrait le pourcentage même si 'aucun' apparaît plus loin dans la phrase", () => {
    expect(cleanCell('50% — aucun jour > 50% du profit total depuis dernier payout', 'pct').text).toBe('50 %')
  })

  it("'AUCUN(E)' en tête = pas de règle → '—'", () => {
    expect(cleanCell('AUCUNE', 'pct').text).toBe('—')
    expect(cleanCell('AUCUN en Qualification', 'pct').text).toBe('—')
  })

  it("préfère le pourcentage quand 'AUCUNE' n'ouvre pas la valeur", () => {
    expect(cleanCell('Eval : AUCUNE (unrestricted) · Funded : 35%', 'pct').text).toBe('35 %')
  })

  it('valeurs numériques passées telles quelles', () => {
    expect(cleanCell(40, 'pct').text).toBe('40 %')
  })
})

// ---------------------------------------------------------------------------
// (f) buffer : null = pas de donnée fiable → '—' (jamais 'Non')
// ---------------------------------------------------------------------------
describe('cleanCell buffer', () => {
  it("null → '—' comme les autres kinds", () => {
    expect(cleanCell(null, 'buffer').text).toBe('—')
    expect(cleanCell(undefined, 'buffer').text).toBe('—')
    expect(cleanCell(null, 'money').text).toBe('—')
    expect(cleanCell(null, 'pct').text).toBe('—')
    expect(cleanCell(null, 'days').text).toBe('—')
  })

  it("'AUCUN' explicite reste 'Non' (vraie absence de buffer)", () => {
    expect(cleanCell('AUCUN', 'buffer').text).toBe('Non')
  })

  it('extrait les montants $ des règles de buffer', () => {
    expect(cleanCell('Locke à starting + $100 = $25,100 une fois atteint', 'buffer').text).toBe('100 $')
  })
})

// ── Programmes par firme × taille ───────────────────────────────────────────
// C'est ce qui alimente le sélecteur « type de compte » à la création. Deux
// propriétés comptent, et les deux ont déjà été cassées :
//   1. aucune firme ne doit se retrouver SANS programme à une de ses tailles ;
//   2. un programme non vendu à une taille ne doit pas y apparaître.
describe('programsForFirm', () => {
  it('rend au moins un programme pour CHAQUE firme et CHAQUE taille', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      for (const plan of plansForFirm(firm)) {
        const list = programsForFirm(firm, plan)
        expect(list.length, `${firm} ${plan}`).toBeGreaterThan(0)
        expect(defaultProgramFor(firm, plan), `${firm} ${plan}`).toBe(list[0])
      }
    }
  })

  it('exclut les programmes non vendus à cette taille', () => {
    // Apex ne vend plus que du legacy en 75K, 250K et 300K.
    expect(programsForFirm('Apex Trader Funding', '75k')).toEqual(['Legacy'])
    expect(programsForFirm('Apex Trader Funding', '50k')).toEqual(['EOD', 'Intraday', 'Legacy'])
    // Phidias : Fundamental et Premium commencent à 50K, E2L couvre tout.
    expect(programsForFirm('Phidias Propfirm', '25k')).toEqual(['E2L'])
    // My Funded Futures : Builder est un 50K seul, Flex s'arrête à 50K.
    expect(programsForFirm('My Funded Futures', '50k')).toContain('Builder')
    expect(programsForFirm('My Funded Futures', '100k')).not.toContain('Builder')
    expect(programsForFirm('My Funded Futures', '150k')).not.toContain('Flex')
    // FundedNext : pas de Flex en 25K, rien d'autre que Flex en 150K.
    expect(programsForFirm('FundedNext Futures', '25k')).not.toContain('Flex')
    expect(programsForFirm('FundedNext Futures', '150k')).toEqual(['Flex'])
  })

  it('la disponibilité se juge sur le DRAWDOWN, pas sur l’objectif', () => {
    // Beaucoup de firmes partagent le même objectif entre programmes : il
    // résout partout et ne prouve donc rien. Tradeify Lightning n'a même aucune
    // phase d'évaluation — c'est son drawdown de compte financé qui l'atteste.
    expect(programsForFirm('Tradeify', '150k')).toContain('Lightning Funded')
  })

  it('sans taille, rend la liste complète des programmes de la firme', () => {
    expect(programsForFirm('Apex Trader Funding')).toEqual(['EOD', 'Intraday', 'Legacy'])
    expect(programsForFirm('Firme Inconnue')).toEqual([])
  })
})

// ── Aucune cellule ne doit exposer sa chaîne COMPOSITE ──────────────────────
// Le comparateur affiche une colonne par programme. Si une cellule étiquetée
// « EOD : $1,000 · Legacy : aucune » sort telle quelle, l'utilisateur lit les
// règles de TROIS programmes dans la case d'UN seul. C'est exactement ce qui
// s'est produit après le passage des données au format par programme.
describe('pas de fuite de chaîne composite', () => {
  it('aucune cellule ne cite un AUTRE programme de la même firme', () => {
    const leaks = []
    for (const firm of FIRM_SUGGESTIONS) {
      for (const plan of plansForFirm(firm)) {
        const { models } = getFuturesComparison(firm, plan)
        const names = models.map(m => m.name)
        for (const m of models) {
          const others = names.filter(n => n !== m.name)
          for (const phase of ['challenge', 'funded']) {
            for (const [cell, v] of Object.entries(m[phase] || {})) {
              if (typeof v !== 'string') continue
              // Un autre programme cité AVEC deux-points = un segment non résolu.
              const bad = others.find(o => new RegExp(`\\b${o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`, 'i').test(v))
              if (bad) leaks.push(`${firm} ${plan} ${m.name} ${phase}.${cell} → cite « ${bad} »`)
            }
          }
        }
      }
    }
    expect(leaks, leaks.slice(0, 6).join('\n')).toEqual([])
  })
})

// ── Lucid : quatre programmes, quatre jeux de chiffres ──────────────────────
// Relevé sur le PDF officiel du checkout (août 2026). LucidDaily manquait
// entièrement au catalogue, et LucidDirect héritait des chiffres de LucidPro
// parce que les descripteurs `{ helper: … }` ne portaient pas de `model:` :
// $3,000 de drawdown affichés au lieu de $3,500 en 100K, et un objectif de
// profit alors que le programme est financé DIRECT et n'en a aucun.
describe('Lucid Trading — les quatre programmes se distinguent', () => {
  it('vend LucidDaily à toutes les tailles', () => {
    for (const plan of ['25k', '50k', '100k', '150k']) {
      expect(programsForFirm('Lucid Trading', plan)).toEqual(
        ['LucidPro', 'LucidFlex', 'LucidDaily', 'LucidDirect']
      )
    }
  })

  it('donne à LucidDirect SON drawdown, pas celui de LucidPro', () => {
    const at = plan => {
      const { models } = getFuturesComparison('Lucid Trading', plan)
      return Object.fromEntries(models.map(m => [m.name, m.challenge.drawdown]))
    }
    expect(at('100k')).toMatchObject({ LucidPro: 3000, LucidDaily: 3000, LucidDirect: 3500 })
    expect(at('150k')).toMatchObject({ LucidPro: 4500, LucidDaily: 4500, LucidDirect: 5000 })
  })

  it('ne donne AUCUN objectif de profit à LucidDirect (financé direct)', () => {
    for (const plan of ['25k', '50k', '100k', '150k']) {
      const { models } = getFuturesComparison('Lucid Trading', plan)
      const byName = Object.fromEntries(models.map(m => [m.name, m]))
      expect(byName.LucidDirect.challenge.objectif).toBeNull()
      expect(byName.LucidPro.challenge.objectif).toBeGreaterThan(0)
    }
  })

  it('réserve le profit minimum quotidien à LucidFlex', () => {
    // C'est le seuil qui décide si une journée compte dans les cinq exigées.
    // Une clé d'évaluation placée devant renvoyait $0 à tout le monde.
    const { models } = getFuturesComparison('Lucid Trading', '150k')
    const byName = Object.fromEntries(models.map(m => [m.name, m]))
    expect(byName.LucidFlex.funded.minDailyProfit).toMatch(/250/)
    expect(byName.LucidPro.funded.minDailyProfit).toMatch(/aucun/i)
  })

  it('annonce les deux types de drawdown de LucidDaily', () => {
    const { models } = getFuturesComparison('Lucid Trading', '50k')
    expect(models.find(m => m.name === 'LucidDaily').ddType).toBe('EOD / Intraday')
  })
})

// ── LucidDaily : le plafond QUOTIDIEN et les conditions de retrait ──────────
// Help center « LucidDaily Payouts ». Deux mécaniques absentes du catalogue et
// propres à ce programme.
describe('LucidDaily — plafond quotidien et éligibilité au payout', () => {
  const rules = () => PROPFIRM_RULES['Lucid Trading'].rules

  it('plafonne le profit SIM par jour, et le dépassement fait passer en live', () => {
    const key = 'Profit quotidien max (LucidDaily)'
    const at = plan => extractModelSegment(rules()[key][plan], 'LucidDaily')
    expect(at('25k')).toMatch(/\$6,000/)
    expect(at('50k')).toMatch(/\$8,000/)
    expect(at('100k')).toMatch(/\$10,000/)
    expect(at('150k')).toMatch(/\$12,000/)
    expect(at('150k')).toMatch(/passage automatique en live/i)
    // Ce n'est PAS une règle des trois autres programmes.
    expect(extractModelSegment(rules()[key]['50k'], 'LucidPro')).toMatch(/sans objet/i)
  })

  it('vérifie la formule officielle du buffer sur les quatre tailles', () => {
    // « Initial Max Loss Limit + $100 », soit solde de départ + MLL + $100.
    const SIZES = { '25k': 25000, '50k': 50000, '100k': 100000, '150k': 150000 }
    for (const [plan, size] of Object.entries(SIZES)) {
      const buffer = extractModelSegment(rules()['Buffer payout'][plan], 'LucidDaily')
      const attendu = size + maxDrawdown('Lucid Trading', plan, 'LucidDaily') + 100
      expect(Number(buffer.replace(/[^0-9]/g, '')), plan).toBe(attendu)
    }
  })
})
