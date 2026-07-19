// Client-side loader for admin-managed custom firms (custom_propfirms table).
// The static catalogs (lib/constants.js, lib/cfdConstants.js) stay untouched so the
// SSG public pages keep working; custom firms are merged into in-app components at
// runtime via useManagedCfdFirms() / loadManagedFirms().

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

let cache = null
let inflight = null

// Fetch active custom firms once per session (cached). Safe if the table is absent.
export async function loadManagedFirms() {
  if (cache) return cache
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const { data, error } = await supabase
        .from('custom_propfirms')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      cache = error ? [] : (data || [])
    } catch {
      cache = []
    }
    inflight = null
    return cache
  })()
  return inflight
}

export function clearManagedFirmsCache() { cache = null }

function slugify(s) {
  return String(s || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// Normalize a custom CFD firm row into the same shape getCfdFirmsOrdered() returns,
// so getCfdModelsFromFirm() and the comparator/modal can consume it uniformly.
// The row's `data` blob mirrors the static catalog (flagship + otherModels + …).
export function managedCfdFirmToEntry(row) {
  const d = row.data || {}
  return {
    name: row.name,
    slug: row.slug || slugify(row.name),
    reputation: row.reputation || 'ok',
    reputationNote: '',
    website: row.website || '',
    platforms: d.platforms || [],
    instruments: d.instruments || [],
    flagship: d.flagship || null,
    otherModels: Array.isArray(d.otherModels) ? d.otherModels : [],
    logoUrl: row.logo_url || null,
    tagline: row.tagline || '',
    __custom: true,
  }
}

// React hook: active custom CFD firms as ready-to-render entries (empty until loaded).
export function useManagedCfdFirms() {
  const [firms, setFirms] = useState([])
  useEffect(() => {
    let mounted = true
    loadManagedFirms().then((all) => {
      if (mounted) setFirms((all || []).filter((f) => f.market === 'cfd').map(managedCfdFirmToEntry))
    })
    return () => { mounted = false }
  }, [])
  return firms
}
