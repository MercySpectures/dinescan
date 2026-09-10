"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import {
  Utensils,
  Globe,
  Grid,
  CreditCard,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
  Building2,
  Phone,
  MapPin,
  QrCode,
  ExternalLink,
  Copy,
  LayoutDashboard,
  Upload,
  ImageIcon,
  X
} from "lucide-react";

interface OnboardingState {
  name: string;
  slug: string;
  description: string;
  phone: string;
  address: string;
  themeColor: string;
  logoUrl?: string;
  tableCount: number;
  enableGst: boolean;
  gstRate: number;
  acceptCash: boolean;
  acceptUpi: boolean;
  acceptOnline: boolean;
  upiId: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState<number>(1);
  const [restaurantId, setRestaurantId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const [form, setForm] = useState<OnboardingState>({
    name: "Silsila Restaurant",
    slug: "silsila-restaurant",
    description: "Authentic Multi-Cuisine Fine Dining & Artisanal Delights",
    phone: "+91 98765 43210",
    address: "124 Culinary Blvd, Metro",
    themeColor: "#10B981",
    logoUrl: "",
    tableCount: 12,
    enableGst: true,
    gstRate: 5,
    acceptCash: true,
    acceptUpi: true,
    acceptOnline: true,
    upiId: "silsila@upi"
  });

  useEffect(() => {
    const initOnboarding = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const user = session?.user ?? null;
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      // Check if user specifically requested to add a new restaurant (?new=true)
      const isNewRequest = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "true";

      if (isNewRequest) {
        // Reset to brand new restaurant mode
        setRestaurantId("");
        setForm({
          name: "",
          slug: "",
          description: "",
          phone: "",
          address: "",
          themeColor: "#10B981",
          tableCount: 12,
          enableGst: true,
          gstRate: 5,
          acceptCash: true,
          acceptUpi: true,
          acceptOnline: true,
          upiId: ""
        });
        setLoading(false);
        return;
      }

      // Check if user already has an active restaurant
      const activeId = localStorage.getItem("dinescan_active_restaurant_id");
      let rest: {
        id: string;
        name?: string;
        slug?: string;
        description?: string | null;
        phone?: string | null;
        address?: string | null;
        theme_color?: string | null;
        table_count?: number | null;
        enable_gst?: boolean | null;
        gst_rate?: number | null;
      } | null = null;

      if (activeId) {
        const { data: pref } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", activeId)
          .maybeSingle();
        if (pref) rest = pref;
      }

      if (!rest) {
        const { data: userRests } = await supabase
          .from("restaurants")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (userRests && userRests.length > 0) rest = userRests[0];
      }

      if (rest) {
        setRestaurantId(rest.id);
        setForm((prev) => ({
          ...prev,
          name: rest.name || prev.name,
          slug: rest.slug || prev.slug,
          description: rest.description || prev.description,
          phone: rest.phone || prev.phone,
          address: rest.address || prev.address,
          themeColor: rest.theme_color || prev.themeColor,
          tableCount: rest.table_count || prev.tableCount,
          enableGst: rest.enable_gst ?? prev.enableGst,
          gstRate: rest.gst_rate ?? prev.gstRate
        }));
      }
      setLoading(false);
    };

    void initOnboarding();
  }, [router, supabase]);

  const liveSlug = useMemo(() => {
    return slugify(form.name || form.slug || "my-restaurant");
  }, [form.name, form.slug]);

  const saveCurrentProgress = async (nextStep?: number) => {
    setIsSubmitting(true);
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        toast.error("Session expired. Please sign in again.");
        router.push("/auth/login");
        return;
      }

      let currentId = restaurantId;

      if (currentId) {
        // Update existing restaurant record
        await supabase
          .from("restaurants")
          .update({
            name: form.name,
            slug: liveSlug,
            description: form.description || null,
            phone: form.phone || null,
            address: form.address || null,
            logo_url: form.logoUrl || logoPreview || null,
            theme_color: form.themeColor,
            is_published: true
          })
          .eq("id", currentId);
        localStorage.setItem("dinescan_active_restaurant_id", currentId);
      } else {
        // Create new restaurant record
        const { data: newRest, error: createErr } = await supabase
          .from("restaurants")
          .insert({
            owner_id: user.id,
            name: form.name || "My Restaurant",
            slug: `${liveSlug}-${Math.floor(1000 + Math.random() * 9000)}`,
            description: form.description || "Freshly prepared dining menu",
            phone: form.phone || null,
            address: form.address || null,
            logo_url: form.logoUrl || logoPreview || null,
            theme_color: form.themeColor,
            is_published: true
          })
          .select()
          .single();

        if (createErr) throw createErr;
        if (newRest) {
          currentId = newRest.id;
          setRestaurantId(newRest.id);
          localStorage.setItem("dinescan_active_restaurant_id", newRest.id);

          // 1. Seed default tables
          try {
            const tableInserts = Array.from({ length: form.tableCount }, (_, i) => ({
              restaurant_id: newRest.id,
              table_number: String(i + 1),
              capacity: 4,
              status: "vacant" as const
            }));
            await supabase.from("tables").insert(tableInserts);
          } catch {
            // tables table optional
          }

          // 2. Seed starter categories
          const { data: categories } = await supabase
            .from("categories")
            .insert([
              { restaurant_id: newRest.id, name: "Starters & Appetizers", sort_order: 1 },
              { restaurant_id: newRest.id, name: "Main Course", sort_order: 2 },
              { restaurant_id: newRest.id, name: "Beverages & Drinks", sort_order: 3 },
              { restaurant_id: newRest.id, name: "Desserts & Sweets", sort_order: 4 }
            ])
            .select();

          // 3. Seed starter dishes with photos
          if (categories && categories.length > 0) {
            const cat0 = categories[0].id;
            const cat1 = categories[1]?.id || cat0;
            const cat2 = categories[2]?.id || cat1;
            const cat3 = categories[3]?.id || cat2;
            await supabase.from("menu_items").insert([
              {
                restaurant_id: newRest.id,
                category_id: cat0,
                name: "Crispy Paneer Tikka",
                description: "Marinated cottage cheese cubes grilled with bell peppers and authentic tandoor spices",
                price: 240,
                image_url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=60",
                is_veg: true,
                is_available: true,
                is_featured: true,
                sort_order: 1
              },
              {
                restaurant_id: newRest.id,
                category_id: categories[0].id,
                name: "Golden Crispy Corn",
                description: "Sweet corn kernels tossed with fresh chili pepper, garlic, and scallions",
                price: 180,
                image_url: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60",
                is_veg: true,
                is_available: true,
                sort_order: 2
              },
              {
                restaurant_id: newRest.id,
                category_id: categories[1].id,
                name: "Butter Chicken Royale",
                description: "Tender chicken cooked in rich velvety tomato cashew gravy infused with kasuri methi",
                price: 360,
                image_url: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&auto=format&fit=crop&q=60",
                is_veg: false,
                is_available: true,
                is_featured: true,
                sort_order: 1
              },
              {
                restaurant_id: newRest.id,
                category_id: categories[1].id,
                name: "Dal Makhani Deluxe",
                description: "Slow-cooked black lentils in butter, cream, and aromatic spices",
                price: 220,
                image_url: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60",
                is_veg: true,
                is_available: true,
                sort_order: 2
              },
              {
                restaurant_id: newRest.id,
                category_id: cat2,
                name: "Chilled Mango Lassi",
                description: "Sweet yogurt cooler made with fresh Alphonso mango pulp and cardamom",
                price: 110,
                image_url: "https://images.unsplash.com/photo-1553787499-6f9133860278?w=500&auto=format&fit=crop&q=60",
                is_veg: true,
                is_available: true,
                is_featured: true,
                sort_order: 1
              },
              {
                restaurant_id: newRest.id,
                category_id: cat3,
                name: "Hot Gulab Jamun with Rabri",
                description: "Warm fried dumplings soaked in rose saffron syrup served with thickened sweet milk",
                price: 140,
                image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60",
                is_veg: true,
                is_available: true,
                is_featured: true,
                sort_order: 1
              }
            ]);
          }
        }
      }

      if (nextStep) {
        setStep(nextStep);
      } else {
        toast.success("Onboarding complete! Welcome to DineScan.");
        router.push(`/${liveSlug || "silsila"}/dashboard`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save onboarding step";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyMenuLink = () => {
    const url = `${window.location.origin}/menu/${liveSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Public Menu Link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Loading DineScan Onboarding Setup...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform border border-emerald-500/30">
              <Image src="/logo.jpg" alt="DineScan Logo" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <span className="font-display text-3xl font-bold tracking-tight text-white">
              DineScan
            </span>
          </Link>
          <p className="text-sm text-slate-400">Set up your restaurant digital menu, QR tables & POS in 4 quick steps</p>
        </div>

        {/* 4-Step Visual Progress Stepper Bar */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-2xl p-4 shadow-xl">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { id: 1, label: "Identity", icon: Utensils },
              { id: 2, label: "QR Tables", icon: Grid },
              { id: 3, label: "Payments", icon: CreditCard },
              { id: 4, label: "Go Live", icon: Sparkles }
            ].map((s) => {
              const IconComp = s.icon;
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;

              return (
                <button
                  key={s.id}
                  onClick={() => s.id < step && setStep(s.id)}
                  disabled={s.id > step}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all ${
                    isCurrent
                      ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30"
                      : isCompleted
                      ? "text-slate-300 hover:text-white cursor-pointer"
                      : "text-slate-600 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold mb-1.5 transition-colors ${
                      isCurrent
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                        : isCompleted
                        ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-950 text-slate-500 border border-slate-800"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <IconComp className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] font-semibold tracking-tight">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Content for Step 1: Identity & Branding */}
        {step === 1 && (
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-400" />
                Step 1: Restaurant Identity & Brand Theme
              </h2>
              <p className="text-xs text-slate-400 mt-1">Configure your property name, public menu link, and brand color palette.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Restaurant / Cafe Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Silsila Fine Dining"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Public Menu URL Link Preview
                </label>
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-3 text-xs font-mono text-slate-300">
                  <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">dinescan.app/menu/<strong className="text-emerald-400 font-bold">{liveSlug}</strong></span>
                </div>
              </div>

              {/* Logo Upload Card with Live Preview */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block flex items-center justify-between">
                  <span>Restaurant Brand Logo</span>
                  <span className="text-[10px] text-slate-500 font-normal">PNG, JPG, WebP up to 5MB</span>
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 hover:border-emerald-500/50 transition-colors">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-md">
                    {logoPreview || form.logoUrl ? (
                      <>
                        <Image
                          src={logoPreview || form.logoUrl || ""}
                          alt="Restaurant Logo Preview"
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoPreview("");
                            setForm((prev) => ({ ...prev, logoUrl: "" }));
                          }}
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition-colors"
                          title="Remove logo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <ImageIcon className="w-6 h-6 text-slate-600 mx-auto" />
                        <span className="text-[9px] text-slate-500 font-bold mt-1 block">No Logo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2 w-full">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm transition-all">
                        <Upload className="w-3.5 h-3.5" /> Select Image File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("Image file size should be less than 5MB");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = () => {
                                const result = reader.result as string;
                                setLogoPreview(result);
                                setForm((prev) => ({ ...prev, logoUrl: result }));
                                toast.success("Logo uploaded!");
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <span className="text-xs text-slate-500">or paste URL below</span>
                    </div>

                    <input
                      type="url"
                      value={form.logoUrl || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => ({ ...prev, logoUrl: val }));
                        setLogoPreview(val);
                      }}
                      placeholder="https://example.com/your-restaurant-logo.png"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Property Description / Tagline
                </label>
                <textarea
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none min-h-20"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Authentic North Indian specialties, tandoori grills, and gourmet drinks."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Location / Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      value={form.address}
                      onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="124 Culinary Blvd, Metro"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => saveCurrentProgress(2)}
                disabled={isSubmitting}
                className="py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {isSubmitting ? "Saving Step 1..." : "Next: QR Tables & Capacity"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Card Content for Step 2: Tables & Capacity */}
        {step === 2 && (
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Grid className="w-5 h-5 text-emerald-400" />
                Step 2: Table Operations & Contactless QR
              </h2>
              <p className="text-xs text-slate-400 mt-1">Define your dining room tables count for instant QR code generation.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Total Dining Tables Count
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {[4, 8, 12, 16, 20, 30].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, tableCount: count }))}
                      className={`py-3 rounded-xl border text-sm font-extrabold transition-all cursor-pointer ${
                        form.tableCount === count
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/40"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {count} Tables
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <QrCode className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-sm text-white">Instant Table QR Standees</h4>
                      <p className="text-xs text-slate-400">Generates unique contactless ordering QR codes for Tables #1 through #{form.tableCount}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold text-xs rounded-full border border-emerald-500/20">
                    Auto-Configured
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Step 1
              </button>

              <button
                type="button"
                onClick={() => saveCurrentProgress(3)}
                disabled={isSubmitting}
                className="py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {isSubmitting ? "Saving Step 2..." : "Next: Payments & GST Tax"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Card Content for Step 3: Payments & Automatic Tax Setup */}
        {step === 3 && (
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Step 3: Payments & Automatic Tax Billing
              </h2>
              <p className="text-xs text-slate-400 mt-1">Configure accepted guest payment methods and GST rate breakdown.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Accepted Guest Payment Methods
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.acceptCash}
                      onChange={(e) => setForm((prev) => ({ ...prev, acceptCash: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded accent-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-200">Cash on Table</span>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.acceptUpi}
                      onChange={(e) => setForm((prev) => ({ ...prev, acceptUpi: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded accent-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-200">Direct UPI QR</span>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.acceptOnline}
                      onChange={(e) => setForm((prev) => ({ ...prev, acceptOnline: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded accent-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-200">Razorpay Online</span>
                  </label>
                </div>
              </div>

              {form.acceptUpi && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    UPI VPA / Handle
                  </label>
                  <input
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={form.upiId}
                    onChange={(e) => setForm((prev) => ({ ...prev, upiId: e.target.value }))}
                    placeholder="silsila@upi"
                  />
                </div>
              )}

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">Enable Automatic GST Calculation</h4>
                    <p className="text-xs text-slate-400">Calculates CGST + SGST tax breakdown on POS receipts & digital orders</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.enableGst}
                    onChange={(e) => setForm((prev) => ({ ...prev, enableGst: e.target.checked }))}
                    className="w-5 h-5 text-emerald-600 rounded cursor-pointer accent-emerald-500"
                  />
                </div>

                {form.enableGst && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">GST Rate Schedule</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      value={form.gstRate}
                      onChange={(e) => setForm((prev) => ({ ...prev, gstRate: Number(e.target.value) }))}
                    >
                      <option value={5}>5% Standard Restaurant GST (2.5% CGST + 2.5% SGST)</option>
                      <option value={12}>12% Standard Rate</option>
                      <option value={18}>18% Full Tax Rate</option>
                      <option value={0}>0% Tax Exempt</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Step 2
              </button>

              <button
                type="button"
                onClick={() => saveCurrentProgress(4)}
                disabled={isSubmitting}
                className="py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {isSubmitting ? "Saving Step 3..." : "Next: Go Live Preview"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Card Content for Step 4: Go Live Preview & Dashboard Launch */}
        {step === 4 && (
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4 text-center">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white font-display">
                🎉 Congratulations! Your Restaurant is Live
              </h2>
              <p className="text-xs text-slate-400 mt-1">Your digital menu and contactless table QR setup are fully operational.</p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 border border-emerald-500/30 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400">PUBLIC DIGITAL MENU LINK</span>
                  <p className="font-mono text-emerald-300 font-bold text-sm truncate">
                    dinescan.app/menu/{liveSlug}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyMenuLink}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? "Copied" : "Copy Link"}
                  </button>

                  <a
                    href={`/menu/${liveSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    View Menu <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-1">
                  <span className="text-2xl font-black text-emerald-400">{form.tableCount}</span>
                  <p className="text-xs font-bold text-slate-300">QR Tables Configured</p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-1">
                  <span className="text-2xl font-black text-indigo-400">{form.enableGst ? `${form.gstRate}%` : "Off"}</span>
                  <p className="text-xs font-bold text-slate-300">Automatic GST Tax</p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-1">
                  <span className="text-2xl font-black text-amber-400">6 Items</span>
                  <p className="text-xs font-bold text-slate-300">Starter Menu Seeded</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => saveCurrentProgress()}
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-base flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/25 cursor-pointer"
              >
                <LayoutDashboard className="w-5 h-5" /> Launch Restaurant Command Dashboard
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-2.5 text-xs text-slate-400 hover:text-white text-center cursor-pointer"
              >
                Back to Edit Onboarding Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
