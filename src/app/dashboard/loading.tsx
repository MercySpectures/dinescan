export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Banner Skeleton */}
      <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />

      {/* Quickstart Banner Skeleton */}
      <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />

      {/* Date Filter Bar Skeleton */}
      <div className="h-16 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />

      {/* 4 KPI Grid Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
        <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
        <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
        <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
      </div>

      {/* Analytics Chart & Device Mix Skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 bg-slate-200 dark:bg-slate-800/60 rounded-2xl lg:col-span-2" />
        <div className="h-72 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
      </div>
    </div>
  );
}
