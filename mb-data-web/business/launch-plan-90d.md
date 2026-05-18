# Quantara — Plan de Lancement 90 Jours

> **Objectif principal** : 500 free users + 30 paid users + 1 témoignage public à J+90.
>
> **Time investment** : 20-25h/semaine (compatible avec un job à côté).

---

## 📋 Vue d'ensemble par mois

| Mois | Phase | Focus | KPI cible |
|---|---|---|---|
| **M1** | 🏗️ Foundation | Setup business + private beta | 30 beta users |
| **M2** | 🌱 Community | Content + Reddit + Discord | 200 free users |
| **M3** | 🚀 Public Launch | Product Hunt + paid features | 500 users · 30 paid |

---

# 🏗️ MOIS 1 — Foundation (Semaines 1-4)

## Semaine 1 — Setup business

**Objectif** : Quantara LLC opérationnel + emails actifs.

### Lundi
- [ ] **Forme la LLC via Doola** ($297 + $50 registered agent annuel) — formulaire en ligne 30 min
- [ ] **Achète quantara.tech** sur Cloudflare Registrar (~$10/an) — si pas déjà fait
- [ ] **Active Cloudflare** sur quantara.tech (transfert nameservers)

### Mardi
- [ ] Configure **Cloudflare Email Routing** :
  - contact@ → ton.email@gmail.com
  - privacy@ → idem
  - security@ → idem
  - legal@ → idem
  - support@ → idem

### Mercredi
- [ ] Crée compte **Brevo** (SMTP gratuit 300 mails/jour)
- [ ] Configure **DKIM + SPF + DMARC** sur Cloudflare DNS
- [ ] Configure **Gmail "Send mail as"** pour répondre depuis @quantara.tech

### Jeudi-Vendredi
- [ ] Deploy production stable sur Vercel (custom domain quantara.tech + www)
- [ ] Configure **Sentry** (gratuit, monitoring erreurs)
- [ ] Configure **Plausible** ou **Umami** (analytics privacy-friendly, pas Google Analytics)
- [ ] Test complet du parcours user : signup → ajout PropFirm → ajout trade → vue journal

### Weekend
- [ ] Crée le compte **Twitter/X @quantara_app** + bio + 1ère photo de profil (logo)
- [ ] Crée le **Discord Quantara** (channels : #annonces, #général, #propfirm-talk, #feedback, #showcase)
- [ ] Reserve l'username sur Reddit (u/quantara_app)

**🎯 Fin de S1 : Business prêt, infra solide.**

---

## Semaine 2 — Préparer les armes

**Objectif** : Avoir tous les assets marketing prêts.

### Tâches techniques
- [ ] Crée 3 **screenshots HD** du dashboard avec data réaliste (utilisera la `DashboardPreview` existante)
- [ ] Enregistre 1 **vidéo Loom 60sec** de démo : "Comment tracker un compte Lucid en 30 secondes"
- [ ] Compresse les images via TinyPNG, optimise le site (Lighthouse score >90)

### Tâches contenu
- [ ] Rédige **5 articles de blog** (publiés progressivement sur 30 jours) :
  1. *"Apex Trader Funding 4.0 expliqué : ce qui change pour les traders"*
  2. *"Comment calculer ton trailing drawdown sur Lucid (guide complet)"*
  3. *"Topstep vs MFFU : quelle PropFirm pour démarrer ?"*
  4. *"5 erreurs qui font perdre 90% des challenges PropFirm"*
  5. *"Consistency rule : pourquoi 70% des traders se font flag"*
- [ ] Format : 1500-2500 mots, screenshots, exemples chiffrés, citations sources officielles
- [ ] **Stockés dans `/blog`** sur le site (créer le routing Next.js)

### Tâches communauté
- [ ] Liste de **30 sub-Reddits** ciblés (r/Daytrading, r/Futures, r/Apexevaluation, r/Topstep, r/PropFirm…) + leur règles de spam
- [ ] Liste de **20 Discord servers** PropFirm (Apex, Topstep, etc. — souvent ouverts)
- [ ] Identifie **15 influenceurs Twitter** PropFirm trading que tu commenceras à suivre/engager

**🎯 Fin de S2 : Arsenal marketing prêt.**

---

## Semaine 3 — Beta privée (recrutement)

**Objectif** : 30 beta users actifs.

### Stratégie
**Posts qualité, pas spam.** Tu ne mentionnes Quantara que dans 1 post sur 3.

### Mardi/Jeudi/Samedi (3 posts/semaine)
- [ ] Post Reddit r/Apexevaluation : *"J'ai listé toutes les règles cachées d'Apex 4.0 — voici le guide gratuit"* (lien vers ton blog post #1)
- [ ] Post Reddit r/Topstep : *"Calculateur trailing DD Topstep que j'ai fait pour moi (gratuit)"*
- [ ] Reply à 5-10 questions par jour sur les sub-Reddits avec valeur réelle (pas de pitch)

### Discord engagement
- [ ] Rejoins 5 Discord PropFirm gros, présente-toi dans #intro
- [ ] Réponds à des questions techniques (drawdowns, payouts) dans #general
- [ ] Mentionne Quantara seulement quand DEMANDÉ ("oh tu utilises quoi pour tracker ? — j'ai un outil que j'ai fait, demande en DM")

### DM Outreach (10 DMs ciblés/jour)
Trouver des traders sérieux sur Twitter/Discord. Template :
```
Hey [Nom],

Je vois que tu trades [Lucid/Topstep/Apex]. Je viens de lancer un outil
qui tracke automatiquement les drawdowns trailing par firme + calcule
ta consistency en live. Encore en beta privée mais ça pourrait t'aider.

Si tu veux tester gratos, voici le lien : quantara.tech
(beta jusqu'à fin du mois, après ça sera payant)

Bon trading !
```

### KPIs S3
- 30 signups beta
- 5+ users ayant ajouté ≥1 PropFirm + 5 trades
- 3+ feedbacks écrits

**🎯 Fin de S3 : 30 beta users, premiers feedbacks.**

---

## Semaine 4 — Itération produit

**Objectif** : Fix les 5 bugs/UX issues les plus signalés.

### Tâches
- [ ] Compile feedbacks beta dans Notion / Airtable
- [ ] Priorise top 5 issues (impact × fréquence)
- [ ] Fix + déploie
- [ ] Email aux beta users : *"Voici les 5 trucs qu'on a fix grâce à vous"*

### Continue en parallèle
- [ ] Publie blog post #2
- [ ] Reddit/Discord engagement quotidien
- [ ] DM 5-10 traders/jour

### KPIs M1
- ✅ LLC formée (ou commande passée)
- ✅ Emails @quantara.tech actifs
- ✅ 50 free users (dont 30 actifs)
- ✅ 5 témoignages écrits
- ✅ 2 blog posts publiés

**🎯 Fin M1 : Foundation solide, traction démarrée.**

---

# 🌱 MOIS 2 — Community Building (Semaines 5-8)

## Semaine 5 — Content blitz

**Objectif** : 5 articles publiés total (3 nouveaux ce mois).

### Lundi
- [ ] Publie blog post #3 (*"Topstep vs MFFU"*)
- [ ] Crosspost résumé sur Reddit avec lien
- [ ] Twitter thread résumant l'article (10 tweets)
- [ ] Partage dans 3 Discord pertinents

### Mardi-Jeudi
- [ ] **YouTube** : enregistre + publie 1ère vidéo (10 min) : *"How to track Lucid Trading like a pro"*
  - Structure : Problème → Démo Quantara → Tutorial step-by-step → CTA
  - Outils : OBS (gratuit) + DaVinci Resolve (gratuit) ou Capcut

### Vendredi
- [ ] Setup **email marketing** via Loops.so ou Resend (gratuit jusqu'à 1000 contacts)
- [ ] Crée newsletter hebdo "Quantara Weekly" (4 sections : Update produit, Tip de la semaine, News PropFirms, Communauté)

### KPIs S5
- 100 free users total
- 1 vidéo YouTube live
- 1 newsletter envoyée

---

## Semaine 6 — Engagement & viralité

**Objectif** : Faire parler de Quantara organiquement.

### Tactiques
- [ ] **Twitter/X** : 2 threads/semaine — analyses PropFirm + insights
- [ ] **Reddit** : 1 post de valeur/semaine sur 3 sub-Reddits différents
- [ ] **Discord** : engage quotidiennement, répondre à toutes questions PropFirm
- [ ] **Blog** : publie post #4

### Outreach créateurs
- [ ] DM 10 créateurs YouTube/Twitter PropFirm (small/medium audience 1-50K) :
```
Hey [Nom],

Énorme fan de ta chaîne — surtout ta vidéo sur [X].

Je viens de lancer Quantara, un outil de tracking PropFirm spécialisé.
J'aimerais te l'offrir gratuitement à vie en échange de tes feedbacks
(et si tu veux en parler à ta commu, ça serait incroyable, mais aucune
obligation).

Lien démo : quantara.tech/demo
DM moi si intéressé, je te fais l'access full immédiatement.
```

### KPIs S6
- 200 free users total
- 10 paid early adopters (à $19/mo lifetime — early bird)
- 2 mentions externes (Reddit upvote, Twitter retweet)

---

## Semaine 7 — Premier soft launch payant

**Objectif** : Activer le pricing et convertir les premiers payants.

### Tâches techniques
- [ ] Intègre **Stripe** (subscription Pro $24/mo + Premium $49/mo)
- [ ] Crée page `/pricing` claire avec comparison tier-by-tier
- [ ] Implémente le **gating** : Free = 1 PropFirm, Pro = illimité, Premium = + sync API (à venir)
- [ ] Email aux beta users : *"Quantara devient payant le X — early bird $19/mo lifetime à vie"*

### Pricing strategy semaine 7-8
- Beta users : **$19/mo locked-in à vie** (early bird offer, 14 jours seulement)
- Nouveaux signups après J+14 : pricing standard $24/mo

### KPIs S7
- 15-25 paid users (beta convertis)
- 1ère vraie revenue : ~$300-500 MRR

---

## Semaine 8 — Préparation Product Hunt

**Objectif** : Tout est prêt pour le Big Launch.

### Pré-launch checklist
- [ ] Profil Product Hunt complet : @quantara_app
- [ ] Crée **Maker Page** (bio, photo, lien Twitter/site)
- [ ] Prépare assets PH :
  - Logo 240x240
  - Gallery 5 screenshots haute qualité
  - 1 vidéo démo 60-90 sec
  - Tagline accrocheur (60 chars max) : "The PropFirm trading journal that knows your firm's rules"
  - Description complète (260 chars)
  - Top 5 features avec emojis
- [ ] Recrute 30+ "hunters" (network) qui upvoteront le jour J
- [ ] Prépare 5 réponses pré-écrites aux questions FAQ
- [ ] Schedule launch pour **Mardi suivant 00:01 PST** (best day for futures/finance niche)

### Communauté warm-up
- [ ] Email aux 200 free users : *"Big launch Product Hunt mardi — soutenez-nous !"*
- [ ] Twitter teaser : *"Launching on Product Hunt next Tuesday 🚀"*

### KPIs M2
- ✅ 200 free users total
- ✅ 20-25 paid users
- ✅ MRR ~$500
- ✅ 5 articles publiés
- ✅ 1 vidéo YouTube
- ✅ Stripe live
- ✅ PH launch prêt

**🎯 Fin M2 : Communauté lancée, premiers revenus, Product Hunt ready.**

---

# 🚀 MOIS 3 — Public Launch (Semaines 9-12)

## Semaine 9 — Product Hunt Day

**Objectif** : Top 5 of the day sur Product Hunt → 500+ visiteurs gratuits.

### Mardi (Launch Day)
- **00:01 PST** : Launch sur Product Hunt
- **06:00 EST (12:00 Paris)** : Email à toute la liste pour upvote
- **08:00 EST** : Post Reddit r/SideProject, r/EntrepreneurRideAlong, r/Daytrading
- **09:00 EST** : Twitter thread + tag les hunters de ton réseau
- **Toute la journée** : réponds à tous les commentaires PH dans les 5 min
- **18:00 EST** : Update Discord/Twitter sur le ranking

### Stretch goals
- Top 10 of the day = 500+ visiteurs
- Top 5 = 1000-2000 visiteurs
- #1 = 5000+ visiteurs (rare mais possible avec niche bien ciblée)

### Mercredi-Jeudi
- [ ] Capitalise momentum : reposte sur tous les canaux
- [ ] Email aux nouveaux signups dans les 24h ("Welcome, here's how to start")
- [ ] Engage tous les commentaires/questions

### KPIs S9
- 500 free users total (dans les 7 jours)
- 50 paid users
- $1500 MRR

---

## Semaine 10 — Capitalize & content

**Objectif** : Convertir le rush PH en growth durable.

- [ ] Publie blog post #5 : *"What we learned from our Product Hunt launch"* (storytelling, marche bien sur Twitter/HN)
- [ ] Soumet à **Hacker News** (catégorie "Show HN")
- [ ] Soumet à **Indie Hackers**
- [ ] Article sur **Medium** + reposts
- [ ] Vidéo YouTube #2 : *"Quantara 30-day update : what users are saying"*

---

## Semaine 11 — Premium tier launch

**Objectif** : Activer Premium $49 + intégration ProjectX.

### Si l'intégration ProjectX est ready
- [ ] Push intégration ProjectX en prod (Topstep, TPT, Tradeify, MFFU sync auto)
- [ ] Update site : "🆕 Auto-sync now live"
- [ ] Email blast à tous les users : *"Stop saisir tes trades manuellement"*
- [ ] Convert 30% des Pro vers Premium ($49)

### Si pas encore ready
- [ ] Push **roadmap publique** sur /roadmap (transparence)
- [ ] Annonce le Premium tier comme "Sync auto coming Q4 2026"
- [ ] Préinscription waiting list

---

## Semaine 12 — Bilan & roadmap Q2

**Objectif** : Stabilize + plan next 90 days.

### Bilan honnête
- [ ] Compile metrics dans 1 dashboard (Plausible + Stripe + Supabase)
- [ ] Email aux users : *"3 mois après le launch — voici nos chiffres et la roadmap"*
- [ ] Update business plan avec real numbers

### Plan Q2
- [ ] Définis 3 objectifs trimestriels max (ex: 1500 users, 100 paid, ProjectX live)
- [ ] Recrute 1 community manager freelance ($500-1500/mo) si MRR > $3K

### KPIs M3
- ✅ 500-700 free users
- ✅ 50-80 paid users
- ✅ MRR $1500-2500
- ✅ Product Hunt launched
- ✅ ProjectX integration en route
- ✅ 5 blog posts + 2 vidéos YouTube
- ✅ Newsletter hebdo établie

---

# 📊 Synthèse — KPIs cibles à J+90

| Métrique | Objectif | Stretch |
|---|---|---|
| Free users | 500 | 1000 |
| Paid users | 30 | 80 |
| MRR | $750 | $2500 |
| Témoignages écrits | 10 | 25 |
| Blog posts publiés | 5 | 10 |
| Vidéos YouTube | 1 | 4 |
| Reddit followers | 100 | 500 |
| Twitter/X followers | 200 | 1000 |
| Discord membres | 100 | 500 |
| Product Hunt rank | Top 10 | Top 5 |

---

## 🛠️ Stack outils (tous gratuits ou peu chers)

| Besoin | Outil | Prix |
|---|---|---|
| LLC formation | Doola | $297 + $50/an |
| Domaine | Cloudflare Registrar | $10/an |
| Email forwarding | Cloudflare Email Routing | Gratuit |
| SMTP outbound | Brevo | Gratuit (300/jour) |
| Banque US | Mercury | Gratuit |
| Paiements | Stripe | 2.9% + $0.30 |
| Hébergement | Vercel + Supabase | Gratuit en M1-3 |
| Email marketing | Loops.so / Resend | Gratuit < 1000 contacts |
| Analytics | Plausible / Umami | $9/mo ou self-host |
| Monitoring | Sentry | Gratuit < 5K erreurs |
| Project mgmt | Notion (perso) | Gratuit |
| Community | Discord | Gratuit |
| Vidéo edit | DaVinci Resolve / Capcut | Gratuit |
| Screenshots | TinyPNG | Gratuit |
| **Total mensuel M1-3** | | **~$30-50/mo** |

---

## ⚠️ Pièges à éviter

1. **Procrastination via "perfect product"** — lance même imparfait, itère vite
2. **Spam Reddit/Discord** — donne 3x plus de valeur que tu ne demandes
3. **Pricing trop bas** — $9/mo attire les wrong customers, $24-49 segmente bien
4. **Burnout M2** — quand l'engagement plateau, c'est normal. Continue.
5. **Vouloir tout faire seul Year 2** — embauche un freelance dès $3K MRR
6. **Ignorer les feedback négatifs** — ils sont les plus précieux

---

## 🎯 Ta routine quotidienne idéale

**Matin (1h)** :
- 30 min : engagement Reddit/Twitter/Discord
- 30 min : répondre emails users + support

**Après-midi (varie selon planning) — viser 2-3h dev/contenu** :
- Bug fixes prioritaires
- Nouvelle feature en cours
- Content writing (1 article tous les 7-10 jours)

**Soir (30 min)** :
- Réponses DMs créateurs
- Engagement Discord prime time

**Weekend** :
- Vidéo YouTube ou contenu long-form
- Outreach créateurs (DM personnalisés)
- Reflection / planification semaine suivante

**Total** : ~20-25h/semaine. Tenable sur 12-18 mois.

---

## 📞 Si bloqué

- **Marketing/acquisition** : @ARRR (Mark Roberge book "The Sales Acceleration Formula")
- **Pricing** : @PatrickCampbell ProfitWell content
- **Bootstrap solo SaaS** : @arvidkahl podcast "The Bootstrapped Founder"
- **PropFirm trader insights** : reddit r/Apexevaluation, Discord Apex officiel

---

_Plan vivant — révise ce doc tous les 30 jours. Adapte selon retours réels._
