'use client'
// Page d'atterrissage après que l'utilisateur clique sur un lien email Supabase :
//   - Confirmation de signup → success + redirect /app
//   - Reset password → form pour saisir nouveau mot de passe
//   - Lien expiré → option de renvoyer
//   - Erreur autre → message + lien retour
//
// Détection du type via le hash de l'URL (ex: #access_token=...&type=recovery&...)

import { useEffect, useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import QLogoIcon from '../../../components/QLogoIcon'
import { useT } from '../../../components/LanguageProvider'

// Détecte le type d'auth event depuis l'URL hash AU CHARGEMENT
// (avant que Supabase parse et nettoie le hash). Synchrone.
function detectInitialType() {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash || ''
  const search = window.location.search || ''
  const sources = [hash.replace(/^#/, ''), search.replace(/^\?/, '')]
  for (const src of sources) {
    if (!src) continue
    const params = new URLSearchParams(src)
    const t = params.get('type')
    if (t) return t
  }
  return null
}

const C = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
  green: 'var(--green)',
  red: 'var(--red)',
  amber: 'var(--amber)',
}

function CallbackInner() {
  const t = useT()
  // Détection initiale SYNCHRONE du type (avant que Supabase nettoie le hash)
  // Si type=recovery on démarre direct en mode recovery, sans flash de "loading"
  const initialType = typeof window !== 'undefined' ? detectInitialType() : null
  const initialStatus = initialType === 'recovery' ? 'recovery' : 'loading'

  const [status, setStatus] = useState(initialStatus)
  const [errorMsg, setErrorMsg] = useState('')
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendOk, setResendOk] = useState(false)
  // Form recovery
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  // Ref pour bloquer le redirect auto si on est en recovery
  // (évite la race condition où le success path redirigerait avant qu'on switch en recovery)
  const isRecoveryRef = useRef(initialType === 'recovery')

  useEffect(() => {
    let mounted = true

    // Détecte le type d'événement depuis l'URL hash (ex: #type=recovery)
    function getUrlParam(name) {
      if (typeof window === 'undefined') return null
      const hash = window.location.hash
      const search = window.location.search
      // Cherche dans le hash (style Supabase: #access_token=...&type=...)
      if (hash) {
        const params = new URLSearchParams(hash.slice(1))
        const v = params.get(name)
        if (v) return v
      }
      // Cherche dans les query params standards
      if (search) {
        const params = new URLSearchParams(search)
        const v = params.get(name)
        if (v) return v
      }
      return null
    }

    async function process() {
      // Attend que Supabase parse le hash et établisse la session
      await new Promise(r => setTimeout(r, 500))
      if (!mounted) return

      const eventType = detectInitialType() // peut être null si Supabase a déjà nettoyé
      const errorCode = getUrlParam('error_code')
      const errorDesc = getUrlParam('error_description')

      // Erreurs explicites dans l'URL
      if (errorCode === 'otp_expired' || /expired/i.test(errorDesc || '')) {
        setStatus('expired')
        setErrorMsg(t('authCallback.errLinkExpired'))
        return
      }
      if (errorCode) {
        setStatus('error')
        setErrorMsg(errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : t('authCallback.errGeneric'))
        return
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        setStatus('error')
        setErrorMsg(error.message)
        return
      }

      // 🔑 RECOVERY : si initialType OU eventType actuel = recovery, on reste en recovery
      // (isRecoveryRef évite que le success path override)
      if (eventType === 'recovery' || isRecoveryRef.current) {
        isRecoveryRef.current = true
        if (session?.user) setEmail(session.user.email || '')
        setStatus('recovery')
        return
      }

      // ✅ SIGNUP / autres : session valide → success + redirect
      // MAIS on vérifie isRecoveryRef en garde — si quelqu'un l'a marqué entre-temps, on n'override pas
      if (session?.user) {
        if (isRecoveryRef.current) {
          setStatus('recovery')
          setEmail(session.user.email || '')
          return
        }
        // 🪪 Applique le pseudo en attente (passé via user_metadata.pending_username
        // lors du signup) à la table profiles, puis nettoie la metadata.
        const pendingUsername = session.user.user_metadata?.pending_username
        if (pendingUsername) {
          try {
            const { error: profErr } = await supabase
              .from('profiles')
              .update({ username: pendingUsername })
              .eq('user_id', session.user.id)
            if (profErr) console.warn('[profile pending_username]', profErr)
            // Nettoie la metadata pour ne pas réappliquer si on repasse ici
            await supabase.auth.updateUser({ data: { pending_username: null } })
          } catch (err) {
            console.warn('[apply pending_username]', err)
          }
        }
        setEmail(session.user.email || '')
        setStatus('success')
        setTimeout(() => {
          // Garde double : si le flag recovery a été set entre temps, on annule le redirect
          if (mounted && !isRecoveryRef.current) window.location.href = '/app'
        }, 3000)
        return
      }

      // Pas de session, pas d'erreur → lien déjà utilisé
      setStatus('error')
      setErrorMsg(t('authCallback.errNoSession'))
    }

    // Écoute PASSWORD_RECOVERY (Supabase fire cet event quand l'URL est un recovery link)
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY') {
        isRecoveryRef.current = true
        setEmail(session?.user?.email || '')
        setStatus('recovery')
      }
    })

    process()
    return () => {
      mounted = false
      subscription?.subscription?.unsubscribe?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Soumission du nouveau mot de passe
  async function submitNewPassword(e) {
    e.preventDefault()
    setErrorMsg('')
    if (newPassword.length < 8) {
      setErrorMsg(t('authCallback.errPasswordTooShort'))
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(t('authCallback.errPasswordMismatch'))
      return
    }
    setUpdating(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setUpdating(false)
    if (error) {
      setErrorMsg(error.message)
      return
    }
    setPwSuccess(true)
    setTimeout(() => { window.location.href = '/app' }, 2500)
  }

  async function resendConfirmation() {
    if (!email) {
      const ans = window.prompt(t('authCallback.promptEmail'))
      if (!ans) return
      setEmail(ans)
      setResending(true)
      const { error } = await supabase.auth.resend({ type: 'signup', email: ans })
      setResending(false)
      if (error) alert(t('authCallback.errorPrefix') + error.message)
      else setResendOk(true)
      return
    }
    setResending(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    if (error) alert(t('authCallback.errorPrefix') + error.message)
    else setResendOk(true)
  }

  // === Styles communs ===
  const cardStyle = {
    width: '100%', maxWidth: 480,
    background: C.surface, border: '1px solid var(--border2)',
    borderRadius: 14, padding: 40, textAlign: 'center',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  }
  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: 14,
    background: C.surface2, border: '1px solid var(--border2)',
    borderRadius: 8, color: C.text, outline: 'none',
    fontFamily: 'inherit', marginTop: 4,
  }
  const labelStyle = {
    display: 'block', textAlign: 'left',
    fontSize: 11, fontWeight: 600, color: C.text3,
    textTransform: 'uppercase', letterSpacing: '0.5px',
  }
  const primaryBtn = {
    display: 'inline-block', padding: '12px 28px',
    fontSize: 14, fontWeight: 600, borderRadius: 99,
    background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
    color: '#fff', textDecoration: 'none', border: 'none', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(45,111,255,0.35)',
    fontFamily: 'inherit',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.bg, padding: 20, color: C.text,
    }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <QLogoIcon size={84} color="gradient" />
        </div>

        {/* === LOADING === */}
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{t('authCallback.loadingTitle')}</h1>
            <p style={{ fontSize: 13, color: C.text2 }}>{t('authCallback.loadingSub')}</p>
          </>
        )}

        {/* === SUCCESS (signup confirmation) === */}
        {status === 'success' && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(29,184,122,0.15)', border: `1px solid ${C.green}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, margin: '0 auto 18px',
            }}>✓</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{t('authCallback.successTitle')}</h1>
            <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 24 }}>
              {t('authCallback.successWelcome')}{email ? ` (${email})` : ''}.<br />
              {t('authCallback.successRedirect')}
            </p>
            <Link href="/app" style={primaryBtn}>{t('authCallback.accessNow')}</Link>
          </>
        )}

        {/* === RECOVERY (form nouveau mot de passe) === */}
        {status === 'recovery' && !pwSuccess && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(45,111,255,0.15)', border: `1px solid ${C.blue}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, margin: '0 auto 18px',
            }}>🔐</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{t('authCallback.recoveryTitle')}</h1>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 22 }}>
              {t('authCallback.recoveryIntro')} <strong style={{ color: C.text }}>{email}</strong>.
            </p>
            <form onSubmit={submitNewPassword} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{t('authCallback.newPasswordLabel')}</label>
                <input
                  type="password" autoComplete="new-password"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••" minLength={8} required autoFocus
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>{t('authCallback.confirmPasswordLabel')}</label>
                <input
                  type="password" autoComplete="new-password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" minLength={8} required
                  style={inputStyle}
                />
                <div style={{ fontSize: 10, color: C.text3, marginTop: 6 }}>
                  {t('authCallback.passwordHint')}
                </div>
              </div>
              {errorMsg && (
                <div style={{
                  padding: '10px 14px', background: 'rgba(232,80,74,0.1)',
                  border: `1px solid ${C.red}`, borderRadius: 8,
                  fontSize: 12, color: C.red, marginBottom: 14, textAlign: 'left',
                }}>{errorMsg}</div>
              )}
              <button type="submit" disabled={updating} style={{
                ...primaryBtn, width: '100%', padding: '14px 28px',
                opacity: updating ? 0.6 : 1, cursor: updating ? 'wait' : 'pointer',
              }}>
                {updating ? t('authCallback.updating') : t('authCallback.updatePassword')}
              </button>
            </form>
          </>
        )}

        {/* === SUCCESS du recovery === */}
        {status === 'recovery' && pwSuccess && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(29,184,122,0.15)', border: `1px solid ${C.green}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, margin: '0 auto 18px',
            }}>✓</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>{t('authCallback.pwSuccessTitle')}</h1>
            <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
              {t('authCallback.pwSuccessRedirect')}
            </p>
            <Link href="/app" style={primaryBtn}>{t('authCallback.accessNow')}</Link>
          </>
        )}

        {/* === EXPIRED === */}
        {status === 'expired' && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(250,199,117,0.15)', border: `1px solid ${C.amber}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, margin: '0 auto 18px',
            }}>⌛</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{t('authCallback.expiredTitle')}</h1>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 18 }}>
              {errorMsg} {t('authCallback.expiredCanResend')}
            </p>
            {resendOk ? (
              <div style={{
                padding: '12px 16px', background: 'rgba(29,184,122,0.10)',
                border: `1px solid ${C.green}`, borderRadius: 8,
                fontSize: 13, color: C.green, marginBottom: 16,
              }}>{t('authCallback.emailResent')}</div>
            ) : (
              <button onClick={resendConfirmation} disabled={resending} style={{ ...primaryBtn, marginBottom: 16 }}>
                {resending ? t('authCallback.sending') : t('authCallback.resendLink')}
              </button>
            )}
            <div>
              <Link href="/app" style={{ fontSize: 12, color: C.text3, textDecoration: 'none' }}>{t('authCallback.backToLogin')}</Link>
            </div>
          </>
        )}

        {/* === ERROR === */}
        {status === 'error' && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(232,80,74,0.15)', border: `1px solid ${C.red}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, margin: '0 auto 18px',
            }}>✕</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{t('authCallback.errorTitle')}</h1>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 18 }}>
              {errorMsg}
            </p>
            <div style={{ marginTop: 8 }}>
              <Link href="/app" style={{ fontSize: 12, color: C.blueLight, textDecoration: 'none' }}>
                {t('authCallback.backToLoginPage')}
              </Link>
            </div>
          </>
        )}

        <div style={{ marginTop: 28, fontSize: 11, color: C.text3 }}>
          {t('authCallback.needHelp')} <a href="mailto:support@quantara.tech" style={{ color: C.blueLight, textDecoration: 'none' }}>support@quantara.tech</a>
        </div>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <CallbackInner />
    </Suspense>
  )
}
