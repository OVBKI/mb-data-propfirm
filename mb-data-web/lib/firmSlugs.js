// Mapping firm name ⇄ URL slug + métadonnées éditoriales par firm.
//
// Les règles factuelles vivent dans lib/constants.js (PROPFIRM_RULES). Ce fichier
// ajoute la couche éditoriale : tagline, description longue, faits clés, faqs,
// type de drawdown, pays, plateforme. Tout ce qui est nécessaire pour générer
// des pages SEO uniques /firms/[slug] sans dupliquer la data de règles.
//
// Vérifié mai 2026. À mettre à jour si une firm change sa structure.

import { PROPFIRM_RULES, FIRM_SUGGESTIONS } from './constants'

// firm name → slug (URL safe, lowercase, hyphens)
export function firmToSlug(name) {
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// slug → firm name (canonical capitalization)
export function slugToFirm(slug) {
  const target = String(slug).toLowerCase()
  return FIRM_SUGGESTIONS.find((f) => firmToSlug(f) === target) || null
}

export function getAllFirmSlugs() {
  return FIRM_SUGGESTIONS.map((f) => firmToSlug(f))
}

// Métadonnées éditoriales par firm.
// Champs :
//  - tagline      : 1 phrase courte (sous le H1)
//  - description  : 150-160 char (meta description)
//  - intro        : paragraphe d'intro (200-300 mots) — unique SEO content
//  - website      : URL officielle
//  - founded      : année (ou 'N/A')
//  - country      : pays HQ
//  - platform     : plateformes de trading principales
//  - ddType       : 'EOD' | 'Intraday' | 'Mix'
//  - splits       : 1-2 phrases sur le profit split
//  - keyFacts     : 4-5 bullets distinctifs (utilisés pour le résumé en haut)
//  - faqs         : 4-6 questions/réponses pour FAQPage JSON-LD + accordéon UI
export const FIRM_META = {
  'Topstep': {
    tagline: 'La PropFirm historique futures, EOD drawdown, architecture 3-step (Combine → XFA → LFA).',
    description: 'Topstep 2026 — règles vérifiées : MLL EOD only, profit split 90/10, payouts hebdo Aeropay/Wise, scaling plan XFA et LFA. Tout pour passer le Combine.',
    intro: 'Topstep est l\'une des plus anciennes PropFirm futures (Chicago, fondée en 2012). Elle se distingue par une architecture 3 étapes — Trading Combine (sim payant), Express Funded Account XFA (sim post-évaluation), Live Funded Account LFA (capital réel) — et par un Maximum Loss Limit (MLL) qui ne se déclenche qu\'en End-of-Day. C\'est l\'un des seuls modèles 2026 sans trailing intraday : la mécanique est plus indulgente sur les drawdowns intraday violents, mais l\'auto-flat 3:10 PM CT interdit les positions overnight. Depuis janvier 2026, le profit split est passé à 90/10 immédiat dès $1 (les anciens conservent leur split legacy 100% sur les premiers $10K). La plateforme TopstepX (Rithmic underlying) est désormais requise pour tous les nouveaux Combines.',
    website: 'https://www.topstep.com',
    founded: '2012',
    country: 'États-Unis (Chicago, IL)',
    platform: 'TopstepX (Rithmic) · NinjaTrader/Quantower (grandfathered)',
    ddType: 'EOD uniquement (jamais intraday)',
    splits: 'Profit Split 90/10 immédiat (post 12-jan-2026). Legacy 100% sur premiers $10K LIFETIME préservé pour comptes plus anciens.',
    keyFacts: [
      'MLL End-of-Day exclusivement — pas de trailing intraday',
      'Architecture 3-step : Combine → XFA → LFA',
      'Auto-flat 3:10 PM CT — pas d\'overnight',
      'Profit split 90/10 immédiat (nouveaux post-jan-2026)',
      'Payouts hebdo via Aeropay (instant US), Wise, ACH, Wire',
    ],
    faqs: [
      {
        q: 'Topstep utilise-t-il un drawdown trailing intraday ?',
        a: 'Non. Topstep est l\'une des rares PropFirm 2026 dont le Maximum Loss Limit ne se calcule qu\'en End-of-Day. Le MLL monte avec les nouveaux EOD highs jusqu\'au starting balance, puis se locke. Une perte intraday brutale ne déclenche pas le fail tant que la clôture de session reste au-dessus du seuil.',
      },
      {
        q: 'Quel est le profit split chez Topstep en 2026 ?',
        a: 'Depuis le 12 janvier 2026, le split est 90% trader / 10% Topstep, payé immédiatement dès le premier dollar. Les comptes ouverts avant cette date conservent la structure legacy : 100% trader sur les premiers $10,000 lifetime, puis 90/10 ensuite.',
      },
      {
        q: 'Combien coûte un Trading Combine Topstep ?',
        a: 'En Standard Path : $49/mo (50K), $99/mo (100K), $149/mo (150K) — avec un fee d\'activation $149 au passage XFA. En No Activation Fee Path : $95/$149/$229 mensuels mais $0 d\'activation au passage XFA.',
      },
      {
        q: 'Topstep autorise-t-il le trading des news ?',
        a: 'Oui. Pas de buffer NFP/CPI/FOMC. Le trading des news macro est explicitement autorisé sur Combine, XFA et LFA. En revanche, le copy trading externe (multi-account arbitrage, position aggregation coordonnée) est strictement interdit.',
      },
      {
        q: 'Comment fonctionne le passage Express Funded → Live Funded chez Topstep ?',
        a: 'Le Call Up vers LFA arrive typiquement entre le 3ème et le 5ème payout — la Risk Team review consistency, risk management, position sizing, products traded, use of stops, payout history et overall behavior. Le LFA démarre à 20% du balance XFA cumulatif OU $10,000 minimum (le plus haut des deux).',
      },
      {
        q: 'Quelles sont les méthodes de payout Topstep ?',
        a: 'Aeropay (instant US, gratuit), Wise ($0.39 USD/USD, 1-3 jours), ACH ($30, US 1-3 jours), Wire SWIFT ($30, international 5-10 jours). PayPal a été retiré. Min withdrawal $125.',
      },
    ],
  },
  'Apex Trader Funding': {
    tagline: 'PropFirm trailing intraday la plus permissive — Apex 4.0 propose 100% trader cappé par ladder.',
    description: 'Apex Trader Funding 2026 (4.0) : trailing $2,500–$7,500, profit split 100% cappé puis uncapped après 6 payouts. Règles complètes et FAQ vérifiées.',
    intro: 'Apex Trader Funding (Texas, fondée en 2021) a popularisé le modèle PropFirm futures grand public à coups de promos agressives. En mars 2026, la refonte "Apex 4.0" a transformé l\'offre : profit split 100% trader cappé par une ladder progressive sur 6 payouts puis uncapped, trailing drawdown intraday de $2,500 (25K) à $7,500 (300K), et règles unifiées entre Evaluation et Performance Account. Apex reste réputée pour ses payouts quasi-instantanés (Plane, Rise, ACH) et son catalogue de plans très large — du 25K au 300K. Mais le trailing intraday la rend très exigeante sur la discipline de stops : un swing intraday violent peut couler un compte que le close aurait sauvé.',
    website: 'https://apextraderfunding.com',
    founded: '2021',
    country: 'États-Unis (Austin, TX)',
    platform: 'Rithmic · NinjaTrader · Tradovate · Tradingview · Quantower',
    ddType: 'Trailing intraday (tick-by-tick)',
    splits: 'Apex 4.0 : 100% trader cappé via ladder (6 payouts) puis uncapped. Avant 4.0 : 90/10 standard.',
    keyFacts: [
      'Trailing drawdown intraday $2.5K–$7.5K selon plan',
      'Apex 4.0 (mars 2026) : 100% trader cappé puis uncapped',
      'Plans 25K, 50K, 75K, 100K, 150K, 250K, 300K',
      'Payouts rapides : Plane, Rise, ACH',
      'News trading autorisé · pas d\'overnight',
    ],
    faqs: [
      {
        q: 'Apex utilise-t-il un drawdown intraday ou EOD ?',
        a: 'Apex utilise un trailing drawdown intraday : la balance maximale est mise à jour tick par tick pendant la session, et le seuil de fail suit ce peak. Un trade gagnant suivi d\'un retournement perdant peut déclencher le fail même si le close final reste positif.',
      },
      {
        q: 'Qu\'est-ce qui a changé avec Apex 4.0 en 2026 ?',
        a: 'La refonte Apex 4.0 (mars 2026) introduit : (1) profit split 100% trader cappé par une ladder progressive sur 6 payouts puis uncapped, (2) règles unifiées Evaluation/Performance, (3) seuils de drawdown trailing standardisés, (4) onboarding simplifié pour le LFA.',
      },
      {
        q: 'Combien de comptes Apex peut-on avoir en même temps ?',
        a: 'Apex autorise jusqu\'à 20 Performance Accounts (PA) simultanés selon les tiers — c\'est l\'un des plus généreux du marché pour le scaling multi-comptes. Le copy trading entre vos propres comptes est autorisé via les outils internes.',
      },
      {
        q: 'Apex autorise-t-il le trading des news ?',
        a: 'Oui, le trading des news macroéconomiques (NFP, CPI, FOMC) est autorisé sur Evaluation et Performance Account, sans buffer obligatoire. C\'est l\'un des avantages historiques d\'Apex sur Topstep et MFFU.',
      },
      {
        q: 'Quels sont les délais de payout chez Apex ?',
        a: 'Les payouts sont réputés rapides : généralement 24-48h après approbation interne via Plane (instant US), Rise (international), ou ACH. Apex traite plusieurs milliers de payouts par mois, ce qui en fait l\'une des firmes les plus actives du marché.',
      },
    ],
  },
  'Bulenox': {
    tagline: 'PropFirm européenne low-cost, plans 25K à 250K, payouts mensuels.',
    description: 'Bulenox 2026 : règles, drawdown (EOD/trailing), profit split 90/10, payouts mensuels Wise/Rise, prix mensuels et frais. FAQ vérifiée.',
    intro: 'Bulenox est une PropFirm futures européenne au positionnement low-cost, populaire chez les traders FR/DE/ES qui veulent éviter les frais Wise sur des payouts dollar. Elle propose des plans 25K à 250K avec un mix de règles assez classique : profit split 90/10 standard, trailing drawdown sur Evaluation, EOD sur Performance Account, et une cadence de payouts mensuelle (vs hebdomadaire chez Apex/Topstep). Bulenox a la réputation d\'être plus indulgente que les firmes US sur le sizing et la consistency, mais les prix d\'évaluation sont aussi plus volatils car la firme aligne agressivement ses promotions sur celles des concurrents.',
    website: 'https://bulenox.com',
    founded: '2022',
    country: 'Europe',
    platform: 'Tradovate · NinjaTrader · TradingView',
    ddType: 'Mix : trailing en Evaluation, EOD en Performance',
    splits: 'Profit split 90/10 standard (trader/firm), pas de cap progressif.',
    keyFacts: [
      'Plans 25K à 250K — choix très large',
      'Profit split 90/10',
      'Payouts mensuels via Wise/Rise',
      'EOD drawdown sur compte funded',
      'Prix promo réguliers (-50% à -80%)',
    ],
    faqs: [
      {
        q: 'Quel est le drawdown chez Bulenox ?',
        a: 'Bulenox utilise un trailing drawdown sur l\'Evaluation, puis bascule en EOD une fois passé en Performance Account. Le seuil dépend du plan (25K à 250K) — consulter le tableau officiel pour les montants exacts.',
      },
      {
        q: 'Bulenox propose-t-il des payouts mensuels ou hebdomadaires ?',
        a: 'Bulenox utilise une cadence de payouts mensuelle par défaut, contrairement à Apex ou Topstep qui sont hebdomadaires. Cela peut être un avantage pour les traders qui préfèrent capitaliser et retirer en bloc.',
      },
      {
        q: 'Quel est le profit split Bulenox ?',
        a: 'Le profit split standard est 90% trader / 10% firm, sans cap progressif, dès le premier payout — l\'un des splits les plus simples du marché.',
      },
      {
        q: 'Bulenox est-elle adaptée aux traders européens ?',
        a: 'Oui, Bulenox est positionnée comme une firm européenne (siège Europe) et propose des paiements Wise/Rise qui minimisent les frais de conversion pour les traders FR/DE/ES.',
      },
    ],
  },
  'Lucid Trading': {
    tagline: 'PropFirm futures trailing intraday avec Lucid Static (no trailing) en option.',
    description: 'Lucid Trading 2026 : trailing intraday standard + plan Static no-trailing, profit split 90/10, payouts hebdo. Règles et FAQ.',
    intro: 'Lucid Trading est une PropFirm futures récente qui se distingue par son offre dual : un plan trailing intraday classique (style Apex) et un plan "Lucid Static" sans trailing — où le drawdown est fixe et ne suit pas le peak. Cette option Static plaît particulièrement aux scalpers qui veulent éviter le risque de blowup intraday sur retournement. Profit split 90/10 standard, payouts hebdomadaires, prix d\'évaluation alignés sur les standards 2026 du marché US.',
    website: 'https://lucidtrading.com',
    founded: '2023',
    country: 'États-Unis',
    platform: 'Rithmic · NinjaTrader · Tradovate · Quantower',
    ddType: 'Trailing intraday OU Static (au choix)',
    splits: 'Profit split 90/10 standard.',
    keyFacts: [
      'Option Lucid Static : drawdown fixe (no trailing)',
      'Option standard : trailing intraday classique',
      'Profit split 90/10',
      'Payouts hebdomadaires',
      'Plans 25K à 250K',
    ],
    faqs: [
      {
        q: 'Qu\'est-ce que Lucid Static ?',
        a: 'Lucid Static est une variante des plans Lucid sans drawdown trailing : le seuil de fail est fixe et n\'évolue pas avec votre balance maximale. Cela protège des retournements intraday qui couleraient un compte trailing.',
      },
      {
        q: 'Lucid Trading vs Apex : quelle différence ?',
        a: 'Lucid propose une option Static absente chez Apex, et un onboarding plus simple. Apex reste plus large en catalogue (300K) et a une réputation établie sur les payouts rapides. Le choix dépend de votre style : Static = scalper, Apex = swing/news.',
      },
      {
        q: 'Lucid autorise-t-il le copy trading ?',
        a: 'Le copy trading entre vos propres comptes Lucid est autorisé via les outils internes. Le copy trading externe (multi-firmes coordonné) est interdit.',
      },
      {
        q: 'Quelle est la cadence de payout chez Lucid ?',
        a: 'Lucid traite des payouts hebdomadaires sur le Performance Account, avec un minimum requis de winning days (généralement 5+) avant éligibilité au premier payout.',
      },
    ],
  },
  'Tradeify': {
    tagline: 'PropFirm futures EOD drawdown, profit split 90/10, plans 25K à 300K.',
    description: 'Tradeify 2026 : drawdown EOD only, profit split 90/10, payouts hebdomadaires, plans 25K à 300K. Règles complètes et FAQ.',
    intro: 'Tradeify est une PropFirm futures qui adopte un drawdown End-of-Day exclusif (comme Topstep), ce qui en fait une alternative populaire pour les traders qui veulent éviter le trailing intraday brutal d\'Apex tout en restant sur des prix plus accessibles que Topstep. Profit split standard 90/10, payouts hebdomadaires, large catalogue de plans (25K à 300K). Tradeify autorise le news trading et a une politique relativement souple sur le DCA et le pyramiding.',
    website: 'https://tradeify.co',
    founded: '2023',
    country: 'États-Unis',
    platform: 'Rithmic · NinjaTrader · Tradovate · Quantower',
    ddType: 'EOD uniquement (pas de trailing intraday)',
    splits: 'Profit split 90/10 standard.',
    keyFacts: [
      'Drawdown EOD only — pas de trailing intraday',
      'Profit split 90/10',
      'Plans 25K à 300K',
      'News trading autorisé',
      'Payouts hebdomadaires',
    ],
    faqs: [
      {
        q: 'Tradeify utilise-t-il un drawdown trailing ?',
        a: 'Non. Tradeify utilise un End-of-Day drawdown : le seuil de fail ne se calcule qu\'à la clôture quotidienne. Les retournements intraday violents ne déclenchent pas le fail tant que le close reste au-dessus du seuil.',
      },
      {
        q: 'Tradeify vs Topstep : quelle différence ?',
        a: 'Les deux sont EOD only, mais Topstep impose un fee d\'activation au passage XFA (sauf No-Fee path) et une architecture 3-step. Tradeify est plus simple : Evaluation → Funded direct, sans intermédiaire XFA, et souvent plus compétitif sur le prix mensuel.',
      },
      {
        q: 'Quelles plateformes sont supportées par Tradeify ?',
        a: 'Tradeify supporte Rithmic, NinjaTrader, Tradovate et Quantower. Pas de plateforme propriétaire obligatoire, contrairement à TopstepX.',
      },
      {
        q: 'Tradeify autorise-t-il le trading des news ?',
        a: 'Oui, le trading des news macroéconomiques est autorisé sans buffer obligatoire. Le scalping est autorisé. Le DCA (renforcement) est toléré sans règle stricte.',
      },
    ],
  },
  'Take Profit Trader': {
    tagline: 'PropFirm futures avec plateforme TPT propriétaire, payouts hebdomadaires.',
    description: 'Take Profit Trader (TPT) 2026 : plateforme propriétaire, profit split 90/10, drawdown EOD, payouts hebdo. Règles vérifiées.',
    intro: 'Take Profit Trader (TPT) opère sa propre plateforme propriétaire en plus du support Rithmic. C\'est l\'une des firmes les plus visibles sur YouTube trading FR, avec une offre orientée traders débutants à intermédiaires : Evaluation rapide, drawdown EOD-only, profit split 90/10. Les payouts sont hebdomadaires après les premiers winning days. Le catalogue de plans est plus restreint qu\'Apex mais les règles sont stables et lisibles.',
    website: 'https://takeprofittrader.com',
    founded: '2021',
    country: 'États-Unis',
    platform: 'TPT (propriétaire) · Rithmic',
    ddType: 'EOD uniquement',
    splits: 'Profit split 90/10 standard.',
    keyFacts: [
      'Plateforme propriétaire TPT',
      'Drawdown EOD only',
      'Profit split 90/10',
      'Payouts hebdomadaires',
      'Onboarding rapide',
    ],
    faqs: [
      {
        q: 'TPT a-t-il sa propre plateforme ?',
        a: 'Oui, Take Profit Trader propose TPT, une plateforme propriétaire, en plus du support Rithmic via NinjaTrader/Tradovate/Quantower. Le choix se fait au moment du checkout.',
      },
      {
        q: 'Take Profit Trader vs Tradeify ?',
        a: 'Les deux utilisent un drawdown EOD-only et un split 90/10. TPT a sa plateforme propriétaire (avantage pour les nouveaux), Tradeify est plus universelle sur les plateformes. Tradeify a un catalogue de plans plus large (jusqu\'à 300K).',
      },
      {
        q: 'Combien de comptes TPT en simultané ?',
        a: 'TPT autorise plusieurs comptes simultanés selon les tiers — voir la documentation officielle pour les caps exacts par plan. Le copy trading externe est interdit.',
      },
    ],
  },
  'My Funded Futures': {
    tagline: 'MFFU : PropFirm futures trailing avec cap stop au balance initial, plans 50K à 150K.',
    description: 'My Funded Futures (MFFU) 2026 : trailing drawdown avec cap, profit split 90/10, payouts. Règles et FAQ.',
    intro: 'My Funded Futures (MFFU) est une PropFirm futures avec un drawdown trailing qui stoppe sa progression au balance initial — une mécanique intermédiaire entre le pure trailing intraday (Apex) et l\'EOD locked (Topstep). MFFU propose 4 plans principaux (50K, 100K, 150K) avec un profit split 90/10 et des payouts hebdomadaires. La firme est populaire dans la communauté trading FR pour son équilibre entre permissivité (drawdown moins agressif qu\'Apex) et prix (moins cher que Topstep No-Fee).',
    website: 'https://myfundedfutures.com',
    founded: '2023',
    country: 'États-Unis',
    platform: 'Rithmic · NinjaTrader · Tradovate · Quantower',
    ddType: 'Trailing avec cap au starting balance',
    splits: 'Profit split 90/10 standard.',
    keyFacts: [
      'Trailing drawdown avec cap au balance initial',
      'Profit split 90/10',
      'Plans 50K, 100K, 150K',
      'Payouts hebdomadaires',
      'Popular dans la communauté FR',
    ],
    faqs: [
      {
        q: 'Comment fonctionne le drawdown MFFU ?',
        a: 'MFFU utilise un trailing drawdown qui suit votre balance maximale puis stoppe sa progression une fois le starting balance atteint. Au-delà, le seuil reste fixe, ce qui crée un effet "EOD-like" pour les traders qui dépassent rapidement le break-even.',
      },
      {
        q: 'MFFU vs Apex : quelle différence ?',
        a: 'MFFU est moins agressif qu\'Apex sur le trailing (cap au balance initial), mais a un catalogue plus restreint. Apex permet jusqu\'à 300K, MFFU monte à 150K. Les deux ont un split 90/10 standard. Le choix dépend du sizing visé.',
      },
      {
        q: 'Quel est le minimum de winning days MFFU ?',
        a: 'MFFU exige généralement 5+ winning days avec un minimum de profit par jour avant éligibilité au premier payout. Voir la doc officielle pour les seuils exacts par plan.',
      },
    ],
  },
  'Phidias Propfirm': {
    tagline: 'PropFirm futures européenne, drawdown trailing, plans variés.',
    description: 'Phidias Propfirm 2026 : règles, drawdown trailing, profit split, payouts. FAQ et tarifs vérifiés.',
    intro: 'Phidias est une PropFirm futures basée en Europe, positionnée sur le marché FR/DE/IT avec un support multilingue. La structure de règles est classique : trailing drawdown, profit split 80/20 ou 90/10 selon plans, payouts mensuels. Phidias se distingue par un onboarding rapide et un service client en français — un atout pour les traders qui préfèrent éviter les firmes US.',
    website: 'https://phidias.com',
    founded: '2023',
    country: 'Europe',
    platform: 'NinjaTrader · TradingView · Tradovate',
    ddType: 'Trailing drawdown',
    splits: 'Profit split 80/20 ou 90/10 selon plans.',
    keyFacts: [
      'Firm européenne (support FR)',
      'Trailing drawdown standard',
      'Payouts mensuels',
      'Plans variés',
      'Onboarding rapide',
    ],
    faqs: [
      {
        q: 'Phidias est-elle adaptée aux traders français ?',
        a: 'Oui, Phidias propose un support en français et des paiements optimisés pour l\'Europe — c\'est l\'un de ses avantages clairs sur les firmes US comme Topstep ou Apex.',
      },
      {
        q: 'Quel est le drawdown Phidias ?',
        a: 'Phidias utilise un trailing drawdown classique qui suit le peak balance. Le seuil dépend du plan choisi — consulter la doc officielle pour les montants exacts.',
      },
    ],
  },
  'Funded Futures Network': {
    tagline: 'PropFirm futures, mix de plans Evaluation et Funded directs.',
    description: 'Funded Futures Network (FFN) 2026 : règles, drawdown, profit split, payouts. FAQ et tarifs.',
    intro: 'Funded Futures Network (FFN) est une PropFirm futures qui propose un mix de plans Evaluation classiques et de Funded direct (sans étape d\'évaluation), positionnement assez rare en 2026. Les règles sont alignées sur les standards du marché : profit split 90/10, trailing drawdown, payouts hebdomadaires ou mensuels selon plans. FFN cible les traders qui veulent éviter l\'étape sim coûteuse en allant directement sur du capital réel via un Funded direct payant.',
    website: 'https://fundedfutures.net',
    founded: '2022',
    country: 'États-Unis',
    platform: 'Rithmic · NinjaTrader · Tradovate',
    ddType: 'Trailing drawdown',
    splits: 'Profit split 90/10 standard.',
    keyFacts: [
      'Plans Evaluation ET Funded direct',
      'Profit split 90/10',
      'Trailing drawdown',
      'Payouts hebdo ou mensuels',
    ],
    faqs: [
      {
        q: 'Qu\'est-ce qu\'un Funded direct chez FFN ?',
        a: 'Le Funded direct permet d\'accéder à du capital sim immédiatement sans passer par une Evaluation. C\'est plus cher mais plus rapide. Les règles funded s\'appliquent dès J1.',
      },
      {
        q: 'FFN vs autres PropFirms ?',
        a: 'FFN se distingue par l\'option Funded direct (pas d\'étape Evaluation) qui n\'existe que chez quelques firmes. Pour le reste, FFN est dans les standards du marché : 90/10, trailing, news autorisé.',
      },
    ],
  },
  'FuturesELites': {
    tagline: 'PropFirm futures, onboarding simple, plans classiques.',
    description: 'FuturesELites 2026 : règles, drawdown, profit split, payouts. FAQ et tarifs vérifiés.',
    intro: 'FuturesELites (parfois écrit "Futures Elites") est une PropFirm futures avec une offre orientée traders débutants à intermédiaires. Règles standards du marché 2026 : profit split 90/10, trailing drawdown, payouts hebdomadaires. La firme se distingue par un onboarding simplifié et un catalogue de plans focalisé sur 50K-150K.',
    website: 'https://futureselites.com',
    founded: '2023',
    country: 'États-Unis',
    platform: 'Rithmic · NinjaTrader · Tradovate',
    ddType: 'Trailing drawdown',
    splits: 'Profit split 90/10 standard.',
    keyFacts: [
      'Onboarding simplifié',
      'Plans 50K-150K',
      'Profit split 90/10',
      'Payouts hebdomadaires',
    ],
    faqs: [
      {
        q: 'FuturesELites est-elle fiable ?',
        a: 'FuturesELites est une firm relativement jeune (fondée en 2023). Comme pour toute PropFirm récente, vérifier les délais réels de payout sur Trustpilot/Discord avant de s\'engager.',
      },
      {
        q: 'Quel est le drawdown FuturesELites ?',
        a: 'Trailing drawdown standard — le seuil suit la balance maximale. Consulter la doc officielle pour les montants exacts par plan.',
      },
    ],
  },
  'Alpha Futures': {
    tagline: 'PropFirm futures avec payouts Zero (cap 50%) et Advanced (jusqu\'à $15K/request).',
    description: 'Alpha Futures 2026 : payouts Zero ou Advanced, drawdown, profit split. Règles complètes et FAQ.',
    intro: 'Alpha Futures propose une structure de payouts originale en deux variantes : le mode "Zero" (5 winning days ≥ $200, cap 50% profits, max $1K-$2.5K/cycle) pour des retraits rapides et fréquents, et le mode "Advanced" (max $15K/request, jusqu\'à 4 monthly withdrawals) pour les traders qui veulent retirer en gros bloc. Cette dualité distingue Alpha Futures des autres firmes 2026 et permet d\'adapter la stratégie de retrait à la taille du compte. Profit split 90/10 standard, drawdown trailing, plans 25K à 150K.',
    website: 'https://alpha-futures.com',
    founded: '2023',
    country: 'États-Unis',
    platform: 'Rithmic · NinjaTrader · Tradovate · Quantower',
    ddType: 'Trailing drawdown',
    splits: 'Profit split 90/10 standard.',
    keyFacts: [
      'Payouts Zero : 5 winning days, cap 50%',
      'Payouts Advanced : jusqu\'à $15K/request',
      'Profit split 90/10',
      'Trailing drawdown',
      'Plans 25K à 150K',
    ],
    faqs: [
      {
        q: 'Qu\'est-ce que le payout Zero chez Alpha Futures ?',
        a: 'Le mode Zero permet des payouts plus rapides : 5 winning days minimum à $200+, cap à 50% des profits, plafond $1K (25K) à $2.5K (100K) par cycle. Optimisé pour les traders qui veulent retirer souvent en petits montants.',
      },
      {
        q: 'Qu\'est-ce que le payout Advanced chez Alpha Futures ?',
        a: 'Le mode Advanced (50K, 100K, 150K) permet jusqu\'à $15,000 par request avec jusqu\'à 4 monthly withdrawals — orienté traders qui scaleent gros et retirent en bloc.',
      },
      {
        q: 'Alpha Futures vs Topstep ?',
        a: 'Alpha Futures est trailing (Topstep est EOD-only) mais propose une dualité Zero/Advanced que Topstep n\'a pas. Topstep a un track record plus long et une visibilité plus large. Le choix dépend de la philosophie de payout préférée.',
      },
    ],
  },
}

// Helpers pour récupérer les firms ordonnées (utilisé sur l'index)
export function getFirmsOrdered() {
  return FIRM_SUGGESTIONS.map((name) => ({
    name,
    slug: firmToSlug(name),
    meta: FIRM_META[name] || null,
    plans: PROPFIRM_RULES[name]?.plans || [],
  }))
}

// Catégorise une clé de règle en section (pour grouper l'affichage)
// Retourne : 'drawdown' | 'profit' | 'trading' | 'contracts' | 'pricing' | 'payouts' | 'multi' | 'other'
export function categorizeRule(key) {
  const k = key.toLowerCase()
  if (/drawdown|loss limit|mll|dll/.test(k)) return 'drawdown'
  if (/profit\s*target|profit\s*split|consistency|min.*profit/.test(k)) return 'profit'
  if (/instrument|news|copy|overnight|auto-flat|dca|scalp/.test(k)) return 'trading'
  if (/contract|scaling|lot|micro|mini/.test(k)) return 'contracts'
  if (/prix|price|reset|fee|level 2|discount|new accounts limit|data|platform/.test(k)) return 'pricing'
  if (/payout|withdraw|méthode|cap|cadence|délai|approbation|min.*winning/.test(k)) return 'payouts'
  if (/simul|comptes/.test(k)) return 'multi'
  return 'other'
}

export const RULE_CATEGORIES = [
  { id: 'drawdown', label: 'Drawdown & Loss Limits' },
  { id: 'profit', label: 'Profit Target & Consistency' },
  { id: 'trading', label: 'Règles de trading' },
  { id: 'contracts', label: 'Contracts & Scaling' },
  { id: 'pricing', label: 'Prix & Frais' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'multi', label: 'Multi-comptes' },
  { id: 'other', label: 'Autres règles' },
]

// ============================================================================
// FIRM-vs-FIRM COMPARISON HELPERS (Phase 3.2)
// ============================================================================

// Génère toutes les paires uniques (firmA, firmB) avec firmA < firmB (alphabétique)
// 11 firms → C(11,2) = 55 paires
export function getAllFirmPairs() {
  const pairs = []
  for (let i = 0; i < FIRM_SUGGESTIONS.length; i++) {
    for (let j = i + 1; j < FIRM_SUGGESTIONS.length; j++) {
      const a = FIRM_SUGGESTIONS[i]
      const b = FIRM_SUGGESTIONS[j]
      // Canonical order = alphabetical by slug (stable URLs)
      const slugA = firmToSlug(a)
      const slugB = firmToSlug(b)
      const [first, firstSlug, second, secondSlug] = slugA < slugB
        ? [a, slugA, b, slugB]
        : [b, slugB, a, slugA]
      pairs.push({ firmA: first, firmB: second, slug: `${firstSlug}-vs-${secondSlug}` })
    }
  }
  return pairs
}

// Parse "topstep-vs-apex-trader-funding" → { firmA: 'Topstep', firmB: 'Apex Trader Funding' }
// Returns null if invalid or if either side doesn't match a known firm.
// Handles -vs- delimiter even when firm slugs themselves contain hyphens.
export function slugToPair(pairSlug) {
  if (!pairSlug || !pairSlug.includes('-vs-')) return null
  // Try every possible split point on '-vs-' (firm slugs can contain '-vs-' theoretically not, but safe)
  // Greedy: prefer earliest split
  const parts = pairSlug.split('-vs-')
  // The slug pattern is exactly two slugs joined by -vs-, but firm slugs can contain hyphens.
  // Try all splits and validate both sides.
  for (let i = 1; i < parts.length; i++) {
    const left = parts.slice(0, i).join('-vs-')
    const right = parts.slice(i).join('-vs-')
    const firmA = slugToFirm(left)
    const firmB = slugToFirm(right)
    if (firmA && firmB && firmA !== firmB) {
      return { firmA, firmB, slugA: left, slugB: right }
    }
  }
  return null
}

// "comparison-friendly" rule keys that exist in most firms — these are the rows
// we want to display in the head-to-head table. Each entry maps a display label
// to a regex that matches the rule key in PROPFIRM_RULES.
// The first matching rule per firm is picked for the comparison.
export const COMPARISON_ROWS = [
  { label: 'Type de drawdown', match: /MLL\s*mécanique|drawdown\s+(type|mécanique)/i, fromMeta: 'ddType' },
  { label: 'Drawdown ($)', match: /^(Max Loss Limit|Drawdown\s+(total|trailing)\s*max|MLL\s*\$|Trailing\s*Drawdown)/i },
  { label: 'Daily Loss Limit', match: /^Daily\s*Loss\s*Limit|^DLL\b/i },
  { label: 'Profit Target', match: /^Profit\s*Target\s*\(?(Combine|Evaluation)?\)?\s*$|^Profit\s*Target$/i },
  { label: 'Profit Split', match: /^Profit\s*Split/i, fromMeta: 'splits' },
  { label: 'Min winning days (payout)', match: /winning\s*day|min.*winning|XFA\s*Standard.*winning/i },
  { label: 'Consistency rule', match: /^Consistency\b/i },
  { label: 'Trading des news', match: /trading\s*des\s*news|news\s*trading/i },
  { label: 'Auto-flat / overnight', match: /auto-?flat|overnight/i },
  { label: 'Copy trading externe', match: /copy\s*trading/i },
  { label: 'Max contracts', match: /^Max\s*contracts?\b/i },
  { label: 'Méthodes payout', match: /m[ée]thodes?\s*payout/i },
  { label: 'Cadence payout', match: /cadence\s*payout/i },
  { label: 'Prix mensuel', match: /^Prix\s*mensuel|monthly\s*price/i },
]

// Picks a value for a given comparison row + firm + plan.
// Returns null if no matching rule exists.
export function pickComparisonValue(firmName, ruleKeys, planSize, row, meta) {
  // First, fromMeta (editorial metadata) takes precedence
  if (row.fromMeta && meta && meta[row.fromMeta]) {
    return meta[row.fromMeta]
  }
  if (!ruleKeys) return null
  const matchingKey = ruleKeys.find((k) => row.match.test(k))
  if (!matchingKey) return null
  // ruleKeys is a map. We need to look up firm.rules[matchingKey][plan]
  // But this function only has ruleKeys (array). The caller must do the lookup.
  return matchingKey
}

// Mid-tier plan picker — find the closest plan to 50K (the standard size used
// for fair comparison across firms).
export function pickComparisonPlan(firm) {
  const plans = firm?.plans || []
  if (!plans.length) return null
  // Prefer 50k > 100k > first
  if (plans.includes('50k')) return '50k'
  if (plans.includes('100k')) return '100k'
  return plans[0]
}
