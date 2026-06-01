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

  const isAccounts = h.kind === 'accounts'
  const noun = isAccounts ? 'compte' : 'trade'
  const plural = (h.count || 0) > 1 ? 's' : ''
  li.appendChild(document.createTextNode(` — ${h.count || 0} ${noun}${plural} `))

  // For accounts kind the API returns { created, updated }; for trades { inserted, updated }.
  if (h.ok) {
    const newCount = h.inserted != null ? h.inserted : (h.created != null ? h.created : null)
    if (newCount != null) {
      const label = isAccounts ? `★${newCount} créé${newCount > 1 ? 's' : ''}` : `+${newCount}`
      li.appendChild(el('span', { className: 'pill', text: label }))
      li.appendChild(document.createTextNode(' '))
    }
    if (h.updated) {
      li.appendChild(el('span', { className: 'pill', text: `~${h.updated} maj` }))
      li.appendChild(document.createTextNode(' '))
    }
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
  const body = entry.body != null ? entry.body : entry.sample
  if (body) {
    const slice = body.slice(0, 200) + (body.length > 200 ? `… (${body.length} chars)` : '')
    li.appendChild(el('div', {
      className: 'meta',
      style: 'margin-top:4px;color:var(--text2);max-height:50px;overflow:auto;white-space:pre-wrap',
      text: slice,
    }))
  }
  return li
}

async function downloadDebugLog() {
  const state = await send('POPUP_GET_STATE')
  const log = (state && state.debugLog) || []
  const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const a = document.createElement('a')
  a.href = url
  a.download = `quantara-debug-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function fmtAgo(ts) {
  if (!ts) return 'jamais'
  const ms = Date.now() - ts
  if (ms < 60_000) return 'à l’instant'
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min`
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} h`
  return `${Math.floor(ms / 86_400_000)} j`
}

const STATUS_CLASS = {
  ok: 'ok',
  running: 'run',
  session_expired: 'err',
  timeout: 'warn',
  error: 'err',
}

const STATUS_LABEL = {
  ok: 'OK',
  running: 'sync…',
  session_expired: 'session expirée',
  timeout: 'timeout',
  error: 'erreur',
}

function renderFirmItem(firm, st) {
  const li = document.createElement('li')

  let dotCls = 'off'
  let label  = 'jamais sync'
  if (firm.disabled) {
    dotCls = 'off'; label = 'bientôt'
  } else if (st && st.lastStatus) {
    dotCls = STATUS_CLASS[st.lastStatus] || 'off'
    label  = STATUS_LABEL[st.lastStatus] || st.lastStatus
  }

  li.appendChild(el('span', { className: 'firm-status ' + dotCls }))
  const nameWrap = el('div', { className: 'firm-name', style: 'display:flex;flex-direction:column' })
  nameWrap.appendChild(el('span', { text: firm.label }))
  const metaTxt = st && st.lastSync ? `${label} · ${fmtAgo(st.lastSync)}` : label
  nameWrap.appendChild(el('span', { className: 'firm-meta', text: metaTxt }))
  li.appendChild(nameWrap)

  if (!firm.disabled) {
    const btn = el('button', { className: 'refresh', text: '⟳' })
    btn.title = 'Sync maintenant ' + firm.label
    btn.addEventListener('click', () => send('POPUP_SYNC_FIRM', firm.slug))
    li.appendChild(btn)
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
  $('#autoSyncToggle').checked = !!state.autoSyncEnabled

  const intervalMin = state.autoSyncIntervalMinutes || 120
  const il = $('#intervalLabel')
  if (il) il.textContent = intervalMin >= 60 ? `${Math.round(intervalMin / 60)}h` : `${intervalMin} min`

  const firms = state.firms || []
  const firmStates = state.firmStates || {}
  const firmsList = $('#firmsList')
  clear(firmsList)
  if (!firms.length) {
    firmsList.appendChild(el('li', { className: 'empty', text: 'Aucune firm configurée' }))
  } else {
    firms.forEach(f => firmsList.appendChild(renderFirmItem(f, firmStates[f.slug])))
  }

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
$('#exportDebug').addEventListener('click', downloadDebugLog)
$('#syncNow').addEventListener('click', async (e) => {
  e.target.disabled = true
  e.target.textContent = '⟳ Sync en cours…'
  await send('POPUP_SYNC_NOW')
  setTimeout(() => { e.target.disabled = false; e.target.textContent = '⟳ Sync maintenant' }, 3000)
  refresh()
})
$('#autoSyncToggle').addEventListener('change', async (e) => {
  await send('POPUP_SET_AUTOSYNC', e.target.checked)
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
