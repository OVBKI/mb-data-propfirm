// Manifeste PWA — permet d'installer Fleetly comme une app
// sur iOS, Android et Windows (depuis le navigateur).
export default function manifest() {
  return {
    name: "Fleetly — Gestion de flotte",
    short_name: "Fleetly",
    description:
      "Pilotez toute votre société de transport : camions, traceurs GPS, chauffeurs, entretien, documents et dépenses.",
    // L'app installée s'ouvre directement sur le tableau de bord.
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f6f8fb",
    theme_color: "#2f6bf0",
    lang: "fr",
    categories: ["business", "productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Carte en direct", url: "/app/carte" },
      { name: "Camions", url: "/app/camions" },
      { name: "Chauffeurs", url: "/app/chauffeurs" },
    ],
  };
}
