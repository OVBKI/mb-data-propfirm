// MV3 service worker — central message broker.
//   * receives captured requests from content scripts (CAPTURE_REQUEST)
//   * receives auth tokens from the Quantara bridge (AUTH_FROM_QUANTARA)
//   * receives popup commands (POPUP_*)

import { firmSlugFromHost, DEFAULT_DEBUG } from '../lib/config.js'
import { get, set, pushDebug, pushHistory } from '../lib/storage.js'
import { submitSync, submitAccounts, ping } from '../lib/api.js'
import { adaptLucid } from '../content/adapters/lucid-adapter.js'
import { adaptLucidSummary } from '../content/adapters/lucid-summary-adapter.js'
import { FIRMS } from '../lib/firms.js'
import { ensureAlarm, disableAlarm, syncAllFirms, syncOneFirm, markCapture } from './scheduler.js'

// Per-firm adapter pair: trades go to /api/sync/extension, accounts to
// /api/sync/extension/accounts. Both are optional.
const ADAPTERS = {
  'lucid-trading': {
    trades:   adaptLucid,
    accounts: adaptLucidSummary,
  },
}

chrome.runtime.onInstalled.addListener(async () => {
  if ((await get('debugMode')) === undefined) await set('debugMode', DEFAULT_DEBUG)
  if ((await get('autoSyncEnabled')) === undefined) await set('autoSyncEnabled', true)
  await ensureAlarm()
})

chrome.runtime.onStartup.addListener(async () => {
  if (await get('autoSyncEnabled')) await ensureAlarm()
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg?.type) {
        case 'CAPTURE_REQUEST':
          await handleCapture(msg.payload, sender)
          sendResponse({ ok: true })
          break

        case 'AUTH_FROM_QUANTARA':
          await set('auth', msg.payload)
          sendResponse({ ok: true })
          break

        case 'POPUP_GET_STATE':
          sendResponse({
            auth: await get('auth'),
            debugMode: (await get('debugMode')) ?? DEFAULT_DEBUG,
            debugLog: (await get('debugLog')) || [],
            syncHistory: (await get('syncHistory')) || [],
            firms: Object.entries(FIRMS).map(([slug, def]) => ({ slug, label: def.label, disabled: !!def.disabled })),
            firmStates: (await get('firmStates')) || {},
            autoSyncEnabled: (await get('autoSyncEnabled')) !== false,
            autoSyncIntervalMinutes: (await get('autoSyncIntervalMinutes')) || 120,
          })
          break

        case 'POPUP_SYNC_NOW':
          // Fire-and-forget; popup polls firmStates for progress.
          syncAllFirms({ trigger: 'manual' })
          sendResponse({ ok: true })
          break

        case 'POPUP_SYNC_FIRM':
          if (!msg.payload || !FIRMS[msg.payload]) {
            sendResponse({ ok: false, error: 'UNKNOWN_FIRM' })
            break
          }
          syncOneFirm(msg.payload, FIRMS[msg.payload], { trigger: 'manual' })
          sendResponse({ ok: true })
          break

        case 'POPUP_SET_AUTOSYNC':
          await set('autoSyncEnabled', !!msg.payload)
          if (msg.payload) await ensureAlarm()
          else await disableAlarm()
          sendResponse({ ok: true })
          break

        case 'POPUP_SET_INTERVAL':
          await set('autoSyncIntervalMinutes', Math.max(15, Number(msg.payload) || 120))
          await ensureAlarm()
          sendResponse({ ok: true })
          break

        case 'POPUP_SET_DEBUG':
          await set('debugMode', !!msg.payload)
          sendResponse({ ok: true })
          break

        case 'POPUP_CLEAR_DEBUG':
          await set('debugLog', [])
          sendResponse({ ok: true })
          break

        case 'POPUP_LOGOUT':
          await set('auth', null)
          sendResponse({ ok: true })
          break

        case 'POPUP_PING':
          try {
            const data = await ping()
            sendResponse({ ok: true, data })
          } catch (e) {
            sendResponse({ ok: false, error: String(e?.message || e) })
          }
          break

        default:
          sendResponse({ ok: false, error: 'UNKNOWN_TYPE' })
      }
    } catch (e) {
      sendResponse({ ok: false, error: String(e?.message || e) })
    }
  })()
  return true
})

async function handleCapture(payload, sender) {
  if (!payload?.url) return
  // Resolve URL host: prefer payload URL, fall back to the sender tab's URL
  // for cases where the captured value is still relative.
  let host = ''
  try { host = new URL(payload.url).hostname } catch {}
  if (!host && sender?.tab?.url) {
    try { host = new URL(sender.tab.url).hostname } catch {}
  }
  const url = payload.url
  const firm = firmSlugFromHost(host)

  if (await get('debugMode')) {
    await pushDebug({
      firm: firm || host,
      method: payload.method,
      url,
      status: payload.status,
      ms: payload.ms,
      contentType: payload.contentType,
      // Full body kept in storage; popup truncates for display, export sends full.
      body: typeof payload.body === 'string' ? payload.body.slice(0, 50_000) : null,
    })
  }

  if (!firm) return

  // Tell the scheduler that this firm's expected payload was captured so
  // it can close the hidden tab (if this came from a hidden sync tab).
  if (sender?.tab?.id != null) {
    markCapture(sender.tab.id, { url, tradeCount: null })
  }

  const adapter = ADAPTERS[firm]
  if (!adapter) return

  // Pipeline A: accounts (run first so accounts exist before trades try to match)
  if (adapter.accounts) {
    let accounts = null
    try { accounts = adapter.accounts(payload) }
    catch (e) {
      await pushDebug({ firm, error: 'accounts_adapter_threw', detail: String(e?.message || e), url })
    }
    if (accounts && accounts.length) {
      try {
        const result = await submitAccounts({ firm, accounts })
        await pushHistory({ firm, kind: 'accounts', count: accounts.length, ok: true, created: result.created, updated: result.updated })
      } catch (e) {
        await pushHistory({ firm, kind: 'accounts', count: accounts.length, ok: false, error: String(e?.message || e) })
      }
    }
  }

  // Pipeline B: trades
  if (adapter.trades) {
    let trades = null
    try { trades = adapter.trades(payload) }
    catch (e) {
      await pushDebug({ firm, error: 'trades_adapter_threw', detail: String(e?.message || e), url })
      return
    }
    if (!trades || !trades.length) return

    try {
      const result = await submitSync({
        firm,
        accountIdentifier: trades[0]?.accountIdentifier || null,
        accountName:       trades[0]?.accountName       || null,
        trades,
      })
      await pushHistory({ firm, kind: 'trades', count: trades.length, ok: true, inserted: result.inserted, updated: result.updated })
    } catch (e) {
      await pushHistory({ firm, kind: 'trades', count: trades.length, ok: false, error: String(e?.message || e) })
    }
  }
}
