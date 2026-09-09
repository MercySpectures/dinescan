"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle2, User, Search, Store, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface POSCategory {
  id: string;
  name: string;
}

interface POSMenuItem {
  id: string;
  category_id: string;
  name: string;
  price: number;
  is_veg: boolean;
  is_available: boolean;
}

interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  qty: number;
  note: string;
}

interface POSInterfaceProps {
  restaurantId: string;
  restaurantName: string;
  categories: POSCategory[];
  menuItems: POSMenuItem[];
  gstRate: number;
  enableGst: boolean;
}

export function POSInterface({
  restaurantId,
  restaurantName,
  categories,
  menuItems,
  gstRate,
  enableGst
}: POSInterfaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tableCode, setTableCode] = useState("1");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("upi");
  const [loading, setLoading] = useState(false);

  const addItemToCart = (item: POSMenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menu_item_id === item.id);
      if (existing) {
        return prev.map((i) => (i.menu_item_id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, qty: 1, note: "" }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.menu_item_id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.menu_item_id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const taxRateDecimal = enableGst ? gstRate / 100 : 0;
  const taxAmount = Math.round(subtotal * taxRateDecimal * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  const handleSubmitPOSOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        restaurant_id: restaurantId,
        table_code: tableCode,
        items: cart,
        subtotal,
        tax: taxAmount,
        service_charge: 0,
        total
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");

      toast.success(`✅ Order Sent to Kitchen for Table ${tableCode}!`);
      setCart([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Order creation failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter((i) => {
    if (!i.is_available) return false;
    const matchesCat = selectedCategory === "all" || i.category_id === selectedCategory;
    const matchesSearch = !searchQuery.trim() || i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <span>Mobile POS Terminal</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              LIVE WAITER POS
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tap dishes to take table orders, apply billing taxes, and dispatch KOT tickets directly to the kitchen.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200">
          <Store className="w-4 h-4 text-primary" />
          <span>{restaurantName}</span>
        </div>
      </div>

      {/* POS Two-Column Interface Container */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-200px)] gap-4">
        {/* Left: Menu catalog selection */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900/90 rounded-2xl shadow-card border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
          {/* Table Selector & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Table:</span>
              <select
                value={tableCode}
                onChange={(e) => setTableCode(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={String(n)}>
                    Table {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              {filteredItems.length} Available
            </span>
          </div>

          {/* Categories Horizontal Bar */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-100 dark:border-slate-800 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              All Dishes
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addItemToCart(item)}
                className="flex flex-col justify-between p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full ${item.is_veg ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span className="text-[10px] uppercase font-bold text-slate-400">{item.is_veg ? "Veg" : "Non-Veg"}</span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {item.name}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{formatPrice(item.price)}</span>
                  <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 text-xs">
                No matching dishes found.
              </div>
            )}
          </div>
        </div>

        {/* Right: POS Running Bill & Ticket Checkout */}
        <div className="w-full lg:w-[380px] flex flex-col bg-white dark:bg-slate-900/90 rounded-2xl shadow-card border border-slate-200/80 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">Running Order Ticket</h2>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
              Table {tableCode}
            </span>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {cart.map((item) => (
              <div
                key={item.menu_item_id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                  <p className="text-slate-400">{formatPrice(item.price)} each</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => updateQty(item.menu_item_id, -1)}
                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 font-bold text-slate-800 dark:text-slate-200">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.menu_item_id, 1)}
                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.menu_item_id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs space-y-2">
                <Sparkles className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
                <p>Tap items from the left menu catalog to build the waiter POS ticket.</p>
              </div>
            )}
          </div>

          {/* Payment & GST Summary */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              {enableGst && (
                <div className="flex justify-between">
                  <span>GST Tax ({gstRate}%)</span>
                  <span className="font-semibold">{formatPrice(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-slate-100 border-t border-slate-100 dark:border-slate-800 pt-2">
                <span>Total Payable</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(["upi", "cash", "card"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === m
                      ? "bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Submit Order Button */}
            <button
              type="button"
              onClick={handleSubmitPOSOrder}
              disabled={loading || cart.length === 0}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading ? "Dispatching..." : "Send to Kitchen (KOT)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
