'use client'
// components/AppSidebar.js — sidebar partagée entre /app/page.js et /app/journal-sync/view/page.js
// (et toute future page qui veut le même shell).
//
// PROPS :
//   user              — objet user Supabase auth (pour email + admin check)
//   profile           — { username, display_name } pour l'affichage carte profil
//   alertsBadgeCount  — nombre d'alertes actives (badge rouge sur "Alertes")
//
//   currentPage       — string | undefined — clé interne active (ex: 'dashboard')
//   currentHref       — string | undefined — pathname actif (ex: '/app/journal-sync')
//
//   onInternalNav     — (key) => void — callback si la nav interne doit être un button onClick
//                       (utilisé par /app/page.js pour setPage). Sinon → <Link href="/app/{key}">.
//   onAfterNav        — () => void — appelé après chaque nav (ex: fermer mobile drawer)
//
//   onShowProfile     — () => void — clic sur la carte profil (footer) OU bouton quickEdit
//   onShowTutorial    — () => void — clic sur "Lancer le tutoriel" (si showLaunchTutorial=true)
//
//   showLaunchTutorial — boolean — afficher le bouton tutoriel (généralement true sur /app)
//   showProfileLink    — boolean — split layout : lien vers /app/profile + bouton quickEdit
//                        si false → bouton unique qui appelle onShowProfile
//   isOpenMobile       — boolean — état du drawer mobile (classe CSS .open)

import Link from 'next/link'
import { useT } from './LanguageProvider'
import { isAdmin } from '../lib/admins'

const SECTIONS = ['Vue', 'Trades', 'PropFirm', 'Communaute']

export default function AppSidebar({
  user,
  profile,
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

  // === Source of truth : définition unique des items de nav ===
  const navItems = [
    // Vue d'ensemble
    { key: 'dashboard', icon: '◫', label: t('app.sidebar.dashboard'), section: 'Vue' },
    { key: 'health',    icon: '♡', label: t('app.sidebar.health'),    section: 'Vue' },
    { key: 'analytics', icon: '◐', label: t('app.sidebar.analytics'), section: 'Vue' },
    { key: 'calendar',  icon: '◳', label: t('app.sidebar.calendar'),  section: 'Vue' },
    // Mes Trades — sous-groupe Journal
    { subHeader: true, icon: '☰', label: t('app.sidebar.journalGroup'), section: 'Trades' },
    { key: 'journal',            label: t('app.sidebar.journalManuel'), section: 'Trades', indent: true },
    { href: '/app/journal-sync', label: t('app.sidebar.journalSync'),   section: 'Trades', indent: true },
    {                            label: t('app.sidebar.syncApi'),       section: 'Trades', indent: true, disabled: true, badgeLabel: '🔒' },
    // Mes Trades — autres items
    { key: 'trades',   icon: '⊞', label: t('app.sidebar.trades'),   section: 'Trades' },
    { key: 'heatmaps', icon: '▦', label: t('app.sidebar.heatmaps'), section: 'Trades' },
    { key: 'myrules',  icon: '⊡', label: t('app.sidebar.myrules'),  section: 'Trades' },
    // PropFirms
    { key: 'rules',  icon: '◊', label: t('app.sidebar.rules'),  section: 'PropFirm' },
    { key: 'alerts', icon: '◉', label: t('app.sidebar.alerts'), section: 'PropFirm', badge: alertsBadgeCount },
    // Communauté (Phase 3 réseau social — mai 2026)
    { href: '/app/groups', icon: '◈', label: t('app.sidebar.groups'), section: 'Communaute' },
  ]

  const SECTION_LABELS = {
    'Vue':         t('app.sidebar.sectionVue'),
    'Trades':      t('app.sidebar.sectionTrades'),
    'PropFirm':    t('app.sidebar.sectionPropFirm'),
    'Communaute':  t('app.sidebar.sectionCommunaute'),
  }

  function handleInternalClick(key) {
    if (onInternalNav) onInternalNav(key)
    if (onAfterNav) onAfterNav()
  }

  // Helper : icône + label + badge (utilisé pour les items internes)
  function renderItemContent(item, isActive) {
    return (
      <>
        {item.icon && (
          <span style={{
            fontSize: 14,
            color: isActive ? 'var(--blue-light)' : 'var(--text3)',
            width: 18, display: 'inline-block', textAlign: 'center', lineHeight: 1,
          }}>{item.icon}</span>
        )}
        {item.label}
        {item.badge > 0 && (
          <span style={{
            marginLeft: 'auto', background: 'var(--red)', color: '#fff',
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
          }}>{item.badge}</span>
        )}
      </>
    )
  }

  return (
    <nav
      data-tour="sidebar"
      className={'app-nav' + (isOpenMobile ? ' open' : '')}
      style={{
        width: 210, flexShrink: 0,
        background: 'rgba(13,15,20,0.65)',
        backdropFilter: 'blur(26px)', WebkitBackdropFilter: 'blur(26px)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        padding: '18px 0',
        position: 'sticky', top: 52,
        height: 'calc(100vh - 52px)',
        overflowY: 'auto',
      }}
    >
      {SECTIONS.map(section => (
        <div key={section}>
          <div className="nav-section-label" style={{
            padding: '12px 18px 6px',
            fontSize: 10, fontWeight: 700,
            color: 'var(--text3)',
            textTransform: 'uppercase', letterSpacing: '0.14em',
          }}>{SECTION_LABELS[section]}</div>

          {navItems.filter(i => i.section === section).map((item, idx) => {
            // === SUB-HEADER (label de groupe non cliquable) ===
            if (item.subHeader) {
              return (
                <div key={`sub-${section}-${idx}`} style={{
                  padding: '8px 18px 4px',
                  fontSize: 12, fontWeight: 600, color: 'var(--text2)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  letterSpacing: '0.01em',
                }}>
                  <span style={{
                    fontSize: 13, color: 'var(--text3)', width: 18,
                    textAlign: 'center', lineHeight: 1,
                  }}>{item.icon}</span>
                  {item.label}
                </div>
              )
            }

            const padL = item.indent ? 36 : 18
            const fontS = item.indent ? 12 : 13

            // === DISABLED (feature à venir) ===
            if (item.disabled) {
              return (
                <div key={`dis-${section}-${idx}`} style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: `8px 18px 8px ${padL}px`,
                  width: '100%',
                  color: 'var(--text3)', fontSize: fontS, fontWeight: 500,
                  opacity: 0.5, cursor: 'not-allowed',
                  borderLeft: '2px solid transparent',
                  fontFamily: 'inherit',
                }} title="Bientôt disponible">
                  {item.icon && (
                    <span style={{
                      fontSize: 14, color: 'var(--text3)', width: 18,
                      display: 'inline-block', textAlign: 'center', lineHeight: 1,
                    }}>{item.icon}</span>
                  )}
                  {item.label}
                  {item.badgeLabel && (
                    <span style={{
                      marginLeft: 'auto', background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text3)', fontSize: 9, fontWeight: 700,
                      padding: '2px 7px', borderRadius: 99, letterSpacing: '0.08em',
                    }}>{item.badgeLabel}</span>
                  )}
                </div>
              )
            }

            // === EXTERNAL href (autre route Next.js) ===
            if (item.href) {
              const isActive = currentHref === item.href
              return (
                <Link key={item.href} href={item.href} onClick={onAfterNav} className="qt-nav-item" style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: `9px 18px 9px ${padL}px`,
                  width: '100%',
                  background: isActive ? 'rgba(45,111,255,0.12)' : 'transparent',
                  color: isActive ? 'var(--blue-light)' : 'var(--text2)',
                  fontSize: fontS, fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none',
                  borderLeft: `2px solid ${isActive ? 'var(--blue)' : 'transparent'}`,
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}>
                  {item.icon && (
                    <span style={{
                      fontSize: 14, color: isActive ? 'var(--blue-light)' : 'var(--text3)',
                      width: 18, display: 'inline-block', textAlign: 'center', lineHeight: 1,
                    }}>{item.icon}</span>
                  )}
                  {item.label}
                  {item.badgeLabel && (
                    <span style={{
                      marginLeft: 'auto', background: 'rgba(45,111,255,0.15)',
                      color: 'var(--blue-light)', fontSize: 9, fontWeight: 700,
                      padding: '2px 7px', borderRadius: 99, letterSpacing: '0.08em',
                    }}>{item.badgeLabel}</span>
                  )}
                </Link>
              )
            }

            // === INTERNAL key (Link or setPage callback) ===
            const isActive = currentPage === item.key || currentHref === `/app/${item.key}`
            const commonStyle = {
              display: 'flex', alignItems: 'center', gap: 11,
              padding: `9px 18px 9px ${padL}px`,
              width: '100%',
              background: isActive ? 'rgba(45,111,255,0.12)' : 'transparent',
              color: isActive ? 'var(--blue-light)' : 'var(--text2)',
              fontSize: fontS, fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              borderLeft: `2px solid ${isActive ? 'var(--blue)' : 'transparent'}`,
              transition: 'all 0.15s', fontFamily: 'inherit',
            }

            // Cas 1 : callback fourni → button onClick (ex: setPage dans /app/page.js)
            if (onInternalNav) {
              return (
                <button
                  key={item.key}
                  data-tour={`nav-${item.key}`}
                  onClick={() => handleInternalClick(item.key)}
                  className="qt-nav-item"
                  style={{ ...commonStyle, border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  {renderItemContent(item, isActive)}
                </button>
              )
            }

            // Cas 2 : pas de callback → Link vers /app/{key} (App Router)
            return (
              <Link
                key={item.key}
                href={`/app/${item.key}`}
                data-tour={`nav-${item.key}`}
                onClick={onAfterNav}
                className="qt-nav-item"
                style={commonStyle}
              >
                {renderItemContent(item, isActive)}
              </Link>
            )
          })}
        </div>
      ))}

      {/* === Settings link === */}
      <div style={{ padding: '8px 12px', marginTop: 12, borderTop: '1px solid var(--border)' }}>
        <Link
          href="/app/settings"
          onClick={onAfterNav}
          className="qt-nav-item"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            background: currentHref === '/app/settings' ? 'rgba(45,111,255,0.12)' : 'rgba(255,255,255,0.025)',
            border: `1px solid ${currentHref === '/app/settings' ? 'rgba(45,111,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
            color: currentHref === '/app/settings' ? 'var(--blue-light)' : 'var(--text2)',
            fontSize: 12, fontWeight: currentHref === '/app/settings' ? 600 : 500,
            textDecoration: 'none', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>{'⚙️'}</span>
          {t('app.sidebar.settings') || 'Réglages'}
        </Link>
      </div>

      {/* === Admin panel (visible uniquement pour admins) === */}
      {user && isAdmin(user.email) && (
        <div style={{ padding: '8px 12px', marginTop: 12, borderTop: '1px solid var(--border)' }}>
          <a href="/admin" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            background: 'rgba(232,80,74,0.08)',
            border: '1px solid rgba(232,80,74,0.25)',
            color: 'var(--red-text)', fontSize: 12, fontWeight: 600,
            textDecoration: 'none',
          }}>
            {t('app.sidebar.adminPanel')}
          </a>
        </div>
      )}

      {/* === Bouton "Lancer le tutoriel" (optionnel) === */}
      {showLaunchTutorial && onShowTutorial && (
        <div style={{ padding: '8px 12px', marginTop: 12 }}>
          <button
            onClick={onShowTutorial}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', width: '100%',
              background: 'rgba(45,111,255,0.08)',
              border: '1px solid rgba(45,111,255,0.22)',
              borderRadius: 8,
              color: 'var(--blue-light)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(45,111,255,0.14)'
              e.currentTarget.style.borderColor = 'rgba(45,111,255,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(45,111,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(45,111,255,0.22)'
            }}
          >
            <span>🎓</span> {t('app.sidebar.launchTutorial')}
          </button>
        </div>
      )}

      {/* === Footer : carte profil === */}
      <div style={{
        position: 'absolute', bottom: 12, left: 0, right: 0,
        padding: '0 12px', display: 'flex', gap: 6,
      }}>
        {showProfileLink ? (
          // Layout split : lien vers /app/profile + bouton quickEdit
          <>
            <a
              href="/app/profile"
              className="qt-profile-btn"
              style={{
                flex: 1, padding: '9px 11px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, cursor: 'pointer',
                textAlign: 'left', color: 'var(--text)',
                fontFamily: 'inherit', transition: 'all 0.15s',
                overflow: 'hidden', textDecoration: 'none', display: 'block',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(45,111,255,0.08)'
                e.currentTarget.style.borderColor = 'rgba(45,111,255,0.25)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              }}
            >
              <div style={{
                fontSize: 12, fontWeight: 600,
                color: profile?.username ? 'var(--text)' : 'var(--blue-light)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {profile?.display_name || (profile?.username ? `@${profile.username}` : t('app.sidebar.definePseudo'))}
              </div>
              <div style={{
                fontSize: 10, color: 'var(--text3)', marginTop: 2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}>{user?.email}</div>
            </a>
            {onShowProfile && (
              <button
                onClick={onShowProfile}
                title={t('app.sidebar.quickEdit')}
                style={{
                  width: 36, padding: '9px 0',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 8, cursor: 'pointer',
                  color: 'var(--text2)', fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit',
                }}
              >✎</button>
            )}
          </>
        ) : (
          // Layout simple : 1 carte = onShowProfile
          <button
            onClick={onShowProfile}
            style={{
              width: '100%', padding: '9px 11px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, cursor: 'pointer',
              textAlign: 'left', color: 'var(--text)',
              fontFamily: 'inherit', transition: 'all 0.15s',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(45,111,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(45,111,255,0.25)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
            }}
          >
            <div style={{
              fontSize: 12, fontWeight: 600,
              color: profile?.username ? 'var(--text)' : 'var(--blue-light)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {profile?.display_name || (profile?.username ? `@${profile.username}` : t('app.sidebar.definePseudo'))}
            </div>
            <div style={{
              fontSize: 10, color: 'var(--text3)', marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}>{user?.email}</div>
          </button>
        )}
      </div>
    </nav>
  )
}
