// MV3 service worker — central message broker.
//   * receives captured requests from content scripts (CAPTURE_REQUEST)
//   * receives auth tokens from the Quantara bridge (AUTH_FROM_QUANTARA)
//   * receives popup commands (POPUP_*)

import { firmSlugFromHost, DEFAULT_DEBUG } from '../lib/config.js'
import { get, set, pushDebug, pushHistory } from '../lib/storage.js'
import { submitSync, ping } from '../lib/api.js'
import { adaptLucid } from '../content/adapters/lucid-adapter.js'

const ADAPTERS = {
  'lucid-trading': adaptLucid,
}

chrome.runtime.onInstalled.addListener(async () => {
  if ((await get('debugMode')) === undefined) await set('debugMode', DEFAULT_DEBUG)
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
          })
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
  const url = payload.url
  const host = (() => { try { return new URL(url).hostname } catch { return '' } })()
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
  const adapter = ADAPTERS[firm]
  if (!adapter) return

  let trades = null
  try {
    trades = adapter(payload)
  } catch (e) {
    await pushDebug({ firm, error: 'adapter_threw', detail: String(e?.message || e), url })
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
    await pushHistory({ firm, count: trades.length, ok: true, inserted: result.inserted, updated: result.updated })
  } catch (e) {
    await pushHistory({ firm, count: trades.length, ok: false, error: String(e?.message || e) })
  }
}
