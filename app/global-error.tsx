"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-4">
              We&apos;ve been notified and are working on a fix.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
