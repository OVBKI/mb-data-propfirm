// Thin async wrappers around chrome.storage.local. Keys we use:
//   auth         → { accessToken, refreshToken, userId, email, expiresAt }
//   debugMode    → boolean
//   debugLog     → array of recent intercepted requests (capped at 200)
//   syncHistory  → array of { ts, firm, count, ok } (capped at 50)
//   apiBase      → string override for QUANTARA_API_BASE (dev tooling)

export function get(key) {
  return new Promise(resolve => {
    chrome.storage.local.get(key, obj => resolve(obj[key]))
  })
}

export function set(key, value) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [key]: value }, () => resolve())
  })
}

export function remove(key) {
  return new Promise(resolve => {
    chrome.storage.local.remove(key, () => resolve())
  })
}

const DEBUG_LOG_MAX_DEFAULT = 200
export async function pushDebug(entry, maxOverride) {
  const cap = Number.isFinite(maxOverride) && maxOverride > 0
    ? Math.min(DEBUG_LOG_MAX_DEFAULT, Math.floor(maxOverride))
    : DEBUG_LOG_MAX_DEFAULT
  const cur = (await get('debugLog')) || []
  cur.unshift({ ts: Date.now(), ...entry })
  if (cur.length > cap) cur.length = cap
  await set('debugLog', cur)
}

const SYNC_HISTORY_MAX = 50
export async function pushHistory(entry) {
  const cur = (await get('syncHistory')) || []
  cur.unshift({ ts: Date.now(), ...entry })
  if (cur.length > SYNC_HISTORY_MAX) cur.length = SYNC_HISTORY_MAX
  await set('syncHistory', cur)
}
