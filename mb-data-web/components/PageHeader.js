'use client'
// Header partagé entre les pages annexes (security, docs, integrations, legal, pricing).
// Sticky avec backdrop blur, logo Quantara à gauche, nav + CTAs + LanguageSwitcher à droite.
// Sur mobile : nav devient un dropdown sous la topbar (toggle via burger).

import Link from 'next/link'
import { useState } from 'react'
import QLogoIcon from './QLogoIcon'
import LanguageSwitcher from './LanguageSwitcher'
import { useT } from './LanguageProvider'

const C = {
  border: 'var(--border)',
  border2: 'var(--border2)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
}

export default function PageHeader({ active }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = useT()

  // NAV_LINKS construit dynamiquement pour récupérer les labels traduits à chaque render.
  const NAV_LINKS = [
    { href: '/compare',      label: t('pages.header.compare'),      key: 'compare' },
    { href: '/integrations', label: t('pages.header.integrations'), key: 'integrations' },
    { href: '/cfd',          label: t('pages.header.cfd'),          key: 'cfd' },
    { href: '/security',     label: t('pages.header.security'),     key: 'security' },
    { href: '/docs',         label: t('pages.header.docs'),         key: 'docs' },
    { href: '/#features',    label: t('pages.header.features'),     key: 'features' },
  ]

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--bar-bg)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div className="lp-nav" style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px', gap: 14,
        }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            textDecoration: 'none', color: C.text, flexShrink: 0,
          }}>
            <QLogoIcon size={50} color="var(--blue-light)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1, letterSpacing: '0.08em' }}>QUANTARA</div>
              <div className="ph-brand-sub" style={{ fontSize: 9, color: C.text3, marginTop: 3, letterSpacing: '0.05em' }}>TRACK · ANALYZE · GROW</div>
            </div>
          </Link>

          {/* Nav desktop */}
          <nav className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {NAV_LINKS.map(link => (
              <Link key={link.key} href={link.href} style={{
                fontSize: 13,
                color: active === link.key ? C.text : C.text2,
                textDecoration: 'none',
                fontWeight: active === link.key ? 600 : 400,
                borderBottom: active === link.key ? `2px solid ${C.blue}` : '2px solid transparent',
                paddingBottom: 4,
                transition: 'color 0.15s',
              }}>{link.label}</Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {/* Language switcher compact — visible desktop ET mobile (sauf très petit) */}
            <span className="ph-lang"><LanguageSwitcher compact /></span>

            {/* CTAs : sur mobile, on cache "Se connecter" pour économiser de la place */}
            <Link href="/app" className="ph-cta-ghost" style={{
              display: 'inline-block', padding: '8px 14px',
              fontSize: 13, fontWeight: 500, borderRadius: 8,
              textDecoration: 'none',
              background: 'transparent', color: C.text,
              border: `1px solid ${C.border2}`,
              whiteSpace: 'nowrap',
            }}>{t('pages.header.login')}</Link>
            <Link href="/auth?mode=signup" style={{
              display: 'inline-block', padding: '8px 16px',
              fontSize: 13, fontWeight: 500, borderRadius: 8,
              textDecoration: 'none',
              background: C.text, color: 'var(--text-inverse)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)',
              whiteSpace: 'nowrap',
            }}>{t('pages.header.cta')} →</Link>

            {/* Burger menu — visible seulement sur mobile */}
            <button
              className="ph-burger"
              aria-label={t('pages.header.menu')}
              onClick={() => setMobileOpen(o => !o)}
              style={{
                display: 'none',  // CSS .ph-burger media query force display flex sur mobile
                alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36,
                background: 'var(--tint1)',
                border: `1px solid ${C.border2}`,
                borderRadius: 8, color: C.text,
                fontSize: 18, cursor: 'pointer', padding: 0,
                marginLeft: 4,
              }}
            >{mobileOpen ? '✕' : '☰'}</button>
          </div>
        </div>

        {/* Menu mobile dropdown (apparaît sous la topbar quand burger toggle) */}
        {mobileOpen && (
          <div className="ph-mobile-menu" style={{
            borderTop: `1px solid ${C.border}`,
            background: 'var(--surface)',
            backdropFilter: 'blur(20px)',
            padding: '8px 0',
          }}>
            {NAV_LINKS.map(link => (
              <Link
                key={link.key}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  padding: '14px 24px',
                  fontSize: 14, fontWeight: active === link.key ? 600 : 500,
                  color: active === link.key ? C.blueLight : C.text2,
                  textDecoration: 'none',
                  background: active === link.key ? 'var(--blue-bg)' : 'transparent',
                  borderLeft: `3px solid ${active === link.key ? C.blue : 'transparent'}`,
                }}
              >{link.label}</Link>
            ))}
          </div>
        )}
      </header>

      {/* Styles responsive */}
      <style>{`
        @media (max-width: 768px) {
          .ph-burger { display: inline-flex !important; }
          .ph-brand-sub { display: none; }
          .ph-cta-ghost { display: none !important; }
        }
        @media (max-width: 420px) {
          .ph-lang { display: none; }
          .lp-nav { padding: 12px 14px !important; gap: 8px !important; }
        }
      `}</style>
    </>
  )
}
