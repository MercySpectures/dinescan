import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMasterAdminUser } from "@/lib/auth/roles";
import { AdminControls } from "./admin-controls";

interface AdminPageProps {
  searchParams?: { page?: string };
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const isAdmin = isMasterAdminUser(user.email, user.app_metadata);
  if (!isAdmin) redirect("/dashboard");

  const page = Number(searchParams?.page ?? "1");
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const perPage = 100; // Multi-tenant batch size for 1000+ scaling

  const admin = createAdminClient();

  const [
    { data: usersRes, error: usersError },
    { data: restaurants },
    { data: subscriptions },
    scansCountRes,
    ordersCountRes
  ] = await Promise.all([
    admin.auth.admin.listUsers({ page: safePage, perPage }),
    admin.from("restaurants").select("id, owner_id, name, slug, is_published, created_at").order("created_at", { ascending: false }),
    admin.from("subscriptions").select("id, restaurant_id, user_id, plan, status, amount, max_tables, max_menu_items"),
    admin.from("scan_events").select("*", { count: "exact", head: true }),
    admin.from("orders").select("*", { count: "exact", head: true })
  ]);

  if (usersError || !usersRes) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-14">
        <h1 className="page-title">Admin Console Configuration Required</h1>
        <div className="card mt-6 p-6 sm:p-8 bg-amber-50/50 border-amber-200">
          <div className="flex items-start gap-4">
            <svg className="w-8 h-8 text-amber-500 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Missing Service Role Key</h2>
              <p className="text-sm text-slate-600 mt-2">
                Master Admin functions require <code className="bg-white px-1.5 py-0.5 rounded shadow-sm text-pink-600">SUPABASE_SERVICE_ROLE_KEY</code> in <code className="bg-white px-1.5 py-0.5 rounded shadow-sm">.env.local</code> to securely manage subscriptions and user permissions across tenants.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const users = usersRes.users.map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    banned_until: u.banned_until
  }));

  const initialRestaurants = (restaurants || []).map((r) => ({
    id: r.id,
    owner_id: r.owner_id,
    name: r.name,
    slug: r.slug,
    is_published: r.is_published,
    created_at: r.created_at
  }));

  const initialSubscriptions = (subscriptions || []).map((s) => ({
    id: s.id,
    restaurant_id: s.restaurant_id,
    user_id: s.user_id,
    plan: s.plan as "free" | "starter" | "pro" | "enterprise",
    status: s.status as "active" | "trialing" | "past_due" | "canceled" | "suspended",
    amount: Number(s.amount),
    max_tables: s.max_tables,
    max_menu_items: s.max_menu_items
  }));

  return (
    <main className="min-h-screen bg-slate-50/50 pb-16">
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-display text-slate-900">Master Admin Portal</h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
                Super Admin Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Global multi-tenant control, subscriptions, MRR, and platform safety.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-outline text-xs">
              Back to Owner Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-8">
        <AdminControls
          initialUsers={users}
          initialRestaurants={initialRestaurants}
          initialSubscriptions={initialSubscriptions}
          totalScans={scansCountRes.count ?? 0}
          totalOrders={ordersCountRes.count ?? 0}
        />
      </div>
    </main>
  );
}
