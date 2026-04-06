import PublicMenuClient, { PublicItem } from "@/app/menu/[slug]/client";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface PublicMenuPageProps {
  params: { slug: string };
}

export default async function PublicMenuPage({ params }: PublicMenuPageProps) {
  const supabase = await createServerSupabaseClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, address, phone, is_published, logo_url")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!restaurant || !restaurant.is_published) {
    notFound();
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("restaurant_id", restaurant.id);

  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category.name]));

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("id, category_id, name, description, price, image_url, is_veg, is_featured, is_available")
    .eq("restaurant_id", restaurant.id)
    .eq("is_available", true)
    .order("sort_order");

  const items: PublicItem[] = (menuItems ?? []).map((item) => ({
    id: item.id,
    category: categoryMap.get(item.category_id) ?? "General",
    name: item.name,
    description: item.description ?? "",
    price: item.price,
    imageUrl: item.image_url,
    isVeg: item.is_veg,
    isFeatured: item.is_featured
  }));

  const userAgent = (await headers()).get("user-agent");
  await supabase.from("scan_events").insert({
    restaurant_id: restaurant.id,
    user_agent: userAgent
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8">
      <div className="mt-6">
        <PublicMenuClient
          items={items}
          restaurant={{
            id: restaurant.id,
            slug: params.slug,
            name: restaurant.name,
            address: restaurant.address,
            phone: restaurant.phone,
            logo_url: restaurant.logo_url
          }}
        />
      </div>
    </main>
  );
}
