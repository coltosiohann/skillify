/**
 * Unit tests for the rate limiter in-memory fallback path.
 * These run without a DB — the Supabase client is mocked to always throw,
 * forcing every call through the in-memory store.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Supabase before importing the module under test ──────────────────────
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: () => { throw new Error("DB unavailable"); },
  }),
}));

// Also suppress logger noise in tests
vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
  logWarn: vi.fn(),
  bizLog: {
    rateLimitTriggered: vi.fn(),
    courseGenerationStarted: vi.fn(),
    courseGenerationCompleted: vi.fn(),
    courseGenerationFailed: vi.fn(),
    stripeWebhookReceived: vi.fn(),
    stripeWebhookFailed: vi.fn(),
    subscriptionActivated: vi.fn(),
    subscriptionCanceled: vi.fn(),
  },
}));

// Import after mocks are set up
const { checkRateLimit, rateLimitHeaders } = await import("@/lib/rateLimit");

const OPTS = { limit: 3, windowSec: 60, prefix: "test" };

describe("checkRateLimit (in-memory fallback)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("allows requests up to the limit", async () => {
    const id = `user-${Math.random()}`;
    const r1 = await checkRateLimit(id, OPTS);
    const r2 = await checkRateLimit(id, OPTS);
    const r3 = await checkRateLimit(id, OPTS);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
  });

  it("denies the request that exceeds the limit", async () => {
    const id = `user-${Math.random()}`;
    await checkRateLimit(id, OPTS);
    await checkRateLimit(id, OPTS);
    await checkRateLimit(id, OPTS);
    const r4 = await checkRateLimit(id, OPTS);

    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("remaining decrements with each allowed request", async () => {
    const id = `user-${Math.random()}`;
    const r1 = await checkRateLimit(id, OPTS);
    const r2 = await checkRateLimit(id, OPTS);

    expect(r1.remaining).toBe(2);
    expect(r2.remaining).toBe(1);
  });

  it("different identifiers are tracked independently", async () => {
    const a = `user-a-${Math.random()}`;
    const b = `user-b-${Math.random()}`;

    await checkRateLimit(a, OPTS);
    await checkRateLimit(a, OPTS);
    await checkRateLimit(a, OPTS);

    const bResult = await checkRateLimit(b, OPTS);
    expect(bResult.allowed).toBe(true);
  });
});

describe("rateLimitHeaders", () => {
  it("includes standard headers when allowed", () => {
    const rl = { allowed: true, remaining: 4, resetAt: Date.now() + 60_000 };
    const headers = rateLimitHeaders(rl, 5);

    expect(headers["RateLimit-Limit"]).toBe("5");
    expect(headers["RateLimit-Remaining"]).toBe("4");
    expect(headers["Retry-After"]).toBeUndefined();
  });

  it("includes Retry-After when denied", () => {
    const rl = { allowed: false, remaining: 0, resetAt: Date.now() + 30_000 };
    const headers = rateLimitHeaders(rl, 5);

    expect(headers["RateLimit-Remaining"]).toBe("0");
    expect(Number(headers["Retry-After"])).toBeGreaterThan(0);
  });
});
