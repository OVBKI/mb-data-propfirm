// Page profil public — /u/[username]
// Phase 1 réseau social (mai 2026) : affiche le profil d'un user si is_public = true.
//
// Server component pour :
//   - SEO (Open Graph dynamique)
//   - Perf (rendu HTML direct, pas de loading client)
//   - Sécurité (RLS appliquée côté server, anon client utilisé)
//
// Si profil pas trouvé OU is_public = false → notFound() qui rend app/not-found.js.
//
// Privacy : on n'affiche AUCUN payout ici (réservé à la phase 4 avec opt-in séparé).
// On affiche : pseudo, display_name, bio, country, trading_styles, instruments,
// date d'inscription, et stats anonymes (nb de firms / trades publics).

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import FollowButton from '../../../components/FollowButton'

// Force dynamic rendering (pas de cache SSG) car le contenu change selon le user
export const dynamic = 'force-dynamic'

// Client anon Supabase pour ce server component
// Note: utilise l'anon key (NEXT_PUBLIC), donc RLS s'applique normalement —
// la policy "Public profiles are viewable by everyone" autorise SELECT si is_public = true.
function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// Fetch du profile par username (case-insensitive)
async function fetchPublicProfile(username) {
  const supabase = getAnonClient()
  if (!supabase) return null
  // Note: .ilike pour insensitive — mais on a déjà l'index lower(username) donc rapide
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, bio, country, banner_url, avatar_url, trading_styles, instruments, followers_count, following_count, verified, is_public, created_at')
    .ilike('username', username)
    .maybeSingle()
  if (error) {
    console.error('[u/[username]] fetch error:', error.message)
    return null
  }
  // Si profile pas public, on retourne null (=> 404)
  if (!data || !data.is_public) return null
  return data
}

// === Metadata SEO dynamique ===
export async function generateMetadata({ params }) {
  const profile = await fetchPublicProfile(params.username)
  if (!profile) {
    return {
      title: 'Profil introuvable',
      robots: { index: false, follow: false },
    }
  }
  const name = profile.display_name || profile.username
  const desc = profile.bio
    ? profile.bio.slice(0, 160)
    : `Profil trader PropFirm sur Quantara — ${name}.`
  return {
    title: `${name} (@${profile.username})`,
    description: desc,
    openGraph: {
      title: `${name} (@${profile.username}) · Quantara`,
      description: desc,
      type: 'profile',
      url: `https://quantara.tech/u/${profile.username}`,
    },
    twitter: {
      card: 'summary',
      title: `${name} (@${profile.username})`,
      description: desc,
    },
    robots: { index: true, follow: true },
  }
}

// Helper : code ISO pays → drapeau emoji (FR → 🇫🇷)
function countryFlag(code) {
  if (!code || code.length !== 2) return ''
  const A = 0x1F1E6 - 65 // Regional Indicator Symbol Letter A
  return String.fromCodePoint(
    code.charCodeAt(0) + A,
    code.charCodeAt(1) + A,
  )
}

// Helper : style label pour les sections
function fmtMonth(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  } catch { return '' }
}

// === Page principale ===
export default async function PublicProfilePage({ params }) {
  const profile = await fetchPublicProfile(params.username)
  if (!profile) {
    notFound()
  }

  const displayName = profile.display_name || profile.username
  const flag = countryFlag(profile.country)
  const memberSince = fmtMonth(profile.created_at)

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0f14', color: '#f0ede8',
      padding: '0 0 60px', fontFamily: 'inherit',
    }}>
      {/* Top bar minimal */}
      <header style={{
        padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link href="/" style={{
          fontSize: 13, fontWeight: 700, letterSpacing: '0.12em',
          color: '#f0ede8', textDecoration: 'none',
        }}>QUANTARA</Link>
        <Link href="/app" style={{
          padding: '8px 16px', fontSize: 12, fontWeight: 600,
          background: 'rgba(45,111,255,0.12)', color: '#4d8fff',
          border: '1px solid rgba(45,111,255,0.3)', borderRadius: 8,
          textDecoration: 'none',
        }}>
          Ouvrir mon dashboard →
        </Link>
      </header>

      {/* Banner (si défini) */}
      {profile.banner_url ? (
        <div style={{
          height: 200,
          backgroundImage: `url(${profile.banner_url})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }} />
      ) : (
        <div style={{
          height: 140,
          background: 'linear-gradient(135deg, rgba(45,111,255,0.18), rgba(16,185,129,0.10) 60%, transparent)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }} />
      )}

      {/* Contenu profil */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
        {/* Avatar + nom + verified */}
        <div style={{ marginTop: -50, display: 'flex', alignItems: 'flex-end', gap: 20 }}>
          <div style={{
            width: 100, height: 100,
            borderRadius: '50%',
            background: profile.avatar_url
              ? `url(${profile.avatar_url}) center/cover`
              : 'linear-gradient(135deg, #2d6fff, #4d8fff)',
            border: '4px solid #0d0f14',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, fontWeight: 800, color: '#fff',
          }}>
            {!profile.avatar_url && (profile.username?.[0]?.toUpperCase() || '?')}
          </div>
          <div style={{ flex: 1, paddingBottom: 8 }}>
            <h1 style={{
              fontSize: 24, fontWeight: 700, margin: 0,
              letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {displayName}
              {profile.verified && (
                <span title="Profil vérifié" style={{
                  fontSize: 14, color: '#4d8fff',
                  background: 'rgba(45,111,255,0.15)',
                  borderRadius: '50%', width: 22, height: 22,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>✓</span>
              )}
              {flag && <span style={{ fontSize: 20, marginLeft: 4 }}>{flag}</span>}
            </h1>
            <div style={{
              fontSize: 13, color: '#9098b0', fontFamily: 'monospace', marginTop: 2,
            }}>@{profile.username}</div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p style={{
            fontSize: 14, color: '#9098b0', lineHeight: 1.6,
            marginTop: 18, marginBottom: 0,
            maxWidth: 540,
          }}>{profile.bio}</p>
        )}

        {/* Followers / Following (cliquables vers pages dédiées) */}
        <div style={{
          marginTop: 16, display: 'flex', gap: 20,
          fontSize: 13, color: '#9098b0', flexWrap: 'wrap',
        }}>
          <Link href={`/u/${profile.username}/following`} style={statLinkStyle}>
            <strong style={{ color: '#f0ede8' }}>{profile.following_count || 0}</strong> following
          </Link>
          <Link href={`/u/${profile.username}/followers`} style={statLinkStyle}>
            <strong style={{ color: '#f0ede8' }}>{profile.followers_count || 0}</strong> followers
          </Link>
          {memberSince && (
            <span style={{ color: '#565e78' }}>
              · Membre depuis {memberSince}
            </span>
          )}
        </div>

        {/* CTA Follow — Phase 2 réseau social (mai 2026) */}
        <div style={{ marginTop: 20 }}>
          <FollowButton
            targetUserId={profile.user_id}
            targetUsername={profile.username}
          />
        </div>

        {/* Trading styles + instruments */}
        {((profile.trading_styles?.length > 0) || (profile.instruments?.length > 0)) && (
          <div style={{ marginTop: 32 }}>
            {profile.trading_styles?.length > 0 && (
              <section style={{ marginBottom: 24 }}>
                <h2 style={sectionHeaderStyle}>Style de trading</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profile.trading_styles.map(s => (
                    <span key={s} style={tagStyle}>{s}</span>
                  ))}
                </div>
              </section>
            )}

            {profile.instruments?.length > 0 && (
              <section style={{ marginBottom: 24 }}>
                <h2 style={sectionHeaderStyle}>Instruments tradés</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profile.instruments.map(i => (
                    <span key={i} style={{ ...tagStyle, fontFamily: 'monospace' }}>{i}</span>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Placeholder pour les phases suivantes (groupes, payouts, leaderboard) */}
        <div style={{
          marginTop: 48, padding: 20,
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.10)',
          borderRadius: 12, textAlign: 'center',
          fontSize: 12, color: '#565e78',
        }}>
          🚧 D'autres fonctionnalités arrivent : groupes privés, leaderboard, chat.
          <br />
          Phase 2/6 du réseau social Quantara.
        </div>

        {/* Footer minimal */}
        <footer style={{
          marginTop: 60, paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          fontSize: 11, color: '#565e78', textAlign: 'center',
        }}>
          <Link href="/" style={{ color: '#9098b0', textDecoration: 'none' }}>Quantara</Link>
          {' · '}
          <Link href="/pricing" style={{ color: '#9098b0', textDecoration: 'none' }}>Tarifs</Link>
          {' · '}
          <Link href="/docs" style={{ color: '#9098b0', textDecoration: 'none' }}>Documentation</Link>
          {' · '}
          <Link href="/legal/privacy" style={{ color: '#9098b0', textDecoration: 'none' }}>Confidentialité</Link>
        </footer>
      </main>
    </div>
  )
}

// === Styles partagés ===
const sectionHeaderStyle = {
  fontSize: 11, fontWeight: 700,
  color: '#4d8fff',
  letterSpacing: '0.14em', textTransform: 'uppercase',
  margin: '0 0 12px', padding: 0,
}

const tagStyle = {
  display: 'inline-block',
  padding: '6px 14px', fontSize: 12, fontWeight: 500,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#f0ede8', borderRadius: 99,
}

const statLinkStyle = {
  color: '#9098b0', textDecoration: 'none',
  borderBottom: '1px dotted rgba(255,255,255,0.15)',
  paddingBottom: 2,
}
