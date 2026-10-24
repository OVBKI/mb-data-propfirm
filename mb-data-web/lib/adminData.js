// lib/adminData.js — lecture des données admin via /api/admin/data (service
// role côté serveur). Ne jamais lire ces tables avec le client navigateur
// depuis l'admin : la RLS n'y laisse voir que les lignes de l'admin lui-même.
import { supabase } from './supabase'

export async function fetchAdminData(view, params = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const qs = new URLSearchParams({ view, ...params })
  const r = await fetch(`/api/admin/data?${qs}`, { headers: { Authorization: `Bearer ${session?.access_token || ''}` } })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`)
  return d
}
