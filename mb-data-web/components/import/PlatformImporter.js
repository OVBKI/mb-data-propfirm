'use client'
// components/import/PlatformImporter.js — import des trades depuis Tradovate,
// NinjaTrader, TopstepX et MetaTrader (fichier), ou depuis l'API TopstepX.
//
// Étapes : 1. un fichier (ou la connexion API) donne des trades normalisés
// (lib/importers) ; 2. chaque compte du fichier est rattaché à un compte
// Quantara ; 3. simulation par défaut, puis import réel. Le dédoublonnage passe
// par le marqueur [import:<plateforme>:<id>] posé dans les notes : réimporter
// le même fichier n'écrit rien deux fois.

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { accountLabel } from '../../lib/constants'
import { decodeFileBuffer, parsePlatformFile, importMarker, IMPORT_MARKER_RE, PLATFORMS } from '../../lib/importers/detect'
import { T } from '../dashboard/theme'
import { Card, Btn, Badge, Section } from '../dashboard/ui'
import { useT } from '../LanguageProvider'

const FILE_KEY = '__file__'
const usd = (v) => `${v >= 0 ? '+' : '−'}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// Lignes journal_entries d'un trade normalisé.
export function tradeToRow(t, { userId, accountId, platform, withQuantity = true }) {
  const row = {
    user_id: userId,
    account_id: accountId,
    date: t.date,
    traded_at: t.tradedAt || `${t.date}T12:00:00`,
    pnl: t.pnl,
    instrument: t.instrument,
    side: t.side,
    entry_price: t.entryPrice,
    exit_price: t.exitPrice,
    commissions: t.commissions || 0,
    notes: [
      importMarker(platform, t.externalId),
      t.qty != null ? `qty=${t.qty}` : null,
      t.entryTime ? `entry=${t.entryTime.replace('T', ' ')}` : null,
      t.exitTime ? `exit=${t.exitTime.replace('T', ' ')}` : null,
    ].filter(Boolean).join(' '),
  }
  // La colonne `quantity` est entière : un volume en lots (MetaTrader) reste
  // dans les notes.
  if (withQuantity && Number.isInteger(t.qty) && t.qty > 0) row.quantity = t.qty
  return row
}

// Rapprochement automatique d'un compte du fichier avec un compte Quantara :
// même nom, ou nom contenu dans l'identifiant de la plateforme.
function autoMatch(fileAccount, accounts) {
  if (!fileAccount) return accounts.length === 1 ? accounts[0].id : ''
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const f = norm(fileAccount)
  const hit = accounts.filter((a) => {
    const n = norm(a.name)
    return n && (n === f || f.endsWith(n) || n.endsWith(f) || norm(a.rithmic_account_id) === f)
  })
  return hit.length === 1 ? hit[0].id : ''
}

async function existingMarkers(accountId, platform) {
  const set = new Set()
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('notes')
      .eq('account_id', accountId)
      .like('notes', `%[import:${platform}:%`)
      .order('id')
      .range(from, from + 999)
    if (error) throw new Error(error.message)
    for (const e of data || []) {
      const m = (e.notes || '').match(IMPORT_MARKER_RE)
      if (m && m[1] === platform) set.add(m[2])
    }
    if (!data || data.length < 1000) break
  }
  return set
}

export default function PlatformImporter({ user, parsedFromApi = null, sourceLabel = null }) {
  const t = useT()
  const [accounts, setAccounts] = useState([])
  const [fileName, setFileName] = useState('')
  const [parsedFile, setParsedFile] = useState(null)
  const [parseError, setParseError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [mapping, setMapping] = useState({})
  const [dryRun, setDryRun] = useState(true)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)

  const parsed = parsedFromApi || parsedFile

  // Tous les comptes actifs, futures ET CFD : un rapport MetaTrader va sur un
  // compte CFD.
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('accounts')
      .select('id, name, buy_date, plan_size, status, market, rithmic_account_id, firm:firms(name)')
      .eq('user_id', user.id)
      .order('buy_date', { ascending: false })
      .then(({ data }) => setAccounts((data || []).filter((a) => a.status !== 'Échoué')))
  }, [user?.id])

  const groups = useMemo(() => {
    if (!parsed) return []
    const by = new Map()
    for (const tr of parsed.trades) {
      const k = tr.account || FILE_KEY
      if (!by.has(k)) by.set(k, { key: k, trades: [] })
      by.get(k).trades.push(tr)
    }
    return [...by.values()].map((g) => {
      const dates = g.trades.map((tr) => tr.date).filter(Boolean).sort()
      return { ...g, from: dates[0], to: dates[dates.length - 1], net: g.trades.reduce((s, tr) => s + (tr.pnl || 0), 0) }
    })
  }, [parsed])

  // Nouveau fichier ou nouvelle lecture API : rapprochement automatique.
  useEffect(() => {
    const m = {}
    for (const g of groups) m[g.key] = autoMatch(g.key === FILE_KEY ? null : g.key, accounts)
    setMapping(m)
    setResult(null)
  }, [groups, accounts])

  async function handleFile(file) {
    if (!file) return
    setFileName(file.name)
    setParseError('')
    setParsedFile(null)
    try {
      const text = decodeFileBuffer(await file.arrayBuffer())
      const r = parsePlatformFile(text)
      if (!r.trades.length) throw new Error('EMPTY')
      setParsedFile(r)
    } catch (e) {
      setParseError(
        e.message === 'UNKNOWN_FORMAT'
          ? t('app.importLab.unknownFormat')
          : e.message === 'EMPTY' ? t('app.importLab.noClosedTrades') : e.message
      )
    }
  }

  async function runImport() {
    if (!parsed) return
    setImporting(true)
    const report = { inserted: 0, skipped: 0, errors: [], perGroup: [] }
    let withQuantity = true
    try {
      for (const g of groups) {
        const accountId = mapping[g.key]
        if (!accountId) continue
        const known = dryRun ? new Set() : await existingMarkers(accountId, parsed.platform)
        const fresh = g.trades.filter((tr) => !known.has(String(tr.externalId)))
        const per = { key: g.key, toInsert: fresh.length, skipped: g.trades.length - fresh.length }
        report.skipped += per.skipped
        if (!dryRun) {
          for (let i = 0; i < fresh.length; i += 100) {
            const batch = fresh.slice(i, i + 100)
            let { error } = await supabase.from('journal_entries').insert(batch.map((tr) => tradeToRow(tr, { userId: user.id, accountId, platform: parsed.platform, withQuantity })))
            // Base où la colonne quantity n'existe pas encore : on réessaie sans.
            if (error && withQuantity && /quantity/i.test(error.message || '')) {
              withQuantity = false
              ;({ error } = await supabase.from('journal_entries').insert(batch.map((tr) => tradeToRow(tr, { userId: user.id, accountId, platform: parsed.platform, withQuantity }))))
            }
            if (error) { report.errors.push(`${g.key === FILE_KEY ? t('app.importLab.fileWord') : g.key} : ${error.message}`); per.toInsert = i; break }
          }
        }
        report.inserted += per.toInsert
        report.perGroup.push(per)
      }
    } catch (e) {
      report.errors.push(e.message)
    }
    setResult({ dryRun, report })
    setImporting(false)
  }

  const mapped = groups.filter((g) => mapping[g.key]).length
  const label = PLATFORMS[parsed?.platform]?.label || ''

  return (
    <>
      {!parsedFromApi && (
        <Section title={t('app.importLab.stepDropExport')}>
          <Card padding="lg">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]) }}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
              role="button"
              tabIndex={0}
              aria-label={t('app.importLab.chooseExportAria')}
              style={{
                border: `1.5px dashed ${dragOver ? T.color.blue : T.color.borderStrong}`,
                background: dragOver ? T.color.blueSoft : 'transparent',
                borderRadius: T.radius.lg, padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: T.color.text }}>{fileName || t('app.importLab.dropOrChoose')}</div>
              <div style={{ fontSize: 12, color: T.color.text3, marginTop: 6 }}>{t('app.importLab.autoDetected')}</div>
              <input ref={inputRef} id="platform-import-file" type="file" accept=".csv,.txt,.htm,.html" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>
            <ul style={{ margin: '14px 0 0', paddingLeft: 18, fontSize: 12, color: T.color.text2, lineHeight: 1.7 }}>
              <li><strong>Tradovate</strong>{t('app.importLab.helpTradovate')}</li>
              <li><strong>NinjaTrader 8</strong>{t('app.importLab.helpNinja')}</li>
              <li><strong>TopstepX</strong>{t('app.importLab.helpTopstepx')}</li>
              <li><strong>MetaTrader 5 / 4</strong>{t('app.importLab.helpMt')}</li>
            </ul>
            {parseError && <p role="alert" style={{ margin: '12px 0 0', fontSize: 12.5, color: T.color.red }}>{parseError}</p>}
          </Card>
        </Section>
      )}

      {parsed && (
        <Section title={t('app.importLab.stepMap')}>
          <Card padding="lg">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              <Badge tone="blue">{sourceLabel || label}</Badge>
              <span style={{ fontSize: 12.5, color: T.color.text2 }}>{t('app.importLab.closedTrades').replace('{n}', parsed.trades.length)}{parsed.errors.length ? t('app.importLab.unreadableLines').replace('{n}', parsed.errors.length) : ''}</span>
            </div>
            {parsed.notes.includes('grossOnly') && (
              <p style={{ fontSize: 12, color: T.color.amber, margin: '0 0 12px' }}>{t('app.importLab.grossOnly')}</p>
            )}
            {parsed.notes.includes('openPositions') && (
              <p style={{ fontSize: 12, color: T.color.amber, margin: '0 0 12px' }}>{t('app.importLab.openPositions')}</p>
            )}
            <div style={{ display: 'grid', gap: 10 }}>
              {groups.map((g) => (
                <div key={g.key} className="il-form-row" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '10px 12px', border: `1px solid ${T.color.border}`, borderRadius: T.radius.md }}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.color.text, fontFamily: T.font.mono }}>{g.key === FILE_KEY ? t('app.importLab.thisFile') : g.key}</div>
                    <div style={{ fontSize: 11.5, color: T.color.text3, marginTop: 2 }}>
                      {g.trades.length} trades · {g.from === g.to ? g.from : `${g.from} → ${g.to}`} · <span style={{ color: g.net >= 0 ? T.color.green : T.color.red }}>{usd(g.net)}</span>
                    </div>
                  </div>
                  <div style={{ flex: '1 1 240px' }}>
                    <label htmlFor={`map-${g.key}`} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{t('app.importLab.accountFor').replace('{name}', g.key === FILE_KEY ? t('app.importLab.thisFileLower') : g.key)}</label>
                    <select
                      id={`map-${g.key}`}
                      value={mapping[g.key] || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, [g.key]: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, background: T.color.surface2, color: T.color.text, border: `1px solid ${T.color.borderStrong}`, borderRadius: T.radius.md, fontFamily: 'inherit' }}
                    >
                      <option value="">{t('app.importLab.doNotImport')}</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.firm?.name || '—'} · {accountLabel(a)} · {a.plan_size}{a.market === 'cfd' ? ' · CFD' : ''} ({a.status})</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            {accounts.length === 0 && (
              <p style={{ fontSize: 12, color: T.color.text3, margin: '12px 0 0' }}>{t('app.importLab.noActiveAccount')}</p>
            )}
          </Card>
        </Section>
      )}

      {parsed && (
        <Section title={t('app.importLab.stepImport')}>
          <Card padding="lg">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: T.color.text2, cursor: 'pointer' }}>
                <input id="platform-import-dry" type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} style={{ accentColor: 'var(--blue)' }} />
                {t('app.importLab.simulationCheckbox')}
              </label>
              <Btn onClick={runImport} disabled={importing || mapped === 0}>
                {importing ? t('app.importLab.importing') : dryRun ? t('app.importLab.simulate') : (mapped > 1 ? t('app.importLab.importIntoMany') : t('app.importLab.importIntoOne')).replace('{n}', mapped)}
              </Btn>
            </div>
            {result && (
              <div role="status" style={{ marginTop: 14, fontSize: 13, color: T.color.text2, lineHeight: 1.6 }}>
                {result.dryRun
                  ? <>{t('app.importLab.simResultPre')}<strong>{result.report.inserted}</strong>{t('app.importLab.simResultPost')}</>
                  : <><strong>{result.report.inserted}</strong>{t('app.importLab.realResult').replace('{n}', result.report.skipped)}{' '}
                    <Link href="/app/journal?origin=import" style={{ color: T.color.blueLight }}>{t('app.importLab.seeInJournal')}</Link></>}
                {result.report.errors.map((e, i) => <div key={i} style={{ color: T.color.red }}>{e}</div>)}
              </div>
            )}
          </Card>
        </Section>
      )}
    </>
  )
}
