import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "*.supabase.co";

const cspHeader = [
  "default-src 'self'",
  // Scripts: self + Stripe (checkout iframe) + inline scripts Next.js needs
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  // Styles: self + inline (Tailwind CSS-in-JS)
  "style-src 'self' 'unsafe-inline'",
  // Images: self + data URIs + any https (avatars, og images)
  "img-src 'self' data: blob: https:",
  // Fonts: self
  "font-src 'self'",
  // API connections: self + Supabase + Stripe
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.stripe.com https://o*.ingest.sentry.io`,
  // Frames: Stripe hosted checkout
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  // Workers: self (service worker)
  "worker-src 'self' blob:",
  // Block all object/embed
  "object-src 'none'",
  // Enforce HTTPS for subresources
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ["pdf-parse"],
  env: {
    NEXT_PUBLIC_BUILD_ID: String(Date.now()),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
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
