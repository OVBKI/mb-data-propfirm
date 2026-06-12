-- FLEETLY — Données d'exemple pour Supabase (générées automatiquement).
-- À exécuter dans Supabase → SQL Editor APRÈS supabase-schema.sql et supabase-policies.sql.
-- Réexécutable : on vide d'abord les tables.

-- Met à jour une base existante avec les colonnes ajoutées après coup
-- (conformité RSE, éco-conduite, chronotachygraphe). Idempotent.
alter table public.drivers add column if not exists drive_today_min int default 0;
alter table public.drivers add column if not exists drive_week_min int default 0;
alter table public.drivers add column if not exists last_weekly_rest date;
alter table public.drivers add column if not exists card_download_date date;
alter table public.drivers add column if not exists eco_score int default 0;
alter table public.drivers add column if not exists harsh_braking int default 0;
alter table public.drivers add column if not exists speeding int default 0;
alter table public.drivers add column if not exists idling_pct numeric default 0;
alter table public.trucks add column if not exists tacho_download_date date;

truncate public.appointments, public.invoices, public.expenses, public.documents, public.maintenances, public.missions, public.trucks, public.trackers, public.drivers restart identity cascade;

-- drivers
insert into public.drivers (id, first_name, last_name, phone, license_cats, license_number, license_expiry, status, hired_at, drive_today_min, drive_week_min, last_weekly_rest, card_download_date, eco_score, harsh_braking, speeding, idling_pct) values
  ('d5d5eb1a-d2fe-47a4-b7b5-8e1a396f1922', 'Karim', 'Benali', '06 12 34 56 78', 'C, CE', 'B-558214', '2027-04-12', 'en_service', '2021-03-01', 495, 3120, '2026-06-07', '2026-05-18', 92, 2, 1, 8),
  ('81e9778b-29a4-4cfb-a1be-193923c078fe', 'Youssef', 'El Amrani', '06 22 11 09 44', 'C, CE', 'B-114902', '2026-08-30', 'en_service', '2019-09-15', 585, 3300, '2026-06-06', '2026-05-13', 76, 6, 4, 14),
  ('6af45fe6-97f6-4633-8a97-76002a0e0086', 'Sophie', 'Marchand', '07 88 45 12 03', 'C', 'A-902173', '2026-07-05', 'disponible', '2022-06-20', 240, 2100, '2026-06-09', '2026-06-02', 88, 3, 1, 9),
  ('0d45d79e-acde-4371-a0d1-98fcc12a52d4', 'Mehdi', 'Tahiri', '06 70 33 21 88', 'C, CE', 'B-330145', '2025-09-01', 'conge', '2020-01-10', 0, 0, '2026-06-11', '2026-05-23', 85, 2, 2, 7),
  ('f62f0d04-6692-41e9-b4c0-867849f0f9f8', 'Lucas', 'Petit', '07 41 25 67 90', 'C', 'A-771430', '2028-02-18', 'disponible', '2023-11-02', 320, 2640, '2026-06-08', '2026-05-17', 71, 7, 5, 18);

-- trackers
insert into public.trackers (id, imei, model, sim_number, status, last_lat, last_lng, last_speed, last_seen) values
  ('d168831c-c661-4c15-a690-980155dbe9d1', '356938035643809', 'Teltonika FMB920', '+212 6 00 11 22 33', 'actif', 48.8566, 2.3522, 0, '2026-06-12T15:07:47.782Z'),
  ('146169ff-066e-456f-9ff3-2ffdb65dd8be', '356938035641111', 'Teltonika FMB920', '+212 6 00 11 22 34', 'actif', 45.764, 4.8357, 82, '2026-06-12T15:10:47.782Z'),
  ('c5c538f6-3cdc-49e1-bb4a-220d21536640', '356938035642222', 'Concox GT06N', '+212 6 00 11 22 35', 'actif', 43.2965, 5.3698, 64, '2026-06-12T15:09:47.782Z'),
  ('cd095030-767a-4a78-90b6-c93809bc57a2', '356938035643333', 'Teltonika FMC130', '+212 6 00 11 22 36', 'actif', 47.2184, -1.5536, 0, '2026-06-12T15:00:47.782Z'),
  ('87121add-2100-410a-bfc9-0e134c5b6691', '356938035644444', 'Concox GT06N', '+212 6 00 11 22 37', 'en_panne', 43.6047, 1.4442, 0, '2026-06-12T03:11:47.782Z');

-- trucks
insert into public.trucks (id, plate, brand, model, year, mileage_km, fuel_type, capacity_t, status, driver_id, tracker_id, tacho_download_date) values
  ('7a04c68c-bd90-435f-9769-2330a3babd05', 'FR-128-AB', 'Renault', 'T High 520', 2021, 312450, 'diesel', 26, 'maintenance', 'd5d5eb1a-d2fe-47a4-b7b5-8e1a396f1922', 'd168831c-c661-4c15-a690-980155dbe9d1', '2026-03-19'),
  ('f7548c56-19c4-4291-8a55-fe22dfde7d4d', 'FR-942-CD', 'Volvo', 'FH 500', 2022, 198300, 'diesel', 26, 'en_route', '81e9778b-29a4-4cfb-a1be-193923c078fe', '146169ff-066e-456f-9ff3-2ffdb65dd8be', '2026-03-12'),
  ('07a48933-5819-4f50-9823-6c16ab4e3744', 'FR-377-EF', 'Mercedes', 'Actros 1845', 2020, 421900, 'diesel', 24, 'en_route', '6af45fe6-97f6-4633-8a97-76002a0e0086', 'c5c538f6-3cdc-49e1-bb4a-220d21536640', '2026-05-03'),
  ('49753b40-d3b8-4489-ad1d-ca3fb8990f12', 'FR-560-GH', 'Scania', 'R 450', 2023, 76200, 'diesel', 27, 'disponible', NULL, 'cd095030-767a-4a78-90b6-c93809bc57a2', '2026-06-02'),
  ('937d2f50-244b-4f54-ba0b-954ac6677307', 'FR-815-IJ', 'DAF', 'XF 480', 2019, 534100, 'diesel', 26, 'hors_service', NULL, '87121add-2100-410a-bfc9-0e134c5b6691', '2025-11-24');

-- missions
insert into public.missions (id, ref, origin, destination, truck_id, driver_id, cargo, weight_t, distance_km, price, pickup_date, delivery_date, status, notes) values
  ('3254e0d0-78ff-4356-ac6c-26d26229e59d', 'M-1042', 'Lyon', 'Marseille', 'f7548c56-19c4-4291-8a55-fe22dfde7d4d', '81e9778b-29a4-4cfb-a1be-193923c078fe', 'Palettes alimentaires', 18, 315, 1450, '2026-06-12', '2026-06-12', 'en_cours', 'Livraison avant 14h00'),
  ('cb83b40d-62b0-4ecb-8b30-005a861914de', 'M-1041', 'Paris', 'Lille', '07a48933-5819-4f50-9823-6c16ab4e3744', '6af45fe6-97f6-4633-8a97-76002a0e0086', 'Matériel électronique', 12, 225, 980, '2026-06-12', '2026-06-13', 'en_cours', ''),
  ('a4180c09-19d0-4758-93b5-a882474adac9', 'M-1043', 'Nantes', 'Bordeaux', '49753b40-d3b8-4489-ad1d-ca3fb8990f12', 'f62f0d04-6692-41e9-b4c0-867849f0f9f8', 'Mobilier', 9, 345, 1120, '2026-06-13', '2026-06-14', 'planifiee', 'Hayon requis'),
  ('31ac542e-9abd-4fc4-9240-94410502a603', 'M-1044', 'Marseille', 'Nice', '49753b40-d3b8-4489-ad1d-ca3fb8990f12', 'f62f0d04-6692-41e9-b4c0-867849f0f9f8', 'Produits frais', 14, 200, 760, '2026-06-15', '2026-06-15', 'planifiee', 'Température dirigée 4°C'),
  ('6431bc60-d1cc-4858-a963-ced9df829c89', 'M-1040', 'Toulouse', 'Montpellier', '7a04c68c-bd90-435f-9769-2330a3babd05', 'd5d5eb1a-d2fe-47a4-b7b5-8e1a396f1922', 'Matériaux BTP', 22, 240, 890, '2026-06-10', '2026-06-10', 'livree', ''),
  ('44054df1-50a7-4cb6-82f0-7f7eb5b59451', 'M-1039', 'Rennes', 'Paris', 'f7548c56-19c4-4291-8a55-fe22dfde7d4d', '81e9778b-29a4-4cfb-a1be-193923c078fe', 'Pièces automobiles', 16, 350, 1280, '2026-06-07', '2026-06-08', 'livree', ''),
  ('c3a91f8c-ba70-4eb1-ae81-2d7d67024ca9', 'M-1038', 'Lille', 'Marseille', '07a48933-5819-4f50-9823-6c16ab4e3744', '6af45fe6-97f6-4633-8a97-76002a0e0086', 'Électroménager', 21, 1000, 2400, '2026-06-03', '2026-06-04', 'livree', ''),
  ('31cbfdbf-280e-4e2a-9919-6a15eea9b25a', 'M-1037', 'Bordeaux', 'Lyon', 'f7548c56-19c4-4291-8a55-fe22dfde7d4d', '81e9778b-29a4-4cfb-a1be-193923c078fe', 'Vins & spiritueux', 19, 550, 1620, '2026-06-05', '2026-06-06', 'livree', ''),
  ('e931ebd2-f2ef-433a-8414-5f4aa490c5e8', 'M-1036', 'Paris', 'Lyon', '7a04c68c-bd90-435f-9769-2330a3babd05', 'd5d5eb1a-d2fe-47a4-b7b5-8e1a396f1922', 'Matériel industriel', 24, 465, 1780, '2026-06-02', '2026-06-03', 'livree', '');

-- maintenances
insert into public.maintenances (id, truck_id, type, date, mileage_km, cost, garage, next_due_date, next_due_km, status) values
  ('8b725ba2-f175-4929-a069-b5a7eb344ab7', '7a04c68c-bd90-435f-9769-2330a3babd05', 'vidange', '2026-05-20', 310000, 480, 'Garage Central', '2026-11-20', 340000, 'fait'),
  ('f7b5baf4-69e8-4ea5-a36e-87b90780459a', '7a04c68c-bd90-435f-9769-2330a3babd05', 'freins', '2026-06-08', 312000, 1250, 'Garage Central', NULL, NULL, 'fait'),
  ('13dbc30e-cd5a-46a7-abcd-38dc87d960c2', 'f7548c56-19c4-4291-8a55-fe22dfde7d4d', 'controle_technique', '2026-01-15', 180000, 95, 'DEKRA', '2026-07-15', NULL, 'a_prevoir'),
  ('4a9a6d19-cb32-4047-af4b-26074a0e6580', '07a48933-5819-4f50-9823-6c16ab4e3744', 'pneus', '2026-03-02', 410000, 2400, 'Euromaster', NULL, 460000, 'fait'),
  ('8065900b-95b6-4ceb-b981-fea629b6fcdc', '07a48933-5819-4f50-9823-6c16ab4e3744', 'controle_technique', '2025-06-01', 360000, 95, 'DEKRA', '2026-06-01', NULL, 'en_retard'),
  ('6933560d-7c80-4aac-9ced-2de90fa92847', '49753b40-d3b8-4489-ad1d-ca3fb8990f12', 'vidange', '2026-04-10', 70000, 460, 'Garage Central', '2026-10-10', 100000, 'fait');

-- documents
insert into public.documents (id, truck_id, type, number, issuer, issue_date, expiry_date, cost) values
  ('5830d166-3fe7-4ec7-a685-c4e06873f33a', '7a04c68c-bd90-435f-9769-2330a3babd05', 'assurance', 'POL-2026-1187', 'AXA', '2026-01-01', '2026-12-31', 3200),
  ('b9fd786b-ee32-42be-a7a8-7a81271add81', '7a04c68c-bd90-435f-9769-2330a3babd05', 'carte_grise', 'FR-128-AB', 'Préfecture', '2021-02-01', NULL, 0),
  ('7030cdc4-02b9-4f70-a1fb-2a9642749844', 'f7548c56-19c4-4291-8a55-fe22dfde7d4d', 'assurance', 'POL-2026-1188', 'AXA', '2026-01-01', '2026-12-31', 3100),
  ('93dd386d-56b2-4f7e-8cd9-94171c349ff5', 'f7548c56-19c4-4291-8a55-fe22dfde7d4d', 'controle_technique', 'CT-99213', 'DEKRA', '2026-01-15', '2026-07-15', 95),
  ('c51729cc-0342-4d0b-8ead-e0e7245ccfde', '07a48933-5819-4f50-9823-6c16ab4e3744', 'assurance', 'POL-2026-1190', 'Allianz', '2026-01-01', '2026-06-25', 3500),
  ('af5452c1-e4a2-4c1f-b6f1-9c4ed4d5a84b', '49753b40-d3b8-4489-ad1d-ca3fb8990f12', 'assurance', 'POL-2026-1192', 'AXA', '2026-01-01', '2026-12-31', 2900),
  ('ff9965c1-79fd-4b61-84ee-e193eb184538', '937d2f50-244b-4f54-ba0b-954ac6677307', 'controle_technique', 'CT-77120', 'DEKRA', '2025-05-01', '2026-05-01', 95);

-- expenses
insert into public.expenses (id, truck_id, driver_id, type, date, amount, liters) values
  ('61f93464-f60b-4ce3-b9cd-dd67fef1583f', 'f7548c56-19c4-4291-8a55-fe22dfde7d4d', '81e9778b-29a4-4cfb-a1be-193923c078fe', 'carburant', '2026-06-10', 412.5, 250),
  ('b4243848-ab8e-4a4c-a4d7-4a5cc648c84a', '07a48933-5819-4f50-9823-6c16ab4e3744', '6af45fe6-97f6-4633-8a97-76002a0e0086', 'carburant', '2026-06-09', 396, 240),
  ('503c1d25-882a-4589-add5-c49fbe6509e5', 'f7548c56-19c4-4291-8a55-fe22dfde7d4d', '81e9778b-29a4-4cfb-a1be-193923c078fe', 'peage', '2026-06-10', 78.4, NULL),
  ('f0d92426-4185-4e4d-aa2a-91f34cb12b4a', '7a04c68c-bd90-435f-9769-2330a3babd05', 'd5d5eb1a-d2fe-47a4-b7b5-8e1a396f1922', 'reparation', '2026-06-08', 1250, NULL),
  ('ea3d4292-32ce-4932-99e1-3c746d851fd0', '07a48933-5819-4f50-9823-6c16ab4e3744', '6af45fe6-97f6-4633-8a97-76002a0e0086', 'amende', '2026-06-05', 135, NULL),
  ('8c4abb80-6e39-437d-98a3-8d100993ecf5', '49753b40-d3b8-4489-ad1d-ca3fb8990f12', 'f62f0d04-6692-41e9-b4c0-867849f0f9f8', 'carburant', '2026-06-04', 360, 218),
  ('85bfdc72-15f2-4274-8c4d-da93dbb0dd06', '7a04c68c-bd90-435f-9769-2330a3babd05', 'd5d5eb1a-d2fe-47a4-b7b5-8e1a396f1922', 'carburant', '2026-06-01', 405.9, 246);

-- invoices
insert into public.invoices (id, number, client, mission_id, date, due_date, amount_ht, vat_rate, status, paid_date) values
  ('cba8e64b-3cd6-4caa-bfd5-010c12a98e94', 'FAC-2026-014', 'Industri''Pro SAS', 'e931ebd2-f2ef-433a-8414-5f4aa490c5e8', '2026-06-03', '2026-07-03', 1780, 10, 'payee', '2026-06-10'),
  ('60ae86fe-fe89-49c7-a888-c01060e78ed0', 'FAC-2026-013', 'ElectroDIS', 'c3a91f8c-ba70-4eb1-ae81-2d7d67024ca9', '2026-06-04', '2026-07-04', 2400, 10, 'payee', '2026-06-11'),
  ('19127bc5-eae7-468d-9bfc-eba2bce29f86', 'FAC-2026-012', 'Caves du Sud', '31cbfdbf-280e-4e2a-9919-6a15eea9b25a', '2026-06-06', '2026-07-06', 1620, 10, 'envoyee', NULL),
  ('aaac30b0-d9b8-4bc1-9aa3-ab625ac183db', 'FAC-2026-011', 'BTP Sud Matériaux', '6431bc60-d1cc-4858-a963-ced9df829c89', '2026-06-10', '2026-07-10', 890, 10, 'envoyee', NULL),
  ('2db03dda-52c3-49e4-a074-c922c580e7a9', 'FAC-2026-010', 'AutoParts Distribution', '44054df1-50a7-4cb6-82f0-7f7eb5b59451', '2026-05-03', '2026-06-02', 1280, 10, 'en_retard', NULL),
  ('ceb4eff9-bc72-4d4c-ba2d-023bd752a513', 'FAC-2026-015', 'FreshFood Logistique', '3254e0d0-78ff-4356-ac6c-26d26229e59d', '2026-06-11', '2026-07-11', 1450, 10, 'brouillon', NULL);

-- appointments
insert into public.appointments (id, title, type, date, time, driver_id, truck_id, location, status, notes) values
  ('a6a83ad2-71da-4373-9d21-54e4a248c572', 'Contrôle technique', 'controle_technique', '2026-06-12', '09:00', '6af45fe6-97f6-4633-8a97-76002a0e0086', '07a48933-5819-4f50-9823-6c16ab4e3744', 'DEKRA Lyon Est', 'a_faire', ''),
  ('f2b381fe-57a6-485a-ae4a-b9424af9bbad', 'Chargement Rungis', 'chargement', '2026-06-13', '06:00', '81e9778b-29a4-4cfb-a1be-193923c078fe', 'f7548c56-19c4-4291-8a55-fe22dfde7d4d', 'MIN de Rungis', 'a_faire', '22 palettes'),
  ('4ceedffa-7439-409f-a368-165ecb3c498e', 'Vidange + freins', 'entretien', '2026-06-13', '14:00', 'd5d5eb1a-d2fe-47a4-b7b5-8e1a396f1922', '7a04c68c-bd90-435f-9769-2330a3babd05', 'Garage Central', 'a_faire', ''),
  ('6637bc2a-5628-4bac-9690-afca641dffda', 'Réunion exploitation', 'reunion', '2026-06-14', '10:00', NULL, NULL, 'Bureau', 'a_faire', 'Point hebdo'),
  ('220231d7-0338-4145-8228-aeaf4cdc217a', 'Formation éco-conduite', 'formation', '2026-06-15', '09:00', 'f62f0d04-6692-41e9-b4c0-867849f0f9f8', NULL, 'Centre AFT', 'a_faire', ''),
  ('2c2775a0-1da5-4b83-9d37-03cf2f360ca0', 'Visite médicale', 'visite_medicale', '2026-06-16', '11:00', '81e9778b-29a4-4cfb-a1be-193923c078fe', NULL, 'Médecine du travail', 'a_faire', ''),
  ('8e67cba5-7a58-4c10-aa43-5c56f2d748c7', 'RDV client', 'rendez_vous', '2026-06-17', '15:00', '6af45fe6-97f6-4633-8a97-76002a0e0086', NULL, 'Lyon Part-Dieu', 'a_faire', ''),
  ('52401178-1adb-4bd4-8372-0fa1cc8417ed', 'Contrôle technique', 'controle_technique', '2026-06-19', '08:30', '81e9778b-29a4-4cfb-a1be-193923c078fe', 'f7548c56-19c4-4291-8a55-fe22dfde7d4d', 'DEKRA', 'a_faire', '');

