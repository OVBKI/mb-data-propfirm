// Runs on quantara.tech pages. When the user is signed into Quantara,
// Supabase persists the session in localStorage under a key shaped like
// `sb-<project>-auth-token`. We read it and hand the token to the
// background service worker so the extension can call the Quantara API.
//
// We refresh this on every page load and on every storage event so the
// extension's auth stays in sync with the website.
//
// SECURITY: this script is matched against `*.quantara.tech` (manifest
// content_scripts), so it could also execute on a future Vercel preview
// deployment or a sub-domain that happens to fall under that pattern.
// We harden against that by short-circuiting unless the page is served
// from the canonical https://quantara.tech origin. The service worker
// performs the same check independently before persisting the token.

const TRUSTED_ORIGIN = 'https://quantara.tech'

;(function () {
  if (location.origin !== TRUSTED_ORIGIN) return
  function findSupabaseSession() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue
        const raw = localStorage.getItem(key)
        if (!raw) continue
        let parsed
        try { parsed = JSON.parse(raw) } catch { continue }
        const session = parsed?.currentSession || parsed?.session || parsed
        if (!session?.access_token) continue
        return {
          accessToken: session.access_token,
          refreshToken: session.refresh_token || null,
          userId: session.user?.id || null,
          email: session.user?.email || null,
          expiresAt: session.expires_at || null,
        }
      }
    } catch (e) { /* drop */ }
    return null
  }

  function syncOnce() {
    const auth = findSupabaseSession()
    if (!auth) return
    try {
      chrome.runtime.sendMessage({ type: 'AUTH_FROM_QUANTARA', payload: auth })
    } catch (e) { /* extension reloaded — ignore */ }
  }

  syncOnce()
  window.addEventListener('storage', syncOnce)
  // Re-check periodically in case Supabase refreshes the token in the same tab.
  setInterval(syncOnce, 60_000)
})()
