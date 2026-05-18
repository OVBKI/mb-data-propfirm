'use client'
// PROFIL UTILISATEUR — page complète (read + edit) avec stats trading + base
// pour future intégration réseau social (followers, posts, etc.).
//
// Architecture :
//   - Topbar + sidebar identiques à /app pour cohérence shell
//   - Hero (avatar + identité + bio + country + actions)
//   - Stats publiques (KPIs calculés depuis les comptes + payouts + trades user)
//   - Showcase activités récentes (payouts, best trades)
//   - Section sociale (placeholder "bientôt" pour ne pas être vide)
//   - Section privacy/édition (collapse — gère is_public, country, banner, etc.)
//
// Futur : ajouter route /u/[username] pour vue publique. Code structuré pour
// que la moitié hero/stats puisse être réutilisée en lecture seule.

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'
import QLogoIcon from '../../../components/QLogoIcon'
import SpaceBackground from '../../../components/dashboard/SpaceBackground'
import ProfileModal from '../../../components/ProfileModal'

// Mêmes constantes que les autres pages du shell — liste centralisée
import { ADMIN_EMAILS } from '../../../lib/admins'

const NAV_ITEMS = [
  { key: 'dashboard', icon: '◫', label: 'Tableau de bord', section: 'Principal' },
  { key: 'analytics', icon: '◐', label: 'Analytics',       section: 'Principal' },
  { key: 'journal',   icon: '☰', label: 'Journal manuel',  section: 'Principal' },
  { key: 'rules',     icon: '◊', label: 'Règles firmes',   section: 'PropFirm' },
  { key: 'alerts',    icon: '◉', label: 'Alertes',         section: 'PropFirm' },
  { key: 'calendar',  icon: '◳', label: 'Calendrier Éco.', section: 'Live Data' },
  { href: '/app/import-lab',   icon: '↓', label: 'Import CSV',   section: 'Sync', badgeLabel: 'BETA' },
  { href: '/app/journal-sync', icon: '◰', label: 'Journal Sync', section: 'Sync' },
]
const SECTIONS = ['Principal', 'Live Data', 'PropFirm', 'Sync']

// Liste des pays (top 20 pour les traders + fallback "Autre")
// Format: { code: 'FR', label: 'France', flag: '🇫🇷' }
const COUNTRIES = [
  { code: 'FR', label: 'France',         flag: '🇫🇷' },
  { code: 'BE', label: 'Belgique',       flag: '🇧🇪' },
  { code: 'CH', label: 'Suisse',         flag: '🇨🇭' },
  { code: 'CA', label: 'Canada',         flag: '🇨🇦' },
  { code: 'US', label: 'États-Unis',     flag: '🇺🇸' },
  { code: 'UK', label: 'Royaume-Uni',    flag: '🇬🇧' },
  { code: 'DE', label: 'Allemagne',      flag: '🇩🇪' },
  { code: 'ES', label: 'Espagne',        flag: '🇪🇸' },
  { code: 'IT', label: 'Italie',         flag: '🇮🇹' },
  { code: 'PT', label: 'Portugal',       flag: '🇵🇹' },
  { code: 'NL', label: 'Pays-Bas',       flag: '🇳🇱' },
  { code: 'MA', label: 'Maroc',          flag: '🇲🇦' },
  { code: 'TN', label: 'Tunisie',        flag: '🇹🇳' },
  { code: 'DZ', label: 'Algérie',        flag: '🇩🇿' },
  { code: 'SN', label: 'Sénégal',        flag: '🇸🇳' },
  { code: 'CI', label: 'Côte d\'Ivoire', flag: '🇨🇮' },
]

const TRADING_STYLES = [
  { id: 'scalper',    label: 'Scalper' },
  { id: 'day_trader', label: 'Day trader' },
  { id: 'swing',      label: 'Swing trader' },
  { id: 'algo',       label: 'Algo / bot' },
  { id: 'news',       label: 'News trader' },
  { id: 'mean_rev',   label: 'Mean reversion' },
  { id: 'breakout',   label: 'Breakout' },
  { id: 'discretionary', label: 'Discrétionnaire' },
]

const INSTRUMENT_TAGS = [
  'MNQ','NQ','MES','ES','MYM','YM','M2K','RTY',
  'MCL','CL','MGC','GC','SI','HG','PL','PA',
  'M6E','6E','M6B','6B','ZN','ZF','ZB',
  'BTC','ETH','SOL',
]

function fmtMoney(n, dec = 0) {
  const v = Number(n) || 0
  return (v >= 0 ? '+' : '') + v.toLocaleString('fr-FR', { maximumFractionDigits: dec }) + ' $'
}

function fmtJoinDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return ((parts[0][0] || '') + (parts[parts.length - 1][0] || '')).toUpperCase()
}

// ============================================================================
// PAGE
// ============================================================================
export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Form édition (pour la section Privacy / extra fields)
  const [formCountry, setFormCountry] = useState('')
  const [formIsPublic, setFormIsPublic] = useState(false)
  const [formStyles, setFormStyles] = useState([])
  const [formInstruments, setFormInstruments] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Load profile + stats + activités
  const loadAll = useCallback(async (userId) => {
    setLoadingData(true)
    const [profRes, acctRes, payRes, jeRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('accounts').select('id, name, status, plan_size, firm_id, rithmic_account_id, liquidated_at, buy_date, firms(name, color)').eq('user_id', userId),
      supabase.from('payouts').select('id, date, amount, account_id, accounts(name, firms(name, color))').eq('user_id', userId).order('date', { ascending: false }),
      supabase.from('journal_entries').select('id, date, pnl, instrument').eq('user_id', userId),
    ])

    const p = profRes.data || {}
    setProfile(p)
    setFormCountry(p.country || '')
    setFormIsPublic(!!p.is_public)
    setFormStyles(p.trading_styles || [])
    setFormInstruments(p.instruments || [])

    const accounts = acctRes.data || []
    const payouts = payRes.data || []
    const entries = jeRes.data || []

    // === STATS ===
    const totalPayouts = payouts.reduce((s, p) => s + (Number(p.amount) || 0), 0)
    const fundedAccounts = accounts.filter(a => a.status === 'Financé').length
    const liquidatedAccounts = accounts.filter(a => a.liquidated_at).length
    const totalPnl = entries.reduce((s, e) => s + (Number(e.pnl) || 0), 0)
    const winners = entries.filter(e => Number(e.pnl) > 0).length
    const winRate = entries.length > 0 ? (winners / entries.length) * 100 : 0
    const tradingDays = new Set(entries.map(e => e.date)).size
    const firmIds = new Set(accounts.map(a => a.firm_id).filter(Boolean))

    // Best day
    const pnlByDate = {}
    for (const e of entries) {
      pnlByDate[e.date] = (pnlByDate[e.date] || 0) + (Number(e.pnl) || 0)
    }
    const bestDay = Object.entries(pnlByDate).reduce(
      (acc, [d, v]) => (!acc || v > acc.pnl ? { date: d, pnl: v } : acc),
      null
    )

    setStats({
      totalPayouts,
      fundedAccounts,
      liquidatedAccounts,
      accountsCount: accounts.length,
      firmsCount: firmIds.size,
      totalPnl,
      winRate,
      tradesCount: entries.length,
      tradingDays,
      bestDay,
    })

    // === ACTIVITÉS RÉCENTES ===
    // On combine : derniers payouts, derniers passages financés, derniers liquidés.
    // Triés par date desc, limité à 10.
    const acts = []
    for (const p of payouts.slice(0, 10)) {
      acts.push({
        type: 'payout',
        date: p.date,
        label: `Payout reçu`,
        amount: Number(p.amount) || 0,
        firm: p.accounts?.firms?.name,
        firmColor: p.accounts?.firms?.color,
        account: p.accounts?.name,
      })
    }
    for (const a of accounts.filter(a => a.liquidated_at)) {
      acts.push({
        type: 'liquidated',
        date: a.liquidated_at.slice(0, 10),
        label: `Compte auto-liquidé`,
        firm: a.firms?.name,
        firmColor: a.firms?.color,
        account: a.name,
      })
    }
    if (bestDay) {
      acts.push({
        type: 'best_day',
        date: bestDay.date,
        label: `Meilleur jour`,
        amount: bestDay.pnl,
      })
    }
    acts.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    setActivities(acts.slice(0, 10))

    setLoadingData(false)
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const u = session?.user || null
      setUser(u)
      setLoadingAuth(false)
      if (u) loadAll(u.id)
    })
    return () => { mounted = false }
  }, [loadAll])

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/app'
  }

  // === Save Privacy + extras ===
  async function saveExtras() {
    if (!user) return
    setSaving(true); setSaveMsg('')
    const { error } = await supabase
      .from('profiles')
      .update({
        country: formCountry || null,
        is_public: formIsPublic,
        trading_styles: formStyles.length ? formStyles : null,
        instruments: formInstruments.length ? formInstruments : null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
    setSaving(false)
    if (error) {
      setSaveMsg(`❌ ${error.message}`)
    } else {
      setSaveMsg('✓ Enregistré')
      loadAll(user.id)
      setTimeout(() => setSaveMsg(''), 2000)
    }
  }

  function toggleStyle(id) {
    setFormStyles(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleInstrument(id) {
    setFormInstruments(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // === Garde-fous ===
  if (loadingAuth) {
    return <FullPageState>⏳ Chargement...</FullPageState>
  }
  if (!user) {
    return (
      <FullPageState>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Connexion requise</h1>
        <Link href="/app" style={{ color: 'var(--blue-light)', textDecoration: 'none' }}>← Page de connexion</Link>
      </FullPageState>
    )
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email)
  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Trader'
  const countryObj = COUNTRIES.find(c => c.code === profile?.country)

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
      <SpaceBackground />
      <div style={{ height: 2, background: 'linear-gradient(90deg,var(--blue) 0%,transparent 100%)', position: 'relative', zIndex: 1 }} />

      {/* === TOPBAR === */}
      <Topbar mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} onSignOut={signOut} />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 50px)' }}>
        <Sidebar
          mobileNavOpen={mobileNavOpen}
          setMobileNavOpen={setMobileNavOpen}
          user={user} profile={profile} isAdmin={isAdmin}
          onProfileClick={() => setShowProfileModal(true)}
          activeRoute="/app/profile"
        />

        {/* === CONTENT === */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Styles responsive profile */}
          <style>{`
            @media (max-width: 768px) {
              .qt-profile-hero { padding: 18px !important; }
              .qt-profile-hero h1 { font-size: 22px !important; }
              .qt-profile-avatar { width: 64px !important; height: 64px !important; font-size: 24px !important; }
              .qt-profile-actions { width: 100% !important; }
              .qt-profile-actions button,
              .qt-profile-actions a { flex: 1 1 auto !important; min-width: 130px !important; text-align: center !important; }
            }
          `}</style>
          <div className="page-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px' }}>

            {/* === HERO === */}
            <div className="qt-profile-hero" style={{
              background: 'rgba(20,23,32,0.65)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 28,
              marginBottom: 24,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Banner accent (radial bleu en bg) */}
              <div style={{
                position: 'absolute', top: -100, right: -100,
                width: 400, height: 400,
                background: 'radial-gradient(circle, rgba(45,111,255,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap', position: 'relative' }}>
                {/* Avatar (initiales colorées) */}
                <div className="qt-profile-avatar" style={{
                  width: 92, height: 92, flexShrink: 0,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--blue) 0%, #6e3aff 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, fontWeight: 700, color: '#fff',
                  letterSpacing: '-0.02em',
                  border: '2px solid var(--border2)',
                  boxShadow: '0 8px 24px rgba(45,111,255,0.25)',
                }}>
                  {getInitials(displayName)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Nom + verified */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                      {displayName}
                    </h1>
                    {profile?.verified && (
                      <span title="Compte vérifié" style={{
                        fontSize: 16, color: 'var(--blue-light)',
                      }}>✓</span>
                    )}
                    {profile?.is_public && (
                      <span style={{
                        fontSize: 9, padding: '2px 8px', borderRadius: 99,
                        background: 'rgba(29,184,122,0.12)', color: 'var(--green-text)',
                        fontWeight: 700, letterSpacing: '0.08em',
                      }}>PUBLIC</span>
                    )}
                  </div>

                  {/* Username + email + join date */}
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', fontFamily: 'ui-monospace, monospace' }}>
                    {profile?.username && <span>@{profile.username}</span>}
                    {profile?.username && <span style={{ color: 'var(--text3)' }}>·</span>}
                    <span style={{ color: 'var(--text3)' }}>Membre depuis {fmtJoinDate(profile?.created_at)}</span>
                  </div>

                  {/* Bio */}
                  {profile?.bio && (
                    <p style={{
                      fontSize: 14, color: 'var(--text)', lineHeight: 1.6,
                      margin: '12px 0', maxWidth: 600,
                    }}>{profile.bio}</p>
                  )}

                  {/* Tags : pays + styles + instruments */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                    {countryObj && (
                      <span style={tagStyle}>
                        <span style={{ fontSize: 14 }}>{countryObj.flag}</span> {countryObj.label}
                      </span>
                    )}
                    {(profile?.trading_styles || []).map(s => {
                      const style = TRADING_STYLES.find(t => t.id === s)
                      return style ? <span key={s} style={tagStyle}>📊 {style.label}</span> : null
                    })}
                    {(profile?.instruments || []).slice(0, 6).map(i => (
                      <span key={i} style={{ ...tagStyle, fontFamily: 'ui-monospace, monospace' }}>{i}</span>
                    ))}
                    {(profile?.instruments || []).length > 6 && (
                      <span style={tagStyle}>+{(profile?.instruments || []).length - 6}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="qt-profile-actions" style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      style={btnPrimary}
                    >✎ Modifier le profil</button>
                    <button
                      onClick={() => setEditing(!editing)}
                      style={btnGhost}
                    >{editing ? '↑ Fermer paramètres' : '⚙ Paramètres avancés'}</button>

                    {/* Placeholder réseau social (désactivé pour l'instant) */}
                    <button
                      disabled
                      title="Disponible bientôt : suivre d'autres traders"
                      style={{ ...btnGhost, opacity: 0.5, cursor: 'not-allowed' }}
                    >+ Suivre (bientôt)</button>
                  </div>

                  {/* Followers/Following (placeholder) */}
                  <div style={{
                    display: 'flex', gap: 18, marginTop: 14,
                    fontSize: 12, color: 'var(--text3)',
                    fontFamily: 'ui-monospace, monospace',
                  }}>
                    <span><strong style={{ color: 'var(--text)' }}>{profile?.followers_count || 0}</strong> followers</span>
                    <span><strong style={{ color: 'var(--text)' }}>{profile?.following_count || 0}</strong> following</span>
                  </div>
                </div>
              </div>
            </div>

            {/* === PARAMÈTRES AVANCÉS (collapse) === */}
            {editing && (
              <div style={{
                background: 'rgba(20,23,32,0.65)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 24,
                marginBottom: 24,
              }}>
                <SectionTitle>Paramètres avancés</SectionTitle>

                {/* Visibilité publique */}
                <div style={{ marginBottom: 18 }}>
                  <MicroLabel>Visibilité</MicroLabel>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                    <input
                      type="checkbox" checked={formIsPublic}
                      onChange={e => setFormIsPublic(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: 'var(--blue)' }}
                    />
                    Profil public — visible par les autres traders (URL : <code>/u/{profile?.username || 'pseudo'}</code>)
                  </label>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, marginLeft: 26 }}>
                    Si tu actives ça, ton pseudo, ta bio, ton pays et tes stats publiques seront visibles.
                    Tes trades détaillés et tes comptes individuels restent privés.
                  </div>
                </div>

                {/* Pays */}
                <div style={{ marginBottom: 18 }}>
                  <MicroLabel>Pays</MicroLabel>
                  <select value={formCountry} onChange={e => setFormCountry(e.target.value)} style={inputStyle}>
                    <option value="">— Aucun —</option>
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Trading styles */}
                <div style={{ marginBottom: 18 }}>
                  <MicroLabel>Style de trading</MicroLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TRADING_STYLES.map(s => (
                      <button
                        key={s.id} type="button"
                        onClick={() => toggleStyle(s.id)}
                        style={chipStyle(formStyles.includes(s.id))}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>

                {/* Instruments préférés */}
                <div style={{ marginBottom: 18 }}>
                  <MicroLabel>Instruments tradés</MicroLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {INSTRUMENT_TAGS.map(i => (
                      <button
                        key={i} type="button"
                        onClick={() => toggleInstrument(i)}
                        style={{ ...chipStyle(formInstruments.includes(i)), fontFamily: 'ui-monospace, monospace' }}
                      >{i}</button>
                    ))}
                  </div>
                </div>

                {/* Save */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
                  <button onClick={saveExtras} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                    {saving ? '⏳ Sauvegarde...' : 'Enregistrer'}
                  </button>
                  {saveMsg && (
                    <span style={{
                      fontSize: 12,
                      color: saveMsg.startsWith('✓') ? 'var(--green-text)' : 'var(--red-text)',
                      fontFamily: 'ui-monospace, monospace',
                    }}>{saveMsg}</span>
                  )}
                </div>
              </div>
            )}

            {/* === STATS PUBLIQUES === */}
            <div style={{ marginBottom: 24 }}>
              <SectionTitle>Stats publiques</SectionTitle>
              {loadingData ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                  Chargement...
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 12,
                }}>
                  <KpiCard label="Payouts totaux" value={fmtMoney(stats?.totalPayouts)} color="var(--green)" />
                  <KpiCard label="Comptes financés" value={String(stats?.fundedAccounts || 0)} sub={`${stats?.accountsCount || 0} total`} />
                  <KpiCard label="Firmes actives" value={String(stats?.firmsCount || 0)} />
                  <KpiCard label="Win rate" value={`${(stats?.winRate || 0).toFixed(1)}%`} color={(stats?.winRate || 0) >= 50 ? 'var(--green)' : 'var(--amber-text)'} sub={`${stats?.tradesCount || 0} trades`} />
                  <KpiCard label="Jours tradés" value={String(stats?.tradingDays || 0)} />
                  <KpiCard
                    label="Meilleur jour"
                    value={stats?.bestDay ? fmtMoney(stats.bestDay.pnl) : '—'}
                    sub={stats?.bestDay?.date}
                    color="var(--green)"
                  />
                  {stats?.liquidatedAccounts > 0 && (
                    <KpiCard label="Auto-liquidations" value={String(stats.liquidatedAccounts)} color="var(--red)" />
                  )}
                </div>
              )}
            </div>

            {/* === ACTIVITÉS RÉCENTES === */}
            <div style={{ marginBottom: 24 }}>
              <SectionTitle>Activités récentes</SectionTitle>
              <div style={{
                background: 'rgba(20,23,32,0.65)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                {activities.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    Aucune activité pour l'instant. Importe ton premier CSV ou enregistre un payout.
                  </div>
                ) : (
                  activities.map((a, i) => <ActivityRow key={i} activity={a} />)
                )}
              </div>
            </div>

            {/* === MUR / FEED (placeholder réseau social) === */}
            <div style={{ marginBottom: 24 }}>
              <SectionTitle>
                Mur
                <span style={{
                  marginLeft: 8, fontSize: 9, padding: '3px 8px', borderRadius: 99,
                  background: 'rgba(45,111,255,0.15)', color: 'var(--blue-light)',
                  fontWeight: 700, letterSpacing: '0.08em', verticalAlign: 'middle',
                }}>BIENTÔT</span>
              </SectionTitle>
              <div style={{
                background: 'rgba(20,23,32,0.65)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px dashed var(--border2)',
                borderRadius: 12,
                padding: 40, textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>💬</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  Le mini-réseau social arrive bientôt
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
                  Tu pourras publier tes meilleurs trades, partager tes payouts, suivre d'autres traders propfirm, et commenter leurs résultats.
                  Le mur sera réservé aux profils publics.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 0', borderTop: '1px solid var(--border)',
              fontSize: 11, color: 'var(--text3)',
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.05em',
              display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            }}>
              <span>PROFIL · QUANTARA · v0.1</span>
              <span>{profile?.is_public ? '🌐 Profil public' : '🔒 Profil privé'}</span>
            </div>

          </div>
        </div>
      </div>

      {/* Modal édition pseudo + display name + bio */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onUpdated={() => loadAll(user.id)}
        />
      )}
    </div>
  )
}

// ============================================================================
// SOUS-COMPOSANTS
// ============================================================================

function Topbar({ mobileNavOpen, setMobileNavOpen, onSignOut }) {
  return (
    <div className="top-bar" style={{
      height: 52, background: 'rgba(13,15,20,0.78)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', position: 'sticky', top: 0, zIndex: 200,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="nav-burger" aria-label="Menu" onClick={() => setMobileNavOpen(o => !o)}>☰</button>
        <Link href="/app" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text)' }}>
          <QLogoIcon size={44} color="#4d8fff" />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.14em' }}>QUANTARA</div>
            <span className="top-bar-brand-sub" style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.18em' }}>TRACK · ANALYZE · GROW</span>
          </div>
        </Link>
      </div>
      <div className="top-bar-actions" style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSignOut} style={{
          fontSize: 12, padding: '7px 14px',
          background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.10)',
          color: 'var(--text2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
        }}>Déconnexion</button>
      </div>
    </div>
  )
}

function Sidebar({ mobileNavOpen, setMobileNavOpen, user, profile, isAdmin, onProfileClick, activeRoute }) {
  return (
    <>
      <nav className={'app-nav' + (mobileNavOpen ? ' open' : '')} style={{
        width: 210, flexShrink: 0, background: 'rgba(13,15,20,0.65)',
        backdropFilter: 'blur(26px)', WebkitBackdropFilter: 'blur(26px)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        padding: '18px 0', position: 'sticky', top: 52,
        height: 'calc(100vh - 52px)', overflowY: 'auto',
      }}>
        {SECTIONS.map(section => (
          <div key={section}>
            <div className="nav-section-label" style={{ padding: '12px 18px 6px', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{section}</div>
            {NAV_ITEMS.filter(i => i.section === section).map(item => {
              if (item.href) {
                const isActive = item.href === activeRoute
                return (
                  <a key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '9px 18px', width: '100%',
                    background: isActive ? 'rgba(45,111,255,0.12)' : 'transparent',
                    color: isActive ? 'var(--blue-light)' : 'var(--text2)',
                    fontSize: 13, fontWeight: isActive ? 600 : 500,
                    textDecoration: 'none',
                    borderLeft: `2px solid ${isActive ? 'var(--blue)' : 'transparent'}`,
                    transition: 'all 0.15s', fontFamily: 'inherit',
                  }}>
                    <span style={{ fontSize: 14, color: isActive ? 'var(--blue-light)' : 'var(--text3)', width: 18, display: 'inline-block', textAlign: 'center' }}>{item.icon}</span>
                    {item.label}
                    {item.badgeLabel && (
                      <span style={{ marginLeft: 'auto', background: 'rgba(45,111,255,0.15)', color: 'var(--blue-light)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, letterSpacing: '0.08em' }}>{item.badgeLabel}</span>
                    )}
                  </a>
                )
              }
              return (
                <a key={item.key} href={`/app?p=${item.key}`} style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '9px 18px', width: '100%',
                  background: 'transparent', color: 'var(--text2)',
                  fontSize: 13, fontWeight: 500,
                  textDecoration: 'none', borderLeft: '2px solid transparent',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}>
                  <span style={{ fontSize: 14, color: 'var(--text3)', width: 18, display: 'inline-block', textAlign: 'center' }}>{item.icon}</span>
                  {item.label}
                </a>
              )
            })}
          </div>
        ))}

        {isAdmin && (
          <div style={{ padding: '8px 12px', marginTop: 12, borderTop: '1px solid var(--border)' }}>
            <a href="/admin" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(232,80,74,0.08)', border: '1px solid rgba(232,80,74,0.25)',
              color: 'var(--red-text)', fontSize: 12, fontWeight: 600, textDecoration: 'none',
            }}>🔧 Admin Panel</a>
          </div>
        )}

        {/* Carte profil (cliquable → ProfileModal) */}
        <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, padding: '0 12px' }}>
          <button
            onClick={onProfileClick}
            style={{
              width: '100%', padding: '9px 11px',
              background: 'rgba(45,111,255,0.10)',
              border: '1px solid rgba(45,111,255,0.25)',
              borderRadius: 8, cursor: 'pointer',
              textAlign: 'left', color: 'var(--text)',
              fontFamily: 'inherit', transition: 'all 0.15s', overflow: 'hidden',
            }}
          >
            <div style={{
              fontSize: 12, fontWeight: 600,
              color: profile?.username ? 'var(--text)' : 'var(--blue-light)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {profile?.display_name || (profile?.username ? `@${profile.username}` : '⊕ Définir un pseudo')}
            </div>
            <div style={{
              fontSize: 10, color: 'var(--text3)', marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFamily: 'ui-monospace, monospace',
            }}>✎ Éditer rapide</div>
          </button>
        </div>
      </nav>
      {mobileNavOpen && <div className="nav-backdrop" onClick={() => setMobileNavOpen(false)} />}
    </>
  )
}

function FullPageState({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32, textAlign: 'center',
    }}>{children}</div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11, color: 'var(--blue-light)',
      letterSpacing: '0.16em', textTransform: 'uppercase',
      fontWeight: 600, marginBottom: 12,
    }}>{children}</div>
  )
}

function MicroLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, color: 'var(--text3)',
      textTransform: 'uppercase', letterSpacing: '0.12em',
      marginBottom: 8, fontFamily: 'ui-monospace, monospace',
    }}>{children}</div>
  )
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{
      padding: '14px 16px',
      background: 'rgba(20,23,32,0.65)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--border)',
      borderRadius: 10,
    }}>
      <div style={{
        fontSize: 10, color: 'var(--text3)',
        fontFamily: 'ui-monospace, monospace',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        marginBottom: 8,
      }}>{label}</div>
      <div style={{
        fontSize: 20, fontWeight: 700,
        fontFamily: 'ui-monospace, monospace',
        letterSpacing: '-0.01em',
        color: color || 'var(--text)',
        lineHeight: 1.1,
      }}>{value}</div>
      {sub && (
        <div style={{
          fontSize: 10, color: 'var(--text3)',
          fontFamily: 'ui-monospace, monospace',
          marginTop: 6, letterSpacing: '0.04em',
        }}>{sub}</div>
      )}
    </div>
  )
}

function ActivityRow({ activity }) {
  const icon = activity.type === 'payout' ? '💰'
    : activity.type === 'liquidated' ? '💀'
    : activity.type === 'best_day' ? '🏆'
    : '•'
  const color = activity.type === 'liquidated' ? 'var(--red)'
    : activity.type === 'payout' || activity.type === 'best_day' ? 'var(--green)'
    : 'var(--text2)'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 18px', borderBottom: '1px solid var(--border)',
      fontSize: 13,
    }}>
      <div style={{ fontSize: 18, width: 30, textAlign: 'center' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, color: 'var(--text)' }}>{activity.label}</div>
        <div style={{
          fontSize: 11, color: 'var(--text3)', marginTop: 2,
          fontFamily: 'ui-monospace, monospace', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>{activity.date}</span>
          {activity.firm && (
            <>
              <span>·</span>
              {activity.firmColor && (
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: activity.firmColor, display: 'inline-block' }} />
              )}
              <span>{activity.firm}</span>
            </>
          )}
          {activity.account && <><span>·</span><span>{activity.account}</span></>}
        </div>
      </div>
      {activity.amount !== undefined && (
        <div style={{
          fontFamily: 'ui-monospace, monospace',
          fontWeight: 700, fontSize: 14, color,
        }}>{fmtMoney(activity.amount)}</div>
      )}
    </div>
  )
}

// ============================================================================
// STYLES INLINE
// ============================================================================

const tagStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '4px 10px', borderRadius: 99,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  fontSize: 12, color: 'var(--text2)',
  letterSpacing: '0.02em',
}
const btnPrimary = {
  padding: '9px 16px', fontSize: 13, fontWeight: 500,
  background: 'var(--text)', color: '#0a0c10',
  border: '1px solid transparent', borderRadius: 8,
  cursor: 'pointer', fontFamily: 'inherit',
  boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
}
const btnGhost = {
  padding: '9px 14px', fontSize: 13, fontWeight: 500,
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: 'var(--text2)', borderRadius: 8,
  cursor: 'pointer', fontFamily: 'inherit',
}
const inputStyle = {
  width: '100%', padding: '10px 12px', fontSize: 14,
  background: 'var(--surface2)', border: '0.5px solid var(--border2)',
  borderRadius: 'var(--radius)', color: 'var(--text)',
  outline: 'none', fontFamily: 'inherit',
}
function chipStyle(active) {
  return {
    padding: '6px 12px', fontSize: 12, fontWeight: active ? 600 : 500,
    background: active ? 'rgba(45,111,255,0.15)' : 'rgba(255,255,255,0.025)',
    color: active ? 'var(--blue-light)' : 'var(--text2)',
    border: `1px solid ${active ? 'rgba(45,111,255,0.4)' : 'var(--border)'}`,
    borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.15s',
  }
}
