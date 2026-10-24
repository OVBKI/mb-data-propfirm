// lib/indexedPairs.js — quelles pages « firme contre firme » Google doit indexer.
//
// 66 paires futures et 36 paires CFD sont générées par gabarit. Indexées toutes,
// elles risquent d'être jugées comme du contenu mince et dupliqué, ce qui pèse sur
// tout le domaine. On n'indexe que les paires entre les firmes les plus suivies ;
// les autres pages restent en ligne (liens internes, partage) en noindex, et
// sortent du sitemap. Pour indexer une paire, ajouter les deux firmes ici.
export const INDEXED_FUTURES_FIRMS = ['topstep', 'apex-trader-funding', 'tradeify', 'lucid-trading', 'my-funded-futures']
export const INDEXED_CFD_FIRMS = ['ftmo', 'fundednext', 'the5ers', 'fundingpips']

function bothIn(pairSlug, firms) {
  const parts = String(pairSlug).split('-vs-')
  return parts.length === 2 && parts.every((p) => firms.includes(p))
}

export const isIndexedFuturesPair = (slug) => bothIn(slug, INDEXED_FUTURES_FIRMS)
export const isIndexedCfdPair = (slug) => bothIn(slug, INDEXED_CFD_FIRMS)
