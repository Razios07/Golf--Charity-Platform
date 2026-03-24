const { createClient } = require('@supabase/supabase-js')

// Anon client — respects Row Level Security
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Admin client — bypasses RLS. ONLY use in server-side logic.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

module.exports = { supabase, supabaseAdmin }
