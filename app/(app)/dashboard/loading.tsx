export default function DashboardLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-7 bg-muted rounded-xl w-52 mb-2" />
          <div className="h-4 bg-muted rounded-lg w-40" />
        </div>
        <div className="h-8 bg-muted rounded-full w-16" />
      </div>

      {/* Hero card */}
      <div className="bg-muted rounded-2xl h-44" />

      {/* Goal card */}
      <div className="bg-card border border-primary/8 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="h-3 bg-muted rounded w-28 mb-2" />
            <div className="h-5 bg-muted rounded-lg w-40" />
          </div>
          <div className="w-9 h-9 bg-muted rounded-xl" />
        </div>
        <div className="h-2 bg-muted rounded-full mb-2" />
        <div className="h-3 bg-muted rounded w-48" />
      </div>

      {/* Progress strip */}
      <div className="bg-card border border-primary/8 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-muted rounded-xl flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-4 bg-muted rounded w-20" />
            </div>
            <div className="h-1.5 bg-muted rounded-full" />
          </div>
        </div>
        <div className="flex gap-4 pt-3 border-t border-border">
          <div className="h-3 bg-muted rounded w-24" />
          <div className="h-3 bg-muted rounded w-20" />
          <div className="h-3 bg-muted rounded w-20" />
        </div>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="h-5 bg-muted rounded-lg w-36" />
        <div className="h-7 bg-muted rounded-xl w-24" />
      </div>

      {/* Course cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-card border border-primary/8 rounded-2xl p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-muted rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded-lg w-full mb-1" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full mb-1.5" />
            <div className="h-3 bg-muted rounded w-24 mb-4" />
            <div className="h-8 bg-muted rounded-xl" />
          </div>
        ))}
      </div>

      {/* Create CTA */}
      <div className="rounded-2xl border-2 border-dashed border-muted h-24" />
    </div>
  );
}
