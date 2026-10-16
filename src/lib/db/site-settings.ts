import { isSupabaseConfigured, supabaseAdmin } from "@/lib/db/supabase";
import { readStore, writeStore } from "@/lib/db/file-store";
import { hashPasscode, verifyPasscodeHash } from "@/lib/auth/password";
import { verifyPasscode as verifyEnvPasscode } from "@/lib/auth/session";

export interface SiteSettings {
  logoUrl: string | null;
  // Owner-settable master passcode, hashed with scrypt (see auth/password.ts).
  // Null until the Owner changes it via /admin/settings, at which point it
  // takes priority over the ADMIN_PASSCODE environment variable.
  masterPasscodeHash: string | null;
}

const SETTINGS_ROW_ID = "default";
const DEFAULT_SETTINGS: SiteSettings = { logoUrl: null, masterPasscodeHash: null };

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("data")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle();
    if (error) throw error;
    return { ...DEFAULT_SETTINGS, ...(data?.data as Partial<SiteSettings> | undefined) };
  }
  const { siteSettings } = await readStore();
  return { ...DEFAULT_SETTINGS, ...siteSettings };
}

async function saveSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ id: SETTINGS_ROW_ID, data: settings, updated_at: new Date().toISOString() });
    if (error) throw error;
    return settings;
  }

  await writeStore((store) => {
    store.siteSettings = settings;
  });
  return settings;
}

export async function setLogoUrl(logoUrl: string | null): Promise<SiteSettings> {
  const current = await getSiteSettings();
  return saveSiteSettings({ ...current, logoUrl });
}

export async function setMasterPasscode(passcode: string): Promise<SiteSettings> {
  const current = await getSiteSettings();
  return saveSiteSettings({ ...current, masterPasscodeHash: hashPasscode(passcode) });
}

/** Checks a login attempt against the Owner-set passcode if one exists,
 * falling back to the ADMIN_PASSCODE environment variable (the original
 * bootstrap credential) until the Owner changes it via /admin/settings. */
export async function verifyMasterPasscode(candidate: string): Promise<boolean> {
  const settings = await getSiteSettings();
  if (settings.masterPasscodeHash) {
    return verifyPasscodeHash(candidate, settings.masterPasscodeHash);
  }
  return verifyEnvPasscode(candidate);
}
