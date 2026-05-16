// Logo Quantara — affiche l'icône PNG fournie avec un effet glow bleu
//
// USAGE :
//   <Logo size={40} />              → logo avec glow par défaut
//   <Logo size={40} glow={false} /> → sans glow
//   <Logo size={40} glow="strong" />→ glow renforcé (pour grands formats)
//
// Place le PNG de l'icône dans :
//   mb-data-web_10/mb-data-web/public/quantara-logo.png

const GLOW_LEVELS = {
  none:   'none',
  // Halo bleu doux + halo plus large + accent white-blue
  normal: 'drop-shadow(0 0 8px rgba(96,165,255,0.85)) drop-shadow(0 0 18px rgba(45,111,255,0.55)) drop-shadow(0 0 32px rgba(45,111,255,0.30)) drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
  strong: 'drop-shadow(0 0 12px rgba(140,190,255,0.95)) drop-shadow(0 0 28px rgba(77,143,255,0.70)) drop-shadow(0 0 50px rgba(45,111,255,0.45)) drop-shadow(0 0 80px rgba(45,111,255,0.22)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
}

export default function Logo({ size = 36, glow = 'normal', style = {} }) {
  const filter = glow === false || glow === 'none' || glow === false
    ? GLOW_LEVELS.none
    : (GLOW_LEVELS[glow] || GLOW_LEVELS.normal)

  return (
    <img
      src="/quantara-logo.png"
      alt="Quantara"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        flexShrink: 0,
        display: 'block',
        filter,
        // Petite animation au mount + GPU acceleration
        transition: 'filter 0.3s ease, transform 0.3s ease',
        ...style,
      }}
    />
  )
}
