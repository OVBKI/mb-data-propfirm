'use client'
// /backtest-preview — PREVIEW of a new Quantara feature: "Chart Replay / Backtest"
// (TradingView-style bar replay). Standalone, no Supabase/AppContext deps.
//
// - Custom canvas candlestick chart (no extra dependency)
// - Bar replay: step back / step forward / play-pause / speed / restart / scrub
// - Virtual trades: Long/Short, size, SL/TP, close; live P&L, entry/SL/TP lines,
//   trade markers
// - Deterministic engine: state = pure function of (orders, cursor), so stepping
//   BACK cleanly undoes future trades
// - Synthetic seeded OHLC data (works offline). Stats: balance, net, win rate, maxDD.
//
// Keyboard: ← / → step, Space play/pause.

import Link from 'next/link'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import QLogoIcon from '../../components/QLogoIcon'

const C = {
  bg: '#080a0f', panel: 'rgba(20,24,34,0.7)', panel2: 'rgba(28,33,47,0.75)',
  line: 'rgba(255,255,255,0.08)', line2: 'rgba(255,255,255,0.14)',
  text: '#f0ede8', text2: '#9aa3bd', text3: '#6b748c',
  blue: '#4d8fff', up: '#19c37d', down: '#e8504a', amber: '#f5b651',
  grid: 'rgba(255,255,255,0.045)',
}
const MONO = 'ui-monospace, "SF Mono", "Roboto Mono", monospace'

const INSTR = {
  BTC: { base: 64000, vol: 650, mult: 1,    dec: 1, slPts: 600, tpPts: 1200, provider: 'binance', sym: 'BTCUSDT', name: 'Bitcoin' },
  ETH: { base: 3200,  vol: 45,  mult: 1,    dec: 1, slPts: 40,  tpPts: 80,   provider: 'binance', sym: 'ETHUSDT', name: 'Ethereum' },
  ES:  { base: 5200,  vol: 13,  mult: 50,   dec: 2, slPts: 10,  tpPts: 20,   provider: 'databento', sym: 'ES', name: 'S&P 500 (CME)' },
  NQ:  { base: 18400, vol: 55,  mult: 20,   dec: 2, slPts: 40,  tpPts: 80,   provider: 'databento', sym: 'NQ', name: 'Nasdaq (CME)' },
  GC:  { base: 2350,  vol: 7,   mult: 100,  dec: 1, slPts: 6,   tpPts: 12,   provider: 'databento', sym: 'GC', name: 'Gold (COMEX)' },
  CL:  { base: 78,    vol: 0.7, mult: 1000, dec: 2, slPts: 0.6, tpPts: 1.2,  provider: 'databento', sym: 'CL', name: 'Crude (NYMEX)' },
}
const TFS = ['1m', '5m', '15m', '1h', '4h']
const START_BAL = 50000
const NBARS = 480
const VIEW = 110           // visible candles window
const START_CURSOR = 90

function rngFrom(seed) {
  let s = seed >>> 0
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function genBars(seed, base, vol) {
  const r = rngFrom(seed); const bars = []; let price = base; let trend = 0
  for (let i = 0; i < NBARS; i++) {
    trend = trend * 0.95 + (r() - 0.5) * vol * 0.5
    const o = price
    const c = Math.max(0.01, o + trend + (r() - 0.5) * vol)
    const h = Math.max(o, c) + r() * vol * 0.7
    const l = Math.min(o, c) - r() * vol * 0.7
    bars.push({ o, h, l, c, v: Math.round(400 + r() * 2200) })
    price = c
  }
  return bars
}

// Pure simulation: replay bars[0..cursor] applying orders at their bar + SL/TP exits.
function simulate(bars, orders, cursor, mult) {
  let pos = null
  const closed = []
  let balance = START_BAL
  const ordersByBar = {}
  orders.forEach(o => { (ordersByBar[o.bar] = ordersByBar[o.bar] || []).push(o) })

  const close = (exit, bar, reason) => {
    const dir = pos.side === 'long' ? 1 : -1
    const pnl = (exit - pos.entry) * dir * pos.size * mult
    balance += pnl
    closed.push({ ...pos, exit, exitBar: bar, pnl, reason })
    pos = null
  }

  for (let b = 0; b <= cursor && b < bars.length; b++) {
    const bar = bars[b]
    ;(ordersByBar[b] || []).forEach(ev => {
      if (ev.type === 'open' && !pos) {
        pos = { side: ev.side, size: ev.size, entry: bar.c, sl: ev.sl, tp: ev.tp, entryBar: b }
      } else if (ev.type === 'close' && pos) {
        close(bar.c, b, 'manual')
      }
    })
    if (pos && b > pos.entryBar) {
      if (pos.side === 'long') {
        if (pos.sl && bar.l <= pos.sl) close(pos.sl, b, 'sl')
        else if (pos.tp && bar.h >= pos.tp) close(pos.tp, b, 'tp')
      } else {
        if (pos.sl && bar.h >= pos.sl) close(pos.sl, b, 'sl')
        else if (pos.tp && bar.l <= pos.tp) close(pos.tp, b, 'tp')
      }
    }
  }
  const last = bars[Math.min(cursor, bars.length - 1)]
  let uPnl = 0
  if (pos) { const dir = pos.side === 'long' ? 1 : -1; uPnl = (last.c - pos.entry) * dir * pos.size * mult }

  // stats
  const wins = closed.filter(t => t.pnl > 0).length
  const net = balance - START_BAL
  let peak = START_BAL, dd = 0, run = START_BAL
  closed.forEach(t => { run += t.pnl; if (run > peak) peak = run; dd = Math.min(dd, run - peak) })
  return { pos, closed, balance, uPnl, equity: balance + uPnl, wins, winRate: closed.length ? wins / closed.length * 100 : 0, net, maxDD: dd }
}

const money = (v, d = 0) => (v >= 0 ? '+' : '−') + '$' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

export default function BacktestPreview() {
  const [seed, setSeed] = useState(1337)
  const [instr, setInstr] = useState('BTC')
  const [tf, setTf] = useState('5m')
  const [cursor, setCursor] = useState(START_CURSOR)
  const [orders, setOrders] = useState([])
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [size, setSize] = useState(1)
  const [slPts, setSlPts] = useState(INSTR.ES.slPts)
  const [tpPts, setTpPts] = useState(INSTR.ES.tpPts)
  const [hover, setHover] = useState(null) // {x,y}

  const [src, setSrc] = useState({ label: 'Chargement…', real: false, loading: true })
  const cfg = INSTR[instr]
  const [bars, setBars] = useState(() => genBars(1337, INSTR.BTC.base, INSTR.BTC.vol))
  const sim = useMemo(() => simulate(bars, orders, cursor, cfg.mult), [bars, orders, cursor, cfg])

  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const [dims, setDims] = useState({ w: 900, h: 460 })

  // default SL/TP per instrument
  useEffect(() => { setSlPts(cfg.slPts); setTpPts(cfg.tpPts) }, [instr, cfg])

  // fetch real bars (Binance crypto = live; Databento CME = key-gated) with synthetic fallback
  useEffect(() => {
    let abort = false
    const synth = () => genBars((seed + instr.charCodeAt(0) * 17) >>> 0, cfg.base, cfg.vol)
    const apply = (b, srcObj) => { if (abort) return; setBars(b); setSrc(srcObj); setOrders([]); setCursor(START_CURSOR); setPlaying(false) }
    setSrc(s => ({ ...s, loading: true }))
    fetch(`/api/market/bars?provider=${cfg.provider}&symbol=${cfg.sym}&interval=${tf}&limit=${NBARS}`)
      .then(r => r.json().then(j => ({ ok: r.ok, j })).catch(() => ({ ok: false, j: null })))
      .then(({ ok, j }) => {
        if (ok && j && j.ok && Array.isArray(j.bars) && j.bars.length > 50) {
          apply(j.bars.map(b => ({ o: b.o, h: b.h, l: b.l, c: b.c, v: b.v })), { label: 'Réel · ' + j.source, real: true, loading: false })
        } else {
          const why = j && j.code === 'NO_KEY' ? 'Simulé · clé CME requise (DATABENTO_API_KEY)' : 'Simulé · données réelles indispo'
          apply(synth(), { label: why, real: false, loading: false })
        }
      })
      .catch(() => apply(synth(), { label: 'Simulé · hors-ligne', real: false, loading: false }))
    return () => { abort = true }
  }, [seed, instr, tf, cfg])

  // responsive canvas size
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(es => { for (const e of es) setDims({ w: Math.floor(e.contentRect.width), h: 460 }) })
    ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  // play loop
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setCursor(c => { if (c >= bars.length - 1) { setPlaying(false); return c } return c + 1 })
    }, 420 / speed)
    return () => clearInterval(id)
  }, [playing, speed, bars.length])

  const stepFwd = useCallback(() => setCursor(c => Math.min(bars.length - 1, c + 1)), [bars.length])
  const stepBack = useCallback(() => setCursor(c => Math.max(20, c - 1)), [])

  // keyboard
  useEffect(() => {
    const onKey = e => {
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'ArrowRight') { e.preventDefault(); stepFwd() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); stepBack() }
      else if (e.key === ' ') { e.preventDefault(); setPlaying(p => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stepFwd, stepBack])

  // place / close orders (dropping any "future" orders -> new branch on rewind)
  const placeOrder = (side) => {
    if (sim.pos) return
    const entry = bars[cursor].c
    const sl = slPts > 0 ? (side === 'long' ? entry - slPts : entry + slPts) : null
    const tp = tpPts > 0 ? (side === 'long' ? entry + tpPts : entry - tpPts) : null
    setOrders(o => [...o.filter(x => x.bar < cursor), { bar: cursor, type: 'open', side, size, sl, tp }])
    setPlaying(false)
  }
  const closeNow = () => {
    if (!sim.pos) return
    setOrders(o => [...o.filter(x => x.bar < cursor), { bar: cursor, type: 'close' }])
  }

  // ── draw chart ──
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = dims.w, H = dims.h
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)
    const padR = 64, padB = 22, padT = 10, padL = 8
    const chartW = W - padR - padL, chartH = H - padB - padT

    const w0 = Math.max(0, cursor - VIEW + 1)
    const vis = []
    for (let i = w0; i <= cursor; i++) vis.push(i)
    let pmin = Infinity, pmax = -Infinity
    vis.forEach(i => { pmin = Math.min(pmin, bars[i].l); pmax = Math.max(pmax, bars[i].h) })
    if (sim.pos) { if (sim.pos.sl) { pmin = Math.min(pmin, sim.pos.sl); pmax = Math.max(pmax, sim.pos.sl) } if (sim.pos.tp) { pmin = Math.min(pmin, sim.pos.tp); pmax = Math.max(pmax, sim.pos.tp) } }
    const pad = (pmax - pmin) * 0.08 || 1; pmin -= pad; pmax += pad
    const n = vis.length
    const cw = chartW / VIEW
    const bw = Math.max(1.5, cw * 0.62)
    const X = k => padL + (k + 0.5) * cw
    const Yv = p => padT + (1 - (p - pmin) / (pmax - pmin)) * chartH

    // grid + price axis
    ctx.font = '10px ' + MONO; ctx.textBaseline = 'middle'
    const ticks = 6
    for (let t = 0; t <= ticks; t++) {
      const p = pmin + (pmax - pmin) * (t / ticks); const y = Yv(p)
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke()
      ctx.fillStyle = C.text3; ctx.textAlign = 'left'; ctx.fillText(p.toFixed(cfg.dec), padL + chartW + 8, y)
    }

    // candles
    vis.forEach((bi, k) => {
      const b = bars[bi]; const x = X(k); const up = b.c >= b.o
      const col = up ? C.up : C.down
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(x, Yv(b.h)); ctx.lineTo(x, Yv(b.l)); ctx.stroke()
      const yo = Yv(b.o), yc = Yv(b.c); const top = Math.min(yo, yc); const hgt = Math.max(1.2, Math.abs(yc - yo))
      ctx.globalAlpha = up ? 0.95 : 1; ctx.fillRect(x - bw / 2, top, bw, hgt); ctx.globalAlpha = 1
    })

    // closed trade markers (entry ▲/▼ and exit ✕) within view
    sim.closed.forEach(t => {
      if (t.entryBar >= w0 && t.entryBar <= cursor) {
        const x = X(t.entryBar - w0), y = Yv(t.entry)
        ctx.fillStyle = t.side === 'long' ? C.up : C.down
        ctx.beginPath()
        if (t.side === 'long') { ctx.moveTo(x, y + 12); ctx.lineTo(x - 5, y + 20); ctx.lineTo(x + 5, y + 20) }
        else { ctx.moveTo(x, y - 12); ctx.lineTo(x - 5, y - 20); ctx.lineTo(x + 5, y - 20) }
        ctx.closePath(); ctx.fill()
      }
      if (t.exitBar >= w0 && t.exitBar <= cursor) {
        const x = X(t.exitBar - w0), y = Yv(t.exit)
        ctx.strokeStyle = t.pnl >= 0 ? C.up : C.down; ctx.lineWidth = 1.6
        ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4); ctx.stroke()
      }
    })

    // open position lines (entry / SL / TP)
    if (sim.pos) {
      const drawLine = (p, color, label, dash) => {
        const y = Yv(p); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash(dash || [])
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + chartW, y); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = color; ctx.fillRect(padL + chartW, y - 8, padR - 8, 16)
        ctx.fillStyle = '#04121a'; ctx.textAlign = 'left'; ctx.font = '9.5px ' + MONO
        ctx.fillText(label, padL + chartW + 4, y)
      }
      const ex = sim.pos.entryBar >= w0 ? X(sim.pos.entryBar - w0) : padL
      drawLine(sim.pos.entry, C.blue, sim.pos.entry.toFixed(cfg.dec), [])
      if (sim.pos.sl) drawLine(sim.pos.sl, C.down, 'SL', [4, 3])
      if (sim.pos.tp) drawLine(sim.pos.tp, C.up, 'TP', [4, 3])
      // entry marker dot
      ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(ex, Yv(sim.pos.entry), 3.5, 0, 7); ctx.fill()
    }

    // last price line
    const lp = bars[cursor].c; const ly = Yv(lp)
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.setLineDash([2, 3]); ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(padL, ly); ctx.lineTo(padL + chartW, ly); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = bars[cursor].c >= bars[cursor].o ? C.up : C.down; ctx.fillRect(padL + chartW, ly - 8, padR - 8, 16)
    ctx.fillStyle = '#04121a'; ctx.textAlign = 'left'; ctx.font = 'bold 9.5px ' + MONO; ctx.fillText(lp.toFixed(cfg.dec), padL + chartW + 4, ly)

    // crosshair
    if (hover) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(hover.x, padT); ctx.lineTo(hover.x, padT + chartH); ctx.moveTo(padL, hover.y); ctx.lineTo(padL + chartW, hover.y); ctx.stroke(); ctx.setLineDash([])
      const price = pmin + (1 - (hover.y - padT) / chartH) * (pmax - pmin)
      ctx.fillStyle = '#11151f'; ctx.fillRect(padL + chartW, hover.y - 8, padR - 8, 16)
      ctx.fillStyle = C.text; ctx.textAlign = 'left'; ctx.font = '9.5px ' + MONO; ctx.fillText(price.toFixed(cfg.dec), padL + chartW + 4, hover.y)
    }
  }, [bars, cursor, sim, dims, hover, cfg])

  const onMove = e => {
    const rect = canvasRef.current.getBoundingClientRect()
    setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }
  const progress = cursor / (bars.length - 1)

  return (
    <div className="bt">
      <style>{css}</style>

      {/* top bar */}
      <header className="bt-top">
        <Link href="/landing" className="bt-brand"><QLogoIcon size={26} color={C.blue} /><span>QUANTARA</span></Link>
        <div className="bt-title">Backtest · <span>Replay graphique</span></div>
        <div className={'bt-badge' + (src.real ? ' real' : '') + (src.loading ? ' loading' : '')}>
          <i className="bt-srcdot" />{src.loading ? 'Chargement…' : src.label}
        </div>
      </header>

      <div className="bt-grid">
        {/* CHART + controls */}
        <div className="bt-main">
          <div className="bt-bar">
            <div className="bt-selects">
              <select value={instr} onChange={e => setInstr(e.target.value)}>{Object.keys(INSTR).map(k => <option key={k} value={k}>{k}</option>)}</select>
              <select value={tf} onChange={e => setTf(e.target.value)}>{TFS.map(k => <option key={k} value={k}>{k}</option>)}</select>
              <button className="bt-ghost" onClick={() => setSeed(s => s + 1)}>⟳ Nouveau dataset</button>
            </div>
            <div className="bt-clock">Bar {cursor + 1} / {bars.length}</div>
          </div>

          <div className="bt-chartwrap" ref={wrapRef}>
            <canvas ref={canvasRef} onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
          </div>

          {/* replay controls */}
          <div className="bt-controls">
            <div className="bt-btns">
              <button className="bt-ctrl" onClick={() => setCursor(20)} title="Début">⏮</button>
              <button className="bt-ctrl" onClick={stepBack} title="Pas en arrière (←)">◀</button>
              <button className="bt-ctrl bt-play" onClick={() => setPlaying(p => !p)} title="Lecture / pause (Espace)">{playing ? '❚❚' : '▶'}</button>
              <button className="bt-ctrl" onClick={stepFwd} title="Pas en avant (→)">▶</button>
              <button className="bt-ctrl" onClick={() => setCursor(bars.length - 1)} title="Fin">⏭</button>
              <div className="bt-speed">
                {[1, 2, 4].map(s => <button key={s} className={'bt-spd' + (speed === s ? ' on' : '')} onClick={() => setSpeed(s)}>{s}×</button>)}
              </div>
            </div>
            <input className="bt-scrub" type="range" min={20} max={bars.length - 1} value={cursor} onChange={e => { setPlaying(false); setCursor(+e.target.value) }} style={{ '--p': progress }} />
          </div>
        </div>

        {/* SIDE: ticket + stats + trades */}
        <aside className="bt-side">
          {/* account */}
          <div className="bt-card bt-acct">
            <div className="bt-acct-row"><span>Balance</span><b className="mono">${sim.balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</b></div>
            <div className="bt-acct-row"><span>Équité (latent)</span><b className={'mono ' + (sim.uPnl >= 0 ? 'up' : 'down')}>{money(sim.equity - START_BAL)}</b></div>
          </div>

          {/* ticket */}
          <div className="bt-card">
            <div className="bt-card-t">Ordre</div>
            <div className="bt-fields">
              <label>Taille (contrats)<input type="number" min={1} value={size} onChange={e => setSize(Math.max(1, +e.target.value || 1))} /></label>
              <label>Stop (pts)<input type="number" min={0} step={cfg.slPts / 10} value={slPts} onChange={e => setSlPts(Math.max(0, +e.target.value || 0))} /></label>
              <label>Target (pts)<input type="number" min={0} step={cfg.tpPts / 10} value={tpPts} onChange={e => setTpPts(Math.max(0, +e.target.value || 0))} /></label>
            </div>
            {sim.pos ? (
              <div className="bt-open">
                <div className="bt-open-row"><span className={'bt-side ' + sim.pos.side}>{sim.pos.side === 'long' ? 'LONG' : 'SHORT'}</span><span className="mono">{sim.pos.size} @ {sim.pos.entry.toFixed(cfg.dec)}</span></div>
                <div className="bt-open-pnl"><span>P&amp;L latent</span><b className={'mono ' + (sim.uPnl >= 0 ? 'up' : 'down')}>{money(sim.uPnl)}</b></div>
                <button className="bt-close" onClick={closeNow}>Fermer la position</button>
              </div>
            ) : (
              <div className="bt-trade-btns">
                <button className="bt-long" onClick={() => placeOrder('long')}>▲ Long</button>
                <button className="bt-short" onClick={() => placeOrder('short')}>▼ Short</button>
              </div>
            )}
          </div>

          {/* stats */}
          <div className="bt-card">
            <div className="bt-card-t">Performance</div>
            {[
              ['Net réalisé', money(sim.net), sim.net >= 0 ? 'up' : 'down'],
              ['Trades', String(sim.closed.length), ''],
              ['Win rate', sim.winRate.toFixed(0) + '%', sim.winRate >= 50 ? 'up' : ''],
              ['Max drawdown', money(sim.maxDD), 'down'],
            ].map(([l, v, t]) => <div key={l} className="bt-stat"><span>{l}</span><b className={'mono ' + t}>{v}</b></div>)}
          </div>

          {/* trades list */}
          <div className="bt-card bt-trades">
            <div className="bt-card-t">Historique ({sim.closed.length})</div>
            <div className="bt-tlist">
              {sim.closed.slice().reverse().slice(0, 8).map((t, i) => (
                <div key={i} className="bt-trow">
                  <span className={'bt-tside ' + t.side}>{t.side === 'long' ? 'L' : 'S'}</span>
                  <span className="mono bt-tpx">{t.entry.toFixed(cfg.dec)}→{t.exit.toFixed(cfg.dec)}</span>
                  <span className={'bt-tag ' + t.reason}>{t.reason.toUpperCase()}</span>
                  <span className={'mono bt-tpnl ' + (t.pnl >= 0 ? 'up' : 'down')}>{money(t.pnl)}</span>
                </div>
              ))}
              {!sim.closed.length && <div className="bt-empty">Place un trade puis avance les barres (→).</div>}
            </div>
          </div>
        </aside>
      </div>

      <footer className="bt-foot">Maquette · {'<'}canvas{'>'} maison · données simulées (random-walk seedé). Raccourcis : ← / → barre · Espace lecture.</footer>
    </div>
  )
}

const css = `
.bt{min-height:100vh;background:radial-gradient(900px 500px at 85% -8%,rgba(45,111,255,0.10),transparent 60%),${C.bg};color:${C.text};font-family:-apple-system,'Segoe UI',system-ui,sans-serif}
.bt *{box-sizing:border-box}
.bt .mono{font-family:${MONO}}.bt .up{color:${C.up}}.bt .down{color:${C.down}}
.bt-top{display:flex;align-items:center;gap:18px;padding:14px 24px;border-bottom:1px solid ${C.line}}
.bt-brand{display:flex;align-items:center;gap:9px;font-weight:800;letter-spacing:.14em;font-size:13px;color:${C.text};text-decoration:none}
.bt-title{font-size:15px;font-weight:700}.bt-title span{color:${C.text2};font-weight:500}
.bt-badge{margin-left:auto;display:flex;align-items:center;gap:7px;font-size:11px;color:${C.amber};background:rgba(245,182,81,0.12);border:1px solid rgba(245,182,81,0.3);padding:5px 11px;border-radius:99px}
.bt-badge .bt-srcdot{width:7px;height:7px;border-radius:50%;background:${C.amber}}
.bt-badge.real{color:${C.up};background:rgba(25,195,125,0.12);border-color:rgba(25,195,125,0.32)}
.bt-badge.real .bt-srcdot{background:${C.up};box-shadow:0 0 8px ${C.up}}
.bt-badge.loading{color:${C.text2};background:rgba(255,255,255,0.05);border-color:${C.line2}}
.bt-badge.loading .bt-srcdot{background:${C.text2};animation:btpulse 1s infinite}
@keyframes btpulse{0%,100%{opacity:1}50%{opacity:.3}}
.bt-grid{display:grid;grid-template-columns:1fr 300px;gap:16px;padding:18px 24px;max-width:1320px;margin:0 auto;align-items:start}
.bt-main{min-width:0}
.bt-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:12px;flex-wrap:wrap}
.bt-selects{display:flex;gap:8px;align-items:center}
.bt-selects select{background:${C.panel};color:${C.text};border:1px solid ${C.line2};border-radius:9px;padding:9px 12px;font-size:13px;font-family:inherit;font-weight:600;cursor:pointer}
.bt-ghost{background:${C.panel};color:${C.text2};border:1px solid ${C.line2};border-radius:9px;padding:9px 13px;font-size:12.5px;cursor:pointer;font-family:inherit}
.bt-ghost:hover{color:${C.text};border-color:${C.blue}}
.bt-clock{font-family:${MONO};font-size:12px;color:${C.text3}}
.bt-chartwrap{background:linear-gradient(165deg,${C.panel2},${C.panel});border:1px solid ${C.line};border-radius:14px;overflow:hidden;padding:6px}
.bt-chartwrap canvas{display:block;cursor:crosshair}
.bt-controls{margin-top:12px;background:${C.panel};border:1px solid ${C.line};border-radius:12px;padding:12px 14px}
.bt-btns{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.bt-ctrl{width:40px;height:38px;border-radius:9px;border:1px solid ${C.line2};background:rgba(255,255,255,0.03);color:${C.text};font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s}
.bt-ctrl:hover{border-color:${C.blue};color:${C.blue}}
.bt-play{background:linear-gradient(135deg,${C.blue},#2d6fff);color:#fff;border:none;width:48px;font-size:13px}
.bt-speed{display:flex;gap:4px;margin-left:auto;background:rgba(255,255,255,0.03);border:1px solid ${C.line2};border-radius:8px;padding:3px}
.bt-spd{border:none;background:transparent;color:${C.text2};font-size:12px;font-weight:700;padding:5px 9px;border-radius:6px;cursor:pointer;font-family:${MONO}}
.bt-spd.on{background:${C.blue};color:#fff}
.bt-scrub{width:100%;-webkit-appearance:none;appearance:none;height:6px;border-radius:99px;background:linear-gradient(90deg,${C.blue} calc(var(--p)*100%),rgba(255,255,255,0.1) calc(var(--p)*100%));outline:none;cursor:pointer}
.bt-scrub::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid ${C.blue};cursor:pointer}
.bt-scrub::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid ${C.blue};cursor:pointer}

.bt-side{display:flex;flex-direction:column;gap:12px}
.bt-card{background:linear-gradient(165deg,${C.panel2},${C.panel});border:1px solid ${C.line};border-radius:14px;padding:16px}
.bt-card-t{font-size:12px;font-weight:700;color:${C.text3};text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px}
.bt-acct-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0}
.bt-acct-row span{font-size:12.5px;color:${C.text2}}.bt-acct-row b{font-size:18px}
.bt-fields{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px}
.bt-fields label{font-size:10px;color:${C.text3};font-weight:600;display:flex;flex-direction:column;gap:5px}
.bt-fields input{background:rgba(255,255,255,0.03);border:1px solid ${C.line2};border-radius:8px;padding:8px;color:${C.text};font-size:13px;font-family:${MONO};width:100%}
.bt-trade-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.bt-long,.bt-short{border:none;border-radius:10px;padding:13px;font-size:14px;font-weight:800;cursor:pointer;color:#fff;letter-spacing:.02em}
.bt-long{background:linear-gradient(135deg,#16a86c,${C.up})}.bt-short{background:linear-gradient(135deg,#cf3f3a,${C.down})}
.bt-long:hover,.bt-short:hover{filter:brightness(1.1)}
.bt-open{display:flex;flex-direction:column;gap:8px}
.bt-open-row{display:flex;justify-content:space-between;align-items:center;font-size:13px}
.bt-side{font-weight:800;font-size:12px;padding:3px 9px;border-radius:6px}
.bt-side.long{background:rgba(25,195,125,0.16);color:${C.up}}.bt-side.short{background:rgba(232,80,74,0.16);color:${C.down}}
.bt-open-pnl{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid ${C.line};border-bottom:1px solid ${C.line}}
.bt-open-pnl span{font-size:12px;color:${C.text2}}.bt-open-pnl b{font-size:17px}
.bt-close{margin-top:2px;background:rgba(255,255,255,0.05);border:1px solid ${C.line2};color:${C.text};border-radius:9px;padding:11px;font-size:13px;font-weight:700;cursor:pointer}
.bt-close:hover{border-color:${C.down};color:${C.down}}
.bt-stat{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid ${C.line};font-size:12.5px}
.bt-stat span{color:${C.text2}}.bt-stat b{font-size:14px}
.bt-trades{flex:1}
.bt-tlist{display:flex;flex-direction:column;gap:6px}
.bt-trow{display:grid;grid-template-columns:auto 1fr auto auto;gap:8px;align-items:center;font-size:12px;padding:7px 9px;background:rgba(255,255,255,0.02);border:1px solid ${C.line};border-radius:8px}
.bt-tside{font-weight:800;font-size:10px;width:18px;height:18px;display:flex;align-items:center;justify-content:center;border-radius:5px}
.bt-tside.long{background:rgba(25,195,125,0.16);color:${C.up}}.bt-tside.short{background:rgba(232,80,74,0.16);color:${C.down}}
.bt-tpx{font-size:11px;color:${C.text2}}
.bt-tag{font-size:8.5px;font-weight:700;padding:2px 5px;border-radius:4px;letter-spacing:.04em}
.bt-tag.tp{background:rgba(25,195,125,0.16);color:${C.up}}.bt-tag.sl{background:rgba(232,80,74,0.16);color:${C.down}}.bt-tag.manual{background:rgba(255,255,255,0.07);color:${C.text2}}
.bt-tpnl{font-weight:700;text-align:right}
.bt-empty{font-size:12px;color:${C.text3};padding:10px 2px;line-height:1.5}
.bt-foot{text-align:center;padding:22px;font-size:12px;color:${C.text3};border-top:1px solid ${C.line};margin-top:10px}

@media(max-width:980px){.bt-grid{grid-template-columns:1fr}}
`
