'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AuthPage from '../../components/AuthPage'
import { PROPFIRM_RULES, FIRM_COLORS, MONTHS_FR, MONTHS_FULL, FIRM_SUGGESTIONS, STATUS_COLORS, PX_FIRMS, plansForFirm, accountLabel, defaultDdType, defaultPayoutTarget, defaultMinTradingDays, defaultChallengePrice, defaultMinDailyProfit, defaultProfitSplit } from '../../lib/constants'
import CalendarPage from '../../components/CalendarPage'
import JournalPage from '../../components/JournalPage'
import Logo from '../../components/Logo'
import CertificatesModal from '../../components/CertificatesModal'
import OnboardingModal from '../../components/OnboardingModal'
import Skeleton from '../../components/Skeleton'
import Tooltip, { TooltipIcon } from '../../components/Tooltip'
import PropfirmComparator from '../../components/PropfirmComparator'
import { FIRM_LOGOS, getFirmLogo } from '../../lib/firmLogos'


function toEUR(amount, cur, rates) { return amount*(rates[cur]||1) }
function fmtE(val, dec=2) { return val.toFixed(dec)+' €' }
function fmtENet(val, dec=2) { return (val>=0?'+':'')+val.toFixed(dec)+' €' }

const cardS = { background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-lg)' }


// ── Mini Bar Chart for dashboard ──
function MiniBarChart({firms, firmTotalSpent, firmTotalPayouts}) {
  const ref = useRef(null)
  const chart = useRef(null)

  useEffect(()=>{
    if(!ref.current||!firms.length) return
    import('chart.js/auto').then(({default: Chart})=>{
      if(chart.current){chart.current.destroy();chart.current=null}
      const labels=firms.map(f=>f.name.length>8?f.name.slice(0,8)+'…':f.name)
      const spent=firms.map(f=>parseFloat(firmTotalSpent(f).toFixed(2)))
      const payouts=firms.map(f=>parseFloat(firmTotalPayouts(f).toFixed(2)))
      chart.current=new Chart(ref.current,{
        type:'bar',
        data:{labels,datasets:[
          {label:'Dépensé (€)',data:spent,backgroundColor:'#e8504a',borderRadius:4},
          {label:'Payouts (€)',data:payouts,backgroundColor:'#1db87a',borderRadius:4}
        ]},
        options:{
          responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} €`}}},
          scales:{
            x:{grid:{display:false},ticks:{color:'#565e78',font:{size:9}}},
            y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#565e78',font:{size:9},callback:v=>v+'€'}}
          }
        }
      })
    })
    return ()=>{if(chart.current){chart.current.destroy();chart.current=null}}
  },[firms.map(f=>f.id).join(',')])

  return <canvas ref={ref} />
}

function AnalyticsCharts({cLabels,cSpent,cPayout,cNet,yLabels,ySpent,yPayout,yNet,mLabels,mSpent,mPayout,mNet}) {
  const cRef=useRef(null), yRef=useRef(null), mRef=useRef(null)
  const charts=useRef({})

  useEffect(()=>{
    let destroyed=false
    const destroy=(key)=>{ if(charts.current[key]){ charts.current[key].destroy(); delete charts.current[key] } }
    import('chart.js/auto').then((mod)=>{
      if(destroyed) return
      const { Chart } = mod
      const opts = {
        responsive:true, maintainAspectRatio:false,
        interaction:{mode:'index',intersect:false},
        plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.parsed.y>=0?'+':''}${ctx.parsed.y.toFixed(2)} €`}}},
        scales:{x:{grid:{display:false},ticks:{color:'#565e78',font:{size:10},maxTicksLimit:10}},y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#565e78',font:{size:10},callback:v=>v+'€'}}}
      }
      if(cRef.current){ destroy('c'); charts.current.c = new Chart(cRef.current, { type:'line', data:{labels:cLabels,datasets:[{label:'Dépenses (€)',data:cSpent,borderColor:'#e8504a',backgroundColor:'rgba(232,80,74,0.06)',fill:true,tension:0.3,pointRadius:cLabels.length>20?0:4,borderWidth:2},{label:'Payouts (€)',data:cPayout,borderColor:'#1db87a',backgroundColor:'rgba(29,184,122,0.06)',fill:true,tension:0.3,pointRadius:cLabels.length>20?0:4,borderWidth:2},{label:'Net (€)',data:cNet,borderColor:'#2d6fff',fill:false,tension:0.3,pointRadius:0,borderWidth:2,borderDash:[6,3]}]}, options:opts }) }
      if(yRef.current){ destroy('y'); charts.current.y = new Chart(yRef.current, { type:'bar', data:{labels:yLabels,datasets:[{label:'Dépenses (€)',data:ySpent,backgroundColor:'#e8504a',borderRadius:5},{label:'Payouts (€)',data:yPayout,backgroundColor:'#1db87a',borderRadius:5},{label:'Net (€)',data:yNet,backgroundColor:yNet.map(v=>v>=0?'rgba(45,111,255,0.7)':'rgba(232,80,74,0.4)'),borderRadius:5}]}, options:opts }) }
      if(mRef.current){ destroy('m'); charts.current.m = new Chart(mRef.current, { type:'bar', data:{labels:mLabels,datasets:[{label:'Dépenses (€)',data:mSpent,backgroundColor:'#e8504a',borderRadius:4},{label:'Payouts (€)',data:mPayout,backgroundColor:'#1db87a',borderRadius:4},{label:'Net (€)',data:mNet,backgroundColor:mNet.map(v=>v>=0?'rgba(45,111,255,0.7)':'rgba(232,80,74,0.4)'),borderRadius:4}]}, options:opts }) }
    }).catch(e=>console.error('Chart.js:',e))
    return ()=>{ destroyed=true; Object.values(charts.current).forEach(c=>c?.destroy()) }
  },[cLabels.join(','),yLabels.join(','),mLabels.join(',')])

  const leg=(items)=><div style={{display:'flex',gap:'14px',flexWrap:'wrap'}}>{items.map(it=><div key={it.l} style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'12px',color:'var(--text2)'}}><div style={{width:'10px',height:'3px',borderRadius:'2px',background:it.c}}></div>{it.l}</div>)}</div>

  return <>
    <div style={{...cardS,padding:'18px',marginBottom:'16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
        <div style={{fontSize:'13px',fontWeight:'600',color:'var(--text2)'}}>Évolution cumulée</div>
        {leg([{l:'Dépenses',c:'#e8504a'},{l:'Payouts',c:'#1db87a'},{l:'Net',c:'#2d6fff'}])}
      </div>
      <div style={{position:'relative',height:'240px'}}><canvas ref={cRef} /></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
      <div style={{...cardS,padding:'18px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
          <div style={{fontSize:'13px',fontWeight:'600',color:'var(--text2)'}}>Performance annuelle</div>
          {leg([{l:'Dépenses',c:'#e8504a'},{l:'Payouts',c:'#1db87a'},{l:'Net',c:'rgba(45,111,255,0.8)'}])}
        </div>
        <div style={{position:'relative',height:'220px'}}><canvas ref={yRef} /></div>
      </div>
      <div style={{...cardS,padding:'18px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
          <div style={{fontSize:'13px',fontWeight:'600',color:'var(--text2)'}}>Performance mensuelle</div>
          {leg([{l:'Dépenses',c:'#e8504a'},{l:'Payouts',c:'#1db87a'},{l:'Net',c:'rgba(45,111,255,0.8)'}])}
        </div>
        <div style={{position:'relative',height:'220px'}}><canvas ref={mRef} /></div>
      </div>
    </div>
  </>
}

export default function Home() {
  const [user,setUser]=useState(null)
  const [loading,setLoading]=useState(true)
  const [firms,setFirms]=useState([])
  const [rates,setRates]=useState({USD:0.9259,GBP:1.163,CHF:1.032,EUR:1})
  const [rateInfo,setRateInfo]=useState('Chargement...')
  const [page,setPage]=useState('dashboard')
  const [currency,setCurrencyMode]=useState('native')
  const [searchQ,setSearchQ]=useState('')
  const [toast,setToast]=useState('')
  const [firmModal,setFirmModal]=useState(false)
  const [acctModal,setAcctModal]=useState(null)
  const [firmDrawer,setFirmDrawer]=useState(null)
  const [certsFirm,setCertsFirm]=useState(null) // firme dont on affiche les diplômes
  const [showOnboarding,setShowOnboarding]=useState(false) // modal d'accueil pour nouveau user
  const [acctDrawer,setAcctDrawer]=useState(null)
  const [payoutForm,setPayoutForm]=useState(false)
  const [newFirmName,setNewFirmName]=useState('')
  const [acctForm,setAcctForm]=useState({buyDate:'',currency:'USD',spent:'',activationFee:'',activationDate:'',status:'Challenge',notes:'',planSize:'50k',name:'',ddType:'static',payoutTarget:'',minTradingDays:'',minDailyProfit:''})
  const [payoutFD,setPayoutFD]=useState({date:'',amount:'',note:''})
  const [calYear,setCalYear]=useState(new Date().getFullYear())
  const [calMonth,setCalMonth]=useState(new Date().getMonth())
  const [selDay,setSelDay]=useState(null)
  const [selRulesFirm,setSelRulesFirm]=useState(Object.keys(PROPFIRM_RULES)[0])
  const [selRulesPlan,setSelRulesPlan]=useState('100k')
  const [pxSessions,setPxSessions]=useState({})
  const [pxSelFirm,setPxSelFirm]=useState(null)
  const [pxTradeFilter,setPxTradeFilter]=useState('all')
  const [pxConnecting,setPxConnecting]=useState(false)
  const [pxLoginData,setPxLoginData]=useState({user:'',pass:''})
  const [pxError,setPxError]=useState('')
  const [calLang,setCalLang]=useState('fr')
  const [mobileNavOpen,setMobileNavOpen]=useState(false)

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user??null);setLoading(false)})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>setUser(session?.user??null))
    return ()=>subscription.unsubscribe()
  },[])

  useEffect(()=>{if(user){loadFirms();fetchRates()}},[user])

  // Détecte si on doit afficher le modal d'onboarding (nouveau user, 0 firmes, pas dismissed)
  // Se déclenche quand `firms` est chargé et qu'un user est présent
  useEffect(()=>{
    if(!user || loading) return
    if(typeof window === 'undefined') return
    const dismissed = localStorage.getItem('quantara_onboarding_dismissed') === '1'
    if(!dismissed && firms.length === 0){
      // Petit délai pour laisser l'UI se stabiliser après le load
      const t = setTimeout(()=>setShowOnboarding(true), 600)
      return ()=>clearTimeout(t)
    }
  },[user, loading, firms.length])

  async function fetchRates(){
    try{
      const r=await fetch('https://api.exchangerate-api.com/v4/latest/EUR')
      const d=await r.json()
      const nr={EUR:1,USD:1/d.rates.USD,GBP:1/d.rates.GBP,CHF:1/d.rates.CHF}
      setRates(nr)
      const ts=new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
      setRateInfo(`1 USD ≈ ${nr.USD.toFixed(4)} EUR · 1 GBP ≈ ${nr.GBP.toFixed(4)} EUR — ${ts}`)
    }catch{setRateInfo('Taux hors ligne · 1 USD ≈ 0.9259 €')}
  }

  async function loadFirms(){
    const {data:fd}=await supabase.from('firms').select('*').order('created_at')
    if(!fd)return
    const {data:ad}=await supabase.from('accounts').select('*').order('buy_date')
    const {data:pd}=await supabase.from('payouts').select('*').order('date')
    setFirms(fd.map((f,i)=>({...f,color:f.color||FIRM_COLORS[i%FIRM_COLORS.length],accounts:(ad||[]).filter(a=>a.firm_id===f.id).map(a=>({...a,payouts:(pd||[]).filter(p=>p.account_id===a.id)}))})))
  }

  function showToast(msg){setToast(msg);setTimeout(()=>setToast(''),2200)}
  async function signOut(){await supabase.auth.signOut();setUser(null);setFirms([])}

  async function createFirm(){
    if(!newFirmName.trim()){showToast('Nom requis');return}
    const color=FIRM_COLORS[firms.length%FIRM_COLORS.length]
    const {data}=await supabase.from('firms').insert({name:newFirmName.trim(),color,user_id:user.id}).select().single()
    setFirmModal(false);setNewFirmName('')
    await loadFirms();showToast('PropFirm ajoutée ✓')
    setAcctModal({firmId:data.id})
    {const tg=defaultPayoutTarget(data.name,'50k');const md=defaultMinTradingDays(data.name,'50k');const pr=defaultChallengePrice(data.name,'50k');const mdp=defaultMinDailyProfit(data.name,'50k');setAcctForm({buyDate:new Date().toISOString().slice(0,10),currency:'USD',spent:pr!==null?String(pr):'',activationFee:'',activationDate:'',status:'Challenge',notes:'',planSize:'50k',name:'',ddType:defaultDdType(data.name),payoutTarget:tg!==null?String(tg):'',minTradingDays:md!==null?String(md):'',minDailyProfit:mdp!==null?String(mdp):''})}
  }

  async function deleteFirm(firmId){
    if(!confirm('Supprimer cette firme ?'))return
    await supabase.from('firms').delete().eq('id',firmId)
    setFirmDrawer(null);await loadFirms();showToast('Firme supprimée')
  }

  async function renameFirm(firmId){
    const firm=firms.find(f=>f.id===firmId)
    const name=prompt('Nouveau nom :',firm?.name)
    if(!name?.trim())return
    await supabase.from('firms').update({name:name.trim()}).eq('id',firmId)
    await loadFirms();showToast('Renommé ✓')
  }

  async function renameAccount(acctId, currentName, buyDate){
    const placeholder = currentName || ''
    const name = prompt(`Nom du compte (laisser vide pour "Compte du ${buyDate}") :`, placeholder)
    if(name===null) return // annulé
    const {error} = await supabase.from('accounts').update({name:name.trim()}).eq('id',acctId)
    if(error){ showToast('Erreur : '+(error.message||'inconnue')); return }
    await loadFirms()
    showToast(name.trim() ? `Renommé en "${name.trim()}" ✓` : 'Nom effacé ✓')
  }

  async function saveAccount(){
    const {firmId,acct}=acctModal
    if(!acctForm.buyDate){showToast('Date requise');return}
    const payload={firm_id:firmId,user_id:user.id,buy_date:acctForm.buyDate,currency:acctForm.currency,spent:parseFloat(acctForm.spent)||0,activation_fee:parseFloat(acctForm.activationFee)||0,activation_date:acctForm.activationDate||null,status:acctForm.status,notes:acctForm.notes,plan_size:acctForm.planSize||'50k',name:(acctForm.name||'').trim(),dd_type:acctForm.ddType||'static',payout_target:acctForm.payoutTarget?parseFloat(acctForm.payoutTarget):null,min_trading_days:acctForm.minTradingDays?parseInt(acctForm.minTradingDays,10):null,min_daily_profit:acctForm.minDailyProfit?parseFloat(acctForm.minDailyProfit):null}
    // === Auto-reset balance au passage en Financé ===
    // Si le compte vient de passer en Financé (et qu'il n'était pas déjà Financé)
    // ET qu'aucun funded_date n'a déjà été fixé, on l'initialise automatiquement
    // pour que la balance reparte de zéro à partir de la date d'activation (sinon aujourd'hui).
    // Pareil pour un nouveau compte créé directement en Financé.
    let autoReset = false
    if(acctForm.status === 'Financé'){
      const wasFinanced = acct?.status === 'Financé'
      const alreadyHasResetDate = !!acct?.funded_date
      if(!wasFinanced && !alreadyHasResetDate){
        payload.funded_date = acctForm.activationDate || new Date().toISOString().slice(0,10)
        autoReset = true
      }
    }
    if(acct)await supabase.from('accounts').update(payload).eq('id',acct.id)
    else await supabase.from('accounts').insert(payload)
    setAcctModal(null);await loadFirms()
    showToast(autoReset
      ? `Passage en Financé · balance reset au ${payload.funded_date} ✓`
      : (acct?'Compte modifié ✓':'Compte ajouté ✓'))
  }

  async function deleteAccount(acctId){
    if(!confirm('Supprimer ce compte ?'))return
    await supabase.from('accounts').delete().eq('id',acctId)
    setAcctDrawer(null);await loadFirms();showToast('Compte supprimé')
  }

  async function savePayout(){
    if(!payoutFD.date||!payoutFD.amount){showToast('Date et montant requis');return}
    await supabase.from('payouts').insert({account_id:acctDrawer.acctId,user_id:user.id,date:payoutFD.date,amount:parseFloat(payoutFD.amount),note:payoutFD.note})
    setPayoutForm(false);setPayoutFD({date:'',amount:'',note:''})
    await loadFirms();showToast('Payout ajouté ✓')
  }

  async function deletePayout(payoutId){
    if(!confirm('Supprimer ?'))return
    await supabase.from('payouts').delete().eq('id',payoutId)
    await loadFirms();showToast('Payout supprimé')
  }

  async function doPxLogin(){
    const firm=firms.find(f=>f.id===pxSelFirm)
    if(!pxLoginData.user||!pxLoginData.pass){setPxError('Renseignez vos identifiants');return}
    setPxConnecting(true);setPxError('')
    try{
      const r=await fetch('/api/px-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userName:pxLoginData.user,apiKey:pxLoginData.pass,clientId:PX_FIRMS[firm?.name]})})
      const data=await r.json()
      if(!r.ok)throw new Error(data.error||'Erreur de connexion')
      setPxSessions(prev=>({...prev,[pxSelFirm]:{...data,connected:true}}))
      showToast(`Connecté à ${firm.name} ✓`)
      setPxLoginData({user:'',pass:''})
    }catch(e){setPxError(e.message)}
    setPxConnecting(false)
  }

  function totalPayoutsEUR(acct){return(acct.payouts||[]).reduce((s,p)=>s+toEUR(p.amount,acct.currency,rates),0)}
  function totalSpentForAccount(acct){return toEUR(acct.spent||0,acct.currency,rates)+toEUR(acct.activation_fee||0,acct.currency,rates)}
  function firmTotalSpent(firm){return(firm.accounts||[]).reduce((s,a)=>s+totalSpentForAccount(a),0)}
  function firmTotalPayouts(firm){return(firm.accounts||[]).reduce((s,a)=>s+totalPayoutsEUR(a),0)}
  function allAccounts(){return firms.flatMap(f=>(f.accounts||[]).map(a=>({...a,firmName:f.name,firmColor:f.color})))}

  function buildEventMap(){
    const m={}
    firms.forEach(f=>{
      ;(f.accounts||[]).forEach(a=>{
        if(!m[a.buy_date])m[a.buy_date]=[]
        m[a.buy_date].push({type:'buy',firm:f.name,amount:a.spent,currency:a.currency,firmId:f.id,acctId:a.id,label:'Challenge'})
        if(a.activation_fee>0&&a.activation_date){
          if(!m[a.activation_date])m[a.activation_date]=[]
          m[a.activation_date].push({type:'buy',firm:f.name,amount:a.activation_fee,currency:a.currency,firmId:f.id,acctId:a.id,label:'Activation'})
        }
        ;(a.payouts||[]).forEach(p=>{
          if(!m[p.date])m[p.date]=[]
          m[p.date].push({type:'pay',firm:f.name,amount:p.amount,currency:a.currency,firmId:f.id,acctId:a.id})
        })
      })
    })
    return m
  }

  function exportCSV(){
    const rows=[['Firme','Date achat','Devise','Dépensé','Frais activation','Date payout','Montant EUR','Statut','Notes']]
    firms.forEach(f=>{
      ;(f.accounts||[]).forEach(a=>{
        if(!(a.payouts||[]).length)rows.push([f.name,a.buy_date,a.currency,a.spent,a.activation_fee||0,'','',a.status,a.notes||''])
        else(a.payouts||[]).forEach(p=>rows.push([f.name,a.buy_date,a.currency,a.spent,a.activation_fee||0,p.date,toEUR(p.amount,a.currency,rates).toFixed(2),a.status,p.note||a.notes||'']))
      })
    })
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a=document.createElement('a')
    a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv)
    a.download=`Quantara_PropFirm_${new Date().toISOString().slice(0,10)}.csv`
    a.click();showToast('Export CSV ✓')
  }

  // Skeleton shell pendant le tout 1er load (avant que user soit détecté)
  // Bien plus pro qu'un "Chargement..." centré
  if(loading) return <Skeleton.AppShell />
  if(!user)return<AuthPage onAuth={u=>setUser(u)} />

  const currentFirm=firms.find(f=>f.id===firmDrawer)
  const currentAcct=acctDrawer?firms.find(f=>f.id===acctDrawer.firmId)?.accounts?.find(a=>a.id===acctDrawer.acctId):null
  const currentAcctFirm=acctDrawer?firms.find(f=>f.id===acctDrawer.firmId):null

  const accts=allAccounts()
  const totalSpentEUR=accts.reduce((s,a)=>s+totalSpentForAccount(a),0)
  const totalPayoutsEUR2=accts.reduce((s,a)=>s+totalPayoutsEUR(a),0)
  const totalNet=totalPayoutsEUR2-totalSpentEUR
  const totalPayoutCount=accts.reduce((s,a)=>s+(a.payouts||[]).length,0)

  const evtMap=buildEventMap()
  const firstDay=new Date(calYear,calMonth,1)
  let sdow=firstDay.getDay();sdow=sdow===0?6:sdow-1
  const dim=new Date(calYear,calMonth+1,0).getDate()
  const dipm=new Date(calYear,calMonth,0).getDate()
  const todayStr=new Date().toISOString().slice(0,10)
  const calDays=[]
  for(let i=sdow-1;i>=0;i--){const d=dipm-i,m2=calMonth===0?11:calMonth-1,y2=calMonth===0?calYear-1:calYear;calDays.push({day:d,dateStr:`${y2}-${String(m2+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,other:true})}
  for(let d=1;d<=dim;d++){const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;calDays.push({day:d,dateStr:ds,other:false,today:ds===todayStr,selected:ds===selDay})}
  const rem=(sdow+dim)%7===0?0:7-(sdow+dim)%7
  for(let d=1;d<=rem;d++){const m3=calMonth===11?0:calMonth+1,y3=calMonth===11?calYear+1:calYear;calDays.push({day:d,dateStr:`${y3}-${String(m3+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,other:true})}

  let msSpent=0,msPayout=0
  Object.entries(evtMap).forEach(([d,evts])=>{
    const dt=new Date(d+'T00:00:00')
    if(dt.getFullYear()===calYear&&dt.getMonth()===calMonth)evts.forEach(e=>{if(e.type==='buy')msSpent+=toEUR(e.amount,e.currency,rates);else msPayout+=toEUR(e.amount,e.currency,rates)})
  })

  const events=[]
  firms.forEach(f=>{
    ;(f.accounts||[]).forEach(a=>{
      events.push({date:a.buy_date,type:'spent',amount:toEUR(a.spent,a.currency,rates)})
      if(a.activation_fee>0&&a.activation_date)events.push({date:a.activation_date,type:'spent',amount:toEUR(a.activation_fee,a.currency,rates)})
      ;(a.payouts||[]).forEach(p=>events.push({date:p.date,type:'payout',amount:toEUR(p.amount,a.currency,rates)}))
    })
  })
  events.sort((a,b)=>a.date.localeCompare(b.date))
  const byDate={};events.forEach(e=>{if(!byDate[e.date])byDate[e.date]={spent:0,payout:0};byDate[e.date][e.type]+=e.amount})
  let cs=0,cp=0;const cLabels=[],cSpent=[],cPayout=[],cNet=[]
  Object.keys(byDate).sort().forEach(d=>{cs+=byDate[d].spent;cp+=byDate[d].payout;cLabels.push(d);cSpent.push(+cs.toFixed(2));cPayout.push(+cp.toFixed(2));cNet.push(+(cp-cs).toFixed(2))})
  const byYear={};events.forEach(e=>{const y=e.date.slice(0,4);if(!byYear[y])byYear[y]={spent:0,payout:0};byYear[y][e.type]+=e.amount})
  const yLabels=Object.keys(byYear).sort(),ySpent=yLabels.map(y=>+byYear[y].spent.toFixed(2)),yPayout=yLabels.map(y=>+byYear[y].payout.toFixed(2)),yNet=yLabels.map(y=>+(byYear[y].payout-byYear[y].spent).toFixed(2))
  const byMonth={};events.forEach(e=>{const ym=e.date.slice(0,7);if(!byMonth[ym])byMonth[ym]={spent:0,payout:0};byMonth[ym][e.type]+=e.amount})
  const mSlice=Object.keys(byMonth).sort().slice(-12)
  const mLabels=mSlice.map(ym=>{const p=ym.split('-');return MONTHS_FR[parseInt(p[1])-1]+' '+p[0].slice(2)})
  const mSpent=mSlice.map(ym=>+byMonth[ym].spent.toFixed(2)),mPayout=mSlice.map(ym=>+byMonth[ym].payout.toFixed(2)),mNet=mSlice.map(ym=>+(byMonth[ym].payout-byMonth[ym].spent).toFixed(2))

  const alerts=[]
  firms.forEach(f=>{
    ;(f.accounts||[]).forEach(a=>{
      const tp=totalPayoutsEUR(a),sp=totalSpentForAccount(a)
      if(a.status==='Financé'&&(a.payouts||[]).length===0)alerts.push({icon:'💰',title:`Payout disponible — ${f.name}`,sub:'Compte financé sans payout',type:'success'})
      if(a.status==='Challenge'){const days=Math.floor((new Date()-new Date(a.buy_date+'T00:00:00'))/86400000);if(days>30)alerts.push({icon:'⏰',title:`Challenge depuis ${days} jours — ${f.name}`,sub:'Vérifiez votre progression',type:'warn'})}
      if(tp>sp*2)alerts.push({icon:'🏆',title:`Excellent ROI — ${f.name}`,sub:`${(tp/sp).toFixed(1)}x votre investissement`,type:'success'})
    })
  })
  if(!alerts.length&&firms.length)alerts.push({icon:'✅',title:'Tout est en ordre',sub:'Aucune alerte pour le moment.',type:'ok'})

  const S={
    card:{background:'var(--surface)',border:'0.5px solid var(--border)',borderRadius:'var(--radius-lg)'},
    input:{width:'100%',padding:'9px 11px',fontSize:'13px',border:'0.5px solid var(--border2)',borderRadius:'var(--radius)',background:'var(--surface2)',color:'var(--text)',outline:'none'},
    label:{fontSize:'11px',fontWeight:'600',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:'5px'},
    btnPrimary:{padding:'8px 18px',fontSize:'13px',fontWeight:'600',background:'var(--blue)',color:'#fff',border:'none',borderRadius:'var(--radius)',cursor:'pointer'},
    btnGhost:{padding:'7px 14px',fontSize:'12px',background:'transparent',border:'0.5px solid var(--border2)',color:'var(--text2)',borderRadius:'var(--radius)',cursor:'pointer'},
    badge:(status)=>({display:'inline-block',fontSize:'11px',fontWeight:'600',padding:'3px 9px',borderRadius:'99px',background:status==='Financé'?'var(--green-bg)':status==='Challenge'?'var(--amber-bg)':'var(--red-bg)',color:status==='Financé'?'var(--green-text)':status==='Challenge'?'var(--amber-text)':'var(--red-text)'})
  }

  const navItems=[
    {key:'dashboard',icon:'📊',label:'Tableau de bord',section:'Principal'},
    {key:'analytics',icon:'📈',label:'Analytics',section:'Principal'},
    {key:'journal',icon:'📔',label:'Journal trading',section:'Principal'},
    {key:'rules',icon:'📋',label:'Règles firmes',section:'PropFirm'},
    {key:'alerts',icon:'🔔',label:'Alertes',section:'PropFirm',badge:alerts.filter(a=>a.type!=='ok').length},
    {key:'calendar',icon:'📅',label:'Calendrier Éco.',section:'Live Data'},
    {key:'sync',icon:'🔌',label:'Sync auto (bientôt)',section:'Live Data'},
  ]

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <div style={{height:'2px',background:'linear-gradient(90deg,var(--blue) 0%,transparent 100%)'}} />
      <div className="top-bar" style={{height:'48px',background:'var(--surface)',borderBottom:'0.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',position:'sticky',top:0,zIndex:200}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <button className="nav-burger" aria-label="Menu" onClick={()=>setMobileNavOpen(o=>!o)}>☰</button>
          <Logo size={38} glow="strong" />
          <div style={{fontWeight:'700',fontSize:'15px',letterSpacing:'0.12em'}}>QUANTARA</div>
          <span className="top-bar-brand-sub" style={{fontSize:'11px',color:'var(--text3)',letterSpacing:'0.05em'}}>· TRACK · ANALYZE · GROW</span>
        </div>
        <div className="top-bar-actions" style={{display:'flex',gap:'6px'}}>
          <button onClick={exportCSV} style={{...S.btnGhost,fontSize:'12px',padding:'7px 12px'}}>↓ CSV</button>
          <button onClick={signOut} style={{...S.btnGhost,fontSize:'12px',padding:'7px 12px'}}>Déconnexion</button>
        </div>
      </div>

      <div style={{display:'flex',minHeight:'calc(100vh - 50px)'}}>
        <nav className={'app-nav'+(mobileNavOpen?' open':'')} style={{width:'200px',flexShrink:0,background:'var(--surface)',borderRight:'0.5px solid var(--border)',padding:'16px 0',position:'sticky',top:'48px',height:'calc(100vh - 48px)',overflowY:'auto'}}>
          {['Principal','Live Data','PropFirm'].map(section=>(
            <div key={section}>
              <div className="nav-section-label" style={{padding:'8px 16px',fontSize:'10px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.8px',marginTop:'8px'}}>{section}</div>
              {navItems.filter(i=>i.section===section).map(item=>(
                <button key={item.key} onClick={()=>{setPage(item.key);setMobileNavOpen(false)}} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 16px',width:'100%',border:'none',background:page===item.key?'rgba(45,111,255,0.12)':'transparent',color:page===item.key?'var(--blue)':'var(--text2)',fontSize:'13px',fontWeight:'500',cursor:'pointer',textAlign:'left'}}>
                  <span>{item.icon}</span>{item.label}
                  {item.badge>0&&<span style={{marginLeft:'auto',background:'var(--red)',color:'#fff',fontSize:'10px',fontWeight:'700',padding:'1px 6px',borderRadius:'99px'}}>{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
          <div style={{position:'absolute',bottom:'12px',left:0,right:0,padding:'0 14px'}}>
            <div style={{fontSize:'11px',color:'var(--text3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email}</div>
          </div>
        </nav>
        {mobileNavOpen&&<div className="nav-backdrop" onClick={()=>setMobileNavOpen(false)} />}

        <div style={{flex:1,overflow:'auto'}}>

          {page==='dashboard'&&(
            <div className="page-pad" style={{maxWidth:'1160px',margin:'0 auto',padding:'28px 24px 60px'}}>
              <div className="page-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'28px'}}>
                <div><h1 style={{fontSize:'22px',fontWeight:'600',marginBottom:'4px'}}>Tableau de bord</h1><div style={{fontSize:'12px',color:'var(--text3)'}}>{rateInfo}</div></div>
                <div className="page-header-actions" style={{display:'flex',gap:'8px',alignItems:'center'}}>
                  <div style={{display:'flex',border:'0.5px solid var(--border2)',borderRadius:'99px',overflow:'hidden',background:'var(--surface)'}}>
                    {['native','eur'].map(c=><button key={c} onClick={()=>setCurrencyMode(c)} style={{padding:'6px 14px',fontSize:'12px',border:'none',background:currency===c?'var(--blue)':'transparent',color:currency===c?'#fff':'var(--text2)',cursor:'pointer',fontWeight:'500'}}>{c==='native'?'USD natif':'EUR'}</button>)}
                  </div>
                  <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 Rechercher..." style={{...S.input,width:'160px'}} />
                  <button onClick={()=>{setFirmModal(true);setNewFirmName('')}} style={S.btnPrimary}>+ Ajouter PropFirm</button>
                </div>
              </div>

              <div className="stats-5" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'24px'}}>
                {[
                  {label:'PropFirms',value:`${firms.length} firme${firms.length>1?'s':''} · ${accts.length} compte${accts.length>1?'s':''}`,small:true},
                  {label:'Total dépensé',value:currency==='eur'?fmtE(totalSpentEUR):(totalSpentEUR/rates.USD).toFixed(2)+' $',color:'var(--red)'},
                  {label:'Total payouts',value:currency==='eur'?fmtE(totalPayoutsEUR2):(totalPayoutsEUR2/rates.USD).toFixed(2)+' $',color:'var(--green)'},
                  {label:'Résultat net',value:currency==='eur'?fmtENet(totalNet):(totalNet>=0?'+':'')+(totalNet/rates.USD).toFixed(2)+' $',color:totalNet>=0?'var(--green)':'var(--red)'},
                  {label:'Nb payouts',value:totalPayoutCount},
                ].map((k,i)=>(
                  <div key={i} style={{...S.card,padding:'18px 16px'}}>
                    <div style={{fontSize:'11px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'10px'}}>{k.label}</div>
                    <div style={{fontSize:k.small?'14px':'22px',fontWeight:'600',color:k.color||'var(--text)'}}>{k.value}</div>
                  </div>
                ))}
              </div>

              <div className="firms-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:'16px',marginBottom:'24px'}}>
                {firms.filter(f=>f.name.toLowerCase().includes(searchQ.toLowerCase())).map(firm=>{
                  const ts=firmTotalSpent(firm),tp=firmTotalPayouts(firm),net=tp-ts,roi=ts>0?net/ts*100:0
                  const al=firm.accounts||[]
                  const challengeCount=al.filter(a=>a.status==='Challenge').length
                  const financedCount=al.filter(a=>a.status==='Financé').length
                  const failedCount=al.filter(a=>a.status==='Échoué').length
                  const payoutCount=al.reduce((s,a)=>s+(a.payouts||[]).length,0)
                  const activeAccts=al.filter(a=>a.status!=='Échoué')
                  return(
                    <div key={firm.id} onClick={()=>setFirmDrawer(firm.id)} style={{...S.card,padding:'18px',cursor:'pointer',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--blue)';e.currentTarget.style.transform='translateY(-1px)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.transform='none'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>{getFirmLogo(firm.name,firm.color,36)}<div><div style={{fontSize:'15px',fontWeight:'700'}}>{firm.name}</div><div style={{fontSize:'11px',color:'var(--text3)'}}>{al.length} compte{al.length>1?'s':''} · {payoutCount} payout{payoutCount>1?'s':''}</div></div></div>
                        <div style={{textAlign:'right'}}><div style={{fontSize:'18px',fontWeight:'700',color:net>=0?'var(--green)':'var(--red)'}}>{currency==='eur'?fmtENet(net,0):(net>=0?'+':'')+(net/rates.USD).toFixed(0)+' $'}</div><div style={{fontSize:'11px',color:'var(--text3)'}}>ROI {roi>=0?'+':''}{roi.toFixed(0)}%</div></div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'12px'}}>
                        {[{l:'Dépensé',v:currency==='eur'?fmtE(ts,0):(ts/rates.USD).toFixed(0)+' $',c:'var(--red)'},{l:'Payouts',v:currency==='eur'?fmtE(tp,0):(tp/rates.USD).toFixed(0)+' $',c:'var(--green)'},{l:'Actifs',v:financedCount+challengeCount}].map((s,i)=>(
                          <div key={i} style={{background:'var(--surface3)',borderRadius:'6px',padding:'8px',textAlign:'center'}}><div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.4px',marginBottom:'2px'}}>{s.l}</div><div style={{fontSize:'14px',fontWeight:'600',color:s.c||'var(--text)'}}>{s.v}</div></div>
                        ))}
                      </div>
                      {activeAccts.slice(0,3).map(a=>{
                        const aNet=totalPayoutsEUR(a)-totalSpentForAccount(a)
                        return<div key={a.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 0',borderBottom:'0.5px solid var(--border)',fontSize:'12px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'6px'}}><div style={{width:'6px',height:'6px',borderRadius:'50%',background:STATUS_COLORS[a.status]||'var(--text3)',flexShrink:0}} /><span style={{color:'var(--text2)'}}>{a.buy_date}</span><span style={{...S.badge(a.status),fontSize:'9px',padding:'1px 6px'}}>{a.status}</span></div>
                          <span style={{fontWeight:'600',color:aNet>=0?'var(--green)':'var(--red)'}}>{aNet>=0?'+':''}{aNet.toFixed(0)} €</span>
                        </div>
                      })}
                      {activeAccts.length>3&&<div style={{fontSize:'11px',color:'var(--text3)',padding:'4px 0'}}>+{activeAccts.length-3} autre{activeAccts.length-3>1?'s':''}...</div>}
                      <div style={{display:'flex',gap:'6px',marginTop:'10px',flexWrap:'wrap',alignItems:'center'}}>
                        {challengeCount>0&&<span style={S.badge('Challenge')}>{challengeCount} Challenge{challengeCount>1?'s':''}</span>}
                        {financedCount>0&&<span style={S.badge('Financé')}>{financedCount} Financé{financedCount>1?'s':''}</span>}
                        {failedCount>0&&<span style={S.badge('Échoué')}>{failedCount} Échoué{failedCount>1?'s':''}</span>}
                        <button
                          onClick={(e)=>{e.stopPropagation();setCertsFirm(firm)}}
                          title="Voir / ajouter les diplômes (challenge passed, payouts...)"
                          style={{
                            marginLeft:'auto',fontSize:'11px',padding:'3px 9px',borderRadius:'99px',
                            background:'rgba(45,111,255,0.10)',border:'1px solid rgba(45,111,255,0.30)',
                            color:'var(--blue-light)',cursor:'pointer',fontWeight:'600',
                          }}
                        >🎓 Diplômes</button>
                      </div>
                    </div>
                  )
                })}
                {!firms.length && (
                  <div style={{gridColumn:'1/-1',textAlign:'center',padding:'80px 24px',background:'var(--surface2)',borderRadius:'var(--radius-lg)',border:'1px dashed var(--border2)'}}>
                    <div style={{fontSize:'48px',marginBottom:'16px',opacity:0.6}}>📊</div>
                    <h2 style={{fontSize:'18px',fontWeight:'700',marginBottom:'8px'}}>Aucune PropFirm pour l'instant</h2>
                    <p style={{fontSize:'13px',color:'var(--text3)',marginBottom:'20px',maxWidth:'420px',margin:'0 auto 20px',lineHeight:1.6}}>
                      Ajoute ta première PropFirm (Topstep, Apex, Lucid...) pour commencer à tracker tes comptes,
                      tes drawdowns trailing et tes payouts en temps réel.
                    </p>
                    <div style={{display:'flex',gap:'10px',justifyContent:'center',flexWrap:'wrap'}}>
                      <button onClick={()=>{setFirmModal(true);setNewFirmName('')}} style={S.btnPrimary}>+ Ajouter ma 1ère PropFirm</button>
                      <button onClick={()=>{localStorage.removeItem('quantara_onboarding_dismissed');setShowOnboarding(true)}} style={S.btnGhost}>🎮 Voir avec données démo</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Content grid: Calendar (full width) — sidebar moves below */}
              <div className="grid-1-340" style={{display:'grid',gridTemplateColumns:'1fr',gap:'72px',alignItems:'start'}}>
                {/* Calendar block — pleine largeur */}
                <div>
 <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
                  <div style={{fontSize:'15px',fontWeight:'600'}}>Calendrier des transactions</div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <button onClick={()=>{const d=new Date(calYear,calMonth-1);setCalMonth(d.getMonth());setCalYear(d.getFullYear())}} style={S.btnGhost}>‹</button>
                    <span style={{fontWeight:'600',minWidth:'140px',textAlign:'center'}}>{MONTHS_FULL[calMonth]} {calYear}</span>
                    <button onClick={()=>{const d=new Date(calYear,calMonth+1);setCalMonth(d.getMonth());setCalYear(d.getFullYear())}} style={S.btnGhost}>›</button>
                    <button onClick={()=>{setCalMonth(new Date().getMonth());setCalYear(new Date().getFullYear());setSelDay(null)}} style={S.btnGhost}>Aujourd'hui</button>
                  </div>
                </div>
                <div className="stats-3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'14px'}}>
                  {[{l:'Achats du mois',v:fmtE(msSpent),c:'var(--red)'},{l:'Payouts du mois',v:fmtE(msPayout),c:'var(--green)'},{l:'Net du mois',v:fmtENet(msPayout-msSpent),c:(msPayout-msSpent)>=0?'var(--green)':'var(--red)'}].map((s,i)=>(
                    <div key={i} style={{...S.card,padding:'10px 14px'}}><div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'4px'}}>{s.l}</div><div style={{fontSize:'15px',fontWeight:'600',color:s.c}}>{s.v}</div></div>
                  ))}
                </div>
                <div className="grid-1-280" style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'20px',alignItems:'start'}}>
                  <div style={{...S.card,overflow:'hidden'}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'var(--surface2)',borderBottom:'0.5px solid var(--border)'}}>
                      {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=><div key={d} style={{padding:'12px 0',textAlign:'center',fontSize:'11px',fontWeight:'600',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{d}</div>)}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
                      {calDays.map((day,i)=>{
                        const evts=evtMap[day.dateStr]||[]
                        const buyT=evts.filter(e=>e.type==='buy').reduce((s,e)=>s+toEUR(e.amount,e.currency,rates),0)
                        const payT=evts.filter(e=>e.type==='pay').reduce((s,e)=>s+toEUR(e.amount,e.currency,rates),0)
                        return<div key={i} className="cal-cell" onClick={()=>setSelDay(day.dateStr)} style={{minHeight:'108px',padding:'10px',borderRight:(i+1)%7===0?'none':'0.5px solid var(--border)',borderBottom:'0.5px solid var(--border)',cursor:'pointer',opacity:day.other?0.25:1,background:day.selected?'rgba(45,111,255,0.08)':'transparent',outline:day.selected?'2px solid var(--blue)':'none',outlineOffset:'-2px'}}>
                          <div className="cal-cell-num" style={{fontSize:'13px',fontWeight:'600',width:'26px',height:'26px',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',background:day.today?'var(--blue)':'transparent',color:day.today?'#fff':'var(--text2)',marginBottom:'5px'}}>{day.day}</div>
                          {buyT>0&&<div className="cal-cell-amount" style={{fontSize:'11px',fontWeight:'700',padding:'2px 6px',borderRadius:'4px',background:'var(--red-bg)',color:'var(--red-text)',marginBottom:'3px',display:'inline-block'}}>-{buyT.toFixed(0)} €</div>}
                          {payT>0&&<div className="cal-cell-amount" style={{fontSize:'11px',fontWeight:'700',padding:'2px 6px',borderRadius:'4px',background:'var(--green-bg)',color:'var(--green-text)',display:'inline-block'}}>+{payT.toFixed(0)} €</div>}
                        </div>
                      })}
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div style={{...S.card,padding:'16px'}}>
                      <div style={{fontSize:'13px',fontWeight:'600',marginBottom:'12px'}}>{selDay?new Date(selDay+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}):'Sélectionnez un jour'}</div>
                      {selDay?(evtMap[selDay]||[]).length>0?(evtMap[selDay]||[]).map((e,i)=>(
                        <div key={i} onClick={()=>setFirmDrawer(e.firmId)} style={{padding:'10px 12px',background:'var(--surface2)',borderRadius:'var(--radius)',marginBottom:'8px',cursor:'pointer'}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{fontWeight:'600',fontSize:'13px'}}>{e.firm}</span><span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'99px',background:e.type==='buy'?'var(--red-bg)':'var(--green-bg)',color:e.type==='buy'?'var(--red-text)':'var(--green-text)',fontWeight:'600'}}>{e.label||(e.type==='buy'?'Achat':'Payout')}</span></div>
                          <div style={{fontSize:'12px',color:e.type==='buy'?'var(--red)':'var(--green)',fontWeight:'600'}}>{e.type==='buy'?'-':'+'}{toEUR(e.amount,e.currency,rates).toFixed(2)} €</div>
                        </div>
                      )):<div style={{color:'var(--text3)',fontSize:'12px'}}>Aucune transaction.</div>:<div style={{color:'var(--text3)',fontSize:'12px'}}>Cliquez sur un jour.</div>}
                    </div>
                    <div style={{...S.card,padding:'16px'}}>
                      <div style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px'}}>Transactions récentes</div>
                      {Object.entries(evtMap).flatMap(([d,evts])=>evts.map(e=>({...e,date:d}))).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map((e,i)=>(
                        <div key={i} style={{display:'flex',gap:'8px',padding:'7px 0',borderBottom:'0.5px solid var(--border)'}}>
                          <div style={{width:'6px',height:'6px',borderRadius:'50%',background:e.type==='buy'?'var(--red)':'var(--green)',marginTop:'4px',flexShrink:0}} />
                          <div style={{flex:1}}><div style={{fontSize:'12px',fontWeight:'500'}}>{e.firm}</div><div style={{fontSize:'10px',color:'var(--text3)'}}>{e.date} · {e.type==='buy'?'Achat':'Payout'}</div></div>
                          <div style={{fontSize:'12px',fontWeight:'600',color:e.type==='buy'?'var(--red)':'var(--green)'}}>{e.type==='buy'?'-':'+'}{toEUR(e.amount,e.currency,rates).toFixed(2)} €</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
                </div>

                {/* SIDEBAR (sous le calendrier) : Bar chart + Stats + Par firme — 3 colonnes */}
                <div className="dash-sidebar-row" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',alignItems:'start'}}>
                  {/* Bar chart par firme */}
                  <div style={{...S.card,padding:'18px'}}>
                    <div style={{fontSize:'13px',fontWeight:'500',color:'var(--text2)',marginBottom:'10px'}}>Par firme (EUR)</div>
                    <div style={{display:'flex',gap:'14px',marginBottom:'10px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'11px',color:'var(--text2)'}}><div style={{width:'10px',height:'3px',borderRadius:'2px',background:'#e8504a'}}></div>Dépensé</div>
                      <div style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'11px',color:'var(--text2)'}}><div style={{width:'10px',height:'3px',borderRadius:'2px',background:'#1db87a'}}></div>Payouts</div>
                    </div>
                    <div style={{position:'relative',height:'180px'}}><MiniBarChart firms={firms} firmTotalSpent={firmTotalSpent} firmTotalPayouts={firmTotalPayouts} /></div>
                  </div>

                  {/* Statistiques */}
                  <div style={{...S.card,padding:'18px'}}>
                    <div style={{fontSize:'13px',fontWeight:'500',color:'var(--text2)',marginBottom:'14px'}}>Statistiques</div>
                    {(()=>{
                      const paid=accts.filter(a=>a.status==='Financé').length
                      const total=accts.length
                      const allP=accts.reduce((s,a)=>s.concat(a.payouts||[]),[])
                      const bestP=allP.reduce((max,p)=>{const v=toEUR(p.amount,accts.find(a=>(a.payouts||[]).find(x=>x.id===p.id))?.currency||'USD',rates);return v>max?v:max},0)
                      const activeCount=accts.filter(a=>a.status==='Challenge'||a.status==='Financé').length
                      const roi=totalSpentEUR>0?totalNet/totalSpentEUR*100:null
                      return <>
                        {[
                          ['Taux de réussite', total>0?Math.round(paid/total*100)+'%':'—', paid/total>0.5?'var(--green)':'var(--text)'],
                          ['Meilleur payout', bestP>0?fmtE(bestP):'—', 'var(--green)'],
                          ['Coût moyen challenge', total>0?fmtE(totalSpentEUR/total):'—', 'var(--text)'],
                          ['ROI global', roi!==null?(roi>=0?'+':'')+roi.toFixed(1)+'%':'—', roi>=0?'var(--green)':'var(--red)'],
                          ['Comptes actifs', activeCount, 'var(--text)'],
                        ].map(([label,value,color],i)=>(
                          <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'0.5px solid var(--border)'}}>
                            <span style={{fontSize:'12px',color:'var(--text2)'}}>{label}</span>
                            <span style={{fontSize:'12px',fontWeight:'600',color}}>{value}</span>
                          </div>
                        ))}
                      </>
                    })()}
                  </div>

                  {/* Par firme ranking */}
                  <div style={{...S.card,padding:'18px'}}>
                    <div style={{fontSize:'13px',fontWeight:'500',color:'var(--text2)',marginBottom:'14px'}}>Par firme</div>
                    {firms.slice().sort((a,b)=>(firmTotalPayouts(b)-firmTotalSpent(b))-(firmTotalPayouts(a)-firmTotalSpent(a))).map(f=>{
                      const net=firmTotalPayouts(f)-firmTotalSpent(f)
                      return <div key={f.id} onClick={()=>setFirmDrawer(f.id)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'0.5px solid var(--border)',cursor:'pointer'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          {getFirmLogo(f.name,f.color,22)}
                          <div>
                            <div style={{fontSize:'12px',fontWeight:'600'}}>{f.name}</div>
                            <div style={{fontSize:'10px',color:'var(--text3)'}}>{(f.accounts||[]).length} compte{(f.accounts||[]).length>1?'s':''}</div>
                          </div>
                        </div>
                        <div style={{fontSize:'13px',fontWeight:'600',color:net>=0?'var(--green)':'var(--red)'}}>{net>=0?'+':''}{net.toFixed(0)} €</div>
                      </div>
                    })}
                    {!firms.length&&<div style={{fontSize:'12px',color:'var(--text3)'}}>Aucune donnée</div>}
                  </div>
                </div>
              </div>

          )}

          {page==='analytics'&&(
            <div className="page-pad" style={{maxWidth:'1160px',margin:'0 auto',padding:'28px 24px 60px'}}>
              <h1 style={{fontSize:'22px',fontWeight:'600',marginBottom:'24px'}}>Analytics</h1>
              <div className="stats-4" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'}}>
                {[{l:'Net global',v:fmtENet(totalNet),c:totalNet>=0?'var(--green)':'var(--red)'},{l:'Total dépensé',v:fmtE(totalSpentEUR),c:'var(--red)'},{l:'Total payouts',v:fmtE(totalPayoutsEUR2),c:'var(--green)'},{l:'Payout moyen',v:totalPayoutCount>0?fmtE(totalPayoutsEUR2/totalPayoutCount):'—',c:'var(--green)'}].map((k,i)=>(
                  <div key={i} style={{...S.card,padding:'16px'}}><div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'8px'}}>{k.l}</div><div style={{fontSize:'20px',fontWeight:'600',color:k.c}}>{k.v}</div></div>
                ))}
              </div>
              {!cLabels.length
                ?<div style={{...S.card,padding:'60px',textAlign:'center',color:'var(--text3)'}}>Ajoutez des comptes pour voir les analytics.</div>
                :<AnalyticsCharts cLabels={cLabels} cSpent={cSpent} cPayout={cPayout} cNet={cNet} yLabels={yLabels} ySpent={ySpent} yPayout={yPayout} yNet={yNet} mLabels={mLabels} mSpent={mSpent} mPayout={mPayout} mNet={mNet} />
              }
            </div>
          )}

          {page==='rules'&&(
            <PropfirmComparator />
          )}

          {page==='alerts'&&(
            <div className="page-pad" style={{maxWidth:'1160px',margin:'0 auto',padding:'28px 24px 60px'}}>
              <h1 style={{fontSize:'22px',fontWeight:'600',marginBottom:'24px'}}>Alertes</h1>
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {alerts.map((alert,i)=>(
                  <div key={i} style={{...S.card,padding:'14px 18px',display:'flex',alignItems:'center',gap:'14px',background:alert.type==='success'?'var(--green-bg)':alert.type==='warn'?'var(--amber-bg)':'var(--surface)',borderColor:alert.type==='success'?'var(--green)':alert.type==='warn'?'var(--amber-text)':'rgba(255,255,255,0.07)'}}>
                    <div style={{fontSize:'22px'}}>{alert.icon}</div>
                    <div><div style={{fontSize:'13px',fontWeight:'600'}}>{alert.title}</div><div style={{fontSize:'12px',color:'var(--text2)'}}>{alert.sub}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {page==='journal'&&(
            <JournalPage firms={firms} user={user} getFirmLogo={getFirmLogo} showToast={showToast} onReload={loadFirms} />
          )}

          {page==='calendar'&&(
            <CalendarPage lang={calLang} onLangChange={setCalLang} />
          )}

          {page==='sync'&&(
            <div className="page-pad" style={{maxWidth:'860px',margin:'0 auto',padding:'28px 24px 60px'}}>
              <h1 style={{fontSize:'22px',fontWeight:'600',marginBottom:'4px'}}>Synchronisation auto</h1>
              <div style={{fontSize:'12px',color:'var(--text3)',marginBottom:'24px'}}>Import automatique des trades depuis vos plateformes</div>

              <div style={{...S.card,padding:'48px 28px',textAlign:'center',marginBottom:'20px',background:'linear-gradient(180deg, rgba(45,111,255,0.04), transparent)'}}>
                <div style={{fontSize:'56px',marginBottom:'14px'}}>🚧</div>
                <div style={{fontSize:'20px',fontWeight:'700',marginBottom:'8px'}}>Bientôt disponible</div>
                <div style={{fontSize:'13px',color:'var(--text2)',maxWidth:'520px',margin:'0 auto',lineHeight:1.5}}>
                  La synchronisation automatique de vos trades via <strong>ProjectX Gateway</strong> et <strong>Rithmic</strong> est en cours d'intégration.
                  En attendant, utilisez le <strong>Journal trading</strong> pour saisir vos trades manuellement.
                </div>
                <button onClick={()=>setPage('journal')} style={{...S.btnPrimary,marginTop:'24px'}}>📔 Aller au journal manuel</button>
              </div>

              <div className="stats-3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
                <div style={{...S.card,padding:'18px'}}>
                  <div style={{fontSize:'24px',marginBottom:'8px'}}>🔌</div>
                  <div style={{fontSize:'13px',fontWeight:'600',marginBottom:'4px'}}>ProjectX Gateway</div>
                  <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'10px'}}>Topstep, Tradeify, TPT, MFF, TradeDay, Uprofit</div>
                  <span style={{fontSize:'10px',padding:'3px 10px',borderRadius:'99px',background:'var(--amber-bg)',color:'var(--amber-text)',fontWeight:'600'}}>EN ATTENTE D'API</span>
                </div>
                <div style={{...S.card,padding:'18px'}}>
                  <div style={{fontSize:'24px',marginBottom:'8px'}}>📡</div>
                  <div style={{fontSize:'13px',fontWeight:'600',marginBottom:'4px'}}>Rithmic</div>
                  <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'10px'}}>Apex, Bulenox, Lucid, Earn2Trade, et autres</div>
                  <span style={{fontSize:'10px',padding:'3px 10px',borderRadius:'99px',background:'var(--amber-bg)',color:'var(--amber-text)',fontWeight:'600'}}>EN ATTENTE D'API</span>
                </div>
                <div style={{...S.card,padding:'18px'}}>
                  <div style={{fontSize:'24px',marginBottom:'8px'}}>📁</div>
                  <div style={{fontSize:'13px',fontWeight:'600',marginBottom:'4px'}}>Import CSV</div>
                  <div style={{fontSize:'11px',color:'var(--text3)',marginBottom:'10px'}}>Charger un export NinjaTrader / Tradovate</div>
                  <span style={{fontSize:'10px',padding:'3px 10px',borderRadius:'99px',background:'var(--surface3)',color:'var(--text2)',fontWeight:'600'}}>PROCHAINEMENT</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {firmModal&&<div onClick={()=>setFirmModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'12px'}}><div className="modal" onClick={e=>e.stopPropagation()} style={{...S.card,padding:'28px',width:'400px',maxWidth:'100%',boxShadow:'0 24px 64px rgba(0,0,0,0.5)'}}><h3 style={{fontSize:'17px',fontWeight:'600',marginBottom:'20px'}}>Ajouter une PropFirm</h3><div style={{marginBottom:'14px'}}><label style={S.label}>Nom</label><input value={newFirmName} onChange={e=>setNewFirmName(e.target.value)} placeholder="Tape le nom ou clique une suggestion ci-dessous" style={S.input} onKeyDown={e=>e.key==='Enter'&&createFirm()} autoFocus /></div><div style={{marginBottom:'20px'}}><div style={{...S.label,marginBottom:'8px'}}>Suggestions</div><div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>{FIRM_SUGGESTIONS.map(s=>(<button type="button" key={s} onClick={()=>setNewFirmName(s)} style={{padding:'6px 12px',fontSize:'12px',cursor:'pointer',borderRadius:'99px',border:'0.5px solid var(--border2)',fontFamily:'inherit',fontWeight:'500',background:newFirmName===s?'var(--blue)':'var(--surface2)',color:newFirmName===s?'#fff':'var(--text2)'}}>{s}</button>))}</div></div><div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}><button onClick={()=>setFirmModal(false)} style={S.btnGhost}>Annuler</button><button onClick={createFirm} style={S.btnPrimary}>Créer &amp; Ajouter un compte</button></div></div></div>}

      {acctModal&&<div onClick={()=>setAcctModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'12px',overflowY:'auto'}}><div className="modal" onClick={e=>e.stopPropagation()} style={{...S.card,padding:'28px',width:'440px',maxWidth:'100%',boxShadow:'0 24px 64px rgba(0,0,0,0.5)'}}><h3 style={{fontSize:'17px',fontWeight:'600',marginBottom:'20px'}}>{acctModal.acct?'Modifier le compte':`Nouveau compte — ${firms.find(f=>f.id===acctModal.firmId)?.name}`}</h3><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}><div><label style={S.label}>Date d'achat</label><input type="date" value={acctForm.buyDate} onChange={e=>setAcctForm(p=>({...p,buyDate:e.target.value}))} style={S.input} /></div><div><label style={S.label}>Devise</label><select value={acctForm.currency} onChange={e=>setAcctForm(p=>({...p,currency:e.target.value}))} style={S.input}><option>USD</option><option>EUR</option><option>GBP</option><option>CHF</option></select></div><div><label style={S.label}>Plan / Taille du compte</label><select value={acctForm.planSize} onChange={e=>{const newPlan=e.target.value;const firmName=firms.find(f=>f.id===acctModal.firmId)?.name;const tg=defaultPayoutTarget(firmName,newPlan);const md=defaultMinTradingDays(firmName,newPlan);const pr=defaultChallengePrice(firmName,newPlan);const mdp=defaultMinDailyProfit(firmName,newPlan);setAcctForm(p=>({...p,planSize:newPlan,payoutTarget:tg!==null?String(tg):p.payoutTarget,minTradingDays:md!==null?String(md):p.minTradingDays,spent:pr!==null?String(pr):p.spent,minDailyProfit:mdp!==null?String(mdp):p.minDailyProfit}))}} style={S.input}>{plansForFirm(firms.find(f=>f.id===acctModal.firmId)?.name).map(p=><option key={p} value={p}>{p.toUpperCase()}</option>)}</select></div><div><label style={S.label}>Montant dépensé (challenge)</label><input type="number" value={acctForm.spent} onChange={e=>setAcctForm(p=>({...p,spent:e.target.value}))} placeholder="0.00" style={S.input} /></div><div style={{gridColumn:'1/-1'}}><label style={S.label}>Statut</label><select value={acctForm.status} onChange={e=>setAcctForm(p=>({...p,status:e.target.value}))} style={S.input}><option>Challenge</option><option>Financé</option><option>Échoué</option></select></div>{acctForm.status==='Financé'&&<div style={{gridColumn:'1/-1',background:'rgba(29,184,122,0.07)',border:'0.5px solid var(--green)',borderRadius:'var(--radius)',padding:'12px'}}><div style={{fontSize:'11px',fontWeight:'700',color:'var(--green-text)',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>✅ Compte Financé</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}><div><label style={S.label}>Date d'activation</label><input type="date" value={acctForm.activationDate} onChange={e=>setAcctForm(p=>({...p,activationDate:e.target.value}))} style={{...S.input,background:'var(--surface3)'}} /></div><div><label style={S.label}>Frais d'activation</label><input type="number" value={acctForm.activationFee} onChange={e=>setAcctForm(p=>({...p,activationFee:e.target.value}))} placeholder="145.00" style={{...S.input,background:'var(--surface3)'}} /></div></div></div>}<div style={{gridColumn:'1/-1'}}><label style={S.label}>Nom du compte (optionnel)</label><input value={acctForm.name} onChange={e=>setAcctForm(p=>({...p,name:e.target.value}))} placeholder="ex : Lucid principal, Topstep #1, NQ scalp..." style={S.input} /></div><div style={{gridColumn:'1/-1'}}><label style={S.label}>Type de drawdown<TooltipIcon text="3 types : Static = ligne fixe (balance initial − DD max). End of Day (EOD) = trailing basé sur la balance de FIN DE JOURNÉE (les pics intraday ne lockent pas le DD). Trailing intraday = trailing temps réel, le moindre pic intraday update le DD. La plupart des firmes utilisent EOD ou Trailing." maxWidth={360} /></label><select value={acctForm.ddType} onChange={e=>setAcctForm(p=>({...p,ddType:e.target.value}))} style={S.input}><option value="static">Static (ligne fixe : balance initial − DD max)</option><option value="eod">End of Day (trailing en fin de journée, ignore les pics intraday)</option><option value="trailing">Trailing intraday (suit le peak temps réel)</option></select></div><div><label style={S.label}>Objectif payout ($)</label><input type="number" step="0.01" value={acctForm.payoutTarget} onChange={e=>setAcctForm(p=>({...p,payoutTarget:e.target.value}))} placeholder="ex : 53000 (= 50k + 3k profit)" style={S.input} /></div><div><label style={S.label}>Jours de trading min</label><input type="number" min="0" value={acctForm.minTradingDays} onChange={e=>setAcctForm(p=>({...p,minTradingDays:e.target.value}))} placeholder="ex : 10" style={S.input} /></div><div><label style={S.label}>Profit min / jour valide ($)<TooltipIcon text="Profit minimum sur 1 journée pour qu'elle compte comme jour validé dans le décompte des jours de trading min. Ex Lucid : 150$ par jour." /></label><input type="number" min="0" step="1" value={acctForm.minDailyProfit} onChange={e=>setAcctForm(p=>({...p,minDailyProfit:e.target.value}))} placeholder="ex : 150" style={S.input} /></div><div style={{gridColumn:'1/-1'}}><label style={S.label}>Notes</label><input value={acctForm.notes} onChange={e=>setAcctForm(p=>({...p,notes:e.target.value}))} placeholder="Commentaire..." style={S.input} /></div></div><div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'20px'}}><button onClick={()=>setAcctModal(null)} style={S.btnGhost}>Annuler</button><button onClick={saveAccount} style={S.btnPrimary}>Enregistrer</button></div></div></div>}

      {firmDrawer&&currentFirm&&<div onClick={()=>setFirmDrawer(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:400,display:'flex',alignItems:'flex-start',justifyContent:'flex-end'}}><div className="drawer" onClick={e=>e.stopPropagation()} style={{width:'520px',maxWidth:'95vw',height:'100vh',background:'var(--surface)',borderLeft:'0.5px solid var(--border2)',overflowY:'auto',padding:'28px'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}><div style={{display:'flex',alignItems:'center',gap:'10px'}}>{getFirmLogo(currentFirm.name,currentFirm.color,32)}<div style={{fontSize:'18px',fontWeight:'600'}}>{currentFirm.name}</div></div><div style={{display:'flex',gap:'8px'}}><button onClick={()=>renameFirm(currentFirm.id)} style={S.btnGhost}>✏ Renommer</button><button onClick={()=>setFirmDrawer(null)} style={S.btnGhost}>✕</button></div></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'20px'}}>{[['Total comptes',(currentFirm.accounts||[]).length],['Total dépensé',<span style={{color:'var(--red)'}}>{ fmtE(firmTotalSpent(currentFirm))}</span>],['Total payouts',<span style={{color:'var(--green)'}}>{fmtE(firmTotalPayouts(currentFirm))}</span>],['Net',<span style={{color:(firmTotalPayouts(currentFirm)-firmTotalSpent(currentFirm))>=0?'var(--green)':'var(--red)'}}>{fmtENet(firmTotalPayouts(currentFirm)-firmTotalSpent(currentFirm))}</span>]].map(([l,v],i)=>(<div key={i} style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:'12px 14px'}}><div style={{fontSize:'11px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'5px'}}>{l}</div><div style={{fontSize:'16px',fontWeight:'600'}}>{v}</div></div>))}</div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}><div style={{fontSize:'13px',fontWeight:'600',color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Comptes ({(currentFirm.accounts||[]).length})</div><button onClick={()=>{setAcctModal({firmId:currentFirm.id});(()=>{const fn=firms.find(f=>f.id===(acctModal?.firmId||currentFirm?.id))?.name;const tg=defaultPayoutTarget(fn,'50k');const md=defaultMinTradingDays(fn,'50k');const pr=defaultChallengePrice(fn,'50k');const mdp=defaultMinDailyProfit(fn,'50k');setAcctForm({buyDate:new Date().toISOString().slice(0,10),currency:'USD',spent:pr!==null?String(pr):'',activationFee:'',activationDate:'',status:'Challenge',notes:'',planSize:'50k',name:'',ddType:defaultDdType(fn),payoutTarget:tg!==null?String(tg):'',minTradingDays:md!==null?String(md):'',minDailyProfit:mdp!==null?String(mdp):''})})()}} style={S.btnPrimary}>+ Ajouter compte</button></div>{(currentFirm.accounts||[]).slice().sort((a,b)=>{const o={'Financé':0,'Challenge':1,'Échoué':2};return (o[a.status]??3)-(o[b.status]??3)}).map(a=>{const tp=totalPayoutsEUR(a),net=tp-totalSpentForAccount(a);const isFailed=a.status==='Échoué';return<div key={a.id} onClick={()=>setAcctDrawer({firmId:currentFirm.id,acctId:a.id})} style={{padding:'12px 14px',background:'var(--surface2)',borderRadius:'var(--radius)',marginBottom:'8px',cursor:'pointer',opacity:isFailed?0.55:1,filter:isFailed?'grayscale(0.4)':'none',transition:'opacity 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background='var(--surface3)';e.currentTarget.style.opacity=1}} onMouseLeave={e=>{e.currentTarget.style.background='var(--surface2)';e.currentTarget.style.opacity=isFailed?0.55:1}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}><div style={{display:'flex',alignItems:'center',gap:'8px',flex:1,minWidth:0}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:STATUS_COLORS[a.status],flexShrink:0}} /><span style={{fontWeight:'600',fontSize:'13px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{accountLabel(a)}</span><button onClick={(e)=>{e.stopPropagation();renameAccount(a.id, a.name, a.buy_date)}} title="Renommer" style={{background:'transparent',border:'none',color:'var(--text3)',cursor:'pointer',padding:'2px 6px',fontSize:'13px',flexShrink:0}}>✏</button></div><span style={S.badge(a.status)}>{a.status}</span></div><div style={{display:'flex',justifyContent:'space-between',fontSize:'12px'}}><span style={{color:'var(--green)'}}>Payouts : {fmtE(tp)}</span><span style={{color:net>=0?'var(--green)':'var(--red)'}}>Net : {fmtENet(net)}</span><span style={{color:'var(--text3)'}}>{(a.payouts||[]).length} payout{(a.payouts||[]).length>1?'s':''}</span></div></div>})}<div style={{marginTop:'28px',paddingTop:'20px',borderTop:'0.5px solid var(--border)'}}><button onClick={()=>deleteFirm(currentFirm.id)} style={{background:'var(--red-bg)',color:'var(--red-text)',border:'0.5px solid var(--red-bg)',padding:'8px 16px',borderRadius:'var(--radius)',fontSize:'13px',cursor:'pointer',fontWeight:'500'}}>Supprimer cette firme</button></div></div></div>}

      {acctDrawer&&currentAcct&&<div onClick={()=>setAcctDrawer(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:450,display:'flex',alignItems:'flex-start',justifyContent:'flex-end'}}><div className="drawer" onClick={e=>e.stopPropagation()} style={{width:'500px',maxWidth:'95vw',height:'100vh',background:'var(--surface)',borderLeft:'0.5px solid var(--border2)',overflowY:'auto',padding:'28px'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}><div style={{fontSize:'17px',fontWeight:'600'}}>{currentAcctFirm?.name} — {accountLabel(currentAcct)}</div><div style={{display:'flex',gap:'8px'}}><button onClick={()=>{setAcctModal({firmId:acctDrawer.firmId,acct:currentAcct});setAcctForm({buyDate:currentAcct.buy_date,currency:currentAcct.currency,spent:currentAcct.spent,activationFee:currentAcct.activation_fee||'',activationDate:currentAcct.activation_date||'',status:currentAcct.status,notes:currentAcct.notes||'',planSize:currentAcct.plan_size||'50k',name:currentAcct.name||'',ddType:currentAcct.dd_type||defaultDdType(currentAcctFirm?.name),payoutTarget:currentAcct.payout_target!=null?String(currentAcct.payout_target):'',minTradingDays:currentAcct.min_trading_days!=null?String(currentAcct.min_trading_days):'',minDailyProfit:currentAcct.min_daily_profit!=null?String(currentAcct.min_daily_profit):''})}} style={S.btnGhost}>✏ Modifier</button><button onClick={()=>setAcctDrawer(null)} style={S.btnGhost}>✕</button></div></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'20px'}}>{[['Firme',currentAcctFirm?.name],['Date achat',currentAcct.buy_date],['Challenge',<span style={{color:'var(--red)'}}>{currentAcct.spent} {currentAcct.currency}</span>],...(currentAcct.activation_fee>0?[['Date activation',currentAcct.activation_date||'—'],['Frais activation',<span style={{color:'var(--red)'}}>{currentAcct.activation_fee} {currentAcct.currency}</span>]]:[]),['Total dépensé',<span style={{color:'var(--red)'}}>{fmtE(totalSpentForAccount(currentAcct))}</span>],['Net',<span style={{color:(totalPayoutsEUR(currentAcct)-totalSpentForAccount(currentAcct))>=0?'var(--green)':'var(--red)'}}>{fmtENet(totalPayoutsEUR(currentAcct)-totalSpentForAccount(currentAcct))}</span>],['Statut',<span style={S.badge(currentAcct.status)}>{currentAcct.status}</span>]].map(([l,v],i)=>(<div key={i} style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:'12px 14px'}}><div style={{fontSize:'11px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'5px'}}>{l}</div><div style={{fontSize:'15px',fontWeight:'600'}}>{v}</div></div>))}</div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}><div style={{fontSize:'13px',fontWeight:'600',color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Payouts reçus</div><button onClick={()=>{setPayoutForm(true);setPayoutFD({date:new Date().toISOString().slice(0,10),amount:'',note:''})}} style={S.btnPrimary}>+ Ajouter payout</button></div>{payoutForm&&<div style={{background:'var(--surface3)',borderRadius:'var(--radius)',padding:'14px',marginBottom:'14px'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}><div><div style={S.label}>Date</div><input type="date" value={payoutFD.date} onChange={e=>setPayoutFD(p=>({...p,date:e.target.value}))} style={{...S.input,background:'var(--surface2)'}} /></div><div><div style={S.label}>Montant net reçu</div><input type="number" value={payoutFD.amount} onChange={e=>setPayoutFD(p=>({...p,amount:e.target.value}))} placeholder="0.00" style={{...S.input,background:'var(--surface2)'}} /></div></div>{(()=>{const split=defaultProfitSplit(currentAcctFirm?.name,currentAcct?.plan_size);const net=parseFloat(payoutFD.amount)||0;if(net<=0||!split)return null;const gross=net/(split/100);const firmCut=gross-net;return(<div style={{marginBottom:'10px',padding:'10px 12px',background:'rgba(45,111,255,0.08)',border:'0.5px solid rgba(45,111,255,0.3)',borderRadius:'var(--radius)',fontSize:'12px'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{color:'var(--text2)'}}>Profit split {split}/{100-split}</span><span style={{color:'var(--text3)',fontSize:'10px'}}>{currentAcctFirm?.name}</span></div><div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',fontWeight:'600'}}><span style={{color:'var(--blue-light)'}}>📉 Brut déduit du compte : {gross.toFixed(2)} {currentAcct?.currency||'$'}</span><span style={{color:'var(--text3)',fontSize:'11px'}}>Part firme : {firmCut.toFixed(2)}</span></div></div>)})()}<div style={{marginBottom:'10px'}}><div style={S.label}>Note</div><input value={payoutFD.note} onChange={e=>setPayoutFD(p=>({...p,note:e.target.value}))} placeholder="ex: 1er payout..." style={{...S.input,background:'var(--surface2)'}} /></div><div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}><button onClick={()=>setPayoutForm(false)} style={S.btnGhost}>Annuler</button><button onClick={savePayout} style={S.btnPrimary}>OK</button></div></div>}{(currentAcct.payouts||[]).length>0&&<div style={{marginBottom:'14px',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',background:'var(--surface3)',borderRadius:'var(--radius)'}}><span style={{fontSize:'12px',color:'var(--text2)'}}>Total payouts</span><span style={{fontSize:'16px',fontWeight:'600',color:'var(--green)'}}>{fmtE(totalPayoutsEUR(currentAcct))}</span></div>}{(currentAcct.payouts||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)).map(p=>(<div key={p.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 14px',background:'var(--surface2)',borderRadius:'var(--radius)',marginBottom:'8px'}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--green)',flexShrink:0}} /><div style={{flex:1}}><div style={{fontWeight:'500',fontSize:'13px'}}>Payout — {p.date}</div>{p.note&&<div style={{fontSize:'11px',color:'var(--text3)'}}>{p.note}</div>}</div><div style={{fontSize:'15px',fontWeight:'600',color:'var(--green)'}}>+{fmtE(toEUR(p.amount,currentAcct.currency,rates))}</div><button onClick={()=>deletePayout(p.id)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:'2px 6px',fontSize:'14px'}}>✕</button></div>))}{!(currentAcct.payouts||[]).length&&!payoutForm&&<div style={{color:'var(--text3)',fontSize:'13px',padding:'12px 0'}}>Aucun payout enregistré.</div>}<div style={{marginTop:'28px',paddingTop:'20px',borderTop:'0.5px solid var(--border)'}}><button onClick={()=>deleteAccount(currentAcct.id)} style={{background:'var(--red-bg)',color:'var(--red-text)',border:'0.5px solid var(--red-bg)',padding:'8px 16px',borderRadius:'var(--radius)',fontSize:'13px',cursor:'pointer',fontWeight:'500'}}>Supprimer ce compte</button></div></div></div>}

      {certsFirm && (
        <CertificatesModal
          firm={certsFirm}
          user={user}
          onClose={()=>setCertsFirm(null)}
          showToast={showToast}
          getFirmLogo={getFirmLogo}
        />
      )}

      {/* Modal d'onboarding pour nouveaux users (0 firmes + pas dismissed) */}
      {showOnboarding && user && (
        <OnboardingModal
          user={user}
          showToast={showToast}
          onComplete={()=>setShowOnboarding(false)}
          onAddFirm={()=>{setFirmModal(true);setNewFirmName('')}}
        />
      )}

      {toast&&<div className="toast" style={{position:'fixed',bottom:'24px',right:'24px',background:'var(--surface3)',color:'var(--text)',border:'0.5px solid var(--border2)',padding:'10px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:'500',zIndex:999,boxShadow:'0 8px 24px rgba(0,0,0,0.3)'}}>{toast}</div>}
    </div>
  )
}
