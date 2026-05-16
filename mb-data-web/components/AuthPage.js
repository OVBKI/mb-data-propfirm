'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase, setSessionPersistence } from '../lib/supabase'
import QLogoIcon from './QLogoIcon'

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

  // Initialise Turnstile (script chargé via layout, attend qu'il soit prêt)
  // Rendu dans LES DEUX modes (login + register) car Supabase exige un captcha
  // pour toutes les requêtes auth quand CAPTCHA Protection est activé.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    // Reset le token quand on switch de mode (le widget se re-render)
    setCaptchaToken('')
    if (widgetIdRef.current && typeof window !== 'undefined' && window.turnstile) {
      try { window.turnstile.remove(widgetIdRef.current) } catch {}
      widgetIdRef.current = null
    }
    let cancelled = false
    let interval
    let timeout
    function tryRender() {
      if (cancelled || typeof window === 'undefined') return false
      if (!window.turnstile) return false
      if (!turnstileRef.current) return false
      // Reset si déjà rendu (cas re-rendu React)
      if (widgetIdRef.current) {
        try { window.turnstile.reset(widgetIdRef.current) } catch {}
        return true
      }
      try {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          size: 'flexible',
          callback: (token) => setCaptchaToken(token),
          'error-callback': (err) => {
            console.warn('[Turnstile] error:', err)
            setCaptchaToken('')
          },
          'expired-callback': () => setCaptchaToken(''),
        })
        return true
      } catch (err) {
        console.warn('[Turnstile] render failed:', err)
        return false
      }
    }
    // Essai immédiat puis polling toutes les 150ms pendant 15s
    if (!tryRender()) {
      interval = setInterval(() => { if (tryRender()) clearInterval(interval) }, 150)
      timeout = setTimeout(() => {
        clearInterval(interval)
        if (!widgetIdRef.current) {
          console.warn('[Turnstile] script not loaded after 15s — vérifie que le script Cloudflare se charge dans le navigateur (DevTools → Network).')
        }
      }, 15000)
    }
    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
      if (timeout) clearTimeout(timeout)
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

    // 🛡️ Anti-bot 2 : Turnstile (login ET signup, requis par Supabase)
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError('Merci d\'attendre la validation du captcha avant de continuer (quelques secondes).')
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
      justifyContent: 'center', background: 'var(--bg)', padding: '20px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Halo cosmic en arrière-plan — rappelle l'identité landing */}
      <div style={{
        position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
        width: '900px', height: '900px',
        background: 'radial-gradient(circle, rgba(45,111,255,0.15) 0%, rgba(45,111,255,0.06) 30%, transparent 65%)',
        pointerEvents: 'none', filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '440px',
        background: 'rgba(20,23,32,0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px', padding: '40px 36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 40px rgba(45,111,255,0.08)',
      }}>
        {/* Logo SVG Q + wordmark texte */}
        <div style={{ textAlign: 'center', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <QLogoIcon size={100} color="gradient" />
          <div style={{
            fontSize: '20px', fontWeight: '700', letterSpacing: '0.15em',
          }}>QUANTARA</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.16em' }}>TRACK · ANALYZE · GROW</div>
        </div>

        {/* Tabs — segmented control raffiné */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '8px', padding: '4px', marginBottom: '26px',
        }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); setCaptchaToken('') }}
              style={{
                flex: 1, padding: '9px', fontSize: '13px', fontWeight: mode===m?'600':'500',
                borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: mode === m ? 'rgba(45,111,255,0.15)' : 'transparent',
                color: mode === m ? 'var(--blue-light)' : 'var(--text2)',
                transition: 'all 0.15s', fontFamily: 'inherit',
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

          {/* 🛡️ Turnstile widget — affiché en login ET register (Supabase exige captcha pour toutes les auth) */}
          <div style={{ marginBottom: '16px' }}>
            {TURNSTILE_SITE_KEY ? (
              <div ref={turnstileRef} style={{ minHeight: 65 }} />
            ) : (
              <div style={{
                padding: '10px 12px', fontSize: '11px', color: 'var(--amber-text)',
                background: 'var(--amber-bg)', borderRadius: 'var(--radius)',
              }}>
                ⚠ Captcha non configuré (NEXT_PUBLIC_TURNSTILE_SITE_KEY manquant).
              </div>
            )}
          </div>

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
              width: '100%', padding: '13px', fontSize: '14px', fontWeight: '500',
              background: loading ? 'rgba(255,255,255,0.05)' : 'var(--text)',
              color: loading ? 'var(--text3)' : '#0a0c10',
              border: '1px solid transparent', borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s', fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)',
              letterSpacing: '0.005em',
            }}>
            {loading ? '⏳ Chargement...' : mode === 'login' ? 'Se connecter →' : 'Créer mon compte →'}
          </button>
        </form>

        {/* Mot de passe oublié — uniquement en mode login */}
        {mode === 'login' && (
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={async () => {
                setError(''); setSuccess('')
                if (!email) {
                  setError('Saisis ton email d\'abord, puis click "Mot de passe oublié".')
                  return
                }
                if (TURNSTILE_SITE_KEY && !captchaToken) {
                  setError('Attends que le captcha soit validé (✓ Succès) avant de cliquer "Mot de passe oublié".')
                  return
                }
                const redirectTo = `${window.location.origin}/auth/callback`
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo,
                  captchaToken: captchaToken || undefined,
                })
                // Reset captcha pour qu'il soit ré-utilisable (1 token = 1 usage)
                if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
                  window.turnstile.reset(widgetIdRef.current)
                  setCaptchaToken('')
                }
                if (error) setError(error.message)
                else setSuccess(`📧 Email de réinitialisation envoyé à ${email}. Vérifie ta boîte (et tes spams).`)
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
