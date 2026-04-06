import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ScanPoint {
  date: string;
  count: number;
}

export interface DashboardAnalytics {
  restaurant: {
    id: string;
    slug: string;
    name: string;
    is_published: boolean;
  };
  kpis: {
    totalScans: number;
    menuItems: number;
    categories: number;
  };
  series: ScanPoint[];
  topItems: Array<{
    id: string;
    name: string;
    is_available: boolean;
    is_featured: boolean;
  }>;
  recentScans: Array<{
    id: string;
    scanned_at: string;
    user_agent: string | null;
  }>;
  totalRecentScans: number;
}

export interface DateRangeInput {
  rangeDays?: number;
  from?: string;
  to?: string;
}

export interface ResolvedDateRange {
  fromIso: string;
  toIso: string;
  label: string;
}

function toDayKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function buildSeries(scanRows: { scanned_at: string }[], rangeDays: number): ScanPoint[] {
  const today = new Date();
  const map = new Map<string, number>();
  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    map.set(key, 0);
  }
  scanRows.forEach((row) => {
    const key = toDayKey(row.scanned_at);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

export function resolveDateRange(input: DateRangeInput): ResolvedDateRange {
  const now = new Date();
  const safeRange = input.rangeDays && input.rangeDays > 0 ? input.rangeDays : 14;

  if (input.from && input.to) {
    const fromDate = new Date(`${input.from}T00:00:00.000Z`);
    const toDate = new Date(`${input.to}T23:59:59.999Z`);
    if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime()) && fromDate <= toDate) {
      return {
        fromIso: fromDate.toISOString(),
        toIso: toDate.toISOString(),
        label: `${input.from} to ${input.to}`
      };
    }
  }

  const from = new Date(now);
  from.setDate(from.getDate() - safeRange);
  return {
    fromIso: from.toISOString(),
    toIso: now.toISOString(),
    label: `Last ${safeRange} days`
  };
}

export async function getDashboardAnalytics(input: {
  ownerId: string;
  rangeDays?: number;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}): Promise<DashboardAnalytics | null> {
  const supabase = await createServerSupabaseClient();
  const { ownerId, page, pageSize } = input;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, is_published, name")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (!restaurant) return null;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const resolved = resolveDateRange({
    rangeDays: input.rangeDays,
    from: input.from,
    to: input.to
  });

  const rangeDaysForSeries = Math.max(
    1,
    Math.ceil((new Date(resolved.toIso).getTime() - new Date(resolved.fromIso).getTime()) / (1000 * 60 * 60 * 24))
  );

  const [scanCountRes, menuCountRes, categoryCountRes, scansRes, topItemsRes, recentPageRes] = await Promise.all([
    supabase.from("scan_events").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id),
    supabase.from("menu_items").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id),
    supabase.from("categories").select("*", { count: "exact", head: true }).eq("restaurant_id", restaurant.id),
    supabase
      .from("scan_events")
      .select("id, scanned_at, user_agent")
      .eq("restaurant_id", restaurant.id)
      .gte("scanned_at", resolved.fromIso)
      .lte("scanned_at", resolved.toIso)
      .order("scanned_at", { ascending: true }),
    supabase
      .from("menu_items")
      .select("id, name, is_available, is_featured, sort_order")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true })
      .limit(5),
    supabase
      .from("scan_events")
      .select("id, scanned_at, user_agent", { count: "exact" })
      .eq("restaurant_id", restaurant.id)
      .order("scanned_at", { ascending: false })
      .range(from, to)
  ]);

  const scanRows = (scansRes.data ?? []).map((row) => ({ scanned_at: row.scanned_at }));
  return {
    restaurant,
    kpis: {
      totalScans: scanCountRes.count ?? 0,
      menuItems: menuCountRes.count ?? 0,
      categories: categoryCountRes.count ?? 0
    },
    series: buildSeries(scanRows, rangeDaysForSeries),
    topItems: topItemsRes.data ?? [],
    recentScans: recentPageRes.data ?? [],
    totalRecentScans: recentPageRes.count ?? 0
  };
}

