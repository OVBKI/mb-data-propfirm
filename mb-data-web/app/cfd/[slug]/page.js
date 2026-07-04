// /cfd/[slug] — Dynamic CFD PropFirm page (9 pages auto-generated at build, SSG).
// Server component : metadata + JSON-LD (Product + BreadcrumbList + FAQPage) + static params.
// FAQs are GENERATED from the flagship data (lib/cfdConstants.js) — no invented rules.

import { notFound } from 'next/navigation'
import CfdFirmClient from './CfdFirmClient'
import JsonLd from '../../../components/JsonLd'
import { CFD_PROPFIRM_RULES, CFD_DAILY_BASIS_LABEL, CFD_MAX_BASIS_LABEL } from '../../../lib/cfdConstants'
import { cfdSlugToFirm, getAllCfdSlugs, CFD_FIRM_TAGLINE } from '../../../lib/cfdSlugs'

export const revalidate = 3600

export function generateStaticParams() {
  return getAllCfdSlugs().map((slug) => ({ slug }))
}

export function generateMetadata({ params }) {
  const firmName = cfdSlugToFirm(params.slug)
  if (!firmName) {
    return { title: 'PropFirm CFD introuvable · Quantara', robots: { index: false, follow: false } }
  }
  const tagline = CFD_FIRM_TAGLINE[firmName]
  const canonical = `https://quantara.tech/cfd/${params.slug}`
  const title = `${firmName} — Règles CFD 2026 (drawdown, profit split, payout) | Quantara`
  const description = tagline
    || `${firmName} : règles CFD 2026, daily loss, max loss, profit split, payouts, plateformes. Data vérifiées juin 2026.`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${firmName} — Règles CFD 2026`,
      description,
      url: canonical,
      type: 'article',
      images: ['/og-image.webp'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${firmName} — Règles CFD 2026`,
      description,
    },
  }
}

// Build FAQ entries purely from the flagship data (no invented values).
function buildFaqs(firmName, firm) {
  const f = firm.flagship || {}
  const faqs = []

  if (f.maxLoss) {
    const basis = CFD_MAX_BASIS_LABEL[f.maxLoss.basis] || f.maxLoss.basis
    faqs.push({
      q: `Quel est le drawdown maximum de ${firmName} ?`,
      a: `Sur le modèle ${f.model}, la perte maximale est de ${f.maxLoss.pct}% — base : ${basis}.`,
    })
  }
  if (f.dailyLoss) {
    const basis = CFD_DAILY_BASIS_LABEL[f.dailyLoss.basis] || f.dailyLoss.basis
    faqs.push({
      q: `Quelle est la limite de perte journalière de ${firmName} ?`,
      a: `Le daily loss du modèle ${f.model} est de ${f.dailyLoss.pct}%, calculé sur : ${basis}.`,
    })
  }
  if (f.profitSplit) {
    const split = f.profitSplit.from === f.profitSplit.to
      ? `${f.profitSplit.from}%`
      : `de ${f.profitSplit.from}% à ${f.profitSplit.to}%`
    faqs.push({
      q: `Quel est le profit split de ${firmName} ?`,
      a: `${firmName} reverse un profit split ${split} au trader sur le modèle ${f.model}.`,
    })
  }
  if (firm.platforms?.length) {
    faqs.push({
      q: `Quelles plateformes propose ${firmName} ?`,
      a: `${firmName} est disponible sur : ${firm.platforms.join(', ')}.`,
    })
  }
  if (f.profitTargets?.length) {
    const steps = f.steps ? `${f.steps}-step` : 'l’évaluation'
    faqs.push({
      q: `Quel est le profit target de ${firmName} ?`,
      a: `Le modèle ${f.model} (${steps}) demande un profit target de ${f.profitTargets.map((p) => `${p}%`).join(' puis ')}.`,
    })
  }

  return faqs.slice(0, 5)
}

export default function Page({ params }) {
  const firmName = cfdSlugToFirm(params.slug)
  if (!firmName) notFound()

  const firm = CFD_PROPFIRM_RULES[firmName]
  if (!firm) notFound()

  const canonical = `https://quantara.tech/cfd/${params.slug}`
  const tagline = CFD_FIRM_TAGLINE[firmName] || `${firmName} PropFirm CFD / forex.`
  const faqs = buildFaqs(firmName, firm)

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: firmName,
    description: tagline,
    brand: { '@type': 'Brand', name: firmName },
    category: 'PropFirm CFD / Forex',
    url: canonical,
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://quantara.tech' },
      { '@type': 'ListItem', position: 2, name: 'PropFirms CFD', item: 'https://quantara.tech/cfd' },
      { '@type': 'ListItem', position: 3, name: firmName, item: canonical },
    ],
  }

  const faqSchema = faqs.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null

  return (
    <>
      {/* Organization est déjà émis globalement par le root layout — pas de doublon ici. */}
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <CfdFirmClient firmName={firmName} firm={firm} slug={params.slug} tagline={tagline} faqs={faqs} />
    </>
  )
}
