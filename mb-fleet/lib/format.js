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
