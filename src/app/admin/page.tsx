import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface AdminPageProps {
  searchParams?: { page?: string };
}

function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const adminEmails = parseAdminEmails();
  const isDev = process.env.NODE_ENV !== "production";
  const isAdmin = isDev ? true : adminEmails.includes((user.email ?? "").toLowerCase());
  if (!isAdmin) redirect("/dashboard");

  const page = Number(searchParams?.page ?? "1");
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const perPage = 10;

  const admin = createAdminClient();

  const [{ data: usersRes, error: usersError }, restaurantsCountRes, menuItemsCountRes, scansCountRes, ordersCountRes] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: safePage, perPage }),
      admin.from("restaurants").select("*", { count: "exact", head: true }),
      admin.from("menu_items").select("*", { count: "exact", head: true }),
      admin.from("scan_events").select("*", { count: "exact", head: true }),
      admin.from("orders").select("*", { count: "exact", head: true })
    ]);

  if (usersError || !usersRes) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-14">
        <h1 className="page-title">Admin Console Configuration Required</h1>
        <div className="card mt-6 p-6 sm:p-8 bg-amber-50/50 border-amber-200">
          <div className="flex items-start gap-4">
            <svg className="w-8 h-8 text-amber-500 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Missing Service Role Key</h2>
              <p className="text-sm text-slate-600 mt-2">
                Admin access is currently disabled because the application requires the <code className="bg-white px-1.5 py-0.5 rounded shadow-sm text-pink-600">service_role</code> key to bypass Row Level Security (RLS) safely.
              </p>
              
              <div className="mt-6 space-y-4 text-sm text-slate-700">
                <p className="font-semibold">How to fix this in exactly 1 minute:</p>
                <ol className="list-decimal pl-5 space-y-2 marker:text-amber-500 font-medium">
                  <li>Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase Dashboard</a></li>
                  <li>Click on your active <strong>Project Settings</strong> (the gear icon on the bottom left).</li>
                  <li>Go to <strong>API</strong> in the settings menu.</li>
                  <li>Scroll down to <strong>Project API keys</strong>.</li>
                  <li>Find the key named <strong className="text-pink-600">service_role (secret)</strong> and click <strong>Copy</strong>.</li>
                  <li>Open your project&apos;s <code className="bg-white px-1 py-0.5 rounded shadow-sm">.env.local</code> file.</li>
                  <li>Replace the value of <code className="bg-white px-1 py-0.5 rounded shadow-sm">SUPABASE_SERVICE_ROLE_KEY</code> with your copied secret key.</li>
                  <li>Restart your Next.js development server (<code className="bg-white px-1 py-0.5 rounded shadow-sm">npm run dev</code>).</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const users = usersRes.users;
  const userIds = users.map((u) => u.id);

  const { data: restaurants } = await admin
    .from("restaurants")
    .select("id, owner_id, slug, is_published, created_at")
    .in("owner_id", userIds);

  const restaurantsByOwner = new Map<string, number>();
  const restaurantIds: string[] = [];
  (restaurants ?? []).forEach((r) => {
    restaurantsByOwner.set(r.owner_id, (restaurantsByOwner.get(r.owner_id) ?? 0) + 1);
    restaurantIds.push(r.id);
  });

  const { data: menuItems } = restaurantIds.length
    ? await admin.from("menu_items").select("id, restaurant_id").in("restaurant_id", restaurantIds)
    : { data: [] as Array<{ id: string; restaurant_id: string }> };

  const menuItemsByOwner = new Map<string, number>();
  const ownerByRestaurant = new Map<string, string>();
  (restaurants ?? []).forEach((r) => ownerByRestaurant.set(r.id, r.owner_id));
  (menuItems ?? []).forEach((row) => {
    const ownerId = ownerByRestaurant.get(row.restaurant_id);
    if (!ownerId) return;
    menuItemsByOwner.set(ownerId, (menuItemsByOwner.get(ownerId) ?? 0) + 1);
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="page-title">Admin</h1>
            <p className="mt-1 text-sm text-gray-500">User and platform health overview.</p>
          </div>
          <Link href="/dashboard" className="btn-outline">
            Back to dashboard
          </Link>
        </div>

        {isDev ? (
          <div className="card mt-6 border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Admin is open in development. In production, set `ADMIN_EMAILS` to restrict access.
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {[
            { label: "Users", value: String(usersRes.total ?? users.length) },
            { label: "Restaurants", value: String(restaurantsCountRes.count ?? 0) },
            { label: "Menu items", value: String(menuItemsCountRes.count ?? 0) },
            { label: "Scans", value: String(scansCountRes.count ?? 0) },
            { label: "Orders", value: String(ordersCountRes.count ?? 0) }
          ].map((card) => (
            <div key={card.label} className="card p-5">
              <p className="text-xs text-gray-400">{card.label}</p>
              <p className="mt-2 font-display text-3xl font-bold text-navy-900">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="card mt-8 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <p className="font-semibold">Users</p>
            <div className="flex gap-2">
              <Link
                className="btn-outline px-3 py-1.5 text-xs"
                href={`/admin?page=${Math.max(1, safePage - 1)}`}
              >
                Previous
              </Link>
              <Link className="btn-outline px-3 py-1.5 text-xs" href={`/admin?page=${safePage + 1}`}>
                Next
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Last sign-in</th>
                  <th className="px-6 py-3">Restaurants</th>
                  <th className="px-6 py-3">Menu items</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className="px-6 py-4 font-medium text-navy-900">{u.email ?? "(no email)"}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {u.created_at ? new Date(u.created_at).toLocaleString("en-IN") : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("en-IN") : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{restaurantsByOwner.get(u.id) ?? 0}</td>
                    <td className="px-6 py-4 text-gray-500">{menuItemsByOwner.get(u.id) ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        <div className="card mt-8 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <p className="font-semibold">Registered Restaurants</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Owner Email</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Total Items</th>
                  <th className="px-6 py-3 text-right">Preview</th>
                </tr>
              </thead>
              <tbody>
                {(restaurants ?? []).map((r) => {
                  const owner = users.find(u => u.id === r.owner_id);
                  const itemsCount = (menuItems ?? []).filter(item => item.restaurant_id === r.id).length;
                  return (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="px-6 py-4 font-medium text-navy-900">
                         {r.slug} 
                      </td>
                      <td className="px-6 py-4 text-gray-500">{owner?.email ?? "Unknown"}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {r.created_at ? new Date(r.created_at).toLocaleString("en-IN", { dateStyle: "short" }) : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={r.is_published ? "badge-veg" : "badge-nonveg"}>
                           {r.is_published ? "Live" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{itemsCount}</td>
                      <td className="px-6 py-4 text-right">
                         <a href={`/menu/${r.slug}`} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs font-semibold">View Live Data &rarr;</a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}

