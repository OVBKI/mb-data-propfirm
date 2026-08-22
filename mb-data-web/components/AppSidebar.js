'use client'
// components/AppSidebar.js — le rail, repris de la maquette Abyss à l’identique.
//
// La maquette contient TROIS blocs et rien d’autre :
//   .brand   sigle + nom + sous-titre
//   nav      une liste PLATE de liens : glyphe, libellé, puis chevron ou badge
//   .me      la carte d’identité, poussée en bas
//
// Ce qui vivait ici et n’y est plus :
//   • la bascule Futures ⇄ CFD  → Réglages → Apparence (c’est une préférence)
//   • le bouton de repli en rail d’icônes → supprimé, la maquette n’en a pas
//   • Admin, Tutoriel, Export CSV, Déconnexion, Mon profil → sous « Réglages › »,
//     dont la maquette porte justement un chevron
//
// Un chevron signale un sous-menu RÉEL. La maquette en pose cinq ; nous n’en
// gardons que là où il y a vraiment des enfants — un chevron décoratif promet
// une navigation qui n’existe pas.
//
// PROPS : user, profile, onExportCsv, onSignOut, alertsBadgeCount, currentPage,
//   currentHref, onInternalNav, onAfterNav, onShowProfile, onShowTutorial,
//   showLaunchTutorial, showProfileLink, isOpenMobile

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useT } from './LanguageProvider'
import { isAdmin } from '../lib/admins'
import { useApp } from '../app/app/(main)/AppContext'
import QLogoIcon from './QLogoIcon'

// Les glyphes de la maquette, dans son ordre. Ce sont des caractères, pas des
// SVG : c’est ce que la maquette montre, et le rendu reste net à toute taille.
const G = {
  dashboard: '▤', firms: '◈', health: '♡', journal: '▦', trades: '≡',
  heatmaps: '▩', myrules: '◇', rules: '⚖', payouts: '◉', sync: '⟳',
  calendar: '☷', alerts: '▲', settings: '⚙',
}

// Le cadenas est un marqueur d’état, pas un glyphe de navigation : un SVG
// monochrome, qui prend la couleur du texte. L’emoji 🔒 arrivait en couleur et
// criait plus fort que la ligne qu’il désactive.
const LOCK = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm3 8H9V6a3 3 0 0 1 6 0z" />
  </svg>
)

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
  onNewAccount, onNewTrade, onNewPayout,
}) {
  const t = useT()
  const userIsAdmin = isAdmin(user?.email)
  const { marketMode, accts } = useApp()
  const isCfd = marketMode === 'cfd'
  const href = String(currentHref || '')

  // Un groupe s’ouvre tout seul quand la page courante est un de ses enfants —
  // sinon elle resterait cachée derrière un chevron fermé.
  const inJournal = currentPage === 'journal' || href.startsWith('/app/journal')
  const inSettings = href.startsWith('/app/settings') || href.startsWith('/app/profile') || href.startsWith('/app/groups')
  const [open, setOpen] = useState({ journal: inJournal, settings: inSettings })
  const [newMenu, setNewMenu] = useState(false)
  useEffect(() => {
    setOpen(o => ({
      journal: o.journal || inJournal,
      settings: o.settings || inSettings,
    }))
  }, [inJournal, inSettings])

  // Un clic ailleurs ou Échap referme le menu : un panneau qui reste ouvert
  // pendant qu’on navigue recouvre la ligne qu’on essaie d’atteindre.
  useEffect(() => {
    if (!newMenu) return
    function onDown(e) { if (!e.target.closest?.('.qt-new-wrap')) setNewMenu(false) }
    function onKey(e) { if (e.key === 'Escape') setNewMenu(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [newMenu])

  // === La liste, dans l’ordre de la maquette ===
  const items = [
    { g: G.dashboard, label: t('app.sidebar.dashboard'), key: 'dashboard' },
    { g: G.health, label: t('app.sidebar.health'), key: 'health' },
    {
      g: G.journal, label: t('app.sidebar.journalGroup'), group: 'journal',
      children: [
        { label: t('app.sidebar.journalManuel'), key: 'journal' },
        // Journal Sync (Rithmic) + Sync auto API sont futures-only.
        ...(isCfd ? [] : [
          { label: t('app.sidebar.journalSync'), href: '/app/journal-sync' },
          { label: t('app.sidebar.syncApi'), disabled: true, lock: true },
        ]),
      ],
    },
    { g: G.trades, label: t('app.sidebar.trades'), key: 'trades' },
    { g: G.heatmaps, label: t('app.sidebar.heatmaps'), key: 'heatmaps' },
    { g: G.myrules, label: t('app.sidebar.myrules'), key: 'myrules' },
    { g: G.rules, label: t('app.sidebar.rules'), key: 'rules' },
    { g: G.payouts, label: t('app.sidebar.analytics'), key: 'analytics' },
    { g: G.sync, label: t('app.sidebar.syncBroker'), href: '/app/journal-sync/rithmic' },
    { g: G.calendar, label: t('app.sidebar.calendar'), key: 'calendar' },
    { g: G.alerts, label: t('app.sidebar.alerts'), key: 'alerts', badge: alertsBadgeCount },
    {
      g: G.settings, label: t('app.sidebar.settings'), group: 'settings',
      children: [
        { label: t('app.sidebar.settingsGeneral'), href: '/app/settings' },
        { label: t('app.sidebar.myProfile'), href: '/app/profile' },
        userIsAdmin
          ? { label: t('app.sidebar.groups'), href: '/app/groups' }
          : { label: t('app.sidebar.groups'), disabled: true, lock: true },
        ...(userIsAdmin ? [{ label: t('app.sidebar.adminPanel'), href: '/admin', plain: true }] : []),
        ...(showLaunchTutorial && onShowTutorial
          ? [{ label: t('app.sidebar.launchTutorial'), action: onShowTutorial }] : []),
        ...(onExportCsv ? [{ label: t('app.sidebar.exportCsv'), action: onExportCsv }] : []),
        ...(onSignOut ? [{ label: t('app.topbar.logout'), action: onSignOut, danger: true }] : []),
      ],
    },
  ]

  function go(key) {
    if (onInternalNav) onInternalNav(key)
    if (onAfterNav) onAfterNav()
  }

  // Une ligne : glyphe, libellé, puis au plus UN suffixe (chevron ou badge).
  function row(item, cls = 'qt-row') {
    const inner = (
      <>
        {item.g && <i className="qt-g" aria-hidden="true">{item.g}</i>}
        <span className="qt-t">{item.label}</span>
        {item.badge > 0 && <span className="qt-badge">{item.badge}</span>}
        {item.lock && <span className="qt-lock">{LOCK}</span>}
      </>
    )

    if (item.disabled) {
      return <div key={item.label} className={cls + ' off'} aria-disabled="true" title={item.label}>{inner}</div>
    }
    if (item.action) {
      return (
        <button key={item.label} className={cls + (item.danger ? ' danger' : '')}
          onClick={() => { item.action(); if (onAfterNav) onAfterNav() }} title={item.label}>{inner}</button>
      )
    }
    if (item.plain) {
      return <a key={item.label} href={item.href} className={cls} title={item.label}>{inner}</a>
    }
    if (item.href) {
      const on = href === item.href
      return (
        <Link key={item.href} href={item.href} onClick={onAfterNav} title={item.label}
          className={cls + (on ? ' on' : '')}>{inner}</Link>
      )
    }
    const on = currentPage === item.key || href === `/app/${item.key}`
    if (onInternalNav) {
      return (
        <button key={item.key} data-tour={`nav-${item.key}`} title={item.label}
          onClick={() => go(item.key)} className={cls + (on ? ' on' : '')}>{inner}</button>
      )
    }
    return (
      <Link key={item.key} href={`/app/${item.key}`} data-tour={`nav-${item.key}`} onClick={onAfterNav}
        title={item.label} className={cls + (on ? ' on' : '')}>{inner}</Link>
    )
  }

  function group(item) {
    const isOpen = open[item.group]
    const anyChildOn = item.children.some(c => c.href && href === c.href)
    return (
      <div key={item.group} className="qt-grp">
        <button
          className={'qt-row' + (!isOpen && anyChildOn ? ' on' : '')}
          onClick={() => setOpen(o => ({ ...o, [item.group]: !o[item.group] }))}
          aria-expanded={isOpen}
          title={item.label}
        >
          <i className="qt-g" aria-hidden="true">{item.g}</i>
          <span className="qt-t">{item.label}</span>
          <span className={'qt-chev' + (isOpen ? ' open' : '')} aria-hidden="true">›</span>
        </button>
        {isOpen && item.children.map(c => row(c, 'qt-row sub'))}
      </div>
    )
  }

  const profName = profile?.display_name || (profile?.username ? `@${profile.username}` : t('app.sidebar.definePseudo'))
  const initials = (profile?.display_name || profile?.username || user?.email || '?').trim().slice(0, 2).toUpperCase()
  const planName = PLAN_NAMES[profile?.plan] || PLAN_NAMES.free
  const acctCount = Array.isArray(accts) ? accts.length : 0
  const profSub = t(acctCount === 1 ? 'app.sidebar.planLineOne' : 'app.sidebar.planLine')
    .replace('{plan}', planName).replace('{n}', acctCount)

  const Card = showProfileLink ? 'a' : 'button'
  const cardProps = showProfileLink
    ? { href: '/app/profile' }
    : { onClick: onShowProfile, type: 'button' }

  return (
    <nav data-tour="sidebar" className={'app-nav qt-side' + (isOpenMobile ? ' open' : '')}>
      <style>{SIDEBAR_CSS}</style>

      <div className="qt-brand">
        {/* Le vrai logo, pas la lettre. Il est posé SEUL, sans pastille : à
            l'intérieur d'un carré de 42px il ne resterait que 26px utiles, et à
            cette taille les cinq barres du graphique deviennent illisibles. */}
        <span className="qt-mark" aria-hidden="true"><QLogoIcon size={40} /></span>
        <div className="qt-brand-t">
          <b>Quantara</b>
          <span>PropFirm Dashboard</span>
        </div>
      </div>

      {/* La maquette n’a pas de bouton de création — elle ne montre que de la
          navigation. Mais créer un compte, un trade ou un payout était enterré
          dans trois pages différentes. Une ACTION en tête de liste, visuellement
          distincte des destinations : le rail est le seul endroit present sur
          toutes les pages. */}
      <div className="qt-new-wrap">
        <button className="qt-new" onClick={() => setNewMenu(o => !o)} aria-expanded={newMenu} aria-haspopup="menu">
          <i className="qt-g" aria-hidden="true">+</i>
          <span className="qt-t">{t('app.sidebar.new')}</span>
        </button>
        {newMenu && (
          <div className="qt-new-menu" role="menu">
            {[
              [t('app.palette.newAccount'), onNewAccount],
              [t('app.palette.newTrade'), onNewTrade],
              [t('app.palette.newPayout'), onNewPayout],
            ].filter(([, fn]) => fn).map(([label, fn]) => (
              <button key={label} role="menuitem" className="qt-new-item"
                onClick={() => { setNewMenu(false); fn(); if (onAfterNav) onAfterNav() }}>{label}</button>
            ))}
          </div>
        )}
      </div>

      <div className="qt-list">
        {items.map(it => it.group ? group(it) : row(it))}
      </div>

      <Card {...cardProps} className="qt-me" title={profName}>
        <span className="qt-av" aria-hidden="true">{initials}</span>
        <span className="qt-me-t">
          <b style={{ color: profile?.username ? 'var(--text)' : 'var(--blue-light)' }}>{profName}</b>
          <span>{profSub}</span>
        </span>
      </Card>
    </nav>
  )
}

// ⚠️ Dans cette chaîne, même en commentaire, PAS d’apostrophe droite (') ni de
// chevrons (< >). React les échappe côté serveur (&#x27;, &lt;) mais pas côté
// client : le texte du bloc de style ne correspond plus, l’hydratation échoue et
// toute la page repasse en rendu client. L’apostrophe typographique (’) passe.
const SIDEBAR_CSS = `
/* ── Rail ── */
/* Transparent : le halo Abyss (body::before) traverse le rail au lieu de
   s’arrêter à son bord. C’est possible ici parce que le rail est STICKY dans une
   rangée flex — le contenu défile dans la zone principale, à côté, jamais dessous. Rien ne
   peut donc se lire au travers. Seul le filet de droite marque la colonne. */
.app-nav.qt-side{
  width:262px;flex-shrink:0;
  padding:20px 14px 24px;position:sticky;top:0;height:100vh;
  background:transparent;
  border-right:1px solid var(--tint2);
  display:flex;flex-direction:column;gap:4px;overflow:hidden;
}

.qt-brand{display:flex;align-items:center;gap:12px;padding:6px 12px 24px}
.qt-mark{width:42px;height:42px;flex-shrink:0;display:grid;place-items:center}
.qt-brand-t{min-width:0}
.qt-brand-t b{font-size:18px;font-weight:600;letter-spacing:-.01em;display:block;line-height:1.15;color:var(--text)}
.qt-brand-t span{font-size:12.5px;color:var(--text3);white-space:nowrap}

.qt-new-wrap{position:relative;margin-bottom:6px}
.qt-new{display:flex;align-items:center;gap:14px;width:100%;padding:11px 14px;border-radius:11px;
  background:var(--blue-bg);border:1px solid var(--blue-border);color:var(--blue-light);
  font-size:15px;font-weight:600;font-family:inherit;cursor:pointer;text-align:left;white-space:nowrap;
  transition:background .15s}
.qt-new:hover{background:var(--blue);color:var(--text-inverse);border-color:var(--blue)}
.qt-new .qt-g{font-size:17px;font-weight:700;opacity:1}
.qt-new-menu{position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:20;padding:6px;
  border-radius:var(--radius);background:var(--glass-solid);border:1px solid var(--border2);
  box-shadow:var(--shadow-pop);backdrop-filter:blur(18px);display:flex;flex-direction:column;gap:2px}
.qt-new-item{display:block;width:100%;padding:9px 12px;border-radius:9px;border:none;background:transparent;
  color:var(--text2);font-size:13.5px;font-family:inherit;text-align:left;cursor:pointer}
.qt-new-item:hover{background:var(--tint2);color:var(--text)}

.qt-list{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:4px;
  scrollbar-width:thin;scrollbar-color:var(--border2) transparent}
.qt-list::-webkit-scrollbar{width:6px}
.qt-list::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px}
.qt-grp{display:flex;flex-direction:column;gap:4px}

.qt-row{display:flex;align-items:center;gap:14px;width:100%;padding:11px 14px;border-radius:11px;
  color:var(--text2);font-size:15px;font-weight:500;text-decoration:none;font-family:inherit;
  border:none;background:transparent;cursor:pointer;text-align:left;white-space:nowrap;
  transition:background .15s,color .15s}
.qt-row:hover{background:var(--tint2);color:var(--text)}
.qt-row.on{background:var(--tint3);color:var(--text);font-weight:600}
.qt-row.off{opacity:.45;cursor:not-allowed}
.qt-row.off:hover{background:transparent;color:var(--text2)}
/* Un enfant est aligné sur le LIBELLÉ du parent, pas sur son glyphe : le repère
   visuel du groupe est le texte, pas le symbole. */
.qt-row.sub{padding-left:47px;font-size:14px;color:var(--text3)}
.qt-row.sub:hover{color:var(--text2)}
.qt-row.sub.on{color:var(--text)}
/* Après .sub : à spécificité égale la dernière règle gagne, et la déconnexion
   perdait sa couleur en devenant un sous-item. */
.qt-row.danger,.qt-row.sub.danger{color:var(--red-text)}
.qt-row.danger:hover,.qt-row.sub.danger:hover{background:var(--red-bg);color:var(--red-text)}

.qt-g{width:19px;text-align:center;font-style:normal;opacity:.9;flex-shrink:0;font-size:15px;line-height:1}
.qt-t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.qt-chev{font-size:13px;opacity:.4;flex-shrink:0;transition:transform .18s ease}
.qt-chev.open{transform:rotate(90deg)}
.qt-badge{font-family:var(--font-mono),monospace;font-size:11px;padding:1px 8px;border-radius:99px;
  background:var(--red-bg);color:var(--red);flex-shrink:0}
.qt-lock{flex-shrink:0;display:flex;align-items:center;color:var(--text3)}

.qt-me{margin-top:auto;display:flex;align-items:center;gap:11px;padding:11px 12px;border-radius:13px;
  background:var(--tint1);border:1px solid var(--border);text-decoration:none;color:var(--text);
  font-family:inherit;text-align:left;cursor:pointer;width:100%;
  transition:background .15s,border-color .15s}
.qt-me:hover{background:var(--tint2);border-color:var(--border2)}
.qt-av{width:38px;height:38px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;
  background:linear-gradient(140deg,var(--violet),var(--blue));color:var(--bg);font-weight:600;font-size:14px}
.qt-me-t{min-width:0}
.qt-me-t b{font-size:14px;font-weight:600;display:block;line-height:1.2;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qt-me-t span{font-size:12px;color:var(--text3);white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis;display:block}

/* Mobile : le rail devient un tiroir FIXE posé PAR-DESSUS la page. Là, la
   transparence laisserait lire le contenu au travers — il faut un fond et un
   flou, comme le bandeau cookies l’avait déjà montré. */
@media(max-width:1024px){
  .app-nav.qt-side{
    padding:16px 12px;
    background:var(--bar-bg);
    backdrop-filter:blur(26px);-webkit-backdrop-filter:blur(26px);
  }
}
`
