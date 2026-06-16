# Supabase Integration Stub — ChainWatch Pro

This folder contains a ready-to-use Supabase client stub + migrations so you can quickly add real auth, persistent API keys, subscriptions, and usage tracking.

## Quick start

1. Create a Supabase project (free tier is perfect).
2. Copy `.env.example` → `.env` (in project root) and fill:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. Run the SQL in `migrations/001_init.sql` in the Supabase SQL editor (or use Supabase CLI `supabase db push`).
4. (Optional) Turn on Email/Password or Magic Link auth in Authentication → Providers.

## What it gives you

- Persistent user profiles + tier
- API key storage (demo only — hash in prod + use service role for writes)
- Subscriptions table
- Basic usage tracking
- Realtime potential for live alerts later

The web app falls back gracefully to localStorage when Supabase env vars are missing.

## Security notes

- Never commit real keys.
- Use Row Level Security (RLS) policies so users can only see their own rows.
- For production API key issuance, do it server-side with the service_role key (never expose it to browser).
- Example RLS (add in Supabase dashboard):

```sql
-- profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);

-- api_keys (example)
create policy "Users manage own keys" on api_keys for all using (auth.uid() = user_id);
```

See the main README and backend/ for how this fits the full SaaS architecture.
