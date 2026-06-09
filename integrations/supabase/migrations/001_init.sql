-- ChainWatch Pro Supabase schema (starter)
-- Run this in Supabase SQL editor.

create extension if not exists "uuid-ossp";

-- Profiles (synced with auth.users ideally via trigger in prod)
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  tier text default 'free',
  created_at timestamptz default now()
);

-- API Keys (demo: store hashed in real life)
create table if not exists api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,           -- or uuid references auth.users
  key_prefix text not null,
  key text,                        -- DEMO ONLY — hash + never return plaintext
  name text,
  created_at timestamptz default now(),
  last_used timestamptz
);

-- Subscriptions
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  plan text not null,              -- Scout | Operator | Desk
  status text default 'active',    -- active, past_due, canceled
  current_period_end timestamptz,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- Usage / scans (for metering)
create table if not exists usage (
  id bigserial primary key,
  user_id text,
  event text,                      -- 'scan', 'alert', 'export'
  count int default 1,
  month text,                      -- YYYY-MM
  created_at timestamptz default now()
);

-- Helpful indexes
create index if not exists idx_api_keys_user on api_keys(user_id);
create index if not exists idx_subs_user on subscriptions(user_id);
create index if not exists idx_usage_user_month on usage(user_id, month);

-- Example row level security (enable in dashboard + add policies)
-- alter table profiles enable row level security;
-- etc.

comment on table profiles is 'User profiles and current tier for ChainWatch Pro';
comment on table api_keys is 'User API keys (hash in production)';
comment on table subscriptions is 'Active/paid plans linked to Stripe';
comment on table usage is 'Metered usage for billing and limits';
