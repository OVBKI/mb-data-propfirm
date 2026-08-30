'use client'
// components/NewAccountWizard.js — « j'ai acheté un challenge » en trois écrans.
//
// L'ancien parcours demandait : créer une firme (modale 1), la retrouver dans le
// dashboard, ouvrir son tiroir, cliquer « Ajouter un compte », puis remplir
// dix-huit champs. Trois écrans pour un seul acte mental.
//
// Ici, une seule question par étape :
//   1. QUELLE FIRME    grille de logos, ou un nom libre
//   2. QUEL PLAN       des cartes qui MONTRENT prix, drawdown, objectif —
//                      l'app connaît déjà ces valeurs, elle les affiche au lieu
//                      de les faire ressaisir
//   3. COMBIEN, QUAND  date, prix payé, statut. Le reste est replié.
//
// La firme est créée à la volée si elle n'existe pas : l'utilisateur n'a jamais
// à penser « firme » et « compte » comme deux objets séparés.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useT } from './LanguageProvider'
import { useDialog } from './useDialog'
import { planChoices, programChoices, buildAccountForm } from '../lib/accountDefaults'
import { FIRM_SUGGESTIONS, FIRM_SUGGESTION_COLORS } from '../lib/constants'

// Le pas « programme » est CONDITIONNEL : la plupart des firmes n'en vendent
// qu'un, et poser une question à réponse unique est du bruit. STEPS est donc
// calculé, pas figé.
const BASE_STEPS = ['firm', 'plan', 'program', 'details']

export default function NewAccountWizard({
  firms, customFirmNames = [], getFirmLogo, S,
  initialFirmId = null,
  onCancel, onSubmit, busy = false,
}) {
  const t = useT()
  const dialogRef = useDialog({ open: true, onClose: onCancel })

  // Ouvrir depuis une firme existante saute l'étape 1 : la question est déjà
  // répondue, la reposer serait du bruit.
  const initialFirm = firms.find(f => f.id === initialFirmId) || null
  const [step, setStep] = useState(initialFirm ? 'plan' : 'firm')
  const [firmName, setFirmName] = useState(initialFirm?.name || '')
  const [plan, setPlan] = useState(null)
  const [program, setProgram] = useState(null)
  const [form, setForm] = useState(null)
  const [advanced, setAdvanced] = useState(false)
  const customInput = useRef(null)

  const knownFirms = useMemo(() => {
    const seen = new Set()
    return [...FIRM_SUGGESTIONS, ...customFirmNames].filter(n => {
      if (seen.has(n)) return false
      seen.add(n)
      return true
    })
  }, [customFirmNames])

  const plans = useMemo(() => (firmName ? planChoices(firmName) : []), [firmName])

  // Les programmes dépendent de la TAILLE autant que de la firme : Apex ne vend
  // plus que du legacy en 75K, FundedNext n'a que Flex en 150K.
  const programs = useMemo(() => programChoices(firmName, plan), [firmName, plan])

  // Changer de firme invalide le plan : les tailles ne sont pas les mêmes d'une
  // firme à l'autre, et garder l'ancien choix produirait des défauts faux.
  useEffect(() => { setPlan(null); setProgram(null); setForm(null) }, [firmName])

  const STEPS = useMemo(
    () => BASE_STEPS.filter(sp => sp !== 'program' || programs.length > 1),
    [programs.length]
  )

  function pickPlan(p) {
    setPlan(p)
    // Une seule offre à cette taille : on la retient sans rien demander.
    const list = programChoices(firmName, p)
    if (list.length > 1) { setProgram(null); setStep('program'); return }
    const only = list[0]?.program || null
    setProgram(only)
    setForm(buildAccountForm(firmName, p, {}, only))
    setStep('details')
  }

  function pickProgram(prog) {
    setProgram(prog)
    setForm(buildAccountForm(firmName, plan, {}, prog))
    setStep('details')
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const existingFirm = firms.find(f => f.name === firmName) || null
  const canSubmit = form?.buyDate && !busy

  function submit() {
    if (!canSubmit) return
    onSubmit({ firmName, existingFirmId: existingFirm?.id || null, form })
  }

  const idx = STEPS.indexOf(step)

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 520, background: 'var(--overlay)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '6vh 12px 12px', overflowY: 'auto',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-label={t('app.wizard.title')}
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{
          ...S.panel, width: 620, maxWidth: '100%', padding: '26px 28px 24px',
          boxShadow: 'var(--shadow-pop)', display: 'flex', flexDirection: 'column', gap: 18,
        }}
      >
        <Header t={t} idx={idx} total={STEPS.length} step={step} firmName={firmName}
                plan={plan} program={program}
                onBack={() => setStep(STEPS[idx - 1])} onClose={onCancel} />

        {step === 'firm' && (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: 10,
            }}>
              {knownFirms.map(name => {
                const on = firmName === name
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => { setFirmName(name); setStep('plan') }}
                    title={name}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      padding: '14px 8px', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit',
                      background: on ? 'var(--blue-bg)' : 'var(--tint1)',
                      border: `1px solid ${on ? 'var(--blue-light)' : 'var(--border2)'}`,
                    }}
                  >
                    {getFirmLogo(name, FIRM_SUGGESTION_COLORS[name] || 'var(--blue-light)', 36)}
                    <span style={{
                      fontSize: 11, fontWeight: 500, color: 'var(--text2)', textAlign: 'center',
                      lineHeight: 1.2, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{name}</span>
                  </button>
                )
              })}
            </div>

            <div>
              <label style={S.label} htmlFor="wiz-custom-firm">{t('app.wizard.otherFirm')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="wiz-custom-firm"
                  ref={customInput}
                  value={knownFirms.includes(firmName) ? '' : firmName}
                  onChange={e => setFirmName(e.target.value)}
                  placeholder={t('app.wizard.otherFirmPlaceholder')}
                  style={{ ...S.input, flex: 1 }}
                  onKeyDown={e => { if (e.key === 'Enter' && firmName.trim()) setStep('plan') }}
                />
                <button
                  onClick={() => firmName.trim() && setStep('plan')}
                  disabled={!firmName.trim()}
                  style={{ ...S.btnPrimary, opacity: firmName.trim() ? 1 : 0.5 }}
                >{t('app.wizard.next')}</button>
              </div>
            </div>
          </>
        )}

        {step === 'plan' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0, lineHeight: 1.5 }}>
              {t('app.wizard.planHint')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {plans.map(p => <PlanCard key={p.plan} p={p} t={t} onPick={() => pickPlan(p.plan)} />)}
            </div>
          </>
        )}

        {step === 'program' && (
          <>
            <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0, lineHeight: 1.5 }}>
              {t('app.wizard.programHint')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {programs.map(pr => (
                <ProgramCard key={pr.program} p={pr} t={t} onPick={() => pickProgram(pr.program)} />
              ))}
            </div>
          </>
        )}

        {step === 'details' && form && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label={t('app.acctModal.buyDate')} S={S}>
                <input type="date" value={form.buyDate} onChange={e => set('buyDate', e.target.value)} style={S.input} />
              </Field>
              <Field label={t('app.wizard.pricePaid')} S={S}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="number" value={form.spent} onChange={e => set('spent', e.target.value)}
                         placeholder="0" style={{ ...S.input, flex: 1 }} />
                  <select value={form.currency} onChange={e => set('currency', e.target.value)}
                          style={{ ...S.input, width: 84 }}>
                    <option>USD</option><option>EUR</option><option>GBP</option><option>CHF</option>
                  </select>
                </div>
              </Field>
              <Field label={t('app.acctModal.status')} S={S} full>
                <Segmented
                  value={form.status}
                  onChange={v => set('status', v)}
                  options={[
                    { v: 'Challenge', l: 'Challenge' },
                    { v: 'Financé', l: t('app.wizard.statusFunded') },
                  ]}
                />
              </Field>
              <Field label={t('app.acctModal.paymentMode')} S={S} full>
                <Segmented
                  value={form.paymentMode}
                  onChange={v => set('paymentMode', v)}
                  options={[
                    { v: 'monthly', l: t('app.acctModal.monthly') },
                    { v: 'onetime', l: t('app.acctModal.onetime') },
                  ]}
                />
              </Field>
            </div>

            <button
              onClick={() => setAdvanced(a => !a)}
              aria-expanded={advanced}
              style={{
                alignSelf: 'flex-start', background: 'transparent', border: 'none', padding: 0,
                color: 'var(--text3)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span aria-hidden="true" style={{ transform: advanced ? 'rotate(90deg)' : 'none', transition: 'transform .18s' }}>›</span>
              {t('app.wizard.advanced')}
            </button>

            {advanced && (
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                padding: '16px', borderRadius: 'var(--radius)',
                background: 'var(--tint1)', border: '1px solid var(--border2)',
              }}>
                <Field label={t('app.acctModal.nameOptional')} S={S} full>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                         placeholder={t('app.acctModal.namePlaceholderNew')} style={S.input} />
                </Field>
                <Field label={t('app.acctModal.quantity')} S={S}>
                  <input type="number" min="1" value={form.quantity}
                         onChange={e => set('quantity', e.target.value)} style={S.input} />
                </Field>
                <Field label={t('app.acctModal.payoutTarget')} S={S}>
                  <input type="number" value={form.payoutTarget}
                         onChange={e => set('payoutTarget', e.target.value)} style={S.input} />
                </Field>
                <Field label={t('app.acctModal.minTradingDays')} S={S}>
                  <input type="number" value={form.minTradingDays}
                         onChange={e => set('minTradingDays', e.target.value)} style={S.input} />
                </Field>
                <Field label={t('app.acctModal.profitSplit')} S={S}>
                  <input type="number" value={form.profitSplit}
                         onChange={e => set('profitSplit', e.target.value)} style={S.input} />
                </Field>
                <Field label={t('app.acctModal.customDrawdown')} S={S} full>
                  <input type="number" value={form.customDrawdown}
                         onChange={e => set('customDrawdown', e.target.value)}
                         placeholder={t('app.acctModal.customDrawdownPlaceholder')} style={S.input} />
                </Field>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
              <span style={{ marginRight: 'auto', fontSize: 12, color: 'var(--text3)' }}>
                {t('app.wizard.recap').replace('{firm}', firmName).replace('{plan}', String(plan || '').toUpperCase())}
              </span>
              <button onClick={onCancel} style={S.btnGhost}>{t('app.firmModal.cancel')}</button>
              <button onClick={submit} disabled={!canSubmit}
                      style={{ ...S.btnPrimary, opacity: canSubmit ? 1 : 0.5 }}>
                {busy ? t('app.wizard.creating') : t('app.wizard.create')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Pièces ──────────────────────────────────────────────────────────────────
function Header({ t, idx, total, step, firmName, plan, program, onBack, onClose }) {
  const titles = {
    firm: t('app.wizard.stepFirm'),
    plan: t('app.wizard.stepPlan'),
    program: t('app.wizard.stepProgram'),
    details: t('app.wizard.stepDetails'),
  }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      {idx > 0 && (
        <button onClick={onBack} aria-label={t('app.wizard.back')}
                style={{
                  width: 30, height: 30, borderRadius: 'var(--radius)', flexShrink: 0,
                  border: '1px solid var(--border2)', background: 'var(--tint1)',
                  color: 'var(--text2)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                }}>‹</button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text3)' }}>
          {t('app.wizard.stepOf').replace('{n}', idx + 1).replace('{total}', total)}
          {firmName && step !== 'firm' ? ` · ${firmName}` : ''}
          {plan && step === 'details' ? ` · ${String(plan).toUpperCase()}` : ''}
          {program && step === 'details' ? ` · ${program}` : ''}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: '4px 0 0', letterSpacing: '-.01em' }}>
          {titles[step]}
        </h3>
      </div>
      <button onClick={onClose} aria-label={t('app.widgets.close')}
              style={{
                width: 30, height: 30, borderRadius: 'var(--radius)', flexShrink: 0,
                border: '1px solid var(--border2)', background: 'var(--tint1)',
                color: 'var(--text2)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
              }}>✕</button>
    </div>
  )
}

// Une carte de plan montre ce que l'app sait. Une valeur inconnue n'apparaît
// pas : afficher « — » quatre fois ferait douter de toutes les autres.
function PlanCard({ p, t, onPick }) {
  const facts = [
    p.price != null && `${p.price} $`,
    p.maxDrawdown != null && `${t('app.wizard.dd')} ${p.maxDrawdown.toLocaleString()} $`,
    p.payoutTarget != null && `${t('app.wizard.target')} ${p.payoutTarget.toLocaleString()} $`,
    `${p.profitSplit} %`,
  ].filter(Boolean)

  return (
    <button
      onClick={onPick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        padding: '14px 16px', borderRadius: 'var(--radius)', cursor: 'pointer',
        background: 'var(--tint1)', border: '1px solid var(--border2)',
        fontFamily: 'inherit', textAlign: 'left', color: 'var(--text)',
      }}
    >
      <span style={{
        fontSize: 15, fontWeight: 700, letterSpacing: '-.01em', minWidth: 56,
        fontVariantNumeric: 'tabular-nums',
      }}>{String(p.plan).toUpperCase()}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--text3)' }}>
        {facts.join(' · ')}
      </span>
      <span aria-hidden="true" style={{ color: 'var(--text3)', fontSize: 15 }}>›</span>
    </button>
  )
}

// Même anatomie que PlanCard : le nom à gauche, ce qui CHANGE entre programmes
// au milieu. C'est le drawdown et le prix qui décident, pas le nom du produit.
function ProgramCard({ p, t, onPick }) {
  const facts = [
    p.price != null && `${p.price} $`,
    p.maxDrawdown != null && `${t('app.wizard.dd')} ${p.maxDrawdown.toLocaleString()} $`,
    p.payoutTarget != null && `${t('app.wizard.target')} ${p.payoutTarget.toLocaleString()} $`,
    `${p.profitSplit} %`,
  ].filter(Boolean)

  return (
    <button
      onClick={onPick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        padding: '14px 16px', borderRadius: 'var(--radius)', cursor: 'pointer',
        background: 'var(--tint1)', border: '1px solid var(--border2)',
        fontFamily: 'inherit', textAlign: 'left', color: 'var(--text)',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-.01em', minWidth: 96 }}>
        {p.program}
      </span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--text3)' }}>
        {facts.join(' · ')}
      </span>
      <span aria-hidden="true" style={{ color: 'var(--text3)', fontSize: 15 }}>›</span>
    </button>
  )
}

function Field({ label, children, S, full = false }) {
  return (
    <div style={full ? { gridColumn: '1/-1' } : undefined}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  )
}

function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 3, padding: 3, background: 'var(--tint1)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)' }}>
      {options.map(o => {
        const on = value === o.v
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            aria-pressed={on}
            style={{
              flex: 1, minHeight: 32, padding: '7px 10px', fontSize: 12.5, fontWeight: 600,
              borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', border: 'none',
              background: on ? 'var(--blue)' : 'transparent',
              color: on ? 'var(--text-inverse)' : 'var(--text2)',
            }}
          >{o.l}</button>
        )
      })}
    </div>
  )
}
