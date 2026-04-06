import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrderSchema } from "@/lib/validations/orders";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  
  try {
    const rawBody = await request.json();
    const result = createOrderSchema.safeParse(rawBody);
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid payload", details: result.error.format() }, { status: 400 });
    }
    
    const body = result.data;
    
    // 1. Fetch real prices from the database for the requested items
    const itemIds = body.items.map(item => item.menu_item_id);
    const { data: realItems, error: itemsError } = await supabase
      .from("menu_items")
      .select("id, price, name")
      .in("id", itemIds)
      .eq("restaurant_id", body.restaurant_id)
      .eq("is_available", true);
      
    if (itemsError || !realItems) {
      return NextResponse.json({ error: "Failed to verify items" }, { status: 500 });
    }
    
    const realPrices = new Map(realItems.map(item => [item.id, item.price]));
    
    // 2. Recompute the subtotal securely
    let secureSubtotal = 0;
    const itemsToInsert = [];
    
    for (const item of body.items) {
      const realPrice = realPrices.get(item.menu_item_id);
      if (typeof realPrice !== "number") {
        return NextResponse.json({ error: `Item ${item.menu_item_id} is invalid or unavailable` }, { status: 400 });
      }
      secureSubtotal += realPrice * item.qty;
      itemsToInsert.push({
        menu_item_id: item.menu_item_id,
        name: item.name, // optionally verify realItems name as well
        price: realPrice,
        qty: item.qty,
        note: item.note ?? null
      });
    }
    
    // 3. Recompute taxes and fees based on arbitrary rules or provided percentages.
    // For DineScan we can assume Service = 5%, Tax = 5% as per initial logic.
    // To match what the client did previously (if they checked the box), we can re-verify. 
    // Wait, the client sends subtotal/tax/service_charge.
    // To be perfectly safe, we'll recompute standard 5% tax and 5% service, 
    // OR we can deduce the rates from the client payload if they are dynamic, 
    // but the safest approach for a premium platform is to define rates server-side.
    // For now, if the client specified a service_charge > 0, we assume 5%.
    const hasService = body.service_charge > 0;
    const hasTax = body.tax > 0;
    
    const serviceRate = 0.05;
    const taxRate = 0.05;
    
    const expectedService = hasService ? Math.round(secureSubtotal * serviceRate * 100) / 100 : 0;
    const expectedTax = hasTax ? Math.round((secureSubtotal + expectedService) * taxRate * 100) / 100 : 0;
    const secureTotal = Math.round((secureSubtotal + expectedService + expectedTax) * 100) / 100;
    
    // 4. Create the final order securely
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        restaurant_id: body.restaurant_id,
        table_code: body.table_code ?? null,
        session_id: body.session_id ?? null,
        status: "new",
        subtotal: secureSubtotal,
        service_charge: expectedService,
        tax: expectedTax,
        total: secureTotal
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message ?? "Failed to create order" }, { status: 500 });
    }

    // 5. Insert order items
    const { error: insertItemsError } = await supabase.from("order_items").insert(
      itemsToInsert.map((item) => ({
        ...item,
        order_id: order.id
      }))
    );

    if (insertItemsError) {
      return NextResponse.json({ error: insertItemsError.message }, { status: 500 });
    }

    return NextResponse.json({ order_id: order.id, status: "new", total_amount: secureTotal }, { status: 201 });
    
  } catch (error) {
    console.error("Order creation crashed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
