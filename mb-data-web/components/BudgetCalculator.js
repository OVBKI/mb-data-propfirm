'use client'
// components/BudgetCalculator.js — le calculateur de budget (/app/budget).
//
// Huit questions, une à la fois, puis deux plafonds mensuels (soft et agressif)
// calculés par lib/budgetCalculator.js, avec le détail de chaque coefficient.
//
// Les réponses sont des données financières personnelles : elles restent dans
// le navigateur (localStorage), jamais en base. Le calcul n'a besoin de rien
// d'autre que ce qui est saisi ici et des comptes déjà chargés par l'app.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useT, useLanguage } from './LanguageProvider'
import { C, cardStyle, btnPrimary, btnGhost, inputStyle } from '../lib/theme'
import {
  computeBudget, emptyAnswers, isAnswered, spentInMonthEUR, medianChallengeEUR,
  STABILITY, EXPERIENCE, BUDGET_CURRENCIES,
} from '../lib/budgetCalculator'

const STORAGE_KEY = 'quantara_budget_v1'
// Repère quand l'utilisateur n'a encore aucun compte : l'ordre de grandeur d'une
// évaluation 50K, en EUR.
const REFERENCE_CHALLENGE_EUR = 150

const STEPS = [
  { key: 'income', type: 'amount' },
  { key: 'fixed', type: 'amount' },
  { key: 'living', type: 'amount' },
  { key: 'debt', type: 'amount' },
  { key: 'savings', type: 'amount' },
  { key: 'dependents', type: 'choice', options: [0, 1, 2, 3].map((v) => ({ value: v, label: `dep${v}` })) },
  { key: 'stability', type: 'choice', options: STABILITY.map((v) => ({ value: v, label: v, sub: `${v}Sub` })) },
  { key: 'experience', type: 'choice', options: EXPERIENCE.map((v) => ({ value: v, label: v, sub: `${v}Sub` })) },
]

const TONES = {
  soft: { fg: 'var(--green)', bg: 'var(--green-bg)' },
  aggressive: { fg: 'var(--amber)', bg: 'var(--amber-bg)' },
}

function readSaved() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function writeSaved(value) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch { /* navigation privée : on garde l'état en mémoire */ }
}

export default function BudgetCalculator({ firms, rates, toEUR }) {
  const t = useT()
  const { locale } = useLanguage()
  const [answers, setAnswers] = useState(() => emptyAnswers(locale === 'en' ? 'USD' : 'EUR'))
  const [step, setStep] = useState(0)
  const [view, setView] = useState('wizard')
  const [loaded, setLoaded] = useState(false)
  const inputRef = useRef(null)

  // Lu après le montage : le rendu serveur ne connaît pas le localStorage, et le
  // lire pendant le rendu ferait diverger les deux.
  useEffect(() => {
    const saved = readSaved()
    if (saved?.answers) {
      setAnswers((a) => ({ ...a, ...saved.answers }))
      if (saved.done) setView('result')
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) writeSaved({ answers, done: view === 'result' })
  }, [answers, view, loaded])

  useEffect(() => {
    if (view === 'wizard' && STEPS[step].type === 'amount') inputRef.current?.focus()
  }, [step, view])

  const cur = answers.currency
  const fromEUR = (eur) => eur / (rates?.[cur] || 1)
  const money = useMemo(() => new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
    style: 'currency', currency: cur, maximumFractionDigits: 0,
  }), [locale, cur])
  const fmt = (v) => money.format(Math.round(v || 0))
  const pct = (v) => `${Math.round(v * 100)} %`

  const hasAccounts = (firms || []).some((f) => (f.accounts || []).length)
  const medianEUR = useMemo(() => medianChallengeEUR(firms, toEUR, rates), [firms, toEUR, rates])
  const spentEUR = useMemo(() => spentInMonthEUR(firms, toEUR, rates), [firms, toEUR, rates])
  const price = fromEUR(medianEUR ?? REFERENCE_CHALLENGE_EUR)
  const result = useMemo(
    () => computeBudget(answers, { avgChallenge: price, spentThisMonth: fromEUR(spentEUR) }),
    // fromEUR ne dépend que de rates et de la devise, déjà listés.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers, price, spentEUR, rates, cur],
  )

  const current = STEPS[step]
  const answered = isAnswered(current.key, answers)
  const set = (key, value) => setAnswers((a) => ({ ...a, [key]: value }))

  function next() {
    if (!isAnswered(current.key, answers)) return
    if (step < STEPS.length - 1) setStep(step + 1)
    else setView('result')
  }
  function choose(value) {
    setAnswers((a) => ({ ...a, [current.key]: value }))
    // Un choix fait avance tout seul : un clic de moins par question.
    if (step < STEPS.length - 1) setStep(step + 1)
    else setView('result')
  }
  function reset() {
    if (!window.confirm(t('app.budget.result.resetConfirm'))) return
    setAnswers(emptyAnswers(cur))
    setStep(0)
    setView('wizard')
  }

  const header = (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, color: 'var(--green)', letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>{t('app.budget.eyebrow')}</div>
      <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 6px', lineHeight: 1.1 }}>{t('app.budget.title')}</h1>
      <p style={{ fontSize: 13.5, color: C.text3, margin: 0, maxWidth: 640 }}>{t('app.budget.subtitle')}</p>
    </div>
  )

  if (view === 'wizard') {
    const q = `app.budget.q.${current.key}`
    return (
      <div className="page-pad" style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 60px' }}>
        {header}
        <div style={{ ...cardStyle, padding: '28px clamp(18px, 4vw, 36px)', maxWidth: 640 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: C.text3, fontVariantNumeric: 'tabular-nums' }}>
              {t('app.budget.progress').replace('{n}', step + 1).replace('{total}', STEPS.length)}
            </span>
          </div>
          <div role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}
               style={{ height: 4, borderRadius: 99, background: 'var(--tint2)', overflow: 'hidden', marginBottom: 26 }}>
            <div style={{ width: `${((step + 1) / STEPS.length) * 100}%`, height: '100%', background: 'var(--green)', transition: 'width .25s ease' }} />
          </div>

          <h2 id="budget-q" style={{ fontSize: 22, fontWeight: 650, letterSpacing: '-0.015em', margin: '0 0 8px' }}>{t(`${q}.title`)}</h2>
          <p style={{ fontSize: 13.5, color: C.text3, margin: '0 0 22px', lineHeight: 1.55 }}>{t(`${q}.help`)}</p>

          {current.type === 'amount' ? (
            <form onSubmit={(e) => { e.preventDefault(); next() }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 220px' }}>
                  <input
                    ref={inputRef} id={`budget-${current.key}`} type="number" inputMode="decimal" min="0" step="any"
                    aria-labelledby="budget-q" placeholder={t('app.budget.amountPlaceholder')}
                    value={answers[current.key]}
                    onChange={(e) => set(current.key, e.target.value)}
                    style={{ ...inputStyle, fontSize: 20, padding: '14px 120px 14px 16px', fontVariantNumeric: 'tabular-nums' }}
                  />
                  <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.text3, pointerEvents: 'none' }}>
                    {cur}{current.key === 'savings' ? '' : ` ${t('app.budget.perMonth')}`}
                  </span>
                </div>
                {current.key === 'income' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.text3 }}>
                    {t('app.budget.currencyLabel')}
                    <select id="budget-currency" value={cur} onChange={(e) => set('currency', e.target.value)}
                            style={{ ...inputStyle, width: 'auto', padding: '12px 14px' }}>
                      {BUDGET_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                )}
              </div>
              <WizardNav t={t} step={step} total={STEPS.length} answered={answered}
                         onPrev={() => setStep(step - 1)} submit />
            </form>
          ) : (
            <>
              <div role="radiogroup" aria-labelledby="budget-q"
                   style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                {current.options.map((o) => {
                  const on = answers[current.key] === o.value
                  return (
                    <button key={String(o.value)} type="button" role="radio" aria-checked={on} onClick={() => choose(o.value)}
                      style={{
                        textAlign: 'left', padding: '14px 16px', minHeight: 56, borderRadius: 'var(--radius)', cursor: 'pointer',
                        fontFamily: 'inherit', color: C.text,
                        background: on ? 'var(--green-bg)' : 'var(--tint1)',
                        border: `1px solid ${on ? 'var(--green)' : 'var(--hairline)'}`,
                      }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{t(`app.budget.opt.${o.label}`)}</div>
                      {o.sub && <div style={{ fontSize: 12, color: C.text3, marginTop: 3 }}>{t(`app.budget.opt.${o.sub}`)}</div>}
                    </button>
                  )
                })}
              </div>
              <WizardNav t={t} step={step} total={STEPS.length} answered={answered}
                         onPrev={() => setStep(step - 1)} onNext={next} />
            </>
          )}
        </div>
        <p style={{ fontSize: 12, color: C.text3, marginTop: 14, maxWidth: 640 }}>🔒 {t('app.budget.privacy')}</p>
      </div>
    )
  }

  // ── Résultats ──────────────────────────────────────────────────────────────
  const r = result
  const a = r.answers
  const factorLabel = (f) => (f.key === 'rate' ? pct(f.value) : `× ${f.value.toLocaleString(locale === 'en' ? 'en-US' : 'fr-FR', { maximumFractionDigits: 2 })}`)
  const countText = (n) => (n === 0 ? t('app.budget.result.count0') : n === 1 ? t('app.budget.result.count1') : t('app.budget.result.countN').replace('{n}', n))

  return (
    <div className="page-pad" style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 60px' }}>
      {header}

      {/* La situation, en chiffres */}
      <section aria-label={t('app.budget.result.situation')}
               style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          ['income', fmt(a.income)],
          ['essentials', fmt(r.essentials)],
          ['disposable', fmt(r.disposable), r.disposable <= 0 ? 'var(--red)' : C.text],
        ].map(([k, v, color]) => (
          <div key={k} style={{ ...cardStyle, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, color: C.text3 }}>{t(`app.budget.result.${k}`)}</div>
            <div style={{ fontSize: 22, fontWeight: 650, marginTop: 4, fontVariantNumeric: 'tabular-nums', color: color || C.text }}>{v}</div>
            <div style={{ fontSize: 11.5, color: C.text3, marginTop: 2 }}>{t('app.budget.perMonth')}</div>
          </div>
        ))}
        <div style={{ ...cardStyle, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: C.text3 }}>{t('app.budget.result.safety')}</div>
          <div style={{ fontSize: 22, fontWeight: 650, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{pct(r.coverage)}</div>
          <div style={{ height: 6, borderRadius: 99, background: 'var(--tint2)', overflow: 'hidden', margin: '6px 0 6px' }}>
            <div style={{ width: `${r.coverage * 100}%`, height: '100%', background: r.coverage >= 1 ? 'var(--green)' : 'var(--amber)' }} />
          </div>
          <div style={{ fontSize: 11.5, color: C.text3 }}>
            {t('app.budget.result.safetyOf').replace('{have}', fmt(a.savings)).replace('{target}', fmt(r.safetyTarget)).replace('{months}', r.safetyMonths)}
          </div>
        </div>
      </section>

      {/* Les deux approches */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        {['soft', 'aggressive'].map((p) => {
          const b = r[p]
          const tone = TONES[p]
          return (
            <section key={p} aria-labelledby={`budget-${p}`} style={{ ...cardStyle, padding: '22px 24px', borderTop: `3px solid ${tone.fg}` }}>
              <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 650, padding: '3px 10px', borderRadius: 99, color: tone.fg, background: tone.bg }}>
                {t(`app.budget.result.${p}`)}
              </span>
              <p style={{ fontSize: 13, color: C.text2, margin: '10px 0 16px', lineHeight: 1.5 }}>{t(`app.budget.result.${p}Sub`)}</p>
              <div id={`budget-${p}`} style={{ fontSize: 12, color: C.text3 }}>{t('app.budget.result.monthly')}</div>
              <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: b.monthly > 0 ? C.text : C.text3, lineHeight: 1.15 }}>
                {b.monthly > 0 ? fmt(b.monthly) : t('app.budget.result.zero')}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'grid', gap: 8, fontSize: 13, color: C.text2, lineHeight: 1.5 }}>
                <li>{b.oneOff > 0 ? t('app.budget.result.oneOff').replace('{amount}', fmt(b.oneOff)) : t('app.budget.result.noOneOff')}</li>
                {b.monthsPerChallenge && (
                  <li>{t('app.budget.result.everyMonths')
                    .replace('{n}', b.monthsPerChallenge)
                    .replace('{price}', fmt(price))
                    .replace('{source}', t(medianEUR != null ? 'app.budget.result.sourceYours' : 'app.budget.result.sourceRef'))}</li>
                )}
                {b.monthly > 0 && !b.monthsPerChallenge && (
                  <li>{t('app.budget.result.challengesLine')
                    .replace('{count}', countText(b.challenges))
                    .replace('{price}', fmt(price))
                    .replace('{source}', t(medianEUR != null ? 'app.budget.result.sourceYours' : 'app.budget.result.sourceRef'))}</li>
                )}
                {b.monthly > 0 && <li>{t('app.budget.result.yearly').replace('{amount}', fmt(b.yearly))}</li>}
                {hasAccounts && b.monthly > 0 && (
                  <li style={{ color: b.overspent > 0 ? 'var(--red)' : C.text2 }}>
                    {b.overspent > 0
                      ? t('app.budget.result.thisMonthOver').replace('{spent}', fmt(fromEUR(spentEUR))).replace('{over}', fmt(b.overspent))
                      : t('app.budget.result.thisMonth').replace('{spent}', fmt(fromEUR(spentEUR))).replace('{left}', fmt(b.remaining))}
                  </li>
                )}
                {b.monthly > 0 && <li style={{ color: C.text3 }}>{t('app.budget.result.pause').replace('{amount}', fmt(b.pauseAfter))}</li>}
              </ul>
            </section>
          )
        })}
      </div>

      {/* À savoir */}
      {(r.verdict !== 'ok' || r.warnings.length > 0) && (
        <section style={{ ...cardStyle, padding: '18px 22px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 650, margin: '0 0 10px' }}>{t('app.budget.result.warnTitle')}</h2>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8, fontSize: 13, color: C.text2, lineHeight: 1.55 }}>
            {r.verdict !== 'ok' && <li style={{ color: 'var(--red)' }}>{t(`app.budget.result.warn.${r.verdict}`)}</li>}
            {r.warnings.map((w) => (
              <li key={w}>{t(`app.budget.result.warn.${w}`).replace('{amount}', fmt(r.safetyMissing))}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Comment c'est calculé */}
      {r.verdict === 'ok' && (
        <section style={{ ...cardStyle, padding: '18px 22px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 650, margin: '0 0 4px' }}>{t('app.budget.result.how')}</h2>
          <p style={{ fontSize: 12.5, color: C.text3, margin: '0 0 12px' }}>{t('app.budget.result.howIntro')}</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 420 }}>
              <thead>
                <tr style={{ color: C.text3, fontSize: 11.5, textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px', fontWeight: 600 }}>{t('app.budget.result.colFactor')}</th>
                  <th style={{ padding: '6px 8px', fontWeight: 600, textAlign: 'right' }}>{t('app.budget.result.soft')}</th>
                  <th style={{ padding: '6px 8px', fontWeight: 600, textAlign: 'right' }}>{t('app.budget.result.aggressive')}</th>
                </tr>
              </thead>
              <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
                <tr style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '8px' }}>{t('app.budget.result.disposable')}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{fmt(r.disposable)}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{fmt(r.disposable)}</td>
                </tr>
                {r.soft.factors.map((f, i) => {
                  const g = r.aggressive.factors[i]
                  const dim = (v) => (v === 1 ? C.text3 : v === 0 ? 'var(--red)' : C.text)
                  return (
                    <tr key={f.key} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: '8px' }}>{t(`app.budget.result.factor.${f.key}`)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: dim(f.value) }}>{factorLabel(f)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: dim(g.value) }}>{factorLabel(g)}</td>
                    </tr>
                  )
                })}
                <tr style={{ borderTop: `2px solid ${C.border2}`, fontWeight: 650 }}>
                  <td style={{ padding: '8px' }}>= {t('app.budget.result.monthly')}</td>
                  <td style={{ padding: '8px', textAlign: 'right', color: TONES.soft.fg }}>{fmt(r.soft.monthly)}</td>
                  <td style={{ padding: '8px', textAlign: 'right', color: TONES.aggressive.fg }}>{fmt(r.aggressive.monthly)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p style={{ fontSize: 12.5, color: C.text3, lineHeight: 1.6, margin: '0 0 6px', maxWidth: 760 }}>{t('app.budget.result.disclaimer')}</p>
      <p style={{ fontSize: 12, color: C.text3, margin: '0 0 18px' }}>🔒 {t('app.budget.privacy')}</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => { setStep(0); setView('wizard') }} style={{ ...btnPrimary, minHeight: 40 }}>{t('app.budget.result.edit')}</button>
        <button type="button" onClick={reset} style={{ ...btnGhost, minHeight: 40 }}>{t('app.budget.result.reset')}</button>
      </div>
    </div>
  )
}

function WizardNav({ t, step, total, answered, onPrev, onNext, submit }) {
  const last = step === total - 1
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
      <button type="button" onClick={onPrev} disabled={step === 0}
              style={{ ...btnGhost, minHeight: 40, visibility: step === 0 ? 'hidden' : 'visible' }}>{t('app.budget.prev')}</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {!answered && <span style={{ fontSize: 12, color: C.text3 }}>{t('app.budget.required')}</span>}
        <button type={submit ? 'submit' : 'button'} onClick={submit ? undefined : onNext} disabled={!answered}
                style={{ ...btnPrimary, minHeight: 40, opacity: answered ? 1 : 0.45, cursor: answered ? 'pointer' : 'not-allowed' }}>
          {last ? t('app.budget.seeResult') : t('app.budget.next')}
        </button>
      </div>
    </div>
  )
}
