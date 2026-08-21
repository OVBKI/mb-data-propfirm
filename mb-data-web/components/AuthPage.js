'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase, setSessionPersistence } from '../lib/supabase'
import QLogoIcon from './QLogoIcon'
import { useT } from './LanguageProvider'

// Site key publique Turnstile — exposée côté client (pas un secret)
// La secret key correspondante est configurée dans Supabase Auth → CAPTCHA Protection
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

// Regex pour valider un pseudo : 3-20 chars, lettres/chiffres/_/-
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/
// Détection naïve email (présence d'un @ avec qqch avant/après)
const EMAIL_REGEX = /@/

export default function AuthPage({ onAuth, initialMode }) {
  const t = useT()
  const [mode, setMode]       = useState(initialMode || 'login') // login | register
  // En mode login : peut contenir un email OU un pseudo
  // En mode register : email uniquement
  const [emailOrUsername, setEmailOrUsername] = useState('')
  // Pseudo (uniquement en signup, optionnel)
  const [username, setUsername] = useState('')
  const [usernameCheck, setUsernameCheck] = useState(null) // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [password, setPass]   = useState('')
  const [stayLogged, setStayLogged] = useState(true) // ✅ par défaut coché
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  // Vérifie en live la disponibilité du pseudo (debounce 500ms)
  useEffect(() => {
    if (mode !== 'register' || !username) {
      setUsernameCheck(null)
      return
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameCheck('invalid')
      return
    }
    setUsernameCheck('checking')
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('username_available', { p_username: username })
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
  }, [username, mode])
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

  async function handleGoogle() {
    setError(''); setSuccess('')
    try {
      // Persist the "stay logged in" preference before kicking off OAuth so it
      // survives the redirect back from Google.
      setSessionPersistence(stayLogged)
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : 'https://quantara.tech/auth/callback'
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) throw error
      // Browser is redirected by Supabase — no further action needed.
    } catch (err) {
      console.warn('[google oauth]', err)
      setError(t('app.auth.oauthError'))
    }
  }

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
        // 🪪 Résolution pseudo → email si l'input ne contient pas '@'
        let loginEmail = emailOrUsername.trim()
        if (!EMAIL_REGEX.test(loginEmail)) {
          // C'est un pseudo : on le résout via /api/auth/resolve-username
          // (route serveur rate-limitée, mai 2026 — audit Agent #1)
          // Avant : RPC direct ouvert à `anon` → vector énumération username→email.
          const res = await fetch('/api/auth/resolve-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: loginEmail }),
          })
          if (res.status === 429) {
            throw new Error('Trop de tentatives. Réessaye dans une minute.')
          }
          const json = await res.json().catch(() => ({}))
          if (!res.ok) {
            throw new Error('Erreur lors de la résolution du pseudo : ' + (json.error || res.statusText))
          }
          if (!json.email) throw new Error(`Aucun compte trouvé avec le pseudo « ${loginEmail} ».`)
          loginEmail = json.email
        }

        const opts = {}
        if (captchaToken) opts.captchaToken = captchaToken
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail, password,
          options: Object.keys(opts).length ? opts : undefined,
        })
        if (error) throw error
        onAuth(data.user)
      } else {
        // === SIGNUP ===
        const signupEmail = emailOrUsername.trim()
        if (!EMAIL_REGEX.test(signupEmail)) {
          throw new Error('Renseigne ton email pour créer un compte (pas un pseudo).')
        }
        // Si pseudo renseigné : vérifie le format et la dispo avant le signup
        const trimmedUsername = username.trim()
        if (trimmedUsername) {
          if (!USERNAME_REGEX.test(trimmedUsername)) {
            throw new Error('Pseudo invalide : 3-20 caractères, lettres/chiffres/_/- uniquement.')
          }
          if (usernameCheck === 'taken') {
            throw new Error(`Le pseudo « ${trimmedUsername} » est déjà pris.`)
          }
          if (usernameCheck === 'checking') {
            throw new Error('Vérification du pseudo en cours, réessaie dans une seconde.')
          }
        }

        // Lors de l'inscription : redirige vers /auth/callback après confirmation email
        const redirectTo = typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : 'https://quantara.tech/auth/callback'
        const { data, error } = await supabase.auth.signUp({
          email: signupEmail, password,
          options: {
            emailRedirectTo: redirectTo,
            captchaToken: captchaToken || undefined,
            // Le pseudo est passé via metadata, on l'écrira dans la table profiles
            // une fois que l'user est authentifié (post-confirmation email)
            data: trimmedUsername ? { pending_username: trimmedUsername } : undefined,
          },
        })
        if (error) throw error

        // Si l'user est immédiatement signé (email confirmation désactivée),
        // on écrit le pseudo dans la table profiles tout de suite.
        if (data.user && data.session && trimmedUsername) {
          const { error: profErr } = await supabase
            .from('profiles')
            .update({ username: trimmedUsername })
            .eq('user_id', data.user.id)
          if (profErr) console.warn('[profile update]', profErr)
        }

        if (data.user && !data.user.email_confirmed_at) {
          setSuccess(`📧 Compte créé ! Un email de confirmation a été envoyé à ${signupEmail}. Vérifie ta boîte de réception (et tes spams) pour activer ton compte.${trimmedUsername ? ` Ton pseudo « ${trimmedUsername} » sera activé après confirmation.` : ''}`)
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
      position: 'relative', overflow: 'hidden', width: '100%', maxWidth: '100vw',
    }}>
      {/* Halo cosmic en arrière-plan — rappelle l'identité landing.
          Taille bornée à 60vmax (max 600px sur mobile) pour éviter tout
          débordement horizontal sur iPhone SE et autres petits viewports. */}
      <div style={{
        position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
        width: 'min(900px, 60vmax)', height: 'min(900px, 60vmax)',
        background: 'radial-gradient(circle, var(--blue-bg) 0%, var(--blue-bg) 30%, transparent 65%)',
        pointerEvents: 'none', filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '440px',
        background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--border)',
        borderRadius: '14px', padding: '40px 36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 40px var(--blue-bg)',
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
          display: 'flex', background: 'var(--tint1)',
          border: '1px solid var(--border)',
          borderRadius: '8px', padding: '4px', marginBottom: '26px',
        }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); setCaptchaToken('') }}
              style={{
                flex: 1, padding: '9px', fontSize: '13px', fontWeight: mode===m?'600':'500',
                borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: mode === m ? 'var(--blue-bg)' : 'transparent',
                color: mode === m ? 'var(--blue-light)' : 'var(--text2)',
                transition: 'all 0.15s', fontFamily: 'inherit',
              }}>
              {m === 'login' ? t('app.auth.login') : t('app.auth.register')}
            </button>
          ))}
        </div>

        {/* Google OAuth — primary CTA, above the email/password form */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          aria-label={mode === 'login' ? t('app.auth.googleLogin') : t('app.auth.googleRegister')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '11px 12px',
            marginBottom: 14,
            background: '#fff',
            color: '#1f2937',
            border: '1px solid var(--hairline2)',
            borderRadius: 'var(--radius)',
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'background 0.15s, transform 0.15s',
          }}
          onMouseEnter={ev => { if (!loading) ev.currentTarget.style.background = '#f5f5f5' }}
          onMouseLeave={ev => { ev.currentTarget.style.background = '#fff' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.708A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.708V4.96H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.04l3.007-2.332z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.29C4.672 5.164 6.656 3.58 9 3.58z" />
          </svg>
          <span>{mode === 'login' ? t('app.auth.googleLogin') : t('app.auth.googleRegister')}</span>
        </button>

        {/* Visual divider between OAuth and email/password */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 14px' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
          <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('app.auth.orDivider')}</span>
          <span style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
        </div>

        <form onSubmit={handleSubmit} autoComplete="on">
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
              {mode === 'login' ? t('app.auth.emailOrUsername') : t('app.auth.email')}
            </label>
            <input
              type={mode === 'login' ? 'text' : 'email'}
              value={emailOrUsername} onChange={e => setEmailOrUsername(e.target.value)} required
              autoComplete={mode === 'login' ? 'username' : 'email'}
              placeholder={mode === 'login' ? t('app.auth.placeholderEmailOrUsername') : t('app.auth.placeholderEmail')}
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
          </div>

          {/* PSEUDO — uniquement en signup, optionnel */}
          {mode === 'register' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                {t('app.auth.username')} <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text3)', fontWeight: 400 }}>{t('app.auth.usernameOptional')}</span>
              </label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                autoComplete="off" maxLength={20}
                placeholder={t('app.auth.placeholderUsername')}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: '14px',
                  background: 'var(--surface2)',
                  border: `0.5px solid ${
                    usernameCheck === 'taken' || usernameCheck === 'invalid' ? 'var(--red)' :
                    usernameCheck === 'available' ? 'var(--green)' :
                    'var(--border2)'
                  }`,
                  borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
                }} />
              <div style={{ fontSize: '10px', marginTop: '4px', minHeight: '14px', color: 'var(--text3)' }}>
                {!username && t('app.auth.usernameHint')}
                {username && usernameCheck === 'invalid' && <span style={{ color: 'var(--red-text)' }}>{t('app.auth.usernameInvalid')}</span>}
                {username && usernameCheck === 'checking' && <span style={{ color: 'var(--text3)' }}>{t('app.auth.usernameChecking')}</span>}
                {username && usernameCheck === 'available' && <span style={{ color: 'var(--green-text)' }}>{t('app.auth.usernameAvailable')}</span>}
                {username && usernameCheck === 'taken' && <span style={{ color: 'var(--red-text)' }}>{t('app.auth.usernameTaken')}</span>}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
              {t('app.auth.password')}
            </label>
            <input type="password" value={password} onChange={e => setPass(e.target.value)} required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={t('app.auth.placeholderPassword')} minLength={8}
              style={{ width: '100%', padding: '10px 12px', fontSize: '14px', background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }} />
            {mode === 'register' && (
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px' }}>
                {t('app.auth.passwordHint')}
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
            <label htmlFor="website_url">{t('app.auth.hiddenLabel')}</label>
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
              {t('app.auth.stayLogged')}
              <span style={{ fontSize: '10px', color: 'var(--text3)', marginLeft: 'auto' }}>
                {stayLogged ? t('app.auth.sessionKept') : t('app.auth.sessionTemp')}
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
                {t('app.auth.captchaMissing')}
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
              background: loading ? 'var(--tint2)' : 'var(--text)',
              color: loading ? 'var(--text3)' : 'var(--text-inverse)',
              border: '1px solid transparent', borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s', fontFamily: 'inherit',
              boxShadow: loading ? 'none' : '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)',
              letterSpacing: '0.005em',
            }}>
            {loading ? t('app.auth.loading') : mode === 'login' ? t('app.auth.submitLogin') : t('app.auth.submitRegister')}
          </button>
        </form>

        {/* Mot de passe oublié — uniquement en mode login */}
        {mode === 'login' && (
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={async () => {
                setError(''); setSuccess('')
                const val = emailOrUsername.trim()
                if (!val) {
                  setError(t('app.auth.forgotEnterEmail'))
                  return
                }
                if (!val.includes('@')) {
                  setError(t('app.auth.forgotNeedEmail'))
                  return
                }
                if (TURNSTILE_SITE_KEY && !captchaToken) {
                  setError(t('app.auth.forgotCaptchaWait'))
                  return
                }
                const redirectTo = `${window.location.origin}/auth/callback`
                const { error } = await supabase.auth.resetPasswordForEmail(val, {
                  redirectTo,
                  captchaToken: captchaToken || undefined,
                })
                // Reset captcha pour qu'il soit ré-utilisable (1 token = 1 usage)
                if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
                  window.turnstile.reset(widgetIdRef.current)
                  setCaptchaToken('')
                }
                if (error) setError(error.message)
                else setSuccess(t('app.auth.forgotSuccess').replace('{email}', val))
              }}
              style={{
                background: 'none', border: 'none', color: 'var(--text3)',
                fontSize: '11px', cursor: 'pointer', textDecoration: 'underline',
                fontFamily: 'inherit',
              }}
            >{t('app.auth.forgotPassword')}</button>
          </div>
        )}

        <div style={{ marginTop: '20px', fontSize: '11px', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
          {t('app.auth.secureLine')}<br />
          {mode === 'register' && (
            <>
              {t('app.auth.acceptPrefix')}{' '}
              <a href="/legal/cgu" style={{ color: 'var(--blue-light)', textDecoration: 'none' }}>{t('app.auth.acceptCgu')}</a>
              {' '}{t('app.auth.acceptAnd')}{' '}
              <a href="/legal/privacy" style={{ color: 'var(--blue-light)', textDecoration: 'none' }}>{t('app.auth.acceptPrivacy')}</a>.
            </>
          )}
        </div>
      </div>
    </div>
  )
}
