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

-- custom_drawdown : seuil de drawdown personnalisé par compte (USD).
-- NULL = utilise la valeur par défaut de la PropFirm (PROPFIRM_RULES).
-- Exemple : un user sur un compte 50k Lucid peut forcer 2000 ou 2500
-- à la place du 2500 standard. Utilisé par DrawdownHealthCard +
-- JournalPage equity chart quand non-NULL.
alter table accounts add column if not exists custom_drawdown    numeric(12,2);

-- Index pour le lookup rithmic_account_id → account
create index if not exists accounts_rithmic_account_id_idx on accounts(rithmic_account_id) where rithmic_account_id is not null;

-- ============================================================================
-- CFD / FOREX VERTICAL — colonnes pour l'onglet CFD (séparé des futures)
-- ============================================================================
-- `market` discrimine futures vs cfd. NULL/'futures' = compte futures historique
-- (les vues futures filtrent `market != 'cfd'`, l'onglet CFD filtre `market = 'cfd'`).
-- Les colonnes cfd_* ne sont renseignées que pour les comptes CFD ; les règles sont
-- pré-remplies depuis lib/cfdConstants.js à la création puis éditables.
alter table firms    add column if not exists market            text default 'futures';
alter table accounts add column if not exists market            text default 'futures';
alter table accounts add column if not exists cfd_model         text;          -- ex: '2-Step', 'Instant'
alter table accounts add column if not exists account_size      numeric(12,2); -- taille du compte CFD en $
alter table accounts add column if not exists cfd_step          int;           -- phase courante (0 = financé/instant, 1..n)
alter table accounts add column if not exists profit_target_pct numeric(5,2);  -- % cible de la phase
alter table accounts add column if not exists daily_loss_pct    numeric(5,2);
alter table accounts add column if not exists daily_loss_basis  text;          -- balance | equity | higher-of-balance-equity | balance+intraday-profit
alter table accounts add column if not exists max_loss_pct      numeric(5,2);
alter table accounts add column if not exists max_loss_basis    text;          -- static | trailing-relative | eod-trailing
alter table accounts add column if not exists profit_split      int;
alter table accounts add column if not exists platform          text;
alter table accounts add column if not exists leverage_forex    int;

-- Suivi de balance CFD (saisie manuelle dans CfdDrawdownCard / CfdAccountDrawer).
-- current_balance/balance_highwater/day_start_balance existaient déjà en base mais
-- manquaient dans ce fichier ; day_start_equity est NOUVEAU (audit juillet 2026) :
-- equity de début de journée, requise quand daily_loss_basis = 'equity' ou
-- 'higher-of-balance-equity' (sinon l'ancre daily dégénère silencieusement en solde).
-- ⚠️ À APPLIQUER manuellement dans le SQL editor Supabase :
--   alter table accounts add column if not exists day_start_equity numeric(12,2);
alter table accounts add column if not exists current_balance   numeric(12,2); -- equity/balance courante saisie par le trader
alter table accounts add column if not exists balance_highwater numeric(12,2); -- plus haut atteint (ne redescend jamais — bases trailing)
alter table accounts add column if not exists day_start_balance numeric(12,2); -- solde au début de la journée de trading
alter table accounts add column if not exists day_start_equity  numeric(12,2); -- equity au début de la journée (bases equity / higher-of)

-- Index pour filtrer rapidement les comptes/firmes par marché
create index if not exists accounts_market_idx on accounts(market);
create index if not exists firms_market_idx on firms(market);

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

-- SÉCURITÉ : anon révoqué (audit mai 2026) PUIS authenticated révoqué (audit juillet 2026)
-- pour resolve_username_to_email. Le grant `authenticated` permettait à n'importe quel
-- compte connecté d'appeler l'RPC directement via le client Supabase et d'énumérer
-- username → email en contournant le rate-limit de /api/auth/resolve-username.
-- Seule la route API (app/api/auth/resolve-username/route.js, qui utilise
-- SUPABASE_SERVICE_ROLE_KEY) appelle désormais cette RPC — le login par pseudo
-- continue donc de fonctionner. `public` est aussi révoqué (grant EXECUTE implicite
-- de Postgres à la création de la fonction).
-- ⚠️ À RE-APPLIQUER manuellement dans le SQL editor Supabase (le grant authenticated
-- existe déjà en base) :
--   revoke execute on function public.resolve_username_to_email(text) from public, anon, authenticated;
--   grant  execute on function public.resolve_username_to_email(text) to service_role;
revoke execute on function public.resolve_username_to_email(text) from public, anon, authenticated;
grant execute on function public.resolve_username_to_email(text) to service_role;
grant execute on function public.username_available(text)         to anon, authenticated;

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

-- FEEDBACK — retours beta (components/BetaFeedback.js). Insert client-side par
-- l'utilisateur connecté ; lecture réservée au service role (admin). NEW: open beta.
create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  type text not null default 'bug' check (type in ('bug','idea','other')),
  message text not null,
  url text,
  user_agent text,
  created_at timestamptz default now()
);
alter table feedback enable row level security;
-- Un utilisateur connecté ne peut insérer que ses propres retours ; personne ne
-- peut lire la table via l'anon key (les admins passent par le service role).
create policy "Users insert own feedback" on feedback for insert with check (auth.uid() = user_id);

-- CRON_HEARTBEAT — le dispatcher /api/cron/daily y écrit son dernier run (service
-- role uniquement). Permet à /admin/system de répondre à « est-ce que le cron tourne ? »
-- (le récap mensuel ne part que le 1er du mois, donc c'est le seul moyen de vérifier).
create table if not exists cron_heartbeat (
  job text primary key,
  last_run_at timestamptz,
  last_result jsonb
);
alter table cron_heartbeat enable row level security;
-- Aucune policy : seul le service role (dispatcher + lecture admin) accède à la table.

-- CUSTOM_PROPFIRMS — firmes gérées par l'admin (en plus du catalogue statique
-- lib/constants.js + lib/cfdConstants.js). CRUD via /api/admin/propfirms (service
-- role) ; lecture publique pour le merge in-app. `data` = blob de règles (forme
-- selon le marché : flagship/otherModels pour CFD, plans/rules pour futures).
create table if not exists custom_propfirms (
  id uuid default gen_random_uuid() primary key,
  market text not null check (market in ('futures','cfd')),
  name text not null,
  slug text,
  logo_url text,
  website text,
  reputation text,
  tagline text,
  data jsonb not null default '{}',
  is_active boolean default true,
  sort_order int default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (market, name)
);
alter table custom_propfirms enable row level security;
-- Lecture publique (le merge in-app lit via l'anon key) ; écritures par le service role uniquement.
create policy "custom_propfirms public read" on custom_propfirms for select using (true);

-- Bucket Storage requis pour les logos : Supabase Dashboard → Storage → New bucket
--   Nom : "propfirm-logos"  ·  coche "Public bucket"  ·  Save
-- Policies bucket : INSERT + DELETE = authenticated ; SELECT = public.

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
  active boolean default true,  -- colonne réelle en prod (le code admin lit/écrit `active`)
  created_at timestamptz default now()
);

alter table announcements enable row level security;
create policy "Anyone can read active announcements" on announcements
  for select using (active = true);

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

-- ============================================================================
-- STRIPE BILLING — colonnes d'abonnement + idempotence des webhooks
-- ============================================================================
-- Écrites EXCLUSIVEMENT par app/api/stripe/webhook (service role). Aucune
-- policy d'UPDATE n'est ajoutée : le client ne doit jamais pouvoir se donner
-- un plan. La policy de SELECT existante sur `profiles` suffit à la lecture.

alter table profiles add column if not exists plan                     text        default 'free';
alter table profiles add column if not exists plan_status              text;         -- statut Stripe brut : active, trialing, past_due, canceled, unpaid…
alter table profiles add column if not exists plan_interval            text;         -- month | year
alter table profiles add column if not exists plan_started_at          timestamptz;
alter table profiles add column if not exists plan_expires_at          timestamptz;  -- fin de la période en cours
alter table profiles add column if not exists plan_cancel_at_period_end boolean     default false;
alter table profiles add column if not exists stripe_customer_id       text;
alter table profiles add column if not exists stripe_subscription_id   text;
alter table profiles add column if not exists beta_grandfather         boolean     default false;
alter table profiles add column if not exists last_invoice_status      text;
alter table profiles add column if not exists last_invoice_at          timestamptz;

alter table profiles drop constraint if exists profiles_plan_check;
alter table profiles add constraint profiles_plan_check
  check (plan is null or plan in ('free','pro','elite','business'));

-- Le webhook retrouve le profil par stripe_customer_id : unique + indexé.
create unique index if not exists profiles_stripe_customer_id_uniq
  on profiles(stripe_customer_id) where stripe_customer_id is not null;

-- STRIPE_EVENTS — dédoublonnage des webhooks. Stripe garantit "au moins une
-- fois", pas "exactement une fois" : sans cette table un event rejoué peut
-- réappliquer un downgrade après un upgrade.
create table if not exists stripe_events (
  id           text primary key,         -- event.id Stripe (evt_…)
  type         text not null,
  -- processing : réservé, traitement en cours
  -- done       : traité — c'est CE statut qui fait qu'un rejeu est un doublon
  -- failed     : le handler a échoué, le rejeu doit reprendre immédiatement
  status       text default 'processing',
  received_at  timestamptz default now()
);
alter table stripe_events add column if not exists status text default 'processing';
alter table stripe_events enable row level security;
-- Aucune policy : service role uniquement (le webhook). Personne d'autre ne lit.

create index if not exists stripe_events_received_at_idx on stripe_events(received_at desc);

-- DASHBOARD_LAYOUT — disposition personnalisée de « Vue d'ensemble ».
-- Volontairement laissée inscriptible par le client : c'est une préférence
-- d'affichage appartenant à l'utilisateur, pas un droit d'accès. Elle n'est
-- donc PAS dans la liste des colonnes révoquées ci-dessous.
alter table profiles add column if not exists dashboard_layout jsonb;

-- ⚠️ ESCALADE DE PRIVILÈGE — CORRECTIF OBLIGATOIRE
-- ----------------------------------------------------------------------------
-- La policy "Users manage own profile" est `for all using (auth.uid() = user_id)`,
-- ce qui inclut UPDATE. Les colonnes de facturation vivant sur `profiles`, un
-- utilisateur authentifié pouvait s'auto-attribuer n'importe quel plan payant
-- depuis le navigateur, avec la simple anon key :
--
--   supabase.from('profiles')
--     .update({ plan: 'elite', plan_status: 'active', plan_expires_at: '2099-01-01' })
--     .eq('user_id', monId)                     -- RLS l'autorise : c'est SA ligne
--
-- RLS raisonne par LIGNE, pas par COLONNE : elle ne peut pas distinguer
-- « modifier son pseudo » de « se donner un abonnement ». On révoque donc le
-- droit UPDATE colonne par colonne. Le webhook Stripe passe par la service_role,
-- qui ignore RLS et les grants : il continue d'écrire normalement.
--
-- Les colonnes que le client édite légitimement (username, display_name, bio,
-- avatar_url, country, is_public, trading_styles) ne sont PAS touchées.
revoke update (
  plan, plan_status, plan_interval, plan_started_at, plan_expires_at,
  plan_cancel_at_period_end, stripe_customer_id, stripe_subscription_id,
  beta_grandfather, last_invoice_status, last_invoice_at
) on table profiles from authenticated, anon;

-- ⚠️ Un futur `grant all on profiles to authenticated` ré-ouvrirait la faille.
-- Rejouer ce revoke après toute modification des grants sur `profiles`.
--
-- Vérification (doit renvoyer 0 ligne) :
--   select column_name from information_schema.column_privileges
--   where table_name = 'profiles' and privilege_type = 'UPDATE'
--     and grantee = 'authenticated' and column_name like 'plan%';

-- ============================================================================
-- QUOTAS PAR PALIER — application côté BASE (pas côté application)
-- ============================================================================
-- Toute la création (firmes, comptes, trades) part du navigateur en direct vers
-- Supabase avec la clé anon : il n'y a AUCUNE route API à protéger. Une
-- vérification en JavaScript ne serait qu'un affichage — l'utilisateur ouvre la
-- console et insère quand même. L'enforcement doit donc vivre ici.
--
-- ⚠️ CES CHIFFRES DOIVENT REFLÉTER lib/planLimits.js (PLAN_LIMITS).
-- En cas de divergence c'est la BASE qui gagne, et elle échoue FERMÉ : au pire
-- l'utilisateur est bloqué trop tôt, jamais servi gratuitement. Modifier l'un
-- sans l'autre est un bug — les deux fichiers se citent mutuellement.
--
-- Le service_role n'est pas concerné (il ne passe pas par ces triggers en
-- pratique : imports admin et crons écrivent avec des droits élevés).

create or replace function public.plan_limit_for(p_user_id uuid, p_key text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text; v_status text; v_beta boolean;
begin
  select plan, plan_status, coalesce(beta_grandfather, false)
    into v_plan, v_status, v_beta
    from profiles where user_id = p_user_id;

  -- Bêta-testeur historique : déplafonné à vie (miroir de effectivePlan()).
  if v_beta then return null; end if;

  -- past_due garde l'accès : la relance Stripe tourne encore. Couper au premier
  -- échec de paiement transforme une carte expirée en churn définitif.
  if v_plan in ('pro','elite','business')
     and v_status in ('active','trialing','past_due') then
    return null;                     -- illimité
  end if;

  -- Tout le reste retombe sur Free.
  return case p_key
    when 'maxFirms'           then 1
    when 'maxAccounts'        then 3
    when 'maxTradesPerMonth'  then 20
    else null
  end;
end $$;

-- ── Firmes ───────────────────────────────────────────────────────────────────
create or replace function public.enforce_firm_quota()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_max int; v_count int;
begin
  v_max := public.plan_limit_for(new.user_id, 'maxFirms');
  if v_max is null then return new; end if;
  select count(*) into v_count from firms where user_id = new.user_id;
  if v_count >= v_max then
    raise exception 'PLAN_LIMIT_REACHED:maxFirms:%', v_max
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists firms_quota on firms;
create trigger firms_quota before insert on firms
  for each row execute function public.enforce_firm_quota();

-- ── Comptes ──────────────────────────────────────────────────────────────────
create or replace function public.enforce_account_quota()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_max int; v_count int;
begin
  v_max := public.plan_limit_for(new.user_id, 'maxAccounts');
  if v_max is null then return new; end if;
  select count(*) into v_count from accounts where user_id = new.user_id;
  if v_count >= v_max then
    raise exception 'PLAN_LIMIT_REACHED:maxAccounts:%', v_max
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists accounts_quota on accounts;
create trigger accounts_quota before insert on accounts
  for each row execute function public.enforce_account_quota();

-- ── Trades ───────────────────────────────────────────────────────────────────
-- Le plafond porte sur le MOIS CALENDAIRE de la date du trade, pas sur la date
-- de saisie : sinon un import d'historique consommerait le quota du mois courant.
create or replace function public.enforce_trade_quota()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_max int; v_count int;
begin
  v_max := public.plan_limit_for(new.user_id, 'maxTradesPerMonth');
  if v_max is null then return new; end if;
  select count(*) into v_count from journal_entries
    where user_id = new.user_id
      and date >= date_trunc('month', new.date)::date
      and date <  (date_trunc('month', new.date) + interval '1 month')::date;
  if v_count >= v_max then
    raise exception 'PLAN_LIMIT_REACHED:maxTradesPerMonth:%', v_max
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists journal_entries_quota on journal_entries;
create trigger journal_entries_quota before insert on journal_entries
  for each row execute function public.enforce_trade_quota();

-- Index de comptage : sans lui, chaque insert de trade scanne la table.
create index if not exists journal_entries_user_month_idx
  on journal_entries(user_id, date);

-- ============================================================================

-- GRANDFATHER DES BÊTA-TESTEURS — à jouer LE JOUR du lancement payant, une
-- seule fois, en remplaçant la date par celle du lancement :
--   update profiles set beta_grandfather = true
--   where created_at < '2026-09-01' and coalesce(beta_grandfather, false) = false;


-- ============================================================================
-- SYNCHRONISATION TRADOVATE (OAuth)
-- ----------------------------------------------------------------------------
-- Tradovate est une API REST simple : pas de service Python séparé, tout tient
-- dans les routes Next.js.
--
-- ⚠️ AUCUN MOT DE PASSE ICI. L'authentification passe par OAuth : l'utilisateur
-- autorise un accès en lecture seule chez Tradovate et nous ne recevons qu'un
-- JETON. La voie mot de passe a été abandonnée — elle exige un abonnement API à
-- 25 $/mois côté utilisateur, et les PropFirms désactivent la génération de clé
-- API sur les comptes d'évaluation et financés.
--
-- Le jeton reste chiffré (AES-256-GCM, lib/cryptoBox.js) : RLS ne protège pas
-- d'une fuite de sauvegarde, le chiffrement si.
-- ============================================================================
create table if not exists tradovate_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  label text not null,
  -- Nom d'utilisateur Tradovate, renvoyé par l'API après autorisation. Sert
  -- uniquement à afficher DE QUEL compte il s'agit dans la liste.
  username text,
  encrypted_token text not null,
  token_expires_at timestamptz,
  -- ⚠️ « demo » PAR DÉFAUT, et c'est volontaire : un compte PropFirm vit sur
  -- l'environnement demo de Tradovate même quand les payouts sont réels. Viser
  -- « live » renvoie « identifiants invalides » sans autre explication.
  environment text not null default 'demo' check (environment in ('live', 'demo')),
  auto_sync boolean not null default true,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, label)
);

alter table tradovate_credentials enable row level security;

drop policy if exists "tradovate_credentials owner" on tradovate_credentials;
create policy "tradovate_credentials owner" on tradovate_credentials
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Le client liste et supprime ses connexions, mais ne touche jamais au jeton :
-- il transite uniquement par les routes serveur.
revoke select (encrypted_token) on table tradovate_credentials from authenticated, anon;
revoke update (encrypted_token) on table tradovate_credentials from authenticated, anon;

-- Rattache un compte Quantara à un compte Tradovate. Sans ça, on ne saurait pas
-- dans quel compte écrire les trades importés.
alter table accounts add column if not exists tradovate_account_id text;
create index if not exists accounts_tradovate_idx on accounts(tradovate_account_id)
  where tradovate_account_id is not null;

-- `source_id` porte l'identité d'un trade importé. L'index UNIQUE est ce qui
-- rend la synchronisation idempotente : relancer sur la même période met à jour
-- au lieu de dupliquer. Partiel, car les trades saisis à la main n'ont pas de
-- source_id et seraient tous en conflit sur NULL.
create unique index if not exists journal_entries_source_uniq
  on journal_entries(user_id, source_id)
  where source_id is not null;
