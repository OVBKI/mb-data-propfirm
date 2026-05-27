# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Quantara (Quantara Technologies LLC, New Mexico) — PropFirm trading analytics platform. Next.js 14 (App Router) + Supabase + Vercel.
Monorepo root is `/mb-data-web/`.

## Commands

```bash
cd mb-data-web
npm install          # install dependencies
npm run dev          # dev server on localhost:3000
npm run build        # production build
npm run lint         # ESLint (next/core-web-vitals)
```

No test framework is configured yet. When adding tests, use Vitest.

## Architecture

### Routing (App Router)

```
app/
  layout.js              # Root layout (metadata, LanguageProvider, analytics)
  page.js                # Landing page (server component, lazy-loads LandingPage client)
  app/
    page.js              # Redirect → /app/dashboard
    (main)/
      layout.js          # Auth shell: session check, loads firms/accounts/payouts, sidebar, modals
      AppContext.js       # React context providing { user, firms, rates, profile, S, toast, ... }
      dashboard/page.js  # Dashboard (firm cards, stats, charts)
      journal/page.js    # Thin wrapper → JournalPage component
      trades/page.js     # Thin wrapper → TradesPage component
      heatmaps/page.js   # Thin wrapper → HeatmapPage component
      calendar/page.js   # Thin wrapper → CalendarPage component
      analytics/page.js  # Cumulative/yearly/monthly charts
      alerts/page.js     # Billing alerts + push notification toggle
      settings/page.js   # User preferences (email, notifications, language, data)
      rules/page.js      # PropfirmComparator
      myrules/page.js    # MyRulesPage
      sync/page.js       # Coming soon placeholder
      groups/page.js     # Trading groups
      profile/page.js    # User profile editor
      import-lab/page.js # CSV import lab
      journal-sync/      # Rithmic journal sync
  admin/                 # Admin panel (hardcoded email check in lib/admins.js)
  api/                   # API routes (all use verifyAuth/verifyAdmin from lib/apiAuth.js)
```

The `(main)` route group wraps all app pages with the shared auth shell + sidebar (unified layout).

### State Management

No Redux/Zustand. Single `AppContext` in `app/app/(main)/layout.js` provides shared state to all child pages. Pages access it via `useApp()` hook. Data is loaded once on mount from Supabase, with a `reload()` function for manual refresh.

### Data Flow

```
Supabase DB → layout.js loadFirms() → AppContext → useApp() in pages
                                                  → props drilling into components
```

Firms contain nested accounts, accounts contain nested payouts. The `allAccounts` flat array is derived from firms for components that need it.

### Authentication

- Client: `lib/supabase.js` — custom storage adapter (localStorage vs sessionStorage based on "remember me")
- API routes: `lib/apiAuth.js` — `verifyAuth(request)` validates Bearer token, `verifyAdmin(request)` adds admin email check via `isAdmin()` from `lib/admins.js`
- Admin emails are hardcoded in `lib/admins.js`. Always use `isAdmin(email)` (case-insensitive) not `ADMIN_EMAILS.includes(email)`.
- Middleware at `middleware.js` protects `/admin/*` routes only. `/app/*` auth is handled client-side in the `(main)` layout.

### Database (Supabase)

Schema in `supabase-schema.sql`. Core tables: `firms`, `accounts`, `payouts`, `journal_entries`, `certificates`, `profiles`, `groups`, `group_members`, `follows`, `push_subscriptions`, `waitlist`, `announcements`.

All tables have RLS enabled with `auth.uid() = user_id` policies. API routes that need cross-user access (admin, cron) use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS.

Key RPC functions: `resolve_username_to_email` (login by username), `username_available` (profile). The resolve function is granted to `authenticated` only (not `anon`) — the `/api/auth/resolve-username` route uses service role.

### Styling

Inline styles everywhere — no Tailwind, no CSS modules. Shared via:
- `lib/theme.js` — `C` color palette, `cardStyle`, `btnPrimary`, `btnGhost`, `inputStyle`, `chipBtn(active)`
- `app/globals.css` — CSS custom properties (`--surface`, `--border`, `--text`, `--bg`, etc.)
- The `(main)` layout provides an `S` object with style factories via AppContext

When adding new components, import from `lib/theme.js` for colors and style objects. Do not create new local color constants.

### i18n

Client-side only via `components/LanguageProvider.js`. Two locales: FR (default) and EN.
- `useT()` returns a translation function: `t('hero.title')` → translated string
- `useLanguage()` returns `{ locale, setLocale }`
- Translations live in `lib/i18n.js` (single file, ~2260 lines, dot-notation keys)
- **All app components are fully translated** (v3.1 completed). Keys are organized under:
  - `app.dashboard.*`, `app.analytics.*`, `app.alerts.*` — dashboard pages
  - `app.trades.*` — TradesPage (trade log with filters)
  - `app.journal.*` — JournalPage (calendar + equity curves)
  - `app.heatmap.*` — HeatmapPage (day/hour/session heatmaps)
  - `app.myrules.*` — MyRulesPage (trading plan, setups, rules)
  - `app.comparator.*` — PropfirmComparator (firm comparison cards + drawer)
  - `app.trade.*` — TradeEntryModal + TradeCard (trade form fields, toasts, previews)
  - `app.settings.*` — Settings page (profile, notifications, language, data)
  - `app.auth.*` — AuthPage (login/register)
- When adding new user-visible text, add keys to both `FR` and `EN` objects in `lib/i18n.js`

### Loading States (Skeleton)

`components/Skeleton.js` provides animated shimmer placeholders for loading states. Available variants:
- `<Skeleton width={100} height={16} />` — single block
- `<Skeleton circle width={40} height={40} />` — avatar
- `<Skeleton.Text lines={3} />` — multi-line text block
- `<Skeleton.Card />` — stat card placeholder
- `<Skeleton.StatsRow count={5} />` — row of stat cards
- `<Skeleton.Grid count={6} />` — grid of content cards
- `<Skeleton.Table rows={5} />` — table rows
- `<Skeleton.AppShell />` — full app shell (sidebar + content)

All data-loading pages use Skeleton instead of plain "⏳ Loading..." text: TradesPage, JournalPage, HeatmapPage, MyRulesPage, CalendarPage, ProfileModal, CertificatesModal, EquityOverlayChart, Groups, Profile.

### Responsive

Mobile breakpoints are in `app/globals.css`:
- `@media (max-width: 1024px)` — tablets: grids collapse, stats become 2-col
- `@media (max-width: 768px)` — mobile: sidebar becomes drawer, single-column layouts

CSS classes for responsive grids: `stats-4`, `stats-5`, `analytics-charts`, `heatmap-2col`, `firms-grid`, `dash-sidebar-row`. Apply these as `className` alongside inline `gridTemplateColumns`.

### Shared Utilities

`lib/format.js` — formatting functions used across multiple components:
- `fmtMoney(val, dec=2)` — money with sign (`+1234.50 $`)
- `fmtE(val, dec=2)` — euros without sign
- `fmtENet(val, dec=2)` — euros with sign
- `toEUR(amount, currency, rates)` — currency conversion
- `todayISO()`, `daysAgoISO(n)`, `fmtDate(dateStr)`

`lib/constants.js` — PropFirm rules database (~1084 lines). `PROPFIRM_RULES` contains per-firm plan sizes, drawdown types, payout targets, trading day minimums. Helper functions: `plansForFirm()`, `accountLabel()`, `defaultDdType()`, etc.

### API Routes Pattern

All API routes follow this pattern:
```js
import { verifyAuth } from '../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../lib/rateLimit'

export async function POST(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })
  // ... logic using auth.user.id
}
```

Admin routes use `verifyAdmin(request)` instead. Cron routes validate `CRON_SECRET` Bearer token. Rate limiting is in-memory (resets on serverless cold start).

### Landing Page

`app/page.js` is a server component that exports metadata and lazy-loads `components/landing/LandingPage.js` (client). Heavy below-fold components (mockups, Three.js star field, animated cards) are lazy-loaded with `dynamic(() => import(...), { ssr: false })`. A static HTML fallback renders for crawlers.

## Environment Variables

See `.env.example` for all 10 required variables with documentation. Key ones:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` — server-side admin access (never expose to client)
- `CRON_SECRET` — authenticates Vercel cron jobs

## Deployment

Vercel auto-deploys from `main`. Two cron jobs configured in `vercel.json`:
- `/api/cron/check-bills` — daily 9 AM UTC (billing reminders via push)
- `/api/cron/monthly-recap` — 1st of month 8 AM UTC (email recap via Resend)

## Conventions

- All new pages in `/app/app/` must go inside the `(main)/` route group to get the auth shell
- Use `lib/format.js` and `lib/theme.js` for formatting and styling — do not duplicate
- API routes: always use `verifyAuth()` or `verifyAdmin()`, never create ad-hoc auth checks
- Supabase queries in client components use the anon key client; API routes needing cross-user access use service role
- French is the primary language. All user-visible text must use `t('key')` — add keys to both `fr` and `en` in `lib/i18n.js`
- Loading states: use `<Skeleton>` components, never plain "⏳ Loading..." text
- Responsive: add the appropriate CSS class from `globals.css` (e.g. `className="heatmap-2col"`) to grids that need to collapse on mobile
- Touch targets: buttons must be at least 32px (use `minWidth: 32, minHeight: 32`)

## Session History (May 27, 2026)

### LLC Info
- **Quantara Technologies LLC**, New Mexico (not Texas)
- 1209 Mountain Road PL NE, STE R, Albuquerque, NM 87110, USA
- All 20+ files updated (legal, footers, emails, schema, docs)

### Semaine 2 — SEO & Discovery (DONE)
- **Public comparator** at `/compare` (no login required), JSON-LD FAQ+WebPage schemas
- **JSON-LD global** — Organization + WebSite in root layout.js (all pages)
- **hreflang** — fr-FR, en-US, x-default
- Navigation links added to PageHeader, Footer, MeshGradientFooter

### Semaine 3 — Conversion (DONE)
- **Hero headline rewrite** — "Tous tes comptes PropFirm. Un seul dashboard." (PropFirm-specific)
- **Social proof** — beta badge + 3 testimonial cards on landing (SocialProof.js)
- **Ghost Mode** — `/demo` page with 4 realistic PropFirm accounts, no signup required
- **Onboarding emails** — 3-email sequence (Day 0/3/7) via Resend, cron at 10 AM UTC

### Semaine 4 — Growth Engine (DONE)
- **Drawdown simulator** — `/tools/drawdown-simulator`, interactive EOD/Intraday calculator
- **Referral program** — API `/api/referral`, unique codes (QT-XXXXXX), crypto.randomBytes
- **Drawdown Guardian** — push alert cron Mon-Fri 2:30 PM UTC for accounts below 70%
- **Compare pages** — `/compare/quantara-vs-tradervue`, `/compare/quantara-vs-excel`
- **ComparisonPage** reusable component for all vs pages

### Full Audit (DONE — May 27, 2026)
4-axis audit ran: SEO (6.1/10), Security (7.5/10), CRO/UX (6.9/10), Code Quality (7/10).

**Critical fixes applied:**
- Build crash: moved createClient() from module scope into handlers (3 routes)
- Security: onboarding email forced to auth.user.email (was accepting arbitrary email)
- Security: CRON_SECRET undefined bypass fixed (2 cron routes)
- Security: XSS in email templates fixed (escapeHtml on username)
- Security: Math.random → crypto.randomBytes for referral codes
- Crash: try/catch on request.json() in referral + onboarding routes
- SEO: llms.txt updated with correct LLC + all new page URLs

**Supabase migrations applied by user:**
- profiles.onboarding_emails_sent (integer, default 0)
- profiles.referral_code (text, unique)
- referrals table (referrer_id, referred_id, referral_code)
- propfirm_rules_overrides table (firm_name, rule_key, plan, value)
- waitlist table (email, plan, ip_address)

## Public Pages (no auth)

| Route | Description |
|-------|-------------|
| `/` | Landing page (hero + social proof + 6 product sections + features + CTA) |
| `/compare` | PropFirm comparator (10+ firms, filters, detail drawer) |
| `/compare/quantara-vs-tradervue` | Feature comparison table |
| `/compare/quantara-vs-excel` | Feature comparison table |
| `/tools/drawdown-simulator` | Interactive trailing DD calculator (EOD/Intraday, 6 presets) |
| `/demo` | Ghost Mode dashboard preview (4 fake accounts, no signup) |
| `/pricing` | Pricing page (Free/Pro/Lifetime, waitlist form) |
| `/docs` | Documentation + FAQ |
| `/integrations` | Supported PropFirms list |
| `/security` | Security architecture + GDPR compliance |
| `/contact` | Contact info (hardcoded FR — needs i18n) |
| `/legal/*` | CGU, Privacy, Imprint |
| `/u/[username]` | Public user profiles |
| `/g/[code]` | Group pages |

## Cron Jobs (vercel.json)

| Path | Schedule | Description |
|------|----------|-------------|
| `/api/cron/check-bills` | Daily 9 AM UTC | Push alerts 2 days before billing |
| `/api/cron/monthly-recap` | 1st of month 8 AM | Email recap via Resend |
| `/api/cron/onboarding-emails` | Daily 10 AM UTC | 3-email welcome sequence (J0/J3/J7) |
| `/api/cron/drawdown-guardian` | Mon-Fri 2:30 PM UTC | Push alert when DD < 70% |

## Audit — Open Issues (prioritized)

### CRO (conversion killers — fix next)
1. **Hero CTA routes to /app (login) instead of /auth?mode=signup** — visitors land on login not signup
2. **Social proof unconvincing** — 3 anonymous testimonials, hardcoded count=47, no photos
3. **Demo page is dead end** — sidebar not clickable, only Dashboard view, banner dismissible
4. **No social login** (Google/Discord) — would increase signups 20-40%
5. **Pricing not visible** from landing page navigation

### SEO (content gaps)
6. **GSC not connected** — layout.js line 97 still has placeholder verification code
7. **0 firm pages, 0 guides, 0 blog** — site at 14% of SEO plan M6 target
8. **Landing SSR fallback is thin** (~50 words) — crawlers miss product sections
9. **No internal cross-linking** between content pages
10. **H1 pollution** in landing mockups (DashboardMockup, AnalyticsMockup, JournalMockup, EconomicCalendarMockup all have <h1>)
11. **6 pages missing canonical URLs** — /security, /integrations, /contact, /legal/*
12. **6 pages missing page-specific OG tags** — pricing, docs, security, integrations, contact, demo

### Code quality
13. **i18n gaps** — ComparisonPage, DrawdownSimulator, DemoClient, contact page have hardcoded strings
14. **contact/page.js** not following server+client pattern (no PageHeader/Footer, all hardcoded FR)
15. **22 React Hooks exhaustive-deps warnings** across CalendarPage, JournalPage, MyRulesPage, etc.
16. **No rate limiting** on /api/referral, /api/onboarding, /api/export, /api/push/*

### Security (medium/low)
17. **unsafe-eval in CSP** — next.config.js script-src allows eval (should be dev-only)
18. **Push subscribe/unsubscribe** use ad-hoc auth instead of verifyAuth()
19. **Admin layout** uses case-sensitive ADMIN_EMAILS.includes() instead of isAdmin()
20. **Middleware admin check** is bypassable (only checks referer/auth header existence)

## Proposed Innovative Features

| # | Feature | Impact | Complexity |
|---|---------|--------|------------|
| 1 | **Danger Zone + Trading Pause** — modal at 15% DD with suggested position size + cooldown timer | Retention, differentiation | Medium |
| 2 | **Anonymous Leaderboard** — opt-in ROI/consistency rankings at /leaderboard | SEO + social proof + community | Medium |
| 3 | **AI Trade Coach** — weekly analysis after 30+ trades via Claude API | Core value prop ("Grow") | High |
| 4 | **Challenge Optimizer** — /tools/challenge-optimizer recommends best firm+plan | SEO lead magnet | Medium |
| 5 | **Rithmic Browser Extension** — Chrome extension scrapes trades, pushes to Quantara | Removes #1 friction point | High |

## Pending / Roadmap

- **Sentry** — account exists, DSN needed to integrate error tracking
- **Stripe** — waiting for LLC EIN to set up payments
- **Sync Rithmic/ProjectX** — waiting for 50 users before building
- **Tests** — no test framework yet; when adding, use Vitest
- **SEO content engine** — /firms/[slug], /guides/[slug], /blog/[slug] templates not built yet
- **Topstep vs Apex page** — highest-value missing content (2.4k/mo keyword)
