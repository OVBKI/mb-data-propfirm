'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AuthPage from '../../components/AuthPage'
import { PROPFIRM_RULES, FIRM_COLORS, MONTHS_FR, MONTHS_FULL, FIRM_SUGGESTIONS, STATUS_COLORS, PX_FIRMS, plansForFirm, accountLabel, defaultDdType, defaultPayoutTarget, defaultMinTradingDays, defaultChallengePrice, defaultMinDailyProfit, defaultProfitSplit as defaultProfitSplitFromRules } from '../../lib/constants'

// Wrapper qui retourne uniquement les valeurs autorisées par le dropdown : 100, 90, 80, 70
function suggestProfitSplit(firmName, plan){
  const raw = defaultProfitSplitFromRules(firmName, plan)
  if(!raw) return 90
  // Snap vers la valeur autorisée la plus proche
  if(raw >= 95) return 100
  if(raw >= 85) return 90
  if(raw >= 75) return 80
  return 70
}
import CalendarPage from '../../components/CalendarPage'
import JournalPage from '../../components/JournalPage'
import Logo from '../../components/Logo'
import CertificatesModal from '../../components/CertificatesModal'
import OnboardingModal from '../../components/OnboardingModal'
import Skeleton from '../../components/Skeleton'
import Tooltip, { TooltipIcon } from '../../components/Tooltip'
import PropfirmComparator from '../../components/PropfirmComparator'
import AnnouncementBanner from '../../components/AnnouncementBanner'
import Tutorial from '../../components/Tutorial'
import PushNotificationToggle from '../../components/PushNotificationToggle'
import { FIRM_LOGOS, getFirmLogo } from '../../lib/firmLogos'


function toEUR(amount, cur, rates) { return amount*(rates[cur]||1) }
function fmtE(val, dec=2) { return val.toFixed(dec)+' €' }
function fmtENet(val, dec=2) { return (val>=0?'+':'')+val.toFixed(dec)+' €' }

// Génère N noms auto-numérotés pour création en bulk de comptes (achats multiples).
// - baseName vide → renvoie N strings vides (les comptes prendront leur nom auto "Compte du DATE")
// - baseName = "Test"     → ["Test-001", "Test-002", ..., "Test-NNN"]
// - baseName = "Test-005" → ["Test-005", "Test-006", ..., "Test-005+N-1"] (incrémente à partir du suffixe)
// - baseName = "Pro-99"   → ["Pro-99", "Pro-100", ...] (garde le padding minimal)
function generateAccountNames(baseName, quantity) {
  const qty = Math.max(1, parseInt(quantity, 10) || 1)
  const trimmed = (baseName || '').trim()
  if (!trimmed) return Array(qty).fill('')
  // Détecte un suffixe -NNN à la fin du nom de base
  const match = trimmed.match(/^(.*-)(\d+)$/)
  if (match) {
    const prefix = match[1]
    const startNum = parseInt(match[2], 10)
    const padWidth = match[2].length
    return Array.from({ length: qty }, (_, i) =>
      prefix + String(startNum + i).padStart(padWidth, '0')
    )
  }
  // Sinon : ajoute -001, -002, etc.
  return Array.from({ length: qty }, (_, i) =>
    `${trimmed}-${String(i + 1).padStart(3, '0')}`
  )
}

// Messages affichés aléatoirement dans le modal "Compte échoué" — pour relativiser le blow
const FAIL_MESSAGES = [
  "📚 Chaque échec est une leçon qu'aucun cours ni mentor ne pourrait t'enseigner. Encaisse, analyse, recommence.",
  "🌱 Les meilleurs traders ont blown plus de comptes que tu ne penses. Tu rejoins un club très fréquenté.",
  "💪 Un blow ne veut pas dire défaite — c'est juste un rappel que le marché ne te doit rien.",
  "🎯 Garde le focus sur ton edge, pas sur ton P&L. La discipline finit toujours par payer.",
  "🧠 Un trader qui échoue et apprend bat 10 traders qui gagnent par chance. Ne lâche pas.",
  "🚀 Recommence avec un meilleur plan, une meilleure taille de position, et un meilleur état d'esprit.",
  "📖 Ouvre ton journal, identifie LE pattern qui t'a coûté ce compte. Une chose à la fois.",
  "⚡ Le marché paiera ceux qui restent debout après être tombés. Lève-toi.",
  "🎓 Les meilleures décisions naissent souvent après les pires erreurs. Profite du recul.",
  "🌊 Une mauvaise journée ne définit pas une carrière. Recharge, replan, reviens.",
  "🔥 La cendre est le meilleur engrais. Reconstruis avec plus de patience cette fois.",
  "⏳ Pas de pression. Re-test ta stratégie en sim avant de retenter le challenge.",
  "🏔️ Le sommet n'a jamais été atteint en ligne droite. Réajuste ta route.",
  "💎 La pression du challenge a peut-être révélé un blind spot précieux. C'est de l'or pour la suite.",
  "🎪 Parfois le marché te fait passer pour un clown. Ça arrive à tout le monde. Demain est un autre jour.",
  "♟️ Les échecs ne sont pas l'opposé du succès, ils en sont une étape obligatoire.",
  "🛠️ Un trader pro perd. Un trader pro PERSISTE. C'est la seule vraie différence.",
  "🌅 Tu as encaissé. Maintenant, repos. Demain tu reviens plus fort.",
  "💭 « Je n'ai pas échoué. J'ai juste trouvé 10 000 façons qui ne marchent pas. » — Edison (presque).",
  "🎬 Chaque grand trader a son histoire de comeback. C'est peut-être ton chapitre 1.",
  "🪞 Le marché est le miroir le plus honnête qui soit. Ce qu'il te montre aujourd'hui, transforme-le en force.",
  "🧘 Respire. Ce n'est ni la fin du trading, ni la fin du monde. Juste une page qui se tourne.",
]

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
  const [showTutorial,setShowTutorial]=useState(false) // tutoriel guidé spotlight
  const [tradesCount,setTradesCount]=useState(0) // total trades user, pour détecter l'ajout dans le tutoriel
  const [acctDrawer,setAcctDrawer]=useState(null)
  const [payoutForm,setPayoutForm]=useState(false)
  const [newFirmName,setNewFirmName]=useState('')
  const [acctForm,setAcctForm]=useState({buyDate:'',currency:'USD',spent:'',activationFee:'',activationDate:'',status:'Challenge',notes:'',planSize:'50k',name:'',ddType:'static',payoutTarget:'',minTradingDays:'',minDailyProfit:'',profitSplit:'90',paymentMode:'monthly',quantity:'1'})
  const [payoutFD,setPayoutFD]=useState({date:'',amount:'',note:''})
  // Modal "🚀 Passer en Financé" — célébration + saisie des règles funded en une étape
  const [promoteModal,setPromoteModal]=useState(null) // {firmId, acctId} ou null
  const [promoteForm,setPromoteForm]=useState({activationDate:'',activationFee:'',payoutTarget:'',minTradingDays:'',minDailyProfit:'',profitSplit:'90',newName:''})
  // Modal "💔 Compte échoué" — confirmation + message de motivation aléatoire
  const [failModal,setFailModal]=useState(null) // {firmId, acctId, message}
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
    // ⚠ Filtre explicite par user_id sur toutes les queries.
    // Les RLS admin (lecture all) override le filtrage RLS classique → sans ce filtre,
    // un admin verrait TOUTES les firmes/comptes de TOUS les users sur son /app.
    if(!user) return
    const {data:fd}=await supabase.from('firms').select('*').eq('user_id',user.id).order('created_at')
    if(!fd)return
    let {data:ad}=await supabase.from('accounts').select('*').eq('user_id',user.id).order('buy_date')

    // === Auto-billing mensualités ===
    // Pour chaque compte Challenge en mode 'monthly' : calcule combien de mois se sont
    // écoulés depuis buy_date et bump months_count si nécessaire. Stops dès que statut=Financé.
    // Mois 1 = jours 0-29, Mois 2 = jours 30-59, etc. (1 mois = 30 jours pour simplifier)
    let billedAny=false
    for(const a of (ad||[])){
      if(a.status!=='Challenge') continue
      if(a.payment_mode!=='monthly') continue
      if(!a.buy_date) continue
      const buyDate=new Date(a.buy_date)
      const now=new Date()
      const daysSince=Math.floor((now-buyDate)/(1000*60*60*24))
      const expectedMonths=Math.max(1,Math.floor(daysSince/30)+1)
      const currentMonths=a.months_count||1
      if(expectedMonths>currentMonths){
        await supabase.from('accounts').update({months_count:expectedMonths,last_bill_check_at:now.toISOString()}).eq('id',a.id)
        billedAny=true
      }
    }
    // Refetch si des mensualités ont été appliquées
    if(billedAny){
      const refetch=await supabase.from('accounts').select('*').eq('user_id',user.id).order('buy_date')
      if(refetch.data) ad=refetch.data
    }

    const {data:pd}=await supabase.from('payouts').select('*').eq('user_id',user.id).order('date')
    setFirms(fd.map((f,i)=>({...f,color:f.color||FIRM_COLORS[i%FIRM_COLORS.length],accounts:(ad||[]).filter(a=>a.firm_id===f.id).map(a=>({...a,payouts:(pd||[]).filter(p=>p.account_id===a.id)}))})))
    // Count des trades de l'user (pour le tutoriel interactif + détection ajout de trade)
    try {
      const {count:tc}=await supabase.from('journal_entries').select('*',{count:'exact',head:true}).eq('user_id',user.id)
      setTradesCount(tc||0)
    } catch {}
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
    {const tg=defaultPayoutTarget(data.name,'50k');const md=defaultMinTradingDays(data.name,'50k');const pr=defaultChallengePrice(data.name,'50k');const mdp=defaultMinDailyProfit(data.name,'50k');const ps=suggestProfitSplit(data.name,'50k');setAcctForm({buyDate:new Date().toISOString().slice(0,10),currency:'USD',spent:pr!==null?String(pr):'',activationFee:'',activationDate:'',status:'Challenge',notes:'',planSize:'50k',name:'',ddType:defaultDdType(data.name),payoutTarget:tg!==null?String(tg):'',minTradingDays:md!==null?String(md):'',minDailyProfit:mdp!==null?String(mdp):'',profitSplit:String(ps),paymentMode:'monthly',quantity:'1'})}
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
    // En mode 'onetime' : pas de frais d'activation par définition → force à 0
    const isOneTime = acctForm.paymentMode === 'onetime'
    // Quantité (achats multiples simultanés) — uniquement à la création, pas en édition
    const quantity = acct ? 1 : Math.max(1, parseInt(acctForm.quantity, 10) || 1)
    // Payload de base partagé par tous les comptes du bulk
    const basePayload={firm_id:firmId,user_id:user.id,buy_date:acctForm.buyDate,currency:acctForm.currency,spent:parseFloat(acctForm.spent)||0,activation_fee:isOneTime?0:(parseFloat(acctForm.activationFee)||0),activation_date:acctForm.activationDate||null,status:acctForm.status,notes:acctForm.notes,plan_size:acctForm.planSize||'50k',dd_type:acctForm.ddType||'static',payout_target:acctForm.payoutTarget?parseFloat(acctForm.payoutTarget):null,min_trading_days:acctForm.minTradingDays?parseInt(acctForm.minTradingDays,10):null,min_daily_profit:acctForm.minDailyProfit?parseFloat(acctForm.minDailyProfit):null,profit_split:acctForm.profitSplit?parseInt(acctForm.profitSplit,10):90,payment_mode:acctForm.paymentMode||'monthly'}
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
        basePayload.funded_date = acctForm.activationDate || new Date().toISOString().slice(0,10)
        autoReset = true
      }
    }
    if(acct){
      // Édition d'un compte existant
      await supabase.from('accounts').update({...basePayload, name:(acctForm.name||'').trim()}).eq('id',acct.id)
    } else if(quantity > 1){
      // Bulk insert : N comptes auto-numérotés
      const names = generateAccountNames(acctForm.name, quantity)
      const payloads = names.map(n => ({...basePayload, name:n}))
      await supabase.from('accounts').insert(payloads)
    } else {
      // Création d'un seul compte
      await supabase.from('accounts').insert({...basePayload, name:(acctForm.name||'').trim()})
    }
    setAcctModal(null);await loadFirms()
    showToast(
      quantity > 1
        ? `${quantity} comptes créés ✓`
        : autoReset
          ? `Passage en Financé · balance reset au ${basePayload.funded_date} ✓`
          : (acct?'Compte modifié ✓':'Compte ajouté ✓')
    )
  }

  async function deleteAccount(acctId){
    if(!confirm('Supprimer ce compte ?'))return
    await supabase.from('accounts').delete().eq('id',acctId)
    setAcctDrawer(null);await loadFirms();showToast('Compte supprimé')
  }

  async function savePayout(){
    if(!payoutFD.date||!payoutFD.amount){showToast('Date et montant requis');return}
    // L'user introduit le BRUT (montant déduit du compte). On calcule le NET reçu = brut × split%
    // et on stocke le NET en DB (compat avec aggregations existantes : totalPayouts = net reçu).
    const acctForSave=firms.find(f=>f.id===acctDrawer.firmId)?.accounts.find(a=>a.id===acctDrawer.acctId)
    const firmForSave=firms.find(f=>f.id===acctDrawer.firmId)
    const splitPct=acctForSave?.profit_split||suggestProfitSplit(firmForSave?.name,acctForSave?.plan_size)||90
    const brut=parseFloat(payoutFD.amount)||0
    const net=+(brut*(splitPct/100)).toFixed(2)
    await supabase.from('payouts').insert({account_id:acctDrawer.acctId,user_id:user.id,date:payoutFD.date,amount:net,note:payoutFD.note})
    setPayoutForm(false);setPayoutFD({date:'',amount:'',note:''})
    await loadFirms();showToast('Payout ajouté ✓')
  }

  // === Promote Challenge → Financé ===
  // Ouvre le modal de célébration avec auto-fill des règles selon la firme/plan
  function openPromoteModal(firm, acct){
    const tg=defaultPayoutTarget(firm?.name, acct?.plan_size)
    const md=defaultMinTradingDays(firm?.name, acct?.plan_size)
    const mdp=defaultMinDailyProfit(firm?.name, acct?.plan_size)
    const ps=suggestProfitSplit(firm?.name, acct?.plan_size)
    setPromoteForm({
      activationDate: new Date().toISOString().slice(0,10),
      activationFee:'',
      payoutTarget: tg!==null?String(tg):'',
      minTradingDays: md!==null?String(md):'',
      minDailyProfit: mdp!==null?String(mdp):'',
      profitSplit: String(ps),
      newName: acct.name||'', // pré-rempli avec le nom actuel (que l'user peut modifier)
    })
    setPromoteModal({firmId:firm.id, acctId:acct.id})
  }

  // Sauvegarde : passe le compte en Financé, fige les mensualités, applique les règles funded
  async function savePromote(){
    if(!promoteModal) return
    const firm=firms.find(f=>f.id===promoteModal.firmId)
    const acct=firm?.accounts.find(a=>a.id===promoteModal.acctId)
    if(!acct){ showToast('Compte introuvable'); return }
    const isOneTime=acct.payment_mode==='onetime'
    const fundedDate=promoteForm.activationDate||new Date().toISOString().slice(0,10)
    const payload={
      status:'Financé',
      activation_date:fundedDate,
      activation_fee:isOneTime?0:(parseFloat(promoteForm.activationFee)||0),
      payout_target:promoteForm.payoutTarget?parseFloat(promoteForm.payoutTarget):null,
      min_trading_days:promoteForm.minTradingDays?parseInt(promoteForm.minTradingDays,10):null,
      min_daily_profit:promoteForm.minDailyProfit?parseFloat(promoteForm.minDailyProfit):null,
      profit_split:promoteForm.profitSplit?parseInt(promoteForm.profitSplit,10):90,
      funded_date:fundedDate, // reset balance journal à cette date
      name:(promoteForm.newName||'').trim(), // permet de renommer le compte au passage (ex: test-0001 → Pro-001)
    }
    const {error}=await supabase.from('accounts').update(payload).eq('id',acct.id)
    if(error){ showToast('Erreur : '+(error.message||'inconnue')); return }
    setPromoteModal(null)
    await loadFirms()
    showToast('🎉 Compte passé en Financé ! Bravo !')
  }

  // === Marquer un compte comme Échoué ===
  // Pick un message de motivation aléatoire à l'ouverture du modal
  function openFailModal(firm, acct){
    const msg=FAIL_MESSAGES[Math.floor(Math.random()*FAIL_MESSAGES.length)]
    setFailModal({firmId:firm.id, acctId:acct.id, message:msg})
  }
  async function confirmFail(){
    if(!failModal) return
    const {error}=await supabase.from('accounts').update({status:'Échoué'}).eq('id',failModal.acctId)
    if(error){ showToast('Erreur : '+(error.message||'inconnue')); return }
    setFailModal(null)
    await loadFirms()
    showToast('Tête haute, prochaine sera la bonne 💪')
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
  // Helpers d'affichage qui respectent le mode currency (USD natif vs EUR)
  // Tous les montants en interne sont en EUR (via toEUR), on convertit à l'affichage
  function fmtMoney(eurVal, dec=2){
    if(currency==='eur') return fmtE(eurVal, dec)
    return (eurVal/rates.USD).toFixed(dec)+' $'
  }
  function fmtMoneyNet(eurVal, dec=2){
    if(currency==='eur') return fmtENet(eurVal, dec)
    return (eurVal>=0?'+':'')+(eurVal/rates.USD).toFixed(dec)+' $'
  }
  // Total dépensé = (prix unitaire × nombre de mensualités payées) + frais d'activation
  // Pour onetime : months_count=1 toujours → revient à spent + 0 = spent
  // Pour monthly : months_count est auto-incrémenté à chaque ouverture de l'app tant que statut=Challenge
  function totalSpentForAccount(acct){
    const months=acct.months_count||1
    const recurring=(parseFloat(acct.spent)||0)*months
    return toEUR(recurring,acct.currency,rates)+toEUR(acct.activation_fee||0,acct.currency,rates)
  }
  function firmTotalSpent(firm){return(firm.accounts||[]).reduce((s,a)=>s+totalSpentForAccount(a),0)}
  function firmTotalPayouts(firm){return(firm.accounts||[]).reduce((s,a)=>s+totalPayoutsEUR(a),0)}
  function allAccounts(){return firms.flatMap(f=>(f.accounts||[]).map(a=>({...a,firmName:f.name,firmColor:f.color})))}

  function buildEventMap(){
    const m={}
    firms.forEach(f=>{
      ;(f.accounts||[]).forEach(a=>{
        if(!m[a.buy_date])m[a.buy_date]=[]
        // Mois 1 = buy_date initial. Pour monthly on libelle "Mensualité #1", sinon "Challenge".
        const isMonthly=a.payment_mode==='monthly'
        const monthsBilled=a.months_count||1
        m[a.buy_date].push({type:'buy',firm:f.name,amount:a.spent,currency:a.currency,firmId:f.id,acctId:a.id,label:isMonthly?'Mensualité #1':'Challenge'})
        // Mensualités suivantes (mois 2, 3, …) — même jour du mois que buy_date
        if(isMonthly && monthsBilled>1){
          for(let i=1;i<monthsBilled;i++){
            const d=new Date(a.buy_date)
            d.setMonth(d.getMonth()+i)
            const dStr=d.toISOString().slice(0,10)
            if(!m[dStr])m[dStr]=[]
            m[dStr].push({type:'buy',firm:f.name,amount:a.spent,currency:a.currency,firmId:f.id,acctId:a.id,label:`Mensualité #${i+1}`})
          }
        }
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
      // Mois 1 = buy_date
      events.push({date:a.buy_date,type:'spent',amount:toEUR(a.spent,a.currency,rates)})
      // Mensualités 2, 3, … pour comptes en mode monthly (même jour du mois)
      if(a.payment_mode==='monthly' && (a.months_count||1)>1){
        for(let i=1;i<(a.months_count||1);i++){
          const d=new Date(a.buy_date)
          d.setMonth(d.getMonth()+i)
          events.push({date:d.toISOString().slice(0,10),type:'spent',amount:toEUR(a.spent,a.currency,rates)})
        }
      }
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

  // === Calcul des alertes globales (affichées sur la page /alertes + badge sidebar) ===
  const alerts=[]
  // Liste des prochains prélèvements mensuels (sur 30 jours) — affichée en bas de la page alertes
  const upcomingBills=[]
  firms.forEach(f=>{
    ;(f.accounts||[]).forEach(a=>{
      const tp=totalPayoutsEUR(a),sp=totalSpentForAccount(a)
      if(a.status==='Financé'&&(a.payouts||[]).length===0)alerts.push({icon:'💰',title:`Payout disponible — ${f.name}`,sub:'Compte financé sans payout',type:'success'})
      if(a.status==='Challenge'){
        const days=Math.floor((new Date()-new Date(a.buy_date+'T00:00:00'))/86400000)
        if(days>30)alerts.push({icon:'⏰',title:`Challenge depuis ${days} jours — ${f.name}`,sub:'Vérifiez votre progression',type:'warn'})
        // 🆕 Rappel renouvellement mensuel — 2 jours avant prélèvement
        // ⚠ Comparaison date-only (00h UTC) pour éviter les décalages dus à l'heure
        if(a.payment_mode==='monthly'&&a.buy_date){
          const buyD=new Date(a.buy_date+'T00:00:00Z')
          const nextB=new Date(buyD); nextB.setUTCDate(buyD.getUTCDate()+(a.months_count||1)*30); nextB.setUTCHours(0,0,0,0)
          const todayMid=new Date(); todayMid.setUTCHours(0,0,0,0)
          const dLeft=Math.round((nextB-todayMid)/86400000)
          const acctName=a.name||`Compte du ${a.buy_date}`
          const sym=a.currency==='EUR'?'€':a.currency==='GBP'?'£':'$'
          const dStr=nextB.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})
          const cost=Number(a.spent)||0
          // Alerte le jour J du prélèvement
          if(dLeft===0){
            alerts.push({icon:'🚨',title:`Paiement mensuel AUJOURD'HUI — ${f.name} · ${acctName}`,sub:`Prélèvement de ${cost} ${sym} prévu dans la journée`,type:'warn'})
          }
          // Alerte 1-2 jours avant
          else if(dLeft>0&&dLeft<=2){
            alerts.push({icon:'📅',title:`Paiement mensuel imminent — ${f.name} · ${acctName}`,sub:`Prochain prélèvement ${dLeft===1?'demain':`dans ${dLeft} jours`} (${dStr}) · ${cost} ${sym}`,type:'warn'})
          }
          // Ajoute aux prochains prélèvements (vue 30 jours), tri à la fin
          if(dLeft>=0&&dLeft<=30){
            upcomingBills.push({date:nextB,dateStr:dStr,daysLeft:dLeft,firm:f.name,firmColor:f.color,account:acctName,cost,sym})
          }
        }
      }
      if(tp>sp*2)alerts.push({icon:'🏆',title:`Excellent ROI — ${f.name}`,sub:`${(tp/sp).toFixed(1)}x votre investissement`,type:'success'})
    })
  })
  upcomingBills.sort((a,b)=>a.date-b.date)
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
      <AnnouncementBanner />
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
        <nav data-tour="sidebar" className={'app-nav'+(mobileNavOpen?' open':'')} style={{width:'200px',flexShrink:0,background:'var(--surface)',borderRight:'0.5px solid var(--border)',padding:'16px 0',position:'sticky',top:'48px',height:'calc(100vh - 48px)',overflowY:'auto'}}>
          {['Principal','Live Data','PropFirm'].map(section=>(
            <div key={section}>
              <div className="nav-section-label" style={{padding:'8px 16px',fontSize:'10px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.8px',marginTop:'8px'}}>{section}</div>
              {navItems.filter(i=>i.section===section).map(item=>(
                <button key={item.key} data-tour={`nav-${item.key}`} onClick={()=>{setPage(item.key);setMobileNavOpen(false)}} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 16px',width:'100%',border:'none',background:page===item.key?'rgba(45,111,255,0.12)':'transparent',color:page===item.key?'var(--blue)':'var(--text2)',fontSize:'13px',fontWeight:'500',cursor:'pointer',textAlign:'left'}}>
                  <span>{item.icon}</span>{item.label}
                  {item.badge>0&&<span style={{marginLeft:'auto',background:'var(--red)',color:'#fff',fontSize:'10px',fontWeight:'700',padding:'1px 6px',borderRadius:'99px'}}>{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
          {/* Lien admin — visible uniquement pour les emails admin */}
          {user && ['bakkali-omar@hotmail.com','omar.mbtrading@gmail.com','admin@quantara.tech'].includes(user.email) && (
            <div style={{padding:'8px 12px',marginTop:'12px',borderTop:'1px solid var(--border)'}}>
              <a href="/admin" style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'8px',background:'rgba(232,80,74,0.08)',border:'1px solid rgba(232,80,74,0.25)',color:'var(--red-text)',fontSize:'12px',fontWeight:'600',textDecoration:'none'}}>
                🔧 Admin Panel
              </a>
            </div>
          )}
          <div style={{padding:'8px 12px',marginTop:'12px'}}>
            <button onClick={()=>setShowTutorial(true)} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',width:'100%',background:'rgba(45,111,255,0.08)',border:'1px solid rgba(45,111,255,0.22)',borderRadius:'8px',color:'var(--blue-light)',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',textAlign:'left',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(45,111,255,0.14)';e.currentTarget.style.borderColor='rgba(45,111,255,0.4)'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(45,111,255,0.08)';e.currentTarget.style.borderColor='rgba(45,111,255,0.22)'}}>
              <span>🎓</span> Lancer le tutoriel
            </button>
          </div>
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
                  <button data-tour="add-firm-btn" onClick={()=>{setFirmModal(true);setNewFirmName('')}} style={S.btnPrimary}>+ Ajouter PropFirm</button>
                </div>
              </div>

              <div className="stats-5" data-tour="stats-cards" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'24px'}}>
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

              <div className="firms-grid" data-tour="firms-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:'16px',marginBottom:'24px'}}>
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
                          <span style={{fontWeight:'600',color:aNet>=0?'var(--green)':'var(--red)'}}>{fmtMoneyNet(aNet,0)}</span>
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
                  {[{l:'Achats du mois',v:fmtMoney(msSpent),c:'var(--red)'},{l:'Payouts du mois',v:fmtMoney(msPayout),c:'var(--green)'},{l:'Net du mois',v:fmtMoneyNet(msPayout-msSpent),c:(msPayout-msSpent)>=0?'var(--green)':'var(--red)'}].map((s,i)=>(
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
                          {buyT>0&&<div className="cal-cell-amount" style={{fontSize:'11px',fontWeight:'700',padding:'2px 6px',borderRadius:'4px',background:'var(--red-bg)',color:'var(--red-text)',marginBottom:'3px',display:'inline-block'}}>-{fmtMoney(buyT,0)}</div>}
                          {payT>0&&<div className="cal-cell-amount" style={{fontSize:'11px',fontWeight:'700',padding:'2px 6px',borderRadius:'4px',background:'var(--green-bg)',color:'var(--green-text)',display:'inline-block'}}>+{fmtMoney(payT,0)}</div>}
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
                          <div style={{fontSize:'12px',color:e.type==='buy'?'var(--red)':'var(--green)',fontWeight:'600'}}>{e.type==='buy'?'-':'+'}{fmtMoney(toEUR(e.amount,e.currency,rates))}</div>
                        </div>
                      )):<div style={{color:'var(--text3)',fontSize:'12px'}}>Aucune transaction.</div>:<div style={{color:'var(--text3)',fontSize:'12px'}}>Cliquez sur un jour.</div>}
                    </div>
                    <div style={{...S.card,padding:'16px'}}>
                      <div style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'8px'}}>Transactions récentes</div>
                      {Object.entries(evtMap).flatMap(([d,evts])=>evts.map(e=>({...e,date:d}))).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map((e,i)=>(
                        <div key={i} style={{display:'flex',gap:'8px',padding:'7px 0',borderBottom:'0.5px solid var(--border)'}}>
                          <div style={{width:'6px',height:'6px',borderRadius:'50%',background:e.type==='buy'?'var(--red)':'var(--green)',marginTop:'4px',flexShrink:0}} />
                          <div style={{flex:1}}><div style={{fontSize:'12px',fontWeight:'500'}}>{e.firm}</div><div style={{fontSize:'10px',color:'var(--text3)'}}>{e.date} · {e.type==='buy'?'Achat':'Payout'}</div></div>
                          <div style={{fontSize:'12px',fontWeight:'600',color:e.type==='buy'?'var(--red)':'var(--green)'}}>{e.type==='buy'?'-':'+'}{fmtMoney(toEUR(e.amount,e.currency,rates))}</div>
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
                          ['Meilleur payout', bestP>0?fmtMoney(bestP):'—', 'var(--green)'],
                          ['Coût moyen challenge', total>0?fmtMoney(totalSpentEUR/total):'—', 'var(--text)'],
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
                {[{l:'Net global',v:fmtMoneyNet(totalNet),c:totalNet>=0?'var(--green)':'var(--red)'},{l:'Total dépensé',v:fmtMoney(totalSpentEUR),c:'var(--red)'},{l:'Total payouts',v:fmtMoney(totalPayoutsEUR2),c:'var(--green)'},{l:'Payout moyen',v:totalPayoutCount>0?fmtMoney(totalPayoutsEUR2/totalPayoutCount):'—',c:'var(--green)'}].map((k,i)=>(
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
            <PropfirmComparator user={user} />
          )}

          {page==='alerts'&&(
            <div className="page-pad" style={{maxWidth:'1160px',margin:'0 auto',padding:'28px 24px 60px'}}>
              <h1 style={{fontSize:'22px',fontWeight:'600',marginBottom:'6px'}}>Alertes</h1>
              <p style={{fontSize:'13px',color:'var(--text3)',marginBottom:'22px'}}>Notifications importantes et rappels de prélèvements mensuels.</p>

              {/* Toggle Push notifications */}
              <div style={{marginBottom:'24px'}}>
                <PushNotificationToggle />
              </div>

              {/* Liste des alertes */}
              <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'32px'}}>
                {alerts.map((alert,i)=>(
                  <div key={i} style={{...S.card,padding:'14px 18px',display:'flex',alignItems:'center',gap:'14px',background:alert.type==='success'?'var(--green-bg)':alert.type==='warn'?'var(--amber-bg)':'var(--surface)',borderColor:alert.type==='success'?'var(--green)':alert.type==='warn'?'var(--amber-text)':'rgba(255,255,255,0.07)'}}>
                    <div style={{fontSize:'22px'}}>{alert.icon}</div>
                    <div><div style={{fontSize:'13px',fontWeight:'600'}}>{alert.title}</div><div style={{fontSize:'12px',color:'var(--text2)'}}>{alert.sub}</div></div>
                  </div>
                ))}
              </div>

              {/* Prochains prélèvements (30 jours) */}
              {upcomingBills.length>0 && (() => {
                const totalCost=upcomingBills.reduce((s,b)=>s+(b.cost||0),0)
                // Group by currency for display
                const byCur={}
                upcomingBills.forEach(b=>{byCur[b.sym]=(byCur[b.sym]||0)+b.cost})
                const totalsStr=Object.entries(byCur).map(([s,t])=>`${t.toFixed(0)} ${s}`).join(' + ')
                return (
                  <div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px',gap:'14px',flexWrap:'wrap'}}>
                      <div>
                        <div style={{fontSize:'15px',fontWeight:'600',marginBottom:'2px'}}>📅 Prochains prélèvements (30 prochains jours)</div>
                        <div style={{fontSize:'12px',color:'var(--text3)'}}>{upcomingBills.length} prélèvement{upcomingBills.length>1?'s':''} à venir · Total : <strong style={{color:'var(--red)'}}>{totalsStr}</strong></div>
                      </div>
                    </div>
                    <div style={{...S.card,overflow:'hidden'}}>
                      {upcomingBills.map((b,i)=>{
                        const isImminent=b.daysLeft<=2
                        return (
                          <div key={i} style={{
                            display:'flex',alignItems:'center',gap:'14px',
                            padding:'12px 16px',
                            borderBottom:i<upcomingBills.length-1?'0.5px solid var(--border)':'none',
                            background:isImminent?'rgba(250,199,117,0.05)':'transparent',
                          }}>
                            <div style={{
                              width:'44px',textAlign:'center',flexShrink:0,
                              fontSize:'10px',color:'var(--text3)',fontWeight:'600',letterSpacing:'0.4px',
                            }}>
                              <div style={{fontSize:'18px',fontWeight:'700',color:isImminent?'var(--amber-text)':'var(--text)'}}>{b.date.getDate()}</div>
                              <div style={{textTransform:'uppercase'}}>{b.date.toLocaleDateString('fr-FR',{month:'short'}).replace('.','')}</div>
                            </div>
                            <div style={{width:'2px',alignSelf:'stretch',background:b.firmColor||'var(--blue)',borderRadius:'2px',flexShrink:0}} />
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:'13px',fontWeight:'600',marginBottom:'2px'}}>{b.firm} · {b.account}</div>
                              <div style={{fontSize:'11px',color:'var(--text3)'}}>
                                {b.daysLeft===0?'Aujourd\'hui':b.daysLeft===1?'Demain':`Dans ${b.daysLeft} jours`}
                                {isImminent&&<span style={{marginLeft:'8px',padding:'1px 7px',borderRadius:'99px',background:'rgba(250,199,117,0.15)',color:'var(--amber-text)',fontWeight:'700',fontSize:'9px',textTransform:'uppercase',letterSpacing:'0.5px'}}>⚠ Imminent</span>}
                              </div>
                            </div>
                            <div style={{fontSize:'14px',fontWeight:'700',color:'var(--red)',flexShrink:0}}>-{b.cost} {b.sym}</div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{marginTop:'12px',padding:'10px 14px',background:'var(--surface2)',borderRadius:'var(--radius)',fontSize:'11px',color:'var(--text3)',lineHeight:1.5}}>
                      💡 Les prélèvements s'arrêtent automatiquement quand tu passes le compte en <strong style={{color:'var(--green)'}}>Financé</strong> via le bouton 🚀 dans le drawer du compte.
                    </div>
                  </div>
                )
              })()}

              {/* Si aucun prélèvement à venir */}
              {upcomingBills.length===0 && firms.some(f=>(f.accounts||[]).some(a=>a.status==='Challenge'&&a.payment_mode==='monthly')) && (
                <div style={{padding:'14px 18px',background:'var(--surface2)',borderRadius:'var(--radius)',fontSize:'12px',color:'var(--text3)'}}>
                  ✓ Aucun prélèvement prévu dans les 30 prochains jours.
                </div>
              )}
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

      {acctModal&&<div onClick={()=>setAcctModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'12px',overflowY:'auto'}}><div className="modal" onClick={e=>e.stopPropagation()} style={{...S.card,padding:'28px',width:'440px',maxWidth:'100%',boxShadow:'0 24px 64px rgba(0,0,0,0.5)'}}><h3 style={{fontSize:'17px',fontWeight:'600',marginBottom:'20px'}}>{acctModal.acct?'Modifier le compte':`Nouveau compte — ${firms.find(f=>f.id===acctModal.firmId)?.name}`}</h3><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}><div><label style={S.label}>Date d'achat</label><input type="date" value={acctForm.buyDate} onChange={e=>setAcctForm(p=>({...p,buyDate:e.target.value}))} style={S.input} /></div><div><label style={S.label}>Devise</label><select value={acctForm.currency} onChange={e=>setAcctForm(p=>({...p,currency:e.target.value}))} style={S.input}><option>USD</option><option>EUR</option><option>GBP</option><option>CHF</option></select></div><div><label style={S.label}>Plan / Taille du compte</label><select value={acctForm.planSize} onChange={e=>{const newPlan=e.target.value;const firmName=firms.find(f=>f.id===acctModal.firmId)?.name;const tg=defaultPayoutTarget(firmName,newPlan);const md=defaultMinTradingDays(firmName,newPlan);const pr=defaultChallengePrice(firmName,newPlan);const mdp=defaultMinDailyProfit(firmName,newPlan);const ps=suggestProfitSplit(firmName,newPlan);setAcctForm(p=>({...p,planSize:newPlan,payoutTarget:tg!==null?String(tg):p.payoutTarget,minTradingDays:md!==null?String(md):p.minTradingDays,spent:pr!==null?String(pr):p.spent,minDailyProfit:mdp!==null?String(mdp):p.minDailyProfit,profitSplit:String(ps)}))}} style={S.input}>{plansForFirm(firms.find(f=>f.id===acctModal.firmId)?.name).map(p=><option key={p} value={p}>{p.toUpperCase()}</option>)}</select></div><div style={{gridColumn:'1/-1'}}><label style={S.label}>Mode de paiement du challenge<TooltipIcon text="Mensuel : abonnement moins cher MAIS frais d'activation à payer au passage en Financé. One-time : prix plus élevé en une seule fois, sans frais d'activation par la suite. Affecte le calcul du coût total du compte." maxWidth={360} /></label><div style={{display:'flex',gap:'4px',background:'var(--surface3)',borderRadius:'var(--radius)',padding:'4px'}}>{[{v:'monthly',l:'📅 Mensuel',d:'+ frais activation'},{v:'onetime',l:'💎 One-time',d:'sans frais activation'}].map(opt=>(<button key={opt.v} type="button" onClick={()=>setAcctForm(p=>({...p,paymentMode:opt.v,activationFee:opt.v==='onetime'?'':p.activationFee}))} style={{flex:1,padding:'10px 12px',fontSize:'12px',fontWeight:'600',background:acctForm.paymentMode===opt.v?'var(--blue)':'transparent',color:acctForm.paymentMode===opt.v?'#fff':'var(--text2)',border:'none',borderRadius:'6px',cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}><span>{opt.l}</span><span style={{fontSize:'10px',opacity:0.75,fontWeight:'500'}}>{opt.d}</span></button>))}</div></div><div><label style={S.label}>{acctForm.paymentMode==='onetime'?'Prix one-time ($)':'Prix mensuel ($)'}<TooltipIcon text={acctForm.paymentMode==='onetime'?"Le montant complet payé en une seule fois pour ce challenge.":"Le montant facturé CHAQUE MOIS tant que le challenge n'est pas validé. Quantara accumule automatiquement les mensualités au fil du temps."} maxWidth={320} /></label><input type="number" value={acctForm.spent} onChange={e=>setAcctForm(p=>({...p,spent:e.target.value}))} placeholder="0.00" style={S.input} /></div><div style={{gridColumn:'1/-1'}}><label style={S.label}>Statut</label><select value={acctForm.status} onChange={e=>setAcctForm(p=>({...p,status:e.target.value}))} style={S.input}><option>Challenge</option><option>Financé</option><option>Échoué</option></select></div>{acctForm.status==='Financé'&&<div style={{gridColumn:'1/-1',background:'rgba(29,184,122,0.07)',border:'0.5px solid var(--green)',borderRadius:'var(--radius)',padding:'12px'}}><div style={{fontSize:'11px',fontWeight:'700',color:'var(--green-text)',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>✅ Compte Financé</div><div style={{display:'grid',gridTemplateColumns:acctForm.paymentMode==='onetime'?'1fr':'1fr 1fr',gap:'8px'}}><div><label style={S.label}>Date d'activation</label><input type="date" value={acctForm.activationDate} onChange={e=>setAcctForm(p=>({...p,activationDate:e.target.value}))} style={{...S.input,background:'var(--surface3)'}} /></div>{acctForm.paymentMode!=='onetime'&&<div><label style={S.label}>Frais d'activation</label><input type="number" value={acctForm.activationFee} onChange={e=>setAcctForm(p=>({...p,activationFee:e.target.value}))} placeholder="145.00" style={{...S.input,background:'var(--surface3)'}} /></div>}</div>{acctForm.paymentMode==='onetime'&&<div style={{marginTop:'8px',fontSize:'11px',color:'var(--text3)',display:'flex',gap:'6px',alignItems:'center'}}>💎 Paiement one-time → aucun frais d'activation à payer.</div>}</div>}<div style={{gridColumn:'1/-1'}}>{!acctModal.acct ? (
                  // Mode CRÉATION : nom + quantité (achats simultanés)
                  <>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 130px',gap:'10px',alignItems:'end'}}>
                      <div>
                        <label style={S.label}>Nom du compte (optionnel)<TooltipIcon text="Pour les achats multiples (ex : 5 challenges Topstep d'un coup), tape ici le nom de base (ex : Test) et choisis la quantité à droite. Les comptes seront auto-numérotés (Test-001, Test-002...). Si tu mets déjà un suffixe -NNN (ex : Pro-005), l'incrément démarre à partir de ce numéro." maxWidth={360} /></label>
                        <input value={acctForm.name} onChange={e=>setAcctForm(p=>({...p,name:e.target.value}))} placeholder="ex : Test, Pro, Lucid principal..." style={S.input} />
                      </div>
                      <div>
                        <label style={S.label}>🛒 Quantité</label>
                        <input type="number" min="1" max="50" value={acctForm.quantity} onChange={e=>setAcctForm(p=>({...p,quantity:e.target.value}))} style={{...S.input,textAlign:'center',fontWeight:700}} />
                      </div>
                    </div>
                    {(() => {
                      const qty = Math.max(1, parseInt(acctForm.quantity,10) || 1)
                      if (qty <= 1) return null
                      const names = generateAccountNames(acctForm.name, qty)
                      const preview = names.slice(0,4).map(n => n || '(sans nom)').join(', ') + (qty > 4 ? `, …` : '')
                      const totalPrice = (parseFloat(acctForm.spent)||0) * qty
                      const currencySymbol = acctForm.currency === 'EUR' ? '€' : acctForm.currency === 'GBP' ? '£' : '$'
                      return (
                        <div style={{marginTop:'8px',padding:'10px 12px',background:'rgba(45,111,255,0.08)',border:'0.5px solid rgba(45,111,255,0.3)',borderRadius:'var(--radius)',fontSize:'11px',color:'var(--text2)',lineHeight:1.55}}>
                          <div style={{fontWeight:700,color:'var(--blue-light)',marginBottom:'4px'}}>🛒 {qty} comptes seront créés en bulk</div>
                          <div style={{color:'var(--text3)'}}>Noms : <strong style={{color:'var(--text2)'}}>{preview}</strong></div>
                          {totalPrice > 0 && (
                            <div style={{color:'var(--text3)',marginTop:'2px'}}>
                              {acctForm.paymentMode === 'onetime' ? '💎 One-time' : '📅 Mois 1'} · Total : <strong style={{color:'#e8504a'}}>{totalPrice.toFixed(2)} {currencySymbol}</strong> ({qty} × {acctForm.spent||0} {currencySymbol})
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  // Mode ÉDITION : nom uniquement
                  <>
                    <label style={S.label}>Nom du compte (optionnel)</label>
                    <input value={acctForm.name} onChange={e=>setAcctForm(p=>({...p,name:e.target.value}))} placeholder="ex : Lucid principal, Topstep #1, NQ scalp..." style={S.input} />
                  </>
                )}</div><div style={{gridColumn:'1/-1'}}><label style={S.label}>Type de drawdown<TooltipIcon text="3 types : Static = ligne fixe (balance initial − DD max). End of Day (EOD) = trailing basé sur la balance de FIN DE JOURNÉE (les pics intraday ne lockent pas le DD). Trailing intraday = trailing temps réel, le moindre pic intraday update le DD. La plupart des firmes utilisent EOD ou Trailing." maxWidth={360} /></label><select value={acctForm.ddType} onChange={e=>setAcctForm(p=>({...p,ddType:e.target.value}))} style={S.input}><option value="static">Static (ligne fixe : balance initial − DD max)</option><option value="eod">End of Day (trailing en fin de journée, ignore les pics intraday)</option><option value="trailing">Trailing intraday (suit le peak temps réel)</option></select></div>{acctForm.status==='Financé'&&<><div><label style={S.label}>Objectif payout ($)</label><input type="number" step="0.01" value={acctForm.payoutTarget} onChange={e=>setAcctForm(p=>({...p,payoutTarget:e.target.value}))} placeholder="ex : 53000 (= 50k + 3k profit)" style={S.input} /></div><div><label style={S.label}>Jours de trading min</label><input type="number" min="0" value={acctForm.minTradingDays} onChange={e=>setAcctForm(p=>({...p,minTradingDays:e.target.value}))} placeholder="ex : 10" style={S.input} /></div><div><label style={S.label}>Profit split<TooltipIcon text="Pourcentage du profit que TU touches lors d'un payout. Le reste va à la PropFirm. La plupart des firmes proposent 90/10 (90% trader, 10% firme), mais ça varie : Apex débute à 100/0 sur les premiers $25K, certains plans Pro de MFFU/Topstep sont 80/20. Choisis le split correspondant exactement à ton compte." maxWidth={340} /></label><select value={acctForm.profitSplit} onChange={e=>setAcctForm(p=>({...p,profitSplit:e.target.value}))} style={S.input}><option value="100">100 / 0 (tu prends tout — Apex 1ers $25K, etc.)</option><option value="90">90 / 10 (le plus courant — Topstep, Lucid, Tradeify…)</option><option value="80">80 / 20 (MFFU Core/Pro, TPT PRO…)</option><option value="70">70 / 30 (rare — plans débutants)</option></select></div><div><label style={S.label}>Profit min / jour valide ($)<TooltipIcon text="Profit minimum sur 1 journée pour qu'elle compte comme jour validé dans le décompte des jours de trading min. Ex Lucid : 150$ par jour." /></label><input type="number" min="0" step="1" value={acctForm.minDailyProfit} onChange={e=>setAcctForm(p=>({...p,minDailyProfit:e.target.value}))} placeholder="ex : 150" style={S.input} /></div></>}{acctForm.status==='Challenge'&&<div style={{gridColumn:'1/-1',padding:'12px',background:'rgba(45,111,255,0.06)',border:'0.5px solid rgba(45,111,255,0.22)',borderRadius:'var(--radius)',fontSize:'12px',color:'var(--text2)',lineHeight:1.5}}>💡 Les règles funded (objectif payout, jours min, profit split, profit min/jour) seront configurées <strong>quand tu passeras en Financé</strong> via le bouton « 🚀 Passer en Financé » dans le drawer du compte.</div>}<div style={{gridColumn:'1/-1'}}><label style={S.label}>Notes</label><input value={acctForm.notes} onChange={e=>setAcctForm(p=>({...p,notes:e.target.value}))} placeholder="Commentaire..." style={S.input} /></div></div><div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'20px'}}><button onClick={()=>setAcctModal(null)} style={S.btnGhost}>Annuler</button><button onClick={saveAccount} style={S.btnPrimary}>Enregistrer</button></div></div></div>}

      {firmDrawer&&currentFirm&&<div onClick={()=>setFirmDrawer(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:400,display:'flex',alignItems:'flex-start',justifyContent:'flex-end'}}><div className="drawer" onClick={e=>e.stopPropagation()} style={{width:'520px',maxWidth:'95vw',height:'100vh',background:'var(--surface)',borderLeft:'0.5px solid var(--border2)',overflowY:'auto',padding:'28px'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}><div style={{display:'flex',alignItems:'center',gap:'10px'}}>{getFirmLogo(currentFirm.name,currentFirm.color,32)}<div style={{fontSize:'18px',fontWeight:'600'}}>{currentFirm.name}</div></div><div style={{display:'flex',gap:'8px'}}><button onClick={()=>renameFirm(currentFirm.id)} style={S.btnGhost}>✏ Renommer</button><button onClick={()=>setFirmDrawer(null)} style={S.btnGhost}>✕</button></div></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'20px'}}>{[['Total comptes',(currentFirm.accounts||[]).length],['Total dépensé',<span style={{color:'var(--red)'}}>{ fmtMoney(firmTotalSpent(currentFirm))}</span>],['Total payouts',<span style={{color:'var(--green)'}}>{fmtMoney(firmTotalPayouts(currentFirm))}</span>],['Net',<span style={{color:(firmTotalPayouts(currentFirm)-firmTotalSpent(currentFirm))>=0?'var(--green)':'var(--red)'}}>{fmtMoneyNet(firmTotalPayouts(currentFirm)-firmTotalSpent(currentFirm))}</span>]].map(([l,v],i)=>(<div key={i} style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:'12px 14px'}}><div style={{fontSize:'11px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'5px'}}>{l}</div><div style={{fontSize:'16px',fontWeight:'600'}}>{v}</div></div>))}</div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}><div style={{fontSize:'13px',fontWeight:'600',color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Comptes ({(currentFirm.accounts||[]).length})</div><button onClick={()=>{setAcctModal({firmId:currentFirm.id});(()=>{const fn=firms.find(f=>f.id===(acctModal?.firmId||currentFirm?.id))?.name;const tg=defaultPayoutTarget(fn,'50k');const md=defaultMinTradingDays(fn,'50k');const pr=defaultChallengePrice(fn,'50k');const mdp=defaultMinDailyProfit(fn,'50k');const ps=suggestProfitSplit(fn,'50k');setAcctForm({buyDate:new Date().toISOString().slice(0,10),currency:'USD',spent:pr!==null?String(pr):'',activationFee:'',activationDate:'',status:'Challenge',notes:'',planSize:'50k',name:'',ddType:defaultDdType(fn),payoutTarget:tg!==null?String(tg):'',minTradingDays:md!==null?String(md):'',minDailyProfit:mdp!==null?String(mdp):'',profitSplit:String(ps),paymentMode:'monthly',quantity:'1'})})()}} style={S.btnPrimary}>+ Ajouter compte</button></div>{(currentFirm.accounts||[]).slice().sort((a,b)=>{const o={'Financé':0,'Challenge':1,'Échoué':2};return (o[a.status]??3)-(o[b.status]??3)}).map(a=>{const tp=totalPayoutsEUR(a),net=tp-totalSpentForAccount(a);const isFailed=a.status==='Échoué';return<div key={a.id} onClick={()=>setAcctDrawer({firmId:currentFirm.id,acctId:a.id})} style={{padding:'12px 14px',background:'var(--surface2)',borderRadius:'var(--radius)',marginBottom:'8px',cursor:'pointer',opacity:isFailed?0.55:1,filter:isFailed?'grayscale(0.4)':'none',transition:'opacity 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background='var(--surface3)';e.currentTarget.style.opacity=1}} onMouseLeave={e=>{e.currentTarget.style.background='var(--surface2)';e.currentTarget.style.opacity=isFailed?0.55:1}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}><div style={{display:'flex',alignItems:'center',gap:'8px',flex:1,minWidth:0}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:STATUS_COLORS[a.status],flexShrink:0}} /><span style={{fontWeight:'600',fontSize:'13px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{accountLabel(a)}</span><button onClick={(e)=>{e.stopPropagation();renameAccount(a.id, a.name, a.buy_date)}} title="Renommer" style={{background:'transparent',border:'none',color:'var(--text3)',cursor:'pointer',padding:'2px 6px',fontSize:'13px',flexShrink:0}}>✏</button></div><span style={S.badge(a.status)}>{a.status}</span></div><div style={{display:'flex',justifyContent:'space-between',fontSize:'12px'}}><span style={{color:'var(--green)'}}>Payouts : {fmtMoney(tp)}</span><span style={{color:net>=0?'var(--green)':'var(--red)'}}>Net : {fmtMoneyNet(net)}</span><span style={{color:'var(--text3)'}}>{(a.payouts||[]).length} payout{(a.payouts||[]).length>1?'s':''}</span></div></div>})}<div style={{marginTop:'28px',paddingTop:'20px',borderTop:'0.5px solid var(--border)'}}><button onClick={()=>deleteFirm(currentFirm.id)} style={{background:'var(--red-bg)',color:'var(--red-text)',border:'0.5px solid var(--red-bg)',padding:'8px 16px',borderRadius:'var(--radius)',fontSize:'13px',cursor:'pointer',fontWeight:'500'}}>Supprimer cette firme</button></div></div></div>}

      {acctDrawer&&currentAcct&&<div onClick={()=>setAcctDrawer(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:450,display:'flex',alignItems:'flex-start',justifyContent:'flex-end'}}><div className="drawer" onClick={e=>e.stopPropagation()} style={{width:'500px',maxWidth:'95vw',height:'100vh',background:'var(--surface)',borderLeft:'0.5px solid var(--border2)',overflowY:'auto',padding:'28px'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}><div style={{fontSize:'17px',fontWeight:'600'}}>{currentAcctFirm?.name} — {accountLabel(currentAcct)}</div><div style={{display:'flex',gap:'8px'}}><button onClick={()=>{setAcctModal({firmId:acctDrawer.firmId,acct:currentAcct});setAcctForm({buyDate:currentAcct.buy_date,currency:currentAcct.currency,spent:currentAcct.spent,activationFee:currentAcct.activation_fee||'',activationDate:currentAcct.activation_date||'',status:currentAcct.status,notes:currentAcct.notes||'',planSize:currentAcct.plan_size||'50k',name:currentAcct.name||'',ddType:currentAcct.dd_type||defaultDdType(currentAcctFirm?.name),payoutTarget:currentAcct.payout_target!=null?String(currentAcct.payout_target):'',minTradingDays:currentAcct.min_trading_days!=null?String(currentAcct.min_trading_days):'',minDailyProfit:currentAcct.min_daily_profit!=null?String(currentAcct.min_daily_profit):'',profitSplit:currentAcct.profit_split!=null?String(currentAcct.profit_split):'90',paymentMode:currentAcct.payment_mode||'monthly',quantity:'1'})}} style={S.btnGhost}>✏ Modifier</button><button onClick={()=>setAcctDrawer(null)} style={S.btnGhost}>✕</button></div></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'20px'}}>{[['Firme',currentAcctFirm?.name],['Date achat',currentAcct.buy_date],['Challenge',<span style={{color:'var(--red)',display:'inline-flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>{currentAcct.spent} {currentAcct.currency}<span style={{padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:600,background:currentAcct.payment_mode==='onetime'?'rgba(45,111,255,0.15)':'rgba(250,199,117,0.15)',color:currentAcct.payment_mode==='onetime'?'var(--blue-light)':'var(--amber)'}}>{currentAcct.payment_mode==='onetime'?'💎 One-time':'📅 Mensuel'}</span></span>],...(currentAcct.payment_mode==='monthly'?[['Mensualités payées',<span style={{color:'var(--red)'}}>{currentAcct.months_count||1} × {currentAcct.spent} {currentAcct.currency} = {((currentAcct.months_count||1)*(parseFloat(currentAcct.spent)||0)).toFixed(2)} {currentAcct.currency}{currentAcct.status==='Challenge'?<span style={{marginLeft:6,fontSize:9,padding:'1px 6px',borderRadius:99,background:'rgba(250,199,117,0.15)',color:'var(--amber)'}}>⏱ en cours</span>:<span style={{marginLeft:6,fontSize:9,padding:'1px 6px',borderRadius:99,background:'rgba(29,184,122,0.15)',color:'var(--green)'}}>✓ figé</span>}</span>]]:[]),...(currentAcct.activation_fee>0?[['Date activation',currentAcct.activation_date||'—'],['Frais activation',<span style={{color:'var(--red)'}}>{currentAcct.activation_fee} {currentAcct.currency}</span>]]:[]),['Total dépensé',<span style={{color:'var(--red)'}}>{fmtMoney(totalSpentForAccount(currentAcct))}</span>],['Net',<span style={{color:(totalPayoutsEUR(currentAcct)-totalSpentForAccount(currentAcct))>=0?'var(--green)':'var(--red)'}}>{fmtMoneyNet(totalPayoutsEUR(currentAcct)-totalSpentForAccount(currentAcct))}</span>],['Statut',<span style={S.badge(currentAcct.status)}>{currentAcct.status}</span>]].map(([l,v],i)=>(<div key={i} style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:'12px 14px'}}><div style={{fontSize:'11px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'5px'}}>{l}</div><div style={{fontSize:'15px',fontWeight:'600'}}>{v}</div></div>))}</div>{currentAcct.status!=='Échoué'&&<div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>{currentAcct.status==='Challenge'&&<button onClick={()=>openPromoteModal(currentAcctFirm,currentAcct)} style={{flex:1,padding:'10px 14px',background:'linear-gradient(135deg, #1db87a 0%, #2ed694 100%)',border:'none',color:'#fff',borderRadius:'var(--radius)',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 12px rgba(29,184,122,0.3)',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',transition:'transform 0.15s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}><span style={{fontSize:'15px'}}>🚀</span><span>Passer en Financé</span></button>}<button onClick={()=>openFailModal(currentAcctFirm,currentAcct)} style={{flex:1,padding:'10px 14px',background:'transparent',border:'1px solid rgba(232,80,74,0.4)',color:'#e8504a',borderRadius:'var(--radius)',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(232,80,74,0.10)';e.currentTarget.style.borderColor='#e8504a'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='rgba(232,80,74,0.4)'}}><span style={{fontSize:'15px'}}>💔</span><span>{currentAcct.status==='Challenge'?'J\'ai échoué':'Compte blown (DD touché)'}</span></button></div>}<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}><div style={{fontSize:'13px',fontWeight:'600',color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Payouts reçus</div><button onClick={()=>{setPayoutForm(true);setPayoutFD({date:new Date().toISOString().slice(0,10),amount:'',note:''})}} style={S.btnPrimary}>+ Ajouter payout</button></div>{payoutForm&&<div style={{background:'var(--surface3)',borderRadius:'var(--radius)',padding:'14px',marginBottom:'14px'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}><div><div style={S.label}>Date</div><input type="date" value={payoutFD.date} onChange={e=>setPayoutFD(p=>({...p,date:e.target.value}))} style={{...S.input,background:'var(--surface2)'}} /></div><div><div style={S.label}>Montant brut demandé<TooltipIcon text="Le BRUT est le montant retiré du compte (avant split). Le NET = ce que tu reçois réellement = brut × ton profit split. Ex : tu demandes 2 000 $ brut avec un split 90/10 → tu reçois 1 800 $, la firme garde 200 $." maxWidth={320} /></div><input type="number" value={payoutFD.amount} onChange={e=>setPayoutFD(p=>({...p,amount:e.target.value}))} placeholder="ex : 2000" style={{...S.input,background:'var(--surface2)'}} /></div></div>{(()=>{const split=currentAcct?.profit_split||suggestProfitSplit(currentAcctFirm?.name,currentAcct?.plan_size);const brut=parseFloat(payoutFD.amount)||0;if(brut<=0||!split)return null;const net=brut*(split/100);const firmCut=brut-net;return(<div style={{marginBottom:'10px',padding:'10px 12px',background:'rgba(45,111,255,0.08)',border:'0.5px solid rgba(45,111,255,0.3)',borderRadius:'var(--radius)',fontSize:'12px'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{color:'var(--text2)'}}>Profit split {split}/{100-split}</span><span style={{color:'var(--text3)',fontSize:'10px'}}>{currentAcctFirm?.name} · Plan {(currentAcct?.plan_size||'').toUpperCase()}</span></div><div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',fontWeight:'600',marginBottom:'4px'}}><span style={{color:'var(--green)'}}>💰 Net reçu (dans ta poche) : {net.toFixed(2)} {currentAcct?.currency||'$'}</span><span style={{color:'var(--text3)',fontSize:'11px'}}>Part firme : {firmCut.toFixed(2)}</span></div><div style={{fontSize:'11px',color:'var(--text3)'}}>📉 Brut déduit du compte : {brut.toFixed(2)} {currentAcct?.currency||'$'}</div></div>)})()}<div style={{marginBottom:'10px'}}><div style={S.label}>Note</div><input value={payoutFD.note} onChange={e=>setPayoutFD(p=>({...p,note:e.target.value}))} placeholder="ex: 1er payout..." style={{...S.input,background:'var(--surface2)'}} /></div><div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}><button onClick={()=>setPayoutForm(false)} style={S.btnGhost}>Annuler</button><button onClick={savePayout} style={S.btnPrimary}>OK</button></div></div>}{(currentAcct.payouts||[]).length>0&&<div style={{marginBottom:'14px',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',background:'var(--surface3)',borderRadius:'var(--radius)'}}><span style={{fontSize:'12px',color:'var(--text2)'}}>Total payouts</span><span style={{fontSize:'16px',fontWeight:'600',color:'var(--green)'}}>{fmtMoney(totalPayoutsEUR(currentAcct))}</span></div>}{(currentAcct.payouts||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)).map(p=>(<div key={p.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 14px',background:'var(--surface2)',borderRadius:'var(--radius)',marginBottom:'8px'}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--green)',flexShrink:0}} /><div style={{flex:1}}><div style={{fontWeight:'500',fontSize:'13px'}}>Payout — {p.date}</div>{p.note&&<div style={{fontSize:'11px',color:'var(--text3)'}}>{p.note}</div>}</div><div style={{fontSize:'15px',fontWeight:'600',color:'var(--green)'}}>+{fmtMoney(toEUR(p.amount,currentAcct.currency,rates))}</div><button onClick={()=>deletePayout(p.id)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:'2px 6px',fontSize:'14px'}}>✕</button></div>))}{!(currentAcct.payouts||[]).length&&!payoutForm&&<div style={{color:'var(--text3)',fontSize:'13px',padding:'12px 0'}}>Aucun payout enregistré.</div>}<div style={{marginTop:'28px',paddingTop:'20px',borderTop:'0.5px solid var(--border)'}}><button onClick={()=>deleteAccount(currentAcct.id)} style={{background:'var(--red-bg)',color:'var(--red-text)',border:'0.5px solid var(--red-bg)',padding:'8px 16px',borderRadius:'var(--radius)',fontSize:'13px',cursor:'pointer',fontWeight:'500'}}>Supprimer ce compte</button></div></div></div>}

      {/* Modal célébration "Passer en Financé" — saisie unique des règles funded */}
      {promoteModal && (() => {
        const firm = firms.find(f=>f.id===promoteModal.firmId)
        const acct = firm?.accounts.find(a=>a.id===promoteModal.acctId)
        if(!acct || !firm) return null
        const isOneTime = acct.payment_mode === 'onetime'
        return (
          <div onClick={()=>setPromoteModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',overflowY:'auto'}}>
            <div onClick={e=>e.stopPropagation()} style={{...S.card,padding:'28px',width:'500px',maxWidth:'100%',boxShadow:'0 30px 80px rgba(0,0,0,0.6)',position:'relative',overflow:'hidden'}}>
              {/* Halo de fond */}
              <div style={{position:'absolute',inset:0,opacity:0.6,background:'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(29,184,122,0.22), transparent 60%)',pointerEvents:'none'}} />
              <div style={{position:'relative'}}>
                {/* Header célébration */}
                <div style={{textAlign:'center',marginBottom:'22px'}}>
                  <div style={{fontSize:48,marginBottom:8,animation:'qtCelebrate 1.2s ease-out'}}>🎉</div>
                  <h2 style={{fontSize:22,fontWeight:800,marginBottom:6,letterSpacing:'-0.01em'}}>Félicitations !</h2>
                  <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.55,margin:0}}>
                    Tu as passé le challenge sur <strong style={{color:'var(--text)'}}>{firm.name}</strong> · Plan <strong style={{color:'var(--text)'}}>{(acct.plan_size||'').toUpperCase()}</strong>.<br/>
                    Configure les règles de ton compte financé :
                  </p>
                </div>

                {/* Renommer le compte (ex: test-0001 → Pro-001) */}
                <div style={{marginBottom:'12px'}}>
                  <label style={S.label}>Nouveau nom du compte (optionnel)<TooltipIcon text="C'est le moment idéal pour renommer ton compte selon sa nouvelle vie. Ex : test-0001 → Pro-001, Challenge-A → Live-A, etc. Laisse vide pour garder le nom actuel." maxWidth={320} /></label>
                  <input
                    type="text"
                    value={promoteForm.newName}
                    onChange={e=>setPromoteForm(p=>({...p,newName:e.target.value}))}
                    placeholder={acct.name?`Actuel : ${acct.name}`:'ex : Pro-001, Live-NQ, Funded #1...'}
                    style={S.input}
                  />
                </div>

                {/* Date activation + frais activation (si monthly) */}
                <div style={{display:'grid',gridTemplateColumns:isOneTime?'1fr':'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                  <div>
                    <label style={S.label}>Date d'activation</label>
                    <input type="date" value={promoteForm.activationDate} onChange={e=>setPromoteForm(p=>({...p,activationDate:e.target.value}))} style={S.input} />
                  </div>
                  {!isOneTime && (
                    <div>
                      <label style={S.label}>Frais d'activation ($)</label>
                      <input type="number" value={promoteForm.activationFee} onChange={e=>setPromoteForm(p=>({...p,activationFee:e.target.value}))} placeholder="ex : 145" style={S.input} />
                    </div>
                  )}
                </div>

                {isOneTime && (
                  <div style={{padding:'8px 12px',marginBottom:'12px',background:'rgba(45,111,255,0.08)',border:'0.5px solid rgba(45,111,255,0.25)',borderRadius:'var(--radius)',fontSize:11,color:'var(--text3)'}}>
                    💎 Paiement one-time → aucun frais d'activation à payer.
                  </div>
                )}

                {/* 4 règles funded */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
                  <div>
                    <label style={S.label}>Objectif payout ($)</label>
                    <input type="number" step="0.01" value={promoteForm.payoutTarget} onChange={e=>setPromoteForm(p=>({...p,payoutTarget:e.target.value}))} placeholder="ex : 53000" style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Jours de trading min</label>
                    <input type="number" min="0" value={promoteForm.minTradingDays} onChange={e=>setPromoteForm(p=>({...p,minTradingDays:e.target.value}))} placeholder="ex : 10" style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Profit min / jour ($)<TooltipIcon text="Profit minimum sur 1 journée pour qu'elle compte comme jour validé dans le décompte." /></label>
                    <input type="number" min="0" step="1" value={promoteForm.minDailyProfit} onChange={e=>setPromoteForm(p=>({...p,minDailyProfit:e.target.value}))} placeholder="ex : 150" style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Profit split<TooltipIcon text="Pourcentage du profit que TU touches lors d'un payout. Le reste va à la PropFirm." maxWidth={300} /></label>
                    <select value={promoteForm.profitSplit} onChange={e=>setPromoteForm(p=>({...p,profitSplit:e.target.value}))} style={S.input}>
                      <option value="100">100 / 0</option>
                      <option value="90">90 / 10</option>
                      <option value="80">80 / 20</option>
                      <option value="70">70 / 30</option>
                    </select>
                  </div>
                </div>

                {/* Info reset + arrêt mensualités */}
                <div style={{padding:'10px 12px',marginBottom:'18px',background:'rgba(29,184,122,0.08)',border:'0.5px solid rgba(29,184,122,0.3)',borderRadius:'var(--radius)',fontSize:12,color:'var(--text2)',lineHeight:1.55}}>
                  ✅ <strong>La balance du journal sera réinitialisée à 0</strong> à partir de la date d'activation.{!isOneTime && <> Les <strong>mensualités s'arrêtent</strong> à partir de maintenant.</>}
                </div>

                {/* Boutons */}
                <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
                  <button onClick={()=>setPromoteModal(null)} style={S.btnGhost}>Annuler</button>
                  <button onClick={savePromote} style={{padding:'11px 22px',fontSize:13,fontWeight:700,background:'linear-gradient(135deg, #1db87a 0%, #2ed694 100%)',border:'none',color:'#fff',borderRadius:'var(--radius)',cursor:'pointer',fontFamily:'inherit',boxShadow:'0 6px 18px rgba(29,184,122,0.4)',display:'flex',alignItems:'center',gap:'8px'}}>
                    🎉 Valider le passage
                  </button>
                </div>
              </div>
            </div>
            <style>{`@keyframes qtCelebrate { 0%{transform:scale(0.5) rotate(-15deg);opacity:0} 60%{transform:scale(1.2) rotate(8deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }`}</style>
          </div>
        )
      })()}

      {/* Modal "💔 Compte échoué" — message de motivation aléatoire + confirmation */}
      {failModal && (() => {
        const firm = firms.find(f=>f.id===failModal.firmId)
        const acct = firm?.accounts.find(a=>a.id===failModal.acctId)
        if(!acct || !firm) return null
        const isChallenge = acct.status === 'Challenge'
        return (
          <div onClick={()=>setFailModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(4px)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',overflowY:'auto'}}>
            <div onClick={e=>e.stopPropagation()} style={{...S.card,padding:'28px',width:'460px',maxWidth:'100%',boxShadow:'0 30px 80px rgba(0,0,0,0.6)',position:'relative',overflow:'hidden'}}>
              {/* Halo rouge atténué */}
              <div style={{position:'absolute',inset:0,opacity:0.5,background:'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(232,80,74,0.15), transparent 60%)',pointerEvents:'none'}} />
              <div style={{position:'relative'}}>
                {/* Header */}
                <div style={{textAlign:'center',marginBottom:'18px'}}>
                  <div style={{fontSize:42,marginBottom:6}}>💔</div>
                  <h2 style={{fontSize:20,fontWeight:800,marginBottom:4,letterSpacing:'-0.01em'}}>
                    {isChallenge ? 'Challenge échoué' : 'Compte blown'}
                  </h2>
                  <p style={{fontSize:12,color:'var(--text3)',margin:0}}>
                    <strong style={{color:'var(--text2)'}}>{firm.name}</strong> · Plan <strong style={{color:'var(--text2)'}}>{(acct.plan_size||'').toUpperCase()}</strong>
                    {acct.name && <> · {acct.name}</>}
                  </p>
                </div>

                {/* Message de motivation aléatoire */}
                <div style={{
                  padding:'16px 18px', marginBottom:'18px',
                  background:'var(--surface2)',
                  border:'1px solid rgba(45,111,255,0.25)',
                  borderLeft:'3px solid var(--blue-light)',
                  borderRadius:'var(--radius)',
                  fontSize:13, color:'var(--text)',
                  lineHeight:1.65, fontStyle:'italic',
                }}>
                  {failModal.message}
                </div>

                {/* Note d'info */}
                <div style={{padding:'8px 12px',marginBottom:'18px',background:'rgba(250,199,117,0.07)',border:'0.5px solid rgba(250,199,117,0.25)',borderRadius:'var(--radius)',fontSize:11,color:'var(--text3)',lineHeight:1.5}}>
                  ⚠️ Le compte sera marqué <strong>Échoué</strong>. Tu pourras toujours consulter son historique de trades et payouts dans le journal — il sera juste affiché en grisé dans les listes.
                </div>

                {/* Boutons */}
                <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
                  <button onClick={()=>setFailModal(null)} style={S.btnGhost}>Annuler</button>
                  <button onClick={confirmFail} style={{padding:'10px 18px',fontSize:12,fontWeight:600,background:'rgba(232,80,74,0.10)',color:'#e8504a',border:'1px solid #e8504a',borderRadius:'var(--radius)',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'6px'}}>
                    💔 Confirmer l'échec
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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
          onStartTutorial={()=>{setShowOnboarding(false);setShowTutorial(true)}}
        />
      )}

      {/* Tutoriel interactif — détecte automatiquement les actions de l'user */}
      {showTutorial && (
        <Tutorial
          onClose={()=>setShowTutorial(false)}
          onPageChange={setPage}
          state={{
            page,
            firmsCount: firms.length,
            accountsCount: accts.length,
            tradesCount,
            payoutsCount: firms.reduce((s,f)=>s+(f.accounts||[]).reduce((ss,a)=>ss+(a.payouts||[]).length,0),0),
            financedCount: accts.filter(a=>a.status==='Financé').length,
            firmDrawerOpen: !!firmDrawer,
            acctDrawerOpen: !!acctDrawer,
            acctModalOpen: !!acctModal,
            firmModalOpen: !!firmModal,
            payoutFormOpen: !!payoutForm,
          }}
        />
      )}

      {toast&&<div className="toast" style={{position:'fixed',bottom:'24px',right:'24px',background:'var(--surface3)',color:'var(--text)',border:'0.5px solid var(--border2)',padding:'10px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:'500',zIndex:999,boxShadow:'0 8px 24px rgba(0,0,0,0.3)'}}>{toast}</div>}
    </div>
  )
}
