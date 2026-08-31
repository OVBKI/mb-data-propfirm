import { describe, it, expect } from 'vitest'
import { extractModelSegment } from './programSegment'
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
    // defaultDdType annonce 'eod' — le montant doit suivre, sinon la jauge
    // affiche « EOD » au-dessus d'un chiffre intraday.
    //
    // ⚠️ Ce test attendait 1500, la valeur de CORE. Core et Pro partageaient une
    // seule clé, avec le chiffre de Core en 50K ; les articles officiels donnent
    // $2,000 au Pro à cette taille. Les clés sont désormais séparées, et Core
    // n'existe plus qu'en legacy — c'est le Pro qui doit sortir ici.
    expect(defaultDdType('My Funded Futures')).toBe('eod')
    expect(maxDrawdown('My Funded Futures', '50k')).toBe(2000)
    // En 25K, ni Pro ni Core n'existent ('n/a') : on retombe sur Rapid, seule
    // offre EOD à cette taille.
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

// ── Tradeify Elite Live — la cagnotte dépend de la TAILLE, pas du programme ──
// Note de version « Tradeify 3.0 » (7 avril 2026). Le catalogue attribuait les
// $12,000 au seul « Lightning 150K » et laissait « bonus proportionnel » en 50K
// et 100K : deux tailles sur quatre sans chiffre, et une fausse exclusivité.
describe('Tradeify — Elite Reward Pool', () => {
  const r = key => PROPFIRM_RULES['Tradeify'].rules[key]
  const num = v => Number(String(v).match(/\$([\d,]+)/)[1].replace(/,/g, ''))

  it('donne une dotation à chacune des quatre tailles', () => {
    const pool = r('Elite Reward Pool')
    expect(['25k', '50k', '100k', '150k'].map(p => num(pool[p]))).toEqual([2000, 4000, 8000, 12000])
  })

  it('applique exactement +50 % avec le multiplicateur Select', () => {
    const base = r('Elite Reward Pool')
    const boost = r('Elite Reward Pool ×1,5')
    for (const p of ['25k', '50k', '100k', '150k']) {
      expect(num(boost[p]), p).toBe(num(base[p]) * 1.5)
    }
  })

  it('rappelle que le multiplicateur est RÉSERVÉ à Select et sous conditions', () => {
    const c = r('Elite Reward Pool ×1,5')['25k']
    expect(c).toMatch(/Select/)
    expect(c).toMatch(/40%/)   // score de consistance sous 40 %
    expect(c).toMatch(/75%/)   // jamais dépassé 75 % du drawdown max
  })

  // Le profit de fin de mois exigé est le DRAWDOWN TRAILING de la taille — pas
  // un montant arbitraire. Le test le recalcule plutôt que de le figer.
  it('exige un profit de fin de mois égal au drawdown trailing', () => {
    const cond = r('Elite Live — conditions du mois')
    // ⚠️ Viser le montant qui suit « supérieur à » : la cellule contient AUSSI
    // le seuil de $250 par journée, et prendre le premier « $ » venu lisait 250.
    const finDeMois = txt => Number(String(txt).match(/supérieur à \$([\d,]+)/)[1].replace(/,/g, ''))
    for (const plan of ['25k', '50k', '100k', '150k']) {
      // Le montant n'est pas arbitraire : c'est le drawdown trailing de la taille.
      expect(finDeMois(cond[plan]), plan).toBe(maxDrawdown('Tradeify', plan, 'Select Flex'))
    }
  })

  it('fixe le seuil de journée profitable à $250 sur toutes les tailles', () => {
    const cond = r('Elite Live — conditions du mois')
    for (const plan of ['25k', '50k', '100k', '150k']) {
      expect(String(cond[plan]), plan).toMatch(/\$250/)
    }
  })
})

// ── Tradeify : le chemin vers Elite Live ────────────────────────────────────
// Article « Introducing the New Select Plan & Changes to the Live Program »
// (31 mars 2026). Le catalogue décrivait la cagnotte Elite sans dire comment on
// y accède — or c'est là que se joue le passage au capital réel.
describe('Tradeify — accès à Elite Live', () => {
  const r = key => PROPFIRM_RULES['Tradeify'].rules[key]['25k']

  it('documente les 5 payouts, les 5 comptes live et l’absence de limite de transitions', () => {
    const v = r('Passage en Elite Live')
    expect(v).toMatch(/5 payouts/)
    expect(v).toMatch(/5 comptes live/)
    expect(v).toMatch(/aucune limite/i)
  })

  it('dit qu’un compte Elite Live n’a NI plafond de profit sim NI perte journalière', () => {
    expect(r('Elite Live — plafond de profit sim')).toMatch(/AUCUN/)
    expect(r('Elite Live — perte journalière')).toMatch(/AUCUNE/)
  })

  // ⚠️ Les comptes anciens ne sont pas migrés d'office : le trader CHOISIT.
  // Leur servir les règles du nouveau programme serait faux — ils gardent le
  // plafond de $100,000 et un seul compte live s'ils restent sur l'ancien.
  it('garde l’ancien programme comme une OPTION pour les comptes antérieurs', () => {
    const v = r('Ancien programme Live')
    expect(v).toMatch(/CHOISIT|choisit/)
    expect(v).toMatch(/\$100,000/)
    expect(v).toMatch(/4 payouts/)
  })
})

// ── Tradeify : les cinq articles « Rules: » ─────────────────────────────────
// Daily Loss Limit, Trailing Max Drawdowns, Hedging & Correlated Products,
// News Trading, Permitted Times to Trade. Ce sont les règles qui font PERDRE
// un compte ou BLOQUER un payout — celles qu'une fiche approximative rend
// dangereuse.
describe('Tradeify — Daily Loss Limit', () => {
  const r = (key, plan = '25k') => PROPFIRM_RULES['Tradeify'].rules[key][plan]

  // La table officielle, recopiée case par case. Lightning et Growth divergent
  // à partir du 100K, et Lightning n'existe pas en 25K.
  it('stocke les montants de départ publiés', () => {
    expect(r('DLL Growth', '25k')).toMatch(/\$600/)
    expect(r('DLL Growth', '150k')).toMatch(/\$3,750/)
    expect(r('DLL Lightning', '25k')).toMatch(/AUCUN/)
    expect(r('DLL Lightning', '150k')).toMatch(/\$3,000/)
    expect(r('DLL Select Daily', '100k')).toBe('$1,250')
    for (const p of ['25k', '50k', '100k', '150k']) {
      expect(r('DLL Select Flex', p), p).toBe('AUCUN')
    }
  })

  // Le seuil ne reste pas fixe : à +6% il s'aligne sur le drawdown. Servir le
  // montant de départ à un trader déjà en profit le sous-estime d'un facteur 2.
  it('donne la hausse à +6% avec son solde déclencheur, par programme', () => {
    expect(r('DLL — hausse à +6% de profit', '50k')).toMatch(/\$53,000/)
    expect(r('DLL — hausse à +6% de profit', '100k')).toMatch(/\$106,000/)
    expect(r('DLL — hausse à +6% de profit', '150k')).toMatch(/\$159,000/)
    // Divergence Growth / Lightning au 100K : $3,500 contre $4,000.
    const cent = r('DLL — hausse à +6% de profit', '100k')
    expect(extractModelSegment(cent, 'Growth')).toMatch(/\$3,500/)
    expect(extractModelSegment(cent, 'Lightning')).toMatch(/\$4,000/)
  })

  it('précise que la hausse prend effet à la session SUIVANTE', () => {
    expect(r("DLL — quand la hausse s'applique")).toMatch(/SUIVANTE/)
    expect(r("DLL — quand la hausse s'applique")).toMatch(/18h00 ET/)
  })

  // ⚠️ Un compte legacy n'a pas une DLL plus grande : il n'en a PLUS.
  it('distingue les comptes legacy — DLL supprimée, pas relevée', () => {
    const v = r('DLL — comptes legacy')
    expect(v).toMatch(/12 sept\. 2025/)
    expect(v).toMatch(/SUPPRIMÉE/)
  })

  it('rappelle la remise à zéro à 18h00 ET et l’effet de soft breach', () => {
    expect(r('DLL — réinitialisation')).toMatch(/18h00 ET/)
    expect(r('DLL — effet quand elle tombe')).toMatch(/PAUSE|pause/)
    expect(r('DLL — effet quand elle tombe')).toMatch(/reste actif/)
  })

  // L'avertissement que Tradeify répète dans deux articles distincts.
  it('interdit explicitement de s’en servir comme stop loss', () => {
    expect(r('DLL — avertissement')).toMatch(/JAMAIS/)
    expect(r('DLL — avertissement')).toMatch(/stop loss/i)
    expect(r('DLL contre drawdown max')).toMatch(/PREMIER|premier/)
  })

  it('limite la DLL aux trois familles qui en ont une', () => {
    const v = r('DLL — portée')
    expect(v).toMatch(/Growth/)
    expect(v).toMatch(/Lightning/)
    expect(v).toMatch(/Select Daily/)
    expect(v).toMatch(/Select Flex n'a aucune DLL/)
  })
})

// ── Tradeify : verrouillage du drawdown ─────────────────────────────────────
// Deux chiffres que l'ancienne fiche confondait : le solde qui DÉCLENCHE le
// verrou, et le plancher obtenu ensuite.
describe('Tradeify — verrouillage du drawdown', () => {
  const r = (key, plan = '25k') => PROPFIRM_RULES['Tradeify'].rules[key][plan]

  it('sépare le seuil déclencheur du plancher résultant', () => {
    expect(r('Lock drawdown', '50k')).toMatch(/\$50,100/)
    expect(r('Seuil de verrouillage', '50k')).toMatch(/\$52,100/)
  })

  // La formule officielle : solde initial + drawdown + $100. Elle se vérifie
  // sur les programmes dont le drawdown financé est publié.
  it('respecte la formule solde initial + drawdown + $100', () => {
    const seuils = r('Seuil de verrouillage', '100k')
    const cash = s => Number(String(s).replace(/[^0-9]/g, ''))
    expect(cash(extractModelSegment(seuils, 'Growth'))).toBe(100000 + 3500 + 100)
    expect(cash(extractModelSegment(seuils, 'Lightning'))).toBe(100000 + 4000 + 100)
  })

  it('ne verrouille QUE les comptes financés, jamais une évaluation', () => {
    const v = r('Verrouillage — portée')
    expect(v).toMatch(/SIM FUNDED/)
    expect(v).toMatch(/JAMAIS/)
  })

  it('donne les deux déclencheurs — solde de clôture OU demande de payout', () => {
    const v = r('Verrouillage — déclencheurs')
    expect(v).toMatch(/PAYOUT/)
    expect(v).toMatch(/clôture/)
  })

  // Le seuil se mesure sur la NET LIQUIDATION VALUE : une position ouverte en
  // perte casse le compte avant d'être fermée.
  it('dit que le latent compte et que l’application est temps réel', () => {
    const v = r('Drawdown — ce qui est mesuré')
    expect(v).toMatch(/NET LIQUIDATION VALUE/)
    expect(v).toMatch(/LATENT/)
    expect(v).toMatch(/TEMPS RÉEL|EN TEMPS RÉEL/)
  })
})

// ── Tradeify : hedging ──────────────────────────────────────────────────────
// La règle la plus coûteuse du catalogue — elle confisque des profits déjà
// gagnés et peut valoir un bannissement.
describe('Tradeify — hedging et produits corrélés', () => {
  const r = key => PROPFIRM_RULES['Tradeify'].rules[key]['25k']

  it('interdit le hedge sur les trois types de comptes', () => {
    const v = r('Hedging')
    expect(v).toMatch(/INTERDIT/)
    expect(v).toMatch(/évaluation/i)
    expect(v).toMatch(/Elite Live/)
  })

  // Les huit groupes officiels. Un trader qui croit ES et NQ indépendants perd
  // son compte sur son deuxième trade.
  it('recopie les huit groupes de produits', () => {
    const v = r('Hedging — groupes de produits')
    for (const g of ['Indices actions', 'Énergie', 'Métaux', 'Devises',
                     'Taux', 'Céréales', 'Bétail', 'Volatilité']) {
      expect(v, g).toMatch(new RegExp(g))
    }
    // ES et NQ dans le MÊME groupe : c'est tout l'intérêt de la table.
    expect(v).toMatch(/ES, MES, NQ, MNQ/)
    expect(v).toMatch(/FVS/)
  })

  // ⚠️ Cette cellule ne doit contenir AUCUN « · ». Une parenthèse en majuscules
  // après ce séparateur ferait croire au parseur qu'il lit un ciblage de
  // programme, et la cellule s'annulerait pour tous les modèles.
  it('n’utilise pas le séparateur de programme dans la table des groupes', () => {
    const v = r('Hedging — groupes de produits')
    expect(v).not.toContain('·')
    expect(extractModelSegment(v, 'Select Daily')).toBe(v)
  })

  it('étend la règle à TOUS les comptes du trader', () => {
    const v = r('Hedging — entre comptes')
    expect(v).toMatch(/TOUS les comptes/)
    expect(v).toMatch(/copy trading/)
    // La taille du contrat n'exempte de rien.
    expect(v).toMatch(/MES/)
  })

  // Les trois conditions cumulatives de la détection automatique.
  it('donne les trois seuils de la détection automatique', () => {
    const v = r('Hedging — détection automatique')
    expect(v).toMatch(/TROIS/)
    expect(v).toMatch(/10 secondes/)
    expect(v).toMatch(/\$150/)
  })

  it('énumère les conséquences, confiscation des profits comprise', () => {
    const v = r('Hedging — conséquences')
    expect(v).toMatch(/confiscation/i)
    expect(v).toMatch(/bannissement/i)
    expect(v).toMatch(/TOUS les comptes/)
  })

  // Levée de l'ancienne interdiction : minis et micros peuvent coexister.
  it('autorise minis et micros ensemble, sans lever l’interdit de hedge', () => {
    const v = r('Minis et micros ensemble')
    expect(v).toMatch(/Autorisé/)
    expect(v).toMatch(/10 micros = 1 mini/)
    expect(v).toMatch(/hedge interdit/)
  })
})

// ── Tradeify : horaires et microscalping ────────────────────────────────────
describe('Tradeify — horaires permis et microscalping', () => {
  const r = key => PROPFIRM_RULES['Tradeify'].rules[key]['25k']

  it('donne les heures de marché et la coupure de maintenance', () => {
    const v = r('Heures de marché')
    expect(v).toMatch(/18h00 ET/)
    expect(v).toMatch(/17h00 ET/)
    expect(v).toMatch(/maintenance/i)
  })

  it('donne les deux heures de clôture obligatoire', () => {
    const v = r('Heure de clôture obligatoire')
    expect(v).toMatch(/16h45 ET/)
    expect(v).toMatch(/12h59 ET/)   // jours fériés écourtés
  })

  // ⚠️ Un « INTERDIT » sec sur l'overnight était FAUX : la session dure près de
  // 23 heures et on peut y rester positionné du soir au lendemain après-midi.
  it('nuance l’overnight — interdit entre sessions, permis dans une session', () => {
    const v = r('Positions overnight')
    expect(v).toMatch(/23 heures/)
    expect(v).toMatch(/swing/i)
    expect(v).not.toMatch(/^INTERDIT/)
  })

  // Rassurant et rarement dit : l'auto-close ne casse pas le compte.
  it('dit que la fermeture d’office ne fait PAS échouer le compte', () => {
    const v = r('Position ouverte à la clôture')
    expect(v).toMatch(/automatiquement/)
    expect(v).toMatch(/PAS échouer/)
  })

  // Décisif pour compter les journées exigées avant un payout.
  it('définit la journée de trading de 18h00 à 17h00 le lendemain', () => {
    const v = r('Définition du jour de trading')
    expect(v).toMatch(/DEUX journées/)
    expect(v).toMatch(/1h du matin/)
  })

  it('signale le décalage Rithmic des demi-journées fériées', () => {
    const v = r('Rithmic et demi-journées fériées')
    expect(v).toMatch(/Rithmic/)
    expect(v).toMatch(/lundi/)
  })

  it('laisse les news libres mais avertit du slippage', () => {
    const v = r('Trading des news')
    expect(v).toMatch(/sans aucune restriction/)
    expect(v).toMatch(/slippage/i)
  })

  // La règle qui bloque les PAYOUTS sans casser le compte, et qui n'existe
  // qu'en financé : un scalpeur passe l'évaluation sans jamais la voir venir.
  it('documente le microscalping — deux seuils de 50% et 10 secondes', () => {
    const v = r('Microscalping (financé)')
    expect(v).toMatch(/50%/)
    expect(v).toMatch(/10 secondes/)
    expect(v).toMatch(/payout/i)
    expect(v).toMatch(/Ne s'applique pas pendant l'évaluation/)
  })
})

// ── My Funded Futures : cinq articles du help center ────────────────────────
// « Traders Evaluation Simplified », « Consistency Rule at My FundedFutures »
// et les trois « Rapid Plan — A Comprehensive Look » (25K, 50K, 100K).
// Source de première main. Cette série corrige surtout des chiffres qui étaient
// faux DANS LE SENS GÉNÉREUX — le pire sens pour une règle de risque.
describe('My Funded Futures — jours de trading minimum', () => {
  const r = (key, plan = '25k') => PROPFIRM_RULES['My Funded Futures'].rules[key][plan]

  // ⚠️ « 1 jour minimum » partout laissait croire qu'atteindre l'objectif en une
  // séance suffisait. Seul Builder est à 1 jour.
  it('distingue Builder (1 jour) de Rapid et Pro (2 jours)', () => {
    const v = r('Jours de trading min (eval)', '50k')
    expect(extractModelSegment(v, 'Builder')).toMatch(/1 jour/)
    expect(extractModelSegment(v, 'Rapid')).toMatch(/2 jours/)
    expect(extractModelSegment(v, 'Pro')).toMatch(/2 jours/)
  })

  it('donne au Rapid EOD ses 4 journées, le maximum de la firme', () => {
    expect(extractModelSegment(r('Jours de trading min (eval)', '50k'), 'Rapid EOD'))
      .toMatch(/4 jours/)
  })

  it('garde les 2 jours du Rapid à toutes les tailles', () => {
    for (const p of ['25k', '50k', '100k', '150k']) {
      expect(extractModelSegment(r('Jours de trading min (eval)', p), 'Rapid'), p)
        .toMatch(/2 jours/)
    }
  })
})

describe('My Funded Futures — cohérence', () => {
  const r = (key, plan = '25k') => PROPFIRM_RULES['My Funded Futures'].rules[key][plan]

  // ⚠️ L'article de cohérence nomme EXPLICITEMENT « Rapid & Pro » et personne
  // d'autre. Le tableau Builder porte « None ». Lui attribuer 50% inventait une
  // contrainte sur le seul plan qui n'en a pas.
  it('n’applique le 50% qu’à Rapid et Pro', () => {
    const v = r('Règle de cohérence (eval)', '50k')
    expect(extractModelSegment(v, 'Rapid')).toMatch(/50%/)
    expect(extractModelSegment(v, 'Pro')).toMatch(/50%/)
    expect(extractModelSegment(v, 'Builder')).toMatch(/AUCUNE/)
  })

  it('donne au Rapid EOD son seuil de 30%, le plus bas de la firme', () => {
    expect(extractModelSegment(r('Règle de cohérence (eval)', '50k'), 'Rapid EOD'))
      .toMatch(/30%/)
  })

  // Flex était marqué « non publié » tant qu'aucun de ses articles n'avait été
  // fourni. Les quatre guides Flex le donnent : 50%, en évaluation seulement,
  // et une évaluation qui se passe en 2 journées.
  it('donne au Flex son 50% d’évaluation, aux deux tailles', () => {
    expect(extractModelSegment(r('Règle de cohérence (eval)', '25k'), 'Flex')).toMatch(/50%/)
    expect(extractModelSegment(r('Règle de cohérence (eval)', '50k'), 'Flex')).toMatch(/50%/)
    expect(extractModelSegment(r('Jours de trading min (eval)', '25k'), 'Flex')).toMatch(/2 jours/)
  })

  // La nuance qui change tout : dépasser ne casse rien.
  it('dit que dépasser le seuil ne breach PAS le compte', () => {
    const v = r('Cohérence — si dépassée')
    expect(v).toMatch(/ne breach PAS/)
    expect(v).toMatch(/journées supplémentaires/)
  })

  it('donne le calcul et disparaît en sim funded', () => {
    expect(r('Cohérence — le calcul')).toMatch(/divisé par 2/)
    expect(r('Cohérence — le calcul')).toMatch(/\$1,500/)
    expect(r('Cohérence en sim funded')).toMatch(/^AUCUNE/)
  })
})

// 🌟 Le Rapid ne change pas de MONTANT entre les deux phases, il change de
// MÉCANIQUE. Un trader qui croit son drawdown figé jusqu'à la clôture le
// découvre en pleine séance.
describe('My Funded Futures — le Rapid change de mécanique en financé', () => {
  const r = (key, plan = '25k') => PROPFIRM_RULES['My Funded Futures'].rules[key][plan]

  it('oppose l’EOD de l’évaluation à l’intraday du sim funded', () => {
    const v = r('Drawdown Rapid — éval contre financé')
    expect(v).toMatch(/ÉVALUATION/)
    expect(v).toMatch(/INTRADAY/)
    expect(v).toMatch(/\$25,100/)   // verrou d'évaluation = départ + $100
    expect(v).toMatch(/\$100\b/)    // verrou financé
  })

  // Conséquence jamais dite ailleurs : le compte financé démarre à ZÉRO, ce qui
  // explique un verrou à $100 et non à la taille du compte.
  it('dit que le compte sim funded démarre à $0', () => {
    const v = r('Solde de départ sim funded')
    expect(v).toMatch(/^\$0/)
    expect(v).toMatch(/PAS à la taille nominale/)
  })

  it('garde les montants de drawdown publiés, inchangés', () => {
    const dd = r('Drawdown Rapid (intraday)', '25k')
    expect(dd).toBe('$1,000')
    expect(r('Drawdown Rapid (intraday)', '50k')).toBe('$2,000')
    expect(r('Drawdown Rapid (intraday)', '100k')).toBe('$3,000')
  })

  // Le buffer suit la formule que l'article 25K énonce : max loss + $100.
  it('vérifie le buffer de payout contre le max loss d’évaluation', () => {
    // Le PREMIER montant de la cellule : la note « = max loss + $100 » en
    // contient un second, qu'un strip global recollerait au premier.
    const cash = s => Number(String(s).match(/\$([\d,]+)/)[1].replace(/,/g, ''))
    for (const [plan, dd] of [['25k', 1000], ['50k', 2000], ['100k', 3000]]) {
      expect(cash(r('Buffer payout (Rapid)', plan)), plan).toBe(dd + 100)
    }
  })

  it('documente le premier payout à 24 h et l’absence de cohérence pour retirer', () => {
    expect(r('Premier payout (Rapid)')).toMatch(/24 heures/)
    expect(r('Premier payout (Rapid)')).toMatch(/PREMIER trade/)
    expect(r('Cohérence pour retirer')).toMatch(/^AUCUNE/)
  })

  it('ajoute la règle d’inactivité de 7 jours calendaires', () => {
    expect(r('Règle d\'inactivité')).toMatch(/7 jours CALENDAIRES/)
  })
})

// ⚠️ Les limites de contrats étaient fausses à presque toutes les tailles, et
// toujours en annonçant PLUS que la réalité. Un trader qui suivait la fiche
// dépassait sa limite — ce qui peut breacher le compte.
describe('My Funded Futures — limites de contrats', () => {
  const r = (key, plan) => PROPFIRM_RULES['My Funded Futures'].rules[key][plan]
  const rapid = (key, plan) => extractModelSegment(r(key, plan), 'Rapid')

  it('corrige la grille Rapid sur les quatre tailles', () => {
    expect(rapid('Contrats max éval (mini)', '25k')).toBe('3')    // valait 2
    expect(rapid('Contrats max éval (mini)', '50k')).toBe('5')
    expect(rapid('Contrats max éval (mini)', '100k')).toBe('8')   // valait 10
    expect(rapid('Contrats max éval (mini)', '150k')).toBe('10')  // valait 15
  })

  it('donne au Pro sa propre grille, plus serrée que Rapid', () => {
    expect(extractModelSegment(r('Contrats max éval (mini)', '50k'), 'Pro')).toBe('3')
    expect(extractModelSegment(r('Contrats max éval (mini)', '100k'), 'Pro')).toBe('6')
    expect(extractModelSegment(r('Contrats max éval (mini)', '150k'), 'Pro')).toBe('9')
  })

  it('garde le rapport de 10 micros pour 1 mini', () => {
    for (const plan of ['25k', '50k', '100k', '150k']) {
      const mini = Number(rapid('Contrats max éval (mini)', plan))
      const micro = Number(rapid('Contrats max éval (micro)', plan))
      expect(micro, plan).toBe(mini * 10)
    }
  })

  // ⚠️ « étend en sim funded » était faux : la grille est IDENTIQUE.
  it('ne fait PAS grandir la limite en sim funded', () => {
    for (const plan of ['25k', '50k', '100k']) {
      const evalMini = rapid('Contrats max éval (mini)', plan)
      expect(rapid('Contrats sim funded', plan), plan)
        .toMatch(new RegExp(`^${evalMini} minis`))
    }
  })
})

describe('My Funded Futures — Builder et news', () => {
  const r = (key, plan = '25k') => PROPFIRM_RULES['My Funded Futures'].rules[key][plan]

  // ⚠️ Le Builder 25K EXISTE — la fiche le donnait « n/a ».
  it('fait exister le Builder 25K avec son max loss de $1,000', () => {
    expect(r('Drawdown Builder (buffer)', '25k')).toMatch(/\$1,000/)
    expect(r('Drawdown Builder (buffer)', '50k')).toMatch(/\$2,000/)
  })

  // ⚠️ Le type est EOD TRAILING, pas un buffer fixe — la fiche disait l'inverse.
  it('classe le Builder en EOD trailing', () => {
    expect(r('Drawdown Builder (buffer)', '25k')).toMatch(/EOD trailing/)
  })

  // ⚠️ Le « $1,500 lower-price » n'était pas un 50K moins cher : c'est l'Add-On,
  // plus SERRÉ pour le même objectif.
  it('sépare l’Add-On du Builder 50K standard', () => {
    const v = r('Drawdown Builder Add-On', '50k')
    expect(v).toMatch(/\$1,500/)
    expect(v).toMatch(/PLUS SERRÉ/)
  })

  // ⚠️ Le Builder 25K n'a AUCUNE DLL — la fiche lui prêtait celle du 50K.
  it('ne donne aucune DLL au Builder 25K, mais $1,000 au 50K', () => {
    expect(extractModelSegment(r('Daily Loss Limit', '25k'), 'Builder')).toMatch(/aucune/i)
    expect(extractModelSegment(r('Daily Loss Limit', '50k'), 'Builder')).toMatch(/\$1,000/)
  })

  // ⚠️ Une fenêtre de 2 minutes laisse croire qu'on peut trader entre deux
  // annonces. L'article Rapid interdit les news T1 sans aucune nuance.
  it('oppose les news T1 autorisées en éval et interdites en financé', () => {
    const v = r('News Tier-1 (Rapid/Pro)')
    expect(v).toMatch(/AUTORISÉES en évaluation/)
    expect(v).toMatch(/INTERDITES en sim funded/)
    expect(r('News T1 en évaluation')).toMatch(/AUTORISÉES/)
  })

  it('ajoute le plafond de 3 comptes 50K Flex avec son droit acquis', () => {
    const v = r('Plafond 50K Flex', '50k')
    expect(v).toMatch(/24 mars/)
    expect(v).toMatch(/3 comptes/)
    expect(v).toMatch(/droit acquis à 5/)
  })

  // Le plafond de comptes financés se contamine : un seul 100K rabaisse TOUT.
  it('dit que le plafond tombe à 3 dès qu’un 100K ou 150K apparaît', () => {
    const v = r('Comptes funded simul.', '25k')
    expect(v).toMatch(/5 maximum/)
    expect(v).toMatch(/tombe à 3 pour TOUS/)
  })
})

// ── My Funded Futures : cinq articles de plus ───────────────────────────────
// « Rapid Plan 150k », « Intraday Drawdown Explained », « Rapid EOD 50k » et
// les deux guides Builder (25K et 50K). Le 150K confirme deux valeurs qui
// avaient dû être DÉDUITES faute d'article ; les quatre autres ouvrent des
// règles que la fiche n'avait pas du tout.
describe('My Funded Futures — le 150K confirme les déductions', () => {
  const r = (key, plan) => PROPFIRM_RULES['My Funded Futures'].rules[key][plan]

  // Contrats et buffer du 150K avaient été repris de la formule, faute
  // d'article. L'article publié depuis donne exactement les mêmes chiffres.
  it('confirme 10 minis / 100 micros et un buffer de $4,600', () => {
    expect(extractModelSegment(r('Contrats max éval (mini)', '150k'), 'Rapid')).toBe('10')
    expect(extractModelSegment(r('Contrats max éval (micro)', '150k'), 'Rapid')).toBe('100')
    expect(r('Buffer payout (Rapid)', '150k')).toBe('$4,600')
  })

  // La mention « non confirmé » n'a plus lieu d'être sur ces deux cellules.
  it('ne porte plus de réserve sur les valeurs du 150K', () => {
    expect(r('Contrats sim funded', '150k')).not.toMatch(/non fourni|non confirmé/i)
    expect(r('Buffer payout (Rapid)', '150k')).not.toMatch(/formule|non fourni/i)
  })

  // Le buffer suit la formule sur les QUATRE tailles, 150K compris.
  it('vérifie la formule max loss + $100 sur les quatre tailles', () => {
    const cash = s => Number(String(s).match(/\$([\d,]+)/)[1].replace(/,/g, ''))
    for (const [plan, dd] of [['25k', 1000], ['50k', 2000], ['100k', 3000], ['150k', 4500]]) {
      expect(cash(r('Buffer payout (Rapid)', plan)), plan).toBe(dd + 100)
    }
  })
})

describe('My Funded Futures — mécanique du drawdown intraday', () => {
  const r = (key, plan = '25k') => PROPFIRM_RULES['My Funded Futures'].rules[key][plan]

  // Le seuil suit le PIC d'équité, latent compris. Une position ouverte en gain
  // le fait monter tout de suite ; une position en perte peut casser le compte
  // sans jamais être fermée.
  it('dit que le latent compte dans les DEUX sens', () => {
    const v = r('Drawdown intraday — ce qui compte')
    expect(v).toMatch(/RÉALISÉS ET LATENTS/)
    expect(v).toMatch(/ne redescend JAMAIS/)
    expect(v).toMatch(/positions ouvertes incluses/)
  })

  // La règle générale du verrou, énoncée telle quelle par les guides Builder.
  it('énonce le verrou à $100 au-dessus du solde de départ', () => {
    const v = r('Verrouillage du max loss')
    expect(v).toMatch(/DÉFINITIVEMENT/)
    expect(v).toMatch(/\$100 au-dessus du solde de départ/)
  })

  // Le verrou d'évaluation est désormais chiffré aux quatre tailles.
  it('chiffre le verrou d’évaluation à chaque taille', () => {
    for (const [plan, seuil] of [['25k', '25,100'], ['50k', '50,100'],
                                 ['100k', '100,100'], ['150k', '150,100']]) {
      expect(r('Drawdown Rapid — éval contre financé', plan), plan)
        .toMatch(new RegExp('\\$' + seuil))
    }
  })

  // Un solde financé qui part de $0 PEUT devenir négatif — la firme le dit.
  it('prévient que le solde financé peut passer négatif', () => {
    expect(r('Solde de départ sim funded')).toMatch(/NÉGATIF/)
  })

  it('explique où lire le drawdown sur Tradovate', () => {
    const v = r('Suivi du drawdown sur Tradovate')
    expect(v).toMatch(/DRAWDOWN AUTO LIQ LEVEL/)
    expect(v).toMatch(/DIST DRAWDOWN/)
  })
})

// Le Rapid EOD est la seule famille qui garde son drawdown de CLÔTURE en
// financé — le Rapid standard, lui, bascule en intraday à ce moment-là.
describe('My Funded Futures — Rapid EOD', () => {
  const r = key => PROPFIRM_RULES['My Funded Futures'].rules[key]['50k']

  it('garde l’EOD en phase financée, contrairement au Rapid standard', () => {
    const v = r('Rapid EOD — phase financée')
    expect(v).toMatch(/EOD trailing/)
    expect(v).toMatch(/jamais en séance/)
    expect(v).toMatch(/3 comptes financés/)
  })

  // Deux seuils distincts : le buffer ne vaut que pour le PREMIER payout.
  it('distingue le buffer du premier payout du seuil des suivants', () => {
    const v = r('Rapid EOD — payouts')
    expect(v).toMatch(/\$2,100/)
    expect(v).toMatch(/PREMIER payout/)
    expect(v).toMatch(/\$500 de profit net depuis le précédent/)
    expect(v).toMatch(/Aucun plafond/)
  })

  it('n’existe qu’en 50K', () => {
    for (const p of ['25k', '100k', '150k']) {
      expect(PROPFIRM_RULES['My Funded Futures'].rules['Rapid EOD — phase financée'][p], p)
        .toBe('non dispo')
    }
  })
})

// ⚠️ Builder n'a AUCUNE cohérence en ÉVALUATION — mais 50% AU PAYOUT. Dire
// « aucune cohérence » tout court laisserait croire qu'on retire librement.
describe('My Funded Futures — Builder', () => {
  const r = (key, plan = '25k') => PROPFIRM_RULES['My Funded Futures'].rules[key][plan]

  it('sépare l’absence de cohérence en éval du 50% au payout', () => {
    expect(extractModelSegment(r('Règle de cohérence (eval)', '25k'), 'Builder'))
      .toMatch(/AUCUNE/)
    const v = r('Cohérence Builder (payout)')
    expect(v).toMatch(/^50%/)
    expect(v).toMatch(/remise à zéro après chaque payout/)
    expect(v).toMatch(/Rien de tel pendant l'évaluation/)
  })

  // Le buffer suit la même formule que le Rapid, mais l'Add-On a le sien.
  it('donne un buffer par option, formule max loss + $100', () => {
    expect(r('Buffer payout (Builder)', '25k')).toBe('$1,100')
    const cinquante = r('Buffer payout (Builder)', '50k')
    expect(cinquante).toMatch(/\$2,100/)
    expect(cinquante).toMatch(/\$1,600/)   // Add-On, max loss $1,500
  })

  // Les deux tailles n'ont ni le même plafond, ni le même minimum.
  it('donne une politique de payout par taille', () => {
    expect(r('Builder — politique de payout', '25k')).toMatch(/\$1,000 par cycle/)
    expect(r('Builder — politique de payout', '25k')).toMatch(/\$250/)
    expect(r('Builder — politique de payout', '50k')).toMatch(/\$2,000 par cycle/)
    expect(r('Builder — politique de payout', '50k')).toMatch(/\$500/)
    for (const p of ['25k', '50k']) {
      expect(r('Builder — politique de payout', p), p).toMatch(/80\/20/)
      expect(r('Builder — politique de payout', p), p).toMatch(/5 payouts simulés/)
    }
  })

  // ⚠️ Ce n'est PAS le 1 jour de l'évaluation : c'est l'exigence de RETRAIT.
  it('exige 2 journées tradées dans le cycle pour retirer', () => {
    expect(r('Jours min avant payout (Builder)', '25k')).toMatch(/2 journées/)
    expect(extractModelSegment(r('Jours de trading min (eval)', '25k'), 'Builder'))
      .toMatch(/1 jour/)
  })

  it('permet le premier payout 48 h après le premier trade', () => {
    expect(r('Builder — premier payout')).toMatch(/48 heures/)
  })

  // Le nombre de comptes simultanés n'est PAS le même entre les deux tailles.
  it('limite à 2 comptes en 25K et à UN SEUL en 50K', () => {
    expect(r('Builder — comptes simultanés', '25k')).toMatch(/2 comptes/)
    expect(r('Builder — comptes simultanés', '50k')).toMatch(/UN SEUL/)
  })

  it('décrit le passage en live après le 5e payout', () => {
    expect(r('Builder — passage en live', '25k')).toMatch(/5e payout/)
    expect(r('Builder — passage en live', '25k')).toMatch(/AUCUNE perte journalière/)
    // ⚠️ En 50K la DLL SURVIT au passage en live — pas en 25K.
    expect(r('Builder — passage en live', '50k')).toMatch(/DLL de \$1,000 maintenue en live/)
  })

  // Sanction lourde et peu connue : casser le live gèle aussi le sim.
  it('documente les 21 jours de gel après un breach live', () => {
    const v = r('Builder — après un breach live')
    expect(v).toMatch(/21 jours/)
    expect(v).toMatch(/aucun achat/i)
  })

  // ⚠️ « Pricing non public » était faux : le guide 50K publie les deux options.
  it('publie le prix des deux options du 50K', () => {
    const v = r('Prix Builder', '50k')
    expect(v).toMatch(/\$153/)
    expect(v).toMatch(/\$125/)
    expect(v).not.toMatch(/non public/i)
  })
})

// Le plafond général de 5 comptes financés ne vaut pas partout : plusieurs
// plans en publient un plus BAS, propre au plan.
describe('My Funded Futures — plafonds propres à un plan', () => {
  const r = plan => PROPFIRM_RULES['My Funded Futures'].rules['Plafonds propres à un plan'][plan]

  it('donne les plafonds par plan là où ils diffèrent du général', () => {
    expect(extractModelSegment(r('50k'), 'Builder')).toMatch(/UN SEUL/)
    expect(extractModelSegment(r('50k'), 'Rapid EOD')).toMatch(/3 comptes/)
    expect(extractModelSegment(r('50k'), 'Flex')).toMatch(/3 comptes/)
    expect(extractModelSegment(r('25k'), 'Builder')).toMatch(/2 comptes/)
  })

  it('reste plus bas que le plafond général de 5', () => {
    expect(PROPFIRM_RULES['My Funded Futures'].rules['Comptes funded simul.']['25k'])
      .toMatch(/5 maximum/)
  })
})

// ── My Funded Futures : Pro et Flex, enfin sourcés ──────────────────────────
// « Pro Plan Sim-Funded and Live Account Highlights » et les quatre articles
// Flex (les deux guides courants et les deux versions legacy). C'étaient les
// deux familles sans article dédié dans les dix PDF précédents.
describe('My Funded Futures — Pro', () => {
  const r = (key, plan = '50k') => PROPFIRM_RULES['My Funded Futures'].rules[key][plan]

  // ⚠️ Core et Pro partageaient une seule clé, avec le chiffre de CORE en 50K.
  // Un porteur Pro 50K se voyait annoncer 25% de marge en moins qu'il n'en a.
  it('sépare le drawdown de Pro de celui de Core', () => {
    expect(r('Drawdown Pro (EOD)', '50k')).toBe('$2,000')
    expect(r('Drawdown Pro (EOD)', '100k')).toBe('$3,000')
    expect(r('Drawdown Pro (EOD)', '150k')).toBe('$4,500')
    expect(r('Drawdown Core (EOD)', '50k')).toMatch(/\$1,500/)
    expect(r('Drawdown Core (EOD)', '50k')).toMatch(/legacy/)
    // Core n'existe qu'en 50K.
    for (const p of ['25k', '100k', '150k']) {
      expect(r('Drawdown Core (EOD)', p), p).toBe('n/a')
    }
  })

  // Le délai court depuis le PREMIER TRADE, et les deux conditions sont
  // cumulatives — pas l'une ou l'autre.
  it('exige 14 jours depuis le premier trade ET le buffer', () => {
    const v = r('Pro — éligibilité au payout')
    expect(v).toMatch(/14 jours calendaires/)
    expect(v).toMatch(/premier trade/)
    expect(v).toMatch(/Les deux conditions/)
  })

  // Le carve-out est une SORTIE anticipée du buffer, pas le buffer lui-même.
  it('documente le retrait unique avant le buffer', () => {
    const v = r('Pro — retrait avant le buffer')
    expect(v).toMatch(/60%/)
    expect(v).toMatch(/\$1,000/)
    expect(v).toMatch(/40% restants/)
    // Et le buffer redevient un montant net, sans la note collée dessus.
    expect(r('Buffer payout (Pro)', '50k')).toBe('$2,100')
    expect(r('Buffer payout (Pro)', '150k')).toBe('$4,600')
  })

  // Le verrou Pro se déclenche sur un ÉVÉNEMENT — le premier payout —, pas sur
  // un seuil de solde atteint en trailing.
  it('verrouille le max loss au solde initial + $100 après le premier payout', () => {
    expect(r('Pro — verrouillage du max loss', '50k')).toMatch(/\$50,100/)
    expect(r('Pro — verrouillage du max loss', '100k')).toMatch(/\$100,100/)
    expect(r('Pro — verrouillage du max loss', '150k')).toMatch(/\$150,100/)
    expect(r('Pro — verrouillage du max loss', '50k')).toMatch(/PREMIER payout/)
  })

  it('plafonne les payouts à $100,000 par utilisateur', () => {
    expect(r('Pro — plafond de payouts')).toMatch(/\$100,000/)
    expect(r('Sim→Live trigger Pro', '50k')).toMatch(/\$5,000/)
    expect(r('Sim→Live trigger Pro', '150k')).toMatch(/\$10,000/)
  })

  // ⚠️ La dotation live du 150K démarre à $4,500, pas $4,000.
  it('corrige la dotation live du 150K', () => {
    expect(r('LIVE Pro initial funding', '150k')).toMatch(/\$4,500/)
    expect(r('LIVE Pro initial funding', '50k')).toMatch(/\$2,000 et \$5,000/)
  })

  // Le déverrouillage de la dotation était réduit à « 20 winning days ».
  it('donne les vrais critères de déverrouillage de la dotation', () => {
    const v = r('LIVE Pro balance withdraw')
    expect(v).toMatch(/4% de la dotation/)
    expect(v).toMatch(/3 payouts/)
    expect(v).toMatch(/\$140/)
  })

  // Deux pièges dans une seule phrase officielle.
  it('dit que le jalon ne garantit rien et que le surplus est PERDU', () => {
    const v = r('Pro — bascule décidée par la firme')
    expect(v).toMatch(/\$20,000/)
    expect(v).toMatch(/sans garantir/)
    expect(v).toMatch(/PERDU/)
  })

  // La grille de contrats financée du Pro ne suit PAS le rapport 10 micros
  // = 1 mini : elle donne autant de minis que de micros.
  it('donne au Pro une grille financée à part', () => {
    expect(extractModelSegment(r('Contrats sim funded', '50k'), 'Pro')).toMatch(/5 minis \/ 5 micros/)
    expect(extractModelSegment(r('Contrats sim funded', '100k'), 'Pro')).toMatch(/10 minis \/ 10 micros/)
    expect(extractModelSegment(r('Contrats sim funded', '150k'), 'Pro')).toMatch(/15 minis \/ 15 micros/)
  })
})

// ⚠️ ERREUR DE FOND : le Flex n'a jamais été STATIQUE. Annoncer un plancher figé
// à un porteur dont le seuil monte avec ses gains est exactement l'erreur qui
// casse un compte.
describe('My Funded Futures — Flex', () => {
  const r = (key, plan = '25k') => PROPFIRM_RULES['My Funded Futures'].rules[key][plan]

  it('classe le Flex en EOD TRAILING, pas en statique', () => {
    expect(r('Drawdown Flex (EOD trailing)', '25k')).toBe('$1,000')
    expect(r('Drawdown Flex (EOD trailing)', '50k')).toBe('$2,000')
    // L'ancienne clé, qui portait le mot « static », ne doit plus exister.
    expect(PROPFIRM_RULES['My Funded Futures'].rules['Drawdown Flex (EOD static)'])
      .toBeUndefined()
  })

  // Comme le Pro, le Flex se verrouille sur un ÉVÉNEMENT.
  it('verrouille le max loss à $100 après le premier payout', () => {
    expect(r('Verrouillage Flex')).toMatch(/PREMIER payout/)
    expect(r('Verrouillage Flex')).toMatch(/\$100/)
  })

  // L'absence de buffer est un différenciateur revendiqué, pas une donnée
  // manquante : la colonne doit dire « Non », jamais un tiret.
  it('déclare AUCUN buffer, sans ambiguïté', () => {
    for (const p of ['25k', '50k']) {
      expect(r('Buffer payout (Flex)', p), p).toMatch(/^AUCUN/)
    }
  })

  // Les cinq journées gagnantes ne suffisent pas — la firme consacre un exemple
  // entier à ce piège.
  it('exige AUSSI un profit net minimum sur le cycle', () => {
    expect(r('Jours min avant payout (Flex)')).toMatch(/5 journées GAGNANTES/)
    expect(r('Profit min jour valide (Flex)', '25k')).toBe('$100 net')
    expect(r('Profit min jour valide (Flex)', '50k')).toBe('$150 net')
    expect(r('Flex — profit net exigé par cycle', '25k')).toMatch(/\$500 de profit net total/)
    expect(r('Flex — profit net exigé par cycle', '25k')).toMatch(/\$250 depuis le payout/)
    expect(r('Flex — profit net exigé par cycle', '50k')).toMatch(/\$500 depuis le payout/)
  })

  it('n’a aucune cohérence au moment de retirer', () => {
    expect(r('Cohérence Flex (payout)')).toMatch(/^AUCUNE/)
  })

  // ⚠️ Les DEUX plafonds ont été RABAISSÉS. Servir la grille legacy promettrait
  // le triple à un porteur récent.
  it('porte les plafonds COURANTS, pas ceux de la génération legacy', () => {
    expect(extractModelSegment(r('Cap par cycle', '25k'), 'Flex')).toMatch(/\$1,000/)
    expect(extractModelSegment(r('Cap par cycle', '50k'), 'Flex')).toMatch(/\$2,000/)
    // Les montants legacy ne doivent plus figurer comme valeur courante.
    expect(extractModelSegment(r('Cap par cycle', '25k'), 'Flex')).toMatch(/abaissé depuis \$3,000/)
    expect(extractModelSegment(r('Cap par cycle', '50k'), 'Flex')).toMatch(/abaissé depuis \$5,000/)
  })

  it('garde la génération legacy dans une cellule à part', () => {
    expect(r('Flex — génération legacy', '25k')).toMatch(/\$3,000/)
    expect(r('Flex — génération legacy', '50k')).toMatch(/\$5,000/)
    expect(r('Flex — génération legacy', '50k')).toMatch(/4 minis \/ 40 micros/)
  })

  // Le minimum de retrait du 50K est passé de $250 à $500.
  it('relève le minimum de retrait du 50K', () => {
    expect(extractModelSegment(r('Payout minimum', '50k'), 'Flex')).toMatch(/\$500/)
    expect(extractModelSegment(r('Payout minimum', '25k'), 'Flex')).toMatch(/\$250/)
  })

  // ⚠️ « 10K sim cap » était une coquille : le plafond est de $100,000.
  it('corrige le plafond de bascule en live', () => {
    const v = r('Sim→Live trigger Flex/Builder', '25k')
    expect(v).toMatch(/\$100,000/)
    expect(v).not.toMatch(/10K/)
  })

  // Une DLL qu'on ACHÈTE — propre au 50K.
  it('documente l’add-on DLL du 50K', () => {
    expect(r('Flex — option DLL', '50k')).toMatch(/\$1,000/)
    expect(r('Flex — option DLL', '50k')).toMatch(/pause douce/)
    expect(r('Flex — option DLL', '50k')).toMatch(/sans casser le compte/)
    expect(r('Flex — option DLL', '25k')).toMatch(/non publié/)
  })

  it('fait scaler la limite de contrats sur le SOLDE en sim funded', () => {
    expect(r('Flex — scaling en sim funded', '25k')).toMatch(/\$749/)
    expect(r('Flex — scaling en sim funded', '50k')).toMatch(/\$1,499/)
    for (const p of ['25k', '50k']) {
      expect(r('Flex — scaling en sim funded', p), p).toMatch(/Aucun scaling pendant l'évaluation/)
    }
  })

  // Le plan est en fin de vie : les comptes existants continuent, plus rien ne
  // se vend.
  it('signale l’arrêt de la vente', () => {
    expect(r('Flex — arrêt de la vente')).toMatch(/arrêté/)
    expect(r('Flex — arrêt de la vente')).toMatch(/5 août/)
    expect(r('Flex — arrêt de la vente')).toMatch(/comptes déjà ouverts continuent/)
  })

  it('donne les paramètres du compte live', () => {
    expect(r('Flex — compte live', '25k')).toMatch(/\$1,000/)
    expect(r('Flex — compte live', '50k')).toMatch(/\$2,000/)
    for (const p of ['25k', '50k']) {
      expect(r('Flex — compte live', p), p).toMatch(/\$156/)   // solde plancher
    }
  })
})
