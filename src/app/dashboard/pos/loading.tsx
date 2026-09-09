export default function POSLoading() {
  return (
    <div className="h-[calc(100vh-6rem)] grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
      <div className="lg:col-span-8 bg-slate-200 dark:bg-slate-800/60 rounded-3xl h-full" />
      <div className="lg:col-span-4 bg-slate-200 dark:bg-slate-800/60 rounded-3xl h-full" />
    </div>
  );
}
