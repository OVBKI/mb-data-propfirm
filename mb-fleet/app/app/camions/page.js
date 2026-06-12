"use client";
import { useState } from "react";
import Link from "next/link";
import { useFleet } from "@/components/FleetProvider";
import { Badge, Table, PageHeader, Loading } from "@/components/ui";
import { FormModal, AddButton, ConfirmDelete, RowActions } from "@/components/forms";
import { truckFields } from "@/lib/forms-config";
import { km, timeAgo, TRUCK_STATUS } from "@/lib/format";

export default function CamionsPage() {
  const { ready, data, add, update, remove } = useFleet();
  const [editing, setEditing] = useState(null); // null | "new" | truck
  const [deleting, setDeleting] = useState(null);

  if (!ready) return <Loading />;

  const { trucks, drivers, trackers } = data;
  const driverById = Object.fromEntries(drivers.map((d) => [d.id, d]));
  const trackerById = Object.fromEntries(trackers.map((t) => [t.id, t]));

  function handleSubmit(values) {
    if (editing === "new") add("trucks", { ...values, mileage_km: values.mileage_km || 0, status: values.status || "disponible" });
    else update("trucks", editing.id, values);
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        title="Camions & traceurs GPS"
        subtitle={`${trucks.length} véhicules dans la flotte`}
        action={<AddButton onClick={() => setEditing("new")}>Ajouter un camion</AddButton>}
      />
      <Table columns={["Immat.", "Véhicule", "Kilométrage", "Chauffeur", "Traceur GPS", "Dernier point", "Statut", ""]}>
        {trucks.map((t) => {
          const driver = driverById[t.driver_id];
          const tracker = trackerById[t.tracker_id];
          const st = TRUCK_STATUS[t.status] || { label: t.status, color: "" };
          return (
            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
              <td className="td font-medium">
                <Link href={`/app/camions/${t.id}`} className="text-brand-600 hover:underline">{t.plate}</Link>
              </td>
              <td className="td">{t.brand} {t.model} <span className="text-slate-400">· {t.year}</span></td>
              <td className="td">{km(t.mileage_km)}</td>
              <td className="td">{driver ? `${driver.first_name} ${driver.last_name}` : <span className="text-slate-400">Non affecté</span>}</td>
              <td className="td">
                {tracker ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${tracker.status === "actif" ? "bg-emerald-500" : "bg-rose-500"}`} />
                    {tracker.model}
                  </span>
                ) : <span className="text-slate-400">Aucun</span>}
              </td>
              <td className="td text-slate-500">{tracker ? timeAgo(tracker.last_seen) : "—"}</td>
              <td className="td"><Badge label={st.label} color={st.color} /></td>
              <td className="td"><RowActions onEdit={() => setEditing(t)} onDelete={() => setDeleting(t)} /></td>
            </tr>
          );
        })}
      </Table>

      <p className="text-sm text-slate-400 mt-4">
        Cliquez sur une immatriculation pour voir la fiche complète du camion (entretien, documents, dépenses, position).
      </p>

      {editing && (
        <FormModal
          title={editing === "new" ? "Ajouter un camion" : `Modifier ${editing.plate}`}
          fields={truckFields(drivers, trackers)}
          initial={editing === "new" ? {} : editing}
          onSubmit={handleSubmit}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          label={`le camion ${deleting.plate}`}
          onConfirm={() => { remove("trucks", deleting.id); setDeleting(null); }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
