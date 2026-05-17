# 🚀 Pré-launch Checklist Quantara

> Coche au fur et à mesure. Ne passe à la phase suivante que si les critères "go / no-go" sont remplis.

---

## 🔴 PHASE 0 — Cette semaine (2-3 jours)

**Objectif** : zéro bug critique, monitoring en place, prêt pour beta privée.

### ✅ Test end-to-end toi-même (1 demi-journée)

Fais ça **comme un nouvel user**, depuis une fenêtre privée :

- [ ] Signup avec une nouvelle adresse email (Gmail + Outlook + ProtonMail)
- [ ] Email de confirmation arrive **dans la boîte de réception** (pas le spam)
- [ ] Clic le lien → arrive sur `/app`
- [ ] OnboardingModal s'affiche → choisir "Tutoriel interactif"
- [ ] Termine le tutoriel complet (créer firme → compte → trade → payout → financé)
- [ ] Test mode 📅 Mensuel : créer compte → modifier `buy_date` à `-31j` en base → reload → `months_count` se bump à 2
- [ ] Test mode 💎 One-time : pas de mensualités, pas de frais activation au promote
- [ ] Test bulk creation : 5 comptes en 1 coup, vérifier l'auto-numérotage
- [ ] Test renommage au passage Financé (`test-001` → `Pro-001`)
- [ ] Test "J'ai échoué" → modal motivation avec message random
- [ ] Test calendrier : mensualités visibles aux bonnes dates
- [ ] Test USD natif → vérifier qu'AUCUN endroit n'affiche `€`
- [ ] Test EUR mode → tout en `€`
- [ ] Forgot password → reset → reconnexion
- [ ] Stay logged in : fermer browser, rouvrir, doit rester connecté
- [ ] Sans Stay logged in : fermer browser, rouvrir, doit demander re-login
- [ ] Test admin : créer annonce → se déconnecter → se connecter avec autre compte → annonce visible
- [ ] Test admin : voir liste users, supprimer un user test
- [ ] Test sur mobile (Chrome DevTools > iPhone SE 375px minimum)
- [ ] Test sur Safari (si Mac/iPhone disponible)
- [ ] Test reset compteur jours validés après payout

### 🛡 Setup monitoring Sentry (1h)

- [ ] Crée compte **Sentry.io** (gratuit, 5k events/mois)
- [ ] Run dans le projet : `npx @sentry/wizard@latest -i nextjs`
- [ ] Suis le wizard interactif
- [ ] Force une erreur pour test : `throw new Error('Sentry test')` quelque part
- [ ] Vérifie qu'elle apparaît dans Sentry ✓
- [ ] Supprime l'erreur test
- [ ] Active les alertes email pour les nouvelles erreurs

### 📊 Setup analytics (30 min)

- [ ] Crée compte **Plausible.io** (€9/mois) OU **PostHog** (gratuit jusqu'à 1M events/mois)
- [ ] Ajoute le script dans `app/layout.js`
- [ ] Visite ton site → vérifie qu'une visite est trackée
- [ ] (PostHog seulement) Track events custom : `signup`, `add_firm`, `add_trade`, `add_payout`, `promote_to_funded`, `fail_account`

### 📧 Email deliverability (15 min)

- [ ] Va sur **mail-tester.com**
- [ ] Copie l'adresse temporaire qu'ils te donnent
- [ ] Déclenche un signup Quantara avec cette adresse
- [ ] Reçois le mail → reviens sur mail-tester.com → check score
- [ ] **Doit être ≥ 9/10**
- [ ] Si < 8/10 : vérifie SPF, DKIM, DMARC dans tes DNS Vercel/Cloudflare
- [ ] Re-test depuis Gmail, Outlook, ProtonMail, iCloud

### 💾 Backups Supabase (10 min)

- [ ] Supabase Dashboard → Database → **Backups**
- [ ] Si plan Free : active backups manuels quotidiens, télécharge un dump initial
- [ ] Si plan Pro ($25/mois) : active **Point-in-time recovery** ← **fortement recommandé pour la prod**

### 🔒 Audit RLS Supabase (1h, vital)

Crée 2 comptes test (A et B) et vérifie qu'aucune donnée ne fuit :

- [ ] `firms` : user B ne voit pas les firms de user A
- [ ] `accounts` : pareil
- [ ] `payouts` : pareil
- [ ] `journal_entries` : pareil
- [ ] `certificates` : pareil
- [ ] `announcements` : déjà fixé ✓ (re-vérifier)
- [ ] `propfirm_rules` : lecture publique OK, écriture admin only

### 📨 Vérifier templates emails Supabase (15 min)

- [ ] Supabase → Auth → Email Templates
- [ ] "Confirm signup" : branding Quantara, FR, lien correct
- [ ] "Reset password" : pareil
- [ ] "Magic link" : pareil
- [ ] Sender name : "Quantara" et pas "Supabase"

---

## 🟡 PHASE 1 — Beta privée (semaine 2-3)

**Objectif** : 10-20 users actifs te donnent du feedback réel.

### 👥 Recrutement (2 jours)

- [ ] Liste 30 personnes potentielles (Discord trading FR, Twitter X PropFirm, forums)
- [ ] Crée un **Google Form** simple : email, expérience PropFirm (Y/N), firmes utilisées
- [ ] DM personnalisé style : *"Salut [prénom], je lance Quantara, un journal pour les traders PropFirm futures. Tu veux tester gratuitement et me donner ton avis ? Compte Pro offert à vie pour les beta testeurs 🙏"*
- [ ] Objectif : **10 testeurs actifs** (pas juste 50 inscrits qui font rien)

### 💬 Communication (30 min)

- [ ] Crée serveur Discord Quantara avec channels :
  - `#welcome` (règles, présentation)
  - `#annonces` (tes updates)
  - `#bugs` (reports)
  - `#suggestions` (feature requests)
  - `#questions` (support)
  - `#feedback-libre`
- [ ] Invite les beta testeurs

### 📋 Tracking feedback (continu)

- [ ] Outil au choix : **Linear** (gratuit) ou **GitHub Issues** ou Notion
- [ ] Catégorise chaque report : 🔴 Bloquant / 🟡 Important / 🟢 Nice-to-have
- [ ] Update les testeurs hebdomadairement : *"Cette semaine on a fix X, Y, Z grâce à vos retours 🙏"*

### 📈 Métriques à surveiller

- [ ] Signups / jour
- [ ] % qui activent leur email (clic le lien de confirmation)
- [ ] % qui créent leur 1ère firme dans les 24h
- [ ] % qui loggent leur 1er trade dans les 7j
- [ ] Drop-off à chaque étape de l'entonnoir

---

## 🟢 PHASE 2 — Launch public gratuit (semaine 4-5)

**Objectif** : 100+ signups en 1 semaine, validation du marché.

### 🐛 Polish post-beta (3-4 jours)

- [ ] Fix **100% des bugs 🔴 Bloquants**
- [ ] Fix **70% des 🟡 Importants**
- [ ] Implémente les **top 3 suggestions 🟢**
- [ ] STOP les nouvelles features sinon launch reporté indéfiniment

### 🎨 Préparation marketing (2 jours)

- [ ] Capture HD du dashboard (1920x1080, dark mode propre, données fictives réalistes)
- [ ] Vidéo démo 60-90s :
  - **Loom** (gratuit, simple) ou OBS
  - Script : intro 5s → problème 10s → solution Quantara 30s → demo features 30s → CTA 5s
- [ ] Tagline punchy : *"Le journal de trading futures pensé pour les traders PropFirm. Drawdown trailing, profit split, payouts — tout est tracké automatiquement."*
- [ ] Crée 3 visuels Twitter (1200x675px)
- [ ] Crée une OpenGraph image pour le partage (1200x630)
- [ ] Vérifie SEO : `<title>`, `<meta description>`, `og:image` dans landing page

### 📢 Plateformes de launch (1 jour)

- [ ] **Product Hunt** : schedule un mardi à 12:01 PST (la prime time)
  - Maker comment préparé d'avance
  - 10-20 amis briefés pour upvoter dans les premières heures (CRITIQUE)
- [ ] **BetaList** (gratuit ou $129 fast-track) : submit
- [ ] **Indie Hackers** : post "I just launched..."
- [ ] **HackerNews** : "Show HN: Quantara — trading journal for PropFirm futures traders"
- [ ] **Reddit** un dimanche 14h-17h CET :
  - r/Daytrading (1M+ members)
  - r/FuturesTrading
  - r/Trading (FR)
  - r/PropFirm (si existe)
  - ⚠️ **Lis les règles de chaque sub avant de poster sinon ban instant**

### 🐦 Réseaux sociaux (continu)

- [ ] Crée compte Twitter X **@quantara_app**
- [ ] Thread de launch épique
- [ ] LinkedIn post pro
- [ ] Contact 3-5 YouTubers PropFirm pour partenariat (DM polis, propose un mois Pro gratuit + commission affiliée si tu as Stripe)

### 🆘 Support (1h)

- [ ] Page `/contact` simple avec mailto:support@quantara.tech
- [ ] Section FAQ sur landing (5-10 questions)
- [ ] Vérifie que support@quantara.tech est monitoré (notification phone)

---

## 🔵 PHASE 3 — Monétisation (semaine 6-8, SI traction)

**Critère** : ne lance pas Pro tant que tu n'as pas :

- [ ] 100+ signups
- [ ] 30+ users actifs (logguent ≥ 1 trade par semaine)
- [ ] 5+ users qui te DM spontanément "je payerais pour ça"

### 💳 Stripe integration (1 semaine)

- [ ] Crée compte Stripe (validation 1-3 jours, demande EIN et US bank account)
- [ ] Définis 2 plans :
  - **Free** : 1 PropFirm, 100 trades/mois, 1 compte max, pas de bulk
  - **Pro** : illimité tout + bulk + support prioritaire + features futures = **$12/mois** ou **$99/an** (économie de 30%)
- [ ] Intègre Stripe Checkout
- [ ] Webhook `/api/stripe/webhook` → met à jour `users.plan` dans Supabase
- [ ] Page `/pricing` claire avec tableau comparatif
- [ ] Settings user : "Mon abonnement" avec lien vers Stripe Customer Portal

### 📨 Communication transitoire

- [ ] Email "Nous lançons Pro 🎉" aux users existants
- [ ] **Promo lancement** : -50% premiers 3 mois OU **lifetime $99** pour les 100 premiers
- [ ] Update CGU avec conditions de paiement / refund (14 jours satisfait ou remboursé)

---

## ⚖️ PHASE 4 — Légal & business (en continu, démarrer ASAP)

**Critique** : avant de prendre $1, ces choses doivent exister.

### 🏛 LLC & business

- [ ] **LLC Texas** formée et active (utilise **Northwest Registered Agent** ou **LegalZoom**, ~$300)
- [ ] **EIN** obtenu (IRS, gratuit, fait online en 15 min après LLC)
- [ ] **Compte bancaire business** ouvert :
  - **Mercury** (recommandé pour startups US, accessible aux non-résidents)
  - Wise Business
  - Relay Financial
- [ ] **Stripe** lié à ton compte business
- [ ] Trouve un **comptable Texas** (CPA, ~$500-1500/an)
- [ ] Trouve un **registered agent** au Texas (obligatoire, ~$100/an)

### 📜 CGU / Privacy validés

- [ ] Avocat US (Texas) review CGU et Privacy → ~$500-1000
- [ ] Endpoint `/api/user/export-data` (RGPD article 20 — droit à la portabilité)
- [ ] Endpoint `/api/user/delete-account` self-service (RGPD article 17 — droit à l'oubli)
- [ ] **Cookie banner** si tu utilises analytics non-essentiels (Plausible n'en a pas besoin, PostHog si)
- [ ] Bouton "Désinscrire" dans tous les emails marketing

### 📋 Compliance ongoing

- [ ] Annual Public Information Report Texas (chaque année avant le 15 mai)
- [ ] Federal taxes : forme 1040-SS ou 1120 selon ton statut
- [ ] Sales tax si tu vends à des résidents US (variable selon state, complexe)

---

## 🎯 Récap chronologique

| Semaine | Phase | Objectif |
|---------|-------|----------|
| **1** | 🔴 Phase 0 | Tests E2E + monitoring + backups |
| **2-3** | 🟡 Phase 1 | Beta privée 10 users |
| **4-5** | 🟢 Phase 2 | Launch public gratuit |
| **6-8** | 🔵 Phase 3 | Monétisation si traction |
| **continu** | ⚖️ Phase 4 | LLC, légal, compta |

---

## 🚦 Critères "go / no-go" entre phases

| Transition | Critère pour passer |
|------------|---------------------|
| Phase 0 → Phase 1 | Zero bug bloquant, Sentry installé, monitoring OK |
| Phase 1 → Phase 2 | 10 beta users qui disent "c'est utile, je continue" |
| Phase 2 → Phase 3 | 100+ signups, 30+ actifs, 5+ users veulent payer |
| Phase 3 → croissance | MRR atteint $500/mois → vrai business |

---

## 💡 Conseils bonus

🔥 **Ne reste pas bloqué sur Phase 0 trop longtemps.** L'objectif n'est pas la perfection mais "pas de bug bloquant + monitoring qui te dit si ça part en vrille". 2-3 jours max.

🔥 **Les beta testeurs sont de l'or.** Réponds à CHAQUE message dans les 24h. Implémente leurs suggestions visibles → ils deviennent des évangélistes.

🔥 **Product Hunt n'est PAS magique.** Sans préparation (followers, hunters, comm) tu fais 50 upvotes max. Mais c'est gratuit donc à faire quand même.

🔥 **Ton vrai growth va venir des YouTubers PropFirm.** Une seule vidéo "Le meilleur journal pour traders PropFirm" sur une chaîne avec 50k abonnés = 500-2000 signups potentiels.

🔥 **Mesure tout.** Sans data tu navigues à l'aveugle. PostHog + Sentry = ton tableau de bord pilote.

🔥 **N'arrête pas en Phase 1.** Beaucoup d'indie hackers s'arrêtent après la beta parce que c'est "ennuyeux". C'est là que se construit le vrai produit. Persiste.

🔥 **Tracke ton temps.** Note combien d'heures tu passes par phase. Tu verras où sont les vrais coûts cachés (souvent : support client + bug fix imprévus).

---

## 📊 Métriques à tracker dans Plausible/PostHog

### KPIs immédiats (Phase 0-1)
- Uptime (Vercel dashboard)
- Erreurs Sentry / jour (objectif : < 5)
- Time to first action (signup → 1ère firme créée)

### KPIs Phase 1-2
- Signups / jour
- Activation rate (% de signups qui font 1 action)
- DAU/MAU ratio (objectif : > 20%)
- Retention J1, J7, J30

### KPIs Phase 3
- MRR (Monthly Recurring Revenue)
- Conversion rate Free → Pro (objectif : > 3%)
- Churn rate mensuel (objectif : < 5%)
- LTV / CAC ratio (objectif : > 3)

---

*Dernière update : 2026-05-13 — checklist générée par Claude pour Quantara*
