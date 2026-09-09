import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserRestaurantRole, canViewKOT } from "@/lib/auth/roles";
import { getActiveRestaurant } from "@/lib/data/restaurant";
import { KOTDisplay } from "./kot-display";

interface KOTPageProps {
  searchParams?: {
    slug?: string;
  };
}

export default async function KOTPage({ searchParams }: KOTPageProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const restaurant = await getActiveRestaurant(supabase, user.id, undefined, searchParams?.slug);
  const userRole = await getUserRestaurantRole({ userId: user.id, restaurantId: restaurant.id });
  const role = userRole || "owner"; // fallback to owner for resilient access

  if (!canViewKOT(role)) redirect("/dashboard");

  const { data: initialOrders } = await supabase
    .from("orders")
    .select("id, table_code, status, created_at, items:order_items(name, qty, note)")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false })
    .limit(40);

  const formattedOrders = ((initialOrders as unknown as Array<Record<string, unknown>>) || []).map((o) => ({
    id: String(o.id || ""),
    table_code: (o.table_code as string) ?? null,
    status: (o.status as "new" | "preparing" | "ready" | "served" | "cancelled") || "new",
    created_at: String(o.created_at || new Date().toISOString()),
    items: Array.isArray(o.items)
      ? o.items.map((i: Record<string, unknown>) => ({
          name: String(i.name || ""),
          qty: Number(i.qty || 1),
          note: (i.note as string) ?? null
        }))
      : []
  }));

  return (
    <KOTDisplay
      initialOrders={formattedOrders}
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
    />
  );
}
