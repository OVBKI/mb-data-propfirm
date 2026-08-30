'use client'
// components/QuickPayoutDialog.js — enregistrer un payout depuis n'importe où.
//
// Avant, il fallait ouvrir le tiroir de la firme, puis celui du compte, puis
// cliquer « Ajouter un payout » : trois niveaux pour l'événement le plus
// gratifiant de l'app. Celui qu'on a envie de saisir tout de suite est celui
// qui demandait le plus de clics.
//
// Le compte est CHOISI ici, ce qui rend le dialogue utilisable depuis le menu
// « + » comme depuis un widget. Les comptes financés viennent en tête : ce sont
// les seuls qui versent.

import { useMemo, useState } from 'react'
import { useT } from './LanguageProvider'
import { useDialog } from './useDialog'
import { accountLabel } from '../lib/constants'
import { suggestProfitSplit } from '../lib/accountDefaults'

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function QuickPayoutDialog({ firms = [], defaultAccountId = null, S, onCancel, onSubmit, busy = false }) {
  const t = useT()
  const dialogRef = useDialog({ open: true, onClose: onCancel })

  // Un compte échoué ne verse plus rien : le proposer serait une impasse.
  const choices = useMemo(() => {
    const out = []
    for (const f of firms) {
      for (const a of f.accounts || []) {
        if (a.status === 'Échoué') continue
        out.push({ firm: f, acct: a, funded: a.status === 'Financé' })
      }
    }
    return out.sort((x, y) => Number(y.funded) - Number(x.funded))
  }, [firms])

  const [acctId, setAcctId] = useState(defaultAccountId || choices[0]?.acct.id || '')
  const [date, setDate] = useState(todayISO())
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const picked = choices.find(c => c.acct.id === acctId) || null
  // Le partage stocké sur le compte prime ; la suggestion issue des règles n'est
  // qu'un repli, et un compte peut avoir négocié autre chose.
  const split = picked?.acct.profit_split || suggestProfitSplit(picked?.firm.name, picked?.acct.plan_size, picked?.acct.program || null) || 90
  const gross = parseFloat(amount) || 0
  const net = +(gross * (split / 100)).toFixed(2)
  const canSubmit = Boolean(acctId && date && gross > 0 && !busy)

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 520, background: 'var(--overlay)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '10vh 12px 12px', overflowY: 'auto',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-label={t('app.quickPayout.title')}
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ ...S.panel, width: 460, maxWidth: '100%', padding: '24px 26px', boxShadow: 'var(--shadow-pop)' }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px', letterSpacing: '-.01em' }}>
          {t('app.quickPayout.title')}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text3)', margin: '0 0 20px', lineHeight: 1.5 }}>
          {t('app.quickPayout.hint')}
        </p>

        {choices.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text3)', margin: '0 0 20px' }}>{t('app.quickPayout.noAccount')}</p>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={S.label}>{t('app.trade.fieldAccount')}</label>
              <select value={acctId} onChange={e => setAcctId(e.target.value)} style={S.input}>
                {choices.map(c => (
                  <option key={c.acct.id} value={c.acct.id}>
                    {c.firm.name} · {accountLabel(c.acct)} ({c.acct.status})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={S.label}>{t('app.acctDrawer.date')}</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={S.input} />
              </div>
              <div>
                <label style={S.label}>{t('app.acctDrawer.grossRequested')}</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                       placeholder={t('app.acctDrawer.grossPlaceholder')} style={S.input} autoFocus />
              </div>
            </div>

            {/* Ce qui arrive réellement sur le compte bancaire. Saisir le brut et
                voir le net évite la surprise au virement. */}
            {gross > 0 && (
              <div style={{
                padding: '11px 13px', borderRadius: 'var(--radius)',
                background: 'var(--green-bg)', border: '1px solid var(--green)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {t('app.acctDrawer.profitSplitLabel')} {split}/{100 - split}
                </span>
                <strong style={{ fontSize: 15, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
                  {t('app.acctDrawer.netReceived')} {net.toFixed(2)} {picked?.acct.currency || '$'}
                </strong>
              </div>
            )}

            <div>
              <label style={S.label}>{t('app.acctDrawer.note')}</label>
              <input value={note} onChange={e => setNote(e.target.value)}
                     placeholder={t('app.acctDrawer.notePlaceholder')} style={S.input} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 22 }}>
          <button onClick={onCancel} style={S.btnGhost}>{t('app.acctDrawer.cancel')}</button>
          <button
            onClick={() => canSubmit && onSubmit({ acctId, date, amount, note })}
            disabled={!canSubmit}
            style={{ ...S.btnPrimary, opacity: canSubmit ? 1 : 0.5 }}
          >{busy ? t('app.wizard.creating') : t('app.quickPayout.save')}</button>
        </div>
      </div>
    </div>
  )
}
