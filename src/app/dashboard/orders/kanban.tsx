"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  note: string | null;
}

export interface LiveOrder {
  id: string;
  table_code: string | null;
  status: "new" | "preparing" | "ready" | "served" | "cancelled";
  total: number;
  created_at: string;
  items: OrderItem[];
}

const COLUMNS = [
  { id: "new", title: "New Orders", color: "bg-blue-50 border-blue-200 text-blue-900" },
  { id: "preparing", title: "Preparing", color: "bg-amber-50 border-amber-200 text-amber-900" },
  { id: "ready", title: "Ready", color: "bg-emerald-50 border-emerald-200 text-emerald-900" },
  { id: "served", title: "Served", color: "bg-slate-50 border-slate-200 text-slate-800" },
] as const;

export default function OrdersKanban({ initialOrders, restaurantId }: { initialOrders: LiveOrder[], restaurantId: string }) {
  const supabase = createClient();
  const [orders, setOrders] = useState<LiveOrder[]>(initialOrders);

  useEffect(() => {
    // Realtime Subscription
    const channel = supabase
      .channel("live-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload: { eventType: string; new: unknown; old: unknown }) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as LiveOrder;
            // Fetch its items because they just got inserted too
            // Wait, items insert might happen slightly after order insert. 
            // We can wait 500ms and fetch the full order.
            setTimeout(async () => {
              const { data } = await supabase
                .from("orders")
                .select(`id, table_code, status, total, created_at, items:order_items(name, qty, price, note)`)
                .eq("id", newOrder.id)
                .single();
                
              if (data) {
                const fetchedOrder = data as unknown as LiveOrder;
                // Play sound
                try {
                  const audio = new Audio("/order-ding.mp3");
                  audio.play().catch(() => {});
                } catch {}

                setOrders((prev) => [fetchedOrder as LiveOrder, ...prev.filter(o => o.id !== fetchedOrder.id)]);
                toast.success(`New order on Table ${fetchedOrder.table_code || "—"}`);
              }
            }, 500);
            
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Record<string, unknown>;
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? { ...o, status: updatedOrder.status as LiveOrder["status"] } : o))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, supabase]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    // Optimistic
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as LiveOrder["status"] } : o)));
    
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!res.ok) {
      toast.error("Failed to update status");
      // Could revert here if needed
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 h-full min-h-0 overflow-hidden">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          return (
            <div key={col.id} className={`flex flex-col rounded-xl border ${col.color} overflow-hidden shadow-sm`}>
              <div className="px-4 py-3 font-bold border-b border-inherit flex items-center justify-between">
                <span>{col.title}</span>
                <span className="text-xs bg-black/5 px-2 py-0.5 rounded-full">{colOrders.length}</span>
              </div>
              
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                <AnimatePresence>
                  {colOrders.map((order) => (
                     <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        key={order.id} 
                        className="bg-white rounded-lg p-4 shadow-sm border border-slate-200"
                     >
                       <div className="flex justify-between items-start mb-2">
                         <div>
                           <p className="font-extrabold text-lg text-slate-900">Table {order.table_code || "—"}</p>
                           <p className="text-xs font-medium text-slate-500">{new Date(order.created_at).toLocaleTimeString()}</p>
                         </div>
                         <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                       </div>
                       
                       <div className="mt-3 space-y-1 my-3 bg-slate-50 rounded-md p-2 border border-slate-100">
                         {order.items?.map((item, idx) => (
                           <div key={idx} className="text-sm">
                             <div className="flex justify-between font-medium text-slate-700">
                               <span>{item.qty} x {item.name}</span>
                             </div>
                             {item.note && <p className="text-xs text-amber-600 bg-amber-50 px-1 py-0.5 mt-0.5 rounded inline-block">Note: {item.note}</p>}
                           </div>
                         ))}
                       </div>

                       <div className="grid grid-cols-2 gap-2 mt-4">
                         {col.id === "new" && (
                           <button className="col-span-2 btn-primary py-2 text-sm shadow-sm" onClick={() => updateStatus(order.id, "preparing")}>Start Preparing</button>
                         )}
                         {col.id === "preparing" && (
                           <button className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium py-2 text-sm shadow-sm transition-colors" onClick={() => updateStatus(order.id, "ready")}>Mark Ready</button>
                         )}
                         {col.id === "ready" && (
                           <button className="col-span-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium py-2 text-sm shadow-sm transition-colors" onClick={() => updateStatus(order.id, "served")}>Mark Served</button>
                         )}
                         {col.id !== "served" && (
                            <button className="col-span-2 text-xs font-medium text-slate-400 hover:text-red-500 py-1" onClick={() => { if(confirm('Cancel this order?')) updateStatus(order.id, "cancelled") }}>Cancel Order</button>
                         )}
                       </div>
                     </motion.div>
                  ))}
                </AnimatePresence>
                {colOrders.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm font-medium opacity-50">Empty</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
