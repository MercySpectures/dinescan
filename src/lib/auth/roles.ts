import { createServerSupabaseClient } from "@/lib/supabase/server";

export type RestaurantRole = "owner" | "manager" | "viewer";

export async function getUserRestaurantRole(input: {
  userId: string;
  restaurantId: string;
}): Promise<RestaurantRole | null> {
  const { userId, restaurantId } = input;
  const supabase = await createServerSupabaseClient();

  const { data: ownerRestaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (ownerRestaurant) return "owner";

  const { data: membership } = await supabase
    .from("restaurant_memberships")
    .select("role")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return null;
  if (membership.role === "manager" || membership.role === "viewer") return membership.role;
  return null;
}

export function canEditMenu(role: RestaurantRole | null): boolean {
  return role === "owner" || role === "manager";
}

export function canViewAnalytics(role: RestaurantRole | null): boolean {
  return role === "owner" || role === "manager" || role === "viewer";
}

