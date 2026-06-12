// Helpers d'affichage (français).

export function euros(n) {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export function km(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(n) + " km";
}

export function dateFR(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "à l'instant";
  if (diff < 60) return `il y a ${diff} min`;
  const h = Math.round(diff / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

// Nombre de jours avant une date (négatif = déjà passé).
export function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

// Durée en minutes → "8h15".
export function hoursFromMin(min) {
  if (min == null || isNaN(min)) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h${m.toString().padStart(2, "0")}`;
}

// Masse CO₂ → "2,4 t" ou "640 kg".
export function co2(kg) {
  if (kg == null || isNaN(kg)) return "—";
  if (kg >= 1000) return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(kg / 1000) + " t";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(kg) + " kg";
}

// Facteurs d'émission (kg CO₂ par litre de carburant) — base ADEME.
export const CO2_PER_LITER = { diesel: 2.64, essence: 2.31, gpl: 1.51, electrique: 0 };

// Seuils réglementaires (RSE / règlement CE 561-2006), en minutes / jours.
export const RSE = {
  DRIVE_DAY_MAX: 540,        // 9 h par jour
  DRIVE_DAY_EXT: 600,        // 10 h (autorisé 2×/semaine)
  DRIVE_WEEK_MAX: 3360,      // 56 h par semaine
  CARD_DOWNLOAD_DAYS: 28,    // téléchargement carte conducteur
  TACHO_DOWNLOAD_DAYS: 90,   // téléchargement chronotachygraphe véhicule
  WEEKLY_REST_DAYS: 6,       // repos hebdo au plus tard après 6×24 h
};

export const TRUCK_STATUS = {
  disponible: { label: "Disponible", color: "bg-emerald-100 text-emerald-700" },
  en_route: { label: "En route", color: "bg-blue-100 text-blue-700" },
  maintenance: { label: "En maintenance", color: "bg-amber-100 text-amber-700" },
  hors_service: { label: "Hors service", color: "bg-rose-100 text-rose-700" },
};

export const DRIVER_STATUS = {
  disponible: { label: "Disponible", color: "bg-emerald-100 text-emerald-700" },
  en_service: { label: "En service", color: "bg-blue-100 text-blue-700" },
  conge: { label: "En congé", color: "bg-slate-100 text-slate-600" },
  indisponible: { label: "Indisponible", color: "bg-rose-100 text-rose-700" },
};

export const MAINT_STATUS = {
  fait: { label: "Fait", color: "bg-emerald-100 text-emerald-700" },
  a_prevoir: { label: "À prévoir", color: "bg-amber-100 text-amber-700" },
  en_retard: { label: "En retard", color: "bg-rose-100 text-rose-700" },
};

export const MAINT_TYPE = {
  vidange: "Vidange",
  controle_technique: "Contrôle technique",
  pneus: "Pneus",
  freins: "Freins",
  autre: "Autre",
};

export const DOC_TYPE = {
  assurance: "Assurance",
  carte_grise: "Carte grise",
  controle_technique: "Contrôle technique",
  vignette: "Vignette",
  autre: "Autre",
};

export const EXPENSE_TYPE = {
  carburant: "Carburant",
  peage: "Péage",
  reparation: "Réparation",
  amende: "Amende",
  autre: "Autre",
};

export const MISSION_STATUS = {
  planifiee: { label: "Planifiée", color: "bg-slate-100 text-slate-600" },
  en_cours: { label: "En cours", color: "bg-blue-100 text-blue-700" },
  livree: { label: "Livrée", color: "bg-emerald-100 text-emerald-700" },
  annulee: { label: "Annulée", color: "bg-rose-100 text-rose-700" },
};

export const APPOINTMENT_TYPE = {
  rendez_vous: { label: "Rendez-vous", color: "bg-blue-100 text-blue-700", dot: "#3b82f6" },
  controle_technique: { label: "Contrôle technique", color: "bg-amber-100 text-amber-700", dot: "#f59e0b" },
  entretien: { label: "Entretien garage", color: "bg-violet-100 text-violet-700", dot: "#8b5cf6" },
  chargement: { label: "Chargement", color: "bg-cyan-100 text-cyan-700", dot: "#06b6d4" },
  livraison: { label: "Livraison", color: "bg-emerald-100 text-emerald-700", dot: "#10b981" },
  reunion: { label: "Réunion", color: "bg-slate-100 text-slate-600", dot: "#64748b" },
  formation: { label: "Formation", color: "bg-indigo-100 text-indigo-700", dot: "#6366f1" },
  visite_medicale: { label: "Visite médicale", color: "bg-rose-100 text-rose-700", dot: "#f43f5e" },
  autre: { label: "Autre", color: "bg-slate-100 text-slate-600", dot: "#94a3b8" },
};

export const APPOINTMENT_STATUS = {
  a_faire: { label: "À faire", color: "bg-amber-100 text-amber-700" },
  fait: { label: "Fait", color: "bg-emerald-100 text-emerald-700" },
  annule: { label: "Annulé", color: "bg-rose-100 text-rose-700" },
};

export const INVOICE_STATUS = {
  brouillon: { label: "Brouillon", color: "bg-slate-100 text-slate-600" },
  envoyee: { label: "Envoyée", color: "bg-blue-100 text-blue-700" },
  payee: { label: "Payée", color: "bg-emerald-100 text-emerald-700" },
  en_retard: { label: "En retard", color: "bg-rose-100 text-rose-700" },
};

// Taux de TVA applicables (France).
export const VAT_RATES = [
  { value: 20, label: "20 % (normal)" },
  { value: 10, label: "10 % (transport)" },
  { value: 5.5, label: "5,5 %" },
  { value: 0, label: "0 % (exonéré)" },
];

// Pourcentage formaté.
export function percent(n) {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n) + " %";
}
