'use client'
// Comparateur PropFirms — tableau matriciel avec firmes en colonnes et règles en lignes.
// 2 onglets : Règles (drawdown/cohérence/etc.) et Prix (challenges/frais/payouts).
// Sections délimitées : Challenge / Financé / Trading commun.
// Plan selector unifié (toggles entre 25K, 50K, 100K, 150K).
//
// Admin editing : si user.email === ADMIN_EMAIL, des crayons ✏️ s'affichent sur chaque
// cellule, permettant de modifier la valeur (override stocké en DB Supabase).
// Les overrides s'appliquent par-dessus les valeurs par défaut de constants.js.

import { useState, useEffect, useMemo } from 'react'
import { PROPFIRM_RULES } from '../lib/constants'
import { getFirmLogo } from '../lib/firmLogos'
import { TooltipIcon } from './Tooltip'
import { supabase } from '../lib/supabase'

// Email admin autorisé à modifier les règles (synchro avec les RLS policies Supabase)
const ADMIN_EMAIL = 'bakkali-omar@hotmail.com'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  surface3: '#222637',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
  red: '#e8504a',
}

// === Définition des règles à comparer ===
// Pour chaque ligne du tableau : un label, une regex pour trouver la clé dans les rules,
// et une couleur d'affichage de la valeur.
//
// La regex match les clés des PROPFIRM_RULES de constants.js (qui varient par firme).

const COMPARE_RULES = {
  challenge: [
    { label: 'Objectif de profit', regex: /^objectif/i, color: 'green', tip: 'Profit cumulé à atteindre pour valider la phase Challenge et passer en Financé.' },
    { label: 'Drawdown trailing max', regex: /drawdown\s+trailing/i, color: 'red', tip: 'Plafond de perte qui suit ton balance peak. Plus permissif qu\'un static.' },
    { label: 'Drawdown journalier max', regex: /drawdown\s+journalier/i, color: 'red', tip: 'Perte maximum tolérée sur 1 journée. Réinitialisé chaque jour.' },
    { label: 'Jours de trading min', regex: /jours.*trading.*min/i, color: 'text', tip: 'Nombre min de jours pour pouvoir demander un payout.' },
    { label: 'Profit min jour valide', regex: /profit\s*min.*jour|min.*winning|jour.*valid/i, color: 'text', tip: 'Profit minimum sur 1 jour pour qu\'il compte comme jour validé.' },
    { label: 'Règle de cohérence', regex: /cohérence|consistency/i, color: 'amber', tip: '% max d\'un jour vs total des gains. Plus c\'est BAS mieux c\'est.' },
    { label: 'Limite de temps Eval', regex: /limite.*temps|time.*limit/i, color: 'text', tip: 'Durée maximum pour valider l\'évaluation.' },
  ],
  funded: [
    { label: 'Frais activation', regex: /^frais activation/i, color: 'red', tip: 'Coût one-time pour activer le compte Financé.' },
    { label: 'Répartition gains', regex: /répartition.*gains|profit.*split/i, color: 'green', tip: '% que tu touches après payout.' },
    { label: 'Payout minimum', regex: /^payout minimum/i, color: 'text', tip: 'Montant minimum pour demander un payout.' },
    { label: 'Payout maximum', regex: /^payout maximum/i, color: 'text', tip: 'Plafond du montant retirable par payout.' },
    { label: 'Conditions payout', regex: /conditions payout/i, color: 'text', tip: 'Conditions à respecter pour avoir le droit de demander un payout.' },
    { label: 'Délai payout', regex: /^délai payout/i, color: 'text', tip: 'Temps entre la demande et la réception du virement.' },
    { label: 'Mode de retrait', regex: /mode.*retrait/i, color: 'text', tip: 'Méthodes de paiement disponibles.' },
    { label: 'Cadence payout', regex: /cadence/i, color: 'text', tip: 'Fréquence à laquelle tu peux demander un payout.' },
    { label: 'Comptes financés simul.', regex: /comptes financés simul|comptes simul|combines simul/i, color: 'text', tip: 'Nombre max de comptes Financés actifs en même temps.' },
  ],
  common: [
    { label: 'Heures de trading', regex: /heures.*trading|horaires/i, color: 'text' },
    { label: 'Positions overnight', regex: /^positions overnight/i, color: 'text', tip: 'Garder une position ouverte la nuit / weekend.' },
    { label: 'Trading des news', regex: /trading.*news|annonces éco/i, color: 'text' },
    { label: 'DCA (renforcement)', regex: /^dca/i, color: 'text', tip: 'Renforcer une position perdante en moyenne sur le prix.' },
    { label: 'Contrats max (mini)', regex: /contrats max.*mini\b/i, color: 'text' },
    { label: 'Contrats max (micro)', regex: /contrats max.*micro/i, color: 'text' },
    { label: 'Inactivité max', regex: /inactivité/i, color: 'text', tip: 'Temps sans trader avant suspension du compte.' },
  ],
}

const COMPARE_PRICES = [
  { label: 'Prix mensuel', regex: /prix.*mensuel/i, color: 'amber', tip: 'Coût mensuel du compte d\'évaluation (modèle abonnement).' },
  { label: 'Prix one-time', regex: /prix.*one[\s-]?time/i, color: 'amber', tip: 'Coût unique one-time du compte (modèle pay-once).' },
  { label: 'Prix évaluation', regex: /prix.*évaluation|prix.*eval/i, color: 'amber', tip: 'Prix challenge selon le pricing principal de la firme.' },
  { label: 'Frais activation funded', regex: /frais activation funded|frais activation pa|frais activation pro|frais activation exhib|frais activation$/i, color: 'red', tip: 'Coût one-time pour activer le compte une fois passé.' },
  { label: 'Reset cost', regex: /^reset cost|reset compte/i, color: 'text', tip: 'Coût pour reset l\'évaluation après un échec.' },
  { label: 'Data fee funded', regex: /data.*fee/i, color: 'red', tip: 'Frais mensuel data feed (Rithmic, CQG) sur compte funded.' },
  { label: 'Payout minimum', regex: /^payout minimum/i, color: 'text' },
]

// Cherche une règle dans un objet de rules par regex sur la clé
function findRuleValue(firmRules, regex, plan) {
  if (!firmRules) return null
  const key = Object.keys(firmRules).find(k => regex.test(k))
  if (!key) return null
  const rule = firmRules[key]
  // Essaye le plan exact, sinon fallback sur '50k' (plan de référence), sinon 1ère valeur
  return rule[plan] || rule['50k'] || rule[Object.keys(rule)[0]] || null
}

// Liste des firmes triées par ordre alphabétique (Topstep en 1er car le + connu)
function getFirms() {
  const all = Object.keys(PROPFIRM_RULES)
  // Force Topstep en 1er, puis le reste alphabétique
  return ['Topstep', ...all.filter(f => f !== 'Topstep').sort()]
}

const FIRM_COLORS = {
  'Topstep': '#ff8c42',
  'Apex Trader Funding': '#a78bfa',
  'Bulenox': '#e8504a',
  'Lucid Trading': '#4d8fff',
  'Tradeify': '#1db87a',
  'Take Profit Trader': '#fac775',
  'My Funded Futures': '#fb923c',
  'Phidias Propfirm': '#1e2a4a',
  'Funded Futures Network': '#a86bff',
  'FuturesELites': '#f472b6',
}

const COLOR_MAP = {
  green: C.green, red: C.red, amber: C.amber, text: C.text,
}

// Plans communs disponibles à comparer (la plupart des firmes ont 25K, 50K, 100K, 150K)
const COMMON_PLANS = ['25k', '50k', '100k', '150k']

export default function PropfirmComparator({ user }) {
  const [tab, setTab] = useState('rules') // 'rules' | 'pricing'
  const [plan, setPlan] = useState('50k')
  const firms = useMemo(() => getFirms(), [])

  // === Admin editing ===
  const isAdmin = user?.email === ADMIN_EMAIL
  // Map des overrides : key = `${firmName}::${ruleKey}::${plan}`, value = string
  const [overrides, setOverrides] = useState({})
  const [loadingOverrides, setLoadingOverrides] = useState(true)
  // Modal d'édition : null ou { firm, ruleLabel, ruleKey, plan, currentValue, isOverride }
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Charge les overrides depuis Supabase au montage
  useEffect(() => {
    let mounted = true
    async function load() {
      const { data, error } = await supabase.from('propfirm_rules').select('firm_name, rule_key, plan, value')
      if (!mounted) return
      if (error) {
        // Table absente ou RLS bloque → on continue sans overrides (fallback constants.js)
        console.warn('[PropfirmComparator] overrides not loaded:', error.message)
        setOverrides({})
      } else {
        const map = {}
        ;(data || []).forEach(row => {
          map[`${row.firm_name}::${row.rule_key}::${row.plan}`] = row.value
        })
        setOverrides(map)
      }
      setLoadingOverrides(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  // Helper : retourne la valeur effective (override si présent, sinon valeur par défaut de constants.js)
  function getEffectiveValue(firm, ruleKey, plan) {
    const overrideKey = `${firm}::${ruleKey}::${plan}`
    if (overrides[overrideKey] !== undefined) {
      return { value: overrides[overrideKey], isOverride: true }
    }
    const firmRules = PROPFIRM_RULES[firm]?.rules
    if (!firmRules || !firmRules[ruleKey]) return { value: null, isOverride: false }
    const rule = firmRules[ruleKey]
    const value = rule[plan] || rule['50k'] || rule[Object.keys(rule)[0]] || null
    return { value, isOverride: false }
  }

  // Ouvre le modal d'édition pour une cellule
  function openEdit(firm, ruleLabel, ruleKey, currentValue, isOverride) {
    setEditing({ firm, ruleLabel, ruleKey, plan, currentValue, isOverride })
    setEditValue(currentValue || '')
  }

  // Save un override dans Supabase (upsert)
  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    const overrideKey = `${editing.firm}::${editing.ruleKey}::${editing.plan}`
    const { error } = await supabase.from('propfirm_rules').upsert({
      firm_name: editing.firm,
      rule_key: editing.ruleKey,
      plan: editing.plan,
      value: editValue.trim(),
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    }, { onConflict: 'firm_name,rule_key,plan' })
    setSaving(false)
    if (error) {
      alert('Erreur enregistrement : ' + error.message)
      return
    }
    setOverrides(prev => ({ ...prev, [overrideKey]: editValue.trim() }))
    setEditing(null)
  }

  // Reset : supprime l'override → retour à la valeur par défaut de constants.js
  async function resetEdit() {
    if (!editing) return
    if (!confirm('Supprimer cet override et revenir à la valeur par défaut (codée) ?')) return
    setSaving(true)
    const { error } = await supabase.from('propfirm_rules')
      .delete()
      .eq('firm_name', editing.firm)
      .eq('rule_key', editing.ruleKey)
      .eq('plan', editing.plan)
    setSaving(false)
    if (error) {
      alert('Erreur suppression : ' + error.message)
      return
    }
    const overrideKey = `${editing.firm}::${editing.ruleKey}::${editing.plan}`
    setOverrides(prev => {
      const copy = { ...prev }
      delete copy[overrideKey]
      return copy
    })
    setEditing(null)
  }

  // Helper pour rendre une cellule (valeur ou tiret)
  const renderCell = (value, color) => {
    const display = value || '—'
    const isEmpty = !value || value === '—' || value.toLowerCase() === 'non spécifié'
    return (
      <td style={{
        padding: '12px 14px',
        textAlign: 'right',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        fontSize: 12, fontWeight: isEmpty ? 400 : 600,
        color: isEmpty ? C.text3 : (COLOR_MAP[color] || C.text),
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
        minWidth: 130,
        maxWidth: 220,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }} title={value || ''}>
        {display}
      </td>
    )
  }

  // Header de section avec barre colorée à gauche
  const SectionHeader = ({ icon, title, color, count }) => (
    <tr>
      <td colSpan={firms.length + 1} style={{
        padding: '14px 16px',
        background: `linear-gradient(90deg, ${color}22 0%, transparent 100%)`,
        borderLeft: `3px solid ${color}`,
        borderTop: `1px solid ${C.border}`,
        position: 'sticky',
        left: 0,
        zIndex: 2,
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
          <span style={{ fontSize: 10, color: C.text3, fontWeight: 600 }}>· {count} règles</span>
        </div>
      </td>
    </tr>
  )

  // Ligne de règle (label sticky + valeurs par firme)
  // - Cherche la VRAIE clé dans PROPFIRM_RULES via regex (pour le lookup d'override)
  // - Applique override si présent, sinon valeur constants.js
  // - Si admin : affiche crayon ✏️ pour éditer
  const renderRow = (rule) => (
    <tr key={rule.label}>
      <td style={{
        padding: '12px 14px',
        background: C.surface,
        position: 'sticky',
        left: 0,
        zIndex: 1,
        borderRight: `2px solid ${C.border2}`,
        borderBottom: `1px solid ${C.border}`,
        fontSize: 12,
        color: C.text2,
        fontWeight: 500,
        minWidth: 200,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {rule.label}
          {rule.tip && <TooltipIcon text={rule.tip} maxWidth={300} />}
        </span>
      </td>
      {firms.map(firm => {
        const firmRules = PROPFIRM_RULES[firm]?.rules
        // Trouve la vraie clé dans la firme qui match la regex
        const ruleKey = firmRules ? Object.keys(firmRules).find(k => rule.regex.test(k)) : null
        const { value, isOverride } = ruleKey
          ? getEffectiveValue(firm, ruleKey, plan)
          : { value: null, isOverride: false }
        const displayVal = value || '—'
        const isEmpty = !value || value === '—' || (typeof value === 'string' && value.toLowerCase() === 'non spécifié')
        return (
          <td key={firm} style={{
            padding: '12px 14px',
            textAlign: 'right',
            borderBottom: `1px solid ${C.border}`,
            background: isOverride ? 'rgba(45,111,255,0.06)' : C.surface,
            fontSize: 12, fontWeight: !isEmpty ? 600 : 400,
            color: isEmpty ? C.text3 : (COLOR_MAP[rule.color] || C.text),
            verticalAlign: 'middle',
            whiteSpace: 'nowrap',
            minWidth: 130,
            maxWidth: 220,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            position: 'relative',
          }} title={isOverride ? `${displayVal} (modifié par admin)` : displayVal}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              {isOverride && (
                <span title="Valeur modifiée par l'admin" style={{
                  fontSize: 9, color: C.blueLight, opacity: 0.8,
                }}>●</span>
              )}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayVal}</span>
              {isAdmin && ruleKey && (
                <button
                  onClick={() => openEdit(firm, rule.label, ruleKey, value, isOverride)}
                  title={`Modifier ${rule.label} pour ${firm} (${plan.toUpperCase()})`}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: C.text3, fontSize: 11, padding: '2px 4px',
                    borderRadius: 4, opacity: 0.5, transition: 'opacity 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = C.blueLight }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = 0.5; e.currentTarget.style.color = C.text3 }}
                >✏️</button>
              )}
            </div>
          </td>
        )
      })}
    </tr>
  )

  return (
    <div className="page-pad" style={{ maxWidth: '100%', margin: '0 auto', padding: '28px 24px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>📋 Comparateur PropFirms</h1>
        {isAdmin && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 99,
            background: 'rgba(45,111,255,0.10)', border: `1px solid ${C.blue}`,
            fontSize: 11, fontWeight: 700, color: C.blueLight,
          }}>
            🔧 MODE ADMIN — clique sur ✏️ pour modifier les cellules
          </span>
        )}
      </div>
      <p style={{ fontSize: 13, color: C.text3, marginBottom: 22 }}>
        Compare les règles, drawdowns, payouts et prix des {firms.length} PropFirms supportées sur Quantara.
        {loadingOverrides && ' · ⏳ Chargement des overrides admin...'}
      </p>

      {/* Tabs + Plan selector */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, marginBottom: 20, flexWrap: 'wrap',
      }}>
        {/* Tabs */}
        <div style={{
          display: 'inline-flex', background: C.surface, padding: 4, borderRadius: 99,
          border: `1px solid ${C.border}`,
        }}>
          <button onClick={() => setTab('rules')} style={{
            padding: '8px 18px', borderRadius: 99, border: 'none',
            background: tab === 'rules' ? C.blue : 'transparent',
            color: tab === 'rules' ? '#fff' : C.text2,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}>📊 Comparateur règles</button>
          <button onClick={() => setTab('pricing')} style={{
            padding: '8px 18px', borderRadius: 99, border: 'none',
            background: tab === 'pricing' ? C.blue : 'transparent',
            color: tab === 'pricing' ? '#fff' : C.text2,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}>💰 Comparateur prix</button>
        </div>

        {/* Plan selector */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan</span>
          <div style={{
            display: 'inline-flex', background: C.surface, padding: 3, borderRadius: 99,
            border: `1px solid ${C.border}`,
          }}>
            {COMMON_PLANS.map(p => (
              <button key={p} onClick={() => setPlan(p)} style={{
                padding: '6px 14px', borderRadius: 99, border: 'none',
                background: plan === p ? C.blue : 'transparent',
                color: plan === p ? '#fff' : C.text2,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}>{p.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau comparateur */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{
            width: '100%', borderCollapse: 'separate', borderSpacing: 0,
            minWidth: firms.length * 150 + 220,
          }}>
            {/* Header avec logos + noms */}
            <thead>
              <tr>
                <th style={{
                  padding: '14px 16px',
                  background: C.surface2,
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  borderBottom: `1px solid ${C.border}`,
                  borderRight: `2px solid ${C.border2}`,
                  textAlign: 'left',
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.text3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  minWidth: 200,
                }}>Règle</th>
                {firms.map(firm => (
                  <th key={firm} style={{
                    padding: '14px 12px',
                    background: C.surface2,
                    borderBottom: `1px solid ${C.border}`,
                    textAlign: 'center',
                    minWidth: 130,
                    maxWidth: 180,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      {getFirmLogo(firm, FIRM_COLORS[firm] || C.blue, 32)}
                      <div style={{
                        fontSize: 11, fontWeight: 600, color: C.text,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: 160,
                      }} title={firm}>{firm}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {tab === 'rules' && (
                <>
                  <SectionHeader icon="🟡" title="Phase Challenge / Évaluation" color={C.amber} count={COMPARE_RULES.challenge.length} />
                  {COMPARE_RULES.challenge.map(renderRow)}
                  <SectionHeader icon="✅" title="Une fois Financé" color={C.green} count={COMPARE_RULES.funded.length} />
                  {COMPARE_RULES.funded.map(renderRow)}
                  <SectionHeader icon="📊" title="Trading (commun aux 2 phases)" color={C.blueLight} count={COMPARE_RULES.common.length} />
                  {COMPARE_RULES.common.map(renderRow)}
                </>
              )}
              {tab === 'pricing' && (
                <>
                  <SectionHeader icon="💰" title={`Prix & Frais (Plan ${plan.toUpperCase()})`} color={C.amber} count={COMPARE_PRICES.length} />
                  {COMPARE_PRICES.map(renderRow)}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <div style={{
          padding: '14px 18px', background: C.surface2, borderTop: `1px solid ${C.border}`,
          fontSize: 11, color: C.text3, lineHeight: 1.5,
        }}>
          ⚠️ Ces règles sont indicatives. Les PropFirms changent régulièrement leurs conditions —
          consulte toujours le site officiel pour la version à jour. Dernière vérification : mai 2026.
        </div>
      </div>

      {/* Légende des couleurs */}
      <div style={{
        marginTop: 18, display: 'flex', gap: 14, flexWrap: 'wrap',
        fontSize: 11, color: C.text3,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: C.green }} />
          Objectif / Profit split (positif)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: C.red }} />
          Drawdown / Frais (limite ou coût)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: C.amber }} />
          Cohérence / Prix (variable)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: C.text3 }}>—</span>
          Non applicable / Non spécifié
        </span>
        {isAdmin && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: C.blueLight }}>●</span>
            Valeur modifiée par l'admin (override)
          </span>
        )}
      </div>

      {/* Modal d'édition admin */}
      {editing && (
        <div
          onClick={() => !saving && setEditing(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: C.surface, borderRadius: 14, padding: 28,
              width: '100%', maxWidth: 480,
              border: `1px solid ${C.border2}`,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
              {getFirmLogo(editing.firm, FIRM_COLORS[editing.firm] || C.blue, 28)}
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{editing.firm}</div>
                <div style={{ fontSize: 11, color: C.text3 }}>Plan {editing.plan.toUpperCase()}</div>
              </div>
            </div>
            <div style={{
              padding: '10px 0', marginBottom: 16, marginTop: 14,
              borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 11, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Règle</div>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{editing.ruleLabel}</div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 4, fontFamily: 'monospace' }}>
                clé interne : <code>{editing.ruleKey}</code>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                Nouvelle valeur
              </label>
              <input
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                placeholder="Ex : $99 ou 5 jours"
                autoFocus
                style={{
                  width: '100%', padding: '10px 14px', fontSize: 14,
                  background: C.surface2, border: `1px solid ${C.border2}`,
                  borderRadius: 8, color: C.text, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <div style={{ fontSize: 11, color: C.text3, marginTop: 6, lineHeight: 1.5 }}>
                Tu peux mettre du texte libre (ex: "$99", "Aucun", "≤ 50%"). Cette valeur s'appliquera partout
                où on affiche cette règle, et pour tous tes utilisateurs.
              </div>
            </div>
            {editing.isOverride && (
              <div style={{
                padding: '10px 12px', marginBottom: 16,
                background: 'rgba(45,111,255,0.08)', border: `1px solid rgba(45,111,255,0.25)`,
                borderRadius: 8, fontSize: 11, color: C.blueLight,
              }}>
                ● Cette cellule est déjà un override admin. Click "Réinitialiser" pour revenir à la valeur codée par défaut.
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {editing.isOverride && (
                <button onClick={resetEdit} disabled={saving} style={{
                  padding: '10px 18px', fontSize: 12, fontWeight: 600,
                  borderRadius: 8, border: `1px solid ${C.border2}`,
                  background: 'transparent', color: C.text3, cursor: saving ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                }}>↺ Réinitialiser</button>
              )}
              <button onClick={() => setEditing(null)} disabled={saving} style={{
                padding: '10px 18px', fontSize: 12, fontWeight: 600,
                borderRadius: 8, border: `1px solid ${C.border2}`,
                background: 'transparent', color: C.text, cursor: saving ? 'wait' : 'pointer',
                fontFamily: 'inherit',
              }}>Annuler</button>
              <button onClick={saveEdit} disabled={saving} style={{
                padding: '10px 22px', fontSize: 13, fontWeight: 600,
                borderRadius: 8, border: 'none',
                background: saving ? C.surface3 : C.blue, color: '#fff',
                cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(45,111,255,0.35)',
              }}>{saving ? '⏳ Enregistrement...' : '✓ Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
