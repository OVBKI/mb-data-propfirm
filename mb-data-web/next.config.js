/** @type {import('next').NextConfig} */

// ============================================================================
// SECURITY HEADERS — appliqués à TOUTES les routes (audit Agent #3 mai 2026)
// ============================================================================
// Ces headers ferment les vecteurs d'attaque classiques :
//   • X-Frame-Options DENY        → bloque clickjacking via <iframe>
//   • X-Content-Type-Options      → empêche MIME sniffing
//   • Referrer-Policy             → ne fuite pas l'URL exacte vers sites tiers
//   • Strict-Transport-Security   → force HTTPS pendant 2 ans (HSTS)
//   • Permissions-Policy          → désactive caméra/mic/géoloc par défaut
//   • Content-Security-Policy     → restreint origines scripts/styles/images
// ----------------------------------------------------------------------------
// CSP est volontairement permissive sur 'unsafe-inline' pour les styles
// (Next.js + framer-motion + Chart.js inline styles partout). À durcir plus tard
// en passant aux nonces côté server components.
// ============================================================================

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Strict-Transport-Security',
    // HSTS 2 ans + includeSubDomains + preload (à confirmer sur hstspreload.org)
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    // Désactive caméra/mic/géoloc/USB/paiement par défaut.
    // Si Quantara ajoute Apple Pay/Stripe plus tard, retire `payment=()`.
    value: 'camera=(), microphone=(), geolocation=(), usb=(), payment=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts : Vercel Analytics, Cloudflare Turnstile, et 'unsafe-inline' pour Next inline
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.vercel-insights.com https://va.vercel-scripts.com",
      // Styles : inline OK (Next + framer + chart.js)
      "style-src 'self' 'unsafe-inline'",
      // Fonts : self + data URIs (icônes embedded)
      "font-src 'self' data:",
      // Images : tout (logos PropFirm en base64, og-image, supabase storage, etc.)
      "img-src 'self' data: blob: https:",
      // Fetch : Supabase + Resend + Finnhub + ForexFactory + ExchangeRate API
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://finnhub.io https://api.exchangerate-api.com https://*.vercel-insights.com https://va.vercel-scripts.com https://nfs.faireconomy.media",
      // iframes : Turnstile uniquement
      "frame-src https://challenges.cloudflare.com",
      // Bloque le reste
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const nextConfig = {
  // Active la vérification stricte React (bonus a11y + futur-proofing)
  reactStrictMode: true,

  // Compression Brotli activée par défaut sur Vercel — laisser Next gérer
  compress: true,

  // === Images ===
  // Next/Image accepte ces domaines distants si jamais utilisés
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'flagcdn.com' },
    ],
  },

  // === Headers de sécurité — appliqués à toutes les routes ===
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
