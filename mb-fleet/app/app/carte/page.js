"use client";
import dynamicImport from "next/dynamic";
import { useFleet } from "@/components/FleetProvider";
import { PageHeader, Loading } from "@/components/ui";
import { timeAgo } from "@/lib/format";

// La carte ne peut être rendue que côté client (Leaflet).
const FleetMap = dynamicImport(() => import("@/components/FleetMap"), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-slate-400">Chargement de la carte…</div>,
});

export default function CartePage() {
  const { ready, data } = useFleet();
  if (!ready) return <Loading />;

  const { trucks, trackers } = data;
  const online = trucks.filter((t) => {
    const tr = trackers.find((x) => x.id === t.tracker_id);
    return tr && tr.status === "actif";
  });

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <PageHeader
        title="Carte en direct"
        subtitle={`${online.length} traceurs en ligne · positions mises à jour en temps réel`}
      />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        <div className="lg:col-span-3 card overflow-hidden min-h-[400px]">
          <FleetMap trucks={trucks} trackers={trackers} />
        </div>
        <div className="card p-4 overflow-y-auto">
          <h2 className="font-semibold text-slate-800 mb-3">Véhicules suivis</h2>
          <ul className="space-y-3">
            {trucks.map((t) => {
              const tr = trackers.find((x) => x.id === t.tracker_id);
              if (!tr) return null;
              const moving = tr.status === "actif" && (tr.last_speed || 0) > 0;
              return (
                <li key={t.id} className="flex items-start gap-2">
                  <span className={`mt-1 w-2.5 h-2.5 rounded-full ${tr.status !== "actif" ? "bg-rose-500" : moving ? "bg-blue-500" : "bg-emerald-500"}`} />
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-800">{t.plate}</p>
                    <p className="text-xs text-slate-500">
                      {tr.status !== "actif" ? "Hors ligne" : moving ? `${Math.round(tr.last_speed)} km/h` : "À l'arrêt"} · {timeAgo(tr.last_seen)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
            Mode démo : les positions sont simulées. Branchez vos vrais traceurs (Teltonika, Traccar…) pour le temps réel.
          </p>
        </div>
      </div>
    </div>
  );
}
