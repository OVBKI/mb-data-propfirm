// Registry of supported PropFirms — used by the background auto-sync to
// decide which URL to open in a hidden tab to refresh data, and how to
// detect that the user's session on that firm has expired.
//
// Adding a new firm = 1 entry here + an adapter in content/adapters/.

export const FIRMS = {
  'lucid-trading': {
    label: 'Lucid Trading',
    // Hidden tab loads this URL — it must trigger the trade/account API
    // calls our adapter is listening for. For Lucid the Account Details
    // page calls both /api/users/summary and /api/users/accountInfo.
    syncUrl: 'https://dash.lucidtrading.com/#/account-details',
    // We consider a session expired if the tab's final URL matches one
    // of these patterns (firm redirected us to a login form).
    loginPatterns: [/\/login/i, /\/signin/i, /\/auth/i],
    // After opening the hidden tab, give the SPA up to this many ms to
    // make its API calls. We close the tab once we've seen one of the
    // expected URLs OR the timeout fires.
    captureTimeoutMs: 25_000,
    expectedCaptureRe: /\/api\/users\/accountInfo\//i,
  },
  // TopstepX placeholder — will be enabled once we capture and lock its
  // schema. Disabled flag tells the scheduler to skip auto-sync.
  'topstep': {
    label: 'Topstep',
    syncUrl: 'https://app.topstepx.com/',
    loginPatterns: [/\/login/i],
    captureTimeoutMs: 25_000,
    expectedCaptureRe: /\/api\//i,
    disabled: true,
  },
}

// Default auto-sync interval (minutes). User can override via popup.
export const DEFAULT_SYNC_INTERVAL_MINUTES = 120

// Minimum interval Chrome allows on a periodic alarm.
export const MIN_INTERVAL_MINUTES = 15
