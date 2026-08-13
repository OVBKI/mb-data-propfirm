'use client'
// CalendarPage — Calendrier économique (data : ForexFactory).
// Direction design : "Financial Terminal Editorial" — typographie serif sur
// les titres pour l'éditorial, monospace partout sur les nombres pour la
// précision trader, fond dot-grid subtil, accents d'impact vifs, indicateur
// "Now" sur la journée actuelle.
//
// Préserve : i18n (FR/EN/ES), EVENT_PATTERNS, Flag, helpers fmtDate/aColor/etc.
// Redesign complet : hero hero + week strip horizontal + day cards avec
// events en grid (pas table) + visual diff Actual vs Forecast.

import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import Skeleton from './Skeleton'
import { useDialog } from './useDialog'

const T = {
  fr: {
    title: 'Calendrier Économique',
    eyebrow: 'Live · ForexFactory',
    subtitle: 'Tous les events macro de la semaine — heures Paris (CET), actualisé chaque minute.',
    thisWeek: 'Cette semaine', nextWeek: 'Semaine prochaine', refresh: 'Actualiser',
    loading: 'Chargement...', error: 'Erreur de chargement', noEvents: 'Aucun événement', all: 'Tous',
    high: 'Fort', medium: 'Moyen', low: 'Faible',
    time: 'Heure', currency: 'Devise', event: 'Événement', actual: 'Réel', forecast: 'Prévision', previous: 'Précédent', impact: 'Impact',
    filterImpact: 'Impact', filterCurrency: 'Devises',
    lastUpdate: 'MàJ', today: "Aujourd'hui", events: 'événement', eventsP: 'événements',
    upcoming: 'À venir', past: 'Passé · données non publiées', pending: 'en attente',
    days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    daysLong: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    months: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    nextEmpty: 'La semaine prochaine n\'est pas encore publiée par ForexFactory. Réessayez plus tard.',
    todayKpi: 'Aujourd\'hui', highKpi: 'High impact', liveKpi: 'En direct',
    beat: 'Beat', miss: 'Miss', inline: 'Inline', noData: 'Pas de data',
    allCurrencies: 'Toutes les devises', majorsOnly: 'Majeures uniquement', clearAll: 'Tout effacer',
    flagFilter: 'Filtrer par devise',
    sourceLine: 'Données : ForexFactory · Indicatif uniquement.',
    nowLabel: 'Maintenant',
  },
  en: {
    title: 'Economic Calendar',
    eyebrow: 'Live · ForexFactory',
    subtitle: 'All macro events of the week — Paris time (CET), refreshed every minute.',
    thisWeek: 'This week', nextWeek: 'Next week', refresh: 'Refresh',
    loading: 'Loading...', error: 'Loading error', noEvents: 'No events', all: 'All',
    high: 'High', medium: 'Medium', low: 'Low',
    time: 'Time', currency: 'Currency', event: 'Event', actual: 'Actual', forecast: 'Forecast', previous: 'Previous', impact: 'Impact',
    filterImpact: 'Impact', filterCurrency: 'Currencies',
    lastUpdate: 'Updated', today: 'Today', events: 'event', eventsP: 'events',
    upcoming: 'Upcoming', past: 'Past · data not yet released', pending: 'pending',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    daysLong: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    nextEmpty: 'Next week\'s data is not published yet by ForexFactory. Try again later.',
    todayKpi: 'Today', highKpi: 'High impact', liveKpi: 'Live',
    beat: 'Beat', miss: 'Miss', inline: 'Inline', noData: 'No data',
    allCurrencies: 'All currencies', majorsOnly: 'Majors only', clearAll: 'Clear all',
    flagFilter: 'Filter by currency',
    sourceLine: 'Data: ForexFactory · Indicative only.',
    nowLabel: 'Now',
  },
  es: {
    title: 'Calendario Económico',
    eyebrow: 'Live · ForexFactory',
    subtitle: 'Todos los eventos macro de la semana — hora París (CET), actualizado cada minuto.',
    thisWeek: 'Esta semana', nextWeek: 'Próxima semana', refresh: 'Actualizar',
    loading: 'Cargando...', error: 'Error de carga', noEvents: 'Sin eventos', all: 'Todas',
    high: 'Alto', medium: 'Medio', low: 'Bajo',
    time: 'Hora', currency: 'Divisa', event: 'Evento', actual: 'Real', forecast: 'Previsión', previous: 'Anterior', impact: 'Impacto',
    filterImpact: 'Impacto', filterCurrency: 'Divisas',
    lastUpdate: 'Actualizado', today: 'Hoy', events: 'evento', eventsP: 'eventos',
    upcoming: 'Próximo', past: 'Pasado · datos aún no publicados', pending: 'pendiente',
    days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    daysLong: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    nextEmpty: 'Los datos de la próxima semana aún no han sido publicados. Inténtelo más tarde.',
    todayKpi: 'Hoy', highKpi: 'Alto impacto', liveKpi: 'En vivo',
    beat: 'Beat', miss: 'Miss', inline: 'Inline', noData: 'Sin datos',
    allCurrencies: 'Todas las divisas', majorsOnly: 'Mayores solamente', clearAll: 'Limpiar todo',
    flagFilter: 'Filtrar por divisa',
    sourceLine: 'Datos: ForexFactory · Indicativo solamente.',
    nowLabel: 'Ahora',
  },
}

// Devises majeures (G10) — affichées en priorité dans le filtre
const MAJOR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF']
const CURRENCY_ORDER = [
  ...MAJOR_CURRENCIES, 'CNY', 'CNH', 'HKD', 'SGD', 'KRW', 'TWD', 'THB', 'MYR',
  'IDR', 'PHP', 'VND', 'SEK', 'NOK', 'DKK', 'ISK', 'PLN', 'CZK', 'HUF', 'RON',
  'RUB', 'UAH', 'TRY', 'BGN', 'RSD', 'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN',
  'UYU', 'INR', 'AED', 'SAR', 'ILS', 'EGP', 'ZAR', 'MAD', 'NGN',
]
const CURRENCY_TO_COUNTRY = {
  USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp', CAD: 'ca', AUD: 'au', NZD: 'nz', CHF: 'ch',
  CNY: 'cn', CNH: 'cn', HKD: 'hk', SGD: 'sg', KRW: 'kr', TWD: 'tw', THB: 'th', MYR: 'my',
  IDR: 'id', PHP: 'ph', VND: 'vn', INR: 'in',
  SEK: 'se', NOK: 'no', DKK: 'dk', ISK: 'is',
  PLN: 'pl', CZK: 'cz', HUF: 'hu', RON: 'ro', RUB: 'ru', UAH: 'ua', TRY: 'tr', BGN: 'bg', RSD: 'rs',
  MXN: 'mx', BRL: 'br', ARS: 'ar', CLP: 'cl', COP: 'co', PEN: 'pe', UYU: 'uy',
  AED: 'ae', SAR: 'sa', ILS: 'il', EGP: 'eg', ZAR: 'za', MAD: 'ma', NGN: 'ng',
}

// Flag component — drapeau via image PNG (flagcdn.com), évite le bug Windows
function Flag({ country, currency, size = 18, style = {} }) {
  let code = (country || '').toLowerCase()
  if (!code && currency) code = CURRENCY_TO_COUNTRY[currency] || currency.toLowerCase()
  if (code === 'ww' || code === 'world') {
    return <span style={{ fontSize: size, lineHeight: 1, ...style }} title="World">🌍</span>
  }
  if (code === 'ez') code = 'eu'
  if (code === 'uk') code = 'gb'
  if (!code || code.length !== 2) return null
  return (
    <Image
      src={`https://flagcdn.com/w40/${code}.png`}
      alt={code.toUpperCase()}
      width={size + 4}
      height={Math.round((size + 4) * 0.7)}
      style={{
        objectFit: 'cover',
        borderRadius: 3,
        display: 'inline-block',
        verticalAlign: 'middle',
        boxShadow: '0 0 0 0.5px var(--hairline2), 0 1px 2px rgba(0,0,0,0.4)',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

// Impact color tokens — vibrant for High, calmer for Medium, muted for Low
const IC = {
  High:    { bar: 'var(--red)', text: '#ff6b66', bg: 'rgba(232,80,74,0.06)',  glow: 'rgba(232,80,74,0.25)' },
  Medium:  { bar: 'var(--amber)', text: 'var(--amber)', bg: 'rgba(250,199,117,0.04)', glow: 'rgba(250,199,117,0.15)' },
  Low:     { bar: 'var(--text3)', text: 'var(--text2)', bg: 'transparent',            glow: 'transparent' },
  Holiday: { bar: 'var(--blue-light)', text: '#7baaff', bg: 'rgba(45,111,255,0.06)',  glow: 'rgba(45,111,255,0.15)' },
}

// Traductions des événements ForexFactory (titres anglais → FR/ES)
// Inchangé depuis la version Finnhub — couvre tous les events majeurs
const EVENT_PATTERNS = [
  [/^Core CPI\b/i,                 { fr: 'IPC sous-jacent',                es: 'IPC subyacente' }],
  [/^CPI\b/i,                      { fr: 'IPC (Inflation)',                es: 'IPC (Inflación)' }],
  [/^Core PPI\b/i,                 { fr: 'IPP sous-jacent',                es: 'IPP subyacente' }],
  [/^PPI\b/i,                      { fr: 'IPP (Prix producteurs)',         es: 'IPP (Precios productores)' }],
  [/^Core PCE Price Index\b/i,     { fr: 'PCE sous-jacent (inflation Fed)', es: 'PCE subyacente' }],
  [/^PCE Price Index\b/i,          { fr: 'Indice des prix PCE',            es: 'Índice de precios PCE' }],
  [/Inflation Rate/i,              { fr: "Taux d'inflation",               es: 'Tasa de inflación' }],
  [/HICP/i,                        { fr: 'IPCH (Indice harmonisé)',        es: 'IPCA' }],
  [/Non[-\s]?Farm Employment/i,    { fr: 'Emplois non agricoles (NFP)',    es: 'Empleo no agrícola (NFP)' }],
  [/^NFP\b/i,                      { fr: 'NFP — Emplois non agricoles',    es: 'NFP — Empleo no agrícola' }],
  [/ADP.*Employment/i,             { fr: 'Emplois privés ADP',             es: 'Empleo privado ADP' }],
  [/Unemployment Rate/i,           { fr: 'Taux de chômage',                es: 'Tasa de desempleo' }],
  [/Unemployment Claims/i,         { fr: "Demandes d'allocations chômage", es: 'Solicitudes de desempleo' }],
  [/Initial Jobless Claims/i,      { fr: 'Demandes initiales chômage',     es: 'Solicitudes iniciales de desempleo' }],
  [/Continuing Claims/i,           { fr: 'Demandes continues chômage',     es: 'Solicitudes continuas' }],
  [/Average Hourly Earnings/i,     { fr: 'Salaire horaire moyen',          es: 'Salario por hora medio' }],
  [/Average Earnings/i,            { fr: 'Salaires moyens',                es: 'Salarios medios' }],
  [/Employment Change/i,           { fr: "Variation de l'emploi",          es: 'Variación del empleo' }],
  [/Job Openings/i,                { fr: "Offres d'emploi (JOLTS)",        es: 'Ofertas de empleo (JOLTS)' }],
  [/Participation Rate/i,          { fr: 'Taux de participation',          es: 'Tasa de participación' }],
  [/^GDP\b/i,                      { fr: 'PIB',                            es: 'PIB' }],
  [/Industrial Production/i,       { fr: 'Production industrielle',        es: 'Producción industrial' }],
  [/Manufacturing Production/i,    { fr: 'Production manufacturière',      es: 'Producción manufacturera' }],
  [/Capacity Utilization/i,        { fr: 'Utilisation des capacités',      es: 'Utilización de capacidad' }],
  [/Factory Orders/i,              { fr: "Commandes à l'industrie",        es: 'Pedidos de fábrica' }],
  [/Durable Goods Orders/i,        { fr: 'Commandes de biens durables',    es: 'Pedidos de bienes duraderos' }],
  [/Final Manufacturing PMI/i,     { fr: 'PMI manufacturier final',        es: 'PMI manufacturero final' }],
  [/Manufacturing PMI/i,           { fr: 'PMI manufacturier',              es: 'PMI manufacturero' }],
  [/Final Services PMI/i,          { fr: 'PMI services final',             es: 'PMI servicios final' }],
  [/Services PMI/i,                { fr: 'PMI services',                   es: 'PMI servicios' }],
  [/Composite PMI/i,               { fr: 'PMI composite',                  es: 'PMI compuesto' }],
  [/Flash.*PMI/i,                  { fr: 'PMI flash',                      es: 'PMI flash' }],
  [/ISM Manufacturing/i,           { fr: 'ISM manufacturier',              es: 'ISM manufacturero' }],
  [/ISM Services/i,                { fr: 'ISM services',                   es: 'ISM servicios' }],
  [/^PMI\b/i,                      { fr: 'PMI',                            es: 'PMI' }],
  [/Federal Funds Rate/i,          { fr: 'Taux directeur Fed',             es: 'Tipo de interés Fed' }],
  [/FOMC.*Statement/i,             { fr: 'Communiqué FOMC',                es: 'Comunicado FOMC' }],
  [/FOMC.*Minutes/i,               { fr: 'Compte-rendu FOMC',              es: 'Actas del FOMC' }],
  [/FOMC.*Press Conference/i,      { fr: 'Conférence de presse FOMC',      es: 'Rueda de prensa FOMC' }],
  [/FOMC.*Meeting/i,               { fr: 'Réunion FOMC',                   es: 'Reunión FOMC' }],
  [/Fed Chair/i,                   { fr: 'Discours du président de la Fed', es: 'Discurso del presidente de la Fed' }],
  [/Main Refinancing Rate/i,       { fr: 'Taux de refinancement BCE',      es: 'Tipo de refinanciación BCE' }],
  [/ECB.*Press Conference/i,       { fr: 'Conférence de presse BCE',       es: 'Rueda de prensa BCE' }],
  [/ECB.*Statement/i,              { fr: 'Communiqué BCE',                 es: 'Comunicado BCE' }],
  [/ECB.*Monetary Policy/i,        { fr: 'Politique monétaire BCE',        es: 'Política monetaria BCE' }],
  [/Bank Rate/i,                   { fr: 'Taux directeur BoE',             es: 'Tipo de interés BoE' }],
  [/MPC.*Vote/i,                   { fr: 'Vote du MPC (BoE)',              es: 'Voto del MPC (BoE)' }],
  [/Cash Rate/i,                   { fr: 'Taux directeur RBA',             es: 'Tipo de interés RBA' }],
  [/Overnight Rate/i,              { fr: 'Taux directeur BoC',             es: 'Tipo de interés BoC' }],
  [/SNB.*Policy Rate/i,            { fr: 'Taux directeur BNS',             es: 'Tipo de interés BNS' }],
  [/BOJ.*Policy Rate/i,            { fr: 'Taux directeur BoJ',             es: 'Tipo de interés BoJ' }],
  [/Retail Sales/i,                { fr: 'Ventes au détail',               es: 'Ventas minoristas' }],
  [/Consumer Confidence/i,         { fr: 'Confiance consommateurs',        es: 'Confianza del consumidor' }],
  [/Consumer Sentiment/i,          { fr: 'Sentiment consommateurs',        es: 'Sentimiento del consumidor' }],
  [/Consumer Spending/i,           { fr: 'Dépenses des ménages',           es: 'Gasto del consumidor' }],
  [/Personal Income/i,             { fr: 'Revenu personnel',               es: 'Ingreso personal' }],
  [/Personal Spending/i,           { fr: 'Dépenses personnelles',          es: 'Gasto personal' }],
  [/Building Permits/i,            { fr: 'Permis de construire',           es: 'Permisos de construcción' }],
  [/Housing Starts/i,              { fr: 'Mises en chantier',              es: 'Inicios de viviendas' }],
  [/New Home Sales/i,              { fr: 'Ventes de logements neufs',      es: 'Ventas de viviendas nuevas' }],
  [/Existing Home Sales/i,         { fr: 'Ventes de logements anciens',    es: 'Ventas de viviendas usadas' }],
  [/Pending Home Sales/i,          { fr: 'Ventes de logements en attente', es: 'Ventas pendientes de viviendas' }],
  [/Case[-\s]?Shiller/i,           { fr: 'Indice Case-Shiller (immobilier)', es: 'Índice Case-Shiller (inmobiliario)' }],
  [/Nationwide HPI/i,              { fr: 'Indice prix logement Nationwide', es: 'Índice precios vivienda Nationwide' }],
  [/Business Confidence/i,         { fr: "Confiance des entreprises",      es: 'Confianza empresarial' }],
  [/Empire State/i,                { fr: 'Indice manufacturier Empire State', es: 'Índice manufacturero Empire State' }],
  [/Philly Fed/i,                  { fr: 'Indice Philly Fed',              es: 'Índice Philly Fed' }],
  [/Richmond.*Manufacturing/i,     { fr: 'Indice manufacturier Richmond',  es: 'Índice manufacturero Richmond' }],
  [/Chicago PMI/i,                 { fr: 'PMI Chicago',                    es: 'PMI Chicago' }],
  [/IFO Business Climate/i,        { fr: 'Climat des affaires IFO',        es: 'Clima empresarial IFO' }],
  [/ZEW.*Sentiment/i,              { fr: 'Sentiment économique ZEW',       es: 'Sentimiento económico ZEW' }],
  [/Tankan/i,                      { fr: 'Enquête Tankan (Japon)',         es: 'Encuesta Tankan' }],
  [/Trade Balance/i,               { fr: 'Balance commerciale',            es: 'Balanza comercial' }],
  [/Current Account/i,             { fr: 'Balance des paiements',          es: 'Cuenta corriente' }],
  [/Imports/i,                     { fr: 'Importations',                   es: 'Importaciones' }],
  [/Exports/i,                     { fr: 'Exportations',                   es: 'Exportaciones' }],
  [/Crude Oil Inventories/i,       { fr: 'Stocks de pétrole brut',         es: 'Inventarios de petróleo crudo' }],
  [/Natural Gas Storage/i,         { fr: 'Stocks de gaz naturel',          es: 'Reservas de gas natural' }],
  [/M4 Money Supply/i,             { fr: 'Masse monétaire M4',             es: 'Oferta monetaria M4' }],
  [/Money Supply/i,                { fr: 'Masse monétaire',                es: 'Oferta monetaria' }],
  [/Commodity Prices/i,            { fr: 'Prix des matières premières',    es: 'Precios de materias primas' }],
  [/Bank Holiday/i,                { fr: 'Jour férié bancaire',            es: 'Día festivo bancario' }],
  [/^Holiday/i,                    { fr: 'Jour férié',                     es: 'Día festivo' }],
  [/Speech/i,                      { fr: 'Discours',                       es: 'Discurso' }],
  [/Testimony/i,                   { fr: 'Audition',                       es: 'Comparecencia' }],
  [/Beige Book/i,                  { fr: 'Livre beige Fed',                es: 'Libro Beige Fed' }],
  [/Treasury Bill Auction/i,       { fr: "Adjudication de bons du Trésor", es: 'Subasta de letras del Tesoro' }],
  [/Bond Auction/i,                { fr: "Adjudication d'obligations",     es: 'Subasta de bonos' }],
]

const SUFFIX_PATTERNS = {
  fr: [[/\bm\/m\b/gi, 'm/m'], [/\by\/y\b/gi, 'a/a'], [/\bq\/q\b/gi, 't/t']],
  es: [[/\bm\/m\b/gi, 'm/m'], [/\by\/y\b/gi, 'a/a'], [/\bq\/q\b/gi, 't/t']],
  en: [],
}

function translateTitle(title, lang) {
  if (!title) return ''
  if (lang === 'en') return title
  let out = title
  for (const [re, dict] of EVENT_PATTERNS) {
    if (re.test(out)) { out = out.replace(re, dict[lang] || dict.fr); break }
  }
  for (const [re, repl] of (SUFFIX_PATTERNS[lang] || [])) out = out.replace(re, repl)
  return out
}

function fmtDateLong(ds, lang) {
  if (!ds) return ''
  try {
    const [m, d, y] = ds.split('-')
    const dt = new Date(`${y}-${m}-${d}T00:00:00`)
    const t = T[lang]
    const dayName = t.daysLong[(dt.getDay() + 6) % 7]
    return { dayName, num: parseInt(d), month: t.months[dt.getMonth()], year: y }
  } catch { return { dayName: '', num: '', month: '', year: '' } }
}

// Compare actual vs forecast → returns { color, label, sign }
// For positive-good indicators (most macro), actual > forecast = green (beat).
// For unemployment/inflation it's reverse but we don't know per-event so default
// to "higher = green" which is what FF/trader UIs typically do.
function actualDiff(actual, forecast, lang) {
  const t = T[lang] || T.fr
  if (!actual || !forecast) return null
  const a = parseFloat(String(actual).replace(/[^0-9.-]/g, ''))
  const f = parseFloat(String(forecast).replace(/[^0-9.-]/g, ''))
  if (isNaN(a) || isNaN(f)) return null
  if (a > f) return { color: 'var(--green)', bg: 'rgba(29,184,122,0.15)', label: t.beat, sign: '↑' }
  if (a < f) return { color: 'var(--red)', bg: 'rgba(232,80,74,0.15)', label: t.miss, sign: '↓' }
  return { color: 'var(--amber)', bg: 'rgba(250,199,117,0.15)', label: t.inline, sign: '=' }
}

function todayFF() {
  const d = new Date()
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`
}

// Convertit "MM-DD-YYYY" + "h:mmam/pm" en timestamp pour comparer si event passé
function eventTime(dateStr, timeStr) {
  if (!dateStr) return 0
  const [m, d, y] = dateStr.split('-')
  const base = new Date(`${y}-${m}-${d}T00:00:00`)
  if (!timeStr || /all day|tentative/i.test(timeStr)) return base.getTime()
  const match = String(timeStr).match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i)
  if (!match) return base.getTime()
  let h = parseInt(match[1], 10)
  const mn = parseInt(match[2], 10)
  const ampm = (match[3] || '').toLowerCase()
  if (ampm === 'pm' && h !== 12) h += 12
  if (ampm === 'am' && h === 12) h = 0
  base.setHours(h, mn, 0, 0)
  return base.getTime()
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function CalendarPage({ lang = 'fr', onLangChange }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [week, setWeek] = useState('this')
  const [fImpact, setFImpact] = useState([])      // empty = all
  const [fCurrencies, setFCurrencies] = useState([]) // empty = all
  const [lastUpd, setLastUpd] = useState('')
  const [nowTimeStr, setNowTimeStr] = useState('')
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false)
  // Source telemetry — 'fmp' or 'forexfactory'. FF doesn't provide actuals,
  // so the UI uses this to render an honest "—" instead of misleading ⏳
  // and shows a discreet footnote suggesting FMP_API_KEY for live actuals.
  const [source, setSource] = useState(null)
  const [sourceHasActuals, setSourceHasActuals] = useState(false)
  const t = T[lang] || T.fr
  const today = todayFF()
  const nowTs = Date.now()
  const dayRefs = useRef({})

  async function load() {
    setLoading(true); setError('')
    try {
      const r = await fetch(`/api/calendar?week=${week}&t=${Date.now()}`, { cache: 'no-store' })
      const data = await r.json()
      if (data.error) throw new Error(data.error)
      setEvents(data.events || [])
      setSource(data.source || null)
      setSourceHasActuals(!!data.hasActuals)
      setLastUpd(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    } catch (e) { setError(e.message); setEvents([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [week])
  // Refresh toutes les 60s pour récupérer les actuals dès publication
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv) }, [week])

  // Live clock every 30s for the "Now" pill
  useEffect(() => {
    function tick() {
      setNowTimeStr(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const iv = setInterval(tick, 30000)
    return () => clearInterval(iv)
  }, [])

  // Devises présentes dans les events, ordonnées
  const availableCurrencies = useMemo(() => {
    const present = new Set(events.map(e => e.currency).filter(Boolean))
    return CURRENCY_ORDER.filter(c => present.has(c))
      .concat([...present].filter(c => !CURRENCY_ORDER.includes(c)).sort())
  }, [events])

  const filtered = events.filter(e => {
    const iOk = fImpact.length === 0 || fImpact.includes(e.impact)
    const cOk = fCurrencies.length === 0 || fCurrencies.includes(e.currency)
    return iOk && cOk
  })
  const grouped = {}
  filtered.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e) })
  const dates = Object.keys(grouped).sort((a, b) => {
    // Trier par date ISO réelle (MM-DD-YYYY → YYYY-MM-DD pour le compare)
    const toIso = s => { const [m, d, y] = s.split('-'); return `${y}-${m}-${d}` }
    return toIso(a).localeCompare(toIso(b))
  })

  // Sort events within each day by time (chronological)
  dates.forEach(d => {
    grouped[d].sort((a, b) => eventTime(a.date, a.time) - eventTime(b.date, b.time))
  })

  // KPIs pour le hero
  const todayEvents = events.filter(e => e.date === today)
  const todayHighCount = todayEvents.filter(e => e.impact === 'High').length
  const weekHighCount = events.filter(e => e.impact === 'High').length

  function toggleCurrency(cur) {
    setFCurrencies(prev => prev.includes(cur) ? prev.filter(c => c !== cur) : [...prev, cur])
  }

  function scrollToDay(date) {
    const el = dayRefs.current[date]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── STYLES partagés (cohérent thème cosmic Quantara) ──
  const card = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    boxShadow: '0 1px 0 var(--tint1) inset, 0 8px 32px rgba(0,0,0,0.18)',
  }
  const cardElevated = {
    ...card,
    background: 'linear-gradient(180deg, rgba(28,32,48,0.65), rgba(20,23,32,0.7))',
    border: '1px solid var(--hairline)',
  }
  const monoFont = "'JetBrains Mono', 'SF Mono', 'Cascadia Mono', Menlo, monospace"
  const serifFont = "'ui-serif', Georgia, 'Times New Roman', Times, serif"

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="cal-page" style={{
      maxWidth: 1180,
      margin: '0 auto',
      padding: '32px 24px 80px',
      position: 'relative',
    }}>
      {/* Background dot-grid — financial terminal feel, very subtle */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, var(--tint1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0',
          pointerEvents: 'none',
          zIndex: 0,
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 60%)',
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 60%)',
        }}
      />

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <header style={{ position: 'relative', zIndex: 1, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {/* Eyebrow — monospace small caps, animated dot */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 10.5, fontFamily: monoFont,
              color: 'var(--amber)', letterSpacing: '0.18em',
              marginBottom: 14, textTransform: 'uppercase', fontWeight: 600,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--green)',
                boxShadow: '0 0 8px rgba(29,184,122,0.6)',
                animation: 'qt-cal-pulse 2s ease-in-out infinite',
              }} />
              {t.eyebrow}
            </div>

            {/* Title — serif editorial */}
            <h1 style={{
              fontFamily: serifFont,
              fontSize: 'clamp(34px, 5vw, 52px)',
              fontWeight: 500,
              letterSpacing: '-0.025em',
              fontStyle: 'italic',
              margin: 0,
              marginBottom: 10,
              lineHeight: 1.05,
              color: 'var(--text)',
            }}>
              {t.title}
            </h1>

            <div style={{
              fontSize: 13.5, color: 'var(--text2)',
              maxWidth: 560, lineHeight: 1.55,
            }}>
              {t.subtitle}
            </div>
          </div>

          {/* Right controls — week toggle + lang + refresh */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{
              display: 'flex',
              border: '1px solid var(--hairline)', borderRadius: 99,
              overflow: 'hidden', background: 'rgba(20,23,32,0.5)',
              backdropFilter: 'blur(8px)',
            }}>
              {[{ c: 'fr', l: 'FR' }, { c: 'en', l: 'EN' }, { c: 'es', l: 'ES' }].map(x => (
                <button
                  key={x.c}
                  onClick={() => onLangChange && onLangChange(x.c)}
                  className="qt-cal-pill"
                  style={pillStyle(lang === x.c, monoFont)}
                >{x.l}</button>
              ))}
            </div>
            <div style={{
              display: 'flex',
              border: '1px solid var(--hairline)', borderRadius: 99,
              overflow: 'hidden', background: 'rgba(20,23,32,0.5)',
              backdropFilter: 'blur(8px)',
            }}>
              <button onClick={() => setWeek('this')} className="qt-cal-pill" style={pillStyle(week === 'this', monoFont)}>{t.thisWeek}</button>
              <button onClick={() => setWeek('next')} className="qt-cal-pill" style={pillStyle(week === 'next', monoFont)}>{t.nextWeek}</button>
            </div>
            <button
              onClick={load}
              className="qt-cal-pill"
              style={{
                ...pillStyle(false, monoFont),
                background: 'rgba(28,32,48,0.6)',
                border: '1px solid var(--hairline)',
                borderRadius: 99,
                padding: '9px 16px',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 11 }}>↻</span> {t.refresh}
            </button>
          </div>
        </div>

        {/* KPI strip — 3 cards : Today / High impact / Live time */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginTop: 8,
        }} className="qt-cal-kpi-row">
          <KpiCard
            label={t.todayKpi}
            value={todayEvents.length}
            sub={`${todayHighCount} high · ${todayEvents.filter(e => e.impact === 'Medium').length} medium`}
            accent="var(--blue-light)"
            mono={monoFont}
            serif={serifFont}
          />
          <KpiCard
            label={t.highKpi}
            value={weekHighCount}
            sub={lang === 'fr' ? 'cette semaine' : lang === 'es' ? 'esta semana' : 'this week'}
            accent="var(--red)"
            mono={monoFont}
            serif={serifFont}
          />
          <KpiCard
            label={t.liveKpi}
            value={nowTimeStr || '—'}
            sub={lastUpd ? `${t.lastUpdate} ${lastUpd}` : ''}
            accent="var(--green)"
            mono={monoFont}
            serif={serifFont}
            isLive
          />
        </div>
      </header>

      {/* ══ WEEK STRIP — 7 jours horizontaux cliquables ═════════════════════ */}
      {!loading && !error && dates.length > 0 && (
        <WeekStrip
          dates={dates}
          grouped={grouped}
          today={today}
          onJump={scrollToDay}
          mono={monoFont}
          t={t}
          lang={lang}
        />
      )}

      {/* ══ FILTERS ═══════════════════════════════════════════════════════ */}
      <div style={{
        ...card,
        padding: '16px 20px',
        marginBottom: 18,
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Impact filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text3)',
            textTransform: 'uppercase', letterSpacing: '0.12em',
            minWidth: 72, fontFamily: monoFont,
          }}>{t.filterImpact}</span>
          <button onClick={() => setFImpact([])} className="qt-cal-pill" style={pillStyle(fImpact.length === 0, monoFont)}>{t.all}</button>
          {[
            { k: 'High',   l: t.high,   c: 'var(--red)' },
            { k: 'Medium', l: t.medium, c: 'var(--amber)' },
            { k: 'Low',    l: t.low,    c: 'var(--text2)' },
          ].map(imp => {
            const active = fImpact.includes(imp.k)
            return (
              <button
                key={imp.k}
                onClick={() => setFImpact(prev => prev.includes(imp.k) ? prev.filter(x => x !== imp.k) : [...prev, imp.k])}
                className="qt-cal-pill"
                style={{
                  ...pillStyle(active, monoFont),
                  borderColor: active ? imp.c : 'var(--hairline)',
                  background: active ? `${imp.c}22` : 'transparent',
                  color: active ? imp.c : 'var(--text2)',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: imp.c, opacity: active ? 1 : 0.5 }} />
                {imp.l}
              </button>
            )
          })}
        </div>

        {/* Currency filter — chip strip + open modal */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text3)',
            textTransform: 'uppercase', letterSpacing: '0.12em',
            minWidth: 72, fontFamily: monoFont,
          }}>{t.filterCurrency}</span>
          {/* Inline major currency quick-toggle chips */}
          {availableCurrencies.filter(c => MAJOR_CURRENCIES.includes(c)).slice(0, 8).map(cur => {
            const active = fCurrencies.includes(cur)
            return (
              <button
                key={cur}
                onClick={() => toggleCurrency(cur)}
                className="qt-cal-pill"
                style={{
                  ...pillStyle(active, monoFont),
                  padding: '5px 11px 5px 7px',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 11.5,
                }}
              >
                <Flag currency={cur} size={14} />
                {cur}
              </button>
            )
          })}
          <button
            onClick={() => setCurrencyModalOpen(true)}
            className="qt-cal-pill"
            style={{
              ...pillStyle(false, monoFont),
              padding: '5px 13px', fontSize: 11.5,
              color: 'var(--text3)',
            }}
          >+ {availableCurrencies.length - 8 > 0 ? `${availableCurrencies.length - 8}` : ''} {lang === 'fr' ? 'toutes' : lang === 'es' ? 'todas' : 'all'}</button>
          {fCurrencies.length > 0 && (
            <button
              onClick={() => setFCurrencies([])}
              className="qt-cal-pill"
              style={{
                ...pillStyle(false, monoFont),
                color: 'var(--text3)', fontSize: 11,
                padding: '5px 11px',
              }}
            >✕ {t.clearAll}</button>
          )}
        </div>
      </div>

      {/* ══ CURRENCY MODAL (full picker) ══════════════════════════════════ */}
      {currencyModalOpen && (
        <CurrencyModal
          availableCurrencies={availableCurrencies}
          fCurrencies={fCurrencies}
          setFCurrencies={setFCurrencies}
          events={events}
          onClose={() => setCurrencyModalOpen(false)}
          t={t}
          mono={monoFont}
        />
      )}

      {/* ══ CONTENT ═══════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {loading ? (
          <CalendarSkeleton card={card} />
        ) : error ? (
          <div style={{
            ...card, padding: 40, textAlign: 'center',
            color: '#ff6b66', background: 'rgba(232,80,74,0.05)',
            borderColor: 'rgba(232,80,74,0.3)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>{t.error}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, fontFamily: monoFont }}>{error}</div>
            <button onClick={load} style={{ ...pillStyle(true, monoFont), padding: '9px 18px' }}>{t.refresh}</button>
          </div>
        ) : !dates.length ? (
          <div style={{ ...card, padding: '64px 24px', textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{
              fontFamily: serifFont, fontSize: 28, fontStyle: 'italic',
              color: 'var(--text2)', marginBottom: 10,
            }}>
              {week === 'next' && events.length === 0 ? t.nextEmpty : t.noEvents}
            </div>
            {events.length > 0 && filtered.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, fontFamily: monoFont }}>
                {events.length} {events.length > 1 ? t.eventsP : t.events} {lang === 'fr' ? 'masqué' : lang === 'es' ? 'ocultado' : 'hidden'}{events.length > 1 && lang === 'fr' ? 's' : ''} {lang === 'fr' ? 'par les filtres' : lang === 'es' ? 'por filtros' : 'by filters'}
              </div>
            )}
            <button onClick={load} style={{ ...pillStyle(false, monoFont), marginTop: 18, padding: '9px 18px' }}>{t.refresh}</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {dates.map(date => {
              const evts = grouped[date]
              if (!evts?.length) return null
              const isToday = date === today
              return (
                <DayCard
                  key={date}
                  date={date}
                  events={evts}
                  isToday={isToday}
                  nowTs={nowTs}
                  lang={lang}
                  t={t}
                  mono={monoFont}
                  serif={serifFont}
                  cardStyle={cardElevated}
                  refCb={el => { if (el) dayRefs.current[date] = el }}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Footer source line */}
      <div style={{
        marginTop: 28, textAlign: 'center',
        fontSize: 10.5, color: 'var(--text3)',
        fontFamily: monoFont, letterSpacing: '0.06em',
        position: 'relative', zIndex: 1,
        lineHeight: 1.7,
      }}>
        <div>
          {source === 'fmp' ? (
            <>
              {lang === 'fr' ? 'Données' : lang === 'es' ? 'Datos' : 'Data'} :{' '}
              <a href="https://site.financialmodelingprep.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-light)', textDecoration: 'none' }}>Financial Modeling Prep</a>
              {' · '}
              {lang === 'fr' ? 'Indicatif uniquement.' : lang === 'es' ? 'Indicativo solamente.' : 'Indicative only.'}
            </>
          ) : (
            <>
              {t.sourceLine}{' '}
              <a href="https://www.forexfactory.com/calendar" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-light)', textDecoration: 'none' }}>
                forexfactory.com
              </a>
            </>
          )}
        </div>
        {/* Honest note when source doesn't provide actuals */}
        {source === 'forexfactory' && (
          <div style={{ fontSize: 10, opacity: 0.65, marginTop: 4 }}>
            {lang === 'fr'
              ? 'Note : ce flux fournit forecast + previous mais pas les résultats publiés. Pour les "Réel" en temps réel, configure FMP_API_KEY (free) sur Vercel.'
              : lang === 'es'
              ? 'Nota: este flujo proporciona forecast + previous pero no resultados publicados. Para "Real" en tiempo real, configura FMP_API_KEY (gratis) en Vercel.'
              : 'Note: this feed provides forecast + previous but not released results. For live "Actual" values, configure FMP_API_KEY (free) on Vercel.'}
          </div>
        )}
      </div>

      {/* Global keyframes + responsive */}
      <style>{`
        @keyframes qt-cal-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.25); }
        }
        @keyframes qt-cal-now-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.3; }
        }
        .qt-cal-pill:hover { background: var(--border) !important; color: var(--text) !important; }
        .qt-cal-pill[data-active="true"]:hover { background: rgba(45,111,255,0.22) !important; }
        .qt-cal-event-row { transition: background 0.15s, transform 0.15s; }
        .qt-cal-event-row:hover {
          background: var(--tint1) !important;
        }
        .qt-cal-event-row:hover .qt-cal-event-time { color: var(--text) !important; }
        .qt-cal-day-chip { transition: background 0.15s, border-color 0.15s, transform 0.15s; }
        .qt-cal-day-chip:hover { border-color: var(--hairline2) !important; transform: translateY(-1px); }
        @media (max-width: 768px) {
          .qt-cal-kpi-row { grid-template-columns: 1fr !important; }
          .qt-cal-event-row {
            grid-template-columns: 70px 1fr !important;
            grid-template-rows: auto auto !important;
          }
          .qt-cal-event-data { grid-column: 1 / -1 !important; padding-top: 8px !important; }
        }
      `}</style>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTS
// ──────────────────────────────────────────────────────────────────────────

function pillStyle(active, monoFont) {
  return {
    padding: '8px 14px',
    fontSize: 11.5,
    fontFamily: monoFont,
    fontWeight: active ? 600 : 500,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    borderRadius: 99,
    border: `1px solid ${active ? 'rgba(45,111,255,0.45)' : 'var(--hairline)'}`,
    background: active ? 'rgba(45,111,255,0.18)' : 'transparent',
    color: active ? '#7baaff' : 'var(--text2)',
    transition: 'all 0.15s',
    fontFamily: monoFont,
  }
}

// KPI card — used in the hero strip
function KpiCard({ label, value, sub, accent, mono, serif, isLive }) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(28,32,48,0.5), rgba(20,23,32,0.35))',
      border: '1px solid var(--border)',
      borderLeft: `2px solid ${accent}`,
      borderRadius: 12,
      padding: '14px 18px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle glow on the accent corner */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: 80, height: 80,
        background: `radial-gradient(circle at top left, ${accent}25, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        fontFamily: mono,
        fontSize: 10, color: 'var(--text3)',
        textTransform: 'uppercase', letterSpacing: '0.14em',
        fontWeight: 600, marginBottom: 8,
        display: 'inline-flex', alignItems: 'center', gap: 7,
      }}>
        {isLive && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: accent,
            animation: 'qt-cal-pulse 2s ease-in-out infinite',
            boxShadow: `0 0 8px ${accent}`,
          }} />
        )}
        {label}
      </div>
      <div style={{
        fontFamily: serif,
        fontSize: 32, fontWeight: 500,
        color: 'var(--text)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontSize: 11, color: 'var(--text3)',
          marginTop: 6,
          fontFamily: mono,
        }}>{sub}</div>
      )}
    </div>
  )
}

// Week strip — horizontal day navigator showing event density per day
function WeekStrip({ dates, grouped, today, onJump, mono, t, lang }) {
  return (
    <div style={{
      display: 'flex', gap: 8, overflowX: 'auto',
      paddingBottom: 16, marginBottom: 12,
      position: 'relative', zIndex: 1,
      scrollbarWidth: 'thin',
    }}>
      {dates.map(d => {
        const evts = grouped[d]
        const hC = evts.filter(e => e.impact === 'High').length
        const mC = evts.filter(e => e.impact === 'Medium').length
        const lC = evts.filter(e => e.impact === 'Low').length
        const isToday = d === today
        const dd = fmtDateLong(d, lang)
        return (
          <button
            key={d}
            onClick={() => onJump(d)}
            className="qt-cal-day-chip"
            style={{
              flex: '0 0 auto',
              minWidth: 130,
              padding: '12px 14px',
              borderRadius: 12,
              background: isToday ? 'rgba(45,111,255,0.12)' : 'rgba(28,32,48,0.45)',
              border: `1px solid ${isToday ? 'rgba(45,111,255,0.45)' : 'var(--border)'}`,
              color: 'var(--text)',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              position: 'relative',
            }}
          >
            <div style={{
              fontSize: 9.5,
              fontFamily: mono,
              fontWeight: 600,
              color: isToday ? 'var(--blue-light)' : 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              marginBottom: 4,
            }}>
              {isToday ? t.today : dd.dayName.slice(0, 3)}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700,
              color: 'var(--text)',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {dd.num}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, fontFamily: mono }}>
              {dd.month}
            </div>
            {/* Impact density dots */}
            <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
              {Array.from({ length: Math.min(hC, 5) }).map((_, i) => (
                <span key={'h' + i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)' }} />
              ))}
              {Array.from({ length: Math.min(mC, 4) }).map((_, i) => (
                <span key={'m' + i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--amber)' }} />
              ))}
              {Array.from({ length: Math.min(lC, 3) }).map((_, i) => (
                <span key={'l' + i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text3)' }} />
              ))}
            </div>
            <div style={{
              fontSize: 10, color: 'var(--text3)', marginTop: 4,
              fontFamily: mono, fontVariantNumeric: 'tabular-nums',
            }}>
              {evts.length} {evts.length > 1 ? t.eventsP : t.events}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Day card — header + events grid
function DayCard({ date, events, isToday, nowTs, lang, t, mono, serif, cardStyle, refCb }) {
  const dd = fmtDateLong(date, lang)
  const hC = events.filter(e => e.impact === 'High').length
  const mC = events.filter(e => e.impact === 'Medium').length

  return (
    <div ref={refCb} style={{
      ...cardStyle,
      overflow: 'hidden',
      borderColor: isToday ? 'rgba(45,111,255,0.35)' : cardStyle.border,
      scrollMarginTop: 20,
    }}>
      {/* Day header */}
      <div style={{
        padding: '16px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
        background: isToday ? 'rgba(45,111,255,0.06)' : 'var(--tint1)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          {isToday && (
            <span style={{
              fontSize: 9.5, fontWeight: 700, padding: '4px 10px',
              borderRadius: 99, background: 'var(--blue)', color: '#fff',
              textTransform: 'uppercase', letterSpacing: '0.14em',
              fontFamily: mono,
            }}>● {t.today}</span>
          )}
          <h2 style={{
            margin: 0,
            fontFamily: serif,
            fontSize: 24, fontWeight: 500,
            fontStyle: 'italic',
            letterSpacing: '-0.01em',
            color: 'var(--text)',
            lineHeight: 1,
          }}>
            {dd.dayName}
          </h2>
          <span style={{
            fontSize: 16, color: 'var(--text2)',
            fontFamily: mono, fontWeight: 500,
            letterSpacing: '0.02em',
          }}>
            {String(dd.num).padStart(2, '0')} {dd.month}
          </span>
          <span style={{
            fontSize: 11, color: 'var(--text3)',
            fontFamily: mono, letterSpacing: '0.04em',
          }}>
            {events.length} {events.length > 1 ? t.eventsP : t.events}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {hC > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600,
              padding: '4px 10px', borderRadius: 6,
              background: 'rgba(232,80,74,0.13)', color: '#ff6b66',
              fontFamily: mono, letterSpacing: '0.04em',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }} />
              {hC} {t.high}
            </span>
          )}
          {mC > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600,
              padding: '4px 10px', borderRadius: 6,
              background: 'rgba(250,199,117,0.12)', color: 'var(--amber)',
              fontFamily: mono, letterSpacing: '0.04em',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)' }} />
              {mC} {t.medium}
            </span>
          )}
        </div>
      </div>

      {/* Events list */}
      <div>
        {events.map((ev, i) => (
          <EventRow
            key={ev.id || i}
            event={ev}
            lang={lang}
            t={t}
            mono={mono}
            nowTs={nowTs}
            isLast={i === events.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

// Single event row — grid layout, impact-colored left accent, actual diff chip
function EventRow({ event: ev, lang, t, mono, nowTs, isLast }) {
  const ic = IC[ev.impact] || IC.Low
  const tTitle = translateTitle(ev.title, lang)
  const evTs = eventTime(ev.date, ev.time)
  const isPast = evTs > 0 && evTs < nowTs
  const hasActual = !!ev.actual
  const diff = actualDiff(ev.actual, ev.forecast, lang)

  return (
    <div
      className="qt-cal-event-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '4px 88px 88px minmax(0, 1fr) 280px',
        alignItems: 'center',
        borderBottom: isLast ? 'none' : '1px solid var(--tint2)',
        background: ic.bg,
        position: 'relative',
      }}
    >
      {/* Impact accent bar — left edge, full height */}
      <div style={{
        background: ic.bar,
        opacity: ev.impact === 'High' ? 1 : ev.impact === 'Medium' ? 0.65 : 0.25,
        alignSelf: 'stretch',
        boxShadow: ev.impact === 'High' ? `0 0 12px ${ic.glow}` : 'none',
      }} />

      {/* TIME */}
      <div className="qt-cal-event-time" style={{
        padding: '14px 14px',
        fontFamily: mono,
        fontSize: 13, fontWeight: 600,
        color: 'var(--text2)',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {ev.time || '—'}
      </div>

      {/* COUNTRY + CURRENCY */}
      <div style={{ padding: '14px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Flag country={ev.country} currency={ev.currency} size={20} />
        <span style={{
          fontFamily: mono,
          fontSize: 12, fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '0.04em',
        }}>{ev.currency}</span>
      </div>

      {/* EVENT TITLE */}
      <div style={{ padding: '12px 16px', minWidth: 0 }}>
        <div style={{
          fontSize: 13.5,
          fontWeight: ev.impact === 'High' ? 600 : 500,
          color: 'var(--text)',
          lineHeight: 1.35,
          letterSpacing: '-0.005em',
        }}>
          {tTitle}
        </div>
        {lang !== 'en' && tTitle !== ev.title && (
          <div style={{
            fontSize: 10.5,
            color: 'var(--text3)',
            marginTop: 2,
            fontFamily: mono,
            opacity: 0.75,
            fontStyle: 'italic',
          }}>{ev.title}</div>
        )}
      </div>

      {/* DATA — Actual | Forecast | Previous + diff chip */}
      <div className="qt-cal-event-data" style={{
        padding: '12px 18px 12px 8px',
        display: 'flex', alignItems: 'center', gap: 12,
        justifyContent: 'flex-end',
      }}>
        {/* 3-column tabular numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px 60px 60px', gap: 8, fontFamily: mono, textAlign: 'right' }}>
          <DataCell label={t.actual} value={ev.actual} isPast={isPast} hasActual={hasActual} t={t} diff={diff} />
          <DataCell label={t.forecast} value={ev.forecast} muted />
          <DataCell label={t.previous} value={ev.previous} muted />
        </div>
        {/* Diff chip — only shown when actual is published */}
        {diff && (
          <div style={{
            padding: '6px 10px',
            borderRadius: 6,
            background: diff.bg,
            color: diff.color,
            fontFamily: mono,
            fontSize: 10.5, fontWeight: 700,
            letterSpacing: '0.04em',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            border: `1px solid ${diff.color}33`,
            minWidth: 56, justifyContent: 'center',
          }}>
            <span style={{ fontSize: 12 }}>{diff.sign}</span>
            {diff.label}
          </div>
        )}
      </div>
    </div>
  )
}

// Data cell — Actual / Forecast / Previous with label above value
// Note: when actual is missing we always show "—" (honest) rather than a
// loading glyph, since the source may simply not provide actuals at all
// (e.g. ForexFactory community mirror). The footer surfaces this.
function DataCell({ label, value, muted, hasActual, diff }) {
  const isActualCell = !muted
  let displayValue = value || '—'
  let valueColor = 'var(--text2)'
  let valueWeight = 500
  if (isActualCell) {
    if (hasActual && diff) {
      valueColor = diff.color
      valueWeight = 700
    } else if (!hasActual) {
      displayValue = '—'
      valueColor = 'var(--text3)'
    }
  } else {
    valueColor = muted ? 'var(--text3)' : 'var(--text2)'
  }

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontSize: 8.5, fontWeight: 700,
        color: 'var(--text3)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: 2,
        opacity: 0.65,
      }}>{label.slice(0, 4)}</div>
      <div style={{
        fontSize: 12.5,
        color: valueColor,
        fontWeight: valueWeight,
        fontVariantNumeric: 'tabular-nums',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{displayValue}</div>
    </div>
  )
}

// Skeleton — matches the new layout
function CalendarSkeleton({ card }) {
  return (
    <div>
      {/* KPI row skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={92} style={{ borderRadius: 12 }} />
        ))}
      </div>
      {/* Week strip skeleton */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} width={130} height={108} style={{ borderRadius: 12 }} />
        ))}
      </div>
      {/* Day cards skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ ...card, padding: 0, marginBottom: 14 }}>
          <div style={{ padding: 18 }}>
            <Skeleton width={180} height={24} />
          </div>
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} style={{ padding: '14px 18px', borderTop: '1px solid var(--tint2)', display: 'flex', gap: 16 }}>
              <Skeleton width={70} height={16} />
              <Skeleton width={50} height={16} />
              <Skeleton width="40%" height={16} />
              <Skeleton width={120} height={16} style={{ marginLeft: 'auto' }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// Currency modal — reused from original, slightly restyled
function CurrencyModal({ availableCurrencies, fCurrencies, setFCurrencies, events, onClose, t, mono }) {
  // Monté uniquement quand ouvert → open: true (Escape, focus trap, restore focus).
  const dialogRef = useDialog({ open: true, onClose })
  const majors = availableCurrencies.filter(c => MAJOR_CURRENCIES.includes(c))
  const others = availableCurrencies.filter(c => !MAJOR_CURRENCIES.includes(c))
  const counts = {}
  events.forEach(e => { if (e.currency) counts[e.currency] = (counts[e.currency] || 0) + 1 })

  function toggle(cur) {
    setFCurrencies(prev => prev.includes(cur) ? prev.filter(c => c !== cur) : [...prev, cur])
  }

  const cellStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 13px', borderRadius: 10, cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(45,111,255,0.5)' : 'var(--border)'}`,
    background: active ? 'rgba(45,111,255,0.10)' : 'rgba(28,32,48,0.5)',
    color: active ? 'var(--text)' : 'var(--text2)',
    transition: 'all 0.15s',
    fontSize: 13, fontWeight: active ? 700 : 500,
    fontFamily: mono,
  })

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} aria-label={t.flagFilter} onClick={e => e.stopPropagation()} style={{
        background: 'linear-gradient(180deg, rgba(28,32,48,0.95), rgba(20,23,32,0.95))',
        borderRadius: 14,
        border: '1px solid var(--hairline)',
        width: '100%', maxWidth: 640, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
      }}>
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t.flagFilter}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text3)', marginTop: 2, fontFamily: mono, letterSpacing: '0.06em' }}>
              {fCurrencies.length === 0
                ? `${availableCurrencies.length} ${t.allCurrencies.toLowerCase()}`
                : `${fCurrencies.length}/${availableCurrencies.length} ${t.flagFilter.toLowerCase()}`}
            </div>
          </div>
          <button onClick={onClose} aria-label={'Fermer' /* TODO i18n */} style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--hairline)',
            background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 14,
          }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '18px 22px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <button onClick={() => setFCurrencies([])} style={{
              flex: 1, padding: '10px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              borderRadius: 8, border: '1px solid var(--hairline)',
              background: fCurrencies.length === 0 ? 'rgba(45,111,255,0.18)' : 'transparent',
              color: fCurrencies.length === 0 ? '#7baaff' : 'var(--text2)',
              fontFamily: mono,
            }}>{t.allCurrencies}</button>
            <button onClick={() => setFCurrencies([...MAJOR_CURRENCIES.filter(c => availableCurrencies.includes(c))])} style={{
              flex: 1, padding: '10px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              borderRadius: 8, border: '1px solid var(--hairline)',
              background: 'transparent', color: 'var(--text2)',
              fontFamily: mono,
            }}>{t.majorsOnly}</button>
          </div>

          {majors.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10,
                fontFamily: mono,
              }}>G10 Majeures</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {majors.map(cur => (
                  <div key={cur} onClick={() => toggle(cur)} style={cellStyle(fCurrencies.includes(cur))}>
                    <Flag currency={cur} size={22} />
                    <span style={{ flex: 1 }}>{cur}</span>
                    {counts[cur] > 0 && (
                      <span style={{
                        fontSize: 10, color: 'var(--text3)',
                        background: 'var(--tint2)',
                        padding: '2px 6px', borderRadius: 99,
                        fontFamily: mono,
                      }}>{counts[cur]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10,
                fontFamily: mono,
              }}>Autres</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 }}>
                {others.map(cur => (
                  <div key={cur} onClick={() => toggle(cur)} style={{ ...cellStyle(fCurrencies.includes(cur)), padding: '8px 10px', fontSize: 12 }}>
                    <Flag currency={cur} size={18} />
                    <span style={{ flex: 1 }}>{cur}</span>
                    {counts[cur] > 0 && <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: mono }}>{counts[cur]}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: '14px 22px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button onClick={onClose} style={{
            padding: '10px 24px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            borderRadius: 8, border: 'none',
            background: 'var(--blue)', color: '#fff',
            fontFamily: mono, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>OK</button>
        </div>
      </div>
    </div>
  )
}
