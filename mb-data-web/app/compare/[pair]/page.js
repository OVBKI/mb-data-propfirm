// /compare/[pair] — Dynamic firm-vs-firm comparison page (55 pairs SSG).
// Routes like /compare/topstep-vs-apex-trader-funding are auto-generated.
// More specific routes (e.g. /compare/quantara-vs-tradervue) take precedence
// because they have their own page.js folder.

import { notFound } from 'next/navigation'
import CompareFirmsClient from './CompareFirmsClient'
import JsonLd, { ORGANIZATION_SCHEMA } from '../../../components/JsonLd'
import { PROPFIRM_RULES } from '../../../lib/constants'
import {
  firmToSlug,
  slugToPair,
  FIRM_META,
  getAllFirmPairs,
  pickComparisonPlan,
} from '../../../lib/firmSlugs'

export const revalidate = 3600

export function generateStaticParams() {
  return getAllFirmPairs().map(({ slug }) => ({ pair: slug }))
}

export function generateMetadata({ params }) {
  const pair = slugToPair(params.pair)
  if (!pair) {
    return { title: 'Comparison not found · Quantara', robots: { index: false, follow: false } }
  }
  const { firmA, firmB } = pair
  const canonical = `https://quantara.tech/compare/${params.pair}`
  const title = `${firmA} vs ${firmB} — Comparatif PropFirm 2026 | Quantara`
  const description = `${firmA} vs ${firmB} : drawdown, profit split, payouts, prix, règles. Comparatif complet vérifié mai 2026 pour choisir ta PropFirm futures.`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${firmA} vs ${firmB} — Comparatif 2026`,
      description,
      url: canonical,
      type: 'article',
      images: ['/og-image.webp'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${firmA} vs ${firmB}`,
      description,
    },
  }
}

export default function Page({ params }) {
  const pair = slugToPair(params.pair)
  if (!pair) notFound()

  const { firmA, firmB, slugA, slugB } = pair
  const dataA = PROPFIRM_RULES[firmA]
  const dataB = PROPFIRM_RULES[firmB]
  if (!dataA || !dataB) notFound()

  const metaA = FIRM_META[firmA] || {}
  const metaB = FIRM_META[firmB] || {}
  const planA = pickComparisonPlan(dataA)
  const planB = pickComparisonPlan(dataB)
  const canonical = `https://quantara.tech/compare/${params.pair}`

  const webpageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${firmA} vs ${firmB} — Comparatif PropFirm`,
    url: canonical,
    description: `${firmA} vs ${firmB} side-by-side comparison.`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Quantara', item: 'https://quantara.tech' },
        { '@type': 'ListItem', position: 2, name: 'Compare', item: 'https://quantara.tech/compare' },
        { '@type': 'ListItem', position: 3, name: `${firmA} vs ${firmB}`, item: canonical },
      ],
    },
  }

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${firmA} et ${firmB}`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, url: `https://quantara.tech/firms/${slugA}`, name: firmA },
      { '@type': 'ListItem', position: 2, url: `https://quantara.tech/firms/${slugB}`, name: firmB },
    ],
  }

  return (
    <>
      <JsonLd data={webpageSchema} />
      <JsonLd data={itemListSchema} />
      <JsonLd data={ORGANIZATION_SCHEMA} />
      <CompareFirmsClient
        firmA={firmA}
        firmB={firmB}
        dataA={dataA}
        dataB={dataB}
        metaA={metaA}
        metaB={metaB}
        planA={planA}
        planB={planB}
        slugA={slugA}
        slugB={slugB}
      />
    </>
  )
}
