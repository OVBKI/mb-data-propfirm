// Logo Quantara — affiche l'icône PNG fournie
//
// USAGE :
//   <Logo size={40} />   → carré de 40×40
//
// Place le PNG de l'icône (sans le texte "QUANTARA") dans :
//   mb-data-web_10/mb-data-web/public/quantara-logo.png

export default function Logo({ size = 36 }) {
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
      }}
    />
  )
}
