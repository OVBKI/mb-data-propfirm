'use client'
// Footer avec mesh gradient sophistiqué (radial blobs animés).
// Inspiration : stripe.com, vercel.com.

import { motion } from 'framer-motion'
import Link from 'next/link'

const C = {
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  border: 'rgba(255,255,255,0.07)',
}

export default function MeshGradientFooter() {
  return (
    <footer style={{
      position: 'relative',
      padding: '80px 24px 40px',
      overflow: 'hidden',
      borderTop: `1px solid ${C.border}`,
      marginTop: 60,
    }}>
      {/* Mesh gradient background — 3 blobs qui pulsent en boucle décalée */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6 }}>
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '20%', left: '10%',
            width: 500, height: 500,
            background: `radial-gradient(circle, ${C.blue}40, transparent 60%)`,
            filter: 'blur(80px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 20, -30, 0],
            scale: [1, 0.8, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{
            position: 'absolute',
            top: '40%', right: '15%',
            width: 600, height: 600,
            background: `radial-gradient(circle, ${C.blueLight}30, transparent 60%)`,
            filter: 'blur(100px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, 30, -10, 0],
            y: [0, 30, -10, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          style={{
            position: 'absolute',
            bottom: '-10%', left: '40%',
            width: 500, height: 500,
            background: `radial-gradient(circle, ${C.green}25, transparent 60%)`,
            filter: 'blur(90px)',
          }}
        />
      </div>

      {/* Grain texture overlay (subtle noise pour un look "non-flat") */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      {/* Contenu */}
      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto' }}>
        {/* Brand + tagline */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 30,
          marginBottom: 50,
        }}>
          <div style={{ maxWidth: 320 }}>
            <div style={{
              fontSize: 22, fontWeight: 800, letterSpacing: '0.1em',
              color: C.text, marginBottom: 12,
            }}>QUANTARA</div>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6 }}>
              Le journal de trading des PropFirms futures.<br />
              <strong style={{ color: C.text }}>Track. Analyze. Grow.</strong>
            </p>
          </div>

          {/* Liens */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 40,
          }}>
            {[
              {
                title: 'Produit',
                links: [
                  { label: 'Dashboard', href: '/app' },
                  { label: 'Tarifs', href: '#pricing' },
                  { label: 'Roadmap', href: '#roadmap' },
                ],
              },
              {
                title: 'Légal',
                links: [
                  { label: 'CGU', href: '/legal/cgu' },
                  { label: 'Privacy', href: '/legal/privacy' },
                  { label: 'Imprint', href: '/legal/imprint' },
                ],
              },
              {
                title: 'Contact',
                links: [
                  { label: 'admin@quantara.tech', href: 'mailto:admin@quantara.tech' },
                  { label: 'support@quantara.tech', href: 'mailto:support@quantara.tech' },
                ],
              },
            ].map(group => (
              <div key={group.title}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: C.text3,
                  textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14,
                }}>{group.title}</div>
                {group.links.map(link => (
                  <Link
                    key={link.label}
                    href={link.href}
                    style={{
                      display: 'block',
                      fontSize: 13, color: C.text2,
                      marginBottom: 8,
                      textDecoration: 'none',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = C.text}
                    onMouseLeave={e => e.currentTarget.style.color = C.text2}
                  >{link.label}</Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          paddingTop: 30,
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
        }}>
          <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5 }}>
            © 2026 <strong style={{ color: C.text2 }}>Quantara LLC</strong> · A Texas limited liability company<br />
            Made in Belgium 🇧🇪 · Hosted in 🇺🇸
          </div>
          <div style={{ fontSize: 11, color: C.text3 }}>
            🟢 Tous les systèmes opérationnels
          </div>
        </div>
      </div>
    </footer>
  )
}
