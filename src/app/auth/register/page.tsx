"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { Utensils, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Globe } from "lucide-react";

interface RegisterFormState {
  restaurantName: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState<RegisterFormState>({
    restaurantName: "",
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;
      if (currentUser) {
        if (currentUser.email === "admin@dinescan.app" || currentUser.user_metadata?.is_master_admin) {
          router.replace("/admin");
          return;
        }
        const { data: userRests } = await supabase
          .from("restaurants")
          .select("id, slug")
          .eq("owner_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (!userRests || userRests.length === 0) {
          router.replace("/onboarding?new=true");
        } else {
          localStorage.setItem("dinescan_active_restaurant_id", userRests[0].id);
          router.replace(`/${userRests[0].slug}/dashboard`);
        }
      }
    };
    void checkSession();
  }, [router, supabase]);

  const liveSlug = useMemo(() => {
    if (!form.restaurantName.trim()) return "your-restaurant-name";
    return slugify(form.restaurantName);
  }, [form.restaurantName]);

  const passwordStrength = useMemo(() => {
    const p = form.password;
    if (!p) return { label: "", color: "" };
    if (p.length < 6) return { label: "Weak (Min 6 chars)", color: "text-rose-400" };
    if (p.length >= 10 && /[A-Z]/.test(p) && /[0-9]/.test(p)) return { label: "Strong & Secure", color: "text-emerald-400" };
    return { label: "Good", color: "text-amber-400" };
  }, [form.password]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    const cleanEmail = form.email.trim().toLowerCase();
    const cleanRestaurantName = form.restaurantName.trim();

    try {
      // 1. Primary: Server-side registration endpoint with auto-confirmation & starter menu seed
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: cleanRestaurantName,
          email: cleanEmail,
          password: form.password
        })
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Fallback to client browser signup if server registration endpoint unavailable
        console.warn("Server registration notice:", resData.error);
        
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: form.password
        });

        if (error) throw error;

        if (data.user) {
          const baseSlug = slugify(form.restaurantName || form.email.split("@")[0] || "restaurant");
          const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

          await supabase.from("restaurants").insert({
            owner_id: data.user.id,
            name: form.restaurantName.trim() || "My Restaurant",
            slug,
            description: "Freshly prepared dining menu",
            is_published: true,
            theme_color: "#22C55E"
          });
        }
      }

      // 2. Sign in to establish active session
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: form.password
      });

      if (signInErr) {
        toast.success("Registration successful! Please sign in with your password.");
        router.replace("/auth/login");
      } else {
        const destSlug = resData.restaurant?.slug || liveSlug || "silsila";
        if (resData.restaurant?.id) {
          localStorage.setItem("dinescan_active_restaurant_id", resData.restaurant.id);
        }
        toast.success("Welcome to DineScan! Your restaurant is live.");
        router.replace(`/${destSlug}/dashboard`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      if (msg.includes("Failed to fetch") || msg.includes("FetchError") || msg.includes("NetworkError")) {
        toast.error("Supabase connection offline. Please configure NEXT_PUBLIC_SUPABASE_URL in .env.local or sign in with Demo Account.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform border border-emerald-500/30">
              <Image src="/logo.jpg" alt="DineScan Logo" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <span className="font-display text-3xl font-bold tracking-tight text-white">
              DineScan
            </span>
          </Link>
          <p className="text-sm text-slate-400">Launch your digital menu & POS in 60 seconds</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Restaurant / Cafe Name
            </label>
            <div className="relative">
              <Utensils className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Royal Biryani Cafe"
                type="text"
                value={form.restaurantName}
                onChange={(e) => setForm((prev) => ({ ...prev, restaurantName: e.target.value }))}
                required
              />
            </div>
            {/* Live Slug Preview */}
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
              <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">dinescan.app/menu/<strong className="text-emerald-400 font-bold">{liveSlug}</strong></span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
              Owner Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="owner@restaurant.com"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
              {passwordStrength.label && (
                <span className={`text-[10px] font-bold ${passwordStrength.color}`}>
                  {passwordStrength.label}
                </span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-12 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Minimum 6 characters"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword((prev) => !prev);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-emerald-400 transition-colors z-20 cursor-pointer focus:outline-none"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] cursor-pointer"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Restaurant Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="pt-1 text-center text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90 font-medium">
              <Sparkles className="w-3 h-3" /> Auto-seeds default menu & QR table setup
            </span>
          </div>

          <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800/80">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-emerald-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
