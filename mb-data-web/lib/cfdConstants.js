// lib/cfdConstants.js — CFD / forex PropFirm rules (separate vertical from the
// futures PROPFIRM_RULES in constants.js). Researched & cross-checked June 2026.
//
// ⚠️ DATA-CONFIDENCE NOTE (read before trusting any value):
//   • RULES (profit targets, daily/max loss %, drawdown basis, split, platforms,
//     leverage) are sourced from each firm's official help center where reachable,
//     else cross-referenced across 3+ reputable third-party reviews.
//   • PRICES are almost all INDICATIVE / third-party — most firms' checkout pages are
//     Cloudflare-protected or dynamic. Every price here is flagged `priceConfidence`
//     and the UI must show an "indicatif — vérifier sur le site officiel" label.
//   • Each firm has 3–9 challenge models; v1 stores ONE flagship model in detail and
//     lists the rest by name in `otherModels`.
//   • Always verify on the firm's official site before acting — rules change often.
//
// Drawdown basis vocabulary (differs fundamentally from futures trailing-EOD/intraday):
//   dailyLoss.basis : 'balance' | 'equity' | 'higher-of-balance-equity' | 'balance+intraday-profit'
//   maxLoss.basis   : 'static' (fixed on initial balance) | 'trailing-relative' (trails highwater, locks at initial) | 'eod-trailing'
//
// `refundable` (bool) : les frais du challenge sont-ils remboursés une fois financé.
// `refundNote` (string, optionnel) : détail FR affiché à la place de la phrase générique
//   « remboursé avec le 1er payout » quand les conditions réelles diffèrent (ex : The
//   Funded Trader = bonus au 3e payout, The5ers = 70% des frais).

// NOTE i18n : ces labels/notes FR sont canoniques pour les pages publiques /cfd (FR-only).
// Les composants in-app (CfdAccountModal, CfdAccountDrawer, CfdDrawdownCard, CfdComparator)
// passent par les clés app.cfd.reputation.* / app.cfd.basisDaily.* / app.cfd.basisMax.*
// (lib/i18n.js) avec fallback sur ces constantes.
export const CFD_REPUTATION = {
  solid: { label: 'Fiable', color: '#1db87a', note: 'Historique de payouts régulier, pas de scandale notable.' },
  ok: { label: 'Correct', color: '#fac775', note: 'Globalement correct ; quelques points à surveiller.' },
  caution: { label: 'Prudence', color: '#e8504a', note: 'Réputation fragile ou incident de payouts — vérifie avant de t’engager.' },
}

export const CFD_PROPFIRM_RULES = {
  'FTMO': {
    category: 'cfd',
    website: 'https://ftmo.com',
    country: 'Czech Republic',
    reputation: 'solid',
    reputationNote: 'Une des plus établies du secteur CFD, payouts on-demand fiables.',
    platforms: ['MT4', 'MT5', 'cTrader'],
    instruments: ['Forex', 'Indices', 'Commodités', 'Crypto'],
    flagship: {
      model: 'FTMO Challenge (2-Step)',
      steps: 2,
      accountSizes: [10000, 25000, 50000, 100000, 200000],
      currency: 'multi (EUR base, USD/GBP/CHF/CAD/AUD)',
      profitTargets: [10, 5],
      dailyLoss: { pct: 5, basis: 'balance' }, // start-of-day balance, 00:00 CE(S)T
      maxLoss: { pct: 10, basis: 'static' },
      minTradingDays: 4,
      profitSplit: { from: 80, to: 90 },
      payout: { firstDays: 14, cycle: 'on-demand', min: '$20 wire / $50 crypto' },
      consistency: null,
      leverage: { forex: 100, swing: 30 },
      priceIndicative: { note: '~€155 (10k) → ~€1 080 (200k)', confidence: 'low' },
      refundable: true, // refunded with first reward
    },
    otherModels: ['FTMO Challenge (1-Step) — daily 3%, max 10% trailing EOD, 90% split, règle 50% best-day'],
    notable: 'Capital simulé. Comptes Standard : pas de hold week-end + restriction news sur compte financé (pas en éval). Swing sans ces limites.',
    sources: ['ftmo.com/en/trading-objectives', 'ftmo.com/en/1-step-challenge'],
    verified: '2026-06',
  },

  'FundedNext': {
    category: 'cfd',
    website: 'https://fundednext.com',
    country: 'UAE',
    reputation: 'solid',
    reputationNote: 'Volume de payouts élevé, modèles Stellar bien documentés.',
    platforms: ['MT4', 'MT5', 'cTrader', 'Match-Trader'],
    instruments: ['Forex', 'Indices', 'Commodités', 'Crypto'],
    flagship: {
      model: 'Stellar 2-Step',
      steps: 2,
      accountSizes: [6000, 15000, 25000, 50000, 100000, 200000],
      currency: 'USD',
      profitTargets: [8, 5],
      dailyLoss: { pct: 5, basis: 'balance+intraday-profit' }, // initial balance + booked intraday profit
      maxLoss: { pct: 10, basis: 'static' },
      minTradingDays: 5,
      profitSplit: { from: 80, to: 95 },
      payout: { firstDays: 21, cycle: '14 jours', min: '2% profit' },
      consistency: null, // 40% rule only with paid On-Demand add-on, on funded acct
      leverage: { forex: 100 }, // commonly cited; per-instrument table unconfirmed
      priceIndicative: { '100000': 549, note: '100k = $549 (confirmé) ; autres tailles non confirmées', confidence: 'medium' },
      refundable: true, // refunded with first funded payout
      refundNote: 'Oui — remboursé avec le 1er payout du compte financé',
    },
    otherModels: ['Stellar 1-Step (10%, daily 3%, max 6% static)', 'Stellar Lite (8/4, daily 4%, max 8% static, pas de reward en éval)', 'Stellar Instant (pas de daily, max 6% trailing)'],
    notable: 'Express & Evaluation arrêtés aux nouveaux clients depuis mars 2025. Reward share base 80% depuis le 12 janv 2026. News autorisées (financé : trades ±5 min high-impact = 40% du profit).',
    sources: ['help.fundednext.com (Stellar 2-Step rules/target/reward)'],
    verified: '2026-06',
  },

  'The5ers': {
    category: 'cfd',
    website: 'https://the5ers.com',
    country: 'Israel',
    reputation: 'solid',
    reputationNote: 'Firme établie (depuis 2016), scaling agressif, payouts réguliers.',
    platforms: ['MT5', 'cTrader'],
    instruments: ['Forex', 'Métaux', 'Indices', 'Commodités', 'Crypto'],
    flagship: {
      model: 'High Stakes (2-Step)',
      steps: 2,
      // ✓ Vérifié juillet 2026 (help.the5ers.com) : gamme High Stakes actuelle
      // 2.5K/5K/10K/25K/50K/100K (l'ancienne échelle $5K/$20K/$60K/$100K est obsolète).
      accountSizes: [2500, 5000, 10000, 25000, 50000, 100000],
      currency: 'USD',
      profitTargets: [10, 5], // "New" version ; variante "Classic" 8/5
      dailyLoss: { pct: 5, basis: 'higher-of-balance-equity' }, // prev-day close, higher of bal/equity
      maxLoss: { pct: 10, basis: 'static' },
      minTradingDays: 3, // profitable days
      profitSplit: { from: 80, to: 100 },
      payout: { firstDays: 14, cycle: '14 jours', min: '$150' },
      consistency: 'Soft : tailles de position cohérentes (pas de trade x10 final)',
      leverage: { forex: 100 },
      priceIndicative: { note: 'dès ~$39 (5k) — non confirmé (site 503)', confidence: 'low' },
      refundable: true, // 70% fee refund at funded stage + hub credit
      refundNote: 'Partiel — 70% des frais remboursés au passage en financé (+ crédit hub)',
    },
    otherModels: ['Hyper Growth (1-step/instant, daily 3% pause, max 6% static, balance double par +10%)', 'Bootcamp (3-step, ~6%, max 5%)', 'ProGrowth (nouveau 1-step, 10%, max 6%)'],
    notable: 'News : pas d’exécution ±2 min high-impact. Interdits : HFT, arbitrage, bracketing, copy entre traders.',
    sources: ['help.the5ers.com (High Stakes general rules / drawdown / payout)'],
    verified: '2026-06',
  },

  'E8 Markets': {
    category: 'cfd',
    website: 'https://e8markets.com',
    country: 'USA',
    reputation: 'ok',
    reputationNote: 'Produits récents (E8 One/Signature) bien notés ; modèles Track/Classic moins documentés.',
    platforms: ['cTrader', 'Match-Trader', 'MT5', 'TradeLocker'],
    instruments: ['Forex', 'Indices', 'Métaux', 'Crypto'],
    flagship: {
      model: 'E8 One (1-Step, personnalisable)',
      steps: 1,
      accountSizes: [5000, 10000, 25000, 50000, 100000, 250000, 500000],
      currency: 'USD',
      profitTargets: [6], // preset ; personnalisable 6–21%
      dailyLoss: { pct: 3, basis: 'balance' }, // start-of-day balance ; personnalisable
      maxLoss: { pct: 4, basis: 'trailing-relative' }, // personnalisable jusqu'à 14%
      minTradingDays: 0,
      profitSplit: { from: 80, to: 100 },
      payout: { firstDays: null, cycle: 'on-demand', min: '> 50% du daily DD' },
      consistency: '40% best-day (sur compte financé)',
      leverage: { forex: 30, indices: 15, metals: 15, crypto: 1 },
      priceIndicative: { note: '~$40 (5k) → ~$1 627 (500k) — non confirmé (checkout dynamique)', confidence: 'low' },
      refundable: null,
    },
    otherModels: ['E8 Signature Forex (1-step, max 4% EOD trailing, daily pause 2%, consistency 35%)', 'E8 Track (3-step, 8/4/4, max 8% static)', 'E8 Classic (2-step, 8/4)'],
    notable: 'Drawdowns personnalisables (target/daily/max liés). US : MT5/cTrader bloqués. Paiements passés en on-demand (~avr 2026).',
    sources: ['help.e8markets.com/articles/11775980-e8-one', 'help.e8markets.com/articles/11755943-e8-signature-forex'],
    verified: '2026-06',
  },

  'FundingPips': {
    category: 'cfd',
    website: 'https://fundingpips.com',
    country: 'UAE',
    reputation: 'ok',
    reputationNote: 'Croissance rapide ; structure de payout flexible (split selon cadence).',
    platforms: ['MT5', 'Match-Trader', 'cTrader'],
    instruments: ['Forex', 'Indices', 'Métaux', 'Commodités', 'Crypto'],
    flagship: {
      model: '2-Step Standard',
      steps: 2,
      accountSizes: [5000, 10000, 25000, 50000, 100000],
      currency: 'USD',
      profitTargets: [8, 5], // variante 10% existe
      dailyLoss: { pct: 5, basis: 'higher-of-balance-equity' }, // higher of opening bal/equity, 00:00 CET
      maxLoss: { pct: 10, basis: 'static' },
      minTradingDays: 3,
      profitSplit: { from: 60, to: 100 }, // 60 weekly / 80 biweekly / 90 on-demand / 100 monthly
      payout: { firstDays: 7, cycle: 'hebdo→mensuel (split variable)', min: '1% (2% on-demand)' },
      consistency: 'On-demand payout : 35% consistency',
      leverage: { forex: 100 },
      priceIndicative: { '5000': 36, '10000': 66, '25000': 156, '50000': 289, '100000': 529, note: 'indicatif 3rd-party', confidence: 'low' },
      refundable: true, // 1-Step & 2-Step Standard only
    },
    otherModels: ['1-Step (10%, daily 3%, max 6% static)', '2-Step Pro (6/6, daily 3%, max 6%)', '2-Step Flex (10/6, max 12%)', 'Zero (instant, max 5% trailing, consistency 15%)'],
    notable: 'Hold week-end désactivé sur comptes financés depuis le 29 janv 2026 (autorisé en éval). Max DD static sauf Zero (trailing).',
    sources: ['fundingpips.com/trading-objectives', 'help.fundingpips.com (1/2-Step, Zero)'],
    verified: '2026-06',
  },

  'Alpha Capital Group': {
    category: 'cfd',
    website: 'https://alphacapitalgroup.uk',
    country: 'UK',
    reputation: 'ok',
    reputationNote: 'Gamme large (1/2/3-step) ; tarifs et split haut de gamme non tous confirmés.',
    platforms: ['MT5', 'cTrader', 'DXtrade', 'TradeLocker'],
    instruments: ['Forex', 'Indices', 'Métaux', 'Pétrole'],
    flagship: {
      model: 'Alpha Pro 10% (2-Step)',
      steps: 2,
      accountSizes: [5000, 10000, 25000, 50000, 100000, 200000, 300000],
      currency: 'USD',
      profitTargets: [10, 5],
      dailyLoss: { pct: 5, basis: 'balance' },
      maxLoss: { pct: 10, basis: 'static' },
      minTradingDays: 3,
      profitSplit: { from: 80, to: 80 }, // scaling vers 90% non confirmé officiellement
      payout: { firstDays: null, cycle: 'on-demand ou bi-hebdo', min: '2% gross + 40% best-day' },
      consistency: '40% best-day (req balance = bestday × 2.5)',
      leverage: { forex: 100, metals: 30, indices: 20, oil: 10 },
      priceIndicative: { note: '~$50 (5k) → ~$997 (200k) — non confirmé (page 403)', confidence: 'low' },
      refundable: false,
    },
    otherModels: ['Alpha One (1-step, daily 4%, max 6% trailing — seul modèle trailing)', 'Alpha Pro 6% / 8%', 'Alpha Swing (2-step, on-demand only)', 'Alpha Three (3-step, 8/4/4, max 6% static)'],
    notable: 'Trade min 2 min. Pas de group/copy. EAs MT5 (risk-mgmt) sur approbation. Alloc max $400k sur 4 plans. Pas d’expiration.',
    sources: ['help.alphacapitalgroup.uk (Alpha One/Pro/Swing/Three)'],
    verified: '2026-06',
  },

  'Funded Trading Plus': {
    category: 'cfd',
    website: 'https://fundedtradingplus.com',
    country: 'UK',
    reputation: 'solid',
    reputationNote: 'Trustpilot ~4.4★, payouts ~2 j ouvrés. Racheté par Instant Funding (mai 2026) — à surveiller.',
    platforms: ['MT5', 'cTrader', 'DXtrade', 'Match-Trader'],
    instruments: ['Forex', 'Indices', 'Commodités', 'Crypto'],
    flagship: {
      model: '2-Step Classic',
      steps: 2,
      accountSizes: [5000, 25000, 50000, 100000, 200000],
      currency: 'USD',
      profitTargets: [7, 7], // 8/5 selon une source (probablement périmé)
      dailyLoss: { pct: 4, basis: 'balance' }, // prior-day balance
      maxLoss: { pct: 8, basis: 'static' },
      minTradingDays: 0,
      profitSplit: { from: 80, to: 100 }, // 90% à 20% profit, 100% à 30%
      payout: { firstDays: 10, cycle: '~7 jours', min: '$50' },
      consistency: '35% (éval) / 50% (financé)',
      leverage: { forex: 50, metals: 20, indices: 20, energy: 5, crypto: 2 },
      priceIndicative: { note: '~$89/10k de taille ; 100k ≈ $549 — indicatif', confidence: 'low' },
      refundable: true, // refunded with first payout (likely)
    },
    otherModels: ['Instant Funding (pas de target, daily 6%, max 6% trailing relatif, pas de hold week-end)', '1-Step Express (10%, daily 4%, max 6% trailing relatif, hold week-end ok)'],
    notable: 'Swap-free. 1 trade / 30 j sinon clôture. Anciennes gammes (Prestige/Master…) retirées ~avr 2026.',
    sources: ['help.fundedtradingplus.com (instant / 1-step-express / consistency / leverage)'],
    verified: '2026-06',
  },

  'The Funded Trader': {
    category: 'cfd',
    website: 'https://thefundedtraderprogram.com',
    country: 'Cayman Islands',
    reputation: 'caution',
    reputationNote: '⚠️ Suspension des payouts en mars 2024 ($2M+ contestés), relocalisation Cayman. Réputation 2026 toujours mitigée — vérifie avant de t’engager.',
    platforms: ['Match-Trader', 'cTrader', 'DXtrade', 'MT5'],
    instruments: ['Forex', 'Métaux', 'Indices', 'Crypto'],
    flagship: {
      model: 'Standard (2-Step)',
      steps: 2,
      accountSizes: [5000, 10000, 25000, 50000, 100000, 200000],
      currency: 'USD',
      profitTargets: [10, 5],
      dailyLoss: { pct: 5, basis: 'balance' }, // 5pm EST daily balance lock
      maxLoss: { pct: 10, basis: 'static' },
      minTradingDays: 3,
      profitSplit: { from: 80, to: 95 },
      payout: { firstDays: 14, cycle: '14 jours', min: '0.25% du solde' },
      consistency: '50% du profit net (selon programme)',
      leverage: { forex: 50 }, // historiquement 1:200, conflit
      priceIndicative: { note: 'prix 3rd-party uniquement, conflits (100k ~$489–$600)', confidence: 'low' },
      refundable: true, // bonus = fee, paid with 3rd payout (not cash refund)
      refundNote: 'Oui — sous forme de bonus (pas de cash), versé avec le 3e payout',
    },
    otherModels: ['Rapid / Royal / Royal Pro (2-step)', 'Knight / Knight Pro (1-step, max 8% relatif)', 'Dragon (3-step)', 'Classic 1-Step / 2-Step'],
    notable: 'Standard : news interdites + pas de hold week-end. Gros roster (9 programmes). Remboursement = bonus (pas cash) au 3e payout.',
    sources: ['help.thefundedtraderprogram.com (programmes, 403 — 3rd-party cross-check)'],
    verified: '2026-06',
  },

  'Blueberry Funded': {
    category: 'cfd',
    website: 'https://blueberryfunded.com',
    country: 'Australia',
    reputation: 'caution',
    reputationNote: '⚠️ Trustpilot ~3.1★ ; plaintes récurrentes de comptes cassés juste avant payout. Payouts existent mais l’application des règles au moment du payout est critiquée.',
    platforms: ['MT4', 'MT5', 'cTrader', 'DXtrade'], // 3rd-party
    instruments: ['Forex', 'Indices', 'Métaux', 'Crypto'],
    flagship: {
      model: '2-Step Challenge',
      steps: 2,
      accountSizes: [5000, 10000, 25000, 50000, 100000, 200000],
      currency: 'USD',
      profitTargets: [10, 5],
      dailyLoss: { pct: 5, basis: 'higher-of-balance-equity' }, // static $ once set, reset 5pm EST
      maxLoss: { pct: 10, basis: 'static' },
      minTradingDays: 3, // day counts if >=0.5% realized
      profitSplit: { from: 80, to: 90 },
      payout: { firstDays: 14, cycle: '14 jours (add-ons 7j/on-demand)', min: '$100' },
      consistency: null,
      leverage: { forex: 50, indices: 10, metals: 10, crypto: 2 },
      priceIndicative: { note: 'headline ~$300 (2-step) — par taille non confirmé', confidence: 'low' },
      refundable: null,
    },
    otherModels: ['1-Step (10%, daily 4%, max 6% static)', 'Prime 2-Step (8/6)', 'Instant Elite (max 10% trailing)', 'Instant Lite (daily 2%, max 4% trailing)'],
    notable: 'Ruleset refondu le 12 mars 2026 (martingale/grid désormais autorisés). Financé : risque par trade plafonné à 1,5%. Inactivité 30 j = breach.',
    sources: ['help.blueberryfunded.com (1-step / 2-step / scaling / payout)'],
    verified: '2026-06',
  },
}

// Display order for the CFD index / comparator (solid firms first, caution last).
export const CFD_FIRM_ORDER = [
  'FTMO',
  'FundedNext',
  'The5ers',
  'Funded Trading Plus',
  'E8 Markets',
  'FundingPips',
  'Alpha Capital Group',
  'Blueberry Funded',
  'The Funded Trader',
]

// Basis labels for UI (FR — canonical for the public /cfd pages; in-app components
// resolve app.cfd.basisDaily.* / app.cfd.basisMax.* first and fall back to these).
export const CFD_DAILY_BASIS_LABEL = {
  'balance': 'Solde (début de journée)',
  'equity': 'Equity',
  'higher-of-balance-equity': 'Le plus haut entre solde et equity',
  'balance+intraday-profit': 'Solde initial + profit intraday',
}
export const CFD_MAX_BASIS_LABEL = {
  'static': 'Statique (sur solde initial)',
  'trailing-relative': 'Trailing relatif (verrouille au solde initial)',
  'eod-trailing': 'Trailing EOD',
}
