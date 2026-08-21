'use client'
// components/dashboard/WidgetToolbar.js — les commandes d'une instance en édition.
//
// Deux niveaux : la barre visible (déplacer, largeur, hauteur, réglages,
// supprimer) et un panneau qui se déplie pour le titre et les options du widget.
// Tout n'a pas à tenir sur une seule rangée — la barre resterait illisible sur
// un widget d'une colonne.

import { useEffect, useRef, useState } from 'react'
import { useT } from '../LanguageProvider'
import { GRID_COLUMNS, MAX_ROWS, WIDGETS } from '../../lib/dashboardLayout'

const btn = {
  width: 30, height: 30, minWidth: 30, minHeight: 30,
  display: 'grid', placeItems: 'center',
  borderRadius: 9, cursor: 'pointer', fontSize: 13, lineHeight: 1,
  background: 'var(--surface2)', border: '1px solid var(--border2)',
  color: 'var(--text2)', fontFamily: 'inherit',
}

export default function WidgetToolbar({
  widget, first, last,
  onNudge, onResize, onHeight, onRename, onOption, onDuplicate, onRemove,
}) {
  const t = useT()
  const spec = WIDGETS[widget.id]
  const [panel, setPanel] = useState(false)
  const panelRef = useRef(null)

  // Un clic ailleurs referme le panneau : sans ça, ouvrir les réglages d'un
  // second widget laisserait deux panneaux ouverts l'un sur l'autre.
  useEffect(() => {
    if (!panel) return
    function onDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setPanel(false)
    }
    function onKey(e) { if (e.key === 'Escape') setPanel(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [panel])

  if (!spec) return null

  const widths = [1, 2, 3, 4].filter(n => n >= spec.minW)
  const heights = Array.from({ length: MAX_ROWS }, (_, k) => k + 1).filter(n => n >= spec.minH)
  const hasOptions = Object.keys(spec.options || {}).length > 0

  const seg = (values, current, onPick, label, fmt = String) => (
    <span style={{ display: 'flex', gap: 3 }} role="group" aria-label={label}>
      {values.map(n => (
        <button
          key={n}
          onClick={() => onPick(n)}
          aria-pressed={current === n}
          aria-label={`${label} ${fmt(n)}`}
          style={{
            ...btn, width: 26, minWidth: 26, fontSize: 11, fontWeight: 600,
            background: current === n ? 'var(--blue)' : 'var(--surface2)',
            color: current === n ? 'var(--text-inverse)' : 'var(--text3)',
            borderColor: current === n ? 'var(--blue)' : 'var(--border2)',
          }}
        >{fmt(n)}</button>
      ))}
    </span>
  )

  return (
    <div ref={panelRef} style={{ position: 'absolute', top: -14, right: 10, zIndex: 5 }}>
      <div style={{
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

        <Sep />
        {seg(widths, widget.w, onResize, t('app.widgets.width'))}
        <Sep />
        {seg(heights, widget.h, onHeight, t('app.widgets.height'), n => '▤'.repeat(n))}
        <Sep />

        {spec.duplicable && (
          <button style={btn} onClick={onDuplicate}
                  aria-label={t('app.widgets.duplicate')} title={t('app.widgets.duplicate')}>⧉</button>
        )}
        <button
          style={{ ...btn, background: panel ? 'var(--blue-bg)' : 'var(--surface2)', color: panel ? 'var(--blue)' : 'var(--text2)' }}
          onClick={() => setPanel(p => !p)}
          aria-expanded={panel}
          aria-label={t('app.widgets.settings')}
          title={t('app.widgets.settings')}
        >⚙</button>
        <button style={{ ...btn, color: 'var(--red)' }} onClick={onRemove}
                aria-label={t('app.widgets.remove')} title={t('app.widgets.remove')}>✕</button>
      </div>

      {panel && (
        <div style={{
          marginTop: 8, padding: '16px 18px', width: 280,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--glass-solid)',
          border: '1px solid var(--border2)',
          boxShadow: 'var(--shadow-pop)',
          backdropFilter: 'blur(18px)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <label style={{ display: 'block' }}>
            <span style={lbl}>{t('app.widgets.customTitle')}</span>
            <input
              value={widget.title || ''}
              onChange={e => onRename(e.target.value)}
              placeholder={t(spec.titleKey)}
              maxLength={40}
              style={{
                width: '100%', padding: '8px 11px', fontSize: 13,
                borderRadius: 'var(--radius)', border: '1px solid var(--border2)',
                background: 'var(--tint1)', color: 'var(--text)', outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </label>

          {hasOptions && Object.entries(spec.options).map(([key, opt]) => (
            <div key={key}>
              <span style={lbl}>{t(opt.labelKey)}</span>
              {opt.type === 'toggle' ? (
                <button
                  onClick={() => onOption(key, !widget.options[key])}
                  aria-pressed={Boolean(widget.options[key])}
                  style={{
                    width: 44, height: 24, borderRadius: 12, position: 'relative', padding: 0,
                    background: widget.options[key] ? 'var(--blue)' : 'var(--tint3)',
                    border: `1px solid ${widget.options[key] ? 'var(--blue)' : 'var(--border2)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2, left: widget.options[key] ? 22 : 2,
                    width: 18, height: 18, borderRadius: '50%',
                    background: widget.options[key] ? 'var(--text-inverse)' : 'var(--text2)',
                    transition: 'left .18s',
                  }} />
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {opt.values.map(v => (
                    <button
                      key={String(v)}
                      onClick={() => onOption(key, v)}
                      aria-pressed={widget.options[key] === v}
                      style={{
                        padding: '6px 11px', fontSize: 11.5, fontWeight: 600, minHeight: 30,
                        borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit',
                        background: widget.options[key] === v ? 'var(--blue)' : 'var(--tint1)',
                        color: widget.options[key] === v ? 'var(--text-inverse)' : 'var(--text2)',
                        border: `1px solid ${widget.options[key] === v ? 'var(--blue)' : 'var(--border2)'}`,
                      }}
                    >{optionValueLabel(t, key, v)}</button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {!hasOptions && (
            <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, margin: 0 }}>
              {t('app.widgets.noOptions')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// `t()` ne prend qu'une clé, sans repli. Les valeurs numériques (un plafond de
// lignes) n'ont pas besoin d'être traduites — on les affiche telles quelles et on
// ne réserve les clés i18n qu'aux valeurs qui sont des mots.
function optionValueLabel(t, optionKey, value) {
  if (typeof value === 'number') return String(value)
  return t(`app.widgets.val.${optionKey}.${value}`)
}

const lbl = {
  display: 'block', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 7,
}

function Sep() {
  return <span style={{ width: 1, height: 20, background: 'var(--border2)', flexShrink: 0 }} />
}
