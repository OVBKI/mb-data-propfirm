// Loader content script — injected at document_start on every supported
// PropFirm dashboard.
//
// Why this exists: content scripts run in an isolated world and cannot
// monkey-patch the page's `fetch` / `XMLHttpRequest`. To capture the API
// calls the dashboard makes to its own backend, we need code that lives
// in the *page* execution context. The MV3 way to do that is to inject a
// <script src="extension://.../inject.js"> tag from a content script.
//
// inject.js patches fetch/XHR and posts captured requests back to this
// content script via window.postMessage, which then forwards to the
// background service worker via chrome.runtime.sendMessage.

(function loadInjector() {
  const url = chrome.runtime.getURL('content/inject.js')
  const script = document.createElement('script')
  script.src = url
  script.async = false
  script.dataset.quantara = 'inject'
  ;(document.head || document.documentElement).appendChild(script)
  script.addEventListener('load', () => script.remove())
})()

window.addEventListener('message', (ev) => {
  if (ev.source !== window) return
  const data = ev.data
  if (!data || data.__quantara !== 'CAPTURE_REQUEST') return
  try {
    chrome.runtime.sendMessage({ type: 'CAPTURE_REQUEST', payload: data.payload })
  } catch (e) {
    // Service worker may be sleeping — chrome.runtime.sendMessage will wake it.
    // If it throws (extension reloaded mid-session), we silently drop.
  }
})
