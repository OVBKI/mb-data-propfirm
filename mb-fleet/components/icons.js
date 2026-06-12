// Jeu d'icônes SVG (style Lucide) — trait fin, viewBox 24x24, couleur via currentColor.
// Remplace les emojis pour un rendu "produit pro".

function Svg({ children, size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const TruckIcon = (p) => (
  <Svg {...p}>
    <path d="M14 18V6a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1" />
    <path d="M14 9h4l3 3v5a1 1 0 0 1-1 1h-1" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
    <path d="M9 18h6" />
  </Svg>
);

export const RouteIcon = (p) => (
  <Svg {...p}>
    <circle cx="6" cy="19" r="2" />
    <circle cx="18" cy="5" r="2" />
    <path d="M8 19h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h2" />
  </Svg>
);

export const MapPinIcon = (p) => (
  <Svg {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);

export const WrenchIcon = (p) => (
  <Svg {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.2l-6 6a1.4 1.4 0 0 0 2 2l6-6a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.3-2.3 2.5-2.5Z" />
  </Svg>
);

export const FileIcon = (p) => (
  <Svg {...p}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
    <path d="M14 3v6h6" />
    <path d="M8 13h8M8 17h6" />
  </Svg>
);

export const UsersIcon = (p) => (
  <Svg {...p}>
    <path d="M16 19v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 19v-2a4 4 0 0 0-3-3.9" />
  </Svg>
);

export const BellIcon = (p) => (
  <Svg {...p}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </Svg>
);

export const EuroIcon = (p) => (
  <Svg {...p}>
    <path d="M14 6a6 6 0 1 0 0 12" />
    <path d="M5 10h7M5 14h7" />
  </Svg>
);

export const TrendUpIcon = (p) => (
  <Svg {...p}>
    <path d="M22 7 13.5 15.5l-5-5L2 17" />
    <path d="M16 7h6v6" />
  </Svg>
);

export const TrendDownIcon = (p) => (
  <Svg {...p}>
    <path d="M22 17 13.5 8.5l-5 5L2 7" />
    <path d="M16 17h6v-6" />
  </Svg>
);

export const AlertIcon = (p) => (
  <Svg {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </Svg>
);

export const CheckIcon = (p) => (
  <Svg {...p}>
    <path d="M21.8 10A10 10 0 1 1 16 3.3" />
    <path d="m9 11 3 3L22 4" />
  </Svg>
);

export const GaugeIcon = (p) => (
  <Svg {...p}>
    <path d="M12 14 8 10" />
    <path d="M3.3 17a9 9 0 1 1 17.4 0" />
  </Svg>
);

export const ArrowRightIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const CalendarIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

export const ClockIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const ChevronLeftIcon = (p) => (
  <Svg {...p}><path d="M15 18l-6-6 6-6" /></Svg>
);

export const ChevronRightIcon = (p) => (
  <Svg {...p}><path d="M9 18l6-6-6-6" /></Svg>
);

export const PackageIcon = (p) => (
  <Svg {...p}>
    <path d="M16.5 9.4 7.5 4.2" />
    <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="M3.3 7 12 12l8.7-5M12 22V12" />
  </Svg>
);
