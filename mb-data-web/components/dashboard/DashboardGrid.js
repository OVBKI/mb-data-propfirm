'use client'
// components/dashboard/DashboardGrid.js — la grille personnalisable.
//
// En lecture, elle pose les instances visibles à leur taille. En édition, chaque
// instance gagne sa barre d'outils, et une barre générale apporte les presets,
// annuler/rétablir et l'import/export.
//
// Le glissé-déposé utilise l'API HTML5 native — pas de librairie. Elle a un
// défaut connu : elle ne marche pas au doigt sur mobile. D'où les flèches ‹ ›
// qui font le même travail au clic, et qui servent aussi de chemin clavier.

import { useState } from 'react'
import { useT } from '../LanguageProvider'
import { GRID_COLUMNS, WIDGETS, PRESETS } from '../../lib/dashboardLayout'
import WidgetToolbar from './WidgetToolbar'
import LayoutShareDialog from './LayoutShareDialog'

// Hauteur d'une rangée. Les widgets gardent leur contenu ; c'est un plancher,
// pas un carcan : un widget plus grand que sa rangée déborde vers le bas plutôt
// que de rogner ses données.
const ROW_MIN_HEIGHT = 148

export default function DashboardGrid({ dash, render, S }) {
  const t = useT()
  const [dragKey, setDragKey] = useState(null)
  const [overKey, setOverKey] = useState(null)
  const [share, setShare] = useState(false)

  const { layout, editing } = dash
  const visible = layout.filter(w => w.visible)
  const hidden = layout.filter(w => !w.visible)

  function nudge(key, dir) {
    const i = visible.findIndex(w => w.i === key)
    const j = i + dir
    if (i < 0 || j < 0 || j >= visible.length) return
    dash.move(key, visible[j].i)
  }

  return (
    <>
      <EditBar dash={dash} t={t} S={S} onShare={() => setShare(true)} />

      <div
        className="qt-widget-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
          gridAutoRows: `minmax(${ROW_MIN_HEIGHT}px, auto)`,
          columnGap: 16,
          // La barre d'outils flotte au-dessus de son widget. Sans écart de
          // ligne supplémentaire en édition, elle recouvre la rangée du dessus.
          rowGap: editing ? 40 : 16,
          marginBottom: 28,
        }}
      >
        {visible.map((w, i) => {
          const spec = WIDGETS[w.id]
          if (!spec) return null
          const isDragged = dragKey === w.i
          const isOver = overKey === w.i && dragKey && dragKey !== w.i
          return (
            <section
              key={w.i}
              className="qt-widget"
              style={{
                gridColumn: `span ${w.w}`,
                gridRow: `span ${w.h}`,
                minWidth: 0,
                position: 'relative',
                opacity: isDragged ? 0.4 : 1,
                outline: isOver ? '2px dashed var(--blue)' : 'none',
                outlineOffset: 4,
                borderRadius: 'var(--radius-lg)',
                transition: 'opacity .15s',
              }}
              draggable={editing}
              onDragStart={e => { setDragKey(w.i); e.dataTransfer.effectAllowed = 'move' }}
              onDragEnd={() => { setDragKey(null); setOverKey(null) }}
              onDragOver={e => { if (editing && dragKey) { e.preventDefault(); setOverKey(w.i) } }}
              onDragLeave={() => setOverKey(o => (o === w.i ? null : o))}
              onDrop={e => {
                e.preventDefault()
                if (dragKey) dash.move(dragKey, w.i)
                setDragKey(null); setOverKey(null)
              }}
            >
              {editing && (
                <WidgetToolbar
                  widget={w}
                  first={i === 0}
                  last={i === visible.length - 1}
                  onNudge={dir => nudge(w.i, dir)}
                  onResize={n => dash.resize(w.i, n)}
                  onHeight={n => dash.setHeight(w.i, n)}
                  onRename={v => dash.rename(w.i, v)}
                  onOption={(k, v) => dash.setOption(w.i, k, v)}
                  onDuplicate={() => dash.duplicate(w.i)}
                  onRemove={() => dash.remove(w.i)}
                />
              )}
              {/* En édition, on neutralise les interactions internes : un clic
                  doit saisir le widget, pas ouvrir le tiroir d'une firme. */}
              <div style={editing ? { pointerEvents: 'none', userSelect: 'none', height: '100%' } : { height: '100%' }}>
                {render(w)}
              </div>
            </section>
          )
        })}

        {visible.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', ...S.card, padding: '48px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t('app.widgets.emptyTitle')}</div>
            <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0 }}>{t('app.widgets.emptyBody')}</p>
          </div>
        )}
      </div>

      {editing && <HiddenTray hidden={hidden} onShow={k => dash.toggle(k, true)} t={t} S={S} />}

      {share && (
        <LayoutShareDialog
          onClose={() => setShare(false)}
          getText={dash.exportText}
          onImport={dash.importText}
        />
      )}
    </>
  )
}

// ── Barre générale d'édition ────────────────────────────────────────────────
function EditBar({ dash, t, S, onShare }) {
  const { editing } = dash
  const small = { ...S.btnGhost, fontSize: 12.5, padding: '7px 13px' }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap', marginBottom: 16,
    }}>
      <div style={{ fontSize: 13, color: 'var(--text3)' }}>
        {editing ? t('app.widgets.editHint') : ''}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {editing && (
          <>
            <PresetPicker dash={dash} t={t} S={S} />
            <span style={{ width: 1, height: 22, background: 'var(--border2)' }} />
            <button style={{ ...small, opacity: dash.canUndo ? 1 : 0.4 }} disabled={!dash.canUndo}
                    onClick={dash.undo} title={t('app.widgets.undo')}>↶</button>
            <button style={{ ...small, opacity: dash.canRedo ? 1 : 0.4 }} disabled={!dash.canRedo}
                    onClick={dash.redo} title={t('app.widgets.redo')}>↷</button>
            <button style={small} onClick={onShare}>{t('app.widgets.share')}</button>
            <button style={small} onClick={dash.reset}>{t('app.widgets.reset')}</button>
          </>
        )}
        <button
          onClick={() => dash.setEditing(!editing)}
          style={editing ? { ...S.btnPrimary, fontSize: 12.5 } : small}
          aria-pressed={editing}
        >
          {editing ? t('app.widgets.done') : t('app.widgets.customize')}
        </button>
      </div>
    </div>
  )
}

function PresetPicker({ dash, t, S }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11.5, color: 'var(--text3)' }}>{t('app.widgets.presets')}</span>
      {Object.entries(PRESETS).map(([key, p]) => (
        <button
          key={key}
          onClick={() => dash.preset(key)}
          style={{
            fontSize: 11.5, fontWeight: 600, padding: '6px 11px', minHeight: 30,
            borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit',
            background: 'var(--tint1)', border: '1px solid var(--border2)', color: 'var(--text2)',
          }}
        >{t(p.labelKey)}</button>
      ))}
    </span>
  )
}

// ── Tiroir des widgets masqués ──────────────────────────────────────────────
function HiddenTray({ hidden, onShow, t, S }) {
  return (
    <div style={{ ...S.card, padding: '18px 20px', marginBottom: 28 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        {t('app.widgets.hiddenTitle')}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: hidden.length ? 14 : 0 }}>
        {hidden.length === 0 ? t('app.widgets.hiddenEmpty') : t('app.widgets.hiddenHint')}
      </div>
      {hidden.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {hidden.map(w => (
            <button
              key={w.i}
              onClick={() => onShow(w.i)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 12.5, fontWeight: 500, padding: '8px 14px',
                minHeight: 32, cursor: 'pointer', fontFamily: 'inherit',
                borderRadius: 'var(--radius)',
                background: 'var(--tint1)',
                border: '1px dashed var(--border2)',
                color: 'var(--text2)',
              }}
            >
              <span aria-hidden="true" style={{ color: 'var(--blue)' }}>+</span>
              {w.title || t(WIDGETS[w.id].titleKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
