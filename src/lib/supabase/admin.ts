import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

function getSupabaseServiceKey(): string {
  const keys = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY
  ];
  for (const k of keys) {
    if (k && typeof k === "string") {
      const cleaned = k.trim().replace(/^["']|["']$/g, "");
      if (cleaned && !cleaned.includes("placeholder")) {
        return cleaned;
      }
    }
  }
  return "placeholder-service-key";
}

function getSupabaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://placeholder.supabase.co";
  return rawUrl.trim().replace(/^["']|["']$/g, "");
}

export function createAdminClient() {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceKey();
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
