import Link from "next/link";
import Logo, { LogoMark } from "@/components/Logo";
import {
  TruckIcon, MapPinIcon, UsersIcon, WrenchIcon, FileIcon, BellIcon,
} from "@/components/icons";

const FEATURES = [
  { Icon: TruckIcon, title: "Camions & traceurs GPS", text: "Une fiche par véhicule : immatriculation, kilométrage, état, et le traceur GPS associé. Toute votre flotte en un coup d'œil." },
  { Icon: MapPinIcon, title: "Carte en temps réel", text: "Suivez la position de chaque camion en direct, leur vitesse et leur statut. Compatible avec les traceurs Teltonika, Traccar et autres." },
  { Icon: UsersIcon, title: "Chauffeurs", text: "Gérez vos chauffeurs, leurs permis et leurs échéances. Soyez alerté avant qu'un permis n'expire." },
  { Icon: WrenchIcon, title: "Entretien & révisions", text: "Vidanges, contrôles techniques, pneus, freins… Planifiez tout et ne ratez plus jamais une échéance." },
  { Icon: FileIcon, title: "Documents & dépenses", text: "Assurances, cartes grises, carburant, péages : centralisez vos documents et suivez vos coûts en temps réel." },
  { Icon: BellIcon, title: "Alertes intelligentes", text: "Documents qui expirent, entretiens en retard, dépenses anormales : Fleetly vous prévient avant que ça ne coûte cher." },
];

const STEPS = [
  { n: "1", title: "Ajoutez votre flotte", text: "Enregistrez vos camions, chauffeurs et traceurs en quelques minutes." },
  { n: "2", title: "Suivez en temps réel", text: "Visualisez vos véhicules sur la carte et recevez les alertes importantes." },
  { n: "3", title: "Pilotez votre société", text: "Maîtrisez vos coûts, vos échéances et votre activité depuis un seul tableau de bord." },
];

const PLANS = [
  { name: "Starter", price: "29", unit: "/ mois", tagline: "Pour démarrer", features: ["Jusqu'à 5 camions", "Suivi GPS temps réel", "Chauffeurs & entretien", "Alertes échéances"], cta: "Essayer", highlight: false },
  { name: "Pro", price: "89", unit: "/ mois", tagline: "Le plus populaire", features: ["Jusqu'à 30 camions", "Tout Starter +", "Documents & dépenses", "Rapports & exports", "Support prioritaire"], cta: "Choisir Pro", highlight: true },
  { name: "Entreprise", price: "Sur devis", unit: "", tagline: "Grande flotte", features: ["Camions illimités", "Tout Pro +", "Multi-utilisateurs & rôles", "Intégrations sur mesure", "Accompagnement dédié"], cta: "Nous contacter", highlight: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-ink-800">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Logo size={34} />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#fonctionnalites" className="hover:text-brand-600">Fonctionnalités</a>
            <a href="#etapes" className="hover:text-brand-600">Comment ça marche</a>
            <a href="#tarifs" className="hover:text-brand-600">Tarifs</a>
          </nav>
          <Link href="/app" className="inline-flex items-center rounded-lg bg-brand-500 text-white text-sm font-semibold px-4 py-2 hover:bg-brand-600 transition-colors">
            Voir la démo →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 to-white" />
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-12 md:pt-24 md:pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1">
              <span className="live-dot" /> Suivi GPS en temps réel
            </span>
            <h1 className="mt-5 font-display font-bold text-4xl md:text-5xl leading-[1.1] text-ink-900">
              Pilotez toute votre société de transport, au même endroit.
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-md">
              Fleetly réunit vos camions, traceurs GPS, chauffeurs, entretien et dépenses dans une seule application simple et puissante.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app" className="inline-flex items-center rounded-xl bg-brand-500 text-white font-semibold px-6 py-3 hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25">
                Voir la démo gratuite
              </Link>
              <a href="#tarifs" className="inline-flex items-center rounded-xl border border-slate-200 text-ink-800 font-semibold px-6 py-3 hover:border-brand-300 hover:text-brand-600 transition-colors">
                Voir les tarifs
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-400">Sans engagement · Mise en route en quelques minutes</p>
          </div>

          {/* Mock dashboard */}
          <HeroMock />
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="max-w-6xl mx-auto px-5 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[["100%", "de votre flotte suivie"], ["−30%", "de coûts d'entretien imprévus"], ["0", "échéance oubliée"], ["24/7", "temps réel"]].map(([n, l]) => (
            <div key={l}>
              <div className="font-display font-bold text-2xl text-brand-600">{n}</div>
              <div className="text-xs text-slate-500 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="max-w-6xl mx-auto px-5 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-ink-900">Tout ce qu'il faut pour gérer votre flotte</h2>
          <p className="mt-4 text-slate-600">Plus besoin de jongler entre Excel, WhatsApp et des papiers. Fleetly centralise tout.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200/80 p-6 hover:border-brand-300 hover:shadow-card transition-all">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 grid place-items-center">
                <f.Icon size={22} />
              </div>
              <h3 className="mt-4 font-display font-semibold text-lg text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section id="etapes" className="bg-ink-900 text-slate-300">
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white">En 3 étapes, vous êtes opérationnel</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-signal-500 grid place-items-center font-display font-bold text-white text-lg">{s.n}</div>
                <h3 className="mt-5 font-display font-semibold text-xl text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="max-w-6xl mx-auto px-5 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-ink-900">Des tarifs simples</h2>
          <p className="mt-4 text-slate-600">Choisissez l'offre adaptée à la taille de votre flotte.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((p) => (
            <div key={p.name} className={`rounded-2xl p-7 ${p.highlight ? "border-2 border-brand-500 shadow-card relative" : "border border-slate-200"}`}>
              {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Populaire</span>}
              <p className="text-sm font-semibold text-brand-600">{p.name}</p>
              <p className="text-xs text-slate-400">{p.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display font-bold text-4xl text-ink-900">{p.price === "Sur devis" ? p.price : `${p.price}€`}</span>
                {p.unit && <span className="text-slate-400 text-sm">{p.unit}</span>}
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-slate-600">
                    <span className="text-brand-500 mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/app" className={`mt-7 block text-center rounded-xl font-semibold px-5 py-3 transition-colors ${p.highlight ? "bg-brand-500 text-white hover:bg-brand-600" : "border border-slate-200 text-ink-800 hover:border-brand-300 hover:text-brand-600"}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-signal-600 px-8 py-14 text-center text-white">
          <h2 className="font-display font-bold text-3xl md:text-4xl">Prêt à reprendre le contrôle de votre flotte ?</h2>
          <p className="mt-4 text-white/85 max-w-xl mx-auto">Découvrez Fleetly dès maintenant avec des données de démonstration.</p>
          <Link href="/app" className="mt-8 inline-flex items-center rounded-xl bg-white text-brand-600 font-semibold px-7 py-3 hover:bg-brand-50 transition-colors">
            Lancer la démo →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size={28} />
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} Fleetly — Logiciel de gestion de flotte de transport.</p>
        </div>
      </footer>
    </div>
  );
}

function HeroMock() {
  return (
    <div className="relative">
      <div className="rounded-2xl border border-slate-200 shadow-2xl shadow-brand-900/10 overflow-hidden bg-white">
        {/* fausse barre de navigateur */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 bg-slate-50">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 text-[11px] text-slate-400">app.fleetly.com</span>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3">
          {[["Camions", "12", "text-brand-600"], ["En route", "7", "text-signal-600"], ["Alertes", "3", "text-amber-600"]].map(([l, v, c]) => (
            <div key={l} className="rounded-xl border border-slate-100 p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">{l}</p>
              <p className={`font-display font-bold text-2xl ${c}`}>{v}</p>
            </div>
          ))}
          <div className="col-span-3 rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-600">Ma flotte</p>
              <span className="live-dot" />
            </div>
            {[["FR-128-AB", "Renault T", "En route", "bg-signal-100 text-signal-600"], ["FR-942-CD", "Volvo FH", "Disponible", "bg-emerald-100 text-emerald-700"], ["FR-377-EF", "Mercedes", "Entretien", "bg-amber-100 text-amber-700"]].map(([p, m, s, c]) => (
              <div key={p} className="flex items-center justify-between py-2 border-t border-slate-50 text-xs">
                <span className="font-medium text-ink-800">{p}</span>
                <span className="text-slate-400">{m}</span>
                <span className={`badge ${c}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-4 rounded-xl bg-white shadow-card border border-slate-100 px-4 py-3 flex items-center gap-2">
        <LogoMark size={28} />
        <div className="text-xs">
          <p className="font-semibold text-ink-900">+2 camions</p>
          <p className="text-slate-400">en route à l'instant</p>
        </div>
      </div>
    </div>
  );
}
