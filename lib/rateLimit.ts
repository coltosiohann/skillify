/**
 * Rate limiter with Supabase persistence fallback.
 * Uses a `rate_limits` table so limits survive across serverless invocations.
 * Falls back to in-memory if the DB call fails.
 *
 * Note: For a truly atomic implementation, add a Postgres function:
 *   CREATE OR REPLACE FUNCTION increment_rate_limit(p_key text, p_reset_at timestamptz, p_limit int)
 *   RETURNS TABLE(count int, reset_at timestamptz, allowed boolean) ...
 * and call it via supabase.rpc(). The current approach (2 queries) has a small
 * race window under extreme concurrency but is acceptable for this use case.
 */

import { createClient } from "@/lib/supabase/server";

// In-memory fallback store
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const memStore = new Map<string, RateLimitEntry>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memStore) {
      if (entry.resetAt <= now) memStore.delete(key);
    }
  }, 5 * 60 * 1000);
}

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
  /** Key prefix to namespace different endpoints */
  prefix: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(identifier: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  const key = `${opts.prefix}:${identifier}`;
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;
  const resetAt = new Date(now + windowMs).toISOString();
  const nowIso = new Date(now).toISOString();

  try {
    const supabase = await createClient();

    // Single SELECT — check for a valid (non-expired) entry
    const { data: existing } = await supabase
      .from("rate_limits")
      .select("count, reset_at")
      .eq("key", key)
      .gt("reset_at", nowIso)  // Only return rows that haven't expired
      .maybeSingle();

    if (!existing) {
      // No valid entry — upsert a fresh one (handles both "never seen" and "expired" cases)
      await supabase
        .from("rate_limits")
        .upsert({ key, count: 1, reset_at: resetAt }, { onConflict: "key" });
      return { allowed: true, remaining: opts.limit - 1, resetAt: now + windowMs };
    }

    if (existing.count >= opts.limit) {
      return { allowed: false, remaining: 0, resetAt: new Date(existing.reset_at).getTime() };
    }

    // Increment count
    await supabase
      .from("rate_limits")
      .update({ count: existing.count + 1 })
      .eq("key", key);

    return {
      allowed: true,
      remaining: opts.limit - (existing.count + 1),
      resetAt: new Date(existing.reset_at).getTime(),
    };
  } catch {
    // Fallback to in-memory
    const entry = memStore.get(key);
    if (!entry || entry.resetAt <= now) {
      memStore.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: opts.limit - 1, resetAt: now + windowMs };
    }
    if (entry.count >= opts.limit) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }
    entry.count++;
    return { allowed: true, remaining: opts.limit - entry.count, resetAt: entry.resetAt };
  }
}
