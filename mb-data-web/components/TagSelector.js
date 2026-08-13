'use client'
// components/TagSelector.js — Multi-select tags pour journal_entries.
//
// Affiche les 12 tags prédéfinis groupés par catégorie + permet d'ajouter
// des tags custom via un input texte.
//
// USAGE :
//   <TagSelector value={form.tags} onChange={tags => setForm(p => ({...p, tags}))} />
//
// PROPS :
//   - value     : array de tag IDs sélectionnés (ex: ['fomo', 'a-plus', 'custom-tag'])
//   - onChange  : (newTags: string[]) => void
//   - compact   : si true, layout plus dense (utilisé dans le filter du journal)

import { useState } from 'react'
import {
  TRADE_TAGS,
  TAGS_BY_CATEGORY,
  TAG_CATEGORIES,
  getTagDisplay,
  normalizeTag,
} from '../lib/tradeTags'

const C = {
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  border: 'var(--border)',
  border2: 'var(--border2)',
  surface: 'var(--tint1)',
  blue: 'var(--blue)',
}

// Badge cliquable (toggle selected / unselected)
function TagBadge({ tag, selected, onClick, removable, onRemove, compact }) {
  const display = getTagDisplay(tag.id)
  return (
    <button
      type="button"
      onClick={onClick}
      title={display.description || display.label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: compact ? '2px 8px' : '4px 10px',
        fontSize: compact ? 10 : 11,
        fontWeight: 600,
        borderRadius: 99,
        background: selected ? display.bg : 'transparent',
        color: selected ? display.color : C.text3,
        border: `1px solid ${selected ? display.color + '55' : C.border}`,
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        letterSpacing: '0.2px',
        whiteSpace: 'nowrap',
        outline: 'none',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = C.surface }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      {display.label}
      {removable && (
        <span
          onClick={e => { e.stopPropagation(); onRemove?.() }}
          style={{
            fontSize: 11, lineHeight: 1,
            color: display.color, opacity: 0.7,
            marginLeft: 2, cursor: 'pointer',
          }}
        >×</span>
      )}
    </button>
  )
}

export default function TagSelector({ value = [], onChange, compact = false }) {
  const [customInput, setCustomInput] = useState('')
  const selectedSet = new Set(value)

  // Toggle un tag preset
  const toggle = (id) => {
    if (selectedSet.has(id)) {
      onChange(value.filter(v => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  // Ajouter un tag custom depuis l'input
  const addCustom = () => {
    const norm = normalizeTag(customInput)
    if (!norm) return
    if (selectedSet.has(norm)) {
      setCustomInput('')
      return
    }
    onChange([...value, norm])
    setCustomInput('')
  }

  // Tags custom déjà sélectionnés (ceux qui ne sont pas dans les presets)
  const presetIds = new Set(TRADE_TAGS.map(t => t.id))
  const customTags = value.filter(v => !presetIds.has(v))

  // Mode compact (filtre journal) : tout en ligne, sans grouping
  if (compact) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {TRADE_TAGS.map(tag => (
          <TagBadge
            key={tag.id}
            tag={tag}
            selected={selectedSet.has(tag.id)}
            onClick={() => toggle(tag.id)}
            compact
          />
        ))}
      </div>
    )
  }

  // Mode complet (form trade) : tags groupés par catégorie + input custom
  return (
    <div>
      {/* Groupes de tags prédéfinis */}
      {Object.entries(TAG_CATEGORIES).map(([catKey, catMeta]) => (
        <div key={catKey} style={{ marginBottom: 10 }}>
          <div style={{
            fontSize: 9,
            color: C.text3,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            marginBottom: 5,
            fontWeight: 700,
          }}>
            {catMeta.icon} {catMeta.label}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {(TAGS_BY_CATEGORY[catKey] || []).map(tag => (
              <TagBadge
                key={tag.id}
                tag={tag}
                selected={selectedSet.has(tag.id)}
                onClick={() => toggle(tag.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Tags custom déjà ajoutés */}
      {customTags.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{
            fontSize: 9,
            color: C.text3,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            marginBottom: 5,
            fontWeight: 700,
          }}>
            ✦ Tags custom
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {customTags.map(id => (
              <TagBadge
                key={id}
                tag={{ id }}
                selected
                removable
                onRemove={() => onChange(value.filter(v => v !== id))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Input pour ajouter un tag custom */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <input
          type="text"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
          placeholder="ex: open-NFP, MFE-2R..."
          maxLength={30}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: 11,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            color: C.text,
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!normalizeTag(customInput)}
          style={{
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 600,
            background: normalizeTag(customInput) ? C.blue : C.surface,
            color: normalizeTag(customInput) ? '#fff' : C.text3,
            border: `1px solid ${normalizeTag(customInput) ? C.blue : C.border}`,
            borderRadius: 6,
            cursor: normalizeTag(customInput) ? 'pointer' : 'not-allowed',
            transition: 'all 0.12s',
          }}
        >
          + Ajouter
        </button>
      </div>
    </div>
  )
}

// === Composant léger pour AFFICHER les tags d'un trade (read-only) ===
// Usage dans la liste des trades :
//   <TagDisplay tags={entry.tags} compact />
export function TagDisplay({ tags, compact = false, max = null }) {
  if (!tags || tags.length === 0) return null
  const shown = max ? tags.slice(0, max) : tags
  const hidden = max && tags.length > max ? tags.length - max : 0
  return (
    <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {shown.map(id => {
        const d = getTagDisplay(id)
        return (
          <span
            key={id}
            title={d.description}
            style={{
              display: 'inline-block',
              padding: compact ? '1px 6px' : '2px 8px',
              fontSize: compact ? 9 : 10,
              fontWeight: 600,
              borderRadius: 99,
              background: d.bg,
              color: d.color,
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
            }}
          >{d.label}</span>
        )
      })}
      {hidden > 0 && (
        <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>
          +{hidden}
        </span>
      )}
    </div>
  )
}
