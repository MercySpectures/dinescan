import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import PublicMenuClient, { PublicItem } from "@/app/menu/[slug]/client";

interface DirectSlugPageProps {
  params: { slug: string };
}

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "menu",
  "privacy",
  "terms",
  "_next",
  "favicon.ico",
  "sitemap.xml",
  "robots.txt"
]);

export async function generateMetadata({ params }: DirectSlugPageProps): Promise<Metadata> {
  if (RESERVED_SLUGS.has(params.slug.toLowerCase())) {
    return {};
  }

  const supabase = await createServerSupabaseClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, address, phone, logo_url")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!restaurant) {
    return {
      title: "Restaurant Not Found | DineScan",
      description: "The requested digital menu could not be found."
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const title = `${restaurant.name} - Digital Menu & Contactless QR Ordering | DineScan`;
  const description = `Browse ${restaurant.name}'s digital menu, view chef recommendations, and place table orders online. ${
    restaurant.address ? `Located at ${restaurant.address}.` : ""
  }`;
  const directUrl = `${siteUrl}/${params.slug}`;
  const imageUrl = restaurant.logo_url || `${siteUrl}/analytics.png`;

  return {
    title,
    description,
    alternates: {
      canonical: directUrl
    },
    openGraph: {
      title: `${restaurant.name} | Live Digital Menu`,
      description,
      url: directUrl,
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

export default async function DirectSlugPage({ params }: DirectSlugPageProps) {
  const slugLower = params.slug.toLowerCase();
  if (RESERVED_SLUGS.has(slugLower)) {
    notFound();
  }

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

  try {
    const headerList = headers();
    const userAgent = headerList.get("user-agent");
    const adminSupabase = createAdminClient();
    await adminSupabase.from("scan_events").insert({
      restaurant_id: restaurant.id,
      user_agent: userAgent
    });
  } catch (err) {
    console.error("Scan event log error (non-fatal):", err);
  }

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
