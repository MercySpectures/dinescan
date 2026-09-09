export default function TablesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-9 w-52 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
        <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
