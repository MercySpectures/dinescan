"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  LayoutDashboard,
  MenuSquare,
  QrCode,
  Settings,
  LogOut,
  Menu,
  X,
  Receipt,
  Flame,
  Smartphone,
  Grid,
  Users,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Building2,
  Bell,
  Check,
  ChevronDown,
  Sparkles,
  Plus,
  ChefHat,
  Key
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export interface WaiterCallNotification {
  id: string;
  table: string;
  service: string;
  timestamp: string;
  status: "pending" | "attended";
}

export interface RestaurantItem {
  id: string;
  name: string;
  slug: string;
  address: string | null;
}

type UserRole = "owner" | "manager" | "kitchen" | "waiter" | "cashier" | "viewer";

const allLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["owner", "manager", "waiter", "viewer"] },
  { href: "/dashboard/orders", label: "Live Orders", icon: Receipt, roles: ["owner", "manager", "kitchen", "waiter", "cashier", "viewer"] },
  { href: "/dashboard/kot", label: "KOT Kitchen", icon: Flame, roles: ["owner", "manager", "kitchen", "waiter"] },
  { href: "/dashboard/pos", label: "Mobile POS", icon: Smartphone, roles: ["owner", "manager", "waiter", "cashier"] },
  { href: "/dashboard/tables", label: "Table Operations", icon: Grid, roles: ["owner", "manager", "waiter", "cashier"] },
  { href: "/dashboard/menu", label: "Menu Catalog", icon: MenuSquare, roles: ["owner", "manager"] },
  { href: "/dashboard/customers", label: "Customer CRM", icon: Users, roles: ["owner", "manager"] },
  { href: "/dashboard/team", label: "Staff Roles", icon: Users, roles: ["owner", "manager"] },
  { href: "/dashboard/qr", label: "QR Generator", icon: QrCode, roles: ["owner", "manager"] },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["owner", "manager"] }
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  
  // Restaurant Switcher & Active Property State
  const [currentRestaurant, setCurrentRestaurant] = useState<RestaurantItem | null>(null);
  const [availableRestaurants, setAvailableRestaurants] = useState<RestaurantItem[]>([]);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState<boolean>(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>("owner");

  // Staff Kiosk PIN Mode State
  const [showStaffModal, setShowStaffModal] = useState<boolean>(false);
  const [activeStaffName, setActiveStaffName] = useState<string>("");
  const [enteredPin, setEnteredPin] = useState<string>("");

  const STAFF_PROFILES = [
    { name: "Rahul Sharma", role: "waiter" as UserRole, pin: "4829", title: "Waitstaff (POS & Floor)" },
    { name: "Chef Ramesh", role: "kitchen" as UserRole, pin: "1042", title: "Head Chef (Kitchen KOT)" },
    { name: "Priya Patel", role: "cashier" as UserRole, pin: "9921", title: "Cashier (Billing & Checkout)" },
    { name: "Anand Verma", role: "manager" as UserRole, pin: "5500", title: "Floor Manager (Operations)" }
  ];

  // Extract restaurant slug from URL pathname (e.g. /silsila/dashboard)
  const pathParts = pathname.split("/").filter(Boolean);
  const urlSlug = pathParts.length >= 2 && pathParts[1] === "dashboard" ? pathParts[0] : null;

  // Waiter Call Notification State
  const [notifications, setNotifications] = useState<WaiterCallNotification[]>([]);
  const [showNotificationMenu, setShowNotificationMenu] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("dinescan_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    const savedCollapsed = localStorage.getItem("dinescan_sidebar_collapsed");
    if (savedCollapsed === "true") {
      setIsCollapsed(true);
    }

    // Load existing waiter call notifications from localStorage
    const savedNotifications = localStorage.getItem("dinescan_waiter_calls");
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }
  }, []);

  const playAlertChime = () => {
    try {
      if (typeof window === "undefined") return;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const attendNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      localStorage.setItem("dinescan_waiter_calls", JSON.stringify(updated));
      return updated;
    });
    toast.success("Waiter call marked attended!");
  }, []);

  const triggerWaiterAlert = useCallback((table: string, service: string) => {
    const newNotif: WaiterCallNotification = {
      id: "call-" + Date.now(),
      table: table || "Table 04",
      service: service || "Waiter Assistance & Water",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "pending"
    };

    playAlertChime();

    setNotifications((prev) => {
      const updated = [newNotif, ...prev.filter((n) => n.id !== newNotif.id)];
      localStorage.setItem("dinescan_waiter_calls", JSON.stringify(updated));
      return updated;
    });

    toast.custom(
      (t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#070B14] text-white shadow-2xl rounded-2xl border border-rose-500/60 p-4 flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">🛎️ {newNotif.table} Called Waiter!</p>
              <p className="text-xs text-rose-300">{newNotif.service} • Just now</p>
            </div>
          </div>
          <button
            onClick={() => {
              attendNotification(newNotif.id);
              toast.dismiss(t.id);
            }}
            className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400 cursor-pointer"
          >
            Attend
          </button>
        </div>
      ),
      { duration: 8000 }
    );
  }, [attendNotification]);

  // Listen to Supabase Realtime waiter call broadcasts across devices
  useEffect(() => {
    if (!currentRestaurant?.id) return;
    const channel = supabase.channel(`restaurant-alerts-${currentRestaurant.id}`);
    channel
      .on("broadcast", { event: "waiter-call" }, (payload: { payload?: { table?: string; service?: string } }) => {
        const table = payload.payload?.table || "Table 04";
        const service = payload.payload?.service || "Waiter Assistance & Water";
        triggerWaiterAlert(table, service);
      })
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [currentRestaurant?.id, supabase, triggerWaiterAlert]);

  // Listen to window events (for single window testing)
  useEffect(() => {
    const handleLocalWaiterCall = (event: Event) => {
      const customEvent = event as CustomEvent<{ table: string; service: string }>;
      triggerWaiterAlert(customEvent.detail?.table || "Table 04", customEvent.detail?.service || "Waiter Assistance");
    };
    window.addEventListener("dinescan_waiter_call", handleLocalWaiterCall);
    return () => window.removeEventListener("dinescan_waiter_call", handleLocalWaiterCall);
  }, [triggerWaiterAlert]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const nextTheme = !prev;
      if (nextTheme) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("dinescan_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("dinescan_theme", "light");
      }
      return nextTheme;
    });
  };

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const nextState = !prev;
      localStorage.setItem("dinescan_sidebar_collapsed", String(nextState));
      return nextState;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem("dinescan_waiter_calls");
    toast.success("All waiter call notifications cleared.");
  };

  // Load Active Restaurant & Available Restaurant List
  useEffect(() => {
    const loadRestaurant = async () => {
      if (!user) return;
      const isMasterAdmin = user.email === "admin@dinescan.app";
      const preferredId = localStorage.getItem("dinescan_active_restaurant_id");

      let allRests: RestaurantItem[] = [];

      if (isMasterAdmin) {
        // Master Admin can see ALL restaurants in database
        const { data: adminRests } = await supabase
          .from("restaurants")
          .select("id, name, slug, address")
          .order("created_at", { ascending: false });
        allRests = (adminRests ?? []) as RestaurantItem[];
      } else {
        // Regular user sees their owned & membership restaurants
        const { data: userRests } = await supabase
          .from("restaurants")
          .select("id, name, slug, address")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        if (userRests && userRests.length > 0) {
          allRests = userRests as RestaurantItem[];
        } else {
          const { data: memberships } = await supabase
            .from("restaurant_memberships")
            .select("restaurant_id, restaurants(id, name, slug, address)")
            .eq("user_id", user.id);

          if (memberships && memberships.length > 0) {
            allRests = memberships.map(m => (m as unknown as { restaurants: RestaurantItem }).restaurants).filter(Boolean);
          } else {
            // Fallback to newest created restaurant
            const { data: newest } = await supabase
              .from("restaurants")
              .select("id, name, slug, address")
              .order("created_at", { ascending: false })
              .limit(10);
            allRests = (newest ?? []) as RestaurantItem[];
          }
        }
      }

      setAvailableRestaurants(allRests);

      // Determine active restaurant choice
      let selected: RestaurantItem | null = null;

      if (urlSlug) {
        selected = allRests.find((r) => r.slug === urlSlug) || null;
      }

      if (!selected && preferredId) {
        selected = allRests.find((r) => r.id === preferredId) || null;
      }

      if (!selected && allRests.length > 0) {
        selected = allRests[0]; // Newest created restaurant (e.g. Silsila)
      }

      if (selected) {
        setCurrentRestaurant(selected);
        localStorage.setItem("dinescan_active_restaurant_id", selected.id);
        localStorage.setItem("dinescan_active_restaurant_slug", selected.slug);
      } else {
        setCurrentRestaurant({
          id: "demo-restaurant-id",
          name: "Silsila Restaurant",
          slug: "silsila",
          address: "Indore"
        });
      }
    };

    void loadRestaurant();
  }, [supabase, user, urlSlug]);

  const switchActiveRestaurant = (rest: RestaurantItem) => {
    setCurrentRestaurant(rest);
    localStorage.setItem("dinescan_active_restaurant_id", rest.id);
    localStorage.setItem("dinescan_active_restaurant_slug", rest.slug);
    setShowPropertyDropdown(false);
    toast.success(`Switched active property to ${rest.name}`);
    router.push(`/${rest.slug}/dashboard`);
  };

  const currentSlug = currentRestaurant?.slug || urlSlug || "silsila";

  const links = useMemo(() => {
    return allLinks
      .filter((l) => l.roles.includes(userRole))
      .map((l) => ({
        ...l,
        targetHref: `/${currentSlug}${l.href}`,
        rawHref: l.href
      }));
  }, [currentSlug, userRole]);

  const handleStaffPinSubmit = (pinToVerify?: string) => {
    const pin = pinToVerify || enteredPin;
    const match = STAFF_PROFILES.find((s) => s.pin === pin.trim());
    if (match) {
      setUserRole(match.role);
      setActiveStaffName(match.name);
      setShowStaffModal(false);
      setEnteredPin("");
      toast.success(`Active Staff: ${match.name} (${match.title})`);
      if (match.role === "kitchen") {
        router.push(`/${currentSlug}/dashboard/kot`);
      } else if (match.role === "waiter" || match.role === "cashier") {
        router.push(`/${currentSlug}/dashboard/pos`);
      }
    } else {
      toast.error("Invalid Staff PIN. Try 1042 (Kitchen), 4829 (Waiter), or 9921 (Cashier)");
    }
  };

  const handleExitStaffMode = () => {
    setUserRole("owner");
    setActiveStaffName("");
    toast.success("Exited Staff Mode. Restored Owner permissions.");
  };

  const pendingCallsCount = notifications.filter((n) => n.status === "pending").length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col bg-[#070B14] text-white md:flex md:sticky md:top-0 md:h-screen md:overflow-y-auto border-r border-slate-800/80 relative z-10 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        <div className={cn("p-4 flex items-center transition-all", isCollapsed ? "flex-col justify-center gap-3" : "justify-between")}>
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-500/30">
              <Image src="/logo.jpg" alt="DineScan Logo" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            {!isCollapsed && <p className="font-display text-2xl font-bold tracking-tight text-white truncate">DineScan</p>}
          </Link>

          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Active Property Card with Interactive Switcher */}
        {!isCollapsed ? (
          <div className="mx-4 my-2 relative">
            <div
              onClick={() => setShowPropertyDropdown((prev) => !prev)}
              className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md relative overflow-hidden shadow-lg transition-all cursor-pointer hover:bg-white/15 group"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-400">
                    ACTIVE PROPERTY
                  </p>
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 text-slate-300 transition-transform duration-200", showPropertyDropdown && "rotate-180")} />
              </div>
              <p className="font-bold text-sm text-white leading-tight line-clamp-1">
                {currentRestaurant?.name || "Silsila Restaurant"}
              </p>
              <p className="text-xs font-medium text-slate-400 mt-0.5 line-clamp-1">
                {currentRestaurant?.address || "Active Restaurant"}
              </p>
            </div>

            {/* Property Switcher Dropdown */}
            <AnimatePresence>
              {showPropertyDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 space-y-1 max-h-60 overflow-y-auto"
                >
                  <p className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1">Your Restaurants</p>
                  {availableRestaurants.map((rest) => (
                    <button
                      key={rest.id}
                      onClick={() => switchActiveRestaurant(rest)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        currentRestaurant?.id === rest.id
                          ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span className="truncate">{rest.name}</span>
                      {currentRestaurant?.id === rest.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  ))}

                  <div className="pt-1 mt-1 border-t border-slate-800">
                    <Link
                      href="/onboarding?new=true"
                      onClick={() => setShowPropertyDropdown(false)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 text-emerald-400 hover:bg-emerald-500/10 font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add New Restaurant</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="mx-auto my-2 flex justify-center" title={`${currentRestaurant?.name} (${currentRestaurant?.address})`}>
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold text-emerald-400 border border-white/15 shadow-sm">
              {currentRestaurant?.name?.charAt(0) || "S"}
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 px-3 mt-3">
          {links.map(({ targetHref, rawHref, label, icon: Icon }) => {
            const isExact = targetHref === `/${currentSlug}/dashboard` && pathname === targetHref;
            const isActive = isExact || (targetHref !== `/${currentSlug}/dashboard` && pathname.startsWith(targetHref));
            return (
              <Link key={rawHref} href={targetHref} prefetch={true} className="relative block" title={isCollapsed ? label : undefined}>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-emerald-500/20 rounded-xl border border-emerald-500/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <div
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors",
                    isCollapsed ? "justify-center" : "",
                    isActive
                      ? "text-white font-bold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  )}
                >
                  <Icon size={19} className={isActive ? "text-emerald-400" : ""} />
                  {!isCollapsed && <span className="truncate">{label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 mt-auto border-t border-white/10 space-y-2">
          {user?.email === "admin@dinescan.app" && (
            <Link
              href="/admin"
              className={cn(
                "flex w-full items-center rounded-xl p-2.5 text-xs font-bold text-indigo-400 hover:bg-indigo-500/10 transition-colors border border-indigo-500/30",
                isCollapsed ? "justify-center" : "gap-2"
              )}
              title="Master Admin Portal"
            >
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              {!isCollapsed && <span className="truncate">Master Admin Portal</span>}
            </Link>
          )}

          <button
            type="button"
            onClick={async () => {
              // Clear all stale cached data before signout
              localStorage.removeItem("dinescan_active_restaurant_id");
              localStorage.removeItem("dinescan_waiter_calls");
              localStorage.removeItem("dinescan_active_order_id");
              localStorage.removeItem("dinescan_customer_name");
              localStorage.removeItem("dinescan_customer_phone");
              await signOut();
              router.replace("/auth/login");
            }}
            className={cn(
              "flex w-full items-center rounded-xl p-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer",
              isCollapsed ? "justify-center" : "gap-3"
            )}
            title={isCollapsed ? "Sign out" : undefined}
          >
            <LogOut size={19} />
            {!isCollapsed && <span className="truncate">Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Navbar */}
        <header className="flex-none flex items-center justify-between p-4 md:px-8 md:py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#0B0F19]/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <button
              type="button"
              className="hidden md:flex btn-ghost h-9 items-center px-3"
              onClick={() => router.back()}
            >
              <ArrowLeft size={16} className="mr-2" /> Back
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Waiter Call Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationMenu((prev) => !prev)}
                className={`p-2 rounded-xl transition-colors border relative ${
                  pendingCallsCount > 0
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/30 animate-pulse"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]"
                }`}
                title="Waiter Service Notifications"
              >
                <Bell size={18} />
                {pendingCallsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center">
                    {pendingCallsCount}
                  </span>
                )}
              </button>

              {/* Notification Menu Dropdown */}
              <AnimatePresence>
                {showNotificationMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-rose-500" />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Waiter Call Alerts</h4>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                          <Check className="w-6 h-6 text-emerald-500 mx-auto" />
                          <p className="font-semibold text-slate-600 dark:text-slate-300">No pending waiter calls</p>
                          <p className="text-[10px]">Table service requests will pop up here in real time.</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/60 flex items-center justify-between gap-3 transition-colors">
                            <div>
                              <span className="font-bold text-xs text-rose-500 dark:text-rose-400 block">
                                🔔 {n.table}
                              </span>
                              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                                {n.service}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{n.timestamp}</span>
                            </div>
                            <button
                              onClick={() => attendNotification(n.id)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs shrink-0 shadow-sm"
                            >
                              Attend
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Staff Kiosk PIN Mode Indicator or Launch Button */}
            {userRole !== "owner" ? (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold">
                <ChefHat className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[120px]">{activeStaffName || userRole.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={handleExitStaffMode}
                  className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded text-[10px] font-extrabold hover:bg-amber-400 cursor-pointer"
                  title="Exit Staff Mode and return to Owner privileges"
                >
                  Exit
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowStaffModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition-colors cursor-pointer"
                title="Switch to Staff Kiosk PIN Mode"
              >
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Staff Kiosk PIN</span>
              </button>
            )}

            {/* Header Theme Switcher Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] cursor-pointer"
              title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              System Operational
            </div>

            {user?.email && (
              <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
                {user.email.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Staff Kiosk PIN Modal */}
        <AnimatePresence>
          {showStaffModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowStaffModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">Staff Kiosk Terminal</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Enter 4-digit PIN to unlock your shift</p>
                    </div>
                  </div>
                  <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleStaffPinSubmit(); }} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Enter 4-Digit Staff PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={enteredPin}
                      onChange={(e) => setEnteredPin(e.target.value)}
                      className="w-full text-center text-2xl font-mono tracking-widest py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    Unlock Terminal Shift
                  </button>
                </form>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Shift Profiles:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STAFF_PROFILES.map((st) => (
                      <button
                        key={st.pin}
                        type="button"
                        onClick={() => handleStaffPinSubmit(st.pin)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-emerald-500 text-left transition-colors cursor-pointer"
                      >
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{st.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{st.title}</p>
                        <span className="text-[10px] font-mono text-emerald-500 font-bold mt-1 block">PIN: {st.pin}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Attention Alert Banner for Active Waiter Calls */}
        {notifications.filter((n) => n.status === "pending").length > 0 && (
          <div className="flex-none bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg z-20 animate-pulse">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold truncate">
              <Bell className="w-4 h-4 animate-bounce shrink-0" />
              <span>
                🔔 URGENT: {notifications.filter((n) => n.status === "pending")[0].table} called for assistance!
              </span>
              <span className="hidden sm:inline font-normal text-rose-100">
                ({notifications.filter((n) => n.status === "pending")[0].service})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => attendNotification(notifications.filter((n) => n.status === "pending")[0].id)}
                className="px-3 py-1 bg-white text-rose-700 font-bold text-xs rounded-lg shadow hover:bg-rose-50 cursor-pointer"
              >
                Mark Attended
              </button>
              <button
                type="button"
                onClick={() => clearAllNotifications()}
                className="text-xs text-rose-100 hover:text-white underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-[1200px] mx-auto pb-20">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="h-full w-[280px] bg-[#070B14] text-white flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                  <div className="h-8 w-8 rounded-lg overflow-hidden shadow-lg shadow-emerald-500/30 border border-emerald-500/30">
                    <Image src="/logo.jpg" alt="DineScan Logo" width={32} height={32} className="h-full w-full object-cover" />
                  </div>
                  <p className="font-display text-xl font-bold">DineScan</p>
                </Link>
                <button
                  type="button"
                  className="p-2 -mr-2 text-slate-400 hover:text-white"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 space-y-1 p-4 overflow-y-auto mt-4">
                {links.map(({ targetHref, rawHref, label, icon: Icon }) => {
                  const isMobileExact = targetHref === `/${currentSlug}/dashboard` && pathname === targetHref;
                  const isActive = isMobileExact || (targetHref !== `/${currentSlug}/dashboard` && pathname.startsWith(targetHref));
                  return (
                    <Link
                      key={rawHref}
                      href={targetHref}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all",
                        isActive
                          ? "bg-emerald-500/20 text-white font-bold border border-emerald-500/30"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      )}
                    >
                      <Icon size={18} className={isActive ? "text-emerald-400" : ""} />
                      {label}
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-white/10 mt-auto">
                <button
                  type="button"
                  onClick={async () => {
                    localStorage.removeItem("dinescan_active_restaurant_id");
                    localStorage.removeItem("dinescan_waiter_calls");
                    localStorage.removeItem("dinescan_active_order_id");
                    localStorage.removeItem("dinescan_customer_name");
                    localStorage.removeItem("dinescan_customer_phone");
                    setIsMobileOpen(false);
                    await signOut();
                    router.replace("/auth/login");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
