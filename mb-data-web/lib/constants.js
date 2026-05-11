// PropFirm rules data — vérifiées 2024/2025 (toujours vérifier sur le site officiel)
// Toutes les firmes futures ci-dessous utilisent un drawdown TRAILING avec stop au balance initial.
export const PROPFIRM_RULES = {
  'Topstep': {
    // Trading Combine — 1 phase, abonnement mensuel. Trailing DD intraday (suit le peak)
    // qui se fige une fois starting balance + buffer atteint.
    // Profit split 90/10 depuis janv 2026 (avant : 100% des premiers $10K puis 90/10).
    // Source : help.topstep.com + tradecovex.com 2026
    plans: ['50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'50k':'$3,000','100k':'$6,000','150k':'$9,000'},
      'Drawdown trailing max':    {'50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'Drawdown journalier max':  {'50k':'$1,000','100k':'$2,000','150k':'$3,000'},
      'Jours de trading min':     {'50k':'2 jours (≥$150 win)','100k':'2 jours','150k':'2 jours'},
      'Profit min jour valide':   {'50k':'$150','100k':'$200','150k':'$200'},
      'Règle de cohérence':       {'50k':'Best day < 50% du total','100k':'< 50%','150k':'< 50%'},
      // Trading
      'Positions overnight':      {'50k':'Permis (slippage risk)','100k':'Permis','150k':'Permis'},
      'Trading des news':         {'50k':'Autorisé (pas de fills garantis)','100k':'Autorisé','150k':'Autorisé'},
      'DCA (renforcement)':       {'50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      // Contrats
      'Contrats max (mini)':      {'50k':'5','100k':'10','150k':'15'},
      'Contrats max (micro)':     {'50k':'50','100k':'100','150k':'150'},
      // Tarifs
      'Prix mensuel':             {'50k':'$49','100k':'$99','150k':'$149'},
      'Frais activation funded':  {'50k':'$149 (path standard, $0 si No-Fee path)','100k':'$149','150k':'$149'},
      'Reset cost':               {'50k':'Inclus (renouvellement = reset)','100k':'Inclus','150k':'Inclus'},
      // Payouts
      'Répartition gains':        {'50k':'90% trader / 10% firme','100k':'90% / 10%','150k':'90% / 10%'},
      'Payout minimum':           {'50k':'Aucun min','100k':'Aucun','150k':'Aucun'},
      'Délai payout':             {'50k':'24-48h ACH','100k':'24-48h','150k':'24-48h'},
      // Multi-comptes
      'Combines simul. par taille':{'50k':'1 actif','100k':'1 actif','150k':'1 actif'},
    }
  },
  'Apex Trader Funding': {
    // Apex 4.0 (depuis mars 2026) — paiement one-time, plus de mensuel.
    // Trailing DD EOD : se gèle à starting balance + $100 après le 1er payout (pas avant).
    // Note : 75K/250K/300K ne sont plus vendus en 4.0 mais conservés pour utilisateurs legacy.
    // Le trail intraday existe aussi en option (~30% moins cher). Source : proptradingvibes.com 2026
    plans: ['25k','50k','75k','100k','150k','250k','300k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500','50k':'$3,000','75k':'$4,250','100k':'$6,000','150k':'$9,000','250k':'$15,000','300k':'$20,000'},
      'Drawdown trailing max':    {'25k':'$1,500','50k':'$2,500','75k':'$2,750','100k':'$3,000','150k':'$5,000','250k':'$6,500','300k':'$7,500'},
      'Drawdown journalier max':  {'25k':'$500','50k':'$1,000','75k':'$1,250','100k':'$1,500','150k':'$2,000','250k':'$3,000','300k':'$3,500'},
      'Jours de trading min':     {'25k':'0 (aucun)','50k':'0','75k':'0','100k':'0','150k':'0','250k':'0','300k':'0'},
      'Profit min jour valide':   {'25k':'$0 (aucun)','50k':'$0','75k':'$0','100k':'$0','150k':'$0','250k':'$0','300k':'$0'},
      'Règle de cohérence (eval)':{'25k':'Aucune','50k':'Aucune','75k':'Aucune','100k':'Aucune','150k':'Aucune','250k':'Aucune','300k':'Aucune'},
      // Trading
      'Positions overnight':      {'25k':'Non (flat 16:59 ET)','50k':'Non','75k':'Non','100k':'Non','150k':'Non','250k':'Non','300k':'Non'},
      'Trading des news':         {'25k':'Eval: autorisé · PA: restrictions Tier-1','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      'DCA (renforcement)':       {'25k':'Autorisé','50k':'Autorisé','75k':'Autorisé','100k':'Autorisé','150k':'Autorisé','250k':'Autorisé','300k':'Autorisé'},
      // Contrats
      'Contrats max eval (mini)': {'25k':'4','50k':'6','75k':'8','100k':'8','150k':'12','250k':'16','300k':'20'},
      'Contrats max funded (mini)':{'25k':'2','50k':'4','75k':'6','100k':'6','150k':'9','250k':'12','300k':'15'},
      // Tarifs (one-time, EOD trailing)
      'Prix one-time (EOD)':      {'25k':'$177','50k':'$197','75k':'$247','100k':'$297','150k':'$397','250k':'$517','300k':'$617'},
      'Prix one-time (intraday)': {'25k':'$118','50k':'$131','75k':'$165','100k':'$198','150k':'$265','250k':'$345','300k':'$412'},
      'Frais activation PA':      {'25k':'$99 (EOD) / $79 (intra)','50k':'$99 / $79','75k':'$99 / $79','100k':'$99 / $79','150k':'$99 / $79','250k':'$99 / $79','300k':'$99 / $79'},
      'Reset cost':               {'25k':'$80','50k':'$80','75k':'$80','100k':'$80','150k':'$80','250k':'$80','300k':'$80'},
      // Payouts
      'Répartition gains':        {'25k':'100% des premiers $25K puis 90/10','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      'Payout minimum':           {'25k':'$500 + safety net','50k':'$500','75k':'$500','100k':'$500','150k':'$500','250k':'$500','300k':'$500'},
      'Délai payout':             {'25k':'24-48h (Wise/ACH)','50k':'24-48h','75k':'24-48h','100k':'24-48h','150k':'24-48h','250k':'24-48h','300k':'24-48h'},
      // Multi-comptes
      'Comptes simul.':           {'25k':'20 eval, 1 PA par eval','50k':'20 / 1','75k':'20 / 1','100k':'20 / 1','150k':'20 / 1','250k':'20 / 1','300k':'20 / 1'},
    }
  },
  'Bulenox': {
    // Qualification — abonnement mensuel. 2 options par compte :
    //   1) No Scaling : trailing real-time, AUCUN daily loss limit
    //   2) EOD : trailing EOD + DLL + scaling
    // Les valeurs ci-dessous correspondent à l'option **EOD** (la plus courante).
    // Trailing se gèle au starting balance après le 1er payout.
    // Source : proptradingvibes.com + bulenox.com/help
    plans: ['25k','50k','100k','150k','250k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500','50k':'$3,000','100k':'$6,000','150k':'$9,000','250k':'$15,000'},
      'Drawdown trailing max':    {'25k':'$1,500','50k':'$2,500','100k':'$3,000','150k':'$4,500','250k':'$5,500'},
      'Drawdown journalier max':  {'25k':'$500 (EOD) · Aucun (No Scaling)','50k':'$1,100 / Aucun','100k':'$2,200 / Aucun','150k':'$3,300 / Aucun','250k':'$4,500 / Aucun'},
      'Jours de trading min':     {'25k':'0 (aucun)','50k':'0','100k':'0','150k':'0','250k':'0'},
      'Profit min jour valide':   {'25k':'$0 (aucun)','50k':'$0','100k':'$0','150k':'$0','250k':'$0'},
      'Règle de cohérence (eval)':{'25k':'Aucune (40% sur Master/Funded)','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      // Trading
      'Positions overnight':      {'25k':'Non (flat 15:59 CT)','50k':'Non','100k':'Non','150k':'Non','250k':'Non'},
      'Trading des news':         {'25k':'Autorisé (pas de blackout FOMC/CPI/NFP)','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé','250k':'Autorisé'},
      'DCA (renforcement)':       {'25k':'Autorisé (algos OK, HFT interdit)','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé','250k':'Autorisé'},
      // Contrats
      'Contrats max (mini)':      {'25k':'3','50k':'7-10','100k':'12-15','150k':'15-20','250k':'25'},
      // Tarifs (codes promo permanents -70/-80%)
      'Prix mensuel (estimé)':    {'25k':'~$96/mois (souvent ~$30 net)','50k':'~$120/mois','100k':'~$200/mois','150k':'~$280/mois','250k':'~$365/mois'},
      'Frais activation funded':  {'25k':'$148 one-time','50k':'$148','100k':'$148','150k':'$148','250k':'$148'},
      'Reset cost':               {'25k':'Gratuit à billing date, $78 sinon','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      // Payouts
      'Répartition gains':        {'25k':'90% trader / 10% firme','50k':'90% / 10%','100k':'90% / 10%','150k':'90% / 10%','250k':'90% / 10%'},
      'Payout minimum':           {'25k':'Aucun min strict','50k':'Aucun','100k':'Aucun','150k':'Aucun','250k':'Aucun'},
      'Délai payout':             {'25k':'7 jours (mercredi)','50k':'7j','100k':'7j','150k':'7j','250k':'7j'},
      // Multi-comptes
      'Comptes simul.':           {'25k':'20 max','50k':'20','100k':'20','150k':'20','250k':'20'},
    }
  },
  'Lucid Trading': {
    // LucidFlex — 2 phases : Évaluation (1 fee unique, 50% consistency) puis Funded (90/10, pas de consistency)
    // MLL = Max Loss Limit EOD : check une seule fois à la clôture du marché.
    // Une fois le profit max atteint, le MLL se "locke" à : Initial MLL + $100 (mécanisme spécifique Lucid).
    // Source : saveonpropfirms.com/blog/lucid-trading-lucidflex-guide
    // Plateformes : Rithmic, Tradovate, NinjaTrader (pas ProjectX). Trading hours : Dim-Jeu 18h–16h45 EST.
    plans: ['25k','50k','100k','150k'],
    rules: {
      // === Évaluation (LucidFlex Eval) — règles principales ===
      'Objectif de profit':       {'25k':'$1,250','50k':'$3,000','100k':'$6,000','150k':'$9,000'},
      'Drawdown trailing max':    {'25k':'$1,000','50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'Drawdown journalier max':  {'25k':'Aucun (EOD only)','50k':'Aucun','100k':'Aucun','150k':'Aucun'},
      'Jours de trading min':     {'25k':'2 jours (3-7 conseillés)','50k':'2 jours','100k':'2 jours','150k':'2 jours'},
      'Profit min jour valide':   {'25k':'$150','50k':'$150','100k':'$150','150k':'$150'},
      'Règle de cohérence':       {'25k':'≤ 50% (Eval uniquement)','50k':'≤ 50% (Eval uniquement)','100k':'≤ 50% (Eval uniquement)','150k':'≤ 50% (Eval uniquement)'},
      'Limite de temps Eval':     {'25k':'Aucune','50k':'Aucune','100k':'Aucune','150k':'Aucune'},
      // === Trading restrictions ===
      'Heures de trading':        {'25k':'Dim-Jeu 18h–16h45 EST','50k':'Dim-Jeu 18h–16h45 EST','100k':'Dim-Jeu 18h–16h45 EST','150k':'Dim-Jeu 18h–16h45 EST'},
      'Positions overnight':      {'25k':'Non (auto-close 16h45 EST)','50k':'Non','100k':'Non','150k':'Non'},
      'Trading des news':         {'25k':'Autorisé (NFP, FOMC, CPI)','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      // === Contrats max ===
      'Contrats max (mini)':      {'25k':'2','50k':'4','100k':'6','150k':'10'},
      'Contrats max (micro)':     {'25k':'20','50k':'40','100k':'60','150k':'100'},
      // === Tarifs (one-time fee, pas de mensuel) ===
      'Prix évaluation':          {'25k':'$100 (~$50 code SOPF)','50k':'$130 (~$65)','100k':'$225 (~$158)','150k':'$315 (~$221)'},
      'Frais activation':         {'25k':'Aucun','50k':'Aucun','100k':'Aucun','150k':'Aucun'},
      'Reset compte':             {'25k':'Non spécifié','50k':'Non spécifié','100k':'Non spécifié','150k':'Non spécifié'},
      // === Payouts (Funded phase) ===
      'Répartition gains':        {'25k':'90% trader / 10% firme','50k':'90% / 10%','100k':'90% / 10%','150k':'90% / 10%'},
      'Payout minimum':           {'25k':'$500','50k':'$500','100k':'$500','150k':'$500'},
      'Payout maximum':           {'25k':'50% du balance ($1K-$3K cap)','50k':'50% du balance','100k':'50% du balance','150k':'50% du balance'},
      'Conditions payout':        {'25k':'5 jours profitables + net positif','50k':'5 jours profitables','100k':'5 jours profitables','150k':'5 jours profitables'},
      'Délai payout':             {'25k':'1-15 min approval (Plaid same-day, sinon 2j)','50k':'Same-day Plaid / 2j','100k':'Same-day / 2j','150k':'Same-day / 2j'},
      'Nb max payouts':           {'25k':'6 (puis transition LucidLive)','50k':'6 (puis LucidLive)','100k':'6 (puis LucidLive)','150k':'6 (puis LucidLive)'},
      // === Multi-comptes ===
      'Comptes financés simul.':  {'25k':'5 max (Flex/Pro/Direct combiné)','50k':'5 max','100k':'5 max','150k':'5 max'},
      'Comptes Eval simul.':      {'25k':'10 max','50k':'10 max','100k':'10 max','150k':'10 max'},
    }
  },
  'Tradeify': {
    // 2 familles : Select (40% consistency + trailing EOD) et Growth (DLL + 0% consistency).
    // Les valeurs ci-dessous correspondent à **Select Evaluation** (la plus populaire).
    // Pas de DLL en eval Select. Source : help.tradeify.co + saveonpropfirms.com
    // ⚠ Profit target 50K : conflit entre $2,500 (saveonpropfirms) et $3,000 (autres) — vérif site officiel
    plans: ['25k','50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500','50k':'$3,000','100k':'$6,000','150k':'$9,000'},
      'Drawdown trailing max':    {'25k':'$1,000','50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'Drawdown journalier max':  {'25k':'Aucun (Select) / $600 (Growth)','50k':'Aucun / $1,200','100k':'Aucun / $2,500','150k':'Aucun / $3,750'},
      'Jours de trading min':     {'25k':'3 jours','50k':'3 jours','100k':'3 jours','150k':'3 jours'},
      'Profit min jour valide':   {'25k':'$50','50k':'$100','100k':'$200','150k':'$300'},
      'Règle de cohérence (eval)':{'25k':'40% (Select) / 0% (Growth)','50k':'40% / 0%','100k':'40% / 0%','150k':'40% / 0%'},
      // Trading
      'Positions overnight':      {'25k':'Non (flat fin de session)','50k':'Non','100k':'Non','150k':'Non'},
      'Trading des news':         {'25k':'Autorisé (sans restriction)','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'DCA (renforcement)':       {'25k':'Autorisé','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      // Contrats
      'Contrats max (mini)':      {'25k':'1','50k':'4','100k':'8','150k':'12'},
      'Contrats max (micro)':     {'25k':'10','50k':'40','100k':'80','150k':'120'},
      // Tarifs (one-time, Select)
      'Prix one-time (Select)':   {'25k':'$109','50k':'$159','100k':'$259','150k':'$359'},
      'Prix Growth':              {'25k':'$99','50k':'$149','100k':'$249','150k':'$349'},
      'Frais activation':         {'25k':'$0','50k':'$0','100k':'$0','150k':'$0'},
      'Reset cost':                {'25k':'Renouvellement','50k':'Renouvellement','100k':'Renouvellement','150k':'Renouvellement'},
      // Payouts
      'Répartition gains':        {'25k':'90% trader / 10% firme dès $1','50k':'90% / 10%','100k':'90% / 10%','150k':'90% / 10%'},
      'Payout minimum':           {'25k':'$1,500 above starting','50k':'$1,500','100k':'$1,500','150k':'$1,500'},
      'Délai payout':             {'25k':'Daily (Select Daily) / flexible (Flex)','50k':'idem','100k':'idem','150k':'idem'},
      // Multi-comptes
      'Comptes simul.':           {'25k':'5 max (toutes families)','50k':'5','100k':'5','150k':'5'},
    }
  },
  'Take Profit Trader': {
    // Plans : Test (évaluation), PRO, PRO+ (financés). Les règles ci-dessous
    // correspondent à la phase Test (évaluation) — ce sont elles qui pilotent
    // la courbe de balance et le DD trailing dans Quantara.
    // Pays : 🇺🇸 USA · Flux : Rithmic, CQG · Plateformes : NinjaTrader, Tradovate,
    // TradingView, R|Trader Pro, Quantower, MotiveWave
    plans: ['25k','50k','75k','100k','150k'],
    rules: {
      // === Évaluation (Test) — règles principales ===
      'Objectif de profit':       {'25k':'$1,500','50k':'$3,000','75k':'$4,500','100k':'$6,000','150k':'$9,000'},
      'Drawdown trailing max':    {'25k':'$1,500','50k':'$2,000','75k':'$2,500','100k':'$3,000','150k':'$4,500'},
      'Drawdown journalier max':  {'25k':'Aucun','50k':'Aucun','75k':'Aucun','100k':'Aucun','150k':'Aucun'},
      'Jours de trading min':     {'25k':'5 jours','50k':'5 jours','75k':'5 jours','100k':'5 jours','150k':'5 jours'},
      'Profit min jour valide':   {'25k':'$50','50k':'$100','75k':'$150','100k':'$200','150k':'$300'},
      'Règle de cohérence':       {'25k':'≤ 50% / jour (Test uniquement)','50k':'≤ 50% / jour','75k':'≤ 50% / jour','100k':'≤ 50% / jour','150k':'≤ 50% / jour'},
      // === Trading restrictions ===
      'Positions overnight':      {'25k':'Non (clôture avant fin session)','50k':'Non','75k':'Non','100k':'Non','150k':'Non'},
      'DCA (renforcement)':       {'25k':'Autorisé','50k':'Autorisé','75k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'Annonces éco (Test)':      {'25k':'Autorisé','50k':'Autorisé','75k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'Annonces éco (PRO/PRO+)':  {'25k':'Interdit','50k':'Interdit','75k':'Interdit','100k':'Interdit','150k':'Interdit'},
      'Inactivité max':           {'25k':'5j ouvrés','50k':'5j ouvrés','75k':'5j ouvrés','100k':'5j ouvrés','150k':'5j ouvrés'},
      // === Contrats ===
      'Contrats max (mini)':      {'25k':'3','50k':'6','75k':'9','100k':'12','150k':'15'},
      'Contrats max (micro)':     {'25k':'30','50k':'60','75k':'90','100k':'120','150k':'150'},
      // === Tarifs ===
      'Prix évaluation (mois)':   {'25k':'$150','50k':'$170','75k':'$245','100k':'$330','150k':'$360'},
      'Frais activation PRO':     {'25k':'$130','50k':'$130','75k':'$130','100k':'$130','150k':'$130'},
      // === Payouts (PRO / PRO+) ===
      'Payout minimum':           {'25k':'$250 (frais $50 si <)','50k':'$250','75k':'$250','100k':'$250','150k':'$250'},
      'Délai payout':             {'25k':'24h','50k':'24h','75k':'24h','100k':'24h','150k':'24h'},
      'Mode de retrait':          {'25k':'Virement, PayPal, Wise','50k':'Virement, PayPal, Wise','75k':'Virement, PayPal, Wise','100k':'Virement, PayPal, Wise','150k':'Virement, PayPal, Wise'},
      'Répartition gains':        {'25k':'80% trader (PRO) / 90% (PRO+)','50k':'80% / 90%','75k':'80% / 90%','100k':'80% / 90%','150k':'80% / 90%'},
      'Comptes financés simul.':  {'25k':'5 max','50k':'5 max','75k':'5 max','100k':'5 max','150k':'5 max'},
    }
  },
  'My Funded Futures': {
    // ⚠ Les Star Plans (Starter/Expert/Milestone) ont été DISCONTINUÉS en juillet 2025.
    // Offre actuelle = 3 plans : Core (EOD/80-20), Rapid (intraday/90-10), Pro (EOD/80-20).
    // Les valeurs ci-dessous correspondent à **Core** (EOD trailing, le plus standard).
    // Source : proptradingvibes.com 2026
    plans: ['50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'50k':'$3,000 (6%)','100k':'$6,000 (6%)','150k':'$9,000 (6%)'},
      'Drawdown trailing max':    {'50k':'$1,500 (3%, Core/Pro EOD)','100k':'$3,000','150k':'$4,500'},
      'Drawdown journalier max':  {'50k':'Aucun','100k':'Aucun','150k':'Aucun'},
      'Jours de trading min':     {'50k':'2 jours','100k':'2 jours','150k':'2 jours'},
      'Profit min jour valide':   {'50k':'$200 (winning day)','100k':'$300','150k':'$400'},
      'Règle de cohérence (eval)':{'50k':'Best day < 50% du profit','100k':'< 50%','150k':'< 50%'},
      // Variantes Rapid (intraday trail, plus large DD)
      'DD trailing Rapid':        {'50k':'$2,000 (4% intraday)','100k':'$4,000','150k':'$6,000'},
      // Trading
      'Positions overnight':      {'50k':'Permises','100k':'Permises','150k':'Permises'},
      'Trading des news':         {'50k':'Flat 2 min avant/après Tier-1','100k':'idem','150k':'idem'},
      'DCA (renforcement)':       {'50k':'Scaling micro requis (Core/Rapid)','100k':'idem','150k':'idem'},
      // Tarifs (m=mensuel, o=one-time)
      'Prix Core (m / o)':        {'50k':'$77 / $229','100k':'n/a','150k':'n/a'},
      'Prix Rapid (m / o)':       {'50k':'$129 / $157','100k':'$229 / $267','150k':'$329 / $347'},
      'Prix Pro (m / o)':         {'50k':'$229 / $629','100k':'$329 / $829','150k':'$477 / $1,127'},
      'Frais activation':         {'50k':'$0','100k':'$0','150k':'$0'},
      // Payouts
      'Répartition gains':        {'50k':'Core 80/20 · Rapid 90/10 · Pro 80/20','100k':'idem','150k':'idem'},
      'Payout minimum':           {'50k':'Core/Rapid $250 · Pro $1,000','100k':'idem','150k':'idem'},
      'Cadence payout':           {'50k':'Core/Rapid: tous les 5 winning days · Pro: 14j','100k':'idem','150k':'idem'},
      // Multi-comptes
      'Comptes funded simul.':    {'50k':'5 max sur $50K','100k':'3 max sur $100K','150k':'3 max sur $150K'},
    }
  },
  'Phidias Propfirm': {
    // 3 familles : Static (25K, DD fixe $500), Fundamental (50/100/150K, EOD trailing),
    // Premium/Swing (overnight + weekend OK, prix +).
    // Les valeurs ci-dessous mixent **Static 25K** + **Fundamental** pour 50/100/150K.
    // Source : proptradingvibes.com + tradingtoolshub.com 2026
    plans: ['25k','50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500','50k':'$4,000','100k':'$6,000','150k':'$9,000'},
      'Drawdown trailing max':    {'25k':'$500 (statique fixe)','50k':'$2,500 (EOD trailing)','100k':'$3,000','150k':'$4,500'},
      'Drawdown journalier max':  {'25k':'Aucun','50k':'Aucun','100k':'Aucun','150k':'Aucun'},
      'Jours de trading min':     {'25k':'0 jours','50k':'3 jours','100k':'3 jours','150k':'3 jours'},
      'Profit min jour valide':   {'25k':'$0','50k':'$100 (estimé)','100k':'$150','150k':'$200'},
      'Règle de cohérence (eval)':{'25k':'Exempt','50k':'Aucune (30% sur CASH funded)','100k':'Aucune','150k':'Aucune'},
      // Trading
      'Positions overnight':      {'25k':'Non','50k':'Non (Premium = oui)','100k':'Non (Premium = oui)','150k':'Non (Premium = oui)'},
      'Trading des news':         {'25k':'Autorisé','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'DCA (renforcement)':       {'25k':'Autorisé','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      // Contrats
      'Contrats max (mini)':      {'25k':'2','50k':'10','100k':'14','150k':'17'},
      // Tarifs
      'Prix mensuel':             {'25k':'$55','50k':'$116','100k':'$145','150k':'$173'},
      'Prix one-time':            {'25k':'$277','50k':'$580','100k':'$723','150k':'$863'},
      'Frais activation':         {'25k':'$0','50k':'$0','100k':'$0','150k':'$0'},
      'Reset cost':               {'25k':'Renouvellement','50k':'Renouvellement','100k':'Renouvellement','150k':'Renouvellement'},
      // Payouts
      'Répartition gains':        {'25k':'80/20 → 90/10 après 3e payout','50k':'80/20 → 90/10','100k':'80/20 → 90/10','150k':'80/20 → 90/10'},
      'Délai payout':             {'25k':'1-4h via Phidias Wallet','50k':'1-4h','100k':'1-4h','150k':'1-4h'},
      // Multi-comptes
      'Comptes simul.':           {'25k':'Non spécifié','50k':'Non spécifié','100k':'Non spécifié','150k':'Non spécifié'},
    }
  },
  'Funded Futures Network': {
    // FFN — abonnement mensuel. 2 pacings : Standard (15 jours min, 40% consistency) et
    // Express (7 jours min, 15% consistency). Phase Exhibition (sim funded) avant Live.
    // Source : proptradingvibes.com + fundedfuturesnetwork.com/rules
    plans: ['25k','50k','100k','150k','250k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500','50k':'$3,000','100k':'$6,000','150k':'$9,000','250k':'$15,000'},
      'Drawdown trailing max':    {'25k':'$1,500','50k':'$2,000','100k':'$3,600','150k':'$5,000','250k':'$6,000'},
      'Drawdown journalier max':  {'25k':'Aucun','50k':'Aucun','100k':'Aucun','150k':'Aucun','250k':'Aucun'},
      'Jours de trading min':     {'25k':'15 (Standard) / 7 (Express)','50k':'15 / 7','100k':'15 / 7','150k':'15 / 7','250k':'15 / 7'},
      'Profit min jour valide':   {'25k':'$50','50k':'$100','100k':'$200','150k':'$300','250k':'$500'},
      'Règle de cohérence (eval)':{'25k':'40% (Standard) / 15% (Express)','50k':'40% / 15%','100k':'40% / 15%','150k':'40% / 15%','250k':'40% / 15%'},
      // Trading
      'Positions overnight':      {'25k':'Non (flat 16:50 EST, weekends interdits)','50k':'Non','100k':'Non','150k':'Non','250k':'Non'},
      'Trading des news':         {'25k':'Eval: OK · Funded: flat 1 min avant/après Tier-1','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      'DCA (renforcement)':       {'25k':'Autorisé','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé','250k':'Autorisé'},
      // Tarifs
      'Prix mensuel (estimé)':    {'25k':'~$75/mois (codes -50% courants)','50k':'~$150/mois','100k':'~$220/mois','150k':'~$280/mois','250k':'~$400/mois'},
      'Frais activation Exhib.':  {'25k':'$120 one-time','50k':'$120','100k':'$120','150k':'$120','250k':'$120'},
      'Reset cost':               {'25k':'$100 (pas de free reset)','50k':'$100','100k':'$100','150k':'$100','250k':'$100'},
      'Data fee funded':          {'25k':'$126/mois','50k':'$126/mois','100k':'$126/mois','150k':'$126/mois','250k':'$126/mois'},
      // Payouts
      'Répartition gains':        {'25k':'Sim: 80/20 · Live: 90/10 après $5K cumulés','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      'Payout minimum':           {'25k':'$1,000','50k':'$1,000','100k':'$1,000','150k':'$1,000','250k':'$1,000'},
      'Délai payout (Sim)':       {'25k':'Tous les 3j, max $10K','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      'Délai payout (Live)':      {'25k':'Daily, same-day ACH/PayPal/wire/USDT','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      // Multi-comptes
      'Comptes simul.':           {'25k':'10 max (copy trading limité à 5)','50k':'10','100k':'10','150k':'10','250k':'10'},
    }
  },
  'FuturesELites': {
    // ⚠ Le nom officiel est "FuturesElite" (singulier, futureselite.com).
    // 3 familles : Starter (mensuel), Pro (mensuel cher), Instant Funded (one-time).
    // Les valeurs ci-dessous correspondent à **Starter** (la plus populaire).
    // Site officiel inaccessible via WebFetch, données issues de propfirmplus / propfirmmatch.
    plans: ['50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'50k':'$3,000 (Starter) / $4,000 (Pro)','100k':'$6,000 / $7,500','150k':'$9,000 / $11,000'},
      'Drawdown trailing max':    {'50k':'$2,000 (EOD, locks au starting)','100k':'$3,000','150k':'$5,000'},
      'Drawdown journalier max':  {'50k':'$1,100 (Starter) / Aucun (Pro)','100k':'$2,200 / Aucun','150k':'$3,000 / Aucun'},
      'Jours de trading min':     {'50k':'Non spécifié','100k':'Non spécifié','150k':'Non spécifié'},
      'Profit min jour valide':   {'50k':'$100 (estimé)','100k':'$200','150k':'$300'},
      'Règle de cohérence':       {'50k':'40%','100k':'40%','150k':'40%'},
      // Trading
      'Positions overnight':      {'50k':'Permises (modèle EOD)','100k':'Permises','150k':'Permises'},
      'Trading des news':         {'50k':'Autorisé avec prudence (Tier-1 strict)','100k':'idem','150k':'idem'},
      // Contrats
      'Contrats max (mini)':      {'50k':'4 (Starter) / 5 (Pro)','100k':'7 / 10','150k':'10 / 15'},
      // Tarifs
      'Prix mensuel Starter':     {'50k':'$99 (codes -50% courants)','100k':'$189','150k':'$299'},
      'Prix mensuel Pro':         {'50k':'$189','100k':'$230','150k':'$429'},
      'Prix Instant Funded':      {'50k':'$499 one-time (-40% courant)','100k':'$499','150k':'$699'},
      'Frais activation':         {'50k':'Non spécifié','100k':'Non spécifié','150k':'Non spécifié'},
      // Payouts
      'Répartition gains':        {'50k':'Démarre 80% → 90% → 100% premiers $10K live puis 90/10','100k':'idem','150k':'idem'},
      'Payout minimum':           {'50k':'Non spécifié','100k':'Non spécifié','150k':'Non spécifié'},
      'Délai payout':             {'50k':'Bi-weekly, traité sous 24h','100k':'idem','150k':'idem'},
      // Multi-comptes
      'Comptes simul.':           {'50k':'2 max (fair-play rule)','100k':'2','150k':'2'},
    }
  },
}

export const FIRM_COLORS = ['#2d6fff','#1db87a','#e8504a','#fac775','#a78bfa','#f472b6','#34d399','#fb923c']
export const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
export const MONTHS_FULL = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
export const FIRM_SUGGESTIONS = [
  'Topstep',
  'Apex Trader Funding',
  'Bulenox',
  'Lucid Trading',
  'Tradeify',
  'Take Profit Trader',
  'My Funded Futures',
  'Phidias Propfirm',
  'Funded Futures Network',
  'FuturesELites',
]
export const STATUS_COLORS = { 'Financé': '#1db87a', 'Challenge': '#fac775', 'Échoué': '#e8504a' }

export const PX_FIRMS = {
  'Topstep': 'topstepx',
  'Tradeify': 'tradeify',
  'Take Profit Trader': 'tpt',
  'My Funded Futures': 'mff',
}

// Plans génériques pour firmes non listées dans PROPFIRM_RULES
export const GENERIC_PLANS = ['25k','50k','75k','100k','150k','250k','300k']

// Convertit un plan ('50k', '100k', '25K') en nombre de dollars (50000, 100000, 25000)
export function planSizeNum(plan){
  if(!plan) return 50000
  const m = String(plan).match(/(\d+)/)
  return m ? parseInt(m[1],10)*1000 : 50000
}

// Retourne la liste des plans disponibles pour une firme (ou GENERIC_PLANS)
export function plansForFirm(firmName){
  return PROPFIRM_RULES[firmName]?.plans || GENERIC_PLANS
}

// Retourne le drawdown max (en $ numérique) pour une firme + plan
// Cherche dans PROPFIRM_RULES la règle "Drawdown total max" ou "Drawdown trailing max"
export function maxDrawdown(firmName, plan){
  const rules = PROPFIRM_RULES[firmName]?.rules
  if(!rules || !plan) return null
  const ddKey = Object.keys(rules).find(k =>
    /drawdown\s+(total|trailing)/i.test(k)
  )
  if(!ddKey) return null
  const ddStr = rules[ddKey][plan]
  if(!ddStr) return null
  const m = String(ddStr).match(/[\d,]+/)
  return m ? parseInt(m[0].replace(/,/g,''),10) : null
}

// Indique si la firme utilise un drawdown trailing (selon PROPFIRM_RULES)
export function isTrailingDD(firmName){
  const rules = PROPFIRM_RULES[firmName]?.rules
  if(!rules) return false
  return Object.keys(rules).some(k => /drawdown\s+trailing/i.test(k))
}

// Type de DD par défaut suggéré pour une firme (utilisé à la création d'un compte)
// 3 types possibles : 'static' | 'eod' | 'trailing'
//   - static : ligne fixe (rare, surtout Phidias Static 25K)
//   - eod : trailing en fin de journée (la majorité des firmes futures)
//   - trailing : trailing intraday temps réel
//
// Classification confirmée par user 2026-05 :
//   - Topstep : EOD
//   - Apex : EOD (par défaut) — option Intraday existe aussi, l'user peut switch
//   - Bulenox : Trailing intraday
//   - Lucid / Tradeify / TPT / MFFU / Phidias / FFN / FuturesElite : EOD
const INTRADAY_TRAILING_FIRMS = new Set([
  'Bulenox', // Bulenox utilise du trailing intraday (option par défaut "No Scaling")
])
const EOD_TRAILING_FIRMS = new Set([
  'Topstep',                // EOD trailing (corrigé par user)
  'Apex Trader Funding',    // Apex 4.0 = EOD par défaut (option intraday existe aussi)
  'Lucid Trading',          // EOD avec MLL check à la cloture
  'Tradeify',               // Select Eval = EOD
  'Take Profit Trader',     // EOD trailing
  'My Funded Futures',      // Core/Pro = EOD (Rapid = intraday mais on prend le default)
  'Phidias Propfirm',       // Fundamental = EOD (Static = static)
  'Funded Futures Network', // EOD
  'FuturesELites',          // EOD
])
export function defaultDdType(firmName){
  if(INTRADAY_TRAILING_FIRMS.has(firmName)) return 'trailing'
  if(EOD_TRAILING_FIRMS.has(firmName)) return 'eod'
  if(isTrailingDD(firmName)) return 'eod' // fallback pour firmes inconnues avec règle trailing
  return 'static'
}

// Retourne l'étiquette d'affichage d'un compte : nom personnalisé sinon "Compte du <date>"
export function accountLabel(a){
  if(!a) return ''
  return (a.name && a.name.trim()) ? a.name.trim() : `Compte du ${a.buy_date}`
}

// Retourne le profit target ($ numérique) selon les règles de la firme (sans le balance initial)
export function profitTarget(firmName, plan){
  const rules = PROPFIRM_RULES[firmName]?.rules
  if(!rules || !plan) return null
  const ptKey = Object.keys(rules).find(k => /objectif|profit\s+target/i.test(k))
  if(!ptKey) return null
  const ptStr = rules[ptKey][plan]
  if(!ptStr) return null
  const m = String(ptStr).match(/[\d,]+/)
  return m ? parseInt(m[0].replace(/,/g,''),10) : null
}

// Retourne le balance cible pour un payout (planSize + profit target)
export function defaultPayoutTarget(firmName, plan){
  const pt = profitTarget(firmName, plan)
  if(pt === null) return null
  return planSizeNum(plan) + pt
}

// Retourne le nombre de jours de trading min selon la firme
export function defaultMinTradingDays(firmName, plan){
  const rules = PROPFIRM_RULES[firmName]?.rules
  if(!rules || !plan) return null
  const dKey = Object.keys(rules).find(k => /jours.*trading.*min/i.test(k))
  if(!dKey) return null
  const dStr = rules[dKey][plan]
  if(!dStr) return null
  const m = String(dStr).match(/(\d+)/)
  return m ? parseInt(m[1],10) : null
}

// Retourne le % du profit split pour le trader (ex: 90 pour un split 90/10).
// Cherche la clé "Répartition gains" dans les règles. Pour les valeurs composées
// "80% trader / 90% (PRO+)" prend le PREMIER nombre rencontré.
export function defaultProfitSplit(firmName, plan){
  const rules = PROPFIRM_RULES[firmName]?.rules
  if(!rules || !plan) return null
  const k = Object.keys(rules).find(k => /répartition.*gains|profit.*split/i.test(k))
  if(!k) return null
  const m = String(rules[k][plan]||'').match(/(\d{2,3})\s*%/)
  return m ? parseInt(m[1],10) : null
}

// Retourne le profit minimum par jour ($ numérique) pour qu'un jour compte
// comme "validé" dans le décompte des jours de trading min (payout requirement).
// Ex: Lucid demande $150 profit/jour pour valider un jour de trading.
// Cherche la clé "Profit min jour" / "Min profit / jour" / etc.
export function defaultMinDailyProfit(firmName, plan){
  const rules = PROPFIRM_RULES[firmName]?.rules
  if(!rules || !plan) return null
  const k = Object.keys(rules).find(k =>
    /profit\s*min.*jour|min.*profit.*jour|jour.*valid|min.*winning/i.test(k)
  )
  if(!k) return null
  const m = String(rules[k][plan]||'').match(/\$\s*([\d,]+)/)
  return m ? parseInt(m[1].replace(/,/g,''),10) : null
}

// Retourne le prix challenge approximatif ($ numérique) pour une firme + plan.
// Cherche dans les rules une clé contenant "Prix" ET (mensuel OU one-time OU évaluation).
// Pour les firmes avec multiple variantes, prend la PREMIÈRE clé matchée (ordre du fichier).
// Pour les valeurs composites "X / Y" (ex: MFFU "Prix Core (m / o)" = "$77 / $229"),
// prend la PREMIÈRE valeur ($X = mensuel typiquement).
// → Sert à pré-remplir le champ "Montant dépensé" du formulaire création de compte.
export function defaultChallengePrice(firmName, plan){
  const rules = PROPFIRM_RULES[firmName]?.rules
  if(!rules || !plan) return null
  // Cherche la clé prix la plus appropriée (priorité : mensuel > one-time > évaluation)
  const keys = Object.keys(rules)
  const priceKey =
    keys.find(k => /prix/i.test(k) && /mensuel|évaluation|eval/i.test(k))
    || keys.find(k => /prix.*one[\s-]?time/i.test(k))
    || keys.find(k => /^prix/i.test(k))
  if(!priceKey) return null
  const valStr = rules[priceKey][plan]
  if(!valStr) return null
  // Extrait le PREMIER nombre (avec virgules potentielles) après le 1er $
  const m = String(valStr).match(/\$\s*([\d,]+)/)
  if(!m) return null
  return parseInt(m[1].replace(/,/g,''), 10)
}
