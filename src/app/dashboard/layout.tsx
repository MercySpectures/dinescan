"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LayoutDashboard, MenuSquare, QrCode, Settings, LogOut, Menu, X, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/menu", label: "Menu", icon: MenuSquare },
  { href: "/dashboard/orders", label: "Orders", icon: Receipt },
  { href: "/dashboard/qr", label: "QR", icon: QrCode },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [restaurantName, setRestaurantName] = useState<string>("Your Menu");
  const [restaurantSlug, setRestaurantSlug] = useState<string>("demo");
  const [restaurantAddress, setRestaurantAddress] = useState<string>("");
  const [restaurantPhone, setRestaurantPhone] = useState<string>("");

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("restaurants")
        .select("name, slug, address, phone")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!data) return;
      setRestaurantName(data.name);
      setRestaurantSlug(data.slug);
      setRestaurantAddress(data.address ?? "");
      setRestaurantPhone(data.phone ?? "");
    };
    void loadRestaurant();
  }, [supabase, user]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden w-[280px] shrink-0 flex-col bg-navy-900 text-white md:flex md:sticky md:top-0 md:h-screen md:overflow-y-auto border-r border-white/5 relative z-10 transition-all">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(79,70,229,0.5)]">
              D
            </div>
            <p className="font-display text-2xl font-bold tracking-tight">DineScan</p>
          </Link>
          
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-primary-light/70 mb-1">Active Property</p>
            <p className="truncate font-semibold text-lg">{restaurantName}</p>
            <p className="mt-1 truncate text-xs text-slate-400">{restaurantAddress || "Add address in settings"}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 mt-6">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="relative block"
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-white/10 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <div className={cn(
                  "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
                  isActive ? "text-white font-medium" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                )}>
                  <Icon size={18} className={isActive ? "text-primary-light" : ""} />
                  {label}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/auth/login");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            <span className="truncate">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Navbar Mobile + Global Back button */}
        <header className="flex-none flex items-center justify-between p-4 md:px-8 md:py-6 border-b border-slate-200/50 bg-white/50 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <button type="button" className="hidden md:flex btn-ghost h-9 items-center px-3" onClick={() => router.back()}>
              <ArrowLeft size={16} className="mr-2" /> Back
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 bg-white shadow-sm border border-slate-100 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Operational
            </div>
            {user?.email && (
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                {user.email.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="max-w-[1200px] mx-auto pb-20"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-navy-900/40 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="h-full w-[280px] bg-navy-900 text-white flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/30">D</div>
                  <p className="font-display text-xl font-bold">DineScan</p>
                </Link>
                <button type="button" className="p-2 -mr-2 text-slate-400 hover:text-white" onClick={() => setIsMobileOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 space-y-1 p-4 overflow-y-auto mt-4">
                {links.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all",
                        isActive ? "bg-primary/20 text-white font-medium shadow-[inset_0_0_0_1px_rgba(79,70,229,0.3)]" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      )}
                    >
                      <Icon size={18} className={isActive ? "text-primary-light" : ""} />
                      {label}
                    </Link>
                  )
                })}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
