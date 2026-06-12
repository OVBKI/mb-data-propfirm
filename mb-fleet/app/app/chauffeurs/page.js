"use client";
import { useState } from "react";
import { useFleet } from "@/components/FleetProvider";
import { Badge, Table, PageHeader, Loading } from "@/components/ui";
import { FormModal, AddButton, ConfirmDelete, RowActions } from "@/components/forms";
import { driverFields } from "@/lib/forms-config";
import { dateFR, daysUntil, DRIVER_STATUS } from "@/lib/format";

export default function ChauffeursPage() {
  const { ready, data, add, update, remove } = useFleet();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  if (!ready) return <Loading />;

  const { drivers, trucks } = data;
  const truckByDriver = Object.fromEntries(trucks.filter((t) => t.driver_id).map((t) => [t.driver_id, t]));

  function handleSubmit(values) {
    if (editing === "new") add("drivers", { ...values, status: values.status || "disponible" });
    else update("drivers", editing.id, values);
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        title="Chauffeurs"
        subtitle={`${drivers.length} chauffeurs`}
        action={<AddButton onClick={() => setEditing("new")}>Ajouter un chauffeur</AddButton>}
      />
      <Table columns={["Nom", "Téléphone", "Permis", "Validité permis", "Camion affecté", "Statut", ""]}>
        {drivers.map((d) => {
          const ds = DRIVER_STATUS[d.status] || { label: d.status, color: "" };
          const days = daysUntil(d.license_expiry);
          const truck = truckByDriver[d.id];
          return (
            <tr key={d.id} className="hover:bg-slate-50 transition-colors">
              <td className="td font-medium">{d.first_name} {d.last_name}</td>
              <td className="td">{d.phone || "—"}</td>
              <td className="td">{d.license_cats || "—"} <span className="text-slate-400">{d.license_number}</span></td>
              <td className="td">
                {dateFR(d.license_expiry)}
                {days != null && days <= 90 && (
                  <span className="ml-2"><Badge label={days < 0 ? "Expiré" : `${days} j`} color={days < 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"} /></span>
                )}
              </td>
              <td className="td">{truck ? truck.plate : <span className="text-slate-400">—</span>}</td>
              <td className="td"><Badge label={ds.label} color={ds.color} /></td>
              <td className="td"><RowActions onEdit={() => setEditing(d)} onDelete={() => setDeleting(d)} /></td>
            </tr>
          );
        })}
      </Table>

      {editing && (
        <FormModal
          title={editing === "new" ? "Ajouter un chauffeur" : `Modifier ${editing.first_name} ${editing.last_name}`}
          fields={driverFields()}
          initial={editing === "new" ? {} : editing}
          onSubmit={handleSubmit}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          label={`le chauffeur ${deleting.first_name} ${deleting.last_name}`}
          onConfirm={() => { remove("drivers", deleting.id); setDeleting(null); }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
