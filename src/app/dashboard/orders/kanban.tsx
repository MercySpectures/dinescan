"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChefHat, CheckCircle2, Star, AlertCircle } from "lucide-react";

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
  {
    id: "new",
    title: "New Orders",
    icon: AlertCircle,
    accent: "border-blue-500",
    headerBg: "bg-blue-500/10 dark:bg-blue-500/10",
    badgeBg: "bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30",
    iconColor: "text-blue-500",
    dotColor: "bg-blue-500"
  },
  {
    id: "preparing",
    title: "Preparing",
    icon: ChefHat,
    accent: "border-amber-500",
    headerBg: "bg-amber-500/10 dark:bg-amber-500/10",
    badgeBg: "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30",
    iconColor: "text-amber-500",
    dotColor: "bg-amber-500"
  },
  {
    id: "ready",
    title: "Ready to Serve",
    icon: Star,
    accent: "border-emerald-500",
    headerBg: "bg-emerald-500/10 dark:bg-emerald-500/10",
    badgeBg: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
    iconColor: "text-emerald-500",
    dotColor: "bg-emerald-500"
  },
  {
    id: "served",
    title: "Served",
    icon: CheckCircle2,
    accent: "border-slate-400",
    headerBg: "bg-slate-500/5 dark:bg-slate-500/10",
    badgeBg: "bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/30",
    iconColor: "text-slate-400",
    dotColor: "bg-slate-400"
  },
] as const;

function getElapsed(created_at: string): string {
  const diff = Math.floor((Date.now() - new Date(created_at).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function OrdersKanban({ initialOrders, restaurantId }: { initialOrders: LiveOrder[]; restaurantId: string }) {
  const supabase = createClient();
  const [orders, setOrders] = useState<LiveOrder[]>(initialOrders);
  const [, forceRefresh] = useState(0);

  // Tick elapsed times every 30s
  useEffect(() => {
    const tick = setInterval(() => forceRefresh((n) => n + 1), 30000);
    return () => clearInterval(tick);
  }, []);

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
            setTimeout(async () => {
              const { data } = await supabase
                .from("orders")
                .select(`id, table_code, status, total, created_at, items:order_items(name, qty, price, note)`)
                .eq("id", newOrder.id)
                .single();

              if (data) {
                const fetchedOrder = data as unknown as LiveOrder;
                // Play audio chime
                try {
                  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                  if (AudioCtx) {
                    const ctx = new AudioCtx();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(880, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
                    gain.gain.setValueAtTime(0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.6);
                  }
                } catch {}

                setOrders((prev) => [fetchedOrder as LiveOrder, ...prev.filter((o) => o.id !== fetchedOrder.id)]);
                toast.success(`🔔 New Order on Table ${fetchedOrder.table_code || "—"}`);
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

    // Auto-polling fallback
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select(`id, table_code, status, total, created_at, items:order_items(name, qty, price, note)`)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) {
        setOrders(data as unknown as LiveOrder[]);
      }
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [restaurantId, supabase]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as LiveOrder["status"] } : o)));

    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });

    if (!res.ok) {
      toast.error("Failed to update status");
    }
  };

  const totalActive = orders.filter(o => o.status !== "served" && o.status !== "cancelled").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary strip */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span className={`w-2 h-2 rounded-full ${totalActive > 0 ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
          {totalActive} active order{totalActive !== 1 ? "s" : ""} in kitchen
        </div>
        {COLUMNS.map(col => {
          const count = orders.filter(o => o.status === col.id).length;
          return count > 0 ? (
            <div key={col.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${col.badgeBg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${col.dotColor}`} />
              {count} {col.title}
            </div>
          ) : null;
        })}
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-h-[500px]">
        {COLUMNS.map((col) => {
          const colOrders = orders
            .filter((o) => o.status === col.id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const ColIcon = col.icon;

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl border-t-4 ${col.accent} border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-sm`}
            >
              {/* Column Header */}
              <div className={`px-4 py-3 ${col.headerBg} border-b border-slate-100 dark:border-slate-800 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <ColIcon className={`w-4 h-4 ${col.iconColor}`} />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{col.title}</span>
                </div>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${col.badgeBg}`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                <AnimatePresence>
                  {colOrders.map((order) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: -16 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                      key={order.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/80 hover:shadow-md transition-shadow"
                    >
                      {/* Order Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-black text-base font-display text-slate-900 dark:text-white leading-tight">
                            Table {order.table_code || "—"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <p className="text-[11px] font-semibold text-slate-400">
                              {getElapsed(order.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {formatPrice(order.total)}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 space-y-1.5">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="text-xs">
                            <div className="flex justify-between gap-2 text-slate-700 dark:text-slate-200">
                              <span className="font-semibold truncate">
                                <span className="text-slate-500 dark:text-slate-400 font-mono mr-1">{item.qty}×</span>
                                {item.name}
                              </span>
                              <span className="shrink-0 font-bold tabular-nums text-slate-600 dark:text-slate-300">
                                {formatPrice(item.price * item.qty)}
                              </span>
                            </div>
                            {item.note && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 mt-1 rounded-lg border border-amber-200 dark:border-amber-900/50 line-clamp-2 break-words font-medium">
                                📝 {item.note}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 space-y-1.5">
                        {col.id === "new" && (
                          <button
                            type="button"
                            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wide shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            onClick={() => updateStatus(order.id, "preparing")}
                          >
                            <ChefHat className="w-3.5 h-3.5" /> Start Preparing
                          </button>
                        )}
                        {col.id === "preparing" && (
                          <button
                            type="button"
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wide shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            onClick={() => updateStatus(order.id, "ready")}
                          >
                            <Star className="w-3.5 h-3.5" /> Mark Ready
                          </button>
                        )}
                        {col.id === "ready" && (
                          <button
                            type="button"
                            className="w-full py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl font-bold text-xs uppercase tracking-wide shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            onClick={() => updateStatus(order.id, "served")}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Served
                          </button>
                        )}
                        {col.id !== "served" && (
                          <button
                            type="button"
                            className="w-full text-xs font-medium text-slate-400 hover:text-rose-500 py-1 transition-colors cursor-pointer"
                            onClick={() => {
                              if (confirm("Cancel this order?")) updateStatus(order.id, "cancelled");
                            }}
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-300 dark:text-slate-700">
                    <ColIcon className="w-8 h-8" />
                    <p className="text-xs font-semibold">No orders here</p>
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
