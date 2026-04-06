import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDashboardAnalytics } from "@/lib/data/dashboard";
import { resolveDateRange } from "@/lib/data/dashboard";
import TrendBars from "@/components/analytics/trend-bars";
import { getMenuUrl } from "@/lib/utils";

interface DashboardPageProps {
  searchParams?: {
    range?: string;
    page?: string;
    from?: string;
    to?: string;
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const range = searchParams?.range === "7" || searchParams?.range === "30" ? Number(searchParams.range) : 14;
  const fromDate = searchParams?.from;
  const toDate = searchParams?.to;
  const page = Number(searchParams?.page ?? "1");
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const pageSize = 6;

  const analytics = await getDashboardAnalytics({
    ownerId: user.id,
    rangeDays: range,
    from: fromDate,
    to: toDate,
    page: safePage,
    pageSize
  });
  if (!analytics) redirect("/auth/register");

  const restaurant = analytics.restaurant;
  const series = analytics.series;
  const recentScans = analytics.recentScans;
  const topItems = analytics.topItems;
  const mobileScans = recentScans.filter((row) => (row.user_agent ?? "").toLowerCase().includes("mobile")).length;
  const desktopScans = recentScans.length - mobileScans;
  const totalPages = Math.max(1, Math.ceil(analytics.totalRecentScans / pageSize));
  const resolvedRange = resolveDateRange({ rangeDays: range, from: fromDate, to: toDate });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">{restaurant.name}</p>
        </div>
        <Link className="btn-outline" href={`/menu/${restaurant.slug}`}>
          View Live Menu
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <form className="flex flex-wrap items-end gap-2" action="/dashboard" method="get">
            <div>
              <label className="mb-1 block text-xs text-gray-400">From</label>
              <input className="input py-2" type="date" name="from" defaultValue={fromDate ?? ""} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">To</label>
              <input className="input py-2" type="date" name="to" defaultValue={toDate ?? ""} />
            </div>
            <button className="btn-outline h-[42px]" type="submit">
              Apply custom range
            </button>
          </form>
          <Link
            className="btn-outline h-[42px]"
            href={`/api/analytics/scans.csv?range=${range}${fromDate ? `&from=${fromDate}` : ""}${
              toDate ? `&to=${toDate}` : ""
            }`}
          >
            Export scans CSV
          </Link>
          <p className="text-xs text-gray-400">Active range: {resolvedRange.label}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total scans", value: String(analytics.kpis.totalScans) },
          { label: "Menu items", value: String(analytics.kpis.menuItems) },
          { label: "Categories", value: String(analytics.kpis.categories) },
          { label: "Published", value: restaurant.is_published ? "Yes" : "No" }
        ].map((card) => (
          <article key={card.label} className="card p-6">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-navy-900">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold">Scan trend ({range} days)</p>
            <div className="flex gap-2">
              {[7, 14, 30].map((days) => (
                <Link
                  key={days}
                  href={`/dashboard?range=${days}&page=1`}
                  className={days === range ? "btn-primary px-3 py-1.5 text-xs" : "btn-outline px-3 py-1.5 text-xs"}
                >
                  {days}d
                </Link>
              ))}
            </div>
          </div>
          <TrendBars points={series} />
        </div>

        <div className="card p-6">
          <p className="font-semibold">Device mix (recent)</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Mobile</span>
              <span className="font-semibold">{mobileScans}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Desktop</span>
              <span className="font-semibold">{desktopScans}</span>
            </div>
            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400">Menu URL</p>
              <p className="mt-1 break-all text-xs text-gray-500">{getMenuUrl(restaurant.slug)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <p className="font-semibold">Top menu items</p>
          <div className="mt-4 space-y-3">
            {topItems.length === 0 ? (
              <p className="text-sm text-gray-500">Add menu items to start tracking engagement.</p>
            ) : (
              topItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.is_featured ? "Featured" : "Standard"}</p>
                  </div>
                  <span className={item.is_available ? "badge-veg" : "badge-nonveg"}>
                    {item.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Recent scan events</p>
            <p className="text-xs text-gray-400">
              Page {safePage} of {totalPages}
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {recentScans.length === 0 ? (
              <p className="text-sm text-gray-500">No scans yet. Share your QR code to start traffic.</p>
            ) : (
              recentScans.map((scan) => (
                <div key={scan.id} className="rounded-xl border border-gray-100 p-3">
                  <p className="text-sm font-medium text-navy-900">
                    {new Date(scan.scanned_at).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-400">{scan.user_agent ?? "Unknown device"}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Link
              href={`/dashboard?range=${range}&page=${Math.max(1, safePage - 1)}`}
              className="btn-outline px-3 py-1.5 text-xs"
            >
              Previous
            </Link>
            <Link
              href={`/dashboard?range=${range}&page=${Math.min(totalPages, safePage + 1)}`}
              className="btn-outline px-3 py-1.5 text-xs"
            >
              Next
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link className="btn-primary" href="/dashboard/menu">
          Manage Menu
        </Link>
        <Link className="btn-outline" href="/dashboard/qr">
          QR & Assets
        </Link>
        <Link className="btn-outline" href="/dashboard/settings">
          Restaurant Profile
        </Link>
      </div>
    </div>
  );
}
