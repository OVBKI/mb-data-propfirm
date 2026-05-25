'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'quantara_cookie_consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY)
    if (!consent) setVisible(true)
  }, [])

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  function handleRefuse() {
    localStorage.setItem(STORAGE_KEY, 'refused')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#141720',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      padding: '16px 24px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{
        margin: 0,
        fontSize: 13,
        color: '#9098b0',
        lineHeight: 1.5,
        maxWidth: 600,
        textAlign: 'center',
      }}>
        Ce site utilise des cookies essentiels et fonctionnels pour assurer son bon fonctionnement.
        Aucun cookie de tracking ou publicitaire n'est utilisé.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleRefuse}
          style={{
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 500,
            background: 'transparent',
            color: '#9098b0',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'border-color 0.15s',
          }}
        >
          Refuser
        </button>
        <button
          onClick={handleAccept}
          style={{
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 600,
            background: '#2d6fff',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 2px 8px rgba(45,111,255,0.3)',
            transition: 'opacity 0.15s',
          }}
        >
          Accepter
        </button>
      </div>
    </div>
  )
}
