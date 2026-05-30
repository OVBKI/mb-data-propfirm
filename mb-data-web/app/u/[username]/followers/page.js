// Page Followers — /u/[username]/followers
// Phase 2 réseau social (mai 2026) : liste les users qui suivent ce profil.
//
// Server component (SEO + perf). Affiche uniquement si le profil cible est public.
// Liste les followers — les follow rows sont publiques (select policy = true),
// mais on n'affiche le pseudo cliquable QUE pour les followers eux-mêmes is_public.
// Les followers privés sont représentés par "Trader anonyme" (count préservé).

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function generateMetadata({ params }) {
  return {
    title: `Followers de @${params.username}`,
    robots: { index: false, follow: true },
  }
}

export default async function FollowersPage({ params }) {
  const supabase = getAnonClient()
  if (!supabase) notFound()

  // 1) Récupère le profil cible (doit être public sinon 404)
  const { data: target } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, followers_count, is_public')
    .ilike('username', params.username)
    .maybeSingle()

  if (!target || !target.is_public) notFound()

  // 2) Liste des followers (= rows follows.following_id = target.user_id)
  // Les follows sont publiques en lecture (RLS), donc on récupère tous les follower_id
  const { data: follows } = await supabase
    .from('follows')
    .select('follower_id, created_at')
    .eq('following_id', target.user_id)
    .order('created_at', { ascending: false })
    .limit(200)

  // 3) Récupère les profiles correspondants (seulement les public, mais on garde le count total)
  const followerIds = (follows || []).map(f => f.follower_id)
  let followerProfiles = []
  if (followerIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, bio, country, is_public, verified')
      .in('user_id', followerIds)
    followerProfiles = data || []
  }

  // Map pour conserver l'ordre + ajouter created_at
  const profileById = new Map(followerProfiles.map(p => [p.user_id, p]))
  const orderedFollowers = (follows || []).map(f => ({
    ...f,
    profile: profileById.get(f.follower_id) || null,
  }))

  const displayName = target.display_name || target.username

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0f14', color: '#f0ede8',
      padding: '0 0 60px', fontFamily: 'inherit',
    }}>
      {/* Top bar */}
      <header style={headerStyle}>
        <Link href="/" style={brandStyle}>QUANTARA</Link>
        <Link href={`/u/${target.username}`} style={backStyle}>← Profil de {displayName}</Link>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, margin: 0,
          letterSpacing: '-0.01em', marginBottom: 6,
        }}>
          Followers de <span style={{ fontFamily: 'monospace', color: '#4d8fff' }}>@{target.username}</span>
        </h1>
        <p style={{ fontSize: 13, color: '#9098b0', marginTop: 0, marginBottom: 28 }}>
          {target.followers_count || 0} {target.followers_count === 1 ? 'personne suit' : 'personnes suivent'} ce profil.
        </p>

        {orderedFollowers.length === 0 ? (
          <EmptyState message="Personne ne suit ce profil pour l'instant." />
        ) : (
          <FollowerList items={orderedFollowers} />
        )}
      </main>
    </div>
  )
}

// === Sub-components ===
function FollowerList({ items }) {
  return (
    <div style={{
      background: '#141720', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {items.map((f, i) => {
        const p = f.profile
        const isPublic = p && p.is_public && p.username
        const name = (p?.display_name || p?.username) || 'Trader privé'
        const subName = isPublic ? `@${p.username}` : 'Profil privé'

        const row = (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 18px',
            borderTop: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            transition: 'background 0.1s',
            cursor: isPublic ? 'pointer' : 'default',
          }}>
            {/* Avatar */}
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: isPublic
                ? 'linear-gradient(135deg, #2d6fff, #4d8fff)'
                : 'rgba(255,255,255,0.04)',
              border: isPublic ? '1px solid rgba(255,255,255,0.10)' : '1px dashed rgba(255,255,255,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: '#fff',
              flexShrink: 0,
            }}>
              {isPublic ? (p.username?.[0]?.toUpperCase() || '?') : '🔒'}
            </div>
            {/* Name + sub */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14, fontWeight: 600, color: '#f0ede8',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                {p?.verified && (
                  <span title="Profil vérifié" style={verifiedBadgeStyle}>✓</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#7b839b', fontFamily: 'monospace' }}>{subName}</div>
            </div>
            {isPublic && (
              <span style={{ fontSize: 11, color: '#4d8fff', fontWeight: 600 }}>Voir →</span>
            )}
          </div>
        )

        return isPublic ? (
          <Link key={f.follower_id} href={`/u/${p.username}`} style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
            {row}
          </Link>
        ) : (
          <div key={f.follower_id}>{row}</div>
        )
      })}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div style={{
      padding: 60, textAlign: 'center',
      background: '#141720', border: '1px dashed rgba(255,255,255,0.10)',
      borderRadius: 12, color: '#7b839b', fontSize: 13,
    }}>
      {message}
    </div>
  )
}

// === Shared styles ===
const headerStyle = {
  padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
}
const brandStyle = {
  fontSize: 13, fontWeight: 700, letterSpacing: '0.12em',
  color: '#f0ede8', textDecoration: 'none',
}
const backStyle = {
  padding: '8px 16px', fontSize: 12, fontWeight: 600,
  background: 'transparent', color: '#9098b0',
  border: '1px solid rgba(255,255,255,0.13)', borderRadius: 8,
  textDecoration: 'none',
}
const verifiedBadgeStyle = {
  fontSize: 9, color: '#4d8fff',
  background: 'rgba(45,111,255,0.15)',
  borderRadius: '50%', width: 14, height: 14,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
}
