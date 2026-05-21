'use client'
// TODO i18n v3.1 — Composant non traduit. Strings FR : titres "Règles firmes",
// filtres (Drawdown, Profit split, Payout target…), drawer détail, libellés
// règles (Trailing/EOD/Static, Mini/Pro plans).
// Comparateur PropFirms — vue CARDS GRID avec filtres + drawer détail.
// Remplace l'ancienne table horizontale (UX galère pour comparer + mobile cassé).
//
// 3 vues :
//   - Grid (défaut) : cards firme avec stats clés, filtrable
//   - Compare (futur) : pick 2-3 firms pour comparaison side-by-side
//   - Recommandations (futur) : "Best for X" cards
//
// Données : PROPFIRM_RULES (lib/constants.js) — vérifiées mai 2026 via 4 agents de recherche.
//
// Admin override : si admin, charge les overrides depuis Supabase et les merge par-dessus.

import { useState, useEffect, useMemo } from 'react'
import { PROPFIRM_RULES } from '../lib/constants'
import { getFirmLogo } from '../lib/firmLogos'
import { supabase } from '../lib/supabase'
import { getAffiliateLink, AFFILIATE_DISCLAIMER } from '../lib/affiliateLinks'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  borderHover: 'rgba(45,111,255,0.4)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#10b981',
  greenSoft: 'rgba(16,185,129,0.12)',
  red: '#ef4444',
  redSoft: 'rgba(239,68,68,0.12)',
  amber: '#fac775',
  amberSoft: 'rgba(250,199,117,0.12)',
}

// === Métadonnées dérivées par firme — pour les cards et les filtres ===
// Chaque firme a :
//   - displayName : nom à afficher (vs clé qui peut avoir une typo legacy)
//   - color : couleur signature
//   - ddType : EOD | Intraday | Static | Mixed (pour filtres)
//   - hasDLL : true/false (pour filtre "No DLL")
//   - pricingModel : monthly | onetime | mixed
//   - splitMax : % max atteignable (100, 90, 80…)
//   - payoutSpeed : '24h' | '48h' | '7j' | 'bi-weekly' | 'daily' | 'windows'
//   - statusBadge : null | 'beta' | 'alert' | 'legacy' (alertes Trustpilot etc.)
//   - hallmark : 1 ligne qui décrit ce qui rend la firme unique
//   - tags : array de petits tags affichés sur la card
const FIRM_META = {
  'Topstep': {
    displayName: 'Topstep',
    color: '#2d6fff',
    ddType: 'Mixed',
    ddDetail: 'Intraday (Combine) → EOD (XFA/LFA)',
    hasDLL: true,
    pricingModel: 'monthly',
    pricingNote: '$49-149/mo',
    splitMax: 90,
    payoutSpeed: '24h',
    statusBadge: null,
    hallmark: 'Leader historique US — 3 phases Combine → XFA → LFA',
    tags: ['Mensuel', 'No overnight', '90/10 dès le $1'],
  },
  'Apex Trader Funding': {
    displayName: 'Apex Trader Funding',
    color: '#e8504a',
    ddType: 'Mixed',
    ddDetail: 'EOD ou Intraday (choix au checkout)',
    hasDLL: false,
    pricingModel: 'onetime',
    pricingNote: '~$15-75 avec code (one-time)',
    splitMax: 100,
    payoutSpeed: '5-11j',
    statusBadge: 'updated',
    hallmark: 'Apex 4.0 (mars 2026) : 100% split, no DLL, mais SL/TP obligatoires + DCA fail',
    tags: ['100% split', 'One-time', 'No DLL', '20 PA simul'],
  },
  'Lucid Trading': {
    displayName: 'Lucid Trading',
    color: '#a78bfa',
    ddType: 'EOD',
    ddDetail: 'EOD trailing sur toutes familles',
    hasDLL: true,
    pricingModel: 'onetime',
    pricingNote: '$94-260 (one-time)',
    splitMax: 90,
    payoutSpeed: '15 min',
    statusBadge: null,
    hallmark: '5 familles : Pro, Flex (no DLL), Direct (instant), Live (overnight), Maxx (invite)',
    tags: ['Payouts 15 min', '5 familles', 'EOD'],
  },
  'Tradeify': {
    displayName: 'Tradeify',
    color: '#10b981',
    ddType: 'EOD',
    ddDetail: 'EOD trailing · lock à +$100 au-dessus starting',
    hasDLL: true,
    pricingModel: 'onetime',
    pricingNote: '$59-510 (one-time, codes -33/50%)',
    splitMax: 90,
    payoutSpeed: 'windows',
    statusBadge: null,
    hallmark: 'DD lock +$100 starting (unique) · Select / Growth / Lightning Funded',
    tags: ['DD lock +$100', 'Crypto payouts', 'Windows fixes'],
  },
  'Take Profit Trader': {
    displayName: 'Take Profit Trader',
    color: '#fac775',
    ddType: 'Mixed',
    ddDetail: 'Test EOD → PRO INTRADAY (⚠ piège) → PRO+ EOD',
    hasDLL: false,
    pricingModel: 'monthly',
    pricingNote: '$150-360/mo (NOFEE40 -40% à vie)',
    splitMax: 90,
    payoutSpeed: '24h',
    statusBadge: null,
    hallmark: '3 phases Test → PRO → PRO+ · No DLL (supprimé jan 2025)',
    tags: ['3 phases', 'No DLL', 'Houston Texas'],
  },
  'My Funded Futures': {
    displayName: 'MyFundedFutures',
    color: '#4d8fff',
    ddType: 'Mixed',
    ddDetail: 'Rapid INTRADAY 4% · Core/Pro EOD 3% · Flex FIXED 4%',
    hasDLL: false,
    pricingModel: 'mixed',
    pricingNote: 'Mensuel + one-time',
    splitMax: 90,
    payoutSpeed: '48h',
    statusBadge: null,
    hallmark: '5 plans : Core (déprécié), Rapid (90/10), Pro (swing), Flex, Builder (48h payouts)',
    tags: ['5 plans', 'Builder 48h payouts', 'News strict 2 min'],
  },
  'Phidias Propfirm': {
    displayName: 'Phidias Propfirm',
    color: '#f472b6',
    ddType: 'Mixed',
    ddDetail: 'Static (25K) · EOD (Fundamental/Premium)',
    hasDLL: false,
    pricingModel: 'mixed',
    pricingNote: 'Mensuel + one-time',
    splitMax: 100,
    payoutSpeed: '1-4h',
    statusBadge: 'alert',
    hallmark: 'Premium Swing : split PROGRESSIF 75→80→85→90→100% (payout 5+) · 🇪🇺 équipe FR',
    tags: ['Split progressif 100%', 'Overnight + Weekend (Premium)', '⚠ Trustpilot 3.9'],
  },
  'Bulenox': {
    displayName: 'Bulenox',
    color: '#fb923c',
    ddType: 'Mixed',
    ddDetail: '2 options : No Scaling (real-time) ou EOD (avec DLL)',
    hasDLL: true,
    pricingModel: 'monthly',
    pricingNote: '$120-535/mo (codes -45/89%)',
    splitMax: 100,
    payoutSpeed: 'mercredi',
    statusBadge: null,
    hallmark: 'Choix binaire au checkout : No Scaling vs EOD · 100% premiers $10K puis 90/10',
    tags: ['Mensuel', 'No Scaling (no DLL)', '100% $10K puis 90/10'],
  },
  'Funded Futures Network': {
    displayName: 'Funded Futures Network',
    color: '#34d399',
    ddType: 'EOD',
    ddDetail: 'EOD trailing (éval) → STATIC (Funded post-Exhibition)',
    hasDLL: false,
    pricingModel: 'monthly',
    pricingNote: '$75-300/mo (VIBES ~50%)',
    splitMax: 90,
    payoutSpeed: 'daily',
    statusBadge: null,
    hallmark: 'Standard (15j, 40%) vs Express (7j, 15% — paradoxe : plus dur)',
    tags: ['Payouts daily (Live)', 'PayPal 15 min', 'Data fee $126/mo'],
  },
  'FuturesELites': {
    displayName: 'FuturesElite', // affichage corrigé singulier
    color: '#7c3aed',
    ddType: 'EOD',
    ddDetail: 'EOD trailing · lock starting (Instant) post-1er payout',
    hasDLL: true,
    pricingModel: 'mixed',
    pricingNote: '$49-419 (BLACK40 -40/50%)',
    splitMax: 100,
    payoutSpeed: 'bi-weekly',
    statusBadge: 'new',
    hallmark: '🌟 Split SCALING 80→90→100% · Crypto payouts same-day · 🇮🇹/🇬🇧 jeune firme',
    tags: ['Split scaling 100%', 'Crypto payouts', '2 comptes max'],
  },
  'Alpha Futures': {
    displayName: 'Alpha Futures',
    color: '#0a3a2a',
    ddType: 'TRAIL', // Trailing (close-to-close, lock à starting)
    ddDetail: 'Trailing 4% Premium/Zero · 3.5% Advanced · lock starting balance',
    hasDLL: true, // Daily Loss Guard $1000 sur Zero (uniquement)
    pricingModel: 'monthly',
    pricingNote: '$79-419/mo · Premium: $0 activation path dispo · Zero/Advanced: 0 activation',
    splitMax: 90,
    payoutSpeed: 'on-demand',
    statusBadge: null,
    hallmark: '🌟 Overnight + Weekend + Hold News autorisés · 3 plans (Premium/Zero/Advanced) · DXtrade',
    tags: ['Overnight OK', 'Hold news', '3 plans', 'DXtrade', '90% split'],
  },
}

// Filtres disponibles
const FILTERS = [
  { id: 'all', label: 'Toutes', test: () => true },
  { id: 'eod', label: 'EOD trailing', test: m => m.ddType === 'EOD' || m.ddDetail?.includes('EOD') },
  { id: 'intraday', label: 'Intraday', test: m => m.ddDetail?.includes('INTRADAY') || m.ddDetail?.includes('Intraday') },
  { id: 'no-dll', label: 'Sans DLL', test: m => m.hasDLL === false },
  { id: 'onetime', label: 'One-time', test: m => m.pricingModel === 'onetime' || m.pricingModel === 'mixed' },
  { id: 'monthly', label: 'Mensuel', test: m => m.pricingModel === 'monthly' || m.pricingModel === 'mixed' },
  { id: '100split', label: '100% split possible', test: m => m.splitMax >= 100 },
  { id: 'fast-payout', label: 'Payout <24h', test: m => ['15 min', '24h', '1-4h', 'daily', '48h'].includes(m.payoutSpeed) },
]

// Status badges
const STATUS_BADGES = {
  alert:   { label: '⚠ Vigilance', color: C.amber, bg: C.amberSoft },
  updated: { label: 'MAJ 2026',    color: C.blueLight, bg: 'rgba(77,143,255,0.12)' },
  new:     { label: 'Nouveau',     color: C.green, bg: C.greenSoft },
  legacy:  { label: 'Legacy',      color: C.text3, bg: 'rgba(86,94,120,0.12)' },
}

// === COMPOSANT PRINCIPAL ===
export default function PropfirmComparator({ user }) {
  const [filter, setFilter] = useState('all')
  const [drawerFirm, setDrawerFirm] = useState(null) // firm key opened in drawer
  const [overrides, setOverrides] = useState({}) // admin overrides from Supabase
  const [loadingOverrides, setLoadingOverrides] = useState(true)

  const isAdmin = user && ADMIN_EMAILS.includes(user.email)

  // Liste des firmes (depuis PROPFIRM_RULES, ordre alphabétique avec Topstep en 1er)
  const firms = useMemo(() => {
    const all = Object.keys(PROPFIRM_RULES)
    const TOP_FIRST = ['Topstep', 'Apex Trader Funding']
    return [...TOP_FIRST, ...all.filter(f => !TOP_FIRST.includes(f)).sort()]
  }, [])

  // Filter firms par filtre actif
  const visibleFirms = useMemo(() => {
    const f = FILTERS.find(x => x.id === filter)
    if (!f) return firms
    return firms.filter(name => f.test(FIRM_META[name] || {}))
  }, [firms, filter])

  // Charge overrides admin depuis Supabase (s'applique par-dessus PROPFIRM_RULES)
  useEffect(() => {
    let mounted = true
    async function loadOverrides() {
      try {
        const { data } = await supabase
          .from('propfirm_rules_overrides')
          .select('firm_name, rule_key, plan, value')
        if (!mounted) return
        const map = {}
        for (const row of data || []) {
          if (!map[row.firm_name]) map[row.firm_name] = {}
          if (!map[row.firm_name][row.rule_key]) map[row.firm_name][row.rule_key] = {}
          map[row.firm_name][row.rule_key][row.plan] = row.value
        }
        setOverrides(map)
      } catch (e) {
        // Table propfirm_rules_overrides peut ne pas exister — pas grave
      } finally {
        if (mounted) setLoadingOverrides(false)
      }
    }
    loadOverrides()
    return () => { mounted = false }
  }, [])

  // Helper : retourne la valeur d'une règle avec override appliqué si présent
  function ruleValue(firmName, ruleKey, plan) {
    const override = overrides[firmName]?.[ruleKey]?.[plan]
    if (override !== undefined) return override
    return PROPFIRM_RULES[firmName]?.rules?.[ruleKey]?.[plan] || null
  }

  return (
    <div className="page-pad" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>
      {/* === Header === */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 11, color: C.blueLight, letterSpacing: '0.16em',
          marginBottom: 10, textTransform: 'uppercase', fontWeight: 600,
        }}>
          Règles PropFirms
        </div>
        <h1 style={{
          fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em',
          margin: 0, marginBottom: 8, lineHeight: 1.1,
        }}>Comparateur PropFirms</h1>
        <p style={{ fontSize: 14, color: C.text3, margin: 0, lineHeight: 1.5 }}>
          Règles, drawdowns, prix et payouts des {firms.length} PropFirms supportées sur Quantara —
          vérifiées mai 2026 via sources officielles et 3 sites de review cross-référencés.
        </p>
      </div>

      {/* === Filtres pills === */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24,
        padding: '14px 18px',
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12,
      }}>
        <div style={{
          fontSize: 11, color: C.text3, letterSpacing: '0.12em',
          fontWeight: 600, textTransform: 'uppercase',
          alignSelf: 'center', marginRight: 4,
        }}>
          Filtrer ·
        </div>
        {FILTERS.map(f => {
          const isActive = filter === f.id
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '6px 14px', fontSize: 12, cursor: 'pointer',
                borderRadius: 99,
                border: `1px solid ${isActive ? 'rgba(45,111,255,0.4)' : C.border2}`,
                background: isActive ? 'rgba(45,111,255,0.15)' : 'transparent',
                color: isActive ? C.blueLight : C.text2,
                fontWeight: isActive ? 600 : 500,
                fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>
              {f.label}
            </button>
          )
        })}
      </div>

      {/* === Grid de cards === */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
      }}>
        {visibleFirms.map(firmName => {
          const meta = FIRM_META[firmName] || {}
          const badge = meta.statusBadge ? STATUS_BADGES[meta.statusBadge] : null
          const affLink = getAffiliateLink(firmName)
          return (
            <div
              key={firmName}
              onClick={() => setDrawerFirm(firmName)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDrawerFirm(firmName) } }}
              className="qt-firm-card"
              style={{
                textAlign: 'left',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: 20,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = C.borderHover
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.25), 0 0 24px rgba(45,111,255,0.08)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.border
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Header card : logo + nom + badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {getFirmLogo(firmName, meta.color || C.blue, 40)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700, color: C.text,
                    letterSpacing: '-0.005em', marginBottom: 4,
                  }}>
                    {meta.displayName || firmName}
                  </div>
                  {badge && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      fontSize: 9, padding: '2px 7px',
                      background: badge.bg, color: badge.color,
                      borderRadius: 4, fontWeight: 600,
                      letterSpacing: '0.06em',
                    }}>
                      {badge.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Hallmark — 1 ligne qui résume */}
              <div style={{
                fontSize: 13, color: C.text2, lineHeight: 1.5,
                minHeight: 38, // évite cards qui sautent
              }}>
                {meta.hallmark || '—'}
              </div>

              {/* Stats clés */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 10, paddingTop: 12,
                borderTop: `1px solid ${C.border}`,
              }}>
                <StatCell label="DD type" value={meta.ddType} hint={meta.ddDetail} />
                <StatCell label="Split max" value={meta.splitMax ? `${meta.splitMax}%` : '—'} />
                <StatCell label="Pricing" value={meta.pricingNote} small />
                <StatCell label="Payout" value={meta.payoutSpeed} />
              </div>

              {/* Tags */}
              {meta.tags && meta.tags.length > 0 && (
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 5,
                }}>
                  {meta.tags.slice(0, 4).map((t, i) => (
                    <span key={i} style={{
                      fontSize: 10, padding: '3px 8px',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${C.border}`,
                      borderRadius: 99, color: C.text3,
                      whiteSpace: 'nowrap',
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* CTAs : affiliate (discret) + voir règles (lien drawer) */}
              <div style={{
                marginTop: 'auto', paddingTop: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 10,
              }}>
                <span style={{ fontSize: 12, color: C.blueLight, fontWeight: 500 }}>
                  Voir toutes les règles →
                </span>
                {affLink && (
                  <a
                    href={affLink}
                    target="_blank"
                    rel="noopener sponsored"
                    onClick={e => e.stopPropagation()}
                    style={{
                      fontSize: 11, fontWeight: 500,
                      color: C.text3, textDecoration: 'none',
                      padding: '4px 9px',
                      border: `1px solid ${C.border2}`,
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                    }}
                  >Visiter le site →</a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {visibleFirms.length === 0 && (
        <div style={{
          padding: 48, textAlign: 'center', color: C.text3,
          background: C.surface, borderRadius: 12,
          border: `1px dashed ${C.border2}`,
        }}>
          Aucune PropFirm ne correspond à ce filtre.
        </div>
      )}

      {/* === Drawer détail === */}
      {drawerFirm && (
        <FirmDetailDrawer
          firmName={drawerFirm}
          meta={FIRM_META[drawerFirm] || {}}
          ruleValue={ruleValue}
          onClose={() => setDrawerFirm(null)}
        />
      )}

      {isAdmin && !loadingOverrides && Object.keys(overrides).length > 0 && (
        <div style={{
          marginTop: 32, padding: '10px 14px',
          background: 'rgba(45,111,255,0.08)', border: `1px solid rgba(45,111,255,0.25)`,
          borderRadius: 8, fontSize: 11, color: C.blueLight,
        }}>
          🔧 Mode admin · {Object.keys(overrides).length} firmes avec overrides Supabase
        </div>
      )}

      {/* Disclaimer affiliation (FTC-friendly) */}
      <div style={{
        marginTop: 28, textAlign: 'center',
        fontSize: 11, color: C.text3, lineHeight: 1.5,
      }}>
        {AFFILIATE_DISCLAIMER}
      </div>
    </div>
  )
}

// === StatCell : petit composant pour les stats clés sur une card ===
function StatCell({ label, value, hint, small }) {
  return (
    <div title={hint || ''}>
      <div style={{
        fontSize: 9, color: C.text3, letterSpacing: '0.12em',
        textTransform: 'uppercase', fontWeight: 600, marginBottom: 3,
      }}>{label}</div>
      <div style={{
        fontSize: small ? 11 : 13, fontWeight: 600, color: C.text,
        lineHeight: 1.3,
        overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: small ? 'normal' : 'nowrap',
      }}>{value || '—'}</div>
    </div>
  )
}

// === Drawer plein écran avec toutes les règles d'une firme ===
function FirmDetailDrawer({ firmName, meta, ruleValue, onClose }) {
  // Ferme le drawer avec Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const firmData = PROPFIRM_RULES[firmName]
  const affLink = getAffiliateLink(firmName)
  if (!firmData) return null

  const plans = firmData.plans || []
  const [selectedPlan, setSelectedPlan] = useState(plans.includes('50k') ? '50k' : plans[0])

  const rules = firmData.rules || {}
  const ruleKeys = Object.keys(rules)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(680px, 100%)', height: '100%',
          background: C.bg,
          borderLeft: `1px solid ${C.border2}`,
          overflowY: 'auto',
          padding: '24px 28px',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header drawer */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 16, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {getFirmLogo(firmName, meta.color || C.blue, 44)}
            <div>
              <h2 style={{
                fontSize: 22, fontWeight: 700, margin: 0,
                letterSpacing: '-0.02em', color: C.text,
              }}>{meta.displayName || firmName}</h2>
              <div style={{
                fontSize: 12, color: C.text3, marginTop: 4,
              }}>{meta.hallmark}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: `1px solid ${C.border2}`,
              color: C.text2, cursor: 'pointer',
              width: 32, height: 32, borderRadius: 8,
              fontSize: 16, lineHeight: 1, fontFamily: 'inherit',
            }}>✕</button>
        </div>

        {/* CTA affiliate dans le drawer */}
        {affLink && (
          <a
            href={affLink}
            target="_blank"
            rel="noopener sponsored"
            style={{
              display: 'inline-block',
              marginBottom: 20,
              padding: '10px 16px',
              fontSize: 12, fontWeight: 500,
              color: C.blueLight,
              background: 'rgba(45,111,255,0.08)',
              border: `1px solid rgba(45,111,255,0.25)`,
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >Ouvrir un compte chez {meta.displayName || firmName} →</a>
        )}

        {/* Plan selector */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 24,
          background: C.surface, padding: 4, borderRadius: 10,
          border: `1px solid ${C.border}`, width: 'fit-content',
        }}>
          {plans.map(plan => {
            const active = plan === selectedPlan
            return (
              <button
                key={plan}
                onClick={() => setSelectedPlan(plan)}
                style={{
                  padding: '7px 14px', fontSize: 12, fontWeight: 600,
                  borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(45,111,255,0.18)' : 'transparent',
                  color: active ? C.blueLight : C.text2,
                  fontFamily: 'inherit',
                  letterSpacing: '0.04em',
                }}>{plan.toUpperCase()}</button>
            )
          })}
        </div>

        {/* Stats résumé pour ce plan */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10, marginBottom: 28,
        }}>
          <StatBig
            label="Type de drawdown"
            value={meta.ddType}
            sub={meta.ddDetail}
            color={C.text}
          />
          <StatBig
            label="Profit split max"
            value={meta.splitMax ? `${meta.splitMax}%` : '—'}
            color={C.green}
          />
          <StatBig
            label="Modèle pricing"
            value={meta.pricingNote}
            small
            color={C.amber}
          />
          <StatBig
            label="Délai payout"
            value={meta.payoutSpeed}
            color={C.blueLight}
          />
        </div>

        {/* Toutes les règles, groupées par section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <RuleSection title="Évaluation" keys={ruleKeys.filter(k =>
            /objectif|drawdown|jour|cohérence|consistency|limite.*temps|profit\s*min/i.test(k)
          )} rules={rules} ruleValue={ruleValue} firmName={firmName} plan={selectedPlan} />

          <RuleSection title="Restrictions trading" keys={ruleKeys.filter(k =>
            /overnight|news|annonces|dca|algo|copy|automation|hedging|scalping|weekend|heures|robots/i.test(k)
          )} rules={rules} ruleValue={ruleValue} firmName={firmName} plan={selectedPlan} />

          <RuleSection title="Contrats" keys={ruleKeys.filter(k =>
            /contrats|inactivité/i.test(k)
          )} rules={rules} ruleValue={ruleValue} firmName={firmName} plan={selectedPlan} />

          <RuleSection title="Tarifs" keys={ruleKeys.filter(k =>
            /prix|frais|reset|data|codes promo/i.test(k)
          )} rules={rules} ruleValue={ruleValue} firmName={firmName} plan={selectedPlan} />

          <RuleSection title="Payouts" keys={ruleKeys.filter(k =>
            /répartition|gains|payout|cadence|délai|méthodes|buffer|min entre|withdrawal|threshold|safety/i.test(k)
          )} rules={rules} ruleValue={ruleValue} firmName={firmName} plan={selectedPlan} />

          <RuleSection title="Multi-comptes" keys={ruleKeys.filter(k =>
            /combines|comptes|évaluations|stop-loss/i.test(k)
          )} rules={rules} ruleValue={ruleValue} firmName={firmName} plan={selectedPlan} />
        </div>
      </div>
    </div>
  )
}

function StatBig({ label, value, sub, color, small }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: 14,
    }}>
      <div style={{
        fontSize: 10, color: C.text3, letterSpacing: '0.12em',
        textTransform: 'uppercase', fontWeight: 600, marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontSize: small ? 13 : 16, fontWeight: 700,
        color: color || C.text, letterSpacing: '-0.01em',
        lineHeight: 1.3,
      }}>{value || '—'}</div>
      {sub && (
        <div style={{ fontSize: 10, color: C.text3, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>
      )}
    </div>
  )
}

function RuleSection({ title, keys, rules, ruleValue, firmName, plan }) {
  if (!keys || keys.length === 0) return null
  return (
    <div>
      <div style={{
        fontSize: 11, color: C.blueLight, letterSpacing: '0.14em',
        marginBottom: 12, textTransform: 'uppercase', fontWeight: 600,
      }}>
        {title}
      </div>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 10, overflow: 'hidden',
      }}>
        {keys.map((key, i) => {
          const value = ruleValue(firmName, key, plan)
          if (!value) return null
          return (
            <div key={key} style={{
              display: 'grid', gridTemplateColumns: '180px 1fr',
              gap: 14, padding: '11px 16px',
              borderBottom: i === keys.length - 1 ? 'none' : `1px solid ${C.border}`,
              fontSize: 12,
            }}>
              <div style={{ color: C.text3, fontWeight: 500 }}>{key}</div>
              <div style={{ color: C.text, lineHeight: 1.5 }}>{value}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Emails admins (pour le badge "mode admin") — liste centralisée
import { ADMIN_EMAILS } from '../lib/admins'
