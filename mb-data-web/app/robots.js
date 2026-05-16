// Robots.txt généré dynamiquement par Next.js App Router.
// Servi automatiquement à https://quantara.tech/robots.txt
// Strategy 2026 : tous les crawlers (search + AI) autorisés sur le contenu public.
// Brand mentions corrèlent 3x plus avec visibilité AI que les backlinks (Ahrefs Dec 2025)
// → on veut ChatGPT/Claude/Perplexity qui crawlent notre contenu.

export default function robots() {
  return {
    rules: [
      // Crawlers généralistes : OK sur tout sauf zones privées
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/app/',          // Webapp authentifiée
          '/api/',          // Endpoints API
          '/admin/',        // Console admin
          '/auth/callback', // Callbacks OAuth
        ],
      },
      // AI search crawlers — autorisés explicitement (visibilité ChatGPT/Claude/Perplexity)
      {
        userAgent: [
          'GPTBot',         // OpenAI training + search
          'OAI-SearchBot',  // OpenAI search features
          'ChatGPT-User',   // ChatGPT real-time browsing
          'ClaudeBot',      // Anthropic Claude
          'anthropic-ai',   // Anthropic training
          'PerplexityBot',  // Perplexity AI search
          'Google-Extended',// Google Gemini (séparé de Googlebot pour search)
        ],
        allow: '/',
        disallow: ['/app/', '/api/', '/admin/', '/auth/callback'],
      },
    ],
    sitemap: 'https://quantara.tech/sitemap.xml',
    host: 'https://quantara.tech',
  }
}
