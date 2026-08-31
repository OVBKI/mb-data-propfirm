# Futures Comparison — Mapping Summary

Human-readable companion to `lib/futuresComparison.js`. Documents, per firm and
per model, which `PROPFIRM_RULES` rule KEY (or helper) feeds each comparison
cell. **All values are resolved LIVE** from `lib/constants.js` at call time —
nothing here is hardcoded. A cell shown as `null` renders `—` in the UI.

Helper legend:
- `maxDrawdown()` → `$` trailing/max drawdown (parses the firm's MLL/Drawdown key)
- `profitTarget()` → `$` profit target (parses the "Objectif/Profit Target" key)
- `defaultMinDailyProfit()` → `$` min daily profit (parses a "Profit min …" key)

> **Sentinelles résolues par `ruleValue()`** :
> - `'idem'` (même décoré : `'🚨 idem'`, `'🌟 idem (ex: …)'`) = « même règle que
>   la taille de plan INFÉRIEURE la plus proche » → résolu en redescendant vers
>   le plan inférieur le plus proche ayant une vraie valeur. Jamais affiché tel
>   quel. Si rien ne se résout → `null`.
> - `'n/a'` exact = non applicable pour ce plan → `null` → `—`.
>
> **`extractModelSegment()` (descripteurs `{ key, model }`)** gère 3 styles de
> chaînes composites : `'Model: valeur'` (Alpha, préfixe pouvant lister
> plusieurs modèles : `'Select/Growth Eval : $1,500'`), `'valeur (ModelA/ModelB)'`
> (Phidias/Tradeify, note finale entre parenthèses) et `'Model valeur'` sans
> deux-points (FuturesElites `'Starter ~$3,000'`). Une note finale
> `'(… non dispo …)'` est RETIRÉE de la valeur (elle parle d'autres modèles :
> `'Advanced: $12,000 (Zero non dispo)'` → `'$12,000'` pour Advanced, `null`
> pour Zero). `'non dispo'`/`'n/a'`/`'—'` ne rendent `null` que s'ils sont la
> valeur du modèle lui-même. Dans une chaîne composite, un modèle sans segment
> est indisponible à cette taille → `null`.
>
> **`cleanCell()` / `extractMoney()` / `fmtMoney()`** vivent désormais ici
> (exportés, unit-testés dans `futuresComparison.test.js`) et sont importés par
> le composant UI. `extractMoney` exige un montant ancré par `$` (jamais de
> nombre inventé depuis des chiffres non monétaires) ; `pct` ne traite
> `AUCUN(E)` comme « pas de règle » que s'il ouvre la valeur ; un buffer `null`
> rend `—` (pas de donnée fiable), pas `Non`. Côté UI, un modèle dont les
> cellules drawdown (challenge ET financé) sont `null` est traité comme « plan
> non dispo » (ligne grisée) au lieu d'afficher des données partielles.

Cells: **CHALLENGE** = ddType · drawdown · dailyDrawdown · objectif · consistance.
**FINANCÉ** = buffer · jourMin · minDailyProfit · consistance.

> **`ddType` (per-model DD classification)** — a CURATED short literal,
> one of `Static` / `EOD` / `Trailing` (or a combo like `EOD / Trailing`,
> `EOD / Static`), or `null` → `—`. Unlike the numeric cells it is **not**
> resolved live, but it is **derived from the real drawdown rule text** in
> `PROPFIRM_RULES` and from `FIRM_META[firm].ddType` (lib/firmSlugs.js). Per-model
> where the rules make the distinction explicit (e.g. Bulenox Option1 trailing vs
> Option2 EOD; Lucid Direct static; MFFU Rapid trailing / Pro EOD / Flex+Builder
> static; Phidias Static vs Fundamental EOD), otherwise the firm-level type.
>
> **FINANCÉ no longer shows `drawdown` / `dailyDrawdown`** (dropped per user
> request — those values are already represented on the CHALLENGE side and via
> `ddType`). FINANCÉ now = buffer · jourMin · minDailyProfit · consistance.
> Column counts: PropFirm(1) + CHALLENGE(5) + FINANCÉ(4) = **10**.

### ddType assigned per firm/model
| Firm | Model | ddType | Basis |
|---|---|---|---|
| Topstep | Combine → XFA | EOD | MLL "EOD seulement (PAS intraday)" |
| Apex Trader Funding | Apex (EOD) | EOD | mapped model = EOD variant (intraday also offered) |
| Bulenox | Option 1 (No Scaling) | Trailing | "Option 1 real-time" |
| Bulenox | Option 2 (EOD) | EOD | "Option 2 EOD close 16h CT" |
| Lucid Trading | LucidPro | EOD | "EOD trailing (recalcule 16h45 EST close)" |
| Lucid Trading | LucidFlex | EOD | shares Lucid EOD trailing max |
| Lucid Trading | LucidDaily | EOD / Intraday | le type se CHOISIT à l'achat (PDF officiel) |
| Lucid Trading | LucidDirect | EOD | le PDF officiel tranche : EOD, et non "Static" comme supposé |
| Tradeify | Select Daily/Flex/Growth/Lightning | EOD | "Drawdown … (EOD)" keys + FIRM_META "EOD uniquement" |
| Take Profit Trader | Test → PRO → PRO+ | EOD / Trailing | Test EOD → PRO funded INTRADAY |
| My Funded Futures | Rapid | Trailing | "Drawdown Rapid (intraday)" 4% trailing |
| My Funded Futures | Pro | EOD | "Drawdown Pro (EOD)" |
| My Funded Futures | Flex | Static | "EOD STATIC · ne trail jamais" |
| My Funded Futures | Builder | Static | "fixed buffer, no trail" |
| Phidias Propfirm | Static / E2L | Static | "$500 STATIQUE PUR · ne trail jamais" |
| Phidias Propfirm | Fundamental / Swing | EOD | "Drawdown Fundamental/Swing (EOD)" |
| Funded Futures Network | Standard | EOD / Static | eval EOD → funded "Drawdown post-Exhibition" STATIC |
| Funded Futures Network | Express | EOD / Static | idem Standard |
| FuturesELites | Starter / Pro | EOD | "$2,000 EOD (Starter/Pro)" |
| FuturesELites | Instant Funded | Trailing | "5% current balance (trailing dynamique)" |
| Alpha Futures | Premium / Zero / Advanced | EOD | MLL "EOD trailing, lock starting balance" |

> **Uncertain / judgment calls:** Apex (model labelled EOD though firm FIRM_META
> says "Trailing intraday" — firm offers both, mapped model is the EOD one);
> Lucid Pro/Flex (FIRM_META says "Trailing intraday OU Static" but the rule text
> is explicitly *EOD* trailing — classified EOD, with Direct = Static);
> FFN (firm-level FIRM_META = "Trailing drawdown" but per-stage the eval key is
> EOD and funded becomes STATIC → labelled "EOD / Static").

> Note on funded `jourMin`: `defaultMinTradingDays()` was deliberately **NOT**
> used — it reads the firm's *eval* "Jours de trading min" key and returns
> 0/null for most firms (Topstep null, Apex/Bulenox/Lucid 0, TPT 5). The map
> instead points at the explicit **funded-phase** min-days key per model where
> one exists; otherwise the cell is `null`.

---

## Topstep — 1 model: `Combine → XFA`
| Cell | CHALLENGE source | FINANCÉ source |
|---|---|---|
| drawdown | `maxDrawdown()` (= "Max Loss Limit (MLL)") | `maxDrawdown()` (MLL identical across stages) |
| dailyDrawdown | `Daily Loss Limit (DLL)` | `DLL Live Funded (LFA)` |
| objectif | `profitTarget()` (= "Profit Target (Combine)") | — |
| buffer | — | `null` (no drawdown-buffer rule documented) |
| jourMin | — | `Min trading days (XFA Standard)` (= 5 winning days) |
| minDailyProfit | — | `Profit min winning day` ($150) |
| consistance | `Consistency (Combine)` (≤50%) | `Consistency (XFA Standard)` (AUCUNE) |

## Apex Trader Funding — 1 model: `Apex (EOD)`
| Cell | CHALLENGE | FINANCÉ |
|---|---|---|
| drawdown | `maxDrawdown()` (= "Drawdown trailing max") | `maxDrawdown()` |
| dailyDrawdown | `Daily Loss Limit (EOD)` | `PA DLL initial` |
| objectif | `profitTarget()` | — |
| buffer | — | `Safety Net (PA)` (locks trailing → cushion) |
| jourMin | — | `null` (qualifying days live inside payout text, not a min-days field) |
| minDailyProfit | — | `Qualifying days/payout` (string "5 jours · min $200/jour") |
| consistance | `Règle de cohérence (eval)` (AUCUNE) | `Règle de cohérence (PA)` (50%) |

## Bulenox — 2 models: `Option 1 (No Scaling)`, `Option 2 (EOD)`
| Cell | CHALLENGE | FINANCÉ |
|---|---|---|
| drawdown | `maxDrawdown()` | `maxDrawdown()` |
| dailyDrawdown (Opt1) | `DLL Option 1 (No Scaling)` (AUCUN) | same key |
| dailyDrawdown (Opt2) | `DLL Option 2 (EOD)` | same key |
| objectif | `profitTarget()` | — |
| buffer | — | `Drawdown lock (trailing)` (starting + $100) |
| jourMin | — | `Jours min Funded/cycle` (5 days between payouts) |
| minDailyProfit | — | `Profit min jour valide` ($0) |
| consistance | `Règle de cohérence (Q)` (AUCUNE) | `Règle de cohérence Master` (40%) |

## Lucid Trading — 4 models: `LucidPro`, `LucidFlex`, `LucidDaily`, `LucidDirect`
Réécrit en août 2026 sur le PDF officiel du checkout (source de première main).
`LucidDaily` — payouts quotidiens, drawdown EOD **ou** Intraday choisi à l'achat —
manquait entièrement au catalogue.

| Cell | LucidPro | LucidFlex | LucidDaily | LucidDirect |
|---|---|---|---|---|
| chal.drawdown | `maxDrawdown(model)` | `maxDrawdown(model)` | `maxDrawdown(model)` | `maxDrawdown(model)` |
| chal.dailyDrawdown | `Daily Loss Limit (éval)` | idem | idem | idem (sans objet) |
| chal.objectif | `profitTarget(model)` | `profitTarget(model)` | `profitTarget(model)` | `profitTarget(model)` → null |
| chal.consistance | `Consistency (eval)` (AUCUNE) | `Consistency (eval)` (50%) | `Consistency (eval)` (50%) | `Consistency (eval)` (20%) |
| fund.drawdown | `maxDrawdown(model)` | `maxDrawdown(model)` | `maxDrawdown(model)` | `maxDrawdown(model)` |
| fund.dailyDrawdown | `DLL funded (sous le trail initial)` | idem | idem | idem |
| fund.buffer | `Buffer post-payout` ⚠ | idem | idem | idem |
| fund.jourMin | `Jours min avant payout` (3) | (5) | (quotidiens) | (5) |
| fund.minDailyProfit | `Profit min/jour (funded)` (aucun) | ($100→$250) | (aucun) | (aucun) |
| fund.consistance | `Consistency funded` (40%) | (AUCUNE) | (AUCUNE) | (20%) |

⚠️ **`model:` est OBLIGATOIRE sur les helpers de Lucid.** Les cellules sont
composites et un helper ne reçoit le programme QUE par `descriptor.model` — il n'y
a pas de repli sur le modèle de la colonne, et c'est délibéré (Tradeify, MFFU et
FuturesElites étiquettent des VARIANTES, pas des programmes : un repli y viderait
sept cellules correctes). Sans `model:`, LucidDirect affichait $3,000 de drawdown
au lieu de $3,500 en 100K, et un objectif de $6,000 alors qu'il est financé direct
et n'en a aucun.

⚠ **Buffer caveat (Lucid):** the only buffer-like rule is `Buffer post-payout`,
which is a *post-payout withdrawal hold* ("leave $1,000–$1,500 above MLL min"),
**not** a drawdown buffer/cushion. It is mapped here per the task's allowance,
but flagged. The source stores only the `25k` text and `idem` for the other
plan sizes — `ruleValue()` now resolves `idem` down to the `25k` text.

## Tradeify — 4 models: `Select Daily`, `Select Flex`, `Growth`, `Lightning Funded`
| Cell | Select Daily | Select Flex | Growth | Lightning |
|---|---|---|---|---|
| chal.drawdown | `Drawdown Select (EOD)` | `Drawdown Select (EOD)` | `Drawdown Growth (EOD)` | `null` (instant, no eval) |
| chal.dailyDrawdown | `DLL Select Daily` | `DLL Select Flex` (AUCUN) | `DLL Growth` | `null` |
| chal.objectif | `profitTarget()` | `profitTarget()` | `profitTarget()` | `null` |
| chal.consistance | `Consistency Select (eval)` (40%) | `Consistency Select (eval)` (40%) | `Consistency Growth`/Eval (AUCUNE) | `null` |
| fund.drawdown | `Drawdown Select (EOD)` | `Drawdown Select (EOD)` | `Drawdown Growth (EOD)` | `Drawdown Lightning (EOD)` |
| fund.dailyDrawdown | `DLL Select Daily` | `DLL Select Flex` | `DLL Growth` | `DLL Lightning` |
| fund.buffer | `Lock drawdown` (+$100) | `Lock drawdown` | `Lock drawdown` | `Lock drawdown` |
| fund.jourMin | `Jours de trading min`/Select (3 j) | same (3 j) | …/Growth (1 j) | …/Lightning → `null` ⚠ |
| fund.minDailyProfit | `Profit min jour valide` | same | same | same |
| fund.consistance | `Consistency Select Daily (funded)` | `Consistency Select Flex (funded)` (50%) | `Consistency Growth`/Funded (35%) | `Consistency Lightning` |

⚠ `Jours de trading min` is a single shared key holding a composite string
("1 jour (Growth) · 3 jours (Select…)", `idem` at 50k+) — now **model-split**
via `{ key, model }` : Select → `3 jours`, Growth → `1 jour`, Lightning → no
segment in the source → `null`. `Consistency Growth` ("Eval : AUCUNE · Funded :
35%") is likewise split with phase labels `Eval` / `Funded`.

## Take Profit Trader — 1 model: `Test → PRO → PRO+`
| Cell | CHALLENGE | FINANCÉ |
|---|---|---|
| drawdown | `Drawdown Test (EOD)` | `Drawdown PRO (INTRADAY)` (funded = intraday trailing) |
| dailyDrawdown | `Daily Loss Limit` (AUCUN, removed Jan 2025) | `Daily Loss Limit` (AUCUN) |
| objectif | `profitTarget()` | — |
| buffer | — | `Buffer payout (PRO/PRO+)` (starting + MLL — a payout buffer) |
| jourMin | — | `Min entre payouts (PRO)` (7 days) |
| minDailyProfit | — | `null` (no $ floor, just ≥1 trade/day) |
| consistance | `Règle de cohérence (Test)` (≤50%, Test only) | `null` (no consistency on PRO/PRO+) |

## My Funded Futures — 4 models: `Rapid`, `Pro`, `Flex`, `Builder`
| Cell | Rapid | Pro | Flex | Builder |
|---|---|---|---|---|
| chal.drawdown | `Drawdown Rapid (intraday)` | `Drawdown Pro (EOD)` | `Drawdown Flex (EOD trailing)` | `Drawdown Builder (buffer)` |
| chal.dailyDrawdown | `Daily Loss Limit` ⚠ | same | same | same (string notes Builder $1K soft pause) |
| chal.objectif | `profitTarget()` | `profitTarget()` | `profitTarget()` | `profitTarget()` |
| chal.consistance | `Règle de cohérence (eval)` (50%) | same | same | same |
| fund.drawdown | `Drawdown Rapid (intraday)` | `Drawdown Pro (EOD)` | `Drawdown Flex (EOD trailing)` | `Drawdown Builder (buffer)` |
| fund.dailyDrawdown | `Daily Loss Limit` | same | same | same |
| fund.buffer | `Buffer payout (Rapid)` | `Buffer payout (Pro)` (60% carve-out) | `null` | `Drawdown Builder (buffer)` (fixed $2K/$1.5K cushion) |
| fund.jourMin | `null` | `null` | `null` | `null` |
| fund.minDailyProfit | `null` | `null` | `null` | `null` |
| fund.consistance | `null` (removed in sim funded) | `null` | `null` | `null` |

⚠ MFFU `Daily Loss Limit` is one shared key: "AUCUN partout sauf Builder…".
Buffer keys for MFFU are *payout buffers* (Rapid/Pro), used per task allowance;
Builder's fixed-buffer DD doubles as the cushion. Funded `jourMin` is `null`
because MFFU funded payouts are cadence-based (daily/14-day), not a min-days
gate — no per-plan numeric min-days field exists.

## Phidias Propfirm — 2 models: `Static / E2L`, `Fundamental / Swing`
| Cell | Static / E2L | Fundamental / Swing |
|---|---|---|
| chal.drawdown | `Drawdown Static (25K only)` (n/a at 50k+ → null) | `Drawdown Fundamental/Swing (EOD)` (n/a at 25k → null) |
| chal.dailyDrawdown | `Daily Loss Limit` (AUCUN) | `Daily Loss Limit` (AUCUN) |
| chal.objectif | `Objectif de profit`/E2L ($1,500 @25k, $3,000 @50k, null @100k+) | `Objectif de profit`/Fundamental ($4,000 @50k…, null @25k) |
| chal.consistance | `Consistency (eval)` (AUCUNE) | `Consistency (eval)` (AUCUNE) |
| fund.drawdown | `Drawdown Static (25K only)` | `Drawdown Fundamental/Swing (EOD)` |
| fund.dailyDrawdown | `Daily Loss Limit` | `Daily Loss Limit` |
| fund.buffer | `null` | `null` |
| fund.jourMin | `null` (Static: 1st payout = direct LIVE) | `null` (no explicit funded min-days key) |
| fund.minDailyProfit | `null` | `null` |
| fund.consistance | `Consistency (LIVE)` (AUCUNE) | `Consistency (CASH funded)` (30%) |

> Static drawdown is `n/a` for 50k/100k/150k (Static is a 25K-only product) — at
> 25k it resolves to `$500 STATIQUE PUR`.

## Funded Futures Network — 2 models: `Standard`, `Express`
| Cell | Standard | Express |
|---|---|---|
| chal.drawdown | `Drawdown trailing max (eval)` | `Drawdown trailing max (eval)` |
| chal.dailyDrawdown | `Daily Loss Limit` (AUCUN) | `Daily Loss Limit` (AUCUN) |
| chal.objectif | `profitTarget()` | `profitTarget()` |
| chal.consistance | `Consistency Standard (eval)` (40%) | `Consistency Express (eval)` (15%) |
| fund.drawdown | `Drawdown post-Exhibition` (STATIC) | `Drawdown post-Exhibition` (STATIC) |
| fund.dailyDrawdown | `Daily Loss Limit` | `Daily Loss Limit` |
| fund.buffer | `null` | `null` |
| fund.jourMin | `null` (cadence-based, not min-days) | `null` |
| fund.minDailyProfit | `Profit min jour valide` (AUCUN string) | same |
| fund.consistance | `Consistency funded` (3 first payouts) | same |

## FuturesELites — 3 models: `Starter`, `Pro`, `Instant Funded`
| Cell | Starter | Pro | Instant Funded |
|---|---|---|---|
| chal.drawdown | `maxDrawdown()` | `maxDrawdown()` | `null` (instant, no eval) |
| chal.dailyDrawdown | `DLL Starter` | `DLL Pro` (AUCUN) | `null` |
| chal.objectif | `Objectif de profit`/Starter ⚠ | …/Pro ⚠ | `null` |
| chal.consistance | `Consistency Starter/Pro` (40%) | same | `null` |
| fund.drawdown | `maxDrawdown()` | `maxDrawdown()` | `maxDrawdown()` |
| fund.dailyDrawdown | `DLL Starter` | `DLL Pro` | `DLL Instant` (string "Non documenté") |
| fund.buffer | `Mécanisme trailing` (lock at starting after 1st payout) | same | same |
| fund.jourMin | `Jours de trading min` (string) | same | same |
| fund.minDailyProfit | `Profit min jour valide` ("Non documenté") | same | same |
| fund.consistance | `Consistency Starter/Pro` (40%) | same | `Consistency Instant` (25%/20% disputed) |

⚠ `Objectif de profit` for FuturesElites is a composite string. At 50k
("Starter ~$3,000 · Pro ~$4,000 · Instant …") it is now **model-split** via
`{ key, model }` (Starter → `~$3,000`, Pro → `~$4,000`). **Known limitation** :
at 100k/150k the source string ("~$6,000 / ~$7,500") carries no model labels →
it is returned globally and the money extractor surfaces the FIRST amount for
both Starter and Pro (Pro devrait être $7,500 — non désambiguïsable sans
hardcoder ; le tooltip montre la chaîne complète).

## Alpha Futures — 3 models: `Premium`, `Zero`, `Advanced`
Alpha packs every model into composite strings (e.g. `"Premium: $3,000 · Zero:
$3,000 · Advanced: $4,000"`). The map uses `{ key, model }` descriptors and the
`extractModelSegment()` parser to pull each model's segment. `"… non dispo"`
resolves to `null` **only for the model it names** (e.g. Premium/Advanced at
25k, Zero at 150k) ; a trailing `"(Zero non dispo)"` note is stripped from the
OTHER models' values (`"Advanced: $12,000 (Zero non dispo)"` → `$12,000` for
Advanced at 150k, not null).

| Cell | Premium | Zero | Advanced |
|---|---|---|---|
| chal.drawdown | `MLL (Maximum Loss Limit)`/Premium | …/Zero | …/Advanced |
| chal.dailyDrawdown | `Daily Loss Guard`/Premium (AUCUN) | …/Zero ($500/$1K/$2K) | …/Advanced (AUCUN) |
| chal.objectif | `Objectif de profit`/Premium | …/Zero | …/Advanced (8% target) |
| chal.consistance | `Consistency (Eval)`/Premium (50%) | …/Zero (AUCUNE) | …/Advanced (50%) |
| fund.drawdown | `MLL (Maximum Loss Limit)`/Premium | …/Zero | …/Advanced |
| fund.dailyDrawdown | `Daily Loss Guard`/Premium | …/Zero | …/Advanced |
| fund.buffer | `null` | `null` | `null` |
| fund.jourMin | `Min jours trading (Qual)`/Premium (5) | …/Zero (5) | …/Advanced (5) |
| fund.minDailyProfit | `null` ⚠ | `null` ⚠ | `null` ⚠ |
| fund.consistance | `Consistency (Qualified)`/Premium (AUCUNE) | …/Zero (40%) | …/Advanced (AUCUNE) |

⚠ Alpha's funded `$200/winning-day` requirement lives inside payout free-text
(`Payout — Premium/Zero/Advanced`), not in a per-plan numeric field, so
`minDailyProfit` is `null` rather than mis-parsed.

---

## Cells deliberately set to `null` (uncertainty / no source)
- **Funded `jourMin`** for Apex, Take Profit Trader (uses payout-cadence key
  instead where a real min-days exists), MFFU (all models), Phidias (all),
  FFN (all), Lucid Direct → these firms gate funded payouts by *cadence* or
  *cumulative thresholds*, not a per-day-count min-days field.
- **Funded `minDailyProfit`** for Lucid Pro/Direct, TPT, MFFU (all), Phidias
  (all), Alpha (all) → no per-plan `$`-floor field; the requirement is either
  absent or buried in free-text.
- **Funded `consistance`** for TPT and MFFU (all) → consistency is removed once
  funded.
- **Eval cells for instant-funding models** (Tradeify Lightning, FuturesElites
  Instant Funded) → these skip evaluation entirely, so all four CHALLENGE cells
  are `null`.
- **Funded `buffer`** for Topstep, Phidias, FFN, Alpha (all), MFFU Flex → no
  drawdown-buffer/cushion rule in the data for those.

## Buffer interpretation notes
- True drawdown-cushion buffers: Bulenox `Drawdown lock (trailing)`, Tradeify
  `Lock drawdown`, FuturesElites `Mécanisme trailing`, MFFU Builder fixed buffer,
  Apex `Safety Net (PA)`.
- Mapped-but-flagged (payout/post-payout buffers, per task allowance):
  Lucid `Buffer post-payout`, TPT `Buffer payout (PRO/PRO+)`, MFFU Rapid/Pro
  `Buffer payout (…)`.
