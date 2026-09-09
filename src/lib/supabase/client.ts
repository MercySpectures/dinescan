"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/supabase/types";

function getSupabaseKey(): string {
  const keys = [
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY
  ];
  for (const k of keys) {
    if (k && typeof k === "string") {
      const cleaned = k.trim().replace(/^["']|["']$/g, "");
      if (cleaned && !cleaned.includes("placeholder")) {
        return cleaned;
      }
    }
  }
  return "placeholder-anon-key";
}

function getSupabaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  return rawUrl.trim().replace(/^["']|["']$/g, "");
}

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (clientInstance) return clientInstance;
  const url = getSupabaseUrl();
  const key = getSupabaseKey();
  clientInstance = createBrowserClient<Database>(url, key);
  return clientInstance;
}
