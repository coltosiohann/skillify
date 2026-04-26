"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft } from "lucide-react";

export default function CourseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[course/error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <h2 className="font-heading text-lg font-bold">Failed to load course</h2>
      <p className="text-sm text-muted-foreground">There was a problem loading this course.</p>
      <div className="flex gap-3">
        <Button onClick={reset} size="sm" variant="outline" className="gap-2 rounded-xl">
          <RefreshCw className="w-4 h-4" />
          Try again
        </Button>
        <Link href="/courses">
          <Button size="sm" className="gap-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
            Back to courses
          </Button>
        </Link>
      </div>
    </div>
  );
}
