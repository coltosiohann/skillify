export default function CoursesLoading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 bg-muted rounded-xl w-40 mb-2" />
        <div className="h-4 bg-muted rounded-lg w-64" />
      </div>

      {/* Course list */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-primary/8 rounded-2xl overflow-hidden">
            <div className="h-2 bg-muted" />
            <div className="p-5">
              <div className="h-3 bg-muted rounded w-16 mb-2" />
              <div className="h-5 bg-muted rounded-lg w-full mb-1" />
              <div className="h-5 bg-muted rounded-lg w-2/3 mb-4" />
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
