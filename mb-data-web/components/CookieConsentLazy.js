'use client'
// Bandeau cookies chargé côté navigateur seulement (il lit localStorage).
// Next 15 n'accepte `ssr: false` que dans un composant client.
import dynamic from 'next/dynamic'

export default dynamic(() => import('./CookieConsent'), { ssr: false })
