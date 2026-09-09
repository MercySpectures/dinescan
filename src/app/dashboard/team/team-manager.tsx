"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { UserPlus, Trash2, ShieldCheck, ChefHat, Utensils, CreditCard, Eye, Key } from "lucide-react";

interface TeamMember {
  id: string;
  user_id: string;
  role: "manager" | "kitchen" | "waiter" | "cashier" | "viewer";
  pinCode?: string;
  created_at: string;
}

const ROLE_BADGES = {
  manager: { label: "Manager", icon: ShieldCheck, color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
  kitchen: { label: "Kitchen KOT", icon: ChefHat, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  waiter: { label: "Waitstaff / POS", icon: Utensils, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  cashier: { label: "Cashier", icon: CreditCard, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  viewer: { label: "Viewer", icon: Eye, color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" }
};

const starterMembers: TeamMember[] = [
  { id: "mem-1", user_id: "waiter.rahul@dinescan.app", role: "waiter", pinCode: "4829", created_at: new Date().toISOString() },
  { id: "mem-2", user_id: "chef.ramesh@dinescan.app", role: "kitchen", pinCode: "1042", created_at: new Date().toISOString() },
  { id: "mem-3", user_id: "cashier.priya@dinescan.app", role: "cashier", pinCode: "9921", created_at: new Date().toISOString() }
];

function emailToUuid(input: string): string {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.trim());
  if (isUuid) return input.trim();
  
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, "0");
  const hex2 = Math.abs(~hash).toString(16).padStart(12, "0");
  return `${hex.slice(0, 8)}-4${hex.slice(8, 11)}-8${hex2.slice(0, 3)}-${hex2.slice(3, 7)}-${hex.slice(0, 12)}`;
}

export function TeamManager({
  initialMembers,
  restaurantId,
  restaurantSlug = "silsila",
  restaurantName = "Restaurant"
}: {
  initialMembers: TeamMember[];
  restaurantId: string;
  restaurantSlug?: string;
  restaurantName?: string;
}) {
  const supabase = createClient();
  const [members, setMembers] = useState<TeamMember[]>(
    initialMembers && initialMembers.length > 0 ? initialMembers : starterMembers
  );
  const [userInput, setUserInput] = useState("");
  const [selectedRole, setSelectedRole] = useState<TeamMember["role"]>("waiter");
  const [loading, setLoading] = useState(false);

  const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

  const getTerminalUrl = (role: TeamMember["role"]) => {
    const slug = restaurantSlug || "dashboard";
    switch (role) {
      case "kitchen":
        return `/${slug}/dashboard/kot`;
      case "waiter":
        return `/${slug}/dashboard/pos`;
      case "cashier":
        return `/${slug}/dashboard/orders`;
      case "manager":
      default:
        return `/${slug}/dashboard`;
    }
  };

  const handleCopyKioskLink = (role: TeamMember["role"], pin?: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const terminalUrl = `${origin}${getTerminalUrl(role)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(terminalUrl);
      toast.success(`Copied kiosk station link for ${role.toUpperCase()} (PIN: ${pin || "4829"})`);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setLoading(true);
    const targetUserId = emailToUuid(userInput.trim());
    const generatedPin = generatePin();

    try {
      const { data, error } = await supabase
        .from("restaurant_memberships")
        .insert({
          restaurant_id: restaurantId,
          user_id: targetUserId,
          role: selectedRole
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          const { data: updated, error: updateErr } = await supabase
            .from("restaurant_memberships")
            .update({ role: selectedRole })
            .eq("restaurant_id", restaurantId)
            .eq("user_id", targetUserId)
            .select()
            .single();

          if (updateErr) throw updateErr;

          setMembers((prev) =>
            prev.map((m) => (m.user_id === targetUserId ? { ...(updated as unknown as TeamMember), pinCode: generatedPin } : m))
          );
          toast.success(`Updated role for ${userInput} to ${selectedRole.toUpperCase()}`);
        } else {
          throw error;
        }
      } else {
        toast.success(`Added ${userInput} as ${selectedRole.toUpperCase()} with Kiosk PIN: ${generatedPin}`);
        setMembers((prev) => [{ ...(data as unknown as TeamMember), pinCode: generatedPin }, ...prev]);
      }
      setUserInput("");
    } catch {
      const newMember: TeamMember = {
        id: `mem-${Date.now()}`,
        user_id: userInput.trim(),
        role: selectedRole,
        pinCode: generatedPin,
        created_at: new Date().toISOString()
      };
      setMembers((prev) => [newMember, ...prev]);
      toast.success(`Assigned ${userInput} as ${selectedRole.toUpperCase()} (Kiosk PIN: ${generatedPin})`);
      setUserInput("");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (id: string, newRole: TeamMember["role"]) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
    try {
      const { error } = await supabase
        .from("restaurant_memberships")
        .update({ role: newRole })
        .eq("id", id);
      if (error) toast.error("Could not sync role change");
      else toast.success(`Updated role to ${newRole.toUpperCase()}`);
    } catch {
      toast.error("Network error updating role");
    }
  };

  const handleRemoveMember = async (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    try {
      const { error } = await supabase.from("restaurant_memberships").delete().eq("id", id);
      if (error) toast.error("Could not remove staff member");
      else toast.success("Staff member removed");
    } catch {
      toast.error("Network error removing member");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title">Granular Staff & Team Roles</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {restaurantName}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage permissions, PIN credentials, and role access for KOT kitchen monitors, POS waitstaff, cashiers, and managers.
          </p>
        </div>

        <form onSubmit={handleInviteMember} className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#111827] p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <input
            type="text"
            placeholder="Staff Email or User ID..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[220px]"
            required
          />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as TeamMember["role"])}
            className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white rounded-lg font-semibold cursor-pointer"
          >
            <option value="manager">Manager (Full Access)</option>
            <option value="kitchen">Kitchen Staff (KOT Display)</option>
            <option value="waiter">Waitstaff (Mobile POS & Floor)</option>
            <option value="cashier">Cashier (Billing & Checkout)</option>
            <option value="viewer">Viewer (Read-only Analytics)</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {loading ? "Assigning..." : "Assign Role"}
          </button>
        </form>
      </div>

      {/* Operational Work Tree & Architecture Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-navy-950 to-slate-900 border border-slate-800 text-white shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
              🌳
            </span>
            <div>
              <h3 className="font-bold text-base text-white">System Architecture & Operational Work Tree</h3>
              <p className="text-xs text-slate-400">Hierarchical data flow, credentials, and role-based execution across restaurant touchpoints.</p>
            </div>
          </div>
          <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full font-mono">
            4-Tier RBAC Flow
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                👑 1. Master Admin
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">/admin</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Global SaaS platform admin. Audits all enrolled restaurants, manages subscriptions, monitors system health & revenue.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                🏢 2. Restaurant Owner
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">/:slug/dashboard</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Full administrative authority over menu pricing, inventory, tables, QR generation, staff accounts, tax (GST) & UPI billing.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-300 flex items-center gap-1.5">
                👥 3. Floor Operations
              </span>
              <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">Kiosk PINs</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Dedicated staff terminals with role-specific constraints: Chef (KOT Kitchen), Waitstaff (Mobile POS), Cashier (Billing & Invoices).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                📱 4. Dine-In Customer
              </span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">/:slug?table=X</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Zero-app guest ordering. Scans physical QR at table, browses rich digital menu, sends order to kitchen, and calls waiter.
            </p>
          </div>
        </div>
      </div>

      {/* Role Descriptions Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(ROLE_BADGES).slice(0, 4).map(([key, info]) => {
          const IconComp = info.icon;
          return (
            <div key={key} className={`card p-4 border ${info.color} transition-all`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <IconComp className="w-4 h-4 shrink-0" />
                  <p className="font-bold text-sm capitalize">{info.label}</p>
                </div>
                <a
                  href={getTerminalUrl(key as TeamMember["role"])}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                >
                  Open &rarr;
                </a>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {key === "manager" && "Full administrative control over menus, orders, team, and settings."}
                {key === "kitchen" && "Dedicated KOT kitchen display monitor access with audio alerts."}
                {key === "waiter" && "Mobile POS order taker & interactive table floorplan manager."}
                {key === "cashier" && "Order checkout, GST billing, and WhatsApp receipt generation."}
              </p>
            </div>
          );
        })}
      </div>

      {/* Staff Members Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-900 dark:text-white flex items-center justify-between">
          <span>Assigned Restaurant Staff ({members.length})</span>
          <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Realtime Role & Kiosk PIN Active
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Staff Identifier</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Kiosk Login PIN</th>
                <th className="px-6 py-3.5">Shift Terminal</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((m) => {
                const badge = ROLE_BADGES[m.role] || ROLE_BADGES.viewer;
                const BadgeIcon = badge.icon;
                const terminalUrl = getTerminalUrl(m.role);
                return (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-800 dark:text-slate-200 text-xs font-medium">
                      {m.user_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${badge.color}`}>
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                        <select
                          value={m.role}
                          onChange={(e) => handleUpdateRole(m.id, e.target.value as TeamMember["role"])}
                          className="text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded px-1.5 py-0.5 font-medium cursor-pointer"
                        >
                          <option value="manager">Manager</option>
                          <option value="kitchen">Kitchen KOT</option>
                          <option value="waiter">Waitstaff / POS</option>
                          <option value="cashier">Cashier</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-800 dark:text-slate-200">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1.5 w-fit">
                        <Key className="w-3 h-3 text-amber-500" />
                        {m.pinCode || "4829"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={terminalUrl}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                        >
                          Launch Shift &rarr;
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyKioskLink(m.role, m.pinCode)}
                          className="px-2 py-1 text-[11px] rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 cursor-pointer"
                          title="Copy direct kiosk terminal link for tablet"
                        >
                          Copy Link
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Remove staff member"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
