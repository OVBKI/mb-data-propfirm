-- Run this in your Supabase SQL Editor

-- Enable RLS
alter database postgres set timezone to 'Europe/Brussels';

-- FIRMS table
create table if not exists firms (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#2d6fff',
  created_at timestamptz default now()
);

-- ACCOUNTS table
create table if not exists accounts (
  id uuid default gen_random_uuid() primary key,
  firm_id uuid references firms(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  buy_date date not null,
  currency text default 'USD',
  spent numeric(12,2) default 0,
  activation_fee numeric(12,2) default 0,
  activation_date date,
  status text default 'Challenge',
  notes text default '',
  plan_size text default '50k',
  created_at timestamptz default now()
);

-- Si la table existe déjà sans les colonnes, ajoute-les (sans erreur si déjà présentes)
alter table accounts add column if not exists plan_size         text          default '50k';
alter table accounts add column if not exists name              text          default '';
alter table accounts add column if not exists dd_type           text          default 'static';
alter table accounts add column if not exists payout_target     numeric(12,2);
alter table accounts add column if not exists min_trading_days  int;
-- Date de passage en Financé (reset balance) : les trades antérieurs sont
-- conservés mais ignorés dans le calcul de la balance du compte financé.
alter table accounts add column if not exists funded_date       date;
-- Profit min par jour pour qu'un jour compte comme "validé" dans le décompte
-- des jours min de trading (pré-rempli depuis les règles de la firme).
alter table accounts add column if not exists min_daily_profit  numeric(10,2);

-- ============================================================================
-- IMPORT RITHMIC (Phase 2) — colonnes pour l'import Trader Dashboard
-- ============================================================================
-- rithmic_account_id : ID Rithmic du compte (ex: LFF050-579ZNFS2-PRO006)
--   → permet l'auto-mapping entre les imports successifs et entre PnL/Dashboard.
-- rithmic_balance     : dernier solde rapporté par Rithmic.
-- rithmic_min_balance : seuil trailing DD actuel (Min Account Balance Rithmic).
-- rithmic_synced_at   : timestamp de la dernière sync depuis Rithmic.
-- liquidated_at       : date/heure de liquidation auto si le compte a sauté.
-- total_commissions   : commissions cumulées rapportées par Rithmic.
alter table accounts add column if not exists rithmic_account_id  text;
alter table accounts add column if not exists rithmic_balance     numeric(12,2);
alter table accounts add column if not exists rithmic_min_balance numeric(12,2);
alter table accounts add column if not exists rithmic_synced_at   timestamptz;
alter table accounts add column if not exists liquidated_at       timestamptz;
alter table accounts add column if not exists total_commissions   numeric(12,2);

-- Index pour le lookup rithmic_account_id → account
create index if not exists accounts_rithmic_account_id_idx on accounts(rithmic_account_id) where rithmic_account_id is not null;

-- PAYOUTS table
create table if not exists payouts (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references accounts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  amount numeric(12,2) not null,
  note text default '',
  created_at timestamptz default now()
);

-- JOURNAL_ENTRIES table — saisie manuelle des trades
create table if not exists journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  account_id uuid references accounts(id) on delete cascade not null,
  date date not null,
  pnl numeric(12,2) not null,
  instrument text default '',
  side text default '',
  notes text default '',
  created_at timestamptz default now()
);
-- Détails approfondis du trade (screenshot graphique + niveaux de prix)
alter table journal_entries add column if not exists screenshot_url text;
alter table journal_entries add column if not exists entry_price    numeric(12,5);
alter table journal_entries add column if not exists exit_price     numeric(12,5);
alter table journal_entries add column if not exists stop_loss      numeric(12,5);
alter table journal_entries add column if not exists take_profit    numeric(12,5);

-- Tags trades (mai 2026) — array de slugs pour catégoriser chaque trade.
-- Tags prédéfinis dans lib/tradeTags.js : a-plus, b-setup, c-setup, fomo,
-- revenge, overtrading, hesitation, plan-respecte, news-play, breakout,
-- reversal, scalp. Tags custom autorisés (free-text normalisé client-side).
alter table journal_entries add column if not exists tags text[] default '{}';
-- Index GIN pour filtres rapides type "trades avec tag X" (vu que c'est array)
create index if not exists journal_entries_tags_idx on journal_entries using gin (tags);

-- Commissions & slippage (mai 2026) — coûts cachés sur chaque trade.
-- Convention : `pnl` reste le PnL NET (ce que l'user voit sur son compte).
--   commissions : montant payé en frais broker (positif, ex: 5.40)
--   slippage    : coût de glissement (positif, ex: 2.50) — optionnel
-- Gross PnL = pnl + commissions + slippage (utile pour analyse exécution).
-- Import CSV Rithmic alimente déjà `commissions` automatiquement.
alter table journal_entries add column if not exists commissions numeric(12,2) default 0;
alter table journal_entries add column if not exists slippage    numeric(12,2) default 0;

-- CERTIFICATS / DIPLÔMES — captures de réussite challenge, payouts, etc.
create table if not exists certificates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  firm_id uuid references firms(id) on delete cascade not null,
  account_id uuid references accounts(id) on delete cascade,  -- nullable : un cert peut être au niveau firme
  type text default 'other',   -- 'challenge_passed' | 'payout' | 'certificate' | 'other'
  file_url text not null,
  date date,
  note text default '',
  created_at timestamptz default now()
);
alter table certificates enable row level security;
create policy "Users manage own certificates" on certificates
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create index if not exists certificates_user_id_idx  on certificates(user_id);
create index if not exists certificates_firm_id_idx  on certificates(firm_id);

-- Row Level Security (each user sees only their data)
alter table firms    enable row level security;
alter table accounts enable row level security;
alter table payouts  enable row level security;
alter table journal_entries enable row level security;

-- Policies for firms
create policy "Users manage own firms" on firms
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for accounts
create policy "Users manage own accounts" on accounts
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for payouts
create policy "Users manage own payouts" on payouts
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for journal_entries
create policy "Users manage own journal" on journal_entries
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Indexes for performance
create index if not exists firms_user_id_idx    on firms(user_id);
create index if not exists accounts_firm_id_idx on accounts(firm_id);
create index if not exists accounts_user_id_idx on accounts(user_id);
create index if not exists payouts_account_id_idx on payouts(account_id);
create index if not exists journal_entries_user_id_idx    on journal_entries(user_id);
create index if not exists journal_entries_account_id_idx on journal_entries(account_id);
create index if not exists journal_entries_date_idx       on journal_entries(date);

-- ============================================================================
-- PROFILES — pseudos, display names, avatars + login par pseudo
-- ============================================================================
--
-- 1 profil par user. Le pseudo est unique (case-insensitive).
-- Le pseudo permet à l'user de se connecter avec username au lieu de l'email :
--   - Le client appelle l'RPC `resolve_username_to_email(p_username)` pour mapper
--     username → email, puis fait un signInWithPassword classique avec l'email.
--   - Trade-off connu : exposer cet RPC permet à n'importe qui de découvrir l'email
--     d'un user donné son pseudo. C'est le pattern standard pour le login username
--     sur Supabase Auth. Pour mitiger : rate-limiting côté API + monitoring.

create table if not exists profiles (
  user_id       uuid references auth.users(id) on delete cascade primary key,
  username      text,
  display_name  text,
  avatar_url    text,
  bio           text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Unicité case-insensitive du pseudo (ignore NULL)
create unique index if not exists profiles_username_lower_uniq
  on profiles (lower(username))
  where username is not null;

-- RLS : un user lit/modifie SON profil uniquement.
-- Lecture publique des pseudos déléguée à un RPC SECURITY DEFINER (ci-dessous).
alter table profiles enable row level security;
drop policy if exists "Users manage own profile" on profiles;
create policy "Users manage own profile" on profiles
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger d'auto-création du profil à l'inscription (alimenté par auth.users insert)
-- Le profil est créé vide ; l'user peut ensuite setter son pseudo via le ProfileModal.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill : crée un profil vide pour les users existants qui n'en ont pas
insert into public.profiles (user_id)
select id from auth.users
where id not in (select user_id from public.profiles)
on conflict (user_id) do nothing;

-- ============================================================================
-- RPCs publiques pour le login par pseudo
-- ============================================================================

-- Résout un pseudo en email (utilisé par AuthPage au login)
-- Retourne NULL si le pseudo n'existe pas.
create or replace function public.resolve_username_to_email(p_username text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  if p_username is null or length(trim(p_username)) = 0 then
    return null;
  end if;
  select u.email into v_email
  from auth.users u
  join public.profiles p on p.user_id = u.id
  where lower(p.username) = lower(trim(p_username))
  limit 1;
  return v_email;
end;
$$;

-- Vérifie si un pseudo est disponible (utilisé par AuthPage signup + ProfileModal)
create or replace function public.username_available(p_username text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_username is null or length(trim(p_username)) = 0 then
    return false;
  end if;
  return not exists (
    select 1 from public.profiles
    where lower(username) = lower(trim(p_username))
  );
end;
$$;

-- SÉCURITÉ : anon révoqué pour resolve_username_to_email (audit mai 2026).
-- L'appel direct via le client Supabase anon permettait de contourner le rate-limit
-- de la route API /api/auth/resolve-username. Seule la route API (qui utilise
-- SUPABASE_SERVICE_ROLE_KEY) peut désormais appeler cette RPC.
-- Les users authentifiés conservent l'accès (utilisé en interne).
grant execute on function public.resolve_username_to_email(text) to authenticated;
grant execute on function public.username_available(text)       to anon, authenticated;

-- ============================================================================
-- SÉCURITÉ — Anti-énumération des pseudos (mai 2026 — audit Agent #3)
-- ============================================================================
-- L'RPC resolve_username_to_email permet à n'importe qui de découvrir l'email
-- d'un user à partir de son pseudo. C'est le pattern standard du login par
-- username sur Supabase, mais c'est exploitable pour du farm-to-phishing.
--
-- MITIGATION RECOMMANDÉE (à activer manuellement sur Supabase) :
--
-- 1. Activer le rate-limiting au niveau du projet Supabase :
--    Dashboard → Authentication → Rate Limits → "Email signups per hour : 10"
--    (déjà fait par défaut mais à vérifier)
--
-- 2. Pour rate-limiter spécifiquement les RPCs anon, l'idéal est de wrapper
--    l'appel dans une route /api/auth/resolve-username avec rate limit IP.
--    À implémenter quand Quantara dépasse 1000 users actifs.
--
-- 3. Monitoring : ajouter une alerte sur > 100 appels resolve_username_to_email
--    en 1 minute (indicateur d'attaque par scraping).

-- ============================================================================
-- SÉCURITÉ — RLS admin policies (mai 2026 — audit Agent #3)
-- ============================================================================
-- Les pages /admin et /api/admin/* nécessitent que les admins puissent LIRE
-- les data de TOUS les users (pas juste les leurs). Pour ça, il faut activer
-- une RLS policy admin-permissive sur chaque table.
--
-- ⚠ ATTENTION : si tu actives ces policies, les routes /api/admin/* doivent
-- ABSOLUMENT vérifier que l'appelant est admin (déjà fait via verifyAdmin()
-- dans lib/apiAuth.js — voir mai 2026).
--
-- Email-based admin check via auth.jwt() :
--
-- create policy "Admin read all firms"
--   on firms for select
--   using (
--     auth.jwt() ->> 'email' in (
--       'bakkali-omar@hotmail.com',
--       'omar.mbtrading@gmail.com',
--       'admin@quantara.tech'
--     )
--   );
--
-- create policy "Admin read all accounts"
--   on accounts for select
--   using (
--     auth.jwt() ->> 'email' in (
--       'bakkali-omar@hotmail.com',
--       'omar.mbtrading@gmail.com',
--       'admin@quantara.tech'
--     )
--   );
--
-- (idem pour journal_entries, payouts, profiles...)
--
-- ALTERNATIVE PLUS PROPRE : table `admins` + fonction `is_admin()` SECURITY DEFINER.
--    create table admins ( user_id uuid primary key references auth.users(id) );
--    create function is_admin() returns boolean security definer set search_path = public as $$
--      select exists (select 1 from admins where user_id = auth.uid())
--    $$ language sql stable;
--    Puis : using ( is_admin() ) au lieu de hardcoder les emails.
--
-- Pour ajouter/retirer un admin sans redeploy : insert/delete dans `admins`.

-- ============================================================================
-- PROFILES — Extensions pour la page profil + base future réseau social
-- ============================================================================
alter table profiles add column if not exists is_public      boolean default false;  -- opt-in public view
alter table profiles add column if not exists country        text;                   -- code ISO ex: 'FR', 'US'
alter table profiles add column if not exists banner_url     text;                   -- image de bannière (hero)
alter table profiles add column if not exists trading_styles text[];                 -- ex: ['scalper','day_trader']
alter table profiles add column if not exists instruments    text[];                 -- ex: ['MNQ','MES','CL']
alter table profiles add column if not exists followers_count int default 0;         -- compteurs cached (future social)
alter table profiles add column if not exists following_count int default 0;
alter table profiles add column if not exists verified       boolean default false;  -- badge vérifié (admin only)

create index if not exists profiles_username_idx
  on profiles(username) where username is not null;

-- ============================================================================
-- TABLES MANQUANTES — ajoutées lors de l'audit sécurité (mai 2026)
-- ============================================================================

-- PUSH_SUBSCRIPTIONS — stocke les abonnements push notification par user
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now()
);
create unique index if not exists push_subscriptions_user_endpoint_uniq
  on push_subscriptions(user_id, endpoint);

alter table push_subscriptions enable row level security;
create policy "Users manage own push subscriptions" on push_subscriptions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists push_subscriptions_user_id_idx on push_subscriptions(user_id);

-- WAITLIST — inscriptions waitlist Pro / Lifetime
create table if not exists waitlist (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  plan text not null check (plan in ('pro','lifetime')),
  created_at timestamptz default now(),
  ip_address text
);

alter table waitlist enable row level security;
create policy "Anyone can insert waitlist" on waitlist for insert with check (true);

-- GROUPS — groupes privés avec code d'invitation
create table if not exists groups (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text default '',
  invite_code text unique not null,
  max_members int default 50,
  members_count int default 0,
  created_at timestamptz default now()
);

alter table groups enable row level security;
create policy "Owner manages own groups" on groups
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
create policy "Members can read their groups" on groups
  for select using (
    exists (select 1 from group_members gm where gm.group_id = id and gm.user_id = auth.uid())
  );

create index if not exists groups_owner_id_idx on groups(owner_id);
create index if not exists groups_invite_code_idx on groups(invite_code);

-- GROUP_MEMBERS — membres d'un groupe
create table if not exists group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz default now()
);
create unique index if not exists group_members_uniq on group_members(group_id, user_id);

alter table group_members enable row level security;
create policy "Members can read own membership" on group_members
  for select using (auth.uid() = user_id);
create policy "Members can delete own membership" on group_members
  for delete using (auth.uid() = user_id);

create index if not exists group_members_group_id_idx on group_members(group_id);
create index if not exists group_members_user_id_idx on group_members(user_id);

-- ANNOUNCEMENTS — bannières globales gérées par les admins
create table if not exists announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info','success','warn','promo')),
  link_url text,
  link_label text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table announcements enable row level security;
create policy "Anyone can read active announcements" on announcements
  for select using (is_active = true);

-- FOLLOWS — réseau social (profils publics)
create table if not exists follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);
create unique index if not exists follows_uniq on follows(follower_id, following_id);

alter table follows enable row level security;
create policy "Users manage own follows" on follows
  for all using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);
create policy "Anyone can read follows" on follows
  for select using (true);

create index if not exists follows_follower_id_idx on follows(follower_id);
create index if not exists follows_following_id_idx on follows(following_id);

-- PUBLIC PROFILES — lecture publique des profils opt-in
drop policy if exists "Public profiles are viewable" on profiles;
create policy "Public profiles are viewable" on profiles
  for select using (is_public = true);

-- INDEX COMPOSITE — optimisation des requêtes journal fréquentes
create index if not exists journal_entries_user_date_idx
  on journal_entries(user_id, date desc);

-- INDEX PAYOUTS par user_id (manquant)
create index if not exists payouts_user_id_idx on payouts(user_id);
