// lib/fetchAll.js — toutes les lignes d'une requête Supabase, page par page.
//
// PostgREST plafonne une réponse à 1 000 lignes, sans erreur : un journal de
// 1 500 trades s'affichait donc tronqué, sans que rien ne le signale.
// `build` rend une requête neuve à chaque appel ; elle doit avoir un ordre
// stable (terminer par .order('id')), sinon deux pages peuvent se chevaucher.
export async function fetchAll(build, { pageSize = 1000 } = {}) {
  const out = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build().range(from, from + pageSize - 1)
    if (error) return { data: null, error }
    out.push(...(data || []))
    if (!data || data.length < pageSize) return { data: out, error: null }
  }
}
