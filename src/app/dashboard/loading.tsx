export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-40" />
      <div className="grid gap-4 md:grid-cols-4">
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="skeleton h-72 lg:col-span-2" />
        <div className="skeleton h-72" />
      </div>
    </div>
  );
}

