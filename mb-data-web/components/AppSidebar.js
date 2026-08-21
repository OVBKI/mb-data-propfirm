'use client'
// components/AppSidebar.js — sidebar partagée (shell /app).
//
// Refonte visuelle "Mission Control" : rail d'icônes repliable ⟷ menu déplié
// avec labels. Toute la logique métier est préservée (props, routes, i18n,
// badge alertes, gating admin/communauté, carte profil, drawer mobile,
// bouton tutoriel, attributs data-tour).
//
// Repli/dépli : géré par un état local persisté en localStorage. Le style
// "déplié" est la base ; le "replié" (rail d'icônes) n'est appliqué qu'en CSS
// desktop (min-width:1025px) — ainsi le drawer mobile affiche toujours les
// labels.
//
// PROPS : voir la version précédente — inchangées.
//   user, profile, alertsBadgeCount, currentPage, currentHref,
//   onInternalNav, onAfterNav, onShowProfile, onShowTutorial,
//   showLaunchTutorial, showProfileLink, isOpenMobile

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useT } from './LanguageProvider'
import { isAdmin } from '../lib/admins'
import { useApp } from '../app/app/(main)/AppContext'

const SECTIONS = ['Vue', 'Trades', 'PropFirm', 'Communaute']

// ── Icônes SVG (Lucide-style) ──
const mk = (paths, extra) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths.map((d, i) => <path key={i} d={d} />)}{extra}
  </svg>
)
const IC = {
  dashboard: mk(['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z']),
  health: mk(['M12 21s-7-4.3-9.3-8.5C1 9 2.6 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.4 0 5 3.5 3.3 7C19 16.7 12 21 12 21z']),
  analytics: mk(['M21 12A9 9 0 1 1 11 3v9z'], <path d="M12 3a9 9 0 0 1 9 9h-9z" />),
  calendar: mk(['M3 5h18v16H3z', 'M3 9h18', 'M8 3v4', 'M16 3v4']),
  journalGroup: mk(['M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z', 'M8 7h8', 'M8 11h6']),
  journal: mk(['M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z', 'M8 7h8', 'M8 11h6']),
  sync: mk(['M3 12a9 9 0 0 1 15-6.7L21 8', 'M21 3v5h-5', 'M21 12a9 9 0 0 1-15 6.7L3 16', 'M3 21v-5h5']),
  plug: mk(['M9 2v6', 'M15 2v6', 'M7 8h10v3a5 5 0 0 1-10 0z', 'M12 16v6']),
  trades: mk(['M7 7v3', 'M7 16v2', 'M17 5v3', 'M17 15v3'], <><rect x="5" y="10" width="4" height="6" rx="1" /><rect x="15" y="8" width="4" height="7" rx="1" /></>),
  heatmaps: mk([], <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  myrules: mk(['M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', 'M9 4h6v3H9z', 'M9 14l2 2 4-4']),
  rules: mk(['M12 3v18', 'M5 21h14', 'M4 7l4-4 4 4', 'M2 11a4 4 0 0 0 8 0', 'M14 7l4-4 4 4', 'M14 11a4 4 0 0 0 8 0']),
  alerts: mk(['M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0']),
  cfd: mk(['M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'], <circle cx="12" cy="12" r="10" />),
  groups: mk(['M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1', 'M22 19v-1a4 4 0 0 0-3-3.9'], <><circle cx="9" cy="8" r="4" /><circle cx="17.5" cy="8" r="3" /></>),
  settings: mk(['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 0 1-4 0 1.6 1.6 0 0 0-2.7-1.1 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 2.6 13a2 2 0 0 1 0-4 1.6 1.6 0 0 0 1.1-2.7 2 2 0 1 1 2.8-2.8A1.6 1.6 0 0 0 9 3.6a2 2 0 0 1 4 0 1.6 1.6 0 0 0 2.7 1.1 2 2 0 1 1 2.8 2.8A1.6 1.6 0 0 0 20.4 11a2 2 0 0 1 0 4z']),
  admin: mk(['M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z', 'M9.5 12.5l1.8 1.8 3.4-3.6']),
  tutorial: mk(['M22 10L12 5 2 10l10 5 10-5z', 'M6 12v5c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-5', 'M22 10v6']),
}
const LOCK = <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm3 8H9V6a3 3 0 0 1 6 0z" /></svg>

export default function AppSidebar({
  user,
  profile,
  onExportCsv,
  onSignOut,
  alertsBadgeCount = 0,
  currentPage,
  currentHref,
  onInternalNav,
  onAfterNav,
  onShowProfile,
  onShowTutorial,
  showLaunchTutorial = false,
  showProfileLink = false,
  isOpenMobile = false,
}) {
  const t = useT()
  const userIsAdmin = isAdmin(user?.email)
  const { marketMode, setMarketMode } = useApp()
  const isCfd = marketMode === 'cfd'

  // Repli/dépli (persisté). Replié par défaut (rail d'icônes).
  const [collapsed, setCollapsed] = useState(true)
  useEffect(() => {
    try { const v = localStorage.getItem('qt_sidebar_collapsed'); if (v !== null) setCollapsed(v === '1') } catch { /* noop */ }
  }, [])
  const toggle = () => setCollapsed(c => {
    const n = !c
    try { localStorage.setItem('qt_sidebar_collapsed', n ? '1' : '0') } catch { /* noop */ }
    return n
  })

  // === Source de vérité : items de nav (icônes + i18n + gating) ===
  const navItems = [
    { key: 'dashboard', ic: IC.dashboard, label: t('app.sidebar.dashboard'), section: 'Vue' },
    { key: 'health', ic: IC.health, label: t('app.sidebar.health'), section: 'Vue' },
    { key: 'analytics', ic: IC.analytics, label: t('app.sidebar.analytics'), section: 'Vue' },
    { key: 'calendar', ic: IC.calendar, label: t('app.sidebar.calendar'), section: 'Vue' },
    { subHeader: true, ic: IC.journalGroup, label: t('app.sidebar.journalGroup'), section: 'Trades' },
    { key: 'journal', ic: IC.journal, label: t('app.sidebar.journalManuel'), section: 'Trades', indent: true },
    // Journal Sync (Rithmic) + Sync API are futures-only — hidden in CFD mode.
    ...(isCfd ? [] : [
      { href: '/app/journal-sync', ic: IC.sync, label: t('app.sidebar.journalSync'), section: 'Trades', indent: true },
      { ic: IC.plug, label: t('app.sidebar.syncApi'), section: 'Trades', indent: true, disabled: true, badgeLabel: LOCK },
    ]),
    { key: 'trades', ic: IC.trades, label: t('app.sidebar.trades'), section: 'Trades' },
    { key: 'heatmaps', ic: IC.heatmaps, label: t('app.sidebar.heatmaps'), section: 'Trades' },
    { key: 'myrules', ic: IC.myrules, label: t('app.sidebar.myrules'), section: 'Trades' },
    { key: 'rules', ic: IC.rules, label: t('app.sidebar.rules'), section: 'PropFirm' },
    { key: 'alerts', ic: IC.alerts, label: t('app.sidebar.alerts'), section: 'PropFirm', badge: alertsBadgeCount },
    userIsAdmin
      ? { href: '/app/groups', ic: IC.groups, label: t('app.sidebar.groups'), section: 'Communaute' }
      : { ic: IC.groups, label: t('app.sidebar.groups'), section: 'Communaute', disabled: true, badgeLabel: LOCK },
  ]

  const SECTION_LABELS = {
    'Vue': t('app.sidebar.sectionVue'),
    'Trades': t('app.sidebar.sectionTrades'),
    'PropFirm': t('app.sidebar.sectionPropFirm'),
    'Communaute': t('app.sidebar.sectionCommunaute'),
  }

  function handleInternalClick(key) {
    if (onInternalNav) onInternalNav(key)
    if (onAfterNav) onAfterNav()
  }

  // Contenu commun d'une ligne (icône + label + badge/lock)
  function rowInner(item) {
    return (
      <>
        <span className="qt-ic">{item.ic}</span>
        <span className="qt-label">{item.label}</span>
        {item.badge > 0 && <span className="qt-badge">{item.badge}</span>}
        {item.badgeLabel && <span className="qt-lock">{item.badgeLabel}</span>}
      </>
    )
  }

  function renderItem(item, idx, section) {
    // Sous-en-tête (groupe Journal) — masqué en mode replié desktop via CSS
    if (item.subHeader) {
      return (
        <div key={`sub-${section}-${idx}`} className="qt-subhdr">
          <span className="qt-ic">{item.ic}</span>
          <span className="qt-label">{item.label}</span>
        </div>
      )
    }

    const cls = 'qt-item' + (item.indent ? ' indent' : '') + (item.disabled ? ' disabled' : '')

    if (item.disabled) {
      return (
        <div key={`dis-${section}-${idx}`} className={cls} title={item.label} aria-disabled="true">
          {rowInner(item)}
        </div>
      )
    }

    if (item.href) {
      const isActive = currentHref === item.href
      return (
        <Link key={item.href} href={item.href} onClick={onAfterNav} title={item.label}
          className={cls + (isActive ? ' active' : '')}>
          {rowInner(item)}
        </Link>
      )
    }

    const isActive = currentPage === item.key || currentHref === `/app/${item.key}`
    if (onInternalNav) {
      return (
        <button key={item.key} data-tour={`nav-${item.key}`} title={item.label}
          onClick={() => handleInternalClick(item.key)} className={cls + (isActive ? ' active' : '')}>
          {rowInner(item)}
        </button>
      )
    }
    return (
      <Link key={item.key} href={`/app/${item.key}`} data-tour={`nav-${item.key}`} onClick={onAfterNav}
        title={item.label} className={cls + (isActive ? ' active' : '')}>
        {rowInner(item)}
      </Link>
    )
  }

  const settingsActive = currentHref === '/app/settings'
  const profName = profile?.display_name || (profile?.username ? `@${profile.username}` : t('app.sidebar.definePseudo'))
  const initials = (profile?.display_name || profile?.username || user?.email || '?').trim().slice(0, 2).toUpperCase()

  return (
    <nav data-tour="sidebar" className={'app-nav qt-side' + (isOpenMobile ? ' open' : '') + (collapsed ? ' qt-collapsed' : '')}>
      <style>{SIDEBAR_CSS}</style>

      {/* Toggle repli/dépli (caché sur mobile via CSS) */}
            {/* Marque en tête du rail — la barre du haut porte la navigation de
          section, pas l'identité (cf. maquette Abyss). */}
      <div className="qt-brand">
        <span className="qt-brand-mark" aria-hidden="true">Q</span>
        <span className="qt-brand-text">
          <b>Quantara</b>
          <em>PropFirm Dashboard</em>
        </span>
      </div>
      <button className="qt-toggle" onClick={toggle} aria-label={collapsed ? 'Déplier le menu' : 'Réduire le menu'} title={collapsed ? 'Déplier' : 'Réduire'}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </button>

      {/* Bascule marché Futures ⇄ CFD — re-contexte toute l'app */}
      <div className="qt-market" role="group" aria-label="Marché">
        <button
          type="button"
          className={'qt-market-seg' + (!isCfd ? ' active' : '')}
          aria-pressed={!isCfd}
          onClick={() => setMarketMode('futures')}
          title="Futures"
        >Futures</button>
        <button
          type="button"
          className={'qt-market-seg' + (isCfd ? ' active' : '')}
          aria-pressed={isCfd}
          onClick={() => setMarketMode('cfd')}
          title="CFD"
        >CFD</button>
      </div>

      {SECTIONS.map(section => (
        <div key={section} className="qt-sec">
          <div className="qt-sec-label nav-section-label">{SECTION_LABELS[section]}</div>
          {navItems.filter(i => i.section === section).map((item, idx) => renderItem(item, idx, section))}
        </div>
      ))}

      <div className="qt-sep" />

      {/* Réglages */}
      <Link href="/app/settings" onClick={onAfterNav} title={t('app.sidebar.settings') || 'Réglages'}
        className={'qt-item' + (settingsActive ? ' active' : '')}>
        <span className="qt-ic">{IC.settings}</span>
        <span className="qt-label">{t('app.sidebar.settings') || 'Réglages'}</span>
      </Link>

      {/* Admin (admins seulement) */}
      {user && userIsAdmin && (
        <a href="/admin" title={t('app.sidebar.adminPanel')} className="qt-item qt-admin">
          <span className="qt-ic">{IC.admin}</span>
          <span className="qt-label">{t('app.sidebar.adminPanel')}</span>
        </a>
      )}

      {/* Tutoriel */}
      {showLaunchTutorial && onShowTutorial && (
        <button onClick={onShowTutorial} title={t('app.sidebar.launchTutorial')} className="qt-item qt-tuto">
          <span className="qt-ic">{IC.tutorial}</span>
          <span className="qt-label">{t('app.sidebar.launchTutorial')}</span>
        </button>
      )}

      {/* Footer profil */}
      <div className="qt-foot">
        {showProfileLink ? (
          <>
            <a href="/app/profile" className="qt-prof" title={profName}>
              <span className="qt-avatar">{initials}</span>
              <span className="qt-prof-info">
                <span className="qt-prof-name" style={{ color: profile?.username ? 'var(--text)' : 'var(--blue-light)' }}>{profName}</span>
                <span className="qt-prof-mail">{user?.email}</span>
              </span>
            </a>
            {onShowProfile && (
              <button onClick={onShowProfile} title={t('app.sidebar.quickEdit')} className="qt-prof-edit">✎</button>
            )}
          </>
        ) : (
          <button onClick={onShowProfile} className="qt-prof" title={profName} style={{ border: 'none', cursor: 'pointer', background: 'transparent', width: '100%' }}>
            <span className="qt-avatar">{initials}</span>
            <span className="qt-prof-info">
              <span className="qt-prof-name" style={{ color: profile?.username ? 'var(--text)' : 'var(--blue-light)' }}>{profName}</span>
              <span className="qt-prof-mail">{user?.email}</span>
            </span>
          </button>
        )}
      </div>

      {/* Actions de compte. Elles vivaient dans la barre globale ; celle-ci a
          disparu (la maquette n'en a pas), et le pied du rail est leur place
          naturelle — juste sous l'identité à laquelle elles s'appliquent. */}
      {(onExportCsv || onSignOut) && (
        <div className="qt-acct">
          {onExportCsv && (
            <button onClick={onExportCsv} className="qt-acct-btn">
              <span className="qt-acct-ic" aria-hidden="true">↓</span>
              <span className="qt-acct-lbl">{t('app.topbar.csvExport')}</span>
            </button>
          )}
          {onSignOut && (
            <button onClick={onSignOut} className="qt-acct-btn">
              <span className="qt-acct-ic" aria-hidden="true">⏻</span>
              <span className="qt-acct-lbl">{t('app.topbar.logout')}</span>
            </button>
          )}
        </div>
      )}
    </nav>
  )
}

const SIDEBAR_CSS = `
/* Marque du rail. Le rail replié n'en garde que le sigle. */
.qt-brand{display:flex;align-items:center;gap:12px;padding:4px 8px 20px}
.qt-brand-mark{width:42px;height:42px;flex-shrink:0;border-radius:13px;display:grid;place-items:center;
  background:linear-gradient(140deg,var(--blue),var(--green));color:var(--bg);font-size:20px;font-weight:700}
.qt-brand-text{min-width:0;display:flex;flex-direction:column}
.qt-brand-text b{font-size:18px;font-weight:600;letter-spacing:-.01em;line-height:1.15;color:var(--text)}
.qt-brand-text em{font-style:normal;font-size:12.5px;color:var(--text3);white-space:nowrap}
@media(min-width:1025px){
  .app-nav.qt-side.qt-collapsed .qt-brand{justify-content:center;padding:4px 0 16px}
  .app-nav.qt-side.qt-collapsed .qt-brand-text{display:none}
}

.app-nav.qt-side{
  width:248px;flex-shrink:0;
  background:var(--bar-bg);backdrop-filter:blur(26px);-webkit-backdrop-filter:blur(26px);
  border-right:1px solid var(--tint2);
  padding:16px 12px;position:sticky;top:0;height:100vh;
  overflow-y:auto;overflow-x:hidden;
  display:flex;flex-direction:column;gap:2px;
  transition:width .22s ease,padding .22s ease;
}
.qt-toggle{align-self:flex-end;width:32px;height:32px;border-radius:var(--radius);border:1px solid var(--border2);background:var(--tint1);color:var(--text2);display:flex;align-items:center;justify-content:center;cursor:pointer;margin-bottom:6px;transition:all .15s}
.qt-toggle:hover{color:var(--text);border-color:var(--blue-border);background:var(--blue-bg)}
.qt-toggle svg{transition:transform .22s ease}
.app-nav.qt-side:not(.qt-collapsed) .qt-toggle svg{transform:rotate(180deg)}

/* Bascule marché Futures ⇄ CFD */
.qt-market{display:flex;gap:3px;padding:4px;margin:2px 0 12px;background:var(--tint1);border:1px solid var(--border2);border-radius:var(--radius)}
.qt-market-seg{flex:1;min-width:0;height:30px;padding:0 8px;border:none;background:transparent;color:var(--text2);font-family:inherit;font-size:12px;font-weight:600;letter-spacing:.01em;border-radius:9px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background .15s,color .15s}
.qt-market-seg:hover{color:var(--text)}
.qt-market-seg.active{background:var(--blue);color:var(--bg);box-shadow:0 4px 14px var(--blue-bg)}

.qt-sec{display:flex;flex-direction:column;gap:1px}
.qt-sec-label{font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--text3);padding:12px 12px 5px}
.qt-subhdr{display:flex;align-items:center;gap:11px;padding:7px 12px 4px;font-size:12px;font-weight:600;color:var(--text2)}

.qt-item{position:relative;display:flex;align-items:center;gap:13px;width:100%;height:42px;padding:0 14px;border-radius:var(--radius);color:var(--text2);font-size:14px;font-weight:500;text-decoration:none;font-family:inherit;border:none;background:transparent;cursor:pointer;text-align:left;transition:background .15s,color .15s;white-space:nowrap}
.qt-item:hover{background:var(--tint2);color:var(--text)}
.qt-item.active{background:var(--tint3);color:var(--text);font-weight:600}
.qt-item.disabled{opacity:.45;cursor:not-allowed}
.qt-item.disabled:hover{background:transparent;color:var(--text2)}
.qt-item.indent{padding-left:24px}
.qt-item.qt-admin{color:var(--red-text)}
.qt-item.qt-admin:hover{background:var(--red-bg)}
.qt-item.qt-tuto{color:var(--blue-light)}
.qt-item.qt-tuto:hover{background:var(--blue-bg)}
.qt-ic{width:20px;height:20px;flex-shrink:0;color:var(--text3);display:flex;align-items:center;justify-content:center}
.qt-item:hover .qt-ic{color:var(--text2)}
.qt-item.active .qt-ic{color:#fff}
.qt-item.qt-admin .qt-ic{color:var(--red-text)}
.qt-item.qt-tuto .qt-ic{color:var(--blue-light)}
.qt-label{overflow:hidden;text-overflow:ellipsis}
.qt-badge{margin-left:auto;background:var(--red-bg);color:var(--red);font-family:var(--font-mono),monospace;font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:99px;min-width:20px;text-align:center}
.qt-lock{margin-left:auto;color:var(--text3);display:flex;align-items:center}
.qt-sep{height:1px;background:var(--border);margin:8px 6px}

.qt-acct{display:flex;gap:6px;padding-top:8px}
.qt-acct-btn{flex:1;min-width:0;display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--radius);
  border:1px solid var(--border);background:var(--tint1);color:var(--text3);font-family:inherit;font-size:12px;
  cursor:pointer;transition:color .15s,border-color .15s}
.qt-acct-btn:hover{color:var(--text2);border-color:var(--border2)}
.qt-acct-ic{flex-shrink:0;font-size:12px}
.qt-acct-lbl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(min-width:1025px){
  .app-nav.qt-side.qt-collapsed .qt-acct{flex-direction:column}
  .app-nav.qt-side.qt-collapsed .qt-acct-lbl{display:none}
  .app-nav.qt-side.qt-collapsed .qt-acct-btn{justify-content:center;padding:8px 0}
}

.qt-foot{margin-top:auto;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;gap:6px}
.qt-prof{flex:1;min-width:0;display:flex;align-items:center;gap:11px;padding:9px;border-radius:var(--radius);text-decoration:none;color:var(--text);transition:background .15s}
.qt-prof:hover{background:var(--blue-bg)}
.qt-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(140deg,var(--blue),var(--green));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:var(--bg);flex-shrink:0;letter-spacing:.02em}
.qt-prof-info{min-width:0;display:flex;flex-direction:column}
.qt-prof-name{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qt-prof-mail{font-size:10px;color:var(--text3);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qt-prof-edit{width:32px;height:32px;flex-shrink:0;border:1px solid var(--border);background:var(--tint1);border-radius:10px;color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px}
.qt-prof-edit:hover{color:var(--text);border-color:var(--blue-light)}

/* === MODE REPLIÉ (rail d'icônes) — desktop uniquement === */
@media(min-width:1025px){
  .app-nav.qt-side.qt-collapsed{width:72px;padding:16px 0;align-items:center}
  .app-nav.qt-side.qt-collapsed .qt-toggle{align-self:center}
  .app-nav.qt-side.qt-collapsed .qt-sec{align-items:center}
  .app-nav.qt-side.qt-collapsed .qt-sec-label,
  .app-nav.qt-side.qt-collapsed .qt-subhdr,
  .app-nav.qt-side.qt-collapsed .qt-label,
  .app-nav.qt-side.qt-collapsed .qt-prof-info,
  .app-nav.qt-side.qt-collapsed .qt-prof-edit{display:none}
  .app-nav.qt-side.qt-collapsed .qt-market{flex-direction:column;width:48px;gap:2px;padding:2px;margin:2px auto 10px}
  .app-nav.qt-side.qt-collapsed .qt-market-seg{height:24px;padding:0 4px;font-size:10px}
  .app-nav.qt-side.qt-collapsed .qt-item{width:46px;height:46px;justify-content:center;padding:0;margin:1px auto;border-radius:var(--radius)}
  .app-nav.qt-side.qt-collapsed .qt-item.indent{padding:0}
  .app-nav.qt-side.qt-collapsed .qt-badge{position:absolute;top:4px;right:5px;margin:0;min-width:15px;padding:0 4px;border:2px solid var(--bg)}
  .app-nav.qt-side.qt-collapsed .qt-lock{position:absolute;top:5px;right:6px;margin:0}
  .app-nav.qt-side.qt-collapsed .qt-sep{width:26px;margin:6px auto}
  .app-nav.qt-side.qt-collapsed .qt-foot{justify-content:center;padding-top:12px}
  .app-nav.qt-side.qt-collapsed .qt-prof{flex:0;justify-content:center;padding:6px}
}

/* Mobile : drawer — toujours déplié, pas de toggle */
@media(max-width:1024px){
  .qt-toggle{display:none}
  .app-nav.qt-side{padding:14px 12px}
}
`
