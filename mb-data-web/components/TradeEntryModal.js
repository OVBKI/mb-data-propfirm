'use client'
// components/TradeEntryModal.js
// Modal standalone pour créer / éditer / supprimer un trade.
// Utilisé par JournalPage (vue calendrier) ET TradesPage (vue cards).
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

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { uploadFile } from '../lib/uploadFile'
import { accountLabel } from '../lib/constants'
import { computeRMultiple, computeRiskReward, formatR, formatRR } from '../lib/tradeMath'
import TagSelector from './TagSelector'

// Styles cosmic dark (cohérents avec JournalPage)
const card = { background:'var(--surface)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', boxShadow:'0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)' }
const inputS = { width:'100%', padding:'10px 12px', fontSize:'13px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', background:'rgba(255,255,255,0.02)', color:'var(--text)', outline:'none', transition:'border-color 0.2s, background 0.2s', fontFamily:'inherit' }
const labelS = { fontSize:'10.5px', fontWeight:'600', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.12em', display:'block', marginBottom:'6px' }
const btnPrimary = { padding:'9px 18px', fontSize:'12.5px', fontWeight:'500', background:'var(--text)', color:'#0a0c10', border:'1px solid transparent', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.005em', boxShadow:'0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)' }
const btnGhost = { padding:'8px 14px', fontSize:'12px', fontWeight:'500', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.10)', color:'var(--text2)', borderRadius:'8px', cursor:'pointer', fontFamily:'inherit', letterSpacing:'0.005em' }

const todayISO = () => new Date().toISOString().slice(0, 10)

// Form vide par défaut
const EMPTY_FORM = {
  accountId: '', date: todayISO(), pnl: '', instrument: '', side: '', notes: '',
  entryPrice: '', exitPrice: '', stopLoss: '', takeProfit: '', screenshotUrl: '',
  tags: [],
}

// Convertit une entry Supabase → form state
function entryToForm(e) {
  return {
    accountId:   e.account_id,
    date:        e.date,
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
  const [form, setForm] = useState(EMPTY_FORM)
  const [uploadingScreen, setUploadingScreen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Initialise / réinitialise le form quand le modal s'ouvre
  useEffect(() => {
    if (!open) return
    if (entry) {
      setForm(entryToForm(entry))
    } else {
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

  if (!open) return null

  async function handleScreenshotUpload(file) {
    if (!file || !user?.id) return
    setUploadingScreen(true)
    const { url, error } = await uploadFile({ bucket: 'trade-screenshots', file, userId: user.id })
    setUploadingScreen(false)
    if (error) {
      alert(error)
      showToast?.('❌ Upload échoué')
      return
    }
    setForm(p => ({ ...p, screenshotUrl: url }))
    showToast?.('Screenshot ajouté ✓')
  }

  async function saveEntry() {
    if (!form.accountId) { showToast?.('Sélectionne un compte'); return }
    if (!form.date) { showToast?.('Date requise'); return }
    if (form.pnl === '' || isNaN(parseFloat(form.pnl))) { showToast?.('PnL requis (nombre)'); return }
    const numOrNull = s => s === '' || s == null ? null : (isNaN(parseFloat(s)) ? null : parseFloat(s))
    const payload = {
      user_id: user.id,
      account_id: form.accountId,
      date: form.date,
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
    }
    setSaving(true)
    let res
    if (entry) {
      res = await supabase.from('journal_entries').update(payload).eq('id', entry.id)
    } else {
      res = await supabase.from('journal_entries').insert(payload)
    }
    setSaving(false)
    if (res.error) {
      console.error('[trade save]', res.error)
      const msg = res.error.code === '42P01' || /does not exist/i.test(res.error.message || '')
        ? '⚠ Table journal_entries manquante dans Supabase'
        : (res.error.message || 'Erreur enregistrement')
      showToast?.(msg)
      return
    }
    showToast?.(entry ? 'Trade modifié ✓' : 'Trade ajouté ✓')
    onClose?.()
    await onSaved?.()
  }

  async function deleteEntry() {
    if (!entry) return
    if (!confirm('Supprimer ce trade ?')) return
    const { error } = await supabase.from('journal_entries').delete().eq('id', entry.id)
    if (error) { showToast?.('Erreur suppression'); return }
    showToast?.('Trade supprimé')
    onClose?.()
    await onSaved?.()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)', zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px', overflowY: 'auto',
      }}
    >
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ ...card, padding: '28px', width: '560px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
      >
        <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '20px' }}>
          {entry ? 'Modifier le trade' : 'Nouveau trade'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Compte */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelS}>Compte</label>
            <select
              value={form.accountId}
              onChange={e => setForm(p => ({ ...p, accountId: e.target.value }))}
              style={inputS}
            >
              <option value="">— Sélectionner —</option>
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

          {/* Date + PnL */}
          <div>
            <label style={labelS}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              style={inputS}
            />
          </div>
          <div>
            <label style={labelS}>PnL ($)</label>
            <input
              type="number" step="0.01"
              value={form.pnl}
              onChange={e => setForm(p => ({ ...p, pnl: e.target.value }))}
              placeholder="ex : 250  ou  -125"
              style={inputS}
              autoFocus
            />
          </div>

          {/* Instrument + Side */}
          <div>
            <label style={labelS}>Instrument</label>
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
            <label style={labelS}>Side</label>
            <select
              value={form.side}
              onChange={e => setForm(p => ({ ...p, side: e.target.value }))}
              style={inputS}
            >
              <option value="">—</option>
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
          </div>

          {/* Détails approfondis */}
          <div style={{ gridColumn: '1/-1', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              📊 Détails du trade (optionnel)
            </div>
          </div>
          <div>
            <label style={labelS}>Prix d'entrée</label>
            <input type="number" step="0.0001" value={form.entryPrice} onChange={e => setForm(p => ({ ...p, entryPrice: e.target.value }))} placeholder="ex : 5430.25" style={inputS} />
          </div>
          <div>
            <label style={labelS}>Prix de sortie</label>
            <input type="number" step="0.0001" value={form.exitPrice} onChange={e => setForm(p => ({ ...p, exitPrice: e.target.value }))} placeholder="ex : 5435.50" style={inputS} />
          </div>
          <div>
            <label style={labelS}>Stop Loss</label>
            <input type="number" step="0.0001" value={form.stopLoss} onChange={e => setForm(p => ({ ...p, stopLoss: e.target.value }))} placeholder="ex : 5425.00" style={inputS} />
          </div>
          <div>
            <label style={labelS}>Take Profit</label>
            <input type="number" step="0.0001" value={form.takeProfit} onChange={e => setForm(p => ({ ...p, takeProfit: e.target.value }))} placeholder="ex : 5440.00" style={inputS} />
          </div>

          {/* Aperçu R-multiple temps réel */}
          {(() => {
            const r = computeRMultiple({ entry: form.entryPrice, exit: form.exitPrice, stop: form.stopLoss, side: form.side, pnl: form.pnl })
            const rr = computeRiskReward({ entry: form.entryPrice, takeProfit: form.takeProfit, stop: form.stopLoss, side: form.side, pnl: form.pnl, exit: form.exitPrice })
            if (r == null && rr == null) return null
            return (
              <div style={{ gridColumn: '1/-1', marginTop: '4px', padding: '10px 14px', background: 'rgba(45,111,255,0.06)', border: '1px solid rgba(45,111,255,0.20)', borderRadius: '8px', display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ fontWeight: '700', color: 'var(--blue-light)', fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>📐 Aperçu</span>
                {r != null && (
                  <span style={{ color: 'var(--text2)' }}>
                    R réalisé : <strong style={{ color: r >= 0 ? 'var(--green)' : 'var(--red)', fontSize: '13px' }}>{formatR(r)}</strong>
                  </span>
                )}
                {rr != null && (
                  <span style={{ color: 'var(--text2)' }}>
                    R:R visé : <strong style={{ color: rr >= 2 ? 'var(--green)' : rr >= 1 ? 'var(--amber-text)' : 'var(--red)', fontSize: '13px' }}>{formatRR(rr)}</strong>
                    {rr < 1 && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--red)' }}>⚠ setup risqué (R:R &lt; 1)</span>}
                    {rr >= 2 && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--green)' }}>✓ bon setup</span>}
                  </span>
                )}
              </div>
            )
          })()}

          {/* Tags */}
          <div style={{ gridColumn: '1/-1', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              🏷 Tags du trade (optionnel)
              <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 'normal', color: 'var(--text3)', fontSize: '10px', marginLeft: '6px' }}>
                — pour analyser ta psycho &amp; tes setups
              </span>
            </div>
            <TagSelector value={form.tags} onChange={tags => setForm(p => ({ ...p, tags }))} />
          </div>

          {/* Screenshot */}
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelS}>📷 Screenshot du graphique</label>
            {form.screenshotUrl ? (
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <img
                  src={form.screenshotUrl}
                  alt="Screenshot trade"
                  onClick={() => onLightbox?.(form.screenshotUrl)}
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', cursor: 'zoom-in', border: '1px solid var(--border)' }}
                />
                <button
                  onClick={() => setForm(p => ({ ...p, screenshotUrl: '' }))}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                >✕ Retirer</button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', border: '1px dashed var(--border2)', borderRadius: '8px', cursor: uploadingScreen ? 'wait' : 'pointer', background: 'var(--surface2)', color: 'var(--text2)', fontSize: '12px' }}>
                {uploadingScreen ? '⏳ Upload en cours...' : '📤 Cliquer pour uploader (PNG/JPG, max 5 Mo)'}
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
            <label style={labelS}>Notes (setup, émotion, erreur…)</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Optionnel"
              style={{ ...inputS, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <div>
            {entry && (
              <button
                onClick={deleteEntry}
                style={{ ...btnGhost, color: 'var(--red-text)', borderColor: 'var(--red-bg)' }}
              >
                Supprimer
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onClose} style={btnGhost} disabled={saving}>Annuler</button>
            <button onClick={saveEntry} style={btnPrimary} disabled={saving}>
              {saving ? '...' : entry ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
