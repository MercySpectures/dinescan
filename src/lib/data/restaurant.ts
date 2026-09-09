import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

export interface RestaurantRecord {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  theme_color: string | null;
  logo_url: string | null;
  is_published: boolean;
  table_count: number | null;
  gst_number: string | null;
  gst_rate: number | null;
  enable_gst: boolean | null;
  owner_id: string;
  created_at: string;
}

export async function getActiveRestaurant(
  supabase: SupabaseClient<Database>,
  userId: string,
  preferredRestaurantId?: string,
  slug?: string
): Promise<RestaurantRecord> {
  // 0a. If a specific restaurant slug is in URL (e.g. /silsila/dashboard)
  if (slug && slug !== "undefined") {
    const { data: slugRest } = await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .limit(1);

    if (slugRest && slugRest.length > 0) {
      return slugRest[0] as RestaurantRecord;
    }
  }

  // 0b. If a specific restaurant ID is requested (e.g. from active selector or master admin override)
  if (preferredRestaurantId && preferredRestaurantId !== "undefined") {
    const { data: prefRest } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", preferredRestaurantId)
      .limit(1);

    if (prefRest && prefRest.length > 0) {
      return prefRest[0] as RestaurantRecord;
    }
  }

  // 1. Check if user is owner of restaurants (Order by NEWEST created first, limit 1 to avoid PGRST116 multi-row errors)
  const { data: ownerRests } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (ownerRests && ownerRests.length > 0) {
    return ownerRests[0] as RestaurantRecord;
  }

  // 2. Check if user has membership in a restaurant
  const { data: memberships } = await supabase
    .from("restaurant_memberships")
    .select("restaurant_id, restaurants(*)")
    .eq("user_id", userId)
    .limit(1);

  if (
    memberships &&
    memberships.length > 0 &&
    (memberships[0] as unknown as { restaurants: RestaurantRecord }).restaurants
  ) {
    return (memberships[0] as unknown as { restaurants: RestaurantRecord }).restaurants;
  }

  // 3. Fallback: Get most recently created restaurant in system (NEWEST created first)
  const { data: latestRests } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (latestRests && latestRests.length > 0) {
    return latestRests[0] as RestaurantRecord;
  }

  // 4. Default fallback record if DB has 0 records
  return {
    id: "demo-restaurant-id",
    name: "Silsila Restaurant",
    slug: "silsila-restaurant",
    description: "Authentic Dining & Specialty Menu",
    address: "124 Culinary Blvd",
    phone: "+91 98765 43210",
    theme_color: "#10B981",
    logo_url: null,
    is_published: true,
    table_count: 12,
    gst_number: "22AAAAA0000A1Z5",
    gst_rate: 5,
    enable_gst: true,
    owner_id: userId,
    created_at: new Date().toISOString()
  };
}
