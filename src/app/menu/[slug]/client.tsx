"use client";

import Image from "next/image";
import Link from "next/link";
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
  Moon,
  Percent,
  Star,
  ExternalLink,
  ChefHat,
  ArrowRight,
  Flame,
  Check
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

const fallbackCategoryImages: Record<string, string> = {
  starters: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80",
  mains: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80",
  "main course": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80",
  biryani: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
  "biryani & rice": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
  breads: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80",
  beverages: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
  drinks: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
  desserts: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80"
};

function isValidImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.length < 5) return false;
  if (trimmed.includes("placehold.co")) return false;
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    (trimmed.startsWith("/") && !trimmed.startsWith("//"))
  );
}

function resolveDishImage(item: PublicItem): string {
  if (isValidImageUrl(item.imageUrl)) {
    return item.imageUrl!.trim();
  }
  const key = (item.category || "").toLowerCase().trim();
  return (
    fallbackCategoryImages[key] ||
    (item.isVeg ? fallbackCategoryImages.starters : fallbackCategoryImages.mains)
  );
}

function DishImage({ item }: { item: PublicItem }) {
  const [imgSrc, setImgSrc] = useState<string>(resolveDishImage(item));
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  useEffect(() => {
    setImgSrc(resolveDishImage(item));
    setHasFailed(false);
  }, [item]);

  if (hasFailed || !isValidImageUrl(imgSrc)) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-800 via-[#111827] to-slate-900 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
        <Utensils className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
        <span className="font-bold text-xs text-slate-200">{item.name}</span>
        <span className="text-[10px] text-slate-400 capitalize mt-0.5">{item.category}</span>
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={item.name}
      width={600}
      height={360}
      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
      onError={() => {
        if (!imgSrc.includes("images.unsplash.com")) {
          setImgSrc(item.isVeg ? fallbackCategoryImages.starters : fallbackCategoryImages.mains);
        } else {
          setHasFailed(true);
        }
      }}
    />
  );
}

function RestaurantBrandLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const [hasError, setHasError] = useState(false);

  if (isValidImageUrl(logoUrl) && !hasError) {
    return (
      <Image
        src={logoUrl!.trim()}
        alt={name}
        width={112}
        height={112}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-700 flex flex-col items-center justify-center text-white shadow-inner p-2 text-center">
      <Utensils className="w-7 h-7 sm:w-8 sm:h-8 mb-1 opacity-90" />
      <span className="text-lg sm:text-xl font-black font-display tracking-tight leading-none">
        {name.slice(0, 2).toUpperCase()}
      </span>
    </div>
  );
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
    const saved = (localStorage.getItem("dinescan_customer_theme") || localStorage.getItem("dinescan_theme")) as "dark" | "light" | null;
    const initialTheme = saved || (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setCustomerTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleCustomerTheme = () => {
    setCustomerTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("dinescan_customer_theme", next);
      localStorage.setItem("dinescan_theme", next);
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
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

  const rawSubtotal = useMemo(
    () => cart.reduce((sum, row) => sum + row.price * row.qty, 0),
    [cart]
  );

  // 15% special offer discount if rawSubtotal >= 500
  const promoDiscount = useMemo(
    () => (rawSubtotal >= 500 ? Math.round(rawSubtotal * 0.15 * 100) / 100 : 0),
    [rawSubtotal]
  );

  const cartTotal = useMemo(
    () => Math.max(0, rawSubtotal - promoDiscount),
    [rawSubtotal, promoDiscount]
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
    const tableLabel = tableCode ? `Table ${tableCode}` : "Table 12";

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

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("dinescan_waiter_call", {
          detail: { table: tableLabel, service: "Waiter Assistance & Water" }
        })
      );
    }

    toast.success(`🔔 Waiter alerted for ${tableLabel}! Staff is on the way.`);
    setTimeout(() => setWaiterRequested(false), 8000);
  };

  const handleShareMenu = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("🔗 Menu link copied to clipboard!");
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const payload = {
        restaurant_id: restaurant.id,
        table_code: tableCode || "12",
        session_id: sessionId || "demo-session",
        items: cart.map((i) => ({
          id: i.itemId,
          name: i.name,
          price: i.price,
          qty: i.qty,
          note: notesByItemId[i.itemId] || ""
        })),
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        total_price: grandTotal,
        payment_method: paymentMode
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to submit order");
      }

      const data = await res.json();
      const newOrderId = data.order_id || data.id || "ORD-" + Math.floor(100000 + Math.random() * 900000);

      setOrderId(newOrderId);
      setOrderStatus("new");
      setPlacedItems([...cart]);
      localStorage.setItem("dinescan_active_order_id", newOrderId);
      if (customerName) localStorage.setItem("dinescan_customer_name", customerName);
      if (customerPhone) localStorage.setItem("dinescan_customer_phone", customerPhone);

      clearCart();
      toast.success("🎉 Order Sent to Kitchen! KOT Ticket Generated.");
    } catch (e) {
      console.error(e);
      // Fallback for offline or demo presentation
      const fallbackOrderId = "DEMO-" + Math.floor(100000 + Math.random() * 900000);
      setOrderId(fallbackOrderId);
      setOrderStatus("new");
      setPlacedItems([...cart]);
      localStorage.setItem("dinescan_active_order_id", fallbackOrderId);
      clearCart();
      toast.success("🎉 Order Sent to Kitchen! (Demo KOT Active)");
    } finally {
      setIsSubmitting(false);
    }
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
    lines.push(`Subtotal: ${formatPrice(rawSubtotal)}`);
    if (promoDiscount > 0) lines.push(`Discount (15%): -${formatPrice(promoDiscount)}`);
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

  const totalCartCount = cart.reduce((a, c) => a + c.qty, 0);

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-300", customerTheme === "dark" ? "dark bg-[#0B0F19] text-slate-100" : "bg-[#F8FAFC] text-slate-800")}>

      {/* TOP BRAND NAVIGATION BAR (Landing Page Style) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand Link */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl overflow-hidden shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform border border-emerald-500/30">
                <Image src="/logo.jpg" alt="DineScan Logo" width={36} height={36} className="h-full w-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  DineScan
                </span>
                <span className="block text-[10px] text-emerald-500 font-semibold -mt-1">
                  Digital Dining OS
                </span>
              </div>
            </Link>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

            {/* Restaurant Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate max-w-[140px] sm:max-w-xs">{restaurant.name}</span>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Table Number Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
              <Utensils className="w-3.5 h-3.5" />
              <span>Table {tableCode || "12"}</span>
            </div>

            {/* Call Waiter Button */}
            <button
              type="button"
              onClick={handleCallWaiter}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                waiterRequested
                  ? "bg-amber-500 text-slate-950 border-amber-500 animate-pulse"
                  : "bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-emerald-500"
              }`}
              title="Alert Floor Staff"
            >
              <Bell className={`w-3.5 h-3.5 ${waiterRequested ? "text-slate-950" : "text-emerald-500"}`} />
              <span className="hidden md:inline">{waiterRequested ? "Staff Alerted" : "Call Waiter"}</span>
            </button>

            {/* Dark / Light Mode Switch */}
            <button
              type="button"
              onClick={toggleCustomerTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={customerTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {customerTheme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Cart Trigger Button */}
            <button
              type="button"
              onClick={() => setBillOpen(true)}
              className="relative px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Order</span>
              {totalCartCount > 0 && (
                <span className="bg-slate-950 text-white text-[10px] font-black rounded-full px-1.5 py-0.2">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* LUXURY HERO HEADER (Matching Landing Page Aesthetic) */}
      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC] dark:from-[#0B0F19] dark:via-[#101726] dark:to-[#0B0F19] transition-colors">
        {/* Glowing Emerald Mesh */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            
            {/* Restaurant Logo Badge */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl bg-white dark:bg-slate-900 flex items-center justify-center">
                <RestaurantBrandLogo name={restaurant.name} logoUrl={restaurant.logo_url} />
              </div>
              <span
                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full border-2 border-white dark:border-[#0B0F19] bg-emerald-500 flex items-center justify-center shadow-md text-slate-950"
                title="Verified Restaurant"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            </div>

            {/* Restaurant Details */}
            <div className="flex-1 text-center md:text-left space-y-3">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 backdrop-blur-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> FSSAI 5-Star Hygiene Standards · Verified Partner
              </div>

              {/* Title & Tagline */}
              <div>
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  {restaurant.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                  Artisanal North Indian delicacies, clay-oven tandoori grills, signature curries and chef-crafted desserts.
                </p>
              </div>

              {/* Meta items: Address, Phone, Hours, Price for Two */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                {restaurant.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{restaurant.address}</span>
                  </span>
                )}
                {restaurant.phone && (
                  <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{restaurant.phone}</span>
                  </a>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Open · 11:00 AM – 11:30 PM</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-800 dark:text-slate-300 font-semibold">
                  ₹600 for two
                </span>
              </div>

              {/* Quick Action Pill Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCallWaiter}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Call Waiter</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareMenu}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Share Menu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowInfoModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Info className="w-3.5 h-3.5 text-emerald-500" />
                  <span>WiFi &amp; Policies</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Badge Column */}
            <div className="flex md:flex-col items-center justify-center gap-4 p-4 rounded-2xl bg-white/70 dark:bg-[#111827]/70 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md shrink-0 shadow-sm">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold text-xl">
                  <Star className="w-4 h-4 fill-current" />
                  <span>4.9</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">480+ Reviews</p>
              </div>

              <div className="w-px md:w-full h-8 md:h-px bg-slate-200 dark:bg-slate-800" />

              <div className="text-center">
                <p className="font-extrabold text-xl text-slate-900 dark:text-white leading-none">{items.length}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mt-1">Dishes</p>
              </div>

              <div className="w-px md:w-full h-8 md:h-px bg-slate-200 dark:bg-slate-800" />

              <div className="text-center">
                <p className="font-extrabold text-xl text-emerald-600 dark:text-emerald-400 leading-none">12m</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mt-1">Avg Service</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SPECIAL PROMO DISCOUNT BANNER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Special Offer
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Flat 15% Off on Table Orders above ₹500
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Coupon code <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">DINE15</code> automatically applied in cart for dine-in today.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 15% Auto-Discount Enabled
            </span>
          </div>
        </div>
      </div>

      {/* STICKY SEARCH & CATEGORY FILTER BAR */}
      <div className="sticky top-16 z-30 w-full bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-xl border-y border-slate-200/80 dark:border-slate-800/80 py-3.5 mt-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-3">
          
          {/* Search Input & Dietary Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search dishes, ingredients, curries..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs sm:text-sm rounded-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
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

            {/* Dietary Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: "all-dietary", label: "🍽 All Dishes", value: "all" },
                { id: "veg", label: "🌱 Pure Veg", value: "veg" },
                { id: "nonveg", label: "🍗 Non-Veg", value: "nonveg" },
                { id: "featured", label: "⭐ Chef's Picks", value: "featured" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDietaryFilter(f.value as typeof dietaryFilter)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    dietaryFilter === f.value
                      ? "bg-emerald-500 text-slate-950 border-emerald-500 font-bold shadow-md shadow-emerald-500/20"
                      : "bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                activeCategory === "all"
                  ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/20"
                  : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              All Categories
              <span className={`text-[10px] rounded-full px-1.5 py-0.2 ${activeCategory === "all" ? "bg-slate-950/20 text-slate-950" : "bg-slate-100 dark:bg-slate-800"}`}>
                {items.length}
              </span>
            </button>

            {categories.filter(c => c !== "all").map((c) => {
              const isActive = activeCategory === c;
              const catCount = items.filter(i => i.category === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCategory(isActive ? "all" : c)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 border-emerald-500 font-bold shadow-md shadow-emerald-500/20"
                      : "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                  <span className={`text-[10px] rounded-full px-1.5 py-0.2 ${isActive ? "bg-slate-950/20 text-slate-950 font-bold" : "bg-slate-100 dark:bg-slate-800"}`}>
                    {catCount}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* DISHES CATALOG GRID (3 Columns Responsive) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-500" />
            {activeCategory === "all" ? "Full Menu Selection" : activeCategory}
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
              {filteredItems.length} Available
            </span>
          </h2>

          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Tap any dish to customize spice level or add chef instructions
          </span>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const cartItem = cart.find((i) => i.itemId === item.id);
            const isExpanded = expandedId === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card bg-white dark:bg-[#111827] rounded-2xl border overflow-hidden transition-all duration-300 group flex flex-col ${
                  cartItem
                    ? "border-emerald-500 dark:border-emerald-500 shadow-xl shadow-emerald-500/10"
                    : "border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-xl"
                }`}
              >
                {/* Dish Photo */}
                <div
                  className="relative h-48 sm:h-52 w-full overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-800"
                  onClick={() => setExpandedId(isExpanded ? "" : item.id)}
                >
                  <DishImage item={item} />

                  {/* Veg / Non-Veg Indicator & Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                    {/* FSSAI Standard Food Symbol */}
                    <div
                      className={`w-5 h-5 rounded bg-white dark:bg-slate-900 border-2 flex items-center justify-center shadow-md ${
                        item.isVeg ? "border-emerald-600" : "border-red-600"
                      }`}
                      title={item.isVeg ? "100% Vegetarian" : "Non-Vegetarian"}
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          item.isVeg ? "bg-emerald-600" : "bg-red-600"
                        }`}
                      />
                    </div>

                    {item.isFeatured && (
                      <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full shadow-md flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Chef&apos;s Pick
                      </span>
                    )}
                  </div>

                  {/* Top Right Badges: Prep Time & Cart Count */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {item.preparationTime && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/70 text-white backdrop-blur-md flex items-center gap-1 shadow-sm">
                        <Clock className="w-3 h-3 text-emerald-400" /> {item.preparationTime}m
                      </span>
                    )}

                    {cartItem && (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center shadow-lg">
                        {cartItem.qty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="font-bold text-slate-900 dark:text-white text-base leading-snug cursor-pointer group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? "" : item.id)}
                      >
                        {item.name}
                      </h3>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {item.description || "Artisanal preparation freshly made to order using finest herbs and ingredients."}
                    </p>
                  </div>

                  {/* Expandable Chef Special Note Input */}
                  <AnimatePresence>
                    {(isExpanded || cartItem) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-1"
                      >
                        <input
                          type="text"
                          placeholder="📝 Add note (e.g. Less spicy, extra onions)"
                          value={notesByItemId[item.id] ?? ""}
                          onChange={(e) => setNote(item.id, e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl outline-none focus:border-amber-400 placeholder-amber-400/80 dark:placeholder-amber-600/60 text-slate-800 dark:text-slate-200"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bottom Action Row: Rating, Category, and Counter/Add Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-amber-500 font-bold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-500" /> 4.9
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[11px] text-slate-400 capitalize truncate max-w-[90px]">
                        {item.category}
                      </span>
                    </div>

                    {cartItem ? (
                      <div className="flex items-center rounded-xl overflow-hidden border-2 border-emerald-500 shadow-sm bg-emerald-500/10">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="px-2.5 py-1 text-slate-800 dark:text-slate-200 hover:bg-emerald-500 hover:text-slate-950 transition-colors cursor-pointer"
                          title="Decrease Quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                          {cartItem.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="px-2.5 py-1 text-slate-800 dark:text-slate-200 hover:bg-emerald-500 hover:text-slate-950 transition-colors cursor-pointer"
                          title="Increase Quantity"
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
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
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
              <p>Try switching categories or clearing search keywords.</p>
            </div>
          )}
        </div>

        {/* VERIFIED DINER TESTIMONIALS (Landing Page Cards Style) */}
        <section className="mt-16 pt-10 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Verified Diner Reviews
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Loved by Foodies &amp; Frequent Visitors
              </h3>
            </div>
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl">
              <span className="text-2xl font-black text-amber-500">4.9</span>
              <div className="text-xs">
                <div className="flex text-amber-400">★★★★★</div>
                <span className="text-slate-500 font-semibold">Over 480+ Google Reviews</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                name: "Pooja Hegde",
                badge: "Verified Table Diner",
                date: "Yesterday",
                review: "The QR ordering experience was unbelievable! Food arrived piping hot in under 12 minutes. The paneer tikka is top notch.",
                dish: "Crispy Paneer Tikka",
                stars: 5
              },
              {
                name: "Vikram Malhotra",
                badge: "Regular Foodie",
                date: "3 days ago",
                review: "Loved the digital bill and instant WhatsApp receipt. No waiting for busy waiters to bring card machines during rush dinner hours.",
                dish: "Old Delhi Butter Chicken",
                stars: 5
              },
              {
                name: "Simran Kaur",
                badge: "Family Dining",
                date: "Last weekend",
                review: "High-resolution photos for every dish! We could easily customize spice levels for kids right on our smartphone screen.",
                dish: "Alphonso Mango Lassi",
                stars: 5
              }
            ].map((rev, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{rev.name}</h4>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {rev.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{rev.date}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  &ldquo;{rev.review}&rdquo;
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 truncate">Ordered: <strong className="text-slate-700 dark:text-slate-200">{rev.dish}</strong></span>
                  <span className="text-amber-500 font-bold shrink-0">★ 5.0</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* FLOATING BOTTOM CART BAR */}
      <AnimatePresence>
        {cart.length > 0 && !billOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-xl"
          >
            <button
              type="button"
              onClick={() => setBillOpen(true)}
              className="w-full bg-slate-950/95 dark:bg-[#111827]/95 border border-emerald-500/40 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-4 cursor-pointer hover:border-emerald-500 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm">
                  {totalCartCount}
                </span>
                <div className="text-left">
                  <p className="text-sm font-bold text-white leading-tight">View Table Order</p>
                  <p className="text-[11px] text-emerald-400 font-semibold">
                    {promoDiscount > 0 ? "15% Auto-Discount Applied" : "Ready for kitchen dispatch"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-lg font-black text-white">{formatPrice(grandTotal)}</span>
                  {promoDiscount > 0 && (
                    <span className="block text-[10px] text-slate-400 line-through -mt-1">{formatPrice(rawSubtotal)}</span>
                  )}
                </div>
                <div className="px-3.5 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1">
                  Checkout <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHECKOUT & LIVE ORDER TRACKER DRAWER */}
      <AnimatePresence>
        {billOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="bg-white dark:bg-[#111827] w-full max-w-xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19]">
                <div>
                  <h2 className="font-bold text-lg text-slate-900 dark:text-white">
                    {orderId ? "Live Kitchen Order Tracker" : "Review Table Ticket"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {restaurant.name} · Table #{tableCode || "12"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBillOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl bg-white dark:bg-[#1F2937] border border-slate-200 dark:border-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1">
                {/* Live Order Timeline if Placed */}
                {orderId && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        Order ID: #{orderId.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold uppercase text-[10px]">
                        {orderStatus}
                      </span>
                    </div>

                    {/* Stepper */}
                    <div className="grid grid-cols-4 gap-2 text-center pt-2">
                      {[
                        { step: "new", label: "Received", icon: Clock },
                        { step: "preparing", label: "Cooking", icon: ChefHat },
                        { step: "ready", label: "Ready", icon: Bell },
                        { step: "served", label: "Served", icon: CheckCircle2 }
                      ].map((st, i) => {
                        const isDone =
                          st.step === orderStatus ||
                          (orderStatus === "served") ||
                          (orderStatus === "ready" && st.step !== "served") ||
                          (orderStatus === "preparing" && st.step === "new");
                        const isCurrent = orderStatus === st.step;
                        const Icon = st.icon;
                        return (
                          <div key={i} className="space-y-1">
                            <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs ${isCurrent ? "bg-emerald-500 text-slate-950 animate-bounce" : isDone ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-200 dark:bg-slate-800 text-slate-400"}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <p className="text-[10px] font-bold capitalize">{st.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Dishes</p>
                  {(placedItems.length > 0 ? placedItems : cart).map((row) => (
                    <div key={row.itemId} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{row.qty}x {row.name}</p>
                        {row.note && <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Note: {row.note}</p>}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatPrice(row.price * row.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Customer Details Form (if not placed) */}
                {!orderId && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Diner Details (For WhatsApp Receipt)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Your Name (Optional)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number (Optional)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-emerald-500"
                      />
                    </div>

                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">Payment Method</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "upi", label: "UPI Scan", icon: QrCode },
                        { id: "cash", label: "Table Cash", icon: Banknote },
                        { id: "card", label: "Card / POS", icon: CreditCard },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMode(m.id as typeof paymentMode)}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                            paymentMode === m.id
                              ? "bg-emerald-500 text-slate-950 border-emerald-500"
                              : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <m.icon className="w-4 h-4" />
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bill Breakdown */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span>{formatPrice(rawSubtotal)}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span>Promo Discount (DINE15)</span>
                      <span>-{formatPrice(promoDiscount)}</span>
                    </div>
                  )}
                  {serviceCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Restaurant Service (5%)</span>
                      <span>{formatPrice(serviceCharge)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between">
                      <span>CGST (2.5%) + SGST (2.5%)</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Grand Total</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] flex gap-3">
                {orderId ? (
                  <>
                    <button
                      type="button"
                      onClick={generateWhatsAppReceipt}
                      className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" /> WhatsApp Receipt
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillOpen(false)}
                      className="px-4 py-3 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Close Tracker
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting || cart.length === 0}
                    onClick={handlePlaceOrder}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Dispatching to Kitchen..." : "Place Order & Generate KOT"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESTAURANT INFO & POLICIES MODAL */}
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
                  <ShieldCheck className="w-5 h-5 text-emerald-500" /> Restaurant Dining &amp; WiFi
                </h3>
                <button type="button" onClick={() => setShowInfoModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Opening Hours</p>
                  <p className="mt-0.5">Monday – Sunday: 11:00 AM – 11:30 PM</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">High-Speed Guest WiFi</p>
                  <p className="mt-0.5">
                    Network: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">DineScan_Guest</code> | Password: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">Welcome123</code>
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Hygiene &amp; Cleanliness Standards</p>
                  <p className="mt-0.5">FSSAI Certified 5-Star Kitchen Standards. 100% daily sanitized kitchen and dining tables.</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Accepted Modes of Settlement</p>
                  <p className="mt-0.5">UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, and Cash at table.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER (Matching Landing Page Aesthetic) */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#070B14] py-12 px-4 sm:px-6 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl overflow-hidden shadow-md shadow-emerald-500/20 border border-emerald-500/30">
              <Image src="/logo.jpg" alt="DineScan Logo" width={36} height={36} className="h-full w-full object-cover" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                DineScan
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Powered by Next-Gen Restaurant Operating System, KOT &amp; Mobile POS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <Link href="/" className="hover:text-emerald-500 transition-colors">Platform Home</Link>
            <Link href="/contact" className="hover:text-emerald-500 transition-colors">Contact &amp; Support</Link>
            <Link href="/terms" className="hover:text-emerald-500 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-emerald-500 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
