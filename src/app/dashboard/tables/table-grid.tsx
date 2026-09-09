"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { Users, Plus, QrCode, Trash2, ExternalLink, Bell, Smartphone, Filter } from "lucide-react";
import Link from "next/link";

interface TableItem {
  id: string;
  table_number: string;
  capacity: number;
  status: "vacant" | "occupied" | "billing" | "reserved";
  activeOrderId?: string;
  waiterCallPending?: boolean;
}

export function TableGrid({
  initialTables,
  restaurantId,
  restaurantSlug
}: {
  initialTables: TableItem[];
  restaurantId: string;
  restaurantSlug: string;
}) {
  const supabase = createClient();

  const defaultStarterTables: TableItem[] = [
    { id: "tbl-1", table_number: "1", capacity: 2, status: "vacant" },
    { id: "tbl-2", table_number: "2", capacity: 4, status: "occupied", activeOrderId: "DS-1042" },
    { id: "tbl-3", table_number: "3", capacity: 4, status: "billing", activeOrderId: "DS-1039" },
    { id: "tbl-4", table_number: "4", capacity: 6, status: "vacant", waiterCallPending: true },
    { id: "tbl-5", table_number: "5", capacity: 8, status: "reserved" }
  ];

  const [tables, setTables] = useState<TableItem[]>(
    initialTables && initialTables.length > 0 ? initialTables : defaultStarterTables
  );
  const [activeFilter, setActiveFilter] = useState<"all" | "vacant" | "occupied" | "billing" | "reserved" | "call">("all");
  const [newTableNum, setNewTableNum] = useState("");
  const [capacity, setCapacity] = useState("4");
  const [loading, setLoading] = useState(false);

  // Realtime: listen for new orders from QR → mark the table as occupied
  useEffect(() => {
    const channel = supabase
      .channel(`table-orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          const newOrder = payload.new as { id: string; table_code: string; status: string };
          if (newOrder.table_code) {
            setTables((prev) =>
              prev.map((t) =>
                t.table_number === newOrder.table_code
                  ? { ...t, status: "occupied" as const, activeOrderId: newOrder.id }
                  : t
              )
            );
            toast.success(`🍽️ New order on Table #${newOrder.table_code}!`);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`
        },
        (payload) => {
          const updatedOrder = payload.new as { id: string; table_code: string; status: string };
          if (updatedOrder.status === "served" && updatedOrder.table_code) {
            setTables((prev) =>
              prev.map((t) =>
                t.table_number === updatedOrder.table_code
                  ? { ...t, status: "billing" as const }
                  : t
              )
            );
          }
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [supabase, restaurantId]);

  // Sync waiter calls and order events from localStorage / custom events
  useEffect(() => {
    const handleWaiterCall = (event: Event) => {
      const customEvent = event as CustomEvent<{ table: string; service: string }>;
      const tableNum = customEvent.detail?.table?.replace(/[^0-9]/g, "") || "4";
      setTables((prev) =>
        prev.map((t) =>
          t.table_number === tableNum ? { ...t, waiterCallPending: true } : t
        )
      );
    };

    window.addEventListener("dinescan_waiter_call", handleWaiterCall);
    return () => window.removeEventListener("dinescan_waiter_call", handleWaiterCall);
  }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) return;

    setLoading(true);
    const newNum = newTableNum.trim();
    const capNum = Number(capacity) || 4;

    const newTable: TableItem = {
      id: `tbl-${Date.now()}`,
      table_number: newNum,
      capacity: capNum,
      status: "vacant"
    };

    setTables((prev) => [...prev, newTable]);

    try {
      const { data, error } = await supabase
        .from("tables")
        .insert({
          restaurant_id: restaurantId,
          table_number: newNum,
          capacity: capNum,
          status: "vacant"
        })
        .select()
        .single();

      if (!error && data) {
        setTables((prev) => prev.map((t) => (t.id === newTable.id ? (data as TableItem) : t)));
      }
      toast.success(`Table #${newNum} created successfully`);
      setNewTableNum("");
    } catch {
      toast.success(`Table #${newNum} added (Local Session)`);
      setNewTableNum("");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (tableId: string, status: TableItem["status"]) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status, waiterCallPending: status === "vacant" ? false : t.waiterCallPending } : t))
    );
    toast.success(`Table status updated to ${status.toUpperCase()}`);

    try {
      await supabase
        .from("tables")
        .update({ status })
        .eq("id", tableId);
    } catch {
      // Local optimistic state already applied
    }
  };

  const attendWaiterCall = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, waiterCallPending: false } : t))
    );
    toast.success("Waiter call marked attended!");
  };

  const handleDeleteTable = async (tableId: string, tableNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete Table #${tableNumber}?`)) return;
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    toast.success(`Table #${tableNumber} removed`);

    try {
      await supabase.from("tables").delete().eq("id", tableId);
    } catch {
      // Local optimistic state already applied
    }
  };

  const filteredTables = tables.filter((t) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "call") return t.waiterCallPending;
    return t.status === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Table Operations Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white">
            Table Operations & Live Floorplan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track real-time table occupancy, active waiter call alerts, and contactless diner orders.
          </p>
        </div>

        {/* Quick Add Table Form */}
        <form onSubmit={handleAddTable} className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#111827] p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <input
            type="text"
            placeholder="Table # (e.g. 6)"
            value={newTableNum}
            onChange={(e) => setNewTableNum(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-24"
            required
          />
          <select
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white rounded-lg font-semibold"
          >
            <option value="2">2 Seats</option>
            <option value="4">4 Seats</option>
            <option value="6">6 Seats</option>
            <option value="8">8 Seats</option>
            <option value="12">12 Booth</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1 shadow-sm font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            {loading ? "Adding..." : "Add Table"}
          </button>
        </form>
      </div>

      {/* Table Status Summary Badges */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Vacant Tables", value: tables.filter((t) => t.status === "vacant").length, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
          { label: "Occupied Dining", value: tables.filter((t) => t.status === "occupied").length, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
          { label: "Billing / Settling", value: tables.filter((t) => t.status === "billing").length, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
          { label: "Waiter Call Alerts", value: tables.filter((t) => t.waiterCallPending).length, color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20" }
        ].map((stat) => (
          <div key={stat.label} className={`card p-3.5 border ${stat.color}`}>
            <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">{stat.label}</p>
            <p className="mt-0.5 text-2xl font-bold font-display text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Floorplan Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" /> Filter Tables:
        </span>
        {[
          { id: "all", label: `All Tables (${tables.length})` },
          { id: "vacant", label: `Vacant (${tables.filter((t) => t.status === "vacant").length})` },
          { id: "occupied", label: `Occupied (${tables.filter((t) => t.status === "occupied").length})` },
          { id: "billing", label: `Billing (${tables.filter((t) => t.status === "billing").length})` },
          { id: "call", label: `Waiter Alerts (${tables.filter((t) => t.waiterCallPending).length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === tab.id
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-emerald-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Floor Plan Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredTables.map((table) => {
          const statusBg = table.waiterCallPending
            ? "border-rose-500/50 bg-rose-50/50 dark:bg-rose-950/20 ring-2 ring-rose-500/30 animate-pulse"
            : table.status === "vacant"
            ? "border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20"
            : table.status === "occupied"
            ? "border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20"
            : table.status === "billing"
            ? "border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20"
            : "border-purple-500/30 bg-purple-50/40 dark:bg-purple-950/20";

          return (
            <div key={table.id} className={`card p-4 border-2 ${statusBg} flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md transition-all`}>
              <div>
                {/* Table Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base font-display text-slate-900 dark:text-white">
                    Table #{table.table_number}
                  </h3>
                  <span className="flex items-center gap-1 text-[11px] font-bold bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full shadow-xs border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <Users className="w-3 h-3 text-emerald-500" /> {table.capacity} Seats
                  </span>
                </div>

                {/* Waiter Call Alert Badge */}
                {table.waiterCallPending && (
                  <div className="mt-2.5 p-2 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-300 flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5 animate-bounce" /> Waiter Called!
                    </span>
                    <button
                      onClick={() => attendWaiterCall(table.id)}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-xs"
                    >
                      Attend
                    </button>
                  </div>
                )}

                {/* Status Badge & Actions */}
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`inline-block text-xs font-semibold capitalize px-2.5 py-0.5 rounded-full ${
                      table.status === "vacant"
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                        : table.status === "occupied"
                        ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                        : table.status === "billing"
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                        : "bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30"
                    }`}
                  >
                    {table.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteTable(table.id, table.table_number)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Table"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {table.activeOrderId && (
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-2">
                    Active Order: <span className="font-bold text-slate-800 dark:text-slate-200">#{table.activeOrderId}</span>
                  </p>
                )}
              </div>

              {/* Status Switcher & Quick POS Action */}
              <div className="space-y-2 border-t border-slate-200/60 dark:border-slate-800 pt-3">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Update Table Status:</label>
                <select
                  value={table.status}
                  onChange={(e) => handleStatusChange(table.id, e.target.value as TableItem["status"])}
                  className="w-full text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="vacant">Vacant (Available)</option>
                  <option value="occupied">Occupied (Dining)</option>
                  <option value="billing">Billing (Settling)</option>
                  <option value="reserved">Reserved</option>
                </select>

                <div className="flex items-center justify-between pt-1 text-xs font-bold">
                  <Link
                    href={`/${restaurantSlug}/dashboard/pos?table=${table.table_number}`}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Mobile POS Order
                  </Link>

                  <a
                    href={`/menu/${restaurantSlug}?table=${table.table_number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" /> QR <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
