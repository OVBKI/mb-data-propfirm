'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import AuthPage from '../components/AuthPage'

// ── Constants ──
const FIRM_COLORS = ['#2d6fff','#1db87a','#e8504a','#fac775','#a78bfa','#f472b6','#34d399','#fb923c']
const STATUS_COLORS = { 'Financé': '#1db87a', 'Challenge': '#fac775', 'Échoué': '#e8504a' }
const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const FIRM_SUGGESTIONS = ['Topstep','Apex Trader Funding','Bulenox','Lucid Trading','Tradeify','Take Profit Trader','TradeDay','Elite Trader Funding','Uprofit']

function toEUR(amount, cur, rates) {
  return amount * (rates[cur] || 1)
}

function fmtE(val, decimals = 2) {
  return (val >= 0 ? '' : '') + val.toFixed(decimals) + ' €'
}

function fmtENet(val, decimals = 2) {
  return (val >= 0 ? '+' : '') + val.toFixed(decimals) + ' €'
}

// ── Main App ──
export default function Home() {
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [firms, setFirms]         = useState([])
  const [rates, setRates]         = useState({ USD: 0.9259, GBP: 1.163, CHF: 1.032, EUR: 1 })
  const [rateInfo, setRateInfo]   = useState('Chargement...')
  const [page, setPage]           = useState('dashboard')
  const [currency, setCurrencyMode] = useState('native')

  // Modals
  const [firmModal, setFirmModal]   = useState(false)
  const [acctModal, setAcctModal]   = useState(null) // { firmId, acct? }
  const [firmDrawer, setFirmDrawer] = useState(null) // firmId
  const [acctDrawer, setAcctDrawer] = useState(null) // { firmId, acctId }
  const [payoutForm, setPayoutForm] = useState(false)

  // Form state
  const [newFirmName, setNewFirmName]   = useState('')
  const [acctForm, setAcctForm]         = useState({ buyDate: '', currency: 'USD', spent: '', activationFee: '', activationDate: '', status: 'Challenge', notes: '' })
  const [payoutFormData, setPayoutFormData] = useState({ date: '', amount: '', note: '' })
  const [toast, setToast]               = useState('')
  const [searchQ, setSearchQ]           = useState('')

  // Calendar
  const [calYear, setCalYear]   = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selectedDay, setSelectedDay] = useState(null)

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Load data ──
  useEffect(() => {
    if (user) { loadFirms(); fetchRates() }
  }, [user])

  async function fetchRates() {
    try {
      const r = await fetch('https://api.exchangerate-api.com/v4/latest/EUR')
      const d = await r.json()
      const newRates = { EUR: 1, USD: 1/d.rates.USD, GBP: 1/d.rates.GBP, CHF: 1/d.rates.CHF }
      setRates(newRates)
      const ts = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      setRateInfo(`1 USD ≈ ${newRates.USD.toFixed(4)} EUR · 1 GBP ≈ ${newRates.GBP.toFixed(4)} EUR — ${ts}`)
    } catch {
      setRateInfo('Taux hors ligne · 1 USD ≈ 0.9259 €')
    }
  }

  async function loadFirms() {
    const { data: firmsData } = await supabase.from('firms').select('*').order('created_at')
    if (!firmsData) return
    const { data: accountsData } = await supabase.from('accounts').select('*').order('buy_date')
    const { data: payoutsData } = await supabase.from('payouts').select('*').order('date')

    const enriched = firmsData.map((f, i) => ({
      ...f,
      color: f.color || FIRM_COLORS[i % FIRM_COLORS.length],
      accounts: (accountsData || [])
        .filter(a => a.firm_id === f.id)
        .map(a => ({
          ...a,
          payouts: (payoutsData || []).filter(p => p.account_id === a.id)
        }))
    }))
    setFirms(enriched)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null); setFirms([])
  }

  // ── Firm CRUD ──
  async function createFirm() {
    if (!newFirmName.trim()) { showToast('Nom requis'); return }
    if (firms.find(f => f.name.toLowerCase() === newFirmName.trim().toLowerCase())) {
      showToast('Cette firme existe déjà'); return
    }
    const color = FIRM_COLORS[firms.length % FIRM_COLORS.length]
    const { data, error } = await supabase.from('firms').insert({
      name: newFirmName.trim(), color, user_id: user.id
    }).select().single()
    if (error) { showToast('Erreur: ' + error.message); return }
    setFirmModal(false); setNewFirmName('')
    await loadFirms()
    showToast('PropFirm ajoutée ✓')
    setAcctModal({ firmId: data.id })
    setAcctForm({ buyDate: new Date().toISOString().slice(0,10), currency: 'USD', spent: '', activationFee: '', activationDate: '', status: 'Challenge', notes: '' })
  }

  async function deleteFirm(firmId) {
    const firm = firms.find(f => f.id === firmId)
    if (!confirm(`Supprimer ${firm?.name} et tous ses comptes ?`)) return
    await supabase.from('firms').delete().eq('id', firmId)
    setFirmDrawer(null); await loadFirms(); showToast('Firme supprimée')
  }

  async function renameFirm(firmId) {
    const firm = firms.find(f => f.id === firmId)
    const name = prompt('Nouveau nom :', firm?.name)
    if (!name?.trim()) return
    await supabase.from('firms').update({ name: name.trim() }).eq('id', firmId)
    await loadFirms(); showToast('Renommé ✓')
  }

  // ── Account CRUD ──
  async function saveAccount() {
    const { firmId, acct } = acctModal
    if (!acctForm.buyDate) { showToast('Date requise'); return }
    const payload = {
      firm_id: firmId, user_id: user.id,
      buy_date: acctForm.buyDate,
      currency: acctForm.currency,
      spent: parseFloat(acctForm.spent) || 0,
      activation_fee: parseFloat(acctForm.activationFee) || 0,
      activation_date: acctForm.activationDate || null,
      status: acctForm.status,
      notes: acctForm.notes
    }
    if (acct) {
      await supabase.from('accounts').update(payload).eq('id', acct.id)
      showToast('Compte modifié ✓')
    } else {
      await supabase.from('accounts').insert(payload)
      showToast('Compte ajouté ✓')
    }
    setAcctModal(null); await loadFirms()
  }

  async function deleteAccount(acctId) {
    if (!confirm('Supprimer ce compte et tous ses payouts ?')) return
    await supabase.from('accounts').delete().eq('id', acctId)
    setAcctDrawer(null); await loadFirms(); showToast('Compte supprimé')
  }

  // ── Payout CRUD ──
  async function savePayout() {
    const { firmId, acctId } = acctDrawer
    if (!payoutFormData.date || !payoutFormData.amount) { showToast('Date et montant requis'); return }
    await supabase.from('payouts').insert({
      account_id: acctId, user_id: user.id,
      date: payoutFormData.date,
      amount: parseFloat(payoutFormData.amount),
      note: payoutFormData.note
    })
    setPayoutForm(false)
    setPayoutFormData({ date: '', amount: '', note: '' })
    await loadFirms(); showToast('Payout ajouté ✓')
  }

  async function deletePayout(payoutId) {
    if (!confirm('Supprimer ce payout ?')) return
    await supabase.from('payouts').delete().eq('id', payoutId)
    await loadFirms(); showToast('Payout supprimé')
  }

  // ── Computed values ──
  function totalPayoutsEUR(acct) {
    return (acct.payouts || []).reduce((s, p) => s + toEUR(p.amount, acct.currency, rates), 0)
  }
  function totalSpentForAccount(acct) {
    return toEUR(acct.spent || 0, acct.currency, rates) + toEUR(acct.activation_fee || 0, acct.currency, rates)
  }
  function firmTotalSpent(firm) {
    return (firm.accounts || []).reduce((s, a) => s + totalSpentForAccount(a), 0)
  }
  function firmTotalPayouts(firm) {
    return (firm.accounts || []).reduce((s, a) => s + totalPayoutsEUR(a), 0)
  }
  function allAccounts() {
    return firms.flatMap(f => (f.accounts || []).map(a => ({ ...a, firmName: f.name, firmColor: f.color })))
  }

  // ── Build event map for calendar ──
  function buildEventMap() {
    const m = {}
    firms.forEach(f => {
      (f.accounts || []).forEach(a => {
        if (!m[a.buy_date]) m[a.buy_date] = []
        m[a.buy_date].push({ type: 'buy', firm: f.name, amount: a.spent, currency: a.currency, firmId: f.id, acctId: a.id })
        if (a.activation_fee > 0 && a.activation_date) {
          if (!m[a.activation_date]) m[a.activation_date] = []
          m[a.activation_date].push({ type: 'buy', firm: f.name, amount: a.activation_fee, currency: a.currency, firmId: f.id, acctId: a.id, label: 'Activation' })
        }
        ;(a.payouts || []).forEach(p => {
          if (!m[p.date]) m[p.date] = []
          m[p.date].push({ type: 'pay', firm: f.name, amount: p.amount, currency: a.currency, firmId: f.id, acctId: a.id })
        })
      })
    })
    return m
  }

  // ── Export CSV ──
  function exportCSV() {
    const rows = [['Firme','Date achat','Devise','Dépensé','Frais activation','Date payout','Montant payout EUR','Statut','Notes']]
    firms.forEach(f => {
      (f.accounts || []).forEach(a => {
        if (!(a.payouts || []).length) {
          rows.push([f.name, a.buy_date, a.currency, a.spent, a.activation_fee || 0, '', '', a.status, a.notes || ''])
        } else {
          (a.payouts || []).forEach(p => {
            rows.push([f.name, a.buy_date, a.currency, a.spent, a.activation_fee || 0, p.date, toEUR(p.amount, a.currency, rates).toFixed(2), a.status, p.note || a.notes || ''])
          })
        }
      })
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `MB_PropFirm_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); showToast('Export CSV ✓')
  }

  // ── Render guards ──
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text3)' }}>
      Chargement...
    </div>
  )
  if (!user) return <AuthPage onAuth={u => setUser(u)} />

  // ── Get current firm/account for drawers ──
  const currentFirm = firms.find(f => f.id === firmDrawer)
  const currentAcctInfo = acctDrawer ? (() => {
    const f = firms.find(x => x.id === acctDrawer.firmId)
    const a = f?.accounts?.find(x => x.id === acctDrawer.acctId)
    return { firm: f, acct: a }
  })() : {}

  // ── Summary stats ──
  const accts = allAccounts()
  const totalSpentEUR = accts.reduce((s, a) => s + totalSpentForAccount(a), 0)
  const totalPayoutsEUR2 = accts.reduce((s, a) => s + totalPayoutsEUR(a), 0)
  const totalNet = totalPayoutsEUR2 - totalSpentEUR
  const totalPayoutCount = accts.reduce((s, a) => s + (a.payouts || []).length, 0)

  // ── Calendar data ──
  const evtMap = buildEventMap()
  const calDays = (() => {
    const firstDay = new Date(calYear, calMonth, 1)
    let sdow = firstDay.getDay(); sdow = sdow === 0 ? 6 : sdow - 1
    const dim = new Date(calYear, calMonth + 1, 0).getDate()
    const dipm = new Date(calYear, calMonth, 0).getDate()
    const todayStr = new Date().toISOString().slice(0, 10)
    const days = []
    for (let i = sdow - 1; i >= 0; i--) {
      const d = dipm - i, m2 = calMonth === 0 ? 11 : calMonth - 1, y2 = calMonth === 0 ? calYear - 1 : calYear
      days.push({ day: d, dateStr: `${y2}-${String(m2+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, other: true })
    }
    for (let d = 1; d <= dim; d++) {
      const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      days.push({ day: d, dateStr: ds, other: false, today: ds === todayStr, selected: ds === selectedDay })
    }
    const rem = (sdow + dim) % 7 === 0 ? 0 : 7 - (sdow + dim) % 7
    for (let d = 1; d <= rem; d++) {
      const m3 = calMonth === 11 ? 0 : calMonth + 1, y3 = calMonth === 11 ? calYear + 1 : calYear
      days.push({ day: d, dateStr: `${y3}-${String(m3+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`, other: true })
    }
    return days
  })()

  // Month summary
  let msSpent = 0, msPayout = 0
  Object.entries(evtMap).forEach(([d, evts]) => {
    const dt = new Date(d + 'T00:00:00')
    if (dt.getFullYear() === calYear && dt.getMonth() === calMonth) {
      evts.forEach(e => {
        if (e.type === 'buy') msSpent += toEUR(e.amount, e.currency, rates)
        else msPayout += toEUR(e.amount, e.currency, rates)
      })
    }
  })

  const S = { // Styles helpers
    card: { background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)' },
    input: { width: '100%', padding: '9px 11px', fontSize: '13px', border: '0.5px solid var(--border2)', borderRadius: 'var(--radius)', background: 'var(--surface2)', color: 'var(--text)', outline: 'none' },
    label: { fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' },
    btnPrimary: { padding: '8px 18px', fontSize: '13px', fontWeight: '600', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer' },
    btnGhost: { padding: '7px 14px', fontSize: '12px', background: 'transparent', border: '0.5px solid var(--border2)', color: 'var(--text2)', borderRadius: 'var(--radius)', cursor: 'pointer' },
    badge: (status) => ({
      display: 'inline-block', fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '99px',
      background: status === 'Financé' ? 'var(--green-bg)' : status === 'Challenge' ? 'var(--amber-bg)' : 'var(--red-bg)',
      color: status === 'Financé' ? 'var(--green-text)' : status === 'Challenge' ? 'var(--amber-text)' : 'var(--red-text)'
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Accent line */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, var(--blue) 0%, transparent 100%)' }} />

      {/* Titlebar */}
      <div style={{ height: '48px', background: 'var(--surface)', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontWeight: '700', fontSize: '15px' }}>MB Data</div>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>· PropFirm Journal</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={exportCSV} style={S.btnGhost}>↓ CSV</button>
          <button onClick={signOut} style={{ ...S.btnGhost, fontSize: '12px' }}>Déconnexion</button>
        </div>
      </div>

      {/* App layout */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 50px)' }}>
        {/* Sidebar */}
        <nav style={{ width: '200px', flexShrink: 0, background: 'var(--surface)', borderRight: '0.5px solid var(--border)', padding: '16px 0', position: 'sticky', top: '48px', height: 'calc(100vh - 48px)', overflowY: 'auto' }}>
          {[
            { key: 'dashboard', icon: '📊', label: 'Tableau de bord' },
            { key: 'analytics', icon: '📈', label: 'Analytics' },
          ].map(item => (
            <button key={item.key} onClick={() => setPage(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', width: '100%', border: 'none', background: page === item.key ? 'rgba(45,111,255,0.12)' : 'transparent', color: page === item.key ? 'var(--blue)' : 'var(--text2)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'left' }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
          <div style={{ padding: '8px 16px', fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '12px' }}>PropFirm</div>
          {[
            { key: 'rules', icon: '📋', label: 'Règles firmes' },
            { key: 'alerts', icon: '🔔', label: 'Alertes' },
          ].map(item => (
            <button key={item.key} onClick={() => setPage(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', width: '100%', border: 'none', background: page === item.key ? 'rgba(45,111,255,0.12)' : 'transparent', color: page === item.key ? 'var(--blue)' : 'var(--text2)', fontSize: '13px', fontWeight: '500', cursor: 'pointer', textAlign: 'left' }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}

          {/* User info */}
          <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, padding: '0 16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </nav>

        {/* Main content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {page === 'dashboard' && (
            <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '28px 24px 60px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
                <div>
                  <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>Tableau de bord</h1>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{rateInfo}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', border: '0.5px solid var(--border2)', borderRadius: '99px', overflow: 'hidden', background: 'var(--surface)' }}>
                    {['native','eur'].map(c => (
                      <button key={c} onClick={() => setCurrencyMode(c)}
                        style={{ padding: '6px 14px', fontSize: '12px', border: 'none', background: currency === c ? 'var(--blue)' : 'transparent', color: currency === c ? '#fff' : 'var(--text2)', cursor: 'pointer', fontWeight: '500' }}>
                        {c === 'native' ? 'USD natif' : 'EUR'}
                      </button>
                    ))}
                  </div>
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 Rechercher..."
                    style={{ ...S.input, width: '160px' }} />
                  <button onClick={() => { setFirmModal(true); setNewFirmName('') }} style={S.btnPrimary}>
                    + Ajouter PropFirm
                  </button>
                </div>
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'PropFirms', value: `${firms.length} firme${firms.length > 1 ? 's' : ''} · ${accts.length} compte${accts.length > 1 ? 's' : ''}`, color: 'var(--text)', small: true },
                  { label: 'Total dépensé', value: (currency === 'eur' ? fmtE(totalSpentEUR) : (totalSpentEUR / rates.USD).toFixed(2) + ' $'), color: 'var(--red)' },
                  { label: 'Total payouts', value: (currency === 'eur' ? fmtE(totalPayoutsEUR2) : (totalPayoutsEUR2 / rates.USD).toFixed(2) + ' $'), color: 'var(--green)' },
                  { label: 'Résultat net', value: (currency === 'eur' ? fmtENet(totalNet) : (totalNet >= 0 ? '+' : '') + (totalNet / rates.USD).toFixed(2) + ' $'), color: totalNet >= 0 ? 'var(--green)' : 'var(--red)' },
                  { label: 'Nb payouts', value: totalPayoutCount, color: 'var(--text)' },
                ].map((k, i) => (
                  <div key={i} style={{ ...S.card, padding: '18px 16px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>{k.label}</div>
                    <div style={{ fontSize: k.small ? '14px' : '22px', fontWeight: '600', color: k.color }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* Firm Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {firms.filter(f => f.name.toLowerCase().includes(searchQ.toLowerCase())).map(firm => {
                  const ts = firmTotalSpent(firm)
                  const tp = firmTotalPayouts(firm)
                  const net = tp - ts
                  const roi = ts > 0 ? net / ts * 100 : 0
                  const acctList = firm.accounts || []
                  const activeAccts = acctList.filter(a => a.status !== 'Échoué')
                  const challengeCount = acctList.filter(a => a.status === 'Challenge').length
                  const financedCount = acctList.filter(a => a.status === 'Financé').length
                  const failedCount = acctList.filter(a => a.status === 'Échoué').length
                  const payoutCount = acctList.reduce((s, a) => s + (a.payouts || []).length, 0)

                  return (
                    <div key={firm.id} onClick={() => setFirmDrawer(firm.id)}
                      style={{ ...S.card, padding: '18px', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.1s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none' }}>

                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: firm.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>
                            {firm.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '700' }}>{firm.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{acctList.length} compte{acctList.length > 1 ? 's' : ''} · {payoutCount} payout{payoutCount > 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: '700', color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {currency === 'eur' ? fmtENet(net, 0) : (net >= 0 ? '+' : '') + (net / rates.USD).toFixed(0) + ' $'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text3)' }}>ROI {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%</div>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                        {[
                          { label: 'Dépensé', value: currency === 'eur' ? fmtE(ts, 0) : (ts / rates.USD).toFixed(0) + ' $', color: 'var(--red)' },
                          { label: 'Payouts', value: currency === 'eur' ? fmtE(tp, 0) : (tp / rates.USD).toFixed(0) + ' $', color: 'var(--green)' },
                          { label: 'Actifs', value: financedCount + challengeCount, color: 'var(--text)' }
                        ].map((stat, i) => (
                          <div key={i} style={{ background: 'var(--surface3)', borderRadius: '6px', padding: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>{stat.label}</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: stat.color }}>{stat.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Mini account list */}
                      {activeAccts.slice(0, 3).map(a => {
                        const aNet = totalPayoutsEUR(a) - totalSpentForAccount(a)
                        return (
                          <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--border)', fontSize: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: STATUS_COLORS[a.status] || 'var(--text3)', flexShrink: 0 }} />
                              <span style={{ color: 'var(--text2)' }}>{a.buy_date}</span>
                              <span style={S.badge(a.status)}>{a.status}</span>
                            </div>
                            <span style={{ fontWeight: '600', color: aNet >= 0 ? 'var(--green)' : 'var(--red)' }}>
                              {aNet >= 0 ? '+' : ''}{aNet.toFixed(0)} €
                            </span>
                          </div>
                        )
                      })}
                      {activeAccts.length > 3 && <div style={{ fontSize: '11px', color: 'var(--text3)', padding: '4px 0' }}>+{activeAccts.length - 3} autre{activeAccts.length - 3 > 1 ? 's' : ''}...</div>}

                      {/* Badges */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                        {challengeCount > 0 && <span style={S.badge('Challenge')}>{challengeCount} Challenge{challengeCount > 1 ? 's' : ''}</span>}
                        {financedCount > 0 && <span style={S.badge('Financé')}>{financedCount} Financé{financedCount > 1 ? 's' : ''}</span>}
                        {failedCount > 0 && <span style={S.badge('Échoué')}>{failedCount} Échoué{failedCount > 1 ? 's' : ''}</span>}
                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text3)', alignSelf: 'center' }}>Détails →</span>
                      </div>
                    </div>
                  )
                })}
                {!firms.length && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text3)', padding: '60px' }}>
                    Ajoutez votre première PropFirm pour commencer.
                  </div>
                )}
              </div>

              {/* Calendar */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>Calendrier des transactions</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => { const d = new Date(calYear, calMonth - 1); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()) }} style={S.btnGhost}>‹</button>
                    <span style={{ fontWeight: '600', minWidth: '140px', textAlign: 'center' }}>{MONTHS_FR[calMonth]} {calYear}</span>
                    <button onClick={() => { const d = new Date(calYear, calMonth + 1); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()) }} style={S.btnGhost}>›</button>
                    <button onClick={() => { setCalMonth(new Date().getMonth()); setCalYear(new Date().getFullYear()); setSelectedDay(null) }} style={S.btnGhost}>Aujourd'hui</button>
                  </div>
                </div>

                {/* Month summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { label: 'Achats du mois', value: fmtE(msSpent), color: 'var(--red)' },
                    { label: 'Payouts du mois', value: fmtE(msPayout), color: 'var(--green)' },
                    { label: 'Net du mois', value: fmtENet(msPayout - msSpent), color: (msPayout - msSpent) >= 0 ? 'var(--green)' : 'var(--red)' }
                  ].map((s, i) => (
                    <div key={i} style={{ ...S.card, padding: '10px 14px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{s.label}</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' }}>
                  {/* Grid */}
                  <div style={{ ...S.card, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)' }}>
                      {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
                        <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: '10px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase' }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                      {calDays.map((day, i) => {
                        const evts = evtMap[day.dateStr] || []
                        const buys = evts.filter(e => e.type === 'buy')
                        const pays = evts.filter(e => e.type === 'pay')
                        const buyTotal = buys.reduce((s, e) => s + toEUR(e.amount, e.currency, rates), 0)
                        const payTotal = pays.reduce((s, e) => s + toEUR(e.amount, e.currency, rates), 0)
                        return (
                          <div key={i} onClick={() => setSelectedDay(day.dateStr)}
                            style={{ minHeight: '72px', padding: '6px', borderRight: (i + 1) % 7 === 0 ? 'none' : '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)', cursor: 'pointer', opacity: day.other ? 0.25 : 1, background: day.selected ? 'rgba(45,111,255,0.08)' : 'transparent', outline: day.selected ? '2px solid var(--blue)' : 'none', outlineOffset: '-2px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text2)', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: day.today ? 'var(--blue)' : 'transparent', color: day.today ? '#fff' : 'var(--text2)', marginBottom: '3px' }}>{day.day}</div>
                            {buyTotal > 0 && <div style={{ fontSize: '9px', fontWeight: '700', padding: '1px 4px', borderRadius: '3px', background: 'var(--red-bg)', color: 'var(--red-text)', marginBottom: '2px' }}>-{buyTotal.toFixed(0)} €</div>}
                            {payTotal > 0 && <div style={{ fontSize: '9px', fontWeight: '700', padding: '1px 4px', borderRadius: '3px', background: 'var(--green-bg)', color: 'var(--green-text)' }}>+{payTotal.toFixed(0)} €</div>}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Day detail */}
                  <div style={{ ...S.card, padding: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
                      {selectedDay ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sélectionnez un jour'}
                    </div>
                    {selectedDay ? (
                      (evtMap[selectedDay] || []).length > 0 ? (
                        (evtMap[selectedDay] || []).map((e, i) => (
                          <div key={i} onClick={() => { setFirmDrawer(e.firmId) }}
                            style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius)', marginBottom: '8px', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '600', fontSize: '13px' }}>{e.firm}</span>
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: e.type === 'buy' ? 'var(--red-bg)' : 'var(--green-bg)', color: e.type === 'buy' ? 'var(--red-text)' : 'var(--green-text)', fontWeight: '600' }}>
                                {e.label || (e.type === 'buy' ? 'Achat' : 'Payout')}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: e.type === 'buy' ? 'var(--red)' : 'var(--green)', fontWeight: '600' }}>
                              {e.type === 'buy' ? '-' : '+'}{toEUR(e.amount, e.currency, rates).toFixed(2)} €
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: 'var(--text3)', fontSize: '12px' }}>Aucune transaction ce jour.</div>
                      )
                    ) : (
                      <div style={{ color: 'var(--text3)', fontSize: '12px' }}>Cliquez sur un jour pour voir les transactions.</div>
                    )}

                    {/* Recent timeline */}
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '0.5px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Récents</div>
                      {Object.entries(evtMap).flatMap(([d, evts]) => evts.map(e => ({ ...e, date: d }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((e, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: e.type === 'buy' ? 'var(--red)' : 'var(--green)', marginTop: '4px', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: '500' }}>{e.firm}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{e.date} · {e.type === 'buy' ? 'Achat' : 'Payout'}</div>
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: e.type === 'buy' ? 'var(--red)' : 'var(--green)' }}>
                            {e.type === 'buy' ? '-' : '+'}{toEUR(e.amount, e.currency, rates).toFixed(2)} €
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {page === 'analytics' && (
            <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '28px 24px 60px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '24px' }}>Analytics</h1>
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text3)', ...S.card }}>
                📈 Graphiques disponibles dans la prochaine version
              </div>
            </div>
          )}

          {page === 'rules' && (
            <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '28px 24px 60px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '24px' }}>Règles PropFirm</h1>
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text3)', ...S.card }}>
                📋 Règles disponibles dans la prochaine version
              </div>
            </div>
          )}

          {page === 'alerts' && (
            <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '28px 24px 60px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '24px' }}>Alertes</h1>
              {firms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text3)', ...S.card }}>Ajoutez des comptes pour voir les alertes.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {firms.flatMap(f => (f.accounts || []).map(a => {
                    const tp = totalPayoutsEUR(a), sp = totalSpentForAccount(a)
                    const alerts = []
                    if (a.status === 'Financé' && (a.payouts || []).length === 0)
                      alerts.push({ icon: '💰', title: `Payout disponible — ${f.name}`, sub: 'Compte financé — pensez à demander votre payout', color: 'var(--green-bg)', border: 'var(--green)' })
                    if (a.status === 'Challenge') {
                      const days = Math.floor((new Date() - new Date(a.buy_date + 'T00:00:00')) / (1000*60*60*24))
                      if (days > 30) alerts.push({ icon: '⏰', title: `Challenge en cours depuis ${days} jours — ${f.name}`, sub: 'Vérifiez votre progression', color: 'var(--amber-bg)', border: 'var(--amber-text)' })
                    }
                    if (tp > sp * 2) alerts.push({ icon: '🏆', title: `Excellent ROI — ${f.name}`, sub: `${(tp/sp).toFixed(1)}x votre investissement`, color: 'var(--green-bg)', border: 'var(--green)' })
                    return alerts
                  })).flat().map((alert, i) => (
                    <div key={i} style={{ ...S.card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', background: alert.color, borderColor: alert.border }}>
                      <div style={{ fontSize: '22px' }}>{alert.icon}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>{alert.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{alert.sub}</div>
                      </div>
                    </div>
                  ))}
                  {firms.flatMap(f => (f.accounts || []).map(a => {
                    const tp = totalPayoutsEUR(a), sp = totalSpentForAccount(a)
                    return ((a.status === 'Financé' && (a.payouts||[]).length === 0) || (tp > sp * 2) || (a.status === 'Challenge' && Math.floor((new Date() - new Date(a.buy_date + 'T00:00:00'))/(1000*60*60*24)) > 30)) ? [1] : []
                  })).flat().length === 0 && (
                    <div style={{ ...S.card, padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '20px' }}>✅</div>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>Tout est en ordre — aucune alerte pour le moment.</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ MODALS & DRAWERS ══ */}

      {/* Firm Modal */}
      {firmModal && (
        <div onClick={() => setFirmModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ ...S.card, padding: '28px', width: '400px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '20px' }}>Ajouter une PropFirm</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={S.label}>Nom de la PropFirm</label>
              <input list="firmSugg" value={newFirmName} onChange={e => setNewFirmName(e.target.value)}
                placeholder="Topstep, Apex, Bulenox..." style={S.input}
                onKeyDown={e => e.key === 'Enter' && createFirm()} autoFocus />
              <datalist id="firmSugg">{FIRM_SUGGESTIONS.map(s => <option key={s} value={s} />)}</datalist>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setFirmModal(false)} style={S.btnGhost}>Annuler</button>
              <button onClick={createFirm} style={S.btnPrimary}>Créer &amp; Ajouter un compte</button>
            </div>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {acctModal && (
        <div onClick={() => setAcctModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ ...S.card, padding: '28px', width: '440px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '20px' }}>
              {acctModal.acct ? 'Modifier le compte' : `Nouveau compte — ${firms.find(f => f.id === acctModal.firmId)?.name}`}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div><label style={S.label}>Date d'achat</label><input type="date" value={acctForm.buyDate} onChange={e => setAcctForm(p => ({ ...p, buyDate: e.target.value }))} style={S.input} /></div>
              <div><label style={S.label}>Devise</label>
                <select value={acctForm.currency} onChange={e => setAcctForm(p => ({ ...p, currency: e.target.value }))} style={S.input}>
                  <option>USD</option><option>EUR</option><option>GBP</option><option>CHF</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Montant dépensé (challenge)</label><input type="number" value={acctForm.spent} onChange={e => setAcctForm(p => ({ ...p, spent: e.target.value }))} placeholder="0.00" style={S.input} /></div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={S.label}>Statut</label>
                <select value={acctForm.status} onChange={e => setAcctForm(p => ({ ...p, status: e.target.value }))} style={S.input}>
                  <option>Challenge</option><option>Financé</option><option>Échoué</option>
                </select>
              </div>
              {acctForm.status === 'Financé' && (
                <div style={{ gridColumn: '1/-1', background: 'rgba(29,184,122,0.07)', border: '0.5px solid var(--green)', borderRadius: 'var(--radius)', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--green-text)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✅ Compte Financé</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><label style={S.label}>Date d'activation</label><input type="date" value={acctForm.activationDate} onChange={e => setAcctForm(p => ({ ...p, activationDate: e.target.value }))} style={{ ...S.input, background: 'var(--surface3)' }} /></div>
                    <div><label style={S.label}>Frais d'activation</label><input type="number" value={acctForm.activationFee} onChange={e => setAcctForm(p => ({ ...p, activationFee: e.target.value }))} placeholder="145.00" style={{ ...S.input, background: 'var(--surface3)' }} /></div>
                  </div>
                </div>
              )}
              <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Notes</label><input value={acctForm.notes} onChange={e => setAcctForm(p => ({ ...p, notes: e.target.value }))} placeholder="Commentaire..." style={S.input} /></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setAcctModal(null)} style={S.btnGhost}>Annuler</button>
              <button onClick={saveAccount} style={S.btnPrimary}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Firm Drawer */}
      {firmDrawer && currentFirm && (
        <div onClick={() => setFirmDrawer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '520px', maxWidth: '95vw', height: '100vh', background: 'var(--surface)', borderLeft: '0.5px solid var(--border2)', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>{currentFirm.name}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => renameFirm(currentFirm.id)} style={S.btnGhost}>✏ Renommer</button>
                <button onClick={() => setFirmDrawer(null)} style={S.btnGhost}>✕</button>
              </div>
            </div>

            {/* Firm summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[
                ['Total comptes', (currentFirm.accounts||[]).length],
                ['Total dépensé', <span style={{ color: 'var(--red)' }}>{fmtE(firmTotalSpent(currentFirm))}</span>],
                ['Total payouts', <span style={{ color: 'var(--green)' }}>{fmtE(firmTotalPayouts(currentFirm))}</span>],
                ['Net', <span style={{ color: (firmTotalPayouts(currentFirm) - firmTotalSpent(currentFirm)) >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtENet(firmTotalPayouts(currentFirm) - firmTotalSpent(currentFirm))}</span>]
              ].map(([l, v], i) => (
                <div key={i} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>{l}</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Accounts section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comptes ({(currentFirm.accounts||[]).length})</div>
              <button onClick={() => { setAcctModal({ firmId: currentFirm.id }); setAcctForm({ buyDate: new Date().toISOString().slice(0,10), currency: 'USD', spent: '', activationFee: '', activationDate: '', status: 'Challenge', notes: '' }) }} style={S.btnPrimary}>+ Ajouter compte</button>
            </div>

            {(currentFirm.accounts || []).filter(a => a.status !== 'Échoué').map(a => {
              const tp = totalPayoutsEUR(a), net = tp - totalSpentForAccount(a)
              return (
                <div key={a.id} onClick={() => { setAcctDrawer({ firmId: currentFirm.id, acctId: a.id }); setPayoutForm(false) }}
                  style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius)', marginBottom: '8px', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[a.status] }} />
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>Compte du {a.buy_date}</span>
                    </div>
                    <span style={S.badge(a.status)}>{a.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--green)' }}>Payouts : {fmtE(tp)}</span>
                    <span style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>Net : {fmtENet(net)}</span>
                    <span style={{ color: 'var(--text3)' }}>{(a.payouts||[]).length} payout{(a.payouts||[]).length > 1 ? 's' : ''}</span>
                  </div>
                </div>
              )
            })}

            {/* Failed accounts */}
            {(currentFirm.accounts || []).filter(a => a.status === 'Échoué').length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '0.5px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Comptes échoués</div>
                {(currentFirm.accounts || []).filter(a => a.status === 'Échoué').map(a => (
                  <div key={a.id} onClick={() => setAcctDrawer({ firmId: currentFirm.id, acctId: a.id })}
                    style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius)', marginBottom: '8px', cursor: 'pointer', opacity: 0.7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px' }}>Compte du {a.buy_date}</span>
                      <span style={S.badge('Échoué')}>Échoué</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '0.5px solid var(--border)' }}>
              <button onClick={() => deleteFirm(currentFirm.id)} style={{ background: 'var(--red-bg)', color: 'var(--red-text)', border: '0.5px solid var(--red-bg)', padding: '8px 16px', borderRadius: 'var(--radius)', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
                Supprimer cette firme
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Drawer */}
      {acctDrawer && currentAcctInfo.acct && (
        <div onClick={() => setAcctDrawer(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 450, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '500px', maxWidth: '95vw', height: '100vh', background: 'var(--surface)', borderLeft: '0.5px solid var(--border2)', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ fontSize: '17px', fontWeight: '600' }}>{currentAcctInfo.firm?.name} — Compte</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setAcctModal({ firmId: acctDrawer.firmId, acct: currentAcctInfo.acct }); setAcctForm({ buyDate: currentAcctInfo.acct.buy_date, currency: currentAcctInfo.acct.currency, spent: currentAcctInfo.acct.spent, activationFee: currentAcctInfo.acct.activation_fee || '', activationDate: currentAcctInfo.acct.activation_date || '', status: currentAcctInfo.acct.status, notes: currentAcctInfo.acct.notes || '' }) }} style={S.btnGhost}>✏ Modifier</button>
                <button onClick={() => setAcctDrawer(null)} style={S.btnGhost}>✕</button>
              </div>
            </div>

            {/* Account info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[
                ['Firme', currentAcctInfo.firm?.name],
                ['Date achat', currentAcctInfo.acct.buy_date],
                ['Challenge', <span style={{ color: 'var(--red)' }}>{currentAcctInfo.acct.spent} {currentAcctInfo.acct.currency}</span>],
                ...(currentAcctInfo.acct.activation_fee > 0 ? [
                  ['Date activation', currentAcctInfo.acct.activation_date || '—'],
                  ['Frais activation', <span style={{ color: 'var(--red)' }}>{currentAcctInfo.acct.activation_fee} {currentAcctInfo.acct.currency}</span>]
                ] : []),
                ['Total dépensé', <span style={{ color: 'var(--red)' }}>{fmtE(totalSpentForAccount(currentAcctInfo.acct))}</span>],
                ['Net', <span style={{ color: (totalPayoutsEUR(currentAcctInfo.acct) - totalSpentForAccount(currentAcctInfo.acct)) >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtENet(totalPayoutsEUR(currentAcctInfo.acct) - totalSpentForAccount(currentAcctInfo.acct))}</span>],
                ['Statut', <span style={S.badge(currentAcctInfo.acct.status)}>{currentAcctInfo.acct.status}</span>],
              ].map(([l, v], i) => (
                <div key={i} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>{l}</div>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Payouts */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payouts reçus</div>
              <button onClick={() => { setPayoutForm(true); setPayoutFormData({ date: new Date().toISOString().slice(0,10), amount: '', note: '' }) }} style={S.btnPrimary}>+ Ajouter payout</button>
            </div>

            {payoutForm && (
              <div style={{ background: 'var(--surface3)', borderRadius: 'var(--radius)', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div><div style={S.label}>Date</div><input type="date" value={payoutFormData.date} onChange={e => setPayoutFormData(p => ({ ...p, date: e.target.value }))} style={{ ...S.input, background: 'var(--surface2)' }} /></div>
                  <div><div style={S.label}>Montant</div><input type="number" value={payoutFormData.amount} onChange={e => setPayoutFormData(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={{ ...S.input, background: 'var(--surface2)' }} /></div>
                </div>
                <div style={{ marginBottom: '10px' }}><div style={S.label}>Note</div><input value={payoutFormData.note} onChange={e => setPayoutFormData(p => ({ ...p, note: e.target.value }))} placeholder="ex: 1er payout compte 50k..." style={{ ...S.input, background: 'var(--surface2)' }} /></div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setPayoutForm(false)} style={S.btnGhost}>Annuler</button>
                  <button onClick={savePayout} style={S.btnPrimary}>OK</button>
                </div>
              </div>
            )}

            {(currentAcctInfo.acct.payouts || []).length > 0 && (
              <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--surface3)', borderRadius: 'var(--radius)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Total payouts</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--green)' }}>{fmtE(totalPayoutsEUR(currentAcctInfo.acct))}</span>
              </div>
            )}

            {(currentAcctInfo.acct.payouts || []).slice().sort((a, b) => b.date.localeCompare(a.date)).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius)', marginBottom: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', fontSize: '13px' }}>Payout — {p.date}</div>
                  {p.note && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{p.note}</div>}
                </div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--green)' }}>+{fmtE(toEUR(p.amount, currentAcctInfo.acct.currency, rates))}</div>
                <button onClick={() => deletePayout(p.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px', fontSize: '14px' }}>✕</button>
              </div>
            ))}

            {!(currentAcctInfo.acct.payouts || []).length && !payoutForm && (
              <div style={{ color: 'var(--text3)', fontSize: '13px', padding: '12px 0' }}>Aucun payout enregistré pour ce compte.</div>
            )}

            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '0.5px solid var(--border)' }}>
              <button onClick={() => deleteAccount(currentAcctInfo.acct.id)} style={{ background: 'var(--red-bg)', color: 'var(--red-text)', border: '0.5px solid var(--red-bg)', padding: '8px 16px', borderRadius: 'var(--radius)', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
                Supprimer ce compte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'var(--surface3)', color: 'var(--text)', border: '0.5px solid var(--border2)', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
