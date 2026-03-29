export default function CourseLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      {/* Back link */}
      <div className="h-4 bg-muted rounded w-32 mb-6" />

      {/* Header card */}
      <div className="bg-muted rounded-3xl p-7 mb-6">
        <div className="h-3 bg-white/20 rounded w-24 mb-2" />
        <div className="h-7 bg-white/20 rounded-xl w-3/4 mb-6" />
        <div className="flex gap-4 mb-5">
          <div className="h-4 bg-white/20 rounded w-32" />
          <div className="h-4 bg-white/20 rounded w-28" />
          <div className="h-4 bg-white/20 rounded w-24" />
        </div>
        <div className="h-2 bg-white/20 rounded-full mb-5" />
        <div className="h-10 bg-white/20 rounded-xl w-40" />
      </div>

      {/* Modules */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-primary/10 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 bg-muted rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded-lg w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-32" />
              </div>
              <div className="w-16 h-1.5 bg-muted rounded-full hidden sm:block" />
              <div className="w-4 h-4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
