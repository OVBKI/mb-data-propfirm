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
alter table accounts add column if not exists plan_size text default '50k';
alter table accounts add column if not exists name      text default '';
alter table accounts add column if not exists dd_type   text default 'static';

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
