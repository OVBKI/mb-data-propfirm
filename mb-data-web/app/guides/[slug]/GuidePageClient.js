'use client'
import { useState } from 'react'
import Link from 'next/link'
import PageHeader from '../../../components/PageHeader'
import Footer from '../../../components/Footer'
import { firmToSlug } from '../../../lib/firmSlugs'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#7b839b',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
}

const CATEGORY_COLORS = {
  'Risk management': C.blue,
  'Règles': '#a78bfa',
  'Guide PropFirm': '#fac775',
  'Payouts': C.green,
}

export default function GuidePageClient({ guide, slug, relatedGuides }) {
  const catColor = CATEGORY_COLORS[guide.category] || C.blue

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />
      <main style={{ flex: 1, padding: '40px 24px 80px', maxWidth: 760, margin: '0 auto', width: '100%' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: C.text3, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={{ color: C.text3, textDecoration: 'none' }}>Quantara</Link>
          <span>›</span>
          <Link href="/guides" style={{ color: C.text3, textDecoration: 'none' }}>Guides</Link>
          <span>›</span>
          <span style={{ color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guide.title}</span>
        </nav>

        {/* Hero */}
        <header style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: catColor,
              padding: '4px 10px',
              background: `${catColor}15`,
              border: `1px solid ${catColor}33`,
              borderRadius: 6,
            }}>
              {guide.category}
            </span>
            <span style={{ fontSize: 12, color: C.text3 }}>{guide.readingTime} min de lecture</span>
            <span style={{ fontSize: 12, color: C.text3 }}>· Mis à jour {formatDate(guide.updatedDate)}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 4.5vw, 38px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0 }}>
            {guide.h1 || guide.title}
          </h1>
        </header>

        {/* Intro */}
        {guide.intro && (
          <p style={{ fontSize: 16, color: C.text2, lineHeight: 1.7, margin: 0, marginBottom: 32 }}>
            {guide.intro}
          </p>
        )}

        {/* Sections */}
        <article style={{ marginBottom: 40 }}>
          {guide.sections?.map((s, i) => (
            <Section key={i} section={s} />
          ))}
        </article>

        {/* Related PropFirms */}
        {guide.relatedFirms?.length > 0 && (
          <section style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '18px 22px',
            marginBottom: 32,
          }}>
            <div style={{ fontSize: 11, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
              PropFirms concernées
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {guide.relatedFirms.map((firm) => (
                <Link key={firm} href={`/firms/${firmToSlug(firm)}`} style={{
                  padding: '6px 12px',
                  background: 'rgba(45,111,255,0.08)',
                  border: '1px solid rgba(45,111,255,0.18)',
                  borderRadius: 6,
                  fontSize: 12.5,
                  color: C.blueLight,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}>
                  {firm}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQs */}
        {guide.faqs?.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 18 }}>FAQ</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {guide.faqs.map((f, i) => (
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
          marginBottom: 36,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, marginBottom: 10 }}>
            Tracke ta PropFirm avec Quantara
          </h2>
          <p style={{ fontSize: 14, color: C.text2, margin: 0, marginBottom: 22, lineHeight: 1.6 }}>
            Drawdown, consistency, payouts : Quantara calcule tout en temps réel pour chaque firm.
            Setup en 90 secondes, gratuit pendant la beta.
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

        {/* Related guides */}
        {relatedGuides?.length > 0 && (
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 14 }}>Guides liés</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {relatedGuides.map((g) => (
                <Link key={g.slug} href={`/guides/${g.slug}`} style={{
                  display: 'block',
                  padding: '14px 18px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: C.text,
                }}>
                  <div style={{ fontSize: 11, color: C.text3, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
                    {g.category} · {g.readingTime} min
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{g.title}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}

function Section({ section }) {
  const bodies = Array.isArray(section.body) ? section.body : (section.body ? [section.body] : [])
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.25, margin: 0, marginBottom: 12, color: C.text }}>
        {section.heading}
      </h2>
      {bodies.map((b, i) => (
        <p key={i} style={{ fontSize: 14.5, color: C.text2, lineHeight: 1.75, margin: 0, marginBottom: 10 }}>
          {b}
        </p>
      ))}
      {section.list?.length > 0 && (
        section.list_ordered ? (
          <ol style={{ paddingLeft: 22, margin: '10px 0 0', color: C.text2 }}>
            {section.list.map((item, i) => (
              <li key={i} style={{ fontSize: 14.5, lineHeight: 1.7, marginBottom: 8 }}>{item}</li>
            ))}
          </ol>
        ) : (
          <ul style={{ paddingLeft: 22, margin: '10px 0 0', color: C.text2 }}>
            {section.list.map((item, i) => (
              <li key={i} style={{ fontSize: 14.5, lineHeight: 1.7, marginBottom: 8 }}>{item}</li>
            ))}
          </ul>
        )
      )}
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
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
          padding: '14px 18px 16px',
          fontSize: 13.5,
          color: C.text2,
          lineHeight: 1.7,
          borderTop: `1px solid ${C.border}`,
        }}>
          {a}
        </div>
      )}
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
}
