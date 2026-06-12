import "./globals.css";
import { RegisterSW } from "@/components/pwa";

export const metadata = {
  title: "Fleetly — Logiciel de gestion de flotte de transport",
  description:
    "Pilotez toute votre société de transport : camions, traceurs GPS en temps réel, chauffeurs, entretien, documents et dépenses. Le tout dans une seule application.",
  applicationName: "Fleetly",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fleetly",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#2f6bf0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
