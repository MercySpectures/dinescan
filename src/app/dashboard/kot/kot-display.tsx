"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Printer, Clock, CheckCircle2, Flame, AlertCircle } from "lucide-react";

interface KOTItem {
  name: string;
  qty: number;
  note: string | null;
}

interface KOTOrder {
  id: string;
  table_code: string | null;
  status: "new" | "preparing" | "ready" | "served" | "cancelled";
  created_at: string;
  items: KOTItem[];
}

export function KOTDisplay({
  initialOrders,
  restaurantId,
  restaurantName
}: {
  initialOrders: KOTOrder[];
  restaurantId: string;
  restaurantName: string;
}) {
  const supabase = createClient();
  const [orders, setOrders] = useState<KOTOrder[]>(initialOrders);
  const [activeFilter, setActiveFilter] = useState<"active" | "all">("active");

  useEffect(() => {
    // Real-time listener for KOT
    const channel = supabase
      .channel("kot-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as KOTOrder;
            setTimeout(async () => {
              const { data } = await supabase
                .from("orders")
                .select("id, table_code, status, created_at, items:order_items(name, qty, note)")
                .eq("id", newOrder.id)
                .single();

              if (data) {
                const fetchedOrder = data as unknown as KOTOrder;
                // Play kitchen bell sound
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
                toast.success(`🔔 New KOT Order on Table ${fetchedOrder.table_code || "—"}`);
                setOrders((prev) => [fetchedOrder, ...prev]);
              }
            }, 400);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as { id: string; status: KOTOrder["status"] };
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o))
            );
          }
        }
      )
      .subscribe();

    // Auto-polling fallback
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, table_code, status, created_at, items:order_items(name, qty, note)")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(40);
      if (data) setOrders(data as unknown as KOTOrder[]);
    }, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [restaurantId, supabase]);

  const updateStatus = async (orderId: string, status: KOTOrder["status"]) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) toast.error("Failed to update KOT order status");
    } catch {
      toast.error("Network error");
    }
  };

  const handlePrintKOT = (order: KOTOrder) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    const itemsHtml = order.items
      .map(
        (i) =>
          `<div style="display:flex;justify-space-between;font-size:16px;font-weight:bold;margin-bottom:6px;">
            <span>${i.qty} x ${i.name}</span>
          </div>
          ${i.note ? `<div style="font-size:12px;color:#c53030;margin-bottom:8px;">* Note: ${i.note}</div>` : ""}`
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>KOT Ticket #${order.table_code || "0"}</title>
          <style>
            body { font-family: monospace; padding: 20px; width: 280px; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .footer { border-top: 2px dashed #000; margin-top: 15px; padding-top: 10px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0;">${restaurantName}</h2>
            <h1 style="margin:5px 0;">TABLE ${order.table_code || "TAKEAWAY"}</h1>
            <p style="margin:0;font-size:12px;">Time: ${new Date(order.created_at).toLocaleTimeString()}</p>
          </div>
          <div>${itemsHtml}</div>
          <div class="footer">
            <p>--- KITCHEN ORDER TICKET ---</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getTimeElapsedMinutes = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diffMs / 60000);
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === "active") return o.status === "new" || o.status === "preparing";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title flex items-center gap-2">
              <span>Kitchen Display (KOT)</span>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold animate-pulse">
                LIVE AUTO-SYNC
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time kitchen order tickets for {restaurantName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter("active")}
            className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all ${
              activeFilter === "active"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            Cooking / Pending ({orders.filter((o) => o.status === "new" || o.status === "preparing").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all ${
              activeFilter === "all"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All Tickets ({orders.length})
          </button>
        </div>
      </div>

      {/* Order Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredOrders.map((order) => {
          const minsAgo = getTimeElapsedMinutes(order.created_at);
          const isUrgent = minsAgo >= 15;
          const isWarning = minsAgo >= 8 && minsAgo < 15;

          return (
            <div
              key={order.id}
              className={`card p-5 border-2 flex flex-col justify-between transition-all ${
                order.status === "new"
                  ? isUrgent
                    ? "border-rose-500 bg-rose-50/20 dark:bg-rose-950/30"
                    : isWarning
                    ? "border-amber-500 bg-amber-50/20 dark:bg-amber-950/30"
                    : "border-primary bg-primary/5 dark:bg-slate-900"
                  : order.status === "preparing"
                  ? "border-amber-500 bg-amber-50/20 dark:bg-slate-900"
                  : "border-slate-200 dark:border-slate-800 opacity-75"
              }`}
            >
              <div>
                {/* Ticket Top Bar */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xl font-black font-display text-slate-900 dark:text-slate-100">
                      TBL {order.table_code || "—"}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                      isUrgent
                        ? "bg-rose-600 text-white"
                        : isWarning
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {minsAgo} mins
                  </div>
                </div>

                {/* Items List */}
                <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80">
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-sm text-slate-900 dark:text-emerald-400 break-words">
                          {item.qty} × {item.name}
                        </span>
                      </div>
                      {item.note && (
                        <div className="mt-1 flex items-start gap-1 text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/40 break-words">
                          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>Note: {item.note}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {order.status === "new" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(order.id, "preparing")}
                      className="col-span-2 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-2 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <Flame className="w-4 h-4" /> Start Cooking
                    </button>
                  )}
                  {order.status === "preparing" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(order.id, "ready")}
                      className="col-span-2 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark Ready
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handlePrintKOT(order)}
                  className="w-full flex items-center justify-center gap-1.5 btn-outline py-2 text-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print KOT Slip
                </button>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="col-span-full card p-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">All Kitchen Orders Clear</p>
            <p className="text-xs">New tickets will pop up automatically with sound alerts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
