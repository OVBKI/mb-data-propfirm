// Sentry server config — runs in Node.js (API routes, server components).

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  sendDefaultPii: false,

  ignoreErrors: [
    /rate.?limit/i,
    /unauthorized/i,
    /401/,
  ],

  environment: process.env.NODE_ENV,

  beforeSend(event) {
    // Strip sensitive body data
    if (event.request?.data && typeof event.request.data === 'object') {
      const sensitive = ['password', 'token', 'apiKey', 'secret']
      for (const key of sensitive) {
        if (key in event.request.data) event.request.data[key] = '[Filtered]'
      }
    }
    if (event.request?.headers?.authorization) {
      event.request.headers.authorization = '[Filtered]'
    }
    return event
  },
})
