'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import PageHeader from '../../../components/PageHeader'
import Footer from '../../../components/Footer'
import { getFirmLogo } from '../../../lib/firmLogos'
import { FIRM_SUGGESTION_COLORS } from '../../../lib/constants'
import { categorizeRule, RULE_CATEGORIES } from '../../../lib/firmSlugs'

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

export default function FirmPageClient({ firmName, firm, meta, otherFirms }) {
  const color = FIRM_SUGGESTION_COLORS[firmName] || C.blue
  const [selectedPlan, setSelectedPlan] = useState(firm.plans?.[0] || null)

  // Group rules by category
  const groupedRules = useMemo(() => {
    const groups = {}
    Object.keys(firm.rules || {}).forEach((ruleKey) => {
      const cat = categorizeRule(ruleKey)
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(ruleKey)
    })
    return groups
  }, [firm.rules])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />
      <main style={{ flex: 1, padding: '40px 24px 80px', maxWidth: 980, margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: C.text3, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={{ color: C.text3, textDecoration: 'none' }}>Quantara</Link>
          <span>›</span>
          <Link href="/firms" style={{ color: C.text3, textDecoration: 'none' }}>PropFirms</Link>
          <span>›</span>
          <span style={{ color: C.text2 }}>{firmName}</span>
        </nav>

        {/* Hero */}
        <header style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            {getFirmLogo(firmName, color, 56)}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
                PROPFIRM REVIEW · MAI 2026
              </div>
              <h1 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0 }}>
                {firmName} — Règles complètes 2026
              </h1>
            </div>
          </div>
          {meta.tagline && (
            <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.6, margin: 0, marginBottom: 18 }}>
              {meta.tagline}
            </p>
          )}
          {/* Key facts strip */}
          {meta.keyFacts?.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: 8,
              marginTop: 18,
            }}>
              {meta.keyFacts.map((f, i) => (
                <div key={i} style={{
                  padding: '10px 12px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 12,
                  color: C.text2,
                  lineHeight: 1.4,
                }}>
                  <span style={{ color: color, marginRight: 6 }}>●</span>
                  {f}
                </div>
              ))}
            </div>
          )}
        </header>

        {/* Intro paragraph (SEO content) */}
        {meta.intro && (
          <section style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: '24px 28px',
            marginBottom: 32,
          }}>
            <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.8, margin: 0 }}>
              {meta.intro}
            </p>
          </section>
        )}

        {/* Metadata grid */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 36,
        }}>
          {[
            { label: 'Drawdown', value: meta.ddType },
            { label: 'Profit Split', value: meta.splits },
            { label: 'Plateformes', value: meta.platform },
            { label: 'Pays / HQ', value: meta.country },
            { label: 'Site officiel', value: meta.website, isLink: true },
            { label: 'Fondée', value: meta.founded },
          ].filter((x) => x.value).map((item, i) => (
            <div key={i} style={{
              padding: '14px 16px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.4, wordBreak: 'break-word' }}>
                {item.isLink ? (
                  <a href={item.value} target="_blank" rel="noopener noreferrer nofollow" style={{ color: C.blueLight, textDecoration: 'none' }}>
                    {item.value.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                ) : item.value}
              </div>
            </div>
          ))}
        </section>

        {/* Plans selector */}
        {firm.plans?.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 14 }}>Plans disponibles</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {firm.plans.map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlan(p)}
                  style={{
                    padding: '8px 16px',
                    background: selectedPlan === p ? color : 'transparent',
                    color: selectedPlan === p ? '#fff' : C.text2,
                    border: `1px solid ${selectedPlan === p ? color : C.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: C.text3, marginTop: 10, marginBottom: 0 }}>
              Sélectionne un plan pour voir les règles spécifiques (drawdown, target, contracts).
            </p>
          </section>
        )}

        {/* Grouped rules */}
        {selectedPlan && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 6 }}>
              Règles détaillées — Plan {selectedPlan.toUpperCase()}
            </h2>
            <p style={{ fontSize: 13, color: C.text3, marginTop: 0, marginBottom: 20 }}>
              Source : documentation officielle {firmName}, vérifiée mai 2026.
            </p>

            {RULE_CATEGORIES.map((cat) => {
              const rules = groupedRules[cat.id]
              if (!rules || rules.length === 0) return null
              return (
                <div key={cat.id} style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  marginBottom: 14,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '12px 18px',
                    background: 'rgba(255,255,255,0.02)',
                    borderBottom: `1px solid ${C.border}`,
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.blueLight,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}>
                    {cat.label}
                  </div>
                  {rules.map((ruleKey, i) => {
                    const value = firm.rules[ruleKey]?.[selectedPlan]
                    if (!value) return null
                    return (
                      <div key={ruleKey} style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(180px, 240px) 1fr',
                        gap: 16,
                        padding: '12px 18px',
                        borderBottom: i < rules.length - 1 ? `1px solid ${C.border}` : 'none',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text2 }}>{ruleKey}</div>
                        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{value}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </section>
        )}

        {/* FAQs */}
        {meta.faqs?.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 18 }}>
              FAQ — {firmName}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {meta.faqs.map((f, i) => (
                <FAQItem key={i} q={f.q} a={f.a} />
              ))}
            </div>
          </section>
        )}

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
            Track ton compte {firmName} avec Quantara
          </h2>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, marginBottom: 22, lineHeight: 1.6 }}>
            {firmName} est pré-configurée dans Quantara avec ses règles à jour (drawdown, profit target, payouts). Setup en 90s.
          </p>
          <div style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/auth?mode=signup" style={{
              padding: '12px 26px',
              background: C.blue,
              color: '#fff',
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

        {/* Other firms */}
        {otherFirms?.length > 0 && (
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 12 }}>Autres PropFirms</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {otherFirms.map(({ name, slug }) => (
                <Link key={slug} href={`/firms/${slug}`} style={{
                  padding: '8px 14px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  color: C.text2,
                  textDecoration: 'none',
                }}>
                  {name} →
                </Link>
              ))}
              <Link href="/firms" style={{
                padding: '8px 14px',
                background: 'transparent',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 13,
                color: C.blueLight,
                textDecoration: 'none',
              }}>
                Voir toutes les firmes →
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%',
          padding: '14px 18px',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          color: C.text,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span>{q}</span>
        <span style={{ color: C.text3, fontSize: 18, lineHeight: 1, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>+</span>
      </button>
      {open && (
        <div style={{
          padding: '0 18px 16px',
          fontSize: 13,
          color: C.text2,
          lineHeight: 1.7,
          borderTop: `1px solid ${C.border}`,
          paddingTop: 14,
        }}>
          {a}
        </div>
      )}
    </div>
  )
}
