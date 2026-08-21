'use client'
// components/dashboard/DashboardHero.js — en-tête du dashboard, mise en page Abyss.
//
// Reprend la maquette retenue : une carte HÉROS qui dit quoi faire, deux cartes
// chiffrées avec micro-graphe, puis courbe d'equity + santé des comptes.
//
// Tout est calculé à partir des données réelles (firms → accounts → payouts).
// Les graphes sont du SVG inline, pas Chart.js : ce sont des micro-visuels
// décoratifs, et le SVG suit `var(--…)` alors qu'un canvas ne le ferait pas.

import { useMemo } from 'react'
import { useT, useLanguage } from '../LanguageProvider'
import { planSizeNum, maxDrawdown } from '../../lib/constants'

const MONTHS_BACK = 7

// Marge de drawdown restante d'un compte, en fraction de son allowance.
// Renvoie null quand la balance ou le plancher manquent — on ne devine pas.
function drawdownRoom(account, firmName) {
  const balance = account.balance
  const floor = account.dd_floor
  const custom = account.custom_drawdown != null && account.custom_drawdown > 0
    ? Number(account.custom_drawdown) : null
  const maxDD = custom ?? maxDrawdown(firmName, account.plan_size)
  if (balance == null || floor == null || !(maxDD > 0)) return null
  return Math.min(1, Math.max(0, (balance - floor) / maxDD))
}

function roomTone(pct) {
  if (pct >= 0.6) return { color: 'var(--green)', key: 'safe' }
  if (pct >= 0.3) return { color: 'var(--blue)', key: 'ok' }
  if (pct >= 0.15) return { color: 'var(--amber)', key: 'watch' }
  return { color: 'var(--red)', key: 'risk' }
}

// Série mensuelle dépenses / payouts sur les N derniers mois, en EUR.
function monthlySeries(firms, toEUR, rates) {
  const now = new Date()
  const buckets = []
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, month: d, spent: 0, payout: 0 })
  }
  const index = Object.fromEntries(buckets.map((b, i) => [b.key, i]))
  const add = (dateStr, field, amount, currency) => {
    if (!dateStr) return
    const i = index[String(dateStr).slice(0, 7)]
    if (i === undefined) return
    buckets[i][field] += toEUR(amount, currency, rates)
  }
  for (const f of firms) {
    for (const a of f.accounts || []) {
      // Un abonnement mensuel est prélevé chaque mois : chaque échéance compte.
      const months = a.payment_mode === 'monthly' ? (a.months_count || 1) : 1
      for (let m = 0; m < months; m++) {
        const d = new Date(a.buy_date)
        d.setMonth(d.getMonth() + m)
        add(d.toISOString().slice(0, 10), 'spent', a.spent, a.currency)
      }
      if (a.activation_fee > 0) add(a.activation_date, 'spent', a.activation_fee, a.currency)
      for (const p of a.payouts || []) add(p.date, 'payout', p.amount, a.currency)
    }
  }
  return buckets
}

// Chemin SVG lissé passant par les points (courbe de Catmull-Rom simplifiée).
function smoothPath(values, w, h, pad = 2) {
  if (!values.length) return ''
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const step = values.length > 1 ? w / (values.length - 1) : w
  const pts = values.map((v, i) => [i * step, h - pad - ((v - min) / span) * (h - pad * 2)])
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const cx = (x0 + x1) / 2
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`
  }
  return d
}

export default function DashboardHero({
  firms, accts, rates, toEUR, fmtE, fmtENet, currency,
  totalSpentEUR, totalPayoutsEUR2, totalNet, totalPayoutCount,
  totalPayoutsEUR, totalSpentForAccount,
  getFirmLogo, setFirmDrawer, S,
}) {
  const t = useT()
  const { locale } = useLanguage()

  const series = useMemo(() => monthlySeries(firms, toEUR, rates), [firms, toEUR, rates])

  // Santé : on remonte les comptes dont on connaît réellement la marge, du plus
  // exposé au plus sûr. Un compte sans balance saisie n'apparaît pas — mieux vaut
  // ne rien montrer qu'une jauge inventée.
  const health = useMemo(() => {
    const rows = []
    for (const f of firms) {
      for (const a of f.accounts || []) {
        if (a.status === 'Échoué') continue
        const pct = drawdownRoom(a, f.name)
        if (pct == null) continue
        rows.push({ id: a.id, firmId: f.id, firm: f.name, account: a, pct })
      }
    }
    return rows.sort((x, y) => x.pct - y.pct).slice(0, 4)
  }, [firms])

  // Le message du héros : ce que l'utilisateur devrait faire maintenant. On
  // classe par urgence — un compte au bord du breach passe avant un payout.
  const insight = useMemo(() => {
    const atRisk = []
    const eligible = []
    for (const f of firms) {
      for (const a of f.accounts || []) {
        if (a.status === 'Échoué') continue
        const pct = drawdownRoom(a, f.name)
        if (pct != null && pct < 0.2) atRisk.push({ firm: f.name, a, firmId: f.id })
        if (a.status === 'Financé' && a.payout_target > 0) {
          const net = totalPayoutsEUR(a) - totalSpentForAccount(a)
          if (net >= Number(a.payout_target)) eligible.push({ firm: f.name, a, firmId: f.id })
        }
      }
    }
    if (atRisk.length) {
      return {
        tone: 'risk',
        accent: 'var(--red)',
        title: t(atRisk.length > 1 ? 'app.hero.riskTitleN' : 'app.hero.riskTitle1').replace('{n}', atRisk.length),
        body: t('app.hero.riskBody').replace('{list}', atRisk.slice(0, 2).map(r => `${r.firm} ${r.a.name || ''}`.trim()).join(', ')),
        cta: t('app.hero.riskCta'),
        firmId: atRisk[0].firmId,
      }
    }
    if (eligible.length) {
      return {
        tone: 'good',
        accent: 'var(--green)',
        title: t(eligible.length > 1 ? 'app.hero.payoutTitleN' : 'app.hero.payoutTitle1').replace('{n}', eligible.length),
        body: t('app.hero.payoutBody').replace('{list}', eligible.slice(0, 2).map(r => `${r.firm} ${r.a.name || ''}`.trim()).join(', ')),
        cta: t('app.hero.payoutCta'),
        firmId: eligible[0].firmId,
      }
    }
    return {
      tone: 'calm',
      accent: 'var(--blue)',
      title: t('app.hero.calmTitle').replace('{n}', accts.length),
      body: t('app.hero.calmBody').replace('{n}', firms.length),
      cta: null,
      firmId: null,
    }
  }, [firms, accts.length, t, totalPayoutsEUR, totalSpentForAccount])

  const money = (eur) => currency === 'eur' ? fmtE(eur) : `${(eur / rates.USD).toFixed(2)} $`
  const payoutVals = series.map(b => b.payout)
  const spentVals = series.map(b => b.spent)
  const spentMax = Math.max(...spentVals, 1)

  // Cumuls pour la courbe d'equity.
  let cp = 0, cs = 0
  const cumPayout = series.map(b => (cp += b.payout))
  const cumSpent = series.map(b => (cs += b.spent))
  const cumMax = Math.max(...cumPayout, ...cumSpent, 1)
  // PAD_X réserve la place des libellés d'extrémité, sinon le premier et le
  // dernier mois débordent du viewBox et sont rognés.
  const PAD_X = 26
  const CURVE_W = 560 - PAD_X * 2
  const curve = (vals) => smoothPath(vals.map(v => v / cumMax * 100), CURVE_W, 180, 8)
  const monthX = (i) => PAD_X + (series.length > 1 ? (i * CURVE_W) / (series.length - 1) : CURVE_W / 2)

  const card = { ...S.card, padding: '22px 24px', minWidth: 0 }

  return (
    <>
      {/* ── Rangée 1 : ce qu'il faut faire, puis les deux compteurs ── */}
      <div className="qt-hero-row" style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr 1fr', gap: 16, marginBottom: 16 }}>

        <div style={{
          ...card,
          background: `linear-gradient(150deg, color-mix(in srgb, ${insight.accent} 14%, transparent), var(--surface))`,
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', margin: 0, lineHeight: 1.2 }}>
              {insight.title}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.55, margin: '10px 0 0', maxWidth: '38ch' }}>
              {insight.body}
            </p>
            {insight.cta && (
              <button
                onClick={() => insight.firmId && setFirmDrawer(insight.firmId)}
                style={{ ...S.btnGhost, marginTop: 16, fontSize: 13, padding: '9px 18px' }}
              >
                {insight.cta} →
              </button>
            )}
          </div>
          <HeroArt tone={insight.tone} accent={insight.accent} />
        </div>

        <div style={card}>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>{t('app.dashboard.statTotalPayouts')}</div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
            {money(totalPayoutsEUR2)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            {totalPayoutCount} {t('app.dashboard.statPayouts').toLowerCase()}
          </div>
          <svg viewBox="0 0 200 62" style={{ display: 'block', width: '100%', height: 'auto', marginTop: 16 }} aria-hidden="true">
            <defs>
              <linearGradient id="qtPayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green)" stopOpacity="0.32" />
                <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${smoothPath(payoutVals, 200, 62)} L200,62 L0,62 Z`} fill="url(#qtPayGrad)" />
            <path d={smoothPath(payoutVals, 200, 62)} fill="none" stroke="var(--green)" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>

        <div style={card}>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>{t('app.dashboard.statTotalSpent')}</div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
            {money(totalSpentEUR)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            {firms.length} {t('app.dashboard.statPropfirms').toLowerCase()} · {accts.length} {t('app.dashboard.accountsLabel')}
          </div>
          <svg viewBox="0 0 200 62" style={{ display: 'block', width: '100%', height: 'auto', marginTop: 16 }} aria-hidden="true">
            {spentVals.map((v, i) => {
              const w = 200 / spentVals.length
              const h = Math.max(3, (v / spentMax) * 56)
              return <rect key={i} x={i * w + 3} y={62 - h} width={w - 6} height={h} rx="4"
                           fill="var(--red)" opacity={0.35 + 0.55 * (v / spentMax)} />
            })}
          </svg>
        </div>
      </div>

      {/* ── Rangée 2 : trajectoire, puis exposition ── */}
      <div className="qt-hero-row2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>

        <div style={card}>
          <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.015em', margin: 0 }}>{t('app.hero.equityTitle')}</h2>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{t('app.hero.equitySub')}</div>
          <svg viewBox="0 0 560 210" style={{ display: 'block', width: '100%', height: 'auto', marginTop: 18 }}
               role="img" aria-label={t('app.hero.equityTitle')}>
            <defs>
              <linearGradient id="qtEqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.30" />
                <stop offset="100%" stopColor="var(--blue)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <g stroke="var(--chart-grid)">
              {[20, 70, 120, 170].map(y => <line key={y} x1={PAD_X} y1={y} x2={560 - PAD_X} y2={y} />)}
            </g>
            <g transform={`translate(${PAD_X},0)`}>
              <path d={`${curve(cumPayout)} L${CURVE_W},180 L0,180 Z`} fill="url(#qtEqGrad)" />
              <path d={curve(cumPayout)} fill="none" stroke="var(--blue)" strokeWidth="2.6" strokeLinecap="round" />
              <path d={curve(cumSpent)} fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" />
            </g>
            <g fontSize="10" fill="var(--text3)" textAnchor="middle" fontFamily="var(--font-mono), monospace">
              {series.map((b, i) => (
                <text key={b.key} x={monthX(i)} y="202">
                  {b.month.toLocaleDateString(locale === 'en' ? 'en-GB' : 'fr-FR', { month: 'short' })}
                </text>
              ))}
            </g>
          </svg>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12, fontSize: 12.5, color: 'var(--text2)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--blue)' }} />{t('app.hero.legendPayouts')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--text3)' }} />{t('app.hero.legendSpent')}
            </span>
          </div>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.015em', margin: 0 }}>{t('app.hero.healthTitle')}</h2>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{t('app.hero.healthSub')}</div>
          <div style={{
            fontSize: 38, fontWeight: 600, letterSpacing: '-0.03em', marginTop: 16,
            fontVariantNumeric: 'tabular-nums',
            color: totalNet >= 0 ? 'var(--green)' : 'var(--red)',
          }}>
            {currency === 'eur' ? fmtENet(totalNet) : `${totalNet >= 0 ? '+' : ''}${(totalNet / rates.USD).toFixed(2)} $`}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>{t('app.dashboard.statNetResult')}</div>

          {health.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.55, margin: 0 }}>
              {t('app.hero.healthEmpty')}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {health.map(row => {
                const tone = roomTone(row.pct)
                return (
                  <button
                    key={row.id}
                    onClick={() => setFirmDrawer(row.firmId)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                      background: 'transparent', border: 'none', padding: 0,
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'inherit',
                    }}
                  >
                    <span style={{ flexShrink: 0, display: 'flex' }}>{getFirmLogo(row.firm, tone.color, 36)}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 7 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.firm} {row.account.name || ''}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {Math.round(row.pct * 100)} %
                          <em style={{ fontStyle: 'normal', fontSize: 12, fontWeight: 500, color: tone.color, marginLeft: 6 }}>
                            {t(`app.hero.tone.${tone.key}`)}
                          </em>
                        </span>
                      </span>
                      <span style={{ display: 'block', height: 7, borderRadius: 99, background: 'var(--tint2)', overflow: 'hidden' }}>
                        <i style={{ display: 'block', height: '100%', borderRadius: 99, width: `${Math.round(row.pct * 100)}%`, background: tone.color }} />
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Illustration du héros — un écran avec une courbe, et un pictogramme d'état.
// Purement décorative, donc masquée aux lecteurs d'écran.
function HeroArt({ tone, accent }) {
  return (
    <svg viewBox="0 0 200 160" className="qt-hero-art" style={{ width: 168, flexShrink: 0 }} aria-hidden="true">
      <ellipse cx="100" cy="146" rx="70" ry="8" fill="var(--tint2)" />
      <rect x="28" y="46" width="144" height="88" rx="12" fill="var(--tint2)" stroke="var(--hairline)" />
      <rect x="28" y="46" width="144" height="20" rx="12" fill="var(--tint1)" />
      <circle cx="41" cy="56" r="3.2" fill="var(--red)" />
      <circle cx="52" cy="56" r="3.2" fill="var(--amber)" />
      <circle cx="63" cy="56" r="3.2" fill="var(--green)" />
      <path d="M42,120 L64,106 L86,112 L108,90 L130,96 L152,74 L162,68"
            fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="162" cy="68" r="5" fill={accent} />
      <rect x="42" y="78" width="34" height="6" rx="3" fill="var(--tint3)" />
      <rect x="42" y="89" width="22" height="6" rx="3" fill="var(--tint2)" />
      <circle cx="166" cy="38" r="17" fill={accent} />
      {tone === 'risk' ? (
        <g stroke="var(--text-inverse)" strokeWidth="3.2" strokeLinecap="round">
          <line x1="166" y1="30" x2="166" y2="40" /><line x1="166" y1="46" x2="166" y2="46" />
        </g>
      ) : (
        <path d="M159,38 L164,43 L174,32" fill="none" stroke="var(--text-inverse)"
              strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}
