// facts.mjs — les chiffres réels affichés sur la landing 3D, tirés du code.
//
//   npx vite-node landing-3d/facts.mjs        (depuis mb-data-web/ — vite-node
//   résout les imports sans extension de lib/, node seul ne le fait pas)
//
// La landing promet « X firmes, Y plans, Z règles » : ces nombres doivent être
// VRAIS, donc calculés depuis lib/constants.js, jamais tapés à la main. À
// relancer quand une firme est ajoutée, et reporter le résultat dans index.html.
import * as C from '../lib/constants.js'
import * as F from '../lib/futuresComparison.js'
import * as CFD from '../lib/cfdConstants.js'

const firms = C.FIRM_SUGGESTIONS
let plans = 0, programs = 0, rules = 0
for (const f of firms) {
  const ps = C.plansForFirm(f); plans += ps.length
  rules += Object.keys(C.PROPFIRM_RULES[f]?.rules || {}).length
  const seen = new Set()
  for (const p of ps) for (const m of (F.programsForFirm?.(f, p) || [])) seen.add(m)
  programs += seen.size
}
const cfd = Object.keys(CFD.CFD_PROPFIRM_RULES || {}).length
console.log(JSON.stringify({ firmsFutures: firms.length, plans, programs, rulesRows: rules, cfdFirms: cfd, firmNames: firms }, null, 1))
