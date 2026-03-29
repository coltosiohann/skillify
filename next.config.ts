import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  // Disable source map upload until SENTRY_AUTH_TOKEN is configured in Vercel
  sourcemaps: {
    disable: true,
  },
  // Replaces deprecated disableLogger
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
  telemetry: false,
});
