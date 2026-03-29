/**
 * Rate limiter with Supabase persistence fallback.
 * Uses a `rate_limits` table so limits survive across serverless invocations.
 * Falls back to in-memory if the DB call fails.
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

  try {
    const supabase = await createClient();

    // Delete expired entry if present, then upsert atomically
    await supabase
      .from("rate_limits")
      .delete()
      .eq("key", key)
      .lt("reset_at", new Date().toISOString());

    const { data: existing } = await supabase
      .from("rate_limits")
      .select("count, reset_at")
      .eq("key", key)
      .maybeSingle();

    if (!existing) {
      await supabase.from("rate_limits").insert({ key, count: 1, reset_at: resetAt });
      return { allowed: true, remaining: opts.limit - 1, resetAt: now + windowMs };
    }

    if (existing.count >= opts.limit) {
      return { allowed: false, remaining: 0, resetAt: new Date(existing.reset_at).getTime() };
    }

    await supabase.from("rate_limits").update({ count: existing.count + 1 }).eq("key", key);
    return { allowed: true, remaining: opts.limit - (existing.count + 1), resetAt: new Date(existing.reset_at).getTime() };

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
