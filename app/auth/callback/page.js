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
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  red: '#e8504a',
  amber: '#fac775',
}

function CallbackInner() {
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
        setErrorMsg('Le lien a expiré (validité 24h).')
        return
      }
      if (errorCode) {
        setStatus('error')
        setErrorMsg(errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : 'Une erreur est survenue.')
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
      setErrorMsg('Aucune session active. Le lien a peut-être déjà été utilisé.')
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
  }, [])

  // Soumission du nouveau mot de passe
  async function submitNewPassword(e) {
    e.preventDefault()
    setErrorMsg('')
    if (newPassword.length < 8) {
      setErrorMsg('Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Les 2 mots de passe ne correspondent pas.')
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
      const ans = window.prompt('Saisis ton email pour recevoir un nouveau lien :')
      if (!ans) return
      setEmail(ans)
      setResending(true)
      const { error } = await supabase.auth.resend({ type: 'signup', email: ans })
      setResending(false)
      if (error) alert('Erreur : ' + error.message)
      else setResendOk(true)
      return
    }
    setResending(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    if (error) alert('Erreur : ' + error.message)
    else setResendOk(true)
  }

  // === Styles communs ===
  const cardStyle = {
    width: '100%', maxWidth: 480,
    background: C.surface, border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: 14, padding: 40, textAlign: 'center',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  }
  const inputStyle = {
    width: '100%', padding: '11px 14px', fontSize: 14,
    background: C.surface2, border: '1px solid rgba(255,255,255,0.13)',
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
          <QLogoIcon size={56} color="gradient" />
        </div>

        {/* === LOADING === */}
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Vérification en cours...</h1>
            <p style={{ fontSize: 13, color: C.text2 }}>Quelques secondes...</p>
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
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Compte activé !</h1>
            <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 24 }}>
              Bienvenue sur Quantara{email ? ` (${email})` : ''}.<br />
              Tu vas être redirigé vers ton tableau de bord dans 3 secondes...
            </p>
            <Link href="/app" style={primaryBtn}>Accéder maintenant →</Link>
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
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Nouveau mot de passe</h1>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 22 }}>
              Choisis un nouveau mot de passe pour <strong style={{ color: C.text }}>{email}</strong>.
            </p>
            <form onSubmit={submitNewPassword} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Nouveau mot de passe</label>
                <input
                  type="password" autoComplete="new-password"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••" minLength={8} required autoFocus
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Confirmer le mot de passe</label>
                <input
                  type="password" autoComplete="new-password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" minLength={8} required
                  style={inputStyle}
                />
                <div style={{ fontSize: 10, color: C.text3, marginTop: 6 }}>
                  Minimum 8 caractères. Mélange lettres, chiffres, symboles pour plus de sécurité.
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
                {updating ? '⏳ Mise à jour...' : '🔐 Mettre à jour mon mot de passe'}
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
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Mot de passe modifié !</h1>
            <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.6, marginBottom: 20 }}>
              Tu vas être redirigé vers ton tableau de bord dans 2 secondes...
            </p>
            <Link href="/app" style={primaryBtn}>Accéder maintenant →</Link>
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
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Lien expiré</h1>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 18 }}>
              {errorMsg} Tu peux demander un nouveau lien.
            </p>
            {resendOk ? (
              <div style={{
                padding: '12px 16px', background: 'rgba(29,184,122,0.10)',
                border: `1px solid ${C.green}`, borderRadius: 8,
                fontSize: 13, color: C.green, marginBottom: 16,
              }}>✓ Email renvoyé !</div>
            ) : (
              <button onClick={resendConfirmation} disabled={resending} style={{ ...primaryBtn, marginBottom: 16 }}>
                {resending ? '⏳ Envoi...' : '📧 Renvoyer le lien'}
              </button>
            )}
            <div>
              <Link href="/app" style={{ fontSize: 12, color: C.text3, textDecoration: 'none' }}>← Retour à la connexion</Link>
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
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Lien invalide</h1>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 18 }}>
              {errorMsg}
            </p>
            <div style={{ marginTop: 8 }}>
              <Link href="/app" style={{ fontSize: 12, color: C.blueLight, textDecoration: 'none' }}>
                Retour à la page de connexion →
              </Link>
            </div>
          </>
        )}

        <div style={{ marginTop: 28, fontSize: 11, color: C.text3 }}>
          Besoin d'aide ? <a href="mailto:support@quantara.tech" style={{ color: C.blueLight, textDecoration: 'none' }}>support@quantara.tech</a>
        </div>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0d0f14' }} />}>
      <CallbackInner />
    </Suspense>
  )
}
