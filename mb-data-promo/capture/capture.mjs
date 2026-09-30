// capture.mjs — capture les VRAIES pages de Quantara (next dev) avec un trader
// fictif. Supabase est simulé au niveau réseau (PostgREST + auth) : aucune base,
// aucune donnée réelle. Sortie : 1920×1080 @2x dans textures/<id>.png + layout.json.
//   node capture.mjs [id…]
import pkg from '/tmp/claude-0/-home-user-mb-data-propfirm/581eccfd-d9f3-56f0-a3a1-44a9ca043f90/scratchpad/pw/node_modules/playwright-core/index.js'
import fs from 'fs'
import * as FX from './fixtures.mjs'
const { chromium } = pkg
const HERE = new URL('.', import.meta.url).pathname
const BASE = 'http://localhost:3000'
const OUT = HERE + 'textures/'; fs.mkdirSync(OUT, { recursive: true })

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const JWT = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: FX.USER_ID, role: 'authenticated', exp: 4102444800 })}.sig`
const SESSION = { access_token: JWT, refresh_token: 'demo', token_type: 'bearer', expires_in: 999999999, expires_at: 4102444800, user: FX.USER }

function embed(table, rows, select) {
  const s = select || '*'
  return rows.map(r => {
    const o = { ...r }
    if (table === 'firms' && s.includes('accounts(')) o.accounts = FX.accounts.filter(a => a.firm_id === r.id).map(a => (s.includes('payouts(') ? { ...a, payouts: FX.payouts.filter(p => p.account_id === a.id) } : a))
    if (table === 'accounts' && s.includes('payouts(')) o.payouts = FX.payouts.filter(p => p.account_id === r.id)
    if (table === 'accounts' && s.includes('firms(')) o.firms = FX.firms.find(f => f.id === r.firm_id) || null
    if (table === 'journal_entries' && s.includes('accounts(')) { const a = FX.accounts.find(a => a.id === r.account_id); o.accounts = a ? { ...a, firms: FX.firms.find(f => f.id === a.firm_id) } : null }
    return o
  })
}
const OP = /^(not\.)?(eq|neq|gt|gte|lt|lte|in|is|like|ilike)\.(.*)$/
function filterRows(rows, params) {
  let out = rows
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(k)) continue
    const m = v.match(OP); if (!m) continue
    const [, neg, op, raw] = m
    const test = (x) => {
      const val = x?.[k]
      switch (op) {
        case 'eq': return String(val) === raw
        case 'neq': return String(val) !== raw
        case 'gt': return val > raw; case 'gte': return val >= raw
        case 'lt': return val < raw; case 'lte': return val <= raw
        case 'in': return raw.replace(/^\(|\)$/g, '').split(',').map(s => s.replace(/"/g, '')).includes(String(val))
        case 'is': return raw === 'null' ? val == null : String(val) === raw
        default: return true
      }
    }
    out = out.filter(x => (neg ? !test(x) : test(x)))
  }
  const order = params.get('order')
  if (order) { const [col, dir] = order.split(',')[0].split('.'); out = [...out].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (dir === 'desc' ? -1 : 1)) }
  const lim = +params.get('limit'); if (lim) out = out.slice(+params.get('offset') || 0, (+params.get('offset') || 0) + lim)
  return out
}
async function mock(route) {
  const req = route.request(); const url = new URL(req.url()); const method = req.method()
  if (process.env.DEBUG) console.log("REQ", method, url.pathname + url.search.slice(0, 140), (req.headers()["accept"] || "").slice(0, 40))
  const json = (status, body, headers = {}) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range', ...headers }, body: body === undefined ? '' : JSON.stringify(body) })
  if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
  if (url.pathname.startsWith('/auth/v1/user')) return json(200, FX.USER)
  if (url.pathname.startsWith('/auth/v1/')) return json(200, SESSION)
  if (url.pathname.startsWith('/storage/')) return json(200, [])
  if (url.pathname.startsWith('/rest/v1/rpc/')) return json(200, null)
  const table = url.pathname.replace('/rest/v1/', '')
  const src = FX.TABLES[table] || []
  if (method !== 'GET' && method !== 'HEAD') return json(201, [])
  const rows = embed(table, filterRows(src, url.searchParams), url.searchParams.get('select'))
  const total = rows.length
  const range = { 'content-range': total ? `0-${total - 1}/${total}` : '*/0' }
  if (method === 'HEAD') return json(200, undefined, range)
  if ((req.headers()['accept'] || '').includes('vnd.pgrst.object')) return rows.length ? json(200, rows[0], range) : json(406, { code: 'PGRST116', message: 'no rows' })
  return json(200, rows, range)
}

export const SHOTS = [
  { id: 'landing', path: '/', app: false },
  { id: 'dashboard', path: '/app/dashboard' },
  { id: 'dash-performance', path: '/app/dashboard', act: async p => { await clickText(p, 'Performance') } },
  { id: 'dash-payouts', path: '/app/dashboard', act: async p => { await clickText(p, 'Payouts') } },
  { id: 'dash-risk', path: '/app/dashboard', act: async p => { await clickText(p, 'Risque') } },
  { id: 'palette', path: '/app/dashboard', act: async p => { await p.keyboard.press('Control+k'); await p.waitForTimeout(500); await p.keyboard.type('apex', { delay: 60 }) } },
  { id: 'health', path: '/app/health' },
  { id: 'analytics', path: '/app/analytics' },
  { id: 'journal', path: '/app/journal' },
  { id: 'trades', path: '/app/trades' },
  { id: 'trade-modal', path: '/app/trades', act: fillTrade },
  { id: 'firm-apex-full', path: '/firms/apex-trader-funding', app: false, full: true },
  { id: 'heatmaps', path: '/app/heatmaps' },
  { id: 'calendar', path: '/app/calendar' },
  { id: 'rules', path: '/app/rules' },
  { id: 'myrules', path: '/app/myrules' },
  { id: 'alerts', path: '/app/alerts' },
  { id: 'import-lab', path: '/app/import-lab' },
  { id: 'settings', path: '/app/settings' },
  { id: 'compare', path: '/compare', app: false },
  { id: 'firm-apex', path: '/firms/apex-trader-funding', app: false },
  { id: 'dd-simulator', path: '/tools/drawdown-simulator', app: false },
  { id: 'pricing', path: '/pricing', app: false },
  { id: 'dashboard-full', path: '/app/dashboard', full: true },
  { id: 'health-full', path: '/app/health', full: true },
  { id: 'rules-full', path: '/app/rules', full: true },
  { id: 'landing-full', path: '/', app: false, full: true },
]
// Découpes haute définition (×3) des éléments que la caméra filme en gros plan (Q2).
// `text` localise l'élément ; on remonte jusqu'au conteneur carte (bord + fond).
export const CUTS = [
  { id: 'cut-insight', path: '/app/dashboard', text: 'Un compte est au bord du breach' },
  { id: 'cut-danger', path: '/app/health', text: '$370' },
  { id: 'cut-palette', path: '/app/dashboard', dialog: true, act: async p => { await p.keyboard.press('Control+k'); await p.waitForTimeout(500); await p.keyboard.type('apex', { delay: 60 }) } },
  { id: 'cut-trade-modal', path: '/app/trades', dialog: true, act: fillTrade },
  // Les trois cartes créées par la réplication, dans le vrai Trade Log.
  { id: 'rows-replicated', path: '/app/trades', rows: '+420.00', page: 'trades-after' },
]
// Le formulaire de trade rempli comme un vrai utilisateur : P&L saisi, réplication
// dépliée, deux comptes cochés — c'est l'état qui montre la fonctionnalité.
async function fillTrade(p) {
  await clickText(p, /Ajouter un trade|Nouveau trade|\+ Trade|Ajouter/)
  await p.waitForTimeout(700)
  const d = p.locator('[role="dialog"]').last()
  await d.getByPlaceholder(/250/).fill('420')
  await d.getByText(/Aussi sur d.autres comptes/).click()
  await p.waitForTimeout(400)
  for (const name of ['Apex EOD 50K', 'LucidFlex 50K']) {
    const lab = d.locator('label', { hasText: name }).first()
    if (await lab.count()) await lab.click()
  }
  await p.waitForTimeout(400)
}
async function clickText(p, text) {
  const loc = p.getByRole('button', { name: text }).first()
  if (await loc.count()) { await loc.click(); return }
  const any = p.getByText(text).first(); if (await any.count()) await any.click()
}

const only = process.argv.slice(2)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, locale: 'fr-FR', timezoneId: 'America/New_York', bypassCSP: true })
await ctx.addInitScript(({ session }) => {
  try {
    localStorage.setItem('sb-127-auth-token', JSON.stringify(session))
    for (const [k, v] of [['quantara_onboarding_dismissed', '1'], ['quantara_tutorial_done', '1'], ['quantara_cookie_consent', 'accepted'], ['quantara.betaBannerDismissed', '1'], ['quantara_lang', 'fr'], ['quantara_theme', 'dark'], ['quantara_dismissed_announcements', '[]']]) localStorage.setItem(k, v)
  } catch {}
}, { session: SESSION })
// Playwright : la route enregistrée EN DERNIER passe en premier — le blocage général d'abord.
await ctx.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, r => r.abort())
await ctx.route('http://127.0.0.1:54321/**', mock)
await ctx.route(/exchangerate-api\.com/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ rates: { USD: 1.17, GBP: 0.87, CHF: 0.94 } }) }))
await ctx.route(/localhost:3000\/api\//, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
const layout = fs.existsSync(OUT + 'layout.json') ? JSON.parse(fs.readFileSync(OUT + 'layout.json')) : {}
for (const s of SHOTS.filter(s => !only.length || only.includes(s.id))) {
  const p = await ctx.newPage(); const errs = []
  p.on("pageerror", e => errs.push(String(e).slice(0, 160)))
  if (process.env.DEBUG) { p.on("request", r => { const u = r.url(); if (!/_next|__nextjs|favicon|\.(png|svg|webp|woff2?)/.test(u)) console.log("NET", r.method(), u.slice(0, 150)) }); p.on("console", m => console.log("CON", m.type(), m.text().slice(0, 150))) }
  try {
    await p.goto(BASE + s.path, { waitUntil: 'networkidle', timeout: 120000 })
    await p.evaluate(() => document.fonts.ready)
    // Le bouton flottant de feedback bêta n'a rien à faire dans un film promo.
    await p.addStyleTag({ content: 'button[style*="bottom: 18px"][style*="right: 18px"],nextjs-portal{display:none!important}' })
    await p.waitForTimeout(s.app === false ? 1500 : 2500)
    if (s.act) { await s.act(p); await p.waitForTimeout(1200) }
    await p.screenshot({ path: `${OUT}${s.id}.png`, fullPage: !!s.full })
    layout[s.id] = await p.evaluate(() => ({ pageH: document.documentElement.scrollHeight, title: document.title, h: [...document.querySelectorAll('h1,h2,h3')].slice(0, 8).map(e => e.textContent.trim().slice(0, 60)) }))
    console.log('OK', s.id, JSON.stringify(layout[s.id].h.slice(0, 3)), errs.length ? 'ERR ' + errs[0] : '')
  } catch (e) { console.log('FAIL', s.id, String(e).slice(0, 200)) }
  await p.close()
}
// ── Découpes ×3 ──
const ctx3 = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 3, locale: 'fr-FR', timezoneId: 'America/New_York', bypassCSP: true, storageState: await ctx.storageState() })
await ctx3.addInitScript(({ session }) => { try { localStorage.setItem('sb-127-auth-token', JSON.stringify(session)); for (const [k, v] of [['quantara_onboarding_dismissed', '1'], ['quantara_tutorial_done', '1'], ['quantara_cookie_consent', 'accepted'], ['quantara.betaBannerDismissed', '1'], ['quantara_lang', 'fr'], ['quantara_theme', 'dark']]) localStorage.setItem(k, v) } catch {} }, { session: SESSION })
await ctx3.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, r => r.abort())
await ctx3.route('http://127.0.0.1:54321/**', mock)
await ctx3.route(/localhost:3000\/api\//, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
for (const c of CUTS.filter(c => !only.length || only.includes(c.id))) {
  const p = await ctx3.newPage()
  try {
    await p.goto(BASE + c.path, { waitUntil: 'networkidle', timeout: 120000 })
    await p.addStyleTag({ content: 'button[style*="bottom: 18px"][style*="right: 18px"],nextjs-portal{display:none!important}' })
    await p.waitForTimeout(2500)
    if (c.act) { await c.act(p); await p.waitForTimeout(1200) }
    if (c.rows) {
      await p.screenshot({ path: `${OUT}${c.page}.png` })
      layout[c.page] = { pageH: 1080 }
      const boxes = await p.evaluate((needle) => {
        const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n
        while ((n = w.nextNode())) {
          if (!n.textContent.replace(/\s/g, '').includes(needle.replace(/\s/g, ''))) continue
          let el = n.parentElement
          while (el && el.parentElement) { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (r.width > 250 && r.height > 90 && parseFloat(cs.borderTopLeftRadius) >= 6) break; el = el.parentElement }
          if (el) { const r = el.getBoundingClientRect(); const b = { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; if (!out.some(o => Math.abs(o.x - b.x) < 2 && Math.abs(o.y - b.y) < 2)) out.push(b) }
        }
        return out
      }, c.rows)
      layout[c.id] = { boxes }
      console.log('ROWS', c.id, JSON.stringify(boxes))
      await p.close(); continue
    }
    const box = await p.evaluate(({ text, dialog }) => {
      let el
      if (dialog) el = [...document.querySelectorAll('[role="dialog"]')].pop()
      else {
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        let n; while ((n = w.nextNode())) if (n.textContent.includes(text)) { el = n.parentElement; break }
        while (el && el.parentElement) {
          const cs = getComputedStyle(el); const r = el.getBoundingClientRect()
          if (r.width > 280 && r.height > 120 && parseFloat(cs.borderTopLeftRadius) >= 8 && (cs.borderTopWidth !== '0px' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)')) break
          el = el.parentElement
        }
      }
      if (!el) return null
      const r = el.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }
    }, { text: c.text, dialog: !!c.dialog })
    if (!box) throw new Error('élément introuvable')
    await p.screenshot({ path: `${OUT}${c.id}.png`, clip: { x: box.x, y: box.y, width: box.w, height: box.h } })
    layout[c.id] = { box }
    console.log('CUT', c.id, JSON.stringify(box))
  } catch (e) { console.log('FAIL', c.id, String(e).slice(0, 160)) }
  await p.close()
}
fs.writeFileSync(OUT + 'layout.json', JSON.stringify(layout, null, 1))
await b.close()
