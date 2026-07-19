// PropFirm rules data — vérifiées 2024/2025 (toujours vérifier sur le site officiel)
// La plupart des firmes utilisent un drawdown TRAILING avec lock au solde initial — mais pas toutes
// (Phidias Static, MFFU Flex/Builder statique, FFN statique une fois financé) : voir le détail par firme.
export const PROPFIRM_RULES = {
  'Topstep': {
    // VÉRIFIÉ MAI 2026 — Sources OFFICIELLES :
    //   help.topstep.com/articles/8284197 (Trading Combine Parameters)
    //   help.topstep.com/articles/8284204 (Maximum Loss Limit)
    //   help.topstep.com/articles/8284208 (Consistency Target)
    //   help.topstep.com/articles/8284215 (XFA Parameters)
    //   help.topstep.com/articles/10657969 (LFA Parameters)
    //   help.topstep.com/articles/8284233 (Payout Policy)
    //   help.topstep.com/articles/14289835 (Pricing)
    //   help.topstep.com/articles/10490293 (DLL in Combine + XFA)
    //   help.topstep.com/articles/8284223 (Scaling Plan)
    //
    // ARCHITECTURE 3-STEP :
    //   Trading Combine (sim payant) → Express Funded Account XFA (sim, $0 start) → Live Funded Account LFA (réel)
    //
    // PLATEFORME : TopstepX requise pour nouveaux Combines (Rithmic underlying) ·
    //              NinjaTrader/Quantower grandfathered uniquement.
    //
    // 2 PATHS au checkout :
    //   • STANDARD     : moins cher mensuel + $149 activation au passage XFA
    //   • NO ACTIVATION FEE : plus cher mensuel + $0 activation au passage XFA
    //
    // 2 VARIANTES XFA (depuis 5 fév 2026) :
    //   • XFA STANDARD     : 5 winning days ≥ $150 · cap payout $5K · pas de consistency
    //   • XFA CONSISTENCY  : 3 days @ 40% consistency · cap payout $6K
    //
    // MLL (Maximum Loss Limit) — UNIFORME pour les 3 stages :
    //   • EOD UNIQUEMENT (jamais intraday) — recalcule au close de chaque session
    //   • PAS de trailing intraday (vs Apex/MFFU) — c'est la grosse différence
    //   • Combine : starts à (size − DD), monte avec nouveaux EOD highs jusqu'à starting balance, puis LOCK permanent
    //   • XFA     : starts à $0 balance avec MLL à -$DD (ex: -$2K sur 50K) · monte avec EOD highs · LOCK à $0 quand balance atteint le DD
    //   • LFA     : MLL = liquidation value (locked once balance hits starting)
    //   • Si touché → liquidation immédiate (Combine: éligible reset · XFA/LFA: compte fermé permanent)
    //
    // CHANGEMENTS RÉCENTS (2025/2026) :
    //   - 25 nov 2025 : No Activation Fee Combines lancé
    //   - 30 déc 2025 : Two-rule payout structure (1er payout: winning days only · suivants: + remaining profitable + Min Payout Balance)
    //   - 12 jan 2026 : 90/10 split immédiat pour nouveaux (legacy 100% premiers $10K préservé pour pré-12-jan)
    //   - 5 fév 2026  : XFA split en Standard + Consistency variants
    //   - 22 jul 2025 : Winning days XFA NE carry over PAS au LFA (nouveaux LFA post-cette date)
    //
    // CONSISTENCY (formules officielles) :
    //   • Combine: Best Day Profit ÷ Overall Profit ≤ 50% (au passage à XFA)
    //     → Si dépassé : Profit Target AUGMENTE (pas fail direct)
    //   • XFA Consistency: Largest Single-Day Net Profit ÷ Total Net Profit ≤ 40%
    //
    // INSTRUMENTS : ES, NQ, CL, GC, 6E + micros (MES, MNQ, MCL, MGC) — copy trading externe INTERDIT
    plans: ['50k','100k','150k'],
    rules: {
      // === Objectifs (Combine) ===
      'Profit Target (Combine)':  {'50k':'$3,000','100k':'$6,000','150k':'$9,000'},
      // === Maximum Loss Limit (Drawdown) ===
      'Max Loss Limit (MLL)':     {'50k':'$2,000 — EOD seulement (PAS intraday) · monte avec nouveaux EOD highs puis lock au starting balance permanent','100k':'$3,000 — EOD seulement (PAS intraday) · monte avec nouveaux EOD highs puis lock au starting balance permanent','150k':'$4,500 — EOD seulement (PAS intraday) · monte avec nouveaux EOD highs puis lock au starting balance permanent'},
      'MLL mécanique XFA':        {'50k':'XFA starts à $0 balance · MLL à -$2,000 · balance atteint +$2K → MLL lock $0','100k':'XFA starts à $0 balance · MLL à -$3,000 · balance atteint +$3K → MLL lock $0','150k':'XFA starts à $0 balance · MLL à -$4,500 · balance atteint +$4.5K → MLL lock $0'},
      // === Daily Loss Limit ===
      'Daily Loss Limit (DLL)':   {'50k':'$1,000 (Combine + XFA) — reset chaque session 5:00 PM CT · pas un fail (auto-liquidation jour seulement)','100k':'$2,000 (Combine + XFA) — reset chaque session 5:00 PM CT · pas un fail (auto-liquidation jour seulement)','150k':'$3,000 (Combine + XFA) — reset chaque session 5:00 PM CT · pas un fail (auto-liquidation jour seulement)'},
      'DLL Live Funded (LFA)':    {'50k':'$2,000 standard · $2,000 si tradable ≤ $10K · $1,000 si ≤ $5K (avec max 3 contrats)','100k':'$3,000 standard · $2,000 si tradable ≤ $10K · $1,000 si ≤ $5K (avec max 3 contrats)','150k':'$4,500 standard · $2,000 si tradable ≤ $10K · $1,000 si ≤ $5K (avec max 3 contrats)'},
      // === Trading Days ===
      'Min trading days (Combine)':{'50k':'Aucun min · pass dès profit target + consistency atteints','100k':'Aucun min · pass dès profit target + consistency atteints','150k':'Aucun min · pass dès profit target + consistency atteints'},
      'Min trading days (XFA Standard)':{'50k':'5 winning days ≥ $150 net profit + profit > 0 depuis dernier payout','100k':'5 winning days ≥ $150 net profit + profit > 0 depuis dernier payout','150k':'5 winning days ≥ $150 net profit + profit > 0 depuis dernier payout'},
      'Min trading days (XFA Consistency)':{'50k':'3 jours minimum @ 40% consistency (largest day ÷ total net profit)','100k':'3 jours minimum @ 40% consistency (largest day ÷ total net profit)','150k':'3 jours minimum @ 40% consistency (largest day ÷ total net profit)'},
      'Profit min winning day':   {'50k':'$150 (XFA Standard uniquement)','100k':'$150 (XFA Standard uniquement)','150k':'$150 (XFA Standard uniquement)'},
      // === Consistency rules (formules officielles) ===
      'Consistency (Combine)':    {'50k':'Best Day Profit ÷ Overall Profit ≤ 50% · si dépassé : Profit Target AUGMENTE (pas fail)','100k':'Best Day Profit ÷ Overall Profit ≤ 50% · si dépassé : Profit Target AUGMENTE (pas fail)','150k':'Best Day Profit ÷ Overall Profit ≤ 50% · si dépassé : Profit Target AUGMENTE (pas fail)'},
      'Consistency (XFA Standard)':{'50k':'AUCUNE','100k':'AUCUNE','150k':'AUCUNE'},
      'Consistency (XFA Consistency)':{'50k':'Largest Single-Day Net Profit ÷ Total Net Profit ≤ 40% · min 3 jours','100k':'Largest Single-Day Net Profit ÷ Total Net Profit ≤ 40% · min 3 jours','150k':'Largest Single-Day Net Profit ÷ Total Net Profit ≤ 40% · min 3 jours'},
      // === Trading rules ===
      'Auto-flat / overnight':    {'50k':'INTERDIT overnight (auto-flat 3:10 PM CT)','100k':'INTERDIT overnight (auto-flat 3:10 PM CT)','150k':'INTERDIT overnight (auto-flat 3:10 PM CT)'},
      'Trading des news':         {'50k':'✅ Autorisé (pas de buffer NFP/CPI/FOMC)','100k':'✅ Autorisé (pas de buffer NFP/CPI/FOMC)','150k':'✅ Autorisé (pas de buffer NFP/CPI/FOMC)'},
      'DCA (renforcement)':       {'50k':'Toléré (pas de règle stricte)','100k':'Toléré (pas de règle stricte)','150k':'Toléré (pas de règle stricte)'},
      'Copy trading externe':     {'50k':'❌ INTERDIT · multi-account arbitrage INTERDIT · coordinated position aggregation INTERDIT','100k':'❌ INTERDIT · multi-account arbitrage INTERDIT · coordinated position aggregation INTERDIT','150k':'❌ INTERDIT · multi-account arbitrage INTERDIT · coordinated position aggregation INTERDIT'},
      'Instruments autorisés':    {'50k':'ES, NQ, CL, GC, 6E + micros (MES, MNQ, MCL, MGC) · Micro Silver ratio 5:1 · MBT/MET capped','100k':'ES, NQ, CL, GC, 6E + micros (MES, MNQ, MCL, MGC) · Micro Silver ratio 5:1 · MBT/MET capped','150k':'ES, NQ, CL, GC, 6E + micros (MES, MNQ, MCL, MGC) · Micro Silver ratio 5:1 · MBT/MET capped'},
      // === Contracts / Scaling Plan ===
      'Max contracts (Combine)':  {'50k':'5 minis OU 50 micros (ratio standard 10:1)','100k':'10 minis OU 100 micros (ratio standard 10:1)','150k':'15 minis OU 150 micros (ratio standard 10:1)'},
      'Max contracts (XFA — Scaling Plan)':{'50k':'⚠ Scaling Plan ACTIF · starts à $0 balance avec 0 contracts allowed · scale up basé sur PnL EOD · changement effectif J+1 · 10 sec grace period','100k':'⚠ Scaling Plan ACTIF · starts à $0 balance avec 0 contracts allowed · scale up basé sur PnL EOD · changement effectif J+1 · 10 sec grace period','150k':'⚠ Scaling Plan ACTIF · starts à $0 balance avec 0 contracts allowed · scale up basé sur PnL EOD · changement effectif J+1 · 10 sec grace period'},
      'Max contracts (LFA)':      {'50k':'5 minis standard · 5 si tradable ≤ $10K · 3 si tradable ≤ $5K','100k':'10 minis standard · 5 si tradable ≤ $10K · 3 si tradable ≤ $5K','150k':'15 minis standard · 5 si tradable ≤ $10K · 3 si tradable ≤ $5K'},
      // === Pricing (officiel help.topstep.com) ===
      'Prix mensuel Standard':    {'50k':'$49/mo + $149 activation au passage XFA','100k':'$99/mo + $149 activation au passage XFA','150k':'$149/mo + $149 activation au passage XFA'},
      'Prix mensuel No-Fee Path': {'50k':'$95/mo · $0 activation au passage XFA','100k':'$149/mo · $0 activation au passage XFA','150k':'$229/mo · $0 activation au passage XFA'},
      'Reset (rebill = reset)':   {'50k':'$49 Standard / $95 No-Fee — équivaut au mensuel','100k':'$99 Standard / $149 No-Fee — équivaut au mensuel','150k':'$149 Standard / $229 No-Fee — équivaut au mensuel'},
      'Level 2 Data (option)':    {'50k':'+$38/mo (Depth of Market)','100k':'+$38/mo (Depth of Market)','150k':'+$38/mo (Depth of Market)'},
      'Discount Responsible':     {'50k':'$10-30 off mensuel si DLL set manuellement (varie taille)','100k':'$10-30 off mensuel si DLL set manuellement (varie taille)','150k':'$10-30 off mensuel si DLL set manuellement (varie taille)'},
      'New accounts limit':       {'50k':'Max 20 nouveaux Combines / mois','100k':'Max 20 nouveaux Combines / mois','150k':'Max 20 nouveaux Combines / mois'},
      // === Profit Split (officiel) ===
      'Profit Split (post 12-jan-2026)':{'50k':'90% trader / 10% Topstep · IMMÉDIAT dès $1 (nouveaux)','100k':'90% trader / 10% Topstep · IMMÉDIAT dès $1 (nouveaux)','150k':'90% trader / 10% Topstep · IMMÉDIAT dès $1 (nouveaux)'},
      'Profit Split (legacy pre 12-jan-2026)':{'50k':'100% trader sur premiers $10K LIFETIME (préservé pour anciens uniquement) puis 90/10','100k':'100% trader sur premiers $10K LIFETIME (préservé pour anciens uniquement) puis 90/10','150k':'100% trader sur premiers $10K LIFETIME (préservé pour anciens uniquement) puis 90/10'},
      // === Two-Rule Payout Structure (depuis 30-déc-2025) ===
      'Two-Rule Payout (30-déc-2025)':{'50k':'1er payout: winning days only · payouts suivants: winning days + remaining profitable since last + Min Payout Balance respectée','100k':'1er payout: winning days only · payouts suivants: winning days + remaining profitable since last + Min Payout Balance respectée','150k':'1er payout: winning days only · payouts suivants: winning days + remaining profitable since last + Min Payout Balance respectée'},
      // === Payouts XFA ===
      'XFA Standard — cap':       {'50k':'$5,000 OU 50% du balance (le PLUS BAS des deux) par request','100k':'$5,000 OU 50% du balance (le PLUS BAS des deux) par request','150k':'$5,000 OU 50% du balance (le PLUS BAS des deux) par request'},
      'XFA Consistency — cap':    {'50k':'$6,000 OU 50% du balance (le PLUS BAS des deux) par request','100k':'$6,000 OU 50% du balance (le PLUS BAS des deux) par request','150k':'$6,000 OU 50% du balance (le PLUS BAS des deux) par request'},
      // === Payouts LFA ===
      'LFA — éligibilité':        {'50k':'5 winning days ≥ $150 (depuis 22-jul-2025 : winning days XFA NE carry over PAS pour nouveaux LFA)','100k':'5 winning days ≥ $150 (depuis 22-jul-2025 : winning days XFA NE carry over PAS pour nouveaux LFA)','150k':'5 winning days ≥ $150 (depuis 22-jul-2025 : winning days XFA NE carry over PAS pour nouveaux LFA)'},
      'LFA — cap par payout':     {'50k':'50% du balance par request · UNLOCK 100% après 30 winning days cumulés (daily payouts)','100k':'50% du balance par request · UNLOCK 100% après 30 winning days cumulés (daily payouts)','150k':'50% du balance par request · UNLOCK 100% après 30 winning days cumulés (daily payouts)'},
      // === Payouts général ===
      'Payout minimum':           {'50k':'$125 min withdrawal','100k':'$125 min withdrawal','150k':'$125 min withdrawal'},
      'Cadence payout':           {'50k':'XFA: hebdo (après 5 winning days) · LFA: hebdo standard · daily unlock à 30 winning days','100k':'XFA: hebdo (après 5 winning days) · LFA: hebdo standard · daily unlock à 30 winning days','150k':'XFA: hebdo (après 5 winning days) · LFA: hebdo standard · daily unlock à 30 winning days'},
      'Méthodes payout':          {'50k':'Aeropay (instant US, gratuit) · Wise ($0.39 USD/USD, 1-3j) · ACH ($30, US 1-3j) · Wire SWIFT ($30, intl 5-10j) · PayPal RETIRÉ','100k':'Aeropay (instant US, gratuit) · Wise ($0.39 USD/USD, 1-3j) · ACH ($30, US 1-3j) · Wire SWIFT ($30, intl 5-10j) · PayPal RETIRÉ','150k':'Aeropay (instant US, gratuit) · Wise ($0.39 USD/USD, 1-3j) · ACH ($30, US 1-3j) · Wire SWIFT ($30, intl 5-10j) · PayPal RETIRÉ'},
      'Délai approbation interne':{'50k':'1-3 jours ouvrés','100k':'1-3 jours ouvrés','150k':'1-3 jours ouvrés'},
      // === Multi-comptes ===
      'Combines simul. (max)':    {'50k':'Illimité (mais max 20 nouveaux/mois)','100k':'Illimité (mais max 20 nouveaux/mois)','150k':'Illimité (mais max 20 nouveaux/mois)'},
      'XFA actifs simul. (max)':  {'50k':'5 XFA actifs en même temps','100k':'5 XFA actifs en même temps','150k':'5 XFA actifs en même temps'},
      // === Back2Funded (recovery program — prix exacts officiels) ===
      'Back2Funded — prix':       {'50k':'$599 par réactivation','100k':'$699 par réactivation','150k':'$829 par réactivation'},
      'Back2Funded — conditions': {'50k':'Max 2 réactivations · 7 jours pour décider · AVANT 1er payout uniquement · TopstepX requis · Focused Trader Plan exclu · ne s\'applique pas à Pro/Shoulder Tap','100k':'Max 2 réactivations · 7 jours pour décider · AVANT 1er payout uniquement · TopstepX requis · Focused Trader Plan exclu · ne s\'applique pas à Pro/Shoulder Tap','150k':'Max 2 réactivations · 7 jours pour décider · AVANT 1er payout uniquement · TopstepX requis · Focused Trader Plan exclu · ne s\'applique pas à Pro/Shoulder Tap'},
      // === Call Up XFA → LFA (officiel) ===
      'Call Up timing':           {'50k':'Entre 3ème et 5ème payout typiquement (review Risk Team — peut accélérer/retarder)','100k':'Entre 3ème et 5ème payout typiquement (review Risk Team — peut accélérer/retarder)','150k':'Entre 3ème et 5ème payout typiquement (review Risk Team — peut accélérer/retarder)'},
      'Call Up critères':         {'50k':'Consistency · Risk management · Position sizing · Products traded · Use of stops · Payout history · Overall behavior','100k':'Consistency · Risk management · Position sizing · Products traded · Use of stops · Payout history · Overall behavior','150k':'Consistency · Risk management · Position sizing · Products traded · Use of stops · Payout history · Overall behavior'},
      'LFA balance initial':      {'50k':'20% du cumulatif XFA balance OU $10,000 minimum (le PLUS HAUT des deux) · transferts additionnels possibles depuis reserves','100k':'20% du cumulatif XFA balance OU $10,000 minimum (le PLUS HAUT des deux) · transferts additionnels possibles depuis reserves','150k':'20% du cumulatif XFA balance OU $10,000 minimum (le PLUS HAUT des deux) · transferts additionnels possibles depuis reserves'},
      // === Call Down / Shoulder Tap (officiel) ===
      'Call Down (Shoulder Tap)': {'50k':'LFA → Shoulder Tap Express si : DLL breaches répétés, inconsistance, excessive risk, large swings, perte discipline. Retour LFA possible après démonstration consistency. Back2Funded EXCLU sur Shoulder Tap.','100k':'LFA → Shoulder Tap Express si : DLL breaches répétés, inconsistance, excessive risk, large swings, perte discipline. Retour LFA possible après démonstration consistency. Back2Funded EXCLU sur Shoulder Tap.','150k':'LFA → Shoulder Tap Express si : DLL breaches répétés, inconsistance, excessive risk, large swings, perte discipline. Retour LFA possible après démonstration consistency. Back2Funded EXCLU sur Shoulder Tap.'},
      // === Dynamic Live Risk Expansion (DLR) — LFA tier progression (CRITIQUE) ===
      'DLR — DLL progression':    {'50k':'Tiers DLR : $15K profit → $5K DLL · $20K → $5.5K · $50K → $6K · $100K → $10K · $200K → $20K · $550K → $50K · $1M → $100K (Active Day = 1 micro min, pas de min PnL)','100k':'Tiers DLR : $15K profit → $5K DLL · $20K → $5.5K · $50K → $6K · $100K → $10K · $200K → $20K · $550K → $50K · $1M → $100K','150k':'Tiers DLR : $15K profit → $5K DLL · $20K → $5.5K · $50K → $6K · $100K → $10K · $200K → $20K · $550K → $50K · $1M → $100K'},
      'DLR — contracts expansion':{'50k':'$50K profit → 30 lots max · $100K → 50 lots · $200K → 70 lots · $1M → 100 lots — REQUIS : Tier 4+ ET balance ≥ $100K','100k':'$50K profit → 30 lots max · $100K → 50 lots · $200K → 70 lots · $1M → 100 lots — REQUIS : Tier 4+ ET balance ≥ $100K','150k':'$50K profit → 30 lots max · $100K → 50 lots · $200K → 70 lots · $1M → 100 lots — REQUIS : Tier 4+ ET balance ≥ $100K'},
      'DLR — délai entre tiers':  {'50k':'10 Active Trading Days requis dans chaque tier avant DLL augmenté (Active Day = 1 micro contract minimum, pas de min P&L)','100k':'10 Active Trading Days requis dans chaque tier avant DLL augmenté (Active Day = 1 micro contract minimum, pas de min P&L)','150k':'10 Active Trading Days requis dans chaque tier avant DLL augmenté (Active Day = 1 micro contract minimum, pas de min P&L)'},
      // === Risk Lock-In (LFA — protection profits) ===
      'Risk Lock-In':             {'50k':'Sur jours très profitables, Risk Team peut set un minimum profit level. Drawdown autorisé = 1x/1.5x/2x du DLL starting (3x sur overnight). Si P&L tombe sous → liquidation jour. Notification email/téléphone.','100k':'Sur jours très profitables, Risk Team peut set un minimum profit level. Drawdown autorisé = 1x/1.5x/2x du DLL starting (3x sur overnight). Si P&L tombe sous → liquidation jour. Notification email/téléphone.','150k':'Sur jours très profitables, Risk Team peut set un minimum profit level. Drawdown autorisé = 1x/1.5x/2x du DLL starting (3x sur overnight). Si P&L tombe sous → liquidation jour. Notification email/téléphone.'},
      // === LFA Costs (officiel — important !) ===
      'LFA — Data fees':          {'50k':'CME couvert par Topstep (depuis 22-jul-2025). Exchanges additionnels = $133/mo chacun (NYMEX, COMEX, CBOT). Total 4 exchanges = $540/mo.','100k':'CME couvert par Topstep (depuis 22-jul-2025). Exchanges additionnels = $133/mo chacun (NYMEX, COMEX, CBOT). Total 4 exchanges = $540/mo.','150k':'CME couvert par Topstep (depuis 22-jul-2025). Exchanges additionnels = $133/mo chacun (NYMEX, COMEX, CBOT). Total 4 exchanges = $540/mo.'},
      'LFA — Commissions':        {'50k':'$0.72-$2.04 broker · Exchange fees $2.46-$4.30 · Ex: ES/NQ $3.80 RT · CL $1.54 RT · GC $4.24 RT','100k':'$0.72-$2.04 broker · Exchange fees $2.46-$4.30 · Ex: ES/NQ $3.80 RT · CL $1.54 RT · GC $4.24 RT','150k':'$0.72-$2.04 broker · Exchange fees $2.46-$4.30 · Ex: ES/NQ $3.80 RT · CL $1.54 RT · GC $4.24 RT'},
      'LFA — Platform license':   {'50k':'À la charge du trader (Topstep couvre uniquement en Combine, pas en LFA)','100k':'À la charge du trader (Topstep couvre uniquement en Combine, pas en LFA)','150k':'À la charge du trader (Topstep couvre uniquement en Combine, pas en LFA)'},
    }
  },
  'Apex Trader Funding': {
    // VÉRIFIÉ MAI 2026 — REFONTE MAJEURE "APEX 4.0" depuis 1er MARS 2026
    // Sources officielles : apextraderfunding.com + support.apextraderfunding.com
    // Sources tierces vérifiées : tradecovex, proptradingvibes, damnpropfirms, propscorer, traderssecondbrain
    //
    // CHANGEMENTS APEX 4.0 (mars 2026) :
    //  - 🚨 PROFIT SPLIT : 100% TRADER cappé par ladder progressive (6 payouts) puis uncapped
    //  - 🚨 NOUVEAU : Daily Loss Limit UNIQUEMENT sur comptes EOD (pas Intraday)
    //  - 🚨 DCA INTERDIT sur PA depuis 1er mars 2026 (fail auto immédiat)
    //  - 🚨 Stop-Loss + Take-Profit OBLIGATOIRES sur Eval ET PA (enforcement Rithmic/Tradovate)
    //  - 🚨 Plus de mensuel : one-time only (codes promo permanents 80-90%)
    //  - 🚨 Activation fee $99 EOD / $79 Intraday NON discountable
    //  - 🚨 75K, 250K, 300K SUPPRIMÉS pour nouveaux achats (legacy uniquement)
    //  - 🚨 Consistency rule 30% → 50% (assouplie) — sur PA seulement
    //  - 🚨 Eval : 30 jours calendaires max, AUCUN reset (rebuy obligatoire)
    //  - 🚨 Metals HALT depuis 14 mars 2026 (GC/SI/QI/QO/MGC/HG/PL/PA)
    //  - Safety Net = starting + trailing DD + $100 (locke le trailing, débloque full contrats)
    //  - PA pre-safety net = HALF des contrats max PA (scaling)
    //  - 20 PA simultanés max par foyer
    //
    // STRUCTURE DUAL APEX 4.0 :
    //   ┌─ EOD Trail ──── DLL activé · trailing recalcule 16h59 ET · prix plus chers
    //   └─ Intraday Trail ── PAS de DLL · trailing tick-by-tick · prix -30% vs EOD
    plans: ['25k','50k','75k','100k','150k','250k','300k'],
    rules: {
      // === ÉVALUATION (one-time, 30 jours calendaires max) ===
      'Objectif de profit':       {'25k':'$1,500 (6%)','50k':'$3,000 (6%)','75k':'$4,500 (6% · legacy)','100k':'$6,000 (6%)','150k':'$9,000 (6%)','250k':'$15,000 (legacy)','300k':'$20,000 (legacy)'},
      'Drawdown trailing max':    {'25k':'$1,500','50k':'$2,500','75k':'$2,750 (legacy)','100k':'$3,000','150k':'$5,000','250k':'$6,500 (legacy)','300k':'$7,500 (legacy)'},
      'Mécanisme trailing':       {'25k':'EOD : recalcul UNE FOIS à 16h59 ET (gelé en intraday) · Intraday : tick-by-tick sur peak unrealized','50k':'EOD : recalcul 16h59 ET · Intraday : tick-by-tick','75k':'EOD ou Intraday','100k':'EOD : recalcul 16h59 ET · Intraday : tick-by-tick','150k':'EOD : recalcul 16h59 ET · Intraday : tick-by-tick','250k':'EOD ou Intraday','300k':'EOD ou Intraday'},
      'Daily Loss Limit (EOD)':   {'25k':'$500 (NOUVEAU 4.0 · pause trading session, pas de fail)','50k':'$1,000','75k':'~$1,250 (estim. legacy)','100k':'$1,500','150k':'$2,000','250k':'~$2,500 (estim. legacy)','300k':'~$3,000 (estim. legacy)'},
      'Daily Loss Limit (Intraday)':{'25k':'AUCUN (Intraday n\'a PAS de DLL)','50k':'AUCUN','75k':'AUCUN','100k':'AUCUN','150k':'AUCUN','250k':'AUCUN','300k':'AUCUN'},
      'Jours de trading min (eval)':{'25k':'0 (passage en 1 jour possible)','50k':'0','75k':'0','100k':'0','150k':'0','250k':'0','300k':'0'},
      'Durée éval max':           {'25k':'30 jours calendaires (no extension)','50k':'30 jours calendaires','75k':'30 jours','100k':'30 jours calendaires','150k':'30 jours calendaires','250k':'30 jours','300k':'30 jours'},
      'Règle de cohérence (eval)':{'25k':'AUCUNE en éval','50k':'AUCUNE en éval','75k':'AUCUNE en éval','100k':'AUCUNE en éval','150k':'AUCUNE en éval','250k':'AUCUNE en éval','300k':'AUCUNE en éval'},
      'Stop-Loss + Take-Profit':  {'25k':'OBLIGATOIRES sur chaque ordre (Rithmic/Tradovate enforce bracket) — depuis 4.0','50k':'OBLIGATOIRES','75k':'OBLIGATOIRES','100k':'OBLIGATOIRES','150k':'OBLIGATOIRES','250k':'OBLIGATOIRES','300k':'OBLIGATOIRES'},
      // === PERFORMANCE ACCOUNT (PA) ===
      'Règle de cohérence (PA)':  {'25k':'50% — aucun jour > 50% du profit total depuis dernier payout (relâché de 30%)','50k':'50% (relâché de 30%)','75k':'50%','100k':'50% (relâché de 30%)','150k':'50% (relâché de 30%)','250k':'50%','300k':'50%'},
      'PA DLL initial':           {'25k':'$500 (EOD seulement) — scale avec profits','50k':'$1,000','75k':'~$1,500','100k':'$1,750','150k':'$2,500','250k':'~$3,000','300k':'~$3,500'},
      'Safety Net (PA)':          {'25k':'$26,600 = starting + DD + $100','50k':'$52,600','75k':'$77,850 (legacy)','100k':'$103,100','150k':'$155,100','250k':'$256,600 (legacy)','300k':'$307,600 (legacy)'},
      'DCA (renforcement)':       {'25k':'Eval : autorisé · PA : 🚨 INTERDIT (fail auto) depuis mars 2026','50k':'Eval autorisé · PA INTERDIT','75k':'Eval autorisé · PA INTERDIT','100k':'Eval autorisé · PA INTERDIT','150k':'Eval autorisé · PA INTERDIT','250k':'Eval autorisé · PA INTERDIT','300k':'Eval autorisé · PA INTERDIT'},
      // === CONTRATS (mini = standard · micro = 10× mini, comptent à l\'unité) ===
      'Contrats max eval (mini)': {'25k':'4','50k':'6','75k':'8 (legacy)','100k':'8','150k':'12','250k':'16 (legacy)','300k':'20 (legacy)'},
      'Contrats PA pre-safety':   {'25k':'1 (½ du PA max)','50k':'2','75k':'3 (legacy)','100k':'3','150k':'4','250k':'6 (legacy)','300k':'7 (legacy)'},
      'Contrats PA post-safety':  {'25k':'2 (PA full)','50k':'4','75k':'6 (legacy)','100k':'6','150k':'9','250k':'12 (legacy)','300k':'15 (legacy)'},
      'Contrats max (micro)':     {'25k':'40 (10× mini, comptent à l\'unité)','50k':'60','75k':'80 (legacy)','100k':'80','150k':'120','250k':'160 (legacy)','300k':'200 (legacy)'},
      // === TRADING RESTRICTIONS ===
      'Positions overnight':      {'25k':'INTERDIT (flat à 16h59 ET impératif)','50k':'INTERDIT','75k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT','250k':'INTERDIT','300k':'INTERDIT'},
      'Trading des news':         {'25k':'Autorisé · interdit : max size, chasing, hedging des 2 côtés','50k':'Autorisé (idem)','75k':'Autorisé (idem)','100k':'Autorisé (idem)','150k':'Autorisé (idem)','250k':'Autorisé (idem)','300k':'Autorisé (idem)'},
      'Algos / automation':       {'25k':'INTERDIT — pas d\'algo, HFT, copy trading inter-comptes','50k':'INTERDIT','75k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT','250k':'INTERDIT','300k':'INTERDIT'},
      'Metals HALT (14 mars 2026)':{'25k':'🚨 GC, SI, QI, QO, MGC, HG, PL, PA SUSPENDUS — aucun retour annoncé','50k':'🚨 idem','75k':'🚨 idem','100k':'🚨 idem','150k':'🚨 idem','250k':'🚨 idem','300k':'🚨 idem'},
      'Auto-flat':                {'25k':'16h59 ET (toutes positions fermées · breach MLL après auto-flat = ban)','50k':'16h59 ET','75k':'16h59 ET','100k':'16h59 ET','150k':'16h59 ET','250k':'16h59 ET','300k':'16h59 ET'},
      // === TARIFS (one-time uniquement en 4.0, codes promo permanents -80/-90%) ===
      'Prix one-time EOD (list)': {'25k':'$177','50k':'$197','75k':'~$247 (legacy)','100k':'$297','150k':'$397','250k':'~$547 (legacy)','300k':'~$647 (legacy)'},
      'Prix one-time Intraday':   {'25k':'$118','50k':'$131','75k':'~$165 (legacy)','100k':'$198','150k':'$265','250k':'~$365 (legacy)','300k':'~$432 (legacy)'},
      'Prix après codes promo':   {'25k':'~$18-35 (SAVENOW -80/-90%)','50k':'~$20-40','75k':'~$25-50','100k':'~$30-60','150k':'~$40-80','250k':'~$55-110','300k':'~$65-130'},
      'Frais activation PA':      {'25k':'$99 EOD · $79 Intraday — NON discountable, payé après passage éval','50k':'$99 / $79','75k':'$99 / $79','100k':'$99 / $79','150k':'$99 / $79','250k':'$99 / $79','300k':'$99 / $79'},
      'Reset cost':               {'25k':'SUPPRIMÉ en 4.0 (rebuy éval avec code promo = de facto reset à $18-35)','50k':'SUPPRIMÉ','75k':'SUPPRIMÉ','100k':'SUPPRIMÉ','150k':'SUPPRIMÉ','250k':'SUPPRIMÉ','300k':'SUPPRIMÉ'},
      'Codes promo permanents':   {'25k':'SAVENOW (-80/-90%), TSXRGNER, codes rotatifs','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      // === PAYOUTS ===
      'Répartition gains':        {'25k':'100% trader · cappé par ladder lifetime (6 payouts) puis uncapped','50k':'100% · cappé ladder','75k':'100% · cappé ladder (legacy)','100k':'100% · cappé ladder','150k':'100% · cappé ladder','250k':'100% (legacy)','300k':'100% (legacy)'},
      'Payout minimum':           {'25k':'$500 (toutes tailles)','50k':'$500','75k':'$500','100k':'$500','150k':'$500','250k':'$500','300k':'$500'},
      'Payout ladder (1→6)':      {'25k':'$1,000 flat (tous les 6 steps)','50k':'$1,500 → $1,750 → $2,000 → $2,500 → $2,750 → $3,000','75k':'~$1,750 step 1 (legacy, scaling proportionnel)','100k':'$2,000 → $2,500 → $3,000 → $3,000 → $3,500 → $4,000','150k':'$2,500 → $3,000 → $3,500 → $4,000 → $4,500 → $5,000','250k':'(legacy, scaling proportionnel)','300k':'(legacy, scaling proportionnel)'},
      'Après 6 payouts':          {'25k':'Caps levés (uncapped) sur la même PA · sources contradictoires sur lifetime cap : damnpropfirms dit uncapped, autres disent PA ferme — à vérifier au checkout','50k':'Caps levés (uncapped)','75k':'Caps levés','100k':'Caps levés','150k':'Caps levés','250k':'Caps levés','300k':'Caps levés'},
      'Qualifying days/payout':   {'25k':'5 jours · profit min $125/jour','50k':'5 jours · min $200/jour','75k':'5 jours · ~$225 (legacy)','100k':'5 jours · min $250/jour','150k':'5 jours · min $375/jour','250k':'5 jours · min $500/jour','300k':'5 jours · ~$600 (legacy)'},
      'Délai payout':             {'25k':'24-48h processing','50k':'24-48h','75k':'24-48h','100k':'24-48h','150k':'24-48h','250k':'24-48h','300k':'24-48h'},
      'Méthodes payout':          {'25k':'ACH (US) · Plane (international) — Deel supprimé','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      // === MULTI-COMPTES ===
      'Comptes simul.':           {'25k':'Eval : illimité · PA : 20 max par foyer (copy-trading inter-PA OK)','50k':'20 PA max','75k':'20 PA max','100k':'20 PA max','150k':'20 PA max','250k':'20 PA max','300k':'20 PA max'},
    }
  },
  'Bulenox': {
    // VÉRIFIÉ MAI 2026 — Qualification mensuelle (récurrente). 3 STAGES :
    //   1. Qualification (Eval) → 2. Master (funded simulé) → 3. Funded (live capital après 3 payouts Master + Risk OK)
    //
    // CHECKPOINT BINAIRE au checkout — 2 OPTIONS (irréversible) :
    //   • Option 1 No Scaling : trailing REAL-TIME (tick-by-tick), AUCUN DLL, full contracts day-1
    //   • Option 2 EOD : trailing EOD (16h CT close), DLL activé, scaling progressif des contrats
    //
    // Sources officielles : bulenox.com/help/qualification-account + /help/master-account
    // Sources tierces : proptradingvibes, tradingtoolshub, tradingfinder, saveonpropfirms
    //
    // CHANGEMENTS RÉCENTS :
    //  - 🚨 Avril 2025 : balance caps Funded (auto-payout obligatoire chaque mercredi au-dessus du cap)
    //  - Mai 2026 : promo permanente $50 OFF sur 25K/50K (list $175 → $125)
    //
    // ⚠ PIÈGES CONNUS :
    //  - Section 5.6 Master Agreement : consistency enforcement subjectif (réputation mitigée)
    //  - Refuser le passage Master→Funded après 3 payouts ferme le Master + perte des profits (forced transition)
    //  - Option 1 : trailing real-time = killer sur news / wicks
    //
    // ✅ FORCES :
    //  - 100% des $10K premiers cumulés (puis 90/10)
    //  - Payouts hebdo mercredi (cycle clair)
    //  - 4 méthodes payout : ACH, Wire, PayPal, Wise
    //  - Pas de blackout news
    plans: ['25k','50k','100k','150k','250k'],
    rules: {
      // === QUALIFICATION (Eval mensuelle récurrente) ===
      'Objectif de profit':       {'25k':'$1,500 (6%)','50k':'$3,000 (6%)','100k':'$6,000 (6%)','150k':'$9,000 (6%)','250k':'$15,000 (6%)'},
      'Drawdown trailing max':    {'25k':'$1,500 — Option 1 real-time / Option 2 EOD close 16h CT','50k':'$2,500','100k':'$3,000','150k':'$4,500','250k':'$5,500'},
      'Drawdown lock (trailing)': {'25k':'Locke à starting + $100 = $25,100 une fois atteint','50k':'$50,100','100k':'$100,100','150k':'$150,100','250k':'$250,100'},
      'DLL Option 1 (No Scaling)':{'25k':'AUCUN — seul guardrail = trailing real-time','50k':'AUCUN','100k':'AUCUN','150k':'AUCUN','250k':'AUCUN'},
      'DLL Option 2 (EOD)':       {'25k':'$500 (2.0%)','50k':'$1,100 (2.2%)','100k':'$2,200 (2.2%)','150k':'$3,300 (2.2%)','250k':'$4,500 (1.8%)'},
      'Jours de trading min (Q)': {'25k':'0 (one-shot possible)','50k':'0','100k':'0','150k':'0','250k':'0'},
      'Profit min jour valide':   {'25k':'$0 (Qualification)','50k':'$0','100k':'$0','150k':'$0','250k':'$0'},
      'Règle de cohérence (Q)':   {'25k':'AUCUNE en Qualification (40% activé en Master/Funded)','50k':'AUCUNE','100k':'AUCUNE','150k':'AUCUNE','250k':'AUCUNE'},
      // === MASTER / FUNDED ===
      'Règle de cohérence Master':{'25k':'40% — Best day ≤ 40% du profit total (sinon payout refusé, non terminating)','50k':'40%','100k':'40%','150k':'40%','250k':'40%'},
      'Jours min Master':         {'25k':'10 jours minimum avant 1er payout','50k':'10','100k':'10','150k':'10','250k':'10'},
      'Jours min Funded/cycle':   {'25k':'5 jours minimum entre payouts (Funded)','50k':'5','100k':'5','150k':'5','250k':'5'},
      'Balance cap Funded (avril 2025)':{'25k':'$2,500 (auto-payout obligatoire au-dessus chaque mercredi)','50k':'$5,000','100k':'$10,000','150k':'$15,000','250k':'$25,000'},
      'KYC requis':               {'25k':'OBLIGATOIRE pour passer Master (ID + résidence)','50k':'OBLIGATOIRE','100k':'OBLIGATOIRE','150k':'OBLIGATOIRE','250k':'OBLIGATOIRE'},
      // === CONTRATS ===
      'Contrats max Option 1':    {'25k':'3 (day-1, full)','50k':'7','100k':'12','150k':'15','250k':'25'},
      'Contrats max Option 2':    {'25k':'2 → 3 (scaling profit-based)','50k':'3 → 4 → 7','100k':'3 → 5 → 8 → 12','150k':'5 → … → 15','250k':'6 → … → 25'},
      'Contrats max (micro)':     {'25k':'30 (10× mini)','50k':'70','100k':'120','150k':'150','250k':'250'},
      // === TRADING RESTRICTIONS ===
      'Positions overnight':      {'25k':'INTERDIT (auto-flat 15:59 CT)','50k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT','250k':'INTERDIT'},
      'Trading des news':         {'25k':'Autorisé · ⚠ Option 1 piégeux (trailing real-time tue les wicks)','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      'DCA (renforcement)':       {'25k':'Autorisé sur Qualification ET Master/Funded','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé','250k':'Autorisé'},
      'Algos / EAs':              {'25k':'EAs autorisés · HFT INTERDIT · Bulenox ne support pas les robots officiellement','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      'Copy trading inter-comptes':{'25k':'INTERDIT (et hedging des 2 côtés sur comptes différents)','50k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT','250k':'INTERDIT'},
      // === TARIFS ===
      'Prix mensuel (list)':      {'25k':'$175','50k':'$175','100k':'$215','150k':'~$325','250k':'~$535'},
      'Prix mensuel (mai 2026)':  {'25k':'$125 (promo permanente -$50)','50k':'$125 (-$50)','100k':'$155 (-$60)','150k':'~$245','250k':'~$430'},
      'Frais activation Master':  {'25k':'$143 (one-time, payé après passage Qualification)','50k':'$148','100k':'$248','150k':'$498','250k':'$898'},
      'Reset cost':               {'25k':'$78 (gratuit le jour de facturation mensuelle)','50k':'$78','100k':'$78','150k':'$78','250k':'$78'},
      'Data fee Pro':             {'25k':'$116/mois si Professional trader (sinon $0 retail)','50k':'$116/mois (Pro)','100k':'$116/mois (Pro)','150k':'$116/mois (Pro)','250k':'$116/mois (Pro)'},
      'Codes promo permanents':   {'25k':'VIBES (~45%), LUMI (89%), TRADINGSTRATEGY89 (89%)','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      // === PAYOUTS ===
      'Répartition gains':        {'25k':'100% sur les premiers $10K cumulés (lifetime) puis 90/10','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      'Payout minimum':           {'25k':'$1,000','50k':'$1,000','100k':'$1,000','150k':'$1,000','250k':'$1,000'},
      'Max withdrawal (3 premiers)':{'25k':'$1,000 (puis uncapped dès 4e payout)','50k':'$1,500','100k':'$1,750','150k':'$2,000','250k':'$2,500'},
      'Safety threshold reserve': {'25k':'$1,600 (= balance min à laisser sur compte pour payout)','50k':'$2,600','100k':'$3,100','150k':'$4,600','250k':'$5,600'},
      'Cycle payout':             {'25k':'Hebdo · soumission lundi → traitement mercredi → arrivée vendredi','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      'Méthodes payout':          {'25k':'ACH (US 2-3j) · Wire (intl 3-5j) · PayPal (US 1-2j, 2-4% fees) · Wise (intl 1-3j)','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      'Tax forms':                {'25k':'US : W-9 (1099-NEC si ≥$600/an) · Non-US : W-8BEN (sinon 30% retenue)','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      // === MULTI-COMPTES ===
      'Comptes simul.':           {'25k':'Qualification : illimité · Master : 11 actifs (3 simul au start) · Funded : 1 consolidé','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
    }
  },
  'Lucid Trading': {
    // VÉRIFIÉ MAI 2026 — 5 FAMILLES ACTIVES (pas 4 !) : LucidPro / LucidFlex / LucidDirect / LucidLive / LucidMaxx
    // Sources officielles : lucidtrading.com + support.lucidtrading.com (help center)
    // Sources tierces vérifiées : proptradingvibes (payout rules + accounts), damnpropfirms, phidiaspropfirm, pipback, saveonpropfirms
    //
    // FAMILLES :
    //   • LucidPro    → éval classique one-time, 40% consistency funded, profit goal + 3j min (OS août 2025: 5j supprimé)
    //   • LucidFlex   → éval + funded SANS daily loss limit (différenciateur unique), 50% consistency eval seulement
    //   • LucidDirect → Instant Funding (skip éval), 20% consistency strict (single day ≤ 20% cycle profit)
    //   • LucidLive   → 🌟 NOUVEAU 2026 : REAL MONEY $0 starting + bonus, swing + overnight + WEEKEND OK
    //   • LucidMaxx   → invite-only, daily payouts NO CAP, 80/20 sur capital réel (split plus bas mais cap zéro)
    //
    // CHANGEMENTS MAJEURS :
    //  - 🚨 28 nov 2025 : profit split 80/20 → 90/10 SAUF LucidMaxx (80/20)
    //  - 🚨 Mars 2026 : 90/10 standard sur tous (sauf legacy pre-28 nov : 100% premier $10K cumul)
    //  - Fév 2026 : DLL ajoutée en éval LucidPro/Direct (soft breach halt journée) · LucidMaxx lancé · LucidBlack DISCONTINUÉ
    //  - Fév 2026 : LucidLive rebuilt from scratch (escrow supprimé)
    //  - Nov 2025 : LucidFlex lancé (NO DLL → différenciateur principal)
    //  - Août 2025 : 8-day minimum supprimé sur Pro
    //
    // Plateformes : Rithmic, Tradovate, NinjaTrader (PAS ProjectX, PAS TradingView)
    //
    // ⚠ MLL ne suit PAS la baisse de balance après retrait : laisser $1,000-$1,500 au-dessus du MLL min
    plans: ['25k','50k','100k','150k'],
    rules: {
      // === ÉVALUATION (LucidPro one-time, profit target 6%) ===
      'Objectif de profit':       {'25k':'$1,500 (6%) — toutes familles','50k':'$3,000 (6%)','100k':'$6,000 (6%)','150k':'$9,000 (6%)'},
      'Drawdown trailing max':    {'25k':'$1,000 EOD trailing (recalcule à 16h45 EST close) · locke à starting','50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'DLL LucidPro/Direct':      {'25k':'~$600 (fév 2026, soft breach halt journée)','50k':'$1,200 (~2.4%)','100k':'~$2,400 (extrapolation 2.4%)','150k':'~$3,600 (extrapolation 2.4%)'},
      'DLL LucidFlex':            {'25k':'AUCUN — différenciateur clé Flex (eval ET funded)','50k':'AUCUN','100k':'AUCUN','150k':'AUCUN'},
      'Jours de trading min (eval)':{'25k':'0 (suppr. août 2025 sur Pro · suppr. fév 2026 sur Direct)','50k':'0','100k':'0','150k':'0'},
      'Profit min jour valide (eval)':{'25k':'$0 (pas de seuil par jour en éval)','50k':'$0','100k':'$0','150k':'$0'},
      'Consistency (eval) LucidPro':{'25k':'AUCUNE (supprimée)','50k':'AUCUNE','100k':'AUCUNE','150k':'AUCUNE'},
      'Consistency (eval) LucidFlex':{'25k':'50% (Best day ≤ 50% du profit eval) — ENLEVÉE en funded','50k':'50%','100k':'50%','150k':'50%'},
      'Consistency LucidDirect':  {'25k':'20% (STRICTE) — single day ≤ 20% du cycle profit','50k':'20%','100k':'20%','150k':'20%'},
      'Limite de temps Eval':     {'25k':'60 jours calendaires (LucidPro)','50k':'60 jours','100k':'60 jours','150k':'60 jours'},
      // === FUNDED (par famille) ===
      'Consistency LucidPro funded':{'25k':'40% (35% pour comptes pre-28 nov 2025 legacy) — chaque cycle de payout','50k':'40%','100k':'40%','150k':'40%'},
      'Consistency LucidFlex funded':{'25k':'AUCUNE en funded (différenciateur !)','50k':'AUCUNE','100k':'AUCUNE','150k':'AUCUNE'},
      'Jours min LucidPro funded':{'25k':'3 jours calendaires entre payouts','50k':'3 jours calendaires','100k':'3 jours calendaires','150k':'3 jours calendaires'},
      'Jours min LucidFlex funded':{'25k':'5 jours profitables (non consécutifs OK)','50k':'5 jours profitables','100k':'5 jours profitables','150k':'5 jours profitables'},
      'Profit min/jour LucidFlex':{'25k':'$100/jour','50k':'$150/jour','100k':'$200/jour','150k':'$250/jour'},
      // === LUCID LIVE (real money 2026) ===
      'LucidLive starting balance':{'25k':'$0 starting + bonus crédité','50k':'$0 + bonus','100k':'$0 + bonus','150k':'$0 + bonus'},
      'LucidLive bonus':          {'25k':'$1,000','50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'LucidLive transitions':    {'25k':'5 payouts Flex/Pro · 6 payouts Direct → accès LucidLive (1 max par foyer, cap $150K)','50k':'idem','100k':'idem','150k':'idem'},
      // === TRADING RESTRICTIONS ===
      'Heures de trading':        {'25k':'Dim 18h EST → Jeu 16h45 EST · auto-flat 16h45 EST · reprise 18h EST','50k':'idem','100k':'idem','150k':'idem'},
      'Positions overnight':      {'25k':'INTERDIT (Pro/Flex/Direct) · ✅ AUTORISÉ uniquement sur LucidLive','50k':'idem','100k':'idem','150k':'idem'},
      'Weekend trading':          {'25k':'INTERDIT (Pro/Flex/Direct) · ✅ AUTORISÉ uniquement sur LucidLive','50k':'idem','100k':'idem','150k':'idem'},
      'Trading des news':         {'25k':'Autorisé sur toutes familles (NFP, FOMC, CPI, Powell, GDP)','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'DCA / scalping':           {'25k':'Autorisé (pas de min hold time)','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'Bots / copy trading':      {'25k':'Autorisés (trader responsable du PnL)','50k':'Autorisés','100k':'Autorisés','150k':'Autorisés'},
      // === CONTRATS ===
      'Contrats max (mini)':      {'25k':'2','50k':'4','100k':'6','150k':'10'},
      'Contrats max (micro)':     {'25k':'20 (10× mini)','50k':'40','100k':'60','150k':'100'},
      // === TARIFS (one-time, pas de mensuel) ===
      'Prix LucidPro (retail)':   {'25k':'~$157','50k':'$215','100k':'$299','150k':'~$432'},
      'Prix LucidPro (VIBES -40%)':{'25k':'$94.50','50k':'$129.50','100k':'$199.50','150k':'$259'},
      'Prix LucidFlex (retail)':  {'25k':'$164 (~$98.50 avec VIBES)','50k':'~$245','100k':'$295','150k':'~$415'},
      'Prix LucidDirect (instant)':{'25k':'$197','50k':'$549','100k':'$799 (ajouté fév 2026)','150k':'$899'},
      'Frais activation':         {'25k':'$0 (aucun frais activation après éval)','50k':'$0','100k':'$0','150k':'$0'},
      'Codes promo permanents':   {'25k':'VIBES (-40%), NINJA, SOPF, DGT (35-50% courant)','50k':'idem','100k':'idem','150k':'idem'},
      'Reset compte':             {'25k':'Non documenté précisément (à vérifier au checkout)','50k':'idem','100k':'idem','150k':'idem'},
      // === PAYOUTS ===
      'Profit split (nouveaux)':  {'25k':'90/10 from dollar one (post 28 nov 2025) · LucidMaxx exception : 80/20','50k':'90/10','100k':'90/10','150k':'90/10'},
      'Profit split (legacy)':    {'25k':'100% premier $10K cumul puis 90/10 (comptes pre-28 nov 2025)','50k':'idem','100k':'idem','150k':'idem'},
      'Payout minimum':           {'25k':'$500 toutes familles','50k':'$500','100k':'$500','150k':'$500'},
      'Cap LucidFlex (fixe)':     {'25k':'$1,000 (= $900 net après 10%)','50k':'$2,000 ($1,800 net)','100k':'$2,500 ($2,250 net)','150k':'$3,000 ($2,700 net)'},
      'Cap LucidPro (progressif)':{'25k':'~$1,500 → uncapped','50k':'$2K → $3K → $4K → $5K → $6K+ uncapped','100k':'Progression similaire 50K','150k':'$3K (1er) → $3,500+ (uncapped après)'},
      'Cap LucidDirect (progressif)':{'25k':'$1,000 (cycles 1-6) puis uncapped','50k':'$2K (1-2) → $2,500 (3-6) uncapped','100k':'$2,500 (1-2) → $3,000 (3-6)','150k':'$3,000 (1-2) → $3,500 (3-6)'},
      'Cap LucidMaxx':            {'25k':'NO CAP — daily payouts on-demand (capital réel)','50k':'NO CAP','100k':'NO CAP','150k':'NO CAP'},
      'Délai payout':             {'25k':'~15 min approval (média) · fonds en 2 jours ouvrés','50k':'idem','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'25k':'Plaid ACH (US) · PayPal · Rise (crypto USDT/USDC) · WorkMarket (intl wire)','50k':'idem','100k':'idem','150k':'idem'},
      'Frais retrait':            {'25k':'$0 (Lucid ne charge aucun frais)','50k':'$0','100k':'$0','150k':'$0'},
      'Buffer post-payout':       {'25k':'Laisser $1,000-$1,500 au-dessus du MLL min (MLL ne suit pas la baisse de balance)','50k':'idem','100k':'idem','150k':'idem'},
      // === MULTI-COMPTES ===
      'Comptes financés simul.':  {'25k':'5 max par foyer (toutes familles confondues sauf LucidLive : 1 max)','50k':'5 max','100k':'5 max','150k':'5 max'},
      'Comptes Eval simul.':      {'25k':'10 max par foyer','50k':'10 max','100k':'10 max','150k':'10 max'},
    }
  },
  'Tradeify': {
    // VÉRIFIÉ MAI 2026 — Refonte Tradeify 3.0 (mars 2026)
    // Sources officielles : help.tradeify.co (Intercom) + tradeify.co/post/handle-tradeify-consistency-rule
    // Sources tierces vérifiées : proptradingvibes (rules + reviews), saveonpropfirms, fundedprogramfinder, pipback
    // CEO Brett Simba (Floride USA). +$100M payés (mai 2026). Trustpilot 4.8
    //
    // 3 FAMILLES ACTIVES :
    //   • Select (one-time eval) — 40% consistency eval · sous-types Daily (DLL) + Flex (no DLL)
    //     - Select Daily : DLL activé · payouts daily option
    //     - Select Flex : NO DLL · 50% funded consistency
    //   • Growth (one-time eval) — 0% consistency eval (unrestricted) · 35% funded · DLL $600-$3,750
    //   • Lightning Funded (INSTANT, skip eval) — instant payouts dashboard 24h
    //     - Post 12 sept 2025 : 20% (1st payout) → 25% (2nd) → 30% (3+)
    //     - Pre 12 sept 2025 : 20% all payouts
    //
    // 🌟 SPÉCIFICITÉ KILLER : drawdown LOCK à +$100 au-dessus du starting balance
    //    Une fois l'EOD balance dépasse drawdown+$100, le trailing se FIGE
    //    Ex : 50K Select → drawdown bloque à $50,100 (incomparable sur le marché)
    //
    // CHANGEMENTS MAJEURS 2026 :
    //  - Mars 2026 (Tradeify 3.0) : refonte complète — Select Eval 50K profit target $2,500 → $3,000
    //  - Mars 2026 : Lightning 150K trailing $5,250 / DLL $3,000 (vs $4,500/$3,750 pre-mars)
    //  - 12 sept 2025 : Lightning consistency 20% flat → progressive 20/25/30%
    //
    // PAYOUT WINDOWS FIXES : 1-4 et 15-18 de chaque mois · Lightning = INSTANT dashboard 24h
    //
    // 🌟 ELITE REWARD POOL : bonus de récompense partagé entre traders top
    //    25K Select : $2,000 ($3,000 avec 1.5x multiplier) · Lightning 150K : $12,000
    //
    // ⚠ Méthodes payout : Rise (primaire) + Plane (backup) — PAS de PayPal ni ACH/Wire/Wise direct
    plans: ['25k','50k','100k','150k'],
    rules: {
      // === ÉVALUATION (Select & Growth one-time, Lightning instant) ===
      'Objectif de profit':       {'25k':'Lightning : n/a (instant) · Select/Growth Eval : $1,500 (6%)','50k':'$3,000 (6%) · Select hausse depuis $2,500 (Tradeify 3.0)','100k':'$6,000 (6%)','150k':'$9,000 (6%)'},
      'Drawdown Select (EOD)':    {'25k':'$1,000','50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'Drawdown Growth (EOD)':    {'25k':'$1,000','50k':'$2,000','100k':'$3,500','150k':'$5,000'},
      'Drawdown Lightning (EOD)': {'25k':'$1,000','50k':'$2,000','100k':'$3,000','150k':'$5,250 (nouveaux post-mars 2026 · pre = $4,500)'},
      'Lock drawdown':            {'25k':'🌟 Lock +$100 above starting une fois EOD balance dépasse drawdown+$100 (RARE)','50k':'🌟 idem (ex: 50K → bloque à $50,100)','100k':'🌟 idem','150k':'🌟 idem'},
      'DLL Select Daily':         {'25k':'n/a','50k':'$1,000','100k':'$1,250','150k':'$1,750'},
      'DLL Select Flex':          {'25k':'AUCUN','50k':'AUCUN','100k':'AUCUN','150k':'AUCUN'},
      'DLL Growth':               {'25k':'$600 (soft breach pause journée, pas fail)','50k':'$1,250','100k':'$2,500','150k':'$3,750'},
      'DLL Lightning':            {'25k':'AUCUN (Lightning 25K seul)','50k':'$1,250','100k':'$2,500','150k':'$3,000 (nouveaux) · $3,750 (pre-31 mars 2026)'},
      'Jours de trading min':     {'25k':'1 jour (Growth) · 3 jours (Select à cause 40% consist)','50k':'idem','100k':'idem','150k':'idem'},
      'Profit min jour valide':   {'25k':'$50','50k':'$100','100k':'$200','150k':'$300'},
      // === CONSISTENCY (par famille et phase) ===
      'Consistency Select (eval)':{'25k':'40% (Best day ≤ 40% du profit total)','50k':'40%','100k':'40%','150k':'40%'},
      'Consistency Select Flex (funded)':{'25k':'50% (Best day ≤ 50% en funded)','50k':'50%','100k':'50%','150k':'50%'},
      'Consistency Select Daily (funded)':{'25k':'Balance-based (pas % fixe)','50k':'idem','100k':'idem','150k':'idem'},
      'Consistency Growth':       {'25k':'Eval : AUCUNE (unrestricted) · Funded : 35%','50k':'idem','100k':'idem','150k':'idem'},
      'Consistency Lightning':    {'25k':'Post 12 sept 2025 : 20% (1er) → 25% (2e) → 30% (3+) · Pre : 20% all · 150K : 35% from day 1','50k':'idem','100k':'idem','150k':'35% from day 1'},
      // === TRADING RESTRICTIONS ===
      'Positions overnight':      {'25k':'INTERDIT (flat fin de session)','50k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT'},
      'Trading des news':         {'25k':'Autorisé sans restriction (NFP, FOMC, CPI, Powell)','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'DCA (renforcement)':       {'25k':'Autorisé partout','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'Algos / copy trading':     {'25k':'Algos OK · HFT INTERDIT · Copy entre VOS comptes OK · pas inter-foyer','50k':'idem','100k':'idem','150k':'idem'},
      // === CONTRATS ===
      'Contrats max (mini)':      {'25k':'1 (Select/Growth · Lightning n/a)','50k':'4','100k':'8','150k':'12'},
      'Contrats max (micro)':     {'25k':'10','50k':'40','100k':'80','150k':'120'},
      'Scaling micro requis':     {'25k':'Oui pour Lightning post-12-sept-2025','50k':'idem','100k':'idem','150k':'idem'},
      // === TARIFS (one-time, codes promo permanents -33/-50%) ===
      'Prix Select (one-time)':   {'25k':'$109 (Tradeify 3.0)','50k':'~$159 (codes DASH/PTV -33/-50%)','100k':'~$259','150k':'~$359'},
      'Prix Growth (one-time)':   {'25k':'$99 (Tradeify 3.0)','50k':'$199 list · $59 avec code DASH','100k':'$199 / $119 code','150k':'~$299'},
      'Prix Lightning (one-time)':{'25k':'$244','50k':'$299','100k':'$425','150k':'$510'},
      'Frais activation':         {'25k':'$0 (waived sur tous plans)','50k':'$0','100k':'$0','150k':'$0'},
      'Reset cost':               {'25k':'$95 toutes tailles','50k':'$95','100k':'$95','150k':'$95'},
      'Codes promo permanents':   {'25k':'DASH, PTV (~33-50% courant)','50k':'idem','100k':'idem','150k':'idem'},
      // === PAYOUTS (split différent par famille !) ===
      'Profit split Select':      {'25k':'90% flat (pas de 100% premier $X)','50k':'90% flat','100k':'90% flat','150k':'90% flat'},
      'Profit split Growth':      {'25k':'100% premier $15,000 cumul puis 90/10','50k':'idem','100k':'idem','150k':'idem'},
      'Profit split Lightning':   {'25k':'100% premier $15,000 cumul puis 90/10','50k':'idem','100k':'idem','150k':'idem'},
      'Min payout balance':       {'25k':'$1,500 above starting (Growth/Lightning) · varies (Select)','50k':'idem','100k':'idem','150k':'idem'},
      'Cap payout Growth':        {'25k':'$1,000 par withdrawal','50k':'$1,000','100k':'$1,000','150k':'$1,000'},
      'Cap payout Select':        {'25k':'Progressif $1,000 → $1,250 → $3,000','50k':'idem','100k':'idem','150k':'idem'},
      'Cadence payout':           {'25k':'Windows FIXES : 1-4 et 15-18 de chaque mois (Select/Growth) · Lightning : INSTANT dashboard (24h)','50k':'idem','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'25k':'Rise (primaire crypto USDT/USDC + bank) + Plane (backup wire) — PAS PayPal/ACH direct/Wise','50k':'idem','100k':'idem','150k':'idem'},
      'Elite Reward Pool':        {'25k':'$2,000 (Select · 1.5x multiplier = $3,000) · $2,000 (Growth)','50k':'Bonus proportionnel','100k':'Bonus proportionnel','150k':'$12,000 (Lightning 150K) — top tier'},
      // === MULTI-COMPTES ===
      'Comptes simul.':           {'25k':'Funded : 5 max par foyer (toutes familles) · Eval : 15 max sur 30 jours','50k':'5 funded max','100k':'5 funded max','150k':'5 funded max'},
    }
  },
  'Take Profit Trader': {
    // VÉRIFIÉ MAI 2026 — Modèle 3 PHASES UNIQUE sur le marché futures :
    //   Test (eval mensuelle) → PRO (sim funded, 80/20, INTRADAY trailing) → PRO+ (LIVE Tradovate, 90/10, EOD trailing)
    //
    // Sources officielles : takeprofittraderhelp.zendesk.com + takeprofittrader.com
    // Sources tierces vérifiées : proptradingvibes (rules + accounts), quantvps, tradetanto, propfirmapp
    //
    // CEO James Sixsmith. Houston Texas USA. Leader marché US prop futures.
    //
    // CHANGEMENTS MAJEURS :
    //  - 🚨 Jan 2025 : DLL SUPPRIMÉE sur TOUTES les phases (seul guardrail = trailing DD)
    //  - 🚨 18 mars 2026 : PRO+ auto-promotion COMPLÈTE (pas d'application, pas de frais)
    //  - 28 jan 2026 : panne Tradovate ~2j — comptes affectés remédiés
    //
    // 🚨 PIÈGE CLASSIQUE : switch Test EOD → PRO INTRADAY tue beaucoup de traders
    //    Test : drawdown recalcule SEULEMENT à 17h ET (gelé en intraday)
    //    PRO : drawdown follow peak real-time INCL. unrealized gains (tick-by-tick)
    //    PRO+ : retour à EOD (comme Test)
    //
    // ✅ FORCES :
    //  - 90% split sur PRO+ (le plus généreux après Apex)
    //  - Reset PRO autorisé jusqu'à 3 fois (rare — la plupart des firmes interdisent)
    //  - Payout daily 4-9h processing
    //  - Promotion PRO+ automatique (pas de checklist arbitraire)
    //  - NOFEE40 = code permanent -40% sur eval + waive activation $130
    plans: ['25k','50k','75k','100k','150k'],
    rules: {
      // === TEST (Évaluation mensuelle) ===
      'Objectif de profit':       {'25k':'$1,500 (6%)','50k':'$3,000 (6%)','75k':'$4,500 (6%)','100k':'$6,000 (6%)','150k':'$9,000 (6%)'},
      'Drawdown Test (EOD)':      {'25k':'$1,500 EOD trailing — recalcule UNE FOIS à 17h ET sur closing balance · locke à starting','50k':'$2,000 EOD','75k':'$2,500 EOD','100k':'$3,000 EOD','150k':'$4,500 EOD'},
      'Daily Loss Limit':         {'25k':'🚨 AUCUN (DLL supprimée janvier 2025) — seul guardrail = trailing','50k':'AUCUN','75k':'AUCUN','100k':'AUCUN','150k':'AUCUN'},
      'Jours de trading min':     {'25k':'5 jours minimum (≥1 trade/jour, pas de seuil profit)','50k':'5 jours','75k':'5 jours','100k':'5 jours','150k':'5 jours'},
      'Profit min jour valide':   {'25k':'AUCUN seuil — juste ≥1 trade/jour','50k':'AUCUN','75k':'AUCUN','100k':'AUCUN','150k':'AUCUN'},
      'Règle de cohérence (Test)':{'25k':'Best day ≤ 50% du profit total — Test SEULEMENT (pas de consistency sur PRO/PRO+)','50k':'≤ 50%','75k':'≤ 50%','100k':'≤ 50%','150k':'≤ 50%'},
      // === PRO (Sim funded, 80/20, intraday DD) ===
      'Drawdown PRO (INTRADAY)':  {'25k':'$1,500 INTRADAY trailing — follow peak real-time INCL. unrealized · locke à starting','50k':'$2,000 INTRADAY','75k':'$2,500 INTRADAY','100k':'$3,000 INTRADAY','150k':'$4,500 INTRADAY'},
      'PRO → PRO+ promotion':     {'25k':'$5,000 freeze de profits réalisés sur PRO requis · auto-promotion depuis 18 mars 2026 (no app, $0 fee)','50k':'$5,000 freeze','75k':'$5,000 freeze','100k':'$5,000 freeze','150k':'$5,000 freeze'},
      'Activation PRO+':          {'25k':'$0 (auto-promotion) · plateforme : Tradovate live execution','50k':'$0','75k':'$0','100k':'$0','150k':'$0'},
      // === PRO+ (LIVE Tradovate, 90/10, EOD DD) ===
      'Drawdown PRO+ (EOD)':      {'25k':'$1,500 EOD trailing (retour mécanisme Test) · live execution Tradovate','50k':'$2,000 EOD','75k':'$2,500 EOD','100k':'$3,000 EOD','150k':'$4,500 EOD'},
      // === TRADING RESTRICTIONS ===
      'Positions overnight':      {'25k':'INTERDIT — auto-flat 17h ET strict (Mon-Fri) toutes phases','50k':'INTERDIT','75k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT'},
      'News T1 (Test)':           {'25k':'Autorisé sans restriction (NFP/FOMC/CPI/Powell)','50k':'Autorisé','75k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'News T1 (PRO/PRO+)':       {'25k':'Flat 1 MIN avant + pendant + après FOMC/NFP/CPI/Powell','50k':'idem','75k':'idem','100k':'idem','150k':'idem'},
      'DCA / scaling':            {'25k':'Pas de règle spécifique (autorisé en pratique)','50k':'idem','75k':'idem','100k':'idem','150k':'idem'},
      'Bots / automation':        {'25k':'Full auto INTERDIT (manual execution requise) · Semi-auto OK si monitoring','50k':'idem','75k':'idem','100k':'idem','150k':'idem'},
      'Counter-positions':        {'25k':'INTERDITES (hedge des 2 côtés sur même compte)','50k':'INTERDITES','75k':'INTERDITES','100k':'INTERDITES','150k':'INTERDITES'},
      'Coordinated multi-account':{'25k':'INTERDIT entre PRO/PRO+ (positions opposées simultanées)','50k':'INTERDIT','75k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT'},
      // === CONTRATS (hard limit · dépassement +1 contrat = termination immédiate) ===
      'Contrats max (mini)':      {'25k':'3','50k':'6','75k':'9','100k':'12','150k':'15'},
      'Contrats max (micro)':     {'25k':'30 (10× mini, comptent à l\'unité)','50k':'60','75k':'90','100k':'120','150k':'150'},
      // === TARIFS (mensuel récurrent — Test, code NOFEE40 permanent -40% + waive activation) ===
      'Prix Test (mois list)':    {'25k':'$150','50k':'$170','75k':'$245','100k':'$330','150k':'$360'},
      'Prix Test (NOFEE40 -40%)': {'25k':'$90','50k':'$102','75k':'$147','100k':'$198','150k':'$216'},
      'Frais activation PRO':     {'25k':'$130 (annulé par NOFEE40)','50k':'$130 (annulé NOFEE40)','75k':'$130','100k':'$130','150k':'$130'},
      'Frais activation PRO+':    {'25k':'$0 (auto-promotion depuis 18 mars 2026)','50k':'$0','75k':'$0','100k':'$0','150k':'$0'},
      'Reset Test':               {'25k':'$100 flat (1 free reset/mois)','50k':'$100','75k':'$100','100k':'$100','150k':'$100'},
      'Reset PRO (max 3)':        {'25k':'$399','50k':'$649','75k':'$799','100k':'$999','150k':'$1,499'},
      'Reset PRO+':               {'25k':'INTERDIT — doit redémarrer depuis Test','50k':'INTERDIT','75k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT'},
      'Codes promo permanents':   {'25k':'NOFEE40 (-40% Test mensuel à vie + waive $130 activation PRO)','50k':'NOFEE40','75k':'NOFEE40','100k':'NOFEE40','150k':'NOFEE40'},
      // === PAYOUTS ===
      'Répartition gains':        {'25k':'PRO : 80/20 (trader 80%) → PRO+ : 90/10 (trader 90%)','50k':'80/20 → 90/10','75k':'80/20 → 90/10','100k':'80/20 → 90/10','150k':'80/20 → 90/10'},
      'Payout minimum':           {'25k':'Pas de minimum strict (≥ buffer = starting + MLL)','50k':'idem','75k':'idem','100k':'idem','150k':'idem'},
      'Buffer payout (PRO/PRO+)': {'25k':'Buffer = Starting balance + Maximum Loss Limit ($26,500 sur PRO 25K) — formulation officielle TPT','50k':'$52,000','75k':'$77,500','100k':'$103,000','150k':'$154,500'},
      'Min entre payouts (PRO)':  {'25k':'7 jours minimum + 1 trade/semaine civile','50k':'7 jours','75k':'7 jours','100k':'7 jours','150k':'7 jours'},
      'Min entre payouts (PRO+)': {'25k':'0 (daily payouts possibles)','50k':'0','75k':'0','100k':'0','150k':'0'},
      'Délai payout':             {'25k':'~4-9h processing (max ~24h)','50k':'idem','75k':'idem','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'25k':'Plaid ACH (US) · Wise (international)','50k':'idem','75k':'idem','100k':'idem','150k':'idem'},
      'KYC':                      {'25k':'Requis avant 1er payout PRO','50k':'idem','75k':'idem','100k':'idem','150k':'idem'},
      // === MULTI-COMPTES ===
      'Comptes financés simul.':  {'25k':'5 max au total (PRO + PRO+ combinés — pas 5 de chaque)','50k':'5 max combinés','75k':'5 max combinés','100k':'5 max combinés','150k':'5 max combinés'},
      'Évaluations simul.':       {'25k':'Illimitées (Test mensuel)','50k':'Illimitées','75k':'Illimitées','100k':'Illimitées','150k':'Illimitées'},
    }
  },
  'My Funded Futures': {
    // VÉRIFIÉ MAI 2026 — 5 PLANS actifs + 1 legacy
    // Sources officielles : myfundedfutures.com + help.myfundedfutures.com (Intercom)
    // Sources tierces vérifiées : proptradingvibes (rules-overview + payout-rules), tradingtoolshub
    // Fondé Matthew Leech (juin 2023). Fort Worth Texas USA.
    //
    // 5 FAMILLES ACTIVES + 1 legacy (Scale) :
    //   • Core    → 50K only · 80/20 · EOD 3% · payout 5 winning days · $250 min · LEGACY (May 2026 deemphasized)
    //   • Rapid   → 25-150K · 90/10 (depuis 12 jan 2026) · INTRADAY 4% · payout DAILY 24h · $500 min · ⚠ T1 news bannies
    //   • Pro     → 50-150K · 80/20 · EOD 3% · payout BI-WEEKLY (14 cal days) · $1,000 min · 60% pre-buffer carve-out · swing OK
    //   • Flex    → 25K/50K · 80/20 · EOD STATIC 4% (no trailing) · payout 5 winning days · $250 min · ✅ T1 news ALLOWED
    //   • Builder → 50K only · 80/20 · fixed buffer ($2K/$1.5K) · DLL $1K soft pause · payout 48h · $500 min · ✅ T1 news ALLOWED
    //   • Scale   → 50-150K legacy · 80/20 · $250 min · escalating cap $1.5K→$3.5K
    //
    // CHANGEMENTS RÉCENTS :
    //  - 12 jan 2026 : Rapid passe 80/20 → 90/10
    //  - Mars 2026 : Flex lancé (EOD STATIC 4%, T1 news OK)
    //  - 2026 : Builder lancé (48h payouts — le plus rapide du marché)
    //  - 4 mars 2026 : Tax reporting update (1099 via Rise direct)
    //  - Mai 2026 : Core deemphasized de la nav principale (legacy)
    //  - 2026 : Wise SUPPRIMÉ comme méthode payout
    //
    // 🚨 NEWS RULE Tier-1 (Rapid/Pro/Core sur funded) :
    //    Flat 2 MIN avant ET 2 MIN après chaque Tier-1 (CPI/NFP/FOMC/GDP/PPI/Powell)
    //    Violation = payout denial + fermeture compte (gagnant ou perdant)
    //    EXEMPTIONS : Flex et Builder PERMETTENT T1 news sur funded (rare sur le marché)
    //
    // 🚨 AUTO-LIQUIDATION : positions ferment à 16:10 EST · breach après = payout denial
    plans: ['25k','50k','100k','150k'],
    rules: {
      // === ÉVALUATION (one-time, profit target 6%) ===
      'Objectif de profit':       {'25k':'$1,500 (6%) · Flex seulement','50k':'$3,000 (6%) · TOUS plans · Pro 1-Day Addon : $4,000','100k':'$6,000 (6%) · Rapid/Pro/Scale','150k':'$9,000 (6%) · Rapid/Pro/Scale'},
      'Drawdown Rapid (intraday)':{'25k':'$1,000 (4% intraday trailing)','50k':'$2,000','100k':'$4,000','150k':'$6,000'},
      'Drawdown Core/Pro (EOD)':  {'25k':'n/a','50k':'$1,500 (3% EOD trailing)','100k':'$3,000','150k':'$4,500'},
      'Drawdown Flex (EOD static)':{'25k':'$1,000 (4% EOD STATIC · ne trail jamais)','50k':'$2,000','100k':'n/a','150k':'n/a'},
      'Drawdown Builder (buffer)':{'25k':'n/a','50k':'$2,000 default / $1,500 lower-price (fixed buffer, no trail)','100k':'n/a','150k':'n/a'},
      'Daily Loss Limit':         {'25k':'AUCUN partout sauf Builder ($1,000 soft pause) · LIVE Pro : $700-$3,000','50k':'AUCUN · Builder : $1,000 soft pause','100k':'AUCUN · LIVE Pro : $700-$3,000','150k':'AUCUN · LIVE Pro : $700-$3,000'},
      'Jours de trading min (eval)':{'25k':'1 jour minimum','50k':'1 jour','100k':'1 jour','150k':'1 jour'},
      'Règle de cohérence (eval)':{'25k':'50% en éval (no day > 50% du profit total) · supprimée en sim funded','50k':'50% en éval · Pro 1-Day Addon supprime la règle','100k':'50% en éval','150k':'50% en éval'},
      // === SIM FUNDED → LIVE (transitions par plan) ===
      'Sim→Live trigger Rapid':   {'25k':'$10K single-day net profit OU approbation Risk Management','50k':'idem','100k':'idem','150k':'idem'},
      'Sim→Live trigger Pro':     {'25k':'n/a','50k':'3 payouts consécutifs OU $100K cumulative sim payouts','100k':'3 payouts OU $100K cumulative','150k':'3 payouts OU $100K cumulative'},
      'Sim→Live trigger Flex/Builder':{'25k':'Flex : 5 payouts consécutifs · 10K sim cap · Risk discretion','50k':'Flex : idem · Builder : 5 sim payouts','100k':'n/a','150k':'n/a'},
      'LIVE Rapid spécifique':    {'25k':'EOD drawdown remplace intraday · contrats ÷2 · cooldown 21j après breach · $5K carry-over via Reserve Program','50k':'idem','100k':'idem','150k':'idem'},
      'LIVE Pro initial funding': {'25k':'n/a','50k':'$2K-$5K initial balance','100k':'$3K-$7.5K initial balance','150k':'$4K-$10K initial balance'},
      'LIVE Pro balance withdraw':{'25k':'n/a','50k':'Après 20 winning days + 3 funded payouts','100k':'idem','150k':'idem'},
      // === CONTRATS ===
      'Contrats max éval (mini)': {'25k':'2 (Flex/Rapid)','50k':'5 (Rapid/Pro/Core) · 4 (Builder) · Scale : 3','100k':'10','150k':'15 (Rapid/Pro) · 9 (Scale)'},
      'Contrats max éval (micro)':{'25k':'20','50k':'50 · Scale : 15','100k':'100','150k':'150 · Scale : 45'},
      'Contrats sim funded':      {'25k':'5/50 (étend en sim funded)','50k':'5/50','100k':'10/100','150k':'15/150'},
      'Contrats LIVE':            {'25k':'÷2 vs éval (Rapid)','50k':'÷2 · Flex live = 4 mini / 40 micro','100k':'÷2','150k':'÷2'},
      // === TRADING RESTRICTIONS ===
      'Positions overnight':      {'25k':'INTERDIT (Rapid/Core/Flex/Builder) · Pro AUTORISÉ (swing-friendly)','50k':'INTERDIT sauf Pro','100k':'INTERDIT sauf Pro','150k':'INTERDIT sauf Pro'},
      'Auto-liquidation':         {'25k':'16:10 EST (positions auto-close) · breach après = payout denial','50k':'16:10 EST','100k':'16:10 EST','150k':'16:10 EST'},
      'News Tier-1 (Rapid/Pro)':  {'25k':'🚨 FLAT 2 min AVANT + 2 min APRÈS CPI/NFP/FOMC/GDP/PPI/Powell · violation = fermeture','50k':'🚨 idem','100k':'🚨 idem','150k':'🚨 idem'},
      'News Tier-1 (Flex/Builder)':{'25k':'✅ T1 news AUTORISÉES sur funded (UNIQUE sur le marché)','50k':'✅ idem','100k':'n/a','150k':'n/a'},
      'DCA (renforcement)':       {'25k':'Autorisé · scaling micro requis pour comptage','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'Algos / automation':       {'25k':'Full auto INTERDIT · Semi-auto OK si manual oversight','50k':'idem','100k':'idem','150k':'idem'},
      // === TARIFS (one-time partout en 2026, mensuel sur Core/Rapid uniquement) ===
      'Prix Core (mensuel)':      {'25k':'n/a','50k':'$77/mois (cheapest 50K du marché · LEGACY)','100k':'n/a','150k':'n/a'},
      'Prix Rapid (mensuel)':     {'25k':'~$67/mois','50k':'$129/mois','100k':'$229/mois','150k':'$329/mois'},
      'Prix Pro (mensuel)':       {'25k':'n/a','50k':'~$219-229/mois','100k':'~$329/mois','150k':'~$477/mois'},
      'Prix Flex (mensuel)':      {'25k':'$84/mois','50k':'$107/mois','100k':'n/a','150k':'n/a'},
      'Prix Builder':             {'25k':'n/a','50k':'Pricing non public — checkout direct','100k':'n/a','150k':'n/a'},
      'Frais activation':         {'25k':'$0 (waived firm-wide depuis juillet 2025)','50k':'$0','100k':'$0','150k':'$0'},
      'Reset cost':               {'25k':'~$87 (variable selon plan)','50k':'~$157 (Rapid)','100k':'~$267 (Rapid)','150k':'~$347 (Rapid)'},
      'Data fee (Pro classifié)': {'25k':'$0 retail · $130/mois si Professional trader','50k':'idem','100k':'idem','150k':'idem'},
      'Codes promo permanents':   {'25k':'SAVE40 (-40%) · IMAN (20% Rapid, 30% Pro, 50% Flex)','50k':'idem','100k':'idem','150k':'idem'},
      // === PAYOUTS (très variable par plan) ===
      'Répartition gains':        {'25k':'Rapid 90/10 (depuis 12 jan 2026) · Flex 80/20','50k':'Core 80/20 · Rapid 90/10 · Pro 80/20 · Flex 80/20 · Builder 80/20','100k':'Rapid 90/10 · Pro 80/20 · Scale 80/20','150k':'idem 100K'},
      'Payout minimum':           {'25k':'Rapid : $500 · Flex : $250','50k':'Core/Flex/Scale : $250 · Rapid : $500 · Pro : $1,000 · Builder : $500','100k':'Rapid : $500 · Pro : $1,000 · Scale : $250','150k':'idem 100K'},
      'Cadence payout':           {'25k':'Rapid : DAILY 24h après 1er trade · Flex : 5 winning days','50k':'Core : 5 winning days · Rapid : DAILY 24h · Pro : 14 jours calendaires · Builder : 48h · Flex : 5 winning days','100k':'Rapid : DAILY · Pro : 14 cal days · Scale : 5 winning days','150k':'idem 100K'},
      'Cap par cycle':            {'25k':'Rapid : aucun (post buffer) · Flex : 50% profits jusque $3K','50k':'Core : $1K (5 premiers cycles) · Rapid : aucun · Pro : aucun · Flex : 50% jusque $5K · Builder : $2K flat · Scale : $1.5K→$3.5K escalating','100k':'Rapid : aucun · Pro : aucun · Scale : $1.5K→$3.5K','150k':'idem 100K'},
      'Buffer payout (Rapid)':    {'25k':'$1,100 (= eval max-loss + $100)','50k':'$2,100','100k':'$3,100','150k':'$4,600'},
      'Buffer payout (Pro)':      {'25k':'n/a','50k':'$2,100 · 60% PRE-BUFFER carve-out (unique !)','100k':'$3,100 · 60% carve-out','150k':'$4,600 · 60% carve-out'},
      'Délai payout':             {'25k':'Rise instant - 12h manual review','50k':'idem','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'25k':'Rise (Riseworks) PRIMAIRE : bank transfer 1-3j ou crypto en minutes · Plaid/ACH (US only) · ⚠ Wise SUPPRIMÉ en 2026','50k':'idem','100k':'idem','150k':'idem'},
      'KYC':                      {'25k':'OBLIGATOIRE avant 1er payout (one-time, via Rise onboarding)','50k':'idem','100k':'idem','150k':'idem'},
      'Tax forms':                {'25k':'US : 1099 via Rise direct · Plaid path : 1099 mailé avant 17 fév','50k':'idem','100k':'idem','150k':'idem'},
      // === MULTI-COMPTES ===
      'Comptes funded simul.':    {'25k':'5 max si que 25K/50K · 3 si au moins un 100K/150K','50k':'5 max si que 25/50K · 3 si mix','100k':'3 max','150k':'3 max'},
      'Évaluations simul.':       {'25k':'10 max actives','50k':'10 max','100k':'10 max','150k':'10 max'},
    }
  },
  'Phidias Propfirm': {
    // VÉRIFIÉ MAI 2026 — 3 FAMILLES (Phidias 2.0) :
    //   • Static / Express to Live (E2L) — DD STATIQUE pur (jamais de trail), 25K uniquement, premier payout → direct LIVE
    //   • Fundamental — day trading, EOD trailing drawdown, 80→90% split après 3e payout
    //   • Premium / Swing — overnight + weekend AUTORISÉS (UNIQUE marché futures), profit split PROGRESSIF 75→100%
    //
    // Sources officielles : phidiaspropfirm.com (rules + accounts) + helpcenter.phidiaspropfirm.com
    // Sources tierces vérifiées : proptradingvibes (review), tradingtoolshub (pricing), nomadfuturestrader, saveonpropfirms
    // Trustpilot + LEI Register pour ID légale
    //
    // ⚠ ENTITÉ LÉGALE :
    //   HQ : GIBRALTAR — Eurotowers Suite 4.3.02 Block 4
    //   LEI : 2549002ZYS0FYA2RB617 · Registration: 12401448
    //   Pas France ni Italie · Fondateurs français mais aucune entité légale FR
    //
    // ⚠ ALERTE TRUSTPILOT 3.9/5 (mai 2026) — POLARISÉ :
    //   - 68% 5★ (payouts <24h confirmés)
    //   - 25% 1★ (jan-fév 2026 : payouts retardés, bans Discord, "CRITICAL DATA ERROR")
    //   - Cas notable : trader avec payout approuvé publiquement → banni avant paiement
    //
    // 🌟 KILLER FEATURES :
    //  - Premium/Swing : profit split PROGRESSIF 75 → 80 → 85 → 90 → 100% (payout 5+)
    //  - Premium : overnight + WEEKEND OK (unique sur le marché à ce prix)
    //  - Premium : cash funded en 1 jour de trading, payouts tous les 5 jours
    //  - Cash Account Reset Option (Premium seulement)
    //  - Static 25K : premier payout = direct LIVE (skip CASH stage)
    //
    // ⚡ CHANGEMENT MAJEUR 2026 :
    //  - Path to LIVE : NOUVELLE règle = $100,000 cumulative payouts (CASH) pour risk team review
    //  - Ancien : 3-payout cap → REMPLACÉ par seuil cumulatif $100K
    //  - Conversion plus tôt possible à discrétion du risk team
    plans: ['25k','50k','100k','150k'],
    rules: {
      // === ÉVALUATION (one-time) ===
      'Objectif de profit':       {'25k':'$1,500 (Static/E2L)','50k':'$3,000 (E2L) · $4,000 (Fundamental/Premium)','100k':'$6,000 (Fundamental/Premium)','150k':'$9,000 (Fundamental/Premium)'},
      'Drawdown Static (25K only)':{'25k':'$500 STATIQUE PUR (ne trail jamais)','50k':'n/a','100k':'n/a','150k':'n/a'},
      'Drawdown Fundamental/Swing (EOD)':{'25k':'n/a','50k':'$2,500 EOD trailing','100k':'$3,000 EOD','150k':'$4,500 EOD'},
      'Daily Loss Limit':         {'25k':'AUCUN — Phidias n\'a pas de DLL sur aucune famille','50k':'AUCUN','100k':'AUCUN','150k':'AUCUN'},
      'Mécanisme trailing':       {'25k':'Static : ne trail jamais (fixé à -$500)','50k':'EOD trailing : suit le highest EOD equity FOREVER · MLL ne locke JAMAIS','100k':'idem','150k':'idem'},
      'Jours de trading min':     {'25k':'1 jour (Static/E2L)','50k':'3 jours (Fundamental/Swing)','100k':'3 jours','150k':'3 jours'},
      'Profit min jour valide':   {'25k':'$0 (Static)','50k':'$0 en éval (Fundamental/Swing)','100k':'$0 en éval','150k':'$0 en éval'},
      // === CONSISTENCY (par phase) ===
      'Consistency (eval)':       {'25k':'AUCUNE','50k':'AUCUNE','100k':'AUCUNE','150k':'AUCUNE'},
      'Consistency (CASH funded)':{'25k':'EXEMPT (Static → direct LIVE)','50k':'30% max/jour · best day ≤ 30% profit total','100k':'30% max/jour','150k':'30% max/jour'},
      'Consistency (LIVE)':       {'25k':'AUCUNE','50k':'AUCUNE','100k':'AUCUNE','150k':'AUCUNE'},
      // === PATH TO LIVE (changement 2026) ===
      'Path to LIVE (Static)':    {'25k':'Premier payout = direct LIVE (skip CASH stage)','50k':'n/a','100k':'n/a','150k':'n/a'},
      'Path to LIVE (Fund/Premium)':{'25k':'n/a','50k':'🚨 NOUVELLE règle 2026 : $100,000 cumulative payouts (CASH) → review risk team (ancien : 3-payout cap)','100k':'$100K cumul','150k':'$100K cumul'},
      // === TRADING RESTRICTIONS ===
      'Positions overnight':      {'25k':'INTERDIT (Static/E2L flat 16h59)','50k':'INTERDIT (Fundamental) · ✅ AUTORISÉ (Premium/Swing)','100k':'INTERDIT Fundamental · ✅ AUTORISÉ Premium','150k':'INTERDIT Fundamental · ✅ AUTORISÉ Premium'},
      'Weekend trading':          {'25k':'INTERDIT (Static/E2L)','50k':'INTERDIT (Fundamental) · 🌟 AUTORISÉ (Premium/Swing) — UNIQUE marché futures','100k':'INTERDIT Fundamental · 🌟 AUTORISÉ Premium','150k':'INTERDIT Fundamental · 🌟 AUTORISÉ Premium'},
      'Trading des news (eval)':  {'25k':'AUTORISÉ sans restriction (NFP/FOMC/CPI/GDP/Powell)','50k':'AUTORISÉ','100k':'AUTORISÉ','150k':'AUTORISÉ'},
      'Trading des news (funded)':{'25k':'Funded CASH/LIVE : flat ±1 min Tier-1 (NFP/FOMC/CPI)','50k':'idem','100k':'idem','150k':'idem'},
      'DCA (renforcement)':       {'25k':'Autorisé partout','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'Robots / full auto':       {'25k':'INTERDIT full auto · Semi-auto OK avec monitoring','50k':'idem','100k':'idem','150k':'idem'},
      // === CONTRATS ===
      'Contrats max E2L (mini)':  {'25k':'2','50k':'5','100k':'7','150k':'9'},
      'Contrats max Fund/Premium (mini)':{'25k':'n/a','50k':'10','100k':'14','150k':'17'},
      'Contrats max (micro)':     {'25k':'20 (Static)','50k':'50 (E2L) / 100 (Fund/Swing)','100k':'70 / 140','150k':'90 / 170'},
      // === TARIFS (en USD) ===
      'Prix mensuel Fundamental': {'25k':'n/a','50k':'$116/mois','100k':'$144-164/mois (disputé entre sources)','150k':'$173/mois'},
      'Prix one-time E2L/Static': {'25k':'$277 (régulier) · $55.40 avec code -80%','50k':'n/a','100k':'n/a','150k':'n/a'},
      'Prix one-time Fundamental':{'25k':'n/a','50k':'$580','100k':'$723','150k':'$863'},
      'Prix one-time Swing/Premium':{'25k':'n/a','50k':'$723 (premium swing pricing tiers)','100k':'$900','150k':'$1,123'},
      'Frais activation':         {'25k':'$0 (inclus dans one-time)','50k':'$0','100k':'$0','150k':'$0'},
      'Reset cost':               {'25k':'Renouvellement (rebuy éval) · Premium a "Cash Account Reset" option','50k':'idem · Premium : Cash Reset Option','100k':'idem','150k':'idem'},
      'Codes promo permanents':   {'25k':'LASTCHANCE (-60% éval / -80% one-time) — codes circulants non vérifiés à 3 sources','50k':'idem','100k':'idem','150k':'idem'},
      // === PAYOUTS ===
      'Profit split E2L':         {'25k':'80% → 90% après 3e payout','50k':'n/a','100k':'n/a','150k':'n/a'},
      'Profit split Fundamental': {'25k':'n/a','50k':'80% → 90% après 3e payout','100k':'80% → 90%','150k':'80% → 90%'},
      'Profit split Premium':     {'25k':'n/a','50k':'🌟 PROGRESSIF : 75% (p1) → 80% (p2) → 85% (p3) → 90% (p4) → 100% (p5+)','100k':'🌟 75 → 80 → 85 → 90 → 100%','150k':'🌟 75 → 80 → 85 → 90 → 100%'},
      'Payout minimum':           {'25k':'$500','50k':'$500','100k':'$500','150k':'$500'},
      'Cycle payout':             {'25k':'Static : 48h post-éval → direct LIVE','50k':'Fundamental CASH : bi-weekly (1-14 et 15-fin mois) · Premium : tous les 5 jours · LIVE : quotidien possible','100k':'idem','150k':'idem'},
      'Délai payout':             {'25k':'Approval 1-4h same-day · Bank 3-5j · PayPal/Skrill 1-2j','50k':'idem','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'25k':'Wallet Phidias → Rise → bank / PayPal / Skrill','50k':'idem','100k':'idem','150k':'idem'},
      // === MULTI-COMPTES ===
      'Comptes simul.':           {'25k':'Jusqu\'à 15 funded total (E2L + Fundamental + Premium combinés)','50k':'15 funded · 5 max E2L (CASH + LIVE confondus)','100k':'15 funded','150k':'15 funded'},
    }
  },
  'Funded Futures Network': {
    // VÉRIFIÉ MAI 2026 — Abonnement MENSUEL récurrent.
    // 2 PACINGS au checkout (BINAIRE) :
    //   • Standard : 15 jours min · 40% consistency · plus permissif
    //   • Express  : 7 jours min · 15% consistency (BRUTAL) · "rapide" sur le papier
    //
    // 3 PHASES :
    //   1. Évaluation (Standard ou Express) — abonnement mensuel
    //   2. Exhibition (sim funded, payouts <$10K tous les 3 jours, profit split 80/20)
    //   3. Live Funded Pro (capital réel, daily payouts, 90/10 après $5K cumulatifs)
    //
    // Sources officielles : fundedfuturesnetwork.com + fundedfuturesnetwork.zendesk.com
    // Sources tierces vérifiées : proptradingvibes, damnpropfirms, funded.now, quantvps
    // Fondé Kevin Swart + Jay (2022). New York USA.
    //
    // ⚠ "EXPRESS PARADOX" : 7j > 15j sur le papier, mais 15% consistency cap rend
    //    MATHÉMATIQUEMENT PLUS DIFFICILE de passer (best day plafonné à $450 sur 50K)
    //    L'excès NE TUE PAS le compte mais ajoute au profit target (snowball)
    //
    // ⚠ COÛTS ONGOING UNE FOIS FUNDED :
    //  - $126/mois data fee — INDÉFINI tant que tu trades
    //  - À intégrer au ROI (un trader profitable ~$200/mois nette après data fee)
    //
    // 🚀 PAYOUT KILLER : Live Funded = daily same-day, PayPal 10-15 minutes
    plans: ['25k','50k','100k','150k','250k'],
    rules: {
      // === ÉVALUATION (Standard ou Express, abonnement mensuel récurrent) ===
      'Objectif de profit':       {'25k':'$1,500 (6%)','50k':'$3,000 (6%)','100k':'$6,000 (6%)','150k':'$9,000 (6%)','250k':'$15,000 (6%)'},
      'Drawdown trailing max (eval)':{'25k':'$1,500 EOD (no lock en éval)','50k':'$2,000 EOD','100k':'$3,600 EOD','150k':'~$4,500 EOD','250k':'$6,000 EOD'},
      'Drawdown post-Exhibition': {'25k':'STATIC (ne trail plus) une fois passé en Funded','50k':'STATIC en Funded','100k':'STATIC en Funded','150k':'STATIC en Funded','250k':'STATIC en Funded'},
      'Daily Loss Limit':         {'25k':'AUCUN (FFN n\'a pas de DLL)','50k':'AUCUN','100k':'AUCUN','150k':'AUCUN','250k':'AUCUN'},
      'Jours min Standard (eval)':{'25k':'15 jours minimum','50k':'15','100k':'15','150k':'15','250k':'15'},
      'Jours min Express (eval)': {'25k':'7 jours minimum (4 jours réalisables)','50k':'7','100k':'7','150k':'7','250k':'7'},
      'Profit min jour valide':   {'25k':'AUCUN — FFN n\'impose pas de seuil journalier','50k':'AUCUN','100k':'AUCUN','150k':'AUCUN','250k':'AUCUN'},
      'Consistency Standard (eval)':{'25k':'40% du target — best day max · excès NE TUE PAS, ajoute au target','50k':'40%','100k':'40%','150k':'40%','250k':'40%'},
      'Consistency Express (eval)':{'25k':'15% du target (BRUTAL) — best day plafonné à 15% · excès = snowball target','50k':'15% (best day max $450 sur 50K)','100k':'15%','150k':'15%','250k':'15%'},
      'Limite de temps Eval':     {'25k':'Aucune (sub mensuel récurrent tant que tu paies)','50k':'Aucune','100k':'Aucune','150k':'Aucune','250k':'Aucune'},
      // === EXHIBITION & LIVE FUNDED PRO ===
      'Consistency funded':       {'25k':'Appliquée seulement les 3 PREMIERS payouts puis SUPPRIMÉE','50k':'3 premiers payouts','100k':'3 premiers payouts','150k':'3 premiers payouts','250k':'3 premiers payouts'},
      'Transition Sim → Live':    {'25k':'$5,000 payouts cumulés sur Sim Funded Pro → upgrade Live (split 80→90)','50k':'$5K cumul','100k':'$5K cumul','150k':'$5K cumul','250k':'$5K cumul'},
      // === TRADING RESTRICTIONS ===
      'Positions overnight':      {'25k':'INTERDIT (auto-flat 16:50 EST)','50k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT','250k':'INTERDIT'},
      'Weekend trading':          {'25k':'INTERDIT','50k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT','250k':'INTERDIT'},
      'Trading des news (eval)':  {'25k':'AUTORISÉ sans restriction','50k':'AUTORISÉ','100k':'AUTORISÉ','150k':'AUTORISÉ','250k':'AUTORISÉ'},
      'Trading des news (Exhibition/Live)':{'25k':'FLAT 1 min avant + après Tier-1 (FOMC/NFP/CPI/Fed speeches)','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      'DCA (renforcement)':       {'25k':'Pas de restriction explicite (autorisé en pratique)','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      // === CONTRATS (scaling) ===
      'Contrats max (mini)':      {'25k':'3 → 4-5 (scaling profit-based)','50k':'4 → 15 (scaling)','100k':'5 → 18 (scaling)','150k':'~6 → 19','250k':'6 → 20 (scaling)'},
      'Contrats max (micro)':     {'25k':'30 (10× mini)','50k':'40 → 150 (scaling)','100k':'50 → 180','150k':'~60 → 190','250k':'60 → 200'},
      // === TARIFS (mensuel récurrent, codes promo VIBES -50%) ===
      'Prix mensuel Standard':    {'25k':'~$99','50k':'$150 list (avec discount ~$75)','100k':'~$200 list','150k':'~$275 list','250k':'~$300 list'},
      'Prix mensuel Express':     {'25k':'~$155','50k':'~$175','100k':'(non détaillé)','150k':'(non détaillé)','250k':'(non détaillé)'},
      'Frais activation Exhibition':{'25k':'$120 one-time (payé après éval, avant Exhibition)','50k':'$120','100k':'$120','150k':'$120','250k':'$120'},
      'Reset cost':               {'25k':'$100 (pas de free reset)','50k':'$100','100k':'$100','150k':'$100','250k':'$100'},
      'Data fee funded ongoing':  {'25k':'$126/mois (INDÉFINI tant que funded — à intégrer au ROI)','50k':'$126/mois','100k':'$126/mois','150k':'$126/mois','250k':'$126/mois'},
      'Codes promo permanents':   {'25k':'VIBES (~50%)','50k':'VIBES','100k':'VIBES','150k':'VIBES','250k':'VIBES'},
      // === PAYOUTS ===
      'Répartition gains':        {'25k':'Exhibition (Sim Funded Pro) : 80/20 → Live Funded Pro : 90/10 après $5,000 cumulés','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      'Payout minimum':           {'25k':'$1,000','50k':'$1,000','100k':'$1,000','150k':'$1,000','250k':'$1,000'},
      'Cadence payout (Sim)':     {'25k':'Jusqu\'à $10K tous les 3 jours (Sim Funded Pro)','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      'Cadence payout (Live)':    {'25k':'🚀 DAILY same-day (PayPal 10-15 min) — le plus rapide du marché','50k':'🚀 DAILY same-day','100k':'🚀 DAILY same-day','150k':'🚀 DAILY same-day','250k':'🚀 DAILY same-day'},
      'Méthodes payout':          {'25k':'Wire/ACH ($10-30 fee) · PayPal (frais PayPal, instantané)','50k':'idem','100k':'idem','150k':'idem','250k':'idem'},
      // === MULTI-COMPTES ===
      'Comptes simul.':           {'25k':'10 max (copy trading limité à 5)','50k':'10 max','100k':'10 max','150k':'10 max','250k':'10 max'},
    }
  },
  'FuturesELites': {
    // ⚠ NOM CONSERVÉ pour compat — nom officiel = "FuturesElite" (singulier, futureselite.com)
    //    L'UI affiche "FuturesElite" · la clé interne reste 'FuturesELites'
    //
    // VÉRIFIÉ MAI 2026 — 3 FAMILLES :
    //   • Starter (mensuel, le moins cher, DLL activée)
    //   • Pro (mensuel ++, PAS de DLL → différenciateur clé)
    //   • Instant Funded (one-time, skip eval, 25% consistency)
    //
    // Sources officielles : futureselite.com (evaluation-account + accounts)
    // Sources tierces vérifiées : proptradingvibes (review), propfirmplus, propscorer, damnpropfirms, toppropoffers
    // Trustpilot 4.7/5 (mai 2026, ~13 pages reviews)
    //
    // ENTITÉ LÉGALE :
    //   Parent : Quantum SRL (Italie, Latina/Lazio)
    //   CEO Christian Habibi · COO Artur S. Deshko
    //   HQ : Corso G. Matteotti 61, Latina 04100, Italie
    //   UK Ltd #16864791 NON CONFIRMÉ à 3 sources
    //
    // 🌟 KILLER FEATURE : profit split SCALING 80% → 90% → 100% sur sustained performance
    //    (avec Apex et Phidias Premium, seules firmes à atteindre 100% split sur futures)
    //
    // ⚠ FIRME JEUNE (UK Ltd 2025) — track record limité
    // ⚠ 2 comptes max simultanés sous 1 login (fair-play rule très restrictive)
    plans: ['50k','100k','150k'],
    rules: {
      // === ÉVALUATION (Starter/Pro mensuel, Instant one-time) ===
      'Objectif de profit':       {'50k':'Starter ~$3,000 · Pro ~$4,000 · Instant : 5% buffer (décompo Starter vs Pro non publique)','100k':'~$6,000 / ~$7,500','150k':'~$9,000 / ~$11,000'},
      'Drawdown trailing max':    {'50k':'$2,000 EOD (Starter/Pro) · Instant : 5% current balance (trailing dynamique)','100k':'$3,000 EOD','150k':'$5,000 EOD'},
      'Mécanisme trailing':       {'50k':'EOD trailing · LOCK à starting balance APRÈS 1er payout (différenciateur)','100k':'idem','150k':'idem'},
      'DLL Starter':              {'50k':'$1,100 (2.2%)','100k':'$2,000 (2%)','150k':'$3,000 (2%)'},
      'DLL Pro':                  {'50k':'AUCUN (différenciateur clé Pro)','100k':'AUCUN','150k':'AUCUN'},
      'DLL Instant':              {'50k':'Non documenté précisément','100k':'idem','150k':'idem'},
      'Jours de trading min':     {'50k':'≥5 profitable days en ≥14 calendar (Starter/Pro) · 7 sur 14 (Instant)','100k':'idem','150k':'idem'},
      'Profit min jour valide':   {'50k':'Non documenté précisément à 3 sources','100k':'idem','150k':'idem'},
      'Consistency Starter/Pro':  {'50k':'40% — best day ≤ 40% du profit total','100k':'40%','150k':'40%'},
      'Consistency Instant':      {'50k':'25% (review PTV) · 20% (FAQ officielle disputée)','100k':'25% / 20% DISPUTÉ','150k':'25% / 20% DISPUTÉ'},
      // === TRADING RESTRICTIONS ===
      'Positions overnight':      {'50k':'Exchange hours seulement (modèle EOD, flat à la close)','100k':'idem','150k':'idem'},
      'Trading des news':         {'50k':'Tier-1 windows ENFORCÉES (must be flat into release + wait post-print) · add-on PAYANT pour unlock','100k':'idem','150k':'idem'},
      'Scalping':                 {'50k':'Autorisé MAIS très short holds peuvent être EXCLUS du payout · "Scalp Mode" add-on dispo','100k':'idem','150k':'idem'},
      'DCA / Grid':               {'50k':'Autorisé sous policy actuelle','100k':'Autorisé','150k':'Autorisé'},
      'Hedging cross-comptes':    {'50k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT'},
      // === CONTRATS ===
      'Contrats max (mini)':      {'50k':'4 (Starter) / 5 (Pro) / 5 (Instant)','100k':'7 / 10 / 10','150k':'10 / 15 / —'},
      'Instruments autorisés':    {'50k':'ES, NQ, YM, RTY + micros MES/MNQ/M2K/MYM','100k':'idem','150k':'idem'},
      // === TARIFS (BLACK40 = -40% permanent confirmé) ===
      'Prix Starter (list)':      {'50k':'~$82.50 list','100k':'~$165 list','150k':'~$249 list'},
      'Prix Starter (BLACK40)':   {'50k':'$49.50 (-40%)','100k':'$99.50','150k':'$149.50'},
      'Prix Pro (list)':          {'50k':'~$157.50 list','100k':'~$290 list','150k':'~$357.50 list'},
      'Prix Pro (BLACK40)':       {'50k':'$94.50','100k':'$174 (estimation -40%)','150k':'$214.50'},
      'Prix Instant Funded':      {'50k':'$499 list → $299.40 (BLACK40 -40%)','100k':'$699 → $419.40','150k':'non documenté à 3 sources'},
      'Reset cost':               {'50k':'$49 (low tier)','100k':'~$129 (mid)','150k':'$239 (high tier)'},
      'Frais activation':         {'50k':'Non publié explicitement','100k':'idem','150k':'idem'},
      'Codes promo permanents':   {'50k':'BLACK40 (-40% lifetime) · TOPPROP (-40%)','100k':'idem','150k':'idem'},
      // === PAYOUTS ===
      'Répartition gains':        {'50k':'🌟 80% → 90% → 100% scaling sur sustained performance (UNIQUE avec Apex/Phidias Premium)','100k':'idem','150k':'idem'},
      'Payout minimum':           {'50k':'Pas de floor publié (industrie : $500+)','100k':'idem','150k':'idem'},
      'Cadence payout':           {'50k':'Bi-weekly · processing 24-72h post-approval','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'50k':'Bank (SEPA/SWIFT) 2-4j · 🌟 Crypto USDT/USDC via Rise (same-day)','100k':'idem','150k':'idem'},
      // === MULTI-COMPTES ===
      'Comptes simul.':           {'50k':'⚠ 2 max sous 1 login (fair-play rule très restrictive)','100k':'2 max','150k':'2 max'},
    }
  },
  'Alpha Futures': {
    // VÉRIFIÉ MAI 2026 — Sources : help.alpha-futures.com (docs officielles) + screenshots compte trader
    //
    // INFRASTRUCTURE :
    //   • Clearing house : Volumetrica Trading
    //   • Data feed      : dXFeed (Devexperts — PAS DXtrade le trading platform)
    //   • Plateformes UI au choix (login credentials Tradovate/NinjaTrader partagés) :
    //       - WealthCharts (web)
    //       - Deepchart by Volumetrica Trading (web + desktop, OrderFlow inclus)
    //       - Quantower (desktop, dXFeed)
    //       - Tradovate (web)
    //       - NinjaTrader (desktop)
    //       - TradingView (via add-on Tradovate)
    //   • IMPORTANT : choix de plateforme NON interchangeable après achat
    //   • Sync Quantara : pas d'import auto pour l'instant — saisie manuelle uniquement
    //     (futur : possible via export CSV Tradovate/NinjaTrader, à coder)
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
      // Profit Target (Eval) — par plan, par taille
      'Objectif de profit':       {'25k':'Zero: $1,500 (Premium/Advanced non dispo)','50k':'Premium: $3,000 · Zero: $3,000 · Advanced: $4,000','100k':'Premium: $6,000 · Zero: $6,000 · Advanced: $8,000','150k':'Premium: $9,000 · Advanced: $12,000 (Zero non dispo)'},
      // MLL — Maximum Loss Limit (EOD trailing, lock starting)
      'MLL (Maximum Loss Limit)': {'25k':'Zero: $1,000 (EOD trailing, lock starting balance)','50k':'Premium: $2,000 · Zero: $2,000 · Advanced: $1,750 (3.5%)','100k':'Premium: $3,000 · Zero: $3,000 · Advanced: $3,500','150k':'Premium: $4,500 · Advanced: $5,250 (Zero non dispo)'},
      // Daily Loss Guard (DLG) — seulement Zero
      'Daily Loss Guard':         {'25k':'Zero: $500 (Premium/Advanced non dispo en 25K)','50k':'Premium: AUCUN · Zero: $1,000 · Advanced: AUCUN','100k':'Premium: AUCUN · Zero: $2,000 · Advanced: AUCUN','150k':'Premium: AUCUN · Advanced: AUCUN (Zero non dispo)'},
      // Min trading days
      'Min jours trading (Eval)': {'25k':'Zero: 1 jour (one-day pass possible)','50k':'Premium: 2 · Zero: 1 · Advanced: 2','100k':'Premium: 2 · Zero: 1 · Advanced: 2','150k':'Premium: 2 · Advanced: 2 (Zero non dispo)'},
      'Min jours trading (Qual)': {'25k':'Zero: 5','50k':'Premium: 5 · Zero: 5 · Advanced: 5','100k':'Premium: 5 · Zero: 5 · Advanced: 5','150k':'Premium: 5 · Advanced: 5 (Zero non dispo)'},
      // Consistency rule
      'Consistency (Eval)':       {'25k':'Zero: AUCUNE','50k':'Premium: 50% · Zero: AUCUNE · Advanced: 50%','100k':'Premium: 50% · Zero: AUCUNE · Advanced: 50%','150k':'Premium: 50% · Advanced: 50% (Zero non dispo)'},
      'Consistency (Qualified)':  {'25k':'Zero: 40% (rare en Qualified !)','50k':'Premium: AUCUNE · Zero: 40% · Advanced: AUCUNE','100k':'Premium: AUCUNE · Zero: 40% · Advanced: AUCUNE','150k':'Premium: AUCUNE · Advanced: AUCUNE (Zero non dispo)'},
      // Profit split (Qualified) — 90% pour tous, immédiat
      'Profit Split (Qualified)': {'25k':'Zero: 90% (immédiat dès 1er payout)','50k':'Premium: 90% · Zero: 90% · Advanced: 90% (immédiat, pas tiered)','100k':'Premium: 90% · Zero: 90% · Advanced: 90%','150k':'Premium: 90% · Advanced: 90% (Zero non dispo)'},
      // Position sizing
      'Contrats max (mini)':      {'25k':'Zero: 1 (Premium/Advanced non dispo en 25K)','50k':'Premium: 4 · Zero: 3 · Advanced: 5','100k':'Premium: 8 · Zero: 6 · Advanced: 10','150k':'Premium: 12 · Advanced: 15 (Zero non dispo)'},
      'Contrats max (micro)':     {'25k':'Zero: 10 (Premium/Advanced non dispo en 25K)','50k':'Premium: 40 · Zero: 30 · Advanced: 50','100k':'Premium: 80 · Zero: 60 · Advanced: 100','150k':'Premium: 120 · Advanced: 150 (Zero non dispo)'},
      'Scaling plan':             {'25k':'Zero: pas de scaling (taille max dès jour 1)','50k':'Premium: pas de scaling · Zero: pas de scaling · Advanced: PAS DE SCALING (taille max dès jour 1)','100k':'Premium: pas de scaling · Zero: pas de scaling · Advanced: pas de scaling','150k':'Premium: pas de scaling · Advanced: pas de scaling (Zero non dispo)'},
      // Pricing — par plan
      'Prix mensuel Premium':     {'25k':'— (Premium non dispo en 25K)','50k':'$79/mo (+$149 activation) OU $159/mo (0 activation)','100k':'$159/mo (+$149 activation) OU $269/mo (0 activation)','150k':'$239/mo (+$149 activation) OU $379/mo (0 activation)'},
      'Prix mensuel Zero':        {'25k':'$79/mo · 0 activation permanent','50k':'$119/mo · 0 activation permanent','100k':'$239/mo · 0 activation permanent','150k':'— (Zero non dispo en 150K)'},
      'Prix mensuel Advanced':    {'25k':'— (Advanced non dispo en 25K)','50k':'$139/mo + $149 activation','100k':'$279/mo + $149 activation','150k':'$419/mo + $149 activation'},
      'Activation fee':           {'25k':'Zero: $0 (Premium/Advanced non dispo)','50k':'Premium path1: $149 · Premium path2: $0 · Zero: $0 · Advanced: $149','100k':'Premium path1: $149 · Premium path2: $0 · Zero: $0 · Advanced: $149','150k':'Premium path1: $149 · Premium path2: $0 · Advanced: $149 (Zero non dispo)'},
      // Reset costs (Eval phase)
      'Reset Eval':               {'25k':'Zero: $69 (Premium/Advanced non dispo)','50k':'Premium: $69 (path1) ou $149 (path2) · Zero: $109 · Advanced: $139','100k':'Premium: $139 (path1) ou $239 (path2) · Zero: $219 · Advanced: $279','150k':'Premium: $219 (path1) ou $329 (path2) · Advanced: $419 (Zero non dispo)'},
      // Trading rules — globalement identiques pour tous, on répète l'info
      'Hold Through News':        {'25k':'✅ YES (Zero: avec restrictions en Qualified)','50k':'✅ YES (Premium/Advanced: sans restriction · Zero: avec restrictions en Qualified)','100k':'✅ YES (Premium/Advanced: sans restriction · Zero: avec restrictions en Qualified)','150k':'✅ YES (Premium/Advanced: sans restriction · Zero non dispo)'},
      'Positions overnight':      {'25k':'✅ AUTORISÉ (overnight + weekend) — rare sur le marché','50k':'✅ AUTORISÉ (overnight + weekend) — rare sur le marché','100k':'✅ AUTORISÉ (overnight + weekend) — rare sur le marché','150k':'✅ AUTORISÉ (overnight + weekend) — rare sur le marché'},
      'Trading des news':         {'25k':'Zero: restrictions Qualified uniquement','50k':'Premium: aucune restriction · Zero: restrictions Qualified uniquement · Advanced: aucune restriction','100k':'Premium: aucune restriction · Zero: restrictions Qualified uniquement · Advanced: aucune restriction','150k':'Premium: aucune restriction · Advanced: aucune restriction (Zero non dispo)'},
      'Algos / automation':       {'25k':'EAs limités — voir Prohibited Trading Practices','50k':'EAs limités — voir Prohibited Trading Practices','100k':'EAs limités — voir Prohibited Trading Practices','150k':'EAs limités — voir Prohibited Trading Practices'},
      'Copy trading':             {'25k':'Voir doc Copy Trading officielle (help.alpha-futures.com)','50k':'Voir doc Copy Trading officielle (help.alpha-futures.com)','100k':'Voir doc Copy Trading officielle (help.alpha-futures.com)','150k':'Voir doc Copy Trading officielle (help.alpha-futures.com)'},
      // Payouts (Qualified)
      'Payout — Premium':         {'25k':'— (Premium non dispo en 25K)','50k':'50% des profits par cycle après 5 winning days ≥ $200','100k':'50% des profits par cycle après 5 winning days ≥ $200','150k':'50% des profits par cycle après 5 winning days ≥ $200'},
      'Payout — Zero':            {'25k':'Zero: 5 winning days ≥ $200 · cap 50% profits · max $1K/cycle','50k':'Zero: 5 winning days ≥ $200 · cap 50% profits · max $2K/cycle','100k':'Zero: 5 winning days ≥ $200 · cap 50% profits · max $2.5K/cycle','150k':'— (Zero non dispo en 150K)'},
      'Payout — Advanced':        {'25k':'— (Advanced non dispo en 25K)','50k':'Max $15,000 par request · jusqu\'à 4 monthly withdrawals · flexible','100k':'Max $15,000 par request · jusqu\'à 4 monthly withdrawals · flexible','150k':'Max $15,000 par request · jusqu\'à 4 monthly withdrawals · flexible'},
      'Méthodes payout':          {'25k':'ACH (US), Wise, Wire SWIFT, Rise (international)','50k':'ACH (US), Wise, Wire SWIFT, Rise (international)','100k':'ACH (US), Wise, Wire SWIFT, Rise (international)','150k':'ACH (US), Wise, Wire SWIFT, Rise (international)'},
      // Comptes simul.
      'Max comptes simultanés':   {'25k':'Voir doc "Maximum Allocation" sur help.alpha-futures.com','50k':'Voir doc "Maximum Allocation" sur help.alpha-futures.com','100k':'Voir doc "Maximum Allocation" sur help.alpha-futures.com','150k':'Voir doc "Maximum Allocation" sur help.alpha-futures.com'},
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
// ── Runtime overlay for admin-managed custom futures firms ──
// PROPFIRM_RULES stays pure (the public SSG pages read it directly). Custom firms
// live in a SEPARATE registry that only the helpers below consult via firmRules(),
// and only the in-app client ever populates it (registerCustomFuturesFirms) — so the
// SSG build output is unchanged. Each entry: { name, plans:[...], rules:{key:{plan:val}} }.
const CUSTOM_FIRMS = {}
export const CUSTOM_FIRM_NAMES = []
export function registerCustomFuturesFirms(entries) {
  for (const e of entries || []) {
    if (!e || !e.name) continue
    CUSTOM_FIRMS[e.name] = { plans: (e.plans && e.plans.length) ? e.plans : GENERIC_PLANS, rules: e.rules || {} }
    if (!CUSTOM_FIRM_NAMES.includes(e.name)) CUSTOM_FIRM_NAMES.push(e.name)
  }
}
// Firm rules accessor used by the prefill helpers: custom overlay first, then catalog.
export function firmRules(firmName) {
  return CUSTOM_FIRMS[firmName] || PROPFIRM_RULES[firmName]
}

export function plansForFirm(firmName){
  return firmRules(firmName)?.plans || GENERIC_PLANS
}

// Retourne le drawdown max (en $ numérique) pour une firme + plan.
// Cherche dans PROPFIRM_RULES :
//   - "Drawdown total/trailing max" (formulation standard)
//   - "Max Loss Limit (MLL)" — Topstep
//   - "Maximum Loss Limit" — variantes
// Ne match PAS les clés mécaniques/contextuelles (ex: "MLL mécanique XFA") pour éviter de
// capter une description plutôt qu'un montant.
export function maxDrawdown(firmName, plan){
  const rules = firmRules(firmName)?.rules
  if(!rules || !plan) return null
  const ddKey = Object.keys(rules).find(k => {
    if (/drawdown\s+(total|trailing)/i.test(k)) return true
    // Topstep-style : "Max Loss Limit (MLL)" mais PAS "MLL mécanique XFA" ni "DLL"
    if (/^(max(imum)?\s+loss\s+limit|mll)\b/i.test(k) && !/m[ée]canique|xfa|live|lfa/i.test(k)) return true
    return false
  })
  if(!ddKey) return null
  const ddStr = rules[ddKey][plan]
  if(!ddStr) return null
  const m = String(ddStr).match(/[\d,]+/)
  return m ? parseInt(m[0].replace(/,/g,''),10) : null
}

// Indique si la firme utilise un drawdown trailing (selon PROPFIRM_RULES)
export function isTrailingDD(firmName){
  const rules = firmRules(firmName)?.rules
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
  const rules = firmRules(firmName)?.rules
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
  const rules = firmRules(firmName)?.rules
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
  const rules = firmRules(firmName)?.rules
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
  const rules = firmRules(firmName)?.rules
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
  const rules = firmRules(firmName)?.rules
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
