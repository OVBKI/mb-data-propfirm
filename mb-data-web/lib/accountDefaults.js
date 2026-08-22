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

// Le partage brut des règles est bruité (87, 88, 90 selon les paliers). On le
// ramène aux quatre valeurs que les firmes pratiquent réellement — un chiffre
// rond que l'utilisateur reconnaît vaut mieux qu'une précision inventée.
export function suggestProfitSplit(firmName, plan) {
  const raw = defaultProfitSplit(firmName, plan)
  if (!raw) return 90
  if (raw >= 95) return 100
  if (raw >= 85) return 90
  if (raw >= 75) return 80
  return 70
}

// Ce que l'app déduit d'un couple (firme, plan). `null` veut dire « on ne sait
// pas » — jamais 0 : un objectif de payout à 0 serait faux, une absence ne l'est
// pas. C'est ce qui permet à l'assistant de n'afficher que les lignes connues.
export function accountDefaults(firmName, plan) {
  return {
    price: defaultChallengePrice(firmName, plan),
    ddType: defaultDdType(firmName),
    maxDrawdown: maxDrawdown(firmName, plan),
    payoutTarget: defaultPayoutTarget(firmName, plan),
    minTradingDays: defaultMinTradingDays(firmName, plan),
    minDailyProfit: defaultMinDailyProfit(firmName, plan),
    profitSplit: suggestProfitSplit(firmName, plan),
    planSizeNum: planSizeNum(plan),
  }
}

// Les plans d'une firme, chacun avec ses défauts déjà calculés. L'assistant
// s'en sert pour poser des cartes de choix informatives.
export function planChoices(firmName) {
  return plansForFirm(firmName).map(plan => ({ plan, ...accountDefaults(firmName, plan) }))
}

// La forme exacte attendue par `acctForm` dans layout.js. Les nombres y sont des
// CHAÎNES parce que ce sont des valeurs d'<input> ; un null devient une chaîne
// vide, pas « null ».
export function buildAccountForm(firmName, plan, overrides = {}) {
  const d = accountDefaults(firmName, plan)
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
