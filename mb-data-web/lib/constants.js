// PropFirm rules data — vérifiées 2024/2025 (toujours vérifier sur le site officiel)
// La plupart des firmes utilisent un drawdown TRAILING avec lock au solde initial — mais pas toutes
// (Phidias Static, MFFU Flex/Builder statique, FFN statique une fois financé) : voir le détail par firme.
import { extractModelSegment, hasExplicitProgramSegments } from './programSegment'

// Lit une cellule de règle en tenant compte du PROGRAMME choisi.
// Sans programme, la cellule est rendue telle quelle et l'appelant retombe sur
// son ancien comportement (« prends le premier nombre »), qui décrit le
// programme principal de la firme.
//
// ⚠️ Un programme demandé mais ABSENT de la cellule rend null, jamais la valeur
// globale : afficher le drawdown d'Apex 4.0 à quelqu'un qui tient un compte
// legacy serait une jauge de risque fausse de 25 à 50 %, silencieusement.
function cellFor(raw, program) {
  if (raw == null) return null
  if (!program) return raw
  return extractModelSegment(raw, program)
}

// « idem » veut dire « même règle que la taille INFÉRIEURE la plus proche ».
// La sentinelle peut porter un emoji de tête (« 🌟 idem (ex: 50K → $50,100) »).
// Ce n'est jamais une valeur affichable.
function isIdem(v) {
  return typeof v === 'string' && /^idem\b/i.test(v.trim().replace(/^[^a-zà-ÿ0-9]+/i, ''))
}

// Lit rules[key][plan] en résolvant « idem ».
//
// ⚠️ C'est ce qui manquait aux helpers de ce fichier : futuresComparison.js
// résolvait déjà la sentinelle de son côté, pas eux. Résultat, 26 couples
// (firme, taille) sur 52 rendaient un profit split nul — et le calcul de payout
// retombait alors sur 90 % par défaut. Sur un compte Take Profit Trader à 80 %,
// le net affiché était donc 10 points trop haut, sur un vrai montant d'argent.
function readRule(rules, key, plan) {
  const row = rules?.[key]
  if (!row) return null
  let v = row[plan]
  if (v === undefined) return null
  if (!isIdem(v)) return v
  const smaller = Object.keys(row)
    .filter(p => planSizeNum(p) < planSizeNum(plan))
    .sort((a, b) => planSizeNum(b) - planSizeNum(a))
  for (const p of smaller) {
    const candidate = row[p]
    if (candidate !== undefined && !isIdem(candidate)) return candidate
  }
  return null
}

// Premier entier d'une chaîne (« EOD/Intraday : $2,000 · Legacy : $2,500 » → 2000).
//
// ⚠️ Un montant PRÉFIXÉ PAR $ l'emporte toujours. Sans cette priorité, le nom du
// programme « E2L » (Phidias) livrait un objectif de 2 $ : le chiffre collé à une
// lettre était pris pour un montant. Et en repli, on refuse tout nombre accolé à
// une lettre, pour la même raison.
function firstInt(str) {
  const text = String(str ?? '')
  const money = text.match(/\$\s*([\d,]+)/)
  const raw = money ? money[1] : (text.match(/(?<![A-Za-zÀ-ÿ])[\d,]*\d/) || [])[0]
  if (raw === undefined) return null
  const n = parseInt(String(raw).replace(/,/g, ''), 10)
  return Number.isFinite(n) ? n : null
}

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
    //  - 🚨 DRAWDOWNS REVUS : 4.0 utilise des milliers ronds ($1,000 / $2,000 /
    //       $3,000 / $4,000). L'ancienne échelle ($1,500 / $2,500 / $2,750 /
    //       $3,000 / $5,000 / $6,500 / $7,500) reste celle des comptes LEGACY,
    //       qui continuent de tourner sous leurs règles d'origine.
    //
    // ✅ CONFIRMÉ À LA SOURCE (août 2026) — apextraderfunding.com/help-center,
    //    article « EOD Evaluations », tableau « Account Parameters ». Le site
    //    bloque la récupération automatique (Cloudflare) ; les valeurs ont été
    //    relues sur des captures de la page. Objectifs, drawdowns EOD, DLL,
    //    contrats max et durée de 30 jours correspondent tous au catalogue.
    //
    // ⚠️ TROIS PROGRAMMES COEXISTENT, ET LEURS CHIFFRES DIFFÈRENT.
    //    C'est pour ça que l'utilisateur choisit son programme à la création du
    //    compte : sans ce choix, on afficherait le drawdown 4.0 à quelqu'un qui
    //    tient un compte legacy, soit une jauge de risque fausse de 25 à 50 %.
    //      EOD       — 4.0, DLL activée, trailing recalculé à 16h59 ET
    //      Intraday  — 4.0, pas de DLL, trailing tick-by-tick, moins cher
    //      Legacy    — acheté avant mars 2026, ancienne échelle de drawdown ;
    //                  seul programme à exister en 75K, 250K et 300K
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
      'Objectif de profit':       {'25k':'EOD/Intraday/Legacy : $1,500 (6%)','50k':'EOD/Intraday/Legacy : $3,000 (6%)','75k':'Legacy : $4,500 (6%)','100k':'EOD/Intraday/Legacy : $6,000 (6%)','150k':'EOD/Intraday/Legacy : $9,000 (6%)','250k':'Legacy : $15,000','300k':'Legacy : $20,000'},
      'Drawdown trailing max':    {'25k':'EOD/Intraday : $1,000 · Legacy : $1,500','50k':'EOD/Intraday : $2,000 · Legacy : $2,500','75k':'Legacy : $2,750','100k':'EOD/Intraday : $3,000 · Legacy : $3,000','150k':'EOD/Intraday : $4,000 · Legacy : $5,000','250k':'Legacy : $6,500','300k':'Legacy : $7,500'},
      'Mécanisme trailing':       {'25k':'Seuil EOD recalculé une fois par jour à 16h59m59 ET sur le solde de clôture, appliqué EN TEMPS RÉEL la session suivante, ne redescend jamais · journée remise à zéro à 18h00 ET','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      // ⚠️ TROIS COMPORTEMENTS D'ARRÊT, ET LE TROISIÈME EST UN PIÈGE.
      //    Sur une évaluation TRADOVATE le drawdown ne se verrouille JAMAIS : il
      //    suit le plus haut solde de clôture indéfiniment. Deux traders avec le
      //    même compte 50K n'ont donc pas la même marge selon leur plateforme.
      // Legacy compte une sous-famille STATIC : le drawdown ne bouge JAMAIS, au prix
      // d'un montant bien plus serré et de deux minis seulement.
      'Legacy STATIC':            {'25k':'n/a','50k':'n/a','75k':'n/a','100k':'100K Static : drawdown FIXE de $625 (plancher $99,375) · 2 minis','150k':'n/a','250k':'n/a','300k':'n/a'},
      // Un compte financé se ferme tout seul s'il dort : il faut deux journées à
      // +$50 net minimum sur 30 jours calendaires glissants.
      'Règle d\'inactivité (PA)':  {'25k':'2 journées à +$50 net minimum par 30 jours calendaires, sinon fermeture','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      'Arrêt du trailing':        {'25k':'PA : bloque à $25,100 (solde initial + $100) · Éval Rithmic/WealthCharts : bloque à $26,500 (= solde + objectif) · Éval TRADOVATE : ne bloque JAMAIS','50k':'PA : $50,100 · Éval Rithmic/WealthCharts : $53,000 · Éval Tradovate : jamais','75k':'Legacy','100k':'PA : $100,100 · Éval Rithmic/WealthCharts : $106,000 · Éval Tradovate : jamais','150k':'PA : $150,100 · Éval Rithmic/WealthCharts : $159,000 · Éval Tradovate : jamais','250k':'Legacy','300k':'Legacy'},
      // ⚠ Legacy n'a AUCUNE perte journalière — « There is no daily maximum drawdown
      //   limit » (doc Legacy officielle). Les ~$1,250 / ~$2,500 / ~$3,000 stockés
      //   pour les tailles legacy étaient des estimations inventées.
      'Daily Loss Limit (EOD)':   {'25k':'EOD : $500 (pause de session, pas un échec) · Legacy : aucune','50k':'EOD : $1,000 · Legacy : aucune','75k':'Legacy : aucune','100k':'EOD : $1,500 · Legacy : aucune','150k':'EOD : $2,000 · Legacy : aucune','250k':'Legacy : aucune','300k':'Legacy : aucune'},
      // L'ÉVALUATION intraday n'a pas de DLL, mais le compte FINANCÉ en a une,
      // par palier (« DLL Tier Based : Yes » sur le tableau PA officiel).
      // Deux clés distinctes : l'ÉVALUATION intraday n'a pas de DLL, le compte
      // FINANCÉ en a une par palier. Les mettre dans une seule cellule étiquetée
      // « Éval : … · PA : … » ne marchait pas — le comparateur découpe par
      // PROGRAMME, pas par phase, et affichait donc la chaîne entière.
      'Daily Loss Limit (Intraday)':{'25k':'AUCUNE en évaluation','50k':'AUCUNE en évaluation','75k':'AUCUNE en évaluation','100k':'AUCUNE en évaluation','150k':'AUCUNE en évaluation','250k':'AUCUNE en évaluation','300k':'AUCUNE en évaluation'},
      'DLL Intraday (PA)':        {'25k':'Oui, par palier (tier based)','50k':'Oui, par palier','75k':'Oui, par palier','100k':'Oui, par palier','150k':'Oui, par palier','250k':'Oui, par palier','300k':'Oui, par palier'},
      'Jours de trading min (eval)':{'25k':'EOD/Intraday : 0 (passage en 1 jour possible) · Legacy : 7 jours, non consécutifs','50k':'EOD/Intraday : 0 · Legacy : 7','75k':'Legacy : 7','100k':'EOD/Intraday : 0 · Legacy : 7','150k':'EOD/Intraday : 0 · Legacy : 7','250k':'Legacy : 7','300k':'Legacy : 7'},
      'Durée éval max':           {'25k':'30 jours calendaires (no extension)','50k':'30 jours calendaires','75k':'30 jours','100k':'30 jours calendaires','150k':'30 jours calendaires','250k':'30 jours','300k':'30 jours'},
      'Règle de cohérence (eval)':{'25k':'AUCUNE en éval','50k':'AUCUNE en éval','75k':'AUCUNE en éval','100k':'AUCUNE en éval','150k':'AUCUNE en éval','250k':'AUCUNE en éval','300k':'AUCUNE en éval'},
      // « Not Applied » sur le tableau officiel : ni consistance NI scaling en
      // évaluation. Le scaling n'apparaît qu'une fois en Performance Account.
      'Scaling (eval)':           {'25k':'AUCUN en éval','50k':'AUCUN en éval','75k':'AUCUN en éval','100k':'AUCUN en éval','150k':'AUCUN en éval','250k':'AUCUN en éval','300k':'AUCUN en éval'},
      // La DLL est une PAUSE, pas un échec : elle stoppe la session et le compte
      // reste actif. Elle est aussi INDÉPENDANTE du seuil EOD — deux règles
      // distinctes, ce que beaucoup de comparatifs confondent.
      'Nature de la DLL':        {'25k':'Pause de la session en cours, le compte reste actif · sans effet sur le seuil EOD','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      'Délai activation PA':     {'25k':'7 jours calendaires après la réussite','50k':'7 jours','75k':'7 jours','100k':'7 jours','150k':'7 jours','250k':'7 jours','300k':'7 jours'},
      'Stop-Loss + Take-Profit':  {'25k':'OBLIGATOIRES sur chaque ordre (Rithmic/Tradovate enforce bracket) — depuis 4.0','50k':'OBLIGATOIRES','75k':'OBLIGATOIRES','100k':'OBLIGATOIRES','150k':'OBLIGATOIRES','250k':'OBLIGATOIRES','300k':'OBLIGATOIRES'},
      // === PERFORMANCE ACCOUNT (PA) ===
      'Règle de cohérence (PA)':  {'25k':'50% — aucun jour > 50% du profit total depuis dernier payout (relâché de 30%)','50k':'50% (relâché de 30%)','75k':'50%','100k':'50% (relâché de 30%)','150k':'50% (relâché de 30%)','250k':'50%','300k':'50%'},
      'PA DLL initial':           {'25k':'$500 (EOD seulement) — scale avec profits','50k':'$1,000','75k':'~$1,500','100k':'$1,750','150k':'$2,500','250k':'~$3,000','300k':'~$3,500'},
      // Le tableau officiel a DEUX colonnes que la cellule confondait : le Safety
      // Net (seuil qui débloque la taille de position pleine) et le solde minimum
      // exigé pour DEMANDER un payout, 500 $ plus haut. Séparées ci-dessous.
      // = limite de drawdown + $100, et il reste en place TOUTE LA VIE du PA : il ne
      // disparaît PAS après le premier payout. Seul le profit AU-DESSUS du safety net
      // est retirable.
      'Safety Net (PA)':          {'25k':'$26,100','50k':'$52,100','75k':'Legacy : $77,850','100k':'$103,100','150k':'$154,100','250k':'Legacy : $256,600','300k':'Legacy : $307,600'},
      'Solde min pour payout':    {'25k':'$26,600','50k':'$52,600','75k':'Legacy : non confirmé','100k':'$103,600','150k':'$154,600','250k':'Legacy : non confirmé','300k':'Legacy : non confirmé'},
      // ⚠️ On peut continuer à trader juste après avoir demandé un payout, MAIS il
      // faut se comporter comme si la somme était déjà retirée : si le solde passe
      // sous le seuil AVANT le traitement, la demande est refusée automatiquement.
      'Trading après demande':    {'25k':'Autorisé, mais le solde est réévalué au traitement — passer sous le seuil annule la demande','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      'DCA (renforcement)':       {'25k':'Eval : autorisé · PA : 🚨 INTERDIT (fail auto) depuis mars 2026','50k':'Eval autorisé · PA INTERDIT','75k':'Eval autorisé · PA INTERDIT','100k':'Eval autorisé · PA INTERDIT','150k':'Eval autorisé · PA INTERDIT','250k':'Eval autorisé · PA INTERDIT','300k':'Eval autorisé · PA INTERDIT'},
      // === CONTRATS (mini = standard · micro = 10× mini, comptent à l\'unité) ===
      // Tableau « Legacy Trailing Max Drawdown by Plan and Contract Size » : les
      // tailles legacy autorisent nettement plus de minis que les offres 4.0.
      'Contrats max eval (mini)': {'25k':'EOD/Intraday : 4 · Legacy : 4','50k':'EOD/Intraday : 6 · Legacy : 10','75k':'Legacy : 12','100k':'EOD/Intraday : 8 · Legacy : 14','150k':'EOD/Intraday : 12 · Legacy : 17','250k':'Legacy : 27','300k':'Legacy : 35'},
      'Contrats PA pre-safety':   {'25k':'1 (½ du PA max)','50k':'2','75k':'3 (legacy)','100k':'3','150k':'4','250k':'6 (legacy)','300k':'7 (legacy)'},
      // Tableau officiel « EOD Performance Accounts » : 2 / 4 / 6 / 10.
      'Contrats PA post-safety':  {'25k':'2','50k':'4','75k':'6 (legacy)','100k':'6','150k':'10','250k':'12 (legacy)','300k':'15 (legacy)'},
      'Contrats max (micro)':     {'25k':'40 (10× mini, comptent à l\'unité)','50k':'60','75k':'80 (legacy)','100k':'80','150k':'120','250k':'160 (legacy)','300k':'200 (legacy)'},
      // Trois précisions que seul l'article « Rules: Consistency Rule » donne, et
      // qui changent la lecture du pourcentage affiché dans un tableau de bord.
      'Consistency — mécanique':  {'25k':'Meilleur jour ÷ profit total. « Au niveau ou en dessous » PASSE : 19,97% satisfait une règle à 20%, et 20,00% aussi — seul un chiffre strictement au-dessus échoue','50k':'idem','100k':'idem','150k':'idem'},
      'Consistency — remise à zéro':{'25k':'Le pourcentage se remet à zéro après CHAQUE payout approuvé : il se recalcule sur la période jusqu\'à la demande suivante','50k':'idem','100k':'idem','150k':'idem'},
      'Consistency — jours perdants':{'25k':'Une journée PERDANTE dégrade la consistance : elle réduit le profit total, donc le dénominateur, et fait MONTER le pourcentage','50k':'idem','100k':'idem','150k':'idem'},
      'Fraîcheur des métriques':  {'25k':'Solde, profit, perte journalière et consistance sont en TEMPS RÉEL. Seul le Trailing Max Drawdown ne bouge qu\'une fois par jour, en fin de séance','50k':'idem','100k':'idem','150k':'idem'},
      // === TRADING RESTRICTIONS ===
      'Positions overnight':      {'25k':'INTERDIT (flat à 16h59 ET impératif)','50k':'INTERDIT','75k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT','250k':'INTERDIT','300k':'INTERDIT'},
      'Trading des news':         {'25k':'Autorisé · interdit : max size, chasing, hedging des 2 côtés','50k':'Autorisé (idem)','75k':'Autorisé (idem)','100k':'Autorisé (idem)','150k':'Autorisé (idem)','250k':'Autorisé (idem)','300k':'Autorisé (idem)'},
      'Algos / automation':       {'25k':'INTERDIT — pas d\'algo, HFT, copy trading inter-comptes','50k':'INTERDIT','75k':'INTERDIT','100k':'INTERDIT','150k':'INTERDIT','250k':'INTERDIT','300k':'INTERDIT'},
      'Metals HALT (14 mars 2026)':{'25k':'🚨 GC, SI, QI, QO, MGC, HG, PL, PA SUSPENDUS — aucun retour annoncé','50k':'🚨 idem','75k':'🚨 idem','100k':'🚨 idem','150k':'🚨 idem','250k':'🚨 idem','300k':'🚨 idem'},
      'Auto-flat':                {'25k':'16h59 ET (toutes positions fermées · breach MLL après auto-flat = ban)','50k':'16h59 ET','75k':'16h59 ET','100k':'16h59 ET','150k':'16h59 ET','250k':'16h59 ET','300k':'16h59 ET'},
      // === TARIFS (one-time uniquement en 4.0, codes promo permanents -80/-90%) ===
      'Prix one-time EOD (list)': {'25k':'EOD : $390 · Legacy : $177 (tarif d\'alors)','50k':'EOD : $490 · Legacy : $197','75k':'Legacy : ~$247','100k':'EOD : $790 · Legacy : $297','150k':'EOD : $1,490 · Legacy : $397','250k':'Legacy : ~$547','300k':'Legacy : ~$647'},
      'Prix one-time Intraday':   {'25k':'Intraday : $167 · Legacy : $118 (tarif d\'alors)','50k':'Intraday : $249 · Legacy : $131','75k':'Legacy : ~$165','100k':'Intraday : $399 · Legacy : $198','150k':'Intraday : $599 · Legacy : $265','250k':'Legacy : ~$365','300k':'Legacy : ~$432'},
      'Prix après codes promo':   {'25k':'~$18-35 (SAVENOW -80/-90%)','50k':'~$20-40','75k':'~$25-50','100k':'~$30-60','150k':'~$40-80','250k':'~$55-110','300k':'~$65-130'},
      // Legacy : depuis le 1er mars 2026 les comptes achetés ne sont éligibles QU'AU
      // forfait à vie ; l'activation mensuelle n'existe plus pour eux.
      'Frais activation PA':      {'25k':'EOD : $99 · Intraday : $79 · Legacy : $125 à vie','50k':'EOD : $99 · Intraday : $79 · Legacy : $140 à vie','75k':'Legacy : $150 à vie (interpolé, non confirmé)','100k':'EOD : $99 · Intraday : $79 · Legacy : $175 à vie','150k':'EOD : $99 · Intraday : $79 · Legacy : $200 à vie','250k':'Legacy : $250 à vie','300k':'Legacy : $300 à vie'},
      'Reset cost':               {'25k':'SUPPRIMÉ en 4.0 (rebuy éval avec code promo = de facto reset à $18-35)','50k':'SUPPRIMÉ','75k':'SUPPRIMÉ','100k':'SUPPRIMÉ','150k':'SUPPRIMÉ','250k':'SUPPRIMÉ','300k':'SUPPRIMÉ'},
      'Codes promo permanents':   {'25k':'SAVENOW (-80/-90%), TSXRGNER, codes rotatifs','50k':'idem','75k':'idem','100k':'idem','150k':'idem','250k':'idem','300k':'idem'},
      // === PAYOUTS ===
      'Répartition gains':        {'25k':'100% trader · cappé par ladder lifetime (6 payouts) puis uncapped','50k':'100% · cappé ladder','75k':'100% · cappé ladder (legacy)','100k':'100% · cappé ladder','150k':'100% · cappé ladder','250k':'100% (legacy)','300k':'100% (legacy)'},
      'Payout minimum':           {'25k':'$500 (toutes tailles)','50k':'$500','75k':'$500','100k':'$500','150k':'$500','250k':'$500','300k':'$500'},
      // Tableau officiel « EOD Performance Account Max Payouts » (captures août 2026).
      // Huit des vingt-quatre cases étaient fausses : l'échelle n'est PAS régulière,
      // elle stagne sur certains paliers (50K reste à $1,500 puis à $2,500 ; le 150K
      // reste à $3,000 trois fois d'affilée).
      // Deux échelles DISTINCTES (tableaux « EOD » et « Intraday Performance Account
      // Max Payouts »). L'Intraday paie plus vite sur les premiers paliers.
      'Payout ladder (1→6)':      {'25k':'EOD/Intraday : $1,000 aux six paliers','50k':'EOD : 1500·1500·2000·2500·2500·3000 · Intraday : 1500·2000·2500·2500·3000·3000','75k':'Legacy : non confirmé','100k':'EOD : 2000·2500·2500·3000·4000·4000 · Intraday : 2000·2500·3000·3000·4000·4000','150k':'EOD : 2500·3000·3000·3000·4000·5000 · Intraday : 2500·3000·3000·4000·4000·5000','250k':'Legacy : non confirmé','300k':'Legacy : non confirmé'},
      // ✅ TRANCHÉ par la page officielle : la contradiction entre sources tierces
      //    (« caps levés » contre « PA fermé ») est réglée. Le PA FERME. Il faut
      //    repasser une évaluation pour en obtenir un nouveau.
      'Après 6 payouts':          {'25k':'Le PA est FERMÉ — il faut repasser une évaluation pour en obtenir un autre','50k':'PA fermé','75k':'PA fermé','100k':'PA fermé','150k':'PA fermé','250k':'PA fermé','300k':'PA fermé'},
      // ⚠ CORRIGÉ août 2026 sur le tableau officiel « EOD Payouts ». Les quatre
      //   valeurs stockées étaient fausses ($125/$200/$250/$375), et ce chiffre
      //   décide si une journée COMPTE dans les 5 jours qualifiants d'un payout.
      // ⚠ Les deux programmes 4.0 n'exigent PAS le même profit quotidien. Confondre
      //   les deux fait compter des journées qui ne qualifient pas.
      'Profit min jour valide':   {'25k':'EOD : $100/jour · Intraday : $100','50k':'EOD : $250/jour · Intraday : $200','75k':'Legacy : non confirmé','100k':'EOD : $300/jour · Intraday : $250','150k':'EOD : $350/jour · Intraday : $300','250k':'Legacy : non confirmé','300k':'Legacy : non confirmé'},
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
      // Relevé sur bulenox.com/accounts-pricing en août 2026 : le 25K est à $145,
      // pas $175. Les paiements sont ONE-TIME, pas mensuels — le libellé de la clé
      // est conservé pour ne pas casser le sélecteur de prix.
      // ⚠ La page officielle ne liste plus que 4 tailles : le 250K n'y figure plus.
      //   Il est conservé ici parce que des comptes existants le portent.
      'Prix mensuel (list)':      {'25k':'$145 one-time','50k':'$175 one-time','100k':'$215 one-time','150k':'$325 one-time','250k':'~$535 (taille retirée du site)'},
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
    // VÉRIFIÉ AOÛT 2026 — sur le PDF officiel fourni par l'utilisateur : les six
    // tableaux « Account Details » affichés au checkout, un par programme et par
    // taille. C'est une source de PREMIÈRE MAIN — lucidtrading.com bloque toute
    // récupération automatique (Cloudflare 403), le catalogue reposait jusqu'ici
    // sur des analyses tierces recoupées.
    //
    // QUATRE PROGRAMMES ACHETABLES :
    //   • LucidPro    → éval one-time · consistance 40% en financé · 3 jours entre payouts
    //   • LucidFlex   → éval one-time · consistance 50% en ÉVAL puis AUCUNE en financé,
    //                   compensée par 5 jours de profit minimum ($100→$250) · scaling plan
    //   • LucidDaily  → éval one-time · PAYOUTS QUOTIDIENS · drawdown EOD ou Intraday
    //                   CHOISI AU CHECKOUT — seul programme du catalogue où le type de
    //                   drawdown est une option d'achat et non une caractéristique
    //   • LucidDirect → Straight To Funded (aucune évaluation) · consistance 20%
    //
    // LucidLive et LucidMaxx ne sont PAS vendus : ce sont des paliers atteints après
    // 5 payouts (6 pour Direct). Ils n'apparaissent donc pas dans le sélecteur de
    // programme, mais leurs règles restent documentées plus bas.
    //
    // ⚠️ LA DLL EST OPTIONNELLE sur Pro / Flex / Daily : le tableau officiel la donne
    // en « ON/OFF », activée ou non à l'achat. Les montants ci-dessous sont ceux qui
    // s'appliquent SI elle est activée ; sans elle il ne reste que la MLL.
    //
    // ⚠️ LucidScale — AU-DESSUS du trail initial, la DLL cesse d'être un montant fixe
    // et devient 60% du Peak EOD Balance : elle S'ÉLARGIT à mesure que le compte monte.
    // En dessous du trail initial, c'est le montant fixe qui s'applique.
    //
    // ⚠️ La MLL ne suit PAS la baisse de solde après un retrait : laisser $1,000-$1,500
    // au-dessus du minimum.
    //
    // Plateformes : Rithmic, Tradovate, NinjaTrader (PAS ProjectX, PAS TradingView)
    plans: ['25k','50k','100k','150k'],
    rules: {
      // === IDENTITÉ DES PROGRAMMES ===
      'Nature du programme':      {'25k':'LucidPro : évaluation one-time · LucidFlex : évaluation one-time · LucidDaily : évaluation one-time, payouts quotidiens · LucidDirect : Straight To Funded, aucune évaluation','50k':'LucidPro : évaluation one-time · LucidFlex : évaluation one-time · LucidDaily : évaluation one-time, payouts quotidiens · LucidDirect : Straight To Funded, aucune évaluation','100k':'LucidPro : évaluation one-time · LucidFlex : évaluation one-time · LucidDaily : évaluation one-time, payouts quotidiens · LucidDirect : Straight To Funded, aucune évaluation','150k':'LucidPro : évaluation one-time · LucidFlex : évaluation one-time · LucidDaily : évaluation one-time, payouts quotidiens · LucidDirect : Straight To Funded, aucune évaluation'},
      'Type de drawdown':         {'25k':'LucidPro : EOD · LucidFlex : EOD · LucidDaily : EOD OU Intraday, au choix à l’achat · LucidDirect : EOD','50k':'LucidPro : EOD · LucidFlex : EOD · LucidDaily : EOD OU Intraday, au choix à l’achat · LucidDirect : EOD','100k':'LucidPro : EOD · LucidFlex : EOD · LucidDaily : EOD OU Intraday, au choix à l’achat · LucidDirect : EOD','150k':'LucidPro : EOD · LucidFlex : EOD · LucidDaily : EOD OU Intraday, au choix à l’achat · LucidDirect : EOD'},
      // === ÉVALUATION ===
      'Objectif de profit':       {'25k':'LucidPro/LucidFlex/LucidDaily : $1,250 · LucidDirect : aucun (financé direct)','50k':'LucidPro/LucidFlex/LucidDaily : $3,000 · LucidDirect : aucun (financé direct)','100k':'LucidPro/LucidFlex/LucidDaily : $6,000 · LucidDirect : aucun (financé direct)','150k':'LucidPro/LucidFlex/LucidDaily : $9,000 · LucidDirect : aucun (financé direct)'},
      'Drawdown trailing max':    {'25k':'LucidPro/LucidFlex/LucidDaily : $1,000 · LucidDirect : $1,000','50k':'LucidPro/LucidFlex/LucidDaily : $2,000 · LucidDirect : $2,000','100k':'LucidPro/LucidFlex/LucidDaily : $3,000 · LucidDirect : $3,500','150k':'LucidPro/LucidFlex/LucidDaily : $4,500 · LucidDirect : $5,000'},
      'Daily Loss Limit (éval)':  {'25k':'LucidPro/LucidFlex/LucidDaily : $600 si activée (ON/OFF à l’achat) · LucidDirect : sans objet (aucune évaluation)','50k':'LucidPro/LucidFlex/LucidDaily : $1,200 si activée (ON/OFF à l’achat) · LucidDirect : sans objet (aucune évaluation)','100k':'LucidPro/LucidFlex/LucidDaily : $1,800 si activée (ON/OFF à l’achat) · LucidDirect : sans objet (aucune évaluation)','150k':'LucidPro/LucidFlex/LucidDaily : $2,700 si activée (ON/OFF à l’achat) · LucidDirect : sans objet (aucune évaluation)'},
      'Jours de trading min (eval)':{'25k':'LucidPro/LucidFlex/LucidDaily : 1 jour (one-day pass) · LucidDirect : 0 (financé direct)','50k':'LucidPro/LucidFlex/LucidDaily : 1 jour (one-day pass) · LucidDirect : 0 (financé direct)','100k':'LucidPro/LucidFlex/LucidDaily : 1 jour (one-day pass) · LucidDirect : 0 (financé direct)','150k':'LucidPro/LucidFlex/LucidDaily : 1 jour (one-day pass) · LucidDirect : 0 (financé direct)'},
      'Seuil quotidien en éval':  {'25k':'Aucun seuil de profit par jour pendant l’évaluation','50k':'Aucun seuil de profit par jour pendant l’évaluation','100k':'Aucun seuil de profit par jour pendant l’évaluation','150k':'Aucun seuil de profit par jour pendant l’évaluation'},
      'Consistency (eval)':       {'25k':'LucidPro : AUCUNE · LucidFlex : 50% · LucidDaily : 50% · LucidDirect : 20% (STRICTE, dès le premier cycle)','50k':'LucidPro : AUCUNE · LucidFlex : 50% · LucidDaily : 50% · LucidDirect : 20% (STRICTE, dès le premier cycle)','100k':'LucidPro : AUCUNE · LucidFlex : 50% · LucidDaily : 50% · LucidDirect : 20% (STRICTE, dès le premier cycle)','150k':'LucidPro : AUCUNE · LucidFlex : 50% · LucidDaily : 50% · LucidDirect : 20% (STRICTE, dès le premier cycle)'},
      'Frais activation':         {'25k':'$0 — activation GRATUITE sur les quatre programmes','50k':'$0 — activation GRATUITE sur les quatre programmes','100k':'$0 — activation GRATUITE sur les quatre programmes','150k':'$0 — activation GRATUITE sur les quatre programmes'},
      'Limite de temps Eval':     {'25k':'Aucune limite de durée annoncée au checkout','50k':'Aucune limite de durée annoncée au checkout','100k':'Aucune limite de durée annoncée au checkout','150k':'Aucune limite de durée annoncée au checkout'},
      // === FINANCÉ ===
      'DLL funded (sous le trail initial)':{'25k':'LucidPro/LucidFlex/LucidDaily : $600 · LucidDirect : AUCUNE','50k':'LucidPro/LucidFlex/LucidDaily : $1,200 · LucidDirect : $1,200','100k':'LucidPro/LucidFlex/LucidDaily : $1,800 · LucidDirect : $2,100','150k':'LucidPro/LucidFlex/LucidDaily : $2,700 · LucidDirect : $3,000'},
      'LucidScale DLL (au-dessus du trail initial)':{'25k':'LucidPro/LucidFlex/LucidDaily : 60% du Peak EOD Balance · LucidDirect : AUCUNE','50k':'LucidPro/LucidFlex/LucidDaily : 60% du Peak EOD Balance · LucidDirect : 60% du Peak EOD Balance','100k':'LucidPro/LucidFlex/LucidDaily : 60% du Peak EOD Balance · LucidDirect : 60% du Peak EOD Balance','150k':'LucidPro/LucidFlex/LucidDaily : 60% du Peak EOD Balance · LucidDirect : 60% du Peak EOD Balance'},
      'Consistency funded':       {'25k':'LucidPro : 40% du profit du cycle sur le meilleur jour, remise à zéro après chaque payout · LucidFlex : AUCUNE · LucidDaily : AUCUNE · LucidDirect : 20% (STRICTE)','50k':'LucidPro : 40% du profit du cycle sur le meilleur jour, remise à zéro après chaque payout · LucidFlex : AUCUNE · LucidDaily : AUCUNE · LucidDirect : 20% (STRICTE)','100k':'LucidPro : 40% du profit du cycle sur le meilleur jour, remise à zéro après chaque payout · LucidFlex : AUCUNE · LucidDaily : AUCUNE · LucidDirect : 20% (STRICTE)','150k':'LucidPro : 40% du profit du cycle sur le meilleur jour, remise à zéro après chaque payout · LucidFlex : AUCUNE · LucidDaily : AUCUNE · LucidDirect : 20% (STRICTE)'},
      'Jours min avant payout':   {'25k':'LucidPro : 3 jours · LucidFlex : 5 jours · LucidDaily : payouts QUOTIDIENS · LucidDirect : 5 jours','50k':'LucidPro : 3 jours · LucidFlex : 5 jours · LucidDaily : payouts QUOTIDIENS · LucidDirect : 5 jours','100k':'LucidPro : 3 jours · LucidFlex : 5 jours · LucidDaily : payouts QUOTIDIENS · LucidDirect : 5 jours','150k':'LucidPro : 3 jours · LucidFlex : 5 jours · LucidDaily : payouts QUOTIDIENS · LucidDirect : 5 jours'},
      'Jours de profit min (funded)':{'25k':'LucidFlex : 5 jours distincts au-dessus du seuil, REMIS À ZÉRO après chaque payout approuvé · LucidPro : non exigé · LucidDaily : non exigé · LucidDirect : non exigé','50k':'LucidFlex : 5 jours distincts au-dessus du seuil, REMIS À ZÉRO après chaque payout approuvé · LucidPro : non exigé · LucidDaily : non exigé · LucidDirect : non exigé','100k':'LucidFlex : 5 jours distincts au-dessus du seuil, REMIS À ZÉRO après chaque payout approuvé · LucidPro : non exigé · LucidDaily : non exigé · LucidDirect : non exigé','150k':'LucidFlex : 5 jours distincts au-dessus du seuil, REMIS À ZÉRO après chaque payout approuvé · LucidPro : non exigé · LucidDaily : non exigé · LucidDirect : non exigé'},
      // ⚠️ Cette clé est celle que defaultMinDailyProfit() trouve. Elle doit rester la
      // SEULE clé « profit min … jour » de la firme : le sélecteur s'arrête à la
      // première trouvée, et une clé d'évaluation placée devant renvoyait $0 à tout
      // le monde — y compris aux comptes LucidFlex, dont les $100 à $250 par jour
      // décident si une journée compte dans les cinq exigées.
      'Profit min/jour (funded)': {'25k':'LucidFlex : $100/jour · LucidPro : aucun · LucidDaily : aucun · LucidDirect : aucun','50k':'LucidFlex : $150/jour · LucidPro : aucun · LucidDaily : aucun · LucidDirect : aucun','100k':'LucidFlex : $200/jour · LucidPro : aucun · LucidDaily : aucun · LucidDirect : aucun','150k':'LucidFlex : $250/jour · LucidPro : aucun · LucidDaily : aucun · LucidDirect : aucun'},
      'Profit requis par payout': {'25k':'LucidPro : $250, remis à zéro après chaque payout · LucidFlex : aucun objectif chiffré — 5 jours de profit à la place · LucidDaily : non publié · LucidDirect : non publié','50k':'LucidPro : $500, remis à zéro après chaque payout · LucidFlex : aucun objectif chiffré — 5 jours de profit à la place · LucidDaily : non publié · LucidDirect : non publié','100k':'LucidPro : $750, remis à zéro après chaque payout · LucidFlex : aucun objectif chiffré — 5 jours de profit à la place · LucidDaily : non publié · LucidDirect : non publié','150k':'LucidPro : $1,000, remis à zéro après chaque payout · LucidFlex : aucun objectif chiffré — 5 jours de profit à la place · LucidDaily : non publié · LucidDirect : non publié'},
      // ⚠️ Propre à LucidDaily : il n'y a pas de plafond par DEMANDE mais un
      // plafond de profit par JOUR. L'atteindre ou le dépasser fait passer le
      // compte en LIVE automatiquement — c'est donc une sortie de programme, pas
      // un simple écrêtage du retrait.
      'Profit quotidien max (LucidDaily)':{'25k':'LucidDaily : $6,000 — atteint ou dépassé, passage automatique en live · LucidPro : sans objet · LucidFlex : sans objet · LucidDirect : sans objet','50k':'LucidDaily : $8,000 — atteint ou dépassé, passage automatique en live · LucidPro : sans objet · LucidFlex : sans objet · LucidDirect : sans objet','100k':'LucidDaily : $10,000 — atteint ou dépassé, passage automatique en live · LucidPro : sans objet · LucidFlex : sans objet · LucidDirect : sans objet','150k':'LucidDaily : $12,000 — atteint ou dépassé, passage automatique en live · LucidPro : sans objet · LucidFlex : sans objet · LucidDirect : sans objet'},
      'Scaling plan':             {'25k':'LucidFlex : OUI · LucidPro : NON · LucidDaily : NON · LucidDirect : NON','50k':'LucidFlex : OUI · LucidPro : NON · LucidDaily : NON · LucidDirect : NON','100k':'LucidFlex : OUI · LucidPro : NON · LucidDaily : NON · LucidDirect : NON','150k':'LucidFlex : OUI · LucidPro : NON · LucidDaily : NON · LucidDirect : NON'},
      'Comptes financés max':     {'25k':'5 comptes financés simultanés (LucidDirect compris)','50k':'5 comptes financés simultanés (LucidDirect compris)','100k':'5 comptes financés simultanés (LucidDirect compris)','150k':'5 comptes financés simultanés (LucidDirect compris)'},
      // === LUCID LIVE / LUCID MAXX (paliers, pas des produits) ===
      'Payouts avant LucidLive':  {'25k':'LucidPro : 5 payouts · LucidFlex : 5 payouts MAXIMUM par compte, ensuite passage en live · LucidDaily : déclenché par le profit quotidien max, pas par un nombre de payouts · LucidDirect : 6 payouts','50k':'LucidPro : 5 payouts · LucidFlex : 5 payouts MAXIMUM par compte, ensuite passage en live · LucidDaily : déclenché par le profit quotidien max, pas par un nombre de payouts · LucidDirect : 6 payouts','100k':'LucidPro : 5 payouts · LucidFlex : 5 payouts MAXIMUM par compte, ensuite passage en live · LucidDaily : déclenché par le profit quotidien max, pas par un nombre de payouts · LucidDirect : 6 payouts','150k':'LucidPro : 5 payouts · LucidFlex : 5 payouts MAXIMUM par compte, ensuite passage en live · LucidDaily : déclenché par le profit quotidien max, pas par un nombre de payouts · LucidDirect : 6 payouts'},
      'LucidLive starting balance':{'25k':'$0 starting + bonus crédité','50k':'$0 + bonus','100k':'$0 + bonus','150k':'$0 + bonus'},
      'LucidLive bonus':          {'25k':'$1,000','50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'LucidMaxx':                {'25k':'Sur invitation · payouts quotidiens sans plafond · split 80/20 sur capital réel','50k':'idem','100k':'idem','150k':'idem'},
      // === TRADING RESTRICTIONS ===
      'Heures de trading':        {'25k':'Dim 18h EST → Jeu 16h45 EST · auto-flat 16h45 EST · reprise 18h EST','50k':'idem','100k':'idem','150k':'idem'},
      'Positions overnight':      {'25k':'INTERDIT sur les quatre programmes achetables · autorisé uniquement sur LucidLive','50k':'idem','100k':'idem','150k':'idem'},
      'Weekend trading':          {'25k':'INTERDIT sur les quatre programmes achetables · autorisé uniquement sur LucidLive','50k':'idem','100k':'idem','150k':'idem'},
      'Trading des news':         {'25k':'Autorisé (NFP, FOMC, CPI, Powell, GDP)','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'DCA / scalping':           {'25k':'Autorisé (pas de min hold time)','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'Bots / copy trading':      {'25k':'Autorisés (trader responsable du PnL)','50k':'Autorisés','100k':'Autorisés','150k':'Autorisés'},
      // === CONTRATS (confirmés par le PDF : « Max Account Size ») ===
      'Contrats max (mini)':      {'25k':'2','50k':'4','100k':'6','150k':'10'},
      'Contrats max (micro)':     {'25k':'20 (10× mini)','50k':'40','100k':'60','150k':'100'},
      // === TARIFS (one-time, relevés sur le PDF ; le prix barré est le tarif public) ===
      'Prix LucidPro (one-time)': {'25k':'$90.60 — $70.60 avec code promo','50k':'$140.40 — $115.40 avec code promo','100k':'$225.40 — $180.40 avec code promo','150k':'$300.50 — $245.50 avec code promo'},
      'Prix LucidFlex (one-time)':{'25k':'$65.30 — $50.30 avec code promo','50k':'$105.20 — $90.20 avec code promo','100k':'$215.60 — $170.60 avec code promo','150k':'$295.40 — $250.40 avec code promo'},
      'Prix LucidDaily (one-time)':{'25k':'Variable selon les options choisies (EOD/Intraday, DLL ON/OFF) — prix calculé au checkout','50k':'Variable selon les options choisies (EOD/Intraday, DLL ON/OFF) — prix calculé au checkout','100k':'Variable selon les options choisies (EOD/Intraday, DLL ON/OFF) — prix calculé au checkout','150k':'Variable selon les options choisies (EOD/Intraday, DLL ON/OFF) — prix calculé au checkout'},
      'Prix LucidDirect (one-time)':{'25k':'$230.30 (tarif public $329)','50k':'$360.50 (tarif public $515)','100k':'$490.00 (tarif public $700)','150k':'$585.20 (tarif public $836)'},
      'Codes promo permanents':   {'25k':'Codes partenaires courants (VIBES, NINJA, SOPF, DGT) — 30 à 50% selon la période','50k':'idem','100k':'idem','150k':'idem'},
      'Reset compte':             {'25k':'Non documenté au checkout (à vérifier dans le tableau de bord)','50k':'idem','100k':'idem','150k':'idem'},
      // === PAYOUTS ===
      'Profit split (nouveaux)':  {'25k':'LucidPro : 90/10 · LucidFlex : 90/10 · LucidDaily : 90/10 · LucidDirect : 90/10','50k':'LucidPro : 90/10 · LucidFlex : 90/10 · LucidDaily : 90/10 · LucidDirect : 90/10','100k':'LucidPro : 90/10 · LucidFlex : 90/10 · LucidDaily : 90/10 · LucidDirect : 90/10','150k':'LucidPro : 90/10 · LucidFlex : 90/10 · LucidDaily : 90/10 · LucidDirect : 90/10'},
      'Profit split (legacy)':    {'25k':'100% sur les premiers $10K puis 90/10 — comptes ACHETÉS OU RESET avant le 28 nov. 2025 15h00 EST','50k':'idem','100k':'idem','150k':'idem'},
      // Le buffer est un SEUIL DE SOLDE, pas un montant retirable : on ne peut
      // retirer que ce qui dépasse. Formule officielle « Initial Max Loss Limit
      // + $100 », c'est-à-dire solde de départ + MLL initiale + $100 — les quatre
      // montants publiés pour LucidDaily la vérifient exactement.
      'Formule du buffer':        {'25k':'Là où un buffer existe : solde de départ + MLL initiale + $100 · on ne retire JAMAIS sur le buffer · LucidFlex en est exempté','50k':'idem','100k':'idem','150k':'idem'},
      // ⚠️ LucidPro et LucidDaily publient les MÊMES montants. LucidFlex n'a AUCUN buffer :
      // l'article « LucidFlex Payouts » le dit explicitement, et c'est son
      // différenciateur — appliquer la formule aux quatre programmes aurait
      // inventé un seuil de $154,600 sur un compte qui n'en a pas, donc affiché
      // « pas encore éligible » à quelqu'un qui pouvait retirer. Pour LucidPro et
      // LucidDirect le help center ne publie rien : on ne devine pas.
      'Buffer payout':            {'25k':'LucidPro : $26,100 · LucidDaily : $26,100 · LucidFlex : AUCUN buffer exigé · LucidDirect : non publié','50k':'LucidPro : $52,100 · LucidDaily : $52,100 · LucidFlex : AUCUN buffer exigé · LucidDirect : non publié','100k':'LucidPro : $103,100 · LucidDaily : $103,100 · LucidFlex : AUCUN buffer exigé · LucidDirect : non publié','150k':'LucidPro : $154,600 · LucidDaily : $154,600 · LucidFlex : AUCUN buffer exigé · LucidDirect : non publié'},
      // Le buffer n'est pas le seuil de DEMANDE : il faut le dépasser du montant
      // demandé. D'où deux soldes distincts publiés par Lucid.
      'Solde min pour un payout de $500':{'25k':'LucidPro : $26,600 · LucidDaily : $26,600 · LucidFlex : aucun seuil (pas de buffer) · LucidDirect : non publié','50k':'LucidPro : $52,600 · LucidDaily : $52,600 · LucidFlex : aucun seuil (pas de buffer) · LucidDirect : non publié','100k':'LucidPro : $103,600 · LucidDaily : $103,600 · LucidFlex : aucun seuil (pas de buffer) · LucidDirect : non publié','150k':'LucidPro : $155,100 · LucidDaily : $155,100 · LucidFlex : aucun seuil (pas de buffer) · LucidDirect : non publié'},
      'Solde min pour le payout maximum':{'25k':'LucidPro : $27,100 au 1er payout puis $27,600 · LucidFlex : sans objet · LucidDaily : non publié · LucidDirect : non publié','50k':'LucidPro : $54,100 au 1er payout puis $54,600 · LucidFlex : sans objet · LucidDaily : non publié · LucidDirect : non publié','100k':'LucidPro : $105,600 au 1er payout puis $106,100 · LucidFlex : sans objet · LucidDaily : non publié · LucidDirect : non publié','150k':'LucidPro : $157,600 au 1er payout puis $158,100 · LucidFlex : sans objet · LucidDaily : non publié · LucidDirect : non publié'},
      'Profit net depuis le dernier payout':{'25k':'Doit être POSITIF, ne serait-ce que $1 — deuxième condition d\'éligibilité avec le buffer','50k':'idem','100k':'idem','150k':'idem'},
      // Deux pièges qui font refuser une demande déjà envoyée.
      'Demande de payout':        {'25k':'DÉFINITIVE une fois soumise : ni modifiable ni annulable','50k':'idem','100k':'idem','150k':'idem'},
      'Solde au traitement':      {'25k':'Trader comme si la somme demandée était DÉJÀ retirée : un trade pris avant l’approbation qui ramène le solde dans le buffer fait refuser la demande, et passer sous le buffer APRÈS le débit met le compte en danger','50k':'idem','100k':'idem','150k':'idem'},
      'Payout minimum':           {'25k':'$500 par compte, sur tous les programmes','50k':'$500 par compte','100k':'$500 par compte','150k':'$500 par compte'},
      // 50% du profit ET un plafond en dollars : c'est le plus petit des deux qui
      // s'applique. Contrairement aux autres programmes, il ne monte JAMAIS avec le
      // nombre de payouts — la même grille vaut de la 1ʳᵉ à la 5ᵉ demande.
      'Cap LucidFlex (fixe)':     {'25k':'50% du profit, plafonné à $1,000 · identique du 1er au 5e payout','50k':'50% du profit, plafonné à $2,000 · identique du 1er au 5e payout','100k':'50% du profit, plafonné à $2,500 · identique du 1er au 5e payout','150k':'50% du profit, plafonné à $3,000 · identique du 1er au 5e payout'},
      // ⚠️ DEUX paliers, pas six. Le catalogue portait une échelle inventée
      // (« $2K → $3K → $4K → $5K → $6K puis déplafonné ») : l'article officiel
      // n'a que deux tableaux, « Payout 1 » et « Payouts 2+ ». Rien ne monte
      // au-delà, et rien n'est jamais déplafonné.
      'Cap LucidPro (1er / 2e et +)':{'25k':'$1,000 au 1er payout, $1,500 ensuite','50k':'$2,000 au 1er payout, $2,500 ensuite','100k':'$2,500 au 1er payout, $3,000 ensuite','150k':'$3,000 au 1er payout, $3,500 ensuite'},
      'Cap LucidDirect (progressif)':{'25k':'$1,000 (cycles 1-6) puis déplafonné','50k':'$2K (1-2) → $2,500 (3-6) puis déplafonné','100k':'$2,500 (1-2) → $3,000 (3-6)','150k':'$3,000 (1-2) → $3,500 (3-6)'},
      'Cap LucidDaily':           {'25k':'Aucun plafond par demande — le retrait vaut les profits sim accumulés AU-DESSUS du buffer','50k':'idem','100k':'idem','150k':'idem'},
      'Délai payout':             {'25k':'Aucune fenêtre fixe : demande possible tout jour où les critères sont remplis · une fois approuvée, débit du compte en quelques minutes et versement sous 2 jours ouvrés','50k':'idem','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'25k':'Plaid ACH (US) · PayPal · Rise (crypto USDT/USDC) · WorkMarket (virement international)','50k':'idem','100k':'idem','150k':'idem'},
      'Frais retrait':            {'25k':'$0 (Lucid ne prélève aucun frais)','50k':'$0','100k':'$0','150k':'$0'},
      'Buffer post-payout':       {'25k':'Laisser $1,000-$1,500 au-dessus du MLL minimum (la MLL ne redescend pas avec le solde)','50k':'idem','100k':'idem','150k':'idem'},
      // === MULTI-COMPTES ===
      'Comptes financés simul.':  {'25k':'5 max par foyer (LucidLive : 1 max, plafonné à $150K)','50k':'5 max','100k':'5 max','150k':'5 max'},
      'Comptes Eval simul.':      {'25k':'10 max par foyer','50k':'10 max','100k':'10 max','150k':'10 max'},
    }
  },
  'Tradeify': {
    // VÉRIFIÉ AOÛT 2026 sur CINQ articles du help center fournis en PDF :
    // « Select Evaluation Accounts », « Growth Evaluation Accounts »,
    // « Lightning Funded Accounts », « SELECT vs Growth » et
    // « Rules: Consistency Rule », la note de version « Tradeify 3.0 – Program
    // Updates & Improvements » (7 avril 2026) et l'annonce « Introducing the New
    // Select Plan & Changes to the Live Program » (31 mars 2026). C'est une
    // source de PREMIÈRE MAIN — help.tradeify.co bloque la récupération
    // automatique.
    //
    // Les TROIS échelles de drawdown stockées sont confirmées au mot près, y
    // compris leur divergence à partir du 100K (Select 3 000 / Growth 3 500 /
    // Lightning 4 000). Ce qui suit liste ce que les articles ont CORRIGÉ.
    //
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
      'Drawdown Lightning (EOD)': {'25k':'$1,000','50k':'$2,000','100k':'$4,000','150k':'$5,250'},
      // ⚠️ Select DAILY a un drawdown FINANCÉ plus SERRÉ que Select Flex, à partir
      // du 100K. L'article « Rules: Trailing Max Drawdowns » ne l'écrit pas en
      // toutes lettres, mais il publie le solde qui déclenche le verrou ET la
      // formule (solde initial + drawdown + $100). Le calcul inverse donne :
      //   Select Daily 100K : 102 600 − 100 000 − 100 = $2,500
      //   Select Daily 150K : 153 600 − 150 000 − 100 = $3,500
      // La formule se vérifie sur 14 des 16 cases du tableau (Growth, Lightning
      // et Select Flex tombent exactement sur les valeurs stockées), ce qui la
      // rend fiable. On retient donc le chiffre le plus SERRÉ : se tromper dans
      // l'autre sens afficherait une marge que le trader n'a pas.
      'Drawdown Select Daily (financé)':{'25k':'$1,000','50k':'$2,000','100k':'$2,500 (déduit du seuil de verrou publié)','150k':'$3,500 (déduit du seuil de verrou publié)'},
      // Le verrou vaut pour les quatre programmes : formulé sans étiquette, sinon
      // le comparateur croit à un ciblage et n'affiche rien pour les autres.
      // Deux chiffres à ne pas confondre : le solde qui DÉCLENCHE le verrou, et
      // le plancher qu'on obtient ensuite. L'ancienne cellule ne donnait que le
      // second et le présentait comme le premier.
      'Lock drawdown':            {'25k':'Une fois verrouillé, le plancher devient $25,100 et ne remonte plus jamais','50k':'Plancher figé à $50,100','100k':'Plancher figé à $100,100','150k':'Plancher figé à $150,100'},
      'Seuil de verrouillage':    {'25k':'Growth : $26,100 · Lightning Funded : $26,100 · Select Flex : $26,100 · Select Daily : $26,100','50k':'Growth : $52,100 · Lightning Funded : $52,100 · Select Flex : $52,100 · Select Daily : $52,100','100k':'Growth : $103,600 · Lightning Funded : $104,100 · Select Flex : $103,100 · Select Daily : $102,600','150k':'Growth : $155,100 · Lightning Funded : $155,350 · Select Flex : $154,600 · Select Daily : $153,600'},
      'Verrouillage — déclencheurs':{'25k':'Le verrou tombe au PREMIER des deux : soit le solde de clôture dépasse le drawdown de $100, soit une DEMANDE DE PAYOUT est déposée','50k':'idem','100k':'idem','150k':'idem'},
      'Verrouillage — portée':    {'25k':'Comptes SIM FUNDED uniquement. Une évaluation ne verrouille JAMAIS son drawdown','50k':'idem','100k':'idem','150k':'idem'},
      // Ce que le seuil mesure vraiment : le solde PLUS le profit latent. Une
      // position ouverte en perte peut donc casser le compte avant d'être fermée.
      'Drawdown — ce qui est mesuré':{'25k':'La NET LIQUIDATION VALUE : solde + profit/perte LATENT des positions ouvertes. Le seuil ne bouge qu\'en fin de journée mais il est appliqué EN TEMPS RÉEL — le toucher casse le compte définitivement, même si la journée se termine en vert','50k':'idem','100k':'idem','150k':'idem'},
      'DLL Select Daily':         {'25k':'$500','50k':'$1,000','100k':'$1,250','150k':'$1,750'},
      'DLL Select Flex':          {'25k':'AUCUN','50k':'AUCUN','100k':'AUCUN','150k':'AUCUN'},
      'DLL Growth':               {'25k':'$600 (soft breach pause journée, pas fail)','50k':'$1,250','100k':'$2,500','150k':'$3,750'},
      'DLL Lightning':            {'25k':'AUCUN (Lightning 25K seul)','50k':'$1,250','100k':'$2,500','150k':'$3,000 (nouveaux) · $3,750 (pre-31 mars 2026)'},
      'DLL — portée':             {'25k':'Growth, Lightning et Select Daily FINANCÉS. Select Flex n\'a aucune DLL, seul le drawdown trailing s\'y applique','50k':'idem','100k':'idem','150k':'idem'},
      // Toucher la DLL ne casse PAS le compte — c'est une « soft breach ». Le
      // catalogue ne le disait que sur la ligne Growth, alors que ça vaut pour
      // les trois familles qui en ont une.
      'DLL — effet quand elle tombe':{'25k':'Le trading est mis en PAUSE pour la journée, le compte reste actif. On reprend à la session suivante, après 18h00 ET','50k':'idem','100k':'idem','150k':'idem'},
      'DLL — réinitialisation':   {'25k':'Remise à zéro au début de chaque session de trading, à 18h00 ET. Les pertes de la veille ne comptent pas dans la limite du jour','50k':'idem','100k':'idem','150k':'idem'},
      // Le seuil ne reste pas fixe : à +6% de profit il s'aligne sur le montant
      // du drawdown. Les deux tables (montant de départ, montant après hausse)
      // ne se recoupent pas — Lightning et Growth divergent à partir du 100K.
      'DLL — hausse à +6% de profit':{'25k':'Growth : passe de $600 à $1,000 quand le solde atteint $26,500 · Lightning : pas de DLL sur le 25K · Select Daily : la hausse n\'est pas documentée','50k':'Growth : $1,250 devient $2,000 à $53,000 · Lightning : $1,250 devient $2,000 à $53,000 · Select Daily : non documenté','100k':'Growth : $2,500 devient $3,500 à $106,000 · Lightning : $2,500 devient $4,000 à $106,000 · Select Daily : non documenté','150k':'Growth : $3,750 devient $5,000 à $159,000 · Lightning : $3,000 devient $5,250 à $159,000 · Select Daily : non documenté'},
      'DLL — quand la hausse s\'applique':{'25k':'À la session SUIVANTE, jamais dans la seconde. Franchir le seuil pendant la séance de lundi active le nouveau montant lundi soir à 18h00 ET','50k':'idem','100k':'idem','150k':'idem'},
      // Un porteur de compte ancien n'a pas une DLL plus grande : il n'en a PLUS.
      'DLL — comptes legacy':     {'25k':'Compte acheté avant le 12 sept. 2025 8h00 EST — à +6% de profit la DLL est purement SUPPRIMÉE, pas relevée','50k':'idem','100k':'idem','150k':'idem'},
      // L'avertissement que Tradeify répète dans deux articles.
      'DLL — avertissement':      {'25k':'Ne JAMAIS s\'en servir comme stop loss. Ce n\'est pas un arrêt dur — la perte peut dépasser le seuil avant que la protection ne se déclenche, et le slippage peut alors casser le drawdown max, qui lui tue le compte définitivement','50k':'idem','100k':'idem','150k':'idem'},
      'DLL contre drawdown max':  {'25k':'Deux limites distinctes. Si le drawdown max est plus proche que la DLL, on le touche EN PREMIER et le compte échoue avant que la pause ne se déclenche','50k':'idem','100k':'idem','150k':'idem'},
      'Jours de trading min':     {'25k':'1 jour (Growth) · 3 jours (Select à cause 40% consist)','50k':'idem','100k':'idem','150k':'idem'},
      // Le minimum de l'ÉVALUATION ne dit rien du minimum pour RETIRER. Growth
      // exige 5 journées profitables avant un payout, Select Flex 5 journées
      // gagnantes ; Select Daily et Lightning n'en demandent aucune.
      'Jours min avant payout':   {'25k':'Growth : 5 journées profitables · Select Flex : 5 journées gagnantes · Select Daily : aucune, éligibilité quotidienne · Lightning Funded : aucune','50k':'idem','100k':'idem','150k':'idem'},
      // ⚠️ Seul le 25K est SOURCÉ : la note Tradeify 3.0 écrit « Flex Path : 5
      // profitable days ($100 or more per day) ». Le catalogue portait $50.
      // Les trois autres tailles viennent d'une analyse tierce et restent
      // NON VÉRIFIÉES — aucun des six articles ne les donne.
      'Profit min jour valide':   {'25k':'$100 (Select Flex, publié)','50k':'$100 (non vérifié)','100k':'$200 (non vérifié)','150k':'$300 (non vérifié)'},
      // === CONSISTENCY (par famille et phase) ===
      'Consistency Select (eval)':{'25k':'40% (Best day ≤ 40% du profit total)','50k':'40%','100k':'40%','150k':'40%'},
      // ⚠️ AUCUNE consistance en FINANCÉ sur Select — les deux politiques. Le help
      // center le dit deux fois, dans deux articles : « the 40% consistency
      // requirement only applies during the evaluation phase […] removed
      // regardless of which payout policy (Flex or Daily) you choose » et « There
      // is no consistency rule for Select accounts in funded mode ».
      // Le catalogue portait 50% pour Flex et « balance-based » pour Daily :
      // deux contraintes inventées, sur la phase où le trader retire son argent.
      'Consistency Select Flex (funded)':{'25k':'AUCUNE en financé (la règle 40% ne vaut qu\'en évaluation)','50k':'AUCUNE en financé','100k':'AUCUNE en financé','150k':'AUCUNE en financé'},
      'Consistency Select Daily (funded)':{'25k':'AUCUNE en financé (la règle 40% ne vaut qu\'en évaluation)','50k':'AUCUNE en financé','100k':'AUCUNE en financé','150k':'AUCUNE en financé'},
      'Consistency Growth':       {'25k':'Eval : AUCUNE (unrestricted) · Funded : 35%','50k':'idem','100k':'idem','150k':'idem'},
      // ⚠️ Le « 150K : 35% dès le premier jour » venait d'une analyse tierce. Les
      // deux articles officiels (Lightning Funded, Rules: Consistency) ne font
      // AUCUNE distinction par taille : c'est 20/25/30 progressif pour tous les
      // comptes achetés après le 12 sept. 2025 8h00 EST, et 20% fixe avant.
      'Consistency Lightning':    {'25k':'Après 12 sept. 2025 : 20% (1er payout) → 25% (2e) → 30% (3e et suivants) · Avant : 20% fixe sur tous les payouts','50k':'idem','100k':'idem','150k':'idem'},
      // === TRADING RESTRICTIONS ===
      // ⚠️ « INTERDIT » tout court était trompeur. L'article consacre une FAQ
      // entière à la nuance : on peut tenir une position 23 heures d'affilée si
      // elle reste dans UNE session. Ce qui est interdit, c'est de traverser la
      // clôture, la maintenance ou le week-end.
      'Positions overnight':      {'25k':'Pas de swing d\'une journée sur l\'autre. En revanche rester positionné toute la session est autorisé — elle court de 18h00 ET à 16h45 ET le lendemain, soit près de 23 heures. Ouvrir à 20h lundi et fermer à 14h mardi est parfaitement régulier','50k':'idem','100k':'idem','150k':'idem'},
      'Heures de marché':         {'25k':'Ouverture à 18h00 ET du dimanche au jeudi, clôture à 17h00 ET du lundi au vendredi, coupure de maintenance de 17h00 à 18h00 ET','50k':'idem','100k':'idem','150k':'idem'},
      'Heure de clôture obligatoire':{'25k':'Tout doit être plat à 16h45 ET, avant la maintenance. Les jours fériés écourtés, c\'est 12h59 ET — les horaires sont annoncés sur le Discord et il faut les vérifier avant de trader','50k':'idem','100k':'idem','150k':'idem'},
      // Rassurant et rarement dit : l'auto-close ne casse pas le compte.
      'Position ouverte à la clôture':{'25k':'Tradeify la ferme automatiquement. Cette fermeture d\'office ne fait PAS échouer le compte et ne le fait pas perdre — mais le fill peut être défavorable','50k':'idem','100k':'idem','150k':'idem'},
      // Décisif pour compter les journées de trading exigées avant un payout.
      'Définition du jour de trading':{'25k':'De 18h00 ET à 17h00 ET le lendemain. Un trade à 1h du matin mardi et un trade à 19h mardi comptent donc pour DEUX journées différentes — le premier appartient à la session ouverte lundi 18h, le second à celle ouverte mardi 18h. Un jour férié écourté compte comme une journée entière','50k':'idem','100k':'idem','150k':'idem'},
      'Rithmic et demi-journées fériées':{'25k':'Sur le broker Rithmic, une séance écourtée de jour férié est enregistrée à la clôture PLEINE suivante. La journée compte bien, mais le crédit — et le payout qui en dépend — n\'arrive qu\'ensuite. Un vendredi férié est enregistré à la clôture du lundi','50k':'idem','100k':'idem','150k':'idem'},
      'Week-end':                 {'25k':'Tout doit être fermé avant la clôture du vendredi à 16h45 ET. Impossible de porter une position jusqu\'à la réouverture du dimanche soir','50k':'idem','100k':'idem','150k':'idem'},
      'Trading des news':         {'25k':'Autorisé sans aucune restriction — Tradeify écrit n\'avoir ni règle ni consigne sur les news (NFP, FOMC, CPI, Powell). À vos risques toutefois, le slippage pouvant exécuter un ordre loin du prix attendu','50k':'idem','100k':'idem','150k':'idem'},
      // La règle qui bloque les payouts sans casser le compte. Elle ne vaut
      // qu'en financé — un scalpeur passe donc l'évaluation sans la voir venir.
      'Microscalping (financé)':  {'25k':'Sur compte financé, plus de 50% des trades doivent durer PLUS de 10 secondes ET plus de 50% du profit doit venir de trades tenus plus de 10 secondes. Critère non rempli, aucune demande de payout n\'est possible. Ne s\'applique pas pendant l\'évaluation','50k':'idem','100k':'idem','150k':'idem'},
      'DCA (renforcement)':       {'25k':'Autorisé partout','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'Algos / copy trading':     {'25k':'Algos OK · HFT INTERDIT · Copy entre VOS comptes OK · pas inter-foyer','50k':'idem','100k':'idem','150k':'idem'},
      // === CONTRATS ===
      'Contrats max (mini)':      {'25k':'1 (Select/Growth · Lightning n/a)','50k':'4','100k':'8','150k':'12'},
      'Contrats max (micro)':     {'25k':'10','50k':'40','100k':'80','150k':'120'},
      // Un compte acheté avant le 12 sept. 2025 8h00 EST garde une taille de
      // position PLUS GRANDE. Servir la grille actuelle à ces porteurs les
      // brimerait sur une limite qui ne les concerne pas.
      'Contrats max (avant 12 sept. 2025)':{'25k':'Inchangé : 1 mini / 10 micros','50k':'5 minis / 50 micros','100k':'10 minis / 100 micros','150k':'15 minis / 150 micros'},
      'Minis et micros ensemble': {'25k':'Autorisé — l\'ancienne interdiction de tenir minis et micros en même temps a été levée, la fongibilité côté broker ayant fermé la faille qui permettait de dépasser sa limite. Deux choses tiennent toujours, la position combinée doit rester dans la limite de contrats (10 micros = 1 mini), et en sens OPPOSÉ sur un produit identique ou corrélé cela reste un hedge interdit','50k':'idem','100k':'idem','150k':'idem'},
      // === HEDGING (article dédié — la règle la plus sévère du catalogue) ===
      'Hedging':                  {'25k':'INTERDIT. Aucune position opposée — une longue et une courte — sur le même instrument ni sur deux produits d\'un même groupe. Vaut en évaluation, en sim funded et en Elite Live','50k':'idem','100k':'idem','150k':'idem'},
      // La table officielle des groupes. Écrite SANS séparateur « · » à dessein :
      // des parenthèses en majuscules après un « · » feraient croire au parseur
      // qu'il lit un ciblage de programme, et la cellule s'annulerait.
      'Hedging — groupes de produits':{'25k':'Indices actions (ES, MES, NQ, MNQ, YM, MYM, RTY, M2K, EMD, NKD, FDAX, FDXM, FDXS, FESX, FSXE, FXXP) ; Énergie (CL, QM, MCL, NG, QG) ; Métaux (GC, QO, MGC, SI, HG, PL, PA) ; Devises (6E, M6E, 6B, 6J, 6A, M6A, 6C, 6S) ; Taux (FGBL, FGBM, FGBS, FGBX) ; Céréales (ZS, ZL, ZM, ZC, ZW) ; Bétail (HE, LE, GF) ; Volatilité (FVS). Un mini et son micro appartiennent toujours au même groupe. La volatilité évoluant à l\'inverse des actions, être long sur un indice ET long sur FVS est aussi traité comme compensatoire. La liste n\'est pas limitative','50k':'idem','100k':'idem','150k':'idem'},
      // C'est le point le plus coûteux, et le moins connu : le hedge éclaté sur
      // deux comptes est traité exactement comme le hedge sur un seul.
      'Hedging — entre comptes':  {'25k':'La règle vaut sur TOUS les comptes que vous contrôlez, financés ou non. Long ES sur A et short ES sur B est une violation ; long ES sur A et short NQ sur B aussi, les deux étant des indices actions ; long MES contre short NQ également, la taille du contrat n\'exempte de rien. Même sens sur deux comptes en revanche est permis — c\'est ainsi que fonctionne le copy trading. Un compte cassé qui garde une position opposée à un compte actif peut suffire à déclencher l\'alerte','50k':'idem','100k':'idem','150k':'idem'},
      'Hedging — détection automatique':{'25k':'Présente sur tous les comptes. Le contrôle automatique ne casse le compte que si les TROIS conditions sont réunies en même temps — positions opposées, hedge tenu plus de 10 secondes, et profit tiré du hedge supérieur à $150. Cette fenêtre de 10 secondes existe pour rattraper une erreur de saisie, pas pour hedger brièvement exprès. Le hedge entre comptes et entre produits corrélés est, lui, examiné à part par l\'équipe risque','50k':'idem','100k':'idem','150k':'idem'},
      'Hedging — conséquences':   {'25k':'Disqualification en évaluation, refus de payout, compte passé en statut de violation — et pour une violation entre comptes, TOUS les comptes concernés. S\'y ajoutent la confiscation des profits générés pendant la période de violation et, pour une manœuvre délibérée ou répétée, un bannissement définitif','50k':'idem','100k':'idem','150k':'idem'},
      'Scaling micro requis':     {'25k':'Oui pour Lightning post-12-sept-2025','50k':'idem','100k':'idem','150k':'idem'},
      // === TARIFS (one-time, codes promo permanents -33/-50%) ===
      'Prix Select (one-time)':   {'25k':'$109','50k':'$165','100k':'$265','150k':'$369'},
      'Prix Growth (one-time)':   {'25k':'$99','50k':'$145','100k':'$255','150k':'$369'},
      'Prix Lightning (one-time)':{'25k':'$345','50k':'$492','100k':'$660','150k':'$796'},
      'Frais activation':         {'25k':'$0 (waived sur tous plans)','50k':'$0','100k':'$0','150k':'$0'},
      'Reset cost':               {'25k':'$95 toutes tailles','50k':'$95','100k':'$95','150k':'$95'},
      'Codes promo permanents':   {'25k':'DASH, PTV (~33-50% courant)','50k':'idem','100k':'idem','150k':'idem'},
      // === PAYOUTS (split différent par famille !) ===
      'Profit split Select':      {'25k':'90% flat (pas de 100% premier $X)','50k':'90% flat','100k':'90% flat','150k':'90% flat'},
      'Profit split Growth':      {'25k':'100% premier $15,000 cumul puis 90/10','50k':'idem','100k':'idem','150k':'idem'},
      'Profit split Lightning':   {'25k':'100% premier $15,000 cumul puis 90/10','50k':'idem','100k':'idem','150k':'idem'},
      'Min payout balance':       {'25k':'$1,500 above starting (Growth/Lightning) · varies (Select)','50k':'idem','100k':'idem','150k':'idem'},
      'Cap payout Growth':        {'25k':'$1,000 par withdrawal','50k':'$1,000','100k':'$1,000','150k':'$1,000'},
      // ⚠️ Le catalogue portait « Progressif $1,000 → $1,250 → $3,000 », qui ne
      // correspond à rien de publié. L'article Select donne DEUX grilles, une par
      // politique de retrait, et le plafond Flex est le PLUS PETIT de deux bornes
      // (50% du profit OU le montant) — pas un montant fixe.
      'Cap payout Select Flex':   {'25k':'50% du profit, plafonné à $1,250','50k':'50% du profit, plafonné à $3,000','100k':'50% du profit, plafonné à $4,000','150k':'50% du profit, plafonné à $5,000'},
      'Cap payout Select Daily':  {'25k':'2× le profit de la période, plafonné à $600','50k':'2× le profit, plafonné à $1,000','100k':'2× le profit, plafonné à $1,500','150k':'2× le profit, plafonné à $2,500'},
      // Propre à Select Daily : un buffer conditionne l'éligibilité quotidienne.
      // Select Flex n'en a aucun (« No minimum balance required »).
      'Buffer Select Daily':      {'25k':'$1,100','50k':'$2,100','100k':'$2,600','150k':'$3,600'},
      'Cadence payout':           {'25k':'Windows FIXES : 1-4 et 15-18 de chaque mois (Select/Growth) · Lightning : INSTANT dashboard (24h)','50k':'idem','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'25k':'Rise (primaire crypto USDT/USDC + bank) + Plane (backup wire) — PAS PayPal/ACH direct/Wise','50k':'idem','100k':'idem','150k':'idem'},
      // === PASSAGE EN ELITE LIVE (capital réel) ===
      // Le catalogue décrivait la cagnotte Elite sans dire comment on y accède.
      // C'est pourtant là que se joue la différence entre « compte financé » et
      // « capital réel », et l'ancien système était bien plus fermé.
      'Passage en Elite Live':    {'25k':'5 payouts sur un compte financé le rendent éligible à SON PROPRE compte Elite Live. Aucune limite au nombre de transitions, et jusqu\'à 5 comptes live simultanés. Même chemin pour Select, Growth et Lightning','50k':'idem','100k':'idem','150k':'idem'},
      'Elite Live — plafond de profit sim':{'25k':'AUCUN. On accumule autant de profit simulé qu\'on veut avant de passer en live — l\'ancien programme plafonnait à $100,000','50k':'idem','100k':'idem','150k':'idem'},
      'Elite Live — perte journalière':{'25k':'AUCUNE. Un compte Elite Live n\'a pas de limite de perte journalière, et chaque compte a sa propre structure de performance','50k':'idem','100k':'idem','150k':'idem'},
      // Les porteurs de comptes anciens ne sont PAS migrés d'office : ils
      // choisissent. Leur servir les règles du nouveau programme serait faux.
      'Ancien programme Live':    {'25k':'Comptes achetés avant le 3 décembre : le trader CHOISIT entre le nouveau programme Elite et l\'ancien — un seul compte live et un plafond de $100,000 de profit simulé, après 4 payouts au lieu de 5','50k':'idem','100k':'idem','150k':'idem'},
      // ⚠️ La dotation dépend de la TAILLE du compte, pas du programme. Le
      // catalogue attribuait les $12,000 à « Lightning 150K » et laissait
      // « bonus proportionnel » en 50K et 100K : la note Tradeify 3.0 donne la
      // grille complète, valable pour tout compte passé en Elite Live.
      'Elite Reward Pool':        {'25k':'$2,000 par compte','50k':'$4,000 par compte','100k':'$8,000 par compte','150k':'$12,000 par compte'},
      // Le multiplicateur est RÉSERVÉ à Select, et il se mérite pendant la phase
      // sim funded — pas après. Deux critères, les deux exigés.
      'Elite Reward Pool ×1,5':   {'25k':'$3,000 · réservé à Select : score de consistance SOUS 40% ET jamais dépassé 75% du drawdown max','50k':'$6,000 · mêmes critères','100k':'$12,000 · mêmes critères','150k':'$18,000 · mêmes critères'},
      // La dotation ne se touche pas d'un coup : elle se débloque MOIS PAR MOIS,
      // et un compte qui casse perd le solde restant de sa cagnotte.
      'Elite Live — plafond mensuel':{'25k':'jusqu\'à $1,000 par mois','50k':'jusqu\'à $2,000 par mois','100k':'jusqu\'à $3,000 par mois','150k':'jusqu\'à $4,000 par mois'},
      'Elite Live — conditions du mois':{'25k':'5 journées profitables à $250 ou plus CHACUNE, et finir le mois avec un profit supérieur à $1,000 (le drawdown trailing). Évalué compte par compte ; un compte cassé perd le reste de sa cagnotte','50k':'5 journées à $250+ et profit de fin de mois supérieur à $2,000','100k':'5 journées à $250+ et profit de fin de mois supérieur à $3,000','150k':'5 journées à $250+ et profit de fin de mois supérieur à $4,500'},
      'Elite Live — usage de la cagnotte':{'25k':'Trois options : retirer en argent réel à tout moment · renforcer le compte pour élargir le buffer de drawdown et scaler plus vite · garder en réserve pour recharger après un compte cassé','50k':'idem','100k':'idem','150k':'idem'},
      // === MULTI-COMPTES ===
      'Comptes simul.':           {'25k':'Financés : 5 max simultanés (toutes familles) · Évaluations : 15 max achetées par période de 30 jours, chacune resettable 10 fois','50k':'idem','100k':'idem','150k':'idem'},
      'Activations par jour':     {'25k':'Growth : 5 comptes financés activables par jour (compteur remis à zéro toutes les 24 h UTC) — au-delà, il faut attendre le lendemain','50k':'idem','100k':'idem','150k':'idem'},
      // Le 300K Select existe mais l'article renvoie ses paramètres de risque à
      // une page dédiée qu'on n'a pas : on documente son EXISTENCE et ses
      // conditions d'achat, sans inventer ses chiffres.
      'Select 300K (édition limitée)':{'25k':'Cinquième taille Select, édition limitée : KYC AVANT l\'achat, aucun reset, 3 comptes maximum par personne, et elle ne compte pas dans la limite des 15 évaluations. Paramètres de risque non repris ici','50k':'idem','100k':'idem','150k':'idem'},
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
      // Étiqueté à TOUTES les tailles, pas seulement en 25K : sans ça, un porteur
      // de compte PRO+ voyait 80 % au lieu de 90 %, et son net de payout amputé de
      // 10 points sur un vrai montant.
      'Répartition gains':        {'25k':'PRO : 80/20 · PRO+ : 90/10','50k':'PRO : 80/20 · PRO+ : 90/10','75k':'PRO : 80/20 · PRO+ : 90/10','100k':'PRO : 80/20 · PRO+ : 90/10','150k':'PRO : 80/20 · PRO+ : 90/10'},
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
      // ⚠️ « Flex seulement » en 25K était faux : Rapid ET Builder existent aussi
      // à cette taille, avec le même objectif de $1,500.
      'Objectif de profit':       {'25k':'$1,500 (6%) — Rapid, Builder et Flex','50k':'$3,000 (6%) sur tous les plans, $4,000 pour le Pro One-Day Add-On','100k':'$6,000 (6%) · Rapid/Pro/Scale','150k':'$9,000 (6%) · Rapid/Pro/Scale'},
      'Drawdown Rapid (intraday)':{'25k':'$1,000','50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      // 🌟 LE POINT QUE LA FICHE MANQUAIT : le Rapid ne change pas de MONTANT
      // entre l'évaluation et le financé, il change de MÉCANIQUE. Les tableaux
      // d'évaluation portent « Maximum Loss Limit (EOD) » ; la section sim funded
      // porte « Drawdown Type : Intra-day trailing ». Un trader qui croit son
      // drawdown figé jusqu'à la clôture le découvre en séance.
      'Drawdown Rapid — éval contre financé':{'25k':'En ÉVALUATION le max loss suit la clôture puis se VERROUILLE à $25,100, soit le solde de départ plus $100, et n\'avance plus ; repasser sous ce plancher casse le compte. En SIM FUNDED il devient INTRADAY — il suit le plus haut de l\'équité pendant la séance, à distance constante, et se verrouille à $100','50k':'Même mécanique, verrou d\'évaluation à $50,100 et verrou financé à $100','100k':'Verrou d\'évaluation à $100,100, verrou financé à $100','150k':'Verrou d\'évaluation à $150,100, verrou financé à $100'},
      // La règle générale, énoncée telle quelle dans les guides Builder : le
      // seuil se fige DÉFINITIVEMENT à $100 au-dessus du solde de départ. En
      // financé le solde de départ vaut $0, d'où un verrou à $100 tout court.
      'Verrouillage du max loss': {'25k':'Le seuil se verrouille DÉFINITIVEMENT une fois arrivé à $100 au-dessus du solde de départ, et cesse alors de suivre. Il ne redescend jamais','50k':'idem','100k':'idem','150k':'idem'},
      // Conséquence directe, et jamais dite : le compte financé démarre à ZÉRO.
      // La firme précise même que le solde PEUT devenir négatif avant que le
      // seuil ne remonte au point mort — « expected and normal ».
      'Solde de départ sim funded':{'25k':'$0. Le compte financé ne démarre PAS à la taille nominale — d\'où un verrou de max loss à $100, et l\'obligation de toujours garder au moins $100 sur le compte. Le solde peut passer NÉGATIF avant que le seuil ne remonte au point mort, ce que la firme décrit comme normal','50k':'idem','100k':'idem','150k':'idem'},
      // Ce que le seuil intraday mesure vraiment. Une position ouverte EN GAIN
      // fait monter le seuil immédiatement ; une position ouverte EN PERTE peut
      // casser le compte sans jamais être fermée.
      'Drawdown intraday — ce qui compte':{'25k':'Le plus haut de l\'équité, profits RÉALISÉS ET LATENTS compris. Le seuil monte avec les nouveaux sommets et ne redescend JAMAIS. Une équité qui passe sous le seuil, positions ouvertes incluses, casse le compte même en cours de trade','50k':'idem','100k':'idem','150k':'idem'},
      'Suivi du drawdown sur Tradovate':{'25k':'Ajouter les colonnes DRAWDOWN AUTO LIQ LEVEL (le seuil courant) et DIST DRAWDOWN (la marge restante) au panneau Accounts, via la roue crantée puis Columns','50k':'idem','100k':'idem','150k':'idem'},
      // Une famille entière que le catalogue n'avait pas : le Rapid à drawdown
      // de clôture, avec des paramètres qui ne ressemblent à aucun autre plan.
      'Rapid EOD 50K (plan distinct)':{'25k':'non dispo','50k':'Variante du Rapid à drawdown EOD et non intraday. Objectif $3,000, max loss EOD $2,000, aucune DLL, 3 minis / 30 micros, cohérence de 30% en évaluation (le seuil le plus bas de la firme), 4 journées de trading minimum, news T1 autorisées, règle d\'inactivité de 7 jours','100k':'non dispo','150k':'non dispo'},
      // Le Rapid EOD garde son mécanisme de clôture EN FINANCÉ AUSSI — c'est la
      // seule différence de fond avec le Rapid standard, qui bascule en intraday.
      'Rapid EOD — phase financée':{'25k':'non dispo','50k':'Solde de départ $0, max loss $2,000 en EOD trailing (le seuil ne bouge QU\'À la clôture, jamais en séance), aucune DLL, 3 minis / 30 micros, news T1 INTERDITES, inactivité de 7 jours, et 3 comptes financés au maximum','100k':'non dispo','150k':'non dispo'},
      // Politique de retrait propre au Rapid EOD : un seuil pour le PREMIER
      // payout, un autre pour les suivants — et aucun plafond par cycle.
      'Rapid EOD — payouts':      {'25k':'non dispo','50k':'Buffer de $2,100 à franchir pour le PREMIER payout seulement. Ensuite, chaque payout se débloque dès $500 de profit net depuis le précédent. Aucun plafond par cycle, minimum $500, split 90/10, cadence quotidienne, aucune cohérence exigée','100k':'non dispo','150k':'non dispo'},
      'Règle d\'inactivité':       {'25k':'Au moins un trade tous les 7 jours CALENDAIRES. Sept jours consécutifs sans le moindre trade et le compte peut être fermé','50k':'idem','100k':'idem','150k':'idem'},
      // ⚠️ Core et Pro étaient FUSIONNÉS sous une seule clé, avec le chiffre de
      // Core en 50K. Le tableau d'évaluation ET le tableau sim funded du Pro
      // donnent tous deux $2,000 à cette taille : un porteur Pro 50K se voyait
      // annoncer 25% de marge en MOINS qu'il n'en a. Core, lui, est bien à
      // $1,500 — mais c'est un plan legacy, 50K uniquement.
      'Drawdown Pro (EOD)':       {'25k':'n/a','50k':'$2,000','100k':'$3,000','150k':'$4,500'},
      'Drawdown Core (EOD)':      {'25k':'n/a','50k':'$1,500 (3% EOD trailing, plan legacy)','100k':'n/a','150k':'n/a'},
      // ⚠️ ERREUR DE FOND CORRIGÉE. Le Flex n'a JAMAIS été statique : les quatre
      // articles Flex écrivent tous « Drawdown model : End-of-day (EOD)
      // trailing ». Annoncer un plancher figé à un porteur dont le seuil monte
      // avec ses gains est exactement l'erreur qui casse un compte.
      'Drawdown Flex (EOD trailing)':{'25k':'$1,000','50k':'$2,000','100k':'n/a','150k':'n/a'},
      // Le Flex se verrouille sur un ÉVÉNEMENT, pas sur un seuil de solde : le
      // premier payout fige le seuil à $100 pour toujours.
      'Verrouillage Flex':        {'25k':'Après le PREMIER payout, le max loss passe à $100 et y reste définitivement','50k':'idem','100k':'n/a','150k':'n/a'},
      'Buffer payout (Flex)':     {'25k':'AUCUN buffer exigé — c\'est un différenciateur revendiqué du plan','50k':'AUCUN buffer exigé','100k':'n/a','150k':'n/a'},
      'Jours min avant payout (Flex)':{'25k':'5 journées GAGNANTES, chacune au-dessus du seuil de profit du plan. Le compteur repart à zéro à chaque cycle','50k':'idem','100k':'n/a','150k':'n/a'},
      // Ce que doit rapporter une journée pour COMPTER dans les cinq.
      'Profit min jour valide (Flex)':{'25k':'$100 net','50k':'$150 net','100k':'n/a','150k':'n/a'},
      'Cohérence Flex (payout)':  {'25k':'AUCUNE. Le 50% ne vaut qu\'en évaluation et disparaît au moment de retirer','50k':'idem','100k':'n/a','150k':'n/a'},
      // ⚠️ Les cinq journées gagnantes ne suffisent PAS. Il faut AUSSI un profit
      // net minimum sur le cycle — la firme consacre un exemple entier à ce
      // piège : cinq journées à $100 après une perte de $500 ne donnent rien.
      'Flex — profit net exigé par cycle':{'25k':'$500 de profit net total au moment de la PREMIÈRE demande, puis $250 depuis le payout précédent. Cinq journées gagnantes ne suffisent pas si une grosse perte les annule','50k':'$500 de profit net total à la première demande, puis $500 depuis le payout précédent','100k':'n/a','150k':'n/a'},
      'Flex — scaling en sim funded':{'25k':'La limite de contrats suit le SOLDE. De $0 à $749, 1 mini ou 10 micros ; à partir de $750, 2 minis ou 20 micros. Aucun scaling pendant l\'évaluation','50k':'De $0 à $1,499, 1 mini ou 10 micros ; de $1,500 à $1,999, 2 minis ou 20 micros ; à partir de $2,000, 3 minis ou 30 micros. Aucun scaling pendant l\'évaluation','100k':'n/a','150k':'n/a'},
      'Flex — compte live':       {'25k':'Solde initial de $1,000, solde plancher de $156, aucune DLL, drawdown EOD, retrait minimum $250, 2 minis / 20 micros, split 80/20, payouts quotidiens','50k':'Solde initial de $2,000, solde plancher de $156, aucune DLL, drawdown EOD, retrait minimum $250, 3 minis / 30 micros (4/40 en génération legacy), split 80/20, payouts quotidiens','100k':'n/a','150k':'n/a'},
      // ⚠️ LE PLAN EST EN FIN DE VIE. Le guide 25K l'annonce en tête d'article.
      // Les comptes existants continuent, mais plus aucun ne se vend.
      'Flex — arrêt de la vente': {'25k':'Le plan Flex est arrêté au 5 août à 22h00 EST (l\'article ne précise pas l\'année). Les comptes déjà ouverts continuent de tourner sous leurs règles','50k':'idem','100k':'n/a','150k':'n/a'},
      // Deux générations coexistent, et TOUS les plafonds ont été rabaissés.
      // Servir la grille legacy à un porteur récent lui promettrait le triple.
      'Flex — génération legacy':  {'25k':'Contrats d\'évaluation 3 minis / 30 micros contre 2 aujourd\'hui, palier de scaling montant jusqu\'à 3 minis, plafond de retrait à 50% du profit jusqu\'à $3,000, et compte live à 2 minis / 20 micros','50k':'Contrats d\'évaluation 5 minis / 50 micros contre 3 aujourd\'hui, scaling montant jusqu\'à 5 minis, plafond de retrait à 50% du profit jusqu\'à $5,000, minimum de retrait $250 au lieu de $500, et compte live à 4 minis / 40 micros','100k':'n/a','150k':'n/a'},
      // Propre au 50K, et absent de la fiche : une DLL qu'on ACHÈTE.
      'Flex — option DLL':        {'25k':'non publié','50k':'Add-on facultatif pris au checkout, à prix réduit. Il ajoute une pause douce de $1,000 en intraday, valable en évaluation ET en sim funded. Atteindre le seuil met le trading en pause pour la journée sans casser le compte','100k':'n/a','150k':'n/a'},
      // ⚠️ DEUX erreurs corrigées ici. Le Builder 25K EXISTE (le catalogue le
      // donnait « n/a ») avec un max loss de $1,000. Et le « $1,500 lower-price »
      // n'était pas un 50K moins cher : c'est l'ADD-ON, qui a un max loss plus
      // serré pour le même objectif de $3,000. Le type est par ailleurs EOD
      // TRAILING, pas un buffer fixe — la fiche disait l'inverse.
      'Drawdown Builder (buffer)':{'25k':'$1,000 (EOD trailing)','50k':'$2,000 (EOD trailing)','100k':'n/a','150k':'n/a'},
      'Drawdown Builder Add-On':  {'25k':'n/a','50k':'$1,500 — l\'Add-On a un max loss PLUS SERRÉ que le Builder 50K standard, pour le même objectif de $3,000. C\'est le seul écart entre les deux options, et il se paie moins cher justement parce que le coussin est plus petit','100k':'n/a','150k':'n/a'},
      // ⚠️ Builder n'a AUCUNE cohérence en évaluation — mais 50% AU PAYOUT. Dire
      // « aucune cohérence » tout court laisserait croire qu'on retire librement.
      'Cohérence Builder (payout)':{'25k':'50% sur le CYCLE de payout — la meilleure journée ne peut pas dépasser la moitié du profit du cycle. Calculée au moment de la demande, remise à zéro après chaque payout approuvé. Rien de tel pendant l\'évaluation','50k':'idem','100k':'non dispo','150k':'non dispo'},
      'Builder — politique de payout':{'25k':'Buffer de $1,100 à franchir (max loss + $100), puis $250 de profit net AU-DESSUS du buffer pour le premier payout et $250 depuis le précédent ensuite. Au moins 2 journées tradées dans le cycle. Plafond de $1,000 par cycle, minimum $250, split 80/20, et 5 payouts simulés au maximum','50k':'Buffer de $2,100 en option par défaut ou $1,600 en Add-On, puis $500 de profit net au-dessus du buffer pour le premier payout et $500 depuis le précédent ensuite. Au moins 2 journées tradées. Plafond de $2,000 par cycle, minimum $500, split 80/20, et 5 payouts simulés au maximum','100k':'non dispo','150k':'non dispo'},
      'Builder — premier payout':  {'25k':'Possible 48 heures après le premier trade, à condition que tous les critères soient réunis','50k':'idem','100k':'non dispo','150k':'non dispo'},
      // Le buffer Builder suit la même formule que le Rapid — max loss + $100 —
      // mais il vaut $1,600 en Add-On, dont le max loss est plus serré.
      'Buffer payout (Builder)':  {'25k':'$1,100','50k':'$2,100 (option par défaut) · $1,600 (Add-On)','100k':'n/a','150k':'n/a'},
      // ⚠️ Ce n'est PAS le minimum de l'évaluation (1 jour) : c'est le nombre de
      // journées tradées exigées dans le cycle pour pouvoir demander un payout.
      'Jours min avant payout (Builder)':{'25k':'2 journées tradées dans le cycle','50k':'2 journées tradées dans le cycle','100k':'n/a','150k':'n/a'},
      // Le nombre de comptes financés simultanés n'est PAS le même selon le plan.
      'Builder — comptes simultanés':{'25k':'2 comptes sim funded par utilisateur. Après un breach, le suivant ne peut être activé qu\'à la journée de trading suivante','50k':'UN SEUL compte sim funded par utilisateur, contre 2 sur le Builder 25K. Après un breach, le suivant ne peut être activé qu\'à la journée de trading suivante','100k':'non dispo','150k':'non dispo'},
      'Builder — passage en live': {'25k':'Après le 5e payout simulé approuvé. Drawdown de $1,000 en EOD trailing, figé une fois le seuil arrivé à $0, minimum de retrait $250, split 80/20, payouts quotidiens traités en quelques minutes, AUCUNE perte journalière ni cohérence, un seul compte live','50k':'Après le 5e payout simulé approuvé. Drawdown de $2,000 ou $1,500 selon l\'option choisie au checkout, minimum de retrait $250, split 80/20, payouts quotidiens, DLL de $1,000 maintenue en live, aucune cohérence, un seul compte live','100k':'non dispo','150k':'non dispo'},
      // Une sanction lourde et peu connue : casser le compte LIVE gèle aussi le
      // sim, et interdit tout achat pendant trois semaines.
      'Builder — après un breach live':{'25k':'21 jours calendaires de gel. Tout trading sur compte sim funded est interdit, et aucun achat d\'évaluation, reset ou compte supplémentaire n\'est possible. Les restrictions tombent au terme des 21 jours','50k':'idem','100k':'non dispo','150k':'non dispo'},
      // ⚠️ Le Builder 25K n'a AUCUNE DLL. La fiche lui attribuait les $1,000 du
      // 50K, soit une contrainte qui n'existe pas à cette taille.
      'Daily Loss Limit':         {'25k':'Rapid : aucune · Pro : aucune · Flex : aucune · Builder : aucune','50k':'Rapid : aucune · Rapid EOD : aucune · Pro : aucune · Flex : aucune sauf add-on · Builder : $1,000 (pause douce, ne casse pas le compte)','100k':'Rapid : aucune · Pro : aucune · Builder : non dispo','150k':'Rapid : aucune · Pro : aucune · Builder : non dispo'},
      // ⚠️ DEUX SOURCES OFFICIELLES SE CONTREDISENT. L'aperçu « Payout Policy
      // Overview » affirme « No daily loss limits on Builder, Rapid or Pro
      // plans ». Le guide Builder 50K écrit l'inverse QUATRE fois — tableau
      // d'évaluation, tableau sim funded, FAQ dédiée et tableau live. On retient
      // le guide dédié : il est granulaire, l'aperçu est une page de vente qui
      // résume quatre plans en une ligne. Et se tromper dans ce sens-là ferait
      // découvrir la pause au trader en pleine séance.
      'DLL — contradiction de sources':{'25k':'Néant à cette taille, les deux sources s\'accordent','50k':'L\'aperçu commercial des payouts annonce aucune DLL sur Builder ; le guide Builder 50K en documente une de $1,000 à quatre reprises. C\'est le guide dédié qui fait foi ici','100k':'sans objet','150k':'sans objet'},
      // ⚠️ « 1 jour minimum » partout était FAUX et dangereux dans ce sens-là :
      // un trader Rapid qui atteint son objectif en une séance croyait avoir
      // fini. Seul Builder demande 1 jour. Rapid et Pro en demandent 2, et le
      // Rapid EOD 4. Flex n'apparaît dans aucun des tableaux publiés.
      'Jours de trading min (eval)':{'25k':'Builder : 1 jour · Rapid : 2 jours · Flex : 2 jours','50k':'Builder : 1 jour · Rapid : 2 jours · Rapid EOD : 4 jours · Pro : 2 jours · Flex : 2 jours','100k':'Rapid : 2 jours · Pro : 2 jours','150k':'Rapid : 2 jours · Pro : 2 jours'},
      // ⚠️ Le 50% n'est pas universel. L'article de cohérence nomme EXPLICITEMENT
      // « Rapid & Pro » et personne d'autre ; le tableau Builder porte « None » ;
      // le Rapid EOD est à 30% ; le Pro One-Day Add-On n'en a aucune. Attribuer
      // 50% à Builder inventait une contrainte sur le plan qui n'en a pas.
      'Règle de cohérence (eval)':{'25k':'Rapid : 50% · Flex : 50% · Builder : AUCUNE','50k':'Rapid : 50% · Rapid EOD : 30% · Pro : 50% · Flex : 50% · Builder : AUCUNE · Pro One-Day Add-On : aucune','100k':'Rapid : 50% · Pro : 50%','150k':'Rapid : 50% · Pro : 50%'},
      // Le calcul, et surtout ce qui arrive quand on dépasse. Beaucoup de fiches
      // laissent croire à un breach : c'est faux, on trade simplement plus.
      'Cohérence — le calcul':    {'25k':'Objectif de profit divisé par 2 égale le profit maximum sur une seule journée. Sur un 50K à $3,000 d\'objectif, aucune journée ne doit dépasser $1,500','50k':'idem','100k':'idem','150k':'idem'},
      'Cohérence — si dépassée':  {'25k':'Rien ne casse. Dépasser le seuil ne breach PAS le compte — il suffit de trader des journées supplémentaires jusqu\'à ce que la cohérence soit rétablie','50k':'idem','100k':'idem','150k':'idem'},
      'Cohérence en sim funded':  {'25k':'AUCUNE. La règle ne vaut qu\'en évaluation et disparaît entièrement en sim funded, y compris pour demander un payout','50k':'idem','100k':'idem','150k':'idem'},
      // === SIM FUNDED → LIVE (transitions par plan) ===
      'Sim→Live trigger Rapid':   {'25k':'$10,000 de profit net sur UNE SEULE journée de trading — la bascule est alors AUTOMATIQUE. Sinon, une performance de payouts jugée régulière par l\'équipe risque','50k':'idem','100k':'idem','150k':'idem'},
      'Sim→Live trigger Pro':     {'25k':'n/a','50k':'3 payouts consécutifs, OU le profit qui DÉPASSE le plafond de $100,000 de payouts, reversé sur le compte live jusqu\'à $5,000','100k':'3 payouts consécutifs, ou l\'excédent au-delà de $100,000 reversé jusqu\'à $7,500','150k':'3 payouts consécutifs, ou l\'excédent au-delà de $100,000 reversé jusqu\'à $10,000'},
      'Sim→Live trigger Flex/Builder':{'25k':'Flex : 5 payouts consécutifs approuvés sur le même compte, OU le plafond cumulé de $100,000 de payouts simulés, OU une décision de l\'équipe risque · Builder : mêmes trois voies, 5 payouts consécutifs, le plafond de $100,000 ou la décision de l\'équipe risque','50k':'idem','100k':'n/a','150k':'n/a'},
      'LIVE Rapid spécifique':    {'25k':'EOD drawdown remplace intraday · contrats ÷2 · cooldown 21j après breach · $5K carry-over via Reserve Program','50k':'idem','100k':'idem','150k':'idem'},
      'LIVE Pro initial funding': {'25k':'n/a','50k':'Solde statique entre $2,000 et $5,000','100k':'Solde statique entre $3,000 et $7,500','150k':'Solde statique entre $4,500 et $10,000'},
      'LIVE Pro balance withdraw':{'25k':'n/a','50k':'20 journées gagnantes rapportant CHACUNE au moins 4% de la dotation initiale, plus 3 payouts. La dotation se débloque alors et se retire jusqu\'à un plancher de $140. Sur une dotation de $5,000, cela fait 20 journées à $200 minimum','100k':'idem','150k':'idem'},
      // === CONTRATS ===
      // ⚠️ Les limites de contrats étaient fausses à presque toutes les tailles,
      // et toujours dans le sens généreux — un trader qui suivait la fiche
      // dépassait sa limite, ce qui peut breacher le compte. Rapid 25K vaut 3
      // minis et non 2, Rapid 100K en vaut 8 et non 10, Rapid 150K en vaut 10 et
      // non 15. Pro a sa propre grille, plus serrée que Rapid partout.
      'Contrats max éval (mini)': {'25k':'Rapid : 3 · Builder : 2 · Flex : 2','50k':'Rapid : 5 · Rapid EOD : 3 · Pro : 3 · Flex : 3 · Builder : 4 · Core : 5 · Scale : 3','100k':'Rapid : 8 · Pro : 6','150k':'Rapid : 10 · Pro : 9 · Scale : 9'},
      'Contrats max éval (micro)':{'25k':'Rapid : 30 · Builder : 20 · Flex : 20','50k':'Rapid : 50 · Rapid EOD : 30 · Pro : 30 · Flex : 30 · Builder : 40 · Scale : 15','100k':'Rapid : 80 · Pro : 60','150k':'Rapid : 100 · Pro : 90 · Scale : 45'},
      // ⚠️ « étend en sim funded » était faux : la grille est IDENTIQUE à celle de
      // l'évaluation. Dépasser l'équivalent en micros peut breacher le compte.
      'Contrats sim funded':      {'25k':'Rapid : 3 minis / 30 micros (identique à l\'évaluation) · Builder : 2 minis / 20 micros · Flex : selon le solde, voir le scaling','50k':'Rapid : 5 minis / 50 micros · Rapid EOD : 3 minis / 30 micros · Builder : 4 minis / 40 micros · Flex : selon le solde · Pro : 5 minis / 5 micros','100k':'Rapid : 8 minis / 80 micros · Pro : 10 minis / 10 micros','150k':'Rapid : 10 minis / 100 micros · Pro : 15 minis / 15 micros'},
      'Contrats LIVE':            {'25k':'Rapid : moitié de la grille d\'évaluation · Flex : 2 minis / 20 micros','50k':'Rapid : moitié de la grille · Flex : 3 minis / 30 micros (4/40 en génération legacy) · Pro : 2 à 4 selon la dotation','100k':'Pro : 3 à 5 selon la dotation','150k':'Pro : 4 à 6 selon la dotation'},
      // === TRADING RESTRICTIONS ===
      'Positions overnight':      {'25k':'INTERDIT (Rapid/Core/Flex/Builder) · Pro AUTORISÉ (swing-friendly)','50k':'INTERDIT sauf Pro','100k':'INTERDIT sauf Pro','150k':'INTERDIT sauf Pro'},
      'Auto-liquidation':         {'25k':'16:10 EST (positions auto-close) · breach après = payout denial','50k':'16:10 EST','100k':'16:10 EST','150k':'16:10 EST'},
      // ⚠️ La fiche décrivait une fenêtre plate de 2 minutes. Les articles Rapid
      // sont bien plus tranchants : en sim funded, AUCUN trading de news T1.
      // Une fenêtre laisse croire qu'on peut trader entre deux annonces.
      'News Tier-1 (Rapid/Pro)':  {'25k':'🚨 AUTORISÉES en évaluation, INTERDITES en sim funded. L\'article Rapid l\'écrit sans nuance — aucun trading de news Tier-1 sur le compte financé. Une consigne tierce plus ancienne parlait d\'une fenêtre plate de 2 minutes avant et après CPI, NFP, FOMC, GDP, PPI et Powell ; le help center, lui, ne laisse aucune fenêtre','50k':'🚨 idem','100k':'🚨 idem','150k':'🚨 idem'},
      'News T1 en évaluation':    {'25k':'AUTORISÉES sur tous les plans — chaque tableau d\'évaluation publié porte la mention T1 News Trading « Yes », Rapid, Rapid EOD, Pro et Builder compris','50k':'idem','100k':'idem','150k':'idem'},
      'News Tier-1 (Flex/Builder)':{'25k':'✅ T1 news AUTORISÉES sur funded (UNIQUE sur le marché)','50k':'✅ idem','100k':'n/a','150k':'n/a'},
      'DCA (renforcement)':       {'25k':'Autorisé · scaling micro requis pour comptage','50k':'Autorisé','100k':'Autorisé','150k':'Autorisé'},
      'Algos / automation':       {'25k':'Full auto INTERDIT · Semi-auto OK si manual oversight','50k':'idem','100k':'idem','150k':'idem'},
      // === TARIFS (one-time partout en 2026, mensuel sur Core/Rapid uniquement) ===
      // ⚠️ ERREUR DE MODÈLE, PAS DE MONTANT. Le catalogue vendait ces plans à
      // l'ABONNEMENT (« $129/mois »). La page de checkout porte « One-time
      // payment » sur les quatre plans. Un tarif mensuel présenté comme le coût
      // d'un challenge fausse tout calcul de rentabilité — et dans le mauvais
      // sens, puisqu'il laisse croire à une charge récurrente qui n'existe pas.
      //
      // Seul le 50K a été RELEVÉ sur la page. Les autres tailles gardent les
      // montants d'avant, qui venaient de l'ancien modèle d'abonnement et ne
      // correspondent ni au prix catalogue ni au prix promo : elles sont
      // marquées non vérifiées plutôt que retirées, pour que le pré-remplissage
      // du wizard reste utilisable.
      'Prix Rapid (one-time)':    {'25k':'~$67 (non vérifié)','50k':'$209 catalogue · $105 en promotion courante','100k':'~$229 (non vérifié)','150k':'~$329 (non vérifié)'},
      'Prix Rapid EOD (one-time)':{'25k':'n/a','50k':'$209 catalogue · $105 en promotion courante — même tarif que le Rapid intraday','100k':'n/a','150k':'n/a'},
      'Prix Pro (one-time)':      {'25k':'n/a','50k':'$265 catalogue · $133 en promotion courante','100k':'~$329 (non vérifié)','150k':'~$477 (non vérifié)'},
      'Prix Core (one-time)':     {'25k':'n/a','50k':'~$77 (non vérifié, plan legacy)','100k':'n/a','150k':'n/a'},
      // Le Flex ne figure PLUS sur la page de checkout — une confirmation
      // indirecte de son arrêt de vente. Les tarifs restent pour les porteurs.
      'Prix Flex (one-time)':     {'25k':'~$84 (non vérifié, plan arrêté à la vente)','50k':'~$107 (non vérifié, plan arrêté à la vente)','100k':'n/a','150k':'n/a'},
      // ⚠️ Les remises bougent : le guide Builder annonçait -30% et -40%, la page
      // de checkout affiche environ -50%. On stocke le prix CATALOGUE, stable,
      // et on signale que le montant payé dépend de la promotion du moment.
      'Promotions':               {'25k':'Les tarifs affichés au checkout sont des prix promotionnels, révisés régulièrement. Le relevé d\'août montrait environ -50% sur les quatre plans, là où les guides mentionnaient -30% et -40%','50k':'idem','100k':'idem','150k':'idem'},
      // ⚠️ « Pricing non public — checkout direct » était faux : le guide Builder
      // 50K publie les deux options et leurs paliers de promo. Le tarif du 25K,
      // lui, n'est nulle part dans les deux guides.
      // ⚠️ Le guide donne $153 par défaut et $125 en Add-On ; la page de checkout
      // n'affiche qu'UNE carte Builder, à $125 catalogue, avec la mention
      // « 1.5k or 2k » de drawdown. Les deux se recoupent si le $125 est celui
      // de l'Add-On — mais la page ne le dit pas, donc on garde les deux chiffres.
      'Prix Builder (one-time)':  {'25k':'non publié','50k':'$153 en option par défaut et $125 en Add-On selon le guide · le checkout affiche $125 catalogue et $63 en promotion courante','100k':'n/a','150k':'n/a'},
      'Frais activation':         {'25k':'$0 (waived firm-wide depuis juillet 2025)','50k':'$0','100k':'$0','150k':'$0'},
      'Reset cost':               {'25k':'~$87 (variable selon plan)','50k':'~$157 (Rapid)','100k':'~$267 (Rapid)','150k':'~$347 (Rapid)'},
      'Data fee (Pro classifié)': {'25k':'$0 retail · $130/mois si Professional trader','50k':'idem','100k':'idem','150k':'idem'},
      'Codes promo permanents':   {'25k':'SAVE40 (-40%) · IMAN (20% Rapid, 30% Pro, 50% Flex)','50k':'idem','100k':'idem','150k':'idem'},
      // === PAYOUTS (très variable par plan) ===
      'Répartition gains':        {'25k':'Rapid 90/10 (depuis 12 jan 2026) · Flex 80/20','50k':'Core 80/20 · Rapid 90/10 · Pro 80/20 · Flex 80/20 · Builder 80/20','100k':'Rapid 90/10 · Pro 80/20 · Scale 80/20','150k':'idem 100K'},
      'Payout minimum':           {'25k':'Rapid : $500 · Flex : $250 · Builder : $250','50k':'Rapid : $500 · Flex : $500 (relevé depuis $250 en legacy) · Pro : $1,000 · Builder : $500 · Core : $250 · Scale : $250','100k':'Rapid : $500 · Pro : $1,000 · Scale : $250','150k':'idem 100K'},
      'Cadence payout':           {'25k':'Rapid : quotidienne, 24 h après le premier trade · Flex : 5 journées gagnantes à $100 · Builder : 48 h après le premier trade','50k':'Rapid : quotidienne · Rapid EOD : quotidienne · Flex : 5 journées gagnantes à $150 · Builder : 48 h · Pro : 14 jours calendaires depuis le premier trade · Core : 5 journées gagnantes','100k':'Rapid : quotidienne · Pro : 14 jours calendaires · Scale : 5 journées gagnantes','150k':'idem 100K'},
      'Cap par cycle':            {'25k':'Rapid : aucun une fois le buffer franchi · Flex : 50% du profit, plafonné à $1,000 (abaissé depuis $3,000) · Builder : $1,000','50k':'Rapid : aucun · Rapid EOD : aucun · Pro : aucun · Flex : 50% du profit, plafonné à $2,000 (abaissé depuis $5,000) · Builder : $2,000 · Core : $1,000 sur les 5 premiers cycles · Scale : $1,500 à $3,500 progressif','100k':'Rapid : aucun · Pro : aucun · Scale : $1,500 à $3,500','150k':'idem 100K'},
      // Confirmé au mot près sur les QUATRE articles Rapid. Le $4,600 du 150K
      // avait d'abord été déduit de la formule ; l'article l'a confirmé depuis.
      'Buffer payout (Rapid)':    {'25k':'$1,100 (= max loss d\'évaluation + $100)','50k':'$2,100','100k':'$3,100','150k':'$4,600'},
      'Premier payout (Rapid)':   {'25k':'Disponible exactement 24 heures après le PREMIER trade sur le compte sim funded, sous réserve du buffer et du minimum','50k':'idem','100k':'idem','150k':'idem'},
      'Cohérence pour retirer':   {'25k':'AUCUNE sur Rapid. Le buffer et le minimum de $500 sont les deux seules conditions','50k':'idem','100k':'idem','150k':'idem'},
      'Buffer payout (Pro)':      {'25k':'n/a','50k':'$2,100','100k':'$3,100','150k':'$4,600'},
      // Le carve-out mérite sa propre ligne : c'est une SORTIE anticipée du
      // buffer, à ne pas confondre avec le buffer lui-même.
      'Pro — retrait avant le buffer':{'25k':'n/a','50k':'Un retrait unique reste possible AVANT d\'avoir franchi le buffer, à hauteur de 60% du profit et au minimum $1,000. Les 40% restants doivent rester sur le compte','100k':'idem','150k':'idem'},
      // ⚠️ Le délai court depuis le PREMIER TRADE, pas depuis l'ouverture du
      // compte — et les deux conditions sont cumulatives.
      'Pro — éligibilité au payout':{'25k':'n/a','50k':'Une demande TOUS LES 14 jours calendaires, décomptés depuis le premier trade, et le buffer franchi. Les deux conditions, pas l\'une ou l\'autre. La règle d\'inactivité s\'applique aussi au Pro','100k':'idem','150k':'idem'},
      'Pro — plafond de payouts': {'25k':'n/a','50k':'$100,000 cumulés par utilisateur. Au-delà, l\'excédent bascule sur le compte live au lieu d\'être versé','100k':'idem','150k':'idem'},
      // Le verrou Pro se déclenche sur un ÉVÉNEMENT, comme celui du Flex.
      'Pro — verrouillage du max loss':{'25k':'n/a','50k':'Après le PREMIER payout, le max loss passe à $50,100 et devient statique','100k':'Après le premier payout, il passe à $100,100 et devient statique','150k':'Après le premier payout, il passe à $150,100 et devient statique'},
      'Pro — compte live':        {'25k':'n/a','50k':'Perte journalière comprise entre $700 et $1,800 selon la dotation, 2 à 4 contrats, retrait minimum $250. Un trader live ne peut demander que les fonds AU-DESSUS de sa dotation initiale','100k':'DLL entre $1,000 et $2,000, 3 à 5 contrats, retrait minimum $250','150k':'DLL entre $1,300 et $3,000, 4 à 6 contrats, retrait minimum $250'},
      // ⚠️ Deux pièges dans la même phrase officielle : le jalon ne GARANTIT
      // rien, et une bascule décidée par l'équipe risque FAIT PERDRE le surplus.
      'Pro — bascule décidée par la firme':{'25k':'n/a','50k':'Atteindre $20,000 de profit déclenche une REVUE du compte, sans garantir la bascule. L\'équipe risque peut par ailleurs la décider à tout moment — les profits sont alors transférés dans la limite du maximum du plan, et LE RESTE EST PERDU','100k':'idem','150k':'idem'},
      'Sim et live en même temps':{'25k':'INTERDIT. Dès qu\'un compte live existe, on ne peut plus trader en simulé et en réel simultanément','50k':'idem','100k':'idem','150k':'idem'},
      'Délai payout':             {'25k':'La plupart des demandes sont approuvées INSTANTANÉMENT. Si une revue manuelle se déclenche, comptez 6 à 12 heures ouvrées, jours fériés exclus','50k':'idem','100k':'idem','150k':'idem'},
      'Méthodes payout':          {'25k':'Rise (Riseworks) PRIMAIRE : bank transfer 1-3j ou crypto en minutes · Plaid/ACH (US only) · ⚠ Wise SUPPRIMÉ en 2026','50k':'idem','100k':'idem','150k':'idem'},
      'KYC':                      {'25k':'OBLIGATOIRE avant le premier payout, une seule fois. Depuis le tableau de bord MFFU, Personal Settings puis KYC. Le compte Riseworks se crée ENSUITE','50k':'idem','100k':'idem','150k':'idem'},
      // Une étape que rien ne signalait, et qui ne concerne que le PREMIER
      // retrait : il faut signer des accords avant de toucher quoi que ce soit.
      'Premier payout — accords à signer':{'25k':'Au tout premier payout, un e-mail arrive pour signer des accords via Riseworks. Le versement ne part qu\'une fois signés','50k':'idem','100k':'idem','150k':'idem'},
      'Tax forms':                {'25k':'US : 1099 via Rise direct · Plaid path : 1099 mailé avant 17 fév','50k':'idem','100k':'idem','150k':'idem'},
      // === MULTI-COMPTES ===
      'Comptes funded simul.':    {'25k':'5 maximum tant que le portefeuille ne contient que du 25K et du 50K, dans n\'importe quelle combinaison. Dès qu\'un 100K ou 150K apparaît, le plafond tombe à 3 pour TOUS les comptes','50k':'idem','100k':'3 maximum, toutes tailles confondues','150k':'3 maximum, toutes tailles confondues'},
      // ⚠️ Le plafond général de 5 ne vaut pas partout : plusieurs plans en
      // publient un plus BAS, propre au plan. Servir le 5 à un porteur Builder
      // 50K lui promettrait quatre comptes qu'il ne peut pas ouvrir.
      'Plafonds propres à un plan':{'25k':'Builder : 2 comptes sim funded par utilisateur','50k':'Builder : UN SEUL compte sim funded par utilisateur · Rapid EOD : 3 comptes financés · Flex : 3 comptes sim funded depuis le 24 mars','100k':'non publié','150k':'non publié'},
      // Une limite dans la limite, propre au Flex, avec droit acquis.
      'Plafond 50K Flex':         {'25k':'non dispo','50k':'Depuis le 24 mars, 3 comptes sim funded 50K Flex au maximum. Les traders qui en détenaient avant cette date conservent leur droit acquis à 5','100k':'non dispo','150k':'non dispo'},
      'Évaluations simul.':       {'25k':'10 maximum actives à un instant donné','50k':'idem','100k':'idem','150k':'idem'},
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
      // Les objectifs DIFFÈRENT par programme, et pas proportionnellement :
      // E2L demande beaucoup moins parce que son drawdown est minuscule.
      'Objectif de profit':       {'25k':'E2L : $1,500','50k':'E2L : $2,500 · Fundamental/Premium : $4,000','100k':'E2L : $3,500 · Fundamental/Premium : $6,000','150k':'E2L : $4,500 · Fundamental/Premium : $9,000'},
      // E2L a remplacé l'ancienne famille Static et couvre désormais les 4 tailles.
      // Son drawdown est STATIQUE : il ne suit jamais le solde, d'où des montants
      // bien plus petits que les EOD trailing de Fundamental et Premium.
      'Drawdown E2L (statique)':{'25k':'$500 statique (ne trail jamais)','50k':'$650 statique','100k':'$800 statique','150k':'$1,000 statique'},
      'Drawdown Fundamental/Premium (EOD)':{'25k':'n/a','50k':'$2,500 EOD trailing','100k':'$3,000 EOD','150k':'$4,500 EOD'},
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
      'Prix one-time E2L': {'25k':'$277 (régulier) · $55.40 avec code -80%','50k':'n/a','100k':'n/a','150k':'n/a'},
      'Prix one-time Fundamental':{'25k':'n/a','50k':'$580','100k':'$723','150k':'$863'},
      'Prix one-time Premium':{'25k':'n/a','50k':'$723 (premium swing pricing tiers)','100k':'$900','150k':'$1,123'},
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
      // ⚠ Le 25K demande $2,000, PAS 6 % : c'est la seule taille dont l'objectif
      //   n'est pas proportionnel. Corrigé août 2026.
      'Objectif de profit':       {'25k':'$2,000','50k':'$3,000 (6%)','100k':'$6,000 (6%)','150k':'$9,000 (6%)','250k':'$15,000 (6%)'},
      'Drawdown trailing max (eval)':{'25k':'$1,500 EOD (no lock en éval)','50k':'$2,000 EOD','100k':'$3,600 EOD','150k':'$5,000 EOD','250k':'$6,000 EOD'},
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
      // Style « Étiquette : valeur » partout : l'ancienne parenthèse (Starter/Pro)
      // n'était pas reconnue comme ciblage, et « Instant » ne correspondait pas au
      // nom du modèle « Instant Funded » — le programme rendait null.
      'Drawdown trailing max':    {'50k':'Starter/Pro : $2,000 EOD · Instant Funded : 5% du solde courant (trailing dynamique)','100k':'Starter/Pro : $3,000 EOD · Instant Funded : 5% du solde courant','150k':'Starter/Pro : $5,000 EOD · Instant Funded : 5% du solde courant'},
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
    // ⚠️ VÉRIFIÉ SUR alpha-futures.com EN AOÛT 2026 — la gamme a été RENOMMÉE.
    //    Le catalogue portait Premium / Zero / Advanced ; la page publie
    //    Zero / Standard / Direct, avec des prix différents de ceux stockés
    //    (Zero : $89 au lieu de $79 en 25K, $139 au lieu de $119 en 50K).
    //
    //    Zero      25–100K · évaluation 1 jour · DLL active · consistance 40 % une
    //              fois qualifié · aucun frais d'activation
    //    Standard  50–150K · évaluation 2 jours · pas de DLL en éval · consistance
    //              50 % en éval puis 40 % · aucun frais d'activation
    //    Direct    25–150K · PAS d'évaluation, one-time · consistance 20 %
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
      'Objectif de profit':       {'25k':'Zero : $1,500 · Direct : $1,500 puis $1,000 (Standard non dispo)','50k':'Zero/Standard : $3,000 · Direct : $3,000 puis $2,000','100k':'Zero/Standard : $6,000 · Direct : $6,000 puis $4,000','150k':'Standard : $9,000 · Direct : $9,000 (Zero non dispo)'},
      // MLL — Maximum Loss Limit (EOD trailing, lock starting)
      'MLL (Maximum Loss Limit)': {'25k':'Zero/Direct : $1,000 (EOD trailing, lock au solde initial)','50k':'Zero/Standard/Direct : $2,000','100k':'Zero/Standard/Direct : $3,000','150k':'Standard : $4,500 · Direct : $4,500 (à confirmer — la page tronque, mais le MLL de Direct égale celui de Standard aux trois autres tailles)'},
      // Daily Loss Guard (DLG) — seulement Zero
      'Daily Loss Guard':         {'25k':'Zero : $500 · Direct : $500 (Standard non dispo)','50k':'Zero : $1,000 · Direct : $1,000 · Standard : aucune en éval, $1,000 une fois qualifié','100k':'Zero : $2,000 · Direct : $2,000 · Standard : aucune en éval, $2,000 une fois qualifié','150k':'Standard : aucune en éval, $3,000 une fois qualifié · Direct : $3,000 (à confirmer)'},
      // Min trading days
      'Min jours trading (Eval)': {'25k':'Zero : 1 jour · Direct : aucune évaluation','50k':'Zero : 1 · Standard : 2 · Direct : aucune évaluation','100k':'Zero : 1 · Standard : 2 · Direct : aucune évaluation','150k':'Standard : 2 · Direct : aucune évaluation'},
      'Min jours trading (Qual)': {'25k':'Zero : 5 · Direct : 5','50k':'Zero/Standard/Direct : 5','100k':'Zero/Standard/Direct : 5','150k':'Standard/Direct : 5'},
      // Consistency rule
      'Consistency (Eval)':       {'25k':'Zero : aucune · Direct : aucune évaluation','50k':'Zero : aucune · Standard : 50% · Direct : aucune évaluation','100k':'Zero : aucune · Standard : 50% · Direct : aucune évaluation','150k':'Standard : 50% · Direct : aucune évaluation'},
      'Consistency (Qualified)':  {'25k':'Zero : 40% · Direct : 20%','50k':'Zero/Standard : 40% · Direct : 20%','100k':'Zero/Standard : 40% · Direct : 20%','150k':'Standard : 40% · Direct : 20%'},
      // Profit split (Qualified) — 90% pour tous, immédiat
      'Profit Split (Qualified)': {'25k':'Zero: 90% (immédiat dès 1er payout)','50k':'Premium: 90% · Zero: 90% · Advanced: 90% (immédiat, pas tiered)','100k':'Premium: 90% · Zero: 90% · Advanced: 90%','150k':'Premium: 90% · Advanced: 90% (Zero non dispo)'},
      // Position sizing
      'Contrats max (mini)':      {'25k':'Zero: 1 (Premium/Advanced non dispo en 25K)','50k':'Premium: 4 · Zero: 3 · Advanced: 5','100k':'Premium: 8 · Zero: 6 · Advanced: 10','150k':'Premium: 12 · Advanced: 15 (Zero non dispo)'},
      'Contrats max (micro)':     {'25k':'Zero: 10 (Premium/Advanced non dispo en 25K)','50k':'Premium: 40 · Zero: 30 · Advanced: 50','100k':'Premium: 80 · Zero: 60 · Advanced: 100','150k':'Premium: 120 · Advanced: 150 (Zero non dispo)'},
      'Scaling plan':             {'25k':'Zero: pas de scaling (taille max dès jour 1)','50k':'Premium: pas de scaling · Zero: pas de scaling · Advanced: PAS DE SCALING (taille max dès jour 1)','100k':'Premium: pas de scaling · Zero: pas de scaling · Advanced: pas de scaling','150k':'Premium: pas de scaling · Advanced: pas de scaling (Zero non dispo)'},
      // Pricing — par plan
      'Prix mensuel Standard':    {'25k':'— (Standard commence à 50K)','50k':'$129/mois · aucun frais d\'activation','100k':'$239/mois · aucun frais d\'activation','150k':'$349/mois · aucun frais d\'activation'},
      'Prix mensuel Zero':        {'25k':'$89/mois · 0 activation','50k':'$139/mois · 0 activation','100k':'$279/mois · 0 activation','150k':'— (Zero s\'arrête à 100K)'},
      'Prix one-time Direct':     {'25k':'$349 one-time','50k':'$519 one-time','100k':'$689 one-time','150k':'$859 one-time'},
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
  'FundedNext Futures': {
    // VÉRIFIÉ AOÛT 2026 — sources : fundednext.com/futures, helpfutures.fundednext.com,
    // blog officiel (Rapid Pro vs Rapid Daily), tradetanto, damnpropfirms.
    //
    // ⚠ NE PAS CONFONDRE avec 'FundedNext' dans lib/cfdConstants.js : c'est la MÊME
    //   maison (FundedNext, Dubaï) mais deux produits sans rapport. Le CFD, c'est la
    //   gamme Stellar sur MT4/MT5. Ici c'est du futures CME sur Tradovate. Les règles
    //   n'ont rien en commun — d'où deux entrées distinctes.
    //
    // TROIS PROGRAMMES ACTIFS, tous en UNE SEULE ÉTAPE :
    //   • Flex   (50/100/150K) — le plus récent (mai 2026), objectifs les plus bas
    //   • Legacy (25/50/100K)  — le plus ancien, retraits décapés après 30 benchmark days
    //   • Rapid  (25/50/100K)  — deux variantes, Pro et Daily, 90% de reward share
    //
    // ⚠ BOLT (50K) EST ARRÊTÉ depuis juillet 2026, remplacé par Rapid. Conservé nulle
    //   part ici : un plan qu'on ne peut plus acheter n'a rien à faire dans un
    //   sélecteur de création de compte.
    //
    // MÉCANIQUE COMMUNE : MLL trailing EOD qui monte avec le plus haut solde de fin de
    // journée, ne redescend jamais, et se VERROUILLE au solde initial + $100 une fois
    // que le profit égale le MLL. C'est la mécanique Topstep, pas le trailing intraday.
    //
    // ⚠ CE QUE LE PRÉ-REMPLISSAGE UTILISE : les parseurs (profitTarget, maxDrawdown,
    //   defaultChallengePrice…) lisent le PREMIER nombre de chaque cellule. La première
    //   valeur est donc toujours celle de FLEX là où Flex existe (50/100/150K), et
    //   celle de LEGACY en 25K. Les autres programmes suivent dans la même cellule.
    plans: ['25k','50k','100k','150k'],
    rules: {
      // ⚠ SYNTAXE : chaque cellule est écrite « Modèle : valeur · Modèle : valeur ».
      //   extractModelSegment() (lib/futuresComparison.js) découpe sur « · » puis lit
      //   le préfixe avant « : ». Un préfixe peut citer plusieurs modèles séparés par
      //   « / ». Sans ce format, le comparateur ne sait pas quel programme afficher.
      //   Et « Rapid Pro » / « Rapid Daily » doivent être écrits EN ENTIER : le motif
      //   \bRapid Pro\b ne trouve rien dans un segment étiqueté juste « Rapid ».
      //
      // === OBJECTIFS ET RISQUE ===
      'Objectif de profit':       {'25k':'Legacy : $1,250 · Rapid Pro/Rapid Daily : $1,500','50k':'Flex : $2,500 · Legacy/Rapid Pro/Rapid Daily : $3,000','100k':'Flex : $5,000 · Rapid Pro/Rapid Daily : $5,000 · Legacy : $6,000','150k':'Flex : $8,000 (seul programme en 150K)'},
      'Drawdown trailing max':    {'25k':'Legacy/Rapid Pro/Rapid Daily : $1,000','50k':'Flex : $1,500 · Legacy/Rapid Pro/Rapid Daily : $2,000','100k':'Flex : $2,500 · Rapid Pro/Rapid Daily : $2,500 · Legacy : $3,000','150k':'Flex : $4,000'},
      'Mécanisme MLL':            {'25k':'Trailing EOD sur le plus haut solde de CLÔTURE, verrouillé à $25,100 quand le profit atteint le MLL','50k':'Trailing EOD, verrouillé à $50,100','100k':'Trailing EOD, verrouillé à $100,100','150k':'Trailing EOD, verrouillé à $150,100'},
      'Perte journalière (DLL)':  {'25k':'Rapid Daily : $500 (soft — met la journée en pause, ne tue pas le compte) · Legacy/Rapid Pro : aucune','50k':'Rapid Daily : $1,000 (soft) · Flex/Legacy/Rapid Pro : aucune','100k':'Rapid Daily : $1,250 (soft) · Flex/Legacy/Rapid Pro : aucune','150k':'Flex : aucune'},
      'Règle buffer':             {'25k':'Rapid Daily : solde de clôture ≥ $25,100 + MLL avant que le surplus devienne retirable · Legacy/Rapid Pro : aucune','50k':'Rapid Daily : solde de clôture ≥ $52,100 · Flex/Legacy/Rapid Pro : aucune','100k':'Rapid Daily : solde de clôture ≥ $102,600 · Flex/Legacy/Rapid Pro : aucune','150k':'Flex : aucune'},
      // === VALIDATION ET CONSISTANCE ===
      'Jours de trading min':     {'25k':'Legacy : 5 benchmark days avant le 1er retrait · Rapid Pro/Rapid Daily : 0','50k':'Flex/Legacy : 5 benchmark days · Rapid Pro/Rapid Daily : 0','100k':'Flex/Legacy : 5 benchmark days · Rapid Pro/Rapid Daily : 0','150k':'Flex : 5 benchmark days'},
      'Profit min jour valide':   {'25k':'Aucun seuil $ publié pour valider un benchmark day','50k':'Aucun seuil $ publié','100k':'Aucun seuil $ publié','150k':'Aucun seuil $ publié'},
      'Consistency (éval)':       {'25k':'Legacy : 40% · Rapid Pro/Rapid Daily : aucune','50k':'Flex/Legacy : 40% · Rapid Pro/Rapid Daily : aucune','100k':'Flex/Legacy : 40% · Rapid Pro/Rapid Daily : aucune','150k':'Flex : 40%'},
      'Consistency (financé)':    {'25k':'Rapid Pro : 40% · Legacy/Rapid Daily : aucune','50k':'Rapid Pro : 40% · Flex/Legacy/Rapid Daily : aucune','100k':'Rapid Pro : 40% · Flex/Legacy/Rapid Daily : aucune','150k':'Flex : aucune'},
      // === TRADING ===
      'Positions overnight':      {'25k':'INTERDIT — flat obligatoire à 15h10 CT','50k':'INTERDIT — flat à 15h10 CT','100k':'INTERDIT — flat à 15h10 CT','150k':'INTERDIT — flat à 15h10 CT'},
      'Trading des news':         {'25k':'Aucune restriction (différenciateur vs Topstep et MFFU)','50k':'Aucune restriction','100k':'Aucune restriction','150k':'Aucune restriction'},
      'Contrats max (éval)':      {'25k':'Legacy : 2 mini + 20 micro · Rapid Pro/Rapid Daily : 2 mini + 10 micro','50k':'Flex : 3 mini + 30 micro · Legacy : 3 mini + 30 micro · Rapid Pro/Rapid Daily : 3 mini + 15 micro','100k':'Flex : 5 mini + 50 micro · Legacy : 5 mini + 50 micro · Rapid Pro/Rapid Daily : 5 mini + 25 micro','150k':'Flex : 8 mini + 80 micro'},
      'Contrats max (financé)':   {'25k':'Legacy : 3 mini + 30 micro · Rapid Pro/Rapid Daily : 3 mini + 15 micro','50k':'Flex : 3 mini + 30 micro · Legacy : 5 mini + 50 micro · Rapid Pro/Rapid Daily : 5 mini + 25 micro','100k':'Flex : 5 mini + 50 micro · Legacy : 7 mini + 70 micro · Rapid Pro/Rapid Daily : 7 mini + 35 micro','150k':'Flex : 8 mini + 80 micro'},
      'Plateformes':              {'25k':'Tradovate (défaut), NinjaTrader, TradingView via Tradovate, Rithmic','50k':'Tradovate (défaut), NinjaTrader, TradingView, Rithmic','100k':'Tradovate (défaut), NinjaTrader, TradingView, Rithmic','150k':'Tradovate (défaut), NinjaTrader, TradingView, Rithmic'},
      // === TARIFS — one-time, AUCUN frais d'activation, AUCUN abonnement mensuel ===
      // ⚠ FundedNext promotionne en quasi-permanence. Les montants « promo » sont ceux
      //   relevés en août 2026 : indicatifs, pas un tarif stable.
      'Prix (one-time)':          {'25k':'Legacy : $79.99 · Rapid Pro/Rapid Daily : $84.79 promo (list $159.98)','50k':'Flex : $69.99 promo (list $133.99) · Legacy : $199.99 · Rapid Pro/Rapid Daily : $158.99 promo (list $299.98)','100k':'Flex : $129.99 promo (list $249.99) · Legacy : $239.99 · Rapid Pro/Rapid Daily : $264.99 promo (list $499.98)','150k':'Flex : $249.99 promo (list $483.99)'},
      'Frais activation':         {'25k':'$0 — aucun frais d\'activation ni abonnement mensuel','50k':'$0','100k':'$0','150k':'$0'},
      'Coût du reset':            {'25k':'Non confirmé à 2 sources','50k':'Flex : $77.99 · Legacy/Rapid Pro/Rapid Daily : non confirmé','100k':'Flex : $144.99 · Legacy/Rapid Pro/Rapid Daily : non confirmé','150k':'Flex : $278.99'},
      // === PAYOUTS ===
      // fundednext.com/futures affiche « Reward Share 95% » dans le bloc de règles
      // Flex, et « Withdraw 95% of your reward » en tête de l'offre. Le 80 %
      // stocké venait d'une analyse tierce.
      'Répartition gains':        {'25k':'Legacy : 80% · Rapid Pro/Rapid Daily : 90%','50k':'Flex : 95% · Legacy : 80% · Rapid Pro/Rapid Daily : 90%','100k':'Flex : 95% · Legacy : 80% · Rapid Pro/Rapid Daily : 90%','150k':'Flex : 95%'},
      'Cadence payout':           {'25k':'Legacy : après 5 benchmark days · Rapid Pro : tous les 3 jours · Rapid Daily : quotidien','50k':'Flex/Legacy : après 5 benchmark days · Rapid Pro : tous les 3 jours · Rapid Daily : quotidien','100k':'Flex/Legacy : après 5 benchmark days · Rapid Pro : tous les 3 jours · Rapid Daily : quotidien','150k':'Flex : après 5 benchmark days'},
      'Plafond par cycle':        {'25k':'Legacy : 50% du profit plafonné $3,000, décapé après 30 benchmark days · Rapid Pro/Rapid Daily : $800','50k':'Flex : 50% plafonné $1,500 · Legacy : 50% plafonné $6,000, décapé après 30 benchmark days · Rapid Pro/Rapid Daily : $1,200','100k':'Flex : 50% plafonné $2,500 · Legacy : 50% plafonné $6,000, décapé après 30 benchmark days · Rapid Pro/Rapid Daily : $2,500','150k':'Flex : 50% du profit plafonné $4,000'},
      'Fin du compte':            {'25k':'Legacy/Rapid Pro/Rapid Daily : pas de limite de retraits','50k':'Flex : le compte SE TERMINE après le 5e retrait · Legacy/Rapid Pro/Rapid Daily : pas de limite','100k':'Flex : se termine après le 5e retrait · Legacy/Rapid Pro/Rapid Daily : pas de limite','150k':'Flex : se termine après le 5e retrait'},
      'Payout minimum':           {'25k':'DISPUTÉ : $250 (help center) contre $500 par cycle (analyses tierces)','50k':'DISPUTÉ : $250 contre $500','100k':'DISPUTÉ : $250 contre $500','150k':'DISPUTÉ : $250 contre $500'},
      'Délai de traitement':      {'25k':'~24h annoncé, bonus $1,000 si dépassé','50k':'~24h annoncé, bonus $1,000 si dépassé','100k':'~24h annoncé, bonus $1,000 si dépassé','150k':'~24h annoncé, bonus $1,000 si dépassé'},
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
  'FundedNext Futures',
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
  'FundedNext Futures':     '#00a99d',
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
const CUSTOM_FIRM_PROGRAMS = {}
export const CUSTOM_FIRM_NAMES = []
export function registerCustomFuturesFirms(entries) {
  for (const e of entries || []) {
    if (!e || !e.name) continue
    CUSTOM_FIRMS[e.name] = { plans: (e.plans && e.plans.length) ? e.plans : GENERIC_PLANS, rules: e.rules || {} }
    // Per-program structure (for the comparator, which shows one row per program).
    CUSTOM_FIRM_PROGRAMS[e.name] = (e.programs && e.programs.length)
      ? e.programs
      : [{ name: '', plans: e.plans || [], rules: e.rules || {} }]
    if (!CUSTOM_FIRM_NAMES.includes(e.name)) CUSTOM_FIRM_NAMES.push(e.name)
  }
}
// Firm rules accessor used by the prefill helpers: custom overlay first, then catalog.
export function firmRules(firmName) {
  return CUSTOM_FIRMS[firmName] || PROPFIRM_RULES[firmName]
}
// Per-program data for a custom firm (or null) — consumed by the futures comparator.
export function customFirmPrograms(firmName) {
  return CUSTOM_FIRM_PROGRAMS[firmName] || null
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
export function maxDrawdown(firmName, plan, program){
  const rules = firmRules(firmName)?.rules
  if(!rules || !plan) return null

  // Une clé de perte JOURNALIÈRE n'est jamais un drawdown max. La confondre
  // donnerait une jauge de risque trois à cinq fois trop serrée.
  const isDaily = k => /\b(daily|journali[èe]re|DLL)\b/i.test(k)

  const candidates = Object.keys(rules).filter(k => {
    if (isDaily(k)) return false
    // Formulation standard : « Drawdown total / trailing max ».
    if (/drawdown\s+(total|trailing)/i.test(k)) return true
    // Topstep-style : « Max Loss Limit (MLL) », mais pas « MLL mécanique XFA ».
    if (/^(max(imum)?\s+loss\s+limit|mll)\b/i.test(k) && !/m[ée]canique|xfa|live|lfa/i.test(k)) return true
    // Firmes à PROGRAMMES multiples : « Drawdown Select (EOD) », « Drawdown PRO+ »,
    // « Drawdown Rapid (intraday) »… Sans ce cas, maxDrawdown rendait null pour
    // Tradeify, Take Profit Trader, My Funded Futures et Phidias — soit un tiers du
    // catalogue sans jauge de drawdown, sans alerte Drawdown Guardian et sans
    // pré-remplissage à la création de compte.
    if (/^drawdown\b/i.test(k)) return true
    return false
  })

  // Quand une firme a plusieurs programmes, le MONTANT doit venir du programme
  // dont le TYPE correspond à celui que defaultDdType() annonce — sinon la jauge
  // affiche « EOD » au-dessus d'un chiffre intraday. C'est le cas de My Funded
  // Futures : Rapid bascule en intraday une fois financé, Pro reste EOD.
  const wantEod = defaultDdType(firmName) === 'eod'
  const typed = candidates.filter(k => wantEod ? /\bEOD\b/i.test(k) : /intraday/i.test(k))

  // Puis la PREMIÈRE clé qui porte réellement une valeur pour CE plan.
  // L'ordre du fichier place le programme principal en tête ; et une clé
  // limitée à une taille (« Drawdown Static (25K only) ») est ainsi ignorée
  // sur les autres tailles au lieu de rendre null pour tout le monde.
  const ordered = [...typed, ...candidates]
  for (const key of ordered) {
    const cell = cellFor(readRule(rules, key, plan), program)
    if (!cell) continue
    const n = firstInt(cell)
    if (n !== null && n > 0) return n
  }

  // Rien trouvé POUR CE PROGRAMME. Deux cas très différents :
  //   • une cellule cible explicitement des programmes (« Legacy : $2,750 ») et
  //     le nôtre n'y est pas → il n'est pas vendu à cette taille, on rend null ;
  //   • aucune cellule ne cite de programme → la firme ne différencie pas, la
  //     valeur globale EST la bonne réponse. Rendre null y éteindrait la jauge.
  if (program) {
    const explicit = ordered.some(k => hasExplicitProgramSegments(readRule(rules, k, plan)))
    if (!explicit) return maxDrawdown(firmName, plan, null)
  }
  return null
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
  'My Funded Futures',      // Pro / Flex / Builder = EOD (le Rapid ne passe en intraday qu'en financé)
  'Phidias Propfirm',       // Fundamental = EOD (Static = static)
  'Funded Futures Network', // EOD
  'FuturesELites',          // EOD
  'FundedNext Futures',     // MLL trailing EOD, verrouillé au solde initial + $100
  'Alpha Futures',          // MLL EOD trailing, lock au solde initial — les trois
                            // programmes (Premium, Zero, Advanced) sont marqués
                            // ddType:'EOD' dans futuresComparison.js. Sans cette
                            // ligne, defaultDdType() retombait sur 'static' et
                            // proposait le mauvais type à la création de compte.
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
export function profitTarget(firmName, plan, program){
  const rules = firmRules(firmName)?.rules
  if(!rules || !plan) return null
  const ptKey = Object.keys(rules).find(k => /objectif|profit\s+target/i.test(k))
  if(!ptKey) return null
  return firstInt(cellFor(readRule(rules, ptKey, plan), program))
}

// Retourne le balance cible pour un payout (planSize + profit target)
export function defaultPayoutTarget(firmName, plan, program){
  const pt = profitTarget(firmName, plan, program)
  if(pt === null) return null
  return planSizeNum(plan) + pt
}

// Retourne le nombre de jours de trading min selon la firme
export function defaultMinTradingDays(firmName, plan, program){
  const rules = firmRules(firmName)?.rules
  if(!rules || !plan) return null
  // Les clés sont nommées tantôt en français, tantôt en anglais, et tantôt par
  // programme : « Jours de trading min », « Min jours trading (Qual) »,
  // « Min trading days (XFA Standard) ». Le motif ne reconnaissait que la
  // première forme, d'où 17 couples (firme, taille) sans jours minimum.
  const keys = Object.keys(rules).filter(k =>
    /jours.*(trading|min)|min.*(jours|trading\s*days)/i.test(k)
  )
  if(!keys.length) return null
  const ordered = program
    ? [...keys.filter(k => new RegExp(escapeRe(program), 'i').test(k)), ...keys]
    : keys
  for (const k of ordered) {
    const cell = cellFor(readRule(rules, k, plan), program)
    if (!cell) continue
    // ⚠️ Surtout PAS firstInt ici : il privilégie les montants préfixés par $, et
    // « 5 winning days ≥ $150 net profit » aurait rendu 150 JOURS. On retire donc
    // les sommes d'argent avant de chercher le nombre.
    const text = String(cell).replace(/\$\s*[\d,]+/g, ' ')
    const m = text.match(/(?<![A-Za-zÀ-ÿ])(\d{1,3})(?!\s*%)/)
    if (m) return parseInt(m[1], 10)
  }
  return null
}

// Retourne le % du profit split pour le trader (ex: 90 pour un split 90/10).
// Cherche la clé "Répartition gains" dans les règles. Pour les valeurs composées
// "80% trader / 90% (PRO+)" prend le PREMIER nombre rencontré.
export function defaultProfitSplit(firmName, plan, program){
  const rules = firmRules(firmName)?.rules
  if(!rules || !plan) return null

  // Plusieurs clés possibles quand la firme sépare les splits par programme
  // (Phidias : « Profit split E2L », « … Fundamental », « … Premium »).
  const keys = Object.keys(rules).filter(k => /répartition.*gains|profit.*split/i.test(k))
  if(!keys.length) return null

  // Une clé qui NOMME le programme demandé passe devant les autres.
  const ordered = program
    ? [...keys.filter(k => new RegExp(escapeRe(program), 'i').test(k)), ...keys]
    : keys

  for (const k of ordered) {
    const cell = cellFor(readRule(rules, k, plan), program)
    if (!cell) continue
    const text = String(cell)
    // Deux notations coexistent dans les données, et seule la première était lue :
    //   « 80 % »   → 80
    //   « 90/10 »  → 90   (part du trader en premier, c'est la convention du secteur)
    const pct = text.match(/(\d{2,3})\s*%/)
    if (pct) return parseInt(pct[1], 10)
    const ratio = text.match(/(\d{2,3})\s*\/\s*(\d{1,2})\b/)
    if (ratio && parseInt(ratio[1],10) + parseInt(ratio[2],10) === 100) return parseInt(ratio[1], 10)
  }
  return null
}

function escapeRe(str){ return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

// Retourne le profit minimum par jour ($ numérique) pour qu'un jour compte
// comme "validé" dans le décompte des jours de trading min (payout requirement).
// Ex: Lucid demande $150 profit/jour pour valider un jour de trading.
// Cherche la clé "Profit min jour" / "Min profit / jour" / etc.
export function defaultMinDailyProfit(firmName, plan, program){
  const rules = firmRules(firmName)?.rules
  if(!rules || !plan) return null
  const k = Object.keys(rules).find(k =>
    /profit\s*min.*jour|min.*profit.*jour|jour.*valid|min.*winning/i.test(k)
  )
  if(!k) return null
  const m = String(cellFor(readRule(rules, k, plan), program) || '').match(/\$\s*([\d,]+)/)
  return m ? parseInt(m[1].replace(/,/g,''),10) : null
}

// Retourne le prix challenge approximatif ($ numérique) pour une firme + plan.
// Cherche dans les rules une clé contenant "Prix" ET (mensuel OU one-time OU évaluation).
// Pour les firmes avec multiple variantes, prend la PREMIÈRE clé matchée (ordre du fichier).
// Pour les valeurs composites "X / Y" (ex: MFFU "Prix Core (m / o)" = "$77 / $229"),
// prend la PREMIÈRE valeur ($X = mensuel typiquement).
// → Sert à pré-remplir le champ "Montant dépensé" du formulaire création de compte.
export function defaultChallengePrice(firmName, plan, program){
  const rules = firmRules(firmName)?.rules
  if(!rules || !plan) return null
  // Cherche la clé prix la plus appropriée (priorité : mensuel > one-time > évaluation)
  const keys = Object.keys(rules)
  const priceKey =
    keys.find(k => /prix/i.test(k) && /mensuel|évaluation|eval/i.test(k))
    || keys.find(k => /prix.*one[\s-]?time/i.test(k))
    || keys.find(k => /^prix/i.test(k))
  if(!priceKey) return null
  // Avec un programme, on cherche d'abord une clé prix qui le cite (Apex a
  // « Prix one-time EOD » et « Prix one-time Intraday » : deux clés, deux tarifs).
  // On essaie TOUTES les clés prix, pas seulement la première. Beaucoup de firmes
  // ont une clé par programme dont la plupart valent 'n/a' à une taille donnée :
  // s'arrêter à la première laissait MFFU sans prix en 25K, 100K et 150K, Phidias
  // en 25K et Alpha en 25K — alors que la donnée existe sur une autre clé.
  const allPriceKeys = keys.filter(k => /prix/i.test(k))
  const orderedKeys = program
    ? [...allPriceKeys.filter(k => new RegExp(escapeRe(program), 'i').test(k)), priceKey, ...allPriceKeys]
    : [priceKey, ...allPriceKeys]
  for (const k of orderedKeys) {
    const cell = cellFor(readRule(rules, k, plan), program)
    const m = String(cell || '').match(/\$\s*([\d,]+)/)
    if (m) return parseInt(m[1].replace(/,/g,''), 10)
  }
  return null
}
