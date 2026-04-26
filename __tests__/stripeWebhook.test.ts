/**
 * Unit tests for Stripe webhook idempotency and routing.
 * The Stripe SDK and Supabase admin client are fully mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

// ── Shared mock state ─────────────────────────────────────────────────────────

let insertShouldDuplicate = false;
let insertShouldFail = false;

// Chainable no-op builder used by select/upsert/update paths in the handlers
function chainableNoOp(finalValue: unknown) {
  const proxy: Record<string, (...args: unknown[]) => unknown> = {};
  const handler = {
    get(_: unknown, prop: string) {
      // Terminal methods that return a promise
      if (prop === "then") return undefined; // not a thenable itself
      return (..._args: unknown[]) => {
        // If the last call should resolve to the final value, do so
        const result = Promise.resolve(finalValue);
        // Allow further chaining on the resolved value via a Proxy
        return new Proxy(result, {
          get(target: Promise<unknown>, p: string) {
            if (p === "then" || p === "catch" || p === "finally") {
              return target[p as "then"].bind(target);
            }
            // Further chain methods just return the same promise
            return (..._a: unknown[]) => new Proxy(target, handler);
          },
        });
      };
    },
  };
  void proxy;
  return handler;
}

const mockStripeEventsInsert = vi.fn().mockImplementation(() => {
  if (insertShouldFail) return Promise.resolve({ error: { message: "DB error", code: "PGRST" } });
  if (insertShouldDuplicate) return Promise.resolve({ error: { code: "23505" } });
  return Promise.resolve({ error: null });
});

// Generic chainable result for all other DB calls (profiles, subscriptions, etc.)
const noOpResult = { data: { id: "user_123" }, error: null };
function makeChainable(): Record<string, (...a: unknown[]) => unknown> {
  const chain = (val: unknown): unknown => new Proxy(
    { then: undefined },
    {
      get(_t, p: string) {
        if (p === "then") return undefined;
        if (p === "maybeSingle" || p === "single") return () => Promise.resolve(val);
        return (..._: unknown[]) => chain(val);
      },
    }
  );
  return {
    select: (..._: unknown[]) => chain(noOpResult),
    upsert: (..._: unknown[]) => Promise.resolve({ error: null }),
    update: (..._: unknown[]) => chain({ error: null }),
    insert: mockStripeEventsInsert,
    eq: (..._: unknown[]) => chain(noOpResult),
    is: (..._: unknown[]) => chain({ error: null }),
  };
}

const mockAdmin = {
  from: vi.fn().mockImplementation((_table: string) => makeChainable()),
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdmin,
}));

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
  bizLog: {
    stripeWebhookReceived: vi.fn(),
    stripeWebhookFailed: vi.fn(),
    subscriptionActivated: vi.fn(),
    subscriptionCanceled: vi.fn(),
    rateLimitTriggered: vi.fn(),
    courseGenerationStarted: vi.fn(),
    courseGenerationCompleted: vi.fn(),
    courseGenerationFailed: vi.fn(),
  },
}));

// ── Stripe mock ───────────────────────────────────────────────────────────────

const nowSec = Math.floor(Date.now() / 1000);
const fakeEvent: Stripe.Event = {
  id: "evt_test_123",
  object: "event",
  type: "customer.subscription.created",
  data: {
    object: {
      id: "sub_test",
      customer: "cus_test",
      status: "active",
      cancel_at_period_end: false,
      trial_end: null,
      billing_cycle_anchor: nowSec + 30 * 24 * 3600,
      items: {
        data: [{
          price: { id: "price_pro_m", recurring: { interval: "month" } },
          current_period_end: nowSec + 30 * 24 * 3600,
        }],
      },
    } as unknown as Stripe.Subscription,
  },
  api_version: "2025-01-27.acacia",
  created: nowSec,
  livemode: false,
  pending_webhooks: 0,
  request: null,
};

vi.mock("@/lib/billing/stripe", () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: vi.fn().mockReturnValue(fakeEvent),
    },
    customers: {
      retrieve: vi.fn().mockResolvedValue({ id: "cus_test", deleted: false, metadata: { supabase_user_id: "user_123" } }),
    },
  }),
  PRICE_IDS: { proMonthly: "price_pro_m", proAnnual: "price_pro_a" },
  isPriceAllowed: vi.fn().mockReturnValue(true),
}));

// Import handler after all mocks
const { POST } = await import("@/app/api/stripe/webhook/route");

function makeRequest(body = "raw_body", sig = "t=1,v1=abc") {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": sig, "content-type": "text/plain" },
    body,
  }) as unknown as import("next/server").NextRequest;
}

describe("Stripe webhook — idempotency", () => {
  beforeEach(() => {
    insertShouldDuplicate = false;
    insertShouldFail = false;
    vi.clearAllMocks();
    mockAdmin.from.mockImplementation((_table: string) => makeChainable());
  });

  it("returns 200 and processes normally on first delivery", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it("returns 200 silently on duplicate event (23505 unique violation)", async () => {
    insertShouldDuplicate = true;
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it("returns 500 when the idempotency insert fails with a non-duplicate error", async () => {
    insertShouldFail = true;
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "raw",
    }) as unknown as import("next/server").NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
