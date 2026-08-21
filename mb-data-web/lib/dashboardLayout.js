// lib/dashboardLayout.js — le modèle de personnalisation du dashboard.
//
// ┌─ VOCABULAIRE ─────────────────────────────────────────────────────────────┐
// │ WIDGET   une entrée du catalogue (`WIDGETS`) : ce qu'un bloc sait faire.  │
// │ INSTANCE un widget POSÉ dans une section, avec sa taille, son titre et    │
// │          ses options. Un même widget peut avoir plusieurs instances —     │
// │          deux courbes d'equity sur deux périodes, par exemple.            │
// │ SECTION  un onglet du dashboard. Chacun a sa propre liste d'instances.    │
// └───────────────────────────────────────────────────────────────────────────┘
//
// C'est le passage par INSTANCE qui rend la duplication possible : sans lui,
// l'identifiant du widget servait de clé et un widget ne pouvait exister qu'une
// fois par section.
//
// PERSISTANCE en deux temps :
//   1. localStorage — écrit à chaque geste, relu au montage. Le dashboard
//      s'affiche déjà personnalisé avant même que Supabase ait répondu.
//   2. profiles.dashboard_layout (jsonb) — écrit avec un délai, pour retrouver
//      sa disposition sur un autre appareil.
// Si les deux divergent, le SERVEUR gagne au chargement.

export const GRID_COLUMNS = 4
export const MAX_ROWS = 3
export const STORAGE_KEY = 'quantara_dashboard_layout'
export const LAYOUT_VERSION = 2

// ============================================================================
// Catalogue
// ============================================================================
// `options` décrit les réglages qu'une instance peut porter. Chaque option a un
// type, des valeurs et un défaut ; l'éditeur les rend automatiquement, donc
// ajouter une option ne demande aucune UI supplémentaire.
const RANGE_VALUES = ['3m', '7m', '12m', 'all']

export const WIDGETS = {
  insight: {
    titleKey: 'app.widgets.insight',
    minW: 2, defaultW: 2, minH: 1, defaultH: 1,
    duplicable: false,   // un seul « à faire maintenant » a du sens
    options: {},
  },
  payouts: {
    titleKey: 'app.widgets.payouts',
    minW: 1, defaultW: 1, minH: 1, defaultH: 1,
    duplicable: true,
    options: {
      range: { type: 'select', values: RANGE_VALUES, default: '7m', labelKey: 'app.widgets.optRange' },
    },
  },
  spent: {
    titleKey: 'app.widgets.spent',
    minW: 1, defaultW: 1, minH: 1, defaultH: 1,
    duplicable: true,
    options: {
      range: { type: 'select', values: RANGE_VALUES, default: '7m', labelKey: 'app.widgets.optRange' },
    },
  },
  equity: {
    titleKey: 'app.widgets.equity',
    minW: 2, defaultW: 2, minH: 1, defaultH: 2,
    duplicable: true,
    options: {
      range: { type: 'select', values: RANGE_VALUES, default: '7m', labelKey: 'app.widgets.optRange' },
      cumulative: { type: 'toggle', default: true, labelKey: 'app.widgets.optCumulative' },
    },
  },
  health: {
    titleKey: 'app.widgets.health',
    minW: 2, defaultW: 2, minH: 1, defaultH: 2,
    duplicable: true,
    options: {
      limit: { type: 'select', values: [3, 4, 6, 10], default: 4, labelKey: 'app.widgets.optLimit' },
      sort: { type: 'select', values: ['risk', 'name'], default: 'risk', labelKey: 'app.widgets.optSort' },
    },
  },
  firms: {
    titleKey: 'app.widgets.firms',
    minW: 2, defaultW: 4, minH: 1, defaultH: 2,
    duplicable: false,
    options: {},
  },
  calendar: {
    titleKey: 'app.widgets.calendar',
    minW: 2, defaultW: 4, minH: 1, defaultH: 2,
    duplicable: false,
    options: {},
  },
  byFirm: {
    titleKey: 'app.widgets.byFirm',
    minW: 1, defaultW: 2, minH: 1, defaultH: 1,
    duplicable: true,
    options: {},
  },
  stats: {
    titleKey: 'app.widgets.stats',
    minW: 1, defaultW: 1, minH: 1, defaultH: 1,
    duplicable: false,
    options: {},
  },
  ranking: {
    titleKey: 'app.widgets.ranking',
    minW: 1, defaultW: 1, minH: 1, defaultH: 1,
    duplicable: true,
    options: {
      limit: { type: 'select', values: [3, 5, 10], default: 5, labelKey: 'app.widgets.optLimit' },
    },
  },
}

export const WIDGET_IDS = Object.keys(WIDGETS)

// ============================================================================
// Sections
// ============================================================================
export const SECTIONS = ['overview', 'performance', 'payouts', 'risk']
export const DEFAULT_SECTION = 'overview'

export const SECTION_LABELS = {
  overview:    'app.dashSections.overview',
  performance: 'app.dashSections.performance',
  payouts:     'app.dashSections.payouts',
  risk:        'app.dashSections.risk',
}

// Fabrique une instance complète à partir d'un identifiant de widget.
// `seq` distingue les instances d'un même widget dans une section.
export function makeInstance(widgetId, overrides = {}, seq = 1) {
  const spec = WIDGETS[widgetId]
  if (!spec) return null
  return {
    i: overrides.i || (seq > 1 ? `${widgetId}-${seq}` : widgetId),
    id: widgetId,
    w: spec.defaultW,
    h: spec.defaultH,
    visible: true,
    title: null,
    options: defaultOptions(widgetId),
    ...overrides,
  }
}

export function defaultOptions(widgetId) {
  const spec = WIDGETS[widgetId]
  if (!spec) return {}
  const out = {}
  for (const [key, opt] of Object.entries(spec.options || {})) out[key] = opt.default
  return out
}

const inst = (id, w, h, visible = true) => makeInstance(id, { w, h, visible })

export const DEFAULT_LAYOUTS = {
  overview: [
    inst('insight', 2, 1), inst('payouts', 1, 1), inst('spent', 1, 1),
    inst('equity', 2, 2), inst('health', 2, 2),
    inst('firms', 4, 2), inst('calendar', 4, 2),
    inst('byFirm', 2, 1), inst('stats', 1, 1), inst('ranking', 1, 1),
  ],
  performance: [
    inst('equity', 4, 2), inst('byFirm', 2, 1), inst('stats', 1, 1), inst('ranking', 1, 1),
    inst('insight', 2, 1, false), inst('payouts', 1, 1, false), inst('spent', 1, 1, false),
    inst('health', 2, 2, false), inst('firms', 4, 2, false), inst('calendar', 4, 2, false),
  ],
  payouts: [
    inst('payouts', 2, 1), inst('spent', 2, 1), inst('calendar', 4, 2),
    inst('ranking', 2, 1), inst('byFirm', 2, 1),
    inst('insight', 2, 1, false), inst('equity', 2, 2, false),
    inst('health', 2, 2, false), inst('firms', 4, 2, false), inst('stats', 1, 1, false),
  ],
  risk: [
    inst('insight', 2, 1), inst('health', 2, 2), inst('firms', 4, 2),
    inst('payouts', 1, 1, false), inst('spent', 1, 1, false), inst('equity', 2, 2, false),
    inst('calendar', 4, 2, false), inst('byFirm', 2, 1, false),
    inst('stats', 1, 1, false), inst('ranking', 1, 1, false),
  ],
}

export const DEFAULT_LAYOUT = DEFAULT_LAYOUTS.overview

export function defaultLayoutFor(section) {
  return DEFAULT_LAYOUTS[section] || DEFAULT_LAYOUTS[DEFAULT_SECTION]
}

// ============================================================================
// Presets
// ============================================================================
// Des dispositions prêtes à l'emploi, appliquées à la section courante. Elles
// partent des instances par défaut et n'en gardent qu'une sélection : le
// résultat reste une disposition normale, que l'utilisateur peut ensuite
// retoucher librement.
export const PRESETS = {
  full:    { labelKey: 'app.widgets.presetFull',    keep: null },
  focus:   { labelKey: 'app.widgets.presetFocus',   keep: ['insight', 'health', 'firms'] },
  numbers: { labelKey: 'app.widgets.presetNumbers', keep: ['payouts', 'spent', 'equity', 'stats', 'ranking'] },
  minimal: { labelKey: 'app.widgets.presetMinimal', keep: ['insight', 'equity'] },
}

export function applyPreset(section, presetKey) {
  const preset = PRESETS[presetKey]
  const base = normalizeLayoutFor(section, defaultLayoutFor(section))
  if (!preset || !preset.keep) return base
  return base.map(x => ({ ...x, visible: preset.keep.includes(x.id) }))
}

// ============================================================================
// Normalisation
// ============================================================================
// Remet une disposition d'aplomb : instances valides, tailles bornées,
// identifiants d'instance uniques, widgets manquants ajoutés.
//
// C'est ce qui permet de faire évoluer le catalogue sans casser les dispositions
// enregistrées. Trois cas couverts :
//   • widget retiré du code    → l'instance disparaît, sans laisser de trou
//   • widget ajouté au code    → une instance rejoint la fin, masquée
//   • ancien format (v1)       → converti en instances
export function normalizeLayoutFor(section, raw) {
  const base = defaultLayoutFor(section)
  const out = []
  const usedKeys = new Set()
  const seenWidgets = new Set()
  // Décidé UNE FOIS, avant la boucle. Le tester à l'intérieur via `out.length`
  // ne serait vrai que pour la toute première instance ajoutée : une disposition
  // vide se retrouverait avec un seul widget visible.
  const fromScratch = !Array.isArray(raw) || raw.length === 0

  for (const item of Array.isArray(raw) ? raw : []) {
    const widgetId = item?.id
    const spec = WIDGETS[widgetId]
    if (!spec) continue

    // Un identifiant d'instance en double casserait les clés React et le
    // glisser-déposer : on en forge un neuf plutôt que d'écarter l'instance.
    let key = typeof item.i === 'string' && item.i ? item.i : widgetId
    if (usedKeys.has(key)) {
      let n = 2
      while (usedKeys.has(`${widgetId}-${n}`)) n++
      key = `${widgetId}-${n}`
    }
    usedKeys.add(key)
    seenWidgets.add(widgetId)

    out.push({
      i: key,
      id: widgetId,
      w: clamp(item.w, spec.minW, GRID_COLUMNS, spec.defaultW),
      h: clamp(item.h, spec.minH, MAX_ROWS, spec.defaultH),
      visible: item.visible !== false,
      title: typeof item.title === 'string' && item.title.trim() ? item.title.trim().slice(0, 40) : null,
      options: normalizeOptions(widgetId, item.options),
    })
  }

  for (const d of base) {
    if (seenWidgets.has(d.id)) continue
    // Un widget jamais vu par cet utilisateur : masqué s'il rejoint une
    // disposition déjà personnalisée, visible si l'on part de zéro.
    const key = usedKeys.has(d.i) ? `${d.id}-new` : d.i
    usedKeys.add(key)
    out.push({ ...d, i: key, visible: fromScratch ? d.visible : false })
  }
  return out
}

function clamp(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

// Ne garde que les options déclarées, avec une valeur admise. Une option
// inconnue ou hors liste retombe sur le défaut plutôt que de contaminer le
// rendu avec une valeur que le widget ne sait pas interpréter.
export function normalizeOptions(widgetId, raw) {
  const spec = WIDGETS[widgetId]
  if (!spec) return {}
  const out = {}
  for (const [key, opt] of Object.entries(spec.options || {})) {
    const v = raw?.[key]
    if (opt.type === 'toggle') out[key] = typeof v === 'boolean' ? v : opt.default
    else if (opt.type === 'select') out[key] = opt.values.includes(v) ? v : opt.default
    else out[key] = v ?? opt.default
  }
  return out
}

export function normalizeLayout(raw) {
  return normalizeLayoutFor(DEFAULT_SECTION, raw)
}

// Une disposition par section. Reprend l'ancien format (un simple tableau,
// avant les sous-sections) comme disposition de « Vue d'ensemble ».
export function normalizeAll(raw) {
  const out = {}
  const legacyArray = Array.isArray(raw) ? raw : null
  const bag = raw && !Array.isArray(raw) ? (raw.sections || raw) : null
  for (const sec of SECTIONS) {
    const src = legacyArray && sec === DEFAULT_SECTION ? legacyArray : (bag ? bag[sec] : null)
    out[sec] = normalizeLayoutFor(sec, src)
  }
  return out
}

// Enveloppe versionnée pour le stockage. La version permet de reconnaître un
// format ancien sans avoir à deviner sa forme.
export function serializeAll(all) {
  return { version: LAYOUT_VERSION, sections: all }
}

export function isDefaultLayout(layout, section = DEFAULT_SECTION) {
  const a = normalizeLayoutFor(section, layout)
  const b = normalizeLayoutFor(section, defaultLayoutFor(section))
  if (a.length !== b.length) return false
  return a.every((x, k) => {
    const y = b[k]
    return x.id === y.id && x.w === y.w && x.h === y.h && x.visible === y.visible
      && x.title === y.title && JSON.stringify(x.options) === JSON.stringify(y.options)
  })
}

// ============================================================================
// Opérations — toutes pures, toutes rendent une NOUVELLE disposition
// ============================================================================
export function moveWidget(layout, key, targetKey) {
  if (key === targetKey) return layout
  const from = layout.findIndex(x => x.i === key)
  const to = layout.findIndex(x => x.i === targetKey)
  if (from < 0 || to < 0) return layout
  const next = layout.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function setWidgetWidth(layout, key, w) {
  return patch(layout, key, (x, spec) => ({ w: clamp(w, spec.minW, GRID_COLUMNS, x.w) }))
}

export function setWidgetHeight(layout, key, h) {
  return patch(layout, key, (x, spec) => ({ h: clamp(h, spec.minH, MAX_ROWS, x.h) }))
}

export function setWidgetVisible(layout, key, visible) {
  return patch(layout, key, () => ({ visible: Boolean(visible) }))
}

// Un titre vide revient au libellé par défaut plutôt que d'afficher un blanc.
export function setWidgetTitle(layout, key, title) {
  const clean = String(title || '').trim().slice(0, 40)
  return patch(layout, key, () => ({ title: clean || null }))
}

export function setWidgetOption(layout, key, optionKey, value) {
  return patch(layout, key, (x) => ({
    options: normalizeOptions(x.id, { ...x.options, [optionKey]: value }),
  }))
}

// Duplique une instance juste après l'originale, avec un identifiant neuf.
// Les widgets marqués `duplicable: false` sont refusés : deux « à faire
// maintenant » côte à côte diraient la même chose deux fois.
export function duplicateWidget(layout, key) {
  const idx = layout.findIndex(x => x.i === key)
  if (idx < 0) return layout
  const src = layout[idx]
  const spec = WIDGETS[src.id]
  if (!spec?.duplicable) return layout
  const used = new Set(layout.map(x => x.i))
  let n = 2
  while (used.has(`${src.id}-${n}`)) n++
  const copy = { ...src, i: `${src.id}-${n}`, options: { ...src.options }, visible: true }
  const next = layout.slice()
  next.splice(idx + 1, 0, copy)
  return next
}

// Retire une instance. La DERNIÈRE instance d'un widget n'est jamais supprimée,
// seulement masquée : sinon le widget disparaîtrait du tiroir et deviendrait
// impossible à récupérer.
export function removeWidget(layout, key) {
  const target = layout.find(x => x.i === key)
  if (!target) return layout
  const siblings = layout.filter(x => x.id === target.id)
  if (siblings.length <= 1) return setWidgetVisible(layout, key, false)
  return layout.filter(x => x.i !== key)
}

// Rend la disposition INCHANGÉE (la même référence) quand l'instance visée
// n'existe pas ou que le widget est inconnu. Sans ça, chaque appel produisait un
// nouveau tableau, et React re-rendait la grille pour rien — l'historique
// d'annulation se remplissait aussi d'étapes vides.
function patch(layout, key, build) {
  const idx = layout.findIndex(x => x.i === key)
  if (idx < 0) return layout
  const spec = WIDGETS[layout[idx].id]
  if (!spec) return layout
  const patched = { ...layout[idx], ...build(layout[idx], spec) }
  const next = layout.slice()
  next[idx] = patched
  return next
}

// ============================================================================
// Import / export
// ============================================================================
// Sert à sauvegarder une configuration, la partager, ou repartir de celle d'un
// autre. On renvoie un résultat plutôt que de lever : l'appelant affiche
// l'erreur à l'utilisateur, il ne la fait pas remonter en exception.
export function exportLayout(all) {
  return JSON.stringify(serializeAll(all), null, 2)
}

export function importLayout(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'parse' }
  }
  if (!parsed || typeof parsed !== 'object') return { ok: false, error: 'shape' }
  const sections = parsed.sections || parsed
  const known = Array.isArray(sections)
    ? true
    : SECTIONS.some(s => Array.isArray(sections[s]))
  if (!known) return { ok: false, error: 'shape' }
  return { ok: true, value: normalizeAll(parsed) }
}
