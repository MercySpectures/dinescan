import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDashboardAnalytics } from "@/lib/data/dashboard";
import { resolveDateRange } from "@/lib/data/dashboard";
import TrendBars from "@/components/analytics/trend-bars";
import { getMenuUrl } from "@/lib/utils";
import { TrendingUp, Users, BarChart2, Eye, Zap, ArrowUpRight, Globe, Calendar } from "lucide-react";

interface DashboardPageProps {
  searchParams?: {
    slug?: string;
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
  const slug = searchParams?.slug;

  const analytics = await getDashboardAnalytics({
    ownerId: user.id,
    slug,
    rangeDays: range,
    from: fromDate,
    to: toDate,
    page: safePage,
    pageSize
  });
  if (!analytics) redirect("/onboarding?new=true");

  const restaurant = analytics.restaurant;

  // If accessed directly via bare /dashboard without slug, route to /:slug/dashboard
  if (!slug && restaurant.slug) {
    redirect(`/${restaurant.slug}/dashboard`);
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  const planName = (subscription?.plan || "free").toUpperCase();
  const maxTables = subscription?.max_tables || 10;
  const maxItems = subscription?.max_menu_items || 50;

  const series = analytics.series;
  const recentScans = analytics.recentScans;
  const topItems = analytics.topItems;
  const mobileScans = recentScans.filter((row) => (row.user_agent ?? "").toLowerCase().includes("mobile")).length;
  const desktopScans = recentScans.length - mobileScans;
  const totalPages = Math.max(1, Math.ceil(analytics.totalRecentScans / pageSize));
  const resolvedRange = resolveDateRange({ rangeDays: range, from: fromDate, to: toDate });

  const kpiCards = [
    {
      label: "Total Scans",
      value: analytics.kpis.totalScans,
      icon: BarChart2,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 dark:bg-blue-500/15",
      border: "border-blue-500/20"
    },
    {
      label: "Menu Items",
      value: analytics.kpis.menuItems,
      icon: TrendingUp,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      border: "border-emerald-500/20"
    },
    {
      label: "Categories",
      value: analytics.kpis.categories,
      icon: Users,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 dark:bg-amber-500/15",
      border: "border-amber-500/20"
    },
    {
      label: "Published",
      value: restaurant.is_published ? "Live" : "Draft",
      icon: Eye,
      color: restaurant.is_published ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400",
      bg: restaurant.is_published ? "bg-emerald-500/10 dark:bg-emerald-500/15" : "bg-slate-500/10 dark:bg-slate-500/15",
      border: restaurant.is_published ? "border-emerald-500/20" : "border-slate-500/20"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 p-6 shadow-xl text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold font-display">{restaurant.name}</h1>
              <span className="px-3 py-1 text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full tracking-wider">
                {planName} PLAN
              </span>
            </div>
            <p className="text-sm text-slate-400">
              {maxTables} Tables · {maxItems} Menu Items · Status: <span className="text-emerald-400 font-semibold">{subscription?.status || "Active"}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all"
              href={`/menu/${restaurant.slug}`}
              target="_blank"
            >
              <Globe className="w-3.5 h-3.5" />
              View Live Menu <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Onboarding / Setup Wizard Quick-Start */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/20 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-md text-xl shrink-0">
            🚀
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Restaurant Setup & Onboarding Wizard</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              4-step quickstart: brand, QR tables, GST schedule, and payment gateway.
            </p>
          </div>
        </div>
        <Link
          href="/onboarding"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all shrink-0"
        >
          <Zap className="w-3.5 h-3.5" />
          Launch Setup Wizard
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                    {String(card.value)}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-2xl ${card.bg} border ${card.border} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Date Range Filter */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <form className="flex flex-wrap items-end gap-2" action={`/${restaurant.slug}/dashboard`} method="get">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Calendar className="w-3 h-3 inline mr-1" />From
              </label>
              <input className="input py-2 text-xs" type="date" name="from" defaultValue={fromDate ?? ""} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">To</label>
              <input className="input py-2 text-xs" type="date" name="to" defaultValue={toDate ?? ""} />
            </div>
            <button className="btn-outline h-[40px] text-xs font-semibold" type="submit">
              Apply Range
            </button>
          </form>
          <Link
            className="btn-outline h-[40px] text-xs font-semibold"
            href={`/api/analytics/scans?range=${range}${fromDate ? `&from=${fromDate}` : ""}${toDate ? `&to=${toDate}` : ""}&slug=${restaurant.slug}`}
          >
            Export CSV
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 self-center">Active: {resolvedRange.label}</p>
        </div>
      </div>

      {/* Charts & Device Mix */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              Scan trend <span className="text-slate-400 dark:text-slate-500 font-normal">({range} days)</span>
            </p>
            <div className="flex gap-2">
              {[7, 14, 30].map((days) => (
                <Link
                  key={days}
                  href={`/${restaurant.slug}/dashboard?range=${days}&page=1`}
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
          <p className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Device Mix</p>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-600 dark:text-slate-400">📱 Mobile</span>
                <span className="font-bold text-slate-900 dark:text-white">{mobileScans}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${recentScans.length ? (mobileScans / recentScans.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-600 dark:text-slate-400">🖥️ Desktop</span>
                <span className="font-bold text-slate-900 dark:text-white">{desktopScans}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${recentScans.length ? (desktopScans / recentScans.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Public Menu URL</p>
            <Link
              href={`/menu/${restaurant.slug}`}
              target="_blank"
              className="block break-all text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {getMenuUrl(restaurant.slug)}
            </Link>
          </div>
        </div>
      </div>

      {/* Top Items & Recent Scans */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <p className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Top Menu Items</p>
          <div className="space-y-2.5">
            {topItems.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Add menu items to start tracking engagement.</p>
            ) : (
              topItems.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.is_featured ? "⭐ Featured" : "Standard"}</p>
                    </div>
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
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-slate-900 dark:text-white text-sm">Recent Scan Events</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              Pg {safePage}/{totalPages}
            </p>
          </div>
          <div className="space-y-2">
            {recentScans.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No scans yet — share your QR code to start traffic.</p>
            ) : (
              recentScans.map((scan) => (
                <div key={scan.id} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(scan.scanned_at).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">{scan.user_agent ?? "Unknown device"}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Link
              href={`/${restaurant.slug}/dashboard?range=${range}&page=${Math.max(1, safePage - 1)}`}
              className="btn-outline px-3 py-1.5 text-xs"
            >
              ← Previous
            </Link>
            <Link
              href={`/${restaurant.slug}/dashboard?range=${range}&page=${Math.min(totalPages, safePage + 1)}`}
              className="btn-outline px-3 py-1.5 text-xs"
            >
              Next →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link className="btn-primary" href={`/${restaurant.slug}/dashboard/menu`}>
          Manage Menu →
        </Link>
        <Link className="btn-outline" href={`/${restaurant.slug}/dashboard/qr`}>
          QR & Assets
        </Link>
        <Link className="btn-outline" href={`/${restaurant.slug}/dashboard/settings`}>
          Restaurant Settings
        </Link>
        <Link className="btn-outline" href={`/${restaurant.slug}/dashboard/orders`}>
          Live Orders Board
        </Link>
      </div>
    </div>
  );
}
