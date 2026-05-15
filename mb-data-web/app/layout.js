import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

// === Typographie distinctive (frontend-design : éviter Inter / Roboto / Arial) ===
// Geist : sans moderne par Vercel — bien plus distinctif qu'Inter
// Geist Mono : monospace pour chiffres et data (cohérent avec body)
// Instrument Serif : italic display utilisé en headlines — signal luxury, éditorial
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata = {
  title: 'Quantara — Track. Analyze. Grow.',
  description: 'Le journal de trading des PropFirms futures. Track. Analyze. Grow.',
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0d0f14',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
      <body className={geist.className}>
        {children}
        {/* Cloudflare Turnstile — anti-bot, doit charger avant l'auth page */}
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          async
          defer
        />
        {/* Service Worker pour push notifications — enregistré côté client */}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW registration failed:', err))
            })
          }
        `}</Script>
      </body>
    </html>
  )
}
