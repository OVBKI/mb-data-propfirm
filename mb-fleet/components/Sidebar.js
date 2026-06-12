"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Tableau de bord", icon: "▣" },
  { href: "/carte", label: "Carte en direct", icon: "◉" },
  { href: "/camions", label: "Camions & traceurs", icon: "▤" },
  { href: "/chauffeurs", label: "Chauffeurs", icon: "☻" },
  { href: "/entretien", label: "Entretien", icon: "⚙" },
  { href: "/documents", label: "Documents & dépenses", icon: "❒" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 bg-ink-900 text-slate-300 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-signal-500 text-white text-lg font-display font-bold shadow-lg shadow-brand-500/30">F</span>
          <div>
            <span className="block text-white font-display font-bold text-lg leading-none tracking-tight">Fleetly</span>
            <span className="block text-[11px] text-slate-400 mt-0.5">Fleet management</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? "bg-brand-500 text-white font-medium" : "hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="w-5 text-center opacity-80">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-slate-500 border-t border-white/10">
        © {new Date().getFullYear()} Fleetly
      </div>
    </aside>
  );
}
