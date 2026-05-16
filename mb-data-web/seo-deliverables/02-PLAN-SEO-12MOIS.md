# Plan SEO Quantara — Roadmap 12 mois
_Méthodologie : skill `seo-plan` (template SaaS B2C) — AgriciDaniel/claude-seo v1.9.9_
_Cible : quantara.tech — pre-launch beta → 10k visites/mois organiques sous 12 mois_

---

## 1. DISCOVERY

### Business
- **Produit :** Quantara, journal de trading SaaS pour traders PropFirm futures
- **Modèle :** Beta gratuit → freemium/paid (à définir)
- **Audience :** Traders futures qui ont (ou veulent) un compte chez Topstep, Apex, Lucid, MyFundedFutures, Tradeify, FundedNext, Funded Futures Network, Futures Elites
- **Édité par :** Quantara LLC (Texas, USA)
- **Géographie :** EU + LATAM en priorité (FR/EN/ES), USA en secondaire
- **Phase :** Pre-launch — 1 page indexable, 0 backlink, 0 trafic organique

### Goals 12 mois
- **Trafic organique :** 10,000 visites/mois (de ~0)
- **Inscriptions via SEO :** 500/mois
- **Conversion SEO → paid :** 5% (= 25 paid/mois)
- **Domain Rating :** 25+ (depuis 0)
- **Brand mentions IA :** présent dans top 3 réponses ChatGPT/Perplexity pour "best trading journal propfirm français"

### Contraintes
- Budget marketing : assumé limité (lean / founder-led)
- Pas de team SEO interne → workflow IA-assisté (Claude + skills)
- Pas de comptes payants comme Ahrefs/Semrush → outils gratuits (GSC, Ubersuggest gratuit, Google Trends)
- Vercel + Next.js 14 → infra parfaite pour SEO technique (SSR/SSG natif)

---

## 2. ANALYSE COMPÉTITIVE — TOP 5

| # | Concurrent | Géo | Pricing | Forces | Faiblesses | Gap pour Quantara |
|---|---|---|---|---|---|---|
| 1 | **TradesViz** | US/Global | $14-29/mo | 29+ propfirms, retroactive evaluation, auto-sync brokers | UX dense, anglais only, pas mobile-first | Multi-langue FR/EN/ES + UX claire mobile-first |
| 2 | **Tradezella** | US/Global | $24-37/mo | 80+ brokers auto-sync, marketing fort | Pas spécialisé propfirm, cher | Pricing accessible + spécialisation propfirm pure |
| 3 | **PassTraq** | US | $19+/mo | Status banner "On Track/Caution/Stop" très clair | Couvre 12 firms seulement | Plus de firms + français |
| 4 | **PropJournal** | US | Free + AI | Free forever, AI coach | UX basique, monolangue | Marque + UX premium + multi-langue |
| 5 | **PropTally** | US/ES | Free | 30+ firms, free | Pas d'AI, lecture-seule | Workflow trader actif + saisie rapide |

### Concurrents francophones
| Concurrent | Pricing | Forces | Faiblesses |
|---|---|---|---|
| **ProTradingData** | "Prix abordable" | 1er FR, auto-sync MT4/MT5/cTrader | Pas spécialisé propfirm futures, axé forex |
| **FocusPips** | Payant | "Journal IA N°1 en France" | Pas spécialisé propfirm |
| Concurrent FR pur PropFirm Futures | — | — | **AUCUN identifié** → 💎 niche libre |

**INSIGHT STRATÉGIQUE :** Le combo "propfirm futures + français" n'a aucun concurrent direct. C'est l'angle de différenciation #1 à exploiter immédiatement.

### Gap analysis — opportunités contenu
- ❌ Aucun concurrent FR ne ranke sur "trailing drawdown Topstep" / "consistency rule Apex" / "comment passer Topstep Combine" en français
- ⚠️ Concurrents EN dominent mais avec contenu généraliste — Quantara peut être plus pointu sur les règles spécifiques de chaque firm
- ✅ Opportunité GEO : devenir LA référence FR pour les requêtes ChatGPT "meilleur outil propfirm" / "comment tracker mon compte Apex"

---

## 3. ARCHITECTURE DU SITE — STRUCTURE CIBLE

```
quantara.tech/
├── /                                    # Landing (existe)
├── /about                               # À propos + équipe + mission
├── /how-it-works                        # Page produit détaillée
├── /pricing                             # Plans (quand monétisé)
├── /firms/                              # Hub : toutes les PropFirms supportées
│   ├── /firms/topstep                   # Page dédiée Topstep
│   ├── /firms/apex                      # Page dédiée Apex
│   ├── /firms/lucid                     # Page dédiée Lucid
│   ├── /firms/myfundedfutures
│   ├── /firms/tradeify
│   ├── /firms/fundednext
│   ├── /firms/funded-futures-network
│   └── /firms/futures-elites
├── /compare/                            # Hub comparaisons
│   ├── /compare/topstep-vs-apex
│   ├── /compare/apex-vs-myfundedfutures
│   ├── /compare/quantara-vs-tradezella
│   └── /compare/quantara-vs-tradesviz
├── /guides/                             # Hub guides éducatifs
│   ├── /guides/trailing-drawdown
│   ├── /guides/consistency-rule
│   ├── /guides/comment-passer-topstep-combine
│   ├── /guides/comment-passer-apex-evaluation
│   ├── /guides/payout-propfirm-explication
│   └── /guides/risk-management-futures
├── /blog/                               # Articles actualité + analyses
│   └── /blog/[slug]
├── /tools/                              # Calculateurs gratuits (lead magnets)
│   ├── /tools/trailing-drawdown-calculator
│   ├── /tools/r-multiple-calculator
│   └── /tools/payout-calculator
├── /changelog                           # Updates produit (SEO bonus + trust)
├── /legal/
│   ├── /legal/privacy
│   ├── /legal/terms
│   └── /legal/cookies
└── /app                                 # Webapp (noindex)
```

### Content pillars (4 piliers)

1. **Pillar : PropFirm Futures Education** → guides expliquant les règles (trailing drawdown, consistency, max loss, payout)
2. **Pillar : PropFirm Comparisons** → "X vs Y", "best X for Y" → high commercial intent
3. **Pillar : Trader Skill Building** → risk management, psychologie, journaling
4. **Pillar : Tool Pages** → calculateurs gratuits = backlink magnets

### Internal linking strategy
- Chaque page firm → liée depuis landing (section "PropFirms supportées")
- Chaque page firm → linker vers ses guides ("Comment passer Topstep" sur `/firms/topstep`)
- Chaque guide → linker vers les firms concernées + calculateur associé
- Chaque comparison → linker vers les 2 pages firm + le guide associé

---

## 4. CONTENT STRATEGY — 12 MOIS

### Calendrier de publication

| Mois | Pages firm | Comparaisons | Guides | Blog | Tools | Total cumul |
|---|---|---|---|---|---|---|
| M1 | 3 (Topstep, Apex, Lucid) | 1 (Topstep vs Apex) | 2 (Trailing DD, Consistency) | 2 | 1 (Trailing DD calc) | 9 |
| M2 | 3 (MFFU, Tradeify, FFN) | 1 | 2 | 4 | 0 | 19 |
| M3 | 2 (FE, FundedNext) | 2 | 2 | 4 | 1 | 30 |
| M4 | 0 | 2 | 3 | 4 | 0 | 39 |
| M5 | 0 | 2 | 3 | 4 | 1 | 49 |
| M6 | 0 | 1 | 3 | 4 | 0 | 57 |
| M7-12 | maintenance | 1/mois | 2/mois | 4/mois | 1/trim | ~100 pages |

### Keyword strategy (top 30 cibles)

#### Tier 1 — Commercial intent (priorité absolue, 12 keywords)
| Keyword | Volume estimé | Difficulté | Page cible |
|---|---|---|---|
| best trading journal prop firm | 1.6k/mo | Medium | /compare/ + landing |
| trading journal propfirm | 800/mo | Low-Med | landing |
| journal de trading propfirm | 200/mo FR | Low | landing FR |
| topstep journal | 500/mo | Medium | /firms/topstep |
| apex trader funding journal | 700/mo | Medium | /firms/apex |
| topstep vs apex | 2.4k/mo | High | /compare/topstep-vs-apex |
| best prop firm tracker | 900/mo | Medium | landing |
| tradezella alternative | 200/mo | Low | /compare/quantara-vs-tradezella |
| tradesviz alternative | 100/mo | Low | /compare/quantara-vs-tradesviz |
| free prop firm journal | 400/mo | Medium | landing (beta gratuit) |
| meilleur journal trading propfirm | 80/mo FR | Low | landing FR |
| tracker compte propfirm | 100/mo FR | Low | landing FR |

#### Tier 2 — Informational (educational, drive trust, 12 keywords)
| Keyword | Volume | Page cible |
|---|---|---|
| trailing drawdown explained | 1.9k/mo | /guides/trailing-drawdown |
| trailing drawdown topstep | 900/mo | guide + /firms/topstep |
| trailing drawdown apex | 1.1k/mo | guide + /firms/apex |
| consistency rule prop firm | 600/mo | /guides/consistency-rule |
| how to pass topstep combine | 1.4k/mo | /guides/passer-topstep-combine |
| how to pass apex evaluation | 800/mo | /guides/passer-apex-evaluation |
| prop firm payout | 1.2k/mo | /guides/payout-propfirm |
| max loss limit topstep | 300/mo | /firms/topstep |
| qu'est-ce qu'une propfirm | 1.5k/mo FR | /guides/quest-ce-quune-propfirm |
| comment passer une propfirm | 600/mo FR | /guides/comment-passer-propfirm |
| trailing drawdown explication | 100/mo FR | /guides/trailing-drawdown-fr |
| consistency rule expliquée | 50/mo FR | /guides/consistency-rule-fr |

#### Tier 3 — Long-tail + tools (low competition, 6 keywords)
| Keyword | Volume | Page cible |
|---|---|---|
| trailing drawdown calculator | 300/mo | /tools/trailing-drawdown-calculator |
| r multiple calculator trading | 200/mo | /tools/r-multiple-calculator |
| propfirm payout calculator | 100/mo | /tools/payout-calculator |
| topstep funded account rules | 400/mo | /firms/topstep |
| apex intraday vs end of day | 200/mo | /guides/apex-intraday-vs-eod |
| best prop firm 2026 | 1.8k/mo | /blog (article comparatif) |

### E-E-A-T building

**Authoritativeness (Auteur) :**
- Bio founder publique (LinkedIn link, Twitter link, photo)
- Page `/about` détaillée avec story personnelle de trader
- Citations de vraies metrics (P&L tracked, comptes funded) — sans révéler infos confidentielles

**Experience :**
- "Pourquoi Quantara existe" : story du founder qui a perdu un Apex à cause d'un mauvais tracking → produit né du problème vécu
- Screenshots vrais comptes (anonymisés) sur les guides
- Case studies "Comment j'ai passé Topstep avec Quantara" (témoignages utilisateurs beta)

**Expertise :**
- Tous les guides écrits avec specificité technique (montants exacts, règles précises, examples chiffrés)
- Sources citées : pages officielles Topstep/Apex/Lucid, articles de référence

**Trustworthiness :**
- HTTPS ✓ (Vercel)
- Mentions légales complètes (privacy, terms, cookies)
- Quantara LLC Texas — adresse vérifiable
- Contact email visible (`admin@quantara.tech`)
- Newsletter avec double opt-in
- Status page (uptime — quand le produit mature)

---

## 5. TECHNICAL FOUNDATION — 30 JOURS

Voir [01-AUDIT-SEO.md](./01-AUDIT-SEO.md) pour le détail. Récap exécutif :

### Jour 1 (2h)
- [ ] `app/robots.js` + `app/sitemap.js`
- [ ] OG + Twitter + canonical + JSON-LD dans `layout.js`
- [ ] Création `public/og-image.png` (1200×630)
- [ ] Création `public/llms.txt`

### Jour 2 (1h)
- [ ] Fix H1 cassé (7 → 1)
- [ ] Title + description optimisés
- [ ] Renommer `quantara-logo.png.png` → `quantara-logo.png` (+ refs)

### Semaine 1 (1 jour)
- [ ] Créer pages `/about`, `/legal/privacy`, `/legal/terms`, `/legal/cookies`
- [ ] Setup Google Search Console + soumission sitemap
- [ ] Setup Bing Webmaster Tools + IndexNow API key
- [ ] Setup analytics (Plausible recommandé : RGPD-friendly, pas de cookie banner)

### Semaine 2-4 (3 jours)
- [ ] Setup `app/blog/[slug]/page.js` avec MDX
- [ ] Setup `app/firms/[slug]/page.js`
- [ ] Setup `app/guides/[slug]/page.js`
- [ ] Setup `app/compare/[slug]/page.js`
- [ ] Setup `app/tools/[name]/page.js`
- [ ] Composant `<JsonLd />` réutilisable
- [ ] Composant `<Breadcrumbs />` + BreadcrumbList schema

### Core Web Vitals targets
| Métrique | Target | Note |
|---|---|---|
| LCP | < 2.5s | Already OK (SSR Next.js) |
| INP | < 200ms | À surveiller (Framer Motion + canvas) |
| CLS | < 0.1 | À mesurer — risque avec lazy-load images |

---

## 6. IMPLEMENTATION ROADMAP — 4 PHASES

### Phase 1 — Foundation (Mois 1)
**Objectif :** site indexable, technique propre, structure scalable

- ✅ Technical fixes (robots, sitemap, schema, OG, llms.txt)
- ✅ Architecture URL en place
- ✅ Templates dynamiques (firms, guides, compare, blog, tools)
- ✅ Pages légales
- ✅ GSC + Bing soumis, IndexNow actif
- ✅ Plausible analytics
- ✅ 9 premières pages publiées (3 firms + 1 compare + 2 guides + 2 blog + 1 tool)

**KPIs M1 :**
- Pages indexées : 10+
- Domain Rating : 0 → 3
- Trafic organique : 50-200 visites/mois (mostly brand search)

### Phase 2 — Expansion (Mois 2-3)
**Objectif :** couverture complète des firms + premières comparaisons + 1 calculateur viral

- 5 firms restantes documentées
- 3-4 comparaisons (Topstep vs Apex existe déjà, ajouter Apex vs MFFU, Quantara vs Tradezella, Quantara vs TradesViz)
- 4 guides supplémentaires (consistency rule, payout, comment passer Apex, intraday vs EOD)
- 8 articles de blog (analyses news propfirm, updates produit, cas clients beta)
- Calculateur Trailing Drawdown viral (lead magnet — capture email pour résultats détaillés)
- Lancement présence Reddit/r/propfirms + Twitter
- Première vidéo YouTube : "Quantara explained in 2 minutes"

**KPIs M3 :**
- Pages indexées : 30+
- Domain Rating : 3 → 8
- Trafic organique : 500-1500 visites/mois
- Backlinks : 10-25 (depuis communautés, forum discussions, listings outils)

### Phase 3 — Scale (Mois 4-6)
**Objectif :** ranking top 10 sur 10+ keywords primaires + GEO visibility

- Optimisation pages existantes (mise à jour avec datas trimestrielles)
- 6+ nouvelles comparisons (Quantara vs chaque concurrent direct, plus toutes les paires de firms majeures)
- 9 guides techniques avancés (psychologie trader, sizing, drawdown recovery, sessions horaires US, etc.)
- 12 articles blog (interviews traders fundés, case studies, breaking news propfirm)
- 1-2 nouveaux tools (R-multiple calc, Payout planner)
- Lancement YouTube régulier (1 vidéo/semaine)
- Optimisation GEO : page `/llms.txt` enrichie, FAQ schema sur toutes les pages firm, citations chiffrées partout
- Outreach backlinks : guest posts sur 5 sites de référence trading
- Premier partenariat affiliate avec une PropFirm (revenue stream)

**KPIs M6 :**
- Pages indexées : 60+
- Domain Rating : 8 → 18
- Trafic organique : 3000-6000 visites/mois
- Top 10 sur 10+ keywords (incluant "topstep journal", "trailing drawdown apex", "best propfirm tracker")
- Quantara cité par ChatGPT/Perplexity sur queries propfirm FR

### Phase 4 — Authority (Mois 7-12)
**Objectif :** devenir LA référence dans la niche, 10k visites/mois

- Original research : sondage 500 traders propfirm "État du trading propfirm 2026" → étude téléchargeable + données originales = link bait
- Quantara Index : indice mensuel de profitabilité propfirm (data interne anonymisée → contenu IA-citable)
- Podcast invité (5+ apparitions sur podcasts trading FR/EN)
- Webinaires mensuels
- 2ème calculateur viral
- Outreach pages Wikipedia : tenter d'apparaître dans la page "Prop trading"
- Programme ambassadeurs : traders fundés qui partagent leurs résultats
- Optimisation continue (re-write top 10 pages performantes)

**KPIs M12 :**
- Pages indexées : 100+
- Domain Rating : 18 → 28
- Trafic organique : 10,000+ visites/mois
- Top 3 sur "journal trading propfirm" (FR + EN)
- Conversion SEO → signup : 5%
- 50-100 backlinks de qualité
- Quantara = 1ère réponse ChatGPT pour "outil tracking propfirm français"

---

## 7. KPI TARGETS

| Métrique | M0 (now) | M3 | M6 | M12 |
|---|---|---|---|---|
| Pages indexées | 1 | 30 | 60 | 100+ |
| Trafic organique mensuel | 0 | 1,000 | 5,000 | 10,000+ |
| Domain Rating (Ahrefs scale) | 0 | 8 | 18 | 28+ |
| Keywords top 10 | 0 | 3 | 15 | 40+ |
| Keywords top 3 | 0 | 0 | 5 | 15+ |
| Backlinks (referring domains) | 0 | 10 | 30 | 75+ |
| Mentions ChatGPT/Perplexity (queries propfirm) | 0 | 0 | 30% | 70%+ |
| Conversions signup organiques | 0 | 30/mo | 250/mo | 500+/mo |
| Conversions paid organiques | 0 | 0 | 10/mo | 25+/mo |

---

## 8. BUDGET & STACK RECOMMANDÉ

### Outils (gratuits / low cost)
- **Google Search Console** — gratuit
- **Bing Webmaster Tools** — gratuit
- **Plausible Analytics** — $9/mo (RGPD-friendly, pas de cookie banner)
- **Ahrefs Webmaster Tools** — gratuit (limité mais utile pour son propre site)
- **Google Keyword Planner** — gratuit (besoin compte Ads)
- **Google Trends** — gratuit
- **Ubersuggest free tier** — gratuit (3 queries/jour)
- **Schema.org validator** — gratuit
- **PageSpeed Insights** — gratuit

### Outils premium (à considérer M3+)
- **Ahrefs starter** — $99/mo (M6+, quand budget le permet)
- **SurferSEO** — $89/mo (optimisation on-page si pas envie de le faire à la main)

### Production contenu
- Claude (toi + moi) avec les skills installés → 90% du contenu peut être généré et révisé
- Budget édition humaine : 0 (founder-led) → en M6+, éventuellement 1 freelance pour video editing

### Total budget mensuel
- M1-3 : ~$10 (Plausible)
- M4-6 : ~$10-100 (selon outils ajoutés)
- M7-12 : ~$100-200 (Ahrefs + tools)

---

## 9. RISQUES & MITIGATION

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Google update qui pénalise contenu IA | Moyenne | Élevé | Toujours review humaine + valeur ajoutée (data, screenshots, opinions tranchées) |
| Concurrents copient l'angle "propfirm FR" | Moyenne | Moyen | Vitesse d'exécution + qualité supérieure + brand building (YouTube) |
| Pénalité YMYL (finance = sensible) | Moyenne | Élevé | E-E-A-T strict : auteur identifié, sources citées, disclaimer "pas un conseil financier" sur toutes les pages |
| Trafic organique long à venir (6-12 mois normal) | Élevée | Faible | Diversifier acquisition : Reddit, YouTube, Twitter en parallèle |
| Vercel cron limits / scaling | Faible | Moyen | Vercel Pro à $20/mo si > limites du free |

---

## 10. SUCCESS CRITERIA — DÉFINITION DU SUCCÈS

À M12, Quantara doit :
- ✅ Apparaître en page 1 Google FR pour "journal trading propfirm" et variantes
- ✅ Être cité dans top 3 réponses ChatGPT/Perplexity pour "meilleur tracker propfirm français"
- ✅ Générer 500+ signups organiques/mois
- ✅ Avoir 100+ pages indexées de qualité (pas de thin content)
- ✅ Avoir une présence sur Reddit, YouTube, LinkedIn, Twitter avec engagement réel
- ✅ Avoir un Domain Rating de 25+
- ✅ Avoir 2-3 calculateurs/tools qui drivent du backlinks naturellement

Si M6 ne montre PAS de progrès clair (trafic > 2k/mo, DR > 10), pivot tactique :
- Re-évaluer angle de différenciation
- Doubler down sur YouTube (canal le mieux corrélé visibilité AI)
- Considérer publicité Reddit (très ciblé propfirm communities)

---

_Plan à reviewer chaque trimestre. Ajustements basés sur data réelle GSC + GA._
