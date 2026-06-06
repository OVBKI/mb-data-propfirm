'use client'
// FontLoader — injects the Google Fonts <link> tags once on mount.
// Using a client-side injection keeps the editorial bundle self-contained
// and avoids polluting the global <head> from the server layout.

import { useEffect } from 'react'

const LINKS = [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap',
  },
]

// Marker so we don't inject the same <link> tags twice if multiple instances
// of the landing mount (e.g. during HMR or Suspense replays).
const MARKER_ATTR = 'data-qte-fonts'

export default function FontLoader() {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    if (document.head.querySelector(`[${MARKER_ATTR}]`)) return undefined

    const injected = LINKS.map((attrs) => {
      const link = document.createElement('link')
      Object.entries(attrs).forEach(([k, v]) => {
        if (v === true) link.setAttribute(k, '')
        else if (v !== undefined && v !== null) link.setAttribute(k.toLowerCase(), String(v))
      })
      link.setAttribute(MARKER_ATTR, '1')
      document.head.appendChild(link)
      return link
    })

    return () => {
      // Keep fonts loaded across navigations — only clean up if the page
      // actually unmounts permanently. Fonts are cheap to keep cached.
      injected.forEach((node) => {
        if (node.parentNode) node.parentNode.removeChild(node)
      })
    }
  }, [])

  return null
}
