export default function QrLoading() {
  return (
    <div className="space-y-8 animate-pulse max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="h-9 w-64 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
        <div className="h-9 w-48 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 h-96 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
        <div className="lg:col-span-5 h-96 bg-slate-200 dark:bg-slate-800/60 rounded-3xl" />
      </div>
    </div>
  );
}
