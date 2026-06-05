// Centralised config for the Quantara Sync extension.
// Edit QUANTARA_API_BASE for local dev (http://localhost:3000) vs prod.

export const QUANTARA_API_BASE = 'https://quantara.tech'
export const QUANTARA_ORIGIN_PROD = 'https://quantara.tech'
export const QUANTARA_ORIGIN_LOCAL = 'http://localhost:3000'

// Public Supabase config (anon key is safe to ship — protected by RLS).
// These are read from the Quantara bridge content script when the user signs
// in on quantara.tech, so the extension itself does not need to embed them.
// They are kept here as a fallback for documentation purposes only.
export const SUPABASE_AUTH_STORAGE_KEY_PREFIX = 'sb-'

// Recognised PropFirm dashboards. Each entry maps a host suffix to a slug we
// use internally (matches Quantara's `firms` table naming).
export const FIRM_HOSTS = {
  'lucidtrading.com':       'lucid-trading',
  'dash.lucidtrading.com':  'lucid-trading',
  'topstepx.com':           'topstep',
  'apextraderfunding.com':  'apex-trader-funding',
  'myfundedfutures.com':    'my-funded-futures',
  'tradeify.com':           'tradeify',
  'bulenox.com':            'bulenox',
  'takeprofittrader.com':   'take-profit-trader',
  'tradeday.co':            'tradeday',
}

// Match the current page's hostname to a firm slug, or return null.
export function firmSlugFromHost(host) {
  const h = String(host || '').toLowerCase()
  for (const [suffix, slug] of Object.entries(FIRM_HOSTS)) {
    if (h === suffix || h.endsWith('.' + suffix)) return slug
  }
  return null
}

// Debug mode is OFF by default. When enabled it still does NOT capture
// response bodies — only method/url/status/ms — to keep PropFirm JWTs
// and PII out of chrome.storage.local. A separate "rich debug" toggle
// (richDebugMode) enables body capture for short troubleshooting
// sessions, capped at 2k chars per entry and 30 entries total.
export const DEFAULT_DEBUG = false
export const DEFAULT_RICH_DEBUG = false
export const RICH_DEBUG_BODY_MAX = 2000
export const RICH_DEBUG_ENTRY_MAX = 30
