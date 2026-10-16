import { isSupabaseConfigured, supabaseAdmin } from "@/lib/db/supabase";
import { readStore, writeStore } from "@/lib/db/file-store";

export interface SiteSettings {
  logoUrl: string | null;
}

const SETTINGS_ROW_ID = "default";

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("data")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle();
    if (error) throw error;
    return (data?.data as SiteSettings) ?? { logoUrl: null };
  }
  const { siteSettings } = await readStore();
  return siteSettings;
}

export async function setLogoUrl(logoUrl: string | null): Promise<SiteSettings> {
  const settings: SiteSettings = { logoUrl };

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
