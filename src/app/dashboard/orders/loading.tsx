export default function OrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-9 w-48 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
        <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-24 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
        <div className="h-24 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
      </div>

      <div className="h-96 bg-slate-200 dark:bg-slate-800/60 rounded-2xl w-full" />
    </div>
  );
}
