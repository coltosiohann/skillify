"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function CoursesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[courses/error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <h2 className="font-heading text-lg font-bold">Failed to load courses</h2>
      <p className="text-sm text-muted-foreground">There was a problem loading your courses.</p>
      <Button onClick={reset} size="sm" className="gap-2 rounded-xl">
        <RefreshCw className="w-4 h-4" />
        Try again
      </Button>
    </div>
  );
}
