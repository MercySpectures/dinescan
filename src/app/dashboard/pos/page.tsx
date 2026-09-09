import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveRestaurant } from "@/lib/data/restaurant";
import { POSInterface } from "./pos-interface";

interface POSPageProps {
  searchParams?: {
    slug?: string;
  };
}

export default async function POSPage({ searchParams }: POSPageProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const restaurant = await getActiveRestaurant(supabase, user.id, undefined, searchParams?.slug);

  // 2. Fetch categories and items with fallback for new/demo environments
  const [{ data: dbCategories }, { data: dbMenuItems }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select("id, category_id, name, price, is_veg, is_available")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true })
  ]);

  const defaultCategories = [
    { id: "cat-starters", name: "Starters & Appetizers" },
    { id: "cat-[mains]", name: "Main Course" },
    { id: "cat-beverages", name: "Beverages & Drinks" },
    { id: "cat-desserts", name: "Desserts" }
  ];

  const defaultMenuItems = [
    { id: "pos-1", category_id: "cat-starters", name: "Paneer Tikka Grill", price: 289, is_veg: true, is_available: true },
    { id: "pos-2", category_id: "cat-[mains]", name: "Hyderabadi Chicken Biryani", price: 399, is_veg: false, is_available: true },
    { id: "pos-3", category_id: "cat-[mains]", name: "Butter Garlic Naan", price: 65, is_veg: true, is_available: true },
    { id: "pos-4", category_id: "cat-[mains]", name: "Dal Makhani Special", price: 249, is_veg: true, is_available: true },
    { id: "pos-5", category_id: "cat-beverages", name: "Iced Cold Coffee", price: 149, is_veg: true, is_available: true },
    { id: "pos-6", category_id: "cat-beverages", name: "Fresh Lime Soda", price: 89, is_veg: true, is_available: true },
    { id: "pos-7", category_id: "cat-desserts", name: "Choco Lava Cake", price: 179, is_veg: true, is_available: true }
  ];

  const categories = dbCategories && dbCategories.length > 0 ? dbCategories : defaultCategories;
  const menuItems =
    dbMenuItems && dbMenuItems.length > 0
      ? dbMenuItems.map((m) => ({ ...m, price: Number(m.price) }))
      : defaultMenuItems;

  return (
    <POSInterface
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      categories={categories}
      menuItems={menuItems}
      gstRate={Number(restaurant.gst_rate ?? 5)}
      enableGst={Boolean(restaurant.enable_gst ?? true)}
    />
  );
}
