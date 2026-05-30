// DashboardMockup — réplique fidèle de la page /app (vue tableau de bord).
// Structure réelle observée dans app/app/page.js :
//   eyebrow "TABLEAU DE BORD" + "Bonjour Trader 👋" + (currency/search/+PropFirm)
//   5 stats cards (PropFirms / Total dépensé / Total payouts / Résultat net / Payouts)
//   firms-grid : logo (image réelle propfirm) + nom + comptes/payouts + Net + ROI
//                + 3 mini stats Dépensé/Payouts/Actifs
//                + liste comptes (pastille + nom + badge statut + net)
//                + badges statuts + bouton 🎓 Diplômes
//
// LOGOS : on importe getFirmLogo() du même lib utilisé par /app pour avoir
//          IDENTIQUE les logos PNG réels (Topstep, Apex, Lucid...).
//
// MATHS — cohérence stricte (comme sur le vrai dashboard /app) :
//   * net compte = P&L trading − frais payés sur ce compte (challenge + activation)
//     → Challenge en cours sans trade  → net = −challenge_fee
//     → Compte échoué (sans trade lourd) → net = −frais payés sur ce compte
//     → Compte financé rentable          → net = profit positif (frais déjà absorbés)
//   * Dépensé firm = Σ (challenges × prix) + (activations × prix)
//   * Net firm = Σ net comptes
//   * Payouts firm = Net firm + Dépensé firm   (= P&L brut total reçu de la propfirm)
//   * ROI firm = Net / Dépensé × 100
//   * Total global = Σ firms
//
// PRIX RÉELS (mai 2026) :
//   Topstep : challenge $49 — activation $149
//   Apex    : challenge $30 — activation  $75
//   Lucid   : challenge $95 — pas d'activation
//
// CALCUL FIRM PAR FIRM :
//   Topstep (3 comptes : 2 Financés + 1 Challenge actif)
//     Dépensé = 3×49 + 2×149 = $445
//     Net     = +980 + +860 + (−49) = +$1,791
//     Payouts = 1791 + 445 = $2,236
//     ROI     = 1791 / 445 = 402%
//
//   Apex Trader Funding (4 comptes : 2 Financés + 2 Échoués)
//     Dépensé = 4×30 + 2×75 = $270
//     Net     = +1,450 + +1,420 + (−30) + (−30) = +$2,810
//     Payouts = 2810 + 270 = $3,080
//     ROI     = 2810 / 270 = 1040%
//
//   Lucid Trading (2 comptes : 1 Financé + 1 Échoué)
//     Dépensé = 2×95 = $190
//     Net     = +1,008 + (−95) = +$913
//     Payouts = 913 + 190 = $1,103
//     ROI     = 913 / 190 = 480%
//
//   GLOBAL
//     Total dépensé = 445 + 270 + 190 = $905
//     Total payouts = 2236 + 3080 + 1103 = $6,419
//     Résultat net  = 6419 − 905 = $5,514  (== somme firm nets : 1791+2810+913)
//     Payouts count = 2 + 3 + 1 = 6

import { getFirmLogo } from '../../lib/firmLogos'
import { FIRMS, TOTALS, TRADER_NAME, COLORS } from './mockData'
import { useT } from '../LanguageProvider'

const C = COLORS
const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

// Helper : pastille colorée pour status compte (clé status FR utilisée comme lookup)
const STATUS_COLORS = {
  'Financé':   C.green,
  'Challenge': C.amber,
  'Échoué':    C.red,
}

// Map status FR (source) → key i18n
const STATUS_I18N_KEY = {
  'Financé':   'mockups.common.statusFinance',
  'Challenge': 'mockups.common.statusChallenge',
  'Échoué':    'mockups.common.statusEchoue',
}

// Map badge FR (source) → key i18n
const BADGE_I18N_KEY = {
  '1 Financé':    'mockups.common.badge1Funded',
  '2 Financés':   'mockups.common.badge2Funded',
  '1 Challenge':  'mockups.common.badge1Challenge',
  '2 Challenges': 'mockups.common.badge2Challenge',
  '1 Échoué':     'mockups.common.badge1Failed',
  '2 Échoués':    'mockups.common.badge2Failed',
}

function fmtMoney(n) {
  return (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toLocaleString('en-US')
}

function StatusBadge({ status, t }) {
  const color = STATUS_COLORS[status] || C.text3
  const label = t(STATUS_I18N_KEY[status] || '') || status
  return (
    <span style={{
      display: 'inline-block', fontSize: 9, fontWeight: 600,
      padding: '1px 6px', borderRadius: 99,
      background: status === 'Financé' ? 'rgba(29,184,122,0.12)'
        : status === 'Challenge' ? 'rgba(250,199,117,0.12)'
        : 'rgba(232,80,74,0.12)',
      color, letterSpacing: '0.3px',
    }}>{label}</span>
  )
}

export default function DashboardMockup() {
  const t = useT()
  return (
    <div style={{
      background: '#0a0c10',
      padding: '24px 26px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: C.text, minHeight: 540,
    }}>
      {/* Header — exactement comme /app dashboard */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 24, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{
            fontSize: 10, color: C.blueLight,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            fontWeight: 600, marginBottom: 8,
          }}>{t('mockups.dashboard.eyebrow')}</div>
          <div style={{
            fontSize: 22, fontWeight: 700, margin: 0,
            letterSpacing: '-0.025em', lineHeight: 1.1,
          }}>{t('mockups.dashboard.greeting').replace('{name}', TRADER_NAME)}</div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>
            {t('mockups.dashboard.rateInfo')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Currency toggle */}
          <div style={{
            display: 'flex',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 6, overflow: 'hidden',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <span style={{
              padding: '5px 11px', fontSize: 10,
              background: C.blue, color: '#fff', fontWeight: 600, letterSpacing: '0.05em',
            }}>USD</span>
            <span style={{
              padding: '5px 11px', fontSize: 10,
              color: C.text2, fontWeight: 600, letterSpacing: '0.05em',
            }}>EUR</span>
          </div>
          {/* Search input */}
          <div style={{
            padding: '5px 10px', fontSize: 10, width: 130,
            background: 'rgba(255,255,255,0.025)',
            border: '0.5px solid rgba(255,255,255,0.10)',
            borderRadius: 6, color: C.text3,
          }}>{t('mockups.dashboard.searchPlaceholder')}</div>
          {/* Primary CTA */}
          <span style={{
            padding: '6px 12px', fontSize: 10, fontWeight: 500,
            background: C.text, color: '#0a0c10', borderRadius: 6,
            boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
          }}>{t('mockups.dashboard.addPropfirm')}</span>
        </div>
      </div>

      {/* 5 stats cards — totaux strictement cohérents avec FIRMS ci-dessus */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 10, marginBottom: 22,
      }}>
        <StatCard label={t('mockups.dashboard.statPropfirms')}    value={`${TOTALS.firmsCount} · ${TOTALS.accountsCount} ${t('mockups.dashboard.accountsLabel')}`} small />
        <StatCard label={t('mockups.dashboard.statSpent')}        value={`${TOTALS.spent.toLocaleString('en-US')} $`}    color={C.red} />
        <StatCard label={t('mockups.dashboard.statPayouts')}      value={`${TOTALS.payouts.toLocaleString('en-US')} $`}  color={C.green} />
        <StatCard label={t('mockups.dashboard.statNet')}          value={`+${TOTALS.net.toLocaleString('en-US')} $`}    color={C.green} />
        <StatCard label={t('mockups.dashboard.statPayoutCount')}  value={String(TOTALS.payoutsCount)} />
      </div>

      {/* Firms grid — 3 cards en row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
      }}>
        {FIRMS.map(f => (
          <FirmCard key={f.name} firm={f} t={t} />
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, color, small }) {
  return (
    <div style={{
      padding: '12px 13px',
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset',
    }}>
      <div style={{
        fontSize: 9, color: C.text3,
        textTransform: 'uppercase', letterSpacing: '0.12em',
        marginBottom: 8, fontWeight: 600,
      }}>{label}</div>
      <div style={{
        fontSize: small ? 12 : 17, fontWeight: 700,
        color: color || C.text, letterSpacing: '-0.015em',
      }}>{value}</div>
    </div>
  )
}

function FirmCard({ firm, t }) {
  return (
    <div style={{
      padding: 14,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)',
    }}>
      {/* Header firm : logo image PNG réel + nom + accounts/payouts | net + ROI */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          {/* === Logo réel propfirm (IDENTIQUE à /app) === */}
          {getFirmLogo(firm.name, firm.color, 36)}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '-0.005em' }}>
              {firm.name}
            </div>
            <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>
              {firm.accountsCount} {t('mockups.dashboard.accountsLabel')} · {firm.payoutsCount} {t('mockups.dashboard.payoutsLabel')}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700,
            color: firm.net >= 0 ? C.green : C.red,
            letterSpacing: '-0.015em', fontFamily: mono,
          }}>{fmtMoney(firm.net)}</div>
          <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>
            ROI {firm.roi >= 0 ? '+' : ''}{firm.roi}%
          </div>
        </div>
      </div>

      {/* 3 mini stats : Dépensé / Payouts / Actifs */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6, marginBottom: 10,
      }}>
        {[
          { l: t('mockups.dashboard.miniSpent'),    v: '$' + firm.spent,   c: C.red },
          { l: t('mockups.dashboard.miniPayouts'),  v: '$' + firm.payouts, c: C.green },
          { l: t('mockups.dashboard.miniActive'),   v: firm.activeCount },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: 6, padding: '7px 6px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 8, color: C.text3,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: 3, fontWeight: 600,
            }}>{s.l}</div>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: s.c || C.text, fontFamily: mono,
            }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* List of accounts */}
      {firm.accounts.slice(0, 3).map((a, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '5px 0',
          borderBottom: '0.5px solid rgba(255,255,255,0.05)',
          fontSize: 10.5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: STATUS_COLORS[a.status] || C.text3, flexShrink: 0,
            }} />
            <span style={{
              color: C.text2, fontWeight: 500, fontSize: 10,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFamily: mono,
            }}>{a.name}</span>
            <StatusBadge status={a.status} t={t} />
            {a.liquidated && <span style={{ fontSize: 9 }}>🔥</span>}
          </div>
          <span style={{
            fontWeight: 600, fontSize: 10,
            color: a.net >= 0 ? C.green : C.red, fontFamily: mono,
          }}>{fmtMoney(a.net)}</span>
        </div>
      ))}

      {/* Bottom badges + diplômes button */}
      <div style={{
        display: 'flex', gap: 5, marginTop: 10,
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        {firm.badges.map((b, i) => {
          const badgeLabel = BADGE_I18N_KEY[b.label] ? t(BADGE_I18N_KEY[b.label]) : b.label
          return (
            <span key={i} style={{
              fontSize: 8, fontWeight: 600,
              padding: '2px 6px', borderRadius: 99,
              background: `${b.color}1f`, color: b.color,
              letterSpacing: '0.3px',
            }}>{badgeLabel}</span>
          )
        })}
        <span style={{
          marginLeft: 'auto', fontSize: 9, padding: '2px 7px',
          borderRadius: 99,
          background: 'rgba(45,111,255,0.10)',
          border: '1px solid rgba(45,111,255,0.30)',
          color: C.blueLight, fontWeight: 600,
        }}>{t('mockups.dashboard.diplomas')}</span>
      </div>
    </div>
  )
}
