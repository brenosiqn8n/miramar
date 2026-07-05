import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

// Valid only if both are present AND the URL is a real https URL (empty strings
// or a bare value must not reach createClient, which throws and blanks the app).
export const supabaseConfigurado = Boolean(url && anonKey && /^https?:\/\//.test(url))

// `||` (not `??`) so empty strings also fall back → app renders in local mode
// instead of crashing with "supabaseUrl is required".
export const supabase = createClient(
  supabaseConfigurado ? url! : 'https://placeholder.supabase.co',
  supabaseConfigurado ? anonKey! : 'placeholder-anon-key',
)
