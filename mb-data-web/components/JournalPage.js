'use client'
import { useState, useMemo } from 'react'

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

// Détecte le PnL d'un trade quel que soit le format renvoyé par ProjectX
function tPnl(t){ return Number(t.profit ?? t.pnl ?? t.realizedPnl ?? t.netPnl ?? 0) || 0 }
// Détecte la date d'un trade (creationTimestamp, fillTimestamp, time...)
function tDate(t){
  const ts = t.creationTimestamp || t.fillTimestamp || t.closeTimestamp || t.time || t.date
  if(!ts) return null
  return String(ts).slice(0,10) // 'YYYY-MM-DD'
}
// Identifiant de compte ProjectX (peut être accountId, account, etc.)
function tAccountId(t){ return t.accountId ?? t.account_id ?? t.account ?? null }
function tAccountName(t){ return t.accountName ?? t.account_name ?? null }

function fmtMoney(n, dec=2){
  const v = Number(n)||0
  return (v>=0?'+':'') + v.toFixed(dec) + ' $'
}

export default function JournalPage({ firms, pxSessions, getFirmLogo, FIRM_COLORS }){
  const [scope, setScope] = useState('all')      // 'all' | firmId | `${firmId}:${accountId}`
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selDay, setSelDay] = useState(null)

  // Construit la liste plate de tous les trades + identifiants
  const allTrades = useMemo(()=>{
    const out = []
    Object.entries(pxSessions||{}).forEach(([firmId, sess])=>{
      if(!sess?.connected) return
      const firm = firms.find(f=>f.id===firmId)
      const trades = sess.trades || []
      trades.forEach(t=>{
        out.push({
          ...t,
          _firmId: firmId,
          _firmName: firm?.name || 'PropFirm',
          _firmColor: firm?.color || '#2d6fff',
          _date: tDate(t),
          _pnl: tPnl(t),
          _acctId: tAccountId(t),
          _acctName: tAccountName(t),
        })
      })
    })
    return out.filter(t=>t._date) // dropper les trades sans date
  },[firms, pxSessions])

  // Liste des comptes (selon trades) groupés par firme — pour le sélecteur
  const accountsByFirm = useMemo(()=>{
    const map = {}
    allTrades.forEach(t=>{
      if(!t._acctId) return
      if(!map[t._firmId]) map[t._firmId] = { firmName: t._firmName, color: t._firmColor, accounts: new Map() }
      if(!map[t._firmId].accounts.has(t._acctId)){
        map[t._firmId].accounts.set(t._acctId, { id: t._acctId, name: t._acctName || `Compte ${String(t._acctId).slice(-4)}` })
      }
    })
    return map
  },[allTrades])

  // Filtre selon le scope choisi
  const filteredTrades = useMemo(()=>{
    if(scope === 'all') return allTrades
    if(scope.includes(':')){
      const [firmId, acctId] = scope.split(':')
      return allTrades.filter(t=>t._firmId===firmId && String(t._acctId)===acctId)
    }
    return allTrades.filter(t=>t._firmId===scope)
  },[allTrades, scope])

  // PnL agrégé par jour (YYYY-MM-DD → { pnl, count, win, loss })
  const dailyPnL = useMemo(()=>{
    const map = {}
    filteredTrades.forEach(t=>{
      if(!map[t._date]) map[t._date] = { pnl:0, count:0, win:0, loss:0 }
      map[t._date].pnl += t._pnl
      map[t._date].count += 1
      if(t._pnl>0) map[t._date].win += 1
      else if(t._pnl<0) map[t._date].loss += 1
    })
    return map
  },[filteredTrades])

  // Stats globales (mois courant + total filtré)
  const stats = useMemo(()=>{
    const total = filteredTrades.length
    const totalPnl = filteredTrades.reduce((s,t)=>s+t._pnl,0)
    const winners = filteredTrades.filter(t=>t._pnl>0).length
    const losers = filteredTrades.filter(t=>t._pnl<0).length
    const wr = total ? Math.round(winners/total*100) : 0
    const avgWin = winners ? filteredTrades.filter(t=>t._pnl>0).reduce((s,t)=>s+t._pnl,0)/winners : 0
    const avgLoss = losers ? filteredTrades.filter(t=>t._pnl<0).reduce((s,t)=>s+t._pnl,0)/losers : 0
    // Mois courant
    const monthPrefix = `${calYear}-${String(calMonth+1).padStart(2,'0')}`
    let monthPnl = 0, monthTrades = 0, monthDaysTraded = new Set()
    Object.entries(dailyPnL).forEach(([d, v])=>{
      if(d.startsWith(monthPrefix)){
        monthPnl += v.pnl
        monthTrades += v.count
        monthDaysTraded.add(d)
      }
    })
    return { total, totalPnl, winners, losers, wr, avgWin, avgLoss, monthPnl, monthTrades, monthDays: monthDaysTraded.size }
  },[filteredTrades, dailyPnL, calYear, calMonth])

  // Construction de la grille du calendrier
  const calDays = useMemo(()=>{
    const firstDay = new Date(calYear, calMonth, 1)
    let sdow = firstDay.getDay(); sdow = sdow===0?6:sdow-1 // Lundi=0
    const dim = new Date(calYear, calMonth+1, 0).getDate()
    const dipm = new Date(calYear, calMonth, 0).getDate()
    const todayStr = new Date().toISOString().slice(0,10)
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

  // Trades du jour sélectionné
  const dayTrades = useMemo(()=>{
    if(!selDay) return []
    return filteredTrades.filter(t=>t._date===selDay).sort((a,b)=>{
      return String(a.creationTimestamp||'').localeCompare(String(b.creationTimestamp||''))
    })
  },[filteredTrades, selDay])

  // Styles
  const card = { background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-lg)' }
  const btn = (active)=>({ padding:'6px 14px', fontSize:'12px', cursor:'pointer', borderRadius:'99px', border:'0.5px solid var(--border2)', fontFamily:'inherit', fontWeight:'500', background:active?'var(--blue)':'transparent', color:active?'#fff':'var(--text2)' })
  const ghostBtn = { padding:'7px 14px', fontSize:'12px', background:'transparent', border:'0.5px solid var(--border2)', color:'var(--text2)', borderRadius:'var(--radius)', cursor:'pointer' }

  const connectedFirms = Object.entries(pxSessions||{}).filter(([_,s])=>s?.connected).length
  const monthLabel = MONTHS_FR[calMonth] + ' ' + calYear

  return (
    <div className="journal-wrap" style={{maxWidth:'1160px',margin:'0 auto',padding:'28px 24px 60px'}}>

      {/* Header */}
      <div className="journal-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:'600',marginBottom:'4px'}}>📔 Journal de trading</h1>
          <div style={{fontSize:'12px',color:'var(--text3)'}}>
            {connectedFirms===0
              ? 'Aucun compte connecté — connectez vos firmes via Synchronisation'
              : `${connectedFirms} firme${connectedFirms>1?'s':''} connectée${connectedFirms>1?'s':''} · ${allTrades.length} trade${allTrades.length>1?'s':''} importés`}
          </div>
        </div>
      </div>

      {/* Sélecteur scope (Tout / Par firme / Par compte) */}
      <div style={{...card, padding:'14px 18px', marginBottom:'16px'}}>
        <div style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'10px'}}>Filtrer par</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}}>
          <button onClick={()=>setScope('all')} style={btn(scope==='all')}>📊 Toutes les firmes</button>
          {Object.entries(accountsByFirm).map(([firmId, fInfo])=>(
            <div key={firmId} style={{display:'inline-flex',gap:'4px',alignItems:'center',padding:'2px 4px 2px 8px',border:'0.5px solid var(--border)',borderRadius:'99px',background:scope===firmId||scope.startsWith(firmId+':')?'rgba(45,111,255,0.05)':'transparent'}}>
              <button onClick={()=>setScope(firmId)} style={{...btn(scope===firmId),padding:'4px 10px'}}>
                {getFirmLogo ? <span style={{display:'inline-flex',marginRight:'4px',verticalAlign:'middle'}}>{getFirmLogo(fInfo.firmName, fInfo.color, 16)}</span> : null}
                {fInfo.firmName}
              </button>
              {Array.from(fInfo.accounts.values()).map(acc=>{
                const v = `${firmId}:${acc.id}`
                return (
                  <button key={acc.id} onClick={()=>setScope(v)} title={String(acc.id)} style={{...btn(scope===v), padding:'4px 8px', fontSize:'11px'}}>
                    {acc.name}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {connectedFirms===0 ? (
        <div style={{...card, padding:'60px 24px', textAlign:'center', color:'var(--text3)'}}>
          <div style={{fontSize:'40px',marginBottom:'14px'}}>🔌</div>
          <div style={{fontSize:'15px',fontWeight:'600',marginBottom:'6px',color:'var(--text)'}}>Connectez d'abord vos PropFirms</div>
          <div style={{fontSize:'13px'}}>Allez dans <strong>Synchronisation</strong> pour connecter vos comptes ProjectX et importer vos trades.</div>
        </div>
      ) : (
      <>
        {/* Stats */}
        <div className="journal-stats stats-5" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'12px',marginBottom:'20px'}}>
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

        {/* Calendrier + détails du jour */}
        <div className="journal-grid grid-1-320" style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'16px',alignItems:'start'}}>

          {/* Calendrier */}
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px',gap:'8px',flexWrap:'wrap'}}>
              <div style={{fontSize:'15px',fontWeight:'600'}}>Calendrier PnL — {monthLabel}</div>
              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <button onClick={()=>{const d=new Date(calYear,calMonth-1);setCalMonth(d.getMonth());setCalYear(d.getFullYear())}} style={ghostBtn}>‹</button>
                <button onClick={()=>{setCalMonth(new Date().getMonth());setCalYear(new Date().getFullYear());setSelDay(null)}} style={ghostBtn}>Aujourd'hui</button>
                <button onClick={()=>{const d=new Date(calYear,calMonth+1);setCalMonth(d.getMonth());setCalYear(d.getFullYear())}} style={ghostBtn}>›</button>
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
                  // Couleur de fond selon PnL (intensité légère)
                  let bg = 'transparent'
                  if(v && pnl > 0) bg = 'rgba(29,184,122,0.10)'
                  else if(v && pnl < 0) bg = 'rgba(232,80,74,0.10)'
                  if(isSel) bg = 'rgba(45,111,255,0.12)'
                  return (
                    <div key={i}
                      onClick={()=>setSelDay(v ? day.dateStr : null)}
                      style={{
                        minHeight:'78px', padding:'6px 7px',
                        borderRight: (i+1)%7===0 ? 'none' : '0.5px solid var(--border)',
                        borderBottom: '0.5px solid var(--border)',
                        cursor: v ? 'pointer' : 'default',
                        opacity: day.other ? 0.3 : 1,
                        background: bg,
                        outline: isSel ? '2px solid var(--blue)' : 'none',
                        outlineOffset: '-2px',
                      }}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                        <span style={{
                          fontSize:'11px',
                          width:'20px',height:'20px',display:'inline-flex',alignItems:'center',justifyContent:'center',
                          borderRadius:'50%',
                          background: day.today ? 'var(--blue)' : 'transparent',
                          color: day.today ? '#fff' : 'var(--text2)',
                        }}>{day.day}</span>
                      </div>
                      {v && (
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
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Panneau détail */}
          <div style={{...card, padding:'18px', minHeight:'300px'}}>
            <div style={{fontSize:'13px',fontWeight:'600',marginBottom:'12px'}}>
              {selDay
                ? new Date(selDay+'T00:00:00').toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'})
                : 'Sélectionnez un jour'}
            </div>

            {!selDay && (
              <div style={{color:'var(--text3)',fontSize:'12px',padding:'12px 0'}}>
                Cliquez sur un jour avec des trades pour voir le détail.
              </div>
            )}

            {selDay && dayTrades.length===0 && (
              <div style={{color:'var(--text3)',fontSize:'12px',padding:'12px 0'}}>Aucun trade ce jour.</div>
            )}

            {selDay && dayTrades.length>0 && (() => {
              const dayPnl = dayTrades.reduce((s,t)=>s+t._pnl,0)
              const dayWin = dayTrades.filter(t=>t._pnl>0).length
              const dayLoss = dayTrades.filter(t=>t._pnl<0).length
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
                    {dayTrades.map((t, i)=>{
                      const time = String(t.creationTimestamp||t.fillTimestamp||'').slice(11,16) || '—'
                      const sym = t.contractId || t.symbol || '—'
                      return (
                        <div key={i} style={{padding:'10px 12px',background:'var(--surface2)',borderRadius:'var(--radius)',marginBottom:'6px'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                              <span style={{fontFamily:'monospace',fontSize:'11px',color:'var(--text3)'}}>{time}</span>
                              <span style={{fontWeight:'600',fontSize:'12px'}}>{sym}</span>
                              {t.side && <span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'99px',background:'var(--surface3)',color:'var(--text2)'}}>{t.side}</span>}
                            </div>
                            <span style={{fontSize:'13px',fontWeight:'700',color:t._pnl>=0?'var(--green)':t._pnl<0?'var(--red)':'var(--text3)'}}>{t._pnl===0?'—':fmtMoney(t._pnl)}</span>
                          </div>
                          {scope==='all' && (
                            <div style={{fontSize:'10px',color:'var(--text3)'}}>{t._firmName}{t._acctName?` · ${t._acctName}`:''}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        {/* Mini stats avancées */}
        {stats.total>0 && (
          <div className="journal-extra stats-3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginTop:'20px'}}>
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
    </div>
  )
}
