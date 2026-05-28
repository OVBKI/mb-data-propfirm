// Sentry client config — runs in the browser.
// Captures unhandled errors + performance traces on the frontend.

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — sample 10% in prod, 100% in dev
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay — capture user sessions on errors only (privacy-friendly)
  replaysSessionSampleRate: 0,    // 0% of normal sessions
  replaysOnErrorSampleRate: 1.0,  // 100% when error occurs

  // Don't send PII by default (GDPR-safer)
  sendDefaultPii: false,

  // Quantara-specific: ignore expected errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    'Failed to fetch',
    'Load failed',
    'NetworkError',
    /turnstile/i,
    /extension/i,
  ],

  environment: process.env.NODE_ENV,

  beforeSend(event) {
    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(f =>
      f.filename?.includes('chrome-extension') ||
      f.filename?.includes('moz-extension')
    )) {
      return null
    }
    return event
  },

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
})
