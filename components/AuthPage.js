'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPage({ onAuth }) {
  const [mode, setMode]       = useState('login') // login | register
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onAuth(data.user)
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user && !data.user.email_confirmed_at) {
          setSuccess('Compte créé ! Vérifiez votre email pour confirmer.')
        } else {
          onAuth(data.user)
        }
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: '20px'
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--surface)', border: '0.5px solid var(--border2)',
        borderRadius: 'var(--radius-lg)', padding: '36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            fontSize: '22px', fontWeight: '700', letterSpacing: '0.5px',
            marginBottom: '6px'
          }}>MB Data</div>
          <div style={{ fontSize: '13px', color: 'var(--text3)' }}>PropFirm Journal</div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'var(--surface2)',
          borderRadius: '8px', padding: '4px', marginBottom: '24px'
        }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
              style={{
                flex: 1, padding: '8px', fontSize: '13px', fontWeight: '500',
                borderRadius: '6px', border: 'none',
                background: mode === m ? 'var(--blue)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text2)',
                transition: 'all 0.15s'
              }}>
              {m === 'login' ? 'Connexion' : 'Créer un compte'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="votre@email.com"
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
              Mot de passe
            </label>
            <input type="password" value={password} onChange={e => setPass(e.target.value)} required
              placeholder="••••••••" minLength={6}
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none' }} />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--red-bg)', border: '0.5px solid var(--red)', borderRadius: 'var(--radius)', fontSize: '13px', color: 'var(--red-text)', marginBottom: '16px' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '10px 14px', background: 'var(--green-bg)', border: '0.5px solid var(--green)', borderRadius: 'var(--radius)', fontSize: '13px', color: 'var(--green-text)', marginBottom: '16px' }}>
              {success}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', fontSize: '14px', fontWeight: '600',
              background: loading ? 'var(--surface3)' : 'var(--blue)',
              color: loading ? 'var(--text3)' : '#fff',
              border: 'none', borderRadius: 'var(--radius)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s'
            }}>
            {loading ? '⏳ Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '11px', color: 'var(--text3)', textAlign: 'center' }}>
          Vos données sont sécurisées et accessibles uniquement par vous.
        </div>
      </div>
    </div>
  )
}
