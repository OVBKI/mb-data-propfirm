import "./globals.css";
import Sidebar from "../components/Sidebar";
import DemoBanner from "../components/DemoBanner";

export const metadata = {
  title: "Fleetly — Gestion de flotte de transport",
  description: "Gérez vos camions, traceurs GPS, chauffeurs, entretien, documents et dépenses.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <div className="flex">
          <Sidebar />
          <div className="flex-1 min-w-0 min-h-screen flex flex-col">
            <DemoBanner />
            <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
