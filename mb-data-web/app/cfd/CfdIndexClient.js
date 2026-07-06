'use client'
import { useState } from 'react'
import Link from 'next/link'
import PageHeader from '../../components/PageHeader'
import Footer from '../../components/Footer'
import {
  CFD_REPUTATION,
  CFD_DAILY_BASIS_LABEL,
  CFD_MAX_BASIS_LABEL,
} from '../../lib/cfdConstants'
import { getCfdFirmsOrdered, getCfdModels, CFD_FIRM_TAGLINE } from '../../lib/cfdSlugs'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#7b839b',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
  red: '#e8504a',
}

// No CFD logos in lib/firmLogos — render a simple initial avatar.
function InitialAvatar({ name, color, size = 40 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.42,
        fontWeight: 800,
        color: '#fff',
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        border: `1px solid ${color}55`,
      }}
    >
      {initial}
    </div>
  )
}

function ReputationBadge({ reputation }) {
  const rep = CFD_REPUTATION[reputation]
  if (!rep) return null
  return (
    <span
      title={rep.note}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color: rep.color,
        background: `${rep.color}1f`,
        border: `1px solid ${rep.color}55`,
        whiteSpace: 'nowrap',
      }}
    >
      {rep.label}
    </span>
  )
}

function dash(v) {
  return v === null || v === undefined || v === '' ? '—' : v
}

export default function CfdIndexClient() {
  const firms = getCfdFirmsOrdered()
  // Displayed model per firm in the comparison table (flagship at index 0).
  const [modelByFirm, setModelByFirm] = useState({})

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader active="cfd" />
      <main style={{ flex: 1, padding: '60px 24px 80px', maxWidth: 1180, margin: '0 auto', width: '100%' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
            PROPFIRMS CFD / FOREX · JUIN 2026
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, marginBottom: 16 }}>
            Les PropFirms CFD / forex, comparées en 2026
          </h1>
          <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.6, maxWidth: 720, margin: '0 auto' }}>
            FTMO, FundedNext, The5ers, E8 Markets, FundingPips, Alpha Capital, Funded Trading Plus,
            Blueberry et The Funded Trader : modèle phare, daily loss, max loss (statique vs trailing),
            profit split, plateformes. Sourcé depuis les docs officielles, vérifié juin 2026.
          </p>
        </div>

        {/* Notices */}
        <div style={{ display: 'grid', gap: 12, marginBottom: 40 }}>
          <div style={{
            padding: '12px 16px',
            background: 'rgba(250,199,117,0.07)',
            border: `1px solid ${C.amber}44`,
            borderRadius: 10,
            fontSize: 13,
            color: C.text2,
            lineHeight: 1.5,
          }}>
            <strong style={{ color: C.amber }}>Prix indicatifs.</strong>{' '}
            La plupart des checkout étant dynamiques ou protégés, les tarifs affichés sont
            indicatifs — vérifie toujours sur le site officiel de la firme avant d’acheter.
          </div>
          <div style={{
            padding: '12px 16px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            fontSize: 13,
            color: C.text3,
            lineHeight: 1.5,
          }}>
            Quantara est un outil de journalisation et d’analyse, pas un conseil financier. Les
            règles des PropFirms changent fréquemment ; vérifie toujours les conditions officielles
            avant de t’engager.
          </div>
        </div>

        {/* Comparison table */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 16 }}>Comparatif des 9 firmes</h2>
          <div style={{ overflowX: 'auto', border: `1px solid ${C.border}`, borderRadius: 14, background: C.surface }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980, fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  {['Firme', 'Modèle', 'Étapes', 'Profit target', 'Daily loss', 'Max loss', 'Split', 'Plateformes'].map((h) => (
                    <th key={h} style={{
                      padding: '12px 14px',
                      borderBottom: `1px solid ${C.border}`,
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.text3,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {firms.map((firm) => {
                  const models = getCfdModels(firm.name)
                  const multi = models.length > 1
                  const selIdx = Math.min(modelByFirm[firm.name] ?? 0, Math.max(models.length - 1, 0))
                  // Selected model (flagship at 0). Sub-models inherit firm-wide infra
                  // but only surface the rules their catalog entry states.
                  const f = models[selIdx] || firm.flagship || {}
                  const color = CFD_REPUTATION[firm.reputation]?.color || C.blue
                  return (
                    <tr key={firm.slug} style={{ verticalAlign: 'top' }}>
                      <td style={{ padding: '14px', borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <InitialAvatar name={firm.name} color={color} size={34} />
                          <div style={{ minWidth: 0 }}>
                            <Link href={`/cfd/${firm.slug}`} style={{ color: C.text, fontWeight: 700, textDecoration: 'none' }}>
                              {firm.name}
                            </Link>
                            <div style={{ marginTop: 4 }}><ReputationBadge reputation={firm.reputation} /></div>
                            <div style={{ fontSize: 11, color: C.text3, marginTop: 5, maxWidth: 220, lineHeight: 1.4 }}>
                              {CFD_FIRM_TAGLINE[firm.name] || ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px', borderBottom: `1px solid ${C.border}`, color: C.text2 }}>
                        {multi ? (
                          <select
                            value={selIdx}
                            onChange={(e) => setModelByFirm((prev) => ({ ...prev, [firm.name]: Number(e.target.value) }))}
                            aria-label={`Modèle ${firm.name}`}
                            title={f.desc || undefined}
                            style={{
                              maxWidth: 200, fontSize: 12, fontFamily: 'inherit', fontWeight: 600,
                              color: C.blueLight, cursor: 'pointer', background: C.surface2,
                              border: `1px solid ${C.border}`, borderRadius: 7, padding: '6px 8px',
                            }}>
                            {models.map((m, i) => (
                              <option key={m.name || i} value={i} style={{ color: C.text, background: C.surface }}>
                                {m.name}{m.isFlagship ? ' · phare' : ''}
                              </option>
                            ))}
                          </select>
                        ) : dash(f.name || f.model)}
                      </td>
                      <td style={{ padding: '14px', borderBottom: `1px solid ${C.border}`, color: C.text2 }}>{dash(f.steps)}</td>
                      <td style={{ padding: '14px', borderBottom: `1px solid ${C.border}`, color: C.text2 }}>
                        {f.profitTargets?.length ? f.profitTargets.map((p) => `${p}%`).join(' / ') : '—'}
                      </td>
                      <td style={{ padding: '14px', borderBottom: `1px solid ${C.border}`, color: C.text2 }}>
                        {f.dailyLoss ? (
                          <>
                            <strong style={{ color: C.text }}>{f.dailyLoss.pct}%</strong>
                            <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                              {CFD_DAILY_BASIS_LABEL[f.dailyLoss.basis] || f.dailyLoss.basis}
                            </div>
                          </>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '14px', borderBottom: `1px solid ${C.border}`, color: C.text2 }}>
                        {f.maxLoss ? (
                          <>
                            <strong style={{ color: C.text }}>{f.maxLoss.pct}%</strong>
                            <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                              {CFD_MAX_BASIS_LABEL[f.maxLoss.basis] || f.maxLoss.basis}
                            </div>
                          </>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '14px', borderBottom: `1px solid ${C.border}`, color: C.text2 }}>
                        {f.profitSplit
                          ? (f.profitSplit.from === f.profitSplit.to
                            ? `${f.profitSplit.from}%`
                            : `${f.profitSplit.from}–${f.profitSplit.to}%`)
                          : '—'}
                      </td>
                      <td style={{ padding: '14px', borderBottom: `1px solid ${C.border}`, color: C.text2 }}>
                        {firm.platforms?.length ? firm.platforms.join(', ') : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: C.text3, marginTop: 10, marginBottom: 0 }}>
            Chaque firme affiche son modèle phare par défaut ; déroule le sélecteur de modèle pour comparer
            ses variantes (1-step, instant, scaling…). « — » = non documenté pour ce modèle.
            Clique sur une firme pour le détail complet.
          </p>
        </section>

        {/* Firm cards */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 16 }}>Toutes les firmes</h2>
          <div className="firms-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {firms.map((firm) => {
              const color = CFD_REPUTATION[firm.reputation]?.color || C.blue
              return (
                <Link
                  key={firm.slug}
                  href={`/cfd/${firm.slug}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 20,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 14,
                    textDecoration: 'none',
                    color: C.text,
                    transition: 'border-color 0.15s, transform 0.15s',
                    minHeight: 200,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${color}55`
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.border
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <InitialAvatar name={firm.name} color={color} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{firm.name}</div>
                      <div style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>{firm.country || 'PropFirm CFD'}</div>
                    </div>
                    <ReputationBadge reputation={firm.reputation} />
                  </div>
                  <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5, margin: 0, marginBottom: 14, flex: 1 }}>
                    {CFD_FIRM_TAGLINE[firm.name] || `Règles complètes ${firm.name} 2026.`}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {(firm.platforms || []).slice(0, 4).map((p) => (
                      <span key={p} style={{
                        padding: '3px 8px',
                        background: 'rgba(45,111,255,0.08)',
                        border: '1px solid rgba(45,111,255,0.18)',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        color: C.blueLight,
                      }}>{p}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: C.blueLight, fontWeight: 600 }}>
                    Voir règles & FAQ →
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Editorial intro for SEO */}
        <section style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '28px 32px', marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 14 }}>Comment lire les règles d’une PropFirm CFD</h2>
          <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, margin: 0, marginBottom: 12 }}>
            {`Sur les marchés CFD / forex, deux critères structurent le choix d'une firme : la `}
            <strong style={{ color: C.text }}>base du daily loss</strong>
            {` (solde de début de journée, equity, ou le plus haut des deux) et le `}
            <strong style={{ color: C.text }}>type de max loss</strong>
            {` — statique (figé sur le solde initial) ou trailing relatif (suit le plus haut puis se verrouille). La plupart des firmes du tableau utilisent un max loss statique de 10% ; les modèles instant / 1-step recourent souvent à un trailing.`}
          </p>
          <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, margin: 0 }}>
            {`Le profit split (souvent 80% à 90–100%), la cadence des payouts et les plateformes (MT4/MT5, cTrader, Match-Trader, DXtrade) complètent le tableau. Attention à la réputation : certaines firmes ont connu des incidents de payouts — elles sont signalées « Prudence » ci-dessus.`}
          </p>
        </section>

        {/* Cross-link to futures */}
        <section style={{ textAlign: 'center', padding: '32px 24px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 12 }}>Tu trades plutôt les futures ?</h2>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, marginBottom: 20, lineHeight: 1.6 }}>
            Retrouve le comparatif des 11 PropFirms futures (Topstep, Apex, Lucid, MFFU…) avec leurs règles de drawdown EOD / trailing.
          </p>
          <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/firms" style={{
              padding: '12px 26px',
              background: C.blue,
              color: '#fff',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}>Voir les PropFirms futures →</Link>
            <Link href="/auth?mode=signup" style={{
              padding: '12px 26px',
              background: 'transparent',
              color: C.text2,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              border: `1px solid ${C.border}`,
            }}>Commencer gratuitement</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
