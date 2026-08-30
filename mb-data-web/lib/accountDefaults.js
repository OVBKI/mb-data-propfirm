// lib/accountDefaults.js — tout ce que l'app SAIT déjà d'un compte.
//
// Le formulaire de compte pose 18 questions, dont sept dont il connaît la
// réponse : le prix, le type de drawdown, l'objectif de payout, les jours de
// trading minimum, le profit minimum quotidien, le partage et le drawdown max
// sont tous déductibles du couple (firme, plan) via PROPFIRM_RULES.
//
// Les rassembler ici sert deux choses :
//   • l'assistant peut MONTRER ces valeurs au moment du choix du plan, au lieu
//     de les faire valider champ par champ après coup ;
//   • le calcul devient testable, ce qu'il n'était pas tant qu'il vivait
//     dispersé dans le JSX de layout.js.

import {
  defaultChallengePrice, defaultDdType, defaultPayoutTarget,
  defaultMinTradingDays, defaultMinDailyProfit, defaultProfitSplit,
  maxDrawdown, plansForFirm, planSizeNum,
} from './constants'
import { programsForFirm, defaultProgramFor } from './futuresComparison'

export { programsForFirm, defaultProgramFor }

// Le partage brut des règles est bruité (87, 88, 90 selon les paliers). On le
// ramène aux quatre valeurs que les firmes pratiquent réellement — un chiffre
// rond que l'utilisateur reconnaît vaut mieux qu'une précision inventée.
export function suggestProfitSplit(firmName, plan, program) {
  const raw = defaultProfitSplit(firmName, plan, program)
  if (!raw) return 90
  if (raw >= 95) return 100
  if (raw >= 85) return 90
  if (raw >= 75) return 80
  return 70
}

// Ce que l'app déduit d'un couple (firme, plan). `null` veut dire « on ne sait
// pas » — jamais 0 : un objectif de payout à 0 serait faux, une absence ne l'est
// pas. C'est ce qui permet à l'assistant de n'afficher que les lignes connues.
// `program` est le TYPE DE COMPTE choisi par l'utilisateur (Apex EOD contre
// Intraday contre Legacy, FundedNext Flex contre Rapid…). Beaucoup de firmes
// vendent plusieurs programmes sous la même taille, avec des drawdowns et des
// prix différents ; sans ce paramètre on servait le programme principal à tout
// le monde. `null` = pas encore choisi, on retombe sur le programme principal.
export function accountDefaults(firmName, plan, program = null) {
  return {
    program,
    price: defaultChallengePrice(firmName, plan, program),
    ddType: defaultDdType(firmName),
    maxDrawdown: maxDrawdown(firmName, plan, program),
    payoutTarget: defaultPayoutTarget(firmName, plan, program),
    minTradingDays: defaultMinTradingDays(firmName, plan, program),
    minDailyProfit: defaultMinDailyProfit(firmName, plan, program),
    profitSplit: suggestProfitSplit(firmName, plan, program),
    planSizeNum: planSizeNum(plan),
  }
}

// Les programmes proposables pour un couple (firme, plan), chacun avec ses
// valeurs déjà calculées — de quoi poser des cartes de choix comparables.
export function programChoices(firmName, plan) {
  if (!firmName || !plan) return []
  return programsForFirm(firmName, plan).map(program => ({
    program,
    ...accountDefaults(firmName, plan, program),
  }))
}

// Résumé d'un programme AVANT que la taille soit choisie.
//
// Le piège : à ce stade aucune taille n'est retenue, donc afficher le prix ou le
// drawdown d'UNE taille (la plus petite, par exemple) donne un chiffre exact mais
// trompeur — on croit lire le prix du programme. On montre donc une FOURCHETTE et
// l'étendue des tailles, ce qui compare vraiment les programmes entre eux.
export function programSummaries(firmName) {
  if (!firmName) return []
  return programsForFirm(firmName).map(program => {
    const plans = plansForProgram(firmName, program)
    const cards = plans.map(plan => accountDefaults(firmName, plan, program))
    const range = key => {
      const v = cards.map(c => c[key]).filter(x => typeof x === 'number' && x > 0)
      if (!v.length) return null
      const lo = Math.min(...v), hi = Math.max(...v)
      return { lo, hi, same: lo === hi }
    }
    return {
      program,
      plans,
      drawdown: range('maxDrawdown'),
      price: range('price'),
      profitSplit: cards[0]?.profitSplit ?? null,
      ddType: cards[0]?.ddType ?? null,
    }
  })
}

// Les tailles où un programme est réellement vendu. Apex Legacy existe en 75K,
// 250K et 300K ; ses variantes 4.0 non. Proposer les sept tailles à tout le monde
// affichait un prix legacy à côté d'un prix 4.0 dans la même liste.
export function plansForProgram(firmName, program) {
  const all = plansForFirm(firmName)
  if (!program) return all
  const kept = all.filter(plan => programsForFirm(firmName, plan).includes(program))
  // Un programme qu'on ne sait rattacher à aucune taille ne doit pas vider la
  // liste : mieux vaut tout proposer que bloquer la création de compte.
  return kept.length ? kept : all
}

// Les plans d'une firme, chacun avec ses défauts déjà calculés. L'assistant
// s'en sert pour poser des cartes de choix informatives. Avec un programme, les
// montants sont ceux DE CE PROGRAMME et la liste se restreint à ses tailles.
export function planChoices(firmName, program = null) {
  return plansForProgram(firmName, program).map(plan => ({
    plan,
    ...accountDefaults(firmName, plan, program),
  }))
}

// La forme exacte attendue par `acctForm` dans layout.js. Les nombres y sont des
// CHAÎNES parce que ce sont des valeurs d'<input> ; un null devient une chaîne
// vide, pas « null ».
export function buildAccountForm(firmName, plan, overrides = {}, program = null) {
  const d = accountDefaults(firmName, plan, program)
  const str = v => (v === null || v === undefined ? '' : String(v))
  return {
    buyDate: todayISO(),
    currency: 'USD',
    spent: str(d.price),
    activationFee: '',
    activationDate: '',
    status: 'Challenge',
    notes: '',
    planSize: plan,
    program: program || '',
    name: '',
    ddType: d.ddType,
    payoutTarget: str(d.payoutTarget),
    minTradingDays: str(d.minTradingDays),
    minDailyProfit: str(d.minDailyProfit),
    profitSplit: String(d.profitSplit),
    paymentMode: 'monthly',
    quantity: '1',
    customDrawdown: '',
    ...overrides,
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// Création en lot : « LFF050-001 » suivi de 3 donne 001, 002, 003. Sans suffixe
// numérique, on en ajoute un — sinon trois comptes porteraient le même nom et
// deviendraient indiscernables dans les listes.
export function generateAccountNames(baseName, quantity) {
  const qty = Math.max(1, parseInt(quantity, 10) || 1)
  const trimmed = (baseName || '').trim()
  if (!trimmed) return Array(qty).fill('')
  const match = trimmed.match(/^(.*-)(\d+)$/)
  if (match) {
    const prefix = match[1]
    const startNum = parseInt(match[2], 10)
    const padWidth = match[2].length
    return Array.from({ length: qty }, (_, i) => prefix + String(startNum + i).padStart(padWidth, '0'))
  }
  return Array.from({ length: qty }, (_, i) => `${trimmed}-${String(i + 1).padStart(3, '0')}`)
}
