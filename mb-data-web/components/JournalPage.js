'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { planSizeNum, maxDrawdown, isTrailingDD, accountLabel, defaultProfitSplit } from '../lib/constants'
import { uploadFile } from '../lib/uploadFile'
import { TooltipIcon } from './Tooltip'
import TagSelector, { TagDisplay } from './TagSelector'
import { computeRMultiple, computeRiskReward, computeRStats, formatR, formatRR } from '../lib/tradeMath'

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

function fmtMoney(n, dec=2){
  const v = Number(n)||0
  return (v>=0?'+':'') + v.toFixed(dec) + ' $'
}
function todayISO(){ return new Date().toISOString().slice(0,10) }

// Styles harmonisés avec le Dashboard cosmic theme (cohérence visuelle)
const card = { background:'var(--surface)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', boxShadow:'0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)' }
const inputS = { width:'100%', padding:'10px 12px', fontSize:'13px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', background:'rgba(255,255,255,0.02)', color:'var(--text)', outline:'none', transition:'border-color 0.2s, background 0.2s', fontFamily:'inherit' }
const labelS = { fontSize:'10.5px', fontWeight:'600', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:'6px' }
// btnPrimary : off-white inverted (matching Dashboard et landing — pas de gradient bleu vif AI-looking)
const btnPrimary = { padding:'9px 18px', fontSize:'12.5px', fontWeight:'500', background:'var(--text)', color:'#0a0c10', border:'1px solid transparent', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.005em', boxShadow:'0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)', transition:'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s' }
const btnGhost = { padding:'8px 14px', fontSize:'12px', fontWeight:'500', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.10)', color:'var(--text2)', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.005em', transition:'color 0.2s, border-color 0.2s, background 0.2s' }
const chipBtn = (active)=>({ padding:'7px 14px', fontSize:'12px', cursor:'pointer', borderRadius:'99px', border:`1px solid ${active?'rgba(45,111,255,0.4)':'rgba(255,255,255,0.10)'}`, fontFamily:'inherit', fontWeight:active?'600':'500', background:active?'rgba(45,111,255,0.15)':'transparent', color:active?'var(--blue-light)':'var(--text2)', transition:'all 0.15s' })

// Carte avec courbe de balance pour un compte donné
function EquityCurveCard({ account, entries, getFirmLogo, onResetBalance, onAddTrade, addTradeHref=null }){
  const ref = useRef(null)
  const chart = useRef(null)

  const planSize = planSizeNum(account.plan_size)
  const ddMax = maxDrawdown(account.firmName, account.plan_size)
  // 3 types possibles : 'static' | 'eod' | 'trailing'
  // - static : ligne fixe à (planSize - ddMax)
  // - eod : trailing basé sur la balance de fin de journée (peak EOD only)
  // - trailing : trailing intraday (peak après chaque trade)
  const ddType = account.dd_type || (isTrailingDD(account.firmName) ? 'trailing' : 'static')
  const isTrailing = ddType === 'trailing'
  const isEod = ddType === 'eod'
  const ddInitial = ddMax!==null ? planSize - ddMax : null
  const payoutTarget = account.payout_target != null ? Number(account.payout_target) : null
  const minDays = account.min_trading_days != null ? Number(account.min_trading_days) : null
  // Profit min par jour pour valider le jour dans le décompte (ex Lucid : $150)
  const minDailyProfit = account.min_daily_profit != null ? Number(account.min_daily_profit) : 0
  // Si funded_date est définie, on ignore les trades d'avant (compte reset au passage en Financé)
  const fundedDate = account.funded_date || null
  const ignoredCount = fundedDate ? entries.filter(e => e.date < fundedDate).length : 0

  // Payouts du compte (séparés des trades) — ils déduisent de la balance à leur date
  const accountPayouts = account.payouts || []
  // Profit split de la firme (% pour le trader). Ex: Lucid = 90 (= 90/10).
  // Sert à convertir le NET (montant entré par le user = ce qu'il reçoit) en BRUT
  // (montant qui sort du compte funded simulé). Brut = Net / (split/100).
  // Profit split : utilise celui stocké sur le compte (configuré par l'user dans le modal),
  // sinon fallback sur la suggestion firme, sinon 90 par défaut.
  const profitSplit = account.profit_split != null
    ? Number(account.profit_split)
    : (defaultProfitSplit(account.firmName, account.plan_size) || 90)

  // Trie les entries par date et construit la courbe cumulative + ligne DD
  // Pour le DD trailing : à chaque jour, ddLine[i] = min(balance_peak_jusqu'à i - DDmax, planSize)
  // → la ligne suit le balance peak (s'élève) puis se fige au balance initial (planSize)
  // Les PAYOUTS sont aussi pris en compte : à leur date, la balance descend du BRUT
  // (= payout.amount NET / split%) car c'est le brut qui est réellement retiré du compte.
  const data = useMemo(()=>{
    // Filtre : si funded_date est définie, on ne prend que les trades à partir de cette date
    const eligibleTrades = fundedDate
      ? entries.filter(e => e.date >= fundedDate)
      : entries
    const eligiblePayouts = fundedDate
      ? accountPayouts.filter(p => p.date >= fundedDate)
      : accountPayouts

    // Combine trades + payouts en événements unifiés triés par date
    // Type 'trade' avec pnl
    // Type 'payout' : delta = -GROSS (= -netAmount / (split/100))
    //   ex: payout net $1,800 sur split 90/10 → gross = $2,000 → delta = -$2,000
    const splitRatio = profitSplit / 100
    const events = [
      ...eligibleTrades.map(e => ({ type:'trade',  date:e.date, delta: Number(e.pnl) || 0 })),
      ...eligiblePayouts.map(p => {
        const netAmount = Number(p.amount) || 0
        const grossAmount = splitRatio > 0 ? netAmount / splitRatio : netAmount
        return { type:'payout', date:p.date, delta: -grossAmount, netAmount, grossAmount }
      }),
    ].sort((a,b)=>a.date.localeCompare(b.date))

    // Pour le DD EOD : on précalcule la balance de fin de journée pour chaque date
    // (la dernière valeur cumulée à chaque date unique). Le peak EOD ne monte qu'à la cloture.
    const eodBalances = {} // date → balance EOD
    {
      let runningCum = 0
      events.forEach(e => {
        runningCum += e.delta
        eodBalances[e.date] = +(planSize + runningCum).toFixed(2)
      })
    }
    // eodPeak[date] = max des EOD balances jusqu'à cette date inclus
    const eodPeakByDate = {}
    {
      const sortedDates = Object.keys(eodBalances).sort()
      let runningPeak = planSize
      sortedDates.forEach(d => {
        if(eodBalances[d] > runningPeak) runningPeak = eodBalances[d]
        eodPeakByDate[d] = runningPeak
      })
    }

    let cum = 0
    let peak = planSize  // peak intraday (pour 'trailing')
    const labels = []
    const balances = []
    const ddLine = []  // ligne DD point par point
    // Point de départ : jour 0 = balance initial avant 1er événement
    if(events.length){
      const startDate = events[0].date
      labels.push(startDate)
      balances.push(planSize)
      ddLine.push(ddMax!==null ? planSize - ddMax : null)
    }
    events.forEach(e=>{
      cum += e.delta
      const bal = +(planSize + cum).toFixed(2)
      if(bal > peak) peak = bal // peak intraday (utilisé pour 'trailing')
      labels.push(e.date)
      balances.push(bal)
      if(ddMax === null){
        ddLine.push(null)
      } else if(isTrailing){
        // Trailing intraday : suit le peak temps réel, plafonné au balance initial
        // ddLine = min(peak_intraday - DDmax, planSize)
        ddLine.push(Math.min(peak - ddMax, planSize))
      } else if(isEod){
        // EOD : suit le peak EOD (pas intraday), plafonné au balance initial
        // Les pics intraday n'updatent PAS le DD — seul le peak de fin de journée compte
        const eodPeak = eodPeakByDate[e.date] || planSize
        ddLine.push(Math.min(eodPeak - ddMax, planSize))
      } else {
        // Static : ligne fixe à (planSize - DDmax), ne bouge jamais
        ddLine.push(planSize - ddMax)
      }
    })
    // === Reset des compteurs après chaque payout ===
    // PropFirms exigent N jours de trading entre CHAQUE payout (pas en cumulé sur toute la vie du compte).
    // → on filtre les trades pour ne garder que ceux à partir de la date du dernier payout (inclus, pour
    //   permettre que le jour du payout compte si l'user a aussi tradé ce jour-là).
    const sortedPayoutDates = eligiblePayouts.map(p => p.date).sort()
    const lastPayoutDate = sortedPayoutDates.length > 0
      ? sortedPayoutDates[sortedPayoutDates.length - 1]
      : null
    const tradesForCounter = lastPayoutDate
      ? eligibleTrades.filter(e => e.date >= lastPayoutDate)
      : eligibleTrades
    // Jours uniques tradés depuis le dernier payout (ou depuis le passage en Financé s'il n'y a pas eu de payout)
    const tradeDates = tradesForCounter.map(e => e.date)
    const tradingDays = new Set(tradeDates).size
    // Jours "validés" depuis le dernier payout = jours dont le PnL net est >= seuil minDailyProfit
    const dailyPnL = {}
    tradesForCounter.forEach(e => {
      dailyPnL[e.date] = (dailyPnL[e.date] || 0) + (Number(e.pnl) || 0)
    })
    const validatedDays = Object.values(dailyPnL).filter(v => v >= minDailyProfit && v > 0).length
    // Total payouts (NET reçu par le trader) et BRUT déduit du compte
    const totalPayoutsNet = eligiblePayouts.reduce((s,p) => s + (Number(p.amount) || 0), 0)
    const totalPayoutsGross = splitRatio > 0 ? totalPayoutsNet / splitRatio : totalPayoutsNet
    return {
      labels, balances, ddLine,
      finalBalance: planSize + cum, totalPnl: cum, finalPeak: peak,
      currentDD: ddLine.length ? ddLine[ddLine.length - 1] : null,
      tradingDays,
      validatedDays,
      totalPayoutsNet,
      totalPayoutsGross,
      payoutCount: eligiblePayouts.length,
      lastPayoutDate, // exposé pour afficher "depuis le payout du XX/XX" dans le compteur
    }
  },[entries, accountPayouts, planSize, ddMax, isTrailing, isEod, fundedDate, minDailyProfit, profitSplit])

  useEffect(()=>{
    if(!ref.current) return
    if(!data.labels.length) return
    let destroyed = false
    import('chart.js/auto').then(({default: Chart})=>{
      if(destroyed) return
      if(chart.current){ chart.current.destroy(); chart.current = null }
      const datasets = [
        {
          label:'Balance', data:data.balances,
          borderColor:'#1db87a', backgroundColor:'rgba(29,184,122,0.10)',
          fill:true, tension:0.25, pointRadius:data.labels.length>30?0:3, borderWidth:2,
        },
      ]
      if(ddMax !== null){
        const isMoving = isTrailing || isEod
        datasets.push({
          label: isTrailing ? 'DD max (trailing intraday)' : isEod ? 'DD max (EOD)' : 'DD max (static)',
          data: data.ddLine,
          borderColor: '#e8504a', backgroundColor:'transparent',
          fill:false, tension:0, pointRadius:0, borderWidth:2,
          borderDash: isTrailing ? [4,3] : isEod ? [6,3] : [6,4],
          stepped: isMoving ? 'before' : false, // marche d'escalier pour les types qui bougent
        })
      }
      // Ligne d'objectif payout (verte horizontale)
      if(payoutTarget !== null){
        datasets.push({
          label: 'Objectif payout',
          data: data.labels.map(()=>payoutTarget),
          borderColor: '#1db87a', backgroundColor:'transparent',
          fill:false, tension:0, pointRadius:0, borderWidth:2,
          borderDash:[2,3],
        })
      }
      const allVals = [...data.balances, ...(data.ddLine.filter(v=>v!==null))]
      if(payoutTarget !== null) allVals.push(payoutTarget)
      const minVal = Math.min(...allVals) * 0.998
      const maxVal = Math.max(...allVals, planSize) * 1.002
      chart.current = new Chart(ref.current, {
        type:'line',
        data:{ labels:data.labels, datasets },
        options:{
          responsive:true, maintainAspectRatio:false,
          interaction:{mode:'index', intersect:false},
          plugins:{
            legend:{display:false},
            tooltip:{
              callbacks:{
                label:(ctx)=>`${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString('fr-FR',{maximumFractionDigits:0})}`
              }
            }
          },
          scales:{
            x:{grid:{display:false},ticks:{color:'#565e78',font:{size:10},maxTicksLimit:8}},
            y:{
              grid:{color:'rgba(255,255,255,0.04)'},
              ticks:{color:'#565e78',font:{size:10},callback:v=>'$'+v.toLocaleString('fr-FR',{maximumFractionDigits:0})},
              suggestedMin:minVal,
              suggestedMax:maxVal,
            }
          }
        }
      })
    }).catch(e=>console.error('Chart.js:', e))
    return ()=>{
      destroyed = true
      if(chart.current){ chart.current.destroy(); chart.current = null }
    }
  },[data.labels.join(','), data.balances.join(','), data.ddLine.join(','), planSize, isTrailing, payoutTarget])

  const finalNet = data.totalPnl
  const pctFromStart = planSize>0 ? (finalNet/planSize)*100 : 0

  // Action : reset balance au passage Challenge → Financé
  function handleResetClick(){
    if(!onResetBalance) return
    const today = new Date().toISOString().slice(0,10)
    const ans = window.prompt(
      `Reset la balance du compte ${accountLabel(account)} ?\n\n` +
      `Saisis la date du passage en Financé (YYYY-MM-DD).\n` +
      `Les trades avant cette date seront masqués du calcul de balance (mais conservés dans l'historique).`,
      today
    )
    if(!ans) return
    if(!/^\d{4}-\d{2}-\d{2}$/.test(ans.trim())){
      alert('Format invalide. Utilise YYYY-MM-DD (ex: 2026-05-30)')
      return
    }
    onResetBalance(account.id, ans.trim())
  }
  function handleUndoReset(){
    if(!onResetBalance) return
    if(!confirm('Annuler le reset ? Les anciens trades seront de nouveau pris en compte dans la balance.')) return
    onResetBalance(account.id, null)
  }

  return (
    <div style={{background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'18px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px',gap:'10px',flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          {getFirmLogo ? getFirmLogo(account.firmName, account.firmColor, 28) : null}
          <div>
            <div style={{fontSize:'14px',fontWeight:'700'}}>{accountLabel(account)}</div>
            <div style={{fontSize:'11px',color:'var(--text3)'}}>
              {account.firmName} · Plan {String(account.plan_size||'?').toUpperCase()} · DD {isTrailing?'trailing intraday':isEod?'EOD':'static'}
            </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          {addTradeHref ? (
            <a
              href={addTradeHref}
              title="Importer un CSV pour ajouter des trades"
              style={{
                fontSize:'11px',padding:'7px 11px',borderRadius:'8px',
                background:'rgba(45,111,255,0.10)',border:'1px solid rgba(45,111,255,0.35)',
                color:'var(--blue-light)',cursor:'pointer',fontWeight:'600',whiteSpace:'nowrap',
                textDecoration:'none',display:'inline-block',
              }}
            >+ Importer</a>
          ) : onAddTrade && (
            <button
              onClick={()=>onAddTrade(account.id)}
              title="Ajouter un trade pour ce compte"
              style={{
                fontSize:'11px',padding:'7px 11px',borderRadius:'8px',
                background:'rgba(45,111,255,0.10)',border:'1px solid rgba(45,111,255,0.35)',
                color:'var(--blue-light)',cursor:'pointer',fontWeight:'600',whiteSpace:'nowrap',
              }}
            >+ Trade</button>
          )}
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'18px',fontWeight:'700',color:finalNet>=0?'var(--green)':'var(--red)'}}>
              ${data.finalBalance.toLocaleString('fr-FR',{maximumFractionDigits:0})}
            </div>
            <div style={{fontSize:'11px',color:finalNet>=0?'var(--green)':'var(--red)'}}>
              {finalNet>=0?'+':''}{finalNet.toFixed(0)} $ ({pctFromStart>=0?'+':''}{pctFromStart.toFixed(2)}%)
            </div>
            {data.totalPayoutsNet > 0 && (
              <div style={{fontSize:'10px',color:'var(--text3)',marginTop:'2px'}}>
                💰 {data.payoutCount} payout{data.payoutCount>1?'s':''} : net {fmtMoney(data.totalPayoutsNet, 0)} (brut {fmtMoney(data.totalPayoutsGross, 0)} · split {profitSplit}%)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bandeau reset balance : visible si un reset est actif, ou bouton si compte Financé sans reset */}
      {fundedDate ? (
        <div style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',
          padding:'8px 12px',marginBottom:'12px',
          background:'rgba(45,111,255,0.08)',border:'1px solid rgba(45,111,255,0.25)',
          borderRadius:'var(--radius)',fontSize:'11px',
        }}>
          <span style={{color:'var(--text2)'}}>
            ↻ Compte reset le <strong style={{color:'var(--text)'}}>{fundedDate}</strong>
            {ignoredCount>0 && <span style={{color:'var(--text3)'}}> · {ignoredCount} trade{ignoredCount>1?'s':''} antérieur{ignoredCount>1?'s':''} masqué{ignoredCount>1?'s':''}</span>}
          </span>
          <div style={{display:'flex',gap:'6px'}}>
            <button onClick={handleResetClick} style={{
              fontSize:'10px',padding:'3px 8px',borderRadius:'6px',
              background:'transparent',border:'1px solid var(--border2)',color:'var(--text2)',cursor:'pointer',
            }}>Modifier date</button>
            <button onClick={handleUndoReset} style={{
              fontSize:'10px',padding:'3px 8px',borderRadius:'6px',
              background:'transparent',border:'1px solid var(--border2)',color:'var(--text3)',cursor:'pointer',
            }}>Annuler</button>
          </div>
        </div>
      ) : account.status === 'Financé' && onResetBalance ? (
        <div style={{marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
          <button onClick={handleResetClick} title="Repart la balance à 0 depuis une date donnée — utile au passage Challenge → Financé pour ne pas mélanger les trades des 2 phases" style={{
            fontSize:'11px',padding:'6px 12px',borderRadius:'6px',
            background:'rgba(45,111,255,0.10)',border:'1px solid rgba(45,111,255,0.35)',
            color:'var(--blue-light)',cursor:'pointer',fontWeight:'600',
          }}>↻ Reset balance (passage en Financé)</button>
          <TooltipIcon text="Quand tu passes Challenge → Financé, ton compte simulé repart à 0 (les trades de la phase challenge sont conservés mais masqués du calcul de balance Financé). Click pour définir manuellement la date du reset." maxWidth={320} />
        </div>
      ) : null}

      {/* Indicateurs de progression : payout target + jours tradés */}
      {(payoutTarget !== null || minDays !== null) && (
        <div style={{display:'grid',gridTemplateColumns:payoutTarget!==null && minDays!==null?'1fr 1fr':'1fr',gap:'8px',marginBottom:'12px'}}>
          {payoutTarget !== null && (() => {
            const remaining = payoutTarget - data.finalBalance
            const reached = remaining <= 0
            const totalNeeded = payoutTarget - planSize
            const progress = totalNeeded > 0 ? Math.max(0, Math.min(100, ((data.finalBalance - planSize) / totalNeeded) * 100)) : 0
            return (
              <div style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:'10px 12px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'5px'}}>
                  <span style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',fontWeight:'700'}}>🎯 Objectif payout</span>
                  <span style={{fontSize:'12px',fontWeight:'700',color:reached?'var(--green)':'var(--text)'}}>
                    {reached ? '✓ Atteint' : `${progress.toFixed(0)}%`}
                  </span>
                </div>
                <div style={{fontSize:'13px',fontWeight:'700',color:reached?'var(--green)':'var(--text)',marginBottom:'4px'}}>
                  ${payoutTarget.toLocaleString('fr-FR',{maximumFractionDigits:0})}
                </div>
                <div style={{fontSize:'10px',color:reached?'var(--green-text)':'var(--text2)'}}>
                  {reached
                    ? `+$${(-remaining).toLocaleString('fr-FR',{maximumFractionDigits:0})} au-dessus`
                    : `Il manque $${remaining.toLocaleString('fr-FR',{maximumFractionDigits:0})}`}
                </div>
                {/* Mini barre de progression */}
                <div style={{height:'4px',background:'var(--surface3)',borderRadius:'99px',marginTop:'6px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:progress+'%',background:reached?'var(--green)':'linear-gradient(90deg,#1db87a,#fac775)',transition:'width 0.3s'}} />
                </div>
              </div>
            )
          })()}
          {minDays !== null && (() => {
            // Si un seuil de profit min/jour est défini, on compte les jours VALIDÉS (pas les simples jours tradés)
            // Sinon (seuil = 0), on retombe sur les simples jours tradés.
            const useValidated = minDailyProfit > 0
            const counted = useValidated ? data.validatedDays : data.tradingDays
            const reached = counted >= minDays
            const progress = minDays > 0 ? Math.min(100, (counted / minDays) * 100) : 0
            const label = useValidated ? `📅 Jours validés (≥$${minDailyProfit})` : '📅 Jours tradés'
            return (
              <div style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:'10px 12px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'5px'}}>
                  <span style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',fontWeight:'700'}}>{label}</span>
                  <span style={{fontSize:'12px',fontWeight:'700',color:reached?'var(--green)':'var(--text)'}}>
                    {reached ? '✓ Atteint' : `${progress.toFixed(0)}%`}
                  </span>
                </div>
                <div style={{fontSize:'13px',fontWeight:'700',color:reached?'var(--green)':'var(--text)',marginBottom:'4px'}}>
                  {counted} / {minDays}
                </div>
                <div style={{fontSize:'10px',color:reached?'var(--green-text)':'var(--text2)'}}>
                  {reached
                    ? 'Minimum atteint'
                    : useValidated
                      ? `Encore ${minDays - counted} jour${minDays-counted>1?'s':''} à ≥$${minDailyProfit}`
                      : `Encore ${minDays - counted} jour${minDays-counted>1?'s':''}`}
                </div>
                {useValidated && data.tradingDays > data.validatedDays && (
                  <div style={{fontSize:'9px',color:'var(--text3)',marginTop:'2px',fontStyle:'italic'}}>
                    {`${data.tradingDays - data.validatedDays} jour${(data.tradingDays - data.validatedDays)>1?'s':''} traités mais <$${minDailyProfit}`}
                  </div>
                )}
                {data.lastPayoutDate && (
                  <div style={{fontSize:'9px',color:'#4d8fff',marginTop:'2px',fontStyle:'italic',display:'flex',alignItems:'center',gap:'4px'}} title="Le compteur est reset après chaque payout — la plupart des PropFirms exigent N jours de trading entre chaque payout, pas en cumulé.">
                    🔄 Compteur reset depuis le payout du {data.lastPayoutDate}
                  </div>
                )}
                <div style={{height:'4px',background:'var(--surface3)',borderRadius:'99px',marginTop:'6px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:progress+'%',background:reached?'var(--green)':'#4d8fff',transition:'width 0.3s'}} />
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <div style={{display:'flex',gap:'14px',marginBottom:'10px',flexWrap:'wrap'}}>
        <div style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'11px',color:'var(--text2)'}}>
          <div style={{width:'10px',height:'3px',borderRadius:'2px',background:'#1db87a'}} />Balance
        </div>
        {ddMax!==null && (
          <div style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'11px',color:'var(--text2)'}}>
            <div style={{width:'10px',height:'3px',borderRadius:'2px',background:'#e8504a'}} />
            {isTrailing
              ? <span>DD trailing intraday (${ddMax.toLocaleString('fr-FR')}) → actuellement ${data.currentDD?.toLocaleString('fr-FR')}</span>
              : isEod
              ? <span>DD EOD (${ddMax.toLocaleString('fr-FR')}) → actuellement ${data.currentDD?.toLocaleString('fr-FR')}</span>
              : <span>DD static (${ddMax.toLocaleString('fr-FR')}) → ${(planSize-ddMax).toLocaleString('fr-FR')}</span>}
          </div>
        )}
        {payoutTarget!==null && (
          <div style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'11px',color:'var(--text2)'}}>
            <div style={{width:'10px',height:'3px',borderRadius:'2px',background:'#1db87a',borderTop:'1px dashed #1db87a'}} />
            <span>Objectif (${payoutTarget.toLocaleString('fr-FR')})</span>
          </div>
        )}
        {ddMax===null && (
          <div style={{fontSize:'11px',color:'var(--text3)',fontStyle:'italic'}}>
            ⓘ DD max non défini pour {account.firmName} / {String(account.plan_size||'').toUpperCase()}
          </div>
        )}
      </div>

      {data.labels.length === 0 ? (
        <div style={{padding:'40px',textAlign:'center',color:'var(--text3)',fontSize:'12px'}}>
          Aucun trade pour ce compte — saisissez votre premier trade pour voir la courbe.
        </div>
      ) : (
        <div style={{position:'relative',height:'200px'}}><canvas ref={ref} /></div>
      )}

      {isTrailing && ddMax!==null && data.currentDD === planSize && (
        <div style={{marginTop:'10px',fontSize:'10px',color:'var(--green-text)',padding:'6px 10px',background:'var(--green-bg)',borderRadius:'6px'}}>
          ✓ DD figé au balance initial (${planSize.toLocaleString('fr-FR')}) — votre compte a sécurisé son drawdown.
        </div>
      )}
    </div>
  )
}

// Props :
//   firms, user, getFirmLogo, showToast, onReload     → comme avant
//   hideRithmicEntries (bool)   → mode journal manuel : exclut les trades CSV
//   onlyRithmicEntries (bool)   → mode journal sync : N'AFFICHE QUE les trades CSV
//   addTradeHref (string|null)  → si set, remplace le modal d'ajout par un Link vers cette URL
//   addTradeLabel (string)      → label du bouton (défaut "+ Ajouter trade")
//   pageEyebrow / pageTitle / pageSubtitleSuffix → personnalisation du header
export default function JournalPage({
  firms, user, getFirmLogo, showToast, onReload,
  hideRithmicEntries = false,
  onlyRithmicEntries = false,
  addTradeHref = null,
  addTradeLabel = '+ Ajouter trade',
  pageEyebrow = 'Journal de trading',
  pageTitle = 'Chaque trade. Tracké. Analysé.',
  pageSubtitleSuffix = 'saisie manuelle',
  renderExtraSection = null,  // (ctx) => JSX — appelé avant le footer. ctx = { filteredEntries, decoratedEntries, allAccounts, firms }
}){
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState('all') // 'all' | firmId | `${firmId}:${accountId}`
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'Challenge' | 'Financé' | 'Échoué'
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selDay, setSelDay] = useState(null)

  // Modal d'ajout / édition
  const [entryModal, setEntryModal] = useState(null) // null | { entry?, defaultDate? }
  const [form, setForm] = useState({
    accountId:'', date:todayISO(), pnl:'', instrument:'', side:'', notes:'',
    entryPrice:'', exitPrice:'', stopLoss:'', takeProfit:'', screenshotUrl:'',
    tags: [],
  })
  // Filtre par tags dans le journal (array d'IDs sélectionnés ; vide = pas de filtre)
  const [tagFilter, setTagFilter] = useState([])
  const [uploadingScreen, setUploadingScreen] = useState(false)
  // Lightbox pour afficher un screenshot en grand
  const [lightboxUrl, setLightboxUrl] = useState(null)

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
    if(!user){ setLoading(false); return }
    // ⚠ Filtre explicite par user_id : les RLS admin (lecture all) override le filtrage classique,
    // sans ce filtre l'admin verrait TOUS les trades de TOUS les users dans son journal.
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
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
      // Filtre selon le mode :
      //   - hideRithmicEntries (manuel) : exclut les trades CSV (marker [rithmic:])
      //   - onlyRithmicEntries (sync)   : N'INCLUT QUE les trades CSV
      // Le filtre par comptes visibles est appliqué dans decoratedEntries (useMemo)
      // pour éviter un refetch SQL à chaque fois que la liste des firms change.
      let filtered = data || []
      if (onlyRithmicEntries) {
        filtered = filtered.filter(e => e.notes && e.notes.includes('[rithmic:'))
      } else if (hideRithmicEntries) {
        filtered = filtered.filter(e => !e.notes || !e.notes.includes('[rithmic:'))
      }
      setEntries(filtered)
    }
    setLoading(false)
  }

  useEffect(()=>{
    if(user?.id) loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user?.id, hideRithmicEntries, onlyRithmicEntries])

  // Décore les entries avec les infos firme/compte
  // FIX BUG : on EXCLUT aussi les entries dont le account_id n'est pas dans les
  // accounts visibles (passés via firms). Cas typique : un trade manuel sur un
  // compte qui est devenu synced (rithmic_account_id rempli) → ce compte est
  // exclu du journal manuel par le parent, donc le trade doit l'être aussi pour
  // ne pas apparaître comme "Compte supprimé" dans le calendrier/stats.
  const decoratedEntries = useMemo(()=>{
    return entries
      .filter(e => allAccounts.some(a => a.id === e.account_id))
      .map(e=>{
        const acc = allAccounts.find(a => a.id === e.account_id)
        return {
          ...e,
          _firmId: acc?.firmId,
          _firmName: acc?.firmName || 'Compte supprimé',
          _firmColor: acc?.firmColor || '#565e78',
          _accountLabel: acc ? `${acc.firmName} · ${accountLabel(acc)}` : 'Compte supprimé',
        }
      })
  },[entries, allAccounts])

  // Helper : un compte passe-t-il le filtre de statut ?
  function passesStatus(acc){
    if(!acc) return true
    if(statusFilter === 'all') return true
    return acc.status === statusFilter
  }

  // Filtre par scope, statut, ET funded_date (reset balance) du compte rattaché
  // + filtre par tags (un trade matche si TOUS les tags sélectionnés sont présents — AND)
  const filteredEntries = useMemo(()=>{
    let arr = decoratedEntries
    if(scope.includes(':')){
      const [, acctId] = scope.split(':')
      arr = arr.filter(e => e.account_id === acctId)
    } else if(scope !== 'all'){
      arr = arr.filter(e => e._firmId === scope)
    }
    // Filtre statut + funded_date : on exclut les trades antérieurs au reset balance
    // de chaque compte (les anciens trades du challenge sont masqués partout : calendrier,
    // stats, gain moyen, consistency, ratio R, etc.)
    arr = arr.filter(e => {
      const acc = allAccounts.find(a => a.id === e.account_id)
      if(!passesStatus(acc)) return false
      if(acc?.funded_date && e.date < acc.funded_date) return false
      return true
    })
    // Filtre par tags : si tagFilter contient des tags, ne garde que les trades qui ont
    // TOUS ces tags (AND, pas OR — plus puissant pour analyse fine type "FOMO + revenge").
    if (tagFilter.length > 0) {
      arr = arr.filter(e => {
        if (!Array.isArray(e.tags) || e.tags.length === 0) return false
        return tagFilter.every(t => e.tags.includes(t))
      })
    }
    return arr
  },[decoratedEntries, scope, statusFilter, allAccounts, tagFilter])

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
    // === Consistency (% du meilleur jour gagnant sur le total des jours gagnants) ===
    const dayWinners = Object.values(dailyPnL).filter(v => v.pnl > 0)
    const totalDayPositive = dayWinners.reduce((s,v)=>s+v.pnl, 0)
    const bestDayPnl = dayWinners.reduce((max,v)=>v.pnl>max?v.pnl:max, 0)
    const consistency = totalDayPositive > 0 ? (bestDayPnl/totalDayPositive)*100 : null
    return {
      total, totalPnl, winners:winners.length, losers:losers.length, wr,
      avgWin, avgLoss, monthPnl, monthTrades, monthDays:monthDays.size,
      consistency, bestDayPnl, totalDayPositive,
    }
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
  // openNewEntry(opts) — opts peut être :
  //   - undefined         → pas de pré-remplissage
  //   - une string YYYY-MM-DD → date par défaut, compte = filtre actif (scope)
  //   - un objet { accountId, defaultDate } → pré-remplit explicitement
  // Si aucun accountId explicite, utilise le compte filtré actif (scope = 'firmId:accountId').
  function openNewEntry(opts){
    const isObj = opts && typeof opts === 'object' && !Array.isArray(opts)
    const explicitAcctId = isObj ? opts?.accountId : undefined
    const defaultDate    = isObj ? opts?.defaultDate : (typeof opts === 'string' ? opts : undefined)
    let acctId = explicitAcctId
    if(!acctId && scope.includes(':')) acctId = scope.split(':')[1]
    if(!acctId) acctId = allAccounts[0]?.id || ''
    setForm({
      accountId:acctId, date:defaultDate||todayISO(),
      pnl:'', instrument:'', side:'', notes:'',
      entryPrice:'', exitPrice:'', stopLoss:'', takeProfit:'', screenshotUrl:'',
      tags: [],
    })
    setEntryModal({ defaultDate })
  }
  function openEditEntry(e){
    setForm({
      accountId:e.account_id, date:e.date,
      pnl:String(e.pnl), instrument:e.instrument||'', side:e.side||'', notes:e.notes||'',
      entryPrice: e.entry_price != null ? String(e.entry_price) : '',
      exitPrice:  e.exit_price  != null ? String(e.exit_price)  : '',
      stopLoss:   e.stop_loss   != null ? String(e.stop_loss)   : '',
      takeProfit: e.take_profit != null ? String(e.take_profit) : '',
      screenshotUrl: e.screenshot_url || '',
      tags: Array.isArray(e.tags) ? e.tags : [],
    })
    setEntryModal({ entry:e })
  }
  async function saveEntry(){
    if(!form.accountId){ showToast?.('Sélectionne un compte'); return }
    if(!form.date){ showToast?.('Date requise'); return }
    if(form.pnl===''||isNaN(parseFloat(form.pnl))){ showToast?.('PnL requis (nombre)'); return }
    const numOrNull = (s) => s === '' || s == null ? null : (isNaN(parseFloat(s)) ? null : parseFloat(s))
    const payload = {
      user_id: user.id,
      account_id: form.accountId,
      date: form.date,
      pnl: parseFloat(form.pnl),
      instrument: form.instrument.trim(),
      side: form.side,
      notes: form.notes.trim(),
      entry_price:    numOrNull(form.entryPrice),
      exit_price:     numOrNull(form.exitPrice),
      stop_loss:      numOrNull(form.stopLoss),
      take_profit:    numOrNull(form.takeProfit),
      screenshot_url: form.screenshotUrl || null,
      // Tags : array vide → null en DB pour cohérence (évite les '{}' inutiles)
      tags: Array.isArray(form.tags) && form.tags.length > 0 ? form.tags : null,
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
  // Upload screenshot d'un trade vers Supabase Storage
  async function handleScreenshotUpload(file){
    if(!file || !user?.id) return
    setUploadingScreen(true)
    const { url, error } = await uploadFile({ bucket: 'trade-screenshots', file, userId: user.id })
    setUploadingScreen(false)
    if(error){
      // Affichage en alert (popup) car les erreurs upload sont critiques et trop longues pour un toast
      alert(error)
      showToast?.('❌ Upload échoué')
      return
    }
    setForm(p => ({ ...p, screenshotUrl: url }))
    showToast?.('Screenshot ajouté ✓')
  }

  async function deleteEntry(id){
    if(!confirm('Supprimer ce trade ?')) return
    const { error } = await supabase.from('journal_entries').delete().eq('id', id)
    if(error){ showToast?.('Erreur suppression'); return }
    showToast?.('Trade supprimé')
    await loadEntries()
  }

  // Reset balance d'un compte au passage Challenge → Financé
  // Si fundedDate est null, annule le reset (les trades antérieurs reviennent dans le calcul)
  async function resetAccountBalance(accountId, fundedDate){
    const { error } = await supabase
      .from('accounts')
      .update({ funded_date: fundedDate })
      .eq('id', accountId)
    if(error){
      // Si la colonne n'existe pas, message explicite avec la commande SQL à exécuter
      const isMissingColumn = /column.*funded_date.*does not exist|funded_date.*column/i.test(error.message || '')
      if(isMissingColumn){
        alert(
          '⚠ La colonne `funded_date` n\'existe pas dans Supabase.\n\n' +
          'Va sur https://supabase.com → ton projet → SQL Editor, et exécute :\n\n' +
          'alter table accounts add column if not exists funded_date date;\n\n' +
          'Puis recharge la page et réessaye.'
        )
      } else {
        alert('Erreur reset : ' + error.message)
      }
      showToast?.('❌ Reset échoué — voir popup')
      return
    }
    showToast?.(fundedDate ? `Balance reset au ${fundedDate} ✓` : 'Reset annulé ✓')
    // Recharge les firmes côté parent pour rafraîchir account.funded_date dans les props
    if(onReload) await onReload()
  }

  // Export CSV des trades filtrés (avec BOM UTF-8 pour Excel Windows + tags + R-multiple)
  function exportJournalCSV(){
    const rows = [['Date','Firme','Compte','Instrument','Side','PnL','Entry','Exit','Stop','TP','R réalisé','R:R visé','Tags','Notes']]
    filteredEntries.forEach(e=>{
      const tagsStr = Array.isArray(e.tags) ? e.tags.join(', ') : ''
      const r = computeRMultiple({ entry:e.entry_price, exit:e.exit_price, stop:e.stop_loss, side:e.side, pnl:e.pnl })
      const rr = computeRiskReward({ entry:e.entry_price, takeProfit:e.take_profit, stop:e.stop_loss, side:e.side, pnl:e.pnl, exit:e.exit_price })
      rows.push([
        e.date, e._firmName, e._accountLabel, e.instrument||'', e.side||'', String(e.pnl),
        e.entry_price ?? '', e.exit_price ?? '', e.stop_loss ?? '', e.take_profit ?? '',
        r != null ? r.toFixed(2) : '', rr != null ? rr.toFixed(2) : '',
        tagsStr, e.notes||'',
      ])
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    // BOM UTF-8 préfixé : permet à Excel Windows d'afficher correctement les accents
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent('﻿'+csv)
    a.download = `Quantara_Journal_${todayISO()}.csv`
    a.click()
    showToast?.('Export CSV ✓')
  }

  const monthLabel = MONTHS_FR[calMonth] + ' ' + calYear
  const noAccounts = allAccounts.length === 0

  return (
    <div className="page-pad" style={{maxWidth:'1160px',margin:'0 auto',padding:'28px 24px 60px'}}>

      {/* Header — eyebrow mono + grand titre cohérent avec Dashboard cosmic */}
      <div className="page-header" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'28px',flexWrap:'wrap',gap:'18px'}}>
        <div>
          <div style={{fontSize:'11px',color:'var(--blue-light)',letterSpacing:'0.16em',marginBottom:'10px',textTransform:'uppercase',fontWeight:'600'}}>
            {pageEyebrow}
          </div>
          <h1 style={{fontSize:'30px',fontWeight:'700',letterSpacing:'-0.025em',margin:0,marginBottom:'6px',lineHeight:1.1}}>{pageTitle}</h1>
          <div style={{fontSize:'13px',color:'var(--text3)'}}>
            {decoratedEntries.length} trade{decoratedEntries.length>1?'s':''} enregistré{decoratedEntries.length>1?'s':''} · {pageSubtitleSuffix}
          </div>
        </div>
        <div className="page-header-actions" style={{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
          {/* Bouton vers la nouvelle page Trade Log (vue cards analytique) */}
          <a href="/app?p=trades" style={{
            ...btnGhost,
            textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'5px',
            background:'rgba(45,111,255,0.08)',
            borderColor:'rgba(45,111,255,0.25)',
            color:'var(--blue-light)',
          }}>
            ⊞ Trade Log détaillé →
          </a>
          <button onClick={exportJournalCSV} disabled={!filteredEntries.length} style={{...btnGhost,opacity:filteredEntries.length?1:0.5}}>↓ CSV</button>
          {/* Bouton + Trade :
                - Mode SYNC (addTradeHref défini) : <a href> vers l'import-lab
                - Mode MANUEL : ouvre le modal d'ajout, désactivé si pas de compte */}
          {addTradeHref ? (
            <a href={addTradeHref} style={{...btnPrimary,textDecoration:'none',display:'inline-block'}}>
              {addTradeLabel}
            </a>
          ) : (
            (() => {
              const filteredAcct = scope.includes(':') ? allAccounts.find(a => a.id === scope.split(':')[1]) : null
              return (
                <button onClick={()=>openNewEntry()} disabled={noAccounts} style={{...btnPrimary,opacity:noAccounts?0.5:1}}>
                  {addTradeLabel}{filteredAcct ? ` · ${accountLabel(filteredAcct)}` : ''}
                </button>
              )
            })()
          )}
        </div>
      </div>

      {noAccounts && (
        <div style={{...card,padding:'40px 24px',marginBottom:'16px',background:'var(--surface2)',borderStyle:'dashed',borderColor:'var(--border2)',textAlign:'center'}}>
          <div style={{fontSize:'42px',marginBottom:'14px',opacity:0.6}}>{onlyRithmicEntries?'⟲':'📔'}</div>
          <div style={{fontSize:'16px',fontWeight:'700',marginBottom:'8px'}}>
            {onlyRithmicEntries ? 'Aucun compte synchronisé' : 'Aucun compte à journaliser'}
          </div>
          <div style={{fontSize:'13px',color:'var(--text2)',marginBottom:'20px',maxWidth:'460px',margin:'0 auto 20px',lineHeight:1.6}}>
            {onlyRithmicEntries
              ? `Importe ton premier CSV Rithmic depuis l'Import Lab. Les comptes créés via l'import apparaîtront ici automatiquement, séparés de tes comptes manuels.`
              : `Pour saisir tes trades dans le journal, ajoute d'abord au moins une PropFirm + un compte de trading depuis le tableau de bord.`}
          </div>
          {onlyRithmicEntries ? (
            <a href="/app/import-lab" style={{display:'inline-block',padding:'10px 22px',fontSize:'13px',fontWeight:'600',background:'var(--blue)',color:'#fff',borderRadius:'var(--radius)',textDecoration:'none'}}>→ Aller à l'Import Lab</a>
          ) : (
            <a href="/app" onClick={(e)=>{e.preventDefault();window.history.pushState({},'','/app');window.location.reload()}} style={{display:'inline-block',padding:'10px 22px',fontSize:'13px',fontWeight:'600',background:'var(--blue)',color:'#fff',borderRadius:'var(--radius)',textDecoration:'none'}}>← Aller au tableau de bord</a>
          )}
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

      {/* Filtres scope + statut */}
      {(() => {
        // Décompose `scope` ("all" | firmId | "firmId:accountId") en deux selects ergonomiques.
        const selectedFirmId = scope === 'all' ? 'all' : scope.split(':')[0]
        const selectedAcctId = scope.includes(':') ? scope.split(':')[1] : 'all'
        const currentFirm = firms.find(f => f.id === selectedFirmId)
        const accountsForFirm = currentFirm
          ? (currentFirm.accounts || []).filter(a => passesStatus(a))
          : []
        const selectStyle = {
          background:'var(--surface2)', border:'1px solid var(--border2)',
          borderRadius:'8px', padding:'8px 12px', fontSize:'13px',
          color:'var(--text)', cursor:'pointer', minWidth:'200px',
          fontFamily:'inherit',
        }
        return (
          <div style={{...card, padding:'14px 18px', marginBottom:'16px',display:'flex',flexDirection:'column',gap:'12px'}}>
            {/* Statut (sans Actifs) */}
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}}>
              <span style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',minWidth:'68px'}}>Statut</span>
              {[
                {k:'all',l:'Tous'},
                {k:'Challenge',l:'🟡 Challenge'},
                {k:'Financé',l:'✅ Financé'},
                {k:'Échoué',l:'🔴 Échoué'},
              ].map(s=>(
                <button key={s.k} onClick={()=>setStatusFilter(s.k)} style={chipBtn(statusFilter===s.k)}>{s.l}</button>
              ))}
            </div>

            {/* Firme + Compte : 2 selects ergonomiques côte à côte */}
            <div style={{display:'flex',flexWrap:'wrap',gap:'12px',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',flex:'1 1 240px'}}>
                <span style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',minWidth:'68px'}}>Firme</span>
                <select
                  value={selectedFirmId}
                  onChange={e => {
                    const v = e.target.value
                    if(v === 'all') setScope('all')
                    else setScope(v) // changer de firme reset le compte à "Tous"
                  }}
                  style={{...selectStyle, flex:1}}
                >
                  <option value="all">📊 Toutes les firmes</option>
                  {firms.map(f => {
                    const has = (f.accounts || []).some(a => passesStatus(a))
                    if(!has) return null
                    return <option key={f.id} value={f.id}>{f.name}</option>
                  })}
                </select>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',flex:'1 1 240px'}}>
                <span style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',minWidth:'68px'}}>Compte</span>
                <select
                  value={selectedAcctId}
                  disabled={selectedFirmId === 'all'}
                  onChange={e => {
                    const v = e.target.value
                    if(v === 'all') setScope(selectedFirmId)
                    else setScope(`${selectedFirmId}:${v}`)
                  }}
                  style={{...selectStyle, flex:1, opacity: selectedFirmId === 'all' ? 0.5 : 1}}
                >
                  <option value="all">Tous les comptes{selectedFirmId !== 'all' && currentFirm ? ` de ${currentFirm.name}` : ''}</option>
                  {accountsForFirm.map(a => (
                    <option key={a.id} value={a.id}>
                      {accountLabel(a)} · {a.status} · acheté {a.buy_date}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtre par tags trades (AND : trade doit avoir TOUS les tags sélectionnés) */}
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'flex-start'}}>
              <span style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',minWidth:'68px',paddingTop:'5px'}}>
                Tags
              </span>
              <div style={{flex:1, minWidth:0}}>
                <TagSelector value={tagFilter} onChange={setTagFilter} compact />
                {tagFilter.length > 0 && (
                  <button
                    onClick={() => setTagFilter([])}
                    style={{
                      marginTop:6, padding:'3px 10px', fontSize:10, fontWeight:600,
                      background:'transparent', color:'var(--text3)',
                      border:'1px solid var(--border)', borderRadius:99,
                      cursor:'pointer',
                    }}
                  >
                    ✕ Effacer le filtre tags ({tagFilter.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {loading ? (
        <div style={{...card,padding:'60px',textAlign:'center',color:'var(--text3)'}}>⏳ Chargement…</div>
      ) : (
      <>
        {/* Stats */}
        <div className="stats-5" style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:'12px',marginBottom:'20px'}}>
          {[
            { l:'PnL filtré', v:fmtMoney(stats.totalPnl), c:stats.totalPnl>=0?'var(--green)':'var(--red)', tt:'Somme du PnL de tous les trades correspondant aux filtres actuels (firme/compte/statut).' },
            { l:`PnL ${monthLabel}`, v:fmtMoney(stats.monthPnl), c:stats.monthPnl>=0?'var(--green)':'var(--red)', tt:`Somme du PnL pour le mois affiché (${monthLabel}).` },
            { l:'Win rate', v:stats.total?(stats.wr+'%'):'—', c:stats.wr>=50?'var(--green)':'var(--amber-text)', tt:'Pourcentage de trades gagnants (PnL > 0). Calculé sur les trades filtrés.' },
            {
              l:'Consistency',
              v: stats.consistency!==null ? stats.consistency.toFixed(2)+'%' : '—',
              c: stats.consistency===null ? 'var(--text3)'
                : stats.consistency<30 ? 'var(--green)'
                : stats.consistency<40 ? 'var(--amber-text)'
                : 'var(--red)',
              tt: 'Ratio (meilleur jour gagnant / total des gains positifs). Plus c\'est BAS mieux c\'est. La plupart des PropFirms exigent ≤ 40-50% pour valider tes payouts. Vert <30%, ambre <40%, rouge ≥40%.'
            },
            { l:'Trades', v:stats.total, c:'var(--text)', tt:'Nombre total de trades correspondant aux filtres actuels.' },
            { l:'Jours tradés', v:stats.monthDays, c:'var(--text)', tt:`Nombre de jours uniques avec au moins 1 trade sur ${monthLabel}.` },
          ].map((k,i)=>(
            <div key={i} style={{...card,padding:'16px'}}>
              <div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'8px',display:'inline-flex',alignItems:'center'}}>
                {k.l}
                {k.tt && <TooltipIcon text={k.tt} maxWidth={300} />}
              </div>
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
              {selDay && !noAccounts && !addTradeHref && (
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
                      const hasDetails = e.entry_price || e.exit_price || e.stop_loss || e.take_profit
                      return (
                        <div key={e.id} style={{padding:'10px 12px',background:'var(--surface2)',borderRadius:'var(--radius)',marginBottom:'6px'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px',gap:'6px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                              {e.instrument && <span style={{fontWeight:'600',fontSize:'12px'}}>{e.instrument}</span>}
                              {e.side && <span style={{fontSize:'10px',padding:'1px 6px',borderRadius:'99px',background:'var(--surface3)',color:'var(--text2)'}}>{e.side}</span>}
                              {e.screenshot_url && (
                                <button
                                  onClick={()=>setLightboxUrl(e.screenshot_url)}
                                  title="Voir le screenshot"
                                  style={{
                                    fontSize:'10px',padding:'1px 6px',borderRadius:'99px',
                                    background:'rgba(45,111,255,0.15)',color:'var(--blue-light)',
                                    border:'none',cursor:'pointer',fontWeight:'600',
                                  }}
                                >📷</button>
                              )}
                            </div>
                            <span style={{fontSize:'13px',fontWeight:'700',color:pnl>=0?'var(--green)':pnl<0?'var(--red)':'var(--text3)'}}>{fmtMoney(pnl)}</span>
                          </div>
                          {scope==='all' && (
                            <div style={{fontSize:'10px',color:'var(--text3)',marginBottom:e.notes?'4px':0}}>{e._accountLabel}</div>
                          )}
                          {hasDetails && (
                            <div style={{display:'flex',gap:'10px',flexWrap:'wrap',fontSize:'10px',color:'var(--text3)',marginTop:'3px'}}>
                              {e.entry_price && <span>📍 In : <strong style={{color:'var(--text2)'}}>{e.entry_price}</strong></span>}
                              {e.exit_price && <span>🏁 Out : <strong style={{color:'var(--text2)'}}>{e.exit_price}</strong></span>}
                              {e.stop_loss && <span>🛡 SL : <strong style={{color:'var(--red-text)'}}>{e.stop_loss}</strong></span>}
                              {e.take_profit && <span>🎯 TP : <strong style={{color:'var(--green-text)'}}>{e.take_profit}</strong></span>}
                            </div>
                          )}
                          {/* R-multiple + Risk:Reward — affiché uniquement si données dispo */}
                          {(() => {
                            const r = computeRMultiple({
                              entry: e.entry_price, exit: e.exit_price, stop: e.stop_loss,
                              side: e.side, pnl: e.pnl,
                            })
                            const rr = computeRiskReward({
                              entry: e.entry_price, takeProfit: e.take_profit, stop: e.stop_loss,
                              side: e.side, pnl: e.pnl, exit: e.exit_price,
                            })
                            if (r == null && rr == null) return null
                            return (
                              <div style={{display:'flex',gap:'10px',flexWrap:'wrap',fontSize:'10px',color:'var(--text3)',marginTop:'4px'}}>
                                {r != null && (
                                  <span>📐 R réalisé : <strong style={{color: r>=0?'var(--green)':'var(--red)'}}>{formatR(r)}</strong></span>
                                )}
                                {rr != null && (
                                  <span>⚖ R:R visé : <strong style={{color: rr>=2?'var(--green)':rr>=1?'var(--amber-text)':'var(--red)'}}>{formatRR(rr)}</strong></span>
                                )}
                              </div>
                            )
                          })()}
                          {/* Tags trades : badges colorés (max 4 visibles, le reste en +N) */}
                          {Array.isArray(e.tags) && e.tags.length > 0 && (
                            <div style={{marginTop:'5px'}}>
                              <TagDisplay tags={e.tags} compact max={4} />
                            </div>
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
          <>
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
              <div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'4px'}}>
                RRR empirique
                <TooltipIcon text="Ratio Récompense:Risque empirique = |gain moyen / perte moyenne|. Mesure le rapport entre tes gains et tes pertes moyennes. Idéal > 1.5." maxWidth={280} />
              </div>
              <div style={{fontSize:'18px',fontWeight:'600'}}>
                {stats.avgLoss !== 0
                  ? (Math.abs(stats.avgWin / stats.avgLoss)).toFixed(2)
                  : '—'}
              </div>
            </div>
          </div>

          {/* === Stats R-multiple (nécessite entry + exit + stop sur les trades) === */}
          {(() => {
            const rStats = computeRStats(filteredEntries)
            if (rStats.rCount === 0) {
              return (
                <div style={{...card, padding:'14px 18px', marginTop:'12px', display:'flex',alignItems:'center',gap:'10px',fontSize:'12px',color:'var(--text3)'}}>
                  <span style={{fontSize:'14px'}}>📐</span>
                  <span>Renseigne <strong style={{color:'var(--text2)'}}>Entry, Exit et Stop Loss</strong> sur tes trades pour voir ton R-multiple moyen et ton expectancy.</span>
                </div>
              )
            }
            return (
              <div className="stats-3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginTop:'12px'}}>
                <div style={{...card, padding:'16px'}}>
                  <div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'4px'}}>
                    R moyen
                    <TooltipIcon text="Moyenne des R-multiples réalisés. Un R = ton risque planifié. +1R = tu as gagné autant que ce que tu risquais. Idéal > 0.5R en moyenne." maxWidth={280} />
                  </div>
                  <div style={{fontSize:'18px',fontWeight:'600',color: rStats.avgR>=0.5?'var(--green)':rStats.avgR>=0?'var(--amber-text)':'var(--red)'}}>
                    {formatR(rStats.avgR)}
                  </div>
                  <div style={{fontSize:'10px',color:'var(--text3)',marginTop:'3px'}}>
                    sur {rStats.rCount} trade{rStats.rCount>1?'s':''} avec R calculable
                  </div>
                </div>
                <div style={{...card, padding:'16px'}}>
                  <div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'4px'}}>
                    Best R
                    <TooltipIcon text="Meilleur trade exprimé en R-multiple. Montre ta capacité à laisser courir les gagnants." maxWidth={240} />
                  </div>
                  <div style={{fontSize:'18px',fontWeight:'600',color:'var(--green)'}}>
                    {formatR(rStats.bestR)}
                  </div>
                </div>
                <div style={{...card, padding:'16px'}}>
                  <div style={{fontSize:'10px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'4px'}}>
                    Worst R
                    <TooltipIcon text="Pire trade exprimé en R-multiple. Idéalement proche de −1R (tu as bien respecté ton stop). Si très inférieur à −1R, ton risk management déraille." maxWidth={280} />
                  </div>
                  <div style={{fontSize:'18px',fontWeight:'600',color:'var(--red)'}}>
                    {formatR(rStats.worstR)}
                  </div>
                </div>
              </div>
            )
          })()}
          </>
        )}

        {/* === Courbes de balance par compte === */}
        {(() => {
          // Comptes à afficher : selon le scope ET le statusFilter
          let acctsToShow = []
          if(scope === 'all'){
            acctsToShow = allAccounts.filter(a => passesStatus(a))
          } else if(scope.includes(':')){
            const [, acctId] = scope.split(':')
            acctsToShow = allAccounts.filter(a => a.id === acctId)
          } else {
            acctsToShow = allAccounts.filter(a => a.firmId === scope && passesStatus(a))
          }
          if(!acctsToShow.length) return null

          return (
            <div style={{marginTop:'24px'}}>
              <div style={{fontSize:'15px',fontWeight:'600',marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
                📈 Courbes de balance ({acctsToShow.length})
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(420px,1fr))',gap:'16px'}}>
                {acctsToShow.map(acc => {
                  const accEntries = decoratedEntries.filter(e => e.account_id === acc.id)
                  return (
                    <EquityCurveCard
                      key={acc.id}
                      account={acc}
                      entries={accEntries}
                      getFirmLogo={getFirmLogo}
                      onResetBalance={resetAccountBalance}
                      onAddTrade={(acctId) => openNewEntry({ accountId: acctId })}
                      addTradeHref={addTradeHref}
                    />
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* === Section extra (injection par le parent — ex: historique trades sync) === */}
        {renderExtraSection && renderExtraSection({ filteredEntries, decoratedEntries, allAccounts, firms })}
      </>
      )}

      {/* Lightbox plein écran pour visualiser un screenshot */}
      {lightboxUrl && (
        <div onClick={()=>setLightboxUrl(null)} style={{
          position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:600,
          display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',cursor:'zoom-out',
        }}>
          <img src={lightboxUrl} alt="Screenshot" style={{maxWidth:'95%',maxHeight:'95%',objectFit:'contain',borderRadius:'8px'}} />
          <button onClick={()=>setLightboxUrl(null)} style={{
            position:'absolute',top:'20px',right:'20px',
            background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)',
            borderRadius:'8px',padding:'8px 16px',fontSize:'13px',cursor:'pointer',fontWeight:'600',
          }}>✕ Fermer</button>
        </div>
      )}

      {/* Modal ajout / édition */}
      {entryModal && (
        <div onClick={()=>setEntryModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'12px',overflowY:'auto'}}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{...card,padding:'28px',width:'560px',maxWidth:'100%',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,0.5)'}}>
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
                          {f.name} · {accountLabel(a)} ({a.status})
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

              {/* === Détails approfondis (optionnels) === */}
              <div style={{gridColumn:'1/-1',marginTop:'8px',paddingTop:'16px',borderTop:'1px solid var(--border)'}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'10px'}}>
                  📊 Détails du trade (optionnel)
                </div>
              </div>
              <div>
                <label style={labelS}>Prix d'entrée</label>
                <input type="number" step="0.0001" value={form.entryPrice} onChange={e=>setForm(p=>({...p,entryPrice:e.target.value}))} placeholder="ex : 5430.25" style={inputS} />
              </div>
              <div>
                <label style={labelS}>Prix de sortie</label>
                <input type="number" step="0.0001" value={form.exitPrice} onChange={e=>setForm(p=>({...p,exitPrice:e.target.value}))} placeholder="ex : 5435.50" style={inputS} />
              </div>
              <div>
                <label style={labelS}>Stop Loss</label>
                <input type="number" step="0.0001" value={form.stopLoss} onChange={e=>setForm(p=>({...p,stopLoss:e.target.value}))} placeholder="ex : 5425.00" style={inputS} />
              </div>
              <div>
                <label style={labelS}>Take Profit</label>
                <input type="number" step="0.0001" value={form.takeProfit} onChange={e=>setForm(p=>({...p,takeProfit:e.target.value}))} placeholder="ex : 5440.00" style={inputS} />
              </div>

              {/* === Aperçu R-multiple & R:R en temps réel === */}
              {(() => {
                const r = computeRMultiple({
                  entry: form.entryPrice, exit: form.exitPrice, stop: form.stopLoss,
                  side: form.side, pnl: form.pnl,
                })
                const rr = computeRiskReward({
                  entry: form.entryPrice, takeProfit: form.takeProfit, stop: form.stopLoss,
                  side: form.side, pnl: form.pnl, exit: form.exitPrice,
                })
                if (r == null && rr == null) return null
                return (
                  <div style={{gridColumn:'1/-1',marginTop:'4px',padding:'10px 14px',background:'rgba(45,111,255,0.06)',border:'1px solid rgba(45,111,255,0.20)',borderRadius:'8px',display:'flex',gap:'18px',flexWrap:'wrap',alignItems:'center',fontSize:'12px'}}>
                    <span style={{fontWeight:'700',color:'var(--blue-light)',fontSize:'10px',letterSpacing:'0.5px',textTransform:'uppercase'}}>
                      📐 Aperçu
                    </span>
                    {r != null && (
                      <span style={{color:'var(--text2)'}}>
                        R réalisé : <strong style={{color: r>=0?'var(--green)':'var(--red)',fontSize:'13px'}}>{formatR(r)}</strong>
                      </span>
                    )}
                    {rr != null && (
                      <span style={{color:'var(--text2)'}}>
                        R:R visé : <strong style={{color: rr>=2?'var(--green)':rr>=1?'var(--amber-text)':'var(--red)',fontSize:'13px'}}>{formatRR(rr)}</strong>
                        {rr < 1 && <span style={{marginLeft:'6px',fontSize:'10px',color:'var(--red)'}}>⚠ setup risqué (R:R &lt; 1)</span>}
                        {rr >= 2 && <span style={{marginLeft:'6px',fontSize:'10px',color:'var(--green)'}}>✓ bon setup</span>}
                      </span>
                    )}
                  </div>
                )
              })()}

              {/* === Tags trades (psychologie + setup + contexte) === */}
              <div style={{gridColumn:'1/-1',marginTop:'8px',paddingTop:'16px',borderTop:'1px solid var(--border)'}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'10px'}}>
                  🏷 Tags du trade (optionnel)
                  <span style={{textTransform:'none',letterSpacing:0,fontWeight:'normal',color:'var(--text3)',fontSize:'10px',marginLeft:'6px'}}>
                    — pour analyser ta psycho &amp; tes setups
                  </span>
                </div>
                <TagSelector
                  value={form.tags}
                  onChange={tags => setForm(p => ({ ...p, tags }))}
                />
              </div>

              {/* === Screenshot du graphique === */}
              <div style={{gridColumn:'1/-1'}}>
                <label style={labelS}>📷 Screenshot du graphique</label>
                {form.screenshotUrl ? (
                  <div style={{position:'relative',marginBottom:'8px'}}>
                    <img
                      src={form.screenshotUrl}
                      alt="Screenshot trade"
                      onClick={()=>setLightboxUrl(form.screenshotUrl)}
                      style={{width:'100%',maxHeight:'200px',objectFit:'cover',borderRadius:'8px',cursor:'zoom-in',border:'1px solid var(--border)'}}
                    />
                    <button onClick={()=>setForm(p=>({...p,screenshotUrl:''}))} style={{
                      position:'absolute',top:'8px',right:'8px',
                      background:'rgba(0,0,0,0.7)',color:'#fff',border:'none',borderRadius:'6px',
                      padding:'5px 10px',fontSize:'11px',cursor:'pointer',fontWeight:'600',
                    }}>✕ Retirer</button>
                  </div>
                ) : (
                  <label style={{
                    display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',
                    padding:'16px',border:'1px dashed var(--border2)',borderRadius:'8px',
                    cursor: uploadingScreen ? 'wait' : 'pointer',background:'var(--surface2)',
                    color:'var(--text2)',fontSize:'12px',
                  }}>
                    {uploadingScreen ? '⏳ Upload en cours...' : '📤 Cliquer pour uploader (PNG/JPG, max 5 Mo)'}
                    <input
                      type="file" accept="image/*"
                      disabled={uploadingScreen}
                      onChange={e=>handleScreenshotUpload(e.target.files?.[0])}
                      style={{display:'none'}}
                    />
                  </label>
                )}
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
