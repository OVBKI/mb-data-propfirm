// Logo Fleetly — marque "F / signal GPS" en SVG (scalable, net partout).
// `mark` = juste l'icône ; sinon icône + texte "Fleetly".

export function LogoMark({ size = 36, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Fleetly"
    >
      <defs>
        <linearGradient id="fleetly-g" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2f6bf0" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#fleetly-g)" />
      {/* "F" stylisé évoquant la route / le mouvement */}
      <path
        d="M16 14h17a1 1 0 0 1 0 7H16v-7Z"
        fill="white"
      />
      <path
        d="M16 23h12a1 1 0 0 1 0 7H16v-7Z"
        fill="white"
        opacity="0.92"
      />
      <rect x="16" y="14" width="6.5" height="22" rx="2" fill="white" />
      {/* point "signal / GPS live" */}
      <circle cx="35.5" cy="32.5" r="3.2" fill="white" />
      <circle cx="35.5" cy="32.5" r="6" stroke="white" strokeOpacity="0.5" strokeWidth="1.4" />
    </svg>
  );
}

export default function Logo({ size = 36, dark = false, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span
        className={`font-display font-bold tracking-tight leading-none ${dark ? "text-white" : "text-ink-900"}`}
        style={{ fontSize: size * 0.55 }}
      >
        Fleetly
      </span>
    </span>
  );
}
