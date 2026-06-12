// Configuration des champs de formulaire par entité.
// Les fonctions reçoivent les listes nécessaires pour construire les menus déroulants.
import { TRUCK_STATUS, DRIVER_STATUS, MAINT_STATUS, MAINT_TYPE, DOC_TYPE, EXPENSE_TYPE, MISSION_STATUS, INVOICE_STATUS, VAT_RATES } from "@/lib/format";

const opts = (obj) => Object.entries(obj).map(([value, v]) => ({ value, label: v.label || v }));
const truckOpts = (trucks) => trucks.map((t) => ({ value: t.id, label: `${t.plate} — ${t.brand} ${t.model}` }));
const driverOpts = (drivers) => drivers.map((d) => ({ value: d.id, label: `${d.first_name} ${d.last_name}` }));
const trackerOpts = (trackers) => trackers.map((t) => ({ value: t.id, label: `${t.model} (${t.imei})` }));

export function truckFields(drivers, trackers) {
  return [
    { name: "plate", label: "Immatriculation", required: true, placeholder: "FR-000-AA", half: true },
    { name: "status", label: "Statut", type: "select", options: opts(TRUCK_STATUS), half: true },
    { name: "brand", label: "Marque", placeholder: "Renault", half: true },
    { name: "model", label: "Modèle", placeholder: "T High 520", half: true },
    { name: "year", label: "Année", type: "number", half: true },
    { name: "mileage_km", label: "Kilométrage", type: "number", half: true },
    { name: "fuel_type", label: "Carburant", type: "select", half: true, options: [
      { value: "diesel", label: "Diesel" }, { value: "essence", label: "Essence" },
      { value: "gpl", label: "GPL" }, { value: "electrique", label: "Électrique" },
    ] },
    { name: "capacity_t", label: "Charge utile (t)", type: "number", step: "0.1", half: true },
    { name: "driver_id", label: "Chauffeur", type: "select", options: driverOpts(drivers), half: true },
    { name: "tracker_id", label: "Traceur GPS", type: "select", options: trackerOpts(trackers), half: true },
  ];
}

export function driverFields() {
  return [
    { name: "first_name", label: "Prénom", required: true, half: true },
    { name: "last_name", label: "Nom", required: true, half: true },
    { name: "phone", label: "Téléphone", half: true },
    { name: "email", label: "E-mail", type: "email", half: true },
    { name: "license_cats", label: "Catégories permis", placeholder: "C, CE", half: true },
    { name: "license_number", label: "N° de permis", half: true },
    { name: "license_expiry", label: "Permis valide jusqu'au", type: "date", half: true },
    { name: "status", label: "Statut", type: "select", options: opts(DRIVER_STATUS), half: true },
    { name: "hired_at", label: "Date d'embauche", type: "date", half: true },
  ];
}

export function expenseFields(trucks, drivers) {
  return [
    { name: "type", label: "Type", type: "select", required: true, options: opts(EXPENSE_TYPE), half: true },
    { name: "date", label: "Date", type: "date", required: true, half: true },
    { name: "truck_id", label: "Camion", type: "select", options: truckOpts(trucks), half: true },
    { name: "driver_id", label: "Chauffeur", type: "select", options: driverOpts(drivers), half: true },
    { name: "amount", label: "Montant (€)", type: "number", step: "0.01", required: true, half: true },
    { name: "liters", label: "Litres (si carburant)", type: "number", step: "0.1", half: true },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
}

export function maintenanceFields(trucks) {
  return [
    { name: "truck_id", label: "Camion", type: "select", required: true, options: truckOpts(trucks), half: true },
    { name: "type", label: "Type", type: "select", required: true, options: opts(MAINT_TYPE), half: true },
    { name: "date", label: "Date", type: "date", required: true, half: true },
    { name: "status", label: "Statut", type: "select", options: opts(MAINT_STATUS), half: true },
    { name: "mileage_km", label: "Kilométrage", type: "number", half: true },
    { name: "cost", label: "Coût (€)", type: "number", step: "0.01", half: true },
    { name: "garage", label: "Garage", half: true },
    { name: "next_due_date", label: "Prochaine échéance", type: "date", half: true },
    { name: "next_due_km", label: "Prochain km", type: "number", half: true },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
}

export function documentFields(trucks) {
  return [
    { name: "truck_id", label: "Camion", type: "select", required: true, options: truckOpts(trucks), half: true },
    { name: "type", label: "Type", type: "select", required: true, options: opts(DOC_TYPE), half: true },
    { name: "number", label: "Numéro", half: true },
    { name: "issuer", label: "Émetteur", half: true },
    { name: "issue_date", label: "Date d'émission", type: "date", half: true },
    { name: "expiry_date", label: "Date d'expiration", type: "date", half: true },
    { name: "cost", label: "Coût (€)", type: "number", step: "0.01", half: true },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
}

export function missionFields(trucks, drivers) {
  return [
    { name: "ref", label: "Référence", placeholder: "M-1045", half: true },
    { name: "status", label: "Statut", type: "select", options: opts(MISSION_STATUS), half: true },
    { name: "origin", label: "Départ", required: true, placeholder: "Lyon", half: true },
    { name: "destination", label: "Arrivée", required: true, placeholder: "Marseille", half: true },
    { name: "truck_id", label: "Camion", type: "select", options: truckOpts(trucks), half: true },
    { name: "driver_id", label: "Chauffeur", type: "select", options: driverOpts(drivers), half: true },
    { name: "pickup_date", label: "Date d'enlèvement", type: "date", half: true },
    { name: "delivery_date", label: "Date de livraison", type: "date", half: true },
    { name: "cargo", label: "Chargement", placeholder: "22 palettes alimentaires", half: true },
    { name: "weight_t", label: "Poids (t)", type: "number", step: "0.1", half: true },
    { name: "distance_km", label: "Distance (km)", type: "number", half: true },
    { name: "price", label: "Prix / CA (€)", type: "number", step: "0.01", half: true },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
}

export function invoiceFields(missions = []) {
  const missionOpts = missions
    .filter((m) => m.status !== "annulee")
    .map((m) => ({ value: m.id, label: `${m.ref || "Mission"} — ${m.origin} → ${m.destination}` }));
  return [
    { name: "number", label: "N° de facture", placeholder: "FAC-2026-016", half: true },
    { name: "client", label: "Client", required: true, placeholder: "Nom du client", half: true },
    { name: "mission_id", label: "Mission liée", type: "select", options: missionOpts, half: true },
    { name: "status", label: "Statut", type: "select", options: opts(INVOICE_STATUS), half: true },
    { name: "date", label: "Date d'émission", type: "date", required: true, half: true },
    { name: "due_date", label: "Échéance", type: "date", half: true },
    { name: "amount_ht", label: "Montant HT (€)", type: "number", step: "0.01", required: true, half: true },
    { name: "vat_rate", label: "TVA", type: "select", options: VAT_RATES.map((r) => ({ value: r.value, label: r.label })), half: true },
    { name: "paid_date", label: "Date de paiement", type: "date", half: true },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
}

const MAINT_TYPE_OPTS = opts(MAINT_TYPE);
export { MAINT_TYPE_OPTS };
