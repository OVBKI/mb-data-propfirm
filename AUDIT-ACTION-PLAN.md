# Plan d'action — suite de l'audit Quantara (Juin 2026)

Séquencé en sprints. Réf = numéro dans `AUDIT-2026-06.md`.
Effort : **S** <30 min · **M** 1–3 h · **L** ½ journée · **XL** multi-jours.
🔵 = je peux faire seul (code) · 🟠 = **action de ta part requise** (env/SQL/compte externe).

Ordre conseillé : **Sprint 0 → 1 → 2 → 3** d'abord (sécurité + perf + a11y = dette
qui grossit). SEO/i18n/refactor/marketing ensuite. Le **track Revenu** dépend
d'externes (Stripe/EIN) → à mener en parallèle dès que possible.

---

## Sprint 0 — Quick wins (½ journée) — impact fort / risque faible
But : corriger une feature cassée + failles triviales + gains SEO/perf immédiats.

- [ ] 🔵 **S** Méta `/pricing` → vrais prix (SEO#2 / M2) — `app/pricing/page.js:8`
- [ ] 🔵 **S** Ajouter `id="main-content"` au wrapper de contenu (a11y#1 / SEO#12) — `app/app/(main)/layout.js:553` + `<main>` des pages publiques
- [ ] 🔵 **S** `Organization.sameAs` : décommenter X/Discord (SEO#11) — `components/JsonLd.js:53`
- [ ] 🔵 **S** `/docs/extension` au sitemap + `lastModified` statiques (SEO#3/#10) — `app/sitemap.js`
- [ ] 🔵 **S** Retirer `console.log` prod (Archi#11) — `journal-sync/view/page.js:95`
- [ ] 🔵 **S** Toast `aria-live="polite"` + `aria-label` boutons icônes (a11y#4/#8) — `layout.js:829,653`
- [ ] 🔵 **M** `useMemo` sur `contextValue` + `buildEventMap` (perf immédiate, Archi#2/#10)
- [ ] 🟠 **S** **Token GSC réel** + vérifier la propriété (SEO#5) — *tu me donnes le code, je remplace `app/layout.js:97`*
- [ ] 🟠 **S** **Fix `announcements`** `active`/`is_active` (Sécu#4 — feature cassée) — *je corrige code+schéma ; tu lances la migration SQL si la colonne doit être renommée en prod*
- [ ] 🟠 **S** **`revoke execute … from authenticated`** sur `resolve_username_to_email` (Sécu#8) — *SQL à exécuter sur Supabase (je te donne la requête)*

**Acceptation** : build vert, prix corrects en SERP, GSC vérifié, annonces fonctionnelles, énumération emails fermée.

---

## Sprint 1 — Sécurité (les 2 critiques + durcissement) — 2–3 jours
But : rendre l'app safe avant tout scale/launch payant.

- [ ] 🔵 **L** **Garde admin serveur** (Sécu#1, CRITIQUE) — auth de session dans `middleware.js` pour `/admin/*` (`@supabase/ssr`) + redirect `/app` si non-admin. Garder les checks API existants.
- [ ] 🔵 **S** **Secret sentry-test dédié + header** (Sécu#2, CRITIQUE) — `SENTRY_TEST_SECRET` en `Authorization`, route gatée `NODE_ENV!=='production'`. 🟠 *ajouter l'env sur Vercel.*
- [ ] 🟠 **M** **Confirmer toutes les RLS** (Sécu#3) — vérifier `referrals` + `rithmic_credentials` (RLS on + policies user-scoped) ; je les ajoute au `supabase-schema.sql` canonique ; *tu confirmes/lances en prod.*
- [ ] 🟠 **M** **Rate-limit partagé** (Sécu#5) — brancher Upstash Redis / Vercel KV (les call-sites `rateLimit()` ne changent pas). *Créer le compte Upstash (gratuit) + env.*
- [ ] 🔵 **M** **CSP à nonce** (Sécu#11) — retirer `script-src 'unsafe-inline'`, nonce via middleware. ⚠️ à tester (peut casser des scripts inline).
- [ ] 🔵 **S** **`webpush.setVapidDetails()` au scope module** + check boot (Sécu#6).
- [ ] 🔵 **S** **`export` en allow-list** de colonnes (Sécu#7) — `app/api/export/route.js:42`.
- [ ] 🔵 **S** **Rate-limit `/g/[code]`** + (option) entropie code ↑ (Sécu#9).
- [ ] 🟠 **M** **Opt-out recap emails** (Sécu#10, RGPD) — colonne `email_recap_enabled` + lien unsub. *Migration SQL.*

**Acceptation** : `/admin` inaccessible sans session admin (testé curl/RSC) ; secrets hors URL ; RLS prouvées sur 2 comptes test ; rate-limit effectif cross-instance.

---

## Sprint 2 — Performance & robustesse data — 2 jours
- [ ] 🔵 **M** **Optimistic updates** : ne plus `loadFirms()` complet après chaque mutation (Archi#3) ; `reload()` seulement sur changements structurels.
- [ ] 🟠 **M** **RPC billing** pour tuer le N+1 (Archi#1) — fonction Supabase `increment_billing_months` (1 appel). *Déployer la fonction SQL.*
- [ ] 🔵 **S** **try/catch `loadFirms`** + toast d'erreur (Archi#8).
- [ ] 🔵 **M** **`loading.js`** + `dynamic()` sur Journal/Trades/Calendar/Heatmap (Archi#9).
- [ ] 🔵 **S** **`select(colonnes)`** au lieu de `*` (precheck billing, journal-sync) (Archi#12).

**Acceptation** : navigation /app fluide, pas de re-fetch global sur édition simple, dashboard ne se vide plus en cas d'erreur réseau.

---

## Sprint 3 — Accessibilité & UX — 2–3 jours
- [ ] 🔵 **L** **Modals/drawers accessibles** (a11y#2) — `role="dialog" aria-modal aria-labelledby`, Escape, focus-trap, retour focus. (1 util partagé.)
- [ ] 🔵 **M** **Remplacer `confirm()/prompt()`** par modals/inline-edit (a11y#5 / Archi#4) — réutiliser le pattern FailModal.
- [ ] 🔵 **M** **Labels liés** `htmlFor`/`id` sur tous les champs (a11y#3).
- [ ] 🔵 **S** **Contrastes** : `--text3` → ~#8890a8, `--red-text` → #eb5f59 (a11y#6/#7) — `globals.css`.
- [ ] 🔵 **S** **Touch targets** ≥44px (icônes, burger) (a11y#8).

**Acceptation** : audit Lighthouse a11y > 90, navigation clavier complète sur modals, lecteurs d'écran annoncent toasts + dialogs.

---

## Sprint 4 — i18n — 1–2 jours
- [ ] 🔵 **L** Traduire les **~50+ strings FR** (modals, Tutorial) via `t()` (a11y/i18n#9).
- [ ] 🔵 **M** i18n `not-found.js`/`error.js`/`contact`/`ComparisonPage`/DrawdownSimulator (#10/#11) — bilingue ou détection `Accept-Language`.
- [ ] 🔵 **M** **Split i18n par locale** (`i18n.fr.js`/`i18n.en.js`, lazy-load) (Archi#7) — gain bundle.

**Acceptation** : switch EN ne laisse plus de FR ; payload i18n par page réduit.

---

## Sprint 5 — SEO / AI-SEO — 1–2 jours
- [ ] 🔵 **S** JSON-LD SoftwareApplication+FAQ landing **en SSR** (`app/page.js`) (SEO#1).
- [ ] 🔵 **M** **OG par page** via `@vercel/og` (firms/compare/guides) (SEO#4).
- [ ] 🔵 **S** **FAQPage JSON-LD** sur `/compare/[pair]` (SEO#6) + `offers`/`reviewRating` sur Product firms (SEO#7).
- [ ] 🔵 **M** **`llms.txt` complet** (73 pages) + date (SEO#9).
- [ ] 🔵 **S** **hreflang `x-default`** par page (SEO#8) — full multilingue = plus tard (routing /fr/ /en/).

**Acceptation** : Rich Results Test OK (Software/FAQ/Product), OG dédiés au partage, AI crawlers trouvent les 73 pages.

---

## Sprint 6 — Refactor / dette technique — 2 jours
- [ ] 🔵 **L** Éclater `layout.js` (834 l.) : modals/drawers → `components/modals/*` (Archi#5).
- [ ] 🔵 **S** Deps lourdes hors prod (`three`/`framer-motion`/`lightweight-charts`) (Archi#6).
- [ ] 🟠 **S** Test Sentry (`/api/sentry-test`) une fois corrigé → vérifier l'issue, **rotater l'auth token** (noté pré-launch).

**Acceptation** : `layout.js` < 300 l., bundle app allégé, Sentry capture confirmée.

---

## Track parallèle — Revenu / Marketing (dépend d'externes)
⏳ Bloqué par : **EIN IRS → Mercury → Stripe** (Phase 4 du LAUNCH_PLAN).
- [ ] 🟠 **XL** Débloquer le **Lifetime Founders €249** (capter du cash + valider WTP) — dès Stripe prêt (M1).
- [ ] 🔵 **S** **Source unique pricing** (méta + i18n + docs alignés) (M2) — *faisable maintenant, sans Stripe.*
- [ ] 🟠 **M** **Preuve sociale réelle** : collecter 3-5 citations beta + captures → je les intègre (M3).
- [ ] 🔵 **M** Pages **`/compare/quantara-vs-tradervue|tradezella`** + ancrage prix sur la landing (M4).
- [ ] 🔵 **M** **Wedge multi-PropFirm** mis en avant (hero/features) : net consolidé, payouts, règles drawdown (M5).
- [ ] 🔵 **S** Surfacer le **referral** in-app + séquence email « Pro arrive » (M6).

---

## Ce dont j'ai besoin de toi (récap actions 🟠)
1. **Vercel env** : token GSC, `SENTRY_TEST_SECRET`, creds Upstash, (plus tard `DATABENTO_API_KEY`).
2. **Supabase SQL** : RLS `referrals`/`rithmic_credentials`, fix `announcements`, `revoke` RPC, RPC billing, colonne opt-out. *(Je te fournis chaque requête prête à coller.)*
3. **Comptes** : Google Search Console, Upstash (gratuit), et le track Stripe (EIN/Mercury) pour le revenu.
4. **Contenu** : 3-5 vraies citations beta pour la preuve sociale.

---

## Estimation globale
~**2 semaines** de dev pour Sprints 0→6 (hors track Revenu qui dépend d'externes).
Recommandation : **Sprint 0 aujourd'hui**, puis **Sprint 1 (sécurité)** avant toute
campagne d'acquisition.
