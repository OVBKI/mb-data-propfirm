'use client'
import PageHeader from '../../../components/PageHeader'
import Footer from '../../../components/Footer'
import Reveal from '../../../components/Reveal'
import { useT, useLanguage } from '../../../components/LanguageProvider'

const C = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  border: 'var(--border)',
  border2: 'var(--border2)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
  green: 'var(--green)',
}

// Mentions légales — bloc locale-aware (option B).
const BLOCS_FR = [
  {
    title: 'Éditeur du site',
    rows: [
      ['Raison sociale', 'Quantara Technologies LLC'],
      ['Forme juridique', 'Limited Liability Company (LLC)'],
      ['Juridiction', 'État du New Mexico, États-Unis'],
      ['Adresse', '1209 Mountain Road PL NE, STE R, Albuquerque, NM 87110, USA'],
      ['Pays', 'États-Unis (New Mexico)'],
      ['Représentant légal', 'Omar Bakkali, Membre-Gérant (Managing Member)'],
      ['Email contact', 'contact@quantara.tech'],
      ['Email sécurité', 'security@quantara.tech'],
    ],
  },
  {
    title: 'Hébergement',
    rows: [
      ['Frontend', 'Vercel Inc. — 340 S Lemon Ave #4133, Walnut, CA 91789, USA — vercel.com'],
      ['Région edge', 'Frankfurt, Allemagne (cdg1/fra1)'],
      ['Base de données', 'Supabase Inc. — 970 Toa Payoh North #07-04, Singapour — supabase.com'],
      ['Région DB', 'EU Central (Frankfurt, Allemagne)'],
      ['Anti-bot', 'Cloudflare Inc. (Turnstile) — 101 Townsend St, San Francisco, CA 94107, USA'],
    ],
  },
  {
    title: 'Propriété intellectuelle',
    rows: [
      ['Marque', 'Quantara™ — usage par Quantara Technologies LLC'],
      ['Code source', 'Propriétaire — Quantara Technologies LLC. Tous droits réservés.'],
      ['Données utilisateur', 'Propriété des utilisateurs respectifs (voir CGU)'],
      ['Logos PropFirms', 'Marques de leurs propriétaires respectifs (Topstep®, Apex®, Lucid Trading®, etc.). Utilisés à titre informatif uniquement.'],
    ],
  },
  {
    title: 'Activité',
    rows: [
      ['Nature', 'Service SaaS de journal de trading et d\'analyse pour traders sur comptes PropFirm'],
      ['Statut financier', 'Quantara N\'EST PAS un conseiller financier régulé. Pas de PSI, pas d\'AMF, pas de SEC.'],
      ['Statut', 'Outil informatique — pas de produit financier proposé.'],
    ],
  },
]

const BLOCS_EN = [
  {
    title: 'Site publisher',
    rows: [
      ['Company name', 'Quantara Technologies LLC'],
      ['Legal form', 'Limited Liability Company (LLC)'],
      ['Jurisdiction', 'State of New Mexico, United States'],
      ['Address', '1209 Mountain Road PL NE, STE R, Albuquerque, NM 87110, USA'],
      ['Country', 'United States (New Mexico)'],
      ['Legal representative', 'Omar Bakkali, Managing Member'],
      ['Contact email', 'contact@quantara.tech'],
      ['Security email', 'security@quantara.tech'],
    ],
  },
  {
    title: 'Hosting',
    rows: [
      ['Frontend', 'Vercel Inc. — 340 S Lemon Ave #4133, Walnut, CA 91789, USA — vercel.com'],
      ['Edge region', 'Frankfurt, Germany (cdg1/fra1)'],
      ['Database', 'Supabase Inc. — 970 Toa Payoh North #07-04, Singapore — supabase.com'],
      ['DB region', 'EU Central (Frankfurt, Germany)'],
      ['Anti-bot', 'Cloudflare Inc. (Turnstile) — 101 Townsend St, San Francisco, CA 94107, USA'],
    ],
  },
  {
    title: 'Intellectual property',
    rows: [
      ['Trademark', 'Quantara™ — used by Quantara Technologies LLC'],
      ['Source code', 'Proprietary — Quantara Technologies LLC. All rights reserved.'],
      ['User data', 'Owned by the respective users (see Terms)'],
      ['PropFirm logos', 'Trademarks of their respective owners (Topstep®, Apex®, Lucid Trading®, etc.). Used for informational purposes only.'],
    ],
  },
  {
    title: 'Activity',
    rows: [
      ['Nature', 'SaaS trading journal and analytics service for PropFirm account traders'],
      ['Financial status', 'Quantara is NOT a regulated financial advisor. No PSI, no AMF, no SEC.'],
      ['Status', 'Software tool — no financial product offered.'],
    ],
  },
]

export default function ImprintClient() {
  const t = useT()
  const { locale } = useLanguage()
  const BLOCS = locale === 'en' ? BLOCS_EN : BLOCS_FR

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />

      <main style={{ flex: 1 }}>
        {/* HERO */}
        <section style={{ padding: '80px 24px 40px', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
          <Reveal>
            <div style={{ fontSize: 11, color: C.blueLight, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 18 }}>
              {t('pages.legal.eyebrow')}
            </div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, marginBottom: 14 }}>
              {t('pages.legal.imprintTitle')}
            </h1>
            <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6 }}>
              {t('pages.legal.imprintMeta')}
            </p>
          </Reveal>
        </section>

        {/* BLOCS */}
        <section style={{ padding: '0 24px 60px', maxWidth: 820, margin: '0 auto' }}>
          {BLOCS.map((bloc, i) => (
            <Reveal key={i}>
              <div style={{
                marginBottom: 18,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '14px 22px',
                  background: 'var(--tint1)',
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <h2 style={{
                    fontSize: 14, fontWeight: 700,
                    color: C.blueLight, margin: 0,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    fontFamily: 'ui-monospace, monospace',
                  }}>
                    {bloc.title}
                  </h2>
                </div>
                <div>
                  {bloc.rows.map((r, j) => (
                    <div key={j} style={{
                      padding: '12px 22px',
                      borderTop: j > 0 ? `1px solid ${C.border}` : 'none',
                      display: 'grid',
                      gridTemplateColumns: '180px 1fr',
                      gap: 16, alignItems: 'baseline',
                      fontSize: 13,
                    }}>
                      <span style={{
                        color: C.text3, fontFamily: 'ui-monospace, monospace',
                        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{r[0]}</span>
                      <span style={{ color: C.text, lineHeight: 1.6 }}>{r[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </section>

        {/* DROIT APPLICABLE */}
        <section style={{ padding: '20px 24px 40px', maxWidth: 820, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              padding: '20px 24px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0, marginBottom: 10, letterSpacing: '-0.01em' }}>
                {t('pages.legal.imprintLawTitle')}
              </h2>
              <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, margin: 0 }}>
                {t('pages.legal.imprintLawBody')}
              </p>
            </div>
          </Reveal>
        </section>

        {/* INDÉPENDANCE PROPFIRMS */}
        <section style={{ padding: '20px 24px 40px', maxWidth: 820, margin: '0 auto' }}>
          <Reveal>
            <div style={{
              padding: '18px 22px',
              background: 'var(--blue-bg)',
              border: '1px solid var(--blue-border)',
              borderRadius: 10,
              fontSize: 12, color: C.text2, lineHeight: 1.7,
            }}>
              <strong style={{ color: C.blueLight }}>{t('pages.legal.imprintIndepTitle')}</strong>{t('pages.legal.imprintIndepBody')}
            </div>
          </Reveal>
        </section>

        {/* CONTACT */}
        <section style={{ padding: '20px 24px 80px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 12, letterSpacing: '-0.015em' }}>
              {t('pages.legal.imprintContactTitle')}
            </h2>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 18 }}>
              {t('pages.legal.imprintContactGeneral')} <a href="mailto:contact@quantara.tech" style={{ color: C.blueLight, textDecoration: 'none' }}>contact@quantara.tech</a>
              <br />
              {t('pages.legal.imprintContactSecurity')} <a href="mailto:security@quantara.tech" style={{ color: C.blueLight, textDecoration: 'none' }}>security@quantara.tech</a>
            </p>
          </Reveal>
        </section>
      </main>

      <Footer />
    </div>
  )
}
