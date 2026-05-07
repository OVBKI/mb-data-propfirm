'use client'
import { useState, useEffect, useMemo } from 'react'

const T = {
  fr: {
    title:'Calendrier Économique', subtitle:'Données Finnhub · heures Paris (CET) — actualisé toutes les minutes',
    thisWeek:'Cette semaine', nextWeek:'Semaine prochaine', refresh:'↻ Actualiser',
    loading:'Chargement...', error:'Erreur de chargement', noEvents:'Aucun événement', all:'Toutes',
    high:'🔴 Fort', medium:'🟠 Moyen', low:'🟡 Faible',
    time:'Heure', currency:'Devise', event:'Événement', actual:'Réel', forecast:'Prévision', previous:'Précédent', impact:'Impact',
    filterImpact:'Impact', filterCurrency:'Devises',
    lastUpdate:'MàJ', today:"Aujourd'hui", events:'événement', eventsP:'événements',
    upcoming:'À venir', past:'Passé · données non publiées',
    days:['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],
    months:['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'],
    nextEmpty:'La semaine prochaine n\'est pas encore publiée par Finnhub. Réessayez plus tard.',
  },
  en: {
    title:'Economic Calendar', subtitle:'Finnhub data · Paris time (CET) — refreshed every minute',
    thisWeek:'This week', nextWeek:'Next week', refresh:'↻ Refresh',
    loading:'Loading...', error:'Loading error', noEvents:'No events', all:'All',
    high:'🔴 High', medium:'🟠 Medium', low:'🟡 Low',
    time:'Time', currency:'Currency', event:'Event', actual:'Actual', forecast:'Forecast', previous:'Previous', impact:'Impact',
    filterImpact:'Impact', filterCurrency:'Currencies',
    lastUpdate:'Updated', today:'Today', events:'event', eventsP:'events',
    upcoming:'Upcoming', past:'Past · data not yet released',
    days:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    months:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    nextEmpty:'Next week\'s data is not published yet by Finnhub. Try again later.',
  },
  es: {
    title:'Calendario Económico', subtitle:'Datos Finnhub · hora París (CET) — actualizado cada minuto',
    thisWeek:'Esta semana', nextWeek:'Próxima semana', refresh:'↻ Actualizar',
    loading:'Cargando...', error:'Error de carga', noEvents:'Sin eventos', all:'Todas',
    high:'🔴 Alto', medium:'🟠 Medio', low:'🟡 Bajo',
    time:'Hora', currency:'Divisa', event:'Evento', actual:'Real', forecast:'Previsión', previous:'Anterior', impact:'Impacto',
    filterImpact:'Impacto', filterCurrency:'Divisas',
    lastUpdate:'Actualizado', today:'Hoy', events:'evento', eventsP:'eventos',
    upcoming:'Próximo', past:'Pasado · datos aún no publicados',
    days:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],
    months:['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
    nextEmpty:'Los datos de la próxima semana aún no han sido publicados por Finnhub. Inténtelo más tarde.',
  }
}

// Liste maîtresse des devises (toujours affichées dans les filtres si présentes dans les events)
const CURRENCY_ORDER = ['USD','EUR','GBP','JPY','CAD','AUD','NZD','CHF','CNY','CNH','SEK','NOK','DKK','HKD','SGD','MXN','ZAR','TRY','INR','BRL']

const FLAG={USD:'🇺🇸',EUR:'🇪🇺',GBP:'🇬🇧',JPY:'🇯🇵',CAD:'🇨🇦',AUD:'🇦🇺',NZD:'🇳🇿',CHF:'🇨🇭',CNY:'🇨🇳',CNH:'🇨🇳',SEK:'🇸🇪',NOK:'🇳🇴',DKK:'🇩🇰',HKD:'🇭🇰',SGD:'🇸🇬',MXN:'🇲🇽',ZAR:'🇿🇦',TRY:'🇹🇷',INR:'🇮🇳',BRL:'🇧🇷'}
const IC={High:{dot:'#e8504a',text:'#e8504a',bg:'rgba(232,80,74,0.03)'},Medium:{dot:'#fac775',text:'#fac775',bg:'transparent'},Low:{dot:'#565e78',text:'#565e78',bg:'transparent'},Holiday:{dot:'#2d6fff',text:'#4d8fff',bg:'rgba(45,111,255,0.03)'}}

// Traductions des événements ForexFactory (titres anglais → FR/ES)
const EVENT_PATTERNS = [
  [/^Core CPI\b/i,                 {fr:'IPC sous-jacent',                es:'IPC subyacente'}],
  [/^CPI\b/i,                      {fr:'IPC (Inflation)',                es:'IPC (Inflación)'}],
  [/^Core PPI\b/i,                 {fr:'IPP sous-jacent',                es:'IPP subyacente'}],
  [/^PPI\b/i,                      {fr:'IPP (Prix producteurs)',         es:'IPP (Precios productores)'}],
  [/^Core PCE Price Index\b/i,     {fr:'PCE sous-jacent (inflation Fed)',es:'PCE subyacente'}],
  [/^PCE Price Index\b/i,          {fr:'Indice des prix PCE',            es:'Índice de precios PCE'}],
  [/Inflation Rate/i,              {fr:"Taux d'inflation",               es:'Tasa de inflación'}],
  [/HICP/i,                        {fr:'IPCH (Indice harmonisé)',        es:'IPCA'}],
  [/Non[-\s]?Farm Employment/i,    {fr:'Emplois non agricoles (NFP)',    es:'Empleo no agrícola (NFP)'}],
  [/^NFP\b/i,                      {fr:'NFP — Emplois non agricoles',    es:'NFP — Empleo no agrícola'}],
  [/ADP.*Employment/i,             {fr:'Emplois privés ADP',             es:'Empleo privado ADP'}],
  [/Unemployment Rate/i,           {fr:'Taux de chômage',                es:'Tasa de desempleo'}],
  [/Unemployment Claims/i,         {fr:"Demandes d'allocations chômage", es:'Solicitudes de desempleo'}],
  [/Initial Jobless Claims/i,      {fr:'Demandes initiales chômage',     es:'Solicitudes iniciales de desempleo'}],
  [/Continuing Claims/i,           {fr:'Demandes continues chômage',     es:'Solicitudes continuas'}],
  [/Average Hourly Earnings/i,     {fr:'Salaire horaire moyen',          es:'Salario por hora medio'}],
  [/Average Earnings/i,            {fr:'Salaires moyens',                es:'Salarios medios'}],
  [/Employment Change/i,           {fr:"Variation de l'emploi",          es:'Variación del empleo'}],
  [/Job Openings/i,                {fr:"Offres d'emploi (JOLTS)",        es:'Ofertas de empleo (JOLTS)'}],
  [/Participation Rate/i,          {fr:'Taux de participation',          es:'Tasa de participación'}],
  [/^GDP\b/i,                      {fr:'PIB',                            es:'PIB'}],
  [/Industrial Production/i,       {fr:'Production industrielle',        es:'Producción industrial'}],
  [/Manufacturing Production/i,    {fr:'Production manufacturière',      es:'Producción manufacturera'}],
  [/Capacity Utilization/i,        {fr:'Utilisation des capacités',      es:'Utilización de capacidad'}],
  [/Factory Orders/i,              {fr:"Commandes à l'industrie",        es:'Pedidos de fábrica'}],
  [/Durable Goods Orders/i,        {fr:'Commandes de biens durables',    es:'Pedidos de bienes duraderos'}],
  [/Final Manufacturing PMI/i,     {fr:'PMI manufacturier final',        es:'PMI manufacturero final'}],
  [/Manufacturing PMI/i,           {fr:'PMI manufacturier',              es:'PMI manufacturero'}],
  [/Final Services PMI/i,          {fr:'PMI services final',             es:'PMI servicios final'}],
  [/Services PMI/i,                {fr:'PMI services',                   es:'PMI servicios'}],
  [/Composite PMI/i,               {fr:'PMI composite',                  es:'PMI compuesto'}],
  [/Flash.*PMI/i,                  {fr:'PMI flash',                      es:'PMI flash'}],
  [/ISM Manufacturing/i,           {fr:'ISM manufacturier',              es:'ISM manufacturero'}],
  [/ISM Services/i,                {fr:'ISM services',                   es:'ISM servicios'}],
  [/^PMI\b/i,                      {fr:'PMI',                            es:'PMI'}],
  [/Federal Funds Rate/i,          {fr:'Taux directeur Fed',             es:'Tipo de interés Fed'}],
  [/FOMC.*Statement/i,             {fr:'Communiqué FOMC',                es:'Comunicado FOMC'}],
  [/FOMC.*Minutes/i,               {fr:'Compte-rendu FOMC',              es:'Actas del FOMC'}],
  [/FOMC.*Press Conference/i,      {fr:'Conférence de presse FOMC',      es:'Rueda de prensa FOMC'}],
  [/FOMC.*Meeting/i,               {fr:'Réunion FOMC',                   es:'Reunión FOMC'}],
  [/Fed Chair/i,                   {fr:'Discours du président de la Fed',es:'Discurso del presidente de la Fed'}],
  [/Main Refinancing Rate/i,       {fr:'Taux de refinancement BCE',      es:'Tipo de refinanciación BCE'}],
  [/ECB.*Press Conference/i,       {fr:'Conférence de presse BCE',       es:'Rueda de prensa BCE'}],
  [/ECB.*Statement/i,              {fr:'Communiqué BCE',                 es:'Comunicado BCE'}],
  [/ECB.*Monetary Policy/i,        {fr:'Politique monétaire BCE',        es:'Política monetaria BCE'}],
  [/Bank Rate/i,                   {fr:'Taux directeur BoE',             es:'Tipo de interés BoE'}],
  [/MPC.*Vote/i,                   {fr:'Vote du MPC (BoE)',              es:'Voto del MPC (BoE)'}],
  [/Cash Rate/i,                   {fr:'Taux directeur RBA',             es:'Tipo de interés RBA'}],
  [/Overnight Rate/i,              {fr:'Taux directeur BoC',             es:'Tipo de interés BoC'}],
  [/SNB.*Policy Rate/i,            {fr:'Taux directeur BNS',             es:'Tipo de interés BNS'}],
  [/BOJ.*Policy Rate/i,            {fr:'Taux directeur BoJ',             es:'Tipo de interés BoJ'}],
  [/Retail Sales/i,                {fr:'Ventes au détail',               es:'Ventas minoristas'}],
  [/Consumer Confidence/i,         {fr:'Confiance consommateurs',        es:'Confianza del consumidor'}],
  [/Consumer Sentiment/i,          {fr:'Sentiment consommateurs',        es:'Sentimiento del consumidor'}],
  [/Consumer Spending/i,           {fr:'Dépenses des ménages',           es:'Gasto del consumidor'}],
  [/Personal Income/i,             {fr:'Revenu personnel',               es:'Ingreso personal'}],
  [/Personal Spending/i,           {fr:'Dépenses personnelles',          es:'Gasto personal'}],
  [/Building Permits/i,            {fr:'Permis de construire',           es:'Permisos de construcción'}],
  [/Housing Starts/i,              {fr:'Mises en chantier',              es:'Inicios de viviendas'}],
  [/New Home Sales/i,              {fr:'Ventes de logements neufs',      es:'Ventas de viviendas nuevas'}],
  [/Existing Home Sales/i,         {fr:'Ventes de logements anciens',    es:'Ventas de viviendas usadas'}],
  [/Pending Home Sales/i,          {fr:'Ventes de logements en attente', es:'Ventas pendientes de viviendas'}],
  [/Case[-\s]?Shiller/i,           {fr:'Indice Case-Shiller (immobilier)',es:'Índice Case-Shiller (inmobiliario)'}],
  [/Nationwide HPI/i,              {fr:'Indice prix logement Nationwide',es:'Índice precios vivienda Nationwide'}],
  [/Business Confidence/i,         {fr:"Confiance des entreprises",      es:'Confianza empresarial'}],
  [/Empire State/i,                {fr:'Indice manufacturier Empire State',es:'Índice manufacturero Empire State'}],
  [/Philly Fed/i,                  {fr:'Indice Philly Fed',              es:'Índice Philly Fed'}],
  [/Richmond.*Manufacturing/i,     {fr:'Indice manufacturier Richmond',  es:'Índice manufacturero Richmond'}],
  [/Chicago PMI/i,                 {fr:'PMI Chicago',                    es:'PMI Chicago'}],
  [/IFO Business Climate/i,        {fr:'Climat des affaires IFO',        es:'Clima empresarial IFO'}],
  [/ZEW.*Sentiment/i,              {fr:'Sentiment économique ZEW',       es:'Sentimiento económico ZEW'}],
  [/Tankan/i,                      {fr:'Enquête Tankan (Japon)',         es:'Encuesta Tankan'}],
  [/Trade Balance/i,                {fr:'Balance commerciale',           es:'Balanza comercial'}],
  [/Current Account/i,              {fr:'Balance des paiements',         es:'Cuenta corriente'}],
  [/Imports/i,                      {fr:'Importations',                  es:'Importaciones'}],
  [/Exports/i,                      {fr:'Exportations',                  es:'Exportaciones'}],
  [/Crude Oil Inventories/i,       {fr:'Stocks de pétrole brut',         es:'Inventarios de petróleo crudo'}],
  [/Natural Gas Storage/i,         {fr:'Stocks de gaz naturel',          es:'Reservas de gas natural'}],
  [/M4 Money Supply/i,             {fr:'Masse monétaire M4',             es:'Oferta monetaria M4'}],
  [/Money Supply/i,                {fr:'Masse monétaire',                es:'Oferta monetaria'}],
  [/Commodity Prices/i,            {fr:'Prix des matières premières',    es:'Precios de materias primas'}],
  [/Bank Holiday/i,                {fr:'Jour férié bancaire',            es:'Día festivo bancario'}],
  [/^Holiday/i,                    {fr:'Jour férié',                     es:'Día festivo'}],
  [/Speech/i,                      {fr:'Discours',                       es:'Discurso'}],
  [/Testimony/i,                   {fr:'Audition',                       es:'Comparecencia'}],
  [/Beige Book/i,                  {fr:'Livre beige Fed',                es:'Libro Beige Fed'}],
  [/Treasury Bill Auction/i,       {fr:"Adjudication de bons du Trésor", es:'Subasta de letras del Tesoro'}],
  [/Bond Auction/i,                {fr:"Adjudication d'obligations",     es:'Subasta de bonos'}],
]

const SUFFIX_PATTERNS = {
  fr: [[/\bm\/m\b/gi, 'm/m'],[/\by\/y\b/gi, 'a/a'],[/\bq\/q\b/gi, 't/t']],
  es: [[/\bm\/m\b/gi, 'm/m'],[/\by\/y\b/gi, 'a/a'],[/\bq\/q\b/gi, 't/t']],
  en: []
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

function fmtDate(ds,lang){
  if(!ds)return''
  try{const[m,d,y]=ds.split('-');const dt=new Date(`${y}-${m}-${d}T00:00:00`);const t=T[lang];return`${t.days[(dt.getDay()+6)%7]} ${parseInt(d)} ${t.months[dt.getMonth()]} ${y}`}catch{return ds}
}
function aColor(actual,forecast){
  if(!actual||!forecast)return'var(--text)'
  const a=parseFloat(actual.replace(/[^0-9.-]/g,'')),f=parseFloat(forecast.replace(/[^0-9.-]/g,''))
  if(isNaN(a)||isNaN(f))return'var(--text)'
  return a>f?'var(--green)':a<f?'var(--red)':'var(--amber-text)'
}
function todayFF(){const d=new Date();return`${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${d.getFullYear()}`}

// Convertit "MM-DD-YYYY" + "h:mmam/pm" en timestamp pour comparer si l'event est passé
function eventTime(dateStr, timeStr){
  if(!dateStr) return 0
  const [m,d,y] = dateStr.split('-')
  const base = new Date(`${y}-${m}-${d}T00:00:00`)
  if(!timeStr || /all day|tentative/i.test(timeStr)) return base.getTime()
  const match = String(timeStr).match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i)
  if(!match) return base.getTime()
  let h = parseInt(match[1],10)
  const mn = parseInt(match[2],10)
  const ampm = (match[3]||'').toLowerCase()
  if(ampm === 'pm' && h !== 12) h += 12
  if(ampm === 'am' && h === 12) h = 0
  base.setHours(h, mn, 0, 0)
  return base.getTime()
}

export default function CalendarPage({lang='fr',onLangChange}){
  const[events,setEvents]=useState([])
  const[loading,setLoading]=useState(true)
  const[error,setError]=useState('')
  const[week,setWeek]=useState('this')
  const[fImpact,setFImpact]=useState('all')
  const[fCurrencies,setFCurrencies]=useState([]) // [] = toutes
  const[lastUpd,setLastUpd]=useState('')
  const[openDay,setOpenDay]=useState(null)
  const t=T[lang]||T.fr
  const today=todayFF()
  const nowTs = Date.now()

  async function load(){
    setLoading(true);setError('')
    try{
      const r=await fetch(`/api/calendar?week=${week}&t=${Date.now()}`,{cache:'no-store'})
      const data=await r.json()
      if(data.error)throw new Error(data.error)
      setEvents(data.events||[])
      setLastUpd(new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}))
    }catch(e){setError(e.message);setEvents([])}
    setLoading(false)
  }

  useEffect(()=>{load()},[week])
  // Refresh toutes les 60s pour récupérer les actuals dès qu'ils sont publiés
  useEffect(()=>{const iv=setInterval(load,60000);return()=>clearInterval(iv)},[week])

  // Devises présentes dans les events, ordonnées selon CURRENCY_ORDER
  const availableCurrencies = useMemo(()=>{
    const present = new Set(events.map(e=>e.currency).filter(Boolean))
    return CURRENCY_ORDER.filter(c => present.has(c))
      .concat([...present].filter(c => !CURRENCY_ORDER.includes(c)).sort())
  },[events])

  const filtered=events.filter(e=>{
    const iOk=fImpact==='all'||e.impact===fImpact
    const cOk=fCurrencies.length===0||fCurrencies.includes(e.currency)
    return iOk&&cOk
  })
  const grouped={}
  filtered.forEach(e=>{if(!grouped[e.date])grouped[e.date]=[];grouped[e.date].push(e)})
  const dates=Object.keys(grouped).sort()

  useEffect(()=>{
    if(dates.includes(today))setOpenDay(today)
    else if(dates.length)setOpenDay(dates[0])
    else setOpenDay(null)
  },[events.length,fImpact,fCurrencies.join(',')])

  function toggleCurrency(cur){
    setFCurrencies(prev=>prev.includes(cur)?prev.filter(c=>c!==cur):[...prev,cur])
  }
  function selectAllCurrencies(){ setFCurrencies([]) }

  const btn=(active)=>({padding:'6px 14px',fontSize:'12px',cursor:'pointer',borderRadius:'99px',border:'0.5px solid var(--border2)',fontFamily:'inherit',fontWeight:'500',background:active?'var(--blue)':'transparent',color:active?'#fff':'var(--text2)',transition:'all 0.15s'})
  const chipBtn=(active)=>({padding:'6px 12px',fontSize:'12px',cursor:'pointer',borderRadius:'99px',border:'0.5px solid var(--border2)',fontFamily:'inherit',fontWeight:'600',background:active?'var(--blue)':'var(--surface2)',color:active?'#fff':'var(--text2)',transition:'all 0.15s',display:'inline-flex',alignItems:'center',gap:'5px'})
  const card={background:'var(--surface)',border:'0.5px solid var(--border)',borderRadius:'var(--radius-lg)'}

  return(
    <div className="cal-wrap" style={{maxWidth:'1100px',margin:'0 auto',padding:'28px 24px 60px'}}>

      {/* Header */}
      <div className="cal-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:'600',marginBottom:'4px'}}>{t.title}</h1>
          <div style={{fontSize:'12px',color:'var(--text3)'}}>{t.subtitle}{lastUpd&&` · ${t.lastUpdate} : ${lastUpd}`}</div>
        </div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
          <div style={{display:'flex',border:'0.5px solid var(--border2)',borderRadius:'99px',overflow:'hidden',background:'var(--surface)'}}>
            {[{c:'fr',l:'🇫🇷 FR'},{c:'en',l:'🇬🇧 EN'},{c:'es',l:'🇪🇸 ES'}].map(x=>(
              <button key={x.c} onClick={()=>onLangChange&&onLangChange(x.c)} style={btn(lang===x.c)}>{x.l}</button>
            ))}
          </div>
          <div style={{display:'flex',border:'0.5px solid var(--border2)',borderRadius:'99px',overflow:'hidden',background:'var(--surface)'}}>
            <button onClick={()=>setWeek('this')} style={btn(week==='this')}>{t.thisWeek}</button>
            <button onClick={()=>setWeek('next')} style={btn(week==='next')}>{t.nextWeek}</button>
          </div>
          <button onClick={load} style={{...btn(false),background:'var(--surface2)'}}>{t.refresh}</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{...card,padding:'14px 18px',marginBottom:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}}>
          <span style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',minWidth:'68px'}}>{t.filterImpact}</span>
          {['all','High','Medium','Low'].map(imp=>(
            <button key={imp} onClick={()=>setFImpact(imp)} style={btn(fImpact===imp)}>
              {imp==='all'?t.all:imp==='High'?t.high:imp==='Medium'?t.medium:t.low}
            </button>
          ))}
        </div>

        <div style={{display:'flex',flexWrap:'wrap',gap:'6px',alignItems:'center'}}>
          <span style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',minWidth:'68px'}}>{t.filterCurrency}</span>
          <button onClick={selectAllCurrencies} style={chipBtn(fCurrencies.length===0)}>
            🌍 {t.all}
          </button>
          {availableCurrencies.length === 0 && !loading && (
            <span style={{fontSize:'11px',color:'var(--text3)',fontStyle:'italic'}}>(aucune devise disponible)</span>
          )}
          {availableCurrencies.map(cur=>(
            <button key={cur} onClick={()=>toggleCurrency(cur)} style={chipBtn(fCurrencies.includes(cur))}>
              <span>{FLAG[cur]||''}</span>
              <span>{cur}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading?(
        <div style={{...card,padding:'60px',textAlign:'center',color:'var(--text3)'}}>
          <div style={{fontSize:'32px',marginBottom:'12px'}}>⏳</div>{t.loading}
        </div>
      ):error?(
        <div style={{...card,padding:'40px',textAlign:'center',color:'var(--red-text)',background:'var(--red-bg)'}}>
          <div style={{fontSize:'28px',marginBottom:'8px'}}>⚠️</div>{t.error}: {error}
          <div style={{marginTop:'12px'}}><button onClick={load} style={btn(true)}>{t.refresh}</button></div>
        </div>
      ):!dates.length?(
        <div style={{...card,padding:'60px 24px',textAlign:'center',color:'var(--text3)'}}>
          <div style={{fontSize:'32px',marginBottom:'12px'}}>📅</div>
          <div style={{fontSize:'14px',marginBottom:'10px'}}>{week==='next' && events.length===0 ? t.nextEmpty : t.noEvents}</div>
          {events.length>0 && filtered.length===0 && (
            <div style={{fontSize:'12px',color:'var(--text3)',marginTop:'6px'}}>
              {events.length} événement{events.length>1?'s':''} masqué{events.length>1?'s':''} par les filtres
            </div>
          )}
          <button onClick={load} style={{...btn(false),marginTop:'16px',background:'var(--surface2)'}}>{t.refresh}</button>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {dates.map(date=>{
            const evts=grouped[date]
            if(!evts?.length)return null
            const isToday=date===today
            const isOpen=openDay===date
            const hC=evts.filter(e=>e.impact==='High').length
            const mC=evts.filter(e=>e.impact==='Medium').length
            return(
              <div key={date} style={{...card,overflow:'hidden',borderColor:isToday?'var(--blue)':'rgba(255,255,255,0.07)'}}>
                <div onClick={()=>setOpenDay(isOpen?null:date)}
                  style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 18px',cursor:'pointer',background:isToday?'rgba(45,111,255,0.07)':'var(--surface2)',borderBottom:isOpen?'0.5px solid var(--border)':'none',gap:'8px',flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}>
                    {isToday&&<span style={{fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'99px',background:'var(--blue)',color:'#fff',textTransform:'uppercase'}}>{t.today}</span>}
                    <span style={{fontSize:'14px',fontWeight:'600'}}>{fmtDate(date,lang)}</span>
                    <span style={{fontSize:'12px',color:'var(--text3)'}}>{evts.length} {evts.length>1?t.eventsP:t.events}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    {hC>0&&<span style={{fontSize:'11px',fontWeight:'700',padding:'2px 10px',borderRadius:'99px',background:'rgba(232,80,74,0.15)',color:'#e8504a'}}>🔴 {hC}</span>}
                    {mC>0&&<span style={{fontSize:'11px',fontWeight:'700',padding:'2px 10px',borderRadius:'99px',background:'rgba(250,199,117,0.15)',color:'#fac775'}}>🟠 {mC}</span>}
                    <span style={{color:'var(--text3)',fontSize:'18px',transform:isOpen?'rotate(90deg)':'rotate(0deg)',transition:'transform 0.2s',display:'inline-block'}}>›</span>
                  </div>
                </div>
                {isOpen&&(
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
                      <thead>
                        <tr style={{background:'var(--surface2)'}}>
                          {[t.time,t.currency,t.impact,t.event,t.actual,t.forecast,t.previous].map(h=>(
                            <th key={h} style={{padding:'9px 14px',textAlign:'left',fontSize:'10px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',borderBottom:'0.5px solid var(--border)',whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {evts.map((ev,i)=>{
                          const ic=IC[ev.impact]||IC.Low
                          const ac=aColor(ev.actual,ev.forecast)
                          const tTitle=translateTitle(ev.title,lang)
                          const evTs = eventTime(ev.date, ev.time)
                          const isPast = evTs > 0 && evTs < nowTs
                          const hasActual = !!ev.actual
                          return(
                            <tr key={i} style={{borderBottom:'0.5px solid var(--border)',background:ic.bg}}>
                              <td style={{padding:'11px 14px',color:'var(--text2)',whiteSpace:'nowrap',fontFamily:'monospace',fontSize:'12px'}}>{ev.time||'—'}</td>
                              <td style={{padding:'11px 14px',whiteSpace:'nowrap'}}>
                                <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                                  <span style={{fontSize:'15px'}}>{FLAG[ev.currency]||''}</span>
                                  <span style={{fontWeight:'700',fontSize:'12px'}}>{ev.currency}</span>
                                </div>
                              </td>
                              <td style={{padding:'11px 14px'}}>
                                <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
                                  <div style={{width:'8px',height:'8px',borderRadius:'50%',background:ic.dot,flexShrink:0}} />
                                  <span style={{fontSize:'11px',color:ic.text,fontWeight:'600'}}>{ev.impact||'—'}</span>
                                </div>
                              </td>
                              <td style={{padding:'11px 14px',maxWidth:'320px'}}>
                                <div style={{fontWeight:ev.impact==='High'?'600':'400'}}>{tTitle}</div>
                                {lang!=='en'&&tTitle!==ev.title&&<div style={{fontSize:'10px',color:'var(--text3)',marginTop:'1px',fontStyle:'italic'}}>{ev.title}</div>}
                                {ev.country&&<div style={{fontSize:'10px',color:'var(--text3)',marginTop:'1px'}}>{ev.country}</div>}
                              </td>
                              <td style={{padding:'11px 14px',whiteSpace:'nowrap'}}>
                                {hasActual ? (
                                  <span style={{fontWeight:'700',color:ac}}>{ev.actual}</span>
                                ) : isPast ? (
                                  <span title={t.past} style={{fontSize:'10px',color:'var(--text3)',fontStyle:'italic'}}>⏳ en attente</span>
                                ) : (
                                  <span title={t.upcoming} style={{fontSize:'10px',color:'var(--text3)'}}>—</span>
                                )}
                              </td>
                              <td style={{padding:'11px 14px',color:'var(--text2)',whiteSpace:'nowrap'}}>{ev.forecast||'—'}</td>
                              <td style={{padding:'11px 14px',color:'var(--text3)',whiteSpace:'nowrap'}}>{ev.previous||'—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{marginTop:'20px',textAlign:'center',fontSize:'11px',color:'var(--text3)'}}>
        Source : <a href="https://finnhub.io" target="_blank" rel="noopener noreferrer" style={{color:'#4d8fff',textDecoration:'none'}}>Finnhub</a>
        {' · '}Données indicatives uniquement.
      </div>
    </div>
  )
}
