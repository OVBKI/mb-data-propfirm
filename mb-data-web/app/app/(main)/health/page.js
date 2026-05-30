'use client'
// /app/health — Health Center : Drawdown Health + Consistency Monitor + Payout Pipeline.

import { useMemo } from 'react'
import { useApp } from '../AppContext'
import DrawdownHealthCard from '../../../../components/health/DrawdownHealthCard'
import ConsistencyMonitor from '../../../../components/health/ConsistencyMonitor'
import PayoutPipeline from '../../../../components/health/PayoutPipeline'

const C = {
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  surface: 'var(--surface)',
  border: 'var(--border)',
  blueLight: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
  red: '#e8504a',
}

export default function HealthPage() {
  const { firms, user } = useApp()

  // All accounts (funded + challenge) for the Drawdown Health section
  const monitoredAccounts = useMemo(() => {
    const list = []
    for (const f of (firms || [])) {
      for (const a of (f.accounts || [])) {
        if (a.status === 'Échoué') continue
        list.push({ ...a, firmName: f.name })
      }
    }
    return list
  }, [firms])

  // Summary stats
  const summary = useMemo(() => {
    let safe = 0, caution = 0, danger = 0, noData = 0
    for (const a of monitoredAccounts) {
      if (a.balance == null || a.dd_floor == null) { noData++; continue }
      const initial = Number(a.plan_size?.replace(/k$/i, '')) * 1000 || a.balance
      const room = Math.max(0, a.balance - a.dd_floor)
      const pct = initial > 0 ? room / initial : 0
      if (pct >= 0.7) safe++
      else if (pct >= 0.5) caution++
      else danger++
    }
    return { safe, caution, danger, noData, total: monitoredAccounts.length }
  }, [monitoredAccounts])

  return (
    <div style={{ padding: '24px 28px 60px', maxWidth: 1280, width: '100%', boxSizing: 'border-box' }}>
      {/* Page header */}
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, marginBottom: 6, color: C.text }}>
          Health Center
        </h1>
        <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.5, margin: 0 }}>
          Vue d&apos;ensemble en temps réel de la santé de tes comptes PropFirm : drawdown, consistency, pipeline payouts.
        </p>
      </header>

      {/* Summary row */}
      {monitoredAccounts.length > 0 && (
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 10,
          marginBottom: 32,
        }}>
          <SummaryCard label="Comptes actifs" value={summary.total} color={C.text2} />
          <SummaryCard label="Safe (≥70%)" value={summary.safe} color={C.green} />
          <SummaryCard label="Caution (50-70%)" value={summary.caution} color={C.amber} />
          <SummaryCard label="Danger (<50%)" value={summary.danger} color={C.red} />
          {summary.noData > 0 && <SummaryCard label="Sans data" value={summary.noData} color={C.text3} />}
        </section>
      )}

      {/* 1. Drawdown Health */}
      <Section
        title="Drawdown Health"
        subtitle="Room de drawdown par compte. Vert > 70% room (safe), ambre 50-70% (caution), rouge < 50% (danger zone)."
      >
        {monitoredAccounts.length === 0 ? (
          <EmptyState text="Aucun compte actif. Crée une firm puis un compte (Challenge ou Financé) pour activer le drawdown tracking." />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 12,
          }}>
            {monitoredAccounts.map((a) => (
              <DrawdownHealthCard key={a.id} account={a} firmName={a.firmName} />
            ))}
          </div>
        )}
      </Section>

      {/* 2. Consistency Monitor */}
      <Section
        title="Consistency Monitor"
        subtitle="Best winning day / profit total — comparé au seuil consistency de chaque firm. Calculé en live depuis tes trades journal."
      >
        <ConsistencyMonitor user={user} accounts={monitoredAccounts} firms={firms} />
      </Section>

      {/* 3. Payout Pipeline */}
      <Section
        title="Payout Pipeline"
        subtitle="Suivi des comptes financés à travers les 4 étapes : Setup → Building → Eligible → Received."
      >
        <PayoutPipeline firms={firms} />
      </Section>
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 4, color: C.text }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 13, color: C.text3, lineHeight: 1.5, margin: 0, marginBottom: 18 }}>
          {subtitle}
        </p>
      )}
      {children}
    </section>
  )
}

function EmptyState({ text }) {
  return (
    <div style={{
      padding: '24px',
      background: C.surface,
      border: `1px dashed ${C.border}`,
      borderRadius: 12,
      textAlign: 'center',
      color: C.text3,
      fontSize: 13,
      lineHeight: 1.5,
    }}>
      {text}
    </div>
  )
}
