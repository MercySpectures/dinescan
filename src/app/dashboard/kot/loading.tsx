export default function KotLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-9 w-44 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
        <div className="h-9 w-40 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
