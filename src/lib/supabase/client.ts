"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/supabase/types";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "placeholder-anon-key";
  return createBrowserClient<Database>(url, key);
}
