import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import OrdersKanban, { LiveOrder } from "./kanban";

export default async function DashboardOrdersPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!restaurant) redirect("/dashboard/settings");

  // Fetch active orders for the Kanban board (not cancelled, or perhaps today's)
  const { data: rawOrders } = await supabase
    .from("orders")
    .select(`
      id, 
      table_code, 
      status, 
      total, 
      created_at,
      items:order_items(name, qty, price, note)
    `)
    .eq("restaurant_id", restaurant.id)
    .neq("status", "cancelled") // Example: hide cancelled entirely from Kanban
    .order("created_at", { ascending: false })
    .limit(100); // 100 active orders max for performance

  const initialOrders = (rawOrders || []) as unknown as LiveOrder[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Live Orders Board</h1>
          <p className="mt-1 text-sm text-gray-500">
            Realtime Kanban board for <span className="font-medium text-navy-900">{restaurant.name}</span>.
          </p>
        </div>
      </div>
      
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
         <OrdersKanban initialOrders={initialOrders} restaurantId={restaurant.id} />
      </div>
    </div>
  );
}

