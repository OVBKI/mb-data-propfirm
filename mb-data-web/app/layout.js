import { Outfit, Roboto_Mono } from 'next/font/google'
import Script from 'next/script'
import dynamic from 'next/dynamic'
import { Analytics } from '@vercel/analytics/react'
import { LanguageProvider } from '../components/LanguageProvider'
import { ThemeProvider } from '../components/ThemeProvider'
import ErrorBoundary from '../components/ErrorBoundary'
import JsonLd, { ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from '../components/JsonLd'
import './globals.css'

const CookieConsent = dynamic(() => import('../components/CookieConsent'), { ssr: false })

// Abyss — Outfit pour l'interface (grotesque géométrique, chaleureux aux grandes
// tailles), Roboto Mono pour tout ce qui s'aligne en colonne. Exposées en
// variables CSS pour que globals.css et les styles inline y accèdent.
const outfit = Outfit({ subsets: ['latin'], variable: '--font-ui', display: 'swap' })
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

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
  authors: [{ name: 'Quantara Technologies LLC', url: 'https://quantara.tech' }],
  creator: 'Quantara Technologies LLC',
  publisher: 'Quantara Technologies LLC',
  applicationName: 'Quantara',
  category: 'Finance',
  manifest: '/manifest.json',

  alternates: {
    canonical: 'https://quantara.tech',
    languages: {
      'fr-FR': 'https://quantara.tech',
      'en-US': 'https://quantara.tech',
      'x-default': 'https://quantara.tech',
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

  // Verification : aucun token tant qu'on n'a pas le vrai (un placeholder émet
  // un <meta google-site-verification> bidon site-wide). Ajouter le vrai code GSC ici.
  // verification: { google: 'TOKEN_REEL', bing: 'TOKEN_BING' },

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
  // Valeur de départ (thème sombre par défaut) ; ThemeProvider réécrit la balise
  // au runtime quand l'utilisateur bascule en clair.
  themeColor: '#0a1420',
  // Les deux schémas sont supportés — c'est `color-scheme` posé par [data-theme]
  // dans globals.css qui tranche, pas cette balise.
  colorScheme: 'dark light',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" data-theme="dark">
      <head>
        {/*
          Anti-flash de thème. Doit s'exécuter AVANT le premier paint : il pose
          data-theme sur <html> à partir de localStorage. Le faire depuis un
          useEffect ferait clignoter l'app en sombre pendant une frame chez les
          utilisateurs en clair.
          Le défaut reste 'dark' : sans choix explicite, rien ne change.
          Le contenu est une constante littérale — aucune donnée externe n'y entre.
        */}
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function () {
            try {
              var p = localStorage.getItem('quantara_theme')
              var sysLight = window.matchMedia('(prefers-color-scheme: light)').matches
              var t = p === 'light' ? 'light' : p === 'system' ? (sysLight ? 'light' : 'dark') : 'dark'
              document.documentElement.setAttribute('data-theme', t)
            } catch (e) {}
          })()
        `}</Script>
        <JsonLd data={ORGANIZATION_SCHEMA} />
        <JsonLd data={WEBSITE_SCHEMA} />
      </head>
      <body className={`${outfit.variable} ${robotoMono.variable}`}>
        <a href="#main-content" style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }} className="skip-to-content">
          Skip to content
        </a>
        <ThemeProvider>
          <LanguageProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </LanguageProvider>
        </ThemeProvider>
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
        {/* RGPD — Cookie consent banner (client-side only, uses localStorage) */}
        <CookieConsent />
      </body>
    </html>
  )
}
