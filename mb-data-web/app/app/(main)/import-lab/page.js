'use client'
// Page ISOLÉE pour tester l'import CSV Rithmic.
// 2 modes (onglets) :
//   📊 Trades   — Import du CSV "Performance" (PnL Statement) → crée comptes + trades
//   ⚖️ État    — Import du CSV "Trader Dashboard" → met à jour soldes + DD + status
//
// Sécurités :
//   - Accessible aux emails admin uniquement
//   - Dry run par défaut, aucune écriture en DB
//   - Confirmation explicite pour l'import réel
//
// Dédoublonnage Trades : marker [rithmic:ENTRY/EXIT] dans notes
// Auto-mapping Dashboard : via accounts.rithmic_account_id

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '../../../../lib/supabase'
import { parseRithmicPnL } from '../../../../lib/importers/rithmic-pnl'
import { parseRithmicDashboard } from '../../../../lib/importers/rithmic-dashboard'
import { T } from '../../../../components/dashboard/theme'
import { Card, Btn, Badge, PageHeader, Section, UIStyles } from '../../../../components/dashboard/ui'
import { defaultChallengePrice } from '../../../../lib/constants'
import { useApp } from '../AppContext'

// Génère un nom propre depuis un Rithmic ID type LFF050-XXXXXX-PRO007 :
//   PRO007 → "PRO 7"   (compte financé)
//   TEST017 → "EVAL 17" (compte challenge)
// Permet de coller à la convention de naming du screenshot user (PRO 7, PRO 6).
function generateAccountName(rithmicId) {
  if (!rithmicId) return ''
  const match = rithmicId.match(/-(TEST|PRO)(\d+)$/i)
  if (!match) return rithmicId.slice(-11)
  const [, type, num] = match
  const cleanNum = parseInt(num, 10)
  return type.toUpperCase() === 'TEST' ? `EVAL ${cleanNum}` : `PRO ${cleanNum}`
}

// Cherche un compte Quantara qui correspond au rithmicId via plusieurs stratégies :
//   1. rithmic_account_id (exact, le plus fiable — set par les imports récents)
//   2. name = nom auto-généré (ex: "PRO 7" pour LFF...-PRO007)
//   3. name = derniers 11 chars du rithmicId (ex: "OYD5-PRO007" — convention old PnL importer)
//   4. name contient le suffix type+num (ex: "PRO 007", "PRO-7", "PRO_7", etc.)
// Retourne { account, strategy } ou null.
function findMatchingExistingAccount(rithmicId, existingAccounts) {
  if (!rithmicId || !existingAccounts?.length) return null

  // 1. Match exact via rithmic_account_id
  const byId = existingAccounts.find(ea => ea.rithmic_account_id === rithmicId)
  if (byId) return { account: byId, strategy: 'rithmic_id' }

  const norm = (s) => String(s || '').trim().toLowerCase()

  // 2. Match par nom auto-généré ("PRO 7", "EVAL 17")
  const generated = norm(generateAccountName(rithmicId))
  if (generated) {
    const byGen = existingAccounts.find(ea => norm(ea.name) === generated)
    if (byGen) return { account: byGen, strategy: 'generated_name' }
  }

  // 3. Match par derniers 11 chars (legacy old PnL importer)
  const last11 = norm(rithmicId.slice(-11))
  if (last11) {
    const byLegacy = existingAccounts.find(ea => norm(ea.name) === last11)
    if (byLegacy) return { account: byLegacy, strategy: 'legacy_name' }
  }

  // 4. Match approximatif sur le suffix type+num (PRO007, PRO 7, PRO-7…)
  const sufMatch = rithmicId.match(/-(TEST|PRO)(\d+)$/i)
  if (sufMatch) {
    const [, type, num] = sufMatch
    const cleanNum = parseInt(num, 10)
    const targetType = type.toUpperCase() === 'TEST' ? 'eval' : 'pro'
    // Cherche un nom contenant le type ET le numéro
    const byFuzzy = existingAccounts.find(ea => {
      const n = norm(ea.name)
      if (!n.includes(targetType)) return false
      // Vérifie que le numéro apparaît (avec ou sans 0 leading)
      return n.includes(String(cleanNum)) || n.includes(num.toLowerCase())
    })
    if (byFuzzy) return { account: byFuzzy, strategy: 'fuzzy_name' }
  }

  return null
}

// Page ouverte à tous les users connectés (BETA — utiliser avec précaution).
// Le mode dry-run par défaut + la confirmation popup protègent contre les écritures
// accidentelles. Les RLS Supabase garantissent que chaque user n'agit que sur
// SES propres comptes/firmes.

export default function ImportLabPage() {
  const { user } = useApp()

  const [tab, setTab] = useState('dashboard')

  const [existingFirms, setExistingFirms] = useState([])
  const [existingAccounts, setExistingAccounts] = useState([])
  const [loadingExisting, setLoadingExisting] = useState(false)

  useEffect(() => {
    if (!user) return
    let mounted = true
    ;(async () => {
      setLoadingExisting(true)
      const [firmsRes, accountsRes] = await Promise.all([
        supabase.from('firms').select('id, name, color').eq('user_id', user.id).order('name'),
        supabase
          .from('accounts')
          .select('id, firm_id, name, plan_size, status, buy_date, rithmic_account_id, rithmic_balance, rithmic_min_balance, liquidated_at, user_id')
          .eq('user_id', user.id)
          .order('buy_date', { ascending: false }),
      ])
      if (!mounted) return
      setExistingFirms(firmsRes.data || [])
      setExistingAccounts(accountsRes.data || [])
      setLoadingExisting(false)
    })()
    return () => { mounted = false }
  }, [user])

  // Réutilisable : déclenche un re-fetch après un import réussi
  async function refreshExisting() {
    if (!user) return
    const [firmsRes, accountsRes] = await Promise.all([
      supabase.from('firms').select('id, name, color').eq('user_id', user.id).order('name'),
      supabase
        .from('accounts')
        .select('id, firm_id, name, plan_size, status, buy_date, rithmic_account_id, rithmic_balance, rithmic_min_balance, liquidated_at, user_id')
        .eq('user_id', user.id)
        .order('buy_date', { ascending: false }),
    ])
    setExistingFirms(firmsRes.data || [])
    setExistingAccounts(accountsRes.data || [])
  }

  // ==========================================================================
  // Render principal
  // ==========================================================================
  return (
    <div className="il-root" style={{
      background: T.color.bg,
      color: T.color.text,
      padding: '32px 24px',
      fontFamily: T.font.sans,
    }}>
      <UIStyles />
      {/* Styles responsive spécifiques à import-lab */}
      <style>{`
        @media (max-width: 768px) {
          .il-root { padding: 18px 12px !important; }
          .il-tabs { flex-direction: column !important; width: 100% !important; }
          .il-tabs button { width: 100% !important; text-align: left !important; }
          .il-kv-grid { grid-template-columns: 1fr !important; }
          .il-form-row { flex-direction: column !important; align-items: stretch !important; }
          .il-form-row > div { width: 100% !important; min-width: 0 !important; }
          .il-mode-chips { flex-wrap: wrap !important; }
          .il-mode-chips button { flex: 1 1 auto !important; min-width: 100px !important; }
          .il-acc-header { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PageHeader
          eyebrow="IMPORT · BETA"
          title="Import Lab — Rithmic CSV"
          subtitle="Importe tes trades depuis un export Rithmic R|Trader Pro. Mode dry-run par défaut, rien n'est écrit en DB tant que tu ne bascules pas en import réel."
          actions={
            <>
              <Link href="/app/journal-sync" style={{ textDecoration: 'none' }}>
                <Btn variant="ghost" size="sm">Journal Sync →</Btn>
              </Link>
              <Link href="/app" style={{ textDecoration: 'none' }}>
                <Btn variant="ghost" size="sm">← Retour app</Btn>
              </Link>
            </>
          }
        />

        {/* === Tabs === */}
        <div className="il-tabs" style={{
          display: 'flex', gap: 4, marginBottom: 24,
          padding: 4, background: T.color.surface2,
          borderRadius: T.radius.lg,
          border: `1px solid ${T.color.border}`,
          width: 'fit-content',
          maxWidth: '100%',
        }}>
          <TabBtn active={tab === 'dashboard'} onClick={() => setTab('dashboard')}>
            1️⃣ État des comptes (Dashboard)
          </TabBtn>
          <TabBtn active={tab === 'trades'} onClick={() => setTab('trades')}>
            2️⃣ Trades (PnL Statement)
          </TabBtn>
        </div>

        {/* === Contenu de l'onglet actif === */}
        {tab === 'trades' && (
          <TradesImporter
            user={user}
            existingFirms={existingFirms}
            existingAccounts={existingAccounts}
            loadingExisting={loadingExisting}
            onSuccess={refreshExisting}
          />
        )}

        {tab === 'dashboard' && (
          <DashboardImporter
            user={user}
            existingAccounts={existingAccounts}
            existingFirms={existingFirms}
            loadingExisting={loadingExisting}
            onSuccess={refreshExisting}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// COMPOSANT : Tab button
// ============================================================================
function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 18px',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        background: active ? T.color.surfaceSolid : 'transparent',
        color: active ? T.color.text : T.color.text2,
        border: active ? `1px solid ${T.color.borderStrong}` : '1px solid transparent',
        borderRadius: T.radius.md,
        cursor: 'pointer',
        fontFamily: T.font.sans,
        transition: T.transition.base,
      }}
    >
      {children}
    </button>
  )
}

// ============================================================================
// ============================================================================
// IMPORTER 1 : TRADES (PnL Statement)
// ============================================================================
// ============================================================================
function TradesImporter({ user, existingFirms, existingAccounts, loadingExisting, onSuccess }) {
  const [fileName, setFileName] = useState('')
  const [parsed, setParsed] = useState(null)
  const [parseError, setParseError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [mapping, setMapping] = useState({})
  const [dryRun, setDryRun] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  function handleFile(file) {
    setFileName(file.name)
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = parseRithmicPnL(e.target.result)
        setParsed(result)
        setParseError('')
        const initialMapping = {}
        for (const acc of result.accounts) {
          // Auto-map via plusieurs stratégies (rithmic_id, nom, suffix…)
          const match = findMatchingExistingAccount(acc.rithmicId, existingAccounts)
          if (match) {
            initialMapping[acc.rithmicId] = {
              mode: 'existing',
              accountId: match.account.id,
              matchStrategy: match.strategy, // pour afficher le badge approprié
            }
          } else {
            // === Défauts intelligents pour création ===
            // Date par défaut : 1er trade détecté (sinon aujourd'hui)
            const firstTradeDate = acc.trades[0]?.date || new Date().toISOString().slice(0, 10)
            // Prix challenge suggéré depuis la table PROPFIRM_RULES (peut être null)
            const suggestedPrice = acc.firm ? defaultChallengePrice(acc.firm, '50k') : null
            initialMapping[acc.rithmicId] = {
              mode: 'create',
              newName: generateAccountName(acc.rithmicId),
              planSize: '50k',
              // Date d'achat du challenge (toujours demandée)
              buyDate: firstTradeDate,
              // Coût payé pour le challenge (suggéré depuis les règles firme)
              challengeCost: suggestedPrice !== null ? String(suggestedPrice) : '',
              // FUNDED uniquement : frais d'activation + date passage en financé
              activationFee: '0',
              fundedDate: acc.type === 'FUNDED' ? firstTradeDate : '',
            }
          }
        }
        setMapping(initialMapping)
      } catch (err) {
        setParseError(err.message)
        setParsed(null)
      }
    }
    reader.onerror = () => setParseError('Erreur de lecture du fichier')
    reader.readAsText(file)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Seuls les fichiers .csv sont acceptés')
      return
    }
    handleFile(file)
  }

  function reset() {
    setFileName('')
    setParsed(null)
    setParseError('')
    setMapping({})
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function doImport() {
    if (!parsed || !user) return

    if (!dryRun) {
      const ok = window.confirm(
        `⚠️ IMPORT RÉEL (Trades)\n\n` +
        `- ${countToCreate(parsed, mapping)} nouveaux comptes\n` +
        `- ${parsed.totals.tradeCount} trades (avant dédoublonnage)\n\n` +
        `Continuer ?`
      )
      if (!ok) return
    }

    setImporting(true)
    setImportResult(null)

    const report = {
      dryRun,
      createdFirms: 0,
      createdAccounts: 0,
      reusedAccounts: 0,
      insertedTrades: 0,
      skippedDuplicates: 0,
      perAccount: [],
      errors: [],
    }

    try {
      // === 1. Firme Lucid Trading ===
      let lucidFirm = existingFirms.find(f => f.name.toLowerCase().includes('lucid'))
      if (!lucidFirm) {
        if (!dryRun) {
          const { data, error } = await supabase
            .from('firms')
            .insert({ user_id: user.id, name: 'Lucid Trading', color: '#2d6fff' })
            .select().single()
          if (error) throw new Error(`Création firme : ${error.message}`)
          lucidFirm = data
        } else {
          lucidFirm = { id: '__dry_run_firm__' }
        }
        report.createdFirms++
      }

      // === 2. Comptes ===
      const accountIdMap = {}
      for (const acc of parsed.accounts) {
        const m = mapping[acc.rithmicId]
        if (!m) continue

        if (m.mode === 'existing' && m.accountId) {
          accountIdMap[acc.rithmicId] = m.accountId
          report.reusedAccounts++
          // Backfill rithmic_account_id sur le compte existant si pas encore set
          // → permet au prochain import de matcher exactement (stratégie 'rithmic_id')
          if (!dryRun) {
            const ea = existingAccounts.find(a => a.id === m.accountId)
            if (ea && !ea.rithmic_account_id) {
              const { error } = await supabase
                .from('accounts')
                .update({ rithmic_account_id: acc.rithmicId })
                .eq('id', m.accountId)
                .eq('user_id', user.id)
              if (error) {
                report.errors.push(`Backfill rithmic_id sur ${acc.rithmicId} : ${error.message}`)
              }
            }
          }
        } else if (m.mode === 'create') {
          // Utilise les valeurs saisies par l'user (avec fallbacks intelligents)
          const fallbackDate = acc.trades[0]?.date || new Date().toISOString().slice(0, 10)
          const payload = {
            user_id: user.id,
            firm_id: lucidFirm.id,
            buy_date: m.buyDate || fallbackDate,
            currency: 'USD',
            spent: Number(m.challengeCost) || 0,                        // coût du challenge
            activation_fee: Number(m.activationFee) || 0,                // frais activation (FUNDED)
            funded_date: acc.type === 'FUNDED' ? (m.fundedDate || null) : null, // date passage financé
            name: m.newName || generateAccountName(acc.rithmicId),
            plan_size: m.planSize || '50k',
            status: acc.type === 'FUNDED' ? 'Financé' : 'Challenge',     // auto-détecté
            dd_type: 'trailing',
            rithmic_account_id: acc.rithmicId,                           // lien Rithmic
            notes: `Importé depuis Rithmic le ${new Date().toLocaleDateString('fr-FR')}\nID Rithmic : ${acc.rithmicId}`,
          }
          if (!dryRun) {
            const { data, error } = await supabase
              .from('accounts').insert(payload).select().single()
            if (error) throw new Error(`Création compte ${acc.rithmicId} : ${error.message}`)
            accountIdMap[acc.rithmicId] = data.id
          } else {
            accountIdMap[acc.rithmicId] = `__dry_${acc.rithmicId}`
          }
          report.createdAccounts++
        }
      }

      // === 3. Trades avec dédoublonnage ===
      for (const acc of parsed.accounts) {
        const accountId = accountIdMap[acc.rithmicId]
        if (!accountId) continue
        const perAcc = { rithmicId: acc.rithmicId, tradesToInsert: 0, skipped: 0 }

        let existingMarkers = new Set()
        if (!dryRun) {
          const { data } = await supabase
            .from('journal_entries')
            .select('notes')
            .eq('account_id', accountId)
            .like('notes', '%[rithmic:%')
          for (const e of (data || [])) {
            const m = (e.notes || '').match(/\[rithmic:(\d+)\/(\d+)\]/)
            if (m) existingMarkers.add(`${m[1]}/${m[2]}`)
          }
        }

        const rows = []
        for (const t of acc.trades) {
          const marker = `${t.entryOrderId}/${t.exitOrderId}`
          if (existingMarkers.has(marker)) {
            perAcc.skipped++
            report.skippedDuplicates++
            continue
          }
          rows.push({
            user_id: user.id,
            account_id: accountId,
            date: t.date,
            // Phase 5 : traded_at extrait du CSV Rithmic (date + entryTime) pour les heatmaps
            // par heure / session. Fallback midi si tradedAt absent (rare avec Rithmic).
            traded_at: t.tradedAt || `${t.date}T12:00:00`,
            pnl: t.netPnL,
            instrument: t.instrument,
            side: t.side,
            entry_price: t.entryPrice,
            exit_price: t.exitPrice,
            // Phase 4 : commissions extraites du CSV Rithmic (gross - net = commissions)
            // Le `pnl` reste le NET (ce que l'user voit), les commissions sont trackées séparément.
            commissions: t.commissions != null ? Math.abs(t.commissions) : 0,
            notes: `[rithmic:${marker}] qty=${t.qty} fills=${t.fillCount} hold=${t.holdSeconds}s entry=${t.entryTime} exit=${t.exitTime}`,
          })
        }

        if (rows.length > 0) {
          if (!dryRun) {
            for (let i = 0; i < rows.length; i += 100) {
              const batch = rows.slice(i, i + 100)
              const { error } = await supabase.from('journal_entries').insert(batch)
              if (error) {
                report.errors.push(`${acc.rithmicId} batch ${i} : ${error.message}`)
                break
              }
            }
          }
          perAcc.tradesToInsert = rows.length
          report.insertedTrades += rows.length
        }
        report.perAccount.push(perAcc)
      }

      setImportResult({ ok: true, report })
      if (!dryRun && onSuccess) onSuccess()
    } catch (err) {
      report.errors.push(err.message)
      setImportResult({ ok: false, error: err.message, report })
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <Section title="1 · Sélectionne ton CSV PnL Statement">
        <Card padding="lg">
          <DropZone
            fileName={fileName}
            dragOver={dragOver}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            placeholder="Format : Rithmic R|Trader Pro → Performance → Export CSV"
          />
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </Card>
      </Section>

      {parseError && <ErrorCard message={parseError} />}

      {parsed && (
        <>
          {/* Warning si des comptes du CSV n'ont pas été matchés à un compte Quantara existant.
              On recommande l'onglet Dashboard pour les créer proprement (avec balance + DD set automatiquement). */}
          {(() => {
            const unmatched = parsed.accounts.filter(acc => {
              const m = mapping[acc.rithmicId]
              return m?.mode === 'create' // = pas trouvé via auto-match
            })
            if (unmatched.length === 0) return null
            return (
              <Card style={{
                borderColor: T.color.amber,
                background: T.color.amberSoft,
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 18, marginTop: -2 }}>💡</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.color.amber, marginBottom: 4 }}>
                      {unmatched.length} compte{unmatched.length > 1 ? 's' : ''} pas encore créé{unmatched.length > 1 ? 's' : ''} dans Quantara
                    </div>
                    <div style={{ fontSize: 12, color: T.color.text2, lineHeight: 1.5, marginBottom: 8 }}>
                      Ordre recommandé : <strong>importe d'abord le CSV "État des comptes" (Dashboard)</strong> pour créer les comptes avec leur balance, DD et status corrects.
                      Ensuite reviens ici pour importer les trades.
                    </div>
                    <div style={{ fontSize: 11, color: T.color.text3, fontFamily: T.font.mono }}>
                      Si tu préfères tout faire d'un coup, tu peux quand même créer les comptes manquants ici (form ci-dessous).
                    </div>
                  </div>
                </div>
              </Card>
            )
          })()}

          <Section
            title="2 · Détection"
            action={
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge tone="blue">{parsed.accounts.length} comptes</Badge>
                <Badge tone="neutral">{parsed.totals.tradeCount} trades</Badge>
                <Badge tone="neutral">{parsed.totals.fillCount} fills</Badge>
                <Badge tone={parsed.totals.netPnL >= 0 ? 'green' : 'red'}>
                  Net ${parsed.totals.netPnL.toFixed(2)}
                </Badge>
              </div>
            }
          >
            {parsed.accounts.map((acc) => (
              <TradesAccountCard
                key={acc.rithmicId}
                account={acc}
                mapping={mapping[acc.rithmicId]}
                existingAccounts={existingAccounts}
                existingFirms={existingFirms}
                loadingExisting={loadingExisting}
                onChangeMapping={(m) => setMapping(prev => ({ ...prev, [acc.rithmicId]: m }))}
              />
            ))}
          </Section>

          <ExecutionSection
            dryRun={dryRun}
            setDryRun={setDryRun}
            importing={importing}
            onLaunch={doImport}
            label="Trades"
          />

          {importResult && (
            <ResultSection result={importResult} onReset={reset} kind="trades" />
          )}
        </>
      )}
    </>
  )
}

// ============================================================================
// ============================================================================
// IMPORTER 2 : DASHBOARD (état des comptes)
// ============================================================================
// ============================================================================
function DashboardImporter({ user, existingAccounts, existingFirms, loadingExisting, onSuccess }) {
  const [fileName, setFileName] = useState('')
  const [parsed, setParsed] = useState(null)
  const [parseError, setParseError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [mapping, setMapping] = useState({}) // rithmicId → { accountId | null }  (null = skip)
  const [dryRun, setDryRun] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  function handleFile(file) {
    setFileName(file.name)
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = parseRithmicDashboard(e.target.result)
        setParsed(result)
        setParseError('')

        // Auto-mapping intelligent :
        //   - Si match trouvé → mode='existing' (update du compte)
        //   - Sinon → mode='create' (création AVEC les infos d'achat demandées)
        //   - L'user peut basculer manuellement vers 'skip' pour ne rien faire
        const initialMapping = {}
        for (const acc of result.accounts) {
          const match = findMatchingExistingAccount(acc.rithmicId, existingAccounts)
          if (match) {
            initialMapping[acc.rithmicId] = {
              mode: 'existing',
              accountId: match.account.id,
              autoMatched: true,
              matchStrategy: match.strategy,
            }
          } else {
            // Défauts intelligents pour création (même UX que PnL importer)
            const today = new Date().toISOString().slice(0, 10)
            const suggestedPrice = acc.firm ? defaultChallengePrice(acc.firm, '50k') : null
            initialMapping[acc.rithmicId] = {
              mode: 'create',
              autoMatched: false,
              newName: generateAccountName(acc.rithmicId),
              planSize: '50k',
              buyDate: today,
              challengeCost: suggestedPrice !== null ? String(suggestedPrice) : '',
              activationFee: '0',
              fundedDate: acc.type === 'FUNDED' ? today : '',
            }
          }
        }
        setMapping(initialMapping)
      } catch (err) {
        setParseError(err.message)
        setParsed(null)
      }
    }
    reader.onerror = () => setParseError('Erreur de lecture du fichier')
    reader.readAsText(file)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Seuls les fichiers .csv sont acceptés')
      return
    }
    handleFile(file)
  }

  function reset() {
    setFileName('')
    setParsed(null)
    setParseError('')
    setMapping({})
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function doImport() {
    if (!parsed || !user) return

    // Catégorise les comptes selon le mode choisi
    const toUpdate = []
    const toCreate = []
    const toSkip = []
    for (const acc of parsed.accounts) {
      const m = mapping[acc.rithmicId]
      const mode = m?.mode || (m?.accountId ? 'existing' : 'skip')
      if (mode === 'existing' && m?.accountId) toUpdate.push(acc)
      else if (mode === 'create') toCreate.push(acc)
      else toSkip.push(acc)
    }

    if (toUpdate.length + toCreate.length === 0) {
      window.alert('Aucun compte à traiter — tous en "Skip". Sélectionne au moins 1 compte à lier ou à créer.')
      return
    }

    if (!dryRun) {
      const ok = window.confirm(
        `⚠️ IMPORT RÉEL (Dashboard)\n\n` +
        (toCreate.length ? `${toCreate.length} nouveaux comptes vont être CRÉÉS\n` : '') +
        (toUpdate.length ? `${toUpdate.length} comptes existants vont être MIS À JOUR\n` : '') +
        (toSkip.length   ? `${toSkip.length} comptes seront ignorés\n` : '') +
        `\nLes nouveaux comptes auront balance + DD + status set depuis le CSV.\n\n` +
        `Continuer ?`
      )
      if (!ok) return
    }

    setImporting(true)
    setImportResult(null)
    const report = {
      dryRun,
      created: 0,
      updated: 0,
      liquidated: 0,
      skipped: toSkip.length,
      perAccount: [],
      errors: [],
    }
    const nowIso = new Date().toISOString()

    try {
      // === 1. Récupère/crée la firme correspondante (Lucid Trading) ===
      let firmRow = null
      const firmName = parsed.accounts[0]?.firm
      if (firmName) {
        firmRow = existingFirms.find(f => f.name.toLowerCase() === firmName.toLowerCase())
        if (!firmRow) {
          if (!dryRun) {
            const { data, error } = await supabase
              .from('firms')
              .insert({ user_id: user.id, name: firmName, color: '#2d6fff' })
              .select().single()
            if (error) throw new Error(`Création firme ${firmName} : ${error.message}`)
            firmRow = data
          } else {
            firmRow = { id: '__dry_run_firm__', name: firmName }
          }
        }
      }

      // === 2. CREATE — nouveaux comptes avec balance + DD + status depuis CSV ===
      for (const acc of toCreate) {
        const m = mapping[acc.rithmicId]
        if (!firmRow) {
          report.errors.push(`${acc.rithmicId} : impossible de créer le compte (firme inconnue)`)
          continue
        }
        const payload = {
          user_id: user.id,
          firm_id: firmRow.id,
          buy_date: m.buyDate || nowIso.slice(0, 10),
          currency: acc.currency || 'USD',
          spent: Number(m.challengeCost) || 0,
          activation_fee: Number(m.activationFee) || 0,
          funded_date: acc.type === 'FUNDED' ? (m.fundedDate || null) : null,
          name: m.newName || generateAccountName(acc.rithmicId),
          plan_size: m.planSize || '50k',
          status: acc.liquidated ? 'Échoué' : (acc.type === 'FUNDED' ? 'Financé' : 'Challenge'),
          dd_type: 'trailing',
          // === Champs Rithmic sync ===
          rithmic_account_id: acc.rithmicId,
          rithmic_balance: acc.balance,
          rithmic_min_balance: acc.minBalance,
          rithmic_synced_at: nowIso,
          total_commissions: acc.totalCommission || null,
          liquidated_at: (acc.liquidated && acc.triggerTime) ? acc.triggerTime : null,
          notes: `Importé depuis Rithmic Dashboard le ${new Date().toLocaleDateString('fr-FR')}\nID Rithmic : ${acc.rithmicId}`,
        }

        if (!dryRun) {
          const { error } = await supabase.from('accounts').insert(payload)
          if (error) {
            report.errors.push(`Création ${acc.rithmicId} : ${error.message}`)
            continue
          }
        }
        report.created++
        if (acc.liquidated) report.liquidated++
        report.perAccount.push({
          rithmicId: acc.rithmicId,
          action: 'created',
          name: payload.name,
          balance: acc.balance,
          minBalance: acc.minBalance,
          bufferDD: acc.bufferDD,
          liquidated: acc.liquidated,
        })
      }

      // === 3. UPDATE — comptes existants ===
      for (const acc of toUpdate) {
        const targetId = mapping[acc.rithmicId].accountId
        const payload = {
          rithmic_account_id: acc.rithmicId,
          rithmic_balance: acc.balance,
          rithmic_min_balance: acc.minBalance,
          rithmic_synced_at: nowIso,
          total_commissions: acc.totalCommission || null,
        }
        if (acc.liquidated && acc.triggerTime) {
          payload.liquidated_at = acc.triggerTime
          payload.status = 'Échoué'
          report.liquidated++
        }

        if (!dryRun) {
          const { error } = await supabase
            .from('accounts')
            .update(payload)
            .eq('id', targetId)
            .eq('user_id', user.id)
          if (error) {
            report.errors.push(`Update ${acc.rithmicId} : ${error.message}`)
            continue
          }
        }
        report.updated++
        report.perAccount.push({
          rithmicId: acc.rithmicId,
          action: 'updated',
          balance: acc.balance,
          minBalance: acc.minBalance,
          bufferDD: acc.bufferDD,
          liquidated: acc.liquidated,
        })
      }

      setImportResult({ ok: true, report })
      if (!dryRun && onSuccess) onSuccess()
    } catch (err) {
      report.errors.push(err.message)
      setImportResult({ ok: false, error: err.message, report })
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <Section title="1 · Sélectionne ton CSV Trader Dashboard">
        <Card padding="lg">
          <DropZone
            fileName={fileName}
            dragOver={dragOver}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            placeholder="Format : Rithmic R|Trader Pro → Trader Dashboard → Export CSV"
          />
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </Card>
      </Section>

      {parseError && <ErrorCard message={parseError} />}

      {parsed && (
        <>
          <Section
            title="2 · État des comptes"
            action={
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge tone="blue">{parsed.accounts.length} comptes</Badge>
                <Badge tone="green">{parsed.totals.activeCount} actifs</Badge>
                {parsed.totals.atRiskCount > 0 && (
                  <Badge tone="amber">{parsed.totals.atRiskCount} à risque</Badge>
                )}
                {parsed.totals.liquidatedCount > 0 && (
                  <Badge tone="red">{parsed.totals.liquidatedCount} liquidés</Badge>
                )}
                <Badge tone="neutral">Total ${parsed.totals.totalBalance.toFixed(2)}</Badge>
              </div>
            }
          >
            {parsed.accounts.map((acc) => (
              <DashboardAccountCard
                key={acc.rithmicId}
                account={acc}
                mapping={mapping[acc.rithmicId]}
                existingAccounts={existingAccounts}
                existingFirms={existingFirms}
                loadingExisting={loadingExisting}
                onChangeMapping={(m) => setMapping(prev => ({ ...prev, [acc.rithmicId]: m }))}
              />
            ))}
          </Section>

          <ExecutionSection
            dryRun={dryRun}
            setDryRun={setDryRun}
            importing={importing}
            onLaunch={doImport}
            label="Mise à jour comptes"
          />

          {importResult && (
            <ResultSection result={importResult} onReset={reset} kind="dashboard" />
          )}
        </>
      )}
    </>
  )
}

// ============================================================================
// CARD : compte du PnL Statement (mode Trades)
// ============================================================================
function TradesAccountCard({ account, mapping, existingAccounts, existingFirms, loadingExisting, onChangeMapping }) {
  const [expanded, setExpanded] = useState(true)
  const isProfit = account.summary.netPnL >= 0
  if (!mapping) return null

  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <Badge tone={account.type === 'FUNDED' ? 'green' : 'amber'}>
              {account.type === 'FUNDED' ? '💰 FUNDED' : '🎯 EVAL'}
            </Badge>
            <code style={{ fontSize: 12, color: T.color.text2, fontFamily: T.font.mono }}>{account.rithmicId}</code>
            {account.firm && <Badge tone="blue">{account.firm}</Badge>}
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: T.color.text3, fontFamily: T.font.mono, flexWrap: 'wrap' }}>
            <span>Net : <strong style={{ color: isProfit ? T.color.green : T.color.red, fontSize: 13 }}>${account.summary.netPnL.toFixed(2)}</strong></span>
            <span>{account.trades.length} trades · {account.summary.fillCount} fills</span>
            <span>{account.summary.winRate.toFixed(1)}% wins</span>
            <span>Instr : {account.instruments.join(', ') || '—'}</span>
          </div>
        </div>
        <span style={{ fontSize: 14, color: T.color.text3 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <>
          <MappingBlock
            mapping={mapping}
            existingAccounts={existingAccounts}
            existingFirms={existingFirms}
            loadingExisting={loadingExisting}
            allowCreate={true}
            account={account}
            onChangeMapping={onChangeMapping}
          />
          <TradesPreviewTable trades={account.trades} />
        </>
      )}
    </Card>
  )
}

// ============================================================================
// CARD : compte du Dashboard (mode État)
// ============================================================================
function DashboardAccountCard({ account, mapping, existingAccounts, existingFirms, loadingExisting, onChangeMapping }) {
  const [expanded, setExpanded] = useState(true)
  if (!mapping) return null

  const buffer = account.bufferDD
  const bufferPct = account.balance > 0 ? (buffer / account.balance) * 100 : 0
  let bufferTone, bufferLabel
  if (account.liquidated) { bufferTone = 'red'; bufferLabel = '💀 LIQUIDÉ' }
  else if (buffer < 0) { bufferTone = 'red'; bufferLabel = '🚨 DÉPASSEMENT' }
  else if (bufferPct < 3) { bufferTone = 'amber'; bufferLabel = '⚠️ PROCHE' }
  else { bufferTone = 'green'; bufferLabel = '✓ SAFE' }

  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <Badge tone={account.type === 'FUNDED' ? 'green' : 'amber'}>
              {account.type === 'FUNDED' ? '💰 FUNDED' : '🎯 EVAL'}
            </Badge>
            <code style={{ fontSize: 12, color: T.color.text2, fontFamily: T.font.mono }}>{account.rithmicId}</code>
            {account.firm && <Badge tone="blue">{account.firm}</Badge>}
            <Badge tone={bufferTone}>{bufferLabel}</Badge>
            {mapping.autoMatched && (
              <Badge tone={mapping.matchStrategy === 'rithmic_id' ? 'green' : 'blue'}>
                ✓ AUTO-LIÉ {mapping.matchStrategy === 'rithmic_id' ? '(ID)' : '(NOM)'}
              </Badge>
            )}
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: T.color.text3, fontFamily: T.font.mono, flexWrap: 'wrap' }}>
            <span>Balance : <strong style={{ color: T.color.text, fontSize: 13 }}>${account.balance.toFixed(2)}</strong></span>
            <span>DD Min : <strong style={{ color: T.color.text2 }}>${account.minBalance.toFixed(2)}</strong></span>
            <span>Buffer : <strong style={{ color: buffer >= 0 ? T.color.green : T.color.red, fontSize: 13 }}>{buffer >= 0 ? '+' : ''}${buffer.toFixed(2)}</strong></span>
            {account.totalCommission > 0 && <span>Fees : ${account.totalCommission.toFixed(2)}</span>}
          </div>
          {account.liquidated && (
            <div style={{ marginTop: 6, fontSize: 11, color: T.color.red, fontFamily: T.font.mono }}>
              💀 Liquidé le {account.triggerTime?.replace('T', ' à ')} · {account.triggerStatus}
            </div>
          )}
        </div>
        <span style={{ fontSize: 14, color: T.color.text3 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <>
          <MappingBlock
            mapping={mapping}
            existingAccounts={existingAccounts}
            existingFirms={existingFirms}
            loadingExisting={loadingExisting}
            allowCreate={false}
            dashboardMode={true}
            account={account}
            onChangeMapping={onChangeMapping}
          />

          {/* Détails compte */}
          <div style={{
            marginTop: 14, padding: 14,
            background: T.color.surface2,
            border: `1px solid ${T.color.border}`,
            borderRadius: T.radius.md,
          }}>
            <div style={{ fontSize: 11, color: T.color.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, fontFamily: T.font.mono }}>
              Détails Rithmic
            </div>
            <div className="il-kv-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, fontFamily: T.font.mono }}>
              <KV k="Currency" v={account.currency} />
              <KV k="Auto Liquidate" v={account.autoLiquidate ? '✓ Enabled' : '✗ Disabled'} />
              <KV k="Net Position" v={account.netPosition === 0 ? 'Flat' : `${account.netPosition}`} />
              <KV k="Available Margin" v={`$${account.availableMargin.toFixed(2)}`} />
              <KV k="Cash on Hand" v={`$${account.cashOnHand.toFixed(2)}`} />
              <KV k="Cash EOD précédent" v={`$${account.cashOnHandPrevEOD.toFixed(2)}`} />
              <KV k="Risk Algorithm" v={account.riskAlgorithm || '—'} />
              <KV k="Account Name" v={account.accountName || '—'} />
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

function KV({ k, v }) {
  return (
    <div>
      <span style={{ color: T.color.text3 }}>{k} : </span>
      <span style={{ color: T.color.text2 }}>{v}</span>
    </div>
  )
}

// ============================================================================
// BLOC commun : mapping vers compte Quantara (réutilisé Trades + Dashboard)
// ============================================================================
// Filtre les comptes par firme détectée (ex: Lucid Trading) pour ne pas
// noyer l'user dans tous ses comptes Apex / PropFirm / etc.
// Toggle "Tout afficher" pour revenir à la liste complète.
function MappingBlock({ mapping, existingAccounts, existingFirms, loadingExisting, allowCreate, dashboardMode, account, onChangeMapping }) {
  // Mode Dashboard : mapping = { accountId, autoMatched }
  // Mode Trades :   mapping = { mode: 'create'|'existing', accountId?, newName?, planSize? }

  const [showAll, setShowAll] = useState(false)

  // Détecte la firme du compte CSV (account.firm = "Lucid Trading" via parser)
  const detectedFirmName = account?.firm
  const matchingFirm = detectedFirmName
    ? existingFirms.find(f => f.name.toLowerCase() === detectedFirmName.toLowerCase())
    : null

  // Filtre les comptes : si on a matché une firme et qu'on n'est pas en "tout afficher"
  const filteredAccounts = (matchingFirm && !showAll)
    ? existingAccounts.filter(ea => ea.firm_id === matchingFirm.id)
    : existingAccounts

  const optionStyle = { background: T.color.surfaceSolid, color: T.color.text }

  if (dashboardMode) {
    const mode = mapping.mode || (mapping.accountId ? 'existing' : 'skip')
    return (
      <div style={{
        marginTop: 16, padding: 14,
        background: T.color.surface2,
        border: `1px solid ${T.color.border}`,
        borderRadius: T.radius.md,
      }}>
        {/* Toggle 3 modes : existing / create / skip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10, flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontSize: 11, color: T.color.text3, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: T.font.mono }}>
            Action sur ce compte
          </div>
          <div className="il-mode-chips" style={{ display: 'flex', gap: 4 }}>
            <ModeChip active={mode === 'existing'} onClick={() => {
              onChangeMapping({ ...mapping, mode: 'existing', accountId: mapping.accountId || null })
            }} color={T.color.blueLight}>↻ Lier à existant</ModeChip>
            <ModeChip active={mode === 'create'} onClick={() => {
              const today = new Date().toISOString().slice(0, 10)
              const suggestedPrice = account?.firm ? defaultChallengePrice(account.firm, '50k') : null
              onChangeMapping({
                ...mapping,
                mode: 'create',
                newName: mapping.newName || generateAccountName(account?.rithmicId || ''),
                planSize: mapping.planSize || '50k',
                buyDate: mapping.buyDate || today,
                challengeCost: mapping.challengeCost ?? (suggestedPrice !== null ? String(suggestedPrice) : ''),
                activationFee: mapping.activationFee || '0',
                fundedDate: mapping.fundedDate || (account?.type === 'FUNDED' ? today : ''),
              })
            }} color={T.color.green}>➕ Créer nouveau</ModeChip>
            <ModeChip active={mode === 'skip'} onClick={() => {
              onChangeMapping({ ...mapping, mode: 'skip', accountId: null })
            }} color={T.color.text3}>⏭️ Skip</ModeChip>
          </div>
        </div>

        {/* === MODE EXISTING : dropdown vers compte existant === */}
        {mode === 'existing' && (
          <>
            <div style={{
              fontSize: 10, color: T.color.text3, textTransform: 'uppercase',
              letterSpacing: '0.1em', marginBottom: 6, fontFamily: T.font.mono,
            }}>
              Lier au compte Quantara
              {matchingFirm && !showAll && (
                <span style={{ marginLeft: 8, color: T.color.blueLight, textTransform: 'none', letterSpacing: 0 }}>
                  · filtré sur {matchingFirm.name}
                </span>
              )}
              {matchingFirm && (
                <span style={{ marginLeft: 8 }}>
                  <FilterToggle showAll={showAll} setShowAll={setShowAll} firmName={matchingFirm.name} />
                </span>
              )}
            </div>
            <select
              value={mapping.accountId || ''}
              onChange={(e) => onChangeMapping({ ...mapping, mode: 'existing', accountId: e.target.value || null, autoMatched: false })}
              style={inputStyle()}
            >
              <option value="" style={optionStyle}>— Choisir un compte —</option>
              {filteredAccounts.map((ea) => (
                <option key={ea.id} value={ea.id} style={optionStyle}>
                  {(ea.name || `Sans nom · ${ea.id.slice(0, 6)}`)} · {ea.plan_size} · {ea.status}
                  {ea.rithmic_account_id ? ` · 🔗 ${ea.rithmic_account_id.slice(-12)}` : ''}
                </option>
              ))}
            </select>
            {loadingExisting && <LoadingNote />}
            {mapping.autoMatched && (
              <div style={{ fontSize: 11, color: T.color.green, marginTop: 8, fontFamily: T.font.mono }}>
                ✓ Auto-lié via {
                  mapping.matchStrategy === 'rithmic_id' ? 'rithmic_account_id (exact)' :
                  mapping.matchStrategy === 'generated_name' ? `nom auto-généré ("${generateAccountName(account?.rithmicId || '')}")` :
                  mapping.matchStrategy === 'legacy_name' ? `nom legacy` :
                  mapping.matchStrategy === 'fuzzy_name' ? `nom approximatif` :
                  'auto-detection'
                }
              </div>
            )}
          </>
        )}

        {/* === MODE CREATE : form complet avec balance/DD préfilled depuis CSV === */}
        {mode === 'create' && (
          <>
            <div style={{
              fontSize: 10, color: T.color.green, textTransform: 'uppercase',
              letterSpacing: '0.1em', marginBottom: 8, fontFamily: T.font.mono,
            }}>
              Créer un nouveau compte Quantara
            </div>

            {/* Ligne 1 : Nom + Plan + Status auto */}
            <div className="il-form-row" style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <MicroLabel>Nom (auto-renommé)</MicroLabel>
                <input type="text" placeholder="PRO 7"
                  value={mapping.newName || ''}
                  onChange={(e) => onChangeMapping({ ...mapping, newName: e.target.value })}
                  style={inputStyle()} />
              </div>
              <div>
                <MicroLabel>Plan size</MicroLabel>
                <select value={mapping.planSize || '50k'}
                  onChange={(e) => onChangeMapping({ ...mapping, planSize: e.target.value })}
                  style={{ ...inputStyle(), width: 100 }}
                >
                  <option value="25k" style={optionStyle}>25k</option>
                  <option value="50k" style={optionStyle}>50k</option>
                  <option value="100k" style={optionStyle}>100k</option>
                  <option value="150k" style={optionStyle}>150k</option>
                  <option value="250k" style={optionStyle}>250k</option>
                </select>
              </div>
              <div>
                <MicroLabel>Status (auto)</MicroLabel>
                <div style={{
                  padding: '8px 14px', fontSize: 13, fontWeight: 600,
                  background: account?.type === 'FUNDED' ? 'rgba(16,185,129,0.12)' : 'rgba(250,199,117,0.12)',
                  border: `1px solid ${account?.type === 'FUNDED' ? 'rgba(16,185,129,0.3)' : 'rgba(250,199,117,0.3)'}`,
                  color: account?.type === 'FUNDED' ? T.color.green : T.color.amber,
                  borderRadius: T.radius.md, fontFamily: T.font.mono, letterSpacing: '0.05em',
                }}>
                  {account?.type === 'FUNDED' ? '💰 Financé' : '🎯 Challenge'}
                </div>
              </div>
            </div>

            {/* Bloc Achat challenge */}
            <div style={{
              padding: 12, marginTop: 8,
              background: 'rgba(45,111,255,0.04)',
              border: `1px solid rgba(45,111,255,0.18)`,
              borderRadius: T.radius.md,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: T.color.blueLight,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: 8, fontFamily: T.font.mono,
              }}>
                {account?.type === 'FUNDED' ? 'Achat du challenge initial' : 'Achat du challenge'}
              </div>
              <div className="il-form-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <MicroLabel>Date d'achat</MicroLabel>
                  <input type="date"
                    value={mapping.buyDate || ''}
                    onChange={(e) => onChangeMapping({ ...mapping, buyDate: e.target.value })}
                    style={inputStyle()} />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <MicroLabel>Coût du challenge ($)</MicroLabel>
                  <input type="number" min="0" step="0.01" placeholder="165.00"
                    value={mapping.challengeCost || ''}
                    onChange={(e) => onChangeMapping({ ...mapping, challengeCost: e.target.value })}
                    style={inputStyle()} />
                </div>
              </div>
            </div>

            {/* Bloc Passage financé (FUNDED uniquement) */}
            {account?.type === 'FUNDED' && (
              <div style={{
                padding: 12, marginTop: 8,
                background: 'rgba(16,185,129,0.04)',
                border: `1px solid rgba(16,185,129,0.18)`,
                borderRadius: T.radius.md,
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: T.color.green,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  marginBottom: 8, fontFamily: T.font.mono,
                }}>
                  Passage en compte financé
                </div>
                <div className="il-form-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <MicroLabel>Date passage financé</MicroLabel>
                    <input type="date"
                      value={mapping.fundedDate || ''}
                      onChange={(e) => onChangeMapping({ ...mapping, fundedDate: e.target.value })}
                      style={inputStyle()} />
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <MicroLabel>Frais activation ($) — 0 si aucun</MicroLabel>
                    <input type="number" min="0" step="0.01" placeholder="0"
                      value={mapping.activationFee || ''}
                      onChange={(e) => onChangeMapping({ ...mapping, activationFee: e.target.value })}
                      style={inputStyle()} />
                  </div>
                </div>
              </div>
            )}

            {/* Info : balance + DD seront set automatiquement depuis le CSV */}
            <div style={{
              marginTop: 8, padding: 10,
              background: 'rgba(255,255,255,0.025)',
              border: `1px dashed ${T.color.border}`,
              borderRadius: T.radius.md,
              fontSize: 11, color: T.color.text3, fontFamily: T.font.mono, lineHeight: 1.5,
            }}>
              ⚡ Données auto-importées depuis le CSV : balance ${account?.balance?.toFixed(2) || '?'} · DD min ${account?.minBalance?.toFixed(2) || '?'} · {account?.liquidated ? `💀 liquidé ${account?.triggerTime?.replace('T', ' à ')}` : '✓ actif'}
            </div>
          </>
        )}

        {/* === MODE SKIP === */}
        {mode === 'skip' && (
          <div style={{
            padding: 12,
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${T.color.border}`,
            borderRadius: T.radius.md,
            fontSize: 12, color: T.color.text3, fontFamily: T.font.mono,
          }}>
            ⏭️ Ce compte sera ignoré lors de l'import.
          </div>
        )}
      </div>
    )
  }

  // === Mode Trades ===
  return (
    <div style={{
      marginTop: 16, padding: 14,
      background: T.color.surface2,
      border: `1px solid ${T.color.border}`,
      borderRadius: T.radius.md,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 11, color: T.color.text3, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: T.font.mono }}>
          Mapping vers Quantara
          {matchingFirm && !showAll && (
            <span style={{ marginLeft: 8, color: T.color.blueLight, textTransform: 'none', letterSpacing: 0 }}>
              · filtré sur {matchingFirm.name}
            </span>
          )}
        </div>
        {matchingFirm && (
          <FilterToggle showAll={showAll} setShowAll={setShowAll} firmName={matchingFirm.name} />
        )}
      </div>
      <select
        value={mapping.mode === 'existing' ? mapping.accountId : '__create__'}
        onChange={(e) => {
          if (e.target.value === '__create__') {
            const firstTradeDate = account.trades?.[0]?.date || new Date().toISOString().slice(0, 10)
            onChangeMapping({
              mode: 'create',
              newName: generateAccountName(account.rithmicId),
              planSize: '50k',
              buyDate: firstTradeDate,
              challengeCost: '',
              activationFee: '0',
              fundedDate: account.type === 'FUNDED' ? firstTradeDate : '',
            })
          } else {
            onChangeMapping({ mode: 'existing', accountId: e.target.value })
          }
        }}
        style={inputStyle()}
      >
        {allowCreate && <option value="__create__" style={optionStyle}>➕ Créer un nouveau compte Quantara</option>}
        {filteredAccounts.map((ea) => (
          <option key={ea.id} value={ea.id} style={optionStyle}>
            {(ea.name || `Sans nom · ${ea.id.slice(0, 6)}`)} · {ea.plan_size} · {ea.status}
            {ea.rithmic_account_id ? ` · 🔗 ${ea.rithmic_account_id.slice(-12)}` : ''}
          </option>
        ))}
      </select>
      {loadingExisting && <LoadingNote />}

      {mapping.mode === 'create' && (
        <div style={{ marginTop: 12 }}>
          {/* Ligne 1 : Nom + Plan size + Status auto-détecté */}
          <div className="il-form-row" style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <MicroLabel>Nom du compte (auto-renommé)</MicroLabel>
              <input
                type="text"
                placeholder="PRO 7"
                value={mapping.newName || ''}
                onChange={(e) => onChangeMapping({ ...mapping, newName: e.target.value })}
                style={inputStyle()}
              />
            </div>
            <div>
              <MicroLabel>Plan size</MicroLabel>
              <select
                value={mapping.planSize || '50k'}
                onChange={(e) => onChangeMapping({ ...mapping, planSize: e.target.value })}
                style={{ ...inputStyle(), width: 100 }}
              >
                <option value="25k" style={optionStyle}>25k</option>
                <option value="50k" style={optionStyle}>50k</option>
                <option value="100k" style={optionStyle}>100k</option>
                <option value="150k" style={optionStyle}>150k</option>
                <option value="250k" style={optionStyle}>250k</option>
              </select>
            </div>
            <div>
              <MicroLabel>Status (auto)</MicroLabel>
              <div style={{
                padding: '8px 14px', fontSize: 13, fontWeight: 600,
                background: account.type === 'FUNDED' ? 'rgba(16,185,129,0.12)' : 'rgba(250,199,117,0.12)',
                border: `1px solid ${account.type === 'FUNDED' ? 'rgba(16,185,129,0.3)' : 'rgba(250,199,117,0.3)'}`,
                color: account.type === 'FUNDED' ? T.color.green : T.color.amber,
                borderRadius: T.radius.md, fontFamily: T.font.mono, letterSpacing: '0.05em',
              }}>
                {account.type === 'FUNDED' ? '💰 Financé' : '🎯 Challenge'}
              </div>
            </div>
          </div>

          {/* Ligne 2 : Achat challenge (TOUJOURS demandé) */}
          <div style={{
            padding: 12, marginTop: 8,
            background: 'rgba(45,111,255,0.04)',
            border: `1px solid rgba(45,111,255,0.18)`,
            borderRadius: T.radius.md,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: T.color.blueLight,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: 8, fontFamily: T.font.mono,
            }}>
              {account.type === 'FUNDED' ? 'Achat du challenge initial' : 'Achat du challenge'}
            </div>
            <div className="il-form-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <MicroLabel>Date d'achat</MicroLabel>
                <input
                  type="date"
                  value={mapping.buyDate || ''}
                  onChange={(e) => onChangeMapping({ ...mapping, buyDate: e.target.value })}
                  style={inputStyle()}
                />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <MicroLabel>Coût du challenge ($)</MicroLabel>
                <input
                  type="number" min="0" step="0.01"
                  placeholder="165.00"
                  value={mapping.challengeCost || ''}
                  onChange={(e) => onChangeMapping({ ...mapping, challengeCost: e.target.value })}
                  style={inputStyle()}
                />
              </div>
            </div>
          </div>

          {/* Ligne 3 : Activation + funded_date (FUNDED uniquement) */}
          {account.type === 'FUNDED' && (
            <div style={{
              padding: 12, marginTop: 8,
              background: 'rgba(16,185,129,0.04)',
              border: `1px solid rgba(16,185,129,0.18)`,
              borderRadius: T.radius.md,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: T.color.green,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: 8, fontFamily: T.font.mono,
              }}>
                Passage en compte financé
              </div>
              <div className="il-form-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <MicroLabel>Date passage financé</MicroLabel>
                  <input
                    type="date"
                    value={mapping.fundedDate || ''}
                    onChange={(e) => onChangeMapping({ ...mapping, fundedDate: e.target.value })}
                    style={inputStyle()}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <MicroLabel>Frais activation ($) — 0 si aucun</MicroLabel>
                  <input
                    type="number" min="0" step="0.01"
                    placeholder="0"
                    value={mapping.activationFee || ''}
                    onChange={(e) => onChangeMapping({ ...mapping, activationFee: e.target.value })}
                    style={inputStyle()}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Mini-label uniforme pour les champs de formulaire
// Chip de sélection de mode (Existing/Create/Skip)
function ModeChip({ active, onClick, children, color }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        padding: '5px 10px', fontSize: 10,
        background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
        color: active ? color : T.color.text3,
        border: `1px solid ${active ? `${color}66` : T.color.border}`,
        borderRadius: T.radius.sm,
        cursor: 'pointer', fontFamily: T.font.mono,
        fontWeight: active ? 600 : 500, letterSpacing: '0.05em',
      }}
    >{children}</button>
  )
}

function MicroLabel({ children }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 600, color: T.color.text3,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      marginBottom: 4, fontFamily: T.font.mono,
    }}>{children}</div>
  )
}

// Petit bouton toggle pour basculer "filtré sur firme X" / "tout afficher"
function FilterToggle({ showAll, setShowAll, firmName }) {
  return (
    <button
      type="button"
      onClick={() => setShowAll(!showAll)}
      style={{
        fontSize: 10, padding: '4px 10px',
        background: showAll ? T.color.blueSoft : 'rgba(255,255,255,0.04)',
        color: showAll ? T.color.blueLight : T.color.text3,
        border: `1px solid ${showAll ? T.color.blueRing : T.color.border}`,
        borderRadius: T.radius.sm, cursor: 'pointer',
        fontFamily: T.font.mono, letterSpacing: '0.05em',
      }}
    >
      {showAll ? `↺ Filtrer sur ${firmName}` : '👁 Tout afficher'}
    </button>
  )
}

// ============================================================================
// TABLE : preview des 10 premiers trades
// ============================================================================
function TradesPreviewTable({ trades }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, color: T.color.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, fontFamily: T.font.mono }}>
        Aperçu — {Math.min(10, trades.length)} premiers trades
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 320, border: `1px solid ${T.color.border}`, borderRadius: T.radius.md }}>
        <table style={{ width: '100%', fontSize: 11, fontFamily: T.font.mono, borderCollapse: 'collapse', background: T.color.surfaceSolid }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, background: T.color.surface2Solid, textAlign: 'left', color: T.color.text3, zIndex: 1 }}>
              <th style={th}>Date</th><th style={th}>Inst.</th><th style={th}>Side</th>
              <th style={{ ...th, textAlign: 'right' }}>Qty</th>
              <th style={{ ...th, textAlign: 'right' }}>Entry</th>
              <th style={{ ...th, textAlign: 'right' }}>Exit</th>
              <th style={{ ...th, textAlign: 'right' }}>Net P&L</th>
              <th style={{ ...th, textAlign: 'right' }}>Fills</th>
              <th style={{ ...th, textAlign: 'right' }}>Hold</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 10).map((t, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${T.color.border}` }}>
                <td style={td}>{t.date}</td>
                <td style={td}>{t.instrument}</td>
                <td style={{ ...td, color: t.side === 'LONG' ? T.color.green : T.color.red, fontWeight: 600 }}>{t.side}</td>
                <td style={{ ...td, textAlign: 'right' }}>{t.qty}</td>
                <td style={{ ...td, textAlign: 'right' }}>{t.entryPrice}</td>
                <td style={{ ...td, textAlign: 'right' }}>{t.exitPrice}</td>
                <td style={{ ...td, textAlign: 'right', color: t.netPnL >= 0 ? T.color.green : T.color.red, fontWeight: 600 }}>{t.netPnL.toFixed(2)}</td>
                <td style={{ ...td, textAlign: 'right', color: T.color.text3 }}>{t.fillCount}</td>
                <td style={{ ...td, textAlign: 'right', color: T.color.text3 }}>{formatHold(t.holdSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {trades.length > 10 && (
        <div style={{ padding: 8, fontSize: 11, color: T.color.text3, textAlign: 'center', fontFamily: T.font.mono }}>
          ... et {trades.length - 10} autres
        </div>
      )}
    </div>
  )
}

// ============================================================================
// BLOC commun : sélecteur Dry Run / Import + bouton lancement
// ============================================================================
function ExecutionSection({ dryRun, setDryRun, importing, onLaunch, label }) {
  return (
    <Section title="3 · Mode d'exécution">
      <Card>
        <label style={modeRowStyle(dryRun, T.color.blueSoft, T.color.blueRing)}>
          <input type="radio" name="exec-mode" checked={dryRun} onChange={() => setDryRun(true)} style={{ marginTop: 3 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>🔍 Dry Run (recommandé)</div>
            <div style={{ fontSize: 12, color: T.color.text2 }}>Simule et affiche le rapport. <strong>N'écrit rien en DB.</strong></div>
          </div>
        </label>

        <label style={modeRowStyle(!dryRun, T.color.amberSoft, 'rgba(250,199,117,0.4)')}>
          <input type="radio" name="exec-mode" checked={!dryRun} onChange={() => setDryRun(false)} style={{ marginTop: 3 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: T.color.amber }}>⚠️ Import réel</div>
            <div style={{ fontSize: 12, color: T.color.text2 }}>Écrit en Supabase. Confirmation popup requise.</div>
          </div>
        </label>

        <div style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Btn
            variant={dryRun ? 'blue' : 'primary'}
            size="lg"
            onClick={onLaunch}
            disabled={importing}
            style={!dryRun ? { background: T.color.amber, color: '#000' } : {}}
          >
            {importing
              ? '⏳ Traitement...'
              : dryRun ? `🔍 Lancer le dry run (${label})` : `⚠️ Lancer l'import réel (${label})`
            }
          </Btn>
        </div>
      </Card>
    </Section>
  )
}

// ============================================================================
// BLOC : affichage du résultat (rapport)
// ============================================================================
function ResultSection({ result, onReset, kind }) {
  const r = result.report
  return (
    <Section title="4 · Rapport">
      <Card style={{
        borderColor: result.ok ? T.color.green : T.color.red,
        background: result.ok ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: result.ok ? T.color.green : T.color.red }}>
          {result.ok
            ? (r.dryRun ? '🔍 Dry run terminé avec succès' : '✅ Import réel terminé')
            : '❌ Erreur durant l\'import'
          }
        </div>

        {!result.ok && (
          <div style={{
            fontSize: 12, color: T.color.red, fontFamily: T.font.mono,
            padding: 10, background: 'rgba(0,0,0,0.3)',
            borderRadius: T.radius.sm, marginBottom: 12,
          }}>
            {result.error}
          </div>
        )}

        <div style={{ fontSize: 13, color: T.color.text2, lineHeight: 1.9, fontFamily: T.font.mono }}>
          {kind === 'trades' ? (
            <>
              <div>• Firmes créées : <strong style={{ color: T.color.text }}>{r.createdFirms}</strong></div>
              <div>• Comptes créés : <strong style={{ color: T.color.text }}>{r.createdAccounts}</strong></div>
              <div>• Comptes réutilisés : <strong style={{ color: T.color.text }}>{r.reusedAccounts}</strong></div>
              <div>• Trades insérés : <strong style={{ color: T.color.green }}>{r.insertedTrades}</strong></div>
              <div>• Doublons ignorés : <strong style={{ color: T.color.text3 }}>{r.skippedDuplicates}</strong></div>
            </>
          ) : (
            <>
              <div>• Comptes créés : <strong style={{ color: T.color.green }}>{r.created || 0}</strong></div>
              <div>• Comptes mis à jour : <strong style={{ color: T.color.green }}>{r.updated}</strong></div>
              <div>• Comptes liquidés détectés : <strong style={{ color: r.liquidated > 0 ? T.color.red : T.color.text3 }}>{r.liquidated}</strong></div>
              <div>• Comptes ignorés (skip) : <strong style={{ color: T.color.text3 }}>{r.skipped}</strong></div>
            </>
          )}
        </div>

        {r.perAccount?.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.color.border}` }}>
            <div style={{ fontSize: 11, color: T.color.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Détail par compte
            </div>
            {r.perAccount.map((p, i) => (
              <div key={i} style={{ fontSize: 12, color: T.color.text2, fontFamily: T.font.mono, marginBottom: 4 }}>
                {kind === 'trades' ? (
                  <><code>{p.rithmicId}</code> → {p.tradesToInsert} insérés, {p.skipped} skip</>
                ) : (
                  <>
                    <span style={{
                      color: p.action === 'created' ? T.color.green : T.color.blueLight,
                      fontWeight: 600, marginRight: 4,
                    }}>
                      {p.action === 'created' ? '➕ CRÉÉ' : '↻ UPDATED'}
                    </span>
                    <code>{p.rithmicId}</code>
                    {p.name && <> · <strong style={{ color: T.color.text }}>{p.name}</strong></>}
                    {' '}→ bal ${p.balance.toFixed(2)} / min ${p.minBalance.toFixed(2)} / buffer ${p.bufferDD.toFixed(2)}
                    {p.liquidated && <span style={{ color: T.color.red }}> · 💀 LIQUIDÉ</span>}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {r.errors?.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.color.red}` }}>
            <div style={{ fontSize: 11, color: T.color.red, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Erreurs</div>
            {r.errors.map((e, i) => (
              <div key={i} style={{ fontSize: 12, color: T.color.red, fontFamily: T.font.mono, marginBottom: 4 }}>· {e}</div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
          <Btn variant="ghost" size="sm" onClick={onReset}>↺ Nouveau fichier</Btn>
          {result.ok && !r.dryRun && (
            <Link href={kind === 'trades' ? '/app/journal-sync' : '/app'} style={{ textDecoration: 'none' }}>
              <Btn variant="blue" size="sm">
                {kind === 'trades' ? '→ Voir dans Journal Sync' : '→ Voir mes comptes'}
              </Btn>
            </Link>
          )}
        </div>
      </Card>
    </Section>
  )
}

// ============================================================================
// COMPOSANTS UTILITAIRES
// ============================================================================

function DropZone({ fileName, dragOver, onDrop, onDragOver, onDragLeave, onClick, placeholder }) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onClick}
      style={{
        border: `2px dashed ${dragOver ? T.color.blueLight : T.color.borderStrong}`,
        borderRadius: T.radius.lg,
        padding: 40, textAlign: 'center', cursor: 'pointer',
        background: dragOver ? T.color.blueSoft : 'rgba(255,255,255,0.02)',
        transition: T.transition.base,
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>{fileName ? '📄' : '📁'}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: T.color.text }}>
        {fileName || 'Glisse ton fichier CSV ici'}
      </div>
      <div style={{ fontSize: 12, color: T.color.text3 }}>
        ou clique pour parcourir · {placeholder}
      </div>
    </div>
  )
}

function ErrorCard({ message }) {
  return (
    <Card style={{ borderColor: T.color.red, background: T.color.redSoft, marginBottom: 24 }}>
      <div style={{ color: T.color.red, fontSize: 13 }}>❌ {message}</div>
    </Card>
  )
}

function LoadingNote() {
  return (
    <div style={{ fontSize: 11, color: T.color.text3, marginTop: 6 }}>⏳ Chargement des comptes existants...</div>
  )
}

function FullPageState({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: T.color.bg, color: T.color.text,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center',
      fontFamily: T.font.sans,
    }}>{children}</div>
  )
}

// ============================================================================
// Helpers
// ============================================================================
const th = { padding: '8px 10px', fontWeight: 600, letterSpacing: '0.05em' }
const td = { padding: '6px 10px', color: T.color.text2 }

function inputStyle() {
  return {
    width: '100%', padding: 10, fontSize: 13,
    background: T.color.surfaceSolid, color: T.color.text,
    border: `1px solid ${T.color.borderStrong}`,
    borderRadius: T.radius.md,
    fontFamily: T.font.sans, outline: 'none',
  }
}

function modeRowStyle(active, bg, borderColor) {
  return {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: 12, borderRadius: T.radius.md,
    background: active ? bg : 'transparent',
    border: `1px solid ${active ? borderColor : T.color.border}`,
    marginBottom: 10, cursor: 'pointer',
  }
}

function formatHold(seconds) {
  if (!seconds) return '—'
  if (seconds < 60) return `${seconds.toFixed(0)}s`
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

function countToCreate(parsed, mapping) {
  let count = 0
  for (const acc of parsed.accounts) {
    if (mapping[acc.rithmicId]?.mode === 'create') count++
  }
  return count
}
