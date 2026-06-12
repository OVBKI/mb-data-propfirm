import "./globals.css";

export const metadata = {
  title: "Fleetly — Logiciel de gestion de flotte de transport",
  description:
    "Pilotez toute votre société de transport : camions, traceurs GPS en temps réel, chauffeurs, entretien, documents et dépenses. Le tout dans une seule application.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
