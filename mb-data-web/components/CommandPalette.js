'use client'
// components/CommandPalette.js — la recherche globale (⌘K) de la barre du haut.
//
// Cherche dans les firmes, les comptes et les pages. Sélection au clavier
// (↑ ↓ Entrée, Échap pour fermer) autant qu'à la souris : une palette de
// commandes qu'il faut attraper à la souris n'a pas d'intérêt.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useT } from './LanguageProvider'
import { useDialog } from './useDialog'

// On réutilise les libellés du rail (app.sidebar.*) au lieu d'en dupliquer un
// second jeu : deux listes de traductions finiraient par diverger.
const PAGES = [
  { href: '/app/dashboard', key: 'app.sidebar.dashboard' },
  { href: '/app/analytics', key: 'app.sidebar.analytics' },
  { href: '/app/journal',   key: 'app.sidebar.journalManuel' },
  { href: '/app/trades',    key: 'app.sidebar.trades' },
  { href: '/app/heatmaps',  key: 'app.sidebar.heatmaps' },
  { href: '/app/health',    key: 'app.sidebar.health' },
  { href: '/app/calendar',  key: 'app.sidebar.calendar' },
  { href: '/app/myrules',   key: 'app.sidebar.myrules' },
  { href: '/app/rules',     key: 'app.sidebar.rules' },
  { href: '/app/alerts',    key: 'app.sidebar.alerts' },
  { href: '/app/groups',    key: 'app.sidebar.groups' },
  { href: '/app/settings',  key: 'app.sidebar.settings' },
]

// Les CRÉATIONS. La palette ne savait que naviguer ; or « nouveau trade » est
// exactement le genre de chose qu'on tape plutôt que de chercher où cliquer.
// Elles remontent en tête : chercher « trade » doit proposer d'en créer un
// AVANT de proposer la page qui les liste.
const ACTIONS = [
  { id: 'new-account', key: 'app.palette.newAccount', words: 'compte propfirm challenge account firm' },
  { id: 'new-trade',   key: 'app.palette.newTrade',   words: 'trade journal entry saisie' },
  { id: 'new-payout',  key: 'app.palette.newPayout',  words: 'payout retrait paiement withdrawal' },
]

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function CommandPalette({
  open, onOpen, onClose, firms = [], accountLabel, onPickFirm, onPickAccount, onNavigate, onAction,
}) {
  const t = useT()
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)
  const dialogRef = useDialog({ open, onClose })

  // Raccourci global. Posé ici plutôt que dans le layout pour que le composant
  // reste autonome : on le monte, le raccourci existe.
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        open ? onClose() : onOpen?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpen, onClose])

  useEffect(() => {
    if (!open) { setQ(''); setCursor(0); return }
    // Le focus part sur le champ : la palette s'utilise au clavier de bout en bout.
    const id = setTimeout(() => inputRef.current?.focus(), 40)
    return () => clearTimeout(id)
  }, [open])

  const results = useMemo(() => {
    const nq = norm(q)
    const out = []
    for (const a of ACTIONS) {
      const label = t(a.key)
      if (!nq || norm(label).includes(nq) || norm(a.words).includes(nq)) {
        out.push({ kind: 'action', id: a.id, label, sub: t('app.palette.actionHint') })
      }
    }
    for (const f of firms) {
      if (!nq || norm(f.name).includes(nq)) {
        out.push({ kind: 'firm', id: f.id, label: f.name, sub: `${(f.accounts || []).length} ${t('app.dashboard.accountsLabel')}` })
      }
      for (const a of f.accounts || []) {
        const label = accountLabel ? accountLabel(a) : (a.name || a.id)
        if (nq && !norm(label).includes(nq) && !norm(f.name).includes(nq)) continue
        out.push({ kind: 'account', id: a.id, firmId: f.id, label, sub: `${f.name} · ${a.status}` })
      }
    }
    for (const p of PAGES) {
      const label = t(p.key)
      if (!nq || norm(label).includes(nq)) out.push({ kind: 'page', id: p.href, label, sub: p.href })
    }
    return out.slice(0, 24)
  }, [q, firms, accountLabel, t])

  // Le curseur doit rester dans les bornes quand la liste rétrécit sous la frappe.
  useEffect(() => { setCursor(c => Math.min(c, Math.max(0, results.length - 1))) }, [results.length])

  if (!open) return null

  function pick(r) {
    if (!r) return
    if (r.kind === 'action') onAction?.(r.id)
    else if (r.kind === 'firm') onPickFirm?.(r.id)
    else if (r.kind === 'account') onPickAccount?.(r.firmId, r.id)
    else onNavigate?.(r.id)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(results.length - 1, c + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(0, c - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); pick(results[cursor]) }
  }

  const ICON = { action: '+', firm: '◈', account: '▤', page: '→' }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 900, background: 'var(--overlay)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '12vh 16px 16px',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('app.topbar.search')}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
        style={{
          width: '100%', maxWidth: 620, background: 'var(--glass-solid)',
          border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-pop)', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <span aria-hidden="true" style={{ color: 'var(--text3)', fontSize: 16 }}>⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={e => { setQ(e.target.value); setCursor(0) }}
            placeholder={t('app.topbar.searchPlaceholder')}
            style={{
              flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: 15, fontFamily: 'inherit',
            }}
          />
          <kbd style={{
            fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: 'var(--text3)',
            background: 'var(--tint2)', padding: '3px 7px', borderRadius: 6,
          }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: '52vh', overflowY: 'auto', padding: 8 }}>
          {results.length === 0 && (
            <div style={{ padding: '26px 12px', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
              {t('app.topbar.searchEmpty')}
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.kind}-${r.id}`}
              onClick={() => pick(r)}
              onMouseEnter={() => setCursor(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 13, width: '100%',
                padding: '11px 12px', borderRadius: 'var(--radius)', border: 'none',
                textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                background: i === cursor ? 'var(--tint3)' : 'transparent',
                color: 'var(--text)',
              }}
            >
              <span aria-hidden="true" style={{
                width: 30, height: 30, flexShrink: 0, borderRadius: 9, display: 'grid', placeItems: 'center',
                background: 'var(--tint2)', color: 'var(--blue)', fontSize: 13,
              }}>{ICON[r.kind]}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.label}
                </span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.sub}
                </span>
              </span>
              {i === cursor && (
                <kbd style={{
                  fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: 'var(--text3)',
                  background: 'var(--tint2)', padding: '2px 6px', borderRadius: 5, flexShrink: 0,
                }}>↵</kbd>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
