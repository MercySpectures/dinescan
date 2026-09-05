"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, ShieldAlert, CheckCircle, ArrowUpRight } from "lucide-react";

interface AdminUser {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  banned_until?: string;
}

interface AdminRestaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  is_published: boolean;
  created_at: string;
}

interface AdminSubscription {
  id: string;
  restaurant_id: string;
  user_id: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "trialing" | "past_due" | "canceled" | "suspended";
  amount: number;
  max_tables: number;
  max_menu_items: number;
}

interface AdminControlsProps {
  initialUsers: AdminUser[];
  initialRestaurants: AdminRestaurant[];
  initialSubscriptions: AdminSubscription[];
  totalScans: number;
  totalOrders: number;
}

export function AdminControls({
  initialUsers,
  initialRestaurants,
  initialSubscriptions,
  totalScans,
  totalOrders
}: AdminControlsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState(initialUsers);
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const getSubForRestaurant = (restaurantId: string) => {
    return subscriptions.find((s) => s.restaurant_id === restaurantId);
  };

  const handlePlanChange = async (
    restaurantId: string,
    userId: string,
    newPlan: "free" | "starter" | "pro" | "enterprise"
  ) => {
    setLoadingId(restaurantId);
    try {
      const planLimits = {
        free: { amount: 0, maxTables: 5, maxMenuItems: 20 },
        starter: { amount: 999, maxTables: 15, maxMenuItems: 50 },
        pro: { amount: 2499, maxTables: 50, maxMenuItems: 200 },
        enterprise: { amount: 4999, maxTables: 200, maxMenuItems: 1000 }
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
              id: data.subscription.id,
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
      {/* Master Admin Revenue & Plan KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card p-5 bg-gradient-to-br from-emerald-900 to-navy-950 text-white shadow-lg border-emerald-800/30">
          <p className="text-xs font-semibold tracking-wide text-emerald-400 uppercase">Estimated MRR</p>
          <p className="mt-2 font-display text-3xl font-bold">₹{totalMRR.toLocaleString("en-IN")}</p>
          <p className="text-xs text-emerald-300/80 mt-1">Active subscriptions count: {subscriptions.filter((s) => s.status === "active").length}</p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Tenants / Users</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900">{users.length}</p>
          <p className="text-xs text-slate-500 mt-1">{initialRestaurants.length} Restaurants</p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase">Pro & Enterprise</p>
          <p className="mt-2 font-display text-3xl font-bold text-indigo-600">
            {subscriptions.filter((s) => s.plan === "pro" || s.plan === "enterprise").length}
          </p>
          <p className="text-xs text-slate-500 mt-1">High tier accounts</p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Platform Scans</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900">{totalScans.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">QR menu visits</p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Orders Processed</p>
          <p className="mt-2 font-display text-3xl font-bold text-emerald-600">{totalOrders.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Direct kitchen tickets</p>
        </div>
      </div>

      {/* Control Bar: Search & Status Filter */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by restaurant name, slug, or owner email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Filter Tier:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Plans & Statuses</option>
            <option value="live">Live Restaurants Only</option>
            <option value="draft">Draft Restaurants Only</option>
            <option value="free">Free Tier</option>
            <option value="starter">Starter Tier</option>
            <option value="pro">Pro Tier</option>
            <option value="enterprise">Enterprise Tier</option>
          </select>
        </div>
      </div>

      {/* Restaurants & Subscription Management Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Tenant & Subscription Management</h2>
            <p className="text-xs text-slate-500">Control subscription tiers, limits, and user account status</p>
          </div>
          <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
            Showing {filteredRestaurants.length} of {initialRestaurants.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Restaurant</th>
                <th className="px-6 py-3.5">Owner Email</th>
                <th className="px-6 py-3.5">Current Plan</th>
                <th className="px-6 py-3.5">Limits (Tables/Items)</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">User Access</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRestaurants.map((r) => {
                const owner = users.find((u) => u.id === r.owner_id);
                const sub = getSubForRestaurant(r.id);
                const isBanned = owner?.banned_until ? new Date(owner.banned_until) > new Date() : false;
                const plan = sub?.plan || "free";

                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{r.name || r.slug}</div>
                      <div className="text-xs text-slate-400 font-mono">/{r.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">{owner?.email || "No Email"}</div>
                      <div className="text-xs text-slate-400">
                        Signed up: {r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"}
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
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                          plan === "enterprise"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : plan === "pro"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : plan === "starter"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <option value="free">FREE (₹0)</option>
                        <option value="starter">STARTER (₹999/mo)</option>
                        <option value="pro">PRO (₹2,499/mo)</option>
                        <option value="enterprise">ENTERPRISE (₹4,999/mo)</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      <div>{sub?.max_tables || 10} Tables</div>
                      <div className="text-slate-400">{sub?.max_menu_items || 50} Items</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          r.is_published
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${r.is_published ? "bg-emerald-500" : "bg-amber-500"}`}
                        />
                        {r.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isBanned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <ShieldAlert className="w-3 h-3" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleUserStatusToggle(r.owner_id, isBanned)}
                        disabled={loadingId === r.owner_id}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isBanned
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                        }`}
                      >
                        {isBanned ? "Unsuspend" : "Suspend User"}
                      </button>
                      <a
                        href={`/menu/${r.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Preview <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
              {filteredRestaurants.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No restaurants or owners match your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
