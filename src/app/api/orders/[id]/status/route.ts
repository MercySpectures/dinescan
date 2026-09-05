import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateOrderStatusSchema } from "@/lib/validations/orders";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawBody = await request.json();
    const result = updateOrderStatusSchema.safeParse(rawBody);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: result.error.format() },
        { status: 400 }
      );
    }

    const { status } = result.data;

    // We must ensure the user owns the restaurant that the order belongs to
    // By selecting the order directly, RLS will fail naturally if they don't own it
    const { data: orderToUpdate, error: fetchError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", params.id)
      .maybeSingle();

    if (fetchError || !orderToUpdate) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
    }

    const adminSupabase = createAdminClient();

    const { data: updatedOrder, error: updateError } = await adminSupabase
      .from("orders")
      .update({ status })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedOrder);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
