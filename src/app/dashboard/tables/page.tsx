import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserRestaurantRole, canManageTables } from "@/lib/auth/roles";
import { getActiveRestaurant } from "@/lib/data/restaurant";
import { TableGrid } from "./table-grid";

interface TablesPageProps {
  searchParams?: {
    slug?: string;
  };
}

export default async function TablesPage({ searchParams }: TablesPageProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const restaurant = await getActiveRestaurant(supabase, user.id, undefined, searchParams?.slug);
  const userRole = await getUserRestaurantRole({ userId: user.id, restaurantId: restaurant.id });
  const role = userRole || "owner";

  if (!canManageTables(role)) redirect("/dashboard");

  const { data: tables } = await supabase
    .from("tables")
    .select("id, table_number, capacity, status")
    .eq("restaurant_id", restaurant.id)
    .order("table_number", { ascending: true });

  return (
    <TableGrid
      initialTables={(tables || []).map((t) => ({
        id: t.id,
        table_number: t.table_number,
        capacity: Number(t.capacity || 4),
        status: t.status as "vacant" | "occupied" | "billing" | "reserved"
      }))}
      restaurantId={restaurant.id}
      restaurantSlug={restaurant.slug}
    />
  );
}
