import { describe, it, expect } from 'vitest'
import {
  FIRM_COMPARISON_MAP,
  getFirmsWithComparison,
  getFuturesComparison,
  extractModelSegment,
  cleanCell,
  extractMoney,
  fmtMoney,
} from './futuresComparison'
import { FIRM_SUGGESTIONS, plansForFirm } from './constants'

// Récupère un modèle par nom dans le résultat résolu.
const modelOf = (firm, plan, name) => {
  const { models } = getFuturesComparison(firm, plan)
  return models.find(m => m.name === name)
}

// Vrai si une valeur est la sentinelle 'idem' (même décorée d'un emoji).
const looksLikeIdem = v =>
  typeof v === 'string' && /^idem\b/i.test(v.trim().replace(/^[^a-zà-ÿ0-9]+/i, ''))

// ---------------------------------------------------------------------------
// (a) Intégrité : les 11 firmes sont couvertes
// ---------------------------------------------------------------------------
describe('getFirmsWithComparison', () => {
  it('retourne les 11 firmes futures, dans l’ordre de FIRM_SUGGESTIONS', () => {
    const firms = getFirmsWithComparison()
    expect(firms).toHaveLength(11)
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

  it("Lucid 'Buffer post-payout' 50k+ résout le texte 25k (pas 'idem')", () => {
    const m = modelOf('Lucid Trading', '100k', 'LucidPro')
    expect(m.funded.buffer).toMatch(/\$1,000/)
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
  it('Alpha Advanced @150k : objectif = $12,000 (pas null malgré la note "Zero non dispo")', () => {
    const m = modelOf('Alpha Futures', '150k', 'Advanced')
    expect(m.challenge.objectif).toBe('$12,000')
    expect(cleanCell(m.challenge.objectif, 'money').text).toBe('12 000 $')
  })

  it('Alpha Zero @25k : objectif = $1,500 (pas null malgré "Premium/Advanced non dispo")', () => {
    const m = modelOf('Alpha Futures', '25k', 'Zero')
    expect(m.challenge.objectif).toBe('$1,500')
    expect(cleanCell(m.challenge.objectif, 'money').text).toBe('1 500 $')
  })

  it('Alpha : modèles réellement indisponibles → null (Zero @150k, Premium/Advanced @25k)', () => {
    expect(modelOf('Alpha Futures', '150k', 'Zero').challenge.objectif).toBeNull()
    expect(modelOf('Alpha Futures', '25k', 'Premium').challenge.objectif).toBeNull()
    expect(modelOf('Alpha Futures', '25k', 'Advanced').challenge.drawdown).toBeNull()
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

  it('Phidias @50k : objectif E2L = $3,000 et Fundamental = $4,000 (pas la 1re valeur pour tous)', () => {
    expect(modelOf('Phidias Propfirm', '50k', 'Static / E2L').challenge.objectif).toBe('$3,000')
    expect(modelOf('Phidias Propfirm', '50k', 'Fundamental / Swing').challenge.objectif).toBe('$4,000')
  })

  it('Phidias : E2L indisponible en 100k, Fundamental indisponible en 25k → null', () => {
    expect(modelOf('Phidias Propfirm', '100k', 'Static / E2L').challenge.objectif).toBeNull()
    expect(modelOf('Phidias Propfirm', '25k', 'Fundamental / Swing').challenge.objectif).toBeNull()
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
