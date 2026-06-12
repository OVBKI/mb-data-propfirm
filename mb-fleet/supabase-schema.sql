-- ============================================================
--  MB-FLEET — Schéma de base de données (PostgreSQL / Supabase)
--  Gestion de flotte de transport : camions, traceurs GPS,
--  chauffeurs, entretien, documents et dépenses.
--  À exécuter dans Supabase → SQL Editor.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- CHAUFFEURS ----------
create table if not exists drivers (
  id              uuid primary key default gen_random_uuid(),
  first_name      text not null,
  last_name       text not null,
  phone           text,
  email           text,
  license_number  text,
  license_cats    text,            -- ex: "C, CE"
  license_expiry  date,
  status          text not null default 'disponible', -- disponible | en_service | conge | indisponible
  hired_at        date,
  notes           text,
  created_at      timestamptz not null default now()
);

-- ---------- TRACEURS GPS ----------
create table if not exists trackers (
  id          uuid primary key default gen_random_uuid(),
  imei        text unique,
  model       text,               -- ex: "Teltonika FMB920"
  sim_number  text,
  status      text not null default 'actif',  -- actif | inactif | en_panne
  last_lat    double precision,
  last_lng    double precision,
  last_speed  numeric,            -- km/h
  last_seen   timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------- CAMIONS ----------
create table if not exists trucks (
  id          uuid primary key default gen_random_uuid(),
  plate       text not null,      -- immatriculation
  brand       text,
  model       text,
  year        int,
  mileage_km  int default 0,
  fuel_type   text default 'diesel',
  capacity_t  numeric,            -- charge utile en tonnes
  status      text not null default 'disponible', -- disponible | en_route | maintenance | hors_service
  driver_id   uuid references drivers(id) on delete set null,
  tracker_id  uuid references trackers(id) on delete set null,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ---------- ENTRETIEN & RÉVISIONS ----------
create table if not exists maintenances (
  id            uuid primary key default gen_random_uuid(),
  truck_id      uuid references trucks(id) on delete cascade,
  type          text not null,    -- vidange | controle_technique | pneus | freins | autre
  date          date not null,
  mileage_km    int,
  cost          numeric default 0,
  garage        text,
  next_due_date date,
  next_due_km   int,
  status        text not null default 'fait', -- fait | a_prevoir | en_retard
  notes         text,
  created_at    timestamptz not null default now()
);

-- ---------- DOCUMENTS (assurance, carte grise, etc.) ----------
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  truck_id    uuid references trucks(id) on delete cascade,
  type        text not null,      -- assurance | carte_grise | controle_technique | vignette | autre
  number      text,
  issuer      text,
  issue_date  date,
  expiry_date date,
  cost        numeric default 0,
  file_url    text,
  notes       text,
  created_at  timestamptz not null default now()
);

-- ---------- DÉPENSES ----------
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  truck_id    uuid references trucks(id) on delete set null,
  driver_id   uuid references drivers(id) on delete set null,
  type        text not null,      -- carburant | peage | reparation | amende | autre
  date        date not null,
  amount      numeric not null default 0,
  liters      numeric,            -- si carburant
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_trucks_driver on trucks(driver_id);
create index if not exists idx_trucks_tracker on trucks(tracker_id);
create index if not exists idx_maint_truck on maintenances(truck_id);
create index if not exists idx_docs_truck on documents(truck_id);
create index if not exists idx_exp_truck on expenses(truck_id);

-- ------------------------------------------------------------
--  RLS — à activer puis adapter selon ton authentification.
--  Laissé désactivé ici pour démarrer simplement.
-- ------------------------------------------------------------
-- alter table trucks enable row level security;
-- alter table drivers enable row level security;
-- ... (créer des policies par société / utilisateur)
