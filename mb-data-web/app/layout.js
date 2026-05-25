import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'
import { LanguageProvider } from '../components/LanguageProvider'
import ErrorBoundary from '../components/ErrorBoundary'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Metadata complète — SEO + social sharing + AI search readiness.
// Centralisée ici dans le layout racine ; chaque page peut override via export const metadata.
export const metadata = {
  metadataBase: new URL('https://quantara.tech'),
  title: {
    default: 'Quantara — Journal de Trading PropFirm Futures',
    template: '%s | Quantara',
  },
  description: 'Track tes drawdowns trailing, ROI et payouts sur tous tes comptes PropFirm (Topstep, Apex, Lucid, MFFU…). Le journal pensé pour les traders futures. Beta gratuit.',
  keywords: [
    'journal trading propfirm',
    'journal de trading',
    'tracker propfirm',
    'topstep journal',
    'apex trader funding',
    'trailing drawdown',
    'consistency rule',
    'trading futures',
    'prop firm tracker',
    'futures trader journal',
  ],
  authors: [{ name: 'Quantara LLC', url: 'https://quantara.tech' }],
  creator: 'Quantara LLC',
  publisher: 'Quantara LLC',
  applicationName: 'Quantara',
  category: 'Finance',
  manifest: '/manifest.json',

  // Canonical + alternates langues (à étendre quand /en /es seront actives)
  alternates: {
    canonical: 'https://quantara.tech',
    languages: {
      'fr-FR': 'https://quantara.tech',
      // 'en-US': 'https://quantara.tech/en',
      // 'es-ES': 'https://quantara.tech/es',
    },
  },

  // Robots — index + follow, max preview pour rich results
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Open Graph — preview Discord/Twitter/LinkedIn/WhatsApp
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    alternateLocale: ['en_US', 'es_ES'],
    url: 'https://quantara.tech',
    siteName: 'Quantara',
    title: 'Quantara — Journal de Trading PropFirm Futures',
    description: 'Track drawdowns trailing, ROI et payouts. Topstep, Apex, Lucid, MFFU et + de 8 PropFirms supportées. Beta gratuit.',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Quantara — Dashboard PropFirm avec suivi trailing drawdown et consistency',
      },
    ],
  },

  // Twitter Card — summary_large_image pour visibilité max
  twitter: {
    card: 'summary_large_image',
    site: '@quantara_tech',
    creator: '@quantara_tech',
    title: 'Quantara — Journal PropFirm Futures',
    description: 'Track. Analyze. Grow. Le tableau de bord pensé pour les traders PropFirm futures.',
    images: ['/og-image.webp'],
  },

  // Verification (à compléter après setup GSC/Bing)
  verification: {
    // google: 'TOKEN_GSC_ICI',
    // bing: 'TOKEN_BING_ICI',
  },

  // Icons explicites — WebP (compatible navigateurs modernes, ÷6 plus léger)
  icons: {
    icon: [
      { url: '/icon.webp', sizes: '32x32 192x192 512x512', type: 'image/webp' },
    ],
    apple: '/icon.webp',
  },

  // Format detection — éviter que iOS transforme les nombres en téléphone
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0d0f14',
  colorScheme: 'dark',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {/* i18n FR/EN — Provider client-side qui injecte useT() partout sous lui */}
        <LanguageProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </LanguageProvider>
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
        {/* Vercel Analytics — RGPD-friendly, page views + custom events. Pas de Speed Insights. */}
        <Analytics />
      </body>
    </html>
  )
}
