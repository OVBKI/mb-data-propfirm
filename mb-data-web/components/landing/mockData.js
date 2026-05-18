// mockData.js — scénario utilisateur fictif UNIQUE partagé par tous les mockups
// de la landing page. Modifier ce fichier propage les chiffres partout.
//
// Scénario : "Trader" — un membre Quantara depuis juin 2025
//   - 3 PropFirms : Topstep / Apex Trader Funding / Lucid Trading
//   - 9 comptes (2+1 Topstep, 2+2 Apex, 1+1 Lucid)
//   - 6 payouts cumulés depuis juin 2025
//   - Total dépensé : $905   |  Total payouts : $6,419  |  Net : +$5,514
//
// DashboardMockup est la source de vérité, AnalyticsMockup le prolonge sur 12 mois.
// Les autres mockups (Journal/Notification/Calendar/Equity) doivent référencer
// les mêmes comptes, montants et dates.

export const TRADER_NAME = 'Trader'

// Aujourd'hui : mardi 18 mai 2026 (mois 4 = mai en JS Date)
export const TODAY = new Date(2026, 4, 18)
export const TODAY_DAY = 18
export const TODAY_MONTH_FR = 'Mai 2026'

// === Couleurs partagées (mêmes valeurs que les mockups individuels) ===
export const COLORS = {
  surface:   'rgba(20,23,32,0.65)',
  surface2:  'rgba(28,32,48,0.7)',
  border:    'rgba(255,255,255,0.07)',
  text:      '#f0ede8',
  text2:     '#9098b0',
  text3:     '#5a6275',
  blue:      '#2d6fff',
  blueLight: '#4d8fff',
  green:     '#1db87a',
  red:       '#e8504a',
  amber:     '#fac775',
}

// === FIRMES (copié strictement depuis DashboardMockup actuel) ===
// PRIX RÉELS mai 2026 :
//   Topstep : challenge $49 — activation $149
//   Apex    : challenge $30 — activation $75
//   Lucid   : challenge $95 — pas d'activation
//
// Topstep : 3 comptes (2 Financés + 1 Challenge actif)
//   Dépensé = 3×49 + 2×149 = $445  | Net = +980 +860 -49 = +$1,791 | Payouts = $2,236
// Apex : 4 comptes (2 Financés + 2 Échoués)
//   Dépensé = 4×30 + 2×75 = $270   | Net = +1450 +1420 -30 -30 = +$2,810 | Payouts = $3,080
// Lucid : 2 comptes (1 Financé + 1 Échoué)
//   Dépensé = 2×95 = $190          | Net = +1008 -95 = +$913 | Payouts = $1,103
export const FIRMS = [
  {
    name: 'Topstep',
    color: '#e8504a',
    accountsCount: 3,
    payoutsCount: 2,
    net: 1791,
    roi: 402,
    spent: 445,
    payouts: 2236,
    activeCount: 2,
    accounts: [
      { name: 'PRO 1',       status: 'Financé',   net:  980 },
      { name: 'PRO 2',       status: 'Financé',   net:  860 },
      { name: 'Combine 50K', status: 'Challenge', net:  -49 },
    ],
    badges: [{ label: '2 Financés', color: COLORS.green }, { label: '1 Challenge', color: COLORS.amber }],
  },
  {
    name: 'Apex Trader Funding',
    color: '#d94a3a',
    accountsCount: 4,
    payoutsCount: 3,
    net: 2810,
    roi: 1040,
    spent: 270,
    payouts: 3080,
    activeCount: 2,
    accounts: [
      { name: 'PA-389226-04', status: 'Financé', net:  1450 },
      { name: 'PA-389226-03', status: 'Financé', net:  1420 },
      { name: 'PA-389226-02', status: 'Échoué',  net:   -30 },
    ],
    badges: [{ label: '2 Financés', color: COLORS.green }, { label: '2 Échoués', color: COLORS.red }],
  },
  {
    name: 'Lucid Trading',
    color: '#1db87a',
    accountsCount: 2,
    payoutsCount: 1,
    net: 913,
    roi: 480,
    spent: 190,
    payouts: 1103,
    activeCount: 1,
    accounts: [
      { name: 'PRO 7',   status: 'Financé', net: 1008 },
      { name: 'EVAL 17', status: 'Échoué',  net:  -95, liquidated: true },
    ],
    badges: [{ label: '1 Financé', color: COLORS.green }, { label: '1 Échoué', color: COLORS.red }],
  },
]

export const TOTALS = {
  spent: 905,
  payouts: 6419,
  net: 5514,
  payoutsCount: 6,
  accountsCount: 9,
  firmsCount: 3,
}

// === Données analytics 12 mois (Jun 2025 → Mai 2026) ===
// Aboutit aux totaux ci-dessus
export const CUM_LABELS = ['Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai']
export const CUM_SPENT  = [  75,  135,  195,  290,  390,  480,  545,  625,  695,  770,  840,  905 ]
export const CUM_PAYOUT = [   0,  230,  560,  890, 1380, 1850, 2380, 2980, 3520, 4280, 5180, 6419 ]

// Bilans annuels
export const YEAR_LABELS  = ['2025', '2026']
export const YEAR_SPENT   = [ 545, 360 ]
export const YEAR_PAYOUT  = [2380, 4039]

// Bilans mensuels 2026 (Jan → Mai, 5 mois écoulés au 18 mai 2026)
export const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai']
export const MONTH_SPENT  = [  80,   70,   75,   70,   65 ]
export const MONTH_PAYOUT = [ 600,  540,  760,  900, 1239 ]

// === PNL mai 2026 (extraits des données analytics) ===
// Payouts du mois : $1,239  |  Dépensé : $65  |  Net mai : +$1,174
export const PNL_MAY = {
  payouts: 1239,
  spent: 65,
  net: 1174,            // = 1239 - 65
  netDisplay: '+$1,174',
}

// === Calendrier journal (Mai 2026 — today = mardi 18) ===
// PnL trading Mai 2026 = somme des trades bruts (saisis manuellement)
// Net après frais (-$65 challenge Topstep) = +$1,174 → affiché PNL Mai 2026.
//
// 18 mai 2026 = MARDI (indiqué par l'utilisateur).
//   → 4 mai = mardi · 11 mai = mardi
//   → 1 mai 2026 = VENDREDI (4 mai mardi - 3 jours = samedi... non : -3j de mardi = samedi)
//   Recalcul : mardi 4 mai − 3 jours = samedi 1 mai
//   Donc :  Sam 1 · Dim 2 · Lun 3 · Mar 4 · Mer 5 · Jeu 6 · Ven 7
//   Sem suivante : Sam 8 Dim 9 / Lun 10 Mar 11 Mer 12 Jeu 13 Ven 14
//                  Sam 15 Dim 16 / Lun 17 Mar 18 (TODAY) Mer 19 Jeu 20 Ven 21
//                  Sam 22 Dim 23 / Lun 24 Mar 25 Mer 26 Jeu 27 Ven 28
//                  Sam 29 Dim 30 / Lun 31
// Grille Lun-Mar-Mer-Jeu-Ven-Sam-Dim, 6 lignes :
//   L1 : Lun 27avr Mar 28avr Mer 29avr Jeu 30avr Ven 1mai? non Ven 1 mai n'existe pas
//   1 mai = SAMEDI donc :
//   L1 : Lun 27 / Mar 28 / Mer 29 / Jeu 30 avr / Ven 1 mai (NON 1 mai = sam)
// Je dois recalculer : si 18 mai = mardi, alors :
//   18 mai mardi → 17 mai lundi → 16 mai dim → 15 mai sam → 14 mai ven
//   ... 11 mai = mardi · 4 mai = mardi · 3 mai = lundi · 2 mai = dim · 1 mai = SAMEDI · 30 avr = vendredi · 29 avr = jeudi · 28 avr = mercredi · 27 avr = mardi · 26 avr = lundi
// Donc grille L-M-M-J-V-S-D commence sur le lundi 27 avril :
//   L1 : 27 28 29 30 avr | 1 mai (sam? NON c'est ven? ...)
// ERREUR : si 27 avr = mardi, alors la première colonne Lundi de la grille = 26 avril.
// Recommençons proprement, jours de la semaine :
//   Lun 27 avr ? NON 27 avr = lundi seulement si 28 avr = mardi
//   Or 28 avr = ? : 4 mai mardi − 6 jours = mercredi 28 avr.
//   Donc 28 avr = mercredi → 27 avr = mardi → 26 avr = lundi
// L1 Lun-Dim : 26 27 28 29 30 avr | 1 2 mai
//   = Lun 26 / Mar 27 / Mer 28 / Jeu 29 / Ven 30 avr / Sam 1 / Dim 2
// L2 : Lun 3 / Mar 4 / Mer 5 / Jeu 6 / Ven 7 / Sam 8 / Dim 9
// L3 : Lun 10 / Mar 11 / Mer 12 / Jeu 13 / Ven 14 / Sam 15 / Dim 16
// L4 : Lun 17 / Mar 18 (today) / Mer 19 / Jeu 20 / Ven 21 / Sam 22 / Dim 23
// L5 : Lun 24 / Mar 25 / Mer 26 / Jeu 27 / Ven 28 / Sam 29 / Dim 30
// L6 : Lun 31 / 1 jun ...
export const CAL_DAYS = [
  // Semaine 1 (lun 26 → dim 2 mai)
  { day: 26, other: true }, { day: 27, other: true }, { day: 28, other: true },
  { day: 29, other: true }, { day: 30, other: true }, { day: 1 }, { day: 2 },
  // Semaine 2 (lun 3 → dim 9) — 5 trading days
  { day: 3 }, { day: 4, pnl: 245, count: 3 }, { day: 5, pnl: -89, count: 2 },
  { day: 6, pnl: 178, count: 4 }, { day: 7, pnl: 312, count: 5 }, { day: 8 }, { day: 9 },
  // Semaine 3 (lun 10 → dim 16)
  { day: 10, pnl: 156, count: 3 }, { day: 11, pnl: -67, count: 2 },
  { day: 12, pnl: 220, count: 4 }, { day: 13, pnl: 432, count: 6 },
  { day: 14, pnl: 285, count: 4 }, { day: 15 }, { day: 16 },
  // Semaine 4 (lun 17 → dim 23) — today = mar 18
  { day: 17, pnl: -95, count: 3 }, { day: 18, pnl: 197, count: 3, today: true },
  { day: 19 }, { day: 20 }, { day: 21 }, { day: 22 }, { day: 23 },
  // Semaine 5 (lun 24 → dim 30)
  { day: 24 }, { day: 25 }, { day: 26 }, { day: 27 },
  { day: 28 }, { day: 29 }, { day: 30 },
  // Semaine 6
  { day: 31 },
  { day: 1, other: true }, { day: 2, other: true }, { day: 3, other: true },
  { day: 4, other: true }, { day: 5, other: true }, { day: 6, other: true },
]

// === Notifications (cohérentes avec Dashboard) ===
// Toutes les notifs réfèrent à des firmes/comptes/montants qui existent dans FIRMS.
export const NOTIFICATIONS = [
  {
    icon: '⏰',
    color: COLORS.amber,
    bg: 'rgba(250,199,117,0.15)',
    border: 'rgba(250,199,117,0.35)',
    title: 'Topstep prélève dans 48h',
    body: 'Ton Combine 50K sera renouvelé le 20 mai. Montant : $49.',
    time: 'IL Y A 4 MIN',
  },
  {
    icon: '💰',
    color: COLORS.green,
    bg: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.35)',
    title: 'Payout disponible',
    body: 'Tu peux demander ton payout sur Apex PA-389226-04 — Consistency OK (34%).',
    time: 'IL Y A 18 MIN',
  },
  {
    icon: '📊',
    color: COLORS.blueLight,
    bg: 'rgba(77,143,255,0.15)',
    border: 'rgba(77,143,255,0.35)',
    title: 'Récap mensuel prêt',
    body: 'Avril 2026 : +$830 net après 3 payouts. ROI mois : 1186%.',
    time: 'IL Y A 36 MIN',
  },
]

// === EquityCurve : compte Lucid PRO 7 (existe dans FIRMS Lucid) ===
// Net PRO 7 = +$1,008 → start $50,000 / end ≈ $51,008
// Plage : 12 jours du 7 mai au 18 mai 2026 (today inclus, pas de futur)
export const EQUITY_DAYS = [
  '2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10',
  '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14',
  '2026-05-15', '2026-05-16', '2026-05-17', '2026-05-18',
]
// Balance progresse de 50000 → 51008 avec quelques dips réalistes
export const EQUITY_BALANCES = [
  50000, 50180, 50300, 50180,
  50650, 50890, 51280, 51400,
  51000, 51120, 50920, 51008,
]
// DD EOD trailing — démarre à $48K, monte par paliers
export const EQUITY_DD = [
  48000, 48000, 48000, 48000,
  48650, 48890, 49280, 49400,
  49400, 49400, 49400, 49400,
]

// === Calendrier économique : aujourd'hui = mardi 18 mai ===
// Demain = mercredi 19 mai. Events macro génériques.
export const ECON_DAYS = [
  {
    label: "Aujourd'hui · Mar 18 mai",
    events: [
      { time: '14:30', cc: 'US', cur: 'USD', name: 'Retail Sales m/m',          impact: 'High',   actual: '0.3%', forecast: '0.4%', previous: '0.6%' },
      { time: '14:30', cc: 'US', cur: 'USD', name: 'Unemployment Claims',       impact: 'High',   actual: '226K', forecast: '220K', previous: '231K' },
      { time: '15:45', cc: 'US', cur: 'USD', name: 'Fed Powell Speech',         impact: 'High',   actual: '—',    forecast: '—',    previous: '—' },
      { time: '21:30', cc: 'EU', cur: 'EUR', name: 'ECB Lagarde Speech',        impact: 'Medium', actual: '—',    forecast: '—',    previous: '—' },
    ],
  },
  {
    label: 'Demain · Mer 19 mai',
    events: [
      { time: '14:30', cc: 'US', cur: 'USD', name: 'CPI m/m',                   impact: 'High',   actual: '—',    forecast: '0.3%', previous: '0.4%' },
      { time: '16:00', cc: 'US', cur: 'USD', name: 'UoM Consumer Sentiment',    impact: 'Medium', actual: '—',    forecast: '77.5', previous: '77.2' },
      { time: '16:00', cc: 'CA', cur: 'CAD', name: 'BOC Financial Review',      impact: 'Low',    actual: '—',    forecast: '—',    previous: '—' },
    ],
  },
]
