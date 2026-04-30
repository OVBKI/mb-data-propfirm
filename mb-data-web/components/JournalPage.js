'use client'
import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

function fmtMoney(n, dec=2){
  const v = Number(n)||0
  return (v>=0?'+':'') + v.toFixed(dec) + ' $'
}
function todayISO(){ return new Date().toISOString().slice(0,10) }

const card = { background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-lg)' }
const inputS = { width:'100%', padding:'9px 11px', fontSize:'13px', border:'0.5px solid var(--border2)', borderRadius:'var(--radius)', background:'var(--surface2)', color:'var(--text)', outline:'none' }
const labelS = { fontSize:'11px', fontWeight:'600', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:'5px' }
const btnPrimary = { padding:'8px 18px', fontSize:'13px', fontWeight:'600', background:'var(--blue)', color:'#fff', border:'none', borderRadius:'var(--radius)', cursor:'pointer' }
const btnGhost = { padding:'7px 14px', fontSize:'12px', background:'transparent', border:'0.5px solid var(--border2)', color:'var(--text2)', borderRadius:'var(--radius)', cursor:'pointer' }
const chipBtn = (active)=>({ padding:'6px 14px', fontSize:'12px', cursor:'pointer', borderRadius:'99px', border:'0.5px solid var(--border2)', fontFamily:'inherit', fontWeight:'500', background:active?'var(--blue)':'transparent', color:active?'#fff':'var(--text2)' })

export default function JournalPage({ firms, user, getFirmLogo, showToast }){
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState('all') // 'all' | firmId | `${firmId}:${accountId}`
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selDay, setSelDay] = useState(null)

  // Modal d'ajout / édition
  const [entryModal, setEntryModal] = useState(null) // null | { entry?, defaultDate? }
  const [form, setForm] = useState({ accountId:'', date:todayISO(), pnl:'', instrument:'', side:'', notes:'' })

  // Tous les comptes plats
  const allAccounts = useMemo(()=>{
    return firms.flatMap(f => (f.accounts||[]).map(a => ({
      ...a,
      firmId: f.id,
      firmName: f.name,
      firmColor: f.color,
    })))
  },[firms])

  const [loadError, setLoadError] = useState('')
  async function loadEntries(){
    setLoading(true);setLoadError('')
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if(error){
      console.error('[journal load]', error)
      // 42P01 = relation does not exist (table manquante)
      if(error.code==='42P01' || /does not exist/i.test(error.message||'')){
        setLoadError('table_missing')
      } else {
        setLoadError(error.message || 'Erreur chargement journal')
      }
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }

  useEffect(()=>{
    if(user?.id) loadEntries()
  },[user?.id])

  // Décore les entries avec les infos firme/compte
  const decoratedEntries = useMemo(()=>{
    return entries.map(e=>{
      const acc = allAccounts.find(a => a.id === e.account_id)
      return {
        ...e,
        _firmId: acc?.firmId,
        _firmName: acc?.firmName || 'Compte supprimé',
        _firmColor: acc?.firmColor || '#565e78',
        _accountLabel: acc ? `${acc.firmName} · ${acc.buy_date}` : 'Compte supprimé',
      }
    })
  },[entries, allAccounts])

  // Filtre par scope
  const filteredEntries = useMemo(()=>{
    if(scope === 'all') return decoratedEntries
    if(scope.includes(':')){
      const [, acctId] = scope.split(':')
      return decoratedEntries.filter(e => e.account_id === acctId)
    }
    return decoratedEntries.filter(e => e._firmId === scope)
  },[decoratedEntries, scope])

  // PnL agrégé par jour
  const dailyPnL = useMemo(()=>{
    const map = {}
    filteredEntries.forEach(e=>{
      if(!map[e.date]) map[e.date] = { pnl:0, count:0, win:0, loss:0, entries:[] }
      const v = Number(e.pnl)||0
      map[e.date].pnl += v
      map[e.date].count += 1
      if(v>0) map[e.date].win += 1
      else if(v<0) map[e.date].loss += 1
      map[e.date].entries.push(e)
    })
    return map
  },[filteredEntries])

  // Stats
  const stats = useMemo(()=>{
    const total = filteredEntries.length
    const totalPnl = filteredEntries.reduce((s,e)=>s+(Number(e.pnl)||0), 0)
    const winners = filteredEntries.filter(e => Number(e.pnl)>0)
    const losers = filteredEntries.filter(e => Number(e.pnl)<0)
    const wr = total ? Math.round(winners.length/total*100) : 0
    const avgWin = winners.length ? winners.reduce((s,e)=>s+Number(e.pnl),0)/winners.length : 0
    const avgLoss = losers.length ? losers.reduce((s,e)=>s+Number(e.pnl),0)/losers.length : 0
    const monthPrefix = `${calYear}-${String(calMonth+1).padStart(2,'0')}`
    let monthPnl = 0, monthTrades = 0, monthDays = new Set()
    Object.entries(dailyPnL).forEach(([d, v])=>{
      if(d.startsWith(monthPrefix)){
        monthPnl += v.pnl
        monthTrades += v.count
        monthDays.add(d)
      }
    })
    return { total, totalPnl, winners:winners.length, losers:losers.length, wr, avgWin, avgLoss, monthPnl, monthTrades, monthDays:monthDays.size }
  },[filteredEntries, dailyPnL, calYear, calMonth])

  // Calendrier
  const calDays = useMemo(()=>{
    const firstDay = new Date(calYear, calMonth, 1)
    let sdow = firstDay.getDay(); sdow = sdow===0?6:sdow-1
    const dim = new Date(calYear, calMonth+1, 0).getDate()
    const dipm = new Date(calYear, calMonth, 0).getDate()
    const todayStr = todayISO()
    const out = []
    for(let i=sdow-1;i>=0;i--){
      const d = dipm-i, m2 = calMonth===0?11:calMonth-1, y2 = calMonth===0?calYear-1:calYear
      out.push({ day:d, dateStr:`${y2}-${String(m2+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, other:true })
    }
    for(let d=1;d<=dim;d++){
      const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      out.push({ day:d, dateStr:ds, other:false, today:ds===todayStr })
    }
    const rem = (sdow+dim)%7===0 ? 0 : 7-(sdow+dim)%7
    for(let d=1;d<=rem;d++){
      const m3 = calMonth===11?0:calMonth+1, y3 = calMonth===11?calYear+1:calYear
      out.push({ day:d, dateStr:`${y3}-${String(m3+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, other:true })
    }
    return out
  },[calYear, calMonth])

  const dayEntries = useMemo(()=>{
    if(!selDay) return []
    return filteredEntries.filter(e => e.date === selDay)
  },[filteredEntries, selDay])

  // === CRUD ===
  function openNewEntry(defaultDate){
    const acctId = allAccounts[0]?.id || ''
    setForm({ accountId:acctId, date:defaultDate||todayISO(), pnl:'', instrument:'', side:'', notes:'' })
    setEntryModal({ defaultDate })
  }
  function openEditEntry(e){
    setForm({ accountId:e.account_id, date:e.date, pnl:String(e.pnl), instrument:e.instrument||'', side:e.side||'', notes:e.notes||'' })
    setEntryModal({ entry:e })
  }
  async function saveEntry(){
    if(!form.accountId){ showToast?.('Sélectionne un compte'); return }
    if(!form.date){ showToast?.('Date requise'); return }
    if(form.pnl===''||isNaN(parseFloat(form.pnl))){ showToast?.('PnL requis (nombre)'); return }
    const payload = {
      user_id: user.id,
      account_id: form.accountId,
      date: form.date,
      pnl: parseFloat(form.pnl),
      instrument: form.instrument.trim(),
      side: form.side,
      notes: form.notes.trim(),
    }
    let res
    if(entryModal?.entry){
      res = await supabase.from('journal_entries').update(payload).eq('id', entryModal.entry.id)
    } else {
      res = await supabase.from('journal_entries').insert(payload)
    }
    if(res.error){
      console.error('[journal save]', res.error)
      // Affiche le vrai message Supabase pour diagnostiquer (table manquante, RLS, etc.)
      const msg = res.error.code==='42P01' || /does not exist/i.test(res.error.message||'')
        ? '⚠ Table journal_entries manquante dans Supabase'
        : (res.error.message || 'Erreur enregistrement')
      showToast?.(msg)
      return
    }
    setEntryModal(null)
    showToast?.(entryModal?.entry ? 'Trade modifié ✓' : 'Trade ajouté ✓')
    await loadEntries()
  }
  async function deleteEntry(id){
    if(!confirm('Supprimer ce trade ?')) return
    const { error } = await supabase.from('journal_entries').delete().eq('id', id)
    if(error){ showToast?.('Erreur suppression'); return }
    showToast?.('Trade supprimé')
    await loadEntries()
  }

  // Export CSV des trades filtrés
  function exportJournalCSV(){
    const rows = [['Date','Firme','Compte','Instrument','Side','PnL','Notes']]
    filteredEntries.forEach(e=>{
      rows.push([e.date, e._firmName, e._accountLabel, e.instrument||'', e.side||'', String(e.pnl), e.notes||''])
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv)
    a.download = `MB_Journal_${todayISO()}.csv`
    a.click()
    showToast?.('Export CSV ✓')
  }

  const monthLabel = MONTHS_FR[calMonth] + ' ' + calYear
  const noAccounts = allAccounts.length === 0

  return (
    <div className="page-pad" style={{maxWidth:'1160px',margin:'0 auto',padding:'28px 24px 60px'}}>

      {/* Header */}
      <div className="page-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:'600',marginBottom:'4px'}}>📔 Journal de trading</h1>
          <div style={{fontSize:'12px',color:'var(--text3)'}}>
            Saisie manuelle de tes trades · {entries.length} trade{entries.length>1?'s':''} enregistré{entries.length>1?'s':''}
          </div>
        </div>
        <div className="page-header-actions" style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <button onClick={exportJournalCSV} disabled={!filteredEntries.length} style={{...btnGhost,opacity:filteredEntries.length?1:0.5}}>↓ CSV</button>
          <button onClick={()=>openNewEntry()} disabled={noAccounts} style={{...btnPrimary,opacity:noAccounts?0.5:1}}>+ Ajouter trade</button>
        </div>
      </div>

      {noAccounts && (
        <div style={{...card,padding:'24px',marginBottom:'16px',background:'rgba(250,199,117,0.07)',borderColor:'var(--amber-text)'}}>
          <div style={{fontSize:'14px',fontWeight:'600',color:'var(--amber-text)',marginBottom:'4px'}}>⚠ Aucun compte trouvé</div>
          <div style={{fontSize:'12px',color:'var(--text2)'}}>Va dans <strong>Tableau de bord</strong> et ajoute au moins une PropFirm + un compte avant de pouvoir saisir un trade.</div>
        </div>
      )}

      {loadError === 'table_missing' && (
        <div style={{...card,padding:'20px',marginBottom:'16px',background:'var(--red-bg)',borderColor:'var(--red)'}}>
          <div style={{fontSize:'14px',fontWeight:'700',color:'var(--red-text)',marginBottom:'8px'}}>⚠ Table Supabase manquante</div>
          <div style={{fontSize:'12px',color:'var(--text2)',lineHeight:1.5,marginBottom:'12px'}}>
            La table <code style={{background:'var(--surface3)',padding:'1px 6px',borderRadius:'4px'}}>journal_entries</code> n'existe pas encore dans ta base Supabase.
            Va dans <strong>Supabase → SQL Editor</strong> et exécute le bloc SQL suivant :
          </div>
          <pre style={{background:'var(--surface3)',padding:'12px',borderRadius:'var(--radius)',fontSize:'11px',overflow:'auto',color:'var(--text2)',lineHeight:1.5,fontFamily:'monospace',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{`create table if not exists journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  account_id uuid references accounts(id) on delete cascade not null,
  date date not null,
  pnl numeric(12,2) not null,
  instrument text default '',
  side text default '',
  notes text default '',
  created_at timestamptz default now()
);
alter table journal_entries enable row level security;
create policy "Users manage own journal" on journal_entries
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create index if not exists journal_entries_user_id_idx    on journal_entries(user_id);
create index if not exists journal_entries_account_id_idx on journal_entries(account_id);
create index if not exists journal_entries_date_idx       on journal_entries(date);`}</pre>
          <div style={{display:'flex',gap:'8px',marginTop:'12px',flexWrap:'wrap'}}>
            <button onClick={loadEntries} style={btnPrimary}>↻ Réessayer</button>
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={btnGhost}>Ouvrir Supabase ↗</a>
          </div>
        </div>
      )}

      {loadError && loadError !== 'table_missing' && (
        <div style={{...card,padding:'16px',marginBottom:'16px',background:'var(--red-bg)',borderColor:'var(--red)'}}>
          <div style={{fontSize:'13px',fontWeight:'600',color:'var(--red-text)',marginBottom:'4px'}}>Erreur de chargement</div>
          <div style={{fontSize:'12px',color:'var(--text2)',fontFamily:'monospace'}}>{loadError}</div>
          <button onClick={loadEntries} style={{...btnPrimary,marginTop:'10px'}}>↻ Réessayer</button>
        </div>
      )}

      {/* Filtre scope */}
      <div style={{...card, padding:'14px 18px', marginBottom:'16px'}}>
        <div style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'10px'}}>Filtrer par</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}}>
          <button onClick={()=>setScope('all')} style={chipBtn(scope==='all')}>📊 Toutes les firmes</button>
          {firms.map(f=>{
            const accs = (f.accounts||[]).filter(a=>a.status!=='Échoué')
            if(!accs.length) return null
            return (
              <div key={f.id} style={{display:'inline-flex',gap:'4px',alignItems:'center',padding:'2px 4px 2px 6px',border:'0.5px solid var(--border)',borderRadius:'99px',background:scope===f.id||scope.startsWith(f.id+':')?'rgba(45,111,255,0.05)':'transparent'}}>
                <button onClick={()=>setScope(f.id)} style={{...chipBtn(scope===f.id), padding:'4px 10px'}}>
                  {getFirmLogo ? <span style={{display:'inline-flex',marginRight:'4px',verticalAlign:'middle'}}>{getFirmLogo(f.name, f.color, 16)}</span> : null}
                  {f.name}
                </button>
                {accs.map(a=>{
                  const v = `${f.id}:${a.id}`
                  return (
                    <button key={a.id} onClick={()=>setScope(v)} title={`Compte du ${a.buy_date}`} style={{...chipBtn(scope===v), padding:'4px 8px', fontSize:'11px'}}>
                      {a.buy_date}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div style={{...card,padding:'60px',textAlign:'center',color:'var(--text3)'}}>⏳ Chargement…</div>
      ) : (
      <>
        {/* Stats */}
        <div className="stats-5" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'20px'}}>
          {[
            { l:'PnL filtré', v:fmtMoney(stats.totalPnl), c:stats.totalPnl>=0?'var(--green)':'var(--red)' },
            { l:`PnL ${monthLabel}`, v:fmtMoney(stats.monthPnl), c:stats.monthPnl>=0?'var(--green)':'var(--red)' },
            { l:'Win rate', v:stats.total?(stats.wr+'%'):'—', c:stats.wr>=50?'var(--green)':'var(--amber-text)' },
            { l:'Trades', v:stats.total, c:'var(--text)' },
            { l:'Jours tradés (mois)', v:stats.monthDays, c:'var(--text)' },
          ].map((k,i)=>(
            <div key={i} style={{...card,padding:'16px'}}>
              <div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'8px'}}>{k.l}</div>
              <div style={{fontSize:'20px',fontWeight:'600',color:k.c}}>{k.v}</div>
            </div>
          ))}
        </div>

        {/* Calendrier + détails */}
        <div className="grid-1-320" style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'16px',alignItems:'start'}}>

          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px',gap:'8px',flexWrap:'wrap'}}>
              <div style={{fontSize:'15px',fontWeight:'600'}}>Calendrier PnL — {monthLabel}</div>
              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <button onClick={()=>{const d=new Date(calYear,calMonth-1);setCalMonth(d.getMonth());setCalYear(d.getFullYear())}} style={btnGhost}>‹</button>
                <button onClick={()=>{setCalMonth(new Date().getMonth());setCalYear(new Date().getFullYear());setSelDay(null)}} style={btnGhost}>Aujourd'hui</button>
                <button onClick={()=>{const d=new Date(calYear,calMonth+1);setCalMonth(d.getMonth());setCalYear(d.getFullYear())}} style={btnGhost}>›</button>
              </div>
            </div>

            <div style={{...card, overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'var(--surface2)',borderBottom:'0.5px solid var(--border)'}}>
                {DAYS_FR.map(d=>(
                  <div key={d} style={{padding:'8px 0',textAlign:'center',fontSize:'10px',fontWeight:'600',color:'var(--text3)',textTransform:'uppercase'}}>{d}</div>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
                {calDays.map((day, i)=>{
                  const v = dailyPnL[day.dateStr]
                  const pnl = v?.pnl || 0
                  const isSel = day.dateStr === selDay
                  let bg = 'transparent'
                  if(v && pnl > 0) bg = 'rgba(29,184,122,0.10)'
                  else if(v && pnl < 0) bg = 'rgba(232,80,74,0.10)'
                  if(isSel) bg = 'rgba(45,111,255,0.12)'
                  return (
                    <div key={i}
                      className="cal-cell"
                      onClick={()=>{
                        // clic sur jour : sélectionne pour voir détails (ou ouvre form si vide)
                        if(v) setSelDay(day.dateStr)
                        else if(!day.other && !noAccounts){ setSelDay(null); openNewEntry(day.dateStr) }
                      }}
                      style={{
                        minHeight:'82px', padding:'6px 7px',
                        borderRight: (i+1)%7===0 ? 'none' : '0.5px solid var(--border)',
                        borderBottom: '0.5px solid var(--border)',
                        cursor: (day.other||noAccounts) ? 'default' : 'pointer',
                        opacity: day.other ? 0.3 : 1,
                        background: bg,
                        outline: isSel ? '2px solid var(--blue)' : 'none',
                        outlineOffset: '-2px',
                      }}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                        <span className="cal-cell-num" style={{
                          fontSize:'11px',
                          width:'20px',height:'20px',display:'inline-flex',alignItems:'center',justifyContent:'center',
                          borderRadius:'50%',
                          background: day.today ? 'var(--blue)' : 'transparent',
                          color: day.today ? '#fff' : 'var(--text2)',
                        }}>{day.day}</span>
                      </div>
                      {v ? (
                        <>
                          <div style={{
                            fontSize:'12px', fontWeight:'700',
                            color: pnl>=0 ? 'var(--green)' : 'var(--red)',
                            lineHeight: 1.2,
                          }}>{fmtMoney(pnl, 0)}</div>
                          <div style={{fontSize:'10px',color:'var(--text3)',marginTop:'2px'}}>
                            {v.count} trade{v.count>1?'s':''}
                          </div>
                        </>
                      ) : (
                        !day.other && !noAccounts && (
                          <div style={{fontSize:'10px',color:'var(--text3)',opacity:0.6}}>+ Ajouter</div>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Panneau jour sélectionné */}
          <div style={{...card, padding:'18px', minHeight:'300px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px',gap:'8px',flexWrap:'wrap'}}>
              <div style={{fontSize:'13px',fontWeight:'600'}}>
                {selDay
                  ? new Date(selDay+'T00:00:00').toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'})
                  : 'Sélectionnez un jour'}
              </div>
              {selDay && !noAccounts && (
                <button onClick={()=>openNewEntry(selDay)} style={{...btnGhost,padding:'4px 10px',fontSize:'11px'}}>+ Trade</button>
              )}
            </div>

            {!selDay && (
              <div style={{color:'var(--text3)',fontSize:'12px',padding:'12px 0'}}>
                Cliquez sur un jour pour voir les trades, ou sur un jour vide pour en ajouter un.
              </div>
            )}

            {selDay && dayEntries.length===0 && (
              <div style={{color:'var(--text3)',fontSize:'12px',padding:'12px 0'}}>Aucun trade ce jour.</div>
            )}

            {selDay && dayEntries.length>0 && (() => {
              const dayPnl = dayEntries.reduce((s,e)=>s+(Number(e.pnl)||0),0)
              const dayWin = dayEntries.filter(e=>Number(e.pnl)>0).length
              const dayLoss = dayEntries.filter(e=>Number(e.pnl)<0).length
              return (
                <>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'14px'}}>
                    <div style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:'10px 12px'}}>
                      <div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'3px'}}>PnL du jour</div>
                      <div style={{fontSize:'15px',fontWeight:'700',color:dayPnl>=0?'var(--green)':'var(--red)'}}>{fmtMoney(dayPnl)}</div>
                    </div>
                    <div style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:'10px 12px'}}>
                      <div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'3px'}}>W / L</div>
                      <div style={{fontSize:'15px',fontWeight:'700'}}>
                        <span style={{color:'var(--green)'}}>{dayWin}</span>
                        <span style={{color:'var(--text3)'}}> / </span>
                        <span style={{color:'var(--red)'}}>{dayLoss}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{maxHeight:'420px',overflowY:'auto'}}>
                    {dayEntries.map((e, i)=>{
                      const pnl = Number(e.pnl)||0
                      return (
                        <div key={e.id} style={{padding:'10px 12px',background:'var(--surface2)',borderRadius:'var(--radius)',marginBottom:'6px'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px',gap:'6px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                              {e.instrument && <span style={{fontWeight:'600',fontSize:'12px'}}>{e.instrument}</span>}
                              {e.side && <span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'99px',background:'var(--surface3)',color:'var(--text2)'}}>{e.side}</span>}
                            </div>
                            <span style={{fontSize:'13px',fontWeight:'700',color:pnl>=0?'var(--green)':pnl<0?'var(--red)':'var(--text3)'}}>{fmtMoney(pnl)}</span>
                          </div>
                          {scope==='all' && (
                            <div style={{fontSize:'10px',color:'var(--text3)',marginBottom:e.notes?'4px':0}}>{e._accountLabel}</div>
                          )}
                          {e.notes && <div style={{fontSize:'11px',color:'var(--text2)',marginTop:'4px',fontStyle:'italic'}}>{e.notes}</div>}
                          <div style={{display:'flex',gap:'6px',marginTop:'6px'}}>
                            <button onClick={()=>openEditEntry(e)} style={{...btnGhost,padding:'3px 8px',fontSize:'10px'}}>✏ Modifier</button>
                            <button onClick={()=>deleteEntry(e.id)} style={{...btnGhost,padding:'3px 8px',fontSize:'10px',color:'var(--red-text)'}}>✕ Supprimer</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        {/* Stats avancées */}
        {stats.total>0 && (
          <div className="stats-3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginTop:'20px'}}>
            <div style={{...card, padding:'16px'}}>
              <div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'8px'}}>Gain moyen</div>
              <div style={{fontSize:'18px',fontWeight:'600',color:'var(--green)'}}>{fmtMoney(stats.avgWin)}</div>
            </div>
            <div style={{...card, padding:'16px'}}>
              <div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'8px'}}>Perte moyenne</div>
              <div style={{fontSize:'18px',fontWeight:'600',color:'var(--red)'}}>{fmtMoney(stats.avgLoss)}</div>
            </div>
            <div style={{...card, padding:'16px'}}>
              <div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'8px'}}>Ratio R</div>
              <div style={{fontSize:'18px',fontWeight:'600'}}>
                {stats.avgLoss !== 0
                  ? (Math.abs(stats.avgWin / stats.avgLoss)).toFixed(2)
                  : '—'}
              </div>
            </div>
          </div>
        )}
      </>
      )}

      {/* Modal ajout / édition */}
      {entryModal && (
        <div onClick={()=>setEntryModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'12px',overflowY:'auto'}}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{...card,padding:'28px',width:'460px',maxWidth:'100%',boxShadow:'0 24px 64px rgba(0,0,0,0.5)'}}>
            <h3 style={{fontSize:'17px',fontWeight:'600',marginBottom:'20px'}}>
              {entryModal?.entry ? 'Modifier le trade' : 'Nouveau trade'}
            </h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <div style={{gridColumn:'1/-1'}}>
                <label style={labelS}>Compte</label>
                <select value={form.accountId} onChange={e=>setForm(p=>({...p,accountId:e.target.value}))} style={inputS}>
                  <option value="">— Sélectionner —</option>
                  {firms.map(f=>(
                    <optgroup key={f.id} label={f.name}>
                      {(f.accounts||[]).filter(a=>a.status!=='Échoué').map(a=>(
                        <option key={a.id} value={a.id}>
                          {f.name} · {a.buy_date} ({a.status})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelS}>Date</label>
                <input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={inputS} />
              </div>
              <div>
                <label style={labelS}>PnL ($)</label>
                <input type="number" step="0.01" value={form.pnl} onChange={e=>setForm(p=>({...p,pnl:e.target.value}))} placeholder="ex : 250  ou  -125" style={inputS} autoFocus />
              </div>
              <div>
                <label style={labelS}>Instrument</label>
                <input list="instrSugg" value={form.instrument} onChange={e=>setForm(p=>({...p,instrument:e.target.value}))} placeholder="ES, NQ, MNQ, MES, GC..." style={inputS} />
                <datalist id="instrSugg">
                  {['ES','NQ','MNQ','MES','RTY','M2K','YM','MYM','GC','MGC','SI','CL','MCL','NG','6E','6B','6J','BTC','MBT'].map(s=><option key={s} value={s} />)}
                </datalist>
              </div>
              <div>
                <label style={labelS}>Side</label>
                <select value={form.side} onChange={e=>setForm(p=>({...p,side:e.target.value}))} style={inputS}>
                  <option value="">—</option>
                  <option value="Long">Long</option>
                  <option value="Short">Short</option>
                </select>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={labelS}>Notes (setup, émotion, erreur…)</label>
                <textarea rows={3} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Optionnel" style={{...inputS,resize:'vertical',fontFamily:'inherit'}} />
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',justifyContent:'space-between',alignItems:'center',marginTop:'20px'}}>
              <div>
                {entryModal?.entry && (
                  <button onClick={()=>{deleteEntry(entryModal.entry.id);setEntryModal(null)}} style={{...btnGhost,color:'var(--red-text)',borderColor:'var(--red-bg)'}}>Supprimer</button>
                )}
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={()=>setEntryModal(null)} style={btnGhost}>Annuler</button>
                <button onClick={saveEntry} style={btnPrimary}>{entryModal?.entry ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
