'use client'
// Composants UI partagés pour toutes les pages /app — design system Quantara.
//
// Import : import { Card, Btn, Stat, Badge, PageHeader, Section } from '@/components/dashboard/ui'
//
// Tous sont stylés inline (cohérent avec le reste du projet) avec les tokens T.

import { T } from './theme'

// ============================================================================
// CARD — surface frosted glass, base de tout container.
// Props : padding (lg|md|sm), hover (bool), glow (bool), as (tag, default 'div')
// ============================================================================
export function Card({
  children,
  padding = 'lg',
  hover = false,
  glow = false,
  style = {},
  className = '',
  ...rest
}) {
  const pad = { sm: 12, md: 16, lg: 20, xl: 24 }[padding] || 20
  return (
    <div
      className={`qt-card ${hover ? 'qt-card-hover' : ''} ${className}`}
      style={{
        background: T.color.surface,
        backdropFilter: T.color.glassBlur,
        WebkitBackdropFilter: T.color.glassBlur,
        border: `1px solid ${T.color.border}`,
        borderRadius: T.radius.lg,
        padding: pad,
        transition: T.transition.base,
        boxShadow: glow ? T.shadow.glow : 'none',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

// ============================================================================
// BTN — boutons cohérents avec landing
// Props : variant (primary|ghost|danger), size (sm|md|lg), iconLeft, iconRight
// ============================================================================
export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  onClick,
  disabled,
  type = 'button',
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '12px 22px', fontSize: 14 },
  }
  const variants = {
    primary: {
      background: T.color.text,
      color: T.color.bg,
      border: '1px solid rgba(0,0,0,0.1)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset',
    },
    ghost: {
      background: 'transparent',
      color: T.color.text,
      border: `1px solid ${T.color.borderStrong}`,
    },
    blue: {
      background: T.color.blue,
      color: '#fff',
      border: 'none',
    },
    danger: {
      background: 'transparent',
      color: T.color.red,
      border: `1px solid rgba(239,68,68,0.3)`,
    },
    subtle: {
      background: 'var(--tint2)',
      color: T.color.text2,
      border: `1px solid ${T.color.border}`,
    },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="qt-btn"
      style={{
        ...sizes[size],
        ...variants[variant],
        fontWeight: 500,
        borderRadius: T.radius.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        textDecoration: 'none',
        transition: T.transition.base,
        ...style,
      }}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
}

// ============================================================================
// STAT — KPI card avec label / valeur / trend
// ============================================================================
export function Stat({ label, value, trend, trendColor, color, mono = true }) {
  return (
    <Card padding="md">
      <div style={{
        fontSize: 10,
        color: T.color.text3,
        fontFamily: T.font.mono,
        letterSpacing: '0.12em',
        marginBottom: 6,
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 22,
        fontWeight: 700,
        color: color || T.color.text,
        fontFamily: mono ? T.font.mono : T.font.sans,
        letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
      {trend && (
        <div style={{
          fontSize: 11,
          color: trendColor || T.color.text2,
          fontFamily: T.font.mono,
          marginTop: 4,
          letterSpacing: '0.05em',
        }}>
          {trend}
        </div>
      )}
    </Card>
  )
}

// ============================================================================
// BADGE — pills de status (OK, WARN, FUNDED, etc.)
// Props : tone (green|red|amber|blue|neutral), children (le texte du badge)
// ============================================================================
export function Badge({ tone = 'neutral', children, dot = false, mono = true, style = {} }) {
  const tones = {
    green:   { color: T.color.green,    bg: T.color.greenSoft,  border: 'var(--green)' },
    red:     { color: T.color.red,      bg: T.color.redSoft,    border: 'rgba(239,68,68,0.4)' },
    amber:   { color: T.color.amber,    bg: T.color.amberSoft,  border: 'var(--amber)' },
    blue:    { color: T.color.blueLight, bg: T.color.blueSoft,  border: T.color.blueRing },
    neutral: { color: T.color.text2,    bg: 'var(--tint2)', border: T.color.border },
  }
  const t = tones[tone] || tones.neutral
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 8px',
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: T.radius.sm,
      color: t.color,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.08em',
      fontFamily: mono ? T.font.mono : T.font.sans,
      textTransform: 'uppercase',
      width: 'fit-content',
      ...style,
    }}>
      {dot && <span style={{
        width: 5, height: 5, borderRadius: '50%', background: t.color,
      }} />}
      {children}
    </span>
  )
}

// ============================================================================
// PAGE HEADER — titre principal de page + sous-titre + actions
// ============================================================================
export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 24,
      marginBottom: 28,
      flexWrap: 'wrap',
    }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && (
          <div style={{
            fontSize: 11,
            color: T.color.blueLight,
            fontFamily: T.font.mono,
            letterSpacing: '0.12em',
            marginBottom: 8,
            textTransform: 'uppercase',
          }}>
            {eyebrow}
          </div>
        )}
        <h1 style={{
          fontSize: 26,
          fontWeight: 700,
          color: T.color.text,
          letterSpacing: '-0.02em',
          margin: 0,
          marginBottom: subtitle ? 6 : 0,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontSize: 14,
            color: T.color.text2,
            margin: 0,
            lineHeight: 1.5,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}>
          {actions}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SECTION — wrapper avec titre + contenu (utilisé pour sub-sections d'une page)
// ============================================================================
export function Section({ title, action, children, style = {} }) {
  return (
    <div style={{ marginBottom: 32, ...style }}>
      {(title || action) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}>
          {title && (
            <h2 style={{
              fontSize: 15,
              fontWeight: 600,
              color: T.color.text,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

// ============================================================================
// LIVE DOT — petit indicateur pulsant pour signaler des données en live
// ============================================================================
export function LiveDot({ color = T.color.green, label }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 10,
      color: T.color.text3,
      fontFamily: T.font.mono,
      letterSpacing: '0.1em',
    }}>
      <span
        className="qt-live-dot"
        style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      {label || 'LIVE'}
      <style>{`
        @keyframes qt-pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .qt-live-dot {
          animation: qt-pulse-dot 1.8s ease-in-out infinite;
        }
      `}</style>
    </span>
  )
}

// ============================================================================
// STYLES GLOBAUX UI — keyframes et hover effects pour les composants
// À importer une fois dans le layout app.
// ============================================================================
export function UIStyles() {
  return (
    <style>{`
      .qt-card-hover:hover {
        border-color: ${T.color.borderHover} !important;
        transform: translateY(-1px);
      }
      .qt-btn {
        transition: transform 0.12s ease, box-shadow 0.2s ease, background 0.2s ease, opacity 0.2s ease !important;
      }
      .qt-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.5) inset;
      }
      .qt-btn:active:not(:disabled) {
        transform: translateY(0);
      }
    `}</style>
  )
}
