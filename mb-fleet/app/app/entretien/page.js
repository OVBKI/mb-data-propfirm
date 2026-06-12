"use client";
import { useState } from "react";
import { useFleet } from "@/components/FleetProvider";
import { Badge, Table, StatCard, PageHeader, Loading } from "@/components/ui";
import { FormModal, AddButton, ConfirmDelete, RowActions } from "@/components/forms";
import { maintenanceFields } from "@/lib/forms-config";
import { euros, km, dateFR, MAINT_STATUS, MAINT_TYPE } from "@/lib/format";

export default function EntretienPage() {
  const { ready, data, add, update, remove } = useFleet();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  if (!ready) return <Loading />;

  const { maintenances, trucks } = data;
  const truckById = Object.fromEntries(trucks.map((t) => [t.id, t]));

  const rows = [...maintenances].sort((a, b) => new Date(b.date) - new Date(a.date));
  const aPrevoir = maintenances.filter((m) => m.status === "a_prevoir").length;
  const enRetard = maintenances.filter((m) => m.status === "en_retard").length;
  const totalCost = maintenances.reduce((s, m) => s + Number(m.cost || 0), 0);

  function handleSubmit(values) {
    if (editing === "new") add("maintenances", { ...values, status: values.status || "fait" });
    else update("maintenances", editing.id, values);
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        title="Entretien & révisions"
        subtitle="Suivi des interventions et des échéances"
        action={<AddButton onClick={() => setEditing("new")}>Ajouter une intervention</AddButton>}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="À prévoir" value={aPrevoir} accent="text-amber-600" />
        <StatCard label="En retard" value={enRetard} accent="text-rose-600" />
        <StatCard label="Coût total" value={euros(totalCost)} />
      </div>

      <Table columns={["Camion", "Type", "Date", "Km", "Garage", "Coût", "Prochaine éch.", "Statut", ""]}>
        {rows.map((m) => {
          const ms = MAINT_STATUS[m.status] || { label: m.status, color: "" };
          return (
            <tr key={m.id} className="hover:bg-slate-50 transition-colors">
              <td className="td font-medium">{truckById[m.truck_id]?.plate || "—"}</td>
              <td className="td">{MAINT_TYPE[m.type] || m.type}</td>
              <td className="td">{dateFR(m.date)}</td>
              <td className="td">{m.mileage_km ? km(m.mileage_km) : "—"}</td>
              <td className="td">{m.garage || "—"}</td>
              <td className="td">{euros(m.cost)}</td>
              <td className="td">{m.next_due_date ? dateFR(m.next_due_date) : m.next_due_km ? km(m.next_due_km) : "—"}</td>
              <td className="td"><Badge label={ms.label} color={ms.color} /></td>
              <td className="td"><RowActions onEdit={() => setEditing(m)} onDelete={() => setDeleting(m)} /></td>
            </tr>
          );
        })}
      </Table>

      {editing && (
        <FormModal
          title={editing === "new" ? "Ajouter une intervention" : "Modifier l'intervention"}
          fields={maintenanceFields(trucks)}
          initial={editing === "new" ? {} : editing}
          onSubmit={handleSubmit}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          label="cette intervention"
          onConfirm={() => { remove("maintenances", deleting.id); setDeleting(null); }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
