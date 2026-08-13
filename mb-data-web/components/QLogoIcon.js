// Q Logo Icon — version SVG statique de l'icône Q (sans wordmark, sans animation).
// Utilisé dans topbar, sidebar, et tout endroit qui a besoin du Q seul.
//
// Pour la version animée (landing hero), voir components/landing/AnimatedQLogo.js
//
// Props :
//   - size : largeur/hauteur en px (défaut 32). Composant carré.
//   - color : couleur du Q (défaut bleu clair Quantara).
//             Accepte aussi 'gradient' pour un gradient bleu statique.

// viewBox élargi pour contenir tout le Q : cercle outer + bars + tail/queue qui
// descend vers le bas-droit. Le crop précédent était trop serré et coupait la tail.
const VB = '200 130 620 620'

export default function QLogoIcon({ size = 32, color = 'var(--blue-light)' }) {
  const useGradient = color === 'gradient'
  return (
    <svg
      viewBox={VB}
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {useGradient && (
        <defs>
          <linearGradient id="qIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--blue)" />
            <stop offset="50%" stopColor="var(--blue-light)" />
            <stop offset="100%" stopColor="#7ba9ff" />
          </linearGradient>
        </defs>
      )}
      <g
        transform="translate(0,1024) scale(0.1,-0.1)"
        fill={useGradient ? 'url(#qIconGrad)' : color}
        stroke="none"
      >
        {/* Q outline principal */}
        <path d="M4915 8330 c-664 -36 -1284 -315 -1725 -776 -317 -332 -521 -701 -633 -1149 -57 -229 -72 -363 -72 -650 1 -277 14 -401 66 -605 125 -487 362 -897 733 -1265 426 -423 976 -694 1576 -776 126 -18 536 -18 660 -1 180 25 570 122 570 141 0 3 -31 42 -68 87 -37 44 -130 160 -207 258 l-140 177 -45 -5 c-301 -41 -519 -29 -795 40 -155 39 -268 80 -423 155 -246 118 -446 262 -635 458 -487 505 -679 1147 -546 1816 72 360 269 719 536 976 478 460 1154 645 1800 493 519 -123 944 -445 1211 -918 266 -473 350 -1049 226 -1556 -82 -332 -269 -664 -508 -900 -47 -46 -86 -88 -86 -91 0 -4 62 -58 137 -120 75 -62 195 -169 265 -238 l129 -124 67 73 c241 263 442 578 567 891 317 789 214 1722 -270 2449 -249 374 -571 654 -1008 876 -423 215 -890 311 -1382 284z" />
        {/* Bar chart bars (à l'intérieur du Q) */}
        <path d="M5935 7098 c-88 -68 -175 -134 -192 -146 l-33 -23 0 -1134 0 -1133 118 -62 c64 -34 150 -84 191 -111 40 -28 75 -48 77 -46 2 2 3 628 2 1391 l-3 1387 -160 -123z" />
        <path d="M5385 6553 l-190 -150 -3 -124 c-2 -68 0 -417 3 -776 l7 -651 87 -26 c47 -14 131 -44 186 -66 54 -21 101 -38 102 -36 2 1 2 447 1 990 l-3 988 -190 -149z" />
        <path d="M5035 6147 c-17 -12 -78 -60 -135 -105 -58 -46 -126 -100 -152 -120 l-47 -37 -1 -481 0 -480 153 -18 c83 -9 167 -20 185 -23 l32 -5 0 646 c0 355 -1 646 -2 646 -2 -1 -17 -11 -33 -23z" />
        <path d="M4383 5496 c-87 -68 -165 -132 -173 -141 -11 -14 -14 -61 -12 -238 1 -121 4 -222 6 -224 2 -2 57 3 122 11 66 9 144 17 174 18 l55 3 3 348 c1 191 -2 347 -6 347 -5 0 -81 -56 -169 -124z" />
        <path d="M4009 5084 c-41 -32 -111 -88 -156 -126 l-83 -69 0 -49 c0 -28 3 -50 7 -50 4 0 39 9 77 19 39 11 106 27 148 36 l77 16 3 137 c2 75 3 138 2 140 -1 1 -34 -23 -75 -54z" />
        {/* Curl/ribbon en bas */}
        <path d="M4480 4843 c-80 -5 -263 -32 -334 -49 -50 -13 -277 -83 -283 -88 -1 0 101 -1 225 -1 247 0 305 -8 507 -66 346 -99 655 -284 948 -568 115 -111 238 -259 439 -529 153 -206 218 -284 327 -392 237 -237 443 -350 759 -417 113 -24 149 -27 322 -27 257 -1 404 23 660 106 95 31 95 31 65 44 -16 7 -38 13 -48 14 -59 1 -336 125 -497 222 -217 130 -360 250 -749 631 -267 261 -369 351 -564 498 -423 320 -858 518 -1302 593 -99 17 -327 37 -384 34 -20 -1 -61 -3 -91 -5z" />
      </g>
    </svg>
  )
}
