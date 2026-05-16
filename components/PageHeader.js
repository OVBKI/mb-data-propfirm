// Header simplifié partagé entre les pages annexes (security, docs, integrations, legal)
// Sticky avec backdrop blur, logo Quantara à gauche, retour landing + CTA à droite.

import Link from 'next/link'
import QLogoIcon from './QLogoIcon'

const C = {
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
}

export default function PageHeader({ active }) {
  const navLinks = [
    { href: '/integrations', label: 'PropFirms', key: 'integrations' },
    { href: '/security',     label: 'Sécurité',  key: 'security' },
    { href: '/docs',         label: 'Docs',      key: 'docs' },
    { href: '/#features',    label: 'Fonctionnalités', key: 'features' },
  ]

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(13,15,20,0.85)', backdropFilter: 'blur(12px)',
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
          <QLogoIcon size={34} color="#4d8fff" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1, letterSpacing: '0.08em' }}>QUANTARA</div>
            <div style={{ fontSize: 9, color: C.text3, marginTop: 3, letterSpacing: '0.05em' }}>TRACK · ANALYZE · GROW</div>
          </div>
        </Link>

        <nav className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {navLinks.map(link => (
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Link href="/app" style={{
            display: 'inline-block', padding: '8px 16px',
            fontSize: 13, fontWeight: 500, borderRadius: 8,
            textDecoration: 'none',
            background: 'transparent', color: C.text,
            border: `1px solid ${C.border2}`,
          }}>Se connecter</Link>
          <Link href="/app" style={{
            display: 'inline-block', padding: '8px 16px',
            fontSize: 13, fontWeight: 500, borderRadius: 8,
            textDecoration: 'none',
            background: C.text, color: '#0a0c10',
            boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)',
          }}>Démarrer →</Link>
        </div>
      </div>
    </header>
  )
}
