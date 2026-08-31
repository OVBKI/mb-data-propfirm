'use client'
// components/TradeEntryModal.js
// Modal standalone pour créer / éditer / supprimer un trade.
//
// ⚠️ Utilisé par TradesPage UNIQUEMENT. JournalPage (vue calendrier) a sa PROPRE
// copie du formulaire, en ligne dans le composant — l'en-tête affirmait
// l'inverse, ce qui a fait croire qu'ajouter la réplication ici la mettait aussi
// sur la page où l'on saisit au quotidien. Toute évolution du formulaire doit
// être portée DANS LES DEUX, ou les deux doivent être fusionnés.
//
// USAGE :
//   <TradeEntryModal
//     open={!!editing}
//     entry={editing?.entry}                // null/undefined = nouveau trade
//     defaultDate={editing?.defaultDate}    // pré-remplir la date (ex: clic sur un jour calendrier)
//     defaultAccountId={editing?.defaultAccountId}
//     firms={firms}
//     user={user}
//     onClose={() => setEditing(null)}
//     onSaved={async () => { await reloadEntries() }}
//     onLightbox={url => setLightboxUrl(url)}
//     showToast={showToast}
//   />
//
// Pour ouvrir en mode ÉDIT : passer `entry` (l'objet journal_entry de Supabase).
// Pour ouvrir en mode CRÉATION : passer `entry=null` + éventuellement defaultDate / defaultAccountId.

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import { planLimitMessage } from '../lib/planLimits'
import { uploadFile } from '../lib/uploadFile'
import { accountLabel } from '../lib/constants'
import { computeRMultiple, computeRiskReward, formatR, formatRR } from '../lib/tradeMath'
import {
  replicationTargets, countTargets, allTargetIds, pruneSelection, buildReplicaPayloads,
} from '../lib/tradeReplication'
import TagSelector from './TagSelector'
import { useT, useLanguage } from './LanguageProvider'
import { useDialog } from './useDialog'

// Styles cosmic dark (cohérents avec JournalPage)
const card = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'10px', boxShadow:'0 1px 0 var(--tint1) inset, 0 8px 24px rgba(0,0,0,0.15)' }
const inputS = { width:'100%', padding:'10px 12px', fontSize:'13px', border:'1px solid var(--hairline)', borderRadius:'8px', background:'var(--tint1)', color:'var(--text)', outline:'none', transition:'border-color 0.2s, background 0.2s', fontFamily:'inherit' }
const labelS = { fontSize:'10.5px', fontWeight:'600', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:'6px' }
const btnPrimary = { padding:'9px 18px', fontSize:'12.5px', fontWeight:'500', background:'var(--text)', color:'var(--text-inverse)', border:'1px solid transparent', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.005em', boxShadow:'0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)' }
const btnGhost = { padding:'8px 14px', fontSize:'12px', fontWeight:'500', background:'var(--tint1)', border:'1px solid var(--hairline)', color:'var(--text2)', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.005em' }

const todayISO = () => new Date().toISOString().slice(0, 10)

// Helpers pour le champ traded_at (heure exacte du trade, optionnel)
// Format saisie : "HH:MM" (input type="time"). Stocké en DB : timestamptz.
function tradedAtToTime(tradedAt) {
  if (!tradedAt) return ''
  try {
    const d = new Date(tradedAt)
    if (isNaN(d.getTime())) return ''
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  } catch { return '' }
}
function buildTradedAt(date, time) {
  if (!date) return null
  // Format ISO : YYYY-MM-DDTHH:MM:00 — Postgres l'interprète avec timezone serveur
  const timeStr = time && /^\d{2}:\d{2}$/.test(time) ? `${time}:00` : '12:00:00'
  return `${date}T${timeStr}`
}

// Form vide par défaut
const EMPTY_FORM = {
  accountId: '', date: todayISO(), time: '', pnl: '', instrument: '', side: '', notes: '',
  entryPrice: '', exitPrice: '', stopLoss: '', takeProfit: '', screenshotUrl: '',
  tags: [],
  commissions: '', slippage: '',
}

// Un trade porte-t-il autre chose que le strict minimum (compte, date, P&L) ?
// Sert a decider si la section « details » s'ouvre d'emblee en edition.
export function hasDetails(f) {
  return Boolean(
    f.instrument || f.side || f.notes || f.screenshotUrl ||
    f.entryPrice || f.exitPrice || f.stopLoss || f.takeProfit ||
    f.commissions || f.slippage || (f.tags && f.tags.length)
  )
}

// Convertit une entry Supabase → form state
function entryToForm(e) {
  return {
    accountId:   e.account_id,
    date:        e.date,
    time:        tradedAtToTime(e.traded_at),
    pnl:         String(e.pnl ?? ''),
    instrument:  e.instrument || '',
    side:        e.side || '',
    notes:       e.notes || '',
    entryPrice:  e.entry_price != null ? String(e.entry_price) : '',
    exitPrice:   e.exit_price  != null ? String(e.exit_price)  : '',
    stopLoss:    e.stop_loss   != null ? String(e.stop_loss)   : '',
    takeProfit:  e.take_profit != null ? String(e.take_profit) : '',
    screenshotUrl: e.screenshot_url || '',
    tags:        Array.isArray(e.tags) ? e.tags : [],
    commissions: e.commissions != null && Number(e.commissions) !== 0 ? String(e.commissions) : '',
    slippage:    e.slippage    != null && Number(e.slippage)    !== 0 ? String(e.slippage)    : '',
  }
}

export default function TradeEntryModal({
  open,
  entry,
  defaultDate,
  defaultAccountId,
  firms = [],
  user,
  onClose,
  onSaved,
  onLightbox,
  showToast,
}) {
  const t = useT()
  const { locale } = useLanguage()
  const dialogRef = useDialog({ open, onClose })
  const [form, setForm] = useState(EMPTY_FORM)
  // Replie par defaut sur un nouveau trade ; deplie en edition si le trade en
  // porte deja, sinon l'utilisateur croirait ses donnees perdues.
  const [details, setDetails] = useState(false)
  const [uploadingScreen, setUploadingScreen] = useState(false)
  const [saving, setSaving] = useState(false)
  // Comptes sur lesquels répliquer le trade. Le même résultat sur trois comptes
  // financés se saisissait jusqu'ici trois fois — et c'est dans cette répétition
  // que les écarts se glissent.
  const [replicaIds, setReplicaIds] = useState([])
  const [replicaOpen, setReplicaOpen] = useState(false)

  // Initialise / réinitialise le form quand le modal s'ouvre
  useEffect(() => {
    if (!open) return
    // ⚠️ La sélection ne survit JAMAIS à une réouverture. Un modal rouvert sur
    // un autre trade avec des cases encore cochées écrirait en silence sur des
    // comptes que l'utilisateur croyait avoir laissés derrière lui.
    setReplicaIds([])
    setReplicaOpen(false)
    if (entry) {
      const f = entryToForm(entry)
      setForm(f)
      setDetails(hasDetails(f))
    } else {
      setDetails(false)
      // Mode nouveau trade : pré-remplir compte (1er actif) + date
      const firstAcctId = defaultAccountId
        || (firms[0]?.accounts || []).find(a => a.status !== 'Échoué')?.id
        || (firms[0]?.accounts || [])[0]?.id
        || ''
      setForm({
        ...EMPTY_FORM,
        accountId: firstAcctId,
        date: defaultDate || todayISO(),
      })
    }
  }, [open, entry, defaultDate, defaultAccountId, firms])

  // Les comptes vers lesquels on peut répliquer — tout sauf le compte courant
  // et les comptes échoués. `accountLabel` est passé en argument : le module de
  // réplication ne dépend de rien, c'est ce qui le rend testable hors navigateur.
  const targetGroups = useMemo(
    () => replicationTargets(firms, form.accountId, accountLabel),
    [firms, form.accountId]
  )

  // Changer de compte principal peut rendre une case cochée invalide — au pire
  // la faire pointer sur le compte courant, ce qui créerait le doublon exact
  // que l'exclusion cherche à éviter.
  useEffect(() => {
    setReplicaIds(prev => {
      const next = pruneSelection(prev, targetGroups)
      return next.length === prev.length ? prev : next
    })
  }, [targetGroups])

  if (!open) return null

  async function handleScreenshotUpload(file) {
    if (!file || !user?.id) return
    setUploadingScreen(true)
    const { url, error } = await uploadFile({ bucket: 'trade-screenshots', file, userId: user.id })
    setUploadingScreen(false)
    if (error) {
      alert(error)
      showToast?.(t('app.trade.toastUploadFailed'))
      return
    }
    setForm(p => ({ ...p, screenshotUrl: url }))
    showToast?.(t('app.trade.toastScreenshotAdded'))
  }

  async function saveEntry() {
    if (!form.accountId) { showToast?.(t('app.trade.toastSelectAccount')); return }
    if (!form.date) { showToast?.(t('app.trade.toastDateRequired')); return }
    if (form.pnl === '' || isNaN(parseFloat(form.pnl))) { showToast?.(t('app.trade.toastPnlRequired')); return }
    const numOrNull = s => s === '' || s == null ? null : (isNaN(parseFloat(s)) ? null : parseFloat(s))
    const payload = {
      user_id: user.id,
      account_id: form.accountId,
      date: form.date,
      // Timestamp précis pour heatmaps (date + heure, midi si time non saisi)
      traded_at: buildTradedAt(form.date, form.time),
      pnl: parseFloat(form.pnl),
      instrument: form.instrument.trim(),
      side: form.side,
      notes: form.notes.trim(),
      entry_price:    numOrNull(form.entryPrice),
      exit_price:     numOrNull(form.exitPrice),
      stop_loss:      numOrNull(form.stopLoss),
      take_profit:    numOrNull(form.takeProfit),
      screenshot_url: form.screenshotUrl || null,
      tags: Array.isArray(form.tags) && form.tags.length > 0 ? form.tags : null,
      // Commissions & slippage en montant absolu positif (coûts payés)
      commissions: Math.abs(parseFloat(form.commissions) || 0) || 0,
      slippage:    Math.abs(parseFloat(form.slippage)    || 0) || 0,
    }
    setSaving(true)
    let res
    if (entry) {
      res = await supabase.from('journal_entries').update(payload).eq('id', entry.id)
    } else {
      // ⚠️ UN SEUL appel, avec un tableau de lignes. Un INSERT multi-lignes est
      // ATOMIQUE en Postgres : si le trigger de quota refuse la troisième copie,
      // aucune n'est écrite. Boucler sur des insert() séparés laisserait au
      // contraire un journal à moitié rempli, sans rien pour le signaler.
      const rows = [payload, ...buildReplicaPayloads(payload, replicaIds)]
      res = await supabase.from('journal_entries').insert(rows)
    }
    setSaving(false)
    if (res.error) {
      console.error('[trade save]', res.error)
      // Quota de palier refusé par le trigger Postgres → phrase lisible.
      const msg = planLimitMessage(res.error, locale)
        || (res.error.code === '42P01' || /does not exist/i.test(res.error.message || '')
          ? t('app.trade.toastTableMissing')
          : (res.error.message || t('app.trade.toastSaveError')))
      showToast?.(msg)
      return
    }
    const n = replicaIds.length + 1
    showToast?.(
      entry ? t('app.trade.toastModified')
        : n > 1 ? t('app.trade.toastReplicated').replace('{n}', n)
          : t('app.trade.toastAdded')
    )
    onClose?.()
    await onSaved?.()
  }

  // Duplication d'un trade DÉJÀ enregistré vers d'autres comptes.
  //
  // Distincte de « Enregistrer » à dessein : on copie ce qui est À L'ÉCRAN, pas
  // ce qui est en base, et on ne touche PAS au trade d'origine. Fusionner les
  // deux actions rendrait le bouton ambigu — « est-ce que ça enregistre aussi
  // mes modifications ? » — sur une opération qui écrit plusieurs lignes.
  async function duplicateToAccounts() {
    if (replicaIds.length === 0) return
    if (!form.date) { showToast?.(t('app.trade.toastDateRequired')); return }
    if (form.pnl === '' || isNaN(parseFloat(form.pnl))) { showToast?.(t('app.trade.toastPnlRequired')); return }
    const numOrNull = s => s === '' || s == null ? null : (isNaN(parseFloat(s)) ? null : parseFloat(s))
    const base = {
      user_id: user.id,
      account_id: form.accountId,
      date: form.date,
      traded_at: buildTradedAt(form.date, form.time),
      pnl: parseFloat(form.pnl),
      instrument: form.instrument.trim(),
      side: form.side,
      notes: form.notes.trim(),
      entry_price:    numOrNull(form.entryPrice),
      exit_price:     numOrNull(form.exitPrice),
      stop_loss:      numOrNull(form.stopLoss),
      take_profit:    numOrNull(form.takeProfit),
      screenshot_url: form.screenshotUrl || null,
      tags: Array.isArray(form.tags) && form.tags.length > 0 ? form.tags : null,
      commissions: Math.abs(parseFloat(form.commissions) || 0) || 0,
      slippage:    Math.abs(parseFloat(form.slippage)    || 0) || 0,
    }
    const rows = buildReplicaPayloads(base, replicaIds)
    if (rows.length === 0) return
    setSaving(true)
    const { error } = await supabase.from('journal_entries').insert(rows)
    setSaving(false)
    if (error) {
      console.error('[trade duplicate]', error)
      // L'insert étant atomique, un échec veut dire zéro ligne écrite — le dire
      // évite que l'utilisateur aille vérifier compte par compte.
      showToast?.(planLimitMessage(error, locale) || t('app.trade.toastReplicateError'))
      return
    }
    showToast?.(t('app.trade.toastDuplicated').replace('{n}', rows.length))
    onClose?.()
    await onSaved?.()
  }

  async function deleteEntry() {
    if (!entry) return
    if (!confirm(t('app.trade.confirmDelete'))) return
    const { error } = await supabase.from('journal_entries').delete().eq('id', entry.id)
    if (error) { showToast?.(t('app.trade.toastDeleteError')); return }
    showToast?.(t('app.trade.toastDeleted'))
    onClose?.()
    await onSaved?.()
  }

  return (
    <div
      className="qt-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)', zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px', overflowY: 'auto',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-label={entry ? t('app.trade.modalEditTitle') : t('app.trade.modalNewTitle')}
        className="modal qt-modal-content"
        onClick={e => e.stopPropagation()}
        style={{ ...card, padding: '28px', width: '560px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
      >
        <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '20px' }}>
          {entry ? t('app.trade.modalEditTitle') : t('app.trade.modalNewTitle')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Compte */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelS}>{t('app.trade.fieldAccount')}</label>
            <select
              value={form.accountId}
              onChange={e => setForm(p => ({ ...p, accountId: e.target.value }))}
              style={inputS}
            >
              <option value="">{t('app.trade.selectAccount')}</option>
              {firms.map(f => (
                <optgroup key={f.id} label={f.name}>
                  {(f.accounts || []).filter(a => a.status !== 'Échoué').map(a => (
                    <option key={a.id} value={a.id}>
                      {f.name} · {accountLabel(a)} ({a.status})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Réplication multi-comptes — masquée s'il n'y a nulle part où
              répliquer, sinon c'est une section vide qui pose une question
              sans réponse possible. */}
          {countTargets(targetGroups) > 0 && (
            <div style={{ gridColumn: '1/-1' }}>
              <button
                type="button"
                onClick={() => setReplicaOpen(o => !o)}
                aria-expanded={replicaOpen}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '9px 12px', background: 'var(--tint1)',
                  border: '1px solid var(--hairline)', borderRadius: 8,
                  color: 'var(--text2)', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  minHeight: 32,
                }}
              >
                <span aria-hidden="true" style={{ color: 'var(--text3)' }}>{replicaOpen ? '▾' : '▸'}</span>
                <span>{t('app.trade.replicateTitle')}</span>
                {replicaIds.length > 0 && (
                  <span style={{
                    marginLeft: 'auto', padding: '2px 8px', borderRadius: 999,
                    background: 'var(--blue-bg)', color: 'var(--blue-text)',
                    fontSize: 11, fontWeight: 600,
                  }}>
                    {t('app.trade.replicateSelected').replace('{n}', replicaIds.length)}
                  </span>
                )}
              </button>

              {replicaOpen && (
                <div style={{
                  marginTop: 8, padding: '10px 12px', background: 'var(--surface2)',
                  border: '1px solid var(--hairline)', borderRadius: 8,
                }}>
                  <p style={{ fontSize: 11.5, color: 'var(--text3)', margin: '0 0 10px', lineHeight: 1.5 }}>
                    {entry ? t('app.trade.replicateHintEdit') : t('app.trade.replicateHint')}
                  </p>

                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <button
                      type="button"
                      onClick={() => setReplicaIds(allTargetIds(targetGroups))}
                      style={{ ...btnGhost, padding: '5px 10px', fontSize: 11, minHeight: 32 }}
                    >{t('app.trade.replicateAll')}</button>
                    <button
                      type="button"
                      onClick={() => setReplicaIds([])}
                      style={{ ...btnGhost, padding: '5px 10px', fontSize: 11, minHeight: 32 }}
                    >{t('app.trade.replicateNone')}</button>
                  </div>

                  <div style={{ display: 'grid', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
                    {targetGroups.map(g => (
                      <fieldset key={g.firmId} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                        {/* Le nom de firme est une LÉGENDE, pas un titre décoratif :
                            deux comptes peuvent porter le même libellé chez deux
                            firmes différentes, et un lecteur d'écran doit pouvoir
                            les distinguer. */}
                        <legend style={{ ...labelS, marginBottom: 6, padding: 0 }}>{g.firmName}</legend>
                        {g.accounts.map(a => {
                          const checked = replicaIds.includes(a.id)
                          return (
                            <label
                              key={a.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '6px 4px', cursor: 'pointer',
                                fontSize: 12.5, color: 'var(--text)', minHeight: 32,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setReplicaIds(prev => (
                                  prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id]
                                ))}
                                style={{ width: 15, height: 15, accentColor: 'var(--blue)', cursor: 'pointer' }}
                              />
                              <span>{a.label}</span>
                              {a.status && (
                                <span style={{ color: 'var(--text3)', fontSize: 11 }}>· {a.status}</span>
                              )}
                            </label>
                          )
                        })}
                      </fieldset>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date + Time (sub-grid) */}
          <div>
            <label style={labelS}>{t('app.trade.fieldDate')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 8 }}>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                style={inputS}
              />
              <input
                type="time"
                value={form.time}
                onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                placeholder="--:--"
                title={t('app.trade.timeTitle')}
                style={inputS}
              />
            </div>
          </div>
          <div>
            <label style={labelS}>{t('app.trade.fieldPnL')}</label>
            <input
              type="number" step="0.01"
              value={form.pnl}
              onChange={e => setForm(p => ({ ...p, pnl: e.target.value }))}
              placeholder={t('app.trade.pnlPlaceholder')}
              style={inputS}
              autoFocus
            />
          </div>

          {/* Le trade minimum, c'est compte + date + P&L. Tout ce qui suit est de
              l'ENRICHISSEMENT : prix, R-multiple, tags, capture, notes. Les
              afficher d'emblee faisait de la saisie d'un trade un formulaire de
              quatorze champs, alors que trois suffisent a ce qu'il existe. */}
          <div style={{ gridColumn: '1/-1' }}>
            <button
              type="button"
              onClick={() => setDetails(d => !d)}
              aria-expanded={details}
              style={{
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '12.5px', color: 'var(--text3)',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <span aria-hidden="true" style={{ transform: details ? 'rotate(90deg)' : 'none', transition: 'transform .18s' }}>{'\u203A'}</span>
              {details ? t('app.trade.hideDetails') : t('app.trade.addDetails')}
            </button>
          </div>

          {details && (<>
          {/* Instrument + Side */}
          <div>
            <label style={labelS}>{t('app.trade.fieldInstrument')}</label>
            <input
              list="instrSuggModal"
              value={form.instrument}
              onChange={e => setForm(p => ({ ...p, instrument: e.target.value }))}
              placeholder="ES, NQ, MNQ, MES, GC..."
              style={inputS}
            />
            <datalist id="instrSuggModal">
              {['ES','NQ','MNQ','MES','RTY','M2K','YM','MYM','GC','MGC','SI','CL','MCL','NG','6E','6B','6J','BTC','MBT']
                .map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label style={labelS}>{t('app.trade.fieldSide')}</label>
            <select
              value={form.side}
              onChange={e => setForm(p => ({ ...p, side: e.target.value }))}
              style={inputS}
            >
              <option value="">—</option>
              <option value="Long">{t('app.trade.sideLong')}</option>
              <option value="Short">{t('app.trade.sideShort')}</option>
            </select>
          </div>

          {/* Détails approfondis */}
          <div style={{ gridColumn: '1/-1', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              {t('app.trade.sectionDetails')}
            </div>
          </div>
          <div>
            <label style={labelS}>{t('app.trade.fieldEntry')}</label>
            <input type="number" step="0.0001" value={form.entryPrice} onChange={e => setForm(p => ({ ...p, entryPrice: e.target.value }))} placeholder={t('app.trade.entryPlaceholder')} style={inputS} />
          </div>
          <div>
            <label style={labelS}>{t('app.trade.fieldExit')}</label>
            <input type="number" step="0.0001" value={form.exitPrice} onChange={e => setForm(p => ({ ...p, exitPrice: e.target.value }))} placeholder={t('app.trade.exitPlaceholder')} style={inputS} />
          </div>
          <div>
            <label style={labelS}>{t('app.trade.fieldStop')}</label>
            <input type="number" step="0.0001" value={form.stopLoss} onChange={e => setForm(p => ({ ...p, stopLoss: e.target.value }))} placeholder={t('app.trade.stopPlaceholder')} style={inputS} />
          </div>
          <div>
            <label style={labelS}>{t('app.trade.fieldTP')}</label>
            <input type="number" step="0.0001" value={form.takeProfit} onChange={e => setForm(p => ({ ...p, takeProfit: e.target.value }))} placeholder={t('app.trade.tpPlaceholder')} style={inputS} />
          </div>

          {/* Commissions / Slippage */}
          <div>
            <label style={labelS}>{t('app.trade.fieldCommissions')}</label>
            <input type="number" step="0.01" min="0" value={form.commissions} onChange={e => setForm(p => ({ ...p, commissions: e.target.value }))} placeholder={t('app.trade.commPlaceholder')} style={inputS} />
          </div>
          <div>
            <label style={labelS}>{t('app.trade.fieldSlippage')}</label>
            <input type="number" step="0.01" min="0" value={form.slippage} onChange={e => setForm(p => ({ ...p, slippage: e.target.value }))} placeholder={t('app.trade.slippagePlaceholder')} style={inputS} />
          </div>

          {/* Aperçu Gross PnL si commissions/slippage renseignés */}
          {(() => {
            const comm = Math.abs(parseFloat(form.commissions) || 0)
            const slip = Math.abs(parseFloat(form.slippage)    || 0)
            const net  = parseFloat(form.pnl)
            if ((comm <= 0 && slip <= 0) || !Number.isFinite(net)) return null
            const gross = net + comm + slip
            return (
              <div style={{ gridColumn: '1/-1', marginTop: 0, padding: '8px 12px', background: 'var(--tint1)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', fontSize: 11, color: 'var(--text3)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: 9 }}>
                  {t('app.trade.decomposition')}
                </span>
                <span>{t('app.trade.grossLabel')} : <strong style={{ color: gross >= 0 ? 'var(--green)' : 'var(--red)' }}>{(gross >= 0 ? '+' : '') + gross.toFixed(2)} $</strong></span>
                {comm > 0 && <span>{t('app.trade.minusComm')} : <strong style={{ color: 'var(--red)' }}>{comm.toFixed(2)} $</strong></span>}
                {slip > 0 && <span>{t('app.trade.minusSlip')} : <strong style={{ color: 'var(--red)' }}>{slip.toFixed(2)} $</strong></span>}
                <span>{t('app.trade.equalsNet')} : <strong style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>{(net >= 0 ? '+' : '') + net.toFixed(2)} $</strong></span>
              </div>
            )
          })()}

          {/* Aperçu R-multiple temps réel */}
          {(() => {
            const r = computeRMultiple({ entry: form.entryPrice, exit: form.exitPrice, stop: form.stopLoss, side: form.side, pnl: form.pnl })
            const rr = computeRiskReward({ entry: form.entryPrice, takeProfit: form.takeProfit, stop: form.stopLoss, side: form.side, pnl: form.pnl, exit: form.exitPrice })
            if (r == null && rr == null) return null
            return (
              <div style={{ gridColumn: '1/-1', marginTop: '4px', padding: '10px 14px', background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: '8px', display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ fontWeight: '700', color: 'var(--blue-light)', fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{t('app.trade.preview')}</span>
                {r != null && (
                  <span style={{ color: 'var(--text2)' }}>
                    {t('app.trade.rRealized')} : <strong style={{ color: r >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '13px' }}>{formatR(r)}</strong>
                  </span>
                )}
                {rr != null && (
                  <span style={{ color: 'var(--text2)' }}>
                    {t('app.trade.rrTarget')} : <strong style={{ color: rr >= 2 ? 'var(--green)' : rr >= 1 ? 'var(--amber-text)' : 'var(--red)', fontSize: '13px' }}>{formatRR(rr)}</strong>
                    {rr < 1 && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--red)' }}>{t('app.trade.rrRisky')}</span>}
                    {rr >= 2 && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--green)' }}>{t('app.trade.rrGood')}</span>}
                  </span>
                )}
              </div>
            )
          })()}

          {/* Tags */}
          <div style={{ gridColumn: '1/-1', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              {t('app.trade.sectionTags')}
              <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 'normal', color: 'var(--text3)', fontSize: '10px', marginLeft: '6px' }}>
                {t('app.trade.tagsHint')}
              </span>
            </div>
            <TagSelector value={form.tags} onChange={tags => setForm(p => ({ ...p, tags }))} />
          </div>

          {/* Screenshot */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelS}>{t('app.trade.sectionScreenshot')}</label>
            {form.screenshotUrl ? (
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                  <Image
                    src={form.screenshotUrl}
                    alt="Screenshot trade"
                    fill
                    sizes="560px"
                    onClick={() => onLightbox?.(form.screenshotUrl)}
                    style={{ objectFit: 'cover', borderRadius: '8px', cursor: 'zoom-in', border: '1px solid var(--border)' }}
                  />
                </div>
                <button
                  onClick={() => setForm(p => ({ ...p, screenshotUrl: '' }))}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                >{t('app.trade.removeScreenshot')}</button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--border2)', borderRadius: '8px', cursor: uploadingScreen ? 'wait' : 'pointer', background: 'var(--surface2)', color: 'var(--text2)', fontSize: '12px' }}>
                {uploadingScreen ? t('app.trade.uploading') : t('app.trade.uploadLabel')}
                <input
                  type="file" accept="image/*"
                  disabled={uploadingScreen}
                  onChange={e => handleScreenshotUpload(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          {/* Notes */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelS}>{t('app.trade.fieldNotes')}</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder={t('app.trade.notesPlaceholder')}
              style={{ ...inputS, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          </>)}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <div>
            {entry && (
              <button
                onClick={deleteEntry}
                style={{ ...btnGhost, color: 'var(--red-text)', borderColor: 'var(--red-bg)' }}
              >
                {t('app.trade.btnDelete')}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={btnGhost} disabled={saving}>{t('app.trade.btnCancel')}</button>
            {/* En ÉDITION, dupliquer est une action À PART : elle n'enregistre
                pas les modifications du trade courant. Fusionner les deux
                rendrait le bouton ambigu sur une opération qui écrit plusieurs
                lignes d'un coup. */}
            {entry && replicaIds.length > 0 && (
              <button onClick={duplicateToAccounts} style={btnGhost} disabled={saving}>
                {t('app.trade.btnDuplicate').replace('{n}', replicaIds.length)}
              </button>
            )}
            {/* Le libellé annonce le NOMBRE de comptes touchés. Un « Ajouter »
                muet qui écrit trois lignes serait une surprise. */}
            <button onClick={saveEntry} style={btnPrimary} disabled={saving}>
              {saving ? '...'
                : entry ? t('app.trade.btnSave')
                  : replicaIds.length > 0
                    ? t('app.trade.btnAddMulti').replace('{n}', replicaIds.length + 1)
                    : t('app.trade.btnAdd')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
