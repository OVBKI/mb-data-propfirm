import { describe, it, expect } from 'vitest'
import { ruleMoney, rulePct, accountRuleSet, accountPhase } from './accountRules'
import { getFirmsWithComparison, programsForFirm } from './futuresComparison'
import { plansForFirm } from './constants'

describe('lecture prudente des cellules', () => {
  it('montants', () => {
    expect(ruleMoney('$1,000')).toBe(1000)
    expect(ruleMoney('$1,200 si activée (ON/OFF à l’achat)')).toBe(1200)
    expect(ruleMoney('$2,000 (Combine + XFA) — reset chaque session')).toBe(2000)
    expect(ruleMoney('AUCUN')).toBeNull()
    expect(ruleMoney('aucune en éval, $1,000 une fois qualifié')).toBeNull()
    expect(ruleMoney('Oui, par palier')).toBeNull()
    expect(ruleMoney('Non documenté précisément')).toBeNull()
    expect(ruleMoney('sans objet (aucune évaluation)')).toBeNull()
  })
  it('pourcentages', () => {
    expect(rulePct('40%')).toBe(0.4)
    expect(rulePct('≤ 50%')).toBe(0.5)
    expect(rulePct('Best Day Profit ÷ Overall Profit ≤ 50% · si dépassé')).toBe(0.5)
    expect(rulePct('AUCUNE en financé')).toBeNull()
    expect(rulePct('3 premiers payouts')).toBeNull()
  })
  it('phase du compte', () => {
    expect(accountPhase({ status: 'Financé' })).toBe('funded')
    expect(accountPhase({ status: 'Challenge' })).toBe('challenge')
    expect(accountPhase({ status: 'Échoué' })).toBeNull()
  })
})

describe('règles d’un compte, sur tout le catalogue', () => {
  it('rend des valeurs plausibles pour chaque firme, taille, programme et phase', () => {
    let checked = 0
    for (const f of getFirmsWithComparison()) {
      const firm = f.name || f
      for (const plan of plansForFirm(firm)) {
        for (const program of programsForFirm(firm, plan)) {
          for (const status of ['Challenge', 'Financé']) {
            const r = accountRuleSet({ plan_size: plan, program, status }, firm)
            const size = parseInt(plan, 10) * 1000
            if (r.dailyLoss != null) expect(r.dailyLoss).toBeLessThan(size * 0.2)
            if (r.consistency != null) expect(r.consistency).toBeGreaterThan(0.05)
            if (r.profitTarget != null) expect(r.profitTarget).toBeLessThan(size * 0.25)
            if (r.minDays != null) expect(r.minDays).toBeLessThanOrEqual(60)
            checked++
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(200)
  })
  it('Topstep 100K XFA Standard : DLL financée 3 000 $, pas de consistance', () => {
    const r = accountRuleSet({ plan_size: '100k', program: 'XFA Standard', status: 'Financé' }, 'Topstep')
    expect(r.dailyLoss).toBe(3000)
    expect(r.consistency).toBeNull()
  })
  it('Apex 50K EOD en évaluation : DLL 1 000 $, objectif 3 000 $', () => {
    const r = accountRuleSet({ plan_size: '50k', program: 'EOD', status: 'Challenge' }, 'Apex Trader Funding')
    expect(r.dailyLoss).toBe(1000)
    expect(r.profitTarget).toBe(3000)
  })
  it('un compte échoué n’a plus de règles', () => {
    expect(accountRuleSet({ plan_size: '50k', status: 'Échoué' }, 'Topstep').dailyLoss).toBeNull()
  })
})
