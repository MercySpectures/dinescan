import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import PublicMenuClient, { PublicItem } from "@/app/menu/[slug]/client";

interface PublicMenuPageProps {
  params: { slug: string };
  searchParams?: { preview?: string; theme?: string };
}

export async function generateMetadata({ params }: PublicMenuPageProps): Promise<Metadata> {
  const supabase = await createServerSupabaseClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, address, phone, logo_url")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!restaurant) {
    return {
      title: "Restaurant Menu | DineScan",
      description: "Digital Menu & Contactless QR Ordering"
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const title = `${restaurant.name} - Digital Menu & Contactless QR Ordering | DineScan`;
  const description = `Browse ${restaurant.name}'s digital menu, view chef recommendations, and place table orders online. ${
    restaurant.address ? `Located at ${restaurant.address}.` : ""
  }`;
  const menuUrl = `${siteUrl}/menu/${params.slug}`;
  const imageUrl = restaurant.logo_url || `${siteUrl}/analytics.png`;

  return {
    title,
    description,
    alternates: {
      canonical: menuUrl
    },
    openGraph: {
      title: `${restaurant.name} | Live Digital Menu`,
      description,
      url: menuUrl,
      siteName: "DineScan",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${restaurant.name} Digital Menu`
        }
      ],
      locale: "en_IN",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: `${restaurant.name} | Digital Menu & QR POS`,
      description,
      images: [imageUrl]
    }
  };
}

export default async function PublicMenuPage({ params, searchParams }: PublicMenuPageProps) {
  const isPreview = searchParams?.preview === "true";
  const supabase = await createServerSupabaseClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, address, phone, is_published, logo_url, theme_color")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!restaurant && !isPreview) {
    notFound();
  }

  if (restaurant && !restaurant.is_published && !isPreview) {
    notFound();
  }

  const effectiveRestaurant = restaurant || {
    id: "demo-restaurant-id",
    name: "Restaurant Preview",
    address: "Culinary Boulevard, Central District",
    phone: "+91 98765 43210",
    is_published: true,
    logo_url: null,
    theme_color: searchParams?.theme || "#10B981"
  };

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("restaurant_id", effectiveRestaurant.id);

  const categoryMap = new Map((categories ?? []).map((category) => [category.id, category.name]));

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("id, category_id, name, description, price, image_url, is_veg, is_featured, is_available")
    .eq("restaurant_id", effectiveRestaurant.id)
    .eq("is_available", true)
    .order("sort_order");

  let items: PublicItem[] = (menuItems ?? []).map((item) => ({
    id: item.id,
    category: categoryMap.get(item.category_id) ?? "Main Course",
    name: item.name,
    description: item.description ?? "",
    price: item.price,
    imageUrl: item.image_url,
    isVeg: item.is_veg,
    isFeatured: item.is_featured
  }));

  if (items.length === 0) {
    items = [
      {
        id: "item-1",
        category: "Starters",
        name: "Crispy Paneer Tikka",
        description: "Clay-oven grilled cottage cheese skewers marinated in mustard yogurt & aromatic spices.",
        price: 280,
        imageUrl: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80",
        isVeg: true,
        isFeatured: true
      },
      {
        id: "item-2",
        category: "Starters",
        name: "Tandoori Chicken Wings",
        description: "Smoky char-grilled chicken wings glazed with roasted garlic mint chutney.",
        price: 340,
        imageUrl: "https://images.unsplash.com/photo-1527477378308-1e0e7638c340?w=800&auto=format&fit=crop&q=80",
        isVeg: false,
        isFeatured: true
      },
      {
        id: "item-3",
        category: "Main Course",
        name: "Butter Chicken Delhi Style",
        description: "Tender roasted chicken simmered in rich creamy butter tomato gravy with fenugreek.",
        price: 390,
        imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80",
        isVeg: false,
        isFeatured: true
      },
      {
        id: "item-4",
        category: "Main Course",
        name: "Dal Makhani Royale",
        description: "Slow-cooked black lentils overnight with churned butter and dairy cream.",
        price: 290,
        imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
        isVeg: true,
        isFeatured: false
      },
      {
        id: "item-5",
        category: "Beverages",
        name: "Alphonso Mango Lassi",
        description: "Chilled thick blended curd with real Ratnagiri Alphonso mango pulp and pistachio slivers.",
        price: 150,
        imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
        isVeg: true,
        isFeatured: true
      }
    ];
  }

  try {
    const headerList = headers();
    const userAgent = headerList.get("user-agent");
    const adminSupabase = createAdminClient();
    await adminSupabase.from("scan_events").insert({
      restaurant_id: effectiveRestaurant.id,
      user_agent: userAgent
    });
  } catch (err) {
    console.error("Scan event log error (non-fatal):", err);
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B0F19]">
      <PublicMenuClient
        items={items}
        restaurant={{
          id: effectiveRestaurant.id,
          slug: params.slug,
          name: effectiveRestaurant.name,
          address: effectiveRestaurant.address,
          phone: effectiveRestaurant.phone,
          logo_url: effectiveRestaurant.logo_url,
          theme_color: effectiveRestaurant.theme_color
        }}
      />
    </div>
  );
}
