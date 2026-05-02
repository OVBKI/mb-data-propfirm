// Logo Quantara — composant SVG réutilisable
// Inspiré du design original : Q stylisé en cercle avec barres ascendantes (graphique)
// et une vague / ribbon traversant le cercle. Dégradé bleu métallique.

export default function Logo({ size = 36, withText = false, textSize, color }) {
  const id = `qg-${size}-${withText ? '1' : '0'}` // gradient id unique par instance
  const idDark = `qgD-${size}-${withText ? '1' : '0'}`

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: withText ? 10 : 0 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(45,111,255,0.35))' }}
      >
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6aa8ff" />
            <stop offset="50%" stopColor="#2d6fff" />
            <stop offset="100%" stopColor="#1a4fc8" />
          </linearGradient>
          <linearGradient id={idDark} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3d7fef" />
            <stop offset="100%" stopColor="#0f3a9e" />
          </linearGradient>
        </defs>

        {/* Anneau du Q */}
        <circle cx="50" cy="50" r="40" stroke={`url(#${id})`} strokeWidth="6" fill="none" />

        {/* Queue du Q (diagonale en bas-droite) */}
        <line
          x1="72" y1="72" x2="88" y2="88"
          stroke={`url(#${id})`} strokeWidth="6" strokeLinecap="round"
        />

        {/* Barres de croissance (graphique ascendant) à l'intérieur du Q */}
        <rect x="34" y="58" width="7" height="14" fill={`url(#${idDark})`} rx="1" />
        <rect x="44" y="49" width="7" height="23" fill={`url(#${idDark})`} rx="1" />
        <rect x="54" y="40" width="7" height="32" fill={`url(#${id})`} rx="1" />
        <rect x="64" y="32" width="7" height="40" fill={`url(#${id})`} rx="1" />

        {/* Ribbon / vague stylisée */}
        <path
          d="M 18 68 Q 50 56 82 76"
          stroke={`url(#${id})`}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>

      {withText && (
        <span style={{
          fontSize: textSize || Math.round(size * 0.5),
          fontWeight: 700,
          letterSpacing: '0.15em',
          color: color || 'var(--text)',
          fontFamily: '"Segoe UI", system-ui, sans-serif',
        }}>
          QUANTARA
        </span>
      )}
    </span>
  )
}
