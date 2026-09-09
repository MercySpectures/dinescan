import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      }
    }
  });
}
