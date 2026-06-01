// Page-context interceptor for fetch + XMLHttpRequest.
//
// Runs in the page's main world (NOT the isolated content script world)
// because content scripts can't override the page's `window.fetch`.
//
// Captures only same-origin API responses (same host as the dashboard)
// and posts them back to the loader content script via window.postMessage.
// The loader forwards them to the background service worker, which feeds
// them through the firm-specific adapter.

(function () {
  if (window.__quantaraInjected) return
  window.__quantaraInjected = true

  const ORIGIN_HOST = location.hostname

  function post(payload) {
    try {
      window.postMessage({ __quantara: 'CAPTURE_REQUEST', payload }, location.origin)
    } catch (e) { /* drop */ }
  }

  function sameOriginUrl(u) {
    try {
      const url = new URL(u, location.href)
      // Capture the dashboard's own API calls. Many dashboards talk to
      // api.<host> or <host>/api/* — both are useful.
      if (url.hostname === ORIGIN_HOST) return true
      if (url.hostname.endsWith('.' + ORIGIN_HOST)) return true
      // Some firms host their API on a sibling domain (e.g. dashboard at
      // dash.lucidtrading.com talking to api.lucidtrading.com). Capture
      // those by matching the registered root.
      const parts = ORIGIN_HOST.split('.')
      if (parts.length >= 2) {
        const root = parts.slice(-2).join('.')
        if (url.hostname === root) return true
        if (url.hostname.endsWith('.' + root)) return true
      }
      return false
    } catch { return false }
  }

  function absUrl(u) {
    try { return new URL(u, location.href).href } catch { return String(u || '') }
  }

  // ── fetch ──────────────────────────────────────────────────────────
  const origFetch = window.fetch
  window.fetch = async function (input, init) {
    const rawUrl = typeof input === 'string' ? input : (input && input.url)
    const url = absUrl(rawUrl)
    const method = (init && init.method) || (typeof input !== 'string' && input?.method) || 'GET'
    const start = performance.now()
    let res
    try {
      res = await origFetch.apply(this, arguments)
    } catch (e) {
      if (sameOriginUrl(url)) post({ url, method, error: String(e?.message || e), ms: Math.round(performance.now() - start) })
      throw e
    }
    if (sameOriginUrl(url)) {
      try {
        const cloned = res.clone()
        const ct = cloned.headers.get('content-type') || ''
        let body = null
        if (ct.includes('application/json') || ct.includes('text/')) {
          body = await cloned.text()
        }
        post({
          url,
          method,
          status: res.status,
          ms: Math.round(performance.now() - start),
          contentType: ct,
          body,
        })
      } catch (e) { /* drop */ }
    }
    return res
  }

  // ── XMLHttpRequest ────────────────────────────────────────────────
  const XHR = window.XMLHttpRequest
  const open = XHR.prototype.open
  const send = XHR.prototype.send
  XHR.prototype.open = function (method, url) {
    this.__qx = { method, url: absUrl(url), start: 0 }
    return open.apply(this, arguments)
  }
  XHR.prototype.send = function () {
    if (this.__qx) {
      this.__qx.start = performance.now()
      this.addEventListener('loadend', () => {
        const { method, url, start } = this.__qx
        if (!sameOriginUrl(url)) return
        let body = null
        try {
          const ct = this.getResponseHeader('content-type') || ''
          if (ct.includes('application/json') || ct.includes('text/')) {
            body = this.responseText
          }
          post({
            url, method,
            status: this.status,
            ms: Math.round(performance.now() - start),
            contentType: ct,
            body,
          })
        } catch (e) { /* drop */ }
      })
    }
    return send.apply(this, arguments)
  }
})()
