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
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-brand-500 text-2xl leading-none">▮</span>
          <span className="text-white font-bold text-lg tracking-tight">Fleetly</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Fleet management</p>
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
