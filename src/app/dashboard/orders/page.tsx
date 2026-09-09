import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveRestaurant } from "@/lib/data/restaurant";
import OrdersKanban, { LiveOrder } from "./kanban";

interface DashboardOrdersPageProps {
  searchParams?: {
    slug?: string;
  };
}

export default async function DashboardOrdersPage({ searchParams }: DashboardOrdersPageProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const restaurant = await getActiveRestaurant(supabase, user.id, undefined, searchParams?.slug);

  // Fetch active orders for the Kanban board
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
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(100);

  const initialOrders = (rawOrders || []) as unknown as LiveOrder[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Live Orders Board</h1>
          <p className="mt-1 text-sm text-gray-500">
            Realtime Kanban board for <span className="font-semibold text-slate-900 dark:text-white">{restaurant.name}</span>.
          </p>
        </div>
      </div>
      
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
         <OrdersKanban initialOrders={initialOrders} restaurantId={restaurant.id} />
      </div>
    </div>
  );
}
