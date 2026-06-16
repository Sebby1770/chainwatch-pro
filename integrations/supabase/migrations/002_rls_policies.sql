-- Row Level Security Policies for ChainWatch Pro
-- Run after 001_init.sql and enable RLS on tables in Supabase dashboard or via SQL.

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- API Keys: users manage only their own keys
CREATE POLICY "Users can view own keys" ON api_keys
  FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'demo-user');

CREATE POLICY "Users can insert own keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = 'demo-user');

CREATE POLICY "Users can delete own keys" ON api_keys
  FOR DELETE USING (auth.uid()::text = user_id OR user_id = 'demo-user');

-- Subscriptions: view and manage own subs
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'demo-user');

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id = 'demo-user');

-- Usage: view own usage (insert typically via service role or triggers)
CREATE POLICY "Users can view own usage" ON usage
  FOR SELECT USING (auth.uid()::text = user_id OR user_id = 'demo-user');

-- Note: For production, use service_role key for inserts from backend workers.
-- Demo allows 'demo-user' for unauthenticated flows.

-- Optional: Grant usage on sequences if needed
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;