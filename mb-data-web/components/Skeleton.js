'use client'
// Composants Skeleton réutilisables — placeholders animés pendant le loading.
// Évite le flash blanc / le saut de layout typique des chargements.
//
// Usages :
//   <Skeleton width="100%" height={20} />              // ligne
//   <Skeleton circle width={40} height={40} />         // cercle (avatar)
//   <Skeleton.Text lines={3} />                        // bloc de texte
//   <Skeleton.Card />                                  // carte complète
//   <Skeleton.AppShell />                              // shell complet de /app

// ⚠️ `surface3` était figé sur '#222637', une valeur de l'ancienne palette. Le
// shimmer est un dégradé surface2 → surface3 → surface2 : en thème CLAIR, le
// reflet devenait un bloc bleu-gris SOMBRE balayant des placeholders pâles. Et
// comme ce composant porte l'état de chargement de TOUTES les pages de données,
// le défaut se voyait partout à la fois.
const C = {
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  surface3: 'var(--surface3)',
  border: 'var(--border)',
  bg: 'var(--bg)',
}

// Base skeleton — bloc animé avec gradient shimmer
export default function Skeleton({
  width = '100%', height = 16, circle = false,
  style = {}, className = '',
}) {
  return (
    <span
      className={`quantara-skeleton ${className}`.trim()}
      style={{
        display: 'inline-block',
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: circle ? '50%' : 6,
        background: `linear-gradient(90deg, ${C.surface2} 0%, ${C.surface3} 50%, ${C.surface2} 100%)`,
        backgroundSize: '200% 100%',
        animation: 'qSkelShimmer 1.4s ease-in-out infinite',
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {/* Anim CSS injectée via styled-jsx au 1er rendu */}
      <style jsx global>{`
        @keyframes qSkelShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </span>
  )
}

// Bloc de texte multi-lignes
Skeleton.Text = function SkeletonText({ lines = 3, gap = 8 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} height={12} />
      ))}
    </div>
  )
}

// Carte placeholder (titre + valeur)
Skeleton.Card = function SkeletonCard({ height = 90 }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 10,
      minHeight: height,
    }}>
      <Skeleton width={80} height={10} />
      <Skeleton width="60%" height={20} />
    </div>
  )
}

// Stat card row (5 cards horizontales) — celle qu'on a en haut du dashboard
Skeleton.StatsRow = function SkeletonStatsRow({ count = 5 }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 12,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton.Card key={i} />
      ))}
    </div>
  )
}

// Shell complet de l'app pendant le tout 1er load (avant que user soit détecté)
// Affiche : top bar + sidebar + zone contenu
Skeleton.AppShell = function SkeletonAppShell() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Top bar */}
      <div style={{
        height: 48, background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
      }}>
        <Skeleton circle width={32} height={32} />
        <Skeleton width={100} height={14} />
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 48px)' }}>
        {/* Sidebar */}
        <div style={{
          width: 220, background: C.surface,
          borderRight: `1px solid ${C.border}`,
          padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={32} />
          ))}
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, padding: 28 }}>
          <Skeleton width={200} height={26} style={{ marginBottom: 20 }} />
          <Skeleton.StatsRow count={5} />
          <div style={{ marginTop: 24 }}>
            <Skeleton width="100%" height={180} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Liste de N éléments (firms grid)
Skeleton.Grid = function SkeletonGrid({ count = 6, minWidth = 340, height = 240 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}px, 1fr))`,
      gap: 16,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 18, height,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Skeleton circle width={36} height={36} />
            <div style={{ flex: 1 }}>
              <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton width="40%" height={10} />
            </div>
          </div>
          <Skeleton width="100%" height={50} />
          <Skeleton.Text lines={3} />
        </div>
      ))}
    </div>
  )
}

// Table skeleton (pour journal trades)
Skeleton.Table = function SkeletonTable({ rows = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          padding: '12px 14px', background: C.surface2, borderRadius: 8,
          display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12, alignItems: 'center',
        }}>
          <Skeleton width="50%" height={12} />
          <Skeleton width="70%" height={12} />
          <Skeleton width={60} height={14} />
        </div>
      ))}
    </div>
  )
}
