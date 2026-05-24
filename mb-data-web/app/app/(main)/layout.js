'use client'
// app/app/layout.js — Shared shell for all /app/* pages.
// Handles: auth, firms/accounts/payouts loading, sidebar, topbar, modals/drawers, toast.
// Children (route pages) consume shared state via AppContext.

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import AuthPage from '../../../components/AuthPage'
import { PROPFIRM_RULES, FIRM_COLORS, MONTHS_FR, MONTHS_FULL, FIRM_SUGGESTIONS, FIRM_SUGGESTION_COLORS, STATUS_COLORS, PX_FIRMS, plansForFirm, accountLabel, defaultDdType, defaultPayoutTarget, defaultMinTradingDays, defaultChallengePrice, defaultMinDailyProfit, defaultProfitSplit as defaultProfitSplitFromRules } from '../../../lib/constants'
import AppSidebar from '../../../components/AppSidebar'
import QLogoIcon from '../../../components/QLogoIcon'
import CertificatesModal from '../../../components/CertificatesModal'
import OnboardingModal from '../../../components/OnboardingModal'
import Skeleton from '../../../components/Skeleton'
import Tooltip, { TooltipIcon } from '../../../components/Tooltip'
import AnnouncementBanner from '../../../components/AnnouncementBanner'
import Tutorial from '../../../components/Tutorial'
import SpaceBackground from '../../../components/dashboard/SpaceBackground'
import ProfileModal from '../../../components/ProfileModal'
import { FIRM_LOGOS, getFirmLogo } from '../../../lib/firmLogos'
import { useT } from '../../../components/LanguageProvider'
import { AppContext } from './AppContext'

// ── Helpers ──

function suggestProfitSplit(firmName, plan) {
  const raw = defaultProfitSplitFromRules(firmName, plan)
  if (!raw) return 90
  if (raw >= 95) return 100
  if (raw >= 85) return 90
  if (raw >= 75) return 80
  return 70
}

function toEUR(amount, cur, rates) { return amount * (rates[cur] || 1) }
function fmtE(val, dec = 2) { return val.toFixed(dec) + ' €' }
function fmtENet(val, dec = 2) { return (val >= 0 ? '+' : '') + val.toFixed(dec) + ' €' }

function calendarMonthsCount(buyDate, now) {
  const yearsDiff = now.getFullYear() - buyDate.getFullYear()
  const monthsDiff = now.getMonth() - buyDate.getMonth()
  let anniversaries = yearsDiff * 12 + monthsDiff
  if (now.getDate() < buyDate.getDate()) anniversaries -= 1
  return Math.max(1, anniversaries + 1)
}

function generateAccountNames(baseName, quantity) {
  const qty = Math.max(1, parseInt(quantity, 10) || 1)
  const trimmed = (baseName || '').trim()
  if (!trimmed) return Array(qty).fill('')
  const match = trimmed.match(/^(.*-)(\d+)$/)
  if (match) {
    const prefix = match[1]
    const startNum = parseInt(match[2], 10)
    const padWidth = match[2].length
    return Array.from({ length: qty }, (_, i) =>
      prefix + String(startNum + i).padStart(padWidth, '0')
    )
  }
  return Array.from({ length: qty }, (_, i) =>
    `${trimmed}-${String(i + 1).padStart(3, '0')}`
  )
}

const FAIL_MESSAGES = [
  "📚 Chaque échec est une leçon qu’aucun cours ni mentor ne pourrait t’enseigner. Encaisse, analyse, recommence.",
  "🌱 Les meilleurs traders ont blown plus de comptes que tu ne penses. Tu rejoins un club très fréquenté.",
  "💪 Un blow ne veut pas dire défaite — c’est juste un rappel que le marché ne te doit rien.",
  "🎯 Garde le focus sur ton edge, pas sur ton P&L. La discipline finit toujours par payer.",
  "🧠 Un trader qui échoue et apprend bat 10 traders qui gagnent par chance. Ne lâche pas.",
  "🚀 Recommence avec un meilleur plan, une meilleure taille de position, et un meilleur état d’esprit.",
  "📖 Ouvre ton journal, identifie LE pattern qui t’a coûté ce compte. Une chose à la fois.",
  "⚡ Le marché paiera ceux qui restent debout après être tombés. Lève-toi.",
  "🎓 Les meilleures décisions naissent souvent après les pires erreurs. Profite du recul.",
  "🌊 Une mauvaise journée ne définit pas une carrière. Recharge, replan, reviens.",
  "🔥 La cendre est le meilleur engrais. Reconstruis avec plus de patience cette fois.",
  "⏳ Pas de pression. Re-test ta stratégie en sim avant de retenter le challenge.",
  "🏔️ Le sommet n’a jamais été atteint en ligne droite. Réajuste ta route.",
  "💎 La pression du challenge a peut-être révélé un blind spot précieux. C’est de l’or pour la suite.",
  "🎪 Parfois le marché te fait passer pour un clown. Ça arrive à tout le monde. Demain est un autre jour.",
  "♟️ Les échecs ne sont pas l’opposé du succès, ils en sont une étape obligatoire.",
  "🛠️ Un trader pro perd. Un trader pro PERSISTE. C’est la seule vraie différence.",
  "🌅 Tu as encaissé. Maintenant, repos. Demain tu reviens plus fort.",
  "💭 « Je n’ai pas échoué. J’ai juste trouvé 10 000 façons qui ne marchent pas. » — Edison (presque).",
  "🎬 Chaque grand trader a son histoire de comeback. C’est peut-être ton chapitre 1.",
  "🪞 Le marché est le miroir le plus honnête qui soit. Ce qu’il te montre aujourd’hui, transforme-le en force.",
  "🧘 Respire. Ce n’est ni la fin du trading, ni la fin du monde. Juste une page qui se tourne.",
]

const cardS = { background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)' }

// ── Styles (shared S object, also exposed via context) ──
const S = {
  card: { background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', boxShadow: '0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px rgba(0,0,0,0.15)' },
  input: { width: '100%', padding: '10px 12px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', color: 'var(--text)', outline: 'none', transition: 'border-color 0.2s, background 0.2s', fontFamily: 'inherit' },
  label: { fontSize: '10.5px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.7px', display: 'block', marginBottom: '6px' },
  btnPrimary: { padding: '9px 18px', fontSize: '12.5px', fontWeight: '500', background: 'var(--text)', color: '#0a0c10', border: '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.005em', boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)', transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s' },
  btnGhost: { padding: '8px 14px', fontSize: '12px', fontWeight: '500', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.10)', color: 'var(--text2)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.005em', transition: 'color 0.2s, border-color 0.2s, background 0.2s' },
  badge: (status) => ({ display: 'inline-block', fontSize: '10.5px', fontWeight: '600', padding: '3px 9px', borderRadius: '99px', letterSpacing: '0.3px', background: status === 'Financé' ? 'var(--green-bg)' : status === 'Challenge' ? 'var(--amber-bg)' : 'var(--red-bg)', color: status === 'Financé' ? 'var(--green-text)' : status === 'Challenge' ? 'var(--amber-text)' : 'var(--red-text)' })
}

export default function AppLayout({ children }) {
  const t = useT()
  const pathname = usePathname()
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [firms, setFirms] = useState([])
  const [rates, setRates] = useState({ USD: 0.9259, GBP: 1.163, CHF: 1.032, EUR: 1 })
  const [rateInfo, setRateInfo] = useState('Chargement...')
  const [currency, setCurrencyMode] = useState('native')
  const [searchQ, setSearchQ] = useState('')
  const [toast, setToast] = useState('')
  const [firmModal, setFirmModal] = useState(false)
  const [acctModal, setAcctModal] = useState(null)
  const [firmDrawer, setFirmDrawer] = useState(null)
  const [certsFirm, setCertsFirm] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tradesCount, setTradesCount] = useState(0)
  const [acctDrawer, setAcctDrawer] = useState(null)
  const [payoutForm, setPayoutForm] = useState(false)
  const [profile, setProfile] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [newFirmName, setNewFirmName] = useState('')
  const [acctForm, setAcctForm] = useState({ buyDate: '', currency: 'USD', spent: '', activationFee: '', activationDate: '', status: 'Challenge', notes: '', planSize: '50k', name: '', ddType: 'static', payoutTarget: '', minTradingDays: '', minDailyProfit: '', profitSplit: '90', paymentMode: 'monthly', quantity: '1' })
  const [payoutFD, setPayoutFD] = useState({ date: '', amount: '', note: '' })
  const [promoteModal, setPromoteModal] = useState(null)
  const [promoteForm, setPromoteForm] = useState({ activationDate: '', activationFee: '', payoutTarget: '', minTradingDays: '', minDailyProfit: '', profitSplit: '90', newName: '' })
  const [failModal, setFailModal] = useState(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Derive currentPage from pathname for sidebar highlight
  const currentPage = (() => {
    if (pathname === '/app' || pathname === '/app/dashboard') return 'dashboard'
    const segment = pathname.replace('/app/', '').split('/')[0]
    return segment || 'dashboard'
  })()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { if (user) { loadFirms(); fetchRates(); loadProfile() } }, [user])

  useEffect(() => {
    if (!user || loading) return
    if (typeof window === 'undefined') return
    const dismissed = localStorage.getItem('quantara_onboarding_dismissed') === '1'
    if (!dismissed && firms.length === 0) {
      const t = setTimeout(() => setShowOnboarding(true), 600)
      return () => clearTimeout(t)
    }
  }, [user, loading, firms.length])

  async function loadProfile() {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .select('username,display_name,avatar_url')
      .eq('user_id', user.id)
      .single()
    if (error && error.code !== 'PGRST116') console.warn('[profile load]', error)
    setProfile(data || { username: null, display_name: null, avatar_url: null })
  }

  async function fetchRates() {
    try {
      const r = await fetch('https://api.exchangerate-api.com/v4/latest/EUR')
      const d = await r.json()
      const nr = { EUR: 1, USD: 1 / d.rates.USD, GBP: 1 / d.rates.GBP, CHF: 1 / d.rates.CHF }
      setRates(nr)
      const ts = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      setRateInfo(`1 USD ≈ ${nr.USD.toFixed(4)} EUR · 1 GBP ≈ ${nr.GBP.toFixed(4)} EUR — ${ts}`)
    } catch { setRateInfo('Taux hors ligne · 1 USD ≈ 0.9259 €') }
  }

  async function loadFirms() {
    if (!user) return
    const { data: fd } = await supabase.from('firms').select('*').eq('user_id', user.id).order('created_at')
    if (!fd) return
    let { data: ad } = await supabase.from('accounts').select('*').eq('user_id', user.id).order('buy_date')

    const now = new Date()
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const billingResults = await Promise.all(
      (ad || [])
        .filter(a => a.status === 'Challenge' && a.payment_mode === 'monthly' && a.buy_date)
        .map(async a => {
          const lastCheck = a.last_bill_check_at ? new Date(a.last_bill_check_at) : null
          if (lastCheck && lastCheck > fiveMinAgo) return false
          const expectedMonths = calendarMonthsCount(new Date(a.buy_date), now)
          const currentMonths = a.months_count || 1
          if (expectedMonths <= currentMonths) return false
          const { error } = await supabase
            .from('accounts')
            .update({ months_count: expectedMonths, last_bill_check_at: now.toISOString() })
            .eq('id', a.id)
            .lt('months_count', expectedMonths)
          return !error
        })
    )
    const billedAny = billingResults.some(r => r === true)
    if (billedAny) {
      const refetch = await supabase.from('accounts').select('*').eq('user_id', user.id).order('buy_date')
      if (refetch.data) ad = refetch.data
    }

    const { data: pd } = await supabase.from('payouts').select('*').eq('user_id', user.id).order('date')
    setFirms(fd.map((f, i) => ({ ...f, color: f.color || FIRM_COLORS[i % FIRM_COLORS.length], accounts: (ad || []).filter(a => a.firm_id === f.id).map(a => ({ ...a, payouts: (pd || []).filter(p => p.account_id === a.id) })) })))
    try {
      const { count: tc } = await supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      setTradesCount(tc || 0)
    } catch {}
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2200) }
  async function signOut() { await supabase.auth.signOut(); setUser(null); setFirms([]) }

  async function createFirm() {
    if (!newFirmName.trim()) { showToast('Nom requis'); return }
    const color = FIRM_COLORS[firms.length % FIRM_COLORS.length]
    const { data } = await supabase.from('firms').insert({ name: newFirmName.trim(), color, user_id: user.id }).select().single()
    setFirmModal(false); setNewFirmName('')
    await loadFirms(); showToast('PropFirm ajoutée ✓')
    setAcctModal({ firmId: data.id })
    { const tg = defaultPayoutTarget(data.name, '50k'); const md = defaultMinTradingDays(data.name, '50k'); const pr = defaultChallengePrice(data.name, '50k'); const mdp = defaultMinDailyProfit(data.name, '50k'); const ps = suggestProfitSplit(data.name, '50k'); setAcctForm({ buyDate: new Date().toISOString().slice(0, 10), currency: 'USD', spent: pr !== null ? String(pr) : '', activationFee: '', activationDate: '', status: 'Challenge', notes: '', planSize: '50k', name: '', ddType: defaultDdType(data.name), payoutTarget: tg !== null ? String(tg) : '', minTradingDays: md !== null ? String(md) : '', minDailyProfit: mdp !== null ? String(mdp) : '', profitSplit: String(ps), paymentMode: 'monthly', quantity: '1' }) }
  }

  async function deleteFirm(firmId) {
    if (!confirm('Supprimer cette firme ?')) return
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

  async function renameAccount(acctId, currentName, buyDate) {
    const placeholder = currentName || ''
    const name = prompt(`Nom du compte (laisser vide pour "Compte du ${buyDate}") :`, placeholder)
    if (name === null) return
    const { error } = await supabase.from('accounts').update({ name: name.trim() }).eq('id', acctId)
    if (error) { showToast('Erreur : ' + (error.message || 'inconnue')); return }
    await loadFirms()
    showToast(name.trim() ? `Renommé en "${name.trim()}" ✓` : 'Nom effacé ✓')
  }

  async function saveAccount() {
    const { firmId, acct } = acctModal
    if (!acctForm.buyDate) { showToast('Date requise'); return }
    const isOneTime = acctForm.paymentMode === 'onetime'
    const quantity = acct ? 1 : Math.max(1, parseInt(acctForm.quantity, 10) || 1)
    const basePayload = { firm_id: firmId, user_id: user.id, buy_date: acctForm.buyDate, currency: acctForm.currency, spent: parseFloat(acctForm.spent) || 0, activation_fee: isOneTime ? 0 : (parseFloat(acctForm.activationFee) || 0), activation_date: acctForm.activationDate || null, status: acctForm.status, notes: acctForm.notes, plan_size: acctForm.planSize || '50k', dd_type: acctForm.ddType || 'static', payout_target: acctForm.payoutTarget ? parseFloat(acctForm.payoutTarget) : null, min_trading_days: acctForm.minTradingDays ? parseInt(acctForm.minTradingDays, 10) : null, min_daily_profit: acctForm.minDailyProfit ? parseFloat(acctForm.minDailyProfit) : null, profit_split: acctForm.profitSplit ? parseInt(acctForm.profitSplit, 10) : 90, payment_mode: acctForm.paymentMode || 'monthly' }
    let autoReset = false
    if (acctForm.status === 'Financé') {
      const wasFinanced = acct?.status === 'Financé'
      const alreadyHasResetDate = !!acct?.funded_date
      if (!wasFinanced && !alreadyHasResetDate) {
        basePayload.funded_date = acctForm.activationDate || new Date().toISOString().slice(0, 10)
        autoReset = true
      }
    }
    if (acct) {
      await supabase.from('accounts').update({ ...basePayload, name: (acctForm.name || '').trim() }).eq('id', acct.id)
    } else if (quantity > 1) {
      const names = generateAccountNames(acctForm.name, quantity)
      const payloads = names.map(n => ({ ...basePayload, name: n }))
      await supabase.from('accounts').insert(payloads)
    } else {
      await supabase.from('accounts').insert({ ...basePayload, name: (acctForm.name || '').trim() })
    }
    setAcctModal(null); await loadFirms()
    showToast(
      quantity > 1
        ? `${quantity} comptes créés ✓`
        : autoReset
          ? `Passage en Financé · balance reset au ${basePayload.funded_date} ✓`
          : (acct ? 'Compte modifié ✓' : 'Compte ajouté ✓')
    )
  }

  async function deleteAccount(acctId) {
    if (!confirm('Supprimer ce compte ?')) return
    await supabase.from('accounts').delete().eq('id', acctId)
    setAcctDrawer(null); await loadFirms(); showToast('Compte supprimé')
  }

  async function savePayout() {
    if (!payoutFD.date || !payoutFD.amount) { showToast('Date et montant requis'); return }
    const acctForSave = firms.find(f => f.id === acctDrawer.firmId)?.accounts.find(a => a.id === acctDrawer.acctId)
    const firmForSave = firms.find(f => f.id === acctDrawer.firmId)
    const splitPct = acctForSave?.profit_split || suggestProfitSplit(firmForSave?.name, acctForSave?.plan_size) || 90
    const brut = parseFloat(payoutFD.amount) || 0
    const net = +(brut * (splitPct / 100)).toFixed(2)
    await supabase.from('payouts').insert({ account_id: acctDrawer.acctId, user_id: user.id, date: payoutFD.date, amount: net, note: payoutFD.note })
    setPayoutForm(false); setPayoutFD({ date: '', amount: '', note: '' })
    await loadFirms(); showToast('Payout ajouté ✓')
  }

  function openPromoteModal(firm, acct) {
    const tg = defaultPayoutTarget(firm?.name, acct?.plan_size)
    const md = defaultMinTradingDays(firm?.name, acct?.plan_size)
    const mdp = defaultMinDailyProfit(firm?.name, acct?.plan_size)
    const ps = suggestProfitSplit(firm?.name, acct?.plan_size)
    setPromoteForm({
      activationDate: new Date().toISOString().slice(0, 10),
      activationFee: '',
      payoutTarget: tg !== null ? String(tg) : '',
      minTradingDays: md !== null ? String(md) : '',
      minDailyProfit: mdp !== null ? String(mdp) : '',
      profitSplit: String(ps),
      newName: acct.name || '',
    })
    setPromoteModal({ firmId: firm.id, acctId: acct.id })
  }

  async function savePromote() {
    if (!promoteModal) return
    const firm = firms.find(f => f.id === promoteModal.firmId)
    const acct = firm?.accounts.find(a => a.id === promoteModal.acctId)
    if (!acct || !firm) { showToast('Compte introuvable'); return }
    const isOneTime = acct.payment_mode === 'onetime'
    const fundedDate = promoteForm.activationDate || new Date().toISOString().slice(0, 10)
    const payload = {
      status: 'Financé',
      activation_date: fundedDate,
      activation_fee: isOneTime ? 0 : (parseFloat(promoteForm.activationFee) || 0),
      payout_target: promoteForm.payoutTarget ? parseFloat(promoteForm.payoutTarget) : null,
      min_trading_days: promoteForm.minTradingDays ? parseInt(promoteForm.minTradingDays, 10) : null,
      min_daily_profit: promoteForm.minDailyProfit ? parseFloat(promoteForm.minDailyProfit) : null,
      profit_split: promoteForm.profitSplit ? parseInt(promoteForm.profitSplit, 10) : 90,
      funded_date: fundedDate,
      name: (promoteForm.newName || '').trim(),
    }
    const { error } = await supabase.from('accounts').update(payload).eq('id', acct.id)
    if (error) { showToast('Erreur : ' + (error.message || 'inconnue')); return }
    setPromoteModal(null)
    await loadFirms()
    showToast('🎉 Compte passé en Financé ! Bravo !')
  }

  function openFailModal(firm, acct) {
    const msg = FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)]
    setFailModal({ firmId: firm.id, acctId: acct.id, message: msg })
  }

  async function confirmFail() {
    if (!failModal) return
    const { error } = await supabase.from('accounts').update({ status: 'Échoué' }).eq('id', failModal.acctId)
    if (error) { showToast('Erreur : ' + (error.message || 'inconnue')); return }
    setFailModal(null)
    await loadFirms()
    showToast('Tête haute, prochaine sera la bonne 💪')
  }

  async function deletePayout(payoutId) {
    if (!confirm('Supprimer ?')) return
    await supabase.from('payouts').delete().eq('id', payoutId)
    await loadFirms(); showToast('Payout supprimé')
  }

  // ── Computed values ──
  function totalPayoutsEUR(acct) { return (acct.payouts || []).reduce((s, p) => s + toEUR(p.amount, acct.currency, rates), 0) }
  function totalSpentForAccount(acct) {
    const months = acct.months_count || 1
    const recurring = (parseFloat(acct.spent) || 0) * months
    return toEUR(recurring, acct.currency, rates) + toEUR(acct.activation_fee || 0, acct.currency, rates)
  }
  function firmTotalSpent(firm) { return (firm.accounts || []).reduce((s, a) => s + totalSpentForAccount(a), 0) }
  function firmTotalPayouts(firm) { return (firm.accounts || []).reduce((s, a) => s + totalPayoutsEUR(a), 0) }
  function allAccounts() { return firms.flatMap(f => (f.accounts || []).map(a => ({ ...a, firmName: f.name, firmColor: f.color }))) }
  function fmtMoney(eurVal, dec = 2) {
    if (currency === 'eur') return fmtE(eurVal, dec)
    return (eurVal / rates.USD).toFixed(dec) + ' $'
  }
  function fmtMoneyNet(eurVal, dec = 2) {
    if (currency === 'eur') return fmtENet(eurVal, dec)
    return (eurVal >= 0 ? '+' : '') + (eurVal / rates.USD).toFixed(dec) + ' $'
  }

  function exportCSV() {
    const rows = [['Firme', 'Date achat', 'Devise', 'Dépensé', 'Frais activation', 'Date payout', 'Montant EUR', 'Statut', 'Notes']]
    firms.forEach(f => {
      ;(f.accounts || []).forEach(a => {
        if (!(a.payouts || []).length) rows.push([f.name, a.buy_date, a.currency, a.spent, a.activation_fee || 0, '', '', a.status, a.notes || ''])
        else (a.payouts || []).forEach(p => rows.push([f.name, a.buy_date, a.currency, a.spent, a.activation_fee || 0, p.date, toEUR(p.amount, a.currency, rates).toFixed(2), a.status, p.note || a.notes || '']))
      })
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `Quantara_PropFirm_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); showToast('Export CSV ✓')
  }

  // ── Guards ──
  if (loading) return <Skeleton.AppShell />
  if (!user) return <AuthPage onAuth={u => setUser(u)} />

  const currentFirm = firms.find(f => f.id === firmDrawer)
  const currentAcct = acctDrawer ? firms.find(f => f.id === acctDrawer.firmId)?.accounts?.find(a => a.id === acctDrawer.acctId) : null
  const currentAcctFirm = acctDrawer ? firms.find(f => f.id === acctDrawer.firmId) : null

  const accts = allAccounts()
  const totalSpentEUR = accts.reduce((s, a) => s + totalSpentForAccount(a), 0)
  const totalPayoutsEUR2 = accts.reduce((s, a) => s + totalPayoutsEUR(a), 0)
  const totalNet = totalPayoutsEUR2 - totalSpentEUR
  const totalPayoutCount = accts.reduce((s, a) => s + (a.payouts || []).length, 0)

  // Alerts (for badge + alerts page)
  const alerts = []
  const upcomingBills = []
  firms.forEach(f => {
    ;(f.accounts || []).forEach(a => {
      const tp = totalPayoutsEUR(a), sp = totalSpentForAccount(a)
      if (a.status === 'Financé' && (a.payouts || []).length === 0) alerts.push({ icon: '💰', title: `Payout disponible — ${f.name}`, sub: 'Compte financé sans payout', type: 'success' })
      if (a.status === 'Challenge') {
        const days = Math.floor((new Date() - new Date(a.buy_date + 'T00:00:00')) / 86400000)
        if (days > 30) alerts.push({ icon: '⏰', title: `Challenge depuis ${days} jours — ${f.name}`, sub: 'Vérifiez votre progression', type: 'warn' })
        if (a.payment_mode === 'monthly' && a.buy_date) {
          const buyD = new Date(a.buy_date + 'T00:00:00Z')
          const nextB = new Date(buyD); nextB.setUTCDate(buyD.getUTCDate() + (a.months_count || 1) * 30); nextB.setUTCHours(0, 0, 0, 0)
          const todayMid = new Date(); todayMid.setUTCHours(0, 0, 0, 0)
          const dLeft = Math.round((nextB - todayMid) / 86400000)
          const acctName = a.name || `Compte du ${a.buy_date}`
          const sym = a.currency === 'EUR' ? '€' : a.currency === 'GBP' ? '£' : '$'
          const dStr = nextB.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
          const cost = Number(a.spent) || 0
          if (dLeft === 0) {
            alerts.push({ icon: '🚨', title: `Paiement mensuel AUJOURD'HUI — ${f.name} · ${acctName}`, sub: `Prélèvement de ${cost} ${sym} prévu dans la journée`, type: 'warn' })
          } else if (dLeft > 0 && dLeft <= 2) {
            alerts.push({ icon: '📅', title: `Paiement mensuel imminent — ${f.name} · ${acctName}`, sub: `Prochain prélèvement ${dLeft === 1 ? 'demain' : `dans ${dLeft} jours`} (${dStr}) · ${cost} ${sym}`, type: 'warn' })
          }
          if (dLeft >= 0 && dLeft <= 30) {
            upcomingBills.push({ date: nextB, dateStr: dStr, daysLeft: dLeft, firm: f.name, firmColor: f.color, account: acctName, cost, sym })
          }
        }
      }
      if (tp > sp * 2) alerts.push({ icon: '🏆', title: `Excellent ROI — ${f.name}`, sub: `${(tp / sp).toFixed(1)}x votre investissement`, type: 'success' })
    })
  })
  upcomingBills.sort((a, b) => a.date - b.date)
  if (!alerts.length && firms.length) alerts.push({ icon: '✅', title: 'Tout est en ordre', sub: 'Aucune alerte pour le moment.', type: 'ok' })

  const alertsBadgeCount = alerts.filter(a => a.type !== 'ok').length

  // ── Context value ──
  const contextValue = {
    user, firms, rates, profile, toast, showToast, reload: loadFirms, getFirmLogo,
    currency, setCurrencyMode, searchQ, setSearchQ, rateInfo,
    // Helpers
    toEUR, fmtE, fmtENet, fmtMoney, fmtMoneyNet,
    totalPayoutsEUR, totalSpentForAccount, firmTotalSpent, firmTotalPayouts, allAccounts,
    // Computed
    accts, totalSpentEUR, totalPayoutsEUR2, totalNet, totalPayoutCount,
    alerts, upcomingBills, alertsBadgeCount,
    // Styles
    S, cardS,
    // Modals / drawers
    firmModal, setFirmModal, acctModal, setAcctModal,
    firmDrawer, setFirmDrawer, acctDrawer, setAcctDrawer,
    certsFirm, setCertsFirm,
    payoutForm, setPayoutForm, payoutFD, setPayoutFD,
    newFirmName, setNewFirmName, acctForm, setAcctForm,
    promoteModal, setPromoteModal, promoteForm, setPromoteForm,
    failModal, setFailModal,
    // CRUD
    createFirm, deleteFirm, renameFirm, renameAccount,
    saveAccount, deleteAccount, savePayout, deletePayout,
    openPromoteModal, savePromote, openFailModal, confirmFail,
    exportCSV,
    // Tutorial / onboarding
    tradesCount, showTutorial, setShowTutorial,
    // Navigation helper (for pages that need to navigate programmatically)
    navigateTo: (page) => router.push(`/app/${page}`),
    // Constants re-exported for convenience
    MONTHS_FR, MONTHS_FULL, STATUS_COLORS, FIRM_SUGGESTIONS, FIRM_SUGGESTION_COLORS,
    plansForFirm, accountLabel, defaultDdType, defaultPayoutTarget, defaultMinTradingDays,
    defaultChallengePrice, defaultMinDailyProfit, suggestProfitSplit,
    generateAccountNames,
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
        <SpaceBackground />
        <div style={{ height: '2px', background: 'linear-gradient(90deg,var(--blue) 0%,transparent 100%)', position: 'relative', zIndex: 1 }} />
        <AnnouncementBanner />
        <div className="top-bar" style={{ height: '52px', background: 'rgba(13,15,20,0.78)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button className="nav-burger" aria-label={t('app.topbar.menu')} onClick={() => setMobileNavOpen(o => !o)}>&#x2630;</button>
            <QLogoIcon size={44} color="#4d8fff" />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <div style={{ fontWeight: '700', fontSize: '14px', letterSpacing: '0.14em', color: 'var(--text)' }}>QUANTARA</div>
              <span className="top-bar-brand-sub" style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.18em' }}>TRACK &middot; ANALYZE &middot; GROW</span>
            </div>
          </div>
          <div className="top-bar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={exportCSV} style={{ ...S.btnGhost, fontSize: '12px', padding: '7px 14px' }}>{t('app.topbar.csvExport')}</button>
            <button onClick={signOut} style={{ ...S.btnGhost, fontSize: '12px', padding: '7px 14px' }}>{t('app.topbar.logout')}</button>
          </div>
        </div>

        <div style={{ display: 'flex', minHeight: 'calc(100vh - 50px)' }}>
          <AppSidebar
            user={user}
            profile={profile}
            alertsBadgeCount={alertsBadgeCount}
            currentPage={currentPage}
            currentHref={pathname}
            onAfterNav={() => setMobileNavOpen(false)}
            onShowProfile={() => setShowProfileModal(true)}
            onShowTutorial={() => setShowTutorial(true)}
            showLaunchTutorial={true}
            showProfileLink={true}
            isOpenMobile={mobileNavOpen}
          />
          {mobileNavOpen && <div className="nav-backdrop" onClick={() => setMobileNavOpen(false)} />}

          <div style={{ flex: 1, overflow: 'auto' }}>
            {children}
          </div>
        </div>

        {/* ── Firm Modal ── */}
        {firmModal && (
          <div
            onClick={() => setFirmModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', overflowY: 'auto' }}
          >
            <div
              className="modal"
              onClick={e => e.stopPropagation()}
              style={{ ...S.card, padding: '28px', width: '600px', maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
            >
              <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '6px' }}>Ajouter une PropFirm</h3>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '20px' }}>
                Choisis dans la liste ou tape un nom personnalisé.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginBottom: '18px' }}>
                {FIRM_SUGGESTIONS.map(s => {
                  const isSelected = newFirmName === s
                  const color = FIRM_SUGGESTION_COLORS[s] || '#4d8fff'
                  return (
                    <button type="button" key={s} onClick={() => setNewFirmName(s)} title={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '14px 8px', borderRadius: '10px', background: isSelected ? 'rgba(45,111,255,0.12)' : 'var(--surface2)', border: `1px solid ${isSelected ? 'var(--blue-light)' : 'var(--border2)'}`, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', position: 'relative' }} onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--blue-light)'; e.currentTarget.style.background = 'var(--surface3)' } }} onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)' } }}>
                      {getFirmLogo(s, color, 38)}
                      <div style={{ fontSize: '11px', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--blue-light)' : 'var(--text2)', textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{s}</div>
                      {isSelected && (<div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 99, background: 'var(--blue-light)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{'✓'}</div>)}
                    </button>
                  )
                })}
                {(() => {
                  const isCustom = newFirmName && !FIRM_SUGGESTIONS.includes(newFirmName)
                  return (
                    <button type="button" onClick={() => { const input = document.getElementById('firm-custom-input'); if (input) input.focus() }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '14px 8px', borderRadius: '10px', background: isCustom ? 'rgba(167,139,250,0.12)' : 'var(--surface2)', border: `1px dashed ${isCustom ? '#a78bfa' : 'var(--border2)'}`, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#a78bfa', fontWeight: 700 }}>+</div>
                      <div style={{ fontSize: '11px', fontWeight: isCustom ? 700 : 500, color: isCustom ? '#a78bfa' : 'var(--text2)', textAlign: 'center', lineHeight: 1.2 }}>Autre</div>
                    </button>
                  )
                })()}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={S.label}>
                  Nom de la firme
                  {newFirmName && !FIRM_SUGGESTIONS.includes(newFirmName) && (
                    <span style={{ marginLeft: 8, fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>CUSTOM</span>
                  )}
                </label>
                <input id="firm-custom-input" value={newFirmName} onChange={e => setNewFirmName(e.target.value)} placeholder="Tape un nom personnalisé ou clique une carte ci-dessus" style={S.input} onKeyDown={e => e.key === 'Enter' && createFirm()} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setFirmModal(false)} style={S.btnGhost}>Annuler</button>
                <button onClick={createFirm} style={S.btnPrimary} disabled={!newFirmName.trim()}>Créer &amp; Ajouter un compte</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Account Modal ── */}
        {acctModal&&<div onClick={()=>setAcctModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:'12px',overflowY:'auto'}}><div className="modal" onClick={e=>e.stopPropagation()} style={{...S.card,padding:'28px',width:'440px',maxWidth:'100%',boxShadow:'0 24px 64px rgba(0,0,0,0.5)'}}><h3 style={{fontSize:'17px',fontWeight:'600',marginBottom:'20px'}}>{acctModal.acct?'Modifier le compte':`Nouveau compte — ${firms.find(f=>f.id===acctModal.firmId)?.name}`}</h3><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}><div><label style={S.label}>Date d&apos;achat</label><input type="date" value={acctForm.buyDate} onChange={e=>setAcctForm(p=>({...p,buyDate:e.target.value}))} style={S.input} /></div><div><label style={S.label}>Devise</label><select value={acctForm.currency} onChange={e=>setAcctForm(p=>({...p,currency:e.target.value}))} style={S.input}><option>USD</option><option>EUR</option><option>GBP</option><option>CHF</option></select></div><div><label style={S.label}>Plan / Taille du compte</label><select value={acctForm.planSize} onChange={e=>{const newPlan=e.target.value;const firmName=firms.find(f=>f.id===acctModal.firmId)?.name;const tg=defaultPayoutTarget(firmName,newPlan);const md=defaultMinTradingDays(firmName,newPlan);const pr=defaultChallengePrice(firmName,newPlan);const mdp=defaultMinDailyProfit(firmName,newPlan);const ps=suggestProfitSplit(firmName,newPlan);setAcctForm(p=>({...p,planSize:newPlan,payoutTarget:tg!==null?String(tg):p.payoutTarget,minTradingDays:md!==null?String(md):p.minTradingDays,spent:pr!==null?String(pr):p.spent,minDailyProfit:mdp!==null?String(mdp):p.minDailyProfit,profitSplit:String(ps)}))}} style={S.input}>{plansForFirm(firms.find(f=>f.id===acctModal.firmId)?.name).map(p=><option key={p} value={p}>{p.toUpperCase()}</option>)}</select></div><div style={{gridColumn:'1/-1'}}><label style={S.label}>Mode de paiement du challenge<TooltipIcon text="Mensuel : abonnement moins cher MAIS frais d’activation à payer au passage en Financé. One-time : prix plus élevé en une seule fois, sans frais d’activation par la suite. Affecte le calcul du coût total du compte." maxWidth={360} /></label><div style={{display:'flex',gap:'4px',background:'var(--surface3)',borderRadius:'var(--radius)',padding:'4px'}}>{[{v:'monthly',l:'📅 Mensuel',d:'+ frais activation'},{v:'onetime',l:'💎 One-time',d:'sans frais activation'}].map(opt=>(<button key={opt.v} type="button" onClick={()=>setAcctForm(p=>({...p,paymentMode:opt.v,activationFee:opt.v==='onetime'?'':p.activationFee}))} style={{flex:1,padding:'10px 12px',fontSize:'12px',fontWeight:'600',background:acctForm.paymentMode===opt.v?'var(--blue)':'transparent',color:acctForm.paymentMode===opt.v?'#fff':'var(--text2)',border:'none',borderRadius:'6px',cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}><span>{opt.l}</span><span style={{fontSize:'10px',opacity:0.75,fontWeight:'500'}}>{opt.d}</span></button>))}</div></div><div><label style={S.label}>{acctForm.paymentMode==='onetime'?'Prix one-time ($)':'Prix mensuel ($)'}<TooltipIcon text={acctForm.paymentMode==='onetime'?"Le montant complet payé en une seule fois pour ce challenge.":"Le montant facturé CHAQUE MOIS tant que le challenge n’est pas validé. Quantara accumule automatiquement les mensualités au fil du temps."} maxWidth={320} /></label><input type="number" value={acctForm.spent} onChange={e=>setAcctForm(p=>({...p,spent:e.target.value}))} placeholder="0.00" style={S.input} /></div><div style={{gridColumn:'1/-1'}}><label style={S.label}>Statut</label><select value={acctForm.status} onChange={e=>setAcctForm(p=>({...p,status:e.target.value}))} style={S.input}><option>Challenge</option><option>Financé</option><option>Échoué</option></select></div>{acctForm.status==='Financé'&&<div style={{gridColumn:'1/-1',background:'rgba(29,184,122,0.07)',border:'0.5px solid var(--green)',borderRadius:'var(--radius)',padding:'12px'}}><div style={{fontSize:'11px',fontWeight:'700',color:'var(--green-text)',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{'✅'} Compte Financé</div><div style={{display:'grid',gridTemplateColumns:acctForm.paymentMode==='onetime'?'1fr':'1fr 1fr',gap:'8px'}}><div><label style={S.label}>Date d&apos;activation</label><input type="date" value={acctForm.activationDate} onChange={e=>setAcctForm(p=>({...p,activationDate:e.target.value}))} style={{...S.input,background:'var(--surface3)'}} /></div>{acctForm.paymentMode!=='onetime'&&<div><label style={S.label}>Frais d&apos;activation</label><input type="number" value={acctForm.activationFee} onChange={e=>setAcctForm(p=>({...p,activationFee:e.target.value}))} placeholder="145.00" style={{...S.input,background:'var(--surface3)'}} /></div>}</div>{acctForm.paymentMode==='onetime'&&<div style={{marginTop:'8px',fontSize:'11px',color:'var(--text3)',display:'flex',gap:'6px',alignItems:'center'}}>{'💎'} Paiement one-time {'→'} aucun frais d&apos;activation à payer.</div>}</div>}<div style={{gridColumn:'1/-1'}}>{!acctModal.acct ? (
                  <>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 130px',gap:'10px',alignItems:'end'}}>
                      <div>
                        <label style={S.label}>Nom du compte (optionnel)<TooltipIcon text="Pour les achats multiples (ex : 5 challenges Topstep d’un coup), tape ici le nom de base (ex : Test) et choisis la quantité à droite. Les comptes seront auto-numérotés (Test-001, Test-002...). Si tu mets déjà un suffixe -NNN (ex : Pro-005), l’incrément démarre à partir de ce numéro." maxWidth={360} /></label>
                        <input value={acctForm.name} onChange={e=>setAcctForm(p=>({...p,name:e.target.value}))} placeholder="ex : Test, Pro, Lucid principal..." style={S.input} />
                      </div>
                      <div>
                        <label style={S.label}>{'🛒'} Quantité</label>
                        <input type="number" min="1" max="50" value={acctForm.quantity} onChange={e=>setAcctForm(p=>({...p,quantity:e.target.value}))} style={{...S.input,textAlign:'center',fontWeight:700}} />
                      </div>
                    </div>
                    {(() => {
                      const qty = Math.max(1, parseInt(acctForm.quantity,10) || 1)
                      if (qty <= 1) return null
                      const names = generateAccountNames(acctForm.name, qty)
                      const preview = names.slice(0,4).map(n => n || '(sans nom)').join(', ') + (qty > 4 ? ', …' : '')
                      const totalPrice = (parseFloat(acctForm.spent)||0) * qty
                      const currencySymbol = acctForm.currency === 'EUR' ? '€' : acctForm.currency === 'GBP' ? '£' : '$'
                      return (
                        <div style={{marginTop:'8px',padding:'10px 12px',background:'rgba(45,111,255,0.08)',border:'0.5px solid rgba(45,111,255,0.3)',borderRadius:'var(--radius)',fontSize:'11px',color:'var(--text2)',lineHeight:1.55}}>
                          <div style={{fontWeight:700,color:'var(--blue-light)',marginBottom:'4px'}}>{'🛒'} {qty} comptes seront créés en bulk</div>
                          <div style={{color:'var(--text3)'}}>Noms : <strong style={{color:'var(--text2)'}}>{preview}</strong></div>
                          {totalPrice > 0 && (
                            <div style={{color:'var(--text3)',marginTop:'2px'}}>
                              {acctForm.paymentMode === 'onetime' ? '💎 One-time' : '📅 Mois 1'} {'·'} Total : <strong style={{color:'#e8504a'}}>{totalPrice.toFixed(2)} {currencySymbol}</strong> ({qty} {'×'} {acctForm.spent||0} {currencySymbol})
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  <>
                    <label style={S.label}>Nom du compte (optionnel)</label>
                    <input value={acctForm.name} onChange={e=>setAcctForm(p=>({...p,name:e.target.value}))} placeholder="ex : Lucid principal, Topstep #1, NQ scalp..." style={S.input} />
                  </>
                )}</div><div style={{gridColumn:'1/-1'}}><label style={S.label}>Type de drawdown<TooltipIcon text="3 types : Static = ligne fixe (balance initial − DD max). End of Day (EOD) = trailing basé sur la balance de FIN DE JOURNÉE (les pics intraday ne lockent pas le DD). Trailing intraday = trailing temps réel, le moindre pic intraday update le DD. La plupart des firmes utilisent EOD ou Trailing." maxWidth={360} /></label><select value={acctForm.ddType} onChange={e=>setAcctForm(p=>({...p,ddType:e.target.value}))} style={S.input}><option value="static">Static (ligne fixe : balance initial − DD max)</option><option value="eod">End of Day (trailing en fin de journée, ignore les pics intraday)</option><option value="trailing">Trailing intraday (suit le peak temps réel)</option></select></div>{acctForm.status==='Financé'&&<><div><label style={S.label}>Objectif payout ($)</label><input type="number" step="0.01" value={acctForm.payoutTarget} onChange={e=>setAcctForm(p=>({...p,payoutTarget:e.target.value}))} placeholder="ex : 53000 (= 50k + 3k profit)" style={S.input} /></div><div><label style={S.label}>Jours de trading min</label><input type="number" min="0" value={acctForm.minTradingDays} onChange={e=>setAcctForm(p=>({...p,minTradingDays:e.target.value}))} placeholder="ex : 10" style={S.input} /></div><div><label style={S.label}>Profit split<TooltipIcon text="Pourcentage du profit que TU touches lors d’un payout. Le reste va à la PropFirm. La plupart des firmes proposent 90/10 (90% trader, 10% firme), mais ça varie : Apex débute à 100/0 sur les premiers $25K, certains plans Pro de MFFU/Topstep sont 80/20. Choisis le split correspondant exactement à ton compte." maxWidth={340} /></label><select value={acctForm.profitSplit} onChange={e=>setAcctForm(p=>({...p,profitSplit:e.target.value}))} style={S.input}><option value="100">100 / 0 (tu prends tout {'—'} Apex 1ers $25K, etc.)</option><option value="90">90 / 10 (le plus courant {'—'} Topstep, Lucid, Tradeify…)</option><option value="80">80 / 20 (MFFU Core/Pro, TPT PRO…)</option><option value="70">70 / 30 (rare {'—'} plans débutants)</option></select></div><div><label style={S.label}>Profit min / jour valide ($)<TooltipIcon text="Profit minimum sur 1 journée pour qu’elle compte comme jour validé dans le décompte des jours de trading min. Ex Lucid : 150$ par jour." /></label><input type="number" min="0" step="1" value={acctForm.minDailyProfit} onChange={e=>setAcctForm(p=>({...p,minDailyProfit:e.target.value}))} placeholder="ex : 150" style={S.input} /></div></>}{acctForm.status==='Challenge'&&<div style={{gridColumn:'1/-1',padding:'12px',background:'rgba(45,111,255,0.06)',border:'0.5px solid rgba(45,111,255,0.22)',borderRadius:'var(--radius)',fontSize:'12px',color:'var(--text2)',lineHeight:1.5}}>{'💡'} Les règles funded (objectif payout, jours min, profit split, profit min/jour) seront configurées <strong>quand tu passeras en Financé</strong> via le bouton {'«'} {'🚀'} Passer en Financé {'»'} dans le drawer du compte.</div>}<div style={{gridColumn:'1/-1'}}><label style={S.label}>Notes</label><input value={acctForm.notes} onChange={e=>setAcctForm(p=>({...p,notes:e.target.value}))} placeholder="Commentaire..." style={S.input} /></div></div><div style={{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'20px'}}><button onClick={()=>setAcctModal(null)} style={S.btnGhost}>Annuler</button><button onClick={saveAccount} style={S.btnPrimary}>Enregistrer</button></div></div></div>}

        {/* ── Firm Drawer ── */}
        {firmDrawer&&currentFirm&&<div onClick={()=>setFirmDrawer(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:400,display:'flex',alignItems:'flex-start',justifyContent:'flex-end'}}><div className="drawer" onClick={e=>e.stopPropagation()} style={{width:'520px',maxWidth:'95vw',height:'100vh',background:'var(--surface)',borderLeft:'0.5px solid var(--border2)',overflowY:'auto',padding:'28px'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}><div style={{display:'flex',alignItems:'center',gap:'10px'}}>{getFirmLogo(currentFirm.name,currentFirm.color,32)}<div style={{fontSize:'18px',fontWeight:'600'}}>{currentFirm.name}</div></div><div style={{display:'flex',gap:'8px'}}><button onClick={()=>renameFirm(currentFirm.id)} style={S.btnGhost}>{'✏'} Renommer</button><button onClick={()=>setFirmDrawer(null)} style={S.btnGhost}>{'✕'}</button></div></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'20px'}}>{[['Total comptes',(currentFirm.accounts||[]).length],['Total dépensé',<span key="s" style={{color:'var(--red)'}}>{ fmtMoney(firmTotalSpent(currentFirm))}</span>],['Total payouts',<span key="p" style={{color:'var(--green)'}}>{fmtMoney(firmTotalPayouts(currentFirm))}</span>],['Net',<span key="n" style={{color:(firmTotalPayouts(currentFirm)-firmTotalSpent(currentFirm))>=0?'var(--green)':'var(--red)'}}>{fmtMoneyNet(firmTotalPayouts(currentFirm)-firmTotalSpent(currentFirm))}</span>]].map(([l,v],i)=>(<div key={i} style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:'12px 14px'}}><div style={{fontSize:'11px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'5px'}}>{l}</div><div style={{fontSize:'16px',fontWeight:'600'}}>{v}</div></div>))}</div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}><div style={{fontSize:'13px',fontWeight:'600',color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Comptes ({(currentFirm.accounts||[]).length})</div><button onClick={()=>{setAcctModal({firmId:currentFirm.id});(()=>{const fn=firms.find(f=>f.id===(acctModal?.firmId||currentFirm?.id))?.name;const tg=defaultPayoutTarget(fn,'50k');const md=defaultMinTradingDays(fn,'50k');const pr=defaultChallengePrice(fn,'50k');const mdp=defaultMinDailyProfit(fn,'50k');const ps=suggestProfitSplit(fn,'50k');setAcctForm({buyDate:new Date().toISOString().slice(0,10),currency:'USD',spent:pr!==null?String(pr):'',activationFee:'',activationDate:'',status:'Challenge',notes:'',planSize:'50k',name:'',ddType:defaultDdType(fn),payoutTarget:tg!==null?String(tg):'',minTradingDays:md!==null?String(md):'',minDailyProfit:mdp!==null?String(mdp):'',profitSplit:String(ps),paymentMode:'monthly',quantity:'1'})})()}} style={S.btnPrimary}>+ Ajouter compte</button></div>{(currentFirm.accounts||[]).slice().sort((a,b)=>{const o={'Financé':0,'Challenge':1,'Échoué':2};return (o[a.status]??3)-(o[b.status]??3)}).map(a=>{const tp=totalPayoutsEUR(a),net=tp-totalSpentForAccount(a);const isFailed=a.status==='Échoué';return<div key={a.id} onClick={()=>setAcctDrawer({firmId:currentFirm.id,acctId:a.id})} style={{padding:'12px 14px',background:'var(--surface2)',borderRadius:'var(--radius)',marginBottom:'8px',cursor:'pointer',opacity:isFailed?0.55:1,filter:isFailed?'grayscale(0.4)':'none',transition:'opacity 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background='var(--surface3)';e.currentTarget.style.opacity=1}} onMouseLeave={e=>{e.currentTarget.style.background='var(--surface2)';e.currentTarget.style.opacity=isFailed?0.55:1}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}><div style={{display:'flex',alignItems:'center',gap:'8px',flex:1,minWidth:0}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:STATUS_COLORS[a.status],flexShrink:0}} /><span style={{fontWeight:'600',fontSize:'13px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{accountLabel(a)}</span><button onClick={(e)=>{e.stopPropagation();renameAccount(a.id, a.name, a.buy_date)}} title="Renommer" style={{background:'transparent',border:'none',color:'var(--text3)',cursor:'pointer',padding:'2px 6px',fontSize:'13px',flexShrink:0}}>{'✏'}</button></div><span style={{display:'inline-flex',alignItems:'center',gap:'5px'}}><span style={S.badge(a.status)}>{a.status}</span>{a.liquidated_at&&<span title={`Auto-liquidé le ${new Date(a.liquidated_at).toLocaleString('fr-FR')} (par la propfirm)`} style={{fontSize:'12px',cursor:'help'}}>{'🔥'}</span>}</span></div><div style={{display:'flex',justifyContent:'space-between',fontSize:'12px'}}><span style={{color:'var(--green)'}}>Payouts : {fmtMoney(tp)}</span><span style={{color:net>=0?'var(--green)':'var(--red)'}}>Net : {fmtMoneyNet(net)}</span><span style={{color:'var(--text3)'}}>{(a.payouts||[]).length} payout{(a.payouts||[]).length>1?'s':''}</span></div></div>})}<div style={{marginTop:'28px',paddingTop:'20px',borderTop:'0.5px solid var(--border)'}}><button onClick={()=>deleteFirm(currentFirm.id)} style={{background:'var(--red-bg)',color:'var(--red-text)',border:'0.5px solid var(--red-bg)',padding:'8px 16px',borderRadius:'var(--radius)',fontSize:'13px',cursor:'pointer',fontWeight:'500'}}>Supprimer cette firme</button></div></div></div>}

        {/* ── Account Drawer ── */}
        {acctDrawer&&currentAcct&&<div onClick={()=>setAcctDrawer(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:450,display:'flex',alignItems:'flex-start',justifyContent:'flex-end'}}><div className="drawer" onClick={e=>e.stopPropagation()} style={{width:'500px',maxWidth:'95vw',height:'100vh',background:'var(--surface)',borderLeft:'0.5px solid var(--border2)',overflowY:'auto',padding:'28px'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}><div style={{fontSize:'17px',fontWeight:'600'}}>{currentAcctFirm?.name} {'—'} {accountLabel(currentAcct)}</div><div style={{display:'flex',gap:'8px'}}><button onClick={()=>{setAcctModal({firmId:acctDrawer.firmId,acct:currentAcct});setAcctForm({buyDate:currentAcct.buy_date,currency:currentAcct.currency,spent:currentAcct.spent,activationFee:currentAcct.activation_fee||'',activationDate:currentAcct.activation_date||'',status:currentAcct.status,notes:currentAcct.notes||'',planSize:currentAcct.plan_size||'50k',name:currentAcct.name||'',ddType:currentAcct.dd_type||defaultDdType(currentAcctFirm?.name),payoutTarget:currentAcct.payout_target!=null?String(currentAcct.payout_target):'',minTradingDays:currentAcct.min_trading_days!=null?String(currentAcct.min_trading_days):'',minDailyProfit:currentAcct.min_daily_profit!=null?String(currentAcct.min_daily_profit):'',profitSplit:currentAcct.profit_split!=null?String(currentAcct.profit_split):'90',paymentMode:currentAcct.payment_mode||'monthly',quantity:'1'})}} style={S.btnGhost}>{'✏'} Modifier</button><button onClick={()=>setAcctDrawer(null)} style={S.btnGhost}>{'✕'}</button></div></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'20px'}}>{[['Firme',currentAcctFirm?.name],['Date achat',currentAcct.buy_date],['Challenge',<span key="ch" style={{color:'var(--red)',display:'inline-flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>{currentAcct.spent} {currentAcct.currency}<span style={{padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:600,background:currentAcct.payment_mode==='onetime'?'rgba(45,111,255,0.15)':'rgba(250,199,117,0.15)',color:currentAcct.payment_mode==='onetime'?'var(--blue-light)':'var(--amber)'}}>{currentAcct.payment_mode==='onetime'?'💎 One-time':'📅 Mensuel'}</span></span>],...(currentAcct.payment_mode==='monthly'?[['Mensualités payées',<span key="mp" style={{color:'var(--red)'}}>{currentAcct.months_count||1} {'×'} {currentAcct.spent} {currentAcct.currency} = {((currentAcct.months_count||1)*(parseFloat(currentAcct.spent)||0)).toFixed(2)} {currentAcct.currency}{currentAcct.status==='Challenge'?<span style={{marginLeft:6,fontSize:9,padding:'1px 6px',borderRadius:99,background:'rgba(250,199,117,0.15)',color:'var(--amber)'}}>{'⏱'} en cours</span>:<span style={{marginLeft:6,fontSize:9,padding:'1px 6px',borderRadius:99,background:'rgba(29,184,122,0.15)',color:'var(--green)'}}>{'✓'} figé</span>}</span>]]:[]),...(currentAcct.activation_fee>0?[['Date activation',currentAcct.activation_date||'—'],['Frais activation',<span key="af" style={{color:'var(--red)'}}>{currentAcct.activation_fee} {currentAcct.currency}</span>]]:[]),['Total dépensé',<span key="ts" style={{color:'var(--red)'}}>{fmtMoney(totalSpentForAccount(currentAcct))}</span>],['Net',<span key="nt" style={{color:(totalPayoutsEUR(currentAcct)-totalSpentForAccount(currentAcct))>=0?'var(--green)':'var(--red)'}}>{fmtMoneyNet(totalPayoutsEUR(currentAcct)-totalSpentForAccount(currentAcct))}</span>],['Statut',<span key="st" style={{display:'inline-flex',alignItems:'center',gap:'5px'}}><span style={S.badge(currentAcct.status)}>{currentAcct.status}</span>{currentAcct.liquidated_at&&<span title={`Auto-liquidé le ${new Date(currentAcct.liquidated_at).toLocaleString('fr-FR')} (par la propfirm)`} style={{fontSize:'13px',cursor:'help'}}>{'🔥'}</span>}</span>]].map(([l,v],i)=>(<div key={i} style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:'12px 14px'}}><div style={{fontSize:'11px',color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'5px'}}>{l}</div><div style={{fontSize:'15px',fontWeight:'600'}}>{v}</div></div>))}</div>{currentAcct.status!=='Échoué'&&<div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>{currentAcct.status==='Challenge'&&<button onClick={()=>openPromoteModal(currentAcctFirm,currentAcct)} style={{flex:1,padding:'10px 14px',background:'linear-gradient(135deg, #1db87a 0%, #2ed694 100%)',border:'none',color:'#fff',borderRadius:'var(--radius)',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',boxShadow:'0 4px 12px rgba(29,184,122,0.3)',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',transition:'transform 0.15s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}><span style={{fontSize:'15px'}}>{'🚀'}</span><span>Passer en Financé</span></button>}<button onClick={()=>openFailModal(currentAcctFirm,currentAcct)} style={{flex:1,padding:'10px 14px',background:'transparent',border:'1px solid rgba(232,80,74,0.4)',color:'#e8504a',borderRadius:'var(--radius)',fontSize:'12px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(232,80,74,0.10)';e.currentTarget.style.borderColor='#e8504a'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='rgba(232,80,74,0.4)'}}><span style={{fontSize:'15px'}}>{'💔'}</span><span>{currentAcct.status==='Challenge'?'J\'ai échoué':'Compte blown (DD touché)'}</span></button></div>}<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}><div style={{fontSize:'13px',fontWeight:'600',color:'var(--text2)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Payouts reçus</div><button onClick={()=>{setPayoutForm(true);setPayoutFD({date:new Date().toISOString().slice(0,10),amount:'',note:''})}} style={S.btnPrimary}>+ Ajouter payout</button></div>{payoutForm&&<div style={{background:'var(--surface3)',borderRadius:'var(--radius)',padding:'14px',marginBottom:'14px'}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}><div><div style={S.label}>Date</div><input type="date" value={payoutFD.date} onChange={e=>setPayoutFD(p=>({...p,date:e.target.value}))} style={{...S.input,background:'var(--surface2)'}} /></div><div><div style={S.label}>Montant brut demandé<TooltipIcon text="Le BRUT est le montant retiré du compte (avant split). Le NET = ce que tu reçois réellement = brut × ton profit split. Ex : tu demandes 2 000 $ brut avec un split 90/10 → tu reçois 1 800 $, la firme garde 200 $." maxWidth={320} /></div><input type="number" value={payoutFD.amount} onChange={e=>setPayoutFD(p=>({...p,amount:e.target.value}))} placeholder="ex : 2000" style={{...S.input,background:'var(--surface2)'}} /></div></div>{(()=>{const split=currentAcct?.profit_split||suggestProfitSplit(currentAcctFirm?.name,currentAcct?.plan_size);const brut=parseFloat(payoutFD.amount)||0;if(brut<=0||!split)return null;const net=brut*(split/100);const firmCut=brut-net;return(<div style={{marginBottom:'10px',padding:'10px 12px',background:'rgba(45,111,255,0.08)',border:'0.5px solid rgba(45,111,255,0.3)',borderRadius:'var(--radius)',fontSize:'12px'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{color:'var(--text2)'}}>Profit split {split}/{100-split}</span><span style={{color:'var(--text3)',fontSize:'10px'}}>{currentAcctFirm?.name} {'·'} Plan {(currentAcct?.plan_size||'').toUpperCase()}</span></div><div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',fontWeight:'600',marginBottom:'4px'}}><span style={{color:'var(--green)'}}>{'💰'} Net reçu (dans ta poche) : {net.toFixed(2)} {currentAcct?.currency||'$'}</span><span style={{color:'var(--text3)',fontSize:'11px'}}>Part firme : {firmCut.toFixed(2)}</span></div><div style={{fontSize:'11px',color:'var(--text3)'}}>{'📉'} Brut déduit du compte : {brut.toFixed(2)} {currentAcct?.currency||'$'}</div></div>)})()}<div style={{marginBottom:'10px'}}><div style={S.label}>Note</div><input value={payoutFD.note} onChange={e=>setPayoutFD(p=>({...p,note:e.target.value}))} placeholder="ex: 1er payout..." style={{...S.input,background:'var(--surface2)'}} /></div><div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}><button onClick={()=>setPayoutForm(false)} style={S.btnGhost}>Annuler</button><button onClick={savePayout} style={S.btnPrimary}>OK</button></div></div>}{(currentAcct.payouts||[]).length>0&&<div style={{marginBottom:'14px',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',background:'var(--surface3)',borderRadius:'var(--radius)'}}><span style={{fontSize:'12px',color:'var(--text2)'}}>Total payouts</span><span style={{fontSize:'16px',fontWeight:'600',color:'var(--green)'}}>{fmtMoney(totalPayoutsEUR(currentAcct))}</span></div>}{(currentAcct.payouts||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)).map(p=>(<div key={p.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 14px',background:'var(--surface2)',borderRadius:'var(--radius)',marginBottom:'8px'}}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--green)',flexShrink:0}} /><div style={{flex:1}}><div style={{fontWeight:'500',fontSize:'13px'}}>Payout {'—'} {p.date}</div>{p.note&&<div style={{fontSize:'11px',color:'var(--text3)'}}>{p.note}</div>}</div><div style={{fontSize:'15px',fontWeight:'600',color:'var(--green)'}}>+{fmtMoney(toEUR(p.amount,currentAcct.currency,rates))}</div><button onClick={()=>deletePayout(p.id)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:'2px 6px',fontSize:'14px'}}>{'✕'}</button></div>))}{!(currentAcct.payouts||[]).length&&!payoutForm&&<div style={{color:'var(--text3)',fontSize:'13px',padding:'12px 0'}}>Aucun payout enregistré.</div>}<div style={{marginTop:'28px',paddingTop:'20px',borderTop:'0.5px solid var(--border)'}}><button onClick={()=>deleteAccount(currentAcct.id)} style={{background:'var(--red-bg)',color:'var(--red-text)',border:'0.5px solid var(--red-bg)',padding:'8px 16px',borderRadius:'var(--radius)',fontSize:'13px',cursor:'pointer',fontWeight:'500'}}>Supprimer ce compte</button></div></div></div>}

        {/* ── Promote Modal ── */}
        {promoteModal && (() => {
          const firm = firms.find(f=>f.id===promoteModal.firmId)
          const acct = firm?.accounts.find(a=>a.id===promoteModal.acctId)
          if(!acct || !firm) return null
          const isOneTime = acct.payment_mode === 'onetime'
          return (
            <div onClick={()=>setPromoteModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(4px)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',overflowY:'auto'}}>
              <div onClick={e=>e.stopPropagation()} style={{...S.card,padding:'28px',width:'500px',maxWidth:'100%',boxShadow:'0 30px 80px rgba(0,0,0,0.6)',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',inset:0,opacity:0.6,background:'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(29,184,122,0.22), transparent 60%)',pointerEvents:'none'}} />
                <div style={{position:'relative'}}>
                  <div style={{textAlign:'center',marginBottom:'22px'}}>
                    <div style={{fontSize:48,marginBottom:8,animation:'qtCelebrate 1.2s ease-out'}}>{'🎉'}</div>
                    <h2 style={{fontSize:22,fontWeight:800,marginBottom:6,letterSpacing:'-0.01em'}}>Félicitations !</h2>
                    <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.55,margin:0}}>
                      Tu as passé le challenge sur <strong style={{color:'var(--text)'}}>{firm.name}</strong> {'·'} Plan <strong style={{color:'var(--text)'}}>{(acct.plan_size||'').toUpperCase()}</strong>.<br/>
                      Configure les règles de ton compte financé :
                    </p>
                  </div>
                  <div style={{marginBottom:'12px'}}>
                    <label style={S.label}>Nouveau nom du compte (optionnel)<TooltipIcon text="C’est le moment idéal pour renommer ton compte selon sa nouvelle vie. Ex : test-0001 → Pro-001, Challenge-A → Live-A, etc. Laisse vide pour garder le nom actuel." maxWidth={320} /></label>
                    <input type="text" value={promoteForm.newName} onChange={e=>setPromoteForm(p=>({...p,newName:e.target.value}))} placeholder={acct.name?`Actuel : ${acct.name}`:'ex : Pro-001, Live-NQ, Funded #1...'} style={S.input} />
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:isOneTime?'1fr':'1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                    <div>
                      <label style={S.label}>Date d&apos;activation</label>
                      <input type="date" value={promoteForm.activationDate} onChange={e=>setPromoteForm(p=>({...p,activationDate:e.target.value}))} style={S.input} />
                    </div>
                    {!isOneTime && (
                      <div>
                        <label style={S.label}>Frais d&apos;activation ($)</label>
                        <input type="number" value={promoteForm.activationFee} onChange={e=>setPromoteForm(p=>({...p,activationFee:e.target.value}))} placeholder="ex : 145" style={S.input} />
                      </div>
                    )}
                  </div>
                  {isOneTime && (
                    <div style={{padding:'8px 12px',marginBottom:'12px',background:'rgba(45,111,255,0.08)',border:'0.5px solid rgba(45,111,255,0.25)',borderRadius:'var(--radius)',fontSize:11,color:'var(--text3)'}}>
                      {'💎'} Paiement one-time {'→'} aucun frais d&apos;activation à payer.
                    </div>
                  )}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
                    <div>
                      <label style={S.label}>Objectif payout ($)</label>
                      <input type="number" step="0.01" value={promoteForm.payoutTarget} onChange={e=>setPromoteForm(p=>({...p,payoutTarget:e.target.value}))} placeholder="ex : 53000" style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Jours de trading min</label>
                      <input type="number" min="0" value={promoteForm.minTradingDays} onChange={e=>setPromoteForm(p=>({...p,minTradingDays:e.target.value}))} placeholder="ex : 10" style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Profit min / jour ($)<TooltipIcon text="Profit minimum sur 1 journée pour qu’elle compte comme jour validé dans le décompte." /></label>
                      <input type="number" min="0" step="1" value={promoteForm.minDailyProfit} onChange={e=>setPromoteForm(p=>({...p,minDailyProfit:e.target.value}))} placeholder="ex : 150" style={S.input} />
                    </div>
                    <div>
                      <label style={S.label}>Profit split<TooltipIcon text="Pourcentage du profit que TU touches lors d’un payout. Le reste va à la PropFirm." maxWidth={300} /></label>
                      <select value={promoteForm.profitSplit} onChange={e=>setPromoteForm(p=>({...p,profitSplit:e.target.value}))} style={S.input}>
                        <option value="100">100 / 0</option>
                        <option value="90">90 / 10</option>
                        <option value="80">80 / 20</option>
                        <option value="70">70 / 30</option>
                      </select>
                    </div>
                  </div>
                  <div style={{padding:'10px 12px',marginBottom:'18px',background:'rgba(29,184,122,0.08)',border:'0.5px solid rgba(29,184,122,0.3)',borderRadius:'var(--radius)',fontSize:12,color:'var(--text2)',lineHeight:1.55}}>
                    {'✅'} <strong>La balance du journal sera réinitialisée à 0</strong> à partir de la date d&apos;activation.{!isOneTime && <> Les <strong>mensualités s&apos;arrêtent</strong> à partir de maintenant.</>}
                  </div>
                  <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
                    <button onClick={()=>setPromoteModal(null)} style={S.btnGhost}>Annuler</button>
                    <button onClick={savePromote} style={{padding:'11px 22px',fontSize:13,fontWeight:700,background:'linear-gradient(135deg, #1db87a 0%, #2ed694 100%)',border:'none',color:'#fff',borderRadius:'var(--radius)',cursor:'pointer',fontFamily:'inherit',boxShadow:'0 6px 18px rgba(29,184,122,0.4)',display:'flex',alignItems:'center',gap:'8px'}}>
                      {'🎉'} Valider le passage
                    </button>
                  </div>
                </div>
              </div>
              <style>{`@keyframes qtCelebrate { 0%{transform:scale(0.5) rotate(-15deg);opacity:0} 60%{transform:scale(1.2) rotate(8deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }`}</style>
            </div>
          )
        })()}

        {/* ── Fail Modal ── */}
        {failModal && (() => {
          const firm = firms.find(f=>f.id===failModal.firmId)
          const acct = firm?.accounts.find(a=>a.id===failModal.acctId)
          if(!acct || !firm) return null
          const isChallenge = acct.status === 'Challenge'
          return (
            <div onClick={()=>setFailModal(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(4px)',zIndex:600,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',overflowY:'auto'}}>
              <div onClick={e=>e.stopPropagation()} style={{...S.card,padding:'28px',width:'460px',maxWidth:'100%',boxShadow:'0 30px 80px rgba(0,0,0,0.6)',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',inset:0,opacity:0.5,background:'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(232,80,74,0.15), transparent 60%)',pointerEvents:'none'}} />
                <div style={{position:'relative'}}>
                  <div style={{textAlign:'center',marginBottom:'18px'}}>
                    <div style={{fontSize:42,marginBottom:6}}>{'💔'}</div>
                    <h2 style={{fontSize:20,fontWeight:800,marginBottom:4,letterSpacing:'-0.01em'}}>
                      {isChallenge ? 'Challenge échoué' : 'Compte blown'}
                    </h2>
                    <p style={{fontSize:12,color:'var(--text3)',margin:0}}>
                      <strong style={{color:'var(--text2)'}}>{firm.name}</strong> {'·'} Plan <strong style={{color:'var(--text2)'}}>{(acct.plan_size||'').toUpperCase()}</strong>
                      {acct.name && <> {'·'} {acct.name}</>}
                    </p>
                  </div>
                  <div style={{ padding:'16px 18px', marginBottom:'18px', background:'var(--surface2)', border:'1px solid rgba(45,111,255,0.25)', borderLeft:'3px solid var(--blue-light)', borderRadius:'var(--radius)', fontSize:13, color:'var(--text)', lineHeight:1.65, fontStyle:'italic' }}>
                    {failModal.message}
                  </div>
                  <div style={{padding:'8px 12px',marginBottom:'18px',background:'rgba(250,199,117,0.07)',border:'0.5px solid rgba(250,199,117,0.25)',borderRadius:'var(--radius)',fontSize:11,color:'var(--text3)',lineHeight:1.5}}>
                    {'⚠️'} Le compte sera marqué <strong>Échoué</strong>. Tu pourras toujours consulter son historique de trades et payouts dans le journal {'—'} il sera juste affiché en grisé dans les listes.
                  </div>
                  <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
                    <button onClick={()=>setFailModal(null)} style={S.btnGhost}>Annuler</button>
                    <button onClick={confirmFail} style={{padding:'10px 18px',fontSize:12,fontWeight:600,background:'rgba(232,80,74,0.10)',color:'#e8504a',border:'1px solid #e8504a',borderRadius:'var(--radius)',cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'6px'}}>
                      {'💔'} Confirmer l&apos;échec
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── Certificates Modal ── */}
        {certsFirm && (
          <CertificatesModal
            firm={certsFirm}
            user={user}
            onClose={() => setCertsFirm(null)}
            showToast={showToast}
            getFirmLogo={getFirmLogo}
          />
        )}

        {/* ── Profile Modal ── */}
        {showProfileModal && user && (
          <ProfileModal
            user={user}
            onClose={() => setShowProfileModal(false)}
            onUpdated={loadProfile}
          />
        )}

        {/* ── Onboarding Modal ── */}
        {showOnboarding && user && (
          <OnboardingModal
            user={user}
            showToast={showToast}
            onComplete={() => setShowOnboarding(false)}
            onAddFirm={() => { setFirmModal(true); setNewFirmName('') }}
            onStartTutorial={() => { setShowOnboarding(false); setShowTutorial(true) }}
          />
        )}

        {/* ── Tutorial ── */}
        {showTutorial && (
          <Tutorial
            onClose={() => setShowTutorial(false)}
            onPageChange={(page) => router.push(`/app/${page}`)}
            state={{
              page: currentPage,
              firmsCount: firms.length,
              accountsCount: accts.length,
              tradesCount,
              payoutsCount: firms.reduce((s, f) => s + (f.accounts || []).reduce((ss, a) => ss + (a.payouts || []).length, 0), 0),
              financedCount: accts.filter(a => a.status === 'Financé').length,
              firmDrawerOpen: !!firmDrawer,
              acctDrawerOpen: !!acctDrawer,
              acctModalOpen: !!acctModal,
              firmModalOpen: !!firmModal,
              payoutFormOpen: !!payoutForm,
            }}
          />
        )}

        {/* ── Toast ── */}
        {toast && <div className="toast" style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'var(--surface3)', color: 'var(--text)', border: '0.5px solid var(--border2)', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>{toast}</div>}
      </div>
    </AppContext.Provider>
  )
}
