import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveDateRange } from "@/lib/data/dashboard";

function escapeCsv(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get("range");
  const range = rangeParam === "7" || rangeParam === "30" ? Number(rangeParam) : 14;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!restaurant) {
    return new NextResponse("Restaurant not found", { status: 404 });
  }

  const resolved = resolveDateRange({ rangeDays: range, from, to });
  const { data: rows } = await supabase
    .from("scan_events")
    .select("id, scanned_at, user_agent")
    .eq("restaurant_id", restaurant.id)
    .gte("scanned_at", resolved.fromIso)
    .lte("scanned_at", resolved.toIso)
    .order("scanned_at", { ascending: false });

  const lines = ["id,scanned_at,user_agent"];
  (rows ?? []).forEach((row) => {
    const userAgent = row.user_agent ?? "";
    lines.push(`${escapeCsv(row.id)},${escapeCsv(row.scanned_at)},${escapeCsv(userAgent)}`);
  });

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scans-${restaurant.slug}.csv"`
    }
  });
}
