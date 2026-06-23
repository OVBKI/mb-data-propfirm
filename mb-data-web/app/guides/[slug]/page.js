// /guides/[slug] — Dynamic guide page (5 guides SSG via generateStaticParams).

import { notFound } from 'next/navigation'
import GuidePageClient from './GuidePageClient'
import JsonLd, { ORGANIZATION_SCHEMA } from '../../../components/JsonLd'
import { getGuide, getAllGuideSlugs, GUIDES } from '../../../lib/guides'

export const revalidate = 3600

export function generateStaticParams() {
  return getAllGuideSlugs().map((slug) => ({ slug }))
}

export function generateMetadata({ params }) {
  const guide = getGuide(params.slug)
  if (!guide) {
    return { title: 'Guide not found · Quantara', robots: { index: false, follow: false } }
  }
  const canonical = `https://quantara.tech/guides/${params.slug}`
  return {
    title: `${guide.title} | Quantara`,
    description: guide.description,
    alternates: { canonical },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: canonical,
      type: 'article',
      images: ['/og-image.webp'],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: guide.description,
    },
  }
}

export default function Page({ params }) {
  const guide = getGuide(params.slug)
  if (!guide) notFound()

  const canonical = `https://quantara.tech/guides/${params.slug}`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    url: canonical,
    datePublished: guide.updatedDate,
    dateModified: guide.updatedDate,
    author: { '@type': 'Organization', name: 'Quantara' },
    publisher: {
      '@type': 'Organization',
      name: 'Quantara',
      logo: { '@type': 'ImageObject', url: 'https://quantara.tech/quantara-logo.webp' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Quantara', item: 'https://quantara.tech' },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://quantara.tech/guides' },
      { '@type': 'ListItem', position: 3, name: guide.title, item: canonical },
    ],
  }

  const faqSchema = guide.faqs?.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null

  // Related guides (lookup full data)
  const relatedGuides = (guide.relatedGuides || [])
    .map((s) => ({ slug: s, ...GUIDES[s] }))
    .filter((g) => g.title)

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <JsonLd data={ORGANIZATION_SCHEMA} />
      <GuidePageClient guide={guide} slug={params.slug} relatedGuides={relatedGuides} />
    </>
  )
}
