'use client'
// Page d'atterrissage après que l'utilisateur clique sur le lien de confirmation
// envoyé par email. Supabase ajoute le token dans l'URL hash → on le détecte
// via detectSessionInUrl=true du client supabase, puis on affiche un message clair.
//
// 3 cas gérés :
//   - ✅ Confirmation réussie (token valide) → redirige vers /app après 3s
//   - ⚠️ Lien expiré ou déjà utilisé → option de renvoyer un lien
//   - ❌ Erreur autre → message + lien retour

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import Logo from '../../../components/Logo'

function CallbackInner() {
  const [status, setStatus] = useState('loading') // loading | success | error | expired
  const [errorMsg, setErrorMsg] = useState('')
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendOk, setResendOk] = useState(false)

  useEffect(() => {
    let mounted = true
    async function process() {
      // Supabase parse automatiquement le hash de l'URL et établit la session
      // si le token est valide (detectSessionInUrl: true).
      // On attend ~500ms pour laisser le temps au SDK de processer.
      await new Promise(r => setTimeout(r, 500))

      const { data: { session }, error } = await supabase.auth.getSession()

      if (!mounted) return

      // Cas 1 : erreur dans l'URL
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      const url = new URL(window.location.href)
      const errorCode = url.searchParams.get('error_code') || (hash.includes('error_code=') ? hash.split('error_code=')[1].split('&')[0] : null)
      const errorDesc = url.searchParams.get('error_description') || (hash.includes('error_description=') ? decodeURIComponent(hash.split('error_description=')[1].split('&')[0]) : null)

      if (errorCode === 'otp_expired' || /expired/i.test(errorDesc || '')) {
        setStatus('expired')
        setErrorMsg('Le lien de confirmation a expiré (validité 24h).')
        return
      }
      if (errorCode || error) {
        setStatus('error')
        setErrorMsg(errorDesc || error?.message || 'Une erreur est survenue lors de la confirmation.')
        return
      }

      // Cas 2 : session valide → succès
      if (session?.user) {
        setEmail(session.user.email || '')
        setStatus('success')
        // Redirige vers l'app après 3s
        setTimeout(() => {
          if (mounted) window.location.href = '/app'
        }, 3000)
        return
      }

      // Cas 3 : pas de session, pas d'erreur → probablement déjà confirmé
      setStatus('error')
      setErrorMsg('Aucune session active. Le lien a peut-être déjà été utilisé.')
    }
    process()
    return () => { mounted = false }
  }, [])

  async function resendConfirmation() {
    if (!email) {
      const ans = window.prompt('Saisis ton email pour recevoir un nouveau lien :')
      if (!ans) return
      setEmail(ans)
      setResending(true)
      const { error } = await supabase.auth.resend({ type: 'signup', email: ans })
      setResending(false)
      if (error) {
        alert('Erreur : ' + error.message)
      } else {
        setResendOk(true)
      }
      return
    }
    setResending(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      setResendOk(true)
    }
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

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.bg, padding: 20, color: C.text,
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: C.surface, border: '1px solid rgba(255,255,255,0.13)',
        borderRadius: 14, padding: 40, textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo size={56} glow="strong" />
        </div>

        {/* États */}
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Confirmation en cours...</h1>
            <p style={{ fontSize: 13, color: C.text2 }}>On vérifie ton lien de confirmation.</p>
          </>
        )}

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
            <Link href="/app" style={{
              display: 'inline-block', padding: '12px 32px',
              fontSize: 14, fontWeight: 600, borderRadius: 99,
              background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
              color: '#fff', textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(45,111,255,0.35)',
            }}>Accéder maintenant →</Link>
          </>
        )}

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
              {errorMsg} Pas de souci, on peut t'en renvoyer un nouveau.
            </p>
            {resendOk ? (
              <div style={{
                padding: '12px 16px', background: 'rgba(29,184,122,0.10)',
                border: `1px solid ${C.green}`, borderRadius: 8,
                fontSize: 13, color: C.green, marginBottom: 16,
              }}>
                ✓ Email renvoyé ! Vérifie ta boîte de réception.
              </div>
            ) : (
              <button
                onClick={resendConfirmation}
                disabled={resending}
                style={{
                  padding: '12px 28px', fontSize: 14, fontWeight: 600,
                  borderRadius: 99, border: 'none', cursor: resending ? 'wait' : 'pointer',
                  background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
                  color: '#fff', boxShadow: '0 4px 14px rgba(45,111,255,0.35)',
                  marginBottom: 16,
                }}
              >{resending ? '⏳ Envoi...' : '📧 Renvoyer le lien'}</button>
            )}
            <div>
              <Link href="/app" style={{ fontSize: 12, color: C.text3, textDecoration: 'none' }}>← Retour à la connexion</Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(232,80,74,0.15)', border: `1px solid ${C.red}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, margin: '0 auto 18px',
            }}>✕</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Confirmation impossible</h1>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, marginBottom: 18 }}>
              {errorMsg}
            </p>
            {resendOk ? (
              <div style={{
                padding: '12px 16px', background: 'rgba(29,184,122,0.10)',
                border: `1px solid ${C.green}`, borderRadius: 8,
                fontSize: 13, color: C.green, marginBottom: 16,
              }}>
                ✓ Email renvoyé ! Vérifie ta boîte de réception.
              </div>
            ) : (
              <button
                onClick={resendConfirmation}
                disabled={resending}
                style={{
                  padding: '10px 22px', fontSize: 13, fontWeight: 600,
                  borderRadius: 99, border: '1px solid rgba(255,255,255,0.13)',
                  background: 'transparent', color: C.text, cursor: resending ? 'wait' : 'pointer',
                  marginBottom: 16,
                }}
              >{resending ? '⏳ Envoi...' : '📧 Renvoyer un lien de confirmation'}</button>
            )}
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
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#0d0f14'}} />}>
      <CallbackInner />
    </Suspense>
  )
}
