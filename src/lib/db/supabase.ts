import { createClient } from "@supabase/supabase-js";

// Vercel's Supabase marketplace integration prefixes every var with the
// linked project's slug (e.g. "kopreview_SUPABASE_URL") instead of the plain
// "SUPABASE_URL" name — match by suffix so the Owner never has to rename vars.
function findEnv(suffix: string): string | undefined {
  if (process.env[suffix]) return process.env[suffix];
  const key = Object.keys(process.env).find((k) => k.endsWith(`_${suffix}`));
  return key ? process.env[key] : undefined;
}

const url = findEnv("SUPABASE_URL");
const serviceKey = findEnv("SUPABASE_SERVICE_ROLE_KEY");

/** True once real Supabase/Postgres credentials are supplied via env vars. */
export const isSupabaseConfigured = Boolean(url && serviceKey);

// Server-only client using the service role key — never expose this to the browser.
export const supabaseAdmin = isSupabaseConfigured
  ? createClient(url as string, serviceKey as string, {
      auth: { persistSession: false },
    })
  : null;
