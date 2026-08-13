// Page Following — /u/[username]/following
// Phase 2 réseau social (mai 2026) : liste les users que ce profil suit.
//
// Symétrique de followers/page.js — même logique mais avec follower_id = target.

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
    title: `Following de @${params.username}`,
    robots: { index: false, follow: true },
  }
}

export default async function FollowingPage({ params }) {
  const supabase = getAnonClient()
  if (!supabase) notFound()

  const { data: target } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, following_count, is_public')
    .ilike('username', params.username)
    .maybeSingle()

  if (!target || !target.is_public) notFound()

  // Liste de ceux que CE user suit
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id, created_at')
    .eq('follower_id', target.user_id)
    .order('created_at', { ascending: false })
    .limit(200)

  const followingIds = (follows || []).map(f => f.following_id)
  let followingProfiles = []
  if (followingIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, bio, country, is_public, verified')
      .in('user_id', followingIds)
    followingProfiles = data || []
  }

  const profileById = new Map(followingProfiles.map(p => [p.user_id, p]))
  const orderedFollowing = (follows || []).map(f => ({
    ...f,
    profile: profileById.get(f.following_id) || null,
  }))

  const displayName = target.display_name || target.username

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)',
      padding: '0 0 60px', fontFamily: 'inherit',
    }}>
      <header style={headerStyle}>
        <Link href="/" style={brandStyle}>QUANTARA</Link>
        <Link href={`/u/${target.username}`} style={backStyle}>← Profil de {displayName}</Link>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, margin: 0,
          letterSpacing: '-0.01em', marginBottom: 6,
        }}>
          <span style={{ fontFamily: 'monospace', color: 'var(--blue-light)' }}>@{target.username}</span> suit
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 0, marginBottom: 28 }}>
          {target.following_count || 0} {target.following_count === 1 ? 'trader suivi' : 'traders suivis'}.
        </p>

        {orderedFollowing.length === 0 ? (
          <EmptyState message="Ce profil ne suit personne pour l'instant." />
        ) : (
          <FollowList items={orderedFollowing} />
        )}
      </main>
    </div>
  )
}

// === Sub-components ===
function FollowList({ items }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
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
            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            transition: 'background 0.1s',
            cursor: isPublic ? 'pointer' : 'default',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: isPublic
                ? 'linear-gradient(135deg, #2d6fff, #4d8fff)'
                : 'var(--tint2)',
              border: isPublic ? '1px solid var(--hairline)' : '1px dashed var(--hairline)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: '#fff',
              flexShrink: 0,
            }}>
              {isPublic ? (p.username?.[0]?.toUpperCase() || '?') : '🔒'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14, fontWeight: 600, color: 'var(--text)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                {p?.verified && (
                  <span title="Profil vérifié" style={verifiedBadgeStyle}>✓</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>{subName}</div>
            </div>
            {isPublic && (
              <span style={{ fontSize: 11, color: 'var(--blue-light)', fontWeight: 600 }}>Voir →</span>
            )}
          </div>
        )

        return isPublic ? (
          <Link key={f.following_id} href={`/u/${p.username}`} style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
            {row}
          </Link>
        ) : (
          <div key={f.following_id}>{row}</div>
        )
      })}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div style={{
      padding: 60, textAlign: 'center',
      background: 'var(--surface)', border: '1px dashed var(--hairline)',
      borderRadius: 12, color: 'var(--text3)', fontSize: 13,
    }}>
      {message}
    </div>
  )
}

const headerStyle = {
  padding: '16px 24px', borderBottom: '1px solid var(--border)',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
}
const brandStyle = {
  fontSize: 13, fontWeight: 700, letterSpacing: '0.12em',
  color: 'var(--text)', textDecoration: 'none',
}
const backStyle = {
  padding: '8px 16px', fontSize: 12, fontWeight: 600,
  background: 'transparent', color: 'var(--text2)',
  border: '1px solid var(--border2)', borderRadius: 8,
  textDecoration: 'none',
}
const verifiedBadgeStyle = {
  fontSize: 9, color: 'var(--blue-light)',
  background: 'rgba(45,111,255,0.15)',
  borderRadius: '50%', width: 14, height: 14,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
}
