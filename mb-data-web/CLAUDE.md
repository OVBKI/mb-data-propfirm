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
- **Ghost Mode** — `/demo` page with realistic dashboard replica, no signup required
- **Onboarding emails** — 3-email sequence (Day 0/3/7) via Resend, cron at 10 AM UTC

### Semaine 4 — Growth Engine (DONE)
- **Drawdown simulator** — `/tools/drawdown-simulator`, interactive EOD/Intraday calculator
- **Referral program** — API `/api/referral`, unique codes (QT-XXXXXX), crypto.randomBytes
- **Drawdown Guardian** — push alert cron Mon-Fri 2:30 PM UTC for accounts below 70%
- **Compare pages** — `/compare/quantara-vs-tradervue`, `/compare/quantara-vs-excel`
- **ComparisonPage** reusable component for all vs pages

### Audit v1 — Security fixes (DONE)
- Build crash: moved createClient() from module scope into handlers (3 routes)
- Security: onboarding email forced to auth.user.email (was accepting arbitrary email)
- Security: CRON_SECRET undefined bypass fixed (2 cron routes)
- Security: XSS in email templates fixed (escapeHtml on username)
- Security: Math.random → crypto.randomBytes for referral codes
- Crash: try/catch on request.json() in referral + onboarding routes
- SEO: llms.txt updated with correct LLC + all new page URLs

### Audit v2 — 6-agent deep audit (DONE)
Scores: SEO 38/100, Architecture 5.5/10, Marketing 6/10, i18n 5/10, Accessibility 3/10

### Phase 0 — Launch Plan executed (DONE)
**P0.1 Auth + CTAs (FIXED):**
- Created `/auth` route (page.js + AuthClient.js) — no more 404
- AuthPage accepts `initialMode` prop, reads `?mode=signup` from URL
- 10 signup CTAs changed from `/app` → `/auth?mode=signup`
- Login buttons ("Se connecter") kept at `/app`

**P0.2 SEO quick wins (FIXED):**
- SSR fallback enriched (app/page.js LandingFallback) — 300+ words + internal links
- Canonical URLs added to 6 pages (security, integrations, contact, legal/*)
- OG + Twitter cards added to 9 pages
- FAQPage JSON-LD added to /docs
- H1 pollution fixed in 4 landing mockups (h1 → div)

**P0.3 Security (FIXED):**
- Rate limiting added to 5 routes (referral, onboarding, export, push/subscribe, push/unsubscribe)
- CSP unsafe-eval made dev-only in next.config.js
- Push routes refactored to use verifyAuth()
- Admin layout uses isAdmin() (case-insensitive)

**P0.4 Architecture (FIXED):**
- Dead dep removed (react-chartjs-2) — lenis kept (used via dynamic import)
- Nested selects in loadFirms(): `firms.select('*, accounts(*, payouts(*)')` — 1 query instead of 3
- Exchange rate caching (30 min TTL module-scope)
- ISR revalidate=3600 on 6 static public pages

**P0.5 Accessibility (FIXED):**
- :focus-visible styles added in globals.css
- Skip-to-content link in root layout
- --text3 contrast increased #565e78 → #7b839b (4.5:1 ratio, 36 files)
- Dynamic `<html lang>` via LanguageProvider (already was implemented)

### Landing page nav (FIXED)
- Added 4 nav links to landing top bar: Comparateur, Simulateur DD, Tarifs, Démo
- Hidden on mobile (< 768px)

### Demo page rebuilt 3x (FINAL VERSION)
- Exact replica of real dashboard with real PropFirm logos (getFirmLogo)
- Sidebar: 4 sections (Vue d'ensemble, Mes trades, PropFirms, Communauté), same icons as real
- 5 stat cards, firm cards with logos/ROI/accounts/badges
- Full calendar with events (achats/payouts per day), monthly stats, right panel (day detail + transactions récentes)
- 3 bottom cards (par firme chart, statistiques, par firme ranking)
- Badge colors: Challenge=amber, Funded=green, Failed=red, Diplômes=blue with border
- PageHeader + Footer, responsive

**Supabase migrations applied by user:**
- profiles.onboarding_emails_sent (integer, default 0)
- profiles.referral_code (text, unique)
- referrals table (referrer_id, referred_id, referral_code)
- propfirm_rules_overrides table (firm_name, rule_key, plan, value)
- waitlist table (email, plan, ip_address)

## What's LEFT to do (Phase 1-5 of LAUNCH_PLAN.md)

### Phase 1 — Beta privée (NEXT — Weeks 2-3)
- [ ] E2E test complet (signup, onboarding, all features, mobile, Safari)
- [ ] Email deliverability test (mail-tester.com ≥ 9/10)
- [ ] Supabase RLS audit (2 test accounts, verify no data leaks)
- [ ] Setup analytics (PostHog or Plausible)
- [ ] Recruit 10-20 beta testers (Discord trading FR, Twitter, Reddit)
- [ ] Setup Discord server (6 channels)
- [ ] Build quick features: Drawdown Health Dashboard, Position Size Calculator

### Phase 2 — Launch public (Week 4)
- [ ] Polish based on beta feedback
- [ ] Marketing assets (screenshot HD, demo video 60-90s, 3 Twitter visuals)
- [ ] First 5 SEO pages (3 firms + topstep-vs-apex + trailing-drawdown guide)
- [ ] Launch day: Product Hunt, BetaList, Indie Hackers, HN, Reddit

### Phase 3 — SEO & Content (Weeks 5-8)
- [x] **Phase 3.1 — `/firms/[slug]` template + 11 firm pages from PROPFIRM_RULES** ✅
  - `/firms` index + `/firms/[slug]` SSG (generateStaticParams pre-renders all 11)
  - Slugs: topstep, apex-trader-funding, bulenox, lucid-trading, tradeify,
    take-profit-trader, my-funded-futures, phidias-propfirm,
    funded-futures-network, futureselites, alpha-futures
  - `lib/firmSlugs.js` — editorial layer (FIRM_META: tagline, 200-300w intro,
    keyFacts, ddType, splits, platform, country, founded, website, FAQs)
    separate from PROPFIRM_RULES factual data
  - JSON-LD: Product + BreadcrumbList + FAQPage per firm
  - Rules grouped by category via `categorizeRule()` (drawdown, profit,
    trading, contracts, pricing, payouts, multi)
  - Plans selector → per-plan rule detail
  - Sitemap updated (+12 URLs, priority 0.9 / 0.85)
- [x] **Phase 3.2 — `/compare/[pair]` template + 55 firm-vs-firm pages** ✅ (commit cfcff1f)
  - SSG dynamic route, C(11,2) = 55 pairs from PROPFIRM_RULES
  - Slug pattern : alphabetical, e.g. `apex-trader-funding-vs-topstep`
  - Existing `/compare/quantara-vs-*` routes take precedence (Next.js routing)
  - Per page: hero, dual firm cards, 14-row comparison table, verdict, CTAs
  - JSON-LD: WebPage + BreadcrumbList + ItemList
  - Cross-linking: `/firms/[slug]` pages now link to all firm-vs-firm pages
  - Sitemap: +55 URLs (priority 0.75)
- [x] **Phase 3.3 — `/guides/[slug]` infrastructure + 5 educational guides** ✅ (commit 4304156)
  - `/guides` index + `/guides/[slug]` SSG template
  - 5 initial guides ~1000-1500 words each:
    trailing-drawdown, eod-vs-intraday-drawdown, consistency-rule,
    comment-passer-evaluation-topstep, payout-methods-propfirm
  - `lib/guides.js` — GUIDES object with sections + faqs structure
  - JSON-LD: Article + BreadcrumbList + FAQPage
  - Internal linking: guides ↔ firms ↔ other guides
  - Sitemap: +6 URLs (1 index + 5 guides, priority 0.8-0.85)
- [ ] Create blog infrastructure (deferred until first 10 articles ready)
- [x] **Phase 3.4 — Features Sprint 2: Health Center** ✅ (commit 0aeac4a)
  - New route `/app/health` with 3 live in-app sections:
    - Drawdown Health (visual fuel gauge per account)
    - Consistency Monitor (best day / total ratio vs firm threshold)
    - Payout Pipeline (4-stage kanban Setup → Building → Eligible → Received)
  - 3 components in `components/health/`
  - Sidebar link added under "Vue d'ensemble", i18n FR/EN
  - No DB schema change (uses existing balance/dd_floor/payout_target fields)
- [x] **Phase 3.5 — Rithmic Live Sync (Python service)** 🟡 EN COURS (parsing bug)
  - **New repo subfolder** : `mb-data-rithmic-sync/` (FastAPI + async_rithmic 1.5)
  - Deployed on **Railway** : https://mb-data-propfirm-production.up.railway.app
  - **Architecture** :
    ```
    Quantara (Vercel) ──HTTPS──► rithmic-sync (Railway FastAPI)
            │                          │
            └──── Supabase ────────────┘ (creds chiffrés Fernet + journal_entries)
    ```
  - **3 SQL migrations** appliquées sur Supabase :
    - `001_rithmic.sql` — table `rithmic_credentials` + RLS, accounts.rithmic_account_id, journal_entries.source/source_id
    - `002_multi_credentials.sql` — PK = uuid `id`, unique(`user_id`, `label`), allows N credential sets per user
    - `003_auto_sync.sql` — auto_sync_enabled bool, auto_sync_days_window int, last_synced_at timestamptz + partial index
  - **Multi-credentials** : user peut sauver plusieurs paires (Lucid + TPT + Topstep) chacune avec un `label` unique
  - **Auto-sync via APScheduler** dans le service Python (toutes les 15 min) — pas Vercel cron parce que **Vercel Hobby limite à 1 cron/jour** (notre `*/15 * * * *` faisait planter les deploys silencieusement)
  - **UI** : `/app/journal-sync/rithmic` avec cards par connexion (label/system/sync/edit/delete) + toggle auto-sync
  - **Nouvelles pages détail** : `/app/journal-sync/accounts` (liste groupée par PropFirm) + `/app/journal-sync/accounts/[id]` (dashboard détaillé avec equity curve Chart.js + trading calendar mensuel + stats avancées)
  - **Status actuel** : connexion Rithmic OK, JWKS auth OK, extraction des dates de trading OK (437 dates 2025 retrouvées). MAIS `show_order_history_summary` retourne `success_count=437 / fills=0` — soit Rithmic ne renvoie rien de parseable, soit notre extractor `_extract_fills_from_summary` rate la structure. Diagnostic logging en cours.
- [ ] Backlinks: directory submissions, YouTuber outreach

**Phase 3 totals:**
- SEO pages: 1 firms index + 11 firm pages + 55 firm-vs-firm + 1 guides index + 5 guides = **73 pages**
- In-app features: Health Center (Drawdown Health + Consistency Monitor + Payout Pipeline) = **3 new features**

### Phase 4 — Monetization (Weeks 9-10) — TO DO AT THE END
**User decision:** Postpone access control implementation until the rest of the site is finished.
Full architecture documented but NOT yet coded. When ready, build in this order:
- [ ] Get EIN from IRS
- [ ] Open Mercury bank account
- [ ] Add Supabase columns: profiles.plan, plan_status, plan_expires_at, stripe_customer_id, stripe_subscription_id, beta_grandfather, plan_started_at
- [ ] Create lib/planLimits.js (single source of truth for all tier limits)
- [ ] Create <RequirePlan> component for UI gating
- [ ] Server-side enforcement on firms/accounts/trades creation routes (return 402 PLAN_LIMIT_REACHED)
- [ ] Setup Stripe (account, products, webhook secret)
- [ ] Create /api/stripe/checkout, /api/stripe/webhook (with idempotency), /api/stripe/portal
- [ ] Lifetime spot counter check before checkout (max 100)
- [ ] Settings page: "Mon abonnement" section with Stripe portal link
- [ ] Grandfather all beta users (SET beta_grandfather = true WHERE created_at < launch_date)
- [ ] Launch Pro tier + Lifetime promo
- [ ] Communication email "Pro est dispo, -50% à vie pour toi"

**Pricing tiers (DONE in i18n, READY for implementation):**
- Free: 2 firms, 100 trades/mo
- Pro: €19/mo or €149/yr (-35%) — unlimited + API sync + Drawdown Guardian + PDF
- Elite: €39/mo or €299/yr (-36%) — AI Trade Coach + 3 team seats + VIP support
- Lifetime Founders: €249 one-time (100 spots only) — Pro features for life + Founding badge
- 30-day money-back guarantee on all paid plans

**Access control architecture (documented, ready to implement):**
- plan stored in profiles.plan (enum: free/pro/elite/lifetime)
- Source of truth = Stripe webhook (NOT client-side)
- All server routes check getPlanLimits(profile) before allowing actions
- AI Coach excluded from Lifetime (Claude API recurring costs) — add-on €15/mo if needed
- Beta grandfather: free users from before Pro launch keep unlimited Free features at life

### Phase 5 — Growth (Weeks 11+)
- [ ] AI Trade Coach (Claude API weekly analysis)
- [ ] Account Lifecycle Kanban
- [ ] Anonymous Leaderboard
- [ ] Social login (Google + Discord OAuth)
- [ ] Chrome Extension for Rithmic
- [ ] Target: MRR $500/mo

## Still-open audit issues

### i18n gaps (P5) — mostly RESOLVED (June 2026)
- [x] contact/page.js, not-found.js, error.js — FR/EN (server wrapper + Client child using useT)
- [x] layout.js drawers/modals/toasts/alerts + 22 motivation messages — FR/EN
- [x] Tutorial.js (steps + chrome) — FR/EN
- [x] ComparisonPage chrome — FR/EN (prop-driven marketing copy stays in the calling pages)
- [x] DemoClient sidebar/status labels + locale-aware calendar — FR/EN
- [x] DrawdownSimulator status/type labels — FR/EN (eod/intraday logic literals kept)
- [ ] auth/callback — still FR-only (deferred: auth-critical recovery/reset flow, translate with care)

### Security (P6) — RESOLVED
- [x] Middleware admin "bypass": the spoofable referer/auth-header check was already removed
  (commit f297496); the real boundary is per-route verifyAdmin() (genuine Supabase JWT
  validation + isAdmin + service-role) plus RLS — investigation confirmed LOW severity
  (at most an inert page shell, no data exfiltration). Optional future hardening: validate
  the session in middleware via `jose` — but the app uses a localStorage storage adapter, so
  a naive cookie check risks locking out admins. Not worth it currently.
- [x] role="dialog" + aria-modal + focus trapping + Escape — shipped via the reusable
  components/useDialog.js hook on the 6 layout overlays and the 4 component modals
  (ProfileModal, TradeEntryModal, CertificatesModal, OnboardingModal).

### Architecture (remaining)
- N+1 billing updates in loadFirms (Supabase RPC needed)
- Sentry integration (DSN exists, needs wiring)
- Split layout.js monolith into composable pieces
- AppContext value is now memoized + trimmed to the consumed set (commit 3db1891), so routed
  pages no longer re-render on the layout's transient modal/drawer/form/toast state

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

## Rithmic Live Sync — Technical Reference

### Repos
- `mb-data-web/` — Next.js (UI + API proxy)
- `mb-data-rithmic-sync/` — Python FastAPI service (separate Railway deploy)

### Deployment
- **Railway URL** : `https://mb-data-propfirm-production.up.railway.app`
- **Branch** : `main` (auto-deploy from GitHub on push)
- **Root directory** : `/mb-data-rithmic-sync` (set in Railway Settings → Source)
- **Health check** : `GET /health` → JSON `{status: ok, service: quantara-rithmic-sync, ...}`
- **Vercel project URL** : production = `https://quantara.tech`

### Env vars on Railway (8 total)
```
SUPABASE_URL=https://xxxxxxx.supabase.co  (auto-stripped /rest/v1 or /auth/v1 if pasted)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=...  (Legacy JWT secret from Supabase Auth Settings)
ENCRYPTION_KEY=lSkf1SV-eq3efx_53Gw_HER7GwFDt0cpb5ZZ5kA5eZ8=  (Fernet 32-byte base64)
RITHMIC_GATEWAY_URI=wss://rprotocol.rithmic.com:443  (PRODUCTION Chicago — NOT rituz00100 which is Test)
RITHMIC_SYSTEM_NAME=Rithmic Paper Trading  (default, overridden per credential set)
CORS_ORIGINS=https://quantara.tech,http://localhost:3000
DEFAULT_SYNC_DAYS=90
RITHMIC_CRON_SECRET=SdV0QfO8egkKrQwpnsu4tgKow91v38NB3p4zjB4GSGw  (also set on Vercel — currently unused since APScheduler runs in-process)
PORT=8001  (set explicitly to match Railway public domain forward)
```

### Env vars on Vercel (1 added)
```
RITHMIC_SYNC_URL=https://mb-data-propfirm-production.up.railway.app
RITHMIC_CRON_SECRET=SdV0QfO8egkKrQwpnsu4tgKow91v38NB3p4zjB4GSGw  (unused now, kept for future Vercel cron if user upgrades to Pro)
```

### async_rithmic v1.5 API surface (discovered via diagnostic logging)
- `RithmicClient` public attrs (44 total): `cancel_all_orders, cancel_order, connect, credentials, disconnect, exit_position, get_account_rms, get_front_month_contract, get_historical_tick_data, get_historical_time_bars, get_order, get_product_rms, get_reference_data, get_stop_and_target, get_system_info, list_account_summary, list_accounts, list_bracket_stops, list_brackets, list_exchanges, list_orders, list_positions, modify_order, on_bracket_update, on_connected, on_disconnected, on_exchange_order_notification, on_historical_tick, on_historical_time_bar, on_rithmic_order_notification, on_tick, on_time_bar, plants, reconnection_settings, retry_settings, search_symbols, show_order_history_dates, show_order_history_summary, ssl_context, submit_order, subscribe_to_market_data, subscribe_to_time_bar_data, unsubscribe_from_market_data, unsubscribe_from_time_bar_data`
- **`get_fill_history` and `replay_executions` DO NOT EXIST** on client (despite README claiming so)
- `client.plants` is a **dict** with keys `['ticker', 'order', 'pnl', 'history']`
- `plants['order']` is `OrderPlant` with methods : `cancel_all_orders, cancel_order, exit_position, get_account_rms, get_order, get_product_rms, get_reference_data, get_stop_and_target, get_system_info, list_accounts, list_bracket_stops, list_brackets, list_orders, modify_order, show_order_history_dates, show_order_history_summary, submit_order`
- **OrderPlant ALSO doesn't have get_fill_history in v1.5** — only `show_order_history_*`

### Fetching fills strategy (sync_service.py `_fetch_fills`)
- **Method A** (preferred but not available in v1.5) : `client.plants['order'].get_fill_history(start, end, account_id)`
- **Method B** (current) :
  1. `client.show_order_history_dates()` → returns `list[1 protobuf message]` with REPEATED `date` field (YYYYMMDD strings)
  2. Extract dates via `ListFields()` (regular getattr was buggy)
  3. For each date : `client.show_order_history_summary(date=YYYYMMDD, account_id=...)`
  4. Parse fills from summary response

### Known Rithmic system_name values (in dropdown)
- `Rithmic Test` (free demo)
- `Rithmic Paper Trading`
- `Rithmic 04 Colo` (production)
- `Rithmic 01`, `Rithmic 04`
- `TopstepTrader`
- `Apex`
- **`LucidTrading`** (single word, no space — verified via R|Trader Pro)
- `My Funded Futures`
- `Tradeify`
- `Take Profit Trader`
- `Bulenox`

### Gateway URLs
- **Production Chicago** (Lucid, Topstep, Apex, MFFU etc.) : `wss://rprotocol.rithmic.com:443`
- **Test/Demo only** : `wss://rituz00100.rithmic.com:443` (returns only "Rithmic Test" as valid system)
- Production Asia : `wss://rprotocol-asia.rithmic.com:443`
- Production EU : `wss://rprotocol-eu.rithmic.com:443`

### Critical bugs already fixed
| Issue | Fix |
|---|---|
| `httpx==0.28.1` conflict with `supabase==2.10.0` | Removed pin (let supabase resolve) |
| Railway startCommand `$PORT` literal | Removed override, Dockerfile uses `sh -c` |
| FastAPI rejects DELETE+204+body | Changed to 200 + body |
| Supabase JWT migration (HS256 → ES256/RS256 asymmetric) | Auth tries HS256 first, falls back to JWKS |
| JWKS endpoint requires `apikey` header | Use httpx with header instead of PyJWKClient |
| `SUPABASE_URL` with `/rest/v1` suffix | Defensive strip in both `auth.py` and `supabase_client.py` |
| Vercel Hobby cron limit (1/day max) | Removed Vercel cron, use APScheduler in Python service |
| Multi-credentials needs per-system creds | Added `label` PK + composite unique (`user_id`, `label`) |
| Password leaking in sync error messages | Regex redaction in `jobs.py` (`'password', 'user', 'token'` etc.) |
| Lucid `system_name` was "Lucid Trading" with space | Changed to "LucidTrading" (no space) per R|Trader Pro |

### Open bug being chased (as of last session)
- `show_order_history_summary` returns `success_count=437 / fills=0` for Lucid account
- 437 dates correctly extracted from `show_order_history_dates`
- Diagnostic logging being added to log first 5 raw responses with `ListFields()` output
- Theory : either the response is empty (Rithmic doesn't return fills via this method) OR our `_extract_fills_from_summary` doesn't match the field name (we try `fills`, `executions`, `orders`, `order_history`, `fill_history`)
- **Next step on resume** : check logs for `DIAG[0]..DIAG[4]` lines to see actual summary structure

### Files to read first on resume
1. `mb-data-rithmic-sync/app/sync_service.py` — has `_fetch_fills`, `_extract_dates`, `_extract_fills_from_summary` + diagnostic logging
2. `mb-data-rithmic-sync/app/auth.py` — JWKS + HS256 fallback
3. `mb-data-web/app/app/(main)/journal-sync/rithmic/page.js` — multi-credentials UI
4. `mb-data-web/app/app/(main)/journal-sync/accounts/[id]/page.js` — account detail dashboard

### Test account (Lucid, user's own)
- Username : `LT-63Q7ULJ4`
- System : `LucidTrading`
- Gateway : Chicago Area (= rprotocol.rithmic.com)
- 2 accounts exposed under this login
- 6 accounts mapped in Quantara (LFF050-579ZNFS2-PRO006, LFF050-791TOYD5-PRO007, LFE050-SQA26F07-TEST017, LFE050-M340O5IC-TEST019, LFF050-4T2M7E1F-PRO008, TPPRO1881087 from TPT)
- Has trading activity in **2025-03/04** on PRO006 (Rithmic returns those dates)
- No 2026 trades on these specific accounts (Rithmic returns "no data" for 2026 dates)
- ⚠️ User's password leaked once in error logs — should rotate when this is all done

## Pending / Roadmap

- **Sentry** — ✅ CODE DEPLOYED + env vars added in Vercel.
  Test deferred to pre-launch: `curl "https://quantara.tech/api/sentry-test?secret=$CRON_SECRET"`
  Should produce an issue in https://quantara-ag.sentry.io/issues/ within 30s.
  Config: DSN, ORG=quantara-ag, PROJECT=quantara-web, AUTH_TOKEN all set.
  Note: user should rotate the auth token after first verified test (was shared in chat).
- **Stripe** — waiting for LLC EIN
- **Sync Rithmic/ProjectX** — waiting for 50 users
- **Tests** — no framework yet; use Vitest when adding
- **SEO content engine** — /firms/[slug], /guides/[slug], /blog/[slug] templates not built
- **Social login** — Google OAuth + Discord OAuth via Supabase Auth providers
- **Topstep vs Apex page** — highest-value missing content (2.4k/mo keyword)
- **LAUNCH_PLAN.md** — detailed 5-phase plan with timelines and go/no-go criteria
