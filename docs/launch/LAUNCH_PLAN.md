# PLAN DE LANCEMENT QUANTARA — ROADMAP DÉTAILLÉE

_Créé le 27 mai 2026 — basé sur l'audit 6-agents + LAUNCH_CHECKLIST + SEO plan 12 mois_
_Objectif : lancement officiel avec utilisateurs payants d'ici Q3 2026_

---

## VUE D'ENSEMBLE

```
PHASE 0 ─── PHASE 1 ─── PHASE 2 ─── PHASE 3 ─── PHASE 4 ─── PHASE 5
Bugfix &     Beta        Launch       SEO &       Monéti-     Growth
Stabilité    Privée      Public       Contenu     sation      Engine
(1 sem)      (2 sem)     (1 sem)      (4 sem)     (2 sem)     (continu)
```

**Timeline totale : ~10-12 semaines jusqu'au lancement Pro (mi-août 2026)**

---

## PHASE 0 — BUGFIX & STABILISATION (Semaine 1 : 27 mai → 2 juin)

### Objectif : zéro bug critique, monitoring en place, conversion fonctionnelle

### 0.1 — Bugs critiques (Jour 1-2)

| Tâche | Fichier | Détail |
|-------|---------|--------|
| Créer route `/auth/page.js` | `app/auth/page.js` | Server component + AuthClient qui lit `searchParams.mode` |
| AuthPage lit `?mode=signup` | `components/AuthPage.js:18` | Initialiser `mode` depuis props au lieu de `'login'` hardcodé |
| Changer TOUS les CTAs `/app` → `/auth?mode=signup` | Hero, Demo, Compare x2, Tools, Final CTA | ~8 endroits dans LandingPage, DemoClient, ComparisonClient x2, DrawdownSimulator |
| Ajouter PageHeader + Footer à `/demo` | `app/demo/DemoClient.js` | Import + render comme les autres pages publiques |

### 0.2 — SEO quick wins (Jour 2-3)

| Tâche | Impact |
|-------|--------|
| Enrichir LandingFallback (app/page.js) — 300 mots + liens /compare, /tools, /pricing, /docs | Crawlers voient du vrai contenu |
| Ajouter canonical URLs à 6 pages (/security, /integrations, /contact, /legal/*) | 15 min |
| Ajouter OG + Twitter cards aux 9 pages manquantes | 1h |
| Ajouter FAQPage JSON-LD à /docs | Rich snippets gratuits |
| Fixer H1 pollution dans 4 mockups landing → `<div>` ou `<h2>` | 20 min |

### 0.3 — Monitoring & sécurité (Jour 3-4)

| Tâche | Détail |
|-------|--------|
| Intégrer Sentry | `npx @sentry/wizard@latest -i nextjs`, forcer une erreur test |
| Ajouter rate limiting | /api/referral, /api/onboarding, /api/export, /api/push/* |
| Fix unsafe-eval CSP | Conditionnel dev-only dans next.config.js |
| Fix push routes → verifyAuth() | push/subscribe + push/unsubscribe |
| Fix admin layout → isAdmin() | Remplacer ADMIN_EMAILS.includes() |

### 0.4 — Architecture quick wins (Jour 4-5)

| Tâche | Impact |
|-------|--------|
| Supprimer lenis + react-chartjs-2 | Dépendances mortes |
| Nested selects Supabase : `firms.select('*, accounts(*, payouts(*)')` | -75% queries |
| Cache exchange rates (30 min TTL module-scope) | Fiabilité |
| Ajouter ISR `revalidate=3600` aux pages publiques statiques | TTFB < 100ms |

### 0.5 — Accessibilité basique (Jour 5)

| Tâche | Impact |
|-------|--------|
| Ajouter `:focus-visible` styles dans globals.css | WCAG basique |
| Ajouter skip-to-content link dans layout.js | Keyboard users |
| Augmenter --text3 contrast → #7b839b | 294 occurrences, 4.5:1 ratio |
| Dynamic `<html lang>` basé sur locale | i18n correct |

### Go/No-Go Phase 0 → 1
- [ ] Zéro bug HIGH/CRITICAL
- [ ] Sentry installé et testé
- [ ] CTA signup fonctionne (route /auth?mode=signup)
- [ ] Build `npm run build` passe sans erreur
- [ ] Lint passe sans erreur

---

## PHASE 1 — BETA PRIVÉE (Semaines 2-3 : 3 → 16 juin)

### Objectif : 10-20 vrais utilisateurs, feedback réel, validation produit

### 1.1 — Préparation beta (Jour 1-2)

| Tâche | Détail |
|-------|--------|
| Test E2E complet toi-même | Signup (Gmail/Outlook/Proton), onboarding, tutorial, toutes les features, mobile, Safari |
| Email deliverability | mail-tester.com ≥ 9/10, vérifier SPF/DKIM/DMARC |
| Templates email Supabase | Branding Quantara, FR, sender = "Quantara" |
| Audit RLS | 2 comptes test : vérifier qu'aucune donnée ne fuit entre users |
| Backups Supabase | Activer PITR si plan Pro, sinon dumps manuels quotidiens |
| Setup analytics | PostHog (gratuit 1M events/mo) OU Plausible (9€/mo) |

### 1.2 — Recrutement beta (Jour 3-7)

| Canal | Action | Objectif |
|-------|--------|----------|
| Discord trading FR | DM personnalisé aux traders PropFirm actifs | 10 prospects |
| Twitter/X PropFirm | Thread "Je construis un outil pour tracker vos comptes PropFirm" | 5 prospects |
| r/FuturesTrading | Post utile (pas promo) + lien profil | 5 prospects |
| Forums Topstep/Apex | Commentaires utiles avec mention outil | 5 prospects |
| Réseau perso | DM direct | 5 prospects |

**Script DM :** "Salut [prénom], je lance Quantara, un journal pour les traders PropFirm futures. Tu veux tester gratuitement et me donner ton avis ? Compte Pro offert à vie pour les beta testeurs 🙏"

### 1.3 — Serveur Discord Quantara

| Channel | Usage |
|---------|-------|
| #welcome | Présentation + règles |
| #annonces | Updates produit |
| #bugs | Reports bugs |
| #suggestions | Feature requests |
| #questions | Support |
| #feedback-libre | Avis ouverts |

### 1.4 — Features quick (pendant la beta, basées sur feedback)

| Feature | Score | Effort | Quand |
|---------|:-----:|:------:|-------|
| Drawdown Health Dashboard (jauge visuelle) | 30 | Low | Semaine 2 |
| Position Size Calculator | 26 | Low | Semaine 2 |
| Daily Pre-Market Checklist | 26 | Low | Semaine 3 |
| Social Payout Certificate (@vercel/og) | 24 | Low | Semaine 3 |

### 1.5 — Métriques à tracker

| Métrique | Objectif |
|----------|----------|
| Signups | 20+ |
| % activation email | > 80% |
| % 1ère firme dans 24h | > 60% |
| % 1er trade dans 7j | > 40% |
| Erreurs Sentry/jour | < 5 |
| NPS (demander directement) | > 8 |

### Go/No-Go Phase 1 → 2
- [ ] 10+ beta users actifs (loguent ≥ 1 trade/semaine)
- [ ] 100% bugs 🔴 fixés
- [ ] 3+ users disent spontanément "c'est utile, je continue"
- [ ] Erreurs Sentry < 5/jour
- [ ] Feedback Discord actif

---

## PHASE 2 — LAUNCH PUBLIC GRATUIT (Semaine 4 : 17 → 23 juin)

### Objectif : 100+ signups, visibilité publique, SEO en marche

### 2.1 — Polish final (Jour 1-2)

| Tâche | Détail |
|-------|--------|
| Fix 70%+ bugs 🟡 de la beta | Prioriser par impact |
| Implémenter top 3 suggestions beta | Ce que les users veulent |
| Réécrire hero headline | Pain-first : "Stop losing funded accounts to drawdown miscalculations" |
| Remplacer social proof | Vrais témoignages beta OU logos PropFirm + metric réelle |
| Ajouter price anchoring pricing | "Tradervue $49/mo — Quantara 9€/mo" |

### 2.2 — Assets marketing (Jour 2-3)

| Asset | Spec |
|-------|------|
| Screenshot dashboard HD | 1920x1080, dark mode, données réalistes |
| Vidéo démo 60-90s | Loom/OBS : intro 5s → problème 10s → solution 30s → demo 30s → CTA 5s |
| 3 visuels Twitter | 1200x675px |
| OpenGraph image unique | 1200x630px pour /compare, /tools, /pricing |
| Tagline punchy | "Le journal de trading des traders PropFirm. Drawdown, consistency, payouts — tracké automatiquement." |

### 2.3 — SEO programmatique (Jour 3-5)

| Tâche | Pages | Volume |
|-------|:-----:|:------:|
| Template `/firms/[slug]` + générer 3 premières (Topstep, Apex, Lucid) | 3 | ~2000/mo |
| Page `/compare/topstep-vs-apex` | 1 | 2400/mo |
| Page `/guides/trailing-drawdown` (complément du simulateur) | 1 | 1900/mo |
| Ajouter ces pages au sitemap + internal linking | — | — |

### 2.4 — Launch day (Jour 5-7)

| Plateforme | Timing | Préparation |
|------------|--------|-------------|
| **Product Hunt** | Mardi 12:01 PST | Maker comment prêt, 10-20 amis briefés pour upvote premières heures |
| **BetaList** | J-2 | Soumettre ($129 fast-track si budget) |
| **Indie Hackers** | Jour J | Post "I just launched..." |
| **HackerNews** | Jour J | "Show HN: Quantara — trading journal for PropFirm futures traders" |
| **Reddit** | Dimanche 14-17h CET | r/Daytrading, r/FuturesTrading, r/Trading, r/PropFirm |
| **Twitter/X** | Thread jour J | Thread de lancement + vidéo démo |
| **LinkedIn** | Post pro | Version professionnelle du thread |

### Go/No-Go Phase 2 → 3
- [ ] 100+ signups
- [ ] 30+ users actifs
- [ ] 5+ pages SEO indexées
- [ ] Sentry stable (< 10 erreurs/jour)
- [ ] Feedback positif dominant (> 80% des retours)

---

## PHASE 3 — SEO & CONTENU (Semaines 5-8 : 24 juin → 21 juillet)

### Objectif : 30+ pages indexées, trafic organique commencé, autorité

### 3.1 — Content engine setup (Semaine 5)

| Tâche | Détail |
|-------|--------|
| Template `/firms/[slug]/page.js` dynamique | Génère depuis PROPFIRM_RULES, SEO metadata auto |
| Template `/guides/[slug]/page.js` | MDX ou JSON content |
| Template `/compare/[firmA]-vs-[firmB]/page.js` | Auto-généré depuis ComparisonPage |
| Générer 8 pages firms restantes | MFFU, Tradeify, FFN, FE, FundedNext, Bulenox, TPT, Phidias |
| Composant `<Breadcrumbs>` visible | Sur toutes les pages contenu |

### 3.2 — Contenu Mois 1 (Semaines 5-6)

| Type | Pages | Détail |
|------|:-----:|--------|
| Firms | 3 nouvelles (MFFU, Tradeify, Bulenox) | Total : 6/11 |
| Comparaisons | 2 (Apex vs MFFU, Quantara vs Tradezella) | Total : 5 compare |
| Guides | 2 (Consistency Rule, Payout PropFirm) | Total : 3 guides |
| Blog | 2 (actus PropFirm, "Mon setup Quantara") | Infra blog à créer |
| Tools | PropFirm Cost Simulator | Total : 3 tools |

### 3.3 — Contenu Mois 2 (Semaines 7-8)

| Type | Pages |
|------|:-----:|
| Firms | 5 restantes (FFN, FE, FundedNext, TPT, Phidias) |
| Comparaisons | 3 (Quantara vs TradesViz, Topstep vs MFFU, Apex vs Bulenox) |
| Guides | 2 (Comment passer Topstep, Comment passer Apex) |
| Blog | 4 posts |
| Auto-compare | Top 10 paires de firmes |

### 3.4 — Backlinks & distribution

| Canal | Action |
|-------|--------|
| Directory submissions | BetaList, SaaSHub, AlternativeTo, TAAFT, Futurepedia |
| PropFirm YouTubers | Contact 5 chaînes (50k+ abonnés), offrir Pro gratuit + commission |
| Guest posts | 3 sites trading de référence |
| Reddit value posts | 1 post utile/semaine avec mention naturelle |

### 3.5 — Features Sprint 2 (pendant cette phase)

| Feature | Score | Effort |
|---------|:-----:|:------:|
| Consistency Score Monitor | 28 | Medium |
| Danger Zone + Trading Pause | 27 | Medium |
| Payout Pipeline Tracker | 27 | Medium |
| Rule Violation Detector | 25 | Medium |

### KPIs Phase 3
| Métrique | Objectif |
|----------|----------|
| Pages indexées | 30+ |
| Trafic organique | 500-1500/mo |
| Domain Rating | 3 → 8 |
| Users actifs | 50+ |
| 5+ users demandent à payer | Gate monétisation |

---

## PHASE 4 — MONÉTISATION (Semaines 9-10 : 22 juillet → 4 août)

### Objectif : Stripe live, premiers clients payants, MRR > 0

### Gate criteria (OBLIGATOIRE avant de lancer Pro)
- [ ] 100+ signups
- [ ] 30+ users actifs (≥ 1 trade/semaine)
- [ ] 5+ users qui DM spontanément "je payerais pour ça"
- [ ] LLC EIN obtenu
- [ ] Compte bancaire business ouvert (Mercury)

### 4.1 — Stripe setup (Semaine 9)

| Tâche | Détail |
|-------|--------|
| Créer compte Stripe | Validation 1-3 jours, EIN + US bank account |
| Définir 2 plans | **Free** : 2 firms, 100 trades/mo, 2 comptes. **Pro** : illimité = **9€/mo** ou **89€/an** (-18%) |
| Plan Lifetime | **99€ one-time** (100 premiers, early bird) |
| Intégrer Stripe Checkout | API route `/api/stripe/checkout` |
| Webhook `/api/stripe/webhook` | Met à jour `profiles.plan` dans Supabase |
| Customer Portal | Gérer abonnement depuis /app/settings |

### 4.2 — Feature gating (Semaine 9)

| Feature | Free | Pro |
|---------|:----:|:---:|
| PropFirm accounts | 2 | Illimité |
| Trades/mois | 100 | Illimité |
| Drawdown Health Dashboard | ✅ | ✅ |
| Consistency Score Monitor | Basique | Temps réel |
| Danger Zone alerts | ❌ | ✅ |
| Payout Pipeline | ❌ | ✅ |
| AI Trade Coach | ❌ | ✅ |
| CSV/PDF Export | ❌ | ✅ |
| Position Size Calculator | ❌ | ✅ |
| Bulk account creation | ❌ | ✅ |
| Priority support | ❌ | ✅ |
| Payout Certificate (shareable) | Watermark | Clean |

### 4.3 — Communication launch Pro (Semaine 10)

| Action | Détail |
|--------|--------|
| Email à tous les users | "Nous lançons Pro 🎉 — les beta testeurs gardent le Free legacy" |
| Promo lancement | Lifetime 99€ limité 100 places (compteur visible) |
| Money-back guarantee | 30 jours satisfait ou remboursé (Lifetime + Pro) |
| Update CGU | Conditions paiement, refund, rétractation 14j |
| Page /pricing mise à jour | Tableau comparatif avec gating réel |

### 4.4 — Supabase pour Stripe

```sql
-- Colonnes à ajouter
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;
```

### KPIs Phase 4
| Métrique | Objectif |
|----------|----------|
| Conversion Free → Pro | > 3% |
| MRR | > 0 (first dollar!) |
| Lifetime sold | 5-10 |
| Churn | < 5%/mois |

---

## PHASE 5 — GROWTH ENGINE (Semaines 11+ : août 2026 →)

### Objectif : MRR $500/mo, 500+ users, machine SEO autonome

### 5.1 — Features Sprint 3-4

| Feature | Sprint | Effort |
|---------|:------:|:------:|
| Account Lifecycle Kanban | 3 | Medium |
| Anonymous Leaderboard | 3 | Medium |
| Weekly Recap Card | 3 | Low |
| AI Trade Coach (Claude API) | 4 | High |
| Trade Replay (TradingView) | 4 | High |
| Cross-Firm Benchmarking | 4 | Medium |

### 5.2 — SEO scale

| Mois | Action | Pages cumulées |
|------|--------|:--------------:|
| M3 | Top 10 auto-compare pages | 40 |
| M4 | 3 guides + 4 blog posts | 47 |
| M5 | 3 guides + 4 blog posts + 1 tool | 55 |
| M6 | 3 guides + 4 blog posts | 62 |
| M12 | Maintenance + 2 guides/mo + 4 blog/mo | 100+ |

### 5.3 — Growth channels

| Canal | Action | Timeline |
|-------|--------|----------|
| YouTube | 1 vidéo/semaine (trades, tips, Quantara updates) | M3+ |
| PropFirm partnerships | Revenue share affiliate | M4+ |
| Chrome Extension Rithmic | Auto-sync trades sans API broker | M6+ |
| Social login (Google + Discord) | Réduire friction signup | M3 |
| Referral program (déjà codé) | Activer avec incentive Pro | M4 |

### 5.4 — Objectifs M6 et M12

| Métrique | M6 | M12 |
|----------|:--:|:---:|
| Users totaux | 300+ | 1000+ |
| Users actifs | 100+ | 400+ |
| MRR | $500+ | $2000+ |
| Pages indexées | 60+ | 100+ |
| Trafic organique | 5000/mo | 10000/mo |
| Domain Rating | 18+ | 28+ |
| Keywords top 10 | 15+ | 40+ |

---

## LÉGAL & BUSINESS (en parallèle, démarrer ASAP)

| Tâche | Deadline | Status |
|-------|----------|--------|
| LLC New Mexico | ✅ FAIT | Quantara Technologies LLC |
| EIN (IRS) | Avant Phase 4 | À faire |
| Compte bancaire Mercury | Avant Phase 4 | À faire |
| Stripe activé | Phase 4 Semaine 9 | À faire |
| CGU review avocat US | Avant Phase 4 | À faire (~$500-1000) |
| Comptable NM (CPA) | Avant fin 2026 | À faire |
| Registered agent NM | ✅ (inclus dans LLC) | Fait |
| Annual Report NM | Annuel | Calendrier |

---

## RÉCAP CHRONOLOGIQUE

```
Semaine 1  (27 mai)   │ PHASE 0 │ Bugfix, monitoring, SEO quick wins
Semaine 2  (3 juin)   │ PHASE 1 │ Beta privée : E2E test, recrutement
Semaine 3  (10 juin)  │ PHASE 1 │ Beta privée : feedback, quick features
Semaine 4  (17 juin)  │ PHASE 2 │ Launch public : polish, marketing, launch day
Semaine 5  (24 juin)  │ PHASE 3 │ SEO : content engine, firm pages, guides
Semaine 6  (1 juil)   │ PHASE 3 │ SEO : comparaisons, blog, backlinks
Semaine 7  (8 juil)   │ PHASE 3 │ SEO : firms restantes, features sprint 2
Semaine 8  (15 juil)  │ PHASE 3 │ SEO : auto-compare, distribution
Semaine 9  (22 juil)  │ PHASE 4 │ Stripe setup, feature gating
Semaine 10 (29 juil)  │ PHASE 4 │ Launch Pro, communication, promo
Semaine 11+(5 août)   │ PHASE 5 │ Growth : AI coach, leaderboard, scale
```

---

## GO/NO-GO RÉSUMÉ

| Transition | Critère |
|------------|---------|
| Phase 0 → 1 | 0 bug critique, Sentry OK, CTA signup fonctionne |
| Phase 1 → 2 | 10 beta users actifs qui disent "c'est utile" |
| Phase 2 → 3 | 100+ signups, feedback positif > 80% |
| Phase 3 → 4 | 30+ actifs, 5+ veulent payer, EIN + bank account ready |
| Phase 4 → 5 | MRR > 0, Stripe live, 0 bug paiement |
| Phase 5 → croissance | MRR $500/mo = vrai business |

---

_Plan à reviewer chaque semaine. Ajustements basés sur data réelle (PostHog + Sentry + GSC)._
_Dernière update : 27 mai 2026_
