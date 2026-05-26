'use client'
// PROFIL UTILISATEUR — page complète (read + edit) avec stats trading + base
// pour future intégration réseau social (followers, posts, etc.).

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase'
import ProfileModal from '../../../../components/ProfileModal'
import { useApp } from '../AppContext'
import Skeleton from '../../../../components/Skeleton'

const COUNTRIES = [
  { code: 'FR', label: 'France',         flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'BE', label: 'Belgique',       flag: '\u{1F1E7}\u{1F1EA}' },
  { code: 'CH', label: 'Suisse',         flag: '\u{1F1E8}\u{1F1ED}' },
  { code: 'CA', label: 'Canada',         flag: '\u{1F1E8}\u{1F1E6}' },
  { code: 'US', label: 'États-Unis', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'UK', label: 'Royaume-Uni',    flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'DE', label: 'Allemagne',      flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'ES', label: 'Espagne',        flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'IT', label: 'Italie',         flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'PT', label: 'Portugal',       flag: '\u{1F1F5}\u{1F1F9}' },
  { code: 'NL', label: 'Pays-Bas',       flag: '\u{1F1F3}\u{1F1F1}' },
  { code: 'MA', label: 'Maroc',          flag: '\u{1F1F2}\u{1F1E6}' },
  { code: 'TN', label: 'Tunisie',        flag: '\u{1F1F9}\u{1F1F3}' },
  { code: 'DZ', label: 'Algérie',  flag: '\u{1F1E9}\u{1F1FF}' },
  { code: 'SN', label: 'Sénégal', flag: '\u{1F1F8}\u{1F1F3}' },
  { code: 'CI', label: "Côte d'Ivoire", flag: '\u{1F1E8}\u{1F1EE}' },
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

export default function ProfilePage() {
  const { user, profile: appProfile } = useApp()

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [editing, setEditing] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const [formCountry, setFormCountry] = useState('')
  const [formIsPublic, setFormIsPublic] = useState(false)
  const [formStyles, setFormStyles] = useState([])
  const [formInstruments, setFormInstruments] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

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

    const totalPayouts = payouts.reduce((s, p) => s + (Number(p.amount) || 0), 0)
    const fundedAccounts = accounts.filter(a => a.status === 'Financé').length
    const liquidatedAccounts = accounts.filter(a => a.liquidated_at).length
    const winners = entries.filter(e => Number(e.pnl) > 0).length
    const winRate = entries.length > 0 ? (winners / entries.length) * 100 : 0
    const tradingDays = new Set(entries.map(e => e.date)).size
    const firmIds = new Set(accounts.map(a => a.firm_id).filter(Boolean))

    const pnlByDate = {}
    for (const e of entries) {
      pnlByDate[e.date] = (pnlByDate[e.date] || 0) + (Number(e.pnl) || 0)
    }
    const bestDay = Object.entries(pnlByDate).reduce(
      (acc, [d, v]) => (!acc || v > acc.pnl ? { date: d, pnl: v } : acc),
      null
    )

    setStats({
      totalPayouts, fundedAccounts, liquidatedAccounts,
      accountsCount: accounts.length, firmsCount: firmIds.size,
      winRate, tradesCount: entries.length, tradingDays, bestDay,
    })

    const acts = []
    for (const p of payouts.slice(0, 10)) {
      acts.push({ type: 'payout', date: p.date, label: 'Payout reçu', amount: Number(p.amount) || 0, firm: p.accounts?.firms?.name, firmColor: p.accounts?.firms?.color, account: p.accounts?.name })
    }
    for (const a of accounts.filter(a => a.liquidated_at)) {
      acts.push({ type: 'liquidated', date: a.liquidated_at.slice(0, 10), label: 'Compte auto-liquidé', firm: a.firms?.name, firmColor: a.firms?.color, account: a.name })
    }
    if (bestDay) {
      acts.push({ type: 'best_day', date: bestDay.date, label: 'Meilleur jour', amount: bestDay.pnl })
    }
    acts.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    setActivities(acts.slice(0, 10))
    setLoadingData(false)
  }, [])

  useEffect(() => {
    if (user) loadAll(user.id)
  }, [user, loadAll])

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

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'Trader'
  const countryObj = COUNTRIES.find(c => c.code === profile?.country)

  return (
    <>
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
          background: 'rgba(20,23,32,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border)', borderRadius: 14, padding: 28, marginBottom: 24, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(45,111,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap', position: 'relative' }}>
            <div className="qt-profile-avatar" style={{
              width: 92, height: 92, flexShrink: 0, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--blue) 0%, #6e3aff 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em',
              border: '2px solid var(--border2)', boxShadow: '0 8px 24px rgba(45,111,255,0.25)',
            }}>
              {getInitials(displayName)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{displayName}</h1>
                {profile?.verified && <span title="Compte vérifié" style={{ fontSize: 16, color: 'var(--blue-light)' }}>{'✓'}</span>}
                {profile?.is_public && (
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 99, background: 'rgba(29,184,122,0.12)', color: 'var(--green-text)', fontWeight: 700, letterSpacing: '0.08em' }}>PUBLIC</span>
                )}
              </div>

              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', fontFamily: 'ui-monospace, monospace' }}>
                {profile?.username && <span>@{profile.username}</span>}
                {profile?.username && <span style={{ color: 'var(--text3)' }}>{'·'}</span>}
                <span style={{ color: 'var(--text3)' }}>Membre depuis {fmtJoinDate(profile?.created_at)}</span>
              </div>

              {profile?.bio && <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, margin: '12px 0', maxWidth: 600 }}>{profile.bio}</p>}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                {countryObj && <span style={tagStyle}><span style={{ fontSize: 14 }}>{countryObj.flag}</span> {countryObj.label}</span>}
                {(profile?.trading_styles || []).map(s => {
                  const st = TRADING_STYLES.find(t => t.id === s)
                  return st ? <span key={s} style={tagStyle}>{'\u{1F4CA}'} {st.label}</span> : null
                })}
                {(profile?.instruments || []).slice(0, 6).map(i => (
                  <span key={i} style={{ ...tagStyle, fontFamily: 'ui-monospace, monospace' }}>{i}</span>
                ))}
                {(profile?.instruments || []).length > 6 && <span style={tagStyle}>+{(profile?.instruments || []).length - 6}</span>}
              </div>

              <div className="qt-profile-actions" style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
                <button onClick={() => setShowProfileModal(true)} style={btnPrimary}>{'✎'} Modifier le profil</button>
                <button onClick={() => setEditing(!editing)} style={btnGhost}>{editing ? '↑ Fermer paramètres' : '⚙ Paramètres avancés'}</button>
                <button disabled title="Disponible bientôt : suivre d'autres traders" style={{ ...btnGhost, opacity: 0.5, cursor: 'not-allowed' }}>+ Suivre (bientôt)</button>
              </div>

              <div style={{ display: 'flex', gap: 18, marginTop: 14, fontSize: 12, color: 'var(--text3)', fontFamily: 'ui-monospace, monospace' }}>
                <span><strong style={{ color: 'var(--text)' }}>{profile?.followers_count || 0}</strong> followers</span>
                <span><strong style={{ color: 'var(--text)' }}>{profile?.following_count || 0}</strong> following</span>
              </div>
            </div>
          </div>
        </div>

        {/* === PARAMÈTRES AVANCÉS === */}
        {editing && (
          <div style={{ background: 'rgba(20,23,32,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
            <SectionTitle>Paramètres avancés</SectionTitle>

            <div style={{ marginBottom: 18 }}>
              <MicroLabel>Visibilité</MicroLabel>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
                <input type="checkbox" checked={formIsPublic} onChange={e => setFormIsPublic(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--blue)' }} />
                Profil public {'—'} visible par les autres traders (URL : <code>/u/{profile?.username || 'pseudo'}</code>)
              </label>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, marginLeft: 26 }}>
                Si tu actives ça, ton pseudo, ta bio, ton pays et tes stats publiques seront visibles. Tes trades détaillés et tes comptes individuels restent privés.
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <MicroLabel>Pays</MicroLabel>
              <select value={formCountry} onChange={e => setFormCountry(e.target.value)} style={inputStyle}>
                <option value="">{'—'} Aucun {'—'}</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 18 }}>
              <MicroLabel>Style de trading</MicroLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TRADING_STYLES.map(s => <button key={s.id} type="button" onClick={() => toggleStyle(s.id)} style={chipStyle(formStyles.includes(s.id))}>{s.label}</button>)}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <MicroLabel>Instruments tradés</MicroLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {INSTRUMENT_TAGS.map(i => <button key={i} type="button" onClick={() => toggleInstrument(i)} style={{ ...chipStyle(formInstruments.includes(i)), fontFamily: 'ui-monospace, monospace' }}>{i}</button>)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
              <button onClick={saveExtras} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                {saving ? '⏳ Sauvegarde...' : 'Enregistrer'}
              </button>
              {saveMsg && <span style={{ fontSize: 12, color: saveMsg.startsWith('✓') ? 'var(--green-text)' : 'var(--red-text)', fontFamily: 'ui-monospace, monospace' }}>{saveMsg}</span>}
            </div>
          </div>
        )}

        {/* === STATS PUBLIQUES === */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Stats publiques</SectionTitle>
          {loadingData ? (
            <div style={{ padding: 24, maxWidth: 500, margin: '0 auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <Skeleton circle width={80} height={80} />
                <Skeleton width={160} height={18} />
                <Skeleton width={220} height={12} />
              </div>
              <div style={{ marginTop: 24 }}>
                <Skeleton width="100%" height={40} style={{ marginBottom: 10, borderRadius: 8 }} />
                <Skeleton width="100%" height={40} style={{ marginBottom: 10, borderRadius: 8 }} />
                <Skeleton width="100%" height={40} style={{ borderRadius: 8 }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <KpiCard label="Payouts totaux" value={fmtMoney(stats?.totalPayouts)} color="var(--green)" />
              <KpiCard label="Comptes financés" value={String(stats?.fundedAccounts || 0)} sub={`${stats?.accountsCount || 0} total`} />
              <KpiCard label="Firmes actives" value={String(stats?.firmsCount || 0)} />
              <KpiCard label="Win rate" value={`${(stats?.winRate || 0).toFixed(1)}%`} color={(stats?.winRate || 0) >= 50 ? 'var(--green)' : 'var(--amber-text)'} sub={`${stats?.tradesCount || 0} trades`} />
              <KpiCard label="Jours tradés" value={String(stats?.tradingDays || 0)} />
              <KpiCard label="Meilleur jour" value={stats?.bestDay ? fmtMoney(stats.bestDay.pnl) : '—'} sub={stats?.bestDay?.date} color="var(--green)" />
              {stats?.liquidatedAccounts > 0 && <KpiCard label="Auto-liquidations" value={String(stats.liquidatedAccounts)} color="var(--red)" />}
            </div>
          )}
        </div>

        {/* === ACTIVITÉS RÉCENTES === */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>Activités récentes</SectionTitle>
          <div style={{ background: 'rgba(20,23,32,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {activities.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Aucune activité pour l&apos;instant. Importe ton premier CSV ou enregistre un payout.</div>
            ) : (
              activities.map((a, i) => <ActivityRow key={i} activity={a} />)
            )}
          </div>
        </div>

        {/* === MUR / FEED === */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitle>
            Mur
            <span style={{ marginLeft: 8, fontSize: 9, padding: '3px 8px', borderRadius: 99, background: 'rgba(45,111,255,0.15)', color: 'var(--blue-light)', fontWeight: 700, letterSpacing: '0.08em', verticalAlign: 'middle' }}>BIENTÔT</span>
          </SectionTitle>
          <div style={{ background: 'rgba(20,23,32,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px dashed var(--border2)', borderRadius: 12, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>{'\u{1F4AC}'}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Le mini-réseau social arrive bientôt</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
              Tu pourras publier tes meilleurs trades, partager tes payouts, suivre d&apos;autres traders propfirm, et commenter leurs résultats. Le mur sera réservé aux profils publics.
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span>PROFIL {'·'} QUANTARA {'·'} v0.1</span>
          <span>{profile?.is_public ? '\u{1F310} Profil public' : '\u{1F512} Profil privé'}</span>
        </div>
      </div>

      {showProfileModal && (
        <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onUpdated={() => loadAll(user.id)} />
      )}
    </>
  )
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, color: 'var(--blue-light)', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>{children}</div>
}

function MicroLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, fontFamily: 'ui-monospace, monospace' }}>{children}</div>
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ padding: '14px 16px', background: 'rgba(20,23,32,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 10 }}>
      <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'ui-monospace, monospace', letterSpacing: '-0.01em', color: color || 'var(--text)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'ui-monospace, monospace', marginTop: 6, letterSpacing: '0.04em' }}>{sub}</div>}
    </div>
  )
}

function ActivityRow({ activity }) {
  const icon = activity.type === 'payout' ? '\u{1F4B0}' : activity.type === 'liquidated' ? '\u{1F480}' : activity.type === 'best_day' ? '\u{1F3C6}' : '•'
  const color = activity.type === 'liquidated' ? 'var(--red)' : activity.type === 'payout' || activity.type === 'best_day' ? 'var(--green)' : 'var(--text2)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <div style={{ fontSize: 18, width: 30, textAlign: 'center' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, color: 'var(--text)' }}>{activity.label}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'ui-monospace, monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{activity.date}</span>
          {activity.firm && (<><span>{'·'}</span>{activity.firmColor && <span style={{ width: 5, height: 5, borderRadius: '50%', background: activity.firmColor, display: 'inline-block' }} />}<span>{activity.firm}</span></>)}
          {activity.account && <><span>{'·'}</span><span>{activity.account}</span></>}
        </div>
      </div>
      {activity.amount !== undefined && (
        <div style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, fontSize: 14, color }}>{fmtMoney(activity.amount)}</div>
      )}
    </div>
  )
}

const tagStyle = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99,
  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)', letterSpacing: '0.02em',
}
const btnPrimary = {
  padding: '9px 16px', fontSize: 13, fontWeight: 500, background: 'var(--text)', color: '#0a0c10',
  border: '1px solid transparent', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
}
const btnGhost = {
  padding: '9px 14px', fontSize: 13, fontWeight: 500, background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.10)', color: 'var(--text2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
}
const inputStyle = {
  width: '100%', padding: '10px 12px', fontSize: 14, background: 'var(--surface2)',
  border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
}
function chipStyle(active) {
  return {
    padding: '6px 12px', fontSize: 12, fontWeight: active ? 600 : 500,
    background: active ? 'rgba(45,111,255,0.15)' : 'rgba(255,255,255,0.025)',
    color: active ? 'var(--blue-light)' : 'var(--text2)',
    border: `1px solid ${active ? 'rgba(45,111,255,0.4)' : 'var(--border)'}`,
    borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
  }
}
