// Service Worker Quantara — gère les push notifications.
// Auto-enregistré par app/layout.js au chargement.

self.addEventListener('install', () => {
  self.skipWaiting() // active immédiatement la nouvelle version
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim()) // prend le contrôle des onglets ouverts
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
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
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
