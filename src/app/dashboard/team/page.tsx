import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserRestaurantRole } from "@/lib/auth/roles";
import { getActiveRestaurant } from "@/lib/data/restaurant";
import { TeamManager } from "./team-manager";

interface TeamPageProps {
  searchParams?: {
    slug?: string;
  };
}

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const restaurant = await getActiveRestaurant(supabase, user.id, undefined, searchParams?.slug);
  const userRole = await getUserRestaurantRole({ userId: user.id, restaurantId: restaurant.id });
  const role = userRole || "owner";

  if (role !== "owner" && role !== "manager") redirect(`/${restaurant.slug}/dashboard`);

  const { data: members } = await supabase
    .from("restaurant_memberships")
    .select("id, user_id, role, created_at")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false });

  return (
    <TeamManager
      initialMembers={(members || []).map((m) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role as "manager" | "kitchen" | "waiter" | "cashier" | "viewer",
        created_at: m.created_at
      }))}
      restaurantId={restaurant.id}
      restaurantSlug={restaurant.slug}
      restaurantName={restaurant.name}
    />
  );
}
