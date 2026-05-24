// Service Worker Quantara — gère les push notifications + offline fallback.
// Auto-enregistré par app/layout.js au chargement.

const SW_VERSION = '1.0.0'
const CACHE_NAME = `quantara-v${SW_VERSION}`

// App shell files to cache for basic offline support
const APP_SHELL = [
  '/',
  '/app',
  '/icon.webp',
  '/manifest.json',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL)
    })
  )
  self.skipWaiting() // active immédiatement la nouvelle version
})

self.addEventListener('activate', event => {
  event.waitUntil(
    // Clean up old caches from previous versions
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('quantara-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // prend le contrôle des onglets ouverts
  )
})

// Offline fallback: try network first, fall back to cache
self.addEventListener('fetch', event => {
  // Only handle GET requests and same-origin navigation
  if (event.request.method !== 'GET') return
  // Skip API requests and non-navigation fetches for simplicity
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses for offline use
        if (response.ok && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request)
      })
  )
})

// Reçoit un push depuis le serveur (envoyé par /api/cron/check-bills)
self.addEventListener('push', event => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Quantara', body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Quantara'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon.webp',
    badge: data.badge || '/icon.webp',
    tag: data.tag || 'quantara-notif', // un même tag remplace la notif précédente
    data: { url: data.url || '/app/alerts' },
    requireInteraction: !!data.requireInteraction, // notif persistante si true
    vibrate: [200, 100, 200],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Click sur la notification → ouvre l'app (ou focus l'onglet existant)
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/app/alerts'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Si un onglet Quantara est déjà ouvert, focus dessus
      for (const client of clientList) {
        if (client.url.includes('/app') && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // Sinon ouvre un nouvel onglet
      return self.clients.openWindow(targetUrl)
    })
  )
})
