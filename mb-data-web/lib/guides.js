// Editorial guides (Phase 3.3 — SEO content engine).
// Each guide is a long-form educational article targeting a specific PropFirm
// futures keyword cluster. Source of truth for /guides/[slug] pages.
//
// Adding a new guide :
//  - Add an entry to GUIDES (slug → guide object)
//  - The route /guides/[slug] is generated automatically via generateStaticParams
//  - Sitemap is updated automatically via getAllGuideSlugs()

// section type: { heading: string, body: string|string[], list?: string[], list_ordered?: boolean }
// FAQ : { q: string, a: string }
export const GUIDES = {
  'trailing-drawdown': {
    title: 'Qu\'est-ce que le trailing drawdown en PropFirm futures ?',
    description: 'Trailing drawdown expliqué : EOD vs Intraday, mécanique, lock au balance initial, exemples Topstep/Apex/MFFU. Guide complet 2026.',
    h1: 'Trailing drawdown PropFirm : tout ce qu\'il faut savoir en 2026',
    category: 'Risk management',
    updatedDate: '2026-05-01',
    readingTime: 7,
    relatedFirms: ['Topstep', 'Apex Trader Funding', 'My Funded Futures'],
    relatedGuides: ['eod-vs-intraday-drawdown', 'consistency-rule', 'payout-methods-propfirm'],
    intro: `Le trailing drawdown est LE concept central des PropFirm futures. C'est la mécanique qui détermine si ton compte survit ou s'évanouit après une session difficile. Pourtant, c'est aussi le concept le plus mal compris par les nouveaux traders : EOD, intraday, lock au balance, peak balance... Chaque firm a sa propre variante, et confondre les deux peut te coûter ton compte. Ce guide explique tout — la mécanique, les variantes, les firms qui utilisent quoi, et comment t'adapter selon ton style.`,
    sections: [
      {
        heading: 'Définition : qu\'est-ce que le trailing drawdown ?',
        body: [
          `Le trailing drawdown (DD trailing) est un seuil de perte qui SUIT la balance maximale de ton compte. Quand ta balance monte, le seuil monte avec elle. Quand ta balance redescend, le seuil reste où il est — il ne redescend jamais. Si ton compte touche ce seuil, le compte est failli (liquidation forcée).`,
          `Exemple : tu commences avec un compte 50K et un trailing DD de $2,500. Ton seuil de fail démarre à $47,500. Tu fais +$3,000 → balance à $53,000. Le seuil monte à $50,500. Tu redescends à $51,000 ? Le seuil reste à $50,500 — pas à $48,500. Si tu touches $50,500, c'est fini.`,
        ],
      },
      {
        heading: 'EOD vs Intraday : la différence critique',
        body: `Il existe deux variantes principales du trailing drawdown. Comprendre laquelle utilise ta firm est ESSENTIEL avant de prendre ton premier trade.`,
        list: [
          `EOD (End-of-Day) trailing : Le seuil ne se recalcule qu'à la clôture de la session. Pendant la journée, ton drawdown intraday peut être brutal sans déclencher de fail tant que tu reviens au-dessus du seuil au close.`,
          `Intraday trailing : Le seuil se recalcule tick par tick pendant la session. Un retournement intraday peut déclencher le fail même si tu finis la journée bien au-dessus du seuil.`,
        ],
      },
      {
        heading: 'Quelles PropFirms utilisent quoi ?',
        body: `Voici la map à jour en mai 2026 :`,
        list: [
          `EOD only : Topstep, Tradeify (drawdown calculé uniquement à la clôture — plus indulgent intraday)`,
          `Intraday trailing : Apex Trader Funding, Lucid Trading, FuturesELites (tick-by-tick — plus exigeant)`,
          `Trailing avec cap : My Funded Futures (trailing classique mais STOPPE au starting balance — hybride)`,
          `Static (no trailing) : Lucid Static, certaines variantes Bulenox (drawdown fixe, ne suit jamais le peak)`,
        ],
      },
      {
        heading: 'Le lock au starting balance',
        body: [
          `Sur la plupart des firms (Topstep, MFFU, certaines Apex), une fois que ta balance dépasse le starting balance, le trailing s'arrête définitivement. Le seuil de fail se lock au starting balance et n'évolue plus jamais.`,
          `Concrètement : compte 50K, DD $2,500. Si tu atteins +$2,500 (balance $52,500), le seuil monte à $50,000 puis se lock. À partir de là, peu importe combien tu fais, ton risque max c'est de redescendre à $50,000 — pas de descente continue du seuil.`,
          `Cette mécanique change tout : avant le lock, tu joues pour grimper. Après le lock, tu joues pour ne pas redescendre. La psychologie est totalement différente.`,
        ],
      },
      {
        heading: 'Comment ne pas tuer son compte au trailing DD',
        body: `Quatre règles qu'on voit revenir chez les traders funded qui survivent :`,
        list: [
          `Connaître ton seuil en permanence — ouvre Quantara avant chaque session, regarde ta room de drawdown actuelle.`,
          `Couper plus tôt sur intraday — si tu trades une firm intraday (Apex, Lucid), un stop large est mortel. Réduis ta taille de 30-50% vs ce que tu prendrais en EOD.`,
          `Ne JAMAIS pyramidiser près du seuil — tu doubles ton risque exactement au moment où tu peux te le permettre le moins.`,
          `Stopper le trade du jour si tu touches -50% de ta room — sinon tu vas tilt et le -70% suit le -50%, toujours.`,
        ],
      },
      {
        heading: 'Le rôle de Quantara dans le tracking du trailing DD',
        body: `Quantara calcule automatiquement ton peak balance, ton seuil actuel, et ta room en temps réel, pour chacune de tes PropFirms. Pas besoin d'aller checker dans le dashboard de la firm : tu vois tes 5-10 comptes en un coup d'œil, avec un code couleur (vert > 70%, ambre 50-70%, rouge < 50%). Le Drawdown Guardian envoie même un push si un compte descend sous 70%.`,
      },
    ],
    faqs: [
      {
        q: 'Le trailing drawdown se reset après un payout ?',
        a: 'Non. Le seuil de fail ne redescend jamais. Un payout réduit ta balance, ce qui peut te rapprocher du seuil — c\'est pour ça que la plupart des firms imposent une "Min Payout Balance" : la balance après payout doit rester au-dessus d\'un certain niveau.',
      },
      {
        q: 'Quelle firm a le drawdown le plus indulgent ?',
        a: 'Pour intraday, c\'est clairement Topstep et Tradeify (EOD only, pas de tick-by-tick). Pour stabilité globale, c\'est MFFU (trailing qui stoppe au starting balance). À éviter si tu débutes : Apex et Lucid en mode trailing intraday.',
      },
      {
        q: 'Comment fonctionne le trailing pendant un week-end ou un jour férié ?',
        a: 'Le trailing ne bouge pas — il ne se recalcule que sur les sessions de trading actives. Un compte qui finit vendredi à $52,000 reprend lundi avec le même seuil.',
      },
    ],
  },

  'eod-vs-intraday-drawdown': {
    title: 'EOD vs Intraday drawdown : lequel choisir en 2026 ?',
    description: 'Drawdown EOD ou Intraday ? Comparatif complet, exemples chiffrés, firms qui utilisent quoi. Le bon choix selon ton style de trading.',
    h1: 'EOD vs Intraday drawdown : comparatif 2026',
    category: 'Risk management',
    updatedDate: '2026-05-01',
    readingTime: 6,
    relatedFirms: ['Topstep', 'Apex Trader Funding', 'Tradeify', 'Lucid Trading'],
    relatedGuides: ['trailing-drawdown', 'consistency-rule'],
    intro: `Le type de drawdown que ta PropFirm applique est l'arbitrage le plus important pour ton style de trading. EOD (End-of-Day) ou Intraday : derrière ces deux acronymes se cachent des philosophies opposées du risk management. Choisir une firm qui ne match pas ton style, c'est échouer en boucle sans comprendre pourquoi. Ce guide t'explique la différence concrète, chiffres à l'appui.`,
    sections: [
      {
        heading: 'Définition courte',
        body: `EOD (End-of-Day) drawdown : le seuil de fail ne se met à jour qu'à la clôture quotidienne. Intraday drawdown : le seuil se met à jour en continu pendant la session, tick par tick.`,
      },
      {
        heading: 'Exemple concret : la même journée, deux issues différentes',
        body: [
          `Imagine un compte 50K avec un drawdown trailing de $2,500. Ton seuil de fail démarre à $47,500. Tu prends un trade SHORT sur ES à 9:30, qui passe immédiatement à -$3,000 (balance à $47,000), puis revient à +$2,000 (balance à $52,000) avant le close.`,
          `En firm EOD (Topstep, Tradeify) : le seuil de fail est calculé à 4:00 PM ET. À ce moment ta balance est $52,000, au-dessus du seuil de $47,500 → pas de fail. Le seuil monte à $49,500 pour le lendemain.`,
          `En firm Intraday (Apex, Lucid) : à 9:30, ton balance touche $47,000. C'est sous le seuil de $47,500 → fail immédiat. Compte mort. Le fait que tu sois revenu à $52,000 ne change rien.`,
        ],
      },
      {
        heading: 'Quel style va avec quoi ?',
        body: `Le choix dépend principalement de ton timeframe de stop et de ta tolérance au heat intraday.`,
        list: [
          `EOD = bon pour : swing intraday, traders qui aiment laisser respirer leurs trades, scalpeurs sur news, ou ceux qui prennent des positions plus larges en risk-on (parce que le heat ne casse rien).`,
          `Intraday = bon pour : scalpeurs très serrés (stops < 0.5% du compte), traders mécaniques avec stops auto, traders qui sortent dès que la thèse change. Pas adapté si tu reverses tes positions ou si tu ajoutes en perte.`,
        ],
      },
      {
        heading: 'Comparatif des firms par type de drawdown',
        body: `Voici la liste à jour en mai 2026 :`,
        list: [
          `EOD only : Topstep (MLL EOD, lock au starting balance), Tradeify (EOD pur)`,
          `Intraday trailing : Apex Trader Funding (tick-by-tick), Lucid Trading (option standard), FuturesELites`,
          `Hybride (intraday avec cap) : My Funded Futures (trailing intraday qui stoppe au starting balance — moins agressif qu'Apex)`,
          `Static (no trailing) : Lucid Static (drawdown fixe), certains plans Bulenox`,
        ],
      },
      {
        heading: 'Le piège du switch EOD → Intraday',
        body: [
          `Une erreur courante : passer une évaluation Topstep (EOD), puis ouvrir un compte Apex (intraday) en utilisant la même stratégie. Les stops larges qui marchaient en EOD vont tuer le compte Apex.`,
          `Avant de changer de firm, adapte ton sizing. Règle de pouce : sur firm intraday, réduis ta taille de 30 à 50% par rapport à ce que tu prendrais en EOD, pour le même setup.`,
        ],
      },
      {
        heading: 'Comment trade-off entre les deux',
        body: `Beaucoup de traders confirmés diversifient : 1-2 comptes en EOD (Topstep + Tradeify) pour les gros setups + 1-2 comptes en intraday (Apex) pour le scalping serré. Quantara permet de tracker les deux types dans un seul dashboard, avec un calcul automatique du drawdown spécifique à chaque firm.`,
      },
    ],
    faqs: [
      {
        q: 'Le drawdown EOD est-il toujours plus avantageux ?',
        a: 'Non — pas si tu trades très court. En EOD, le seuil monte plus lentement (un EOD high par jour vs plusieurs ticks par jour). Si tu fais beaucoup de petites scalps gagnantes, l\'intraday peut faire monter ton seuil plus vite et te donner plus de room.',
      },
      {
        q: 'Y a-t-il des firms qui mixent EOD et intraday ?',
        a: 'Oui. MFFU est trailing intraday mais le seuil stoppe sa progression au starting balance — donc effet "EOD-like" une fois que tu es au break-even. Topstep XFA a aussi sa propre mécanique avec un starting balance à $0 sur le funded account.',
      },
      {
        q: 'Quel type de drawdown pour débuter ?',
        a: 'EOD (Topstep ou Tradeify). C\'est plus indulgent, ça pardonne les erreurs intraday, et ça permet de prendre des heat sans paniquer. Une fois confirmé, tu peux ajouter de l\'intraday pour scaler.',
      },
    ],
  },

  'consistency-rule': {
    title: 'Consistency rule en PropFirm : comprendre la règle des 40-50%',
    description: 'Consistency rule expliquée : best day ÷ total profit, 40%, 50%, comment la respecter sur Topstep, Apex, MFFU. Formules et exemples.',
    h1: 'Consistency rule PropFirm : guide complet 2026',
    category: 'Règles',
    updatedDate: '2026-05-01',
    readingTime: 6,
    relatedFirms: ['Topstep', 'Apex Trader Funding', 'My Funded Futures'],
    relatedGuides: ['trailing-drawdown', 'payout-methods-propfirm'],
    intro: `La consistency rule est la règle silencieuse qui tue le plus de comptes funded. Tu passes l'évaluation, tu touches enfin du capital réel, tu fais un gros jour sur NFP... et au moment du payout, la firm rejette ta demande. Pourquoi ? Parce que ton best day représente trop de tes profits totaux. Voici comment la règle marche, firm par firm, et comment ne pas tomber dans le piège.`,
    sections: [
      {
        heading: 'La formule de base',
        body: [
          `Consistency = (Best Day Profit ÷ Total Profit) × 100`,
          `Si une firm impose 40% de consistency, ton best winning day ne doit pas représenter plus de 40% de tes profits totaux. Concrètement : tu as $5,000 de profits totaux. Ton best day est $2,500 ? C'est 50% → tu viole la règle. Il faut que ton best day soit max $2,000 (40% de $5,000).`,
        ],
      },
      {
        heading: 'Les seuils par firm (à jour 2026)',
        body: `Chaque firm a sa propre interprétation. Voici les principales en mai 2026 :`,
        list: [
          `Topstep — Combine : Best Day ÷ Overall Profit ≤ 50% (au passage XFA). Si dépassé : profit target augmente (pas un fail direct).`,
          `Topstep — XFA Consistency : Largest Single-Day Net Profit ÷ Total Net Profit ≤ 40%, min 3 jours.`,
          `Topstep — XFA Standard : AUCUNE règle consistency. Mais 5 winning days ≥ $150 requis.`,
          `Apex 4.0 : consistency 30% sur l'évaluation, levée sur le Performance Account.`,
          `MFFU : consistency 30% sur tous les payouts (interprétation : best day ≤ 30% du profit total).`,
          `Tradeify : pas de consistency rule stricte, mais "responsible trading" évalué.`,
        ],
      },
      {
        heading: 'Pourquoi cette règle existe',
        body: [
          `Les firms ne veulent pas de traders qui font 1 jour énorme sur NFP puis flat le reste du temps. C'est statistiquement de la chance, pas du skill — et c'est souvent les traders qui blowup deux semaines plus tard.`,
          `La consistency rule force à montrer un profil de profits "lisse" : plusieurs jours moyens plutôt qu'un seul jour de king. Une stratégie qui survit à la consistency rule survit aussi mieux sur le long terme.`,
        ],
      },
      {
        heading: 'Stratégies pour respecter la consistency rule',
        body: `Quatre approches qu'on voit chez les traders qui passent leurs payouts sans accroc :`,
        list: [
          `Sortir plus tôt sur les gros jours — si tu as déjà fait +$1,500 et que ta moyenne par jour est $300, ferme la session. Ne pas chercher à doubler.`,
          `Multiplier les sessions modérées — au lieu d'un trade massif par semaine, vise 4-5 sessions à profit modéré pour étaler.`,
          `Tracker la métrique en temps réel — Quantara affiche ton best day actuel ÷ profit total, avec une alerte si tu approches le seuil.`,
          `Attendre un mauvais jour avant de demander un payout — si tu as un jour énorme, attends d'avoir 2-3 jours moyens en plus pour diluer le ratio.`,
        ],
      },
      {
        heading: 'Que se passe-t-il si tu violes la règle ?',
        body: [
          `Selon la firm, deux scénarios :`,
        ],
        list: [
          `Soft violation (Topstep Combine) : Le profit target augmente — tu n'es pas failli, mais tu dois faire plus de profit pour passer.`,
          `Hard violation (la plupart des autres) : Le payout est rejeté ou réduit. Souvent un cap : "best day ne peut pas dépasser X% des profits depuis le dernier payout" → si tu dépasses, le surplus n'est pas payé.`,
        ],
      },
    ],
    faqs: [
      {
        q: 'La consistency rule s\'applique-t-elle après le premier payout ?',
        a: 'Oui, sur la plupart des firms — le calcul "best day ÷ total" se fait sur la période depuis le dernier payout (ou depuis l\'activation du compte si c\'est ton premier).',
      },
      {
        q: 'Comment éviter de violer accidentellement la règle ?',
        a: 'Tracke ton ratio en temps réel. Sur Quantara, la consistency rule de chaque firm est intégrée et tu vois en live ton best day / profit total avec un code couleur (vert < 30%, ambre 30-40%, rouge > 40%).',
      },
      {
        q: 'Les pertes comptent-elles dans le calcul ?',
        a: 'Le numérateur (best day) compte uniquement les jours gagnants. Le dénominateur (total profit) est le net cumulé. Donc oui, les pertes réduisent le dénominateur et empirent ton ratio.',
      },
    ],
  },

  'comment-passer-evaluation-topstep': {
    title: 'Comment passer une évaluation Topstep en 2026 (Combine → XFA → LFA)',
    description: 'Guide complet pour passer la Trading Combine Topstep en 2026 : règles, MLL EOD, consistency, profit target, étapes XFA et LFA.',
    h1: 'Évaluation Topstep 2026 : guide complet Combine → XFA → LFA',
    category: 'Guide PropFirm',
    updatedDate: '2026-05-01',
    readingTime: 9,
    relatedFirms: ['Topstep'],
    relatedGuides: ['trailing-drawdown', 'consistency-rule', 'payout-methods-propfirm'],
    intro: `Topstep est la PropFirm futures historique, mais aussi l'une des plus exigeantes : architecture 3-step (Combine → XFA → LFA), MLL EOD, consistency rule, scaling plan. Beaucoup de traders sous-estiment la complexité et failli en boucle. Ce guide t'explique chaque étape, les pièges, et comment maximiser tes chances de passage en 2026.`,
    sections: [
      {
        heading: 'L\'architecture Topstep en 3 étapes',
        body: `Contrairement à Apex (1 étape) ou Tradeify (Evaluation → Funded direct), Topstep impose 3 étapes consécutives :`,
        list_ordered: true,
        list: [
          `Trading Combine : compte sim payant ($49-$229/mo selon plan + path). Objectif : atteindre le profit target sans casser le MLL ni la DLL.`,
          `Express Funded Account (XFA) : compte sim "post-évaluation" avec $0 de balance starting et un MLL à -$DD. Objectif : 5 winning days ≥ $150 (variante Standard) ou 3 jours @ 40% consistency (variante Consistency).`,
          `Live Funded Account (LFA) : capital réel. Activation via Call Up de la Risk Team, typiquement entre le 3ème et le 5ème payout du XFA.`,
        ],
      },
      {
        heading: 'Étape 1 : La Trading Combine',
        body: `C'est l'évaluation classique. Tu paies un abonnement mensuel, tu trades en sim, tu dois passer un profit target sans casser le MLL.`,
        list: [
          `Profit Target : $3,000 (50K), $6,000 (100K), $9,000 (150K)`,
          `MLL (Maximum Loss Limit) : $2,000 / $3,000 / $4,500 — EOD only, lock au starting balance après passage`,
          `DLL (Daily Loss Limit) : $1,000 / $2,000 / $3,000 — reset chaque session 5:00 PM CT`,
          `Pas de min trading days — tu peux pass en 1 journée si tu fais le profit target`,
          `Consistency : Best Day ÷ Overall ≤ 50% au moment du passage XFA`,
        ],
      },
      {
        heading: 'Étape 2 : L\'Express Funded Account (XFA)',
        body: [
          `Le XFA est THE piège de Topstep. Tu as passé la Combine, tu te dis que tu es financé... mais en fait, tu démarres à $0 de balance avec un MLL à -$DD (négatif). Tu dois faire des winning days SANS toucher le $-DD.`,
          `Deux variantes depuis février 2026 :`,
        ],
        list: [
          `XFA Standard : 5 winning days ≥ $150 de profit net. Pas de consistency rule. Cap payout $5,000 par request (ou 50% du balance, le plus bas).`,
          `XFA Consistency : 3 jours minimum avec 40% consistency (largest single-day / total net profit). Cap payout $6,000 par request.`,
        ],
      },
      {
        heading: 'Étape 3 : Le Live Funded Account (LFA)',
        body: [
          `Le LFA, c'est le saint-graal : capital réel, vrais payouts. Mais l'activation n'est pas automatique. La Risk Team de Topstep review ton XFA pour décider quand tu mérites le LFA (entre le 3ème et le 5ème payout typiquement).`,
          `Critères de review : consistency, risk management, position sizing, products traded, use of stops, payout history, overall behavior.`,
          `LFA starting balance : 20% du cumulatif XFA balance OU $10,000 minimum (le plus haut des deux). Transferts additionnels possibles depuis tes reserves XFA.`,
        ],
      },
      {
        heading: 'Les 5 erreurs qui tuent le plus de Combines Topstep',
        body: ``,
        list_ordered: true,
        list: [
          `Trader overnight — auto-flat à 3:10 PM CT. Si tu oublies, position fermée d'office. Pas un fail mais perte de profit.`,
          `Casser le DLL — $1K/$2K/$3K selon plan. Auto-liquidation du jour, mais pas un fail. Tu reviens demain. Si tu casses DLL 3 fois de suite, c'est qu'il faut revoir ton sizing.`,
          `Casser le MLL EOD — c'est le fail. Beaucoup pensent que le MLL est intraday, ils tradent fort intraday et reviennent au-dessus du seuil au close. Faux : le MLL ne se mesure qu'au close, mais s'il est touché EOD c'est fini.`,
          `Best day trop gros — tu fais +$2,000 en 1 jour sur un compte 50K. Profit target = $3,000. Consistency = $2,000 / $3,000 = 66%. Tu violes les 50%. Tu dois maintenant faire plus de profit pour diluer.`,
          `Réinitialiser une nouvelle Combine quand tu fail — chaque reset = équivalent du mensuel. Sur 100K Standard = $99 supplémentaires.`,
        ],
      },
      {
        heading: 'Standard vs No-Fee Path : lequel choisir ?',
        body: [
          `Topstep propose 2 paths au checkout :`,
        ],
        list: [
          `Standard : moins cher mensuel ($49/$99/$149) MAIS $149 d'activation au passage XFA.`,
          `No Activation Fee : plus cher mensuel ($95/$149/$229) MAIS $0 d'activation.`,
        ],
      },
      {
        heading: 'Combien de temps pour passer ?',
        body: `Statistiquement, un trader profitable passe la Combine en 2-3 semaines en moyenne. Le XFA prend 2-4 semaines de plus (parce que les 5 winning days ≥ $150 ne se font pas tous d'un coup). Total Combine → premier payout LFA : 2-4 mois pour un trader solide.`,
      },
    ],
    faqs: [
      {
        q: 'Peut-on trader Topstep depuis l\'Europe ?',
        a: 'Oui, Topstep accepte les traders internationaux. Les payouts passent par Wise ($0.39 USD/USD, 1-3 jours) ou Wire SWIFT ($30, 5-10 jours). Aeropay et ACH sont réservés aux US.',
      },
      {
        q: 'Faut-il TopstepX ou peut-on utiliser NinjaTrader ?',
        a: 'Pour les nouveaux Combines (à partir de 2025), TopstepX est obligatoire (built on Rithmic). NinjaTrader et Quantower sont grandfathered uniquement pour les anciens comptes.',
      },
      {
        q: 'Que se passe-t-il si je rate la consistency rule de la Combine ?',
        a: 'Tu n\'es pas failli — ton profit target augmente. Tu dois faire plus de profit pour diluer ton best day jusqu\'à atteindre 50%. C\'est l\'équivalent d\'une "punition douce" qui te force à étaler tes gains.',
      },
      {
        q: 'Le copy trading est-il autorisé sur Topstep ?',
        a: 'Le copy trading externe est INTERDIT (multi-account arbitrage, coordinated position aggregation). Le copy entre tes propres comptes Topstep via les outils internes peut être toléré — vérifier la doc officielle pour ton cas exact.',
      },
    ],
  },

  'payout-methods-propfirm': {
    title: 'Méthodes de payout PropFirm 2026 : Wise, ACH, Aeropay, Rise comparés',
    description: 'Comparatif méthodes de payout PropFirm 2026 : Wise vs ACH vs Aeropay vs Rise vs Wire SWIFT. Frais, délais, dispo par firm.',
    h1: 'Méthodes payout PropFirm 2026 : guide complet',
    category: 'Payouts',
    updatedDate: '2026-05-01',
    readingTime: 5,
    relatedFirms: ['Topstep', 'Apex Trader Funding', 'My Funded Futures'],
    relatedGuides: ['consistency-rule', 'trailing-drawdown'],
    intro: `Récupérer ses gains, c'est l'étape qu'on prépare le moins en passant son évaluation. Et pourtant, entre Wise, ACH, Aeropay, Rise et Wire SWIFT, le bon choix peut faire 50-100$ de différence par payout. Voici le comparatif honnête des méthodes en 2026, leurs frais réels et leur disponibilité par PropFirm.`,
    sections: [
      {
        heading: 'Aeropay — la méthode US instant gratuite',
        body: [
          `Aeropay est devenu en 2025 la méthode favorite des firmes pour les payouts US. Instant (quelques minutes), gratuit côté trader, intégré directement aux dashboards PropFirm.`,
          `Dispo chez : Topstep (méthode par défaut), Tradeify, MFFU, Take Profit Trader.`,
          `Inconvénient : US-only. Les comptes bancaires non-US ne peuvent pas recevoir via Aeropay.`,
        ],
      },
      {
        heading: 'Wise — la méthode internationale low-cost',
        body: [
          `Wise (ex-TransferWise) est devenu le standard international. Pour USD/USD, frais ridicules ($0.39 sur Topstep par exemple). Délai 1-3 jours.`,
          `Avantage : taux de change interbancaire (mid-market), pas de marge cachée. Idéal pour les traders FR/EU qui veulent éviter les frais bancaires.`,
          `Dispo chez : Topstep, Apex, Bulenox, MFFU, Tradeify (la plupart des firms l'ont ajouté en 2024-2025).`,
        ],
      },
      {
        heading: 'ACH — US classique, frais modérés',
        body: [
          `ACH (Automated Clearing House) reste utilisé pour les payouts US plus larges. Frais $30 chez Topstep, 1-3 jours de délai.`,
          `Préféré quand le payout dépasse les caps Aeropay (rare mais existe).`,
        ],
      },
      {
        heading: 'Rise — l\'alternative internationale émergente',
        body: [
          `Rise (anciennement Bitwage) est devenu une alternative populaire pour les firms européennes et les traders qui veulent du crypto en option. Frais faibles, délais comparables à Wise.`,
          `Dispo chez : Bulenox, Alpha Futures, Apex (en option).`,
        ],
      },
      {
        heading: 'Wire SWIFT — la méthode lourde mais universelle',
        body: [
          `Wire SWIFT, c'est le virement bancaire international classique. $30 de frais côté firm + frais bancaires intermédiaires (souvent $15-30 prélevés en route). Délai 5-10 jours.`,
          `À utiliser uniquement si rien d'autre ne marche pour ton pays.`,
        ],
      },
      {
        heading: 'Comparatif rapide',
        body: `Voici un récap pour choisir vite :`,
        list: [
          `Vous êtes US, payout < $5K → Aeropay, gratuit et instant.`,
          `Vous êtes EU/international, USD/USD → Wise, ~$0.40 de frais.`,
          `Vous voulez du crypto/multi-currency → Rise.`,
          `Tout le reste a échoué → Wire SWIFT (cher, mais ça marche partout).`,
        ],
      },
      {
        heading: 'Le détail qui change tout : la cadence',
        body: [
          `Au-delà de la méthode, la cadence varie énormément :`,
        ],
        list: [
          `Hebdomadaire : Topstep (XFA après 5 winning days, LFA quotidien après 30 winning days cumulés), Apex, Tradeify, MFFU.`,
          `Mensuel : Bulenox, Phidias.`,
          `Cas particulier — Alpha Futures : Zero (5 winning days ≥ $200, cap 50%, $1-2.5K/cycle) OU Advanced ($15K/request max, 4 monthly withdrawals).`,
        ],
      },
    ],
    faqs: [
      {
        q: 'Quelle méthode pour le moins de frais en Europe ?',
        a: 'Wise, sans hésiter. Sur Topstep, USD/USD coûte $0.39 par payout. Vs ACH ($30) ou Wire SWIFT ($30 + frais bancaires intermédiaires), c\'est 50-100x moins cher.',
      },
      {
        q: 'PayPal est-il encore une option ?',
        a: 'Non, plus en 2026. Topstep a retiré PayPal. La plupart des autres firms l\'ont aussi abandonné à cause des frais et des chargebacks.',
      },
      {
        q: 'Combien de temps prend un premier payout en moyenne ?',
        a: 'Sur LFA (real money) : 1-3 jours via Aeropay/Wise, 5-10 jours via Wire. Le délai d\'APPROBATION interne (avant émission) ajoute 1-3 jours ouvrés selon les firms.',
      },
    ],
  },

  // ── CFD / forex vertical ──────────────────────────────────────────────────
  'drawdown-cfd-statique-vs-trailing': {
    title: 'Max loss statique vs trailing sur les PropFirms CFD',
    description: 'Drawdown CFD expliqué : max loss statique (figé sur le solde initial) vs trailing relatif (suit le plus haut puis se verrouille). Qui utilise quoi (FTMO, The5ers, E8, FundingPips) et comment adapter ton risque.',
    h1: 'Drawdown CFD : statique vs trailing, la différence qui fait tout',
    category: 'CFD / Forex',
    updatedDate: '2026-07-01',
    readingTime: 7,
    market: 'cfd',
    relatedFirms: ['FTMO', 'The5ers', 'E8 Markets', 'FundingPips'],
    relatedGuides: ['daily-loss-cfd-base-calcul', 'choisir-propfirm-cfd-fiable', 'eod-vs-intraday-drawdown'],
    intro: `Sur les PropFirms CFD / forex, la mécanique du max loss (perte maximale avant de casser le compte) est LE paramètre qui détermine ta vraie marge de manœuvre. Deux grandes familles cohabitent : le drawdown statique, figé sur le solde initial, et le drawdown trailing, qui suit ton plus haut. Contrairement aux futures — où le trailing intraday/EOD domine — la majorité des firmes CFD phares utilisent un max loss STATIQUE de 10%, ce qui change radicalement la façon de gérer le risque. Ce guide décortique les deux modèles, dit qui utilise quoi, et donne les réflexes pour ne pas casser un compte bêtement.`,
    sections: [
      {
        heading: 'Le max loss statique : le standard CFD',
        body: [
          `Un max loss statique est calculé une fois pour toutes sur le solde initial du compte, et ne bouge JAMAIS. Sur un compte 100K avec 10% de max loss statique, ton seuil de liquidation est fixé à 90 000 $ — que tu montes à 130K ou que tu redescendes, le plancher reste 90 000 $.`,
          `C'est le modèle le plus indulgent pour un trader qui construit du profit : plus tu gagnes, plus ton coussin au-dessus du seuil grandit. La plupart des modèles phares du secteur — FTMO 2-step, The5ers High Stakes, FundingPips 2-Step Standard, Blueberry 2-Step — appliquent un max loss statique à 10%.`,
        ],
      },
      {
        heading: 'Le trailing relatif : réservé aux modèles instant / 1-step',
        body: [
          `Un max loss trailing relatif suit ton equity la plus haute, puis se VERROUILLE une fois que le compte revient à l'équilibre au niveau du solde initial. Tant que le compte est en profit non verrouillé, le seuil monte avec toi — un retournement peut donc te casser même en zone de gain.`,
          `Sur le marché CFD, ce modèle est surtout utilisé par les offres instant funding et certains 1-step : E8 One (max 4% trailing relatif), FundingPips Zero (5% trailing), FundedNext Stellar Instant (6% trailing), Alpha One, les modèles Instant de Funded Trading Plus et Blueberry. Le trailing est le prix à payer pour l'absence de phase d'évaluation.`,
        ],
      },
      {
        heading: 'EOD trailing : la variante intermédiaire',
        body: `Quelques firmes ajoutent une troisième nuance : le trailing EOD (end-of-day), où le seuil ne se recalcule qu'à la clôture quotidienne — comme sur les futures Topstep. On le retrouve sur FTMO Challenge 1-Step et E8 Signature Forex. C'est plus indulgent que le trailing tick-by-tick : ton drawdown intraday peut être profond sans casser le compte tant que tu clôtures au-dessus du seuil de la veille.`,
      },
      {
        heading: 'Tableau récapitulatif (modèles phares)',
        body: `Résumé de la base de max loss par firme, modèle phare, vérifié 2026 :`,
        list: [
          `Statique 10% : FTMO 2-step, The5ers High Stakes, FundingPips 2-Step, Alpha Pro, The Funded Trader Standard, Blueberry 2-Step`,
          `Statique 8% : Funded Trading Plus 2-Step Classic`,
          `Trailing relatif : E8 One (4%), FundedNext Instant (6%), FundingPips Zero (5%), Alpha One (6%)`,
          `EOD trailing : FTMO 1-Step (10%), E8 Signature Forex (4%)`,
        ],
      },
      {
        heading: 'Comment adapter ton risque selon le modèle',
        body: `La bonne gestion dépend directement de la base :`,
        list: [
          `Statique : tu peux viser un objectif sereinement — chaque gain élargit ton coussin. Le danger n'est qu'en début de compte, avant d'avoir bâti du profit.`,
          `Trailing relatif : réduis ta taille de position et sécurise tes gains plus tôt — un retournement en zone de profit peut casser le compte tant que le trailing n'est pas verrouillé.`,
          `EOD trailing : tu as de la marge intraday, mais surveille ton solde à la clôture — c'est le seul instant qui compte pour le recalcul.`,
        ],
      },
      {
        heading: 'Le rôle de Quantara',
        body: `Dans l'onglet CFD de Quantara, chaque compte affiche sa jauge de max loss ET de daily loss calculée selon la vraie base de la firme (statique, trailing relatif, EOD). Tu vois ta room restante en temps réel, sans avoir à recalculer à la main la différence entre solde et equity la plus haute. Ajoute simplement ton compte, choisis la firme et le modèle : les règles se pré-remplissent depuis le catalogue.`,
      },
    ],
    faqs: [
      {
        q: 'Le max loss statique est-il vraiment plus sûr ?',
        a: 'Pour un trader qui construit du profit, oui : le seuil ne monte jamais, donc chaque gain agrandit ton coussin. Le trailing relatif peut te casser en zone de gain avant verrouillage. À règles égales, un modèle statique 10% laisse plus de marge qu\'un trailing 6%.',
      },
      {
        q: 'Le trailing CFD fonctionne-t-il comme le trailing des futures ?',
        a: 'Pas exactement. Sur les futures, le trailing suit souvent la balance et se lock au solde initial. Sur les CFD, il suit généralement l\'equity (positions ouvertes comprises) et se verrouille aussi au solde initial. La logique est proche mais la base equity rend le CFD plus réactif intraday.',
      },
      {
        q: 'Quelle base choisir quand je débute en CFD ?',
        a: 'Un modèle 2-step à max loss statique (FTMO, The5ers, FundingPips) est le plus lisible et le plus indulgent pour apprendre. Garde les modèles instant/trailing pour quand tu maîtrises ta gestion du risque intraday.',
      },
    ],
  },

  'daily-loss-cfd-base-calcul': {
    title: 'Daily loss CFD : solde, equity ou higher-of ?',
    description: 'La limite de perte journalière (daily loss) des PropFirms CFD change selon sa base de calcul : solde de début de journée, equity, ou le plus haut des deux. Comprendre la base pour ne pas casser ton compte à cause d\'une position ouverte.',
    h1: 'Daily loss CFD : la base de calcul qui piège les traders',
    category: 'CFD / Forex',
    updatedDate: '2026-07-01',
    readingTime: 6,
    market: 'cfd',
    relatedFirms: ['FundedNext', 'The5ers', 'FundingPips', 'Blueberry Funded'],
    relatedGuides: ['drawdown-cfd-statique-vs-trailing', 'choisir-propfirm-cfd-fiable'],
    intro: `La limite de perte journalière (daily loss limit) casse plus de comptes CFD que le max loss. Pourquoi ? Parce que sa BASE de calcul varie d'une firme à l'autre, et qu'une même perte peut être tolérée chez l'une et fatale chez l'autre. Solde de début de journée, equity, « le plus haut des deux », solde initial + profit intraday... Ce guide clarifie les quatre bases utilisées sur le marché CFD et montre comment chacune traite tes positions ouvertes.`,
    sections: [
      {
        heading: 'Ce que mesure la daily loss',
        body: `La daily loss limite la perte que tu peux subir sur une seule journée de trading (souvent 5% du compte). Dépasser ce seuil, ne serait-ce qu'un instant selon la firme, casse le compte. La question clé : le seuil est-il calculé à partir de ton SOLDE (trades clôturés uniquement) ou de ton EQUITY (positions ouvertes incluses) ? C'est toute la différence.`,
      },
      {
        heading: 'Base 1 — Solde de début de journée',
        body: [
          `Le seuil est figé sur le solde à l'ouverture de la journée (ex. 00:00 CET). Tes positions ouvertes en cours de journée n'affectent le calcul que lorsqu'elles sont réalisées. C'est la base la plus indulgente : un drawdown flottant profond ne casse pas le compte tant que tu ne réalises pas la perte.`,
          `Firmes : FTMO (solde début de journée), Alpha Capital Group, The Funded Trader (lock 17h EST).`,
        ],
      },
      {
        heading: 'Base 2 — Equity (le plus haut des deux)',
        body: [
          `Le seuil est calculé sur l'equity, souvent « le plus haut entre solde et equity » à l'ouverture. Ici, tes positions ouvertes COMPTENT : un drawdown flottant peut casser le compte instantanément, même sans clôturer. C'est la base la plus stricte.`,
          `Firmes : The5ers, FundingPips (higher-of à 00:00 CET), Blueberry Funded.`,
        ],
      },
      {
        heading: 'Base 3 — Solde initial + profit intraday',
        body: `Variante spécifique à FundedNext (Stellar) : la limite s'appuie sur le solde initial augmenté du profit intraday déjà réalisé. Concrètement, plus tu sécurises de gains dans la journée, plus ta marge de perte du jour s'élargit — mais le profit flottant non réalisé ne compte pas.`,
      },
      {
        heading: 'Pourquoi ça piège autant',
        body: `Le piège classique : un trader habitué à une firme « solde de début de journée » ouvre un compte chez une firme « equity ». Il laisse courir une position perdante en pensant avoir de la marge (car son solde n'a pas bougé), sans réaliser que son equity flottante a déjà franchi le seuil. Compte cassé, sans même un trade clôturé en perte.`,
        list: [
          `Base solde : le drawdown flottant est toléré tant qu'il n'est pas réalisé.`,
          `Base equity / higher-of : le drawdown flottant casse le compte en direct.`,
          `Toujours vérifier la base AVANT de laisser courir une position.`,
        ],
      },
      {
        heading: 'Comment Quantara t\'aide',
        body: `Quantara stocke la base de daily loss de chaque firme (solde, equity, higher-of, solde+intraday) et calcule ta jauge journalière en conséquence. Tu renseignes ton solde de début de journée et ton equity du moment : la jauge te dit exactement combien de room il te reste selon la vraie règle de TA firme — pas une estimation générique.`,
      },
    ],
    faqs: [
      {
        q: 'La base « equity » est-elle vraiment plus dangereuse ?',
        a: 'Oui. Avec une base equity ou « higher-of », un drawdown flottant sur une position ouverte peut casser le compte instantanément, sans clôture. Avec une base « solde de début de journée », seule la perte réalisée compte — bien plus indulgent pour qui laisse respirer ses trades.',
      },
      {
        q: 'À quelle heure la daily loss se remet à zéro ?',
        a: 'Ça dépend de la firme : 00:00 CET (FTMO, FundingPips), 17h EST (The Funded Trader, Blueberry). Le reset fixe ton nouveau seuil de départ pour la journée — connaître l\'heure exacte évite les mauvaises surprises sur les sessions à cheval.',
      },
      {
        q: 'Le profit flottant compte-t-il dans la base FundedNext ?',
        a: 'Non : la base FundedNext (solde initial + profit intraday) ne prend en compte que le profit RÉALISÉ dans la journée. Le profit flottant d\'une position encore ouverte n\'élargit pas ta marge de perte du jour.',
      },
    ],
  },

  'choisir-propfirm-cfd-fiable': {
    title: 'Comment choisir une PropFirm CFD fiable en 2026',
    description: 'Choisir une PropFirm CFD / forex : réputation et historique de payouts, base de drawdown, profit split, plateformes, frais remboursables. La méthode et les signaux d\'alerte à connaître avant de payer un challenge.',
    h1: 'Choisir une PropFirm CFD fiable : la méthode 2026',
    category: 'CFD / Forex',
    updatedDate: '2026-07-01',
    readingTime: 8,
    market: 'cfd',
    relatedFirms: ['FTMO', 'FundedNext', 'The5ers', 'Funded Trading Plus'],
    relatedGuides: ['drawdown-cfd-statique-vs-trailing', 'daily-loss-cfd-base-calcul'],
    intro: `Le marché des PropFirms CFD / forex est bien plus vaste — et bien plus risqué — que celui des futures. Des dizaines de firmes ouvrent chaque année, certaines disparaissent avec l'argent des traders. Avant de payer un challenge, la question n'est pas « laquelle a le plus gros split » mais « laquelle va réellement me payer ». Ce guide donne une méthode en cinq critères pour trier le sérieux du douteux, et liste les signaux d'alerte qui doivent te faire fuir.`,
    sections: [
      {
        heading: 'Critère n°1 — La réputation et l\'historique de payouts',
        body: [
          `C'est LE critère décisif sur le CFD. Une firme peut afficher des règles parfaites et ne jamais payer. Regarde l'ancienneté (une firme née il y a 3 mois n'a pas d'historique), le volume de payouts publiés, et surtout les incidents passés.`,
          `Exemples de repères 2026 : FTMO et The5ers ont un historique long et régulier ; The Funded Trader a connu une suspension de payouts majeure en 2024 (2 M$+ contestés) et reste à surveiller ; Blueberry Funded traîne des plaintes récurrentes de comptes cassés juste avant payout. Dans Quantara, chaque firme CFD porte un badge réputation (Fiable / Correct / Prudence) basé sur ces éléments.`,
        ],
      },
      {
        heading: 'Critère n°2 — La base de drawdown',
        body: `Une firme fiable avec des règles piégeuses reste un mauvais choix. Vérifie la base du max loss (statique vs trailing) et du daily loss (solde vs equity). Un max loss statique 10% + daily loss sur solde de début de journée = les conditions les plus lisibles. Un trailing relatif + daily loss equity = beaucoup plus exigeant. (Voir les deux guides dédiés liés en bas de page.)`,
      },
      {
        heading: 'Critère n°3 — Le profit split et sa progression',
        body: [
          `Le split de base tourne autour de 80%, avec une progression vers 90-100% selon la firme et le volume de payouts. Méfie-toi des « 100% de split » affichés en gros : ils sont souvent conditionnés (premier palier, add-on payant, cadence imposée).`,
          `Regarde aussi la CADENCE : un split de 90% payé tous les 14 jours vaut mieux qu'un 100% « on-demand » assorti d'une règle de consistance stricte qui bloque le retrait.`,
        ],
      },
      {
        heading: 'Critère n°4 — Plateformes et instruments',
        body: `Assure-toi que la firme propose la plateforme que tu maîtrises (MT4/MT5, cTrader, Match-Trader, DXtrade) et les instruments que tu trades (forex, indices, métaux, crypto). Une firme US bloque parfois MT5/cTrader pour raisons réglementaires. Vérifie aussi les restrictions : news trading, hold week-end, HFT/arbitrage souvent interdits.`,
      },
      {
        heading: 'Critère n°5 — Frais remboursables et conditions',
        body: `Beaucoup de firmes remboursent les frais du challenge une fois financé — mais les modalités varient : remboursé avec le 1er payout (FTMO, FundedNext), remboursé partiellement au passage financé (The5ers : 70%), sous forme de bonus au 3e payout (The Funded Trader), ou pas de remboursement du tout. Lis les conditions exactes avant de payer.`,
      },
      {
        heading: 'Les signaux d\'alerte',
        body: `Fais demi-tour si tu observes :`,
        list: [
          `Firme née il y a quelques mois sans historique de payouts vérifiable.`,
          `Règles de consistance ou de « manipulation » vagues, utilisables pour refuser un payout a posteriori.`,
          `Avis récurrents de comptes cassés juste avant un retrait.`,
          `Split « trop beau » assorti de conditions cachées.`,
          `Support injoignable ou réponses évasives sur les délais de paiement.`,
        ],
      },
      {
        heading: 'Suivre tes comptes CFD dans Quantara',
        body: `Quantara pré-configure les 9 principales PropFirms CFD avec leurs règles, leur badge réputation et leurs bases de drawdown. Tu peux comparer deux firmes côte à côte (pages /cfd/compare), lire chaque fiche détaillée, puis suivre tes comptes financés dans un seul dashboard — drawdown, daily loss et pipeline de payouts inclus.`,
      },
    ],
    faqs: [
      {
        q: 'Quelle est la PropFirm CFD la plus fiable en 2026 ?',
        a: 'FTMO reste la référence historique (payouts on-demand réguliers, max loss statique 10%). The5ers et FundedNext ont aussi un solide historique. « Fiable » ne veut pas dire « facile » : ces firmes ont des règles exigeantes, mais elles paient. Vérifie toujours l\'actualité avant de t\'engager.',
      },
      {
        q: 'Faut-il éviter les firmes marquées « Prudence » ?',
        a: 'Pas forcément les éviter, mais y aller les yeux ouverts : un badge Prudence signale un incident de payouts passé ou une réputation fragile. Si tu tentes malgré tout, limite ton exposition (petite taille de compte) et retire tes gains rapidement plutôt que de laisser grossir le solde.',
      },
      {
        q: 'Le plus gros profit split est-il le meilleur choix ?',
        a: 'Non. Un split de 100% ne vaut rien si la firme ne paie pas, ou s\'il est verrouillé derrière une règle de consistance impossible. La fiabilité des payouts et la lisibilité des règles de drawdown priment toujours sur le pourcentage affiché.',
      },
    ],
  },
}

// Sorted list for index page + sitemap generation
export const GUIDE_ORDER = [
  'trailing-drawdown',
  'eod-vs-intraday-drawdown',
  'consistency-rule',
  'comment-passer-evaluation-topstep',
  'payout-methods-propfirm',
  'drawdown-cfd-statique-vs-trailing',
  'daily-loss-cfd-base-calcul',
  'choisir-propfirm-cfd-fiable',
]

export function getAllGuideSlugs() {
  return GUIDE_ORDER
}

export function getGuide(slug) {
  return GUIDES[slug] || null
}

export function getGuidesOrdered() {
  return GUIDE_ORDER.map((slug) => ({ slug, ...GUIDES[slug] }))
}
