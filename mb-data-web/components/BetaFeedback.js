'use client'
// components/BetaFeedback.js — open-beta feedback capture.
//
// Renders three things inside the authenticated app shell:
//   1. a slim, dismissible "beta" banner (dismissal persisted in localStorage),
//   2. a persistent floating "💬" button (always-available entry point),
//   3. a small modal (type + message + optional email) that inserts a row into
//      the `feedback` table via the authenticated supabase client (RLS: insert-own).
//
// Requires the `feedback` table (see supabase-schema.sql). Until it exists the
// insert errors and the user sees a failure toast — documented in CLAUDE.md.
//
// Props: { user, showToast }

import { useState } from 'react'
import { useT } from './LanguageProvider'
import { supabase } from '../lib/supabase'
import { useDialog } from './useDialog'

const DISMISS_KEY = 'quantara.betaBannerDismissed'
const TYPES = ['bug', 'idea', 'other']

const S = {
  card: { background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' },
  input: { width: '100%', padding: '10px 12px', fontSize: 13, border: '1px solid var(--hairline)', borderRadius: 8, background: 'var(--tint1)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  label: { fontSize: 10.5, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: 6 },
  btnPrimary: { padding: '9px 18px', fontSize: 12.5, fontWeight: 600, background: 'var(--text)', color: 'var(--text-inverse)', border: '1px solid transparent', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
  btnGhost: { padding: '8px 14px', fontSize: 12, fontWeight: 500, background: 'var(--tint1)', border: '1px solid var(--hairline)', color: 'var(--text2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' },
}

export default function BetaFeedback({ user, showToast }) {
  const [open, setOpen] = useState(false)
  // Read the dismissal flag lazily (client only — guarded for SSR safety).
  const [bannerHidden, setBannerHidden] = useState(() => {
    if (typeof window === 'undefined') return true
    try { return localStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })

  function dismissBanner() {
    setBannerHidden(true)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
  }

  return (
    <>
      {!bannerHidden && <BetaBanner onOpen={() => setOpen(true)} onDismiss={dismissBanner} />}
      <FloatingButton onClick={() => setOpen(true)} />
      {open && <FeedbackModal user={user} showToast={showToast} onClose={() => setOpen(false)} />}
    </>
  )
}

function BetaBanner({ onOpen, onDismiss }) {
  const t = useT()
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '8px 14px', marginBottom: 14, borderRadius: 10,
      background: 'linear-gradient(90deg, var(--blue-bg), var(--blue-bg))',
      border: '1px solid var(--blue-border)', fontSize: 13, color: 'var(--text2)',
    }}>
      <span style={{ fontSize: 15 }}>{'🚧'}</span>
      <span style={{ flex: 1, minWidth: 180 }}>{t('app.beta.bannerText')}</span>
      <button onClick={onOpen} style={{ ...S.btnGhost, borderColor: 'var(--blue-border)', color: 'var(--blue-light)', whiteSpace: 'nowrap' }}>
        {t('app.beta.bannerCta')}
      </button>
      <button onClick={onDismiss} aria-label={t('app.beta.dismiss')} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 15, padding: '2px 6px', minWidth: 28, minHeight: 28 }}>{'✕'}</button>
    </div>
  )
}

function FloatingButton({ onClick }) {
  const t = useT()
  return (
    <button
      onClick={onClick}
      aria-label={t('app.beta.floatingLabel')}
      title={t('app.beta.floatingLabel')}
      style={{
        position: 'fixed', right: 18, bottom: 18, zIndex: 480,
        width: 46, height: 46, borderRadius: '50%',
        background: 'var(--blue)', color: 'var(--text-inverse)', border: 'none',
        boxShadow: '0 6px 20px var(--blue-bg)', cursor: 'pointer',
        fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {'💬'}
    </button>
  )
}

function FeedbackModal({ user, showToast, onClose }) {
  const t = useT()
  const ref = useDialog({ open: true, onClose })
  const [type, setType] = useState('bug')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)

  const typeLabel = (v) => t(`app.beta.type${v.charAt(0).toUpperCase()}${v.slice(1)}`)

  async function submit() {
    if (saving) return
    const msg = message.trim()
    if (!msg) { showToast?.(t('app.beta.messageRequired')); return }
    setSaving(true)
    try {
      const payload = {
        user_id: user?.id || null,
        email: (email || '').trim() || null,
        type,
        message: msg.slice(0, 4000),
        url: typeof window !== 'undefined' ? window.location.pathname : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 400) : null,
      }
      const { error } = await supabase.from('feedback').insert(payload)
      if (error) { showToast?.(t('app.beta.sendFailed') + (error.message || '')); setSaving(false); return }
      showToast?.(t('app.beta.sent'))
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 520, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 12px', overflowY: 'auto' }}>
      <div ref={ref} role="dialog" aria-modal="true" tabIndex={-1} aria-label={t('app.beta.title')} onClick={e => e.stopPropagation()} style={{ ...S.panel, padding: 24, width: 440, maxWidth: '100%' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, marginBottom: 4 }}>{t('app.beta.title')}</h3>
        <p style={{ fontSize: 12.5, color: 'var(--text3)', margin: 0, marginBottom: 16, lineHeight: 1.5 }}>{t('app.beta.subtitle')}</p>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {TYPES.map(v => {
            const active = v === type
            return (
              <button key={v} type="button" onClick={() => setType(v)} style={{
                flex: 1, padding: '8px 6px', fontSize: 12, fontWeight: active ? 700 : 500,
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                background: active ? 'var(--blue-bg)' : 'var(--surface2)',
                border: `1px solid ${active ? 'var(--blue-light)' : 'var(--border2)'}`,
                color: active ? 'var(--blue-light)' : 'var(--text2)',
              }}>{typeLabel(v)}</button>
            )
          })}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>{t('app.beta.messageLabel')}</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder={t('app.beta.messagePlaceholder')} style={{ ...S.input, resize: 'vertical', minHeight: 90 }} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={S.label}>{t('app.beta.emailLabel')}</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" style={S.input} />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={S.btnGhost}>{t('app.beta.cancel')}</button>
          <button onClick={submit} disabled={saving} style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }}>{t('app.beta.send')}</button>
        </div>
      </div>
    </div>
  )
}
