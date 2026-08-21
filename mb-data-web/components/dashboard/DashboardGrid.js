'use client'
// components/dashboard/DashboardGrid.js — la grille personnalisable.
//
// En lecture, elle se contente de poser les widgets visibles dans l'ordre choisi.
// En mode édition, chaque widget gagne une poignée de déplacement, un sélecteur
// de largeur et un bouton pour le masquer ; les widgets masqués attendent dans
// un tiroir en bas.
//
// Le glissé-déposé utilise l'API HTML5 native — pas de librairie. Elle a un défaut
// connu : elle ne marche pas au doigt sur mobile. D'où les flèches ‹ › qui font
// le même travail au clic, et qui servent aussi de chemin clavier accessible.

import { useState } from 'react'
import { useT } from '../LanguageProvider'
import { GRID_COLUMNS, WIDGETS } from '../../lib/dashboardLayout'

export default function DashboardGrid({
  layout, editing, setEditing, move, resize, toggle, reset, render, S,
}) {
  const t = useT()
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)

  const visible = layout.filter(w => w.visible)
  const hidden = layout.filter(w => !w.visible)

  // Déplacement d'un cran, utilisable au clic et au clavier.
  function nudge(id, dir) {
    const i = visible.findIndex(w => w.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= visible.length) return
    move(id, visible[j].id)
  }

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap', marginBottom: 16,
      }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>
          {editing ? t('app.widgets.editHint') : ''}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editing && (
            <button onClick={reset} style={{ ...S.btnGhost, fontSize: 12.5 }}>
              {t('app.widgets.reset')}
            </button>
          )}
          <button
            onClick={() => setEditing(!editing)}
            style={editing ? { ...S.btnPrimary, fontSize: 12.5 } : { ...S.btnGhost, fontSize: 12.5 }}
            aria-pressed={editing}
          >
            {editing ? t('app.widgets.done') : t('app.widgets.customize')}
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
        columnGap: 16,
        // La barre d'outils flotte au-dessus de son widget. Sans écart de ligne
        // supplémentaire en édition, elle recouvre la carte de la rangée du dessus.
        rowGap: editing ? 40 : 16,
        marginBottom: 28,
      }} className="qt-widget-grid">
        {visible.map((w, i) => {
          const spec = WIDGETS[w.id]
          if (!spec) return null
          const isDragged = dragId === w.id
          const isOver = overId === w.id && dragId && dragId !== w.id
          return (
            <section
              key={w.id}
              className="qt-widget"
              style={{
                gridColumn: `span ${w.w}`,
                minWidth: 0,
                position: 'relative',
                opacity: isDragged ? 0.4 : 1,
                outline: isOver ? '2px dashed var(--blue)' : 'none',
                outlineOffset: 4,
                borderRadius: 'var(--radius-lg)',
                transition: 'opacity .15s',
              }}
              draggable={editing}
              onDragStart={e => { setDragId(w.id); e.dataTransfer.effectAllowed = 'move' }}
              onDragEnd={() => { setDragId(null); setOverId(null) }}
              onDragOver={e => { if (editing && dragId) { e.preventDefault(); setOverId(w.id) } }}
              onDragLeave={() => setOverId(o => (o === w.id ? null : o))}
              onDrop={e => {
                e.preventDefault()
                if (dragId) move(dragId, w.id)
                setDragId(null); setOverId(null)
              }}
            >
              {editing && (
                <WidgetToolbar
                  widget={w}
                  spec={spec}
                  first={i === 0}
                  last={i === visible.length - 1}
                  onNudge={dir => nudge(w.id, dir)}
                  onResize={nw => resize(w.id, nw)}
                  onHide={() => toggle(w.id, false)}
                  t={t}
                />
              )}
              {/* En édition on neutralise les interactions internes : un clic doit
                  saisir le widget, pas ouvrir le tiroir d'une firme. */}
              <div style={editing ? { pointerEvents: 'none', userSelect: 'none' } : undefined}>
                {render(w.id)}
              </div>
            </section>
          )
        })}
      </div>

      {editing && (
        <div style={{ ...S.card, padding: '18px 20px', marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            {t('app.widgets.hiddenTitle')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
            {hidden.length === 0 ? t('app.widgets.hiddenEmpty') : t('app.widgets.hiddenHint')}
          </div>
          {hidden.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {hidden.map(w => (
                <button
                  key={w.id}
                  onClick={() => toggle(w.id, true)}
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
                  {t(WIDGETS[w.id].titleKey)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

function WidgetToolbar({ widget, spec, first, last, onNudge, onResize, onHide, t }) {
  const btn = {
    width: 30, height: 30, minWidth: 30, minHeight: 30,
    display: 'grid', placeItems: 'center',
    borderRadius: 9, cursor: 'pointer', fontSize: 13, lineHeight: 1,
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    color: 'var(--text2)', fontFamily: 'inherit',
  }
  const widths = [1, 2, 3, 4].filter(n => n >= spec.minW)

  return (
    <div style={{
      position: 'absolute', top: -14, right: 10, zIndex: 5,
      display: 'flex', alignItems: 'center', gap: 6,
      padding: 5, borderRadius: 'var(--radius)',
      background: 'var(--glass-solid)',
      border: '1px solid var(--border2)',
      boxShadow: 'var(--shadow-pop)',
      backdropFilter: 'blur(18px)',
    }}>
      <span
        title={t('app.widgets.drag')}
        aria-hidden="true"
        style={{ ...btn, cursor: 'grab', border: 'none', background: 'transparent', color: 'var(--text3)' }}
      >⠿</span>

      <button style={{ ...btn, opacity: first ? 0.35 : 1 }} disabled={first}
              onClick={() => onNudge(-1)} aria-label={t('app.widgets.moveUp')}>‹</button>
      <button style={{ ...btn, opacity: last ? 0.35 : 1 }} disabled={last}
              onClick={() => onNudge(1)} aria-label={t('app.widgets.moveDown')}>›</button>

      <span style={{ width: 1, height: 20, background: 'var(--border2)' }} />

      <span style={{ display: 'flex', gap: 3 }} role="group" aria-label={t('app.widgets.width')}>
        {widths.map(n => (
          <button
            key={n}
            onClick={() => onResize(n)}
            aria-pressed={widget.w === n}
            aria-label={`${t('app.widgets.width')} ${n}/${GRID_COLUMNS}`}
            style={{
              ...btn, width: 26, minWidth: 26, fontSize: 11, fontWeight: 600,
              background: widget.w === n ? 'var(--blue)' : 'var(--surface2)',
              color: widget.w === n ? 'var(--text-inverse)' : 'var(--text3)',
              borderColor: widget.w === n ? 'var(--blue)' : 'var(--border2)',
            }}
          >{n}</button>
        ))}
      </span>

      <span style={{ width: 1, height: 20, background: 'var(--border2)' }} />

      <button style={{ ...btn, color: 'var(--red)' }} onClick={onHide}
              aria-label={t('app.widgets.hide')} title={t('app.widgets.hide')}>✕</button>
    </div>
  )
}
