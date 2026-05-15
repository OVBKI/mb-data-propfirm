// Helpers client-side pour les push notifications.
// Utilisé par le composant PushNotificationToggle.

import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

// Convertit la clé VAPID base64url en Uint8Array (format attendu par PushManager)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

// Vérifie si le navigateur supporte les push notifications
export function isPushSupported() {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

// Permission status courant
export function getPermissionStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

// Souscrit au push (demande permission + enregistre subscription côté serveur)
export async function subscribeToPush() {
  if (!isPushSupported()) throw new Error('Push notifications non supportées sur ce navigateur')
  if (!VAPID_PUBLIC_KEY) throw new Error('VAPID public key manquante (NEXT_PUBLIC_VAPID_PUBLIC_KEY)')

  // 1) Demande la permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permission refusée')

  // 2) Récupère ou enregistre le service worker
  const registration = await navigator.serviceWorker.ready

  // 3) Crée la subscription
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  // 4) Envoie au serveur pour stockage en DB
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Pas de session active')

  const sub = subscription.toJSON()
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: navigator.userAgent,
    }),
  })
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'Erreur enregistrement subscription')
  }
  return subscription
}

// Désouscrit du push (supprime côté serveur + browser)
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  // Supprime côté serveur
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    }).catch(() => {})
  }
  // Désouscrit côté browser
  await subscription.unsubscribe()
}

// Check si l'user a une subscription active
export async function isSubscribed() {
  if (!isPushSupported()) return false
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return !!subscription
  } catch {
    return false
  }
}
