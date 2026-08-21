'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import PageHeader from '../../../components/PageHeader'
import Footer from '../../../components/Footer'
import { getFirmLogo } from '../../../lib/firmLogos'
import { FIRM_SUGGESTION_COLORS } from '../../../lib/constants'
import { COMPARISON_ROWS } from '../../../lib/firmSlugs'

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

// For each comparison row, resolve the cell value for a given firm+plan.
// Returns { value: string, isMeta: bool } or null if no rule matches.
function resolveCell(row, dataFirm, metaFirm, plan) {
  if (row.fromMeta && metaFirm?.[row.fromMeta]) {
    return { value: metaFirm[row.fromMeta], isMeta: true }
  }
  const ruleKeys = Object.keys(dataFirm?.rules || {})
  const matchingKey = ruleKeys.find((k) => row.match.test(k))
  if (!matchingKey) return null
  const val = dataFirm.rules[matchingKey]?.[plan]
  if (!val) return null
  // Truncate very long values for table readability
  return { value: val, isMeta: false }
}

export default function CompareFirmsClient({
  firmA, firmB, dataA, dataB, metaA, metaB, planA, planB, slugA, slugB,
}) {
  const colorA = FIRM_SUGGESTION_COLORS[firmA] || C.blue
  const colorB = FIRM_SUGGESTION_COLORS[firmB] || C.blue

  const rows = useMemo(() => {
    return COMPARISON_ROWS.map((row) => ({
      ...row,
      cellA: resolveCell(row, dataA, metaA, planA),
      cellB: resolveCell(row, dataB, metaB, planB),
    })).filter((r) => r.cellA || r.cellB)
  }, [dataA, dataB, metaA, metaB, planA, planB])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />
      <main style={{ flex: 1, padding: '40px 24px 80px', maxWidth: 1040, margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: C.text3, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={{ color: C.text3, textDecoration: 'none' }}>Quantara</Link>
          <span>›</span>
          <Link href="/compare" style={{ color: C.text3, textDecoration: 'none' }}>Compare</Link>
          <span>›</span>
          <span style={{ color: C.text2 }}>{firmA} vs {firmB}</span>
        </nav>

        {/* Hero */}
        <header style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
            COMPARATIF PROPFIRM · MAI 2026
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 4.5vw, 40px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, marginBottom: 16 }}>
            {firmA} <span style={{ color: C.text3 }}>vs</span> {firmB}
          </h1>
          <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.6, maxWidth: 640, margin: '0 auto' }}>
            {`Comparatif complet 2026 entre ${firmA} et ${firmB} : drawdown, profit split, payouts, prix, règles trading. Vérifié depuis les docs officielles.`}
          </p>
        </header>

        {/* Side-by-side hero cards */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          marginBottom: 36,
        }} className="compare-cards">
          <FirmCard firm={firmA} meta={metaA} plan={planA} color={colorA} slug={slugA} side="left" />
          <FirmCard firm={firmB} meta={metaB} plan={planB} color={colorB} slug={slugB} side="right" />
        </section>

        {/* Comparison table */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 6 }}>Comparatif détaillé</h2>
          <p style={{ fontSize: 13, color: C.text3, marginTop: 0, marginBottom: 18 }}>
            Plan de référence : {planA?.toUpperCase()} pour {firmA} · {planB?.toUpperCase()} pour {firmB}
          </p>

          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(160px, 200px) 1fr 1fr',
              borderBottom: `1px solid ${C.border}`,
              background: 'var(--tint1)',
            }}>
              <div style={{ padding: '14px 18px', fontSize: 11, color: C.text3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Critère
              </div>
              <div style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: colorA, textAlign: 'left', borderLeft: `1px solid ${C.border}` }}>
                {firmA}
              </div>
              <div style={{ padding: '14px 18px', fontSize: 13, fontWeight: 700, color: colorB, textAlign: 'left', borderLeft: `1px solid ${C.border}` }}>
                {firmB}
              </div>
            </div>

            {/* Data rows */}
            {rows.map((row, i) => (
              <div key={row.label} style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(160px, 200px) 1fr 1fr',
                borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <div style={{ padding: '12px 18px', fontSize: 13, color: C.text2, fontWeight: 600 }}>
                  {row.label}
                </div>
                <div style={{ padding: '12px 18px', fontSize: 12.5, color: C.text, lineHeight: 1.5, borderLeft: `1px solid ${C.border}` }}>
                  {row.cellA?.value || <span style={{ color: C.text3 }}>—</span>}
                </div>
                <div style={{ padding: '12px 18px', fontSize: 12.5, color: C.text, lineHeight: 1.5, borderLeft: `1px solid ${C.border}` }}>
                  {row.cellB?.value || <span style={{ color: C.text3 }}>—</span>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Verdict / editorial intro */}
        <section style={{
          background: `${C.blue}08`,
          border: `1px solid ${C.blue}22`,
          borderRadius: 14,
          padding: '24px 28px',
          marginBottom: 36,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, marginBottom: 12 }}>Comment choisir entre {firmA} et {firmB}</h2>
          <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, margin: 0, marginBottom: 12 }}>
            {`${firmA} et ${firmB} couvrent le même marché — le trading PropFirm futures — mais avec des philosophies différentes. ${firmA} ${metaA.ddType ? `utilise un drawdown ${metaA.ddType.split('(')[0].toLowerCase().trim()}` : 'a sa propre structure de règles'}, tandis que ${firmB} ${metaB.ddType ? `opère un drawdown ${metaB.ddType.split('(')[0].toLowerCase().trim()}`: 'a une autre approche'}. Cette différence détermine comment chaque firm gère le risque intraday et la progression de ton compte.`}
          </p>
          <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.7, margin: 0 }}>
            {`Avant de choisir, regarde aussi la cadence de payouts, le profit split (`}
            <strong style={{ color: C.text }}>{metaA.splits?.split('.')[0] || '90/10'}</strong>
            {` vs `}
            <strong style={{ color: C.text }}>{metaB.splits?.split('.')[0] || '90/10'}</strong>
            {`), et les règles spécifiques sur le news trading et l'overnight. Toutes les data ci-dessus sont vérifiées depuis les docs officielles de chaque firm en mai 2026.`}
          </p>
        </section>

        {/* CTA */}
        <section style={{
          textAlign: 'center',
          padding: '32px 24px',
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 10 }}>
            Track les deux avec Quantara
          </h2>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, marginBottom: 22, lineHeight: 1.6 }}>
            {firmA} et {firmB} sont pré-configurées dans Quantara. Track tes comptes des deux firmes en un seul dashboard, gratuit pendant la beta.
          </p>
          <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/auth?mode=signup" style={{
              padding: '12px 26px',
              background: C.blue,
              color: 'var(--text-inverse)',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}>Commencer gratuitement →</Link>
            <Link href="/demo" style={{
              padding: '12px 26px',
              background: 'transparent',
              color: C.text2,
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              border: `1px solid ${C.border}`,
            }}>Voir la démo</Link>
          </div>
        </section>

        {/* Internal links */}
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 12 }}>Pages liées</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Link href={`/firms/${slugA}`} style={{
              padding: '8px 14px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              color: C.text2,
              textDecoration: 'none',
            }}>
              Fiche complète {firmA} →
            </Link>
            <Link href={`/firms/${slugB}`} style={{
              padding: '8px 14px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              color: C.text2,
              textDecoration: 'none',
            }}>
              Fiche complète {firmB} →
            </Link>
            <Link href="/firms" style={{
              padding: '8px 14px',
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              color: C.blueLight,
              textDecoration: 'none',
            }}>
              Toutes les PropFirms →
            </Link>
            <Link href="/compare" style={{
              padding: '8px 14px',
              background: 'transparent',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              color: C.blueLight,
              textDecoration: 'none',
            }}>
              Comparateur multi-firmes →
            </Link>
          </div>
        </section>
      </main>
      <Footer />

      <style jsx>{`
        @media (max-width: 720px) {
          :global(.compare-cards) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

function FirmCard({ firm, meta, plan, color, slug, side }) {
  return (
    <Link href={`/firms/${slug}`} style={{
      display: 'flex',
      flexDirection: 'column',
      padding: 20,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 14,
      textDecoration: 'none',
      color: C.text,
      transition: 'border-color 0.15s, transform 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        {getFirmLogo(firm, color, 44)}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{firm}</div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Plan référence : {plan?.toUpperCase() || '—'}</div>
        </div>
      </div>
      {meta.tagline && (
        <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5, margin: 0, marginBottom: 12 }}>
          {meta.tagline}
        </p>
      )}
      {meta.keyFacts?.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {meta.keyFacts.slice(0, 3).map((f, i) => (
            <li key={i} style={{ fontSize: 12, color: C.text2, lineHeight: 1.4 }}>
              <span style={{ color, marginRight: 6 }}>•</span>
              {f}
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: 14, fontSize: 12, color: C.blueLight, fontWeight: 600 }}>
        Voir la fiche complète →
      </div>
    </Link>
  )
}
