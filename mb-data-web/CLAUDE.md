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

## Still-open audit issues (not yet fixed)

### i18n gaps (P5)
- contact/page.js — hardcoded FR
- not-found.js, error.js, auth/callback — hardcoded FR
- layout.js drawers/modals — 50+ hardcoded FR strings
- Tutorial.js — 8 steps hardcoded FR
- ComparisonPage + vs pages — hardcoded EN
- DemoClient sidebar/status labels — partially hardcoded EN
- DrawdownSimulator status/type labels — hardcoded EN

### Security (P6)
- Middleware admin check is bypassable (only checks referer/auth header existence)
- Add role="dialog" + focus trapping + Escape key to modals/drawers

### Architecture (remaining)
- N+1 billing updates in loadFirms (Supabase RPC needed)
- Sentry integration (DSN exists, needs wiring)
- Split layout.js monolith (810 lines) into composable pieces

## Session History (June 6, 2026)

### Calendar — Finnhub → ForexFactory + FMP layered (commits 384b344, ed52980 on main)
User reported Finnhub data was incomplete and the design was generic. Two-step fix shipped to main.

**Step 1 — Data source swap:**
- `app/api/calendar/route.js` switched primary source to ForexFactory community mirror
  (`https://nfs.faireconomy.media/ff_calendar_{this,next}week.json`), free, no API key.
- Dropped `FINNHUB_API_KEY` requirement (user can delete the env var from Vercel).
- Cache 5 min in-memory + 30 req/min/IP rate limit preserved.
- Output shape kept identical so CalendarPage didn't need refactoring.

**Step 2 — CalendarPage redesign ("Financial Terminal Editorial"):**
- Hero: monospace eyebrow with animated dot + `ui-serif` italic title +
  3-KPI strip (Today count, High-impact count, Live clock pulse).
- Week navigator: horizontal scrollable day chips with per-day event-density
  dot rows (red/amber/grey) + click-to-scroll.
- Filters: inline major-currency flag chips in toolbar + modal for full list.
- Day cards: italic serif day name, monospace date, impact summary chips.
- Event rows: 5-col CSS grid (4px accent | time | flag+ccy | title | data),
  NOT a `<table>`. Impact-colored left accent bar (red glow on High).
- Per-event data: 3 tabular columns (Actual / Forecast / Previous) + a
  diff chip (Beat ↑ / Miss ↓ / Inline =) colored green/red/amber.
- Subtle dot-grid background masked to top 60%.
- All numbers in `tabular-nums` + JetBrains Mono fallback.

**Step 3 — Missing actuals fix (user flagged ⏳ everywhere on past events):**
- Root cause: FF community mirror NEVER publishes the `actual` field —
  it only generates schedule + forecast + previous before events release.
- Solution: layered sources in `app/api/calendar/route.js`
  - Primary: Financial Modeling Prep (`/api/v3/economic_calendar`) when
    `FMP_API_KEY` env var is set. FMP returns all 4 fields incl. actual.
    Free tier 250 calls/day (more than enough with 5-min cache).
  - Fallback: ForexFactory (no actuals but full calendar still works).
  - Returns `{source, hasActuals}` in payload so UI can adapt.
- UI fix: removed misleading ⏳, now shows `—` honestly when no actual.
  Footer adapts per source, shows discreet FR/EN/ES note when source=FF
  explaining FMP_API_KEY enables live actuals.
- **TODO user**: signup at financialmodelingprep.com (free), add
  `FMP_API_KEY` to Vercel env vars for live actuals.

### TradesPage — Notion-style compact + table views (commit 238ef71 on main)
User said original compact/table views felt like Excel. Rewrote both in
"Notion" aesthetic. Card view kept unchanged.

- **Compact view → List aérée**: 62px rows, 4px side-color accent bar
  (green long / red short), 2-line layout (symbol monospace + firm dot +
  account + tag pills | date + side badge + qty + entry→exit), big PnL
  block right with R multiple subline.
- **Table view → Table Pro**: sticky header with column-type glyphs
  (📅 # ▾ → ◈ $ ⊕) + backdrop blur. Side as LONG/SHORT pill with arrow.
  Tags as colored pills via `getTagMeta()` taxonomy. Inline mini PnL bar
  (56px, centered on zero, width = |pnl|/maxAbsPnl across visible).
  Hover row reveals 2px blue left accent that scales-in (Notion signature).
- Shared helpers: `fmtShortDate(iso)`, `TagPills({tags, max})`, `SideBadge({side})`.

### Magic MCP — configured but blocked by sandbox network policy
- `.mcp.json` at repo root declares Magic server with `${MAGIC_API_KEY}` interpolation.
- User rotated key to: `38b82b557e18b175a4b0029b882a2635ff3398b61b8ff14495ab64bd41a7eed9`
  (user explicitly accepted leak risk on prior key, this is the replacement).
- Magic installed in user-level config via `claude mcp add magic --scope user`,
  but `/root/.claude.json` is **ephemeral** in Claude Code Web — wiped on
  container reclaim. The `.mcp.json` is the durable path.
- **Magic API calls FAIL from sandbox**: 21st.dev returns
  "Host not in allowlist" — the network policy "De confiance" doesn't
  whitelist `api.21st.dev` / `magic.21st.dev`. Need user to either
  upgrade their environment to fully-open mode OR run Claude Code locally.

### Claude Code Web — environment settings location (for future Claude sessions)
User accesses Claude Code via **claude.ai/code** (web version), NOT desktop.
Settings location (found through user screenshots):
- **Left sidebar → "Customize"** button → opens modal "Mettre à jour l'environnement cloud"
- Modal has 4 fields:
  1. **Nom** — environment name (default: "Default")
  2. **Accès réseau** — dropdown (current: "De confiance"). Links to "politique réseau" + "niveaux d'accès" docs.
  3. **Variables d'environnement** — `.env` format. THIS is where `MAGIC_API_KEY` and other env vars must be added for persistence.
  4. **Script de configuration** — bash script that runs at session start.
- Footer: Archiver / Annuler / Enregistrer les modifications.
- ⚠️ Changes apply to **NEW sessions only**, not the current one.
- User instructed (June 6) to add `MAGIC_API_KEY=38b82b...` to this Variables d'environnement field for Magic persistence.

### 3 Landing previews pending user review (NOT merged to main yet)
After user nuked the 7 previous landing variants ("efface moi toutes ces preview c'est de la merde"), they asked for 3 new ones with constraint: **sober + fluid + beautiful animations**, carte blanche on rest. Built in parallel via worktree-isolated subagents. All compile clean, all on preview branches awaiting Vercel deploy + user verdict.

- **`landing-v2-editorial`** (V1 Editorial Whisper) — cream `#faf8f4`, near-black `#0e0e0e`, accent bordeaux `#6b2737`, Instrument Serif italic massive headlines, Inter body, magazine asymmetric layout, word-by-word reveal on scroll, hairline rules drawing in left-to-right. Sections: Nav / Hero / Manifesto / 3 Principles (Clarté / Discipline / Souveraineté) / Pull Quote / Final CTA / Footer. Helpers in `components/landing/v2editorial/`.
- **`landing-v2-mist`** (V2 Mist & Mesh) — pastel mesh gradient (dusty rose + lavender + sky + cream) animated on 80s loop, base `#fbf7f2`, text deep slate `#2d2a3e`, accent peach `#e8b394`. Cabinet Grotesk + Inter. Frosted glass cards floating with lift-on-hover (framer-motion). Sections: Floating frosted nav / Hero / 3 Stats / 6 Features / Mac-style browser product preview / 3-tier Pricing / FAQ accordion / Final CTA / 4-col Footer. Helpers in `components/landing/v2mist/`.
- **`landing-v2-atmospheric`** (V3 Atmospheric Dark) — navy `#0a0e1a`, warm white `#f4f0e8`, accent coral `#ff7a59`, Fraunces italic for ALL headlines, Inter body, JetBrains Mono for numbers. Coral scroll progress bar at top, vertical coral lines drawing down on section reveal, counter-up animation on stats, dot-grid bg fading under hero. Sections: Slim Nav / Left-aligned Hero / 4 KPIs with count-up / 3 Pillars (vertical stacked rows) / 6 Features grid / 3-step vertical timeline / Italic pull quote / Final CTA / Footer. Helpers in `components/landing/v2atmo/`.

When user picks one: cherry-pick its commit to main, then delete the 3 preview branches (proxy still blocks `git push --delete`, user must do it via github.com/ovbki/mb-data-propfirm/branches manually).

### Remote branch deletion limitation (persists from prior sessions)
The Claude Code Web git proxy at `http://127.0.0.1:*/git/OVBKI/mb-data-propfirm` **blocks** `git push origin --delete <branch>` and `git push origin :refs/heads/<branch>` with HTTP 403. GitHub MCP also has no `delete_branch` tool. User MUST delete remote branches via GitHub UI manually (`/branches` page → trash icon). Local branches + worktrees can be cleaned via `git branch -D` and `git worktree remove --force`.

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
