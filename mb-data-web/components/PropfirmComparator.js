'use client'
// Comparateur PropFirms — tableau matriciel avec firmes en colonnes et règles en lignes.
// 2 onglets : Règles (drawdown/cohérence/etc.) et Prix (challenges/frais/payouts).
// Sections délimitées : Challenge / Financé / Trading commun.
// Plan selector unifié (toggles entre 25K, 50K, 100K, 150K).

import { useState, useMemo } from 'react'
import { PROPFIRM_RULES } from '../lib/constants'
import { getFirmLogo } from '../lib/firmLogos'
import { TooltipIcon } from './Tooltip'

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

export default function PropfirmComparator() {
  const [tab, setTab] = useState('rules') // 'rules' | 'pricing'
  const [plan, setPlan] = useState('50k')
  const firms = useMemo(() => getFirms(), [])

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
        const val = findRuleValue(firmRules, rule.regex, plan)
        return (
          <td key={firm} style={{
            padding: '12px 14px',
            textAlign: 'right',
            borderBottom: `1px solid ${C.border}`,
            background: C.surface,
            fontSize: 12, fontWeight: val ? 600 : 400,
            color: val ? (COLOR_MAP[rule.color] || C.text) : C.text3,
            verticalAlign: 'middle',
            whiteSpace: 'nowrap',
            minWidth: 130,
            maxWidth: 220,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }} title={val || '—'}>
            {val || '—'}
          </td>
        )
      })}
    </tr>
  )

  return (
    <div className="page-pad" style={{ maxWidth: '100%', margin: '0 auto', padding: '28px 24px 60px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>📋 Comparateur PropFirms</h1>
      <p style={{ fontSize: 13, color: C.text3, marginBottom: 22 }}>
        Compare les règles, drawdowns, payouts et prix des {firms.length} PropFirms supportées sur Quantara.
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
      </div>
    </div>
  )
}
