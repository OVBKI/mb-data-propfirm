'use client'
// components/dashboard/LayoutShareDialog.js — sauvegarder, partager, reprendre.
//
// Exporte la disposition des quatre sous-sections en JSON, et en réimporte une.
// Sert à garder une configuration avant d'expérimenter, à la passer d'un compte
// à un autre, ou à repartir de celle de quelqu'un.

import { useRef, useState } from 'react'
import { useT } from '../LanguageProvider'
import { useDialog } from '../useDialog'

export default function LayoutShareDialog({ onClose, getText, onImport }) {
  const t = useT()
  const dialogRef = useDialog({ open: true, onClose })
  const [tab, setTab] = useState('export')
  const [paste, setPaste] = useState('')
  const [status, setStatus] = useState(null)   // { ok, message }
  const exported = useRef(null)

  // On calcule l'export une seule fois à l'ouverture : le recalculer à chaque
  // frappe dans l'onglet import ferait sauter la sélection de l'utilisateur.
  if (exported.current === null) exported.current = getText()

  async function copy() {
    try {
      await navigator.clipboard.writeText(exported.current)
      setStatus({ ok: true, message: t('app.widgets.copied') })
    } catch {
      // Presse-papiers refusé (contexte non sécurisé, permission) : le texte
      // reste sélectionnable à la main, on ne bloque pas l'utilisateur.
      setStatus({ ok: false, message: t('app.widgets.copyManual') })
    }
  }

  function doImport() {
    const res = onImport(paste)
    if (res.ok) {
      setStatus({ ok: true, message: t('app.widgets.importOk') })
      setPaste('')
    } else {
      setStatus({
        ok: false,
        message: res.error === 'parse' ? t('app.widgets.importBadJson') : t('app.widgets.importBadShape'),
      })
    }
  }

  const tabBtn = (key, label) => (
    <button
      onClick={() => { setTab(key); setStatus(null) }}
      aria-pressed={tab === key}
      style={{
        padding: '8px 14px', fontSize: 13, fontWeight: tab === key ? 600 : 500,
        borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        background: tab === key ? 'var(--tint3)' : 'transparent',
        color: tab === key ? 'var(--text)' : 'var(--text2)',
      }}
    >{label}</button>
  )

  const area = {
    width: '100%', minHeight: 220, resize: 'vertical',
    padding: '12px 14px', fontSize: 12,
    fontFamily: 'var(--font-mono), monospace', lineHeight: 1.55,
    borderRadius: 'var(--radius)', border: '1px solid var(--border2)',
    background: 'var(--tint1)', color: 'var(--text2)', outline: 'none',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 900, background: 'var(--overlay)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '9vh 16px 16px',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('app.widgets.share')}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 620, background: 'var(--glass-solid)',
          border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-pop)', padding: '22px 24px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {tabBtn('export', t('app.widgets.exportTitle'))}
          {tabBtn('import', t('app.widgets.importTitle'))}
          <button
            onClick={onClose}
            aria-label={t('app.widgets.close')}
            style={{
              marginLeft: 'auto', width: 32, height: 32, borderRadius: 'var(--radius)',
              border: '1px solid var(--border2)', background: 'var(--tint1)',
              color: 'var(--text2)', cursor: 'pointer', fontSize: 14,
            }}
          >✕</button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.55, margin: 0 }}>
          {tab === 'export' ? t('app.widgets.exportHint') : t('app.widgets.importHint')}
        </p>

        {tab === 'export' ? (
          <>
            <textarea readOnly value={exported.current} style={area}
                      onFocus={e => e.target.select()} spellCheck={false} />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={copy} style={primary}>{t('app.widgets.copy')}</button>
              <Status status={status} />
            </div>
          </>
        ) : (
          <>
            <textarea
              value={paste}
              onChange={e => { setPaste(e.target.value); setStatus(null) }}
              placeholder="{ &quot;version&quot;: 2, &quot;sections&quot;: { … } }"
              style={area}
              spellCheck={false}
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={doImport} disabled={!paste.trim()}
                      style={{ ...primary, opacity: paste.trim() ? 1 : 0.5 }}>
                {t('app.widgets.importDo')}
              </button>
              <Status status={status} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Status({ status }) {
  if (!status) return null
  return (
    <span
      role="status"
      style={{ fontSize: 12.5, color: status.ok ? 'var(--green)' : 'var(--red)' }}
    >{status.message}</span>
  )
}

const primary = {
  padding: '9px 18px', fontSize: 13, fontWeight: 600,
  borderRadius: 'var(--radius)', border: '1px solid transparent',
  background: 'var(--blue)', color: 'var(--text-inverse)',
  cursor: 'pointer', fontFamily: 'inherit', minHeight: 32,
}
