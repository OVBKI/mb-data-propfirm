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
ENCRYPTION_KEY=<Fernet 32-byte base64 — voir Railway ; ⚠️ ROTATION REQUISE : l'ancienne clé a été committée dans git>
RITHMIC_GATEWAY_URI=wss://rprotocol.rithmic.com:443  (PRODUCTION Chicago — NOT rituz00100 which is Test)
RITHMIC_SYSTEM_NAME=Rithmic Paper Trading  (default, overridden per credential set)
CORS_ORIGINS=https://quantara.tech,http://localhost:3000
DEFAULT_SYNC_DAYS=90
RITHMIC_CRON_SECRET=<voir Railway ; ⚠️ ROTATION REQUISE : l'ancien secret a été committé dans git> (also set on Vercel — currently unused since APScheduler runs in-process)
PORT=8001  (set explicitly to match Railway public domain forward)
```

### Env vars on Vercel (1 added)
```
RITHMIC_SYNC_URL=https://mb-data-propfirm-production.up.railway.app
RITHMIC_CRON_SECRET=<voir Vercel ; ⚠️ ROTATION REQUISE> (unused now, kept for future Vercel cron if user upgrades to Pro)
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
- **Stripe** — CODE SHIPPED, compte à configurer (voir « Stripe Billing » ci-dessous)
- **Sync Rithmic/ProjectX** — waiting for 50 users
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
