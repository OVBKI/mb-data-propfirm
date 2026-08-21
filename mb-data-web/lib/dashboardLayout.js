// lib/dashboardLayout.js — disposition personnalisable de « Vue d'ensemble ».
//
// L'utilisateur choisit quels widgets s'affichent, dans quel ordre et sur quelle
// largeur. La grille fait 4 colonnes ; un widget occupe de 1 à 4 colonnes.
//
// PERSISTANCE en deux temps :
//   1. localStorage — écrit à chaque geste, relu au montage. Le dashboard
//      s'affiche déjà personnalisé avant même que Supabase ait répondu.
//   2. profiles.dashboard_layout (jsonb) — écrit avec un délai, pour retrouver
//      sa disposition sur un autre appareil.
// Si les deux divergent, le SERVEUR gagne au chargement : c'est la source
// partagée entre appareils, le cache local n'est qu'une avance d'affichage.

export const GRID_COLUMNS = 4

// Le catalogue. Ajouter un widget ici suffit : il apparaît dans le tiroir des
// widgets masqués des utilisateurs existants, sans casser leur disposition.
export const WIDGETS = {
  insight:  { titleKey: 'app.widgets.insight',  minW: 2, defaultW: 2 },
  payouts:  { titleKey: 'app.widgets.payouts',  minW: 1, defaultW: 1 },
  spent:    { titleKey: 'app.widgets.spent',    minW: 1, defaultW: 1 },
  equity:   { titleKey: 'app.widgets.equity',   minW: 2, defaultW: 2 },
  health:   { titleKey: 'app.widgets.health',   minW: 2, defaultW: 2 },
  firms:    { titleKey: 'app.widgets.firms',    minW: 2, defaultW: 4 },
  calendar: { titleKey: 'app.widgets.calendar', minW: 2, defaultW: 4 },
  byFirm:   { titleKey: 'app.widgets.byFirm',   minW: 1, defaultW: 2 },
  stats:    { titleKey: 'app.widgets.stats',    minW: 1, defaultW: 1 },
  ranking:  { titleKey: 'app.widgets.ranking',  minW: 1, defaultW: 1 },
}

export const WIDGET_IDS = Object.keys(WIDGETS)

// Disposition par défaut — celle de la maquette retenue.
export const DEFAULT_LAYOUT = [
  { id: 'insight',  w: 2, visible: true },
  { id: 'payouts',  w: 1, visible: true },
  { id: 'spent',    w: 1, visible: true },
  { id: 'equity',   w: 2, visible: true },
  { id: 'health',   w: 2, visible: true },
  { id: 'firms',    w: 4, visible: true },
  { id: 'calendar', w: 4, visible: true },
  { id: 'byFirm',   w: 2, visible: true },
  { id: 'stats',    w: 1, visible: true },
  { id: 'ranking',  w: 1, visible: true },
]

export const STORAGE_KEY = 'quantara_dashboard_layout'

// Remet une disposition d'affilée : largeurs bornées, doublons écartés, widgets
// inconnus retirés, widgets nouveaux ajoutés à la fin en masqué.
//
// C'est ce qui permet de faire évoluer le catalogue sans casser les dispositions
// déjà enregistrées : un widget ajouté après coup n'écrase rien, il attend dans
// le tiroir. Et un widget supprimé du code disparaît sans laisser de trou.
export function normalizeLayout(raw) {
  const out = []
  const seen = new Set()
  // Décidé UNE FOIS, avant la boucle. Le tester à l'intérieur via `out.length`
  // ne serait vrai que pour le tout premier widget ajouté : une disposition
  // vide se serait retrouvée avec un seul widget visible et tout le reste
  // dans le tiroir.
  const fromScratch = !Array.isArray(raw) || raw.length === 0
  for (const item of Array.isArray(raw) ? raw : []) {
    const id = item?.id
    const spec = WIDGETS[id]
    if (!spec || seen.has(id)) continue
    seen.add(id)
    const w = Math.min(GRID_COLUMNS, Math.max(spec.minW, Number(item.w) || spec.defaultW))
    out.push({ id, w, visible: item.visible !== false })
  }
  for (const d of DEFAULT_LAYOUT) {
    if (seen.has(d.id)) continue
    // Un widget jamais vu par cet utilisateur : masqué s'il rejoint une
    // disposition déjà personnalisée, visible si l'on part de zéro.
    out.push({ ...d, visible: fromScratch ? d.visible : false })
  }
  return out
}

export function isDefaultLayout(layout) {
  const a = normalizeLayout(layout)
  const b = normalizeLayout(DEFAULT_LAYOUT)
  if (a.length !== b.length) return false
  return a.every((x, i) => x.id === b[i].id && x.w === b[i].w && x.visible === b[i].visible)
}

// ── Cache local ──────────────────────────────────────────────────────────────
export function readLocalLayout() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? normalizeLayout(JSON.parse(raw)) : null
  } catch { return null }
}

export function writeLocalLayout(layout) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)) } catch {}
}

// ── Opérations ───────────────────────────────────────────────────────────────
export function moveWidget(layout, id, targetId) {
  if (id === targetId) return layout
  const from = layout.findIndex(w => w.id === id)
  const to = layout.findIndex(w => w.id === targetId)
  if (from < 0 || to < 0) return layout
  const next = layout.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function setWidgetWidth(layout, id, w) {
  const spec = WIDGETS[id]
  if (!spec) return layout
  const clamped = Math.min(GRID_COLUMNS, Math.max(spec.minW, w))
  return layout.map(x => x.id === id ? { ...x, w: clamped } : x)
}

export function setWidgetVisible(layout, id, visible) {
  return layout.map(x => x.id === id ? { ...x, visible } : x)
}
