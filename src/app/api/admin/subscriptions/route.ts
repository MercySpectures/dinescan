import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMasterAdminUser } from "@/lib/auth/roles";
import { z } from "zod";

const updateSubscriptionSchema = z.object({
  restaurantId: z.string().uuid(),
  userId: z.string().uuid(),
  plan: z.enum(["free", "starter", "pro", "enterprise"]),
  status: z.enum(["active", "trialing", "past_due", "canceled", "suspended"]),
  billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
  amount: z.number().nonnegative().default(0),
  maxTables: z.number().int().positive().default(20),
  maxMenuItems: z.number().int().positive().default(100)
});

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user || !isMasterAdminUser(user.email, user.app_metadata)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: subscriptions, error } = await admin
      .from("subscriptions")
      .select("*, restaurants(name, slug, owner_id)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ subscriptions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user || !isMasterAdminUser(user.email, user.app_metadata)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateSubscriptionSchema.parse(body);

    const admin = createAdminClient();

    // Check if subscription exists for this restaurant
    const { data: existing } = await admin
      .from("subscriptions")
      .select("id")
      .eq("restaurant_id", validated.restaurantId)
      .maybeSingle();

    let result;
    if (existing) {
      result = await admin
        .from("subscriptions")
        .update({
          plan: validated.plan,
          status: validated.status,
          billing_cycle: validated.billingCycle,
          amount: validated.amount,
          max_tables: validated.maxTables,
          max_menu_items: validated.maxMenuItems,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select()
        .single();
    } else {
      result = await admin
        .from("subscriptions")
        .insert({
          restaurant_id: validated.restaurantId,
          user_id: validated.userId,
          plan: validated.plan,
          status: validated.status,
          billing_cycle: validated.billingCycle,
          amount: validated.amount,
          max_tables: validated.maxTables,
          max_menu_items: validated.maxMenuItems,
          currency: "INR"
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription: result.data });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
