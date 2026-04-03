import { z } from "zod";

/**
 * Validated environment variables.
 * Import `env` from this file instead of accessing `process.env` directly.
 * This ensures missing/invalid config is caught at startup rather than at runtime.
 */

const EnvSchema = z.object({
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),

  // AI providers (at least one must be set — validated at runtime in provider.ts)
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // AI model overrides (optional — provider.ts falls back to defaults)
  AI_MODEL_ANTHROPIC: z.string().optional(),
  AI_MODEL_OPENAI: z.string().optional(),

  // Sentry (optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Node
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

// Throws at import time if required vars are missing — fail fast
const _parsed = EnvSchema.safeParse(process.env);

if (!_parsed.success) {
  const missing = _parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`\n❌ Invalid environment variables:\n${missing}\n\nCheck your .env.local file.`);
}

export const env = _parsed.data;
