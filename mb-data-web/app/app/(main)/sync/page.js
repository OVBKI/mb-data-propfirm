'use client'
// app/app/sync/page.js — Sync placeholder (redirects to journal-sync or shows coming soon)
import { useApp } from '../AppContext'

export default function SyncRoute() {
  const { S, navigateTo } = useApp()

  return (
    <div className="page-pad" style={{ maxWidth: '860px', margin: '0 auto', padding: '28px 24px 60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>Synchronisation auto</h1>
      <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '24px' }}>Import automatique des trades depuis vos plateformes</div>

      <div style={{ ...S.card, padding: '48px 28px', textAlign: 'center', marginBottom: '20px', background: 'linear-gradient(180deg, var(--blue-bg), transparent)' }}>
        <div style={{ fontSize: '56px', marginBottom: '14px' }}>{'🚧'}</div>
        <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Bientôt disponible</div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.5 }}>
          La synchronisation automatique de vos trades via <strong>ProjectX Gateway</strong> et <strong>Rithmic</strong> est en cours d&apos;intégration.
          En attendant, utilisez le <strong>Journal trading</strong> pour saisir vos trades manuellement.
        </div>
        <button onClick={() => navigateTo('journal')} style={{ ...S.btnPrimary, marginTop: '24px' }}>{'📔'} Aller au journal manuel</button>
      </div>

      <div className="stats-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
        <div style={{ ...S.card, padding: '18px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>{'🔌'}</div>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>ProjectX Gateway</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px' }}>Topstep, Tradeify, TPT, MFF, TradeDay, Uprofit</div>
          <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '99px', background: 'var(--amber-bg)', color: 'var(--amber-text)', fontWeight: '600' }}>EN ATTENTE D&apos;API</span>
        </div>
        <div style={{ ...S.card, padding: '18px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>{'📡'}</div>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Rithmic</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px' }}>Apex, Bulenox, Lucid, Earn2Trade, et autres</div>
          <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '99px', background: 'var(--amber-bg)', color: 'var(--amber-text)', fontWeight: '600' }}>EN ATTENTE D&apos;API</span>
        </div>
        <div style={{ ...S.card, padding: '18px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>{'📁'}</div>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Import CSV</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px' }}>Charger un export NinjaTrader / Tradovate</div>
          <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '99px', background: 'var(--surface3)', color: 'var(--text2)', fontWeight: '600' }}>PROCHAINEMENT</span>
        </div>
      </div>
    </div>
  )
}
