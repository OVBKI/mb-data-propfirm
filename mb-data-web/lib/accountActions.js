// lib/accountActions.js — export des données et suppression du compte, côté client.
// Une seule implémentation pour les Réglages et la fenêtre de profil : avant, les
// Réglages affichaient « bientôt » et renvoyaient vers un e-mail, alors que les
// deux fonctions marchaient déjà dans la fenêtre de profil.
import { supabase } from './supabase'

/** Phrase exigée par /api/auth/delete-account. Ne pas traduire : l'API la compare telle quelle. */
export const DELETE_CONFIRMATION = 'SUPPRIMER MON COMPTE'

async function bearer() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('SESSION')
  return `Bearer ${session.access_token}`
}

/** Télécharge un CSV de toutes les données (comptes, payouts, journal). */
export async function exportAllData() {
  const r = await fetch('/api/export?type=all', { headers: { Authorization: await bearer() } })
  if (!r.ok) throw new Error('EXPORT')
  const blob = await r.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `quantara-export-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Supprime définitivement le compte et ses données, puis déconnecte. */
export async function deleteAccount(confirmation) {
  const r = await fetch('/api/auth/delete-account', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: await bearer() },
    body: JSON.stringify({ confirmation }),
  })
  if (!r.ok) {
    const d = await r.json().catch(() => ({}))
    throw new Error(d.error || 'DELETE')
  }
  await supabase.auth.signOut()
  window.location.href = '/'
}
