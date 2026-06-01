// Background auto-sync scheduler.
//
// Periodically (chrome.alarms) — and on demand from the popup — opens a
// hidden tab to each enabled PropFirm dashboard, waits for the firm's
// own API calls to be intercepted by our content/inject.js, then closes
// the tab. The user keeps their normal session cookies on each firm,
// so no credentials are ever stored by Quantara.
//
// Per-firm state lives in chrome.storage.local under `firmStates`:
//   {
//     'lucid-trading': {
//       lastSync: <ts ms>,
//       lastStatus: 'ok' | 'session_expired' | 'timeout' | 'error',
//       lastError: <string> | null,
//       lastTradeCount: <number>,
//       enabled: <boolean>,
//     },
//     ...
//   }

import { FIRMS, DEFAULT_SYNC_INTERVAL_MINUTES, MIN_INTERVAL_MINUTES } from '../lib/firms.js'
import { get, set } from '../lib/storage.js'

const ALARM_NAME = 'quantara-auto-sync'

// In-memory map of tab.id → resolver, populated when we open a sync tab
// so handleCapture() in service-worker.js can flag the firm as captured.
const pendingSyncTabs = new Map()

export async function ensureAlarm() {
  const intervalMin = Math.max(
    MIN_INTERVAL_MINUTES,
    Number(await get('autoSyncIntervalMinutes')) || DEFAULT_SYNC_INTERVAL_MINUTES,
  )
  const current = await chrome.alarms.get(ALARM_NAME)
  if (current && Math.abs(current.periodInMinutes - intervalMin) < 0.01) return
  await chrome.alarms.clear(ALARM_NAME)
  await chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: 1,
    periodInMinutes: intervalMin,
  })
}

export async function disableAlarm() {
  await chrome.alarms.clear(ALARM_NAME)
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return
  if (!(await get('autoSyncEnabled'))) return
  await syncAllFirms({ trigger: 'alarm' })
})

// Public — called from popup "Sync now" button and from periodic alarm.
export async function syncAllFirms(opts = {}) {
  const states = (await get('firmStates')) || {}
  const firms = Object.entries(FIRMS).filter(([slug, def]) => {
    if (def.disabled) return false
    const st = states[slug]
    if (st && st.enabled === false) return false
    return true
  })

  if (!firms.length) return { ran: 0 }

  let ran = 0
  for (const [slug, def] of firms) {
    try {
      await syncOneFirm(slug, def, opts)
      ran++
    } catch (e) {
      await updateFirmState(slug, { lastStatus: 'error', lastError: String(e?.message || e), lastSync: Date.now() })
    }
  }
  return { ran }
}

export async function syncOneFirm(slug, def, opts = {}) {
  if (!def) def = FIRMS[slug]
  if (!def) throw new Error('Unknown firm: ' + slug)

  await updateFirmState(slug, { lastStatus: 'running', lastError: null })

  const tab = await chrome.tabs.create({ url: def.syncUrl, active: false })
  const tabId = tab.id

  let captured = false
  const captureWaiter = new Promise((resolve) => {
    pendingSyncTabs.set(tabId, { slug, resolve, captured: false })
  })

  const timer = setTimeout(() => {
    const entry = pendingSyncTabs.get(tabId)
    if (entry) entry.resolve({ outcome: 'timeout' })
  }, def.captureTimeoutMs || 25_000)

  // Also watch for the tab redirecting to a login page — strong signal
  // that the user's session on the firm is dead.
  const updateListener = (changedTabId, changeInfo) => {
    if (changedTabId !== tabId) return
    const url = changeInfo.url
    if (!url) return
    if ((def.loginPatterns || []).some(re => re.test(url))) {
      const entry = pendingSyncTabs.get(tabId)
      if (entry) entry.resolve({ outcome: 'session_expired' })
    }
  }
  chrome.tabs.onUpdated.addListener(updateListener)

  const result = await captureWaiter
  clearTimeout(timer)
  chrome.tabs.onUpdated.removeListener(updateListener)
  pendingSyncTabs.delete(tabId)

  // Always close the hidden tab.
  try { await chrome.tabs.remove(tabId) } catch {}

  if (result.outcome === 'session_expired') {
    await updateFirmState(slug, {
      lastStatus: 'session_expired',
      lastError: `Session ${def.label} expirée — reconnecte-toi sur ${new URL(def.syncUrl).hostname}`,
      lastSync: Date.now(),
    })
    await refreshBadge()
    return
  }
  if (result.outcome === 'timeout') {
    await updateFirmState(slug, {
      lastStatus: 'timeout',
      lastError: 'Aucune réponse API détectée dans le délai imparti',
      lastSync: Date.now(),
    })
    await refreshBadge()
    return
  }

  // captured ok
  await updateFirmState(slug, {
    lastStatus: 'ok',
    lastError: null,
    lastSync: Date.now(),
    lastTradeCount: result.tradeCount || null,
  })
  await refreshBadge()
}

// Called from service-worker handleCapture() when a sync-relevant URL is
// seen in one of our pending hidden tabs.
export function markCapture(tabId, payload) {
  const entry = pendingSyncTabs.get(tabId)
  if (!entry) return false
  const def = FIRMS[entry.slug]
  if (!def) return false
  if (def.expectedCaptureRe && !def.expectedCaptureRe.test(String(payload.url || ''))) return false
  entry.captured = true
  entry.resolve({ outcome: 'ok', tradeCount: payload.tradeCount || null })
  return true
}

async function updateFirmState(slug, patch) {
  const states = (await get('firmStates')) || {}
  states[slug] = { ...(states[slug] || {}), ...patch }
  await set('firmStates', states)
}

// Show a red dot on the toolbar icon when any firm needs attention
// (session expired / timeout / error).
async function refreshBadge() {
  const states = (await get('firmStates')) || {}
  const needsAttention = Object.values(states).some(s =>
    ['session_expired', 'timeout', 'error'].includes(s?.lastStatus)
  )
  try {
    if (needsAttention) {
      await chrome.action.setBadgeText({ text: '!' })
      await chrome.action.setBadgeBackgroundColor({ color: '#d94856' })
    } else {
      await chrome.action.setBadgeText({ text: '' })
    }
  } catch {}
}
