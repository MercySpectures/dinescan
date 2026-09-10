import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, restaurantName } = body;
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cleanRestName = (restaurantName && typeof restaurantName === "string")
      ? restaurantName.trim()
      : "My Restaurant";

    const supabaseAdmin = createAdminClient();

    // 1. Create User via Admin client with auto email confirmation
    let userId: string | null = null;
    let authUser = null;

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { restaurant_name: cleanRestName }
    });

    if (createError) {
      // If user already exists, attempt to fetch user or inform client
      if (createError.message.includes("already registered") || createError.message.includes("already exists")) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    authUser = userData.user;
    userId = authUser?.id || null;

    if (!userId) {
      return NextResponse.json({ error: "Failed to generate user profile" }, { status: 500 });
    }

    // 2. Create Restaurant Record
    const baseSlug = slugify(cleanRestName || cleanEmail.split("@")[0] || "restaurant");
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: restaurant, error: restError } = await supabaseAdmin
      .from("restaurants")
      .insert({
        owner_id: userId,
        name: cleanRestName,
        slug,
        description: "Freshly prepared dining menu",
        is_published: true,
        theme_color: "#22C55E"
      })
      .select()
      .single();

    if (restError) {
      console.error("Restaurant creation warning:", restError.message);
    }

    // 3. Auto-seed Starter Categories & Items if restaurant created
    if (restaurant) {
      const { data: categories } = await supabaseAdmin
        .from("categories")
        .insert([
          { restaurant_id: restaurant.id, name: "Starters & Appetizers", sort_order: 1 },
          { restaurant_id: restaurant.id, name: "Main Course", sort_order: 2 },
          { restaurant_id: restaurant.id, name: "Beverages & Drinks", sort_order: 3 }
        ])
        .select();

      if (categories && categories.length >= 3) {
        await supabaseAdmin.from("menu_items").insert([
          {
            restaurant_id: restaurant.id,
            category_id: categories[0].id,
            name: "Crispy Paneer Tikka",
            description: "Marinated cottage cheese grilled in authentic tandoor spices",
            price: 240,
            is_veg: true,
            is_available: true,
            is_featured: true,
            sort_order: 1
          },
          {
            restaurant_id: restaurant.id,
            category_id: categories[1].id,
            name: "Butter Chicken Special",
            description: "Tender chicken pieces cooked in rich velvety tomato cashew gravy",
            price: 360,
            is_veg: false,
            is_available: true,
            is_featured: true,
            sort_order: 2
          },
          {
            restaurant_id: restaurant.id,
            category_id: categories[2].id,
            name: "Fresh Mango Lassi",
            description: "Chilled sweet Alphonso mango yogurt beverage",
            price: 110,
            is_veg: true,
            is_available: true,
            sort_order: 3
          }
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Restaurant account registered successfully",
      user: authUser,
      restaurant: restaurant || null
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Registration Server Error";
    console.error("Registration route error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
