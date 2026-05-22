// Page publique d'un groupe — /g/[code]
// Phase 3 réseau social (mai 2026).
//
// Server component pour SEO + perf. Affiche :
//   - Nom + description + owner du groupe
//   - Code invite (copy si membre)
//   - Liste des membres (avec leur pseudo si profile public)
//   - Bouton Rejoindre (si pas membre) / Quitter (si membre pas owner)
//
// Privacy : tous les groupes sont visibles via URL si on a le code.
// Les pseudos des membres ne sont affichés que si leur profil est public.

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import GroupActions from './GroupActions'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  // Service_role pour SELECT — les RLS sur groups limitent à "membres only",
  // mais on veut que tout le monde puisse VOIR le groupe via son code (idem Discord invite).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function generateMetadata({ params }) {
  const supabase = getAdminClient()
  if (!supabase) return { title: 'Groupe' }
  const { data: g } = await supabase
    .from('groups')
    .select('name, description')
    .eq('invite_code', String(params.code).toUpperCase())
    .maybeSingle()
  if (!g) return { title: 'Groupe introuvable', robots: { index: false } }
  return {
    title: `${g.name} · Groupe Quantara`,
    description: g.description || `Rejoins le groupe "${g.name}" sur Quantara.`,
    robots: { index: false, follow: false }, // groupes privés par défaut
  }
}

function fmtMonth(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  } catch { return '' }
}

export default async function GroupPage({ params }) {
  const code = String(params.code).toUpperCase()
  const supabase = getAdminClient()
  if (!supabase) notFound()

  // 1) Fetch le groupe via le code
  const { data: group } = await supabase
    .from('groups')
    .select('id, name, description, invite_code, members_count, max_members, owner_id, created_at')
    .eq('invite_code', code)
    .maybeSingle()
  if (!group) notFound()

  // 2) Fetch les membres + leurs profiles
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, role, joined_at')
    .eq('group_id', group.id)
    .order('joined_at', { ascending: true })

  const memberIds = (members || []).map(m => m.user_id)
  let profiles = []
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, is_public, verified')
      .in('user_id', memberIds)
    profiles = data || []
  }
  const profileById = new Map(profiles.map(p => [p.user_id, p]))

  // 3) Owner = profile de owner_id
  const ownerProfile = profileById.get(group.owner_id)
  const ownerDisplay = ownerProfile?.is_public ? `@${ownerProfile.username}` : 'un trader'

  // 4) Liste enrichie pour rendu
  const enrichedMembers = (members || []).map(m => ({
    ...m,
    profile: profileById.get(m.user_id) || null,
  }))

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0f14', color: '#f0ede8',
      padding: '0 0 60px', fontFamily: 'inherit',
    }}>
      {/* Top bar */}
      <header style={headerStyle}>
        <Link href="/" style={brandStyle}>QUANTARA</Link>
        <Link href="/app/groups" style={backStyle}>← Mes groupes</Link>
      </header>

      {/* Banner gradient */}
      <div style={{
        height: 120,
        background: 'linear-gradient(135deg, rgba(45,111,255,0.20), rgba(167,139,250,0.10) 60%, transparent)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }} />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
        {/* Group header */}
        <div style={{ marginTop: -40, display: 'flex', alignItems: 'flex-end', gap: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 14,
            background: 'linear-gradient(135deg, #2d6fff, #4d8fff)',
            border: '4px solid #0d0f14',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, color: '#fff',
            flexShrink: 0,
          }}>
            {group.name?.[0]?.toUpperCase() || 'G'}
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <h1 style={{
              fontSize: 22, fontWeight: 700, margin: 0,
              letterSpacing: '-0.01em',
            }}>{group.name}</h1>
            <div style={{ fontSize: 12, color: '#9098b0', marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>{group.members_count || 0}/{group.max_members || 50} membres</span>
              <span>· Créé par {ownerDisplay}</span>
              <span>· {fmtMonth(group.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {group.description && (
          <p style={{
            fontSize: 14, color: '#9098b0', lineHeight: 1.6,
            marginTop: 18, marginBottom: 0,
          }}>{group.description}</p>
        )}

        {/* Invite code + actions (client component) */}
        <div style={{ marginTop: 24 }}>
          <GroupActions
            groupId={group.id}
            inviteCode={group.invite_code}
            ownerId={group.owner_id}
            members={enrichedMembers}
          />
        </div>

        {/* Members list */}
        <section style={{ marginTop: 36 }}>
          <h2 style={sectionHeaderStyle}>Membres ({enrichedMembers.length})</h2>
          {enrichedMembers.length === 0 ? (
            <EmptyState message="Aucun membre pour l'instant." />
          ) : (
            <MemberList items={enrichedMembers} ownerId={group.owner_id} />
          )}
        </section>

        {/* Placeholder phases suivantes */}
        <div style={{
          marginTop: 48, padding: 20,
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.10)',
          borderRadius: 12, textAlign: 'center',
          fontSize: 12, color: '#565e78',
        }}>
          🚧 Bientôt : cumul des payouts du groupe, leaderboard, chat de groupe.
          <br />
          Phase 3/6 du réseau social Quantara.
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: 60, paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          fontSize: 11, color: '#565e78', textAlign: 'center',
        }}>
          <Link href="/" style={{ color: '#9098b0', textDecoration: 'none' }}>Quantara</Link>
          {' · '}
          <Link href="/app/groups" style={{ color: '#9098b0', textDecoration: 'none' }}>Mes groupes</Link>
        </footer>
      </main>
    </div>
  )
}

// === Sub-components ===
function MemberList({ items, ownerId }) {
  return (
    <div style={{
      background: '#141720', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {items.map((m, i) => {
        const p = m.profile
        const isPublic = p && p.is_public && p.username
        const name = (p?.display_name || p?.username) || 'Trader privé'
        const subName = isPublic ? `@${p.username}` : 'Profil privé'
        const isOwner = m.user_id === ownerId

        const row = (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 18px',
            borderTop: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            cursor: isPublic ? 'pointer' : 'default',
            transition: 'background 0.1s',
          }}>
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14, fontWeight: 600, color: '#f0ede8',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                {isOwner && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                    background: 'rgba(250,199,117,0.15)', color: '#fac775', letterSpacing: '0.05em',
                  }}>OWNER</span>
                )}
                {p?.verified && (
                  <span title="Profil vérifié" style={{
                    fontSize: 9, color: '#4d8fff',
                    background: 'rgba(45,111,255,0.15)',
                    borderRadius: '50%', width: 14, height: 14,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>✓</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#565e78', fontFamily: 'monospace' }}>{subName}</div>
            </div>
          </div>
        )

        return isPublic ? (
          <Link key={m.user_id} href={`/u/${p.username}`} style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
            {row}
          </Link>
        ) : (
          <div key={m.user_id}>{row}</div>
        )
      })}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div style={{
      padding: 40, textAlign: 'center',
      background: '#141720', border: '1px dashed rgba(255,255,255,0.10)',
      borderRadius: 12, color: '#565e78', fontSize: 13,
    }}>{message}</div>
  )
}

// === Styles ===
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
const sectionHeaderStyle = {
  fontSize: 11, fontWeight: 700, color: '#4d8fff',
  letterSpacing: '0.14em', textTransform: 'uppercase',
  margin: '0 0 14px', padding: 0,
}
