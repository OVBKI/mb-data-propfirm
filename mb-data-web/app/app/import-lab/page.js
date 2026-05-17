'use client'
// Page ISOLÉE pour tester l'import CSV Rithmic R|Trader Pro Performance.
// - Accessible uniquement aux emails admin
// - Mode "Dry Run" par défaut : aucun écriture en DB
// - Détection auto multi-comptes (Lucid Trading actuellement)
// - Mapping : créer nouveau compte Quantara OU lier à existant
// - Dédoublonnage via marker dans la colonne `notes` : [rithmic:ENTRY/EXIT]
//
// Aucun import dans /app/page.js — cette page est totalement indépendante
// pour ne RIEN casser de la prod tant que le système n'est pas validé.

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import { parseRithmicPnL } from '../../../lib/importers/rithmic-pnl'
import { T } from '../../../components/dashboard/theme'
import { Card, Btn, Badge, PageHeader, Section, UIStyles } from '../../../components/dashboard/ui'

// Doit matcher ADMIN_EMAILS de app/admin/layout.js et les RLS Supabase
const ADMIN_EMAILS = [
  'bakkali-omar@hotmail.com',
  'omar.mbtrading@gmail.com',
  'admin@quantara.tech',
]

export default function ImportLabPage() {
  // === État Auth ===
  const [user, setUser] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  // === État Fichier / Parsing ===
  const [fileName, setFileName] = useState('')
  const [parsed, setParsed] = useState(null)
  const [parseError, setParseError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  // === État Données Quantara existantes ===
  const [existingFirms, setExistingFirms] = useState([])
  const [existingAccounts, setExistingAccounts] = useState([])
  const [loadingExisting, setLoadingExisting] = useState(false)

  // === État Mapping : rithmicId → { mode, accountId, newName, planSize } ===
  const [mapping, setMapping] = useState({})

  // === État Import ===
  const [dryRun, setDryRun] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [confirmReal, setConfirmReal] = useState(false)

  const fileInputRef = useRef(null)

  // ==========================================================================
  // Init : Auth + chargement données existantes
  // ==========================================================================
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user || null
      setUser(u)
      setLoadingAuth(false)
      if (u && ADMIN_EMAILS.includes(u.email)) {
        loadExistingData()
      }
    })

    async function loadExistingData() {
      setLoadingExisting(true)
      const [firmsRes, accountsRes] = await Promise.all([
        supabase.from('firms').select('id, name, color').order('name'),
        supabase.from('accounts').select('id, firm_id, name, plan_size, status, buy_date').order('buy_date', { ascending: false }),
      ])
      if (!mounted) return
      setExistingFirms(firmsRes.data || [])
      setExistingAccounts(accountsRes.data || [])
      setLoadingExisting(false)
    }

    return () => { mounted = false }
  }, [])

  // ==========================================================================
  // Gestion fichier CSV
  // ==========================================================================
  function handleFile(file) {
    setFileName(file.name)
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      try {
        const result = parseRithmicPnL(text)
        setParsed(result)
        setParseError('')
        // Initialise le mapping : tous en mode "create" par défaut
        const initialMapping = {}
        for (const acc of result.accounts) {
          // Suggestion de nom : derniers 11 chars (ex: "07-TEST017")
          const suggested = acc.rithmicId.slice(-11)
          initialMapping[acc.rithmicId] = {
            mode: 'create',
            newName: suggested,
            planSize: '50k', // user pourra changer
          }
        }
        setMapping(initialMapping)
      } catch (err) {
        setParseError(err.message)
        setParsed(null)
      }
    }
    reader.onerror = () => {
      setParseError('Erreur de lecture du fichier')
      setParsed(null)
    }
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

  // ==========================================================================
  // Import réel (ou dry run)
  // ==========================================================================
  async function doImport() {
    if (!parsed || !user) return

    // Garde-fou : import réel = double confirmation
    if (!dryRun && !confirmReal) {
      const ok = window.confirm(
        `⚠️ IMPORT RÉEL\n\n` +
        `Tu vas écrire dans Supabase :\n` +
        `- ${countToCreate(parsed, mapping)} nouveaux comptes\n` +
        `- ${parsed.totals.tradeCount} trades (avant dédoublonnage)\n\n` +
        `Cette opération NE PEUT PAS être annulée automatiquement.\n\n` +
        `Continuer ?`
      )
      if (!ok) return
      setConfirmReal(true)
    }

    setImporting(true)
    setImportResult(null)

    const report = {
      dryRun,
      startedAt: new Date().toISOString(),
      createdFirms: 0,
      createdAccounts: 0,
      reusedAccounts: 0,
      insertedTrades: 0,
      skippedDuplicates: 0,
      perAccount: [],
      errors: [],
    }

    try {
      // ===== 1. Récupère/crée la firme "Lucid Trading" =====
      let lucidFirm = existingFirms.find(f => f.name.toLowerCase().includes('lucid'))
      if (!lucidFirm) {
        if (!dryRun) {
          const { data, error } = await supabase
            .from('firms')
            .insert({ user_id: user.id, name: 'Lucid Trading', color: '#2d6fff' })
            .select()
            .single()
          if (error) throw new Error(`Création firme Lucid : ${error.message}`)
          lucidFirm = data
          // Mise à jour locale
          setExistingFirms(prev => [...prev, data])
        } else {
          lucidFirm = { id: '__dry_run_firm__', name: 'Lucid Trading' }
        }
        report.createdFirms++
      }

      // ===== 2. Pour chaque compte du CSV : create ou link =====
      const accountIdMap = {} // rithmicId → quantara account.id
      for (const acc of parsed.accounts) {
        const m = mapping[acc.rithmicId]
        if (!m) continue

        if (m.mode === 'existing' && m.accountId) {
          accountIdMap[acc.rithmicId] = m.accountId
          report.reusedAccounts++
        } else if (m.mode === 'create') {
          const accountPayload = {
            user_id: user.id,
            firm_id: lucidFirm.id,
            buy_date: acc.trades[0]?.date || new Date().toISOString().slice(0, 10),
            currency: 'USD',
            spent: 0,
            name: m.newName || acc.rithmicId,
            plan_size: m.planSize || '50k',
            status: acc.type === 'FUNDED' ? 'Financé' : 'Challenge',
            dd_type: 'trailing', // Lucid = trailing par défaut
            notes: `Importé depuis Rithmic le ${new Date().toLocaleDateString('fr-FR')}\nID Rithmic : ${acc.rithmicId}`,
          }
          if (!dryRun) {
            const { data, error } = await supabase
              .from('accounts')
              .insert(accountPayload)
              .select()
              .single()
            if (error) throw new Error(`Création compte ${acc.rithmicId} : ${error.message}`)
            accountIdMap[acc.rithmicId] = data.id
          } else {
            accountIdMap[acc.rithmicId] = `__dry_run_acc_${acc.rithmicId}__`
          }
          report.createdAccounts++
        }
      }

      // ===== 3. Pour chaque compte : insert trades avec dédoublonnage =====
      for (const acc of parsed.accounts) {
        const accountId = accountIdMap[acc.rithmicId]
        if (!accountId) continue

        const perAcc = {
          rithmicId: acc.rithmicId,
          tradesToInsert: 0,
          skipped: 0,
        }

        // Récupère les markers déjà présents
        let existingMarkers = new Set()
        if (!dryRun) {
          const { data, error } = await supabase
            .from('journal_entries')
            .select('notes')
            .eq('account_id', accountId)
            .like('notes', '%[rithmic:%')
          if (error) {
            report.errors.push(`Compte ${acc.rithmicId} (fetch existing) : ${error.message}`)
          } else {
            for (const e of (data || [])) {
              const m = (e.notes || '').match(/\[rithmic:(\d+)\/(\d+)\]/)
              if (m) existingMarkers.add(`${m[1]}/${m[2]}`)
            }
          }
        }

        // Prépare les lignes à insérer
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
            pnl: t.netPnL,
            instrument: t.instrument,
            side: t.side,
            entry_price: t.entryPrice,
            exit_price: t.exitPrice,
            notes: `[rithmic:${marker}] qty=${t.qty} fills=${t.fillCount} hold=${t.holdSeconds}s entry=${t.entryTime} exit=${t.exitTime}`,
          })
        }

        if (rows.length > 0) {
          if (!dryRun) {
            // Insert par batch de 100 pour éviter les limites
            for (let i = 0; i < rows.length; i += 100) {
              const batch = rows.slice(i, i + 100)
              const { error } = await supabase.from('journal_entries').insert(batch)
              if (error) {
                report.errors.push(`Compte ${acc.rithmicId} (insert batch ${i}) : ${error.message}`)
                break
              }
            }
          }
          perAcc.tradesToInsert = rows.length
          report.insertedTrades += rows.length
        }

        report.perAccount.push(perAcc)
      }

      report.finishedAt = new Date().toISOString()
      setImportResult({ ok: true, report })
    } catch (err) {
      report.errors.push(err.message)
      setImportResult({ ok: false, error: err.message, report })
    } finally {
      setImporting(false)
    }
  }

  // ==========================================================================
  // Reset
  // ==========================================================================
  function reset() {
    setFileName('')
    setParsed(null)
    setParseError('')
    setMapping({})
    setImportResult(null)
    setConfirmReal(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ==========================================================================
  // Gardes d'accès
  // ==========================================================================
  if (loadingAuth) {
    return (
      <FullPageState>
        <div style={{ color: T.color.text3 }}>⏳ Vérification accès...</div>
      </FullPageState>
    )
  }

  if (!user) {
    return (
      <FullPageState>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Connexion requise</h1>
        <p style={{ color: T.color.text2, marginBottom: 16 }}>Cette page est réservée aux administrateurs.</p>
        <Link href="/app" style={{ color: T.color.blueLight, textDecoration: 'none' }}>
          ← Page de connexion
        </Link>
      </FullPageState>
    )
  }

  if (!ADMIN_EMAILS.includes(user.email)) {
    return (
      <FullPageState>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Accès admin requis</h1>
        <p style={{ fontSize: 12, color: T.color.text3, fontFamily: T.font.mono, marginBottom: 16 }}>
          {user.email}
        </p>
        <Link href="/app" style={{ color: T.color.blueLight, textDecoration: 'none' }}>
          ← Retour à l'app
        </Link>
      </FullPageState>
    )
  }

  // ==========================================================================
  // Render principal
  // ==========================================================================
  return (
    <div style={{
      minHeight: '100vh',
      background: T.color.bg,
      color: T.color.text,
      padding: '32px 24px',
      fontFamily: T.font.sans,
    }}>
      <UIStyles />
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PageHeader
          eyebrow="ADMIN LAB · BETA"
          title="Import Lab — Rithmic CSV"
          subtitle="Page isolée pour tester l'import CSV. Mode dry-run par défaut, aucune écriture en DB tant que tu ne bascules pas en import réel."
          actions={
            <>
              {parsed && (
                <Btn variant="ghost" size="sm" onClick={reset}>
                  Reset
                </Btn>
              )}
              <Link href="/app" style={{ textDecoration: 'none' }}>
                <Btn variant="ghost" size="sm">← Retour app</Btn>
              </Link>
            </>
          }
        />

        {/* ===== STEP 1 : Drop CSV ===== */}
        <Section title="1 · Sélectionne ton CSV Rithmic">
          <Card padding="lg">
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? T.color.blueLight : T.color.borderStrong}`,
                borderRadius: T.radius.lg,
                padding: 40,
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? T.color.blueSoft : 'rgba(255,255,255,0.02)',
                transition: T.transition.base,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{fileName ? '📄' : '📁'}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: T.color.text }}>
                {fileName || 'Glisse ton fichier CSV ici'}
              </div>
              <div style={{ fontSize: 12, color: T.color.text3 }}>
                ou clique pour parcourir · Format attendu : Rithmic R|Trader Pro → Performance → Export CSV
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
            </div>
          </Card>
        </Section>

        {/* ===== ERREUR PARSING ===== */}
        {parseError && (
          <Card style={{
            borderColor: T.color.red,
            background: T.color.redSoft,
            marginBottom: 24,
          }}>
            <div style={{ color: T.color.red, fontSize: 13 }}>❌ {parseError}</div>
          </Card>
        )}

        {/* ===== STEP 2 : Preview ===== */}
        {parsed && (
          <>
            <Section
              title={`2 · Détection`}
              action={
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, color: T.color.text3, fontFamily: T.font.mono }}>
                  <Badge tone="blue">{parsed.accounts.length} comptes</Badge>
                  <Badge tone="neutral">{parsed.totals.tradeCount} trades</Badge>
                  <Badge tone="neutral">{parsed.totals.fillCount} fills bruts</Badge>
                  <Badge tone={parsed.totals.netPnL >= 0 ? 'green' : 'red'}>
                    Net ${parsed.totals.netPnL.toFixed(2)}
                  </Badge>
                </div>
              }
            >
              {parsed.warnings.length > 0 && (
                <Card style={{
                  marginBottom: 12,
                  borderColor: T.color.amber,
                  background: T.color.amberSoft,
                }}>
                  <div style={{ fontSize: 12, color: T.color.amber, marginBottom: 6, fontWeight: 600 }}>
                    ⚠️ {parsed.warnings.length} avertissements
                  </div>
                  <div style={{ fontSize: 11, color: T.color.text2, fontFamily: T.font.mono, maxHeight: 100, overflow: 'auto' }}>
                    {parsed.warnings.map((w, i) => <div key={i}>· {w}</div>)}
                  </div>
                </Card>
              )}

              {parsed.accounts.map((acc) => (
                <AccountPreviewCard
                  key={acc.rithmicId}
                  account={acc}
                  mapping={mapping[acc.rithmicId]}
                  existingAccounts={existingAccounts}
                  loadingExisting={loadingExisting}
                  onChangeMapping={(newM) => setMapping(prev => ({ ...prev, [acc.rithmicId]: newM }))}
                />
              ))}
            </Section>

            {/* ===== STEP 3 : Mode + Import ===== */}
            <Section title="3 · Mode d'exécution">
              <Card>
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: 12, borderRadius: T.radius.md,
                  background: dryRun ? T.color.blueSoft : 'transparent',
                  border: `1px solid ${dryRun ? T.color.blueRing : T.color.border}`,
                  marginBottom: 10, cursor: 'pointer',
                }}>
                  <input
                    type="radio" name="mode" checked={dryRun}
                    onChange={() => { setDryRun(true); setConfirmReal(false) }}
                    style={{ marginTop: 3 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      🔍 Dry Run (recommandé)
                    </div>
                    <div style={{ fontSize: 12, color: T.color.text2 }}>
                      Simule l'import et affiche un rapport. <strong>N'écrit rien en DB.</strong>
                    </div>
                  </div>
                </label>

                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: 12, borderRadius: T.radius.md,
                  background: !dryRun ? T.color.amberSoft : 'transparent',
                  border: `1px solid ${!dryRun ? 'rgba(250,199,117,0.4)' : T.color.border}`,
                  cursor: 'pointer',
                }}>
                  <input
                    type="radio" name="mode" checked={!dryRun}
                    onChange={() => setDryRun(false)}
                    style={{ marginTop: 3 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: T.color.amber }}>
                      ⚠️ Import réel
                    </div>
                    <div style={{ fontSize: 12, color: T.color.text2 }}>
                      Crée les comptes + insère les trades dans Supabase. Confirmation requise.
                      Le dédoublonnage utilise un marker <code style={{ color: T.color.text3 }}>[rithmic:ENTRY/EXIT]</code> stocké dans <code>notes</code>.
                    </div>
                  </div>
                </label>

                <div style={{ marginTop: 18, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Btn
                    variant={dryRun ? 'blue' : 'primary'}
                    size="lg"
                    onClick={doImport}
                    disabled={importing}
                    style={!dryRun ? { background: T.color.amber, color: '#000' } : {}}
                  >
                    {importing
                      ? '⏳ Traitement...'
                      : dryRun
                        ? '🔍 Lancer le dry run'
                        : '⚠️ Lancer l\'import réel'
                    }
                  </Btn>
                  {!dryRun && (
                    <div style={{ fontSize: 11, color: T.color.text3 }}>
                      → une popup de confirmation s'affichera
                    </div>
                  )}
                </div>
              </Card>
            </Section>

            {/* ===== STEP 4 : Résultat ===== */}
            {importResult && (
              <Section title="4 · Rapport">
                <Card style={{
                  borderColor: importResult.ok ? T.color.green : T.color.red,
                  background: importResult.ok
                    ? 'rgba(16,185,129,0.05)'
                    : 'rgba(239,68,68,0.05)',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: importResult.ok ? T.color.green : T.color.red }}>
                    {importResult.ok
                      ? (importResult.report.dryRun ? '🔍 Dry run terminé avec succès' : '✅ Import réel terminé')
                      : '❌ Erreur durant l\'import'
                    }
                  </div>

                  {!importResult.ok && (
                    <div style={{
                      fontSize: 12, color: T.color.red,
                      fontFamily: T.font.mono,
                      padding: 10, background: 'rgba(0,0,0,0.3)',
                      borderRadius: T.radius.sm, marginBottom: 12,
                    }}>
                      {importResult.error}
                    </div>
                  )}

                  <div style={{ fontSize: 13, color: T.color.text2, lineHeight: 1.9, fontFamily: T.font.mono }}>
                    <div>• Firmes créées : <strong style={{ color: T.color.text }}>{importResult.report.createdFirms}</strong></div>
                    <div>• Comptes créés : <strong style={{ color: T.color.text }}>{importResult.report.createdAccounts}</strong></div>
                    <div>• Comptes existants réutilisés : <strong style={{ color: T.color.text }}>{importResult.report.reusedAccounts}</strong></div>
                    <div>• Trades insérés : <strong style={{ color: T.color.green }}>{importResult.report.insertedTrades}</strong></div>
                    <div>• Doublons ignorés : <strong style={{ color: T.color.text3 }}>{importResult.report.skippedDuplicates}</strong></div>
                  </div>

                  {importResult.report.perAccount.length > 0 && (
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.color.border}` }}>
                      <div style={{ fontSize: 11, color: T.color.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                        Détail par compte
                      </div>
                      {importResult.report.perAccount.map((p, i) => (
                        <div key={i} style={{ fontSize: 12, color: T.color.text2, fontFamily: T.font.mono, marginBottom: 4 }}>
                          <code>{p.rithmicId}</code> → {p.tradesToInsert} insérés, {p.skipped} skip
                        </div>
                      ))}
                    </div>
                  )}

                  {importResult.report.errors.length > 0 && (
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.color.red}` }}>
                      <div style={{ fontSize: 11, color: T.color.red, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                        Erreurs non bloquantes
                      </div>
                      {importResult.report.errors.map((e, i) => (
                        <div key={i} style={{ fontSize: 12, color: T.color.red, fontFamily: T.font.mono, marginBottom: 4 }}>
                          · {e}
                        </div>
                      ))}
                    </div>
                  )}

                  {importResult.ok && !importResult.report.dryRun && (
                    <div style={{ marginTop: 16 }}>
                      <Link href="/app" style={{ textDecoration: 'none' }}>
                        <Btn variant="blue" size="md">
                          → Voir dans le journal
                        </Btn>
                      </Link>
                    </div>
                  )}
                </Card>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Sub-component : Card de preview d'un compte CSV avec mapping editable
// ============================================================================
function AccountPreviewCard({ account, mapping, existingAccounts, loadingExisting, onChangeMapping }) {
  const [expanded, setExpanded] = useState(true)
  const isProfit = account.summary.netPnL >= 0

  if (!mapping) return null

  return (
    <Card style={{ marginBottom: 12 }}>
      {/* Header de la card : ID + stats + bouton expand */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16, cursor: 'pointer',
      }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <Badge tone={account.type === 'FUNDED' ? 'green' : 'amber'}>
              {account.type === 'FUNDED' ? '💰 FUNDED' : '🎯 EVAL'}
            </Badge>
            <code style={{ fontSize: 12, color: T.color.text2, fontFamily: T.font.mono }}>
              {account.rithmicId}
            </code>
            {account.firm && (
              <Badge tone="blue">{account.firm}</Badge>
            )}
          </div>
          <div style={{
            display: 'flex', gap: 20, fontSize: 12,
            color: T.color.text3, fontFamily: T.font.mono, flexWrap: 'wrap',
          }}>
            <span>
              Net : <strong style={{ color: isProfit ? T.color.green : T.color.red, fontSize: 13 }}>
                ${account.summary.netPnL.toFixed(2)}
              </strong>
            </span>
            <span>{account.trades.length} trades · {account.summary.fillCount} fills</span>
            <span>{account.summary.winRate.toFixed(1)}% wins</span>
            <span>Instr : {account.instruments.join(', ') || '—'}</span>
          </div>
        </div>
        <span style={{ fontSize: 14, color: T.color.text3 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <>
          {/* === Bloc Mapping === */}
          <div style={{
            marginTop: 16, padding: 14,
            background: T.color.surface2,
            border: `1px solid ${T.color.border}`,
            borderRadius: T.radius.md,
          }}>
            <div style={{
              fontSize: 11, color: T.color.text3,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              marginBottom: 10, fontFamily: T.font.mono,
            }}>
              Mapping vers Quantara
            </div>

            <select
              value={mapping.mode === 'existing' ? mapping.accountId : '__create__'}
              onChange={(e) => {
                if (e.target.value === '__create__') {
                  onChangeMapping({
                    mode: 'create',
                    newName: account.rithmicId.slice(-11),
                    planSize: '50k',
                  })
                } else {
                  onChangeMapping({ mode: 'existing', accountId: e.target.value })
                }
              }}
              style={{
                width: '100%', padding: 10, fontSize: 13,
                background: T.color.surfaceSolid, color: T.color.text,
                border: `1px solid ${T.color.borderStrong}`,
                borderRadius: T.radius.md,
                fontFamily: T.font.sans, outline: 'none',
              }}
            >
              <option value="__create__">➕ Créer un nouveau compte Quantara</option>
              {existingAccounts.map((ea) => (
                <option key={ea.id} value={ea.id}>
                  {(ea.name || `Sans nom · ${ea.id.slice(0, 6)}`)} · {ea.plan_size} · {ea.status}
                </option>
              ))}
            </select>
            {loadingExisting && (
              <div style={{ fontSize: 11, color: T.color.text3, marginTop: 6 }}>
                ⏳ Chargement des comptes existants...
              </div>
            )}

            {/* Si mode "create" → champs nom + plan_size */}
            {mapping.mode === 'create' && (
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Nom du compte"
                  value={mapping.newName || ''}
                  onChange={(e) => onChangeMapping({ ...mapping, newName: e.target.value })}
                  style={{
                    flex: 1, minWidth: 200, padding: 10, fontSize: 13,
                    background: T.color.surfaceSolid, color: T.color.text,
                    border: `1px solid ${T.color.borderStrong}`,
                    borderRadius: T.radius.md, outline: 'none',
                    fontFamily: T.font.sans,
                  }}
                />
                <select
                  value={mapping.planSize || '50k'}
                  onChange={(e) => onChangeMapping({ ...mapping, planSize: e.target.value })}
                  style={{
                    padding: 10, fontSize: 13,
                    background: T.color.surfaceSolid, color: T.color.text,
                    border: `1px solid ${T.color.borderStrong}`,
                    borderRadius: T.radius.md, outline: 'none',
                    fontFamily: T.font.sans,
                  }}
                >
                  <option value="25k">25k</option>
                  <option value="50k">50k</option>
                  <option value="100k">100k</option>
                  <option value="150k">150k</option>
                  <option value="250k">250k</option>
                </select>
              </div>
            )}
          </div>

          {/* === Aperçu des trades === */}
          <div style={{ marginTop: 14 }}>
            <div style={{
              fontSize: 11, color: T.color.text3,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              marginBottom: 8, fontFamily: T.font.mono,
            }}>
              Aperçu — {Math.min(10, account.trades.length)} premiers trades
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 320, border: `1px solid ${T.color.border}`, borderRadius: T.radius.md }}>
              <table style={{
                width: '100%', fontSize: 11,
                fontFamily: T.font.mono, borderCollapse: 'collapse',
                background: T.color.surfaceSolid,
              }}>
                <thead>
                  <tr style={{
                    position: 'sticky', top: 0,
                    background: T.color.surface2Solid,
                    textAlign: 'left', color: T.color.text3,
                    zIndex: 1,
                  }}>
                    <th style={th}>Date</th>
                    <th style={th}>Inst.</th>
                    <th style={th}>Side</th>
                    <th style={{ ...th, textAlign: 'right' }}>Qty</th>
                    <th style={{ ...th, textAlign: 'right' }}>Entry</th>
                    <th style={{ ...th, textAlign: 'right' }}>Exit</th>
                    <th style={{ ...th, textAlign: 'right' }}>Net P&L</th>
                    <th style={{ ...th, textAlign: 'right' }}>Fills</th>
                    <th style={{ ...th, textAlign: 'right' }}>Hold</th>
                  </tr>
                </thead>
                <tbody>
                  {account.trades.slice(0, 10).map((t, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${T.color.border}` }}>
                      <td style={td}>{t.date}</td>
                      <td style={td}>{t.instrument}</td>
                      <td style={{ ...td, color: t.side === 'LONG' ? T.color.green : T.color.red, fontWeight: 600 }}>
                        {t.side}
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>{t.qty}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{t.entryPrice}</td>
                      <td style={{ ...td, textAlign: 'right' }}>{t.exitPrice}</td>
                      <td style={{
                        ...td, textAlign: 'right',
                        color: t.netPnL >= 0 ? T.color.green : T.color.red,
                        fontWeight: 600,
                      }}>
                        {t.netPnL.toFixed(2)}
                      </td>
                      <td style={{ ...td, textAlign: 'right', color: T.color.text3 }}>{t.fillCount}</td>
                      <td style={{ ...td, textAlign: 'right', color: T.color.text3 }}>
                        {formatHold(t.holdSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {account.trades.length > 10 && (
              <div style={{
                padding: 8, fontSize: 11, color: T.color.text3,
                textAlign: 'center', fontFamily: T.font.mono,
              }}>
                ... et {account.trades.length - 10} autres trades dans cet account
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  )
}

// ============================================================================
// Sub-component : écran plein page pour les états bloquants (loading/auth)
// ============================================================================
function FullPageState({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: T.color.bg, color: T.color.text,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center',
      fontFamily: T.font.sans,
    }}>
      {children}
    </div>
  )
}

// ============================================================================
// Helpers UI
// ============================================================================
const th = { padding: '8px 10px', fontWeight: 600, letterSpacing: '0.05em' }
const td = { padding: '6px 10px', color: T.color.text2 }

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
