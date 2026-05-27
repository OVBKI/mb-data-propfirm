# Quantara — Business Plan One-Pager

> **Mission** : Devenir l'outil de référence pour la gestion de comptes PropFirm futures. Track. Analyze. Grow.
>
> _Version : v1.0 · Maj : 2026-05_

---

## 🎯 Problème

Les traders **prop futures** (PropFirms : Topstep, Apex, Lucid, MFFU, Tradeify…) gèrent en moyenne **3 à 8 comptes simultanés** avec des règles différentes (drawdowns trailing, profit targets, profit splits, payout caps). Aujourd'hui ils utilisent :

- ❌ Excel/Google Sheets manuels (bugs, perte de données)
- ❌ Outils génériques (TradeZella, TradesViz) qui ignorent les règles PropFirm
- ❌ Plusieurs apps séparées pour chaque firme

**Conséquence** : ils passent en moyenne **3-5h/semaine** à compiler manuellement leurs perfs, et **30%** des challenges sont perdus à cause d'une violation de règle non détectée à temps (consistency, jours min, drawdown trailing).

---

## ✨ Solution — Quantara

Webapp **mono-spécialisée PropFirm** qui :

1. **Tracke automatiquement** tous tes comptes PropFirm (10 firmes pré-configurées avec leurs règles officielles)
2. **Calcule en live** les drawdowns trailing, profit targets, jours validés (≥$X profit), consistency
3. **Gère les payouts** avec calcul auto du brut/net selon profit split par firme
4. **Stocke certificats & screenshots** de challenge et payout (preuve de réussite)
5. **Calendrier économique** intégré (Finnhub) avec filtres devise/impact
6. **Multi-langues** (FR/EN/ES) — unique sur le marché

**Différenciateur clé** : aucun concurrent généraliste (TradeZella, TradesViz) ne connaît les règles spécifiques de Lucid, Apex 4.0, Phidias, etc. Quantara est le seul outil pensé "from the ground up" pour le PropFirm trader.

---

## 📊 Marché (TAM/SAM/SOM)

| Métrique | Estimation | Source |
|---|---|---|
| **TAM** (traders futures sur PropFirms mondialement) | 1-3M utilisateurs | Apex 500K + Topstep 200K + autres |
| **SAM** (anglophones + francophones, US + EU + LATAM) | ~1.5M | Géo principal des PropFirms |
| **SOM** (utilisateurs payants atteignables en 3 ans) | 5-15K | 0.3-1% du SAM = réaliste pour bootstrapped |

**Tendance marché** : croissance +30%/an depuis 2022. Apex est passé de 50K à 500K comptes en 3 ans. Le PropFirm est devenu mainstream.

---

## 💰 Business Model & Pricing

**Freemium SaaS** avec 3 tiers :

| Tier | Prix | Cible | Inclut |
|---|---|---|---|
| **Free** | $0 | Tester, 1ère firme | 1 PropFirm, journal manuel illimité, calendrier éco, 5 trades/jour |
| **Pro** | **$24/mo** ou $240/an (-17%) | Trader actif | Multi-PropFirms, screenshots, certificats, exports CSV/PDF, jours validés |
| **Premium** | **$49/mo** ou $490/an | Pro full-time | Sync API auto (ProjectX/Tradovate), alertes mobile, analytics avancés, support prioritaire |

**Conversion target** : 5-8% Free → Paid (typique SaaS niche)

**Hypothèse pricing power** : un trader qui paye $200-500/mois en challenges PropFirms acceptera facilement $24-49/mois pour un outil qui l'empêche de perdre un challenge à cause d'une règle ratée.

---

## 🏆 Concurrence & Positionnement

| Concurrent | Force | Faiblesse | Notre angle |
|---|---|---|---|
| **TradeZella** | Brand, $5-10M ARR | Générique, pas de règles PropFirm | Spécialisation PropFirm |
| **TradesViz** | Multi-broker | Setup complexe | UX simple, pré-configuré |
| **EdgeWonk** | One-time fee | Pas de calc PropFirm | Web-based, mises à jour live |
| **PropFirmMatch** | Comparateur | Pas de tracking | On track, ils comparent |
| **Excel/Sheets** | Gratuit | 0 automation | Vraie app, vraie automation |

**Moat de Quantara** :
1. **Règles PropFirm pré-codées** (10 firmes × 5 plans × 20 règles = ~1000 data points uniques)
2. **Profit split & payout calc** (personne d'autre ne le fait correctement)
3. **Multi-langues natif** (FR/EN/ES) — TradeZella est EN-only
4. **Dark mode pro** + UX moderne ciblée jeunes traders

---

## 🚀 Go-to-Market

### Phase 1 (M1-3) — Beta privée
- 50-100 traders recrutés via Discord Apex/Topstep + Reddit r/Daytrading
- Récolte 10+ témoignages écrits
- Itère le produit selon retours

### Phase 2 (M4-9) — Launch publique
- Product Hunt launch
- Content SEO (10-15 articles : "How to track Lucid drawdown", "Apex 4.0 explained", etc.)
- Twitter/X présence quotidienne
- Discord Quantara communauté ouverte
- Intégration ProjectX (couvre 6 PropFirms)

### Phase 3 (M10-24) — Scale
- YouTube channel (1 vidéo/semaine)
- Affiliations PropFirms (commission referral)
- Localisation FR/EN/ES complète
- Mobile PWA installable
- Partenariats : Discord servers de coachs trading

**Acquisition cost target** : <$15 par paid user (réalisable via communauté + content)

---

## 📈 Projections Financières (réalistes — scénario médian)

| Métrique | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Free users | 1,000 | 5,000 | 15,000 |
| Paid users | 80 | 400 | 1,500 |
| MRR | $2,000 | $12,000 | $52,000 |
| **ARR** | **$24K** | **$144K** | **$625K** |
| Coûts infra + ops | $2K | $12K | $50K |
| Marketing | $3K | $20K | $80K |
| **Net cashflow** | **$19K** | **$112K** | **$495K** |

**Cumul Year 3** : ~$626K net (avant impôts US)

**Levée de fonds** : non requise. Bootstrappable avec ~$3-5K initial cash.

**Scénarios alternatifs** :
- 🔴 Pessimiste : plateau $5K MRR Year 2 (~$60K ARR)
- 🟢 Réaliste : $625K ARR Year 3 (cf. tableau)
- 🟠 Optimiste : $3-5M ARR Year 3 (TradeZella territory)

---

## 🎯 Roadmap — Milestones clés

| Trimestre | Milestone |
|---|---|
| **Q3 2026** | LLC formée, beta privée 50 users, 10 témoignages |
| **Q4 2026** | Product Hunt launch, intégration ProjectX (Topstep, TPT, Tradeify, MFFU) |
| **Q1 2027** | 1000 users, 100 paid, $30K ARR |
| **Q2 2027** | Mobile PWA + EN/ES translations |
| **Q4 2027** | 5000 users, 500 paid, $150K ARR |
| **Q4 2028** | 15K users, 1500 paid, $625K ARR |
| **2029+** | Possible exit ($2-5M) ou continue growth ($1-3M ARR) |

---

## 👥 Équipe

**Founder** : [À COMPLÉTER]
- Solo founder, full-stack engineer
- 100% du code, design, ops
- Bootstrappé, pas d'investisseurs

**Plans d'embauche** :
- Year 2 : 1 community manager / customer success ($30-50K)
- Year 3 : 1 dev backend + 1 marketing ($120K combiné)

---

## 💼 Structure légale

- **Quantara Technologies LLC**, New Mexico, USA
- Adresse : 1209 Mountain Road PL NE, STE R, Albuquerque, NM 87110
- EIN : [À COMPLÉTER]
- Banque : Mercury (US)
- Paiements : Stripe
- Hébergement : Vercel + Supabase (région EU pour data)
- Conformité : RGPD, CCPA, TDPSA

---

## 📞 Contact

- **Email** : contact@quantara.tech
- **Site** : quantara.tech
- **GitHub** : github.com/[username]/mb-data-propfirm

---

_Ce business plan est un document vivant, mis à jour trimestriellement._
