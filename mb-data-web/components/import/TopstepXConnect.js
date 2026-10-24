'use client'
// components/import/TopstepXConnect.js — import TopstepX par clé API (bêta).
//
// Le nom d'utilisateur et la clé restent dans ce formulaire : ils partent vers
// /api/import/topstepx le temps d'une lecture et ne sont enregistrés nulle
// part. Les exécutions reçues sont regroupées en allers-retours dans le
// navigateur, puis l'import se fait comme pour un fichier (PlatformImporter).
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { pairProjectXFills } from '../../lib/importers/projectx'
import { T } from '../dashboard/theme'
import { Card, Btn, Badge, Section } from '../dashboard/ui'
import PlatformImporter from './PlatformImporter'
import { useT } from '../LanguageProvider'

const inputS = { width: '100%', padding: '8px 10px', fontSize: 13, background: T.color.surface2, color: T.color.text, border: `1px solid ${T.color.borderStrong}`, borderRadius: T.radius.md, fontFamily: 'inherit' }
const labelS = { display: 'block', fontSize: 11, fontWeight: 600, color: T.color.text3, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)

async function call(body) {
  const { data: { session } } = await supabase.auth.getSession()
  const r = await fetch('/api/import/topstepx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || '')
  return data
}

export default function TopstepXConnect({ user }) {
  const t = useT()
  const [userName, setUserName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [start, setStart] = useState(daysAgo(90))
  const [accounts, setAccounts] = useState(null)
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState(null)

  async function loadAccounts() {
    setBusy(true); setError(''); setParsed(null)
    try {
      const { accounts: list } = await call({ userName, apiKey })
      setAccounts(list || [])
      setSelected((list || []).filter((a) => a.canTrade).map((a) => a.id))
    } catch (e) { setError(e.message || t('app.importLab.genericError')) }
    setBusy(false)
  }

  async function loadTrades() {
    setBusy(true); setError('')
    try {
      const { fills } = await call({ userName, apiKey, accountIds: selected, start: new Date(`${start}T00:00:00`).toISOString() })
      const trades = []
      const notes = new Set()
      for (const id of selected) {
        const name = accounts.find((a) => a.id === id)?.name || String(id)
        const r = pairProjectXFills(fills.filter((f) => f.accountId === id), { accountName: name })
        trades.push(...r.trades)
        r.notes.forEach((n) => notes.add(n))
      }
      setParsed({ platform: 'topstepx-api', trades, errors: [], notes: [...notes] })
      // La clé n'est plus utile une fois les trades reçus.
      setApiKey('')
      if (!trades.length) setError(t('app.importLab.noClosedPeriod'))
    } catch (e) { setError(e.message || t('app.importLab.genericError')) }
    setBusy(false)
  }

  return (
    <>
      <Section title={t('app.importLab.stepConnect')}>
        <Card padding="lg">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <Badge tone="amber">{t('app.importLab.beta')}</Badge>
            <span style={{ fontSize: 12.5, color: T.color.text2 }}>{t('app.importLab.readOnlyNote')}</span>
          </div>
          <div className="il-kv-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: 12 }}>
            <div>
              <label style={labelS} htmlFor="px-user">{t('app.importLab.pxUser')}</label>
              <input id="px-user" value={userName} onChange={(e) => setUserName(e.target.value)} autoComplete="off" spellCheck={false} style={inputS} placeholder={t('app.importLab.pxUserPlaceholder')} />
            </div>
            <div>
              <label style={labelS} htmlFor="px-key">{t('app.importLab.pxKey')}</label>
              <input id="px-key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" spellCheck={false} style={inputS} />
            </div>
            <div>
              <label style={labelS} htmlFor="px-start">{t('app.importLab.pxSince')}</label>
              <input id="px-start" type="date" value={start} max={daysAgo(0)} onChange={(e) => setStart(e.target.value)} style={inputS} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <Btn onClick={loadAccounts} disabled={busy || !userName || !apiKey}>{busy && !accounts ? t('app.importLab.connecting') : t('app.importLab.readAccounts')}</Btn>
          </div>
          {error && <p role="alert" style={{ margin: '12px 0 0', fontSize: 12.5, color: T.color.red }}>{error}</p>}
          <details style={{ marginTop: 14, fontSize: 12, color: T.color.text3 }}>
            <summary style={{ cursor: 'pointer', color: T.color.text2 }}>{t('app.importLab.getKey')}</summary>
            <ol style={{ paddingLeft: 18, lineHeight: 1.7, margin: '8px 0 0' }}>
              <li>{t('app.importLab.getKey1')}</li>
              <li>{t('app.importLab.getKey2')}</li>
              <li>{t('app.importLab.getKey3')}</li>
            </ol>
            <p style={{ margin: '6px 0 0' }}>{t('app.importLab.getKeyNote')}</p>
          </details>
        </Card>
      </Section>

      {accounts && !parsed && (
        <Section title={t('app.importLab.stepChooseAccounts')}>
          <Card padding="lg">
            {accounts.length === 0 ? (
              <p style={{ fontSize: 13, color: T.color.text3, margin: 0 }}>{t('app.importLab.noPxAccount')}</p>
            ) : (
              <div style={{ display: 'grid', gap: 6 }}>
                {accounts.map((a) => (
                  <label key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: T.color.text, cursor: 'pointer', minHeight: 32 }}>
                    <input type="checkbox" checked={selected.includes(a.id)} onChange={() => setSelected((s) => s.includes(a.id) ? s.filter((x) => x !== a.id) : [...s, a.id])} style={{ accentColor: 'var(--blue)' }} />
                    <span style={{ fontFamily: T.font.mono }}>{a.name}</span>
                    {!a.canTrade && <Badge tone="neutral">{t('app.importLab.inactive')}</Badge>}
                  </label>
                ))}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <Btn onClick={loadTrades} disabled={busy || selected.length === 0 || !apiKey}>{busy ? t('app.importLab.reading') : t('app.importLab.fetchTrades')}</Btn>
              {!apiKey && <span style={{ fontSize: 12, color: T.color.text3, marginLeft: 10 }}>{t('app.importLab.reenterKey')}</span>}
            </div>
          </Card>
        </Section>
      )}

      {parsed && parsed.trades.length > 0 && <PlatformImporter user={user} parsedFromApi={parsed} sourceLabel="TopstepX (API)" />}
    </>
  )
}
