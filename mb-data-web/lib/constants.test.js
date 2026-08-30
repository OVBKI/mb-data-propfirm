import { describe, it, expect } from 'vitest'
import {
  PROPFIRM_RULES,
  FIRM_SUGGESTIONS,
  GENERIC_PLANS,
  planSizeNum,
  plansForFirm,
  maxDrawdown,
  isTrailingDD,
  defaultDdType,
  accountLabel,
  profitTarget,
  defaultPayoutTarget,
  defaultMinTradingDays,
  defaultProfitSplit,
  defaultMinDailyProfit,
  defaultChallengePrice,
} from './constants'

describe('planSizeNum', () => {
  it('converts plan strings to dollar amounts', () => {
    expect(planSizeNum('50k')).toBe(50000)
    expect(planSizeNum('100k')).toBe(100000)
    expect(planSizeNum('300k')).toBe(300000)
  })

  it('is case insensitive on the k suffix', () => {
    expect(planSizeNum('25K')).toBe(25000)
  })

  it('falls back to 50000 for null/empty/non-numeric input', () => {
    expect(planSizeNum(null)).toBe(50000)
    expect(planSizeNum(undefined)).toBe(50000)
    expect(planSizeNum('')).toBe(50000)
    expect(planSizeNum('abc')).toBe(50000)
  })

  it('always returns a multiple of 1000', () => {
    for (const p of GENERIC_PLANS) {
      expect(planSizeNum(p) % 1000).toBe(0)
    }
  })
})

describe('plansForFirm', () => {
  it('returns the firm plans for a known firm', () => {
    expect(plansForFirm('Topstep')).toEqual(['50k', '100k', '150k'])
  })

  it('returns a non-empty array of plan-size strings for every known firm', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      const plans = plansForFirm(firm)
      expect(Array.isArray(plans)).toBe(true)
      expect(plans.length).toBeGreaterThan(0)
      for (const p of plans) {
        expect(typeof p).toBe('string')
        expect(p).toMatch(/^\d+k$/)
      }
    }
  })

  it('falls back to GENERIC_PLANS for an unknown firm', () => {
    expect(plansForFirm('Definitely Not A Firm')).toBe(GENERIC_PLANS)
  })

  it('matches the plans declared in PROPFIRM_RULES', () => {
    expect(plansForFirm('Apex Trader Funding')).toEqual(
      PROPFIRM_RULES['Apex Trader Funding'].plans
    )
  })
})

describe('maxDrawdown', () => {
  it('extracts the numeric max drawdown for known firm + plan', () => {
    expect(maxDrawdown('Topstep', '50k')).toBe(2000)
    // Apex 4.0 (mars 2026) : $1,000 en 25K. L'ancienne échelle ($1,500) reste
    // celle des comptes legacy — voir le test « programme » plus bas.
    expect(maxDrawdown('Apex Trader Funding', '25k')).toBe(1000)
    expect(maxDrawdown('Bulenox', '50k')).toBe(2500)
  })

  it('returns null for unknown firm', () => {
    expect(maxDrawdown('Nope', '50k')).toBeNull()
  })

  it('returns null when the plan does not exist for the firm', () => {
    expect(maxDrawdown('Topstep', '999k')).toBeNull()
  })

  it('returns null when plan is missing', () => {
    expect(maxDrawdown('Topstep', null)).toBeNull()
  })

  // Ce test tolérait auparavant un null (« some firms may not expose a matching
  // DD key »). C'est précisément ce qui a laissé passer le trou : les clés par
  // PROGRAMME (« Drawdown Select (EOD) », « Drawdown PRO+ »…) ne matchaient
  // aucun motif, et maxDrawdown rendait null pour Tradeify, Take Profit Trader,
  // My Funded Futures et Phidias. Or la jauge de drawdown, l'alerte Drawdown
  // Guardian et le pré-remplissage du wizard en dépendent tous : un null n'est
  // pas une donnée manquante bénigne, c'est une fonctionnalité éteinte.
  it('rend un montant positif pour CHAQUE firme et CHAQUE plan', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      for (const plan of plansForFirm(firm)) {
        const dd = maxDrawdown(firm, plan)
        expect(dd, `${firm} ${plan}`).toBeTypeOf('number')
        expect(dd, `${firm} ${plan}`).toBeGreaterThan(0)
      }
    }
  })

  it('rend le montant du PROGRAMME demandé, pas celui du programme par défaut', () => {
    // Le cœur du sujet : un compte Apex acheté avant mars 2026 tourne encore
    // sous l'ancienne échelle. Servir le chiffre 4.0 à son porteur donnerait une
    // jauge fausse de 25 à 50 %.
    expect(maxDrawdown('Apex Trader Funding', '25k', 'EOD')).toBe(1000)
    expect(maxDrawdown('Apex Trader Funding', '25k', 'Legacy')).toBe(1500)
    expect(maxDrawdown('Apex Trader Funding', '150k', 'Intraday')).toBe(4000)
    expect(maxDrawdown('Apex Trader Funding', '150k', 'Legacy')).toBe(5000)
    // FundedNext : quatre programmes, deux échelles de drawdown.
    expect(maxDrawdown('FundedNext Futures', '50k', 'Flex')).toBe(1500)
    expect(maxDrawdown('FundedNext Futures', '50k', 'Legacy')).toBe(2000)
  })

  it('rend null pour un programme ABSENT à cette taille, jamais la valeur globale', () => {
    // Flex n'existe pas en 25K, et les 75K/250K/300K d'Apex sont legacy-only.
    expect(maxDrawdown('FundedNext Futures', '25k', 'Flex')).toBeNull()
    expect(maxDrawdown('Apex Trader Funding', '75k', 'EOD')).toBeNull()
    expect(maxDrawdown('Apex Trader Funding', '75k', 'Legacy')).toBe(2750)
  })

  it('le prix suit aussi le programme', () => {
    expect(defaultChallengePrice('Apex Trader Funding', '50k', 'EOD')).toBe(490)
    expect(defaultChallengePrice('Apex Trader Funding', '50k', 'Intraday')).toBe(249)
    expect(defaultChallengePrice('FundedNext Futures', '50k', 'Flex')).toBe(69)
    expect(defaultChallengePrice('FundedNext Futures', '50k', 'Legacy')).toBe(199)
  })

  it('lit les clés par PROGRAMME des firmes multi-offres', () => {
    expect(maxDrawdown('Tradeify', '50k')).toBe(2000)
    expect(maxDrawdown('Take Profit Trader', '50k')).toBe(2000)
    expect(maxDrawdown('Phidias Propfirm', '100k')).toBe(3000)
  })

  it('choisit le programme dont le TYPE correspond à defaultDdType', () => {
    // My Funded Futures a deux programmes : Rapid en intraday ($2,000 en 50K) et
    // Core/Pro en EOD ($1,500). defaultDdType annonce 'eod' — le montant doit
    // suivre, sinon la jauge affiche « EOD » au-dessus d'un chiffre intraday.
    expect(defaultDdType('My Funded Futures')).toBe('eod')
    expect(maxDrawdown('My Funded Futures', '50k')).toBe(1500)
    // En 25K, Core/Pro n'existe pas ('n/a') : on retombe sur Rapid, seule offre
    // à cette taille.
    expect(maxDrawdown('My Funded Futures', '25k')).toBe(1000)
  })

  it('ne confond jamais un drawdown max avec une perte JOURNALIÈRE', () => {
    // Une DLL vaut trois à cinq fois moins ; la prendre rendrait toutes les
    // jauges de risque absurdement serrées.
    for (const firm of FIRM_SUGGESTIONS) {
      for (const plan of plansForFirm(firm)) {
        expect(maxDrawdown(firm, plan), `${firm} ${plan}`).toBeGreaterThanOrEqual(500)
      }
    }
  })
})

describe('isTrailingDD', () => {
  it('is false for EOD-only firms like Topstep', () => {
    expect(isTrailingDD('Topstep')).toBe(false)
  })

  it('is true for firms whose rules mention a trailing drawdown', () => {
    expect(isTrailingDD('Apex Trader Funding')).toBe(true)
    expect(isTrailingDD('Bulenox')).toBe(true)
    expect(isTrailingDD('Lucid Trading')).toBe(true)
  })

  it('is false for an unknown firm', () => {
    expect(isTrailingDD('Nope')).toBe(false)
  })

  it('always returns a boolean', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      expect(typeof isTrailingDD(firm)).toBe('boolean')
    }
  })
})

describe('defaultDdType', () => {
  it('classifies known firms by their confirmed default DD type', () => {
    expect(defaultDdType('Topstep')).toBe('eod')
    expect(defaultDdType('Apex Trader Funding')).toBe('eod')
    expect(defaultDdType('Bulenox')).toBe('trailing')
    expect(defaultDdType('Lucid Trading')).toBe('eod')
    expect(defaultDdType('Phidias Propfirm')).toBe('eod')
  })

  it('returns static for an unknown firm with no trailing rule', () => {
    expect(defaultDdType('Nope')).toBe('static')
  })

  it('always returns one of static|eod|trailing', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      expect(['static', 'eod', 'trailing']).toContain(defaultDdType(firm))
    }
  })
})

describe('accountLabel', () => {
  it('uses a trimmed custom name when present', () => {
    expect(accountLabel({ name: 'Big' })).toBe('Big')
    expect(accountLabel({ name: '  Padded  ' })).toBe('Padded')
  })

  it('falls back to the buy date when name is blank', () => {
    expect(accountLabel({ name: '  ', buy_date: '2026-01-01' })).toBe('Compte du 2026-01-01')
    expect(accountLabel({ buy_date: '2026-06-01' })).toBe('Compte du 2026-06-01')
  })

  it('returns empty string for null/undefined account', () => {
    expect(accountLabel(null)).toBe('')
    expect(accountLabel(undefined)).toBe('')
  })
})

describe('profitTarget', () => {
  it('extracts the numeric profit target for known firm + plan', () => {
    expect(profitTarget('Topstep', '50k')).toBe(3000)
    expect(profitTarget('Apex Trader Funding', '25k')).toBe(1500)
  })

  it('returns null for unknown firm', () => {
    expect(profitTarget('Nope', '50k')).toBeNull()
  })

  it('returns null when plan is missing', () => {
    expect(profitTarget('Topstep', null)).toBeNull()
  })
})

describe('defaultPayoutTarget', () => {
  it('returns planSizeNum + profit target', () => {
    expect(defaultPayoutTarget('Topstep', '50k')).toBe(53000)
    expect(defaultPayoutTarget('Apex Trader Funding', '25k')).toBe(26500)
  })

  it('equals plan size plus the profit target where the target exists', () => {
    const t = profitTarget('Bulenox', '50k')
    if (t !== null) {
      expect(defaultPayoutTarget('Bulenox', '50k')).toBe(50000 + t)
    }
  })

  it('returns null when there is no profit target', () => {
    expect(defaultPayoutTarget('Nope', '50k')).toBeNull()
  })
})

describe('defaultMinTradingDays', () => {
  it('returns the numeric min trading days for firms that declare it', () => {
    expect(defaultMinTradingDays('Apex Trader Funding', '25k')).toBe(0)
    expect(defaultMinTradingDays('Bulenox', '25k')).toBe(0)
  })

  it('lit les clés nommées en ANGLAIS, et ignore les montants en dollars', () => {
    // Topstep écrit « Min trading days (XFA Standard) », pas « Jours de trading
    // min ». Et sa valeur est « 5 winning days ≥ $150 net profit » : chercher le
    // premier montant y aurait trouvé 150 JOURS.
    expect(defaultMinTradingDays('Topstep', '50k')).toBe(5)
  })

  it('returns null for unknown firm', () => {
    expect(defaultMinTradingDays('Nope', '50k')).toBeNull()
  })

  it('returns a non-negative number or null for every firm', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      const plan = plansForFirm(firm)[0]
      const d = defaultMinTradingDays(firm, plan)
      if (d !== null) {
        expect(d).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

describe('defaultProfitSplit', () => {
  it('returns the trader split percentage', () => {
    expect(defaultProfitSplit('Topstep', '50k')).toBe(90)
    expect(defaultProfitSplit('Apex Trader Funding', '25k')).toBe(100)
    expect(defaultProfitSplit('Bulenox', '25k')).toBe(100)
  })

  it('returns null for unknown firm', () => {
    expect(defaultProfitSplit('Nope', '50k')).toBeNull()
  })

  it('returns a percentage between 1 and 100 or null', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      const plan = plansForFirm(firm)[0]
      const s = defaultProfitSplit(firm, plan)
      if (s !== null) {
        expect(s).toBeGreaterThanOrEqual(1)
        expect(s).toBeLessThanOrEqual(100)
      }
    }
  })
})

describe('defaultMinDailyProfit', () => {
  it('extracts the min daily profit dollar amount where present', () => {
    expect(defaultMinDailyProfit('Topstep', '50k')).toBe(150)
  })

  it('returns 0 when the matched rule has a literal $0', () => {
    expect(defaultMinDailyProfit('Bulenox', '25k')).toBe(0)
  })

  it('returns null when no matching rule/value exists', () => {
    expect(defaultMinDailyProfit('Nope', '50k')).toBeNull()
  })

  it('lit le profit min quotidien d’Apex (tableau officiel EOD Payouts)', () => {
    // La clé s'appelait « Qualifying days/payout » : aucun motif ne la trouvait,
    // donc Apex n'avait pas de profit min quotidien alors que la donnée existait.
    // Ce chiffre décide si une journée COMPTE dans les 5 jours qualifiants.
    expect(defaultMinDailyProfit('Apex Trader Funding', '25k')).toBe(100)
    expect(defaultMinDailyProfit('Apex Trader Funding', '50k')).toBe(250)
    expect(defaultMinDailyProfit('Apex Trader Funding', '100k')).toBe(300)
    expect(defaultMinDailyProfit('Apex Trader Funding', '150k')).toBe(350)
  })
})

describe('defaultChallengePrice', () => {
  it('extracts the first dollar price for known firm + plan', () => {
    expect(defaultChallengePrice('Topstep', '50k')).toBe(49)
    expect(defaultChallengePrice('Apex Trader Funding', '25k')).toBe(390)
    // Relevé sur bulenox.com/accounts-pricing en août 2026 : le 25K est à $145.
    expect(defaultChallengePrice('Bulenox', '25k')).toBe(145)
  })

  it('returns null for unknown firm', () => {
    expect(defaultChallengePrice('Nope', '50k')).toBeNull()
  })

  it('returns null when plan is missing', () => {
    expect(defaultChallengePrice('Topstep', null)).toBeNull()
  })

  it('returns a positive number or null for every firm first plan', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      const plan = plansForFirm(firm)[0]
      const price = defaultChallengePrice(firm, plan)
      if (price !== null) {
        expect(price).toBeGreaterThan(0)
      }
    }
  })
})

// ── Repli quand la firme ne différencie PAS ses programmes ───────────────────
describe('maxDrawdown — programme demandé mais donnée non différenciée', () => {
  it('rend la valeur globale plutôt que null', () => {
    // Topstep applique le même MLL à ses deux structures de payout. Rendre null
    // y aurait éteint la jauge de drawdown sur toute la firme.
    expect(maxDrawdown('Topstep', '50k', 'XFA Standard')).toBe(2000)
    expect(maxDrawdown('Topstep', '50k', 'XFA Consistency')).toBe(2000)
  })

  it('mais garde le null quand une cellule cible EXPLICITEMENT des programmes', () => {
    // Ici la donnée dit « Legacy : $2,750 » : EOD n'y figure pas parce qu'Apex ne
    // vend plus de 75K. Le repli ne doit pas servir le chiffre d'un autre.
    expect(maxDrawdown('Apex Trader Funding', '75k', 'EOD')).toBeNull()
    expect(maxDrawdown('Apex Trader Funding', '75k', 'Legacy')).toBe(2750)
  })
})

// ── Aucun trou dérivé sur les 52 couples (firme, taille) ────────────────────
// Ces trois valeurs ne sont pas décoratives :
//   • le SPLIT calcule le net d'un payout — un défaut à 90 % sur un compte à
//     80 % affiche 10 points de trop sur un vrai montant d'argent ;
//   • les JOURS MIN pilotent l'éligibilité au payout ;
//   • le PRIX pré-remplit le montant dépensé.
// Elles étaient absentes de 26, 17 et 5 couples respectivement, non parce que la
// donnée manquait, mais parce que les parseurs ne savaient pas la lire.
describe('valeurs dérivées — couverture complète du catalogue', () => {
  it('rend un profit split pour CHAQUE firme et CHAQUE taille', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      for (const plan of plansForFirm(firm)) {
        const v = defaultProfitSplit(firm, plan)
        expect(v, `${firm} ${plan}`).toBeTypeOf('number')
        expect(v, `${firm} ${plan}`).toBeGreaterThanOrEqual(50)
        expect(v, `${firm} ${plan}`).toBeLessThanOrEqual(100)
      }
    }
  })

  it('rend des jours minimum et un prix pour chaque couple', () => {
    for (const firm of FIRM_SUGGESTIONS) {
      for (const plan of plansForFirm(firm)) {
        expect(defaultMinTradingDays(firm, plan), `jours ${firm} ${plan}`).toBeTypeOf('number')
        expect(defaultChallengePrice(firm, plan), `prix ${firm} ${plan}`).toBeTypeOf('number')
      }
    }
  })

  it('résout la sentinelle « idem » vers la taille inférieure', () => {
    // Bulenox écrit son split une fois en 25K puis « idem » partout ensuite.
    // futuresComparison résolvait déjà la sentinelle, pas les helpers d'ici.
    expect(defaultProfitSplit('Bulenox', '25k')).toBe(100)
    expect(defaultProfitSplit('Bulenox', '250k')).toBe(100)
  })

  it('lit la notation 90/10 autant que « 90 % »', () => {
    // Take Profit Trader n'écrit jamais de pourcentage : « PRO : 80/20 → PRO+ :
    // 90/10 ». La part du trader vient en premier, c'est la convention du secteur.
    expect(defaultProfitSplit('Take Profit Trader', '100k')).toBe(80)
    expect(defaultProfitSplit('Take Profit Trader', '100k', 'PRO+')).toBe(90)
  })
})

// ── Apex : les trois programmes ne partagent PAS leurs chiffres ──────────────
// Vérifié sur le PDF officiel du help center (EOD, Intraday, Legacy), août 2026.
describe('Apex — divergences entre programmes', () => {
  it('le profit min quotidien diffère entre EOD et Intraday', () => {
    // Confondre les deux fait compter des journées qui ne qualifient pas.
    expect(defaultMinDailyProfit('Apex Trader Funding', '50k', 'EOD')).toBe(250)
    expect(defaultMinDailyProfit('Apex Trader Funding', '50k', 'Intraday')).toBe(200)
    expect(defaultMinDailyProfit('Apex Trader Funding', '150k', 'EOD')).toBe(350)
    expect(defaultMinDailyProfit('Apex Trader Funding', '150k', 'Intraday')).toBe(300)
  })

  it('Legacy exige 7 jours de trading, les offres 4.0 aucun', () => {
    expect(defaultMinTradingDays('Apex Trader Funding', '50k', 'EOD')).toBe(0)
    expect(defaultMinTradingDays('Apex Trader Funding', '50k', 'Legacy')).toBe(7)
  })

  it('l’échelle Legacy des drawdowns est confirmée par la doc officielle', () => {
    // « Legacy Trailing Max Drawdown by Plan and Contract Size ».
    const legacy = { '25k': 1500, '50k': 2500, '75k': 2750, '100k': 3000, '150k': 5000, '250k': 6500, '300k': 7500 }
    for (const [plan, dd] of Object.entries(legacy)) {
      expect(maxDrawdown('Apex Trader Funding', plan, 'Legacy'), plan).toBe(dd)
    }
  })
})

// ── Lucid : les valeurs servies au compte d'un utilisateur ──────────────────
// Relevées sur le PDF officiel du checkout (août 2026).
describe('Lucid Trading — helpers par programme', () => {
  const PLANS = ['25k', '50k', '100k', '150k']

  it('sert le drawdown du bon programme', () => {
    expect(PLANS.map(p => maxDrawdown('Lucid Trading', p, 'LucidPro'))).toEqual([1000, 2000, 3000, 4500])
    expect(PLANS.map(p => maxDrawdown('Lucid Trading', p, 'LucidDaily'))).toEqual([1000, 2000, 3000, 4500])
    // Direct diverge sur les deux plus grosses tailles — c'est précisément là
    // qu'une valeur héritée de LucidPro serait la plus coûteuse.
    expect(PLANS.map(p => maxDrawdown('Lucid Trading', p, 'LucidDirect'))).toEqual([1000, 2000, 3500, 5000])
  })

  it('donne le profit minimum quotidien de LucidFlex, et rien aux autres', () => {
    expect(PLANS.map(p => defaultMinDailyProfit('Lucid Trading', p, 'LucidFlex'))).toEqual([100, 150, 200, 250])
    expect(defaultMinDailyProfit('Lucid Trading', '150k', 'LucidPro')).toBeNull()
  })

  it('a un prix et un split sur les quatre programmes', () => {
    for (const program of ['LucidPro', 'LucidFlex', 'LucidDaily', 'LucidDirect']) {
      for (const plan of PLANS) {
        expect(defaultChallengePrice('Lucid Trading', plan, program), `${program} ${plan}`).toBeGreaterThan(0)
        expect(defaultProfitSplit('Lucid Trading', plan, program)).toBe(90)
      }
    }
  })

  it('ne donne aucun objectif de profit à LucidDirect', () => {
    expect(profitTarget('Lucid Trading', '100k', 'LucidDirect')).toBeNull()
    expect(profitTarget('Lucid Trading', '100k', 'LucidPro')).toBe(6000)
  })
})
