// Helper d'upload de fichier vers Supabase Storage.
// Utilisé pour : trade screenshots + propfirm certificates.
//
// Prérequis Supabase :
//   1. Créer 2 buckets dans Supabase Dashboard → Storage
//      - `trade-screenshots`  (public, max 5 Mo)
//      - `certificates`       (public, max 10 Mo)
//   2. Pour chaque bucket, ajouter les policies RLS :
//      - INSERT : authenticated, condition : (storage.foldername(name))[1] = auth.uid()::text
//      - SELECT : public (lecture libre via URL)
//      - DELETE : authenticated, condition : (storage.foldername(name))[1] = auth.uid()::text
//
// Le fichier est nommé `{userId}/{timestamp}-{random}.{ext}` pour isolation par user.

import { supabase } from './supabase'

const MAX_SIZE_MB = {
  'trade-screenshots': 5,
  'certificates': 10,
}

const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
  'application/pdf',
]

export async function uploadFile({ bucket, file, userId }) {
  if (!file) return { error: 'Aucun fichier sélectionné' }
  if (!userId) return { error: 'Utilisateur non identifié' }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: `Type de fichier non supporté (${file.type}). Utilise PNG, JPG, WebP, GIF ou PDF.` }
  }
  const maxMB = MAX_SIZE_MB[bucket] || 5
  if (file.size > maxMB * 1024 * 1024) {
    return { error: `Fichier trop lourd (max ${maxMB} Mo)` }
  }

  // Nom unique dans le dossier de l'utilisateur
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  const safeExt = ext.replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin'
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`

  const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  if (upErr) {
    // Erreurs courantes : bucket inexistant, RLS, etc.
    if (/bucket.*not.*found|not_found/i.test(upErr.message || '')) {
      return { error: `Bucket "${bucket}" introuvable dans Supabase Storage. Crée-le dans Storage → New bucket (Public).` }
    }
    return { error: upErr.message || 'Erreur upload' }
  }

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: pub.publicUrl, path }
}

// Supprime un fichier précédemment uploadé (par son path stocké en DB)
export async function deleteFile({ bucket, path }) {
  if (!path) return { error: 'Path requis' }
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) return { error: error.message }
  return { ok: true }
}
