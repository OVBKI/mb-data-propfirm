// lib/dashboardLayout.test.js — le modèle de personnalisation du dashboard.
//
// L'enjeu : une disposition enregistrée doit survivre aux évolutions du produit.
// Un widget ajouté, retiré ou renommé ne doit jamais casser l'écran de quelqu'un.
// Et depuis le passage aux INSTANCES, deux copies d'un même widget doivent
// pouvoir cohabiter avec des réglages différents.

import { describe, it, expect } from 'vitest'
import {
  DEFAULT_LAYOUT, WIDGETS, GRID_COLUMNS, MAX_ROWS,
  SECTIONS, DEFAULT_SECTION, SECTION_LABELS, PRESETS, LAYOUT_VERSION,
  normalizeLayout, normalizeLayoutFor, normalizeAll, normalizeOptions,
  defaultLayoutFor, defaultOptions, makeInstance, applyPreset, serializeAll,
  isDefaultLayout, moveWidget, setWidgetWidth, setWidgetHeight, setWidgetVisible,
  setWidgetTitle, setWidgetOption, duplicateWidget, removeWidget,
  exportLayout, importLayout,
} from './dashboardLayout'

const ids = (l) => l.map(x => x.id)
const keys = (l) => l.map(x => x.i)
const find = (l, key) => l.find(x => x.i === key)

describe('normalizeLayoutFor — reprise et réparation', () => {
  it('accepte une disposition par défaut sans la modifier', () => {
    for (const sec of SECTIONS) {
      expect(normalizeLayoutFor(sec, defaultLayoutFor(sec)), sec)
        .toEqual(defaultLayoutFor(sec))
    }
  })

  it('reconstruit une disposition à partir de n importe quoi', () => {
    // Entrées possibles : première visite, localStorage corrompu, colonne vide.
    for (const junk of [null, undefined, [], 'nope', 42, {}]) {
      const out = normalizeLayout(junk)
      expect(out).toHaveLength(DEFAULT_LAYOUT.length)
      expect([...ids(out)].sort()).toEqual(Object.keys(WIDGETS).sort())
    }
  })

  it('écarte les widgets inconnus sans laisser de trou', () => {
    const out = normalizeLayout([{ id: 'ghost', w: 2 }, { id: 'equity', w: 2 }])
    expect(ids(out)).not.toContain('ghost')
    expect(out[0].id).toBe('equity')
  })

  it('GARDE deux instances du même widget, avec des clés distinctes', () => {
    // C'est ce que la duplication produit. L'ancien modèle les fusionnait.
    const out = normalizeLayout([{ id: 'equity', w: 4 }, { id: 'equity', w: 2 }])
    const equities = out.filter(x => x.id === 'equity')
    expect(equities).toHaveLength(2)
    expect(equities[0].w).toBe(4)
    expect(equities[1].w).toBe(2)
    expect(new Set(keys(out)).size).toBe(out.length)
  })

  it('forge une clé neuve quand deux instances la partagent', () => {
    // Des clés en double casseraient les clés React et le glisser-déposer.
    const out = normalizeLayout([
      { i: 'dup', id: 'equity' }, { i: 'dup', id: 'payouts' },
    ])
    expect(new Set(keys(out)).size).toBe(out.length)
  })

  it('ajoute un widget inédit à la fin, masqué', () => {
    // Enrichir le catalogue ne doit pas réorganiser l'écran des utilisateurs.
    const out = normalizeLayout([{ id: 'equity', visible: true }])
    const added = out.find(x => x.id === 'health')
    expect(added).toBeDefined()
    expect(added.visible).toBe(false)
    expect(out[0].id).toBe('equity')
  })

  it('pose « résultat net » derrière « santé des comptes », visible comme lui', () => {
    // Le chiffre s'affichait DANS le widget santé. Le poser masqué le ferait
    // disparaître d'un écran où l'utilisateur le voyait déjà.
    const out = normalizeLayout([{ id: 'health', visible: true }])
    const at = out.findIndex(x => x.id === 'net')
    expect(out[at - 1].id).toBe('health')
    expect(out[at].visible).toBe(true)
  })

  it('ne rend pas « résultat net » visible si « santé » était masqué', () => {
    const out = normalizeLayout([{ id: 'health', visible: false }])
    expect(out.find(x => x.id === 'net').visible).toBe(false)
  })

  it('laisse « résultat net » en place quand la disposition le porte déjà', () => {
    // La reprise est à usage unique : elle ne doit pas rejouer à chaque montage.
    const once = normalizeLayout([{ id: 'health', visible: true }])
    const twice = normalizeLayout(once)
    expect(twice.filter(x => x.id === 'net')).toHaveLength(1)
    expect(ids(twice)).toEqual(ids(once))
  })

  it('borne largeur et hauteur entre le minimum du widget et la grille', () => {
    const out = normalizeLayout([
      { id: 'insight', w: 1, h: 9 },     // minW = 2
      { id: 'payouts', w: 99, h: 0 },
      { id: 'equity', w: -5, h: -1 },
    ])
    const at = (id) => out.find(x => x.id === id)
    expect(at('insight').w).toBe(WIDGETS.insight.minW)
    expect(at('insight').h).toBe(MAX_ROWS)
    expect(at('payouts').w).toBe(GRID_COLUMNS)
    expect(at('payouts').h).toBe(WIDGETS.payouts.defaultH)
    expect(at('equity').w).toBe(WIDGETS.equity.minW)
  })

  it('traite une taille non numérique comme la taille par défaut', () => {
    const out = normalizeLayout([{ id: 'equity', w: 'large', h: 'tall' }])
    expect(out[0].w).toBe(WIDGETS.equity.defaultW)
    expect(out[0].h).toBe(WIDGETS.equity.defaultH)
  })

  it('ne masque que sur `visible: false` explicite', () => {
    // `undefined` doit rester visible : une disposition ancienne sans le champ
    // ne doit pas faire disparaître la moitié de l'écran.
    expect(normalizeLayout([{ id: 'equity' }])[0].visible).toBe(true)
    expect(normalizeLayout([{ id: 'equity', visible: false }])[0].visible).toBe(false)
  })

  it('nettoie et borne les titres personnalisés', () => {
    expect(normalizeLayout([{ id: 'equity', title: '  Ma courbe  ' }])[0].title).toBe('Ma courbe')
    expect(normalizeLayout([{ id: 'equity', title: '   ' }])[0].title).toBeNull()
    expect(normalizeLayout([{ id: 'equity', title: 42 }])[0].title).toBeNull()
    expect(normalizeLayout([{ id: 'equity', title: 'x'.repeat(80) }])[0].title).toHaveLength(40)
  })

  it('est idempotente', () => {
    const once = normalizeLayout([{ id: 'stats', w: 9 }, { id: 'zzz' }, { id: 'equity', title: ' A ' }])
    expect(normalizeLayout(once)).toEqual(once)
  })
})

describe('options', () => {
  it('remplit les défauts déclarés au catalogue', () => {
    expect(defaultOptions('equity')).toEqual({ range: '7m', cumulative: true })
    expect(defaultOptions('insight')).toEqual({})
    expect(defaultOptions('ghost')).toEqual({})
  })

  it('rejette une valeur hors liste au profit du défaut', () => {
    // Une valeur que le widget ne sait pas interpréter contaminerait son rendu.
    expect(normalizeOptions('equity', { range: 'centuries' }).range).toBe('7m')
    expect(normalizeOptions('health', { sort: 'random' }).sort).toBe('risk')
    expect(normalizeOptions('health', { limit: 999 }).limit).toBe(4)
  })

  it('exige un vrai booléen pour un interrupteur', () => {
    expect(normalizeOptions('equity', { cumulative: 'yes' }).cumulative).toBe(true)
    expect(normalizeOptions('equity', { cumulative: false }).cumulative).toBe(false)
  })

  it('ignore les options non déclarées', () => {
    const out = normalizeOptions('equity', { range: '3m', bogus: 1 })
    expect(out).toEqual({ range: '3m', cumulative: true })
  })

  it('setWidgetOption valide la valeur au passage', () => {
    const l = normalizeLayout(null)
    expect(find(setWidgetOption(l, 'equity', 'range', '12m'), 'equity').options.range).toBe('12m')
    expect(find(setWidgetOption(l, 'equity', 'range', 'nope'), 'equity').options.range).toBe('7m')
  })
})

describe('duplication', () => {
  it('insère la copie juste après l originale', () => {
    const l = normalizeLayout(null)
    const out = duplicateWidget(l, 'equity')
    const at = out.findIndex(x => x.i === 'equity')
    expect(out[at + 1].id).toBe('equity')
    expect(out[at + 1].i).not.toBe('equity')
    expect(out).toHaveLength(l.length + 1)
  })

  it('donne à la copie ses propres options', () => {
    // Deux courbes sur deux périodes : c'est tout l'intérêt de la duplication.
    let l = duplicateWidget(normalizeLayout(null), 'equity')
    const copyKey = l.filter(x => x.id === 'equity')[1].i
    l = setWidgetOption(l, copyKey, 'range', '12m')
    expect(find(l, 'equity').options.range).toBe('7m')
    expect(find(l, copyKey).options.range).toBe('12m')
  })

  it('refuse de dupliquer un widget marqué non duplicable', () => {
    // Deux « à faire maintenant » côte à côte diraient la même chose deux fois.
    const l = normalizeLayout(null)
    expect(duplicateWidget(l, 'insight')).toBe(l)
    expect(duplicateWidget(l, 'firms')).toBe(l)
  })

  it('ignore une clé inconnue', () => {
    const l = normalizeLayout(null)
    expect(duplicateWidget(l, 'ghost')).toBe(l)
  })

  it('ne réutilise jamais une clé déjà prise', () => {
    let l = normalizeLayout(null)
    for (let n = 0; n < 4; n++) l = duplicateWidget(l, 'equity')
    expect(new Set(keys(l)).size).toBe(l.length)
  })
})

describe('removeWidget', () => {
  it('supprime une copie', () => {
    const l = duplicateWidget(normalizeLayout(null), 'equity')
    const copyKey = l.filter(x => x.id === 'equity')[1].i
    const out = removeWidget(l, copyKey)
    expect(out.filter(x => x.id === 'equity')).toHaveLength(1)
  })

  it('MASQUE la dernière instance au lieu de la supprimer', () => {
    // Sinon le widget disparaîtrait du tiroir et deviendrait irrécupérable.
    const l = normalizeLayout(null)
    const out = removeWidget(l, 'equity')
    expect(out).toHaveLength(l.length)
    expect(find(out, 'equity').visible).toBe(false)
  })

  it('ignore une clé inconnue', () => {
    const l = normalizeLayout(null)
    expect(removeWidget(l, 'ghost')).toBe(l)
  })
})

describe('opérations de taille et d ordre', () => {
  it('applique une largeur et une hauteur valides', () => {
    const l = normalizeLayout(null)
    expect(find(setWidgetWidth(l, 'payouts', 3), 'payouts').w).toBe(3)
    expect(find(setWidgetHeight(l, 'payouts', 2), 'payouts').h).toBe(2)
  })

  it('refuse de descendre sous le minimum du widget', () => {
    // La carte d'insight porte un titre et un paragraphe : sur une colonne elle
    // serait illisible.
    const l = normalizeLayout(null)
    expect(find(setWidgetWidth(l, 'insight', 1), 'insight').w).toBe(WIDGETS.insight.minW)
  })

  it('plafonne à la grille', () => {
    const l = normalizeLayout(null)
    expect(find(setWidgetWidth(l, 'stats', 12), 'stats').w).toBe(GRID_COLUMNS)
    expect(find(setWidgetHeight(l, 'stats', 12), 'stats').h).toBe(MAX_ROWS)
  })

  it('rend la MÊME disposition quand rien ne change', () => {
    // Une nouvelle référence ferait re-rendre la grille pour rien et remplirait
    // l'historique d'annulation d'étapes vides.
    const l = normalizeLayout(null)
    expect(setWidgetWidth(l, 'ghost', 2)).toBe(l)
    expect(setWidgetVisible(l, 'ghost', false)).toBe(l)
    expect(setWidgetTitle(l, 'ghost', 'x')).toBe(l)
    expect(moveWidget(l, 'equity', 'equity')).toBe(l)
    expect(moveWidget(l, 'equity', 'ghost')).toBe(l)
  })

  it('déplace sans perdre d instance, dans les deux sens', () => {
    const l = normalizeLayout(null)
    const first = l[0].i, last = l[l.length - 1].i
    expect([...keys(moveWidget(l, first, last))].sort()).toEqual([...keys(l)].sort())
    expect([...keys(moveWidget(l, last, first))].sort()).toEqual([...keys(l)].sort())
    expect(moveWidget(l, last, first)[0].i).toBe(last)
  })
})

describe('setWidgetTitle', () => {
  it('enregistre un titre et revient au défaut sur un vide', () => {
    const l = normalizeLayout(null)
    expect(find(setWidgetTitle(l, 'equity', ' Ma courbe '), 'equity').title).toBe('Ma courbe')
    expect(find(setWidgetTitle(l, 'equity', '   '), 'equity').title).toBeNull()
  })
})

describe('sous-sections', () => {
  it('déclare une disposition et un libellé pour chaque section', () => {
    for (const sec of SECTIONS) {
      expect(defaultLayoutFor(sec).length, sec).toBeGreaterThan(0)
      expect(SECTION_LABELS[sec], sec).toBeTruthy()
    }
  })

  it('chaque section connaît TOUS les widgets, visibles ou non', () => {
    for (const sec of SECTIONS) {
      expect([...new Set(ids(normalizeLayoutFor(sec, null)))].sort(), sec)
        .toEqual(Object.keys(WIDGETS).sort())
    }
  })

  it('les sections ne montrent pas toutes la même chose', () => {
    const shown = SECTIONS.map(sec =>
      normalizeLayoutFor(sec, null).filter(x => x.visible).map(x => x.id).join(','))
    expect(new Set(shown).size).toBe(SECTIONS.length)
  })

  it('reprend une ancienne disposition (tableau nu) comme Vue d ensemble', () => {
    const all = normalizeAll([{ id: 'equity', w: 4, visible: true }])
    expect(all[DEFAULT_SECTION][0].id).toBe('equity')
    expect(all[DEFAULT_SECTION][0].w).toBe(4)
    expect(all.performance.filter(x => x.visible).map(x => x.id))
      .toEqual(defaultLayoutFor('performance').filter(x => x.visible).map(x => x.id))
  })

  it('accepte la forme versionnée comme la forme nue', () => {
    const bare = normalizeAll({ overview: [{ id: 'equity' }] })
    const wrapped = normalizeAll({ version: LAYOUT_VERSION, sections: { overview: [{ id: 'equity' }] } })
    expect(wrapped).toEqual(bare)
  })

  it('isole les sections les unes des autres', () => {
    const all = normalizeAll(null)
    const touched = { ...all, payouts: setWidgetVisible(all.payouts, 'calendar', false) }
    expect(find(touched.payouts, 'calendar').visible).toBe(false)
    expect(find(touched.overview, 'calendar').visible).toBe(true)
  })

  it('ignore une section inconnue', () => {
    const all = normalizeAll({ overview: [{ id: 'equity' }], ghostSection: [{ id: 'equity' }] })
    expect(Object.keys(all).sort()).toEqual([...SECTIONS].sort())
  })
})

describe('presets', () => {
  it('ne garde visible que ce que le preset énumère', () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      const out = applyPreset('overview', key)
      if (!preset.keep) continue
      expect(out.filter(x => x.visible).map(x => x.id).sort(), key)
        .toEqual([...preset.keep].sort())
    }
  })

  it('« complet » rend la disposition par défaut de la section', () => {
    expect(isDefaultLayout(applyPreset('overview', 'full'), 'overview')).toBe(true)
    expect(isDefaultLayout(applyPreset('risk', 'full'), 'risk')).toBe(true)
  })

  it('garde TOUS les widgets dans la disposition, même masqués', () => {
    // Un preset restreint la vue, il n'ampute pas le tiroir.
    const out = applyPreset('overview', 'minimal')
    expect([...new Set(ids(out))].sort()).toEqual(Object.keys(WIDGETS).sort())
  })

  it('ignore un preset inconnu', () => {
    expect(isDefaultLayout(applyPreset('overview', 'ghost'), 'overview')).toBe(true)
  })
})

describe('isDefaultLayout', () => {
  it('reconnaît le défaut de sa propre section', () => {
    expect(isDefaultLayout(defaultLayoutFor('performance'), 'performance')).toBe(true)
    expect(isDefaultLayout(defaultLayoutFor('performance'), 'overview')).toBe(false)
  })

  it('détecte chaque forme de personnalisation', () => {
    const l = normalizeLayout(null)
    expect(isDefaultLayout(setWidgetWidth(l, 'equity', 4))).toBe(false)
    expect(isDefaultLayout(setWidgetHeight(l, 'equity', 1))).toBe(false)
    expect(isDefaultLayout(setWidgetVisible(l, 'stats', false))).toBe(false)
    expect(isDefaultLayout(setWidgetTitle(l, 'equity', 'Perso'))).toBe(false)
    expect(isDefaultLayout(setWidgetOption(l, 'equity', 'range', '12m'))).toBe(false)
    expect(isDefaultLayout(duplicateWidget(l, 'equity'))).toBe(false)
  })
})

describe('import / export', () => {
  it('fait l aller-retour sans rien perdre', () => {
    let all = normalizeAll(null)
    all = { ...all, overview: setWidgetTitle(all.overview, 'equity', 'Ma courbe') }
    const res = importLayout(exportLayout(all))
    expect(res.ok).toBe(true)
    expect(res.value).toEqual(all)
  })

  it('produit un JSON versionné', () => {
    const parsed = JSON.parse(exportLayout(normalizeAll(null)))
    expect(parsed.version).toBe(LAYOUT_VERSION)
    expect(Object.keys(parsed.sections).sort()).toEqual([...SECTIONS].sort())
  })

  it('signale un JSON invalide sans lever', () => {
    // L'appelant affiche l'erreur à l'utilisateur ; il ne gère pas une exception.
    expect(importLayout('pas du json')).toEqual({ ok: false, error: 'parse' })
    expect(importLayout('')).toEqual({ ok: false, error: 'parse' })
  })

  it('refuse un JSON valide mais étranger', () => {
    expect(importLayout('{"hello":"world"}').ok).toBe(false)
    expect(importLayout('null').ok).toBe(false)
    expect(importLayout('"texte"').ok).toBe(false)
  })

  it('répare une disposition importée abîmée', () => {
    const res = importLayout(JSON.stringify({
      version: 2,
      sections: { overview: [{ id: 'equity', w: 99 }, { id: 'ghost' }] },
    }))
    expect(res.ok).toBe(true)
    expect(find(res.value.overview, 'equity').w).toBe(GRID_COLUMNS)
    expect(ids(res.value.overview)).not.toContain('ghost')
  })
})

describe('catalogue', () => {
  it('chaque widget du défaut existe, et réciproquement', () => {
    expect([...new Set(ids(DEFAULT_LAYOUT))].sort()).toEqual(Object.keys(WIDGETS).sort())
  })

  it('chaque taille par défaut respecte son propre minimum', () => {
    for (const [id, spec] of Object.entries(WIDGETS)) {
      expect(spec.defaultW, id).toBeGreaterThanOrEqual(spec.minW)
      expect(spec.defaultW, id).toBeLessThanOrEqual(GRID_COLUMNS)
      expect(spec.defaultH, id).toBeGreaterThanOrEqual(spec.minH)
      expect(spec.defaultH, id).toBeLessThanOrEqual(MAX_ROWS)
    }
  })

  it('chaque option déclare un défaut admis par ses propres valeurs', () => {
    for (const [id, spec] of Object.entries(WIDGETS)) {
      for (const [key, o] of Object.entries(spec.options || {})) {
        if (o.type === 'select') expect(o.values, `${id}.${key}`).toContain(o.default)
        if (o.type === 'toggle') expect(typeof o.default, `${id}.${key}`).toBe('boolean')
        expect(o.labelKey, `${id}.${key}`).toBeTruthy()
      }
    }
  })

  it('makeInstance produit une instance complète et valide', () => {
    const x = makeInstance('equity')
    expect(x).toMatchObject({ i: 'equity', id: 'equity', visible: true, title: null })
    expect(x.options).toEqual(defaultOptions('equity'))
    expect(makeInstance('ghost')).toBeNull()
  })

  it('serializeAll enveloppe avec la version courante', () => {
    expect(serializeAll({ a: 1 })).toEqual({ version: LAYOUT_VERSION, sections: { a: 1 } })
  })
})
