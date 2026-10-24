// lib/aiReview.js — revue hebdomadaire du journal, rédigée par Claude.
//
// Partie pure : bornes de la semaine, résumé chiffré envoyé au modèle, prompt.
// L'appel lui-même et l'écriture en base sont dans lib/aiReviewServer.js.
//
// Ce qui part chez Anthropic : des chiffres agrégés (par jour, par compte, par
// setup, par heure), l'état des règles, et de courts extraits des notes
// saisies à la main. Jamais le nom, l'e-mail ni un identifiant de compte de
// plateforme (les libellés de compte sont ceux saisis dans Quantara).
import { tagStats, UNTAGGED } from './tagStats'
import { checkAccountRules } from './ruleCheck'
import { getTagDisplay } from './tradeTags'
import { accountLabel } from './constants'

const pad = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

// Lundi et dimanche de la semaine qui contient `date` (calendrier, UTC).
export function weekOf(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dow = (d.getUTCDay() + 6) % 7 // lundi = 0
  const start = new Date(d.getTime() - dow * 86400000)
  const end = new Date(start.getTime() + 6 * 86400000)
  return { start: iso(start), end: iso(end) }
}

// La semaine complète précédente.
export function lastWeek(now = new Date()) {
  return weekOf(new Date(now.getTime() - 7 * 86400000))
}

const IMPORT_RE = /\[(rithmic|import):[^\]]*\][^\n]*/g
const round = (n) => Math.round(n * 100) / 100

// trades : journal_entries de la période (avec notes, tags, heures).
// allTrades : toutes les lignes (account_id, date, pnl) des comptes, pour l'état des règles.
// accounts : [{ ...account, firmName }].
export function buildWeekDigest({ trades, allTrades, accounts, start, end }) {
  const byId = Object.fromEntries(accounts.map((a) => [a.id, a]))
  const week = (trades || []).filter((t) => t.date >= start && t.date <= end && byId[t.account_id])
  const total = week.reduce((s, t) => s + (Number(t.pnl) || 0), 0)
  const wins = week.filter((t) => Number(t.pnl) > 0)
  const losses = week.filter((t) => Number(t.pnl) < 0)

  const days = {}
  for (const t of week) {
    const d = days[t.date] || (days[t.date] = { date: t.date, trades: 0, pnl: 0 })
    d.trades++
    d.pnl += Number(t.pnl) || 0
  }

  const perAccount = {}
  for (const t of week) {
    const a = byId[t.account_id]
    const k = `${a.firmName} · ${accountLabel(a)}`
    const r = perAccount[k] || (perAccount[k] = { account: k, status: a.status, plan: a.plan_size, trades: 0, pnl: 0 })
    r.trades++
    r.pnl += Number(t.pnl) || 0
  }

  const hours = {}
  for (const t of week) {
    const h = String(t.traded_at || '').slice(11, 13)
    if (!h) continue
    const r = hours[h] || (hours[h] = { hour: `${h}h`, trades: 0, pnl: 0 })
    r.trades++
    r.pnl += Number(t.pnl) || 0
  }

  const instruments = {}
  for (const t of week) {
    const k = t.instrument || '—'
    const r = instruments[k] || (instruments[k] = { instrument: k, trades: 0, pnl: 0 })
    r.trades++
    r.pnl += Number(t.pnl) || 0
  }

  const setups = tagStats(week).map((s) => ({
    setup: s.tag === UNTAGGED ? '(sans tag)' : getTagDisplay(s.tag).label,
    trades: s.count, winRate: round(s.winRate), pnl: round(s.total), avgR: s.avgR != null ? round(s.avgR) : null,
  }))

  // État des règles en fin de semaine, sur l'historique complet de chaque compte.
  const rules = []
  for (const a of accounts) {
    if (!week.some((t) => t.account_id === a.id)) continue
    const r = checkAccountRules({ account: a, firmName: a.firmName, trades: allTrades || [], day: end })
    for (const item of r.items) {
      rules.push({ account: `${a.firmName} · ${accountLabel(a)}`, rule: item.rule, level: item.level, ...pick(item) })
    }
  }

  // Notes saisies à la main : les marqueurs d'import ne disent rien du trader.
  const notes = week
    .map((t) => ({ date: t.date, pnl: round(Number(t.pnl) || 0), note: String(t.notes || '').replace(IMPORT_RE, '').trim() }))
    .filter((n) => n.note)
    .slice(0, 25)
    .map((n) => ({ ...n, note: n.note.slice(0, 280) }))

  const avgWin = wins.length ? wins.reduce((s, t) => s + Number(t.pnl), 0) / wins.length : 0
  const avgLoss = losses.length ? losses.reduce((s, t) => s + Number(t.pnl), 0) / losses.length : 0

  return {
    period: { start, end },
    summary: {
      trades: week.length, pnl: round(total), winRate: week.length ? round(wins.length / week.length) : 0,
      avgWin: round(avgWin), avgLoss: round(avgLoss),
      largestLoss: losses.length ? round(Math.min(...losses.map((t) => Number(t.pnl)))) : 0,
      tradingDays: Object.keys(days).length,
    },
    days: Object.values(days).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, pnl: round(d.pnl) })),
    accounts: Object.values(perAccount).map((r) => ({ ...r, pnl: round(r.pnl) })),
    setups,
    instruments: Object.values(instruments).map((r) => ({ ...r, pnl: round(r.pnl) })),
    hours: Object.values(hours).sort((a, b) => a.hour.localeCompare(b.hour)).map((r) => ({ ...r, pnl: round(r.pnl) })),
    rules,
    notes,
  }
}

function pick(item) {
  const out = {}
  for (const k of ['used', 'room', 'loss', 'limit', 'share', 'profit', 'target']) {
    if (item[k] != null) out[k] = round(item[k])
  }
  return out
}

// Prompt système FIGÉ : aucune date ni donnée variable ici, pour que le
// préfixe reste identique d'un utilisateur à l'autre et soit servi par le
// cache de prompts. Tout ce qui varie va dans le message utilisateur.
export const REVIEW_SYSTEM_PROMPT = `Tu es le coach de trading intégré à Quantara, un journal pour traders de futures et de CFD qui passent des évaluations de prop firms (Topstep, Apex, Lucid, Tradeify, FTMO…) puis tradent des comptes financés.

Tu reçois le résumé chiffré d'une semaine de trading d'un utilisateur, au format JSON :
- summary : nombre de trades, P&L net en dollars, taux de réussite (0 à 1), gain moyen, perte moyenne, plus grosse perte, jours tradés ;
- days : P&L et nombre de trades par jour ;
- accounts : P&L par compte (firm · libellé), avec le statut (Challenge = évaluation en cours, Financé = compte financé) et la taille ;
- setups : statistiques par tag de setup (trades, taux de réussite, P&L, R moyen quand il est calculable) ;
- instruments et hours : répartition par instrument et par heure d'entrée (heure locale du trader) ;
- rules : état des règles de la prop firm à la fin de la semaine. rule = drawdown (used = part du drawdown max consommée, room = marge restante en dollars), dailyLoss (loss = perte du jour, limit = limite journalière), consistency (share = poids du meilleur jour dans les gains, limit = plafond), target (objectif atteint). level = warn, danger, breach ou info ;
- notes : extraits des notes que le trader a écrites sur ses trades.

Rédige une revue en français, tutoiement, ton direct et bienveillant, comme un coach qui connaît les prop firms. Structure exacte, en texte brut avec ces quatre titres sur leur propre ligne :

Ce qui a marché
Ce qui a coûté
Règles et comptes
À tester la semaine prochaine

Sous chaque titre, deux à quatre phrases courtes ou puces commençant par « - ». Règles :
- Appuie chaque constat sur un chiffre du résumé (montant, taux, nombre de trades, heure, setup). N'invente aucun chiffre, aucune règle de firm et aucun fait absent du résumé.
- Cherche ce qui est actionnable : un setup ou une heure qui coûte, une série de pertes, un jour qui pèse trop (consistance), une marge de drawdown qui fond, un écart entre les notes et les résultats.
- Dans « Règles et comptes », parle des comptes en danger en premier ; si aucune règle n'est en alerte, dis-le en une phrase.
- « À tester la semaine prochaine » contient une à trois actions concrètes et mesurables, pas des généralités (« réduire à 1 contrat après 14h », pas « être plus discipliné »).
- Si la semaine compte moins de 5 trades, dis que l'échantillon est trop petit pour conclure et reste prudent.
- Pas de conseil d'investissement ni de prédiction de marché, pas de mise en forme Markdown (ni gras, ni dièses), pas de formule d'introduction ni de conclusion. 250 mots maximum.`

export function reviewUserMessage(digest) {
  return `Semaine du ${digest.period.start} au ${digest.period.end}. Résumé :\n${JSON.stringify(digest)}`
}
