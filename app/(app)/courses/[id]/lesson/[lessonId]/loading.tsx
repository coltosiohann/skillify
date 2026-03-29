export default function LessonLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-primary/8 bg-card p-4 gap-3 flex-shrink-0">
        <div className="h-4 w-32 rounded-full bg-primary/8 animate-pulse mb-2" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-primary/8 animate-pulse flex-shrink-0" />
            <div className="h-3 rounded-full bg-primary/8 animate-pulse flex-1" style={{ width: `${60 + (i % 3) * 15}%` }} />
          </div>
        ))}
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <div className="h-3 w-20 rounded-full bg-primary/8 animate-pulse" />
            <div className="h-3 w-2 rounded-full bg-primary/8 animate-pulse" />
            <div className="h-3 w-32 rounded-full bg-primary/8 animate-pulse" />
          </div>

          {/* Title */}
          <div className="space-y-3">
            <div className="h-7 w-3/4 rounded-xl bg-primary/8 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full bg-primary/8 animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-primary/8 animate-pulse" />
              <div className="h-5 w-14 rounded-full bg-primary/8 animate-pulse" />
            </div>
          </div>

          {/* Content paragraphs */}
          <div className="space-y-4 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 rounded-full bg-primary/8 animate-pulse w-full" />
                <div className="h-3 rounded-full bg-primary/8 animate-pulse w-5/6" />
                <div className="h-3 rounded-full bg-primary/8 animate-pulse w-4/6" />
              </div>
            ))}
          </div>

          {/* Code block */}
          <div className="h-32 rounded-2xl bg-primary/5 animate-pulse border border-primary/8" />

          {/* More paragraphs */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 rounded-full bg-primary/8 animate-pulse w-full" />
                <div className="h-3 rounded-full bg-primary/8 animate-pulse w-3/4" />
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-4">
            <div className="h-11 flex-1 rounded-xl bg-primary/8 animate-pulse" />
            <div className="h-11 flex-1 rounded-xl bg-primary/8 animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
