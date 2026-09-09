"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

interface LoginFormState {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [demoLoading, setDemoLoading] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user;
      if (currentUser) {
        if (currentUser.email === "admin@dinescan.app" || currentUser.user_metadata?.is_master_admin) {
          router.replace("/admin");
          return;
        }
        // Check if owner has created any restaurants yet (newest first)
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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword(form);
    if (error) {
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        toast.error("Supabase connection offline. Please configure NEXT_PUBLIC_SUPABASE_URL in .env.local.");
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    toast.success("Welcome back to DineScan!");
    setLoading(false);

    if (data.user?.email === "admin@dinescan.app" || data.user?.user_metadata?.is_master_admin) {
      router.replace("/admin");
    } else {
      // Check if user has any registered restaurants (newest first)
      const { data: userRests } = await supabase
        .from("restaurants")
        .select("id, slug")
        .eq("owner_id", data.user?.id)
        .order("created_at", { ascending: false });

      if (!userRests || userRests.length === 0) {
        localStorage.removeItem("dinescan_active_restaurant_id");
        router.replace("/onboarding?new=true");
      } else {
        localStorage.setItem("dinescan_active_restaurant_id", userRests[0].id);
        router.replace(`/${userRests[0].slug}/dashboard`);
      }
    }
  };

  // 1-Click Demo Owner Login
  const onDemoLogin = async () => {
    setDemoLoading(true);
    const demoEmail = "demo@dinescan.app";
    const demoPassword = "DemoPass123!";

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword
    });

    if (signInError) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword
      });

      if (signUpError) {
        toast.error(signUpError.message);
        setDemoLoading(false);
        return;
      }

      if (data.user) {
        const slug = `${slugify("demo-bistro")}-${Math.floor(1000 + Math.random() * 9000)}`;
        await supabase.from("restaurants").insert({
          owner_id: data.user.id,
          name: "Demo Bistro & Bar",
          slug,
          description: "Sample restaurant menu for instant testing",
          is_published: true,
          theme_color: "#22C55E",
          enable_gst: true,
          gst_rate: 5.0
        });
      }

      await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword
      });
    }

    toast.success("Logged in as Demo Restaurant Owner!");
    localStorage.removeItem("dinescan_active_restaurant_id");
    setDemoLoading(false);
    router.replace("/dashboard");
  };

  // 1-Click Master Admin Login
  const onAdminLogin = async () => {
    setAdminLoading(true);
    const adminEmail = "admin@dinescan.app";
    const adminPassword = "AdminPass123!";

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            is_master_admin: true,
            role: "superadmin"
          }
        }
      });

      if (signUpError) {
        toast.error(signUpError.message);
        setAdminLoading(false);
        return;
      }

      await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
      });
    }

    toast.success("Logged in to Master Admin Portal!");
    localStorage.removeItem("dinescan_active_restaurant_id");
    setAdminLoading(false);
    router.replace("/admin");
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
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
          <p className="text-sm text-slate-400">Sign in to your restaurant command portal</p>
        </div>

        {/* Quick Credential Fillers */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setForm({ email: "demo@dinescan.app", password: "DemoPass123!" })}
            className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" /> Fill Demo User
          </button>
          <button
            type="button"
            onClick={() => setForm({ email: "admin@dinescan.app", password: "AdminPass123!" })}
            className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-400 rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Fill Master Admin
          </button>
        </div>

        {/* Login Form Card */}
        <form
          onSubmit={onSubmit}
          className="bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl space-y-5"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                Email Address
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
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-12 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="••••••••"
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
          </div>

          <button
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99] cursor-pointer"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In to Dashboard <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <span className="relative bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Instant 1-Click Login
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              className="py-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60 cursor-pointer"
              type="button"
              disabled={demoLoading || adminLoading}
              onClick={onDemoLogin}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              {demoLoading ? "Demo..." : "Demo Owner"}
            </button>

            <button
              className="py-3 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60 cursor-pointer"
              type="button"
              disabled={demoLoading || adminLoading}
              onClick={onAdminLogin}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              {adminLoading ? "Admin..." : "Master Admin"}
            </button>
          </div>

          <div className="pt-2 text-center text-xs text-slate-400">
            Don&apos;t have an account yet?{" "}
            <Link href="/auth/register" className="text-emerald-400 font-semibold hover:underline">
              Create Restaurant Free
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
