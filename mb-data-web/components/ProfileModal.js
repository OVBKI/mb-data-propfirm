'use client'
// Modal de profil utilisateur : édite pseudo + display name + bio.
// Le pseudo permet la connexion par username au lieu de l'email.
//
// Props :
//   user       : l'objet user Supabase (pour user.email + user.id)
//   onClose    : callback fermeture
//   onUpdated  : callback après save réussi (parent peut refresh ce qu'il faut)

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/

export default function ProfileModal({ user, onClose, onUpdated }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form fields
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')

  // État initial pour détecter les changements
  const [initialUsername, setInitialUsername] = useState('')
  const [usernameCheck, setUsernameCheck] = useState(null) // null | 'checking' | 'available' | 'taken' | 'invalid' | 'same'

  // === Load profile ===
  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name, bio')
        .eq('user_id', user.id)
        .single()
      if (!mounted) return
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows (le profil n'existe pas encore — le trigger doit le créer)
        console.warn('[profile load]', error)
      }
      const profile = data || {}
      setUsername(profile.username || '')
      setInitialUsername(profile.username || '')
      setDisplayName(profile.display_name || '')
      setBio(profile.bio || '')
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [user.id])

  // === Username availability check (debounce 500ms) ===
  useEffect(() => {
    const trimmed = username.trim()
    if (!trimmed) {
      setUsernameCheck(null)
      return
    }
    if (trimmed.toLowerCase() === initialUsername.toLowerCase()) {
      setUsernameCheck('same') // c'est ton pseudo actuel, OK
      return
    }
    if (!USERNAME_REGEX.test(trimmed)) {
      setUsernameCheck('invalid')
      return
    }
    setUsernameCheck('checking')
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('username_available', { p_username: trimmed })
        if (error) {
          console.warn('[username_available]', error)
          setUsernameCheck(null)
          return
        }
        setUsernameCheck(data ? 'available' : 'taken')
      } catch (err) {
        console.warn('[username_available]', err)
        setUsernameCheck(null)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [username, initialUsername])

  async function handleSave(e) {
    e.preventDefault()
    setError(''); setSuccess('')

    const trimmed = username.trim()
    if (trimmed) {
      if (!USERNAME_REGEX.test(trimmed)) {
        setError('Pseudo invalide : 3-20 caractères, lettres/chiffres/_/- uniquement.')
        return
      }
      if (usernameCheck === 'taken') {
        setError(`Le pseudo « ${trimmed} » est déjà pris par un autre user.`)
        return
      }
      if (usernameCheck === 'checking') {
        setError('Vérification du pseudo en cours, attends une seconde.')
        return
      }
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: trimmed || null,
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
      if (error) throw error
      setSuccess('✓ Profil mis à jour')
      setInitialUsername(trimmed)
      if (onUpdated) onUpdated()
      // Fermeture auto après 1.5s
      setTimeout(() => { if (onClose) onClose() }, 1200)
    } catch (err) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        zIndex: 500, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 460,
          background: 'rgba(20,23,32,0.95)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 14, padding: '28px 28px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          color: 'var(--text)', fontFamily: 'inherit',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 18,
        }}>
          <div>
            <div style={{
              fontSize: 10, color: 'var(--blue-light)',
              letterSpacing: '0.16em', textTransform: 'uppercase',
              fontWeight: 600, marginBottom: 6,
            }}>Profil</div>
            <h2 style={{
              fontSize: 18, fontWeight: 700, margin: 0, lineHeight: 1.2,
            }}>Identité publique</h2>
            <div style={{
              fontSize: 11, color: 'var(--text3)', marginTop: 4,
              fontFamily: 'ui-monospace, monospace',
            }}>{user.email}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text3)',
              fontSize: 18, cursor: 'pointer', padding: 4, lineHeight: 1,
            }}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            ⏳ Chargement du profil...
          </div>
        ) : (
          <form onSubmit={handleSave}>
            {/* PSEUDO */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                Pseudo <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text3)', fontWeight: 400 }}>(optionnel)</span>
              </label>
              <input
                type="text" value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="trader_pro_2026"
                maxLength={20} autoComplete="off"
                style={{
                  ...inputStyle,
                  borderColor:
                    usernameCheck === 'taken' || usernameCheck === 'invalid' ? 'var(--red)' :
                    usernameCheck === 'available' ? 'var(--green)' :
                    'var(--border2)',
                }} />
              <div style={{ fontSize: 10, marginTop: 4, minHeight: 14, color: 'var(--text3)' }}>
                {!username && '3-20 caractères · lettres, chiffres, _ et - · Permettra de te connecter avec ce pseudo au lieu de ton email'}
                {username && usernameCheck === 'invalid' && <span style={{ color: 'var(--red-text)' }}>✗ Format invalide (3-20 chars, lettres/chiffres/_/-)</span>}
                {username && usernameCheck === 'same' && <span style={{ color: 'var(--text3)' }}>✓ Pseudo actuel</span>}
                {username && usernameCheck === 'checking' && <span style={{ color: 'var(--text3)' }}>⋯ Vérification...</span>}
                {username && usernameCheck === 'available' && <span style={{ color: 'var(--green-text)' }}>✓ Pseudo disponible</span>}
                {username && usernameCheck === 'taken' && <span style={{ color: 'var(--red-text)' }}>✗ Pseudo déjà pris</span>}
              </div>
            </div>

            {/* DISPLAY NAME */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                Nom affiché <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text3)', fontWeight: 400 }}>(optionnel)</span>
              </label>
              <input
                type="text" value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Jean Dupont"
                maxLength={50}
                style={inputStyle} />
              <div style={{ fontSize: 10, marginTop: 4, color: 'var(--text3)' }}>
                Affiché à la place de ton pseudo/email sur les pages où c'est plus naturel.
              </div>
            </div>

            {/* BIO */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>
                Bio <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text3)', fontWeight: 400 }}>(optionnel)</span>
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Scalper futures · MNQ/MES · 2 ans d'expérience..."
                maxLength={280} rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 60, fontFamily: 'inherit', lineHeight: 1.5 }} />
              <div style={{ fontSize: 10, marginTop: 4, color: 'var(--text3)', textAlign: 'right' }}>
                {bio.length} / 280
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div style={{
                padding: '10px 14px', background: 'var(--red-bg)',
                border: '0.5px solid var(--red)', borderRadius: 'var(--radius)',
                fontSize: 13, color: 'var(--red-text)', marginBottom: 14,
              }}>{error}</div>
            )}
            {success && (
              <div style={{
                padding: '10px 14px', background: 'var(--green-bg)',
                border: '0.5px solid var(--green)', borderRadius: 'var(--radius)',
                fontSize: 13, color: 'var(--green-text)', marginBottom: 14,
              }}>{success}</div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button" onClick={onClose}
                style={{
                  padding: '9px 16px', fontSize: 13, fontWeight: 500,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'var(--text2)', borderRadius: 8,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>Annuler</button>
              <button
                type="submit" disabled={saving}
                style={{
                  padding: '9px 18px', fontSize: 13, fontWeight: 500,
                  background: 'var(--text)', color: '#0a0c10',
                  border: '1px solid transparent', borderRadius: 8,
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? 0.6 : 1, fontFamily: 'inherit',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
                }}>{saving ? '⏳ Sauvegarde...' : 'Enregistrer'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

const labelStyle = {
  fontSize: 11, fontWeight: 600, color: 'var(--text3)',
  textTransform: 'uppercase', letterSpacing: '0.5px',
  display: 'block', marginBottom: 6,
}
const inputStyle = {
  width: '100%', padding: '10px 12px', fontSize: 14,
  background: 'var(--surface2)',
  border: '0.5px solid var(--border2)',
  borderRadius: 'var(--radius)',
  color: 'var(--text)', outline: 'none',
  fontFamily: 'inherit',
}
