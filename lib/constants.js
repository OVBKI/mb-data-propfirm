// PropFirm rules data — vérifiées 2024/2025 (toujours vérifier sur le site officiel)
// Toutes les firmes futures ci-dessous utilisent un drawdown TRAILING avec stop au balance initial.
export const PROPFIRM_RULES = {
  'Topstep': {
    // Trailing DD (EOD) qui se fige au balance initial une fois atteint
    plans: ['50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'50k':'$3,000','100k':'$6,000','150k':'$9,000'},
      'Drawdown journalier max':  {'50k':'$1,000','100k':'$2,000','150k':'$3,000'},
      'Drawdown trailing max':    {'50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'Jours de trading min':     {'50k':'5 jours','100k':'5 jours','150k':'5 jours'},
      'Positions overnight':      {'50k':'Non','100k':'Non','150k':'Non'},
      'Payout minimum':           {'50k':'$200','100k':'$200','150k':'$200'},
      'Délai payout':             {'50k':'7 jours','100k':'7 jours','150k':'7 jours'},
    }
  },
  'Apex Trader Funding': {
    // Trailing DD intraday — ne s'arrête PAS au balance initial mais à un seuil profit
    plans: ['25k','50k','75k','100k','150k','250k','300k'],
    rules: {
      'Objectif de profit':      {'25k':'$1,500','50k':'$3,000','75k':'$4,250','100k':'$6,000','150k':'$9,000','250k':'$15,000','300k':'$20,000'},
      'Drawdown trailing max':   {'25k':'$1,500','50k':'$2,500','75k':'$2,750','100k':'$3,000','150k':'$5,000','250k':'$6,500','300k':'$7,500'},
      'Jours de trading min':    {'25k':'7j','50k':'7j','75k':'7j','100k':'7j','150k':'7j','250k':'7j','300k':'7j'},
      'Positions overnight':     {'25k':'Oui','50k':'Oui','75k':'Oui','100k':'Oui','150k':'Oui','250k':'Oui','300k':'Oui'},
      'Payout minimum':          {'25k':'$500','50k':'$500','75k':'$500','100k':'$500','150k':'$500','250k':'$500','300k':'$500'},
      'Délai payout':            {'25k':'14j','50k':'14j','75k':'14j','100k':'14j','150k':'14j','250k':'14j','300k':'14j'},
    }
  },
  'Bulenox': {
    // EOD trailing avec stop au balance initial
    plans: ['25k','50k','100k','150k','250k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500','50k':'$3,000','100k':'$6,000','150k':'$9,000','250k':'$15,000'},
      'Drawdown journalier max':  {'25k':'$500','50k':'$1,100','100k':'$2,200','150k':'$3,300','250k':'$5,500'},
      'Drawdown trailing max':    {'25k':'$1,500','50k':'$2,500','100k':'$3,000','150k':'$4,500','250k':'$6,500'},
      'Positions overnight':      {'25k':'Non','50k':'Non','100k':'Non','150k':'Non','250k':'Non'},
      'Payout minimum':           {'25k':'$250','50k':'$250','100k':'$250','150k':'$250','250k':'$250'},
      'Délai payout':             {'25k':'7-14j','50k':'7-14j','100k':'7-14j','150k':'7-14j','250k':'7-14j'},
    }
  },
  'Lucid Trading': {
    // EOD trailing avec stop au balance initial
    plans: ['50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'50k':'$3,000','100k':'$6,000','150k':'$9,000'},
      'Drawdown journalier max':  {'50k':'$1,100','100k':'$2,200','150k':'$3,300'},
      'Drawdown trailing max':    {'50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'Positions overnight':      {'50k':'Non','100k':'Non','150k':'Non'},
      'Payout minimum':           {'50k':'$500','100k':'$500','150k':'$500'},
      'Délai payout':             {'50k':'14j','100k':'14j','150k':'14j'},
    }
  },
  'Tradeify': {
    // EOD trailing avec stop au balance initial
    plans: ['25k','50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500','50k':'$3,000','100k':'$6,000','150k':'$9,000'},
      'Drawdown journalier max':  {'25k':'$500','50k':'$1,250','100k':'$2,500','150k':'$3,750'},
      'Drawdown trailing max':    {'25k':'$1,500','50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'Positions overnight':      {'25k':'Non','50k':'Non','100k':'Non','150k':'Non'},
      'Payout minimum':           {'25k':'$250','50k':'$250','100k':'$250','150k':'$250'},
      'Délai payout':             {'25k':'7-14j','50k':'7-14j','100k':'7-14j','150k':'7-14j'},
    }
  },
  'Take Profit Trader': {
    // EOD trailing avec stop au balance initial
    plans: ['25k','50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500','50k':'$3,000','100k':'$6,000','150k':'$9,000'},
      'Drawdown journalier max':  {'25k':'$625','50k':'$1,250','100k':'$2,500','150k':'$3,750'},
      'Drawdown trailing max':    {'25k':'$1,500','50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'Positions overnight':      {'25k':'Non','50k':'Non','100k':'Non','150k':'Non'},
      'Payout minimum':           {'25k':'$500','50k':'$500','100k':'$500','150k':'$500'},
      'Délai payout':             {'25k':'15j','50k':'15j','100k':'15j','150k':'15j'},
    }
  },
  'My Funded Futures': {
    // Star Plans — EOD trailing avec stop au balance initial
    plans: ['25k','50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500','50k':'$3,000','100k':'$6,000','150k':'$9,000'},
      'Drawdown journalier max':  {'25k':'$500','50k':'$1,200','100k':'$2,500','150k':'$3,500'},
      'Drawdown trailing max':    {'25k':'$1,500','50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'Positions overnight':      {'25k':'Non','50k':'Non','100k':'Non','150k':'Non'},
      'Payout minimum':           {'25k':'$1,000','50k':'$1,000','100k':'$1,000','150k':'$1,000'},
      'Délai payout':             {'25k':'7-14j','50k':'7-14j','100k':'7-14j','150k':'7-14j'},
    }
  },
  'Phidias Propfirm': {
    // Valeurs indicatives — vérifie sur phidias-propfirm.com
    plans: ['25k','50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500','50k':'$3,000','100k':'$6,000','150k':'$9,000'},
      'Drawdown journalier max':  {'25k':'$500','50k':'$1,000','100k':'$2,000','150k':'$3,000'},
      'Drawdown trailing max':    {'25k':'$1,500','50k':'$2,500','100k':'$3,000','150k':'$4,500'},
      'Positions overnight':      {'25k':'Non','50k':'Non','100k':'Non','150k':'Non'},
      'Payout minimum':           {'25k':'$500','50k':'$500','100k':'$500','150k':'$500'},
      'Délai payout':             {'25k':'14j','50k':'14j','100k':'14j','150k':'14j'},
    }
  },
}

export const FIRM_COLORS = ['#2d6fff','#1db87a','#e8504a','#fac775','#a78bfa','#f472b6','#34d399','#fb923c']
export const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
export const MONTHS_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
export const FIRM_SUGGESTIONS = [
  'Topstep',
  'Apex Trader Funding',
  'Bulenox',
  'Lucid Trading',
  'Tradeify',
  'Take Profit Trader',
  'My Funded Futures',
  'Phidias Propfirm',
]
export const STATUS_COLORS = { 'Financé': '#1db87a', 'Challenge': '#fac775', 'Échoué': '#e8504a' }

export const PX_FIRMS = {
  'Topstep': 'topstepx',
  'Tradeify': 'tradeify',
  'Take Profit Trader': 'tpt',
  'My Funded Futures': 'mff',
}

// Plans génériques pour firmes non listées dans PROPFIRM_RULES
export const GENERIC_PLANS = ['25k','50k','75k','100k','150k','250k','300k']

// Convertit un plan ('50k', '100k', '25K') en nombre de dollars (50000, 100000, 25000)
export function planSizeNum(plan){
  if(!plan) return 50000
  const m = String(plan).match(/(\d+)/)
  return m ? parseInt(m[1],10)*1000 : 50000
}

// Retourne la liste des plans disponibles pour une firme (ou GENERIC_PLANS)
export function plansForFirm(firmName){
  return PROPFIRM_RULES[firmName]?.plans || GENERIC_PLANS
}

// Retourne le drawdown max (en $ numérique) pour une firme + plan
// Cherche dans PROPFIRM_RULES la règle "Drawdown total max" ou "Drawdown trailing max"
export function maxDrawdown(firmName, plan){
  const rules = PROPFIRM_RULES[firmName]?.rules
  if(!rules || !plan) return null
  const ddKey = Object.keys(rules).find(k =>
    /drawdown\s+(total|trailing)/i.test(k)
  )
  if(!ddKey) return null
  const ddStr = rules[ddKey][plan]
  if(!ddStr) return null
  const m = String(ddStr).match(/[\d,]+/)
  return m ? parseInt(m[0].replace(/,/g,''),10) : null
}

// Indique si la firme utilise un drawdown trailing (selon PROPFIRM_RULES)
export function isTrailingDD(firmName){
  const rules = PROPFIRM_RULES[firmName]?.rules
  if(!rules) return false
  return Object.keys(rules).some(k => /drawdown\s+trailing/i.test(k))
}

// Type de DD par défaut suggéré pour une firme (utilisé à la création d'un compte)
// Toutes les firmes connues ci-dessus utilisent du trailing
const TRAILING_DEFAULT = new Set([
  'Topstep',
  'Apex Trader Funding',
  'Bulenox',
  'Lucid Trading',
  'Tradeify',
  'Take Profit Trader',
  'My Funded Futures',
  'Phidias Propfirm',
])
export function defaultDdType(firmName){
  if(TRAILING_DEFAULT.has(firmName)) return 'trailing'
  if(isTrailingDD(firmName)) return 'trailing'
  return 'static'
}

// Retourne l'étiquette d'affichage d'un compte : nom personnalisé sinon "Compte du <date>"
export function accountLabel(a){
  if(!a) return ''
  return (a.name && a.name.trim()) ? a.name.trim() : `Compte du ${a.buy_date}`
}
