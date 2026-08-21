'use client'
// components/AppSidebar.js — le rail de navigation (shell /app).
//
// Repris de la maquette Abyss : marque en tête, LISTE PLATE d'items, carte
// d'identité en pied. Les en-têtes de section ont disparu — la maquette n'en a
// pas, et à quatre labels ils coûtaient ~120px de hauteur, ce qui poussait la
// carte de profil hors de l'écran sur un portable.
//
// Ce que la maquette ne montre pas mais qui reste nécessaire :
//   • la bascule Futures ⇄ CFD — elle re-contexte toute l'app
//   • Admin, Tutoriel, Export CSV, Déconnexion
//   • le repli en rail d'icônes (desktop)
// Ils sont là, mais tenus au second plan pour ne pas concurrencer la navigation.
//
// Le groupe Journal se REPLIE derrière un chevron, comme dans la maquette.
// Avant, ses trois enfants étaient toujours dépliés : quatre lignes permanentes
// pour une section qu'on ne visite pas tous les jours.
//
// PROPS : user, profile, onExportCsv, onSignOut, alertsBadgeCount, currentPage,
//   currentHref, onInternalNav, onAfterNav, onShowProfile, onShowTutorial,
//   showLaunchTutorial, showProfileLink, isOpenMobile

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useT } from './LanguageProvider'
import { isAdmin } from '../lib/admins'
import { useApp } from '../app/app/(main)/AppContext'

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
  groups: mk(['M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1', 'M22 19v-1a4 4 0 0 0-3-3.9'], <><circle cx="9" cy="8" r="4" /><circle cx="17.5" cy="8" r="3" /></>),
  settings: mk(['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.6 1.6 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.6 1.6 0 0 0-2.7 1.1 2 2 0 0 1-4 0 1.6 1.6 0 0 0-2.7-1.1 2 2 0 1 1-2.8-2.8A1.6 1.6 0 0 0 2.6 13a2 2 0 0 1 0-4 1.6 1.6 0 0 0 1.1-2.7 2 2 0 1 1 2.8-2.8A1.6 1.6 0 0 0 9 3.6a2 2 0 0 1 4 0 1.6 1.6 0 0 0 2.7 1.1 2 2 0 1 1 2.8 2.8A1.6 1.6 0 0 0 20.4 11a2 2 0 0 1 0 4z']),
  admin: mk(['M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z', 'M9.5 12.5l1.8 1.8 3.4-3.6']),
  tutorial: mk(['M22 10L12 5 2 10l10 5 10-5z', 'M6 12v5c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-5', 'M22 10v6']),
}
const LOCK = <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm3 8H9V6a3 3 0 0 1 6 0z" /></svg>

// Le nom du palier est une marque, pas une phrase : il ne se traduit pas.
const PLAN_NAMES = { free: 'Free', pro: 'Pro', elite: 'Elite', lifetime: 'Lifetime', business: 'Business' }

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
  const { marketMode, setMarketMode, accts } = useApp()
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

  // Le groupe Journal s'ouvre tout seul quand on est dans une de ses pages —
  // sinon la page courante serait cachée derrière un chevron fermé.
  const inJournal = currentPage === 'journal' || String(currentHref || '').startsWith('/app/journal')
  const [journalOpen, setJournalOpen] = useState(inJournal)
  useEffect(() => { if (inJournal) setJournalOpen(true) }, [inJournal])

  // === Source de vérité : la liste plate, dans l'ordre de la maquette ===
  const navItems = [
    { key: 'dashboard', ic: IC.dashboard, label: t('app.sidebar.dashboard') },
    { key: 'health', ic: IC.health, label: t('app.sidebar.health') },
    { key: 'analytics', ic: IC.analytics, label: t('app.sidebar.analytics') },
    {
      group: 'journal', ic: IC.journalGroup, label: t('app.sidebar.journalGroup'),
      children: [
        { key: 'journal', ic: IC.journal, label: t('app.sidebar.journalManuel') },
        // Journal Sync (Rithmic) + Sync API sont futures-only.
        ...(isCfd ? [] : [
          { href: '/app/journal-sync', ic: IC.sync, label: t('app.sidebar.journalSync') },
          { ic: IC.plug, label: t('app.sidebar.syncApi'), disabled: true, badgeLabel: LOCK },
        ]),
      ],
    },
    { key: 'trades', ic: IC.trades, label: t('app.sidebar.trades') },
    { key: 'heatmaps', ic: IC.heatmaps, label: t('app.sidebar.heatmaps') },
    { key: 'myrules', ic: IC.myrules, label: t('app.sidebar.myrules') },
    { key: 'rules', ic: IC.rules, label: t('app.sidebar.rules') },
    { key: 'calendar', ic: IC.calendar, label: t('app.sidebar.calendar') },
    { key: 'alerts', ic: IC.alerts, label: t('app.sidebar.alerts'), badge: alertsBadgeCount },
    userIsAdmin
      ? { href: '/app/groups', ic: IC.groups, label: t('app.sidebar.groups') }
      : { ic: IC.groups, label: t('app.sidebar.groups'), disabled: true, badgeLabel: LOCK },
  ]

  function handleInternalClick(key) {
    if (onInternalNav) onInternalNav(key)
    if (onAfterNav) onAfterNav()
  }

  // Contenu commun d'une ligne (icône + label + badge/cadenas)
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

  function renderItem(item, idx, extraCls = '') {
    const cls = 'qt-item' + extraCls + (item.disabled ? ' disabled' : '')

    if (item.disabled) {
      return (
        <div key={`dis-${idx}-${item.label}`} className={cls} title={item.label} aria-disabled="true">
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

  // Un groupe repliable. Le chevron est le seul de la barre : il indique un
  // sous-menu réel, jamais une décoration.
  function renderGroup(item, idx) {
    return (
      <div key={`grp-${item.group}`} className="qt-group">
        <button
          className={'qt-item qt-grp-head' + (inJournal && !journalOpen ? ' active' : '')}
          onClick={() => setJournalOpen(o => !o)}
          aria-expanded={journalOpen}
          title={item.label}
        >
          <span className="qt-ic">{item.ic}</span>
          <span className="qt-label">{item.label}</span>
          <span className={'qt-chev' + (journalOpen ? ' open' : '')} aria-hidden="true">›</span>
        </button>
        {journalOpen && item.children.map((c, i) => renderItem(c, `${idx}-${i}`, ' indent'))}
      </div>
    )
  }

  const settingsActive = currentHref === '/app/settings'
  const profName = profile?.display_name || (profile?.username ? `@${profile.username}` : t('app.sidebar.definePseudo'))
  const initials = (profile?.display_name || profile?.username || user?.email || '?').trim().slice(0, 2).toUpperCase()

  // Sous-titre de la carte d'identité : le palier et le nombre de comptes.
  // L'e-mail y vivait — il est déjà connu de l'utilisateur et n'apprend rien.
  const planName = PLAN_NAMES[profile?.plan] || PLAN_NAMES.free
  const acctCount = Array.isArray(accts) ? accts.length : 0
  const profSub = t(acctCount === 1 ? 'app.sidebar.planLineOne' : 'app.sidebar.planLine')
    .replace('{plan}', planName).replace('{n}', acctCount)

  return (
    <nav data-tour="sidebar" className={'app-nav qt-side' + (isOpenMobile ? ' open' : '') + (collapsed ? ' qt-collapsed' : '')}>
      <style>{SIDEBAR_CSS}</style>

      {/* Marque en tête du rail — la barre de page porte la navigation de
          section, pas l'identité (cf. maquette Abyss). Le bouton de repli est
          DANS cette ligne : isolé, il flottait au milieu du vide. */}
      <div className="qt-brand">
        <span className="qt-brand-mark" aria-hidden="true">Q</span>
        <span className="qt-brand-text">
          <b>Quantara</b>
          <em>PropFirm Dashboard</em>
        </span>
        <button className="qt-toggle" onClick={toggle}
          aria-label={collapsed ? t('app.sidebar.expand') : t('app.sidebar.collapse')}
          title={collapsed ? t('app.sidebar.expand') : t('app.sidebar.collapse')}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>

      {/* Bascule marché Futures ⇄ CFD — re-contexte toute l'app. Absente de la
          maquette, donc tenue discrète : c'est un contexte, pas une destination. */}
      <div className="qt-market" role="group" aria-label={t('app.sidebar.market')}>
        {/* Deux libellés, un seul visible : dans le rail replié « Futures » ne
            tient pas et se faisait couper en « Futur… ». */}
        <button type="button" className={'qt-market-seg' + (!isCfd ? ' active' : '')}
          aria-pressed={!isCfd} onClick={() => setMarketMode('futures')} title="Futures">
          <span className="qt-mk-long">Futures</span><span className="qt-mk-short" aria-hidden="true">FUT</span>
        </button>
        <button type="button" className={'qt-market-seg' + (isCfd ? ' active' : '')}
          aria-pressed={isCfd} onClick={() => setMarketMode('cfd')} title="CFD">CFD</button>
      </div>

      {/* Seule cette zone défile. La marque et la carte d'identité restent en
          place : sur un portable, quinze items poussaient le pied hors de vue et
          la déconnexion devenait introuvable sans faire défiler le rail. */}
      <div className="qt-nav">
        {navItems.map((item, idx) => item.group ? renderGroup(item, idx) : renderItem(item, idx))}

        <div className="qt-sep" />

        <Link href="/app/settings" onClick={onAfterNav} title={t('app.sidebar.settings')}
          className={'qt-item' + (settingsActive ? ' active' : '')}>
          <span className="qt-ic">{IC.settings}</span>
          <span className="qt-label">{t('app.sidebar.settings')}</span>
        </Link>

        {user && userIsAdmin && (
          <a href="/admin" title={t('app.sidebar.adminPanel')} className="qt-item qt-admin">
            <span className="qt-ic">{IC.admin}</span>
            <span className="qt-label">{t('app.sidebar.adminPanel')}</span>
          </a>
        )}

        {showLaunchTutorial && onShowTutorial && (
          <button onClick={onShowTutorial} title={t('app.sidebar.launchTutorial')} className="qt-item qt-tuto">
            <span className="qt-ic">{IC.tutorial}</span>
            <span className="qt-label">{t('app.sidebar.launchTutorial')}</span>
          </button>
        )}
      </div>

      {/* Carte d'identité en pied, comme la maquette. Export CSV et déconnexion
          y sont réduits à deux icônes : ce sont des actions rares, elles n'ont
          pas à peser autant qu'une destination. */}
      <div className="qt-me">
        {showProfileLink ? (
          <a href="/app/profile" className="qt-prof" title={profName}>
            <span className="qt-avatar">{initials}</span>
            <span className="qt-prof-info">
              <span className="qt-prof-name" style={{ color: profile?.username ? 'var(--text)' : 'var(--blue-light)' }}>{profName}</span>
              <span className="qt-prof-sub">{profSub}</span>
            </span>
          </a>
        ) : (
          <button onClick={onShowProfile} className="qt-prof" title={profName}>
            <span className="qt-avatar">{initials}</span>
            <span className="qt-prof-info">
              <span className="qt-prof-name" style={{ color: profile?.username ? 'var(--text)' : 'var(--blue-light)' }}>{profName}</span>
              <span className="qt-prof-sub">{profSub}</span>
            </span>
          </button>
        )}

        <div className="qt-me-acts">
          {showProfileLink && onShowProfile && (
            <button onClick={onShowProfile} className="qt-icon-btn" title={t('app.sidebar.quickEdit')} aria-label={t('app.sidebar.quickEdit')}>✎</button>
          )}
          {onExportCsv && (
            <button onClick={onExportCsv} className="qt-icon-btn" title={t('app.topbar.csvExport')} aria-label={t('app.topbar.csvExport')}>↓</button>
          )}
          {onSignOut && (
            <button onClick={onSignOut} className="qt-icon-btn" title={t('app.topbar.logout')} aria-label={t('app.topbar.logout')}>⏻</button>
          )}
        </div>
      </div>
    </nav>
  )
}

// ⚠️ PAS d’apostrophe droite (') dans cette chaîne, même en commentaire. React
// l’échappe en &#x27; côté serveur mais pas côté client : le texte du <style> ne
// correspond plus, l’hydratation échoue et TOUTE la page repasse en rendu
// client. L’apostrophe typographique (’) passe sans être échappée.
const SIDEBAR_CSS = `
.app-nav.qt-side{
  width:262px;flex-shrink:0;
  background:var(--bar-bg);backdrop-filter:blur(26px);-webkit-backdrop-filter:blur(26px);
  border-right:1px solid var(--tint2);
  padding:20px 14px 18px;position:sticky;top:0;height:100vh;
  overflow:hidden;
  display:flex;flex-direction:column;gap:4px;
  transition:width .22s ease,padding .22s ease;
}

/* Marque. Le rail replié n’en garde que le sigle. */
.qt-brand{display:flex;align-items:center;gap:12px;padding:6px 6px 20px}
.qt-brand-mark{width:42px;height:42px;flex-shrink:0;border-radius:13px;display:grid;place-items:center;
  background:linear-gradient(140deg,var(--blue),var(--green));color:var(--bg);font-size:20px;font-weight:700}
.qt-brand-text{min-width:0;flex:1;display:flex;flex-direction:column}
.qt-brand-text b{font-size:18px;font-weight:600;letter-spacing:-.01em;line-height:1.15;color:var(--text)}
.qt-brand-text em{font-style:normal;font-size:12.5px;color:var(--text3);white-space:nowrap}
.qt-toggle{width:26px;height:26px;flex-shrink:0;border-radius:8px;border:1px solid transparent;background:transparent;
  color:var(--text3);display:grid;place-items:center;cursor:pointer;transition:all .15s}
.qt-toggle:hover{color:var(--text);background:var(--tint2)}
.qt-toggle svg{transition:transform .22s ease}
.app-nav.qt-side:not(.qt-collapsed) .qt-toggle svg{transform:rotate(180deg)}

/* Bascule marché Futures ⇄ CFD */
.qt-market{display:flex;gap:2px;padding:3px;margin:0 0 12px;background:var(--tint1);border:1px solid var(--border2);border-radius:11px}
.qt-market-seg{flex:1;min-width:0;height:28px;padding:0 8px;border:none;background:transparent;color:var(--text3);
  font-family:inherit;font-size:11.5px;font-weight:600;letter-spacing:.02em;border-radius:9px;cursor:pointer;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background .15s,color .15s}
.qt-market-seg:hover{color:var(--text2)}
.qt-market-seg.active{background:var(--blue-bg);color:var(--blue-light)}
.qt-mk-short{display:none}

.qt-nav{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:4px;
  scrollbar-width:thin;scrollbar-color:var(--border2) transparent}
.qt-nav::-webkit-scrollbar{width:6px}
.qt-nav::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px}
.qt-nav::-webkit-scrollbar-track{background:transparent}
.qt-group{display:flex;flex-direction:column;gap:4px}

.qt-item{position:relative;display:flex;align-items:center;gap:14px;width:100%;
  padding:11px 14px;border-radius:11px;color:var(--text2);font-size:15px;font-weight:500;
  text-decoration:none;font-family:inherit;border:none;background:transparent;cursor:pointer;
  text-align:left;transition:background .15s,color .15s;white-space:nowrap}
.qt-item:hover{background:var(--tint2);color:var(--text)}
.qt-item.active{background:var(--tint3);color:var(--text);font-weight:600}
.qt-item.disabled{opacity:.45;cursor:not-allowed}
.qt-item.disabled:hover{background:transparent;color:var(--text2)}
.qt-item.indent{padding-left:28px;font-size:14px}
.qt-item.qt-admin{color:var(--red-text)}
.qt-item.qt-admin:hover{background:var(--red-bg)}
.qt-item.qt-tuto{color:var(--blue-light)}
.qt-item.qt-tuto:hover{background:var(--blue-bg)}
.qt-ic{width:19px;height:20px;flex-shrink:0;color:var(--text3);display:flex;align-items:center;justify-content:center}
.qt-item:hover .qt-ic{color:var(--text2)}
/* Jeton, pas #fff : en thème clair l’état actif est un fond CLAIR. */
.qt-item.active .qt-ic{color:var(--text)}
.qt-item.qt-admin .qt-ic{color:var(--red-text)}
.qt-item.qt-tuto .qt-ic{color:var(--blue-light)}
.qt-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.qt-chev{flex-shrink:0;font-size:14px;color:var(--text3);opacity:.5;transition:transform .18s ease}
.qt-chev.open{transform:rotate(90deg)}
.qt-badge{flex-shrink:0;background:var(--red-bg);color:var(--red);font-family:var(--font-mono),monospace;
  font-size:11px;font-weight:600;padding:1px 8px;border-radius:99px;min-width:20px;text-align:center}
.qt-lock{flex-shrink:0;color:var(--text3);display:flex;align-items:center}
.qt-sep{height:1px;background:var(--border);margin:10px 6px}

/* Carte d’identité en pied */
.qt-me{margin-top:auto;padding-top:14px;display:flex;flex-direction:column;gap:6px}
.qt-prof{min-width:0;display:flex;align-items:center;gap:11px;padding:10px 11px;border-radius:13px;
  background:var(--tint1);border:1px solid var(--border);text-decoration:none;color:var(--text);
  cursor:pointer;font-family:inherit;text-align:left;transition:background .15s,border-color .15s}
.qt-prof:hover{background:var(--tint2);border-color:var(--border2)}
.qt-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(140deg,var(--violet),var(--blue));
  display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:var(--bg);
  flex-shrink:0;letter-spacing:.02em}
.qt-prof-info{min-width:0;display:flex;flex-direction:column}
.qt-prof-name{font-size:14px;font-weight:600;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qt-prof-sub{font-size:12px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qt-me-acts{display:flex;gap:4px;justify-content:flex-end}
.qt-icon-btn{width:28px;height:28px;border:1px solid transparent;background:transparent;border-radius:8px;
  color:var(--text3);cursor:pointer;display:grid;place-items:center;font-size:12px;font-family:inherit;
  transition:color .15s,background .15s}
.qt-icon-btn:hover{color:var(--text);background:var(--tint2)}

/* === MODE REPLIÉ (rail d’icônes) — desktop uniquement === */
@media(min-width:1025px){
  .app-nav.qt-side.qt-collapsed{width:74px;padding:20px 0 18px;align-items:center}
  .app-nav.qt-side.qt-collapsed .qt-brand{justify-content:center;padding:6px 0 16px;gap:0}
  .app-nav.qt-side.qt-collapsed .qt-brand-text{display:none}
  .app-nav.qt-side.qt-collapsed .qt-toggle{position:absolute;top:14px;right:8px;width:22px;height:22px}
  .app-nav.qt-side.qt-collapsed .qt-nav,
  .app-nav.qt-side.qt-collapsed .qt-group{align-items:center}
  .app-nav.qt-side.qt-collapsed .qt-label,
  .app-nav.qt-side.qt-collapsed .qt-chev,
  .app-nav.qt-side.qt-collapsed .qt-prof-info{display:none}
  .app-nav.qt-side.qt-collapsed .qt-market{flex-direction:column;width:48px;gap:2px;padding:2px;margin:0 auto 10px}
  .app-nav.qt-side.qt-collapsed .qt-market-seg{height:24px;padding:0 4px;font-size:10px}
  .app-nav.qt-side.qt-collapsed .qt-mk-long{display:none}
  .app-nav.qt-side.qt-collapsed .qt-mk-short{display:inline}
  .app-nav.qt-side.qt-collapsed .qt-item{width:46px;height:46px;justify-content:center;padding:0;margin:0 auto;border-radius:13px}
  .app-nav.qt-side.qt-collapsed .qt-item.indent{padding:0}
  .app-nav.qt-side.qt-collapsed .qt-badge{position:absolute;top:3px;right:3px;min-width:15px;padding:0 4px;border:2px solid var(--bg)}
  .app-nav.qt-side.qt-collapsed .qt-lock{position:absolute;top:5px;right:6px}
  .app-nav.qt-side.qt-collapsed .qt-sep{width:26px;margin:8px auto}
  .app-nav.qt-side.qt-collapsed .qt-me{align-items:center;gap:6px;padding-top:12px}
  .app-nav.qt-side.qt-collapsed .qt-prof{justify-content:center;padding:6px;background:transparent;border-color:transparent}
  /* Trois boutons de 28px ne tiennent pas sur 74px : ils passaient à la ligne. */
  .app-nav.qt-side.qt-collapsed .qt-me-acts{flex-direction:column;align-items:center}
}

/* Mobile : drawer — toujours déplié, pas de bouton de repli */
@media(max-width:1024px){
  .qt-toggle{display:none}
  .app-nav.qt-side{padding:16px 12px}
}
`
