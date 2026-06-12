"use client";
import { useState } from "react";
import { useFleet } from "@/components/FleetProvider";
import { Badge, Table, StatCard, PageHeader, Loading, EmptyRow } from "@/components/ui";
import { FormModal, AddButton, ConfirmDelete, RowActions } from "@/components/forms";
import { missionFields } from "@/lib/forms-config";
import { ArrowRightIcon, PackageIcon, RouteIcon, EuroIcon, CheckIcon } from "@/components/icons";
import { euros, km, dateFR, MISSION_STATUS } from "@/lib/format";

// Ordre d'affichage : missions actives d'abord.
const ORDER = { en_cours: 0, planifiee: 1, livree: 2, annulee: 3 };

export default function MissionsPage() {
  const { ready, data, add, update, remove } = useFleet();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState("all");

  if (!ready) return <Loading />;

  const { missions, trucks, drivers } = data;
  const truckById = Object.fromEntries(trucks.map((t) => [t.id, t]));
  const driverById = Object.fromEntries(drivers.map((d) => [d.id, d]));

  const now = new Date();
  const isThisMonth = (d) => {
    const x = new Date(d);
    return x.getMonth() === now.getMonth() && x.getFullYear() === now.getFullYear();
  };

  const enCours = missions.filter((m) => m.status === "en_cours");
  const planifiees = missions.filter((m) => m.status === "planifiee");
  const livreesMois = missions.filter((m) => m.status === "livree" && isThisMonth(m.delivery_date));

  // CA du mois = missions livrées ce mois + missions en cours dont la livraison tombe ce mois.
  const caMois = missions
    .filter((m) => (m.status === "livree" || m.status === "en_cours") && isThisMonth(m.delivery_date))
    .reduce((s, m) => s + Number(m.price || 0), 0);

  // Prix moyen au km (sur les missions valorisées).
  const valued = missions.filter((m) => m.price > 0 && m.distance_km > 0 && m.status !== "annulee");
  const totalPrice = valued.reduce((s, m) => s + Number(m.price), 0);
  const totalKm = valued.reduce((s, m) => s + Number(m.distance_km), 0);
  const prixKm = totalKm > 0 ? totalPrice / totalKm : 0;

  const filtered = (filter === "all" ? missions : missions.filter((m) => m.status === filter))
    .slice()
    .sort((a, b) => (ORDER[a.status] - ORDER[b.status]) || new Date(a.delivery_date) - new Date(b.delivery_date));

  function handleSubmit(values) {
    if (editing === "new") add("missions", { ...values, status: values.status || "planifiee" });
    else update("missions", editing.id, values);
    setEditing(null);
  }

  const FILTERS = [
    { key: "all", label: "Toutes" },
    { key: "en_cours", label: "En cours" },
    { key: "planifiee", label: "Planifiées" },
    { key: "livree", label: "Livrées" },
  ];

  return (
    <div>
      <PageHeader
        title="Missions & fret"
        subtitle="Affectez un camion et un chauffeur à chaque tournée, et suivez le chiffre d'affaires"
        action={<AddButton onClick={() => setEditing("new")}>Nouvelle mission</AddButton>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="En cours" value={enCours.length} sub="sur la route" accent="text-blue-600" icon={<RouteIcon size={18} />} iconBg="bg-blue-50 text-blue-600" />
        <StatCard label="Planifiées" value={planifiees.length} sub="à venir" accent="text-slate-700" icon={<PackageIcon size={18} />} iconBg="bg-slate-100 text-slate-600" />
        <StatCard label="Livrées ce mois" value={livreesMois.length} sub="terminées" accent="text-emerald-600" icon={<CheckIcon size={18} />} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard label="CA du mois" value={euros(caMois)} sub={prixKm ? `≈ ${prixKm.toFixed(2)} €/km` : "—"} accent="text-brand-600" icon={<EuroIcon size={18} />} iconBg="bg-brand-50 text-brand-600" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === f.key ? "bg-brand-500 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Table columns={["Réf.", "Trajet", "Camion", "Chauffeur", "Chargement", "Livraison", "CA", "Statut", ""]}>
        {filtered.length === 0 && <EmptyRow colSpan={9} text="Aucune mission" />}
        {filtered.map((m) => {
          const st = MISSION_STATUS[m.status] || { label: m.status, color: "" };
          const truck = truckById[m.truck_id];
          const driver = driverById[m.driver_id];
          return (
            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
              <td className="td font-medium text-slate-700">{m.ref || "—"}</td>
              <td className="td">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                  {m.origin} <ArrowRightIcon size={14} className="text-slate-400" /> {m.destination}
                </span>
                {m.distance_km ? <span className="block text-xs text-slate-400">{km(m.distance_km)}</span> : null}
              </td>
              <td className="td">{truck ? truck.plate : <span className="text-slate-400">Non affecté</span>}</td>
              <td className="td">{driver ? `${driver.first_name} ${driver.last_name}` : <span className="text-slate-400">—</span>}</td>
              <td className="td">
                {m.cargo || "—"}
                {m.weight_t ? <span className="block text-xs text-slate-400">{m.weight_t} t</span> : null}
              </td>
              <td className="td">{dateFR(m.delivery_date)}</td>
              <td className="td font-medium">{m.price ? euros(m.price) : "—"}</td>
              <td className="td"><Badge label={st.label} color={st.color} /></td>
              <td className="td"><RowActions onEdit={() => setEditing(m)} onDelete={() => setDeleting(m)} /></td>
            </tr>
          );
        })}
      </Table>

      {editing && (
        <FormModal
          title={editing === "new" ? "Nouvelle mission" : `Mission ${editing.ref || ""}`}
          fields={missionFields(trucks, drivers)}
          initial={editing === "new" ? {} : editing}
          onSubmit={handleSubmit}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          label={`la mission ${deleting.ref || ""} (${deleting.origin} → ${deleting.destination})`}
          onConfirm={() => { remove("missions", deleting.id); setDeleting(null); }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
