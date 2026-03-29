import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
};

export default withSentryConfig(nextConfig, {
  // Sentry organization and project from dashboard
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Suppress source map upload warnings in CI
  silent: !process.env.CI,
  // Upload source maps only in production builds
  widenClientFileUpload: true,
  // Disable source maps in dev to speed up builds
  sourcemaps: {
    disable: process.env.NODE_ENV !== "production",
  },
  // Automatically tree-shake Sentry logger statements
  disableLogger: true,
});
