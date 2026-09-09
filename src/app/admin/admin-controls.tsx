"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Search,
  CheckCircle,
  ArrowUpRight,
  LogOut,
  Building2,
  Users,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Phone,
  MapPin
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

export interface AdminUser {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  banned_until?: string;
}

export interface AdminRestaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  phone?: string | null;
  address?: string | null;
  is_published: boolean;
  created_at: string;
}

export interface AdminSubscription {
  id: string;
  restaurant_id: string;
  user_id: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "trialing" | "past_due" | "canceled" | "suspended";
  amount: number;
  max_tables: number;
  max_menu_items: number;
}

export interface AdminOrder {
  id: string;
  restaurant_id: string;
  table_code: string;
  status: string;
  total: number;
  created_at: string;
}

interface AdminControlsProps {
  adminEmail: string;
  initialUsers: AdminUser[];
  initialRestaurants: AdminRestaurant[];
  initialSubscriptions: AdminSubscription[];
  initialOrders: AdminOrder[];
  totalScans: number;
  totalOrders: number;
}

export function AdminControls({
  adminEmail,
  initialUsers,
  initialRestaurants,
  initialSubscriptions,
  initialOrders,
  totalScans,
  totalOrders
}: AdminControlsProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [activeTab, setActiveTab] = useState<"restaurants" | "owners" | "diners" | "billing">("restaurants");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>(initialSubscriptions);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const getSubForRestaurant = (restaurantId: string) => {
    return subscriptions.find((s) => s.restaurant_id === restaurantId);
  };

  const handleAdminLogout = async () => {
    try {
      localStorage.removeItem("dinescan_active_restaurant_id");
      localStorage.removeItem("dinescan_waiter_calls");
      await supabase.auth.signOut();
      toast.success("Master Admin logged out successfully");
      router.replace("/auth/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  const handlePlanChange = async (
    restaurantId: string,
    userId: string,
    newPlan: "free" | "starter" | "pro" | "enterprise"
  ) => {
    setLoadingId(restaurantId);
    try {
      const planLimits = {
        free: { amount: 0, maxTables: 10, maxMenuItems: 30 },
        starter: { amount: 499, maxTables: 15, maxMenuItems: 60 },
        pro: { amount: 999, maxTables: 50, maxMenuItems: 200 },
        enterprise: { amount: 1999, maxTables: 200, maxMenuItems: 1000 }
      };

      const limit = planLimits[newPlan];

      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          userId,
          plan: newPlan,
          status: "active",
          amount: limit.amount,
          maxTables: limit.maxTables,
          maxMenuItems: limit.maxMenuItems
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update plan");

      toast.success(`Plan updated to ${newPlan.toUpperCase()} for restaurant`);

      // Update local state
      setSubscriptions((prev) => {
        const index = prev.findIndex((s) => s.restaurant_id === restaurantId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], plan: newPlan, status: "active", ...limit };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: data.subscription?.id || `sub-${Date.now()}`,
              restaurant_id: restaurantId,
              user_id: userId,
              plan: newPlan,
              status: "active",
              amount: limit.amount,
              max_tables: limit.maxTables,
              max_menu_items: limit.maxMenuItems
            }
          ];
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not change subscription plan";
      toast.error(msg);
    } finally {
      setLoadingId(null);
    }
  };

  const handleUserStatusToggle = async (userId: string, isCurrentlyBanned: boolean) => {
    setLoadingId(userId);
    const action = isCurrentlyBanned ? "unsuspend" : "suspend";
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      toast.success(action === "suspend" ? "User suspended" : "User unsuspended");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                banned_until: isCurrentlyBanned ? undefined : new Date(Date.now() + 876000 * 3600 * 1000).toISOString()
              }
            : u
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle user status";
      toast.error(msg);
    } finally {
      setLoadingId(null);
    }
  };

  const filteredRestaurants = initialRestaurants.filter((r) => {
    const owner = users.find((u) => u.id === r.owner_id);
    const sub = getSubForRestaurant(r.id);
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.phone ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.address ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (owner?.email ?? "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "live" && r.is_published) ||
      (statusFilter === "draft" && !r.is_published) ||
      (sub && sub.plan === statusFilter);

    return matchesSearch && matchesStatus;
  });

  // Calculate MRR (Monthly Recurring Revenue)
  const totalMRR = subscriptions.reduce((acc, s) => (s.status === "active" ? acc + Number(s.amount) : acc), 0);

  return (
    <div className="space-y-8">
      {/* Top Navigation Bar with Master Admin Identity & Prominent Logout */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B101D] -mx-6 -mt-8 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
              <Image src="/logo.jpg" alt="DineScan Logo" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                  DineScan Master Admin
                </h1>
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" /> Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Logged in as <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{adminEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
            >
              Owner Dashboard <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleAdminLogout}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
              title="Sign out of Master Admin account"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Three Distinct Identities Architecture Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/20">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> 1. Platform Admin
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Superadmin ({adminEmail})</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Supervises global platform, audit logs, MRR subscription tiers, and tenant accounts.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <Building2 className="w-4 h-4" /> 2. Restaurant Owners & Staff
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{initialRestaurants.length} Registered Properties</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Business users managing their specific restaurant, KOT displays, tables, and floor staff.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <Users className="w-4 h-4" /> 3. Diners & Platform Users
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{totalOrders} Orders Placed</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              End customers who visit tables, scan QR codes, place food orders, and pay without needing staff logins.
            </p>
          </div>
        </div>

        {/* Master Admin Revenue & Plan KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-950 text-white shadow-lg border border-emerald-500/30">
            <p className="text-xs font-semibold tracking-wide text-emerald-300 uppercase">Estimated MRR</p>
            <p className="mt-2 font-display text-3xl font-extrabold">{formatPrice(totalMRR)}</p>
            <p className="text-xs text-emerald-200/80 mt-1">
              Active subscriptions: {subscriptions.filter((s) => s.status === "active").length}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Registered Restaurants</p>
            <p className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">
              {initialRestaurants.length}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
              {initialRestaurants.filter((r) => r.is_published).length} Live Tenancies
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Owner & Staff Users</p>
            <p className="mt-2 font-display text-3xl font-bold text-indigo-600 dark:text-indigo-400">{users.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Business accounts</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total QR Scans</p>
            <p className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">{totalScans.toLocaleString()}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Customer menu visits</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Diner Orders Processed</p>
            <p className="mt-2 font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalOrders.toLocaleString()}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Direct kitchen tickets</p>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
          {[
            { id: "restaurants", label: "🏢 Registered Restaurants", count: initialRestaurants.length },
            { id: "owners", label: "👤 Business Owners & Staff", count: users.length },
            { id: "diners", label: "🍽️ Platform Diners (3rd Identity)", count: initialOrders.length },
            { id: "billing", label: "💳 SaaS Subscriptions & MRR", count: subscriptions.length }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${activeTab === tab.id ? "bg-slate-950 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* TAB 1: REGISTERED RESTAURANTS */}
        {activeTab === "restaurants" && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by restaurant name, slug, or owner email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filter:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="all">All Statuses & Plans</option>
                  <option value="live">Live Published Only</option>
                  <option value="draft">Draft Only</option>
                  <option value="free">Free Tier</option>
                  <option value="starter">Starter Tier (₹499)</option>
                  <option value="pro">Pro Tier (₹999)</option>
                  <option value="enterprise">Enterprise Tier (₹1,999)</option>
                </select>
              </div>
            </div>

            {/* Restaurants Table */}
            <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white">Registered Restaurants Directory</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    All restaurants provisioned on the DineScan platform
                  </p>
                </div>
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full">
                  Showing {filteredRestaurants.length} of {initialRestaurants.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#0B101D] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5">Restaurant Property</th>
                      <th className="px-6 py-3.5">Contact & Address</th>
                      <th className="px-6 py-3.5">Slug / URL</th>
                      <th className="px-6 py-3.5">Owner Account</th>
                      <th className="px-6 py-3.5">SaaS Plan</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredRestaurants.map((r) => {
                      const owner = users.find((u) => u.id === r.owner_id);
                      const sub = getSubForRestaurant(r.id);
                      const plan = sub?.plan || "free";

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                              {r.name || r.slug}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              ID: <span className="font-mono">{r.id.slice(0, 12)}...</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                              <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{r.phone || "+91 98765 43210"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{r.address || "124 Culinary Blvd, Metro"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              /menu/{r.slug}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {owner?.email || "demo@dinescan.app"}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Joined: {new Date(r.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={plan}
                              disabled={loadingId === r.id}
                              onChange={(e) =>
                                handlePlanChange(
                                  r.id,
                                  r.owner_id,
                                  e.target.value as "free" | "starter" | "pro" | "enterprise"
                                )
                              }
                              className="text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="free">FREE (₹0)</option>
                              <option value="starter">STARTER (₹499)</option>
                              <option value="pro">PRO (₹999)</option>
                              <option value="enterprise">ENTERPRISE (₹1,999)</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            {r.is_published ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Draft
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/menu/${r.slug}`}
                                target="_blank"
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 font-semibold"
                              >
                                Preview <ExternalLink className="w-3 h-3" />
                              </Link>
                              <Link
                                href={`/dashboard`}
                                onClick={() => {
                                  localStorage.setItem("dinescan_active_restaurant_id", r.id);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-colors"
                              >
                                Inspect
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUSINESS OWNERS & STAFF ACCOUNTS */}
        {activeTab === "owners" && (
          <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">Restaurant Business Accounts</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registered owners and staff operators running restaurant properties
                </p>
              </div>
              <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full">
                Total: {users.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#0B101D] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Owner / Staff Email</th>
                    <th className="px-6 py-3.5">Contact Phone</th>
                    <th className="px-6 py-3.5">User ID</th>
                    <th className="px-6 py-3.5">Restaurants Owned</th>
                    <th className="px-6 py-3.5">Account Status</th>
                    <th className="px-6 py-3.5 text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {users.map((u) => {
                    const ownedRestaurants = initialRestaurants.filter((r) => r.owner_id === u.id);
                    const isBanned = u.banned_until ? new Date(u.banned_until) > new Date() : false;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {u.email || "demo@dinescan.app"}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Registered: {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Active"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
                            <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{ownedRestaurants[0]?.phone || "+91 98765 43210"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">
                          {u.id.slice(0, 16)}...
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            {ownedRestaurants.length} {ownedRestaurants.length === 1 ? "Property" : "Properties"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isBanned ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                              <ShieldAlert className="w-3.5 h-3.5" /> Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            disabled={loadingId === u.id || u.email === adminEmail}
                            onClick={() => handleUserStatusToggle(u.id, isBanned)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isBanned
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {isBanned ? "Unsuspend Account" : "Suspend Access"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM DINERS & CONSUMERS (3RD IDENTITY) */}
        {activeTab === "diners" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-amber-900 dark:text-amber-200">
                  Diner Sessions & End-User Consumers
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Platform users who order food and pay at tables without requiring administrative logins.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                Audited DineScan Traffic
              </span>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#0B101D] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3.5">Order Ref ID</th>
                      <th className="px-6 py-3.5">Restaurant Venue</th>
                      <th className="px-6 py-3.5">Table #</th>
                      <th className="px-6 py-3.5">Diner Total</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Placed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {initialOrders.map((ord) => {
                      const rest = initialRestaurants.find((r) => r.id === ord.restaurant_id);
                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                            #{ord.id.slice(0, 10).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                            {rest?.name || "Restaurant"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                              Table {ord.table_code}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {formatPrice(ord.total)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 capitalize">
                              {ord.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-400">
                            {new Date(ord.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SAAS SUBSCRIPTIONS & BILLING */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { plan: "Free Tier", price: "₹0", desc: "Up to 10 tables, basic digital menu", count: subscriptions.filter((s) => s.plan === "free").length },
                { plan: "Starter", price: "₹499/mo", desc: "Up to 15 tables & POS ordering", count: subscriptions.filter((s) => s.plan === "starter").length },
                { plan: "Pro Business", price: "₹999/mo", desc: "Up to 50 tables, KOT & CRM", count: subscriptions.filter((s) => s.plan === "pro").length },
                { plan: "Enterprise", price: "₹1,999/mo", desc: "Unlimited tables & chains", count: subscriptions.filter((s) => s.plan === "enterprise").length }
              ].map((tier, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <p className="font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{tier.plan}</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{tier.price}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{tier.desc}</p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Subscribers:</span>
                    <span className="text-slate-900 dark:text-white font-bold">{tier.count}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Instant Tier Overrides</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                To upgrade or downgrade any restaurant property, select a plan from the dropdown in the Registered Restaurants tab.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
