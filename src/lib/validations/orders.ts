import { z } from "zod";

export const orderItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().min(0),
  qty: z.number().int().min(1),
  note: z.string().nullable().optional(),
});

export const createOrderSchema = z.object({
  restaurant_id: z.string().uuid(),
  table_code: z.string().nullable().optional(),
  session_id: z.string().nullable().optional(),
  // Note: we accept these fields from the client for fallback or logging,
  // but the API must securely recompute them against the database.
  subtotal: z.number().min(0),
  service_charge: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["new", "preparing", "ready", "served", "cancelled"]),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
