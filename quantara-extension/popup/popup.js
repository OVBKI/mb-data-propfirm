import { QUANTARA_API_BASE } from '../lib/config.js'

const $ = (s) => document.querySelector(s)
const $$ = (s) => Array.from(document.querySelectorAll(s))

function send(type, payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (resp) => resolve(resp))
  })
}

function fmtTime(ts) {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function pathOf(url) {
  try { const u = new URL(url); return u.pathname + (u.search || '') } catch { return url }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue
    if (k === 'className') node.className = v
    else if (k === 'text') node.textContent = v
    else if (k === 'dataset') Object.assign(node.dataset, v)
    else node.setAttribute(k, v === true ? '' : String(v))
  }
  for (const c of children) {
    if (c == null || c === false) continue
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)
  }
  return node
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild)
}

function renderHistoryItem(h) {
  const li = el('li')
  li.appendChild(el('span', { className: 'pill ' + (h.ok ? 'ok' : 'err'), text: h.ok ? 'OK' : 'ERR' }))
  li.appendChild(document.createTextNode(' '))
  li.appendChild(el('strong', { text: h.firm || '?' }))
  li.appendChild(document.createTextNode(` — ${h.count || 0} trade(s) `))
  if (h.ok && h.inserted != null) {
    li.appendChild(el('span', { className: 'pill', text: `+${h.inserted}` }))
    li.appendChild(document.createTextNode(' '))
  }
  if (h.ok && h.updated) {
    li.appendChild(el('span', { className: 'pill', text: `~${h.updated}` }))
    li.appendChild(document.createTextNode(' '))
  }
  if (!h.ok && h.error) {
    li.appendChild(el('span', { className: 'meta', text: h.error }))
  }
  li.appendChild(el('div', { className: 'meta', text: fmtTime(h.ts) }))
  return li
}

function renderDebugItem(entry) {
  const li = el('li')
  const pillClass = 'pill ' + (entry.status >= 400 ? 'err' : 'ok')
  li.appendChild(el('span', { className: pillClass, text: `${entry.method || '?'} ${entry.status || ''}`.trim() }))
  li.appendChild(document.createTextNode(' '))
  li.appendChild(el('span', { className: 'url', text: pathOf(entry.url) }))
  const metaBits = []
  if (entry.firm) metaBits.push(entry.firm)
  if (entry.ms != null) metaBits.push(entry.ms + 'ms')
  metaBits.push(fmtTime(entry.ts))
  li.appendChild(el('div', { className: 'meta', text: metaBits.join(' · ') }))
  if (entry.sample) {
    const slice = entry.sample.slice(0, 200) + (entry.sample.length > 200 ? '…' : '')
    li.appendChild(el('div', {
      className: 'meta',
      style: 'margin-top:4px;color:var(--text2);max-height:50px;overflow:auto;white-space:pre-wrap',
      text: slice,
    }))
  }
  return li
}

async function refresh() {
  const state = await send('POPUP_GET_STATE')
  if (!state) return

  if (state.auth && state.auth.accessToken) {
    $('#authBox').classList.remove('hidden')
    $('#authNeeded').classList.add('hidden')
    $('#authEmail').textContent = state.auth.email || state.auth.userId || 'utilisateur Quantara'
  } else {
    $('#authBox').classList.add('hidden')
    $('#authNeeded').classList.remove('hidden')
  }

  $('#debugToggle').checked = !!state.debugMode

  const hist = state.syncHistory || []
  const histList = $('#historyList')
  clear(histList)
  if (!hist.length) {
    $('#historyEmpty').classList.remove('hidden')
    histList.classList.add('hidden')
  } else {
    $('#historyEmpty').classList.add('hidden')
    histList.classList.remove('hidden')
    hist.forEach(h => histList.appendChild(renderHistoryItem(h)))
  }

  const log = state.debugLog || []
  const debugList = $('#debugList')
  clear(debugList)
  if (!log.length) {
    $('#debugEmpty').classList.remove('hidden')
    debugList.classList.add('hidden')
  } else {
    $('#debugEmpty').classList.add('hidden')
    debugList.classList.remove('hidden')
    log.slice(0, 80).forEach(entry => debugList.appendChild(renderDebugItem(entry)))
  }
}

$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.remove('on'))
    tab.classList.add('on')
    const name = tab.dataset.tab
    $$('.pane').forEach(p => p.classList.add('hidden'))
    $('#tab-' + name).classList.remove('hidden')
  })
})

$('#debugToggle').addEventListener('change', async (e) => {
  await send('POPUP_SET_DEBUG', e.target.checked)
})
$('#clearDebug').addEventListener('click', async () => {
  await send('POPUP_CLEAR_DEBUG')
  refresh()
})
$('#logout').addEventListener('click', async () => {
  await send('POPUP_LOGOUT')
  refresh()
})
$('#goLogin').addEventListener('click', () => {
  chrome.tabs.create({ url: QUANTARA_API_BASE + '/auth' })
})
$('#openSite').addEventListener('click', () => {
  chrome.tabs.create({ url: QUANTARA_API_BASE + '/app/journal-sync' })
})
$('#openSiteInline').addEventListener('click', (e) => {
  e.preventDefault()
  chrome.tabs.create({ url: QUANTARA_API_BASE })
})

refresh()
setInterval(refresh, 3000)
