'use client'
// Toggle pour activer/désactiver les push notifications.
// Affiché sur la page Alertes — gère permission browser + subscription DB.

import { useState, useEffect } from 'react'
import { isPushSupported, getPermissionStatus, subscribeToPush, unsubscribeFromPush, isSubscribed } from '../lib/push-client'

const C = {
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#7b839b',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
  red: '#e8504a',
}

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(true)
  const [permission, setPermission] = useState('default')
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false)
      setLoading(false)
      return
    }
    setPermission(getPermissionStatus())
    isSubscribed().then(sub => {
      setActive(sub)
      setLoading(false)
    })
  }, [])

  async function toggle() {
    setError('')
    setLoading(true)
    try {
      if (active) {
        await unsubscribeFromPush()
        setActive(false)
      } else {
        await subscribeToPush()
        setActive(true)
        setPermission(getPermissionStatus())
      }
    } catch (err) {
      setError(err.message || 'Erreur')
      setPermission(getPermissionStatus())
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <div style={{
        padding: '14px 18px', background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 10, fontSize: 12, color: C.text3,
      }}>
        ⚠️ Ton navigateur ne supporte pas les notifications push (iOS Safari : ajoute l'app à l'écran d'accueil pour les activer).
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div style={{
        padding: '14px 18px', background: 'rgba(232,80,74,0.08)',
        border: `1px solid ${C.red}`, borderRadius: 10, fontSize: 12, color: C.red, lineHeight: 1.5,
      }}>
        🚫 Tu as bloqué les notifications. Pour les réactiver : clique sur l'icône cadenas à gauche de la barre d'adresse → "Notifications" → "Autoriser", puis reload.
      </div>
    )
  }

  return (
    <div style={{
      padding: '14px 18px', background: C.surface, border: `1px solid ${active ? C.green : C.border2}`,
      borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14,
      transition: 'border-color 0.2s',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: active ? 'rgba(29,184,122,0.12)' : C.surface2,
        border: `1px solid ${active ? C.green : C.border2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>{active ? '🔔' : '🔕'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
          Notifications push {active && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, background: 'rgba(29,184,122,0.15)', color: C.green, marginLeft: 6, fontWeight: 700 }}>ACTIVES</span>}
        </div>
        <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5 }}>
          {active
            ? "Reçois une notif 2 jours avant chaque prélèvement mensuel, même quand Quantara n'est pas ouvert."
            : "Active pour recevoir un rappel 2 jours avant chaque prélèvement mensuel."}
        </div>
        {error && (
          <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>⚠ {error}</div>
        )}
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          padding: '8px 16px', fontSize: 12, fontWeight: 600,
          background: active ? 'transparent' : C.blue,
          color: active ? C.text2 : '#fff',
          border: active ? `1px solid ${C.border2}` : 'none',
          borderRadius: 8, cursor: loading ? 'wait' : 'pointer',
          fontFamily: 'inherit', flexShrink: 0,
        }}>
        {loading ? '⏳' : active ? 'Désactiver' : '🔔 Activer'}
      </button>
    </div>
  )
}
