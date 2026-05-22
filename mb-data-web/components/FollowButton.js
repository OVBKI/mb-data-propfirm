'use client'
// FollowButton — bouton client réutilisable pour follow/unfollow un user.
// Phase 2 réseau social (mai 2026).
//
// Props :
//   targetUserId : uuid du user à suivre/dé-suivre (obligatoire)
//   targetUsername : pseudo (pour l'aria-label + redirect non connecté)
//   onChange : callback optionnel (newIsFollowing: boolean) → parent peut update les counts
//   size : 'sm' | 'md' (défaut 'md')
//
// Comportement :
//   - Si user pas connecté → "Se connecter pour suivre" qui redirige vers /app
//   - Si user connecté ET targetUserId === currentUserId → null (cacher, pas se follow soi-même)
//   - Sinon → bouton Follow/Unfollow avec état loading
//
// Sécurité : RLS Supabase fait le check (impossible de follow au nom d'un autre).

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function FollowButton({ targetUserId, targetUsername, onChange, size = 'md' }) {
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true) // chargement initial de l'état
  const [acting, setActing] = useState(false)  // en cours de follow/unfollow

  // Load session + état follow initial
  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      const uid = session?.user?.id || null
      setCurrentUserId(uid)
      if (uid && uid !== targetUserId) {
        const { data } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', uid)
          .eq('following_id', targetUserId)
          .maybeSingle()
        if (!cancelled) setIsFollowing(!!data)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [targetUserId])

  // Cache si c'est notre propre profil
  if (currentUserId === targetUserId) return null

  // Pas connecté → CTA login
  if (!loading && !currentUserId) {
    return (
      <a
        href={`/app?intent=follow&u=${encodeURIComponent(targetUsername || '')}`}
        style={btnStyle(size, 'outline')}>
        Se connecter pour suivre
      </a>
    )
  }

  async function handleClick() {
    if (acting || !currentUserId) return
    setActing(true)
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)
        if (error) throw error
        setIsFollowing(false)
        onChange?.(false)
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, following_id: targetUserId })
        if (error) {
          // 23505 = unique violation = déjà follow → on assume que c'est OK (race condition)
          if (error.code !== '23505') throw error
        }
        setIsFollowing(true)
        onChange?.(true)
      }
    } catch (err) {
      console.error('[FollowButton]', err)
      alert('Erreur : ' + (err.message || 'impossible de mettre à jour'))
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return <span style={{ ...btnStyle(size, 'outline'), opacity: 0.5 }}>⏳</span>
  }

  return (
    <button
      onClick={handleClick}
      disabled={acting}
      aria-label={isFollowing ? `Se désabonner de @${targetUsername}` : `Suivre @${targetUsername}`}
      style={{
        ...btnStyle(size, isFollowing ? 'outline' : 'filled'),
        cursor: acting ? 'wait' : 'pointer',
        opacity: acting ? 0.6 : 1,
      }}>
      {acting ? '⏳' : (isFollowing ? 'Suivi ✓' : 'Suivre')}
    </button>
  )
}

// Style helper (filled = action positive, outline = action neutre/réversible)
function btnStyle(size, variant) {
  const padding = size === 'sm' ? '6px 14px' : '10px 22px'
  const fontSize = size === 'sm' ? 11 : 13
  const radius = size === 'sm' ? 6 : 99
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding, fontSize, fontWeight: 600,
    borderRadius: radius, fontFamily: 'inherit',
    textDecoration: 'none', userSelect: 'none',
    transition: 'all 0.15s',
  }
  if (variant === 'filled') {
    return {
      ...base,
      background: '#2d6fff', color: '#fff',
      border: '1px solid transparent',
    }
  }
  // outline
  return {
    ...base,
    background: 'transparent', color: '#9098b0',
    border: '1px solid rgba(255,255,255,0.13)',
  }
}
