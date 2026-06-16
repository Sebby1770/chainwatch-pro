/**
 * Supabase integration stub for ChainWatch Pro.
 * 
 * Usage:
 * - Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (or hardcode for demo)
 * - This provides auth + DB for users, api_keys, subscriptions, scan usage.
 * - In production: enable email auth, RLS policies, and server-side service role key for sensitive ops.
 *
 * Tables (see migrations/):
 *   - profiles (id, email, tier, created_at)
 *   - api_keys (id, user_id, key, name, created_at, last_used)
 *   - subscriptions (id, user_id, plan, status, current_period_end)
 *   - usage (id, user_id, scans_count, month)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR-PROJECT.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR-ANON-KEY-HERE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper: get or create demo user profile (client-side only demo)
export async function ensureDemoProfile(email = 'demo@chainwatch.pro') {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user

  // For pure client demo we can use anon + a "magic" upsert
  // In real app: use supabase.auth.signInWithPassword or signInWithOtp
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ email, tier: 'free' }, { onConflict: 'email' })
    .select()
    .single()

  if (error) console.warn('Supabase profile upsert (demo):', error.message)
  return data
}

// Persist API key to Supabase (or fallback)
export async function saveApiKeyToSupabase(key: string, userId?: string) {
  try {
    const { error } = await supabase.from('api_keys').insert({
      key_prefix: key.slice(0, 12),
      key, // NOTE: in prod NEVER store plaintext keys. Hash them server-side.
      name: 'Web Demo Key',
      user_id: userId || 'demo-user',
    })
    if (error) throw error
    return true
  } catch (e) {
    console.warn('Supabase save key failed, using local only:', e)
    return false
  }
}

export async function getUserTier() {
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('status', 'active')
      .single()
    return data?.plan || 'free'
  } catch {
    return 'free'
  }
}

// Example: record a scan usage event
export async function recordScanUsage() {
  await supabase.from('usage').insert({ event: 'scan', count: 1, month: new Date().toISOString().slice(0,7) })
}

// === Actual Auth helpers (Supabase) ===
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  // Create profile row if new user
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      tier: 'free'
    }, { onConflict: 'id' })
  }
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Try to load profile + tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, tier')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: profile?.email || user.email,
    tier: profile?.tier || 'free',
  }
}

export async function getOrCreateProfile() {
  const user = await getCurrentUser()
  if (user) return user

  // Fallback for demo without login
  return ensureDemoProfile()
}
