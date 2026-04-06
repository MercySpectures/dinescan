"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/cart/store";
import toast from "react-hot-toast";

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

interface CartItem {
  key: string;
  itemId: string;
  name: string;
  price: number;
  qty: number;
  note: string;
}

export default function PublicMenuClient({ items, restaurant }: PublicMenuClientProps) {
  const [query, setQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string>("");
  
  // Zustand store
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

  // Auto-heal local storage
  useEffect(() => {
    if (items.length > 0) {
      purgeStaleItems(items.map(i => i.id));
    }
  }, [items, purgeStaleItems]);

  const [includeService, setIncludeService] = useState<boolean>(true);
  const [includeTax, setIncludeTax] = useState<boolean>(true);
  const [serviceRate] = useState<number>(0.05);
  const [taxRate] = useState<number>(0.05);
  const [orderId, setOrderId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [billOpen, setBillOpen] = useState<boolean>(false);

  const categories = useMemo<string[]>(
    () => ["all", ...Array.from(new Set(items.map((item) => item.category)))],
    [items]
  );

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const byCategory = activeCategory === "all" || item.category === activeCategory;
        const bySearch = item.name.toLowerCase().includes(query.toLowerCase());
        return byCategory && bySearch;
      }),
    [activeCategory, items, query]
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

  const grandTotal = useMemo(
    () => Math.round((cartTotal + serviceCharge + tax) * 100) / 100,
    [cartTotal, serviceCharge, tax]
  );

  useEffect(() => {
    // Only parse URL params if the store hasn't been set, or forcefully override
    const url = new URL(window.location.href);
    const table = url.searchParams.get("table") ?? "";
    const session = url.searchParams.get("session") ?? "";
    if (table && !tableCode) setTableCode(table);
    if (!sessionId) setSessionId(session || crypto.randomUUID());
  }, [tableCode, sessionId, setTableCode, setSessionId]);

  useEffect(() => {
    if (cart.length === 0) setBillOpen(false);
  }, [cart.length]);

  const addToCart = (item: PublicItem) => {
    addToCartStorage(item.id, item.name, item.price);
    setExpandedId(""); // Auto collapse on add
  };

  return (
    <div className="space-y-8 font-body text-slate-800 relative min-h-screen">
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 sm:p-6 lg:p-8 text-center sm:text-left bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-3xl border border-white"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-6">
          {restaurant.logo_url ? (
            <Image 
              src={restaurant.logo_url} 
              width={96} 
              height={96} 
              alt={restaurant.name} 
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl shadow-sm bg-white p-1 border border-slate-100 flex-shrink-0" 
            />
          ) : null}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm leading-tight">{restaurant.name}</h1>
            <div className="mt-3 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-slate-500 font-medium justify-center sm:justify-start">
              {restaurant.address ? (
                <span className="flex items-center gap-1.5 bg-slate-100/50 px-3 py-1 rounded-full border border-slate-200/60">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {restaurant.address}
                </span>
              ) : null}
              {restaurant.phone ? (
                <span className="flex items-center gap-1.5 bg-slate-100/50 px-3 py-1 rounded-full border border-slate-200/60">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {restaurant.phone}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </motion.section>

      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-slate-200/50 flex flex-col gap-3">
        <div className="relative">
          <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            className="input w-full pl-10 py-3.5 bg-white/60 shadow-sm border-white/50 text-base"
            placeholder="Search our menu..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                className={isActive ? "btn-primary whitespace-nowrap snap-start shadow-md py-2 px-5 text-sm rounded-full" : "btn-outline whitespace-nowrap snap-start py-2 px-5 text-sm rounded-full bg-white/60 border-transparent hover:border-primary/30"}
                onClick={() => setActiveCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <motion.section layout className="space-y-4">
          {filtered.filter((item) => item.isFeatured).length > 0 && activeCategory === 'all' && query === '' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-4 px-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Chef's Recommendations</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.filter((item) => item.isFeatured).map((item) => (
                   <motion.article layoutId={item.id} key={item.id} className="card p-5 border border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-white hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setExpandedId(prev => prev === item.id ? "" : item.id)}>
                      <div className="flex items-start justify-between">
                        <div>
                           <p className="font-bold text-slate-900 text-lg">{item.name}</p>
                           <span className={item.isVeg ? "badge-veg mt-1.5 inline-block" : "badge-nonveg mt-1.5 inline-block"}>
                            {item.isVeg ? "Vegetarian" : "Non-Veg"}
                           </span>
                        </div>
                        <p className="text-lg font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg">{formatPrice(item.price)}</p>
                      </div>
                   </motion.article>
                ))}
              </div>
            </motion.div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-6">
            {filtered.length === 0 ? (
              <div className="card p-8 text-center text-slate-500 sm:col-span-2 lg:col-span-3 font-medium">No dishes match your search. Try another query.</div>
            ) : null}
            
            {filtered.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <motion.article layoutId={`main-${item.id}`} key={item.id} className={`card overflow-hidden bg-white/80 transition-all duration-300 ${isExpanded ? 'shadow-xl ring-2 ring-primary/20' : 'hover:shadow-md'}`}>
                  <div
                    className="w-full text-left outline-none cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? "" : item.id)}
                  >
                    <div className="relative group">
                      <Image
                        src={item.imageUrl || "https://placehold.co/600x360/png"}
                        alt={item.name}
                        className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        width={600}
                        height={360}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                         <span className="text-white text-sm font-medium">Tap to view details</span>
                      </div>
                      <div className="absolute top-3 right-3">
                         <span className={item.isVeg ? "badge-veg bg-white/90 backdrop-blur-md shadow-sm" : "badge-nonveg bg-white/90 backdrop-blur-md shadow-sm"}>
                           {item.isVeg ? "Veg" : "Non-Veg"}
                         </span>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg leading-tight flex-1">{item.name}</h3>
                          {(item.allergens?.length || 0) > 0 || item.preparationTime ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.preparationTime && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                                  ⏱️ {item.preparationTime} mins
                                </span>
                              )}
                              {item.allergens?.map(a => (
                                <span key={a} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-100 uppercase font-medium">
                                  {a}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <p className="text-base flex-shrink-0 font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg">{formatPrice(item.price)}</p>
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="mt-4 text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
                              {item.description || "Freshly prepared by our master chefs."}
                            </p>
                            
                            <div className="mt-5 space-y-3" onClick={e => e.stopPropagation()}>
                                <input
                                className="input bg-slate-50 border-slate-200 text-sm focus:bg-white"
                                placeholder="Any special requests? (e.g., No onions)"
                                value={notesByItemId[item.id] ?? ""}
                                onChange={(event) => setNote(item.id, event.target.value)}
                              />
                              <button type="button" className="btn-primary w-full py-3.5 shadow-md flex items-center justify-center gap-2 text-base" onClick={() => addToCart(item)}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                Add to Bill {formatPrice(item.price)}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </motion.section>
      </AnimatePresence>

      <div className="flex justify-center pb-24 pt-8 opacity-70 hover:opacity-100 transition-opacity">
        <a href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-slate-200 hover:text-primary hover:border-primary/30 transition-colors">
           <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-5l-2.25 2.25-1.06-1.06L12 8.38l4.31 4.31-1.06 1.06L13 11.5v5h-2z" /></svg>
           Powered by DineScan
        </a>
      </div>

      <AnimatePresence>
        {cart.length > 0 && !billOpen && (
          <motion.button
            initial={{ y: 150 }}
            animate={{ y: 0 }}
            exit={{ y: 150 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            onClick={() => setBillOpen(true)}
            className="fixed bottom-6 left-4 right-4 z-50 mx-auto btn-primary rounded-2xl px-6 py-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)] flex items-center justify-between max-w-[340px] focus:ring-4 focus:ring-primary/20 transition-all hover:scale-[1.02] border border-white/20 hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.3)]"
            style={{ backgroundColor: restaurant.theme_color ?? undefined }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shadow-inner">
                {cart.length}
              </div>
              <span className="font-semibold text-white tracking-wide">View Order</span>
            </div>
            <span className="font-bold text-white tabular-nums">{formatPrice(grandTotal)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {billOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-100"
            >
              <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-900">Your Order</h2>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">Review and submit</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBillOpen(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-100 rounded-full text-slate-500 shadow-sm border border-slate-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="overflow-y-auto p-5 sm:p-6 flex-1">
                <div className="grid gap-3 grid-cols-1 mb-6">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Table Number</label>
                  <input
                    className="input py-3 bg-slate-50 border-slate-200 text-slate-900 font-bold"
                    placeholder="e.g. 12"
                    value={tableCode}
                    onChange={(event) => setTableCode(event.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-6 mb-6 px-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 justify-center">
                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 cursor-pointer select-none border-r border-slate-200/60 pr-6">
                    <input type="checkbox" className="w-4.5 h-4.5 rounded text-primary focus:ring-primary border-slate-300 transition-shadow focus:ring-2" checked={includeService} onChange={(event) => setIncludeService(event.target.checked)} />
                    Service (5%)
                  </label>
                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-700 cursor-pointer select-none">
                    <input type="checkbox" className="w-4.5 h-4.5 rounded text-primary focus:ring-primary border-slate-300 transition-shadow focus:ring-2" checked={includeTax} onChange={(event) => setIncludeTax(event.target.checked)} />
                    Tax (5%)
                  </label>
                </div>

                <div className="space-y-3">
                  {cart.map((row) => (
                    <div key={row.key} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-sm hover:border-slate-200 transition-colors">
                      <div className="min-w-0 flex-1 pr-3 pl-1">
                        <p className="truncate text-sm font-bold text-slate-900">{row.name}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">{formatPrice(row.price)} x {row.qty}</p>
                        {row.note && <p className="truncate text-[11px] font-semibold text-amber-600 bg-amber-50 inline-block px-2 py-0.5 rounded-md mt-1.5">Note: {row.note}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2 pr-1">
                        <p className="text-sm font-bold text-slate-900 tabular-nums">{formatPrice(row.price * row.qty)}</p>
                        <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-1 border border-slate-100">
                          <button type="button" className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-slate-600 hover:text-slate-900 shadow-sm border border-slate-200 transition-colors" onClick={() => updateQty(row.key, -1)}>-</button>
                          <p className="w-5 text-center text-sm font-bold">{row.qty}</p>
                          <button type="button" className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-slate-600 hover:text-slate-900 shadow-sm border border-slate-200 transition-colors" onClick={() => updateQty(row.key, 1)}>+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t border-slate-100 pt-5 space-y-3 text-sm font-medium">
                  <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="text-slate-900 font-semibold">{formatPrice(cartTotal)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Service Charge</span><span className="text-slate-900 font-semibold">{formatPrice(serviceCharge)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Estimated Tax</span><span className="text-slate-900 font-semibold">{formatPrice(tax)}</span></div>
                  <div className="flex justify-between items-center text-lg font-bold border-t border-dashed border-slate-200 pt-4 mt-4 text-slate-900"><span>Total Due</span><span className="text-primary text-xl" style={{ color: restaurant.theme_color ?? undefined }}>{formatPrice(grandTotal)}</span></div>
                </div>

                {orderId ? (
                  <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-4">
                     <div className="w-10 h-10 shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
                     <div>
                        <p className="text-sm font-bold text-emerald-800">Order successfully sent to kitchen!</p>
                        <p className="text-xs font-semibold text-emerald-600/80 mt-1 uppercase tracking-wider">Ref ID: {orderId.slice(0, 8).toUpperCase()}</p>
                     </div>
                  </div>
                ) : (
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      className="btn-outline flex-1 py-4 flex items-center justify-center gap-2 rounded-xl text-sm"
                      onClick={() => {
                        const lines: string[] = [];
                        lines.push(`🍽️ *${restaurant.name}*`);
                        if (tableCode) lines.push(`🏷️ Table: ${tableCode}`);
                        lines.push("");
                        cart.forEach((row) => {
                          lines.push(`• ${row.qty} × ${row.name} - ${formatPrice(row.price * row.qty)}`);
                          if (row.note) lines.push(`  ↳ 📝 ${row.note}`);
                        });
                        lines.push("");
                        lines.push(`Total Due: *${formatPrice(grandTotal)}*`);
                        const text = encodeURIComponent(lines.join("\n"));
                        window.open(`https://wa.me/?text=${text}`, "_blank");
                      }}
                    >
                      <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      Order via WhatsApp
                    </button>
                    <button
                      type="button"
                      className="btn-primary flex-[1.5] py-4 shadow-primary/30 rounded-xl text-sm"
                      style={{ backgroundColor: restaurant.theme_color ?? undefined }}
                      disabled={isSubmitting}
                      onClick={async () => {
                        if (!tableCode.trim()) {
                          alert("Please enter your Table Number before ordering.");
                          return;
                        }
                        setIsSubmitting(true);
                        const payload = { restaurant_id: restaurant.id, table_code: tableCode || null, session_id: sessionId || null, subtotal: cartTotal, service_charge: serviceCharge, tax, total: grandTotal, items: cart.map((row) => ({ menu_item_id: row.itemId, name: row.name, price: row.price, qty: row.qty, note: row.note || null })) };
                        const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
                        const data = (await res.json()) as { order_id?: string; error?: string };
                        if (!res.ok || !data.order_id) { 
                          toast.error(data.error || "Failed to send order. Please try again.");
                          if (data.error?.includes("invalid or unavailable")) {
                            clearCart();
                            toast.error("Menu has been updated! Your cart was restarted.", { duration: 5000 });
                          }
                          setIsSubmitting(false); 
                          return; 
                        }
                        setOrderId(data.order_id);
                        clearCart();
                        setIsSubmitting(false);
                      }}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white/80" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Processing...
                        </span>
                      ) : "Submit to Kitchen"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

