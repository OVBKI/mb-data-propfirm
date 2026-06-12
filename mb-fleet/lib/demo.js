// Données de démonstration — utilisées tant que Supabase n'est pas configuré.
// Elles permettent de naviguer dans toute l'application sans base de données.

export const drivers = [
  { id: "d1", first_name: "Karim", last_name: "Benali", phone: "06 12 34 56 78", license_cats: "C, CE", license_number: "B-558214", license_expiry: "2027-04-12", status: "en_service", hired_at: "2021-03-01" },
  { id: "d2", first_name: "Youssef", last_name: "El Amrani", phone: "06 22 11 09 44", license_cats: "C, CE", license_number: "B-114902", license_expiry: "2026-08-30", status: "en_service", hired_at: "2019-09-15" },
  { id: "d3", first_name: "Sophie", last_name: "Marchand", phone: "07 88 45 12 03", license_cats: "C", license_number: "A-902173", license_expiry: "2026-07-05", status: "disponible", hired_at: "2022-06-20" },
  { id: "d4", first_name: "Mehdi", last_name: "Tahiri", phone: "06 70 33 21 88", license_cats: "C, CE", license_number: "B-330145", license_expiry: "2025-09-01", status: "conge", hired_at: "2020-01-10" },
  { id: "d5", first_name: "Lucas", last_name: "Petit", phone: "07 41 25 67 90", license_cats: "C", license_number: "A-771430", license_expiry: "2028-02-18", status: "disponible", hired_at: "2023-11-02" },
];

export const trackers = [
  { id: "t1", imei: "356938035643809", model: "Teltonika FMB920", sim_number: "+212 6 00 11 22 33", status: "actif", last_lat: 48.8566, last_lng: 2.3522, last_speed: 0, last_seen: nowMinus(4) },
  { id: "t2", imei: "356938035641111", model: "Teltonika FMB920", sim_number: "+212 6 00 11 22 34", status: "actif", last_lat: 45.7640, last_lng: 4.8357, last_speed: 82, last_seen: nowMinus(1) },
  { id: "t3", imei: "356938035642222", model: "Concox GT06N", sim_number: "+212 6 00 11 22 35", status: "actif", last_lat: 43.2965, last_lng: 5.3698, last_speed: 64, last_seen: nowMinus(2) },
  { id: "t4", imei: "356938035643333", model: "Teltonika FMC130", sim_number: "+212 6 00 11 22 36", status: "actif", last_lat: 47.2184, last_lng: -1.5536, last_speed: 0, last_seen: nowMinus(11) },
  { id: "t5", imei: "356938035644444", model: "Concox GT06N", sim_number: "+212 6 00 11 22 37", status: "en_panne", last_lat: 43.6047, last_lng: 1.4442, last_speed: 0, last_seen: nowMinus(720) },
];

export const trucks = [
  { id: "c1", plate: "FR-128-AB", brand: "Renault", model: "T High 520", year: 2021, mileage_km: 312450, fuel_type: "diesel", capacity_t: 26, status: "maintenance", driver_id: "d1", tracker_id: "t1" },
  { id: "c2", plate: "FR-942-CD", brand: "Volvo", model: "FH 500", year: 2022, mileage_km: 198300, fuel_type: "diesel", capacity_t: 26, status: "en_route", driver_id: "d2", tracker_id: "t2" },
  { id: "c3", plate: "FR-377-EF", brand: "Mercedes", model: "Actros 1845", year: 2020, mileage_km: 421900, fuel_type: "diesel", capacity_t: 24, status: "en_route", driver_id: "d3", tracker_id: "t3" },
  { id: "c4", plate: "FR-560-GH", brand: "Scania", model: "R 450", year: 2023, mileage_km: 76200, fuel_type: "diesel", capacity_t: 27, status: "disponible", driver_id: null, tracker_id: "t4" },
  { id: "c5", plate: "FR-815-IJ", brand: "DAF", model: "XF 480", year: 2019, mileage_km: 534100, fuel_type: "diesel", capacity_t: 26, status: "hors_service", driver_id: null, tracker_id: "t5" },
];

export const maintenances = [
  { id: "m1", truck_id: "c1", type: "vidange", date: "2026-05-20", mileage_km: 310000, cost: 480, garage: "Garage Central", next_due_date: "2026-11-20", next_due_km: 340000, status: "fait" },
  { id: "m2", truck_id: "c1", type: "freins", date: "2026-06-08", mileage_km: 312000, cost: 1250, garage: "Garage Central", next_due_date: null, next_due_km: null, status: "fait" },
  { id: "m3", truck_id: "c2", type: "controle_technique", date: "2026-01-15", mileage_km: 180000, cost: 95, garage: "DEKRA", next_due_date: "2026-07-15", next_due_km: null, status: "a_prevoir" },
  { id: "m4", truck_id: "c3", type: "pneus", date: "2026-03-02", mileage_km: 410000, cost: 2400, garage: "Euromaster", next_due_date: null, next_due_km: 460000, status: "fait" },
  { id: "m5", truck_id: "c3", type: "controle_technique", date: "2025-06-01", mileage_km: 360000, cost: 95, garage: "DEKRA", next_due_date: "2026-06-01", next_due_km: null, status: "en_retard" },
  { id: "m6", truck_id: "c4", type: "vidange", date: "2026-04-10", mileage_km: 70000, cost: 460, garage: "Garage Central", next_due_date: "2026-10-10", next_due_km: 100000, status: "fait" },
];

export const documents = [
  { id: "doc1", truck_id: "c1", type: "assurance", number: "POL-2026-1187", issuer: "AXA", issue_date: "2026-01-01", expiry_date: "2026-12-31", cost: 3200 },
  { id: "doc2", truck_id: "c1", type: "carte_grise", number: "FR-128-AB", issuer: "Préfecture", issue_date: "2021-02-01", expiry_date: null, cost: 0 },
  { id: "doc3", truck_id: "c2", type: "assurance", number: "POL-2026-1188", issuer: "AXA", issue_date: "2026-01-01", expiry_date: "2026-12-31", cost: 3100 },
  { id: "doc4", truck_id: "c2", type: "controle_technique", number: "CT-99213", issuer: "DEKRA", issue_date: "2026-01-15", expiry_date: "2026-07-15", cost: 95 },
  { id: "doc5", truck_id: "c3", type: "assurance", number: "POL-2026-1190", issuer: "Allianz", issue_date: "2026-01-01", expiry_date: "2026-06-25", cost: 3500 },
  { id: "doc6", truck_id: "c4", type: "assurance", number: "POL-2026-1192", issuer: "AXA", issue_date: "2026-01-01", expiry_date: "2026-12-31", cost: 2900 },
  { id: "doc7", truck_id: "c5", type: "controle_technique", number: "CT-77120", issuer: "DEKRA", issue_date: "2025-05-01", expiry_date: "2026-05-01", cost: 95 },
];

export const expenses = [
  { id: "e1", truck_id: "c2", driver_id: "d2", type: "carburant", date: "2026-06-10", amount: 412.5, liters: 250 },
  { id: "e2", truck_id: "c3", driver_id: "d3", type: "carburant", date: "2026-06-09", amount: 396.0, liters: 240 },
  { id: "e3", truck_id: "c2", driver_id: "d2", type: "peage", date: "2026-06-10", amount: 78.4, liters: null },
  { id: "e4", truck_id: "c1", driver_id: "d1", type: "reparation", date: "2026-06-08", amount: 1250, liters: null },
  { id: "e5", truck_id: "c3", driver_id: "d3", type: "amende", date: "2026-06-05", amount: 135, liters: null },
  { id: "e6", truck_id: "c4", driver_id: "d5", type: "carburant", date: "2026-06-04", amount: 360.0, liters: 218 },
  { id: "e7", truck_id: "c1", driver_id: "d1", type: "carburant", date: "2026-06-01", amount: 405.9, liters: 246 },
];

// Missions / tournées de fret — affecte camion + chauffeur + chargement à un trajet.
export const missions = [
  { id: "ms1", ref: "M-1042", origin: "Lyon", destination: "Marseille", truck_id: "c2", driver_id: "d2", cargo: "Palettes alimentaires", weight_t: 18, distance_km: 315, price: 1450, pickup_date: dayOffset(0), delivery_date: dayOffset(0), status: "en_cours", notes: "Livraison avant 14h00" },
  { id: "ms2", ref: "M-1041", origin: "Paris", destination: "Lille", truck_id: "c3", driver_id: "d3", cargo: "Matériel électronique", weight_t: 12, distance_km: 225, price: 980, pickup_date: dayOffset(0), delivery_date: dayOffset(1), status: "en_cours", notes: "" },
  { id: "ms3", ref: "M-1043", origin: "Nantes", destination: "Bordeaux", truck_id: "c4", driver_id: "d5", cargo: "Mobilier", weight_t: 9, distance_km: 345, price: 1120, pickup_date: dayOffset(1), delivery_date: dayOffset(2), status: "planifiee", notes: "Hayon requis" },
  { id: "ms4", ref: "M-1044", origin: "Marseille", destination: "Nice", truck_id: "c4", driver_id: "d5", cargo: "Produits frais", weight_t: 14, distance_km: 200, price: 760, pickup_date: dayOffset(3), delivery_date: dayOffset(3), status: "planifiee", notes: "Température dirigée 4°C" },
  { id: "ms5", ref: "M-1040", origin: "Toulouse", destination: "Montpellier", truck_id: "c1", driver_id: "d1", cargo: "Matériaux BTP", weight_t: 22, distance_km: 240, price: 890, pickup_date: dayOffset(-2), delivery_date: dayOffset(-2), status: "livree", notes: "" },
  { id: "ms6", ref: "M-1039", origin: "Rennes", destination: "Paris", truck_id: "c2", driver_id: "d2", cargo: "Pièces automobiles", weight_t: 16, distance_km: 350, price: 1280, pickup_date: dayOffset(-5), delivery_date: dayOffset(-4), status: "livree", notes: "" },
];

function nowMinus(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

// Date à +/- n jours, au format YYYY-MM-DD (pour les champs date).
function dayOffset(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

export const demoData = { drivers, trackers, trucks, maintenances, documents, expenses, missions };
