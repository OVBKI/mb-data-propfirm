// lib/dashboardLayout.test.js — la disposition personnalisée du dashboard.
//
// L'enjeu : une disposition enregistrée doit survivre aux évolutions du produit.
// Un widget ajouté, retiré ou renommé ne doit jamais casser l'écran de quelqu'un.

import { describe, it, expect } from 'vitest'
import {
  DEFAULT_LAYOUT, WIDGETS, GRID_COLUMNS, SECTIONS, DEFAULT_SECTION, SECTION_LABELS,
  normalizeLayout, normalizeLayoutFor, normalizeAll, defaultLayoutFor,
  isDefaultLayout, moveWidget, setWidgetWidth, setWidgetVisible,
} from './dashboardLayout'

describe('normalizeLayout', () => {
  it('accepte la disposition par défaut sans la modifier', () => {
    expect(normalizeLayout(DEFAULT_LAYOUT)).toEqual(DEFAULT_LAYOUT)
  })

  it('reconstruit une disposition à partir de rien', () => {
    // Entrées possibles : première visite, localStorage corrompu, colonne vide.
    for (const junk of [null, undefined, [], 'nope', 42, {}]) {
      const out = normalizeLayout(junk)
      expect(out).toHaveLength(DEFAULT_LAYOUT.length)
      expect(out.map(w => w.id).sort()).toEqual(Object.keys(WIDGETS).sort())
    }
  })

  it('écarte les widgets inconnus', () => {
    // Un widget retiré du code ne doit pas laisser un trou dans la grille.
    const out = normalizeLayout([{ id: 'ghost', w: 2 }, { id: 'equity', w: 2 }])
    expect(out.some(w => w.id === 'ghost')).toBe(false)
    expect(out[0].id).toBe('equity')
  })

  it('écarte les doublons en gardant le premier', () => {
    const out = normalizeLayout([{ id: 'equity', w: 4 }, { id: 'equity', w: 2 }])
    expect(out.filter(w => w.id === 'equity')).toHaveLength(1)
    expect(out[0].w).toBe(4)
  })

  it('ajoute un widget inédit à la fin, masqué', () => {
    // C'est ce qui permet d'enrichir le catalogue sans réorganiser l'écran des
    // utilisateurs existants : le nouveau attend dans le tiroir.
    const out = normalizeLayout([{ id: 'equity', w: 2, visible: true }])
    const added = out.find(w => w.id === 'health')
    expect(added).toBeDefined()
    expect(added.visible).toBe(false)
    expect(out[0].id).toBe('equity')
  })

  it('borne les largeurs entre le minimum du widget et le nombre de colonnes', () => {
    const out = normalizeLayout([
      { id: 'insight', w: 1 },     // minW = 2
      { id: 'payouts', w: 99 },    // au-delà de la grille
      { id: 'equity', w: -5 },
    ])
    const at = (id) => out.find(w => w.id === id).w
    expect(at('insight')).toBe(WIDGETS.insight.minW)
    expect(at('payouts')).toBe(GRID_COLUMNS)
    expect(at('equity')).toBe(WIDGETS.equity.minW)
  })

  it('traite une largeur non numérique comme la largeur par défaut', () => {
    const out = normalizeLayout([{ id: 'equity', w: 'large' }])
    expect(out[0].w).toBe(WIDGETS.equity.defaultW)
  })

  it('ne masque un widget que sur `visible: false` explicite', () => {
    // `undefined` doit rester visible : une disposition ancienne sans le champ
    // ne doit pas faire disparaître la moitié de l'écran.
    expect(normalizeLayout([{ id: 'equity' }])[0].visible).toBe(true)
    expect(normalizeLayout([{ id: 'equity', visible: false }])[0].visible).toBe(false)
  })

  it('est idempotente', () => {
    const once = normalizeLayout([{ id: 'stats', w: 9 }, { id: 'zzz' }])
    expect(normalizeLayout(once)).toEqual(once)
  })
})

describe('isDefaultLayout', () => {
  it('reconnaît la disposition par défaut', () => {
    expect(isDefaultLayout(DEFAULT_LAYOUT)).toBe(true)
    expect(isDefaultLayout(null)).toBe(true) // null se normalise vers le défaut
  })

  it('détecte une personnalisation', () => {
    expect(isDefaultLayout(setWidgetWidth(DEFAULT_LAYOUT, 'equity', 4))).toBe(false)
    expect(isDefaultLayout(setWidgetVisible(DEFAULT_LAYOUT, 'stats', false))).toBe(false)
    expect(isDefaultLayout(moveWidget(DEFAULT_LAYOUT, 'stats', 'insight'))).toBe(false)
  })
})

describe('moveWidget', () => {
  it('insère le widget déplacé à la position de la cible', () => {
    const out = moveWidget(DEFAULT_LAYOUT, 'stats', 'insight')
    expect(out[0].id).toBe('stats')
    expect(out).toHaveLength(DEFAULT_LAYOUT.length)
  })

  it('ne perd aucun widget, quel que soit le sens du déplacement', () => {
    const ids = (l) => l.map(w => w.id).sort()
    expect(ids(moveWidget(DEFAULT_LAYOUT, 'insight', 'ranking'))).toEqual(ids(DEFAULT_LAYOUT))
    expect(ids(moveWidget(DEFAULT_LAYOUT, 'ranking', 'insight'))).toEqual(ids(DEFAULT_LAYOUT))
  })

  it('ignore un déplacement sur soi-même ou vers un identifiant inconnu', () => {
    expect(moveWidget(DEFAULT_LAYOUT, 'equity', 'equity')).toBe(DEFAULT_LAYOUT)
    expect(moveWidget(DEFAULT_LAYOUT, 'equity', 'ghost')).toBe(DEFAULT_LAYOUT)
    expect(moveWidget(DEFAULT_LAYOUT, 'ghost', 'equity')).toBe(DEFAULT_LAYOUT)
  })
})

describe('setWidgetWidth', () => {
  it('applique une largeur valide', () => {
    const out = setWidgetWidth(DEFAULT_LAYOUT, 'payouts', 3)
    expect(out.find(w => w.id === 'payouts').w).toBe(3)
  })

  it('refuse de descendre sous la largeur minimale du widget', () => {
    // La carte d'insight contient un titre et un paragraphe : sur une colonne
    // elle serait illisible.
    const out = setWidgetWidth(DEFAULT_LAYOUT, 'insight', 1)
    expect(out.find(w => w.id === 'insight').w).toBe(WIDGETS.insight.minW)
  })

  it('plafonne à la largeur de la grille', () => {
    const out = setWidgetWidth(DEFAULT_LAYOUT, 'stats', 12)
    expect(out.find(w => w.id === 'stats').w).toBe(GRID_COLUMNS)
  })

  it('ignore un widget inconnu', () => {
    expect(setWidgetWidth(DEFAULT_LAYOUT, 'ghost', 2)).toBe(DEFAULT_LAYOUT)
  })
})

describe('setWidgetVisible', () => {
  it('masque et réaffiche sans changer l ordre', () => {
    const hidden = setWidgetVisible(DEFAULT_LAYOUT, 'calendar', false)
    expect(hidden.find(w => w.id === 'calendar').visible).toBe(false)
    expect(hidden.map(w => w.id)).toEqual(DEFAULT_LAYOUT.map(w => w.id))

    const back = setWidgetVisible(hidden, 'calendar', true)
    expect(back.find(w => w.id === 'calendar').visible).toBe(true)
    expect(back.map(w => w.id)).toEqual(DEFAULT_LAYOUT.map(w => w.id))
  })

  it('permet de tout masquer sans casser la normalisation', () => {
    // Un écran vide est un choix valide de l'utilisateur, pas une erreur.
    let l = DEFAULT_LAYOUT
    for (const w of DEFAULT_LAYOUT) l = setWidgetVisible(l, w.id, false)
    expect(l.every(w => !w.visible)).toBe(true)
    expect(normalizeLayout(l)).toHaveLength(DEFAULT_LAYOUT.length)
  })
})

describe('catalogue', () => {
  it('chaque widget du défaut existe, et réciproquement', () => {
    expect(DEFAULT_LAYOUT.map(w => w.id).sort()).toEqual(Object.keys(WIDGETS).sort())
  })

  it('chaque largeur par défaut respecte son propre minimum', () => {
    for (const [id, spec] of Object.entries(WIDGETS)) {
      expect(spec.defaultW, id).toBeGreaterThanOrEqual(spec.minW)
      expect(spec.defaultW, id).toBeLessThanOrEqual(GRID_COLUMNS)
    }
  })
})

describe('sous-sections', () => {
  // Le dashboard a quatre vues du même jeu de données. Chacune garde SA
  // disposition : personnaliser « Payouts » ne doit rien changer ailleurs.

  it('déclare une disposition par défaut pour chaque section', () => {
    for (const sec of SECTIONS) {
      expect(defaultLayoutFor(sec), sec).toBeInstanceOf(Array)
      expect(defaultLayoutFor(sec).length, sec).toBeGreaterThan(0)
      expect(SECTION_LABELS[sec], sec).toBeTruthy()
    }
  })

  it('chaque section connaît TOUS les widgets, visibles ou non', () => {
    // Un widget absent d'une section doit rester disponible dans son tiroir :
    // on ne l'interdit pas, on ne le propose simplement pas d'emblée.
    for (const sec of SECTIONS) {
      const ids = normalizeLayoutFor(sec, null).map(w => w.id).sort()
      expect(ids, sec).toEqual(Object.keys(WIDGETS).sort())
    }
  })

  it('chaque section affiche au moins un widget par défaut', () => {
    for (const sec of SECTIONS) {
      expect(normalizeLayoutFor(sec, null).some(w => w.visible), sec).toBe(true)
    }
  })

  it('les sections ne montrent pas toutes la même chose', () => {
    // Sinon les onglets n'auraient aucun intérêt.
    const shown = SECTIONS.map(sec =>
      normalizeLayoutFor(sec, null).filter(w => w.visible).map(w => w.id).join(','))
    expect(new Set(shown).size).toBe(SECTIONS.length)
  })

  it('normalizeAll produit les quatre sections', () => {
    const all = normalizeAll(null)
    expect(Object.keys(all).sort()).toEqual([...SECTIONS].sort())
  })

  it('reprend une ancienne disposition (tableau nu) comme Vue d ensemble', () => {
    // Avant les sous-sections, la colonne stockait un simple tableau. Personne
    // ne doit perdre son écran au passage.
    const all = normalizeAll([{ id: 'equity', w: 4, visible: true }])
    expect(all[DEFAULT_SECTION][0].id).toBe('equity')
    expect(all[DEFAULT_SECTION][0].w).toBe(4)
    // Les autres sections repartent de LEUR défaut, pas de celui-là.
    expect(all.performance.filter(w => w.visible).map(w => w.id))
      .toEqual(defaultLayoutFor('performance').filter(w => w.visible).map(w => w.id))
  })

  it('isole les sections les unes des autres', () => {
    const all = normalizeAll(null)
    const touched = { ...all, payouts: setWidgetVisible(all.payouts, 'calendar', false) }
    expect(touched.payouts.find(w => w.id === 'calendar').visible).toBe(false)
    expect(touched.overview.find(w => w.id === 'calendar').visible).toBe(true)
  })

  it('ignore une section inconnue dans les données stockées', () => {
    const all = normalizeAll({ overview: [{ id: 'equity' }], ghostSection: [{ id: 'equity' }] })
    expect(Object.keys(all).sort()).toEqual([...SECTIONS].sort())
  })

  it('isDefaultLayout compare au défaut de SA section', () => {
    // La disposition par défaut de « Performance » n'est PAS celle de « Vue
    // d'ensemble » : les comparer sans préciser la section serait faux.
    expect(isDefaultLayout(defaultLayoutFor('performance'), 'performance')).toBe(true)
    expect(isDefaultLayout(defaultLayoutFor('performance'), 'overview')).toBe(false)
  })

  it('normalizeLayout sans section reste sur Vue d ensemble', () => {
    expect(normalizeLayout(DEFAULT_LAYOUT)).toEqual(normalizeLayoutFor(DEFAULT_SECTION, DEFAULT_LAYOUT))
  })
})
