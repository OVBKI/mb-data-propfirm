'use client'
// Page /app/groups — Gestion des groupes (Phase 3 réseau social).
//
// ADMIN-GATED (juin 2026) : la section Communauté est verrouillée pour
// tout le monde sauf les admins (cf. lib/admins.js). Les non-admins qui
// tapent l'URL directement voient un placeholder "Bientôt disponible".
// La sidebar affiche déjà un cadenas pour eux. Quand la feature est
// prête, retirer le guard `if (!userIsAdmin) return <ComingSoon />`.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { useApp } from '../AppContext'
import Skeleton from '../../../../components/Skeleton'
import { isAdmin } from '../../../../lib/admins'

const C = {
  surface: 'var(--surface)', surface2: 'var(--surface2)',
  border: 'var(--border)', border2: 'var(--border2)',
  text: 'var(--text)', text2: 'var(--text2)', text3: 'var(--text3)',
  blue: 'var(--blue)', blueLight: 'var(--blue-light)', green: 'var(--green)', amber: 'var(--amber)', red: 'var(--red)',
}

function CommunityComingSoon() {
  return (
    <div style={{ padding: '60px 24px 80px', maxWidth: 640, margin: '0 auto', textAlign: 'center', color: C.text }}>
      <div style={{ fontSize: 56, marginBottom: 14 }}>{'\u{1F512}'}</div>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, marginBottom: 10, letterSpacing: '-0.02em' }}>
        Communauté — Bientôt disponible
      </h1>
      <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, margin: '0 0 22px' }}>
        Cette section est en cours de construction. On la déverrouille pour tous les utilisateurs dès qu&apos;elle est prête.
        En attendant, profite à fond du tracking, des analytics et de l&apos;import CSV.
      </p>
      <Link href="/app/dashboard" style={{
        display: 'inline-block', padding: '11px 22px',
        background: C.blue, color: 'var(--text-inverse)',
        fontSize: 13, fontWeight: 700,
        borderRadius: 10, textDecoration: 'none',
      }}>← Retour au dashboard</Link>
    </div>
  )
}

export default function GroupsPage() {
  const router = useRouter()
  const { user } = useApp()
  const [groups, setGroups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(true)

  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState('')

  useEffect(() => {
    if (user) loadGroups()
  }, [user])

  async function loadGroups() {
    setLoadingGroups(true)
    const { data: memberships, error } = await supabase
      .from('group_members')
      .select('group_id, role, joined_at, groups(id, name, description, invite_code, members_count, owner_id, created_at)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })
    if (error) {
      console.warn('[loadGroups]', error)
      setGroups([])
    } else {
      const enriched = (memberships || []).filter(m => m.groups).map(m => ({ ...m.groups, role: m.role, joined_at: m.joined_at }))
      setGroups(enriched)
    }
    setLoadingGroups(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreateError('')
    const name = createName.trim()
    if (name.length < 3) { setCreateError('Le nom doit faire au moins 3 caractères.'); return }
    if (name.length > 50) { setCreateError('Nom trop long (50 caractères max).'); return }
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({ name, description: createDesc.trim() || null, owner_id: user.id })
        .select('id, name, invite_code')
        .single()
      if (error) throw error
      setCreateName('')
      setCreateDesc('')
      await loadGroups()
      router.push(`/g/${data.invite_code}`)
    } catch (err) {
      setCreateError(err.message || 'Erreur création')
    } finally {
      setCreating(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    setJoinError('')
    setJoinSuccess('')
    const code = joinCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{6}$/.test(code)) { setJoinError('Code invalide (6 caractères alphanumériques)'); return }
    setJoining(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ code }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setJoinSuccess(json.alreadyMember ? `Tu fais déjà partie de "${json.group_name}".` : `Tu as rejoint "${json.group_name}" ✓`)
      setJoinCode('')
      await loadGroups()
      setTimeout(() => router.push(`/g/${code}`), 800)
    } catch (err) {
      setJoinError(err.message || 'Erreur')
    } finally {
      setJoining(false)
    }
  }

  // Admin gate — placed after all hooks to respect React's Rules of Hooks.
  // Until the Community feature ships, non-admin users get the placeholder
  // even if they hit /app/groups directly by URL.
  if (!isAdmin(user?.email)) return <CommunityComingSoon />

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>Mes groupes</h1>
        <p style={{ fontSize: 13, color: C.text3, marginTop: 6 }}>
          Crée des groupes privés avec d&apos;autres traders, partagez vos cumuls de payouts.
          {' '}<span style={{ color: C.text2 }}>Phase 3/6 du réseau social.</span>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 14, marginBottom: 32 }}>
        <form onSubmit={handleCreate} style={cardStyle}>
          <div style={cardHeaderStyle}><span style={{ fontSize: 18 }}>{'➕'}</span> Créer un groupe</div>
          <input type="text" placeholder="Nom du groupe (ex: Squad NQ Scalp)" value={createName} onChange={e => setCreateName(e.target.value)} maxLength={50} style={inputStyle} required />
          <textarea placeholder="Description (optionnel)" value={createDesc} onChange={e => setCreateDesc(e.target.value)} maxLength={200} rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          {createError && <div style={errorStyle}>{createError}</div>}
          <button type="submit" disabled={creating || !createName.trim()} style={primaryBtnStyle(creating)}>
            {creating ? '⏳ Création…' : 'Créer le groupe →'}
          </button>
        </form>

        <form onSubmit={handleJoin} style={cardStyle}>
          <div style={cardHeaderStyle}><span style={{ fontSize: 18 }}>{'\u{1F511}'}</span> Rejoindre via code</div>
          <input type="text" placeholder="ABCD12" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} style={{ ...inputStyle, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.2em', textAlign: 'center', fontSize: 18 }} required />
          <p style={{ fontSize: 11, color: C.text3, margin: '4px 0' }}>Le code à 6 caractères que ton pote t&apos;a partagé.</p>
          {joinError && <div style={errorStyle}>{joinError}</div>}
          {joinSuccess && <div style={successStyle}>{joinSuccess}</div>}
          <button type="submit" disabled={joining || joinCode.length !== 6} style={primaryBtnStyle(joining)}>
            {joining ? '⏳ Vérification…' : 'Rejoindre →'}
          </button>
        </form>
      </div>

      <div>
        <h2 style={{ fontSize: 11, color: C.text3, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 14, marginTop: 0 }}>
          {loadingGroups ? 'Chargement…' : `${groups.length} groupe${groups.length > 1 ? 's' : ''}`}
        </h2>
        {loadingGroups ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
                <Skeleton width="50%" height={14} style={{ marginBottom: 10 }} />
                <Skeleton width="80%" height={12} style={{ marginBottom: 6 }} />
                <Skeleton width="40%" height={12} />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', background: C.surface, border: `1px dashed ${C.border2}`, borderRadius: 12, color: C.text3, fontSize: 13 }}>
            Tu n&apos;as pas encore de groupe. Crée-en un ou rejoins-en via code.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {groups.map(g => <GroupCard key={g.id} group={g} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function GroupCard({ group }) {
  return (
    <Link href={`/g/${group.invite_code}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.blueLight }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border }}
      >
        <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg, var(--blue), #4d8fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--text-inverse)', flexShrink: 0 }}>
          {group.name?.[0]?.toUpperCase() || 'G'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: C.text }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</span>
            {group.role === 'owner' && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'var(--amber-bg)', color: C.amber, letterSpacing: '0.05em' }}>OWNER</span>}
          </div>
          {group.description && <div style={{ fontSize: 12, color: C.text3, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.description}</div>}
          <div style={{ fontSize: 11, color: C.text3, marginTop: 6, display: 'flex', gap: 12 }}>
            <span>{group.members_count || 1} membre{group.members_count > 1 ? 's' : ''}</span>
            <span style={{ fontFamily: 'monospace', color: C.blueLight }}>{group.invite_code}</span>
          </div>
        </div>
        <span style={{ fontSize: 14, color: C.text3 }}>{'→'}</span>
      </div>
    </Link>
  )
}

const cardStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }
const cardHeaderStyle = { fontSize: 13, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }
const inputStyle = { width: '100%', padding: '10px 12px', fontSize: 14, background: C.surface2, color: C.text, border: `1px solid ${C.border2}`, borderRadius: 8, outline: 'none', fontFamily: 'inherit' }
const primaryBtnStyle = (loading) => ({ padding: '10px 18px', fontSize: 13, fontWeight: 600, background: C.blue, color: 'var(--text-inverse)', border: 'none', borderRadius: 8, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit', alignSelf: 'flex-start' })
const errorStyle = { padding: '8px 12px', fontSize: 12, color: C.red, background: 'rgba(239,68,68,0.08)', border: `1px solid ${C.red}`, borderRadius: 6 }
const successStyle = { padding: '8px 12px', fontSize: 12, color: C.green, background: 'var(--green-bg)', border: `1px solid ${C.green}`, borderRadius: 6 }
