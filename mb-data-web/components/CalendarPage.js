'use client'
import { useState, useEffect } from 'react'

const T = {
  fr: {
    title:'Calendrier Économique', subtitle:'Données ForexFactory — actualisé toutes les 5 minutes',
    thisWeek:'Cette semaine', nextWeek:'Semaine prochaine', refresh:'↻ Actualiser',
    loading:'Chargement...', error:'Erreur de chargement', noEvents:'Aucun événement', all:'Tout',
    high:'🔴 Fort', medium:'🟠 Moyen', low:'🟡 Faible',
    time:'Heure', currency:'Devise', event:'Événement', actual:'Réel', forecast:'Prévision', previous:'Précédent', impact:'Impact',
    filterImpact:'Impact', filterZone:'Zone', lastUpdate:'MàJ', today:"Aujourd'hui", events:'événement', eventsP:'événements',
    days:['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],
    months:['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'],
  },
  en: {
    title:'Economic Calendar', subtitle:'ForexFactory data — refreshed every 5 minutes',
    thisWeek:'This week', nextWeek:'Next week', refresh:'↻ Refresh',
    loading:'Loading...', error:'Loading error', noEvents:'No events', all:'All',
    high:'🔴 High', medium:'🟠 Medium', low:'🟡 Low',
    time:'Time', currency:'Currency', event:'Event', actual:'Actual', forecast:'Forecast', previous:'Previous', impact:'Impact',
    filterImpact:'Impact', filterZone:'Zone', lastUpdate:'Updated', today:'Today', events:'event', eventsP:'events',
    days:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    months:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  },
  es: {
    title:'Calendario Económico', subtitle:'Datos ForexFactory — actualizado cada 5 minutos',
    thisWeek:'Esta semana', nextWeek:'Próxima semana', refresh:'↻ Actualizar',
    loading:'Cargando...', error:'Error de carga', noEvents:'Sin eventos', all:'Todo',
    high:'🔴 Alto', medium:'🟠 Medio', low:'🟡 Bajo',
    time:'Hora', currency:'Divisa', event:'Evento', actual:'Real', forecast:'Previsión', previous:'Anterior', impact:'Impacto',
    filterImpact:'Impacto', filterZone:'Zona', lastUpdate:'Actualizado', today:'Hoy', events:'evento', eventsP:'eventos',
    days:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],
    months:['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  }
}

const ZONES = {
  all:    { fr:'Tout',       en:'All',          es:'Todo',      currencies:null },
  usa:    { fr:'🇺🇸 USA',    en:'🇺🇸 USA',       es:'🇺🇸 USA',   currencies:['USD'] },
  europe: { fr:'🇪🇺 Europe', en:'🇪🇺 Europe',    es:'🇪🇺 Europa', currencies:['EUR','GBP','CHF','SEK','NOK','DKK'] },
  japan:  { fr:'🇯🇵 Japon',  en:'🇯🇵 Japan',     es:'🇯🇵 Japón', currencies:['JPY'] },
  canada: { fr:'🇨🇦 Canada', en:'🇨🇦 Canada',    es:'🇨🇦 Canadá', currencies:['CAD'] },
  aussie: { fr:'🇦🇺 Aus/NZ', en:'🇦🇺 Aus/NZ',    es:'🇦🇺 Aus/NZ', currencies:['AUD','NZD'] },
  china:  { fr:'🇨🇳 Chine',  en:'🇨🇳 China',     es:'🇨🇳 China',  currencies:['CNY','CNH'] },
}

const FLAG={USD:'🇺🇸',EUR:'🇪🇺',GBP:'🇬🇧',JPY:'🇯🇵',CAD:'🇨🇦',AUD:'🇦🇺',NZD:'🇳🇿',CHF:'🇨🇭',CNY:'🇨🇳',CNH:'🇨🇳',SEK:'🇸🇪',NOK:'🇳🇴',DKK:'🇩🇰'}
const IC={High:{dot:'#e8504a',text:'#e8504a',bg:'rgba(232,80,74,0.03)'},Medium:{dot:'#fac775',text:'#fac775',bg:'transparent'},Low:{dot:'#565e78',text:'#565e78',bg:'transparent'},Holiday:{dot:'#2d6fff',text:'#4d8fff',bg:'rgba(45,111,255,0.03)'}}

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

export default function CalendarPage({lang='fr',onLangChange}){
  const[events,setEvents]=useState([])
  const[loading,setLoading]=useState(true)
  const[error,setError]=useState('')
  const[week,setWeek]=useState('this')
  const[fImpact,setFImpact]=useState('all')
  const[fZone,setFZone]=useState('all')
  const[lastUpd,setLastUpd]=useState('')
  const[openDay,setOpenDay]=useState(null)
  const t=T[lang]||T.fr
  const today=todayFF()

  async function load(){
    setLoading(true);setError('')
    try{
      const r=await fetch(`/api/calendar?week=${week}&t=${Date.now()}`)
      const data=await r.json()
      if(data.error)throw new Error(data.error)
      setEvents(data.events||[])
      setLastUpd(new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}))
    }catch(e){setError(e.message)}
    setLoading(false)
  }

  useEffect(()=>{load()},[week])
  useEffect(()=>{const iv=setInterval(load,300000);return()=>clearInterval(iv)},[week])

  const zoneCur=ZONES[fZone]?.currencies
  const filtered=events.filter(e=>{
    const iOk=fImpact==='all'||e.impact===fImpact
    const zOk=!zoneCur||zoneCur.includes(e.currency)
    return iOk&&zOk
  })
  const grouped={}
  filtered.forEach(e=>{if(!grouped[e.date])grouped[e.date]=[];grouped[e.date].push(e)})
  const dates=Object.keys(grouped).sort()

  useEffect(()=>{
    if(dates.includes(today))setOpenDay(today)
    else if(dates.length)setOpenDay(dates[0])
  },[events.length,fImpact,fZone])

  const btn=(active)=>({padding:'6px 14px',fontSize:'12px',cursor:'pointer',borderRadius:'99px',border:'0.5px solid var(--border2)',fontFamily:'inherit',fontWeight:'500',background:active?'var(--blue)':'transparent',color:active?'#fff':'var(--text2)',transition:'all 0.15s'})
  const card={background:'var(--surface)',border:'0.5px solid var(--border)',borderRadius:'var(--radius-lg)'}

  return(
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'28px 24px 60px'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:'600',marginBottom:'4px'}}>{t.title}</h1>
          <div style={{fontSize:'12px',color:'var(--text3)'}}>{t.subtitle}{lastUpd&&` · ${t.lastUpdate} : ${lastUpd}`}</div>
        </div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
          {/* Language */}
          <div style={{display:'flex',border:'0.5px solid var(--border2)',borderRadius:'99px',overflow:'hidden',background:'var(--surface)'}}>
            {[{c:'fr',l:'🇫🇷 FR'},{c:'en',l:'🇬🇧 EN'},{c:'es',l:'🇪🇸 ES'}].map(x=>(
              <button key={x.c} onClick={()=>onLangChange&&onLangChange(x.c)} style={btn(lang===x.c)}>{x.l}</button>
            ))}
          </div>
          {/* Week */}
          <div style={{display:'flex',border:'0.5px solid var(--border2)',borderRadius:'99px',overflow:'hidden',background:'var(--surface)'}}>
            <button onClick={()=>setWeek('this')} style={btn(week==='this')}>{t.thisWeek}</button>
            <button onClick={()=>setWeek('next')} style={btn(week==='next')}>{t.nextWeek}</button>
          </div>
          <button onClick={load} style={{...btn(false),background:'var(--surface2)'}}>{t.refresh}</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{...card,padding:'14px 18px',marginBottom:'16px',display:'flex',flexWrap:'wrap',gap:'12px',alignItems:'center'}}>
        <span style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{t.filterImpact}</span>
        {['all','High','Medium','Low'].map(imp=>(
          <button key={imp} onClick={()=>setFImpact(imp)} style={btn(fImpact===imp)}>
            {imp==='all'?t.all:imp==='High'?t.high:imp==='Medium'?t.medium:t.low}
          </button>
        ))}
        <div style={{width:'0.5px',height:'24px',background:'var(--border)',flexShrink:0}} />
        <span style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{t.filterZone}</span>
        {Object.entries(ZONES).map(([key,zone])=>(
          <button key={key} onClick={()=>setFZone(key)} style={btn(fZone===key)}>
            {zone[lang]||zone.en}
          </button>
        ))}
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
        <div style={{...card,padding:'60px',textAlign:'center',color:'var(--text3)'}}>{t.noEvents}</div>
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
                  style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 18px',cursor:'pointer',background:isToday?'rgba(45,111,255,0.07)':'var(--surface2)',borderBottom:isOpen?'0.5px solid var(--border)':'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
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
                              <td style={{padding:'11px 14px',maxWidth:'300px'}}>
                                <div style={{fontWeight:ev.impact==='High'?'600':'400'}}>{ev.title}</div>
                                {ev.country&&<div style={{fontSize:'10px',color:'var(--text3)',marginTop:'1px'}}>{ev.country}</div>}
                              </td>
                              <td style={{padding:'11px 14px',fontWeight:'700',color:ac,whiteSpace:'nowrap'}}>{ev.actual||'—'}</td>
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
        Source : <a href="https://www.forexfactory.com/calendar" target="_blank" rel="noopener noreferrer" style={{color:'#4d8fff',textDecoration:'none'}}>ForexFactory</a>
        {' · '}Données indicatives uniquement.
      </div>
    </div>
  )
}
