import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseEnv = Boolean(url && key)

if (!hasSupabaseEnv) {
  console.warn('[Warshati] Supabase env missing — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(url ?? 'http://localhost', key ?? 'anon', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
