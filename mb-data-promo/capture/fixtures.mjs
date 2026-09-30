// fixtures.mjs — un trader FICTIF, entièrement inventé, pour capturer les vraies
// pages de Quantara sans toucher à aucune donnée réelle. Déterministe (mulberry32).
export const USER_ID = '00000000-0000-4000-8000-000000000001'
export const USER = {
  id: USER_ID, aud: 'authenticated', role: 'authenticated',
  email: 'alex.demo@quantara.tech', email_confirmed_at: '2026-06-01T10:00:00Z',
  app_metadata: { provider: 'email' }, user_metadata: { username: 'alexdemo' },
  created_at: '2026-06-01T10:00:00Z',
}

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
const rnd = mulberry32(42)
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const iso = (d) => d.toISOString().slice(0, 10)
const TODAY = new Date('2026-09-29T12:00:00Z')
const daysAgo = (n) => { const d = new Date(TODAY); d.setUTCDate(d.getUTCDate() - n); return d }

export const firms = [
  { id: uid(101), name: 'Topstep', color: '#5ab0ff' },
  { id: uid(102), name: 'Apex Trader Funding', color: '#3ddba8' },
  { id: uid(103), name: 'Tradeify', color: '#a58bff' },
  { id: uid(104), name: 'My Funded Futures', color: '#ffc25c' },
  { id: uid(105), name: 'Lucid Trading', color: '#ff7a86' },
].map((f, i) => ({ ...f, user_id: USER_ID, market: 'futures', created_at: `2026-06-0${i + 1}T09:00:00Z` }))

// Comptes : un mélange crédible de financés, challenges et un échec.
const A = (n, firm, o) => ({
  id: uid(n), firm_id: firm.id, user_id: USER_ID, currency: 'USD', market: 'futures',
  activation_fee: 0, notes: '', months_count: 1, payment_mode: 'one-time',
  created_at: o.buy_date + 'T09:00:00Z', ...o,
})
export const accounts = [
  A(201, firms[0], { name: 'TS 50K #1', plan_size: '50k', program: 'XFA Standard', status: 'Financé', dd_type: 'eod', buy_date: '2026-06-03', funded_date: '2026-06-24', spent: 49, activation_fee: 149, balance: 51840, dd_floor: 50100, payout_target: 1000, min_trading_days: 5 }),
  A(202, firms[0], { name: 'TS 150K', plan_size: '150k', program: 'XFA Standard', status: 'Challenge', dd_type: 'eod', buy_date: '2026-09-02', spent: 149, balance: 152400, dd_floor: 145500 }),
  A(203, firms[1], { name: 'Apex EOD 50K', plan_size: '50k', program: 'EOD', status: 'Financé', dd_type: 'eod', buy_date: '2026-06-10', funded_date: '2026-07-02', spent: 167, activation_fee: 0, balance: 52360, dd_floor: 51990, payout_target: 1500, min_trading_days: 5 }),
  A(204, firms[1], { name: 'Apex EOD 100K', plan_size: '100k', program: 'EOD', status: 'Financé', dd_type: 'eod', buy_date: '2026-06-18', funded_date: '2026-07-15', spent: 247, balance: 104920, dd_floor: 101100, payout_target: 2000, min_trading_days: 5 }),
  A(205, firms[1], { name: 'Apex Intraday 25K', plan_size: '25k', program: 'Intraday', status: 'Échoué', dd_type: 'intraday', buy_date: '2026-07-20', spent: 167 }),
  A(206, firms[2], { name: 'Tradeify Select 100K', plan_size: '100k', program: 'Select Flex', status: 'Financé', dd_type: 'eod', buy_date: '2026-07-01', funded_date: '2026-07-19', spent: 259, balance: 103150, dd_floor: 100100, payout_target: 3000, min_trading_days: 5 }),
  A(207, firms[3], { name: 'MFFU Rapid 50K', plan_size: '50k', program: 'Rapid', status: 'Challenge', dd_type: 'eod', buy_date: '2026-09-10', spent: 209, balance: 51210, dd_floor: 49400 }),
  A(208, firms[4], { name: 'LucidFlex 50K', plan_size: '50k', program: 'LucidFlex', status: 'Financé', dd_type: 'eod', buy_date: '2026-08-04', funded_date: '2026-08-14', spent: 130, balance: 51720, dd_floor: 50100, payout_target: 2000, min_trading_days: 5 }),
]

const P = (n, acct, date, amount, note = '') => ({ id: uid(n), account_id: acct.id, user_id: USER_ID, date, amount, note, created_at: date + 'T15:00:00Z' })
export const payouts = [
  P(301, accounts[0], '2026-07-22', 1350), P(302, accounts[0], '2026-08-26', 1800),
  P(303, accounts[2], '2026-08-05', 1500), P(304, accounts[2], '2026-09-09', 1500),
  P(305, accounts[3], '2026-08-19', 2000), P(306, accounts[5], '2026-08-28', 2700),
  P(307, accounts[7], '2026-09-17', 1000),
]

// Trades : 3 mois de séances, instruments et heures réalistes, légère espérance positive.
const INSTR = ['NQ', 'ES', 'MNQ', 'MES', 'CL', 'GC']
const TAGS = [['A+ setup'], ['ORB'], ['VWAP reclaim'], ['news'], ['revenge'], ['breakout'], []]
const live = accounts.filter(a => a.status !== 'Échoué' || a.id === uid(205))
export const journal_entries = []
let n = 400
for (let d = 92; d >= 1; d--) {
  const day = daysAgo(d); const wd = day.getUTCDay(); if (wd === 0 || wd === 6) continue
  const k = 1 + Math.floor(rnd() * 3)
  for (let i = 0; i < k; i++) {
    const acct = live[Math.floor(rnd() * live.length)]
    if (acct.buy_date > iso(day)) continue
    const win = rnd() < 0.56
    const size = acct.plan_size === '150k' ? 3 : acct.plan_size === '100k' ? 2 : 1
    const pnl = Math.round((win ? 120 + rnd() * 520 : -(90 + rnd() * 380)) * size)
    const instrument = INSTR[Math.floor(rnd() * (rnd() < 0.7 ? 4 : 6))]
    const hour = [9, 9, 10, 10, 10, 11, 13, 14, 15][Math.floor(rnd() * 9)]
    const min = Math.floor(rnd() * 59)
    const t = new Date(day); t.setUTCHours(hour + 4, min, 0, 0) // ET → UTC (EDT)
    const side = rnd() < 0.55 ? 'Long' : 'Short'
    journal_entries.push({
      id: uid(n++), user_id: USER_ID, account_id: acct.id, date: iso(day), traded_at: t.toISOString(),
      pnl, instrument, side, quantity: size, notes: win ? 'Plan respecté, sortie sur objectif.' : 'Stop touché — taille respectée.',
      tags: TAGS[Math.floor(rnd() * TAGS.length)], commissions: +(4.2 * size).toFixed(2), slippage: 0,
      created_at: t.toISOString(),
    })
  }
}

// Le trade du plan « réplication » : saisi UNE fois, enregistré sur trois comptes
// (c'est exactement ce que produit « Ajouter sur 3 comptes »).
for (const [k, acct] of [[0, accounts[0]], [1, accounts[2]], [2, accounts[7]]]) {
  journal_entries.push({
    id: uid(990 + k), user_id: USER_ID, account_id: acct.id, date: '2026-09-30', traded_at: '2026-09-30T14:05:00.000Z',
    pnl: 420, instrument: 'NQ', side: 'Long', quantity: 1, notes: 'ORB 9h45 — plan respecté, sortie sur objectif.',
    tags: ['ORB'], commissions: 4.2, slippage: 0, created_at: `2026-09-30T14:06:0${k}.000Z`,
  })
}

export const profiles = [{
  user_id: USER_ID, username: 'alexdemo', display_name: 'Alex Demo', avatar_url: null,
  bio: 'Day trader futures · NQ/ES · 5 comptes PropFirm', is_public: true, country: 'FR',
  trading_styles: ['day_trader'], instruments: ['NQ', 'ES', 'MNQ'], plan: 'pro', plan_status: 'active',
  beta_grandfather: true, dashboard_layout: null, created_at: '2026-06-01T10:00:00Z',
}]

export const trading_plan = [{ id: uid(501), user_id: USER_ID, content: 'Max 2 trades par séance. Stop journalier à -600 $. Pas de trade 5 min avant un news T1.', updated_at: '2026-09-01T08:00:00Z' }]
export const trading_setups = [
  { id: uid(511), user_id: USER_ID, name: 'Opening Range Breakout', description: 'Cassure du range 9h30–9h45, retest, cible 2R.', created_at: '2026-06-05T08:00:00Z' },
  { id: uid(512), user_id: USER_ID, name: 'VWAP reclaim', description: 'Reprise du VWAP après une mèche de liquidité.', created_at: '2026-06-06T08:00:00Z' },
]
export const trading_rule_items = [
  { id: uid(521), user_id: USER_ID, text: 'Jamais plus de 50 % du drawdown restant en risque sur une journée', done: false, created_at: '2026-06-05T08:00:00Z' },
  { id: uid(522), user_id: USER_ID, text: 'Couper après deux pertes consécutives', done: false, created_at: '2026-06-05T08:01:00Z' },
  { id: uid(523), user_id: USER_ID, text: 'Vérifier la règle de consistance avant chaque payout', done: false, created_at: '2026-06-05T08:02:00Z' },
]

export const TABLES = { firms, accounts, payouts, journal_entries, profiles, trading_plan, trading_setups, trading_rule_items }
