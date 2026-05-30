// /firms/[slug] — Dynamic firm review page (11 pages auto-generated at build).
// Server component : metadata + JSON-LD + static params for SSG.

import { notFound } from 'next/navigation'
import FirmPageClient from './FirmPageClient'
import JsonLd, { ORGANIZATION_SCHEMA } from '../../../components/JsonLd'
import { PROPFIRM_RULES, FIRM_SUGGESTIONS } from '../../../lib/constants'
import { firmToSlug, slugToFirm, FIRM_META, getAllFirmSlugs } from '../../../lib/firmSlugs'

export const revalidate = 3600

export function generateStaticParams() {
  return getAllFirmSlugs().map((slug) => ({ slug }))
}

export function generateMetadata({ params }) {
  const firmName = slugToFirm(params.slug)
  if (!firmName) {
    return { title: 'PropFirm not found · Quantara', robots: { index: false, follow: false } }
  }
  const meta = FIRM_META[firmName] || {}
  const canonical = `https://quantara.tech/firms/${params.slug}`
  const title = `${firmName} Review 2026 — Règles, Drawdown, Payouts | Quantara`
  const description = meta.description
    || `${firmName} : règles complètes 2026, drawdown, profit split, payouts, prix. Toutes les data vérifiées.`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${firmName} — PropFirm Review 2026`,
      description,
      url: canonical,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${firmName} Review 2026`,
      description,
    },
  }
}

export default function Page({ params }) {
  const firmName = slugToFirm(params.slug)
  if (!firmName) notFound()

  const firm = PROPFIRM_RULES[firmName]
  const meta = FIRM_META[firmName] || {}
  if (!firm) notFound()

  const canonical = `https://quantara.tech/firms/${params.slug}`

  // Build JSON-LD : Product + FAQPage + BreadcrumbList
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: firmName,
    description: meta.description || `${firmName} PropFirm futures.`,
    brand: { '@type': 'Brand', name: firmName },
    category: 'PropFirm / Trading Funding',
    url: canonical,
    review: {
      '@type': 'Review',
      author: { '@type': 'Organization', name: 'Quantara' },
      reviewBody: meta.intro || `Review ${firmName}.`,
      datePublished: '2026-05-01',
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Quantara', item: 'https://quantara.tech' },
      { '@type': 'ListItem', position: 2, name: 'PropFirms', item: 'https://quantara.tech/firms' },
      { '@type': 'ListItem', position: 3, name: firmName, item: canonical },
    ],
  }

  const faqSchema = meta.faqs?.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: meta.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null

  // Other firms for "Compare" section + comparison page links
  const currentSlug = firmToSlug(firmName)
  const otherFirms = FIRM_SUGGESTIONS
    .filter((n) => n !== firmName)
    .slice(0, 5)
    .map((n) => {
      const otherSlug = firmToSlug(n)
      // Build the canonical pair slug (alphabetical order)
      const pairSlug = currentSlug < otherSlug
        ? `${currentSlug}-vs-${otherSlug}`
        : `${otherSlug}-vs-${currentSlug}`
      return { name: n, slug: otherSlug, compareSlug: pairSlug }
    })

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <JsonLd data={ORGANIZATION_SCHEMA} />
      <FirmPageClient firmName={firmName} firm={firm} meta={meta} otherFirms={otherFirms} />
    </>
  )
}
