'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import PageHeader from '../../../../components/PageHeader'
import Footer from '../../../../components/Footer'
import {
  CFD_REPUTATION,
  CFD_DAILY_BASIS_LABEL,
  CFD_MAX_BASIS_LABEL,
} from '../../../../lib/cfdConstants'

const C = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--tint1)',
  border: 'var(--border)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
}

const REP_COLOR = { solid: C.green, ok: C.amber, caution: C.red }

// No CFD logos in lib/firmLogos — render a simple initial avatar (same as /cfd).
function InitialAvatar({ name, color, size = 44 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return (
    <div aria-hidden="true" style={{
      width: size, height: size, flexShrink: 0, borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 800, color: '#fff',
      background: `linear-gradient(135deg, ${color}, ${color}99)`,
      border: `1px solid ${color}55`,
    }}>{initial}</div>
  )
}

// ── Cell derivations (null-safe; '—' where absent) ──
function fmtSize(n) {
  const v = Number(n)
  if (!isFinite(v)) return String(n)
  if (v >= 1000) { const k = v / 1000; return `${Number.isInteger(k) ? k : k.toFixed(1)}K` }
  return String(v)
}
function sizesText(f) {
  const s = f?.accountSizes
  if (!Array.isArray(s) || !s.length) return '—'
  return s.length === 1 ? fmtSize(s[0]) : `${fmtSize(s[0])} – ${fmtSize(s[s.length - 1])}`
}
function targetsText(f) {
  return Array.isArray(f?.profitTargets) && f.profitTargets.length
    ? f.profitTargets.map((p) => `${p}%`).join(' / ') : '—'
}
function splitText(f) {
  const s = f?.profitSplit
  if (!s || s.from == null) return '—'
  return (s.to == null || s.from === s.to) ? `${s.from}%` : `${s.from}–${s.to}%`
}
function pctBasis(pct, basisLabel) {
  if (pct == null) return <span style={{ color: C.text3 }}>—</span>
  return (
    <>
      <strong style={{ color: C.text }}>{pct}%</strong>
      {basisLabel && <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{basisLabel}</div>}
    </>
  )
}
function refundText(f) {
  if (f?.refundNote) return f.refundNote
  if (f?.refundable === true) return 'Oui — remboursé avec le 1er payout'
  if (f?.refundable === false) return 'Non'
  return '—'
}
function dash(v) { return v == null || v === '' ? <span style={{ color: C.text3 }}>—</span> : v }

// Rows resolve from a firm's flagship + firm-level fields. `node` can return JSX.
const ROWS = [
  { label: 'Modèle phare', node: (d) => dash(d.flagship?.model) },
  { label: 'Étapes', node: (d) => dash(d.flagship?.steps) },
  { label: 'Tailles de compte', node: (d) => sizesText(d.flagship) },
  { label: 'Profit target', node: (d) => targetsText(d.flagship) },
  { label: 'Daily loss', node: (d) => pctBasis(d.flagship?.dailyLoss?.pct, CFD_DAILY_BASIS_LABEL[d.flagship?.dailyLoss?.basis]) },
  { label: 'Max loss', node: (d) => pctBasis(d.flagship?.maxLoss?.pct, CFD_MAX_BASIS_LABEL[d.flagship?.maxLoss?.basis]) },
  { label: 'Profit split', node: (d) => splitText(d.flagship) },
  { label: 'Jours min', node: (d) => dash(d.flagship?.minTradingDays) },
  { label: 'Consistance', node: (d) => dash(d.flagship?.consistency) },
  { label: 'Cadence payout', node: (d) => dash(d.flagship?.payout?.cycle) },
  { label: 'Frais remboursables', node: (d) => refundText(d) },
  { label: 'Plateformes', node: (d) => (d.platforms?.length ? d.platforms.join(', ') : '—') },
  { label: 'Instruments', node: (d) => (d.instruments?.length ? d.instruments.join(', ') : '—') },
  { label: 'Pays', node: (d) => dash(d.country) },
]

function ReputationBadge({ reputation }) {
  const rep = CFD_REPUTATION[reputation]
  if (!rep) return null
  const color = REP_COLOR[reputation] || C.text3
  return (
    <span title={rep.note} style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 700, color, background: `${color}1f`,
      border: `1px solid ${color}55`, whiteSpace: 'nowrap',
    }}>{rep.label}</span>
  )
}

export default function CompareCfdFirmsClient({
  firmA, firmB, dataA, dataB, slugA, slugB, taglineA, taglineB,
}) {
  const colorA = REP_COLOR[dataA.reputation] || C.blue
  const colorB = REP_COLOR[dataB.reputation] || C.blue

  const rows = useMemo(() => ROWS.map((r) => ({ ...r, a: r.node(dataA), b: r.node(dataB) })), [dataA, dataB])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader active="cfd" />
      <main style={{ flex: 1, padding: '40px 24px 80px', maxWidth: 1040, margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: C.text3, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: C.text3, textDecoration: 'none' }}>Quantara</Link>
          <span>›</span>
          <Link href="/cfd" style={{ color: C.text3, textDecoration: 'none' }}>PropFirms CFD</Link>
          <span>›</span>
          <span style={{ color: C.text2 }}>{firmA} vs {firmB}</span>
        </nav>

        {/* Hero */}
        <header style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
            COMPARATIF PROPFIRM CFD · 2026
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 4.5vw, 40px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, marginBottom: 16 }}>
            {firmA} <span style={{ color: C.text3 }}>vs</span> {firmB}
          </h1>
          <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.6, maxWidth: 660, margin: '0 auto' }}>
            {`Comparatif CFD / forex 2026 entre ${firmA} et ${firmB} : daily loss, max loss (statique vs trailing), profit split, payouts, plateformes. Sourcé depuis les docs officielles.`}
          </p>
        </header>

        {/* Side-by-side hero cards */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 36 }} className="compare-cards">
          <FirmCard firm={firmA} data={dataA} tagline={taglineA} color={colorA} slug={slugA} />
          <FirmCard firm={firmB} data={dataB} tagline={taglineB} color={colorB} slug={slugB} />
        </section>

        {/* Comparison table */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 6 }}>Comparatif détaillé</h2>
          <p style={{ fontSize: 13, color: C.text3, marginTop: 0, marginBottom: 18 }}>
            Modèle phare de chaque firme. Les autres modèles (1-step, instant, scaling) sont détaillés sur chaque fiche.
          </p>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 190px) 1fr 1fr', borderBottom: `1px solid ${C.border}`, background: 'var(--tint1)' }}>
              <div style={{ padding: '14px 18px', fontSize: 11, color: C.text3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Critère</div>
              <div style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: colorA, borderLeft: `1px solid ${C.border}` }}>{firmA}</div>
              <div style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: colorB, borderLeft: `1px solid ${C.border}` }}>{firmB}</div>
            </div>

            {/* Réputation row (highlighted first) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 190px) 1fr 1fr', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ padding: '12px 18px', fontSize: 13, color: C.text2, fontWeight: 600 }}>Réputation</div>
              <div style={{ padding: '12px 18px', borderLeft: `1px solid ${C.border}` }}><ReputationBadge reputation={dataA.reputation} /></div>
              <div style={{ padding: '12px 18px', borderLeft: `1px solid ${C.border}` }}><ReputationBadge reputation={dataB.reputation} /></div>
            </div>

            {/* Data rows */}
            {rows.map((row, i) => (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 190px) 1fr 1fr', borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ padding: '12px 18px', fontSize: 13, color: C.text2, fontWeight: 600 }}>{row.label}</div>
                <div style={{ padding: '12px 18px', fontSize: 12.5, color: C.text, lineHeight: 1.5, borderLeft: `1px solid ${C.border}` }}>{row.a}</div>
                <div style={{ padding: '12px 18px', fontSize: 12.5, color: C.text, lineHeight: 1.5, borderLeft: `1px solid ${C.border}` }}>{row.b}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: C.text3, marginTop: 10 }}>
            « — » = non documenté. Prix et conditions changent souvent — vérifie toujours sur le site officiel avant de t’engager.
          </p>
        </section>

        {/* Verdict / editorial intro */}
        <section style={{ background: `${C.blue}08`, border: `1px solid ${C.blue}22`, borderRadius: 14, padding: '24px 28px', marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, marginBottom: 12 }}>Comment choisir entre {firmA} et {firmB}</h2>
          <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, margin: 0, marginBottom: 12 }}>
            {`${firmA} et ${firmB} opèrent sur le même marché — les CFD / forex — mais leurs règles diffèrent sur deux points décisifs : la base du daily loss (${CFD_DAILY_BASIS_LABEL[dataA.flagship?.dailyLoss?.basis] || 'variable'} chez ${firmA}, ${CFD_DAILY_BASIS_LABEL[dataB.flagship?.dailyLoss?.basis] || 'variable'} chez ${firmB}) et le type de max loss (${CFD_MAX_BASIS_LABEL[dataA.flagship?.maxLoss?.basis] || 'variable'} vs ${CFD_MAX_BASIS_LABEL[dataB.flagship?.maxLoss?.basis] || 'variable'}). Ces deux paramètres déterminent la marge de manœuvre réelle sur ton compte.`}
          </p>
          <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, margin: 0 }}>
            {`Regarde aussi le profit split (${splitTextInline(dataA.flagship)} vs ${splitTextInline(dataB.flagship)}), la cadence des payouts et la réputation — un point sensible sur le marché CFD, où certaines firmes ont connu des incidents de payouts. Toutes les données ci-dessus sont vérifiées depuis les docs officielles.`}
          </p>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: '32px 24px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 10 }}>Track les deux avec Quantara</h2>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, marginBottom: 22, lineHeight: 1.6 }}>
            {firmA} et {firmB} sont pré-configurées dans Quantara (onglet CFD). Suis tes comptes des deux firmes dans un seul dashboard, gratuit pendant la beta.
          </p>
          <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/auth?mode=signup" style={{ padding: '12px 26px', background: C.blue, color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Commencer gratuitement →</Link>
            <Link href="/cfd" style={{ padding: '12px 26px', background: 'transparent', color: C.text2, borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', border: `1px solid ${C.border}` }}>Comparateur CFD</Link>
          </div>
        </section>

        {/* Internal links */}
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 12 }}>Pages liées</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Link href={`/cfd/${slugA}`} style={linkChip}>Fiche complète {firmA} →</Link>
            <Link href={`/cfd/${slugB}`} style={linkChip}>Fiche complète {firmB} →</Link>
            <Link href="/cfd" style={{ ...linkChip, background: 'transparent', color: C.blueLight }}>Toutes les PropFirms CFD →</Link>
            <Link href="/firms" style={{ ...linkChip, background: 'transparent', color: C.blueLight }}>PropFirms futures →</Link>
          </div>
        </section>
      </main>
      <Footer />

      <style jsx>{`
        @media (max-width: 720px) {
          :global(.compare-cards) { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

const linkChip = {
  padding: '8px 14px', background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 8, fontSize: 13, color: C.text2, textDecoration: 'none',
}

// Inline (string) split for the verdict prose.
function splitTextInline(f) {
  const s = f?.profitSplit
  if (!s || s.from == null) return 'split variable'
  return (s.to == null || s.from === s.to) ? `${s.from}%` : `${s.from}–${s.to}%`
}

function FirmCard({ firm, data, tagline, color, slug }) {
  const f = data.flagship || {}
  const keyFacts = [
    f.model,
    f.maxLoss?.pct != null ? `Max loss ${f.maxLoss.pct}% (${CFD_MAX_BASIS_LABEL[f.maxLoss.basis] || '—'})` : null,
    f.profitSplit?.from != null ? `Split ${splitTextInline(f)}` : null,
  ].filter(Boolean)
  return (
    <Link href={`/cfd/${slug}`} style={{
      display: 'flex', flexDirection: 'column', padding: 20, background: C.surface,
      border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: 14,
      textDecoration: 'none', color: C.text,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <InitialAvatar name={firm} color={color} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{firm}</div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>{data.country || 'PropFirm CFD'}</div>
        </div>
        <ReputationBadge reputation={data.reputation} />
      </div>
      {tagline && <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5, margin: 0, marginBottom: 12 }}>{tagline}</p>}
      {keyFacts.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {keyFacts.map((fact, i) => (
            <li key={i} style={{ fontSize: 12, color: C.text2, lineHeight: 1.4 }}>
              <span style={{ color, marginRight: 6 }}>•</span>{fact}
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: 14, fontSize: 12, color: C.blueLight, fontWeight: 600 }}>Voir la fiche complète →</div>
    </Link>
  )
}
