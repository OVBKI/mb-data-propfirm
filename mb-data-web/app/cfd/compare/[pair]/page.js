// /cfd/compare/[pair] — Dynamic CFD firm-vs-firm comparison page (36 pairs SSG).
// Routes like /cfd/compare/ftmo-vs-the5ers are auto-generated from CFD_PROPFIRM_RULES.
// Mirrors the futures /compare/[pair] template for the CFD / forex vertical.

import { notFound } from 'next/navigation'
import CompareCfdFirmsClient from './CompareCfdFirmsClient'
import JsonLd, { ORGANIZATION_SCHEMA } from '../../../../components/JsonLd'
import { CFD_PROPFIRM_RULES } from '../../../../lib/cfdConstants'
import { getAllCfdFirmPairs, cfdSlugToPair, CFD_FIRM_TAGLINE } from '../../../../lib/cfdSlugs'

export const revalidate = 3600

export function generateStaticParams() {
  return getAllCfdFirmPairs().map(({ slug }) => ({ pair: slug }))
}

export function generateMetadata({ params }) {
  const pair = cfdSlugToPair(params.pair)
  if (!pair) {
    return { title: 'Comparaison introuvable · Quantara', robots: { index: false, follow: false } }
  }
  const { firmA, firmB } = pair
  const canonical = `https://quantara.tech/cfd/compare/${params.pair}`
  const title = `${firmA} vs ${firmB} — Comparatif PropFirm CFD 2026 | Quantara`
  const description = `${firmA} vs ${firmB} : daily loss, max loss (statique vs trailing), profit split, payouts, plateformes. Comparatif CFD / forex complet, vérifié 2026.`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${firmA} vs ${firmB} — Comparatif CFD 2026`,
      description,
      url: canonical,
      type: 'article',
      images: ['/og-image.webp'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${firmA} vs ${firmB} (CFD)`,
      description,
    },
  }
}

export default function Page({ params }) {
  const pair = cfdSlugToPair(params.pair)
  if (!pair) notFound()

  const { firmA, firmB, slugA, slugB } = pair
  const dataA = CFD_PROPFIRM_RULES[firmA]
  const dataB = CFD_PROPFIRM_RULES[firmB]
  if (!dataA || !dataB) notFound()

  const canonical = `https://quantara.tech/cfd/compare/${params.pair}`

  const webpageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${firmA} vs ${firmB} — Comparatif PropFirm CFD`,
    url: canonical,
    description: `${firmA} vs ${firmB} : comparatif CFD / forex côte à côte.`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Quantara', item: 'https://quantara.tech' },
        { '@type': 'ListItem', position: 2, name: 'PropFirms CFD', item: 'https://quantara.tech/cfd' },
        { '@type': 'ListItem', position: 3, name: `${firmA} vs ${firmB}`, item: canonical },
      ],
    },
  }

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${firmA} et ${firmB}`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, url: `https://quantara.tech/cfd/${slugA}`, name: firmA },
      { '@type': 'ListItem', position: 2, url: `https://quantara.tech/cfd/${slugB}`, name: firmB },
    ],
  }

  return (
    <>
      <JsonLd data={webpageSchema} />
      <JsonLd data={itemListSchema} />
      <JsonLd data={ORGANIZATION_SCHEMA} />
      <CompareCfdFirmsClient
        firmA={firmA}
        firmB={firmB}
        dataA={dataA}
        dataB={dataB}
        slugA={slugA}
        slugB={slugB}
        taglineA={CFD_FIRM_TAGLINE[firmA] || ''}
        taglineB={CFD_FIRM_TAGLINE[firmB] || ''}
      />
    </>
  )
}
