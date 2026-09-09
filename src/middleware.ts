import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
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

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const isProtected =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/onboarding");

  if (!isProtected) return response;

  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  try {
    const supabase = createServerClient<Database>(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    });

    // Use getSession() — reads JWT from cookies (no network round-trip, instant)
    // This is the key fix for instant tab switching
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Redirect logged-in admin to admin panel
    if (
      request.nextUrl.pathname.startsWith("/dashboard") &&
      session.user?.email === "admin@dinescan.app"
    ) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  } catch (error) {
    console.error("Middleware auth error:", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/onboarding"]
};
