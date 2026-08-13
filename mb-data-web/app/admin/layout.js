'use client'
// Layout admin protégé — vérifie que l'user est admin avant d'afficher quoi que ce soit.
// Sidebar de navigation + bouton retour à l'app.

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import QLogoIcon from '../../components/QLogoIcon'
// Emails admins autorisés — liste centralisée dans lib/admins.js
// (doivent matcher les RLS policies Supabase si configurées admin-permissives)
import { isAdmin } from '../../lib/admins'

const C = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  border: 'var(--border)',
  border2: 'var(--border2)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
  red: 'var(--red)',
}

// Icônes minimalistes géométriques (style admin pro, pas d'emoji)
const NAV_ITEMS = [
  { href: '/admin',               label: 'Dashboard',     icon: '◫' },
  { href: '/admin/activity',      label: 'Activité',      icon: '◉' },
  { href: '/admin/stats',         label: 'Statistiques',  icon: '◐' },
  { href: '/admin/users',         label: 'Utilisateurs',  icon: '◊' },
  { href: '/admin/payouts',       label: 'Payouts',       icon: '◈' },
  { href: '/admin/propfirms',     label: 'PropFirms',     icon: '◆' },
  { href: '/admin/announcements', label: 'Annonces',      icon: '◬' },
  { href: '/admin/system',        label: 'Système',       icon: '◇' },
]

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user || null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setUser(session?.user || null)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Pendant le chargement
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg, color: C.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 14, color: C.text3 }}>⏳ Vérification des droits...</div>
      </div>
    )
  }

  // Pas connecté
  if (!user) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg, color: C.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}>
        <div style={{
          maxWidth: 400, padding: 32, textAlign: 'center',
          background: C.surface, borderRadius: 14, border: `1px solid ${C.border2}`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Accès admin requis</h1>
          <p style={{ fontSize: 13, color: C.text2, marginBottom: 20 }}>
            Connecte-toi avec un compte admin pour accéder à cette zone.
          </p>
          <Link href="/app" style={{
            display: 'inline-block', padding: '10px 22px', fontSize: 13, fontWeight: 600,
            borderRadius: 99, background: C.blue, color: '#fff', textDecoration: 'none',
          }}>← Page de connexion</Link>
        </div>
      </div>
    )
  }

  // Connecté mais pas admin
  if (!isAdmin(user.email)) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg, color: C.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}>
        <div style={{
          maxWidth: 400, padding: 32, textAlign: 'center',
          background: C.surface, borderRadius: 14, border: `1px solid ${C.border2}`,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Accès refusé</h1>
          <p style={{ fontSize: 13, color: C.text2, marginBottom: 4 }}>
            Cette zone est réservée aux administrateurs Quantara.
          </p>
          <p style={{ fontSize: 11, color: C.text3, marginBottom: 20, fontFamily: 'monospace' }}>
            Connecté en tant que : {user.email}
          </p>
          <Link href="/app" style={{
            display: 'inline-block', padding: '10px 22px', fontSize: 13, fontWeight: 600,
            borderRadius: 99, background: C.blue, color: '#fff', textDecoration: 'none',
          }}>← Retour à l'app</Link>
        </div>
      </div>
    )
  }

  // ===== Admin authentifié → afficher le layout =====
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: C.surface, borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column',
        padding: '20px 0',
      }}>
        {/* Brand */}
        <Link href="/admin" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 20px 20px', textDecoration: 'none', color: C.text,
          borderBottom: `1px solid ${C.border}`, marginBottom: 14,
        }}>
          <QLogoIcon size={42} color="var(--red)" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em' }}>QUANTARA</div>
            <div style={{ fontSize: 9, color: C.red, fontWeight: 700, letterSpacing: '0.14em', marginTop: 2 }}>ADMIN PANEL</div>
          </div>
        </Link>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                fontSize: 13, fontWeight: active ? 600 : 500,
                color: active ? C.text : C.text2,
                background: active ? 'rgba(45,111,255,0.10)' : 'transparent',
                borderLeft: active ? `2px solid ${C.blue}` : '2px solid transparent',
                textDecoration: 'none', transition: 'background 0.15s',
              }}>
                <span style={{ fontSize: 14, color: active ? C.blueLight : C.text3, width: 18, display: 'inline-block', textAlign: 'center', lineHeight: 1 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer sidebar : user + logout */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.text3, marginBottom: 6 }}>Connecté :</div>
          <div style={{ fontSize: 11, color: C.text2, fontFamily: 'monospace', marginBottom: 10, wordBreak: 'break-all' }}>
            {user.email}
          </div>
          <Link href="/app" style={{
            display: 'block', textAlign: 'center', padding: '8px 12px',
            fontSize: 12, borderRadius: 6, background: C.surface2,
            color: C.text2, textDecoration: 'none', marginBottom: 6,
            border: `1px solid ${C.border}`,
          }}>← Retour à l'app</Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/app')
            }}
            style={{
              width: '100%', padding: '8px 12px',
              fontSize: 12, borderRadius: 6,
              background: 'transparent', color: C.text3,
              border: `1px solid ${C.border}`,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Se déconnecter</button>
        </div>
      </aside>

      {/* Contenu */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
