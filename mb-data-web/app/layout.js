// Typographie distinctive (frontend-design skill : éviter Inter / Roboto / Arial)
// Geist (sans + mono) via package officiel Vercel — distinctif, modern
// Instrument Serif (italic) pour headlines luxury via Google Fonts
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Instrument_Serif } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

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
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable} ${instrumentSerif.variable}`}>
      <body className={GeistSans.className}>
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
