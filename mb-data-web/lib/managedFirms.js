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

// Normalize a custom FUTURES firm row → { name, plans, rules, logo_url } for the
// PROPFIRM_RULES-shaped overlay (lib/constants registerCustomFuturesFirms).
// A firm has one or more PROGRAMS (Lucid FLEX/PRO/INSTANT); they're flattened into a
// single { plans: union, rules: merged } — the same flat shape the static catalog uses
// (distinct programs use distinct rule labels, e.g. "DLL FLEX" vs "DLL PRO").
// Back-compat: an old flat { plans, rules } blob is treated as one program.
export function managedFuturesFirmToEntry(row) {
  const d = row.data || {}
  const programs = Array.isArray(d.programs) && d.programs.length
    ? d.programs
    : ((d.plans || d.rules) ? [{ name: '', plans: d.plans, rules: d.rules }] : [])
  const plans = []
  const rules = {}
  for (const pr of programs) {
    for (const pl of (pr.plans || [])) if (!plans.includes(pl)) plans.push(pl)
    Object.assign(rules, pr.rules || {})
  }
  return { name: row.name, plans, rules, logo_url: row.logo_url || null, __custom: true }
}

// React hook: active custom FUTURES firms (empty until loaded).
export function useManagedFuturesFirms() {
  const [firms, setFirms] = useState([])
  useEffect(() => {
    let mounted = true
    loadManagedFirms().then((all) => {
      if (mounted) setFirms((all || []).filter((f) => f.market === 'futures').map(managedFuturesFirmToEntry))
    })
    return () => { mounted = false }
  }, [])
  return firms
}
