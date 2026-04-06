export default function GenericLoading() {
  return (
    <div className="space-y-6 max-w-4xl animate-fade-up">
      <div className="skeleton h-10 w-48 rounded-lg" />
      <div className="skeleton h-[400px] w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    </div>
  );
}
