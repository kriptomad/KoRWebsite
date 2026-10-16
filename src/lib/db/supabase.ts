import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** True once real Supabase/Postgres credentials are supplied via env vars. */
export const isSupabaseConfigured = Boolean(url && serviceKey);

// Server-only client using the service role key — never expose this to the browser.
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(url as string, serviceKey as string, {
      auth: { persistSession: false },
    })
  : null;
