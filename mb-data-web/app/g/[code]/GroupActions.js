'use client'
// GroupActions — sous-composant client pour les actions interactives sur la page /g/[code].
// (Le parent page.js est un server component, donc on isole le client ici.)
//
// 3 états :
//   - Non connecté : "Se connecter pour rejoindre" → /app
//   - Connecté pas membre : "Rejoindre le groupe" (POST /api/groups/join)
//   - Connecté membre : "Code: ABCD12 [Copier]" + bouton "Quitter" (sauf owner)

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

const C = {
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
  green: 'var(--green)',
  red: 'var(--red)',
  border: 'var(--border2)',
}

export default function GroupActions({ groupId, inviteCode, ownerId, members }) {
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null)
      setLoading(false)
    })
  }, [])

  // Helpers
  const isMember = members.some(m => m.user_id === currentUserId)
  const isOwner = currentUserId === ownerId
  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/g/${inviteCode}`
    : `https://quantara.tech/g/${inviteCode}`

  async function handleJoin() {
    setActing(true)
    setError(''); setSuccess('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code: inviteCode }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setSuccess('Tu fais maintenant partie du groupe ✓')
      // Reload page pour afficher comme membre
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setActing(false)
    }
  }

  async function handleLeave() {
    if (!confirm('Quitter ce groupe ? Tu ne pourras revenir qu\'avec le code.')) return
    setActing(true)
    setError(''); setSuccess('')
    try {
      const { error: delErr } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUserId)
      if (delErr) throw delErr
      setSuccess('Tu as quitté le groupe.')
      setTimeout(() => { window.location.href = '/app/groups' }, 800)
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setActing(false)
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  if (loading) {
    return <div style={{ fontSize: 13, color: C.text3 }}>⏳</div>
  }

  // === Cas 1 : Non connecté ===
  if (!currentUserId) {
    return (
      <div style={containerStyle}>
        <a href={`/app?intent=join&code=${inviteCode}`} style={primaryBtnStyle()}>
          Se connecter pour rejoindre
        </a>
      </div>
    )
  }

  // === Cas 2 : Pas membre ===
  if (!isMember) {
    return (
      <div style={containerStyle}>
        <button onClick={handleJoin} disabled={acting} style={primaryBtnStyle(acting)}>
          {acting ? '⏳ Rejoindre…' : 'Rejoindre le groupe'}
        </button>
        {error && <ErrorMsg msg={error} />}
        {success && <SuccessMsg msg={success} />}
      </div>
    )
  }

  // === Cas 3 : Membre ===
  return (
    <div style={containerStyle}>
      {/* Code invite + copy */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '10px 14px',
        background: 'rgba(45,111,255,0.06)',
        border: `1px solid rgba(45,111,255,0.2)`,
        borderRadius: 8,
      }}>
        <span style={{ fontSize: 11, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
          Code invite :
        </span>
        <strong style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 16,
          color: C.blueLight, letterSpacing: '0.18em',
        }}>{inviteCode}</strong>
        <button onClick={handleCopyCode} style={smallBtnStyle()}>
          {copied ? '✓ Copié' : '📋 Copier le lien'}
        </button>
      </div>

      {/* Bouton Quitter (sauf owner) */}
      {!isOwner && (
        <button onClick={handleLeave} disabled={acting} style={dangerBtnStyle(acting)}>
          {acting ? '⏳' : 'Quitter le groupe'}
        </button>
      )}

      {isOwner && (
        <p style={{ fontSize: 11, color: C.text3, margin: 0 }}>
          🏆 Tu es l'owner — partage le code pour inviter d'autres traders.
        </p>
      )}

      {error && <ErrorMsg msg={error} />}
      {success && <SuccessMsg msg={success} />}
    </div>
  )
}

// === Helpers ===
function ErrorMsg({ msg }) {
  return (
    <div style={{
      padding: '8px 12px', fontSize: 12, color: C.red,
      background: 'rgba(239,68,68,0.08)', border: `1px solid ${C.red}`,
      borderRadius: 6,
    }}>{msg}</div>
  )
}
function SuccessMsg({ msg }) {
  return (
    <div style={{
      padding: '8px 12px', fontSize: 12, color: C.green,
      background: 'rgba(16,185,129,0.08)', border: `1px solid ${C.green}`,
      borderRadius: 6,
    }}>{msg}</div>
  )
}

const containerStyle = {
  display: 'flex', flexDirection: 'column', gap: 10,
  alignItems: 'flex-start',
}
const primaryBtnStyle = (loading) => ({
  padding: '10px 22px', fontSize: 13, fontWeight: 600,
  background: C.blue, color: '#fff',
  border: 'none', borderRadius: 99,
  cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
  fontFamily: 'inherit', textDecoration: 'none',
  display: 'inline-flex', alignItems: 'center',
})
const dangerBtnStyle = (loading) => ({
  padding: '8px 16px', fontSize: 12, fontWeight: 600,
  background: 'transparent', color: C.text3,
  border: `1px solid ${C.border}`, borderRadius: 99,
  cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
  fontFamily: 'inherit',
})
const smallBtnStyle = () => ({
  padding: '4px 10px', fontSize: 11, fontWeight: 600,
  background: 'transparent', color: C.blueLight,
  border: `1px solid ${C.blueLight}`, borderRadius: 6,
  cursor: 'pointer', fontFamily: 'inherit',
})
