'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { useT } from '../../../components/LanguageProvider'
import { C, cardStyle } from '../../../lib/theme'

function Inner() {
  const t = useT()
  const sp = useSearchParams()
  const u = sp.get('u'), tok = sp.get('t')
  const [state, setState] = useState('idle') // idle | busy | done | error
  const [err, setErr] = useState('')

  async function confirm() {
    setState('busy')
    try {
      const r = await fetch('/api/email/unsubscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ u, t: tok }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setErr(j.error || t('email.unsubscribe.error')); setState('error'); return }
      setState('done')
    } catch { setErr(t('email.unsubscribe.error')); setState('error') }
  }

  const box = { ...cardStyle, maxWidth: 480, width: '100%', padding: '28px 26px', display: 'grid', gap: 14 }
  const btn = { minHeight: 40, padding: '0 18px', borderRadius: 10, border: 0, background: 'var(--blue)', color: 'var(--text-inverse)', fontWeight: 600, cursor: 'pointer', justifySelf: 'start' }
  return (
    <main id="main" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '48px 16px' }}>
      <div style={box}>
        <h1 style={{ margin: 0, fontSize: 22, color: C.text }}>{t('email.unsubscribe.title')}</h1>
        {!u || !tok ? (
          <p style={{ margin: 0, color: C.text2 }}>{t('email.unsubscribe.badLink')}</p>
        ) : state === 'done' ? (
          <p role="status" style={{ margin: 0, color: C.text2 }}>{t('email.unsubscribe.done')}</p>
        ) : (
          <>
            <p style={{ margin: 0, color: C.text2 }}>{t('email.unsubscribe.body')}</p>
            <button onClick={confirm} disabled={state === 'busy'} style={btn}>{state === 'busy' ? t('email.unsubscribe.busy') : t('email.unsubscribe.confirm')}</button>
            {state === 'error' ? <p role="alert" style={{ margin: 0, color: 'var(--red)' }}>{err}</p> : null}
          </>
        )}
        <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>{t('email.unsubscribe.settingsHint')} <Link href="/app/settings" style={{ color: 'var(--blue)' }}>{t('email.unsubscribe.settingsLink')}</Link></p>
      </div>
    </main>
  )
}

export default function UnsubscribeClient() {
  return <Suspense fallback={null}><Inner /></Suspense>
}
