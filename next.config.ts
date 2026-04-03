import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  env: {
    // Expose build timestamp as a cache-busting version for the service worker
    NEXT_PUBLIC_BUILD_ID: String(Date.now()),
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  // Enable source map upload when SENTRY_AUTH_TOKEN is set (configure in Vercel env vars)
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  widenClientFileUpload: true,
  // Replaces deprecated disableLogger
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  telemetry: false,
});
