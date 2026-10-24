'use client'
// components/dashboard/AiReviewWidget.js — revue hebdomadaire du journal par IA.
//
// Désactivée par défaut. L'activer est un consentement explicite : un résumé
// des trades part chez Anthropic (lib/aiReview, politique de confidentialité).
// Les revues sont écrites par le serveur (cron weekly-review, ou
// /api/ai-review à la demande) ; ce widget les lit directement (RLS).
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useT } from '../LanguageProvider'

const TITLES = new Set(['Ce qui a marché', 'Ce qui a coûté', 'Règles et comptes', 'À tester la semaine prochaine'])

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token || ''}` }
}

function ReviewText({ content }) {
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text2)' }}>
      {String(content).split('\n').map((line, i) => {
        const l = line.trim()
        if (!l) return null
        if (TITLES.has(l)) return <h3 key={i} style={{ fontSize: 13, fontWeight: 650, color: 'var(--text)', margin: '14px 0 4px' }}>{l}</h3>
        return <p key={i} style={{ margin: '2px 0', paddingLeft: l.startsWith('- ') ? 12 : 0, textIndent: l.startsWith('- ') ? -12 : 0 }}>{l.startsWith('- ') ? `• ${l.slice(2)}` : l}</p>
      })}
    </div>
  )
}

export default function AiReviewWidget({ instance, user, S }) {
  const t = useT()
  const [state, setState] = useState({ loading: true, configured: false, optin: false, reviews: [] })
  const [idx, setIdx] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    if (!user?.id) return
    const [cfg, prof, revs] = await Promise.all([
      fetch('/api/ai-review', { headers: await authHeader() }).then((r) => r.json()).catch(() => ({})),
      supabase.from('profiles').select('ai_review_optin').eq('user_id', user.id).maybeSingle(),
      supabase.from('ai_reviews').select('id, week_start, period_end, content, trades_count, pnl, created_at').eq('user_id', user.id).order('week_start', { ascending: false }).limit(8),
    ])
    setState({ loading: false, configured: !!cfg.configured, optin: !!prof.data?.ai_review_optin, reviews: revs.data || [] })
  }
  useEffect(() => { load() }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function setOptin(on) {
    setBusy(true); setError('')
    const { error: e } = await supabase.from('profiles').upsert({ user_id: user.id, ai_review_optin: on }, { onConflict: 'user_id' })
    if (e) setError(t('app.widgets.aiReviewSaveError'))
    else setState((s) => ({ ...s, optin: on }))
    setBusy(false)
  }

  async function generate() {
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/ai-review', { method: 'POST', headers: await authHeader() })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || t('app.widgets.aiReviewError'))
      setState((s) => ({ ...s, reviews: [d.review, ...s.reviews.filter((x) => x.week_start !== d.review.week_start)] }))
      setIdx(0)
    } catch (e) { setError(e.message) }
    setBusy(false)
  }

  const card = { ...S.card, padding: '22px 24px', minWidth: 0, height: '100%', overflow: 'auto' }
  const btn = { padding: '7px 14px', fontSize: 12.5, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid var(--hairline)', background: 'var(--tint1)', color: 'var(--text)' }
  const primary = { ...btn, background: 'var(--text)', color: 'var(--text-inverse)', borderColor: 'transparent' }
  const review = state.reviews[idx]

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.015em', margin: 0 }}>{instance?.title || t('app.widgets.aiReview')}</h2>
        {state.optin && state.reviews.length > 1 && (
          <select
            id={`ai-review-week-${instance?.i || 'w'}`}
            aria-label={t('app.widgets.aiReviewWeek')}
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
            style={{ fontSize: 12, padding: '5px 8px', borderRadius: 7, border: '1px solid var(--hairline)', background: 'var(--tint1)', color: 'var(--text)', fontFamily: 'inherit' }}
          >
            {state.reviews.map((r, i) => <option key={r.id} value={i}>{t('app.widgets.aiReviewWeekOf').replace('{d}', r.week_start)}</option>)}
          </select>
        )}
      </div>

      {state.loading ? null : !state.configured ? (
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 12 }}>{t('app.widgets.aiReviewUnavailable')}</p>
      ) : !state.optin ? (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{t('app.widgets.aiReviewPitch')}</p>
          <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.55, margin: '10px 0 0' }}>
            {t('app.widgets.aiReviewConsent')}{' '}
            <Link href="/legal/privacy" style={{ color: 'var(--blue-light)' }}>{t('app.widgets.aiReviewPrivacy')}</Link>
          </p>
          <button onClick={() => setOptin(true)} disabled={busy} style={{ ...primary, marginTop: 14 }}>{t('app.widgets.aiReviewEnable')}</button>
        </div>
      ) : (
        <div style={{ marginTop: 10 }}>
          {review ? (
            <>
              <div style={{ fontSize: 11.5, color: 'var(--text3)', marginBottom: 6 }}>
                {t('app.widgets.aiReviewMeta')
                  .replace('{from}', review.week_start).replace('{to}', review.period_end)
                  .replace('{n}', review.trades_count)}
              </div>
              <ReviewText content={review.content} />
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text3)', margin: '6px 0 0' }}>{t('app.widgets.aiReviewEmpty')}</p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={generate} disabled={busy} style={primary}>{busy ? t('app.widgets.aiReviewWorking') : t('app.widgets.aiReviewNow')}</button>
            <button onClick={() => setOptin(false)} disabled={busy} style={btn}>{t('app.widgets.aiReviewDisable')}</button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text3)', margin: '10px 0 0' }}>{t('app.widgets.aiReviewDisclaimer')}</p>
        </div>
      )}
      {error && <p role="alert" style={{ fontSize: 12.5, color: 'var(--red)', margin: '10px 0 0' }}>{error}</p>}
    </div>
  )
}
