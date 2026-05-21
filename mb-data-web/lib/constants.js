// PropFirm rules data — vérifiées 2024/2025 (toujours vérifier sur le site officiel)
// Toutes les firmes futures ci-dessous utilisent un drawdown TRAILING avec stop au balance initial.
export const PROPFIRM_RULES = {
  'Topstep': {
    // VÉRIFIÉ MAI 2026 (help.topstep.com + tradecovex + proptradingvibes)
    // Trading Combine → Express Funded Account (XFA) → Live Funded Account (LFA)
    // Combine = trailing intraday | XFA/LFA = trailing EOD lock à starting balance
    //
    // CHANGEMENTS RÉCENTS :
    //  - 12 jan 2026 : profit split unifié 90/10 dès le $1 (avant : 100% premiers $10K)
    //  - 5 fév 2026 : path "XFA Consistency" ajouté (3 winning days + $6K min, cap payouts ++)
    //  - 10 fév 2026 : LFA 100K — DLL réduit à $2K si balance EOD < $10K
    //  - Début 2026 : consistency rule 30% → 50% (assoupli)
    //  - Flat OBLIGATOIRE 3:10 PM CT (pas d'overnight)
    plans: ['50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'50k':'$3,000','100k':'$6,000','150k':'$9,000'},
      'Drawdown trailing max':    {'50k':'$2,000 (Combine intraday · XFA EOD)','100k':'$3,000','150k':'$4,500'},
      'Drawdown journalier max':  {'50k':'$1,000','100k':'$2,000','150k':'$3,000'},
      'Jours de trading min':     {'50k':'2 jours gagnants ≥ $150','100k':'2 jours gagnants ≥ $150','150k':'2 jours gagnants ≥ $150'},
      'Profit min jour valide':   {'50k':'$150','100k':'$150','150k':'$150'},
      'Règle de cohérence':       {'50k':'Best day ≤ 50% du target','100k':'≤ 50%','150k':'≤ 50%'},
      // Trading
      'Positions overnight':      {'50k':'INTERDIT (flat 3:10 PM CT)','100k':'INTERDIT','150k':'INTERDIT'},
      'Trading des news':         {'50k':'Autorisé (pas de buffer NFP/CPI/FOMC)','100k':'Autorisé','150k':'Autorisé'},
      'DCA (renforcement)':       {'50k':'Toléré (pas de règle stricte)','100k':'Toléré','150k':'Toléré'},
      // Contrats
      'Contrats max (mini)':      {'50k':'5','100k':'10','150k':'15'},
      'Contrats max (micro)':     {'50k':'50','100k':'100','150k':'150'},
      // Tarifs — 2 paths au choix au checkout
      'Prix mensuel Standard':    {'50k':'$49','100k':'$99','150k':'$149'},
      'Prix mensuel No-Fee path': {'50k':'$95','100k':'$149','150k':'$229'},
      'Frais activation funded':  {'50k':'$149 (Standard) · $0 (No-Activation-Fee)','100k':'$149 · $0','150k':'$149 · $0'},
      'Reset cost':               {'50k':'Inclus dans rebill mensuel (rebill = reset)','100k':'Inclus','150k':'Inclus'},
      // Payouts (POST 12 JAN 2026)
      'Répartition gains':        {'50k':'90% / 10% dès le $1 (depuis 12 jan 2026)','100k':'90% / 10%','150k':'90% / 10%'},
      'Payout minimum':           {'50k':'$125 min withdrawal','100k':'$125','150k':'$125'},
      'Cap par payout':           {'50k':'$2,000 (Standard) · $3,000 (Consistency) — augmente après 1er','100k':'$2,500 · $3,000','150k':'$3,500 · $4,000'},
      'Délai payout':             {'50k':'Same-day si avant cutoff, livraison J+1 ouvré (Wise/ACH/Aeropay)','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'50k':'Aeropay (gratuit) · Wise ($0.39) · ACH/wire ($30) · PayPal RETIRÉ','100k':'idem','150k':'idem'},
      // Multi-comptes
      'Combines simul. par taille':{'50k':'Illimité','100k':'Illimité','150k':'Illimité'},
      'XFA simul. (max)':         {'50k':'5 actifs','100k':'5','150k':'5'},
    }
  },
  'Apex Trader Funding': {
    // VÉRIFIÉ MAI 2026 — REFONTE MAJEURE "APEX 4.0" depuis 1er MARS 2026
    // Sources : apextraderfunding.com + support.apextraderfunding.com + tradecovex
    //
    // CHANGEMENTS APEX 4.0 :
    //  - 🚨 PROFIT SPLIT : 100% TRADER (suppression du 90/10) — le plus généreux du marché
    //  - 🚨 ZÉRO Daily Loss Limit (jamais eu)
    //  - 🚨 DCA INTERDIT sur PA depuis 1er mars 2026 (fail auto immédiat)
    //  - 🚨 Stop-Loss + Take-Profit OBLIGATOIRES (enforcement Rithmic/Tradovate)
    //  - 🚨 Plus de mensuel : one-time only (avec codes promo permanents 50-90%)
    //  - 🚨 Activation fee $99 EOD / $79 Intraday NON discountable
    //  - 🚨 75K, 250K, 300K SUPPRIMÉS pour nouveaux achats (legacy uniquement)
    //  - 🚨 Consistency rule 30% → 50% (assouplie)
    //  - Safety Net = starting + drawdown + $100 (locke le trailing)
    //  - Resets supprimés (racheter une éval avec code promo $17-35)
    //  - 20 PA simultanés max par foyer
    plans: ['25k','50k','75k','100k','150k','250k','300k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500','50k':'$3,000','75k':'$4,250 (legacy)','100k':'$6,000','150k':'$9,000','250k':'$15,000 (legacy)','300k':'$20,000 (legacy)'},
      'Drawdown trailing max':    {'25k':'$1,500 (EOD ou Intraday — choix au checkout)','50k':'$2,500','75k':'$2,750 (legacy)','100k':'$3,000','150k':'$5,000','250k':'$6,500 (legacy)','300k':'$7,500 (legacy)'},
      'Drawdown journalier max':  {'25k':'AUCUNE (Apex n\'a jamais eu de DLL)','50k':'AUCUNE','75k':'AUCUNE','100k':'AUCUNE','150k':'AUCUNE','250k':'AUCUNE','300k':'AUCUNE'},
      'Jours de trading min':     {'25k':'0 (supprimé en 4.0)','50k':'0','75k':'0','100k':'0','150k':'0','250k':'0','300k':'0'},
      'Profit min jour valide':   {'25k':'$0 (PA: 5 jours ≥ $50 entre payouts)','50k':'$0','75k':'$0','100k':'$0','150k':'$0','250k':'$0','300k':'$0'},
      'Règle de cohérence (eval)':{'25k':'Aucune en éval · 50% sur PA payouts (relâché de 30%)','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      'Stop-Loss + Take-Profit':  {'25k':'OBLIGATOIRES sur chaque ordre (enforcement Rithmic/Tradovate) — depuis 4.0','50k':'OBLIGATOIRES','75k':'OBLIGATOIRES','100k':'OBLIGATOIRES','150k':'OBLIGATOIRES','250k':'OBLIGATOIRES','300k':'OBLIGATOIRES'},
      // Trading
      'Positions overnight':      {'25k':'INTERDIT (flat avant close)','50k':'INTERDIT','75k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT','250k':'INTERDIT','300k':'INTERDIT'},
      'Trading des news':         {'25k':'Autorisé (interdit : max size, chasing, hedge des 2 côtés)','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      'DCA (renforcement)':       {'25k':'Eval: autorisé · PA: 🚨 INTERDIT (fail auto) depuis mars 2026','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      'Algos / automation':       {'25k':'INTERDIT — pas d\'algo, HFT, copy trading inter-comptes','50k':'INTERDIT','75k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT','250k':'INTERDIT','300k':'INTERDIT'},
      // Contrats
      'Contrats max eval (mini)': {'25k':'4','50k':'6','75k':'8 (legacy)','100k':'8','150k':'12','250k':'16 (legacy)','300k':'20 (legacy)'},
      'Contrats max funded (mini)':{'25k':'2 → 4 (post safety net)','50k':'4 → 6','75k':'6 (legacy)','100k':'6 → 8','150k':'9 → 12','250k':'12 (legacy)','300k':'15 (legacy)'},
      // Tarifs (one-time uniquement en 4.0, codes promo permanents -50/-90%)
      'Prix one-time (EOD)':      {'25k':'$147 → ~$15-30 avec code','50k':'$167 → ~$17-35','75k':'$207 (legacy)','100k':'$207 → ~$20-50','150k':'$297 → ~$30-75','250k':'$517 (legacy)','300k':'$617 (legacy)'},
      'Prix one-time (intraday)': {'25k':'~30% moins cher que EOD','50k':'idem','75k':'idem (legacy)','100k':'idem','150k':'idem','250k':'idem (legacy)','300k':'idem (legacy)'},
      'Frais activation PA':      {'25k':'$99 EOD / $79 Intraday — NON discountable','50k':'$99 / $79','75k':'$99 / $79','100k':'$99 / $79','150k':'$99 / $79','250k':'$99 / $79','300k':'$99 / $79'},
      'Reset cost':               {'25k':'Supprimés en 4.0 (rachat éval avec code = de facto reset)','50k':'Supprimés','75k':'Supprimés','100k':'Supprimés','150k':'Supprimés','250k':'Supprimés','300k':'Supprimés'},
      'Codes promo permanents':   {'25k':'-50% à -90% en permanence (TSXRGNER, SAVENOW, etc.)','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      // Payouts (Apex 4.0 — 100% cappé par ladder progressive lifetime 6 payouts)
      'Répartition gains':        {'25k':'100% du payout (Apex 4.0) — MAIS cappé par ladder lifetime 6 payouts','50k':'100% cappé ladder','75k':'100% cappé ladder','100k':'100% cappé ladder','150k':'100% cappé ladder','250k':'100% (legacy)','300k':'100% (legacy)'},
      'Payout minimum':           {'25k':'$500','50k':'$500','75k':'$500','100k':'$500','150k':'$500','250k':'$500','300k':'$500'},
      'Payout ladder lifetime':   {'25k':'6 payouts lifetime · scale ~½ du 100K','50k':'6 payouts lifetime · scale du 100K','75k':'(legacy)','100k':'$2K → $2.5K → $2.5K → $3K → $3.5K → $4K (~$17K total, compte ferme)','150k':'Scale proportionnel du 100K','250k':'(legacy)','300k':'(legacy)'},
      'Qualifying days/payout':   {'25k':'5 jours · min $100/jour','50k':'5 jours · min $250 EOD / $200 Intraday','75k':'(legacy)','100k':'5 jours · min $300 EOD / $250 Intraday','150k':'5 jours · min $350 EOD / $300 Intraday','250k':'(legacy)','300k':'(legacy)'},
      'Safety Net (PA)':          {'25k':'$26,100 = starting + DD + $100','50k':'$52,100','75k':'(legacy)','100k':'$103,100','150k':'$154,100','250k':'(legacy)','300k':'(legacy)'},
      'Délai payout':             {'25k':'24-48h processing (Plane/ACH)','50k':'24-48h','75k':'24-48h','100k':'24-48h','150k':'24-48h','250k':'24-48h','300k':'24-48h'},
      'Méthodes payout':          {'25k':'ACH (US) · Plane (international) — Deel supprimé','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      // Restrictions instruments
      'Metals HALT (depuis 14 mars 2026)':{'25k':'🚨 GC, SI, QI, QO, MGC, HG, PL, PA SUSPENDUS — aucun retour annoncé','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      'Auto-flat':                {'25k':'4:59 PM ET (toutes positions fermées · si breach MLL = ban)','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      // Multi-comptes
      'Comptes simul.':           {'25k':'Eval: illimité · PA: 20 max par foyer (copy-trading OK)','50k':'20 PA','75k':'20 PA','100k':'20 PA','150k':'20 PA','250k':'20 PA','300k':'20 PA'},
    }
  },
  'Bulenox': {
    // VÉRIFIÉ MAI 2026 — Qualification mensuelle. 2 OPTIONS au checkout (BINAIRE, irréversible) :
    //   1) No Scaling : trailing REAL-TIME, AUCUN DLL, full contracts day-1
    //   2) EOD : trailing EOD, DLL, scaling plan progressif
    // Sources : bulenox.com/help + proptradingvibes + tradingtoolshub
    // Réputation MITIGÉE — enforcement subjectif de la consistency (Section 5.6 Master Agreement)
    //
    // CHANGEMENTS RÉCENTS :
    //  - Avril 2025 : balance caps Funded (auto-payout au-dessus du cap chaque mercredi)
    //
    // ⚠ FAILLE PAYOUT : refuser le passage Master→Funded après 3 payouts ferme le Master
    //   et fait perdre les profits → forced transition
    plans: ['25k','50k','100k','150k','250k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500 (6%)','50k':'$3,000 (6%)','100k':'$6,000 (6%)','150k':'$9,000 (6%)','250k':'$15,000 (6%)'},
      'Drawdown trailing max':    {'25k':'$1,500 (real-time No Scaling · EOD Option 2)','50k':'$2,500','100k':'$3,000','150k':'$4,500','250k':'$5,500'},
      'Drawdown journalier max':  {'25k':'AUCUN (Option 1) · $500 (Option 2 EOD)','50k':'AUCUN / $1,100 (2.2%)','100k':'AUCUN / $2,200','150k':'AUCUN / $3,300','250k':'AUCUN / $4,500'},
      'Jours de trading min':     {'25k':'0 (one-shot possible)','50k':'0','100k':'0','150k':'0','250k':'0'},
      'Profit min jour valide':   {'25k':'$0','50k':'$0','100k':'$0','150k':'$0','250k':'$0'},
      'Règle de cohérence (eval)':{'25k':'Aucune en éval · 40% sur Master/Funded','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      // Trading
      'Positions overnight':      {'25k':'INTERDIT (flat 15:59 CT)','50k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT','250k':'INTERDIT'},
      'Trading des news':         {'25k':'Autorisé partout (pas de blackout) ⚠ Option 1 = piège (trailing real-time)','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      'DCA (renforcement)':       {'25k':'Autorisé','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé','250k':'Autorisé'},
      'Algos/EAs / copy trading': {'25k':'EAs OK, HFT interdit · Copy/hedging inter-comptes INTERDIT','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      // Contrats Option 1 (No Scaling, full day-1) — Option 2 = scaling progressif
      'Contrats max (mini)':      {'25k':'4 (O1) / 1→4 (O2)','50k':'7 (O1) / 3→4→7 (O2 scaling)','100k':'12 (O1) / 3→5→8→12 (O2 scaling)','150k':'15-20 (O1)','250k':'25 (O1)'},
      'Contrats max (micro)':     {'25k':'40','50k':'70','100k':'120','150k':'150-200','250k':'250'},
      // Tarifs (codes promo permanents -45/-89%)
      'Prix mensuel (list)':      {'25k':'~$145','50k':'$175 (discount $125)','100k':'$215 ($155 discount)','150k':'~$325','250k':'~$535'},
      'Frais activation Master':  {'25k':'$130 (tradingfinder) — $98 selon quantvps · DISPUTÉ à vérifier au checkout','50k':'$150-220 selon source','100k':'$220','150k':'$260-490 selon source · DISPUTÉ','250k':'$300-490 selon source · DISPUTÉ'},
      'Reset cost':               {'25k':'$78 (gratuit le jour de facturation)','50k':'$78','100k':'$78','150k':'$78','250k':'$78'},
      'Data fee Pro':             {'25k':'$116/mo si Professional','50k':'$116/mo','100k':'$116/mo','150k':'$116/mo','250k':'$116/mo'},
      'Codes promo':              {'25k':'VIBES (~45%), LUMI (89%), TRADINGSTRATEGY89 (89%)','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      // Payouts (post avril 2025 — balance caps)
      'Répartition gains':        {'25k':'100% des premiers $10K puis 90/10','50k':'100% $10K puis 90/10','100k':'idem','150k':'idem','250k':'idem'},
      'Payout minimum':           {'25k':'$1,000','50k':'$1,000','100k':'$1,000','150k':'$1,000','250k':'$1,000'},
      'Max withdrawal (3 premiers)':{'25k':'$1,000','50k':'$1,500','100k':'$1,750','150k':'$2,000','250k':'$2,500'},
      'Safety threshold reserve': {'25k':'$1,600','50k':'$2,600','100k':'$3,100','150k':'$4,600','250k':'$5,600'},
      'Min jours Master':         {'25k':'10 jours avant 1er payout','50k':'10','100k':'10','150k':'10','250k':'10'},
      'Min jours Funded/cycle':   {'25k':'5','50k':'5','100k':'5','150k':'5','250k':'5'},
      'Délai payout':             {'25k':'Hebdo chaque MERCREDI','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      'Méthodes payout':          {'25k':'ACH, Wire, PayPal, Wise','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      // Multi-comptes
      'Comptes simul.':           {'25k':'Qualification: illimité · Master: 11 actifs (3 simul start) · Funded: 1 consolidé','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
    }
  },
  'Lucid Trading': {
    // VÉRIFIÉ MAI 2026 — 5 familles actives : LucidPro, LucidFlex, LucidDirect, LucidLive, LucidMaxx
    // Sources : lucidtrading.com + support.lucidtrading.com + proptradingvibes
    // Les valeurs ci-dessous = **LucidPro** (la famille d'éval la plus standard)
    //
    // CHANGEMENTS RÉCENTS :
    //  - Mars 2026 : profit split 80/20 → 90/10 sur toutes familles
    //  - Fév 2026 : LucidPro pricing baissé + DLL ajoutée en éval (montants non publics)
    //              · LucidBlack DISCONTINUÉ (resets jusqu'au 6 mars 2026)
    //              · LucidMaxx lancé (invite-only, traders avec 15+ payouts)
    //  - Nov 2025 : LucidFlex lancé (PAS de DLL — différenciateur clé)
    //  - Août 2025 : 8-day minimum supprimé sur Pro
    //
    // FAMILLES :
    //   LucidPro  → éval classique (valeurs ci-dessous)
    //   LucidFlex → éval SANS DLL (différenciateur)
    //   LucidDirect → Instant Funding (pas d'éval, prix ++)
    //   LucidLive → real money, swing + overnight + weekend (1 max par foyer, cap $150K)
    //   LucidMaxx → invite-only post-payoutmaxx
    //
    // Plateformes : Rithmic, Tradovate, NinjaTrader (pas ProjectX, pas TradingView)
    plans: ['25k','50k','100k','150k'],
    rules: {
      // === Évaluation LucidPro (one-time, pas de mensuel) ===
      'Objectif de profit':       {'25k':'$1,500 (6%)','50k':'$3,000 (6%)','100k':'$6,000 (6%)','150k':'$9,000 (6%)'},
      'Drawdown trailing max':    {'25k':'$1,000 (EOD trailing)','50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'Drawdown journalier max':  {'25k':'Aucun (25K)','50k':'$1,200 (~2.4%, ajouté fév 2026, soft breach halt journée)','100k':'~$2,400 (extrapolation 2.4%)','150k':'~$3,600 (extrapolation 2.4%)'},
      'Jours de trading min':     {'25k':'1 jour suffit (5j min supprimé fév 2026)','50k':'1 jour','100k':'1 jour','150k':'1 jour'},
      'Profit min jour valide':   {'25k':'$0 (pas de seuil par jour en éval)','50k':'$0','100k':'$0','150k':'$0'},
      'Règle de cohérence':       {'25k':'AUCUNE en éval Pro · 50% en Flex','50k':'AUCUNE Pro · 50% Flex','100k':'idem','150k':'idem'},
      'Limite de temps Eval':     {'25k':'60 jours (LucidPro)','50k':'60 jours','100k':'60 jours','150k':'60 jours'},
      // === Trading restrictions ===
      'Heures de trading':        {'25k':'Auto-flat 16h45 EST (reprise 18h EST)','50k':'idem','100k':'idem','150k':'idem'},
      'Positions overnight':      {'25k':'INTERDIT (Pro/Flex/Direct) · AUTORISÉ uniquement sur LucidLive','50k':'idem','100k':'idem','150k':'idem'},
      'Trading des news':         {'25k':'Autorisé sur toutes familles (NFP, FOMC, CPI)','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'DCA / scalping':           {'25k':'Autorisé (pas de min hold time)','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'Bots / copy trading':      {'25k':'Autorisés (trader responsable)','50k':'Autorisés','100k':'Autorisés','150k':'Autorisés'},
      // === Contrats max ===
      'Contrats max (mini)':      {'25k':'2','50k':'4','100k':'6','150k':'10'},
      'Contrats max (micro)':     {'25k':'20','50k':'40','100k':'60','150k':'100'},
      // === Tarifs (one-time, retail / discount avec code VIBES -40%) ===
      'Prix LucidPro (retail)':   {'25k':'~$157','50k':'$215','100k':'$299','150k':'~$432'},
      'Prix LucidPro (VIBES -40%)':{'25k':'$94.50','50k':'$129.50','100k':'$199.50','150k':'$259.00'},
      'Prix LucidFlex':           {'25k':'$164 retail (~$98.50 avec VIBES)','50k':'~$245 retail','100k':'$295 retail','150k':'~$415 retail'},
      'Prix LucidDirect (instant)':{'25k':'$197','50k':'$549','100k':'$799 (ajouté fév 2026)','150k':'$899'},
      'Frais activation':         {'25k':'$0 (aucun)','50k':'$0','100k':'$0','150k':'$0'},
      'Codes promo':              {'25k':'VIBES -40%, NINJA, SOPF, DGT (35-50% courant)','50k':'idem','100k':'idem','150k':'idem'},
      'Reset compte':             {'25k':'Non documenté précisément','50k':'idem','100k':'idem','150k':'idem'},
      // === Payouts ===
      'Répartition gains':        {'25k':'90% / 10% (depuis mars 2026) · grandfathered avant 28/11/2025 = 100% premiers $10K','50k':'90% / 10%','100k':'90% / 10%','150k':'90% / 10%'},
      'Payout minimum':           {'25k':'$500','50k':'$500','100k':'$500','150k':'$500'},
      'Conditions payout':        {'25k':'5 jours profitables + net positif','50k':'idem','100k':'idem','150k':'idem'},
      'Délai payout':             {'25k':'~15 min approval, fonds en 2 jours ouvrés','50k':'idem','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'25k':'ACH, PayPal, Rise, international wire','50k':'idem','100k':'idem','150k':'idem'},
      'Cadence payout':           {'25k':'Tous les 3 jours calendaires après 5 jours profitables','50k':'idem','100k':'idem','150k':'idem'},
      // === Multi-comptes ===
      'Comptes financés simul.':  {'25k':'5 max par foyer (toutes familles confondues)','50k':'5 max','100k':'5 max','150k':'5 max'},
      'Comptes Eval simul.':      {'25k':'10 max par foyer','50k':'10 max','100k':'10 max','150k':'10 max'},
    }
  },
  'Tradeify': {
    // VÉRIFIÉ MAI 2026 — 3 familles : Select (40% consistency, no DLL) + Growth (DLL, no consistency) + Lightning Funded (instant)
    // Sources : help.tradeify.co + saveonpropfirms + proptradingvibes
    // CEO Brett Simba (Floride USA). +$100M payés. Trustpilot 4.8
    //
    // SPÉCIFICITÉ KILLER : drawdown se LOCK à +$100 au-dessus du starting balance
    // (ex: 50K → drawdown se fige à $50,100 — RARE et très trader-friendly)
    //
    // PAYOUT WINDOWS FIXES : 1-4 et 15-18 de chaque mois (pas on-demand)
    // ⚠ 25K Eval probablement RETIRÉ (sources contradictoires fin 2025 / début 2026)
    // ⚠ Pas de PayPal / ACH (seulement bank wire, Wise, crypto BTC/ETH/USDT)
    plans: ['25k','50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500 (Lightning seulement)','50k':'$3,000','100k':'$6,000','150k':'$9,000'},
      'Drawdown trailing max':    {'25k':'$1,000 EOD','50k':'$2,000 EOD · lock +$100 starting','100k':'$3,000 EOD · lock +$100','150k':'$4,500 EOD · lock +$100'},
      'Drawdown journalier max':  {'25k':'Lightning : selon scaling','50k':'AUCUN (Select) · $1,250 (Growth, soft breach)','100k':'AUCUN · $2,500','150k':'AUCUN · $3,750'},
      'Jours de trading min':     {'25k':'1 (Growth) · 3 (Select)','50k':'3 (Select, à cause 40% consist) · 1 (Growth)','100k':'idem','150k':'idem'},
      'Profit min jour valide':   {'25k':'$50','50k':'$100','100k':'$200','150k':'$300'},
      'Règle de cohérence (eval)':{'25k':'Lightning : 20% → 25% → 30% (progressive)','50k':'40% (Select) · AUCUNE (Growth, 35% en funded)','100k':'40% (Select) · AUCUNE (Growth)','150k':'40% (Select) · AUCUNE (Growth)'},
      // Trading
      'Positions overnight':      {'25k':'INTERDIT (flat fin de session, sources contradictoires)','50k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT'},
      'Trading des news':         {'25k':'Autorisé sans restriction (NFP, FOMC, CPI)','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'DCA (renforcement)':       {'25k':'Autorisé','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'Algos / copy trading':     {'25k':'Algos OK, HFT interdit. Copy entre vos comptes OK','50k':'idem','100k':'idem','150k':'idem'},
      // Contrats (source help.tradeify.co officielle)
      'Contrats max (mini)':      {'25k':'Lightning seulement','50k':'4','100k':'8','150k':'12'},
      'Contrats max (micro)':     {'25k':'Lightning seulement','50k':'40','100k':'80','150k':'120'},
      // Tarifs (one-time)
      'Prix one-time (Select)':   {'25k':'n/a','50k':'~$159 (codes DASH/PTV ~33-50%)','100k':'~$259','150k':'~$359'},
      'Prix Growth (code DASH)':  {'25k':'n/a','50k':'$59 (avec code)','100k':'$119 (avec code) / $199 normal','150k':'~$299'},
      'Prix Lightning Funded':    {'25k':'$244 one-time','50k':'$299','100k':'$425','150k':'$510'},
      'Frais activation':         {'25k':'$0 (waived sur tous plans)','50k':'$0','100k':'$0','150k':'$0'},
      'Reset cost':               {'25k':'$95 toutes tailles','50k':'$95','100k':'$95','150k':'$95'},
      // Payouts (correction agent : split différent par famille)
      'Répartition gains':        {'25k':'Lightning : 100% premier $15K cumulé puis 90/10','50k':'Select : 90/10 dès $1 · Growth/Lightning : 100% premier $15K puis 90/10','100k':'idem','150k':'idem'},
      'Payout minimum':           {'25k':'$1,500 above starting (Growth/Lightning) · varies (Select)','50k':'idem · cap progressif $1,000 → $1,250 → $3,000','100k':'idem','150k':'idem'},
      'Délai payout':             {'25k':'Windows FIXES : 1-4 et 15-18 de chaque mois (sauf Select Daily option)','50k':'idem','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'25k':'Rise (primaire) + Plane (backup) — PAS de PayPal direct ni ACH/Wire/Wise','50k':'idem','100k':'idem','150k':'idem'},
      // Multi-comptes
      'Comptes simul.':           {'25k':'Funded: 5 max par foyer (toutes familles) · Eval: 15 max sur 30j','50k':'5 funded max','100k':'5 funded max','150k':'5 funded max'},
    }
  },
  'Take Profit Trader': {
    // VÉRIFIÉ MAI 2026 — Modèle 3 PHASES unique : Test → PRO (80/20, intraday DD) → PRO+ (90/10, EOD DD)
    // Sources : takeprofittraderhelp.zendesk.com + proptradingvibes + propfirmplus
    // CEO James Sixsmith. Houston Texas USA. Leader marché US.
    //
    // CHANGEMENTS RÉCENTS :
    //  - 🚨 Jan 2025 : DLL SUPPRIMÉE sur toutes les phases (seul guardrail = trailing DD)
    //  - 18 mars 2026 : PRO+ auto-promotion COMPLÈTE (pas d'application, $0 fee)
    //  - 28 jan 2026 : panne Tradovate (~2j) — comptes affectés remédiés
    //
    // ⚠ PIÈGE CLASSIQUE : switch DD Test EOD → PRO INTRADAY (peak real-time incl. unrealized)
    //   → beaucoup de traders cassent leur PRO sur ce switch. Puis PRO+ retour EOD.
    plans: ['25k','50k','75k','100k','150k'],
    rules: {
      // === Évaluation (Test) ===
      'Objectif de profit':       {'25k':'$1,500 (6%)','50k':'$3,000 (6%)','75k':'$4,500 (6%)','100k':'$6,000 (6%)','150k':'$9,000 (6%)'},
      'Drawdown trailing max':    {'25k':'$1,500 EOD (Test) → INTRADAY (PRO) → EOD (PRO+)','50k':'$2,500 idem','75k':'$3,000','100k':'$3,500','150k':'$5,000'},
      'Drawdown journalier max':  {'25k':'🚨 AUCUN (DLL supprimée jan 2025) — seul trailing','50k':'AUCUN','75k':'AUCUN','100k':'AUCUN','150k':'AUCUN'},
      'Jours de trading min':     {'25k':'5 jours (au moins 1 trade/jour, pas de seuil profit)','50k':'5 jours','75k':'5 jours','100k':'5 jours','150k':'5 jours'},
      'Profit min jour valide':   {'25k':'AUCUN seuil — TPT impose juste ≥1 trade/jour','50k':'AUCUN','75k':'AUCUN','100k':'AUCUN','150k':'AUCUN'},
      'Règle de cohérence':       {'25k':'Best day ≤ 50% du profit total (Test seulement)','50k':'≤ 50%','75k':'≤ 50%','100k':'≤ 50%','150k':'≤ 50%'},
      // === Trading restrictions ===
      'Positions overnight':      {'25k':'INTERDIT (flat 17h ET toutes phases)','50k':'INTERDIT','75k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT'},
      'DCA (renforcement)':       {'25k':'Pas de règle spécifique','50k':'Pas de règle','75k':'Pas de règle','100k':'Pas de règle','150k':'Pas de règle'},
      'Annonces éco (Test)':      {'25k':'Autorisé sans restriction','50k':'Autorisé','75k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'Annonces éco (PRO/PRO+)':  {'25k':'Flat 1 min avant/pendant/après FOMC/NFP/CPI','50k':'idem','75k':'idem','100k':'idem','150k':'idem'},
      'Bots / automation':        {'25k':'Full auto INTERDIT · Semi-auto avec monitoring OK','50k':'idem','75k':'idem','100k':'idem','150k':'idem'},
      'Coordinated multi-account':{'25k':'INTERDIT','50k':'INTERDIT','75k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT'},
      // === Contrats (hard limit, dépassement +1 = termination immédiate) ===
      'Contrats max (mini)':      {'25k':'3','50k':'6','75k':'9','100k':'12','150k':'15'},
      'Contrats max (micro)':     {'25k':'30','50k':'60','75k':'90','100k':'120','150k':'150'},
      // === Tarifs (mensuel avec code NOFEE40 = -40% à vie) ===
      'Prix évaluation (mois)':   {'25k':'$150','50k':'$170','75k':'$245','100k':'$330','150k':'$360'},
      'Frais activation PRO':     {'25k':'$130 (annulé par NOFEE40)','50k':'$130','75k':'$130','100k':'$130','150k':'$130'},
      'Frais activation PRO+':    {'25k':'$0 (auto-promotion)','50k':'$0','75k':'$0','100k':'$0','150k':'$0'},
      'Reset Test':               {'25k':'$100 flat (1 free reset/mois)','50k':'$100','75k':'$100','100k':'$100','150k':'$100'},
      'Reset PRO (max 3)':        {'25k':'$399','50k':'$649','75k':'$799','100k':'$999','150k':'$1,499'},
      'Reset PRO+':               {'25k':'INTERDIT (pas de reset)','50k':'INTERDIT','75k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT'},
      // === Payouts ===
      'Payout minimum':           {'25k':'Pas de minimum strict documenté à 3 sources','50k':'idem','75k':'idem','100k':'idem','150k':'idem'},
      'Délai payout':             {'25k':'~4-9h (max ~24h)','50k':'~4-9h','75k':'~4-9h','100k':'~4-9h','150k':'~4-9h'},
      'Mode de retrait':          {'25k':'Plaid ACH, Wise','50k':'Plaid ACH, Wise','75k':'Plaid ACH, Wise','100k':'Plaid ACH, Wise','150k':'Plaid ACH, Wise'},
      'Répartition gains':        {'25k':'80% trader (PRO) → 90% (PRO+)','50k':'80% → 90%','75k':'80% → 90%','100k':'80% → 90%','150k':'80% → 90%'},
      'Buffer payout PRO':        {'25k':'Buffer = starting balance + trailing DD (formulation officielle TPT)','50k':'idem','75k':'idem','100k':'idem','150k':'idem'},
      'Min entre payouts':        {'25k':'7 jours (PRO) · 0 (PRO+)','50k':'idem','75k':'idem','100k':'idem','150k':'idem'},
      'Comptes financés simul.':  {'25k':'5 max (PRO + PRO+ combinés)','50k':'5 max','75k':'5 max','100k':'5 max','150k':'5 max'},
    }
  },
  'My Funded Futures': {
    // VÉRIFIÉ MAI 2026 — 5 PLANS actifs : Core, Rapid, Pro, Flex (mars 2026), Builder (2026)
    // Sources : myfundedfutures.com + help.myfundedfutures.com + proptradingvibes
    // Fondé Matthew Leech (juin 2023). Fort Worth Texas USA.
    //
    // CHANGEMENTS RÉCENTS :
    //  - Juillet 2025 : Starter/Expert/Milestone DISCONTINUÉS → Core/Rapid/Pro
    //  - Juillet 2025 : TOUS les activation fees ÉLIMINÉS ($0)
    //  - Mars 2026 : Flex lancé (25K/50K, EOD FIXED 4%, no DLL)
    //  - 2026 : Builder lancé (50K, payouts 48h — le plus rapide)
    //  - Mai 2026 : Core retiré de la nav principale (déprécié)
    //
    // FAMILLES (valeurs ci-dessous = **Rapid**, le plus populaire) :
    //   Core    → 50K only, 80/20, EOD 3% (déprécié)
    //   Rapid   → 25-150K, 90/10, INTRADAY 4% (le plus populaire — 🚨 piège intraday)
    //   Pro     → 50-150K, 80/20, EOD 3%, bi-weekly payouts, swing-friendly
    //   Flex    → 25-50K, 80/20, EOD FIXED 4%, no DLL
    //   Builder → 50K, 80/20, DLL $1K soft, payouts 48h
    //
    // 🚨 NEWS RULE ULTRA-STRICTE : flat 2 min AVANT et 2 min APRÈS Tier-1 (CPI/NFP/FOMC/GDP/PPI)
    //    Violation = fermeture compte immédiate, gagnant ou perdant
    plans: ['25k','50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500 (6%)','50k':'$3,000 (6%)','100k':'$6,000 (6%)','150k':'$9,000 (6%)'},
      'Drawdown trailing max':    {'25k':'Rapid: $1,000 (4% intraday)','50k':'Rapid: $2,000 (4% intraday) · Core/Pro: $1,500 (3% EOD)','100k':'Rapid: $4,000 · Core/Pro: $3,000 EOD','150k':'Rapid: $6,000 · Core/Pro: $4,500 EOD'},
      'Drawdown journalier max':  {'25k':'AUCUN (sim funded) · DLL appliqué en LIVE','50k':'AUCUN','100k':'AUCUN','150k':'AUCUN'},
      'Jours de trading min':     {'25k':'1 jour','50k':'1 jour','100k':'1 jour','150k':'1 jour'},
      'Profit min jour valide':   {'25k':'$150 (Net PnL/jour pour comptage payout)','50k':'$150','100k':'$150','150k':'$150'},
      'Règle de cohérence (eval)':{'25k':'50% en éval · Rapid funded: AUCUNE · Core/Pro funded: 40%','50k':'idem','100k':'idem','150k':'idem'},
      // Trading
      'Positions overnight':      {'25k':'INTERDIT (sauf Pro qui permet)','50k':'INTERDIT (sauf Pro)','100k':'INTERDIT (sauf Pro)','150k':'INTERDIT (sauf Pro)'},
      'Trading des news':         {'25k':'🚨 Flat 2 MIN avant ET 2 MIN après Tier-1 (Core/Rapid/Pro) — ban si violation · Flex/Builder PERMETTENT T1 news sur funded','50k':'idem','100k':'idem','150k':'idem'},
      'DCA (renforcement)':       {'25k':'Autorisé · scaling micro requis','50k':'idem','100k':'idem','150k':'idem'},
      'Algos / automation':       {'25k':'Full auto INTERDIT · semi-auto OK si manual oversight','50k':'idem','100k':'idem','150k':'idem'},
      // Contrats Rapid
      'Contrats max éval (mini)': {'25k':'2','50k':'5','100k':'10','150k':'15'},
      'Contrats max éval (micro)':{'25k':'20','50k':'50','100k':'100','150k':'150'},
      'Contrats LIVE':            {'25k':'Divisé par 2 vs éval','50k':'÷2','100k':'÷2','150k':'÷2'},
      // Tarifs (corrigés via re-vérification mai 2026)
      'Prix Core (m / o)':        {'25k':'n/a (50K only)','50k':'$77/mo · $229 OTP','100k':'n/a','150k':'n/a'},
      'Prix Rapid (m)':           {'25k':'~$67/mo (disputé)','50k':'$129/mo','100k':'$229/mo','150k':'$329/mo'},
      'Prix Pro (m / o)':         {'25k':'n/a','50k':'~$219-229/mo · $629 OTP (disputé entre sources)','100k':'~$329/mo · $829 OTP','150k':'~$477/mo · $1,127 OTP'},
      'Prix Flex (mars 2026)':    {'25k':'$84/mo','50k':'$107/mo','100k':'n/a (25K/50K only)','150k':'n/a'},
      'Prix Builder (50K only)':  {'25k':'n/a','50k':'Pricing non documenté publiquement','100k':'n/a','150k':'n/a'},
      'Frais activation':         {'25k':'$0 (waived firm-wide juillet 2025)','50k':'$0','100k':'$0','150k':'$0'},
      'Reset cost':               {'25k':'~$87 (à vérifier au checkout)','50k':'~$157 (Rapid)','100k':'~$267 (Rapid)','150k':'~$347 (Rapid)'},
      'Data fee (Pro classifié)': {'25k':'$0 retail · $130/mo si Professional','50k':'idem','100k':'idem','150k':'idem'},
      'Codes promo permanents':   {'25k':'SAVE40 (-40%), IMAN (20% Rapid · 30% Pro · 50% Flex)','50k':'idem','100k':'idem','150k':'idem'},
      // Payouts (correction agent : Rapid = DAILY 24h, pas 5 winning days)
      'Répartition gains':        {'25k':'Rapid 90/10 · Core/Pro 80/20 · Flex disputé (80/20 ou 90/10) · Builder 80/20','50k':'idem','100k':'idem','150k':'idem'},
      'Payout minimum':           {'25k':'Rapid/Core/Flex: $250 · Pro: $1,000','50k':'idem','100k':'idem','150k':'idem'},
      'Cadence payout':           {'25k':'Rapid: DAILY 24h après 1er trade · Core: 5 winning days · Pro: bi-weekly · Builder: 48h · Flex: 5 winning days','50k':'idem','100k':'idem','150k':'idem'},
      // Multi-comptes
      'Comptes funded simul.':    {'25k':'5 si que 25K/50K · 3 si au moins un 100K/150K','50k':'5 si que 25/50K','100k':'3 max','150k':'3 max'},
      'Évaluations simul.':       {'25k':'10 max actives','50k':'10 max','100k':'10 max','150k':'10 max'},
    }
  },
  'Phidias Propfirm': {
    // RE-VÉRIFIÉ MAI 2026 — 3 familles : Static/E2L, Fundamental, Premium/Swing
    // Sources : phidiaspropfirm.com + helpcenter.phidiaspropfirm.com + Trustpilot + LEI Register
    // HQ : GIBRALTAR — Eurotowers Suite 4.3.02 Block 4 (entity légale unique)
    // Pas France ni Italie · Fondateurs français mais aucune entité légale FR
    // LEI : 2549002ZYS0FYA2RB617 · Registration: 12401448
    //
    // ⚠ ALERTE TRUSTPILOT 3.9/5 (mai 2026) — POLARISÉ :
    //   - 68% 5★ (payouts <24h confirmés)
    //   - 25% 1★ (alertes jan-fév 2026 : payouts retardés, bans Discord, "CRITICAL DATA ERROR")
    //   - Cas notable : trader avec payout approuvé publiquement → banni avant paiement
    //
    // 🌟 KILLER FEATURE Premium/Swing : profit split PROGRESSIF
    //   75% (payout 1) → 80% (2) → 85% (3) → 90% (4) → 100% (5+)
    //
    // FAMILLES :
    //   Static/E2L 25K → DD statique pur (rare), 80/20, premier payout → direct LIVE
    //   Fundamental → day trading EOD, 80/20 flat
    //   Premium/Swing → overnight + weekend AUTORISÉS (unique sur le marché futures à ce prix)
    plans: ['25k','50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500','50k':'$3,000 (E2L) / $4,000 (Fundamental)','100k':'$6,000','150k':'$9,000'},
      'Drawdown trailing max':    {'25k':'$500 STATIQUE PUR (ne trail jamais)','50k':'$2,000 (E2L statique) / $2,500 (Fundamental EOD)','100k':'$3,000 EOD','150k':'$4,500 EOD'},
      'Drawdown journalier max':  {'25k':'Aucun','50k':'Aucun','100k':'Aucun','150k':'Aucun'},
      'Jours de trading min':     {'25k':'1 jour','50k':'1 (E2L) / 3 (Fundamental)','100k':'3 (Fundamental)','150k':'3'},
      'Profit min jour valide':   {'25k':'$0','50k':'$0 (E2L) / ~$100 (Fundamental, estimé)','100k':'~$150','150k':'~$200'},
      'Règle de cohérence (eval)':{'25k':'AUCUNE tous stages','50k':'Aucune éval · 30% sur CASH funded · AUCUNE en LIVE','100k':'idem','150k':'idem'},
      // Trading
      'Positions overnight':      {'25k':'INTERDIT','50k':'INTERDIT (Fundamental) · AUTORISÉ (Premium/Swing)','100k':'idem','150k':'idem'},
      'Weekend trading':          {'25k':'INTERDIT','50k':'INTERDIT (Fundamental) · AUTORISÉ (Premium/Swing) — UNIQUE','100k':'idem','150k':'idem'},
      'Trading des news':         {'25k':'AUTORISÉ en éval (NFP/FOMC/CPI) · Funded : ±1 min flat Tier-1','50k':'idem','100k':'idem','150k':'idem'},
      'DCA (renforcement)':       {'25k':'Autorisé','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'Robots / full auto':       {'25k':'INTERDIT · Semi-auto OK si monitoring','50k':'idem','100k':'idem','150k':'idem'},
      // Contrats
      'Contrats max (mini)':      {'25k':'2','50k':'5 (E2L) / 10 (Fundamental)','100k':'7 (E2L) / 14 (Fundamental)','150k':'9 (E2L) / 17 (Fundamental)'},
      'Contrats max (micro)':     {'25k':'20','50k':'50 / 100','100k':'70 / 140','150k':'90 / 170'},
      // Tarifs (USD officiel — corrigé : pas de tarif EUR officiel, juste USD)
      'Prix mensuel Fundamental': {'25k':'n/a','50k':'$116/mo','100k':'$144-164/mo (disputé entre sources)','150k':'$173/mo'},
      'Prix one-time E2L (Static)':{'25k':'$277 USD (régulier) · $55.40 avec discount','50k':'(varies)','100k':'(varies)','150k':'(varies)'},
      'Prix one-time Fundamental':{'25k':'n/a','50k':'$580','100k':'$723','150k':'$863'},
      'Prix one-time Premium':    {'25k':'n/a','50k':'(non documenté publiquement)','100k':'$180 (selon source) · $900 (autre) — DISPUTÉ','150k':'(non documenté)'},
      'Frais activation':         {'25k':'$0','50k':'$0','100k':'$0','150k':'$0'},
      'Reset cost':               {'25k':'Renouvellement','50k':'Renouvellement','100k':'Renouvellement','150k':'Renouvellement'},
      'Codes promo':              {'25k':'LASTCHANCE (-60% éval / -80% OTP) — autres codes circulants non vérifiés à 3 sources','50k':'idem','100k':'idem','150k':'idem'},
      // Payouts
      'Répartition gains':        {'25k':'E2L 80/20 fixe','50k':'Fundamental 80/20 fixe · 🌟 Premium PROGRESSIF: 75→80→85→90→100% (payout 5+)','100k':'idem','150k':'idem'},
      'Cadence payout':           {'25k':'48h post-éval → LIVE','50k':'CASH bi-weekly (1-14 et 15-fin mois) · Premium tous les 5 jours · LIVE quotidien possible','100k':'idem','150k':'idem'},
      'Payout minimum':           {'25k':'$500','50k':'$500','100k':'$500','150k':'$500'},
      'Délai payout':             {'25k':'Approval 1-4h same-day · Bank 3-5j · PayPal/Skrill 1-2j','50k':'idem','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'25k':'Wallet Phidias → Rise → bank/PayPal/Skrill','50k':'idem','100k':'idem','150k':'idem'},
      // Multi-comptes
      'Comptes simul.':           {'25k':'Jusqu\'à 15 funded (E2L + Fundamental + Premium)','50k':'15 funded · 5 max E2L (CASH+LIVE confondus)','100k':'15 funded','150k':'15 funded'},
    }
  },
  'Funded Futures Network': {
    // VÉRIFIÉ MAI 2026 — Abonnement MENSUEL. 2 pacings: Standard (15j, 40%) vs Express (7j, 15%)
    // Phase Exhibition (sim funded) avant Funded-Pro Live
    // Sources : fundedfuturesnetwork.com + fundedfuturesnetwork.zendesk.com + proptradingvibes
    // Fondé Kevin Swart + Jay (2022). New York USA.
    //
    // ⚠ "EXPRESS PARADOX" : "plus rapide" sur le papier (7j vs 15j) mais 15% consistency cap
    //   rend mathématiquement PLUS DIFFICILE de passer (best day plafonné à $450 sur 50K)
    //
    // ⚠ DATA FEE ONGOING $126/mo une fois funded — à intégrer au ROI
    plans: ['25k','50k','100k','250k'],
    rules: {
      'Objectif de profit':       {'25k':'$1,500','50k':'$3,000','100k':'$6,000','250k':'$15,000'},
      'Drawdown trailing max':    {'25k':'$1,500 EOD (no lock en éval, STATIC en Funded post-Exhibition)','50k':'$2,000','100k':'$3,600','250k':'$6,000'},
      'Drawdown journalier max':  {'25k':'AUCUN','50k':'AUCUN','100k':'AUCUN','250k':'AUCUN'},
      'Jours de trading min':     {'25k':'15 (Standard) / 7 (Express, 4 réalisables)','50k':'15 / 7','100k':'15 / 7','250k':'15 / 7'},
      'Profit min jour valide':   {'25k':'AUCUN — FFN n\'impose pas de seuil journalier','50k':'AUCUN','100k':'AUCUN','250k':'AUCUN'},
      'Règle de cohérence (eval)':{'25k':'40% du target (Standard) · 15% (Express) — excès NE TUE PAS, ajoute au target','50k':'40% / 15%','100k':'40% / 15%','250k':'40% / 15%'},
      'Limite de temps Eval':     {'25k':'Aucune (sub mensuel récurrent)','50k':'Aucune','100k':'Aucune','250k':'Aucune'},
      // Trading
      'Positions overnight':      {'25k':'INTERDIT (flat 16:50 EST) · weekends INTERDITS','50k':'INTERDIT','100k':'INTERDIT','250k':'INTERDIT'},
      'Trading des news':         {'25k':'Eval: AUTORISÉ · Funded/Exhibition: FLAT 1 min avant + après Tier-1 (FOMC/NFP/CPI/Fed speeches)','50k':'idem','100k':'idem','250k':'idem'},
      'DCA (renforcement)':       {'25k':'Pas de restriction explicite','50k':'idem','100k':'idem','250k':'idem'},
      // Contrats (scaling)
      'Contrats max (mini)':      {'25k':'3 (jusqu\'à 30 micros)','50k':'4 → 15 (scaling)','100k':'5 → 18 (scaling)','250k':'6 → 20 (scaling)'},
      // Tarifs (avec code VIBES ~50%)
      'Prix mensuel Standard':    {'25k':'~$99','50k':'~$75-150','100k':'~$99-200','250k':'~$99-300'},
      'Prix mensuel Express':     {'25k':'~$155','50k':'~$175','100k':'(non détaillé)','250k':'(non détaillé)'},
      'Frais activation Exhib.':  {'25k':'$120 one-time','50k':'$120','100k':'$120','250k':'$120'},
      'Reset cost':               {'25k':'$100 (pas de free reset)','50k':'$100','100k':'$100','250k':'$100'},
      'Data fee funded ongoing':  {'25k':'$126/mo (à intégrer au ROI)','50k':'$126/mo','100k':'$126/mo','250k':'$126/mo'},
      'Codes promo':              {'25k':'VIBES (~50%)','50k':'idem','100k':'idem','250k':'idem'},
      // Payouts
      'Répartition gains':        {'25k':'Exhibition Sim: 80/20 → Live: 90/10 après $5,000 cumulés','50k':'idem','100k':'idem','250k':'idem'},
      'Consistency funded':       {'25k':'Appliquée seulement les 3 PREMIERS payouts puis supprimée','50k':'idem','100k':'idem','250k':'idem'},
      'Payout minimum':           {'25k':'$1,000','50k':'$1,000','100k':'$1,000','250k':'$1,000'},
      'Délai payout (Sim)':       {'25k':'Jusqu\'à $10K tous les 3 jours','50k':'idem','100k':'idem','250k':'idem'},
      'Délai payout (Live)':      {'25k':'🚀 DAILY same-day (PayPal 10-15 min)','50k':'idem','100k':'idem','250k':'idem'},
      'Méthodes payout':          {'25k':'Wire/ACH ($10-30 fee) · PayPal (frais PayPal, instantané)','50k':'idem','100k':'idem','250k':'idem'},
      // Multi-comptes
      'Comptes simul.':           {'25k':'10 max (copy trading limité à 5)','50k':'10','100k':'10','250k':'10'},
    }
  },
  'FuturesELites': {
    // ⚠ NOM CONSERVÉ pour compat avec comptes existants — nom officiel = "FuturesElite" (singulier, futureselite.com)
    //    L'UI affichera "FuturesElite" mais la clé reste 'FuturesELites'
    // RE-VÉRIFIÉ MAI 2026 — 3 familles : Starter (mensuel), Pro (mensuel ++), Instant Funded (one-time)
    // Sources : futureselite.com + propfirmplus + Trustpilot + LinkedIn Habibi
    // Parent : Quantum SRL (Italie, Latina/Lazio) — UK Ltd #16864791 NON CONFIRMÉ à 3 sources
    // CEO Christian Habibi · COO Artur S. Deshko · HQ Corso G. Matteotti 61, Latina 04100, Italie
    //
    // 🌟 KILLER FEATURE : profit split SCALING 80% → 90% → 100% sur sustained performance
    //    (UNIQUE avec Apex pour atteindre 100% split sur le marché futures)
    //
    // ⚠ Firme JEUNE (UK Ltd enregistrée 2025) — track record limité
    // ⚠ 2 comptes max simultanés (fair-play rule très restrictive)
    plans: ['50k','100k','150k'],
    rules: {
      'Objectif de profit':       {'50k':'~$3,000 (Starter) · ~$4,000 (Pro) · 5% buffer (Instant) — décompo Starter vs Pro NON DOCUMENTÉE à 3 sources','100k':'~$6,000 / ~$7,500','150k':'~$9,000 / ~$11,000'},
      'Drawdown trailing max':    {'50k':'$2,000 EOD (Starter/Pro) · Instant : 5% du current balance (trailing dynamique) — DISPUTÉ','100k':'$3,000 EOD','150k':'$5,000 EOD'},
      'Drawdown journalier max':  {'50k':'$1,100 (Starter) · AUCUN (Pro) · DLL Instant DISPUTÉ entre sources','100k':'$2,000 / AUCUN','150k':'$3,000 / AUCUN'},
      'Jours de trading min':     {'50k':'≥5 profitable days en ≥14 calendar (Starter/Pro) · 7 sur 14 (Instant)','100k':'idem','150k':'idem'},
      'Profit min jour valide':   {'50k':'Non documenté précisément à 3 sources','100k':'Non documenté','150k':'Non documenté'},
      'Règle de cohérence':       {'50k':'40% (Starter/Pro) · Instant : 20% (FAQ officielle) ou 25% (PTV) — DISPUTÉ','100k':'idem','150k':'idem'},
      // Trading
      'Positions overnight':      {'50k':'Exchange hours seulement (modèle EOD)','100k':'idem','150k':'idem'},
      'Trading des news':         {'50k':'Tier-1 windows enforcées (flat) · add-on PAYANT pour unlock','100k':'idem','150k':'idem'},
      'Scalping':                 {'50k':'Très short holds peuvent être exclus du payout · "Scalp Mode" add-on dispo','100k':'idem','150k':'idem'},
      'DCA / Grid':               {'50k':'Autorisé sous policy actuelle','100k':'Autorisé','150k':'Autorisé'},
      'Hedging cross-comptes':    {'50k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT'},
      // Contrats
      'Contrats max (mini)':      {'50k':'4 (Starter) / 5 (Pro) / 5 (Instant)','100k':'7 / 10 / 10','150k':'10 / 15 / —'},
      // Tarifs (DISPUTÉ entre sources — 3 grilles différentes circulent. À vérifier sur futureselite.com au checkout)
      'Prix mensuel Starter':     {'50k':'~$49-99/mo selon source','100k':'~$94-189/mo','150k':'~$129-299/mo'},
      'Prix mensuel Pro':         {'50k':'~$94-189/mo','100k':'~$115-230/mo','150k':'~$214-429/mo'},
      'Prix Instant Funded':      {'50k':'$499 list → $299.40 (-40% BLACK40)','100k':'$699 → $419.40','150k':'non documenté à 3 sources'},
      'Frais activation':         {'50k':'Non publié explicitement','100k':'Non publié','150k':'Non publié'},
      'Codes promo':              {'50k':'BLACK40 (40-50%)','100k':'BLACK40','150k':'BLACK40'},
      // Payouts
      'Répartition gains':        {'50k':'🌟 80% → 90% → 100% scaling sur sustained performance','100k':'80% → 90% → 100%','150k':'80% → 90% → 100%'},
      'Payout minimum':           {'50k':'Pas de floor publié (industrie : $500+)','100k':'idem','150k':'idem'},
      'Délai payout':             {'50k':'Bi-weekly, processing ~24h post-approval · Bank 2-4j, CRYPTO same-day','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'50k':'Bank (SEPA/SWIFT) · 🌟 Crypto USDT/USDC via Rise (same-day)','100k':'idem','150k':'idem'},
      // Multi-comptes
      'Comptes simul.':           {'50k':'2 max sous 1 login (fair-play rule, très restrictif)','100k':'2 max','150k':'2 max'},
    }
  },
  'Alpha Futures': {
    // VÉRIFIÉ MAI 2026 — Sources : help.alpha-futures.com (docs officielles) + screenshots compte trader
    // PLATEFORME : DXtrade (broker direct — pas Rithmic)
    //
    // 3 PLANS distincts — chacun avec ses tailles et règles propres :
    //
    //   PREMIUM   : 50/100/150K
    //               - 2 paths : $79-239/mo (+$149 activation) OU $159-379/mo (0 activation)
    //               - Eval : Consistency 50% · MLL 4% trailing EOD
    //               - Qualified : 0 Daily Loss Guard, 0 Consistency, 90% split
    //               - Withdraw : 50% des profits chaque 5 winning days ≥ $200
    //
    //   ZERO      : 25/50/100K
    //               - $79/$119/$239 mo · 0 activation permanent
    //               - Eval : 0 Consistency · 1 jour min · DLG $500/$1000/$2000
    //               - Qualified : 40% Consistency UNIQUEMENT · 90% split
    //               - MLL ne reset PAS à 0 après withdrawal
    //               - Cap payouts : $1K-$2.5K par cycle, 50% des profits
    //
    //   ADVANCED  : 50/100/150K
    //               - $139/$279/$419 mo · $149 activation
    //               - MLL 3.5% (réduit) · Profit target 8% (plus élevé)
    //               - Pas de scaling plan (taille max dès jour 1)
    //               - 0 Daily Loss Guard · 0 Consistency Qualified · 90% split
    //               - Withdraw max $15,000 par request · 4 monthly withdrawals
    //
    // MLL (Maximum Loss Limit — universel toutes plans) :
    //   • EOD TRAILING (PAS intraday) — calculé sur balance EOD high
    //   • Lock au starting balance (une fois atteint, plus de trailing down)
    //   • Breach = liquidation immédiate (pas de warning)
    //   • Eval breach = reset payant OU rebill mensuel · Qualified breach = compte fermé
    //
    // Caractéristiques globales :
    //   - Overnight + Weekend AUTORISÉS ✅ (rare !)
    //   - Hold Through News : YES (Premium/Advanced sans restriction · Zero avec restrictions Qualified)
    //   - Profit Split 90% en Qualified — IMMÉDIAT pour les 3 plans (pas tiered)
    plans: ['25k','50k','100k','150k'],
    rules: {
      // Profit Target (Eval)
      'Objectif de profit':       {'25k':'$1,500 (Zero uniquement)','50k':'Premium/Zero: $3,000 · Advanced: $4,000','100k':'Premium/Zero: $6,000 · Advanced: $8,000','150k':'Premium: $9,000 · Advanced: $12,000'},
      // MLL — Maximum Loss Limit (EOD trailing)
      'MLL (Maximum Loss Limit)': {'25k':'Zero: $1,000 (EOD trailing, lock starting)','50k':'Premium/Zero: $2,000 · Advanced: $1,750 (3.5%)','100k':'Premium: $3,000 · Zero: $3,000 · Advanced: $3,500','150k':'Premium: $4,500 · Advanced: $5,250'},
      // Daily Loss Guard (DLG) — seulement Zero
      'Daily Loss Guard':         {'25k':'Zero: $500','50k':'Zero: $1,000 · Premium: AUCUN · Advanced: AUCUN','100k':'Zero: $2,000 · Premium: AUCUN · Advanced: AUCUN','150k':'AUCUN (Zero non dispo en 150K · Premium/Advanced sans DLG)'},
      // Min trading days
      'Min jours trading (Eval)': {'25k':'Zero: 1 jour (one-day pass possible)','50k':'Premium: 2 · Zero: 1 · Advanced: 2','100k':'idem','150k':'idem'},
      'Min jours trading (Qual)': {'25k':'5','50k':'5 (tous plans)','100k':'5','150k':'5'},
      // Consistency rule
      'Consistency (Eval)':       {'25k':'Zero: AUCUNE','50k':'Premium: 50% · Zero: AUCUNE · Advanced: 50%','100k':'idem','150k':'idem'},
      'Consistency (Qualified)':  {'25k':'Zero: 40% (rare !)','50k':'Premium: AUCUNE · Zero: 40% · Advanced: AUCUNE','100k':'idem','150k':'idem'},
      // Profit split (Qualified)
      'Profit Split (Qualified)': {'25k':'90% (Zero, dès le 1er payout)','50k':'90% IMMÉDIAT (tous plans · pas tiered)','100k':'90%','150k':'90%'},
      // Position sizing (mini contracts | micro contracts)
      'Contrats max (mini)':      {'25k':'Zero: 1','50k':'Premium: 4 · Zero: 3 · Advanced: 5','100k':'Premium: 8 · Zero: 6 · Advanced: 10','150k':'Premium: 12 · Advanced: 15'},
      'Contrats max (micro)':     {'25k':'Zero: 10','50k':'Premium: 40 · Zero: 30 · Advanced: 50','100k':'Premium: 80 · Zero: 60 · Advanced: 100','150k':'Premium: 120 · Advanced: 150'},
      'Scaling plan':             {'25k':'Zero: pas de scaling (full dès jour 1)','50k':'Premium/Zero: pas de scaling · Advanced: PAS DE SCALING (taille max dès jour 1)','100k':'idem','150k':'idem'},
      // Pricing
      'Prix mensuel Premium':     {'25k':'— (Premium non dispo en 25K)','50k':'$79/mo (+$149 act) OU $159/mo (0 act)','100k':'$159/mo (+$149 act) OU $269/mo (0 act)','150k':'$239/mo (+$149 act) OU $379/mo (0 act)'},
      'Prix mensuel Zero':        {'25k':'$79/mo · 0 activation permanent','50k':'$119/mo · 0 activation','100k':'$239/mo · 0 activation','150k':'— (Zero non dispo en 150K)'},
      'Prix mensuel Advanced':    {'25k':'— (Advanced non dispo en 25K)','50k':'$139/mo (+$149 activation)','100k':'$279/mo (+$149 activation)','150k':'$419/mo (+$149 activation)'},
      'Activation fee':           {'25k':'Zero: $0','50k':'Premium path1: $149 · Premium path2: $0 · Zero: $0 · Advanced: $149','100k':'idem','150k':'idem'},
      // Reset costs (Eval phase)
      'Reset Eval':               {'25k':'Zero: $69','50k':'Premium: $69 (path1) ou $149 (path2) · Zero: $109 · Advanced: $139','100k':'Premium: $139/$239 · Zero: $219 · Advanced: $279','150k':'Premium: $219/$329 · Advanced: $419'},
      // Trading rules
      'Hold Through News':        {'25k':'✅ YES (avec restrictions sur Zero Qualified)','50k':'idem','100k':'idem','150k':'idem'},
      'Positions overnight':      {'25k':'✅ AUTORISÉ (overnight + weekend) — rare sur le marché','50k':'idem','100k':'idem','150k':'idem'},
      'Trading des news':         {'25k':'Premium/Advanced: aucune restriction · Zero: restrictions Qualified uniquement','50k':'idem','100k':'idem','150k':'idem'},
      'Algos / automation':       {'25k':'EAs limités — vérifier Prohibited Trading Practices avant usage','50k':'idem','100k':'idem','150k':'idem'},
      'Copy trading':             {'25k':'Voir doc officielle Copy Trading','50k':'idem','100k':'idem','150k':'idem'},
      // Payouts
      'Payout — Premium':         {'25k':'— (non dispo)','50k':'50% des profits par cycle, après 5 winning days ≥ $200','100k':'idem','150k':'idem'},
      'Payout — Zero':            {'25k':'5 winning days ≥ $200 · cap 50% profits · max $1K/cycle','50k':'idem · max $2K/cycle','100k':'idem · max $2.5K/cycle','150k':'— (non dispo)'},
      'Payout — Advanced':        {'25k':'— (non dispo)','50k':'Max $15,000 par request · 4 monthly withdrawals possibles','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'25k':'ACH, Wise, Wire SWIFT, Rise (intl)','50k':'idem','100k':'idem','150k':'idem'},
      // Comptes simul.
      'Max comptes simultanés':   {'25k':'Voir "Maximum Allocation" sur help.alpha-futures.com','50k':'idem','100k':'idem','150k':'idem'},
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
  'Alpha Futures',
]

// Couleurs associées à chaque firm suggérée (utilisées pour le default logo si pas de SVG custom)
export const FIRM_SUGGESTION_COLORS = {
  'Topstep':                '#ff8c42',
  'Apex Trader Funding':    '#a78bfa',
  'Bulenox':                '#e8504a',
  'Lucid Trading':          '#4d8fff',
  'Tradeify':               '#1db87a',
  'Take Profit Trader':     '#fac775',
  'My Funded Futures':      '#fb923c',
  'Phidias Propfirm':       '#1e2a4a',
  'Funded Futures Network': '#a86bff',
  'FuturesELites':          '#f472b6',
  'Alpha Futures':          '#0a3a2a',
}
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
