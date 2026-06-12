// Couche d'accès aux données.
// - Si Supabase est configuré → lit les vraies tables.
// - Sinon → renvoie les données de démonstration.
import { supabase, isSupabaseConfigured } from "./supabase";
import { demoData } from "./demo";

async function table(name) {
  if (!isSupabaseConfigured) {
    return demoData[name] || [];
  }
  const { data, error } = await supabase.from(name).select("*");
  if (error) {
    console.error(`Supabase error on ${name}:`, error.message);
    return [];
  }
  return data || [];
}

export async function getAll() {
  const [trucks, drivers, trackers, maintenances, documents, expenses] = await Promise.all([
    table("trucks"),
    table("drivers"),
    table("trackers"),
    table("maintenances"),
    table("documents"),
    table("expenses"),
  ]);
  return { trucks, drivers, trackers, maintenances, documents, expenses };
}

export { isSupabaseConfigured };
