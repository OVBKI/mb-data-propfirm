// MV3 service worker — central message broker.
//   * receives captured requests from content scripts (CAPTURE_REQUEST)
//   * receives auth tokens from the Quantara bridge (AUTH_FROM_QUANTARA)
//   * receives popup commands (POPUP_*)

import { firmSlugFromHost, DEFAULT_DEBUG, DEFAULT_RICH_DEBUG, RICH_DEBUG_BODY_MAX, RICH_DEBUG_ENTRY_MAX } from '../lib/config.js'
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

// Hosts allowed to push a Supabase token into the extension via the
// AUTH_FROM_QUANTARA bridge. Any other origin trying that channel is
// silently dropped — closes the multi-tenant Vercel preview hijack risk
// flagged in the security audit (P1-1).
const TRUSTED_AUTH_ORIGINS = new Set([
  'https://quantara.tech',
])

chrome.runtime.onInstalled.addListener(async () => {
  if ((await get('debugMode')) === undefined) await set('debugMode', DEFAULT_DEBUG)
  if ((await get('richDebugMode')) === undefined) await set('richDebugMode', DEFAULT_RICH_DEBUG)
  if ((await get('autoSyncEnabled')) === undefined) await set('autoSyncEnabled', true)
  await ensureAlarm()
})

chrome.runtime.onStartup.addListener(async () => {
  if (await get('autoSyncEnabled')) await ensureAlarm()
})

// Identify messages that came from the extension itself (popup / options
// pages). Content scripts on PropFirm dashboards do NOT carry a sender.id
// equal to chrome.runtime.id, so they can't trigger POPUP_* commands.
function isExtensionInternal(sender) {
  if (!sender) return false
  if (sender.id && sender.id !== chrome.runtime.id) return false
  // Popup/options pages have sender.url starting with chrome-extension://<id>/
  if (sender.url && sender.url.startsWith(`chrome-extension://${chrome.runtime.id}/`)) return true
  // Some Chrome versions omit url on the popup but always set tab === undefined for it.
  if (!sender.tab && !sender.frameId) return true
  return false
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      const type = msg?.type
      const popupCommand = typeof type === 'string' && type.startsWith('POPUP_')
      if (popupCommand && !isExtensionInternal(sender)) {
        sendResponse({ ok: false, error: 'FORBIDDEN' })
        return
      }

      switch (type) {
        case 'CAPTURE_REQUEST':
          await handleCapture(msg.payload, sender)
          sendResponse({ ok: true })
          break

        case 'AUTH_FROM_QUANTARA': {
          // Only the real quantara.tech tab may push an auth token. Preview
          // deployments, custom-domain forks, or any other host trying this
          // channel are silently rejected.
          const senderOrigin = (() => { try { return new URL(sender?.url || '').origin } catch { return '' } })()
          if (!TRUSTED_AUTH_ORIGINS.has(senderOrigin)) {
            sendResponse({ ok: false, error: 'UNTRUSTED_ORIGIN' })
            break
          }
          await set('auth', msg.payload)
          sendResponse({ ok: true })
          break
        }

        case 'POPUP_GET_STATE':
          sendResponse({
            auth: await get('auth'),
            debugMode: (await get('debugMode')) ?? DEFAULT_DEBUG,
            richDebugMode: (await get('richDebugMode')) ?? DEFAULT_RICH_DEBUG,
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
          if (!msg.payload) await set('richDebugMode', false)
          sendResponse({ ok: true })
          break

        case 'POPUP_SET_RICH_DEBUG':
          // Rich debug = capture bodies. Auto-clears existing log so we don't
          // keep pre-existing bodies around when the user toggles it on.
          await set('richDebugMode', !!msg.payload)
          if (!msg.payload) {
            // Strip bodies from any existing entries when turning off.
            const cur = (await get('debugLog')) || []
            await set('debugLog', cur.map(e => ({ ...e, body: undefined })))
          }
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
    const richDebug = !!(await get('richDebugMode'))
    const entry = {
      firm: firm || host,
      method: payload.method,
      url,
      status: payload.status,
      ms: payload.ms,
      contentType: payload.contentType,
    }
    if (richDebug && typeof payload.body === 'string') {
      // Cap body size aggressively to limit blast radius if the log is
      // ever exported or the device is compromised.
      entry.body = payload.body.slice(0, RICH_DEBUG_BODY_MAX)
    }
    await pushDebug(entry, richDebug ? RICH_DEBUG_ENTRY_MAX : undefined)
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
