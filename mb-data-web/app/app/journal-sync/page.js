'use client'
// JOURNAL SYNC — réutilise le composant JournalPage en mode "sync".
//
// Strictement isolé du journal manuel :
//   - Côté DATA : JournalPage filtre les entries via onlyRithmicEntries=true
//     → ne montre QUE les trades avec le marker [rithmic:ENTRY/EXIT] dans notes
//   - Côté COMPTES : on filtre les firms avant de les passer pour ne garder
//     QUE les comptes ayant un rithmic_account_id (= créés/liés par l'import CSV)
//
// Comme on réutilise JournalPage, on hérite automatiquement de :
//   - Filtres Statut / Firme / Compte (les pills + dropdowns du screenshot)
//   - Courbes de balance par compte (EquityCurveCard avec DD line)
//   - Calendrier PnL mensuel
//   - Stats agrégées (WR, R-ratio, consistency, etc.)
//   - Export CSV
//   - Toutes les futures features qu'on ajoute au journal
//
// Différences en mode sync (props) :
//   - Bouton "+ Trade" → "+ Importer un CSV" (lien vers /app/import-lab)
//   - Eyebrow / titre / subtitle changent pour refléter la source des données
//   - Empty state pointe vers l'Import Lab au lieu du dashboard

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import JournalPage from '../../../components/JournalPage'
import { FIRM_COLORS } from '../../../lib/constants'
import { getFirmLogo } from '../../../lib/firmLogos'

export default function JournalSyncPage() {
  const [user, setUser] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [firms, setFirms] = useState([])

  // Charge firms+accounts+payouts EN MÊME SHAPE que /app/page.js loadFirms()
  // (chaque firm a un tableau `accounts`, chaque account a un tableau `payouts`)
  // Filtre EXPLICITEMENT par user_id pour contrer une éventuelle policy admin RLS.
  const loadFirms = useCallback(async (userId) => {
    if (!userId) return
    const [fd, ad, pd] = await Promise.all([
      supabase.from('firms').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('accounts').select('*').eq('user_id', userId).order('buy_date'),
      supabase.from('payouts').select('*').eq('user_id', userId).order('date'),
    ])
    const firmsRaw = fd.data || []
    const accountsRaw = ad.data || []
    const payoutsRaw = pd.data || []

    // Hydrate la même structure que /app/page.js attend
    const hydrated = firmsRaw.map((f, i) => ({
      ...f,
      color: f.color || FIRM_COLORS[i % FIRM_COLORS.length],
      accounts: accountsRaw
        .filter(a => a.firm_id === f.id)
        // ⚠ FILTRE SYNC : ne garde QUE les comptes synchronisés (rithmic_account_id rempli)
        // Les comptes manuels apparaissent uniquement dans le journal classique.
        .filter(a => !!a.rithmic_account_id)
        .map(a => ({
          ...a,
          payouts: payoutsRaw.filter(p => p.account_id === a.id),
        })),
    }))
    // Retire les firmes qui n'ont plus de compte sync après filtrage
    const filtered = hydrated.filter(f => (f.accounts || []).length > 0)
    setFirms(filtered)
  }, [])

  // Auth + initial load
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user || null
      setUser(u)
      setLoadingAuth(false)
      if (u) loadFirms(u.id)
    })
    return () => { mounted = false }
  }, [loadFirms])

  // Toast minimaliste (le journal en a besoin)
  function showToast(msg) {
    if (typeof window !== 'undefined') {
      console.log('[journal-sync]', msg)
    }
  }

  // Reload après une action (rare en mode sync, mais pour cohérence avec JournalPage)
  function onReload() {
    if (user?.id) loadFirms(user.id)
  }

  if (loadingAuth) {
    return (
      <div style={{
        minHeight:'100vh', background:'var(--bg)', color:'var(--text)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <div style={{ color:'var(--text3)', fontSize:13 }}>⏳ Chargement...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{
        minHeight:'100vh', background:'var(--bg)', color:'var(--text)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:32, textAlign:'center',
      }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <h1 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Connexion requise</h1>
        <a href="/app" style={{ color:'var(--blue-light)', textDecoration:'none' }}>← Page de connexion</a>
      </div>
    )
  }

  // Render principal : JournalPage en mode sync
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)' }}>
      <JournalPage
        firms={firms}
        user={user}
        getFirmLogo={getFirmLogo}
        showToast={showToast}
        onReload={onReload}
        onlyRithmicEntries={true}
        addTradeHref="/app/import-lab"
        addTradeLabel="+ Importer un CSV"
        pageEyebrow="Journal Sync · CSV Import"
        pageTitle="Chaque trade importé. Tracké. Analysé."
        pageSubtitleSuffix="synchronisé depuis Rithmic"
      />
    </div>
  )
}
