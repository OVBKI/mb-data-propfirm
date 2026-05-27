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

### Full Audit v2 (6-agent deep audit — May 27, 2026)

**Scores:**
| Axe | Score |
|-----|-------|
| Functionality/Bugs | 2 High, 2 Medium, 1 Low |
| Marketing/Copy | 6.0/10 |
| SEO/AI Visibility | 38/100 |
| Architecture/Performance | 5.5/10 |
| i18n completeness | 5/10 |
| Accessibility (WCAG) | 3/10 |

**Critical fixes already applied (audit v1):**
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

## Audit — Bugs (NOT YET FIXED)

| # | Severity | Bug | File |
|---|----------|-----|------|
| 1 | **HIGH** | `/auth?mode=signup` = 404 — no `/auth` route exists. Pricing CTA is broken. | `PricingClient.js:134` |
| 2 | **HIGH** | AuthPage ignores `?mode=signup` — mode state hardcoded to `'login'` | `AuthPage.js:18` |
| 3 | **MEDIUM** | Demo page has no PageHeader/Footer — navigation dead end. Sidebar items non-interactive. | `DemoClient.js` |
| 4 | **MEDIUM** | ComparisonPage + both vs pages = 100% hardcoded English, no i18n | `ComparisonPage.js` |
| 5 | **LOW** | DrawdownSimulator has mixed i18n — status/type labels hardcoded EN | `DrawdownSimulatorClient.js` |

## Audit — Open Issues (prioritized, NOT YET FIXED)

### P0 — Conversion blockers
1. Create `/auth` route OR change all CTAs to route correctly to signup mode
2. Change ALL CTA links from `/app` → proper signup URL (hero, demo, compare, tools, final CTA)
3. Add PageHeader + Footer to demo page

### P1 — SEO critical
4. Enrich SSR fallback in app/page.js (LandingFallback) — add links + 300 words content for crawlers
5. Generate 11 `/firms/[slug]` pages from PROPFIRM_RULES data (constants.js) — programmatic SEO
6. Create `/compare/topstep-vs-apex` — 2400/mo search volume keyword
7. Add canonical URLs to 6 pages: /security, /integrations, /contact, /legal/*
8. Add OG + Twitter cards to 9 pages missing them
9. Add FAQPage JSON-LD to /docs page
10. Fix H1 pollution in 4 landing mockups (DashboardMockup, AnalyticsMockup, JournalMockup, EconomicCalendarMockup)

### P2 — Marketing / Trust
11. Rewrite hero headline — lead with pain not features ("Stop losing funded accounts")
12. Replace fake social proof with real metrics or PropFirm logos
13. Add competitor price anchoring on pricing page (Tradervue $49/mo vs Quantara 9€)
14. Add money-back guarantee 30 days on Lifetime plan
15. Add share functionality to drawdown simulator

### P3 — Architecture
16. Replace N+1 billing queries in loadFirms() with single Supabase RPC — 10-30x faster login
17. Use nested selects: `firms.select('*, accounts(*, payouts(*)')` — 75% fewer DB queries
18. Remove dead dependencies: lenis, react-chartjs-2
19. Add exchange rate caching (30 min TTL)
20. Integrate Sentry
21. Add rate limiting to /api/referral, /api/onboarding, /api/export, /api/push/*
22. Add ISR (revalidate=3600) to static public pages

### P4 — Accessibility
23. Add `:focus-visible` styles + remove `outline: none` from .qt-focus-ring
24. Add skip-to-content link in root layout
25. Increase --text3 contrast from #565e78 → #7b839b (4.5:1 ratio) — 294 occurrences
26. Add `role="dialog"` + aria-label + focus trapping + Escape key to all modals/drawers
27. Dynamic `<html lang>` based on selected locale (currently hardcoded "fr")

### P5 — i18n gaps
28. contact/page.js — entire page hardcoded FR, needs refactor to client component with t()
29. not-found.js, error.js, auth/callback/page.js — hardcoded FR
30. layout.js drawers/modals — 50+ hardcoded FR strings
31. Tutorial.js — 8 steps entirely hardcoded FR
32. ComparisonPage.js + both ComparisonClient — hardcoded EN
33. DemoClient.js — sidebar labels + status labels hardcoded EN
34. DrawdownSimulatorClient.js — status/type/badge labels hardcoded EN

### P6 — Security (medium/low)
35. unsafe-eval in CSP — next.config.js (should be dev-only)
36. Push subscribe/unsubscribe use ad-hoc auth instead of verifyAuth()
37. Admin layout uses case-sensitive ADMIN_EMAILS.includes() instead of isAdmin()
38. Middleware admin check is bypassable (only checks referer/auth header existence)

## Programmatic SEO Opportunity

Data in `lib/constants.js` (1084 lines, 11 firms, 33+ plans) can auto-generate:
- 11 `/firms/[slug]` pages — ~5000/mo keyword volume
- 33+ `/firms/[slug]/[plan]` sub-pages — long-tail
- 55 `/compare/[firmA]-vs-[firmB]` pages — comparison queries
- **Total: ~99 pages from existing data, ~1 week of work**

## Proposed Features (15, ranked by priority score)

| # | Feature | Score | Difficulty |
|---|---------|:-----:|:----------:|
| 1 | **Drawdown Health Dashboard** — visual fuel gauge per account | 30 | Low |
| 2 | **Consistency Score Monitor** — real-time per-firm formula | 28 | Medium |
| 3 | **Payout Pipeline Tracker** — Eligible→Requested→Received | 27 | Medium |
| 4 | **Danger Zone + Trading Pause** — modal at 15% DD + cooldown | 27 | Medium |
| 5 | **Position Size Calculator** — in trade modal + public tool | 26 | Low |
| 6 | **Daily Pre-Market Checklist** — integrates MyRules | 26 | Low |
| 7 | **Account Lifecycle Kanban** — pipeline Challenge→Funded | 25 | Medium |
| 8 | **Rule Violation Detector** — auto-check after each trade | 25 | Medium |
| 9 | **PropFirm Cost Simulator** — public tool /tools/cost-simulator | 25 | Low |
| 10 | **AI Trade Coach** — weekly Claude API analysis after 30+ trades | 24 | High |
| 11 | **Social Payout Certificate** — shareable image @vercel/og | 24 | Low |
| 12 | **Weekly Recap Card** — shareable PNG every Sunday | 22 | Low |
| 13 | **Anonymous Leaderboard** — /leaderboard opt-in rankings | 22 | Medium |
| 14 | **Trade Replay Timeline** — TradingView Lightweight Charts | 20 | High |
| 15 | **Cross-Firm Benchmarking** — anonymized percentiles | 20 | Medium |

**Recommended sprints:**
- Sprint 1 (1-2w): #1, #5, #6, #11, #9
- Sprint 2 (2-3w): #2, #4, #3, #8
- Sprint 3 (3-4w): #7, #13, #12
- Sprint 4 (4+w): #10, #14, #15

## Pending / Roadmap

- **Sentry** — account exists, DSN needed
- **Stripe** — waiting for LLC EIN
- **Sync Rithmic/ProjectX** — waiting for 50 users
- **Tests** — no framework yet; use Vitest when adding
- **SEO content engine** — /firms/[slug], /guides/[slug], /blog/[slug] templates not built
- **Social login** — Google OAuth + Discord OAuth via Supabase Auth providers
- **Topstep vs Apex page** — highest-value missing content (2.4k/mo keyword)
