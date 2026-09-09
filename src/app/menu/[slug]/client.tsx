"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/cart/store";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  MapPin,
  Phone,
  Clock,
  Info,
  Search,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  Bell,
  CheckCircle2,
  Share2,
  QrCode,
  ShieldCheck,
  X,
  CreditCard,
  Banknote,
  Utensils,
  Sun,
  Moon
} from "lucide-react";

export interface PublicItem {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  isFeatured: boolean;
  imageUrl?: string | null;
  allergens?: string[];
  preparationTime?: number | null;
}

interface RestaurantMeta {
  id: string;
  slug: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  logo_url?: string | null;
  theme_color?: string | null;
}

interface PublicMenuClientProps {
  items: PublicItem[];
  restaurant: RestaurantMeta;
}

export default function PublicMenuClient({ items, restaurant }: PublicMenuClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "nonveg" | "featured">("all");
  const [expandedId, setExpandedId] = useState<string>("");
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [waiterRequested, setWaiterRequested] = useState<boolean>(false);
  const [customerTheme, setCustomerTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("dinescan_customer_theme") as "dark" | "light" | null;
    if (saved) {
      setCustomerTheme(saved);
    } else if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      setCustomerTheme("light");
    }
  }, []);

  const toggleCustomerTheme = () => {
    setCustomerTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("dinescan_customer_theme", next);
      return next;
    });
  };

  // Cart Store Integration
  const cart = useCartStore((state) => state.cart);
  const notesByItemId = useCartStore((state) => state.notesByItemId);
  const tableCode = useCartStore((state) => state.tableCode);
  const setTableCode = useCartStore((state) => state.setTableCode);
  const sessionId = useCartStore((state) => state.sessionId);
  const setSessionId = useCartStore((state) => state.setSessionId);
  const addToCartStorage = useCartStore((state) => state.addToCart);
  const updateQty = useCartStore((state) => state.updateQty);
  const setNote = useCartStore((state) => state.setNote);
  const clearCart = useCartStore((state) => state.clearCart);
  const purgeStaleItems = useCartStore((state) => state.purgeStaleItems);

  useEffect(() => {
    if (items.length > 0) {
      purgeStaleItems(items.map((i) => i.id));
    }
  }, [items, purgeStaleItems]);

  const [includeService] = useState<boolean>(true);
  const [includeTax] = useState<boolean>(true);
  const [serviceRate] = useState<number>(0.05);
  const [taxRate] = useState<number>(0.05);
  const [paymentMode, setPaymentMode] = useState<"upi" | "cash" | "card">("upi");

  // Tip options: 0%, 5%, 10%, 15%, or custom
  const [tipOption, setTipOption] = useState<number>(10);
  const [customTip, setCustomTip] = useState<string>("");

  // Live Order Tracking State
  const [orderId, setOrderId] = useState<string>("");
  const [orderStatus, setOrderStatus] = useState<"new" | "preparing" | "ready" | "served">("new");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [billOpen, setBillOpen] = useState<boolean>(false);
  const [placedItems, setPlacedItems] = useState<typeof cart>([]);

  // Customer Contact Info (Name & Phone) for Owner CRM
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");

  useEffect(() => {
    const savedName = localStorage.getItem("dinescan_customer_name");
    const savedPhone = localStorage.getItem("dinescan_customer_phone");
    const savedOrderId = localStorage.getItem("dinescan_active_order_id");
    if (savedName) setCustomerName(savedName);
    if (savedPhone) setCustomerPhone(savedPhone);
    if (savedOrderId) setOrderId(savedOrderId);
  }, []);

  const categories = useMemo<string[]>(
    () => ["all", ...Array.from(new Set(items.map((item) => item.category)))],
    [items]
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const byCategory = activeCategory === "all" || item.category === activeCategory;
        const bySearch =
          !query.trim() ||
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase());
        const byDietary =
          dietaryFilter === "all"
            ? true
            : dietaryFilter === "veg"
            ? item.isVeg
            : dietaryFilter === "nonveg"
            ? !item.isVeg
            : item.isFeatured;
        return byCategory && bySearch && byDietary;
      }),
    [activeCategory, dietaryFilter, items, query]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, row) => sum + row.price * row.qty, 0),
    [cart]
  );

  const serviceCharge = useMemo(
    () => (includeService ? Math.round(cartTotal * serviceRate * 100) / 100 : 0),
    [cartTotal, includeService, serviceRate]
  );

  const tax = useMemo(
    () => (includeTax ? Math.round((cartTotal + serviceCharge) * taxRate * 100) / 100 : 0),
    [cartTotal, includeTax, serviceCharge, taxRate]
  );

  const tipAmount = useMemo(() => {
    if (tipOption === -1) {
      const num = Number(customTip);
      return Number.isFinite(num) && num > 0 ? num : 0;
    }
    return Math.round(cartTotal * (tipOption / 100) * 100) / 100;
  }, [cartTotal, tipOption, customTip]);

  const grandTotal = useMemo(
    () => Math.round((cartTotal + serviceCharge + tax + tipAmount) * 100) / 100,
    [cartTotal, serviceCharge, tax, tipAmount]
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    const table = url.searchParams.get("table") ?? "";
    const session = url.searchParams.get("session") ?? "";
    if (table && !tableCode) setTableCode(table);
    if (!sessionId) setSessionId(session || crypto.randomUUID());
  }, [tableCode, sessionId, setTableCode, setSessionId]);

  useEffect(() => {
    if (cart.length === 0 && !orderId) setBillOpen(false);
  }, [cart.length, orderId]);

  // Live order status polling from DB
  useEffect(() => {
    if (!orderId) return;

    const checkOrderStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setOrderStatus(data.status as "new" | "preparing" | "ready" | "served");
          }
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            setPlacedItems(
              data.items.map((it: { id: string; name: string; price: number; qty: number; note?: string }) => ({
                key: it.id,
                itemId: it.id,
                name: it.name,
                price: it.price,
                qty: it.qty,
                note: it.note
              }))
            );
          }
        }
      } catch (err) {
        console.error("Order status polling error:", err);
      }
    };

    void checkOrderStatus();
    const interval = setInterval(checkOrderStatus, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleCallWaiter = async () => {
    setWaiterRequested(true);
    const tableLabel = tableCode ? `Table ${tableCode}` : "Table 04";

    // 1. Broadcast via Supabase Realtime channel to any device dashboard
    try {
      const channel = supabase.channel(`restaurant-alerts-${restaurant.id}`);
      await channel.subscribe();
      await channel.send({
        type: "broadcast",
        event: "waiter-call",
        payload: {
          id: "call-" + Date.now(),
          table: tableLabel,
          service: "Waiter Assistance & Water",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      });
    } catch (e) {
      console.warn("Realtime waiter call error:", e);
    }

    // 2. Dispatch local window event (for same-window dev testing)
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("dinescan_waiter_call", {
          detail: { table: tableLabel, service: "Waiter Assistance & Water" }
        })
      );
    }

    toast.success(`🔔 Waiter alerted for ${tableLabel}! Floor staff is arriving.`);
    setTimeout(() => setWaiterRequested(false), 10000);
  };

  const generateWhatsAppReceipt = () => {
    const lines: string[] = [];
    lines.push(`🍽️ *OFFICIAL RECEIPT - ${restaurant.name.toUpperCase()}*`);
    if (tableCode) lines.push(`🏷️ *Table:* #${tableCode}`);
    if (orderId) lines.push(`🆔 *Ref ID:* ${orderId.slice(0, 8).toUpperCase()}`);
    lines.push(`📅 *Date:* ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`);
    lines.push("--------------------------------");

    const itemList = placedItems.length > 0 ? placedItems : cart;
    itemList.forEach((row) => {
      lines.push(`• ${row.qty}x ${row.name} - ${formatPrice(row.price * row.qty)}`);
      if (row.note) lines.push(`  ↳ 📝 ${row.note}`);
    });

    lines.push("--------------------------------");
    lines.push(`Subtotal: ${formatPrice(cartTotal)}`);
    if (serviceCharge > 0) lines.push(`Service Charge (5%): ${formatPrice(serviceCharge)}`);
    if (tax > 0) lines.push(`GST Tax (5%): ${formatPrice(tax)}`);
    if (tipAmount > 0) lines.push(`Chef Tip: ${formatPrice(tipAmount)}`);
    lines.push(`*GRAND TOTAL: ${formatPrice(grandTotal)}*`);
    lines.push(`Payment Mode: ${paymentMode.toUpperCase()}`);
    lines.push("");
    lines.push("Thank you for dining with us! Powered by DineScan ✨");

    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const themePrimary = restaurant.theme_color || "#10B981";

  return (
    <div className={cn("font-body relative min-h-screen transition-colors duration-300", customerTheme === "dark" ? "dark bg-[#080c16] text-slate-100" : "bg-slate-50 text-slate-800")}>

      {/* HERO BANNER */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-none sm:rounded-2xl mb-0"
        style={{ background: `linear-gradient(135deg, ${themePrimary}22 0%, ${themePrimary}08 100%)` }}
      >
        {/* Gradient Background Layer */}
        <div
          className="absolute inset-0 opacity-90"
          style={{ background: `linear-gradient(150deg, ${themePrimary}30 0%, transparent 60%)` }}
        />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: themePrimary }} />

        <div className="relative z-10 p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-white/30 shadow-2xl bg-white">
                <Image
                  src={restaurant.logo_url || `https://placehold.co/120x120/${themePrimary.replace("#", "")}/ffffff?text=${restaurant.name.charAt(0).toUpperCase()}`}
                  width={112}
                  height={112}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 border-white shadow-sm"
                style={{ background: themePrimary }}
                title="Open Now"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div>
                <h1 className="font-display text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  {restaurant.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {restaurant.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: themePrimary }} />
                      <span className="truncate max-w-[180px]">{restaurant.address}</span>
                    </span>
                  )}
                  {restaurant.phone && (
                    <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 hover:underline">
                      <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: themePrimary }} />
                      {restaurant.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Status + Quick Actions */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border" style={{ color: themePrimary, borderColor: `${themePrimary}40`, background: `${themePrimary}15` }}>
                  <Clock className="w-3.5 h-3.5" /> Open · 11 AM – 11 PM
                </span>

                {orderId && (
                  <button
                    type="button"
                    onClick={() => setBillOpen(true)}
                    className="px-3.5 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
                    style={{ background: themePrimary }}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Track Order
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCallWaiter}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border ${
                    waiterRequested
                      ? "bg-amber-500 text-slate-950 border-amber-500 animate-pulse"
                      : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-white/60 dark:border-slate-700 backdrop-blur-sm hover:bg-white"
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" style={{ color: waiterRequested ? undefined : themePrimary }} />
                  {waiterRequested ? "Waiter Alerted!" : "Call Waiter"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowInfoModal(true)}
                  className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/60 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm"
                  title="Restaurant Info"
                >
                  <Info className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>

                {/* Light / Dark Mode Toggle */}
                <button
                  type="button"
                  onClick={toggleCustomerTheme}
                  className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/60 dark:border-slate-700 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-sm"
                  title={customerTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {customerTheme === "dark" ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-slate-700" />
                  )}
                </button>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-4 text-xs">
                <div className="text-center">
                  <p className="font-black text-lg text-slate-900 dark:text-white leading-none">{items.length}</p>
                  <p className="text-slate-500 dark:text-slate-400">Dishes</p>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                <div className="text-center">
                  <p className="font-black text-lg text-slate-900 dark:text-white leading-none">{categories.length - 1}</p>
                  <p className="text-slate-500 dark:text-slate-400">Categories</p>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                <div className="text-center">
                  <p className="font-black text-lg leading-none" style={{ color: themePrimary }}>★ 4.8</p>
                  <p className="text-slate-500 dark:text-slate-400">Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Search & Filter Sticky Bar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 space-y-2.5 mt-0">
        {/* Search Bar & Table Indicator */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search dishes, ingredients..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs sm:text-sm rounded-xl text-slate-900 dark:text-white"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold shrink-0" style={{ background: `${themePrimary}15`, borderColor: `${themePrimary}40`, color: themePrimary }}>
            <Utensils className="w-3.5 h-3.5" />
            <span>Table {tableCode || "1"}</span>
          </div>

          {/* Sticky Quick Theme Switcher */}
          <button
            type="button"
            onClick={toggleCustomerTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
            title={customerTheme === "dark" ? "Light Mode" : "Dark Mode"}
          >
            {customerTheme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>

        {/* Dietary + Category combined scrollable row */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {[
            { id: "all-dietary", label: "🍽 All", type: "dietary", value: "all" },
            { id: "veg", label: "🌱 Veg", type: "dietary", value: "veg" },
            { id: "nonveg", label: "🍗 Non-Veg", type: "dietary", value: "nonveg" },
            { id: "featured", label: "⭐ Specials", type: "dietary", value: "featured" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setDietaryFilter(f.value as typeof dietaryFilter)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                dietaryFilter === f.value
                  ? "text-white border-transparent shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
              style={dietaryFilter === f.value ? { background: themePrimary, borderColor: themePrimary } : {}}
            >
              {f.label}
            </button>
          ))}
          <div className="w-px h-6 self-center bg-slate-200 dark:bg-slate-700 shrink-0" />
          {categories.filter(c => c !== "all").map((c) => {
            const isActive = activeCategory === c;
            const catCount = items.filter(i => i.category === c).length;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(isActive ? "all" : c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 ${
                  isActive
                    ? "text-white border-transparent shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
                style={isActive ? { background: themePrimary, borderColor: themePrimary } : {}}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
                <span className={`text-[9px] font-black rounded-full px-1.5 py-0.5 ${isActive ? "bg-white/25" : "bg-slate-100 dark:bg-slate-700"}`}>
                  {catCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Cards Grid */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-5 px-4 pb-28">
        {filteredItems.map((item) => {
          const cartItem = cart.find((i) => i.itemId === item.id);
          const isExpanded = expandedId === item.id;

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative bg-white dark:bg-[#111827] rounded-2xl border overflow-hidden transition-all ${
                cartItem
                  ? "border-emerald-400/40 dark:border-emerald-500/30 shadow-lg"
                  : isExpanded
                  ? "border-slate-300 dark:border-slate-600 shadow-md"
                  : "border-slate-200/80 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Item Image */}
              <div
                className="relative h-40 sm:h-44 overflow-hidden cursor-pointer group bg-slate-100 dark:bg-slate-800"
                onClick={() => setExpandedId(isExpanded ? "" : item.id)}
              >
                <Image
                  src={item.imageUrl || `https://placehold.co/600x360/${themePrimary.replace("#", "")}22/333333?text=${encodeURIComponent(item.name)}`}
                  alt={item.name}
                  width={600}
                  height={360}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Veg indicator dot */}
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  <span
                    className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center shadow-sm ${
                      item.isVeg
                        ? "bg-white border-emerald-500"
                        : "bg-white border-red-500"
                    }`}
                    title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? "bg-emerald-500" : "bg-red-500"}`} />
                  </span>
                  {item.isFeatured && (
                    <span className="px-2 py-0.5 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full shadow-sm flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Chef&apos;s Pick
                    </span>
                  )}
                </div>
                {/* Cart quantity badge overlay */}
                {cartItem && (
                  <div
                    className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg"
                    style={{ background: themePrimary }}
                  >
                    {cartItem.qty}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3.5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-bold text-slate-900 dark:text-white text-sm leading-snug cursor-pointer line-clamp-1"
                      onClick={() => setExpandedId(isExpanded ? "" : item.id)}
                    >
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.description || "Artisanal preparation with fine selected ingredients."}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-1">
                    <span className="font-black text-base leading-none" style={{ color: themePrimary }}>
                      {formatPrice(item.price)}
                    </span>
                    {item.preparationTime && (
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5 justify-end">
                        <Clock className="w-2.5 h-2.5" /> {item.preparationTime}m
                      </p>
                    )}
                  </div>
                </div>

                {/* Note input — always visible when cart has this item */}
                <AnimatePresence>
                  {(isExpanded || cartItem) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="text"
                        placeholder="📝 Chef note (e.g. Less spicy, no onion)"
                        value={notesByItemId[item.id] ?? ""}
                        onChange={(e) => setNote(item.id, e.target.value)}
                        className="w-full mb-2 px-3 py-2 text-[11px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl outline-none focus:border-amber-400 placeholder-amber-400/80 dark:placeholder-amber-600/60 text-slate-800 dark:text-slate-200"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add / Qty Control */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? "" : item.id)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {isExpanded ? "▲ Less" : "▼ Details"}
                  </button>

                  {cartItem ? (
                    <div className="flex items-center rounded-xl overflow-hidden border-2 shadow-sm" style={{ borderColor: `${themePrimary}60` }}>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, -1)}
                        className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 font-black text-sm" style={{ color: themePrimary }}>
                        {cartItem.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, 1)}
                        className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        addToCartStorage(item.id, item.name, item.price);
                        setExpandedId(item.id);
                      }}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer shadow-sm hover:shadow-md"
                      style={{ background: themePrimary }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 text-xs space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No dishes match your query</p>
            <p>Try switching category or clearing the search filter.</p>
          </div>
        )}
      </div>

      {/* Floating Bottom Cart CTA Bar */}
      <AnimatePresence>
        {cart.length > 0 && !billOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto"
          >
            <button
              type="button"
              onClick={() => setBillOpen(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl px-5 py-3.5 shadow-xl flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer border border-emerald-400/30"
              style={{ backgroundColor: themePrimary }}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                  {cart.reduce((a, c) => a + c.qty, 0)}
                </span>
                <span className="text-xs sm:text-sm font-bold">View Order & Checkout</span>
              </div>
              <span className="text-sm font-extrabold">{formatPrice(grandTotal)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout & Live Tracker Modal Drawer */}
      <AnimatePresence>
        {billOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="bg-white dark:bg-[#111827] w-full max-w-xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <div>
                  <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                    {orderId ? "Live Order Tracker" : "Review Table Ticket"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {orderId ? `Order Reference: #${orderId.slice(0, 8).toUpperCase()}` : `Table #${tableCode || "1"}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBillOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Body */}
              <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
                {orderId ? (
                  <div className="space-y-6">
                    {/* Order Header Summary */}
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4">
                      <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/60 pb-2.5">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                            Active Live Order
                          </p>
                          <p className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                            #{orderId.slice(0, 10).toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 capitalize shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                            {orderStatus.replace("_", " ")}
                          </span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            {tableCode ? `Table #${tableCode}` : "Dine-In"}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium mt-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" /> Dispatched to Kitchen Display System in real time.
                      </p>
                    </div>

                    {/* Visual 4-Step Cooking Progress */}
                    <div className="relative border-l-2 border-emerald-500/50 ml-4 space-y-5 pl-6 py-1">
                      {[
                        { key: "new", label: "Order Received", desc: "Sent directly to kitchen KOT display" },
                        { key: "preparing", label: "Chef Cooking", desc: "Meal preparation actively in progress" },
                        { key: "ready", label: "Plated & Ready", desc: "Dishes prepared and quality verified" },
                        { key: "served", label: "Served on Table", desc: "Delivered to your table. Bon Appétit!" }
                      ].map((step, idx) => {
                        const statuses = ["new", "preparing", "ready", "served"];
                        const currentIdx = statuses.indexOf(orderStatus);
                        const isDone = currentIdx >= idx;
                        const isCurrent = orderStatus === step.key;

                        return (
                          <div key={step.key} className="relative">
                            <div
                              className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                isCurrent
                                  ? "bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-md font-extrabold"
                                  : isDone
                                  ? "bg-emerald-500 text-slate-950"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className={`font-bold text-xs ${isCurrent ? "text-emerald-600 dark:text-emerald-400" : isDone ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                                {step.label}
                              </p>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-500 font-bold animate-pulse">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{step.desc}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Ordered Dishes Breakdown List */}
                    <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                        <span>Dishes in this Order</span>
                        <span className="text-slate-400">
                          {(placedItems.length > 0 ? placedItems : cart).reduce((s, r) => s + r.qty, 0)} Items
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {(placedItems.length > 0 ? placedItems : cart).map((row, idx) => (
                          <div
                            key={row.key || idx}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/50 text-xs"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                  {row.qty}x
                                </span>
                                <p className="font-semibold text-slate-900 dark:text-white truncate">{row.name}</p>
                              </div>
                              {row.note && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                                  📝 {row.note}
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white shrink-0">
                              {formatPrice(row.price * row.qty)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleCallWaiter}
                          className="btn-outline py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                        >
                          <Bell className="w-3.5 h-3.5" /> Call Waiter
                        </button>
                        <button
                          type="button"
                          onClick={generateWhatsAppReceipt}
                          className="btn-outline py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                        >
                          <Share2 className="w-3.5 h-3.5" /> WhatsApp Receipt
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setBillOpen(false)}
                          className="btn-primary flex-1 py-2.5 text-xs font-semibold"
                        >
                          Add More Items to Order
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.removeItem("dinescan_active_order_id");
                            setOrderId("");
                            setPlacedItems([]);
                            setBillOpen(false);
                            toast.success("Order session cleared! You can now start a new order.");
                          }}
                          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 hover:text-rose-500 hover:border-rose-500/30 transition-colors"
                          title="Finish order and clear session"
                        >
                          New Order
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CHECKOUT & PAYMENT SELECTION */
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span>Items ({cart.length})</span>
                        <button type="button" onClick={() => clearCart()} className="text-rose-500 hover:underline">Clear Cart</button>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {cart.map((row) => (
                          <div
                            key={row.key}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-xs"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-bold text-slate-900 dark:text-white truncate">{row.name}</p>
                              <p className="text-slate-400">{formatPrice(row.price)} each</p>
                              {row.note && <p className="text-amber-600 dark:text-amber-400 font-medium">Note: {row.note}</p>}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                                <button type="button" onClick={() => updateQty(row.key, -1)} className="px-2 py-0.5 font-bold text-slate-500">-</button>
                                <span className="px-1.5 font-bold text-slate-800 dark:text-slate-200">{row.qty}</span>
                                <button type="button" onClick={() => updateQty(row.key, 1)} className="px-2 py-0.5 font-bold text-slate-500">+</button>
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white w-14 text-right">
                                {formatPrice(row.price * row.qty)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tip Selection */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>Chef & Staff Tip</span>
                        {tipAmount > 0 && <span className="text-emerald-600 font-bold">+{formatPrice(tipAmount)}</span>}
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[0, 5, 10, 15].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setTipOption(pct)}
                            className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              tipOption === pct
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {pct === 0 ? "No Tip" : `${pct}%`}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setTipOption(-1)}
                          className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            tipOption === -1
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                      {tipOption === -1 && (
                        <input
                          type="number"
                          placeholder="Tip amount in ₹"
                          value={customTip}
                          onChange={(e) => setCustomTip(e.target.value)}
                          className="input text-xs py-1.5 bg-white dark:bg-slate-950 mt-1"
                        />
                      )}
                    </div>

                    {/* Payment Mode Selector */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Payment Option</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "upi", label: "UPI QR", icon: QrCode },
                          { id: "cash", label: "Cash Table", icon: Banknote },
                          { id: "card", label: "Card", icon: CreditCard }
                        ].map((pm) => {
                          const IconC = pm.icon;
                          return (
                            <button
                              key={pm.id}
                              type="button"
                              onClick={() => setPaymentMode(pm.id as typeof paymentMode)}
                              className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                paymentMode === pm.id
                                  ? "bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600"
                                  : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                              }`}
                            >
                              <IconC className="w-3.5 h-3.5 text-emerald-400" />
                              {pm.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Guest Contact Information for Owner CRM */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                        Guest Contact Info (Optional for WhatsApp Receipt)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Your Name (e.g. Rahul)"
                          value={customerName}
                          onChange={(e) => {
                            setCustomerName(e.target.value);
                            localStorage.setItem("dinescan_customer_name", e.target.value);
                          }}
                          className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 text-xs text-slate-900 dark:text-white"
                        />
                        <input
                          type="tel"
                          placeholder="Mobile Number (+91...)"
                          value={customerPhone}
                          onChange={(e) => {
                            setCustomerPhone(e.target.value);
                            localStorage.setItem("dinescan_customer_phone", e.target.value);
                          }}
                          className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Summary Bill */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold text-slate-900 dark:text-white">{formatPrice(cartTotal)}</span></div>
                      <div className="flex justify-between"><span>Service Charge (5%)</span><span className="font-semibold text-slate-900 dark:text-white">{formatPrice(serviceCharge)}</span></div>
                      <div className="flex justify-between"><span>GST Tax (5%)</span><span className="font-semibold text-slate-900 dark:text-white">{formatPrice(tax)}</span></div>
                      {tipAmount > 0 && <div className="flex justify-between text-emerald-600 font-semibold"><span>Staff Tip</span><span>{formatPrice(tipAmount)}</span></div>}
                      <div className="flex justify-between items-center text-base font-bold border-t border-slate-100 dark:border-slate-800 pt-2 text-slate-900 dark:text-white">
                        <span>Total Due</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-lg font-extrabold">{formatPrice(grandTotal)}</span>
                      </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        type="button"
                        onClick={generateWhatsAppReceipt}
                        className="btn-outline flex-1 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                      >
                        <Share2 className="w-4 h-4" /> Share Receipt
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={async () => {
                          setIsSubmitting(true);
                          setPlacedItems([...cart]);
                          const payload = {
                            restaurant_id: restaurant.id,
                            table_code: tableCode || "1",
                            session_id: sessionId || null,
                            customer_name: customerName || null,
                            customer_phone: customerPhone || null,
                            subtotal: cartTotal,
                            service_charge: serviceCharge,
                            tax,
                            total: grandTotal,
                            items: cart.map((row) => ({
                              menu_item_id: row.itemId,
                              name: row.name,
                              price: row.price,
                              qty: row.qty,
                              note: row.note || null
                            }))
                          };

                          try {
                            const res = await fetch("/api/orders", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(payload)
                            });
                            const data = (await res.json()) as { order_id?: string; error?: string };
                            if (!res.ok || !data.order_id) {
                              toast.error(data.error || "Failed to submit order.");
                              setIsSubmitting(false);
                              return;
                            }
                            localStorage.setItem("dinescan_active_order_id", data.order_id);
                            setOrderId(data.order_id);
                            setOrderStatus("new");
                            clearCart();
                            toast.success("Order sent to Kitchen!");
                          } catch {
                            toast.error("Network error submitting order.");
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        className="btn-primary flex-[1.4] py-2.5 text-xs font-bold shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isSubmitting ? "Sending to Kitchen..." : `Confirm Order (${formatPrice(grandTotal)})`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restaurant Info & Guidelines Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card bg-white dark:bg-[#111827] max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Restaurant Info & Policies
                </h3>
                <button type="button" onClick={() => setShowInfoModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Opening Hours</p>
                  <p className="mt-0.5">Monday – Sunday: 11:00 AM – 11:00 PM</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Free Guest Wi-Fi</p>
                  <p className="mt-0.5">SSID: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">DineScan_Guest</code> | Pass: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">Welcome123</code></p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Hygiene & Safety</p>
                  <p className="mt-0.5">FSSAI Certified 5-Star Kitchen Standards. 100% daily sanitized dining environment.</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Accepted Payments</p>
                  <p className="mt-0.5">Google Pay, PhonePe, Paytm, BHIM UPI, Visa / Mastercard, and Cash on Table.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="btn-primary w-full py-2.5 text-xs font-semibold"
              >
                Close Info
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Order Tracking Pill Bar when tracker modal is closed */}
      {orderId && !billOpen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-md w-[94%] bg-slate-900/95 dark:bg-[#070B14]/95 text-white p-3 sm:p-3.5 rounded-2xl border border-emerald-500/50 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="min-w-0">
              <p className="font-bold text-xs text-white truncate">
                Active Order #{orderId.slice(0, 8).toUpperCase()} {tableCode ? `• Table ${tableCode}` : ""}
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold capitalize truncate">
                Status: {orderStatus.replace("_", " ")} • Tap to track dishes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBillOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shrink-0 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          >
            Track Order ↗
          </button>
        </div>
      )}
    </div>
  );
}
