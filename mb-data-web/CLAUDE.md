# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Quantara (Quantara Technologies LLC, New Mexico) — PropFirm trading analytics platform. Next.js 14 (App Router) + Supabase + Vercel.
Monorepo root is `/mb-data-web/`.

## Beta launch — manual actions (owner: roxxnexus@gmail.com)

Beta type = **open public** (anyone can sign up; no access gating). Status of the
pre-launch manual items, as of 2026-07:

- **Block A — CFD balance columns** (`current_balance`, `balance_highwater`,
  `day_start_balance`, `day_start_equity` on `accounts`) — ✅ **DONE** (user ran it).
  Was a hard blocker: the CFD balance editor writes all four in one update, so a
  missing column broke CFD Health saving + both gauges.
- **Block B — email-enumeration revoke** on `resolve_username_to_email(text)` — ✅ **DONE**.
- **Block C — RLS on the 5 extra tables** (`trading_plan`, `trading_setups`,
  `trading_rule_items`, `referrals`, `propfirm_rules_overrides`) — ✅ **DONE**, verified
  `rowsecurity = true` on all five with correct pre-existing policies. User data
  isolation is enforced.
- **Block D — `feedback` table** (open-beta feedback widget, components/BetaFeedback.js) — ✅ **DONE**.
- **Secret rotation** — `ENCRYPTION_KEY` (Fernet) + `RITHMIC_CRON_SECRET` on Railway +
  Vercel — user reports all launched 2026-07 (double-check these two were regenerated,
  since they're non-SQL and were exposed in git history).

The SQL for A/B/D lives in `supabase-schema.sql` (feedback table ~line 447; balance
columns ~93-102; revoke ~326-329). Still open (non-blocking): Upstash distributed
rate-limit (M13) on `/api/px-login`; Sentry test; analytics wiring.

### Notifications — RESOLVED 2026-07 (was fully broken)
Symptom: no scheduled emails/push (monthly recap, bill reminders, onboarding,
drawdown guardian) despite the manual test email working. Root cause: Vercel's
scheduled `GET /api/cron/daily` returned **401** — on this plan Vercel did NOT
attach the `Authorization: Bearer $CRON_SECRET` header even though CRON_SECRET was
set, so the secret check failed and the dispatcher never fanned out. Fix (commit
a4613fc): the dispatcher now also accepts the non-forgeable `x-vercel-cron` header
(Vercel strips incoming `x-vercel-*`). Verified live: `/api/cron/daily` → 200.
Debug aids added: `/admin/system` → 🔔 Notifications card (env ✅/❌ for RESEND +
3 VAPID + CRON_SECRET, push-subscription counts, cron heartbeat, test email/push
buttons) backed by `/api/admin/notif-health`.

**Optional SQL — `cron_heartbeat`** (only needed for the admin "cron last run"
green indicator; the cron itself works without it):
```sql
create table if not exists cron_heartbeat (job text primary key, last_run_at timestamptz, last_result jsonb);
alter table cron_heartbeat enable row level security;  -- service-role only, no policy
```

**Admin PropFirms CMS (/admin/propfirms) — required SQL + Storage bucket:**
```sql
create table if not exists custom_propfirms (
  id uuid default gen_random_uuid() primary key,
  market text not null check (market in ('futures','cfd')),
  name text not null, slug text, logo_url text, website text, reputation text, tagline text,
  data jsonb not null default '{}', is_active boolean default true, sort_order int default 100,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (market, name)
);
alter table custom_propfirms enable row level security;
create policy "custom_propfirms public read" on custom_propfirms for select using (true);
```
Storage: Dashboard → Storage → New bucket `propfirm-logos` (Public); policies
INSERT+DELETE = authenticated, SELECT = public. Without these the admin page shows
a clear error.

PropFirms CMS is COMPLETE (2026-07): structured editor (no raw JSON) — CFD flagship
+ sub-models; futures multiple PROGRAMS (Lucid FLEX/PRO/INSTANT) each with a plans×rules
table; logo upload; "edit an existing catalog firm" (override by name). In-app merge:
CFD comparator + add-account modal (lib/managedFirms useManagedCfdFirms +
getCfdModelsFromFirm, dedup by name); futures account creation (lib/constants
CUSTOM_FIRMS overlay via firmRules() + registerCustomFuturesFirms, custom names in the
create-firm grid) AND the /app/rules futures comparator (futuresComparison firmRules()
for overrides + customFirmPrograms() derives columns for brand-new firms). All static
catalog helpers stay synchronous so SSG public pages are unaffected; the overlay is
client-only.
Also required for prod notifications (config, not code): RESEND domain
`quantara.tech` verified (DKIM/SPF) + the 3 VAPID keys + RESEND_API_KEY + CRON_SECRET
present in Vercel Production. Confirm via the /admin/system card.

## Commands

```bash
cd mb-data-web
npm install          # install dependencies
npm run dev          # dev server on localhost:3000
npm run build        # production build
npm run lint         # ESLint (next/core-web-vitals)
```

Tests: Vitest (`npm test`) — suites dans `lib/*.test.js`.

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
      groups/page.js     # Trading groups
      profile/page.js    # User profile editor
      import-lab/page.js # CSV import lab
      journal-sync/      # Hub import CSV + journal importé
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
- [x] **Phase 3.5 — Rithmic Live Sync (service Python)** ❌ **RETIRÉ 2026-08** (voir « Synchronisation broker — retirée »)
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

## Synchronisation broker — RETIRÉE (2026-08)

Trois tentatives ont existé, aucune n'a fonctionné bout en bout. Toutes ont été
supprimées à la demande de l'utilisateur, pour être reprises proprement plus tard.
Il ne reste que **l'import CSV**.

| Tentative | Ce qui bloquait |
|---|---|
| **Rithmic** — service Python FastAPI sur Railway (`mb-data-rithmic-sync/`) | `show_order_history_summary` renvoyait `success_count=437 / fills=0` ; `get_fill_history` n'existe pas dans async_rithmic 1.5 |
| **Tradovate** — OAuth dans des routes Next.js | `client_id`/`client_secret` délivrés uniquement après acceptation d'un dossier NinjaTrader Ecosystem — candidature avec revue, jamais déposée |
| **Extension navigateur** (`quantara-extension/`) — scraping du dashboard Lucid | jamais publiée |

### Supprimé
`mb-data-rithmic-sync/` · `quantara-extension/` · `app/api/{tradovate,rithmic,sync}/**` ·
`app/api/cron/rithmic-poll` · `app/app/(main)/journal-sync/{tradovate,rithmic,accounts}` ·
`app/app/(main)/sync` · `app/docs/extension` · `lib/{tradovate,tradovateClient,cryptoBox,futuresContracts}.js`
et leurs tests · les blocs `RITHMIC_*` / `TRADOVATE_*` de `.env.example` · la table
`tradovate_credentials` dans `supabase-schema.sql`.

### Conservé — et pourquoi
- `lib/importers/rithmic-pnl.js`, `rithmic-dashboard.js`, `firmDetection.js` : ce sont des
  **parseurs CSV**, pas de la synchronisation. Le nom prête à confusion, le rôle non.
- `/app/import-lab` (dépôt du CSV) et `/app/journal-sync/view` (lecture des trades importés).
- Les colonnes `rithmic_*` sur `accounts` : remplies par l'import CSV.
- Le marqueur `[rithmic:` dans `journal_entries.notes`, sur lequel s'appuient
  `hideRithmicEntries` / `onlyRithmicEntries` de `JournalPage`.

### Un effet de bord corrigé au passage
`/app/import-lab` refusait de mapper les comptes **financés** : ils étaient censés
arriver par la synchronisation. Celle-ci n'existant plus, les exclure les aurait laissés
sans aucune voie d'entrée. Ils sont désormais proposés au mapping comme les autres.

## Pending / Roadmap

- **Sentry** — ✅ CODE DEPLOYED + env vars added in Vercel.
  Test deferred to pre-launch: `curl "https://quantara.tech/api/sentry-test?secret=$CRON_SECRET"`
  Should produce an issue in https://quantara-ag.sentry.io/issues/ within 30s.
  Config: DSN, ORG=quantara-ag, PROJECT=quantara-web, AUTH_TOKEN all set.
  Note: user should rotate the auth token after first verified test (was shared in chat).
- **Stripe** — CODE SHIPPED, compte à configurer (voir « Stripe Billing » ci-dessous)
- **Sync broker** — retirée (voir « Synchronisation broker — RETIRÉE »)
- **Tests** — no framework yet; use Vitest when adding
- **SEO content engine** — /firms/[slug], /guides/[slug], /blog/[slug] templates not built
- **Social login** — Google OAuth + Discord OAuth via Supabase Auth providers
- **Topstep vs Apex page** — highest-value missing content (2.4k/mo keyword)
- **LAUNCH_PLAN.md** — detailed 5-phase plan with timelines and go/no-go criteria

## Stripe Billing / Invoicing / Tax

Code livré (2026-08). Le compte Stripe reste à configurer côté Dashboard.

### Fichiers
| Fichier | Rôle |
|---|---|
| `lib/stripe.js` | Client serveur (API `2026-07-29.dahlia`), mapping plan ↔ Price ID |
| `lib/planLimits.js` | **Source de vérité unique** des limites par palier (isomorphe client/serveur) |
| `app/api/stripe/checkout/route.js` | POST → Checkout Session `mode: 'subscription'` |
| `app/api/stripe/portal/route.js` | POST → Customer Portal (upgrade, résiliation, factures PDF) |
| `app/api/stripe/webhook/route.js` | **Seul écrivain** de `profiles.plan` — signature + idempotence |
| `app/api/stripe/subscription/route.js` | GET → plan courant + liste des factures |
| `components/BillingSection.js` | Bloc « Abonnement » dans /app/settings |

### Règles à ne pas casser
- Le plan ne vient **jamais** du client ni de la `success_url` : uniquement du webhook.
- Le webhook lit `request.text()` (corps brut) — `request.json()` invaliderait la signature.
- Ne jamais passer `payment_method_types` : Stripe choisit dynamiquement (SEPA, iDEAL, Link…).
- Un **Produit** Stripe par palier, deux **Prix** par produit (mensuel/annuel). Jamais
  plusieurs paliers sur un même produit (les lignes de facture seraient indistinguables).
- `automatic_tax` ne collecte RIEN tant qu'aucune immatriculation (registration) n'est
  active dans la juridiction du client — et ne renvoie aucune erreur. Silencieux.

### SQL — à jouer sur Supabase (fin de `supabase-schema.sql`)
Colonnes `profiles` (plan, plan_status, plan_interval, plan_started_at, plan_expires_at,
plan_cancel_at_period_end, stripe_customer_id, stripe_subscription_id, beta_grandfather,
last_invoice_status, last_invoice_at) + table `stripe_events` (idempotence webhook).
Aucune policy d'UPDATE : service role uniquement.

### Env vars (Vercel) — voir `.env.example`
`STRIPE_SECRET_KEY` (préférer une clé restreinte `rk_`), `STRIPE_WEBHOOK_SECRET`,
les 6 `STRIPE_PRICE_*`, `NEXT_PUBLIC_SITE_URL`.

### Config Dashboard restante
1. **Products/Prices** — 3 produits (Pro, Elite, Business) × 2 prix (mensuel/annuel), EUR.
   Tax code SaaS `txcd_10103001` sur chaque produit ; `tax_behavior` = `inclusive` si les
   prix affichés sur /pricing sont TTC (c'est le cas : « 19€ »).
2. **Tax → Settings** — adresse du siège (Albuquerque NM) ; le statut reste `pending`
   tant qu'elle n'est pas renseignée, et `automatic_tax` ne calcule rien.
3. **Tax → Locations** — immatriculations. LLC US vendant des services numériques à des
   consommateurs UE : le régime **OSS non-Union** (TVA due dès le 1er euro, pas de seuil)
   est le point à valider avec un fiscaliste. Plus les États US où il y a nexus.
4. **Customer portal** — Settings → Billing → activer, autoriser les changements de plan.
5. **Webhook** — endpoint `https://quantara.tech/api/stripe/webhook`, événements :
   `checkout.session.completed`, `customer.subscription.created|updated|deleted`,
   `invoice.paid`, `invoice.payment_failed`.
6. **Grandfather beta** — le jour du lancement payant, jouer l'UPDATE commenté en fin de
   `supabase-schema.sql`.

### Pas encore fait
- Gating serveur (402 `PLAN_LIMIT_REACHED`) sur les routes de création firms/accounts/trades :
  `planLimits.js` expose déjà `isAtLimit()` et `planLimitError()`, reste à les brancher.
- Le palier Lifetime (249€ one-time, 100 places) : c'est un `mode: 'payment'`, pas un
  abonnement — non implémenté.
- /pricing pointe toujours vers la waitlist (normal tant que les Price IDs n'existent pas).


## Thème clair / sombre

Ajouté 2026-08. **Le sombre reste le défaut** : sans choix explicite de
l'utilisateur, l'app est exactement telle qu'avant.

| Fichier | Rôle |
|---|---|
| `app/globals.css` | Les jetons. `:root` = sombre ; `[data-theme="light"]` = clair |
| `components/ThemeProvider.js` | Contexte + localStorage (`quantara_theme`) + `data-theme` sur `<html>` |
| `components/ThemeSwitcher.js` | `<ThemeSwitcher />` (Sombre/Clair/Système) + `<ThemeToggle />` (bouton unique) |
| `app/layout.js` | Script anti-flash `beforeInteractive` — pose `data-theme` AVANT le premier paint |
| `lib/theme.js` | `C` et les style objects pointent tous vers `var(--…)` ; `chartColors()` pour les canvas |
| `components/dashboard/theme.js` | `T.color.*` idem |

Où l'utilisateur choisit : `/app/settings` → **Apparence** (3 options), et un
bouton ☾/☀ dans la top bar de l'app.

### Les 4 règles à ne pas casser
1. **Aucune couleur en dur dans un style inline.** `color: '#f0ede8'` reste sombre
   en thème clair. Toujours passer par `C.*`, `T.color.*` ou `var(--…)`.
2. **Chart.js est une exception** : il peint dans un `<canvas>` et ne résout pas
   `var()`. Utiliser `chartColors()` (lit les jetons calculés) et mettre `theme`
   dans les dépendances du `useEffect`, sinon le graphe garde ses couleurs après
   la bascule. Concerne EquityOverlayChart, JournalPage, dashboard, analytics.
3. **Les templates e-mail (`app/api/**`) gardent des couleurs en dur** : Gmail et
   Outlook ne résolvent pas les variables CSS. Ne jamais les migrer.
4. **`<meta name="theme-color">` exige une couleur littérale** (layout.js viewport
   + ThemeProvider.applyToDocument) — c'est l'OS qui la lit, pas le moteur CSS.

### Surfaces épinglées en sombre
La landing (`app/page.js`) porte `data-theme="dark"` sur son conteneur : star
field Three.js, dégradés mesh et mockups sont dessinés pour du noir. Le sélecteur
de thème utilise un sélecteur d'ATTRIBUT (pas `:root[data-theme]`) précisément
pour permettre ce genre d'épinglage par sous-arbre.

### Reste à faire
- `components/landing/**` non migré (épinglé sombre, ~90 couleurs en dur).
- Les tuiles de heatmap et quelques dégradés d'accent gardent des valeurs en dur ;
  lisibles dans les deux thèmes, mais pas parfaitement calibrés en clair.


## Audit complet — 2026-08

Axes couverts : sécurité, accessibilité, dépendances, bundle, SEO, tests, routes.

### Corrigé pendant l'audit
1. **CRITIQUE — escalade de privilège sur `profiles`.** La policy
   `for all using (auth.uid() = user_id)` inclut UPDATE. Les colonnes de
   facturation vivant sur `profiles`, tout utilisateur connecté pouvait
   s'attribuer un plan payant depuis le navigateur avec la seule anon key.
   RLS raisonne par LIGNE, pas par COLONNE. Correctif : `revoke update (…)` colonne
   par colonne en fin de `supabase-schema.sql`. **SQL À JOUER SUR SUPABASE.**
2. **Contraste WCAG du thème clair** : 110 violations axe-core → 22 (la baseline
   du thème sombre est à 26). Causes : `--text3`, `--green`, `--amber`, `--red`
   trop clairs. Valeurs recalculées pour tenir ≥ 4.5:1 sur les 4 fonds clairs.
3. **Stripe — updates silencieux.** Un `update()` Supabase qui ne matche aucune
   ligne ne renvoie pas d'erreur. Sans contrôle, un profil manquant faisait
   recréer un Customer à chaque paiement (checkout) et perdre un abonnement payé
   (webhook). Les deux vérifient maintenant les lignes touchées.
4. **`plan_started_at` à 1970** quand `sub.start_date` est absent → laissé null.
5. **Tests** : +25 sur `planLimits` et `stripe` (313 → 338). C'est le code qui
   décide qui a payé ; il n'était pas couvert.

### Constaté, non corrigé
- **a11y — `nested-interactive`** : 11 occurrences sur `/compare`, un
  `div role="button"` contenant des liens/boutons. Pré-existant, casse la
  navigation clavier et les lecteurs d'écran.
- **a11y — 22 contrastes résiduels** : couleurs en dur hors système de jetons
  (violet `#a78bfa`, cyan `#06b6d4`, vert `#10b981`) dans des palettes locales.
- **~50 palettes locales `const C = {…}`** dupliquent le design system et
  court-circuitent les jetons. Source structurelle des deux points ci-dessus.
- **Dépendances** : 8 vulns (5 high) — postcss, next, nanoid, brace-expansion,
  fast-uri. Toutes DoS ou spécifiques au self-hosting ; le correctif impose
  next@16 (breaking). Faible urgence sur Vercel, mais à planifier.
- **Gating serveur non branché** : `planLimits.isAtLimit()` / `planLimitError()`
  existent mais aucune route de création ne les appelle. Tant que Stripe n'est
  pas en live c'est sans effet ; le jour du lancement payant, c'est bloquant.
- **Canonical manquant** sur `/auth`, `/g/[code]`, `/u/[username]*` (hors sitemap,
  impact faible).

### Sain, vérifié
- 32 routes API : les 4 sans `verifyAuth` sont protégées autrement (signature
  Stripe, rate-limit IP, données publiques). Aucun trou.
- RLS active sur les 16 tables, policies `auth.uid() = user_id`.
- Aucun secret dans le code suivi ; `.env*` bien ignoré.
- XSS : `dangerouslySetInnerHTML` uniquement sur du contenu i18n interne.
- CSP sans `unsafe-eval` en prod.
- Sitemap : 136 URLs, généré dynamiquement, aucune page orpheline.
- Bundle : 201–291 kB First Load JS. 195 pages statiques générées.
- Toutes les routes publiques testées renvoient 200.


## Suites de l'audit — 2026-08 (session autonome)

### Quotas de palier — appliqués par la BASE, pas par l'app
Toute la création (firmes, comptes, trades) part du navigateur en direct vers
Supabase : **il n'y a aucune route API à protéger**, et un contrôle en JavaScript
ne serait qu'un affichage. L'enforcement vit donc dans des triggers Postgres
(`supabase-schema.sql`, section « QUOTAS PAR PALIER ») :

- `plan_limit_for(user_id, key)` — miroir SQL de `effectivePlan()` : beta illimité,
  paliers payants illimités en `active`/`trialing`/`past_due`, tout le reste Free.
- Triggers `BEFORE INSERT` sur `firms`, `accounts`, `journal_entries`.
- Le quota trades porte sur le **mois de la date du trade**, pas la date de saisie —
  sinon un import d'historique consommerait le quota du mois courant.

⚠️ **Les chiffres du SQL dupliquent `lib/planLimits.js`** (un trigger ne peut pas
importer du JS). En cas de divergence c'est la base qui gagne, et elle échoue
FERMÉ. Un test fige les valeurs côté application pour rendre l'écart visible.
Côté client, `planLimitMessage(error, locale)` traduit le `PLAN_LIMIT_REACHED:…`
brut en phrase utile — branché dans layout (firmes + comptes), CfdAccountModal,
TradeEntryModal et JournalPage.

### Accessibilité — mesures finales (axe-core, WCAG 2 AA, 4 pages publiques)
| | avant | après |
|---|---|---|
| contrastes · thème clair | 110 | **10** |
| contrastes · thème sombre | 26 | **22** |
| `nested-interactive` | 11 | **0** |

- `/compare` : la carte de firme n'est plus un `role="button"` contenant un lien.
  Le point d'entrée clavier est un vrai `<button>` dont le nom accessible porte le
  nom de la firme (sinon vingt fois « voir les règles » indistinguables).
- `/auth` gardait un panneau **`rgba(20,23,32,0.65)` en dur** — carte sombre sur
  fond clair. Nouveaux jetons `--glass`, `--glass-2`, `--glass-solid` pour les
  panneaux en verre dépoli (translucides, donc distincts de `--surface` qui est
  opaque). 23 panneaux migrés dans 9 fichiers.
- Accents secondaires promus en jetons : `--violet`, `--cyan` (ils vivaient en dur
  dans des palettes locales et rataient le contraste sur fond clair).
- `opacity` sur du texte le fait passer sous le seuil de contraste : la mention
  LLC du footer utilise `--text3` au lieu de `opacity: 0.7`.

Les 10 restants sont des éléments **volontairement désactivés** (badges « Soon »,
bouton de démo, item de sidebar verrouillé) — WCAG 1.4.3 exempte les contrôles
inactifs.

### Webhook Stripe — cycle de vie de la réservation
`stripe_events.status` : `processing` → `done` (ou `failed`). Seul `done` fait
qu'un rejeu est classé doublon. Une réservation `processing` de plus de 5 min est
reprise (instance tuée en cours de traitement), une `failed` est reprise
immédiatement. Avant, un échec du nettoyage rendait l'événement définitivement
perdu.

### SEO
Canonique ajoutée sur `/auth` (variantes `?mode=signup`) et `/u/[username]`
(pseudo casse-insensible). `/g/[code]` et les pages follow étaient déjà en
`noindex` — le constat de l'audit était un faux positif.


## Design ABYSS — 2026-08

Refonte visuelle retenue après comparaison de trois pistes. Bleu abyssal, halo
ambiant, grandes cartes arrondies.

### Ce qui définit Abyss
1. **Le halo** (`body::before` dans globals.css) — trois dégradés radiaux fixés
   sous l'interface : bleu en haut-droite, teal en haut-gauche, violet en bas.
   C'est la signature ; sans lui il ne reste que la palette.
2. **Les surfaces sont TRANSLUCIDES** (`--surface: rgba(24,37,53,0.78)`). C'est
   ce qui laisse le halo traverser les cartes et donne la profondeur. Une carte
   opaque n'aurait que la couleur, pas la matière.
   → `--surface-solid` existe pour les rendus que le navigateur/l'OS peint hors
   page (menus `<option>`), où la transparence produit du gris sale.
3. **Rayons larges** : `--radius: 12px`, `--radius-lg: 18px`.
4. **Outfit** pour l'interface, **Roboto Mono** pour les chiffres alignés
   (`--font-ui` / `--font-mono`, chargées par next/font dans app/layout.js).

### Trois pièges que cette refonte a révélés
- **Une barre FIXE ne peut pas être translucide sans flou.** Le bandeau cookies
  laissait lire le contenu au travers. `--bar-bg` + `backdrop-filter` ; idem pour
  `.drawer` et `[role="dialog"]`, via une règle globale.
- **En Abyss sombre les accents sont CLAIRS** (`--blue: #5ab0ff`). Du `color:'#fff'`
  posé dessus devient illisible. Le bon jeton est `--text-inverse` : sombre en
  thème sombre, blanc en thème clair — exactement la bascule voulue.
- **Une ombre portée doit rester transparente.** La migration des teintes avait
  transformé `rgba(29,184,122,0.3)` en `var(--green)` plein, donnant des pâtés
  verts. Les jetons `-bg` sont les variantes translucides.

### Contraste
Palette recalculée : chaque couleur de texte tient ≥ 4.5:1 contre les trois fonds
de son thème (sombre `#0a1420`/`#14202e`/`#1c2b3b`, clair `#ffffff`/`#eef3f9`/`#e6edf5`).
Le clair d'Abyss reste **teinté bleu** — un blanc neutre perdrait l'identité à la
bascule.

### Non migré
`components/landing/**` reste épinglé en sombre sur l'ancienne palette (star field
Three.js et dégradés mesh dessinés pour du noir). À reprendre si la landing doit
suivre.


## « Vue d'ensemble » personnalisable — 2026-08

Le dashboard n'est plus une page figée : c'est une grille de widgets que
l'utilisateur compose lui-même.

| Fichier | Rôle |
|---|---|
| `lib/dashboardLayout.js` | Catalogue des widgets, disposition par défaut, normalisation, opérations pures |
| `lib/hooks/useDashboardLayout.js` | Chargement, application, persistance |
| `components/dashboard/DashboardGrid.js` | La grille + le mode édition |
| `components/dashboard/widgets.js` | Les widgets + `useOverviewData()`, le calcul partagé |
| `app/app/(main)/dashboard/page.js` | Fournit le rendu par identifiant via `render(id)` |

### Ce que l'utilisateur peut faire
Bouton **⚙ Personnaliser** → chaque widget gagne une barre d'outils : poignée de
glissé-déposé, flèches ‹ ›, largeur 1–4 colonnes, ✕ pour masquer. Les widgets
masqués attendent dans un tiroir en bas, un clic les remet. **Réinitialiser**
restaure la disposition d'origine.

### Persistance en deux temps
1. **localStorage** à chaque geste — le dashboard s'affiche déjà personnalisé
   avant que Supabase ait répondu.
2. **`profiles.dashboard_layout` (jsonb)** avec un délai de 900 ms — pour
   retrouver sa disposition sur un autre appareil. Réordonner en glissé-déposé
   produit une rafale d'états ; sans délai ce serait une requête par image.

Au chargement le **serveur gagne** : c'est la source partagée, le cache local
n'est qu'une avance d'affichage. Un drapeau `dirty` empêche une réponse serveur
tardive d'écraser un geste que l'utilisateur vient de faire.

⚠️ `dashboard_layout` reste **inscriptible par le client**, contrairement aux
colonnes de facturation : c'est une préférence d'affichage lui appartenant, pas
un droit d'accès. Elle n'est donc pas dans le `revoke update`.

### Ajouter un widget
Une entrée dans `WIDGETS` + une dans `DEFAULT_LAYOUT` + un `case` dans le
`render` de la page + deux clés i18n. `normalizeLayout()` fait le reste : il
apparaît **masqué** chez les utilisateurs qui ont déjà personnalisé leur écran,
visible chez les nouveaux. Un widget retiré du code disparaît sans laisser de
trou.

### Deux pièges tenus par les tests
- **Une disposition vide ne doit pas replier l'écran.** La condition d'ajout des
  nouveaux widgets se décide UNE FOIS avant la boucle ; testée à l'intérieur via
  `out.length`, elle n'était vraie que pour le premier — un utilisateur sans
  disposition enregistrée se serait retrouvé avec un seul widget. Attrapé par
  `dashboardLayout.test.js`.
- **`visible: undefined` vaut visible.** Seul un `false` explicite masque, sinon
  une disposition ancienne sans le champ ferait disparaître la moitié de l'écran.

### Responsive
4 colonnes → 2 sur tablette (≤1024px) → 1 sur mobile (≤768px), avec un
`grid-column: span` forcé : un widget réglé sur 3 ou 4 déborderait sinon.

Le glissé-déposé utilise l'API HTML5 native, qui **ne fonctionne pas au doigt**
sur mobile. Les flèches ‹ › font le même travail au clic et servent aussi de
chemin clavier accessible.


## Shell aligné sur la maquette Abyss — 2026-08

La palette et la grille de widgets étaient en place, mais l'ossature de l'app ne
ressemblait toujours pas à la maquette. Trois écarts corrigés :

| | Avant | Maintenant |
|---|---|---|
| Barre du haut | Marque QUANTARA + actions | **Onglets de section** + recherche ⌘K + thème + cloche |
| Marque | Barre du haut | **En tête du rail** (`.qt-brand`), comme la maquette |
| Dashboard | Gros « Bonjour X » + eyebrow | **Pas de titre** — on entre dans les cartes |

Les onglets pointent vers de vraies pages : Vue d'ensemble → `/app/dashboard`,
Performance → `/app/analytics`, Payouts → `/app/health`, Risque → `/app/alerts`.

### Recherche globale — `components/CommandPalette.js`
⌘K / Ctrl+K depuis n'importe où. Cherche dans les firmes, les comptes et les
pages ; ↑ ↓ Entrée, Échap pour fermer. Choisir une firme ouvre son tiroir, un
compte ouvre le sien, une page navigue.

Le raccourci vit DANS le composant, pas dans le layout : on le monte, le
raccourci existe. Et la liste des pages réutilise les libellés `app.sidebar.*`
plutôt que d'en dupliquer un second jeu — deux listes de traductions finiraient
par diverger.

### Commandes du dashboard
Le gros en-tête est parti, mais ses commandes restent nécessaires (devise,
recherche de firme, ajouter une PropFirm). Elles tiennent sur une ligne au-dessus
de la grille, avec le taux de change à gauche et « Personnaliser » juste en
dessous. La maquette n'a pas ces contrôles — c'est une maquette, pas une app.

### Responsive
Sous 900px la barre perd le libellé de recherche, le raccourci et l'export CSV ;
les onglets et la cloche restent. Le rail replié ne garde que le sigle de la
marque.


## Ossature reprise de la maquette — 2026-08 (correction)

J'avais mis les onglets dans une barre GLOBALE, en navigation d'application.
C'était faux. Dans la maquette :

```
.app { grid-template-columns: 262px 1fr }   ← rail pleine hauteur
aside { … }                                  ← pas de barre au-dessus
main  { .top { onglets | recherche | ☾ | 🔔 } … }   ← la barre est DANS la page
```

Il n'y a **aucune barre globale**. Le rail fait toute la hauteur et chaque page
porte sa propre barre. Les onglets sont des **sous-sections du dashboard**, pas
des routes.

### Ce qui a changé
- `(main)/layout.js` : la `.top-bar` est supprimée. Le rail passe en
  `top: 0; height: 100vh`. Seul le burger mobile survit, en flottant.
- Export CSV et Déconnexion vivaient dans cette barre → descendus au pied du
  rail (`.qt-acct`), sous l'identité à laquelle ils s'appliquent.
- `openSearch` et `alertsBadgeCount` passent par AppContext : la barre de page
  en a besoin et la barre globale n'existe plus.

### Les quatre sous-sections
`SECTIONS = ['overview', 'performance', 'payouts', 'risk']` — quatre vues du même
jeu de données, chacune avec **sa propre disposition de widgets**, personnalisable
indépendamment. Personnaliser « Payouts » ne touche pas « Vue d'ensemble ».

Chaque section connaît TOUS les widgets : ceux qui ne sont pas dans sa vue par
défaut restent disponibles dans son tiroir. On ne les interdit pas, on ne les
propose simplement pas d'emblée.

### Reprise des dispositions existantes
`profiles.dashboard_layout` stockait un simple tableau. `normalizeAll()` le
reprend comme disposition de « Vue d'ensemble » et laisse les trois autres
sections sur leur défaut — personne ne perd son écran au passage. Un test fige
ce comportement.

### Ce que la maquette ne montre pas
Elle n'a ni sélecteur de devise, ni recherche de firme, ni bouton « Ajouter une
PropFirm ». Ce sont des commandes dont une vraie app a besoin : elles occupent la
droite de la barre de page, séparées du trio applicatif (recherche, thème,
alertes) par un filet vertical.


## Barre du dashboard — dédoublonnage (2026-08)

En comparant l'app et la maquette côte à côte, la barre portait trois choses de
trop :

| | Constat | Correctif |
|---|---|---|
| **Deux recherches** | La globale ⌘K ET un filtre de firmes | Le filtre est retiré : ⌘K trouve déjà une firme et l'ouvre |
| **Le taux de change** | Une ligne de texte sous la barre | Supprimé de la barre ; il vit dans la description du réglage Devise |
| **Le sélecteur de devise** | Absent de la maquette | Descendu dans Réglages → Apparence, sa vraie place |
| **Onglet actif** | Pilule à fond plein | Gras + blanc, sans fond — comme la maquette |

La barre est maintenant **exactement** celle de la maquette :

```
Vue d'ensemble  Performance  Payouts  Risque … [⌕ Rechercher un compte… ⌘K] [☾] [▲3]
```

« Ajouter une PropFirm » reste, mais dans l'en-tête du widget PropFirms — là où
il agit, pas dans une barre qui parle de tout le dashboard.

**Règle qui en ressort** : une commande se place là où elle agit. Un filtre de
liste appartient à la liste ; un réglage d'affichage appartient aux réglages ; la
barre de page ne porte que ce qui concerne la page entière.


## Personnalisation des widgets — v2 par INSTANCES (2026-08)

Le modèle est passé de « un widget = une entrée » à « un widget = N instances ».
C'est ce changement qui débloque tout le reste : sans lui, l'identifiant du
widget servait de clé et un widget ne pouvait exister qu'une fois par section.

```
WIDGET    une entrée du catalogue : ce qu'un bloc sait faire
INSTANCE  un widget POSÉ, avec sa taille, son titre et ses options
SECTION   un onglet, avec sa propre liste d'instances
```

### Ce que l'utilisateur peut faire maintenant
| | |
|---|---|
| **Dupliquer** un widget | deux courbes d'equity sur deux périodes différentes |
| **Hauteur** 1–3 rangées | en plus de la largeur 1–4 colonnes |
| **Titre personnalisé** | 40 caractères, vide = libellé par défaut |
| **Options par instance** | période, cumul, tri, nombre de lignes |
| **Annuler / Rétablir** | 40 étapes, sur les quatre sections |
| **Presets** | Complet · Surveillance · Chiffres · Minimal |
| **Import / export** | JSON versionné, pour sauvegarder ou partager |

### Les options se déclarent, l'éditeur les rend
Une option ajoutée dans `WIDGETS[x].options` apparaît toute seule dans le
panneau de réglages — aucune UI à écrire. Types : `select` (valeurs + défaut) et
`toggle`. `normalizeOptions()` rejette toute valeur hors liste au profit du
défaut : une valeur que le widget ne sait pas interpréter contaminerait son rendu.

### Cinq décisions qui portent le système
1. **`duplicable: false`** sur insight, firms, calendar, stats. Deux « à faire
   maintenant » côte à côte diraient la même chose deux fois.
2. **Supprimer la DERNIÈRE instance la masque** au lieu de l'effacer. Sinon le
   widget disparaîtrait du tiroir et deviendrait irrécupérable.
3. **Une opération sans effet rend la MÊME référence.** Un nouveau tableau
   ferait re-rendre la grille pour rien et remplirait l'historique d'étapes
   vides. Un test le fige.
4. **Les identifiants de dégradé SVG portent la clé d'instance.** Deux copies
   d'un widget partageraient sinon le même `<linearGradient>` et l'une écraserait
   l'autre.
5. **`useOverviewData` calcule toutes les périodes d'un coup.** Un seul parcours
   firms → accounts → payouts, au lieu d'un par instance affichée.

### Reprise des dispositions existantes
`normalizeAll()` accepte trois formes : le tableau nu d'avant les sous-sections,
l'objet de sections, et l'enveloppe versionnée `{ version, sections }`. Une clé
d'instance en double est refabriquée plutôt que l'instance écartée. Un widget
retiré du code disparaît sans laisser de trou ; un widget ajouté rejoint le
tiroir sans réorganiser l'écran.

### Tests
`lib/dashboardLayout.test.js` — 398 tests au total dans le projet. Couvre la
duplication, les options, l'identité des références, les presets, l'aller-retour
d'import/export et la réparation d'une disposition abîmée.


## Audit du catalogue PropFirms — 2026-08

Vérification firme par firme des règles et des types de compte, contre les sources
officielles (help centers, pages produit) et recoupée sur des analyses tierces.
**12 firmes futures, 52 combinaisons firme × plan, 9 firmes CFD.**

### Ajouté
**FundedNext Futures** — produit distinct du FundedNext CFD déjà présent. Trois
programmes (Flex, Legacy, Rapid décliné en Pro et Daily), 25K à 150K, MLL trailing
EOD verrouillé au solde initial + 100 $. Bolt écarté : arrêté en juillet 2026.

### Corrigé
1. **`maxDrawdown()` rendait `null` pour 4 firmes sur 12** (Tradeify, Take Profit
   Trader, My Funded Futures, Phidias). Leurs clés sont nommées par PROGRAMME
   (« Drawdown Select (EOD) »), ce que les motifs n'acceptaient pas. Conséquence :
   jauge Drawdown Health vide, cron `drawdown-guardian` jamais déclenché, wizard
   sans ligne drawdown. Le sélecteur accepte désormais toute clé `Drawdown …`, en
   excluant les pertes JOURNALIÈRES, et préfère le programme dont le type
   correspond à `defaultDdType` (sinon MFFU affichait « EOD » au-dessus du chiffre
   intraday de Rapid).
2. **Alpha Futures classée `static`** par `defaultDdType` alors que ses trois
   programmes sont marqués EOD dans `futuresComparison.js`. Ajoutée à
   `EOD_TRAILING_FIRMS`.
3. Le test de `maxDrawdown` **tolérait explicitement un `null`** — c'est ce qui a
   laissé passer le trou. Il exige maintenant un montant positif pour chaque
   firme et chaque plan.

### Erreurs de données constatées, NON corrigées (décision utilisateur requise)
| Firme | Constat | Impact |
|---|---|---|
| **Apex** | Le catalogue porte 7 tailles (25/50/75/100/150/250/300K). Apex n'en vend plus que **4** : 25/50/100/150K. Et 3 des 4 drawdowns restants sont faux : 25K 1 500 $ au lieu de 1 000, 50K 2 500 au lieu de 2 000, 150K 5 000 au lieu de 4 000. Seul le 100K (3 000) est juste. | Jauge de risque fausse sur la firme la plus utilisée du marché |
| **Phidias** | Le programme **Premium** manque au comparateur (seuls Static/E2L et Fundamental/Swing sont mappés). C'est pourtant celui qui monte le split de 75 à 100% et autorise l'overnight et le week-end. | Programme invisible |
| **Bulenox** | La taille **10K** manque (6 tailles chez Bulenox, 5 stockées). | Taille non proposée |
| **Lucid** | **LucidDaily** manque (payouts quotidiens, drawdown au choix). | Programme invisible |
| **Tradeify** | **Elite** manque — c'est le seul en 80/20, les autres sont en 90/10. | Split faux si l'utilisateur est sur Elite |
| **FFN** | Drawdown 150K : 4 500 $ stocké contre 5 000 $ relevé. Une seule source tierce, à confirmer. | À vérifier |
| **`PX_FIRMS`** | Mappe encore Tradeify, TPT et MFFU sur ProjectX. ProjectX a mis fin à ses licences tierces en février 2026 et est exclusif Topstep. | Mapping mort |

⚠️ **Retirer une taille de `plans` casse les comptes existants** qui la portent
(`plan_size` est stocké en base). Pour Apex, marquer les tailles retirées plutôt
que les supprimer.

### Vérifié conforme
Topstep (tailles, objectifs, MLL, split 90/10 depuis le 12 janv. 2026, prix),
Bulenox (trailing intraday, lock à +100 $, consistance 40% au payout), Lucid
(EOD, 90/10, minimum 500 $), les noms de programmes de Tradeify, MFFU, TPT, FFN
et Alpha Futures.

**FTMO** : `profitTargets: [10, 5]` est **juste**. De nombreuses analyses tierces
affirment que la phase 1 est passée de 10 à 8% ; la page officielle
`ftmo.com/en/trading-objectives` dit toujours 10%. La source officielle prime —
utile rappel que les sites de review se recopient entre eux.

### Trous de données restants (52 combinaisons firme × plan)
- **26/52 sans profit split** — Bulenox 50K+, Lucid, TPT 50K+, MFFU, Phidias 50K+, FFN, FuturesElite 100K+
- **17/52 sans jours de trading minimum** — Topstep, Tradeify, FFN, FuturesElite 100K+, Alpha
- **5/52 sans prix** — MFFU 25/100/150K, Phidias 25K, Alpha 25K

Ce ne sont pas des données absentes du fichier : ce sont des cellules rédigées
dans un format que les parseurs ne savent pas lire (« idem », renvoi à une autre
taille, valeur en toutes lettres). La règle qui marche est celle appliquée à
FundedNext Futures : « Programme : valeur · Programme : valeur », avec un chiffre
explicite dans chaque cellule.


## Type de compte (programme) — 2026-08

Une PropFirm vend rarement UN produit. Apex vend EOD et Intraday, plus les
comptes legacy achetés avant mars 2026 ; FundedNext vend Flex, Legacy, Rapid Pro
et Rapid Daily ; Lucid vend Pro, Flex et Direct. **Même taille de compte,
drawdowns et prix différents.**

Jusqu'ici l'app servait le programme principal à tout le monde. Pour un porteur
de compte Apex legacy en 150K, la jauge affichait 4 000 $ de marge au lieu de
5 000 : une erreur de 25 % sur la seule métrique qui dit si le compte va sauter.

### Ce qui a changé
| | |
|---|---|
| **`accounts.program`** | nouvelle colonne texte, nullable. **SQL à jouer sur Supabase.** |
| **Assistant** | 2ᵉ pas « Quel type de compte as-tu pris ? », entre la firme et la taille, **affiché seulement si la firme propose plusieurs programmes** |
| **Modale d'édition** | un `<select>` à côté de la taille, avec la même condition |
| **Helpers** | `maxDrawdown`, `profitTarget`, `defaultPayoutTarget`, `defaultMinTradingDays`, `defaultMinDailyProfit`, `defaultProfitSplit` et `defaultChallengePrice` acceptent un 3ᵉ argument `program` |
| **Consommateurs** | jauge Drawdown Health, page `/app/health`, widget dashboard, cron `drawdown-guardian` |

### `lib/programSegment.js` — pourquoi un module à part
`extractModelSegment` vivait dans `futuresComparison.js`, qui importe
`constants.js`. Or `constants.js` en a désormais besoin pour lire la valeur d'un
programme dans une cellule. Le laisser là créait un **cycle d'imports**. Le
module ne dépend de rien : c'est ce qui le rend importable des deux côtés.

### Format des cellules
`'Programme : valeur · Programme : valeur'`, plusieurs programmes séparés par
`/` dans le préfixe. Deux pièges :
- **Écrire les noms EN ENTIER.** `\bRapid Pro\b` ne trouve rien dans un segment
  étiqueté juste « Rapid ».
- **Les noms doivent correspondre exactement** entre les cellules de
  `constants.js` et les `models[].name` de `FIRM_COMPARISON_MAP`. C'est le
  contrat qui fait marcher `programsForFirm()`.

### Deux garde-fous
1. **Un programme absent à cette taille rend `null`, jamais la valeur globale.**
   Servir le drawdown 4.0 à un compte legacy serait faux silencieusement.
2. **`programsForFirm(firm, plan)` filtre par TAILLE.** Apex n'a plus que du
   legacy en 75K, FundedNext n'a que Flex en 150K : proposer un programme
   inexistant enverrait l'utilisateur vers un choix dont toutes les valeurs
   dérivées seraient nulles.

### Apex corrigé
Les drawdowns 4.0 sont des milliers ronds — **1 000 / 2 000 / 3 000 / 4 000** pour
25/50/100/150K — contre l'ancienne échelle 1 500 / 2 500 / 2 750 / 3 000 / 5 000 /
6 500 / 7 500, désormais rattachée au programme `Legacy`.

⚠️ **Les 7 tailles sont CONSERVÉES.** Les 75K, 250K et 300K ne sont plus vendues,
mais des comptes existants les portent (`plan_size` est stocké en base) : les
retirer aurait cassé ces comptes. Elles n'existent simplement que sous `Legacy`.

Le comparateur passe d'un seul modèle « Apex (EOD) » à trois : EOD, Intraday,
Legacy — ce qui rend enfin visible que l'Intraday n'a PAS de perte journalière,
son vrai différenciateur.


## Programmes étendus aux 12 firmes — 2026-08

Le mécanisme construit pour Apex est désormais appliqué à **tout le catalogue** :
12 firmes, 52 combinaisons firme × taille, **129 couples (taille, programme)**.

| Firme | Programmes |
|---|---|
| Topstep | XFA Standard · XFA Consistency |
| Apex | EOD · Intraday · Legacy |
| Bulenox | Option 1 (trailing intraday) · Option 2 (EOD + DLL) |
| Lucid | LucidPro · LucidFlex · LucidDirect |
| Tradeify | Select Daily · Select Flex · Growth · Lightning Funded |
| Take Profit Trader | PRO · PRO+ |
| My Funded Futures | Rapid · Pro · Flex · Builder |
| Phidias | E2L · Fundamental · Premium |
| Funded Futures Network | Standard · Express |
| FuturesElite | Starter · Pro · Instant Funded |
| Alpha Futures | Premium · Zero · Advanced |
| FundedNext Futures | Flex · Legacy · Rapid Pro · Rapid Daily |

### Programmes ajoutés
**Phidias Premium** (overnight et week-end autorisés, split 75 → 100 %),
**Topstep XFA Consistency** (3 jours au lieu de 5, plafond de retrait plus haut,
consistance 40 % — choix IRRÉVERSIBLE), **TPT PRO+** (drawdown EOD au lieu
d'intraday, 90/10, exécution LIVE).

### Renommages — Phidias 2.0
`Static / E2L` → **E2L** (couvre maintenant les 4 tailles, pas seulement 25K) et
`Fundamental / Swing` → **Fundamental** + **Premium**, deux programmes distincts.

### Données corrigées (vérifiées août 2026)
| Firme | Correction |
|---|---|
| **FFN** | objectif 25K : $1,500 → **$2,000** (seule taille non proportionnelle) · drawdown 150K : $4,500 → **$5,000** |
| **Lucid** | objectif 25K : $1,500 → **$1,250** · drawdowns LucidDirect distincts (100K $3,500, 150K $5,000) |
| **Phidias** | drawdowns E2L réels aux 4 tailles ($500/$650/$800/$1,000 statiques) · objectifs par programme |
| **Tradeify** | drawdown Lightning 100K $3,000 → **$4,000** · prix des trois programmes réalignés |
| **MFFU** | drawdown Rapid 100K $4,000 → **$3,000**, 150K $6,000 → **$4,500** |
| **FuturesElite** | cellule drawdown réécrite en style « Étiquette : valeur » |

### Quatre bugs de résolution trouvés en chemin
1. **`resolveCell` ne transmettait pas le modèle aux helpers.** Les trois
   programmes de Lucid affichaient donc le même drawdown : le comparateur montrait
   trois colonnes qui se distinguaient partout SAUF sur le chiffre qui compte.
2. **`programsForFirm` s'appuyait sur `maxDrawdown`**, qui balaie toutes les clés
   « Drawdown … » et retombe sur celle d'un autre programme. Phidias Fundamental
   paraissait exister en 25K en héritant du chiffre d'E2L. La disponibilité se
   décide maintenant sur les **descripteurs du comparateur**, qui pointent une clé
   précise par programme.
3. **La disponibilité se juge sur le DRAWDOWN, jamais sur l'objectif.** Beaucoup
   de firmes partagent le même objectif entre programmes : il résout partout et ne
   prouve rien. On regarde aussi la phase FINANCÉE, sans quoi les offres à
   financement direct (Tradeify Lightning, LucidDirect) — qui n'ont pas
   d'évaluation — disparaissaient du sélecteur.
4. **`firstInt` lisait le « 2 » de « E2L »** comme un montant : l'objectif Phidias
   valait 2 $. Un montant préfixé par `$` l'emporte désormais, et en repli tout
   nombre accolé à une lettre est refusé.

### Le repli quand la firme ne différencie pas
`hasExplicitProgramSegments()` sépare deux cas que rien ne distinguait :

```
'Legacy : $2,750'             → composite : un programme absent est ABSENT   → null
'$2,000 — EOD seulement (…)'  → globale   : la valeur vaut pour tous          → repli
```

Sans ça, la parenthèse de Topstep passait pour un ciblage de programme et la
firme entière rendait null. Seul le style `Étiquette : valeur` compte comme
ciblage explicite — une parenthèse est trop ambiguë pour porter cette décision.

### Vérification
**Aucun trou** : chaque couple (firme, taille, programme) résout un drawdown.
439 tests, dont un qui parcourt tout le catalogue et échoue si une firme perd un
programme ou si un programme non vendu réapparaît.

### Reste ouvert
- **Bulenox** : sources divergentes sur l'existence d'une taille 10K, et les
  parcours Qualification / Momentum / Fast Track ne sont pas modélisés (seul l'axe
  de risque Option 1 / Option 2 l'est).
- **FFN Steady** : troisième programme lancé en juillet 2026, pas encore ajouté.
- **Tradeify Select 300K V2** : taille non modélisée.
- **MFFU Rapid** : classé intraday ici, EOD chez certaines sources — à trancher.
- **26/52 couples sans profit split**, **17/52 sans jours minimum** — cellules
  au format non lisible par les parseurs.

### Ordre des étapes : le programme AVANT la taille
`BASE_STEPS = ['firm', 'program', 'plan', 'details']`

Le programme **détermine** les tailles disponibles : Apex Legacy se vend en 75K,
250K et 300K, ses variantes 4.0 non. Dans l'ordre inverse, la liste des tailles
mélangeait deux générations d'offres — le 75K à 247 $ (tarif legacy) voisinait
avec le 25K à 390 $ (tarif 4.0) dans la même colonne.

`plansForProgram(firm, program)` restreint la liste, et `planChoices(firm,
program)` calcule les montants DE CE PROGRAMME. Un programme inconnu ne vide
jamais la liste : mieux vaut tout proposer que bloquer la création de compte.

### La carte « programme » montre une FOURCHETTE
À cette étape aucune taille n'est choisie. Afficher le prix du plus petit compte
donnerait un chiffre exact mais trompeur — on le lirait comme « le prix du
programme ». `programSummaries()` rend donc l'étendue des tailles et les bornes
du drawdown et du prix :

```
EOD        25K–150K · DD 1 000–4 000 $ · 390–1 490 $ · 100 %
Intraday   25K–150K · DD 1 000–4 000 $ · 167–599 $ · 100 %
Legacy     25K–300K · DD 1 500–7 500 $ · 177–647 $ · 100 %
```

On y lit d'un coup ce qui sépare vraiment les trois : Legacy est le seul à monter
à 300K, Intraday est le moins cher.


## Les 48 trous de données comblés — 2026-08

Sur les 52 couples (firme, taille), **26 n'avaient pas de profit split, 17 pas de
jours minimum, 5 pas de prix**. La donnée était pourtant dans le fichier : ce sont
les parseurs qui ne savaient pas la lire. Quatre causes, toutes génériques.

### 1. La sentinelle « idem » n'était pas résolue
`futuresComparison.js` la résolvait déjà (« même règle que la taille inférieure »),
les helpers de `constants.js` non. Bulenox écrit son split une fois en 25K puis
« idem » quatre fois. `readRule()` résout maintenant la sentinelle partout.

**Pourquoi ça comptait** : un split absent faisait retomber le calcul de payout sur
90 % par défaut. Sur un compte Take Profit Trader à 80 %, le net affiché était donc
**10 points trop haut, sur un vrai montant d'argent**.

### 2. Une seule notation de split était lue
Les données emploient deux formes, et le motif ne connaissait que la première :

```
« 80 % »   → 80
« 90/10 »  → 90    (part du trader en premier, convention du secteur)
```

### 3. Les clés anglaises étaient ignorées
`/jours.*trading.*min/` ne trouve pas `Min trading days (XFA Standard)`. Le motif
accepte désormais les deux langues et les suffixes de programme.

### 4. Le sélecteur s'arrêtait à la PREMIÈRE clé
Beaucoup de firmes ont une clé de prix par programme, dont la plupart valent `n/a`
à une taille donnée. S'arrêter à la première laissait MFFU sans prix en 25K, 100K
et 150K, Phidias en 25K, Alpha en 25K. On essaie maintenant toutes les clés.

### Deux bugs d'extraction trouvés en vérifiant
- **`firstInt` privilégie les montants en `$`** — utile pour un drawdown, faux pour
  un nombre de jours : « 5 winning days ≥ $150 net profit » rendait **150 jours**.
  Le lecteur de jours retire les sommes avant de chercher le nombre.
- **`\b` n'est une frontière qu'entre deux caractères de mot.** Après le « + » de
  `PRO+` il n'y en a pas, donc `/\bPRO\+\b/` ne trouvait jamais « PRO+ : 90/10 ».
  Un porteur de compte PRO+ héritait du split de PRO. Les bornes du motif sont
  maintenant construites selon le premier et le dernier caractère du libellé.

### Donnée corrigée
**Take Profit Trader** n'étiquetait ses splits qu'en 25K ; les autres tailles
disaient « 80/20 → 90/10 » sans dire lequel s'applique à quoi. Étiqueté partout :
`PRO : 80/20 · PRO+ : 90/10`.

### Le programme suit jusqu'au calcul de payout
`suggestProfitSplit` reçoit désormais `account.program` dans les quatre endroits
qui calculent un net : le tiroir de compte, `QuickPayoutDialog`, la promotion en
financé et le récapitulatif de payout.

### Vérification
**0 trou sur 52** pour les trois valeurs, et un test de cohérence rejette les
absurdités (jours > 60, split hors 50–100, prix > 5 000 $). 456 tests.
`lib/programSegment.test.js` couvre désormais le parseur lui-même — c'est lui qui
décide quels chiffres l'app attribue au compte de quelqu'un.


## Vérification sur les sites OFFICIELS — 2026-08

Contrôle du catalogue non plus contre des analyses tierces, mais contre les pages
des firmes elles-mêmes.

### Accessibilité des sources
| Atteint | Bloqué (Cloudflare 403 ou rendu JS) |
|---|---|
| bulenox.com · phidiaspropfirm.com · alpha-futures.com · tradeify.co · futureselite.com · fundednext.com/futures · **apextraderfunding.com (via captures fournies par l'utilisateur)** | lucidtrading.com · help.tradeify.co · myfundedfutures.com · fundedfuturesnetwork.com · topstep.com · takeprofittrader.com |

**Sept firmes sur douze ont pu être confrontées à leur propre site.** Les cinq
autres restent adossées à des sources tierces recoupées — c'est une limite réelle
de cette vérification, pas un oubli.

### Divergence majeure : Alpha Futures a renommé toute sa gamme
Le catalogue portait **Premium / Zero / Advanced**. La page publie
**Zero / Standard / Direct**, avec des prix différents de ceux stockés.

| Programme | Tailles | Évaluation | Consistance | Prix |
|---|---|---|---|---|
| **Zero** | 25–100K | 1 jour, DLL active | aucune → 40 % qualifié | 89 / 139 / 279 $ par mois |
| **Standard** | 50–150K | 2 jours, pas de DLL | 50 % → 40 % qualifié | 129 / 239 / 349 $ par mois |
| **Direct** | 25–150K | aucune — financé direct | 20 % | 349 / 519 / 689 / 859 $ one-time |

Les prix Zero stockés étaient sous-évalués (79 $ au lieu de 89 en 25K, 119 au lieu
de 139 en 50K). Entrée et carte du comparateur entièrement réécrites.

### Autres corrections issues des pages officielles
| Firme | Correction |
|---|---|
| **Bulenox** | 25K à **145 $** (stocké 175). Paiements **one-time**, pas mensuels. La page ne liste plus que 4 tailles — le **250K n'y figure plus**, conservé car des comptes existants le portent |
| **FundedNext** | Flex est à **95 % de reward share**, pas 80 %. Le bloc de règles officiel affiche « Reward Share 95% » ; le 80 % venait d'une analyse tierce |

### Confirmé exact par la source officielle
- **Phidias** — E2L en 25/50/100/150K, drawdown statique, 25K à 500 $ de drawdown
  pour 1 500 $ d'objectif et 0 jour minimum, Premium progressif 75 → 100 % sur
  5 payouts. Les corrections faites plus tôt tiennent.
- **FundedNext** — trois programmes Flex / Legacy / Rapid, et les prix promo
  (69,99 / 129,99 / 249,99 $ avec code) correspondent exactement au stocké.
- **Bulenox** — objectifs 1 500 / 3 000 / 6 000 / 9 000 et drawdowns
  1 500 / 2 500 / 3 000 / 4 500 : identiques au catalogue.

### Divergences repérées, PAS encore corrigées
- **FuturesElite** publie **Elite · Prime · Instant · Evaluation**, là où le
  catalogue porte Starter / Pro / Instant Funded. Le site ne donne pas de tableau
  par taille : renommer sans les chiffres remplacerait une donnée douteuse par une
  autre.
- **Tradeify** confirme un **Select 300K v2** (« Tradeify Forge ») absent du
  catalogue, et mentionne un palier **Tradeify Elite** vers du capital réel. La
  page de tarifs contient encore du texte de remplissage (`Lorem ipsum`, `$X`) :
  ses chiffres ne sont pas exploitables en l'état.

### Apex confirmé à la source (captures de leur help center)
Le site bloque toute récupération automatique — Cloudflare répond 403 à tout, y
compris à un navigateur headless. Les captures de
`apextraderfunding.com/help-center/`, article **« EOD Evaluations »**, tranchent :

| | 25K | 50K | 100K | 150K |
|---|---|---|---|---|
| Objectif de profit | 1 500 $ | 3 000 $ | 6 000 $ | 9 000 $ |
| **Max Drawdown (EOD)** | **1 000 $** | **2 000 $** | **3 000 $** | **4 000 $** |
| Daily Loss Limit | 500 $ | 1 000 $ | 1 500 $ | 2 000 $ |
| Contrats max | 4 | 6 | 8 | 12 |
| Durée d'accès | 30 jours | 30 jours | 30 jours | 30 jours |
| Consistance | Not Applied | Not Applied | Not Applied | Not Applied |
| Scaling | Not Applied | Not Applied | Not Applied | Not Applied |

**Les sept lignes correspondent au catalogue.** Les drawdowns 4.0 déduits de trois
analyses tierces sont donc justes, et l'ancienne échelle (1 500 / 2 500 / 3 000 /
5 000) était bien celle des comptes legacy.

Trois précisions que seule leur page donne, désormais dans les règles :
- Le seuil EOD est recalculé **à 16h59m59 ET** sur le solde de clôture, puis
  **appliqué en temps réel** la session suivante. La journée de trading se remet à
  zéro à **18h00 ET**.
- La **DLL est une pause**, pas un échec : elle stoppe la session, le compte reste
  actif, et elle est **indépendante du seuil EOD**. Beaucoup de comparatifs
  confondent les deux.
- **7 jours calendaires** pour activer le Performance Account après la réussite ;
  la limite de 30 jours ne s'applique qu'à l'évaluation, jamais au PA.

### Apex — deuxième passe sur captures (PA, payouts, trailing)
Trois articles de plus : « EOD Performance Accounts », « EOD Payouts » et la
section « When EOD Drawdown Stops Trailing ». Quatre écarts corrigés.

| | Stocké | Officiel |
|---|---|---|
| **Profit min / jour** (25/50/100/150K) | 125 / 200 / 250 / 375 $ | **100 / 250 / 300 / 350 $** |
| **Contrats PA à pleine taille, 150K** | 9 | **10** |
| **Safety Net** | confondu avec le solde minimum de demande | deux colonnes distinctes |
| **Clé du profit min** | `Qualifying days/payout` — illisible par le parseur | renommée `Profit min jour valide` |

**Le profit minimum quotidien décide si une journée COMPTE** dans les cinq jours
qualifiants d'un payout. Les quatre valeurs étaient fausses, et la clé portait un
nom qu'aucun motif ne trouvait — `defaultMinDailyProfit('Apex', …)` rendait `null`
alors que la donnée existait. Renommée, elle est lue partout (le comparateur avait
trois références, toutes rebranchées).

**Safety Net contre solde minimum.** Le tableau officiel a deux colonnes que la
cellule fusionnait : le Safety Net (26 100 / 52 100 / 103 100 / 154 100 $) débloque
la taille de position pleine ; le solde minimum pour DEMANDER un payout est 500 $
plus haut (26 600 / 52 600 / 103 600 / 154 600 $). Nouvelle clé
`Solde min pour payout`.

#### Le piège Tradovate
L'arrêt du trailing dépend de la **plateforme**, ce qu'aucune source tierce ne
disait :

```
Performance Account            bloque au solde initial + 100 $
Éval Rithmic / WealthCharts    bloque quand le seuil atteint le solde objectif
Éval TRADOVATE                 ne bloque JAMAIS — suit le plus haut indéfiniment
```

Deux traders avec le même compte 50K n'ont donc pas la même marge selon la
plateforme choisie. Consigné dans la clé `Arrêt du trailing`.

### Apex — troisième passe : l'échelle des payouts
Le tableau officiel « EOD Performance Account Max Payouts » corrige **8 des
24 cases** stockées. L'échelle n'est pas régulière — elle STAGNE sur certains
paliers, ce que l'interpolation implicite du catalogue avait lissé :

| Payout | 25K | 50K | 100K | 150K |
|---|---|---|---|---|
| 1 | 1 000 | 1 500 | 2 000 | 2 500 |
| 2 | 1 000 | **1 500** | 2 500 | 3 000 |
| 3 | 1 000 | 2 000 | **2 500** | **3 000** |
| 4 | 1 000 | 2 500 | 3 000 | **3 000** |
| 5 | 1 000 | **2 500** | **4 000** | 4 000 |
| 6 | 1 000 | 3 000 | **4 000** | 5 000 |

#### Une incertitude tranchée
Le catalogue portait depuis longtemps : *« sources contradictoires sur le lifetime
cap : damnpropfirms dit uncapped, d'autres disent que le PA ferme — à vérifier au
checkout »*. La page officielle règle la question : **après le 6ᵉ payout le PA est
FERMÉ**, et il faut repasser une évaluation pour en obtenir un autre.

#### Deux pièges de plus
- **Le Safety Net ne disparaît jamais.** Il vaut la limite de drawdown + 100 $ et
  reste en place *toute la vie* du PA — beaucoup croient qu'il saute au premier
  payout. Seul le profit AU-DESSUS est retirable.
- **Le solde est réévalué au traitement, pas à la demande.** On peut continuer à
  trader après avoir demandé un payout, mais il faut se comporter comme si la
  somme était déjà retirée : passer sous le seuil entre-temps fait refuser la
  demande automatiquement.

### Apex — quatrième passe : le PDF complet du help center
17 pages couvrant les **trois programmes** (EOD, Intraday, Legacy). Le PDF est
composé de captures : `pypdf` n'en tire que les titres, il a fallu le lire
visuellement page par page.

#### Le profit minimum quotidien DIFFÈRE entre EOD et Intraday
| Taille | EOD | Intraday |
|---|---|---|
| 25K | 100 $ | 100 $ |
| 50K | **250 $** | **200 $** |
| 100K | **300 $** | **250 $** |
| 150K | **350 $** | **300 $** |

Le catalogue servait les valeurs EOD à tout le monde. Sur un compte Intraday 150K,
une journée à 320 $ compte en réalité — elle était comptée comme non qualifiante.

#### L'échelle des payouts diffère aussi
L'Intraday paie plus vite sur les premiers paliers (50K : 1500·2000·2500·2500·3000·3000
contre 1500·1500·2000·2500·2500·3000 en EOD).

#### Legacy — quatre corrections
| | Stocké | Officiel |
|---|---|---|
| **Contrats minis** (25/50/75/100/150/250/300K) | 4/6/8/8/12/16/20 | **4/10/12/14/17/27/35** |
| **Perte journalière** | estimations « ~1 250 $ » inventées | **AUCUNE** — « no daily maximum drawdown limit » |
| **Jours de trading min** | 0 | **7**, non consécutifs |
| **Frais d'activation PA** | 99 $ / 79 $ | **125 / 140 / 175 / 200 / 250 / 300 $** à vie selon la taille |

Depuis le 1ᵉʳ mars 2026, un compte Legacy acheté n'est éligible **qu'au forfait à
vie** — l'activation mensuelle n'existe plus pour eux.

L'échelle des drawdowns Legacy (1 500 / 2 500 / 2 750 / 3 000 / 5 000 / 6 500 /
7 500) est en revanche **confirmée exacte** par le tableau officiel.

#### Deux règles absentes du catalogue
- **Legacy STATIC** — une sous-famille où le drawdown ne bouge jamais. Le 100K
  Static a un plancher FIXE à 99 375 $, soit 625 $ de marge, pour deux minis.
- **Règle d'inactivité (PA)** — sans **deux journées à +50 $ net sur 30 jours
  calendaires glissants**, le compte financé est fermé.

#### Confirmé au passage
L'évaluation Intraday n'a **aucune** perte journalière, mais le compte financé en a
une, par palier. Et le Peak Balance qui pilote le trailing intraday inclut le
**profit non réalisé** : une position ouverte en gain fait monter le seuil
immédiatement.
