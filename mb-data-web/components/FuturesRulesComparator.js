'use client'
// FuturesRulesComparator — comparateur de RÈGLES futures (table groupée).
//
// Mockup : sélecteur de plan en haut, puis une table à deux groupes de colonnes
// (CHALLENGE / FINANCÉ), une ligne par MODÈLE de firme, les firmes multi-modèles
// étant regroupées (nom de firme en rowSpan + sous-label modèle par sous-ligne).
//
// Données : 100% consommées depuis lib/futuresComparison.js — RIEN n'est inventé.
// Chaque cellule passe par cleanCell(value, kind) qui :
//   - normalise un affichage court et lisible,
//   - retombe sur la valeur brute (tronquée) si l'extraction échoue,
//   - met TOUJOURS la valeur brute complète en title= (tooltip au survol).

import { useState, useMemo } from 'react'
import {
  getFuturesComparison,
  getFirmsWithComparison,
} from '../lib/futuresComparison'
import { plansForFirm, planSizeNum } from '../lib/constants'
import { getFirmLogo } from '../lib/firmLogos'

// === Tokens de thème (cohérents avec globals.css / lib/theme.js) ===
const C = {
  bg: '#0d0f14',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  border: 'var(--border)',
  border2: 'var(--border2)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  amber: '#fac775',
  green: '#10b981',
}

// === Normalisation d'une cellule =========================================
// kind ∈ 'money' | 'pct' | 'days' | 'buffer' | 'type'
// Retourne TOUJOURS { text, title } — title = valeur brute complète (tooltip).
function cleanCell(value, kind) {
  // null / undefined / '' → '—' pour tous les kinds
  if (value === null || value === undefined || value === '') {
    // buffer absent = 'Non' (mockup : Topstep/Alpha buffer = NON)
    return { text: kind === 'buffer' ? 'Non' : '—', title: '' }
  }

  const rawTitle = String(value)
  const raw = rawTitle.trim()

  // 'type' (ddType) : classification courte déjà normalisée → passe-through.
  if (kind === 'type') {
    return { text: raw, title: rawTitle }
  }

  const trunc = (s, n = 18) =>
    s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s

  // Extrait un montant et le formate en monnaie fr. On privilégie un montant
  // explicitement préfixé par '$' (ex: '5 winning days ≥ $150' → 150), sinon
  // on retombe sur le premier nombre rencontré. Jamais inventé : sinon null.
  const extractMoney = str => {
    // Run de chiffres + séparateurs de milliers usuels (espace, NBSP, thin
    // space, point, virgule). On privilégie un montant préfixé par '$'.
    const sepRun = '([\\d][\\d.,\\u00a0\\u2009 ]*)'
    const m = str.match(new RegExp('\\$\\s*' + sepRun)) || str.match(new RegExp(sepRun))
    if (!m) return null
    // Nettoie les séparateurs de milliers, garde un éventuel décimal.
    const digits = m[1].replace(/[\s\u00a0\u2009]/g, '')
    // '2,000' / '2.000' / '2,000.50' -> on isole la partie entiere.
    const cleaned = digits.replace(/[.,](?=\d{3}\b)/g, '')
    const num = parseFloat(cleaned.replace(',', '.'))
    if (!isFinite(num)) return null
    return fmtMoney(num)
  }

  if (kind === 'money') {
    if (typeof value === 'number') {
      return { text: fmtMoney(value), title: rawTitle }
    }
    if (/aucun/i.test(raw) || raw === '—') return { text: '—', title: rawTitle }
    const money = extractMoney(raw)
    if (money) return { text: money, title: rawTitle }
    return { text: trunc(raw), title: rawTitle }
  }

  if (kind === 'pct') {
    if (typeof value === 'number') {
      return { text: value + ' %', title: rawTitle }
    }
    if (/aucun/i.test(raw)) return { text: '—', title: rawTitle }
    const m = raw.match(/(\d+(?:[.,]\d+)?)\s*%/)
    if (m) return { text: m[1].replace(',', '.') + ' %', title: rawTitle }
    return { text: trunc(raw), title: rawTitle }
  }

  if (kind === 'days') {
    if (typeof value === 'number') {
      return { text: String(value), title: rawTitle }
    }
    const m = raw.match(/\d+/)
    if (m) return { text: m[0], title: rawTitle }
    return { text: trunc(raw), title: rawTitle }
  }

  if (kind === 'buffer') {
    if (/aucun|^non\b|^non$/i.test(raw)) return { text: 'Non', title: rawTitle }
    if (typeof value === 'number') return { text: fmtMoney(value), title: rawTitle }
    const money = extractMoney(raw)
    if (money) return { text: money, title: rawTitle }
    return { text: trunc(raw), title: rawTitle }
  }

  // fallback générique
  return { text: trunc(raw), title: rawTitle }
}

// Format monnaie fr : '2 000 $' (espace insécable comme séparateur de milliers).
function fmtMoney(num) {
  const neg = num < 0
  const abs = Math.abs(num)
  const int = Math.round(abs)
  const s = String(int).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (neg ? '-' : '') + s + ' $'
}

// Colonnes : libellé + kind appliqué.
// 'type' = nouveau champ ddType (classification courte, pas une valeur monnaie).
const CHALLENGE_COLS = [
  { key: 'ddType', label: 'Type', kind: 'type' },
  { key: 'drawdown', label: 'Drawdown', kind: 'money' },
  { key: 'dailyDrawdown', label: 'DD / jour', kind: 'money' },
  { key: 'objectif', label: 'Objectif', kind: 'money' },
  { key: 'consistance', label: 'Consistance', kind: 'pct' },
]
// FINANCÉ a perdu Drawdown + Drawdown journalier (demande user).
const FUNDED_COLS = [
  { key: 'buffer', label: 'Buffer', kind: 'buffer' },
  { key: 'jourMin', label: 'Jour min', kind: 'days' },
  { key: 'minDailyProfit', label: 'Valider 1 jour', kind: 'money' },
  { key: 'consistance', label: 'Consistance', kind: 'pct' },
]

const TOTAL_COLS = 1 + CHALLENGE_COLS.length + FUNDED_COLS.length // 1 + 5 + 4 = 10

export default function FuturesRulesComparator() {
  const firms = useMemo(() => getFirmsWithComparison(), [])

  // Union des tailles de plan sur toutes les firmes, triées par montant.
  const planOptions = useMemo(() => {
    const set = new Set()
    firms.forEach(f => plansForFirm(f).forEach(p => set.add(p)))
    return [...set].sort((a, b) => planSizeNum(a) - planSizeNum(b))
  }, [firms])

  const [plan, setPlan] = useState(() =>
    planOptions.includes('50k') ? '50k' : planOptions[0] || '50k'
  )

  // Sélection du modèle affiché par firme (firmes multi-modèles). Clé = nom de
  // firme, valeur = index du modèle. Défaut = index 0 (1er modèle) si absent.
  const [modelByFirm, setModelByFirm] = useState({})

  // '50k' → '50K'
  const fmtPlan = p => String(p).toUpperCase()

  return (
    <div className="page-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 60px' }}>
      {/* === En-tête === */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 11, color: C.blueLight, letterSpacing: '0.16em',
          marginBottom: 10, textTransform: 'uppercase', fontWeight: 600,
        }}>
          Comparateur de règles
        </div>
        <h1 style={{
          fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em',
          margin: 0, marginBottom: 8, lineHeight: 1.1, color: C.text,
        }}>
          Règles PropFirms Futures
        </h1>
        <p style={{ fontSize: 14, color: C.text3, margin: 0, lineHeight: 1.5 }}>
          Drawdown, consistance et conditions de financement — par taille de compte.
        </p>
      </div>

      {/* === Sélecteur de plan === */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22,
        padding: '14px 18px',
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
        alignItems: 'center',
      }}>
        <div style={{
          fontSize: 11, color: C.text3, letterSpacing: '0.12em',
          fontWeight: 600, textTransform: 'uppercase', marginRight: 4,
        }}>
          Taille de compte
        </div>
        {planOptions.map(p => {
          const active = p === plan
          return (
            <button
              key={p}
              onClick={() => setPlan(p)}
              style={{
                padding: '7px 16px', fontSize: 12.5, cursor: 'pointer',
                borderRadius: 99, fontWeight: active ? 700 : 500,
                minWidth: 48, minHeight: 32,
                border: `1px solid ${active ? 'rgba(45,111,255,0.45)' : C.border2}`,
                background: active ? 'rgba(45,111,255,0.16)' : 'transparent',
                color: active ? C.blueLight : C.text2,
                fontFamily: 'inherit', letterSpacing: '0.03em',
                transition: 'all 0.15s',
              }}>
              {fmtPlan(p)}
            </button>
          )
        })}
      </div>

      {/* === Table === */}
      <div style={{
        overflowX: 'auto',
        border: `1px solid ${C.border}`, borderRadius: 12,
        background: C.surface,
      }}>
        <table style={{
          borderCollapse: 'collapse', width: '100%', minWidth: 720,
          tableLayout: 'auto',
          fontSize: 12, color: C.text,
        }}>
          {/* En-tête groupé : PROPFIRM | CHALLENGE (5) | FINANCÉ (4) */}
          <thead>
            <tr>
              <th rowSpan={2} style={groupHeadCell('left')}>PropFirm</th>
              <th colSpan={CHALLENGE_COLS.length} style={{
                ...groupHeadCell(),
                color: C.amber, borderLeft: `1px solid ${C.border2}`,
              }}>CHALLENGE</th>
              <th colSpan={FUNDED_COLS.length} style={{
                ...groupHeadCell(),
                color: C.green, borderLeft: `1px solid ${C.border2}`,
              }}>FINANCÉ</th>
            </tr>
            <tr>
              {CHALLENGE_COLS.map((col, i) => (
                <th key={'c-' + col.key} style={{
                  ...subHeadCell(),
                  borderLeft: i === 0 ? `1px solid ${C.border2}` : undefined,
                }}>{col.label}</th>
              ))}
              {FUNDED_COLS.map((col, i) => (
                <th key={'f-' + col.key} style={{
                  ...subHeadCell(),
                  borderLeft: i === 0 ? `1px solid ${C.border2}` : undefined,
                }}>{col.label}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {firms.map((firm, firmIdx) => {
              const offered = plansForFirm(firm).includes(plan)
              const { models } = getFuturesComparison(firm, plan)
              const rowBg = firmIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'

              // Une SEULE ligne par firme : on affiche le modèle sélectionné.
              const multi = models.length > 1
              const selIdx = Math.min(modelByFirm[firm] ?? 0, Math.max(models.length - 1, 0))
              const model = models[selIdx] || null

              return (
                <tr key={firm} style={{
                  background: rowBg,
                  borderTop: `1px solid ${C.border2}`,
                  opacity: offered ? 1 : 0.45,
                }}>
                  {/* Cellule firme + sélecteur de modèle (si multi-modèles) */}
                  <td style={{
                    padding: '8px 10px', verticalAlign: 'top',
                    borderRight: `1px solid ${C.border2}`,
                    minWidth: 150, background: C.surface,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {getFirmLogo(firm, C.blue, 26)}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
                          {firm}
                        </div>
                        {!offered && (
                          <div style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>
                            plan non dispo
                          </div>
                        )}
                        {/* Modèle unique : simple label. Multi : sélecteur. */}
                        {offered && model && !multi && model.name && (
                          <div style={{
                            fontSize: 10, color: C.blueLight, fontWeight: 600,
                            marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase',
                          }}>{model.name}</div>
                        )}
                        {offered && multi && (
                          <select
                            value={selIdx}
                            onChange={e =>
                              setModelByFirm(prev => ({ ...prev, [firm]: Number(e.target.value) }))
                            }
                            aria-label={`Modèle ${firm}`}
                            style={{
                              marginTop: 6, maxWidth: 160,
                              fontSize: 11, fontFamily: 'inherit', fontWeight: 600,
                              color: C.blueLight, cursor: 'pointer',
                              background: C.surface2, border: `1px solid ${C.border2}`,
                              borderRadius: 7, padding: '4px 8px', minHeight: 32,
                            }}>
                            {models.map((m, i) => (
                              <option key={m.name || i} value={i} style={{ color: C.text, background: C.surface }}>
                                {m.name || `Modèle ${i + 1}`}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cellules de données du modèle sélectionné */}
                  {model ? (
                    <>
                      {CHALLENGE_COLS.map((col, ci) => {
                        // 'ddType' vit au niveau du modèle, pas dans .challenge.
                        const rawVal = col.key === 'ddType' ? model.ddType : model.challenge[col.key]
                        return (
                          <DataCell
                            key={'c-' + col.key}
                            cell={offered ? cleanCell(rawVal, col.kind) : { text: '—', title: '' }}
                            firstOfGroup={ci === 0}
                          />
                        )
                      })}
                      {FUNDED_COLS.map((col, ci) => (
                        <DataCell
                          key={'f-' + col.key}
                          cell={offered ? cleanCell(model.funded[col.key], col.kind) : { text: '—', title: '' }}
                          firstOfGroup={ci === 0}
                        />
                      ))}
                    </>
                  ) : (
                    // Firme sans modèle résolu (sécurité)
                    <td colSpan={TOTAL_COLS - 1} style={{ padding: '12px 14px', color: C.text3 }}>
                      —
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: C.text3, lineHeight: 1.5 }}>
        Survolez une cellule pour voir la règle complète. « — » = non documenté pour ce plan/modèle.
      </div>
    </div>
  )
}

// === Cellule de données ====================================================
function DataCell({ cell, firstOfGroup }) {
  return (
    <td
      title={cell.title || undefined}
      style={{
        padding: '8px 9px', whiteSpace: 'nowrap',
        verticalAlign: 'top',
        borderLeft: firstOfGroup ? `1px solid ${C.border2}` : `1px solid ${C.border}`,
        color: cell.text === '—' ? C.text3 : C.text,
        cursor: cell.title ? 'help' : 'default',
      }}>
      <div>{cell.text}</div>
    </td>
  )
}

// === Styles d'en-tête ======================================================
function groupHeadCell(align) {
  return {
    padding: '10px 10px',
    fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: C.text2,
    textAlign: align === 'left' ? 'left' : 'center',
    background: C.surface2,
    borderBottom: `1px solid ${C.border2}`,
    position: 'sticky', top: 0,
  }
}
function subHeadCell() {
  return {
    padding: '8px 9px',
    fontSize: 10, fontWeight: 600, letterSpacing: '0.03em',
    textTransform: 'uppercase',
    color: C.text3, textAlign: 'left', lineHeight: 1.2,
    background: C.surface2,
    borderBottom: `1px solid ${C.border2}`,
  }
}
