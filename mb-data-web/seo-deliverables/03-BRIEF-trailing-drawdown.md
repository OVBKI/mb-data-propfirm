# Content Brief : Trailing Drawdown (Guide complet)

_Méthodologie : skill `seo-content-brief` — AgriciDaniel/claude-seo_
_Mode : New page (création from scratch)_
_Page cible : `/guides/trailing-drawdown`_

---

## Search Intent

**Type :** Informational dominant + Commercial latent.
Le user veut comprendre une règle technique qui lui coûte des comptes (frustration forte). Une fois compris, il cherche un outil pour automatiser le tracking → opportunity de conversion.
**Format SERP rewarded :** long-form guide structuré, avec tableaux comparatifs (EOD vs Intraday), exemples chiffrés, FAQ.
**Audience :** trader futures intermédiaire, déjà familier avec les bases du trading, mais nouveau ou en difficulté sur propfirm.

---

## Competitor Analysis

| # | URL | Sections clés | Mots est. | Score | Gap principal |
|---|---|---|---|---|---|
| 1 | propfirmapp.com/learn/trailing-drawdown | What is, How it works, 3 things to know | ~1,200 | 28/40 | Pas d'exemples chiffrés concrets, pas de comparatif EOD/Intraday |
| 2 | tradecovex.com/guides/trailing-drawdown | Complete guide, Apex vs Topstep, calculations | ~2,500 | 34/40 | Anglais only, pas de visuel, pas de calculator |
| 3 | crosstrade.io/learn/risk-management/trailing-drawdown-survival-guide | NinjaTrader focus, survival tactics | ~2,000 | 30/40 | Trop NinjaTrader-spécifique, pas généraliste |
| 4 | tradingfunder.com/trailing-drawdown-explained-for-topstep-earn2trade-and-leeloo-trading | Multi-firm coverage | ~1,800 | 26/40 | Vieux (Leeloo n'existe plus), data outdated |
| 5 | damnpropfirms.com/.../unrealized-trailing-drawdown-explained | Apex-only, real-life examples | ~1,500 | 29/40 | Apex only, pas de comparaison Topstep |

**Moyenne compétiteur :** ~1,800 mots
**Score moyen :** 29/40

---

## Content Gaps & Opportunities

**Topic gaps (sujets que personne couvre vraiment bien) :**
- Pas un seul compétiteur ne propose **un comparatif visuel side-by-side** EOD vs Intraday avec un même P&L hypothétique → on peut produire une infographie unique
- Aucun n'explique **la psychologie du trader** face au trailing DD (pourquoi on continue de trader quand on devrait s'arrêter)
- Aucune **checklist pré-trade** pour vérifier le DD restant avant d'entrer
- Pas de **calculateur intégré** sur les guides existants
- 0 résultat en français pour "trailing drawdown expliqué" → on attaque les deux marchés

**Depth gaps :**
- Calculs d'exemples souvent superficiels — on peut détailler avec scénarios 7 jours réalistes
- Les règles 2026 d'Apex (changements post-evaluation au PA + safety net $100) sont absentes ou outdated chez la plupart

**Quality gaps :**
- Aucun guide n'a de schéma FAQPage → opportunité Featured Snippet + AI citability
- Pas de citation de sources officielles Topstep/Apex sur la majorité — on cite les sources directement

**Priorité gap :** Impact élevé × Avantage compétitif élevé / Effort moyen = **GO**

---

## Winning Outline

**H1 :** Trailing Drawdown : le guide complet pour ne plus perdre tes comptes PropFirm (2026)
**URL slug :** `/guides/trailing-drawdown`
**Target word count :** ~2,400 mots (competitor avg : ~1,800)
**Featured Snippet target :** "What is trailing drawdown" → première définition en 134-167 mots (zone optimale AI)

```
## Qu'est-ce que le trailing drawdown ? (definition)  — 150 mots
   - **FS target** : 134-167 mots auto-suffisants
   - Définition pattern "X est..."
   - 1 phrase clé citable
   - Mot-clé primaire dans le premier paragraphe
   
## Pourquoi le trailing drawdown est la règle #1 qui casse les comptes  — 200 mots
   - Stat clé : "single largest cause of blown evaluations on Apex, Topstep, MFFU"
   - Pourquoi cette mécanique est contre-intuitive
   - Effet psychologique (chase the bottom)
   
## Les 2 types de trailing drawdown : EOD vs Intraday  — 350 mots
   - Tableau comparatif (PropFirm | Type | Comment ça track)
   - Exemple concret : trader long $5k profit, pullback $2k, finit la journée +$3k
     - Avec Intraday : compte busté
     - Avec EOD : tout va bien
   - Schéma / infographie (à créer)
   - Mot-clé secondaire "trailing drawdown intraday" en H3
   
## Comment Topstep calcule le trailing drawdown (Max Loss Limit)  — 250 mots
   - Tableau : 50K → $2,000 MLL ; 100K → $3,000 ; 150K → $4,500
   - EOD only chez Topstep
   - Comportement post-funded : floor se lock au starting balance
   - **FS target** sur "topstep trailing drawdown"
   - Citer source officielle Topstep
   
## Comment Apex calcule le trailing drawdown  — 350 mots
   - Apex propose les 2 types (choix à l'achat, irréversible)
   - Tableau : 50K → $2,500 ; 100K → $3,000 ; 150K → $4,500
   - Post-eval Performance Account : drawdown initial + safety net $100, lock définitif
   - Différence évaluation vs PA
   - Citer source officielle Apex
   
## Exemple chiffré : une semaine sur compte 50K Apex Intraday  — 400 mots
   - Tableau jour par jour : Open, High, Low, Close, DD restant, Status
   - Lundi +$800, Mardi +$1,200 → DD remonte
   - Mercredi pic +$2,400 PUIS pullback -$1,800 sans avoir clôturé → COMPTE BUSTÉ
   - Leçon : pourquoi clôturer ses gains rapidement
   - Bonus : même scénario avec compte EOD → différent résultat
   
## Comment tracker ton trailing drawdown sans devenir fou (3 méthodes)  — 300 mots
   - Méthode 1 : Excel manuel (gratuit mais erreurs humaines)
   - Méthode 2 : alertes dans la plateforme broker (limité, pas multi-firm)
   - Méthode 3 : journal de trading dédié → Quantara (mentionné naturellement, pas pushy)
   - Pros/cons en tableau
   
## Checklist pré-trade : 5 vérifications avant chaque ordre  — 200 mots
   - Format liste à cocher
   - DD restant > 1.5× ton risk par trade ?
   - High du jour vs ton entrée ?
   - Plan de sortie défini ?
   - News économique dans la prochaine heure ?
   - Tu trades par discipline ou par émotion ?
   
## FAQ — 5 questions  — 250 mots
   - **Schema FAQPage à implémenter**
   - Q : Trailing drawdown : que se passe-t-il si je laisse mes positions ouvertes pendant la nuit ?
   - Q : Mon trailing drawdown se reset-il jamais ?
   - Q : Différence entre trailing drawdown et max loss ?
   - Q : Lequel choisir entre Apex EOD et Intraday ?
   - Q : Comment fonctionne le trailing drawdown sur un compte funded vs évaluation ?
   
## Conclusion : la règle d'or  — 150 mots
   - CTA discret vers Quantara (tracker automatique multi-firms)
```

### Per-section keyword guidance

| Section | Keyword principal | Keyword secondaire |
|---|---|---|
| H1 + intro | trailing drawdown | propfirm |
| Définition | trailing drawdown definition | drawdown trading |
| EOD vs Intraday | trailing drawdown intraday | end of day drawdown |
| Topstep | topstep trailing drawdown | topstep max loss limit |
| Apex | apex trailing drawdown | apex unrealized drawdown |
| Tracking | tracker trailing drawdown | journal trading propfirm |
| FAQ | trailing drawdown explained | (longue traîne questions) |

**Densité keyword primaire cible :** 1-1.5% (24-36 occurrences sur 2400 mots)
**Distribution :** régulière, pas de cluster. Primaire dans titre + H1 + premier para + alt 1ère image + meta description.

---

## Recommended Meta Tags

**Title (58 chars) :**
`Trailing Drawdown : Guide Complet PropFirm Futures (2026)`

**Meta Description (148 chars) :**
`Comprends comment le trailing drawdown détruit les comptes Topstep, Apex et MFFU. Calculs, exemples chiffrés et checklist pré-trade. Guide 2026.`

**OG title :** `Trailing Drawdown : Le Guide qui te sauve tes comptes PropFirm`
**OG description :** `Tableau EOD vs Intraday, exemples chiffrés sur Topstep et Apex, checklist pré-trade. La référence FR 2026.`

---

## Unique Angle & Information Gain

**Ce que cette page apporte que personne d'autre n'a :**
1. **Le premier comparatif side-by-side EOD vs Intraday** sur le même scénario hypothétique chiffré (5 jours, P&L détaillé) — visuel à produire en interne
2. **Données 2026 à jour** : safety net $100 d'Apex PA, montants exacts par compte size, citations sources officielles
3. **Première version française complète** du sujet (gap énorme identifié)
4. **Checklist pré-trade actionnable** (téléchargeable PDF en lead magnet — bonus)
5. **Schema FAQPage** pour capturer le PAA (People Also Ask) et la citabilité IA

---

## E-E-A-T Requirements

- **Auteur :** Founder Quantara, identifié avec nom + photo + bio crédible (ex: "trader propfirm depuis X années, X comptes funded, founder Quantara")
- **Date publication + Last updated**
- **Sources citées explicitement** :
  - Topstep help center officiel (link)
  - Apex Trader Funding rules officielles (link)
  - 1 étude/stat tierce sur taux d'échec evaluations
- **Disclaimer YMYL** en bas : "Cet article est informatif, ne constitue pas un conseil financier. Le trading futures comporte un risque de perte en capital."
- **Date de last review** mise à jour trimestrielle (Google adore le contenu frais sur YMYL)
- **Schema Article** + **schema FAQPage** + **schema HowTo** sur la checklist pré-trade

---

## Internal Linking Opportunities

1. **Anchor :** "consistency rule des PropFirms" → `/guides/consistency-rule`
2. **Anchor :** "tableau de bord PropFirm Quantara" → `/` (homepage, contextuel)
3. **Anchor :** "comment Topstep calcule le drawdown" → `/firms/topstep` (à créer)
4. **Anchor :** "Apex Intraday vs End of Day en détail" → `/guides/apex-intraday-vs-eod` (à créer)
5. **Anchor :** "calculateur de trailing drawdown" → `/tools/trailing-drawdown-calculator` (à créer)

---

## Visuels à produire (par le founder ou designer)

1. **Infographie principale** : EOD vs Intraday side-by-side (1 jour de trading, 2 colonnes de timeline avec annotations)
2. **Tableau interactif** : tous les comptes Topstep/Apex/MFFU avec leurs montants DD
3. **Screenshot Quantara** : interface qui montre le trailing DD en temps réel (alt : "Suivi automatique du trailing drawdown sur Quantara")
4. **Checklist pré-trade téléchargeable** PDF (lead magnet — récupère email)

---

## Next steps après publication

1. Soumettre URL dans GSC + IndexNow
2. Partager sur r/propfirms, r/Daytrading, r/Apex, r/Topstep
3. Twitter thread avec key insights (cherche cluster avec quote-tweets de traders connus)
4. Si bonne traction → version YouTube 10-12 min (script reprend la structure)
5. Re-publish trimestriellement avec data updates
