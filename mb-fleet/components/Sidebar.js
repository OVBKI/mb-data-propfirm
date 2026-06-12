"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { InstallButton } from "@/components/pwa";

const nav = [
  { href: "/app", label: "Tableau de bord", icon: "▣", exact: true },
  { href: "/app/carte", label: "Carte en direct", icon: "◉" },
  { href: "/app/camions", label: "Camions & traceurs", icon: "▤" },
  { href: "/app/chauffeurs", label: "Chauffeurs", icon: "☻" },
  { href: "/app/entretien", label: "Entretien", icon: "⚙" },
  { href: "/app/documents", label: "Documents & dépenses", icon: "❒" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 bg-ink-900 text-slate-300 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={36} />
          <div>
            <span className="block text-white font-display font-bold text-lg leading-none tracking-tight">Fleetly</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Fleet management</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? "bg-brand-500 text-white font-medium shadow-lg shadow-brand-500/20" : "hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="w-5 text-center opacity-80">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10">
        <InstallButton className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-white transition-colors">
          Installer l'app
        </InstallButton>
        <p className="px-1 pt-3 text-xs text-slate-500">© {new Date().getFullYear()} Fleetly</p>
      </div>
    </aside>
  );
}
