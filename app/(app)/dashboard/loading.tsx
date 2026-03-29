export default function DashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-muted rounded-xl w-56 mb-2" />
        <div className="h-4 bg-muted rounded-lg w-80" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-primary/8 rounded-2xl p-4">
            <div className="h-3 bg-muted rounded w-16 mb-3" />
            <div className="h-7 bg-muted rounded-lg w-20 mb-1" />
            <div className="h-3 bg-muted rounded w-12" />
          </div>
        ))}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-muted rounded-lg w-32" />
        <div className="h-9 bg-muted rounded-xl w-28" />
      </div>

      {/* Course cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-primary/8 rounded-2xl overflow-hidden">
            <div className="h-2 bg-muted" />
            <div className="p-5">
              <div className="h-3 bg-muted rounded w-16 mb-2" />
              <div className="h-5 bg-muted rounded-lg w-full mb-1" />
              <div className="h-5 bg-muted rounded-lg w-3/4 mb-4" />
              <div className="flex gap-2 mb-4">
                <div className="h-5 bg-muted rounded-full w-20" />
                <div className="h-5 bg-muted rounded-full w-16" />
              </div>
              <div className="h-2 bg-muted rounded-full mb-1" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
