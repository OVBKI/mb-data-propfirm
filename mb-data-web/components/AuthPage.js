'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase, setSessionPersistence } from '../lib/supabase'
import Logo from './Logo'

// Site key publique Turnstile — exposée côté client (pas un secret)
// La secret key correspondante est configurée dans Supabase Auth → CAPTCHA Protection
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export default function AuthPage({ onAuth }) {
  const [mode, setMode]       = useState('login') // login | register
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [stayLogged, setStayLogged] = useState(true) // ✅ par défaut coché
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  // Anti-bot
  const [honeypot, setHoneypot] = useState('') // ne doit JAMAIS être rempli (invisible)
  const [captchaToken, setCaptchaToken] = useState('')
  const turnstileRef = useRef(null)
  const widgetIdRef = useRef(null)

  // Initialise Turnstile une seule fois (script chargé via layout)
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || mode !== 'register') return
    function tryRender() {
      if (typeof window === 'undefined' || !window.turnstile || !turnstileRef.current) return false
      // Reset si déjà rendu
      if (widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current)
        return true
      }
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'dark',
        size: 'flexible',
        callback: (token) => setCaptchaToken(token),
        'error-callback': () => setCaptchaToken(''),
        'expired-callback': () => setCaptchaToken(''),
      })
      return true
    }
    // Si script pas encore chargé, on attend max 5s
    if (!tryRender()) {
      const interval = setInterval(() => { if (tryRender()) clearInterval(interval) }, 200)
      const timeout = setTimeout(() => clearInterval(interval), 5000)
      return () => { clearInterval(interval); clearTimeout(timeout) }
    }
  }, [mode])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')

    // 🛡️ Anti-bot 1 : honeypot. Un humain ne le voit pas, un bot le remplit.
    if (honeypot) {
      // On simule un succès silencieux pour pas révéler qu'on a détecté le bot
      setSuccess('Compte créé ! Vérifiez votre email pour confirmer.')
      return
    }

    // 🛡️ Anti-bot 2 : Turnstile (uniquement à l'inscription)
    if (mode === 'register' && TURNSTILE_SITE_KEY && !captchaToken) {
      setError('Merci de valider le captcha avant de continuer.')
      return
    }

    setLoading(true)
    try {
      // 🔐 Préférence "Rester connecté" — appliquée AVANT le signin
      setSessionPersistence(stayLogged)

      if (mode === 'login') {
        const opts = {}
        if (captchaToken) opts.captchaToken = captchaToken
        const { data, error } = await supabase.auth.signInWithPassword({
          email, password,
          options: Object.keys(opts).length ? opts : undefined,
        })
        if (error) throw error
        onAuth(data.user)
      } else {
        // Lors de l'inscription : redirige vers /auth/callback après confirmation email
        const redirectTo = typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : 'https://quantara.tech/auth/callback'
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: redirectTo,
            captchaToken: captchaToken || undefined,
          },
        })
        if (error) throw error
        if (data.user && !data.user.email_confirmed_at) {
          setSuccess(`📧 Compte créé ! Un email de confirmation a été envoyé à ${email}. Vérifie ta boîte de réception (et tes spams) pour activer ton compte.`)
          // Reset Turnstile pour qu'on puisse re-soumettre si besoin
          if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
            window.turnstile.reset(widgetIdRef.current)
            setCaptchaToken('')
          }
        } else {
          onAuth(data.user)
        }
      }
    } catch (err) {
      // Reset captcha sur erreur (un token Turnstile = usage unique)
      if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current)
        setCaptchaToken('')
      }
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
        width: '100%', maxWidth: '420px',
        background: 'var(--surface)', border: '0.5px solid var(--border2)',
        borderRadius: 'var(--radius-lg)', padding: '36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Logo size={56} glow="strong" />
          <div style={{
            fontSize: '22px', fontWeight: '700', letterSpacing: '0.15em',
          }}>QUANTARA</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', letterSpacing: '0.1em' }}>TRACK · ANALYZE · GROW</div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'var(--surface2)',
          borderRadius: '8px', padding: '4px', marginBottom: '24px'
        }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); setCaptchaToken('') }}
              style={{
                flex: 1, padding: '8px', fontSize: '13px', fontWeight: '500',
                borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: mode === m ? 'var(--blue)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text2)',
                transition: 'all 0.15s',
              }}>
              {m === 'login' ? 'Connexion' : 'Créer un compte'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} autoComplete="on">
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              autoComplete={mode === 'login' ? 'username' : 'email'}
              placeholder="votre@email.com"
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
              Mot de passe
            </label>
            <input type="password" value={password} onChange={e => setPass(e.target.value)} required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="••••••••" minLength={8}
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
            {mode === 'register' && (
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
                Min 8 caractères. Utilise une combinaison de lettres, chiffres, symboles.
              </div>
            )}
          </div>

          {/* 🛡️ HONEYPOT — invisible aux humains, les bots le remplissent automatiquement */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', left: '-9999px', top: '-9999px',
              width: '1px', height: '1px', overflow: 'hidden', opacity: 0,
            }}
          >
            <label htmlFor="website_url">Site web (laissez vide)</label>
            <input
              type="text" id="website_url" name="website_url"
              tabIndex="-1" autoComplete="off"
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
            />
          </div>

          {/* ✅ Checkbox "Rester connecté" — uniquement en mode login */}
          {mode === 'login' && (
            <label style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '13px', color: 'var(--text2)', marginBottom: '18px',
              cursor: 'pointer', userSelect: 'none',
            }}>
              <input
                type="checkbox" checked={stayLogged}
                onChange={e => setStayLogged(e.target.checked)}
                style={{
                  width: 16, height: 16, accentColor: 'var(--blue)',
                  cursor: 'pointer', flexShrink: 0,
                }}
              />
              Rester connecté
              <span style={{ fontSize: '10px', color: 'var(--text3)', marginLeft: 'auto' }}>
                {stayLogged ? '✓ Session conservée' : 'Session temporaire'}
              </span>
            </label>
          )}

          {/* 🛡️ Turnstile widget (uniquement en mode register) */}
          {mode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              {TURNSTILE_SITE_KEY ? (
                <div ref={turnstileRef} style={{ minHeight: 65 }} />
              ) : (
                <div style={{
                  padding: '10px 12px', fontSize: '11px', color: 'var(--amber-text)',
                  background: 'var(--amber-bg)', borderRadius: 'var(--radius)',
                }}>
                  ⚠ Captcha non configuré (NEXT_PUBLIC_TURNSTILE_SITE_KEY manquant). L'inscription fonctionne quand même.
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--red-bg)', border: '0.5px solid var(--red)', borderRadius: 'var(--radius)', fontSize: '13px', color: 'var(--red-text)', marginBottom: '16px' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '12px 16px', background: 'var(--green-bg)', border: '0.5px solid var(--green)', borderRadius: 'var(--radius)', fontSize: '13px', color: 'var(--green-text)', marginBottom: '16px', lineHeight: 1.5 }}>
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
              transition: 'all 0.15s', fontFamily: 'inherit',
            }}>
            {loading ? '⏳ Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        {/* Mot de passe oublié — uniquement en mode login */}
        {mode === 'login' && (
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={async () => {
                if (!email) { setError('Saisis ton email d\'abord, puis click "Mot de passe oublié"'); return }
                const redirectTo = `${window.location.origin}/auth/callback`
                const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
                if (error) setError(error.message)
                else setSuccess(`📧 Email de réinitialisation envoyé à ${email}`)
              }}
              style={{
                background: 'none', border: 'none', color: 'var(--text3)',
                fontSize: '11px', cursor: 'pointer', textDecoration: 'underline',
                fontFamily: 'inherit',
              }}
            >Mot de passe oublié ?</button>
          </div>
        )}

        <div style={{ marginTop: '20px', fontSize: '11px', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
          🔒 Vos données sont sécurisées et accessibles uniquement par vous.<br />
          {mode === 'register' && (
            <>
              En créant un compte, vous acceptez nos{' '}
              <a href="/legal/cgu" style={{ color: 'var(--blue-light)', textDecoration: 'none' }}>CGU</a>
              {' '}et notre{' '}
              <a href="/legal/privacy" style={{ color: 'var(--blue-light)', textDecoration: 'none' }}>Politique de confidentialité</a>.
            </>
          )}
        </div>
      </div>
    </div>
  )
}
