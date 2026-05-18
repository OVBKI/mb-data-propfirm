// DashboardMockup — réplique fidèle de la page /app (vue tableau de bord).
// Structure réelle observée dans app/app/page.js :
//   eyebrow "TABLEAU DE BORD" + "Bonjour Trader 👋" + (currency/search/+PropFirm)
//   5 stats cards (PropFirms / Total dépensé / Total payouts / Résultat net / Payouts)
//   firms-grid (cards 340px) : logo SVG + nom + comptes/payouts + Net + ROI + 3 mini stats
//                              + liste 3 comptes actifs (pastille + nom + badge + net)
//                              + badges statuts + bouton 🎓 Diplômes
// Données 100% fictives mais MATHÉMATIQUEMENT COHÉRENTES :
//   - Spent = (challenges × prix_challenge) + (activations × prix_activation)
//   - Net firm = Σ net comptes
//   - Payouts firm = Net firm + Spent firm  (P&L brut)
//   - Total dépensé = Σ spent firms
//   - Résultat net global = Total payouts - Total dépensé
// Prix propfirm réels (mai 2026) :
//   - Topstep : challenge $49, activation $149
//   - Apex    : challenge $30, activation $75
//   - Lucid   : challenge $95, pas d'activation

const C = {
  surface:   'rgba(20,23,32,0.65)',
  surface2:  'rgba(28,32,48,0.7)',
  border:    'rgba(255,255,255,0.07)',
  text:      '#f0ede8',
  text2:     '#9098b0',
  text3:     '#5a6275',
  blue:      '#2d6fff',
  blueLight: '#4d8fff',
  green:     '#1db87a',
  red:       '#e8504a',
  amber:     '#fac775',
}
const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

// Helper : pastille colorée pour status compte
const STATUS_COLORS = {
  'Financé':   C.green,
  'Challenge': C.amber,
  'Échoué':    C.red,
}

// === Logos SVG inspirés des propfirms (stylisés, pas de copyright) ===
const FIRM_ICONS = {
  // Topstep : 3 barres ascendantes (les "steps" vers le top)
  Topstep: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff" style={{ display: 'block' }}>
      <rect x="3" y="15" width="5" height="6" rx="1" />
      <rect x="9.5" y="10" width="5" height="11" rx="1" />
      <rect x="16" y="5" width="5" height="16" rx="1" />
    </svg>
  ),
  // Apex : triangle pointant vers le haut (apex = sommet)
  Apex: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff" style={{ display: 'block' }}>
      <path d="M12 3 L22 21 L2 21 Z" />
    </svg>
  ),
  // Lucid : losange/prisme (clarté, transparence)
  Lucid: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#fff" style={{ display: 'block' }}>
      <path d="M12 2 L22 12 L12 22 L2 12 Z" />
    </svg>
  ),
}

// === Firmes mockées avec prix réels ===
// CALCUL :
//   Topstep : 3 comptes (2 Financés actifs + 1 Challenge en cours)
//     Spent = 3×49 (challenges) + 2×149 (activations 2 Financés) = 147 + 298 = 445
//     Net   = 980 + 860 + 0 = 1840
//     Payouts (P&L brut) = Net + Spent = 1840 + 445 = 2285
//     ROI   = Net / Spent × 100 = 1840/445 = 413%
//
//   Apex : 4 comptes (2 Financés actifs + 2 Échoués)
//     Spent = 4×30 (challenges) + 2×75 (activations 2 Financés) = 120 + 150 = 270
//     Net   = 1450 + 1420 + (-245) = 2625  (1 échoué non affiché supposé ~0)
//     Payouts = 2625 + 270 = 2895
//     ROI   = 2625/270 = 972%
//
//   Lucid : 2 comptes (1 Financé + 1 Échoué)
//     Spent = 2×95 (challenges) + 0 (pas d'activation chez Lucid) = 190
//     Net   = 1008 + (-210) = 798
//     Payouts = 798 + 190 = 988
//     ROI   = 798/190 = 420%
//
//   TOTAL : Spent 905$ · Payouts 6168$ · Net 5263$ · Payouts count 6
const FIRMS = [
  {
    name: 'Topstep',
    logoColor: '#e8504a',
    accountsCount: 3,
    payoutsCount: 2,
    net: 1840,
    roi: 413,
    spent: 445,
    payouts: 2285,
    activeCount: 2,
    accounts: [
      { name: 'PRO 1',        status: 'Financé',   net:  980 },
      { name: 'PRO 2',        status: 'Financé',   net:  860 },
      { name: 'Combine 50K',  status: 'Challenge', net:    0 },
    ],
    badges: [{ label: '2 Financés', color: C.green }, { label: '1 Challenge', color: C.amber }],
  },
  {
    name: 'Apex',
    logoColor: '#d94a3a',
    accountsCount: 4,
    payoutsCount: 3,
    net: 2625,
    roi: 972,
    spent: 270,
    payouts: 2895,
    activeCount: 2,
    accounts: [
      { name: 'PA-389226-04', status: 'Financé', net:  1450 },
      { name: 'PA-389226-03', status: 'Financé', net:  1420 },
      { name: 'PA-389226-02', status: 'Échoué',  net:  -245 },
    ],
    badges: [{ label: '2 Financés', color: C.green }, { label: '2 Échoués', color: C.red }],
  },
  {
    name: 'Lucid',
    logoColor: '#1db87a',
    accountsCount: 2,
    payoutsCount: 1,
    net: 798,
    roi: 420,
    spent: 190,
    payouts: 988,
    activeCount: 1,
    accounts: [
      { name: 'PRO 7',   status: 'Financé',  net: 1008 },
      { name: 'EVAL 17', status: 'Échoué',   net: -210, liquidated: true },
    ],
    badges: [{ label: '1 Financé', color: C.green }, { label: '1 Échoué', color: C.red }],
  },
]

function fmtMoney(n) {
  return (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toLocaleString('en-US')
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || C.text3
  return (
    <span style={{
      display: 'inline-block', fontSize: 9, fontWeight: 600,
      padding: '1px 6px', borderRadius: 99,
      background: status === 'Financé' ? 'rgba(29,184,122,0.12)'
        : status === 'Challenge' ? 'rgba(250,199,117,0.12)'
        : 'rgba(232,80,74,0.12)',
      color, letterSpacing: '0.3px',
    }}>{status}</span>
  )
}

function FirmLogo({ color, name }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8,
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: `0 2px 8px ${color}33, 0 0 0 1px rgba(255,255,255,0.06) inset`,
    }}>
      {FIRM_ICONS[name] || (
        <span style={{
          fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em',
        }}>{name[0]}</span>
      )}
    </div>
  )
}

export default function DashboardMockup() {
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
          }}>Tableau de bord</div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, margin: 0,
            letterSpacing: '-0.025em', lineHeight: 1.1,
          }}>Bonjour Trader 👋</h1>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 6 }}>
            Taux EUR/USD : 1.0823 · MàJ il y a 2 min
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
          }}>🔍 Rechercher...</div>
          {/* Primary CTA */}
          <span style={{
            padding: '6px 12px', fontSize: 10, fontWeight: 500,
            background: C.text, color: '#0a0c10', borderRadius: 6,
            boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
          }}>+ Ajouter PropFirm</span>
        </div>
      </div>

      {/* 5 stats cards — calculs cohérents avec FIRMS ci-dessus */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 10, marginBottom: 22,
      }}>
        <StatCard label="PropFirms"      value="3 · 9 comptes" small />
        <StatCard label="Total dépensé"  value="905 $"         color={C.red} />
        <StatCard label="Total payouts"  value="6,168 $"       color={C.green} />
        <StatCard label="Résultat net"   value="+5,263 $"      color={C.green} />
        <StatCard label="Payouts"        value="6" />
      </div>

      {/* Firms grid — 3 cards en row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
      }}>
        {FIRMS.map(f => (
          <FirmCard key={f.name} firm={f} />
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

function FirmCard({ firm }) {
  return (
    <div style={{
      padding: 14,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)',
    }}>
      {/* Header firm : logo + nom + accounts/payouts | net + ROI */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <FirmLogo color={firm.logoColor} name={firm.name} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '-0.005em' }}>
              {firm.name}
            </div>
            <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>
              {firm.accountsCount} comptes · {firm.payoutsCount} payouts
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
          { l: 'Dépensé', v: '$' + firm.spent,   c: C.red },
          { l: 'Payouts', v: '$' + firm.payouts, c: C.green },
          { l: 'Actifs',  v: firm.activeCount },
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
            <StatusBadge status={a.status} />
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
        {firm.badges.map((b, i) => (
          <span key={i} style={{
            fontSize: 8, fontWeight: 600,
            padding: '2px 6px', borderRadius: 99,
            background: `${b.color}1f`, color: b.color,
            letterSpacing: '0.3px',
          }}>{b.label}</span>
        ))}
        <span style={{
          marginLeft: 'auto', fontSize: 9, padding: '2px 7px',
          borderRadius: 99,
          background: 'rgba(45,111,255,0.10)',
          border: '1px solid rgba(45,111,255,0.30)',
          color: C.blueLight, fontWeight: 600,
        }}>🎓 Diplômes</span>
      </div>
    </div>
  )
}
