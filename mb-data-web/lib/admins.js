// lib/admins.js — Liste centralisée des emails admin Quantara.
//
// USAGE :
//   import { ADMIN_EMAILS, isAdmin } from '@/lib/admins'
//
// Cette liste est importée par :
//   - app/api/admin/* (vérification serveur via Bearer token Supabase)
//   - app/admin/* (vérification client pour afficher/cacher les liens admin)
//   - components/PropfirmComparator (admin edit mode)
//
// IMPORTANT : la sécurité réelle vient des routes /api/admin/* qui vérifient
// le token côté serveur. Le filtrage client est uniquement UX (cacher les
// boutons inutiles aux non-admins).
//
// Pour ajouter un admin : éditer cette liste + redéployer. Pour des admins
// dynamiques (sans redeploy), il faudrait une table Supabase `admins` avec
// une RPC SECURITY DEFINER `is_admin()`.

export const ADMIN_EMAILS = [
  'bakkali-omar@hotmail.com',
  'omar.mbtrading@gmail.com',
  'admin@quantara.tech',
]

// Helper pour test rapide
export function isAdmin(email) {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase().trim())
}
