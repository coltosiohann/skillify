import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, PRICE_IDS } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { bizLog } from "@/lib/logger";
import type { Json } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── helpers ───────────────────────────────────────────────────────────────────

function planFromPriceId(priceId: string): "pro" | "free" {
  if (Object.values(PRICE_IDS).includes(priceId)) return "pro";
  return "free";
}

function intervalFromSub(sub: Stripe.Subscription): "month" | "year" {
  const item = sub.items.data[0];
  const interval = item?.price?.recurring?.interval;
  return interval === "year" ? "year" : "month";
}

// In Stripe Clover API, current_period_end moved from Subscription to SubscriptionItem
function periodEndFromSub(sub: Stripe.Subscription): string {
  const item = sub.items.data[0];
  const ts = item?.current_period_end ?? sub.billing_cycle_anchor;
  return new Date(ts * 1000).toISOString();
}

function paymentIntentIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const payment = invoice.payments?.data.find(
    (p) => p.payment.type === "payment_intent" && p.payment.payment_intent
  )?.payment.payment_intent;

  if (!payment) return null;
  return typeof payment === "string" ? payment : payment.id;
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) return null;
  return typeof subscription === "string" ? subscription : subscription.id;
}

// ── main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    bizLog.stripeWebhookFailed("unknown", `signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
    // Log with enough detail to distinguish a misconfigured secret (all requests
    // fail) from a genuine attack probe (sporadic failures from unknown sources).
    console.error("[webhook] signature verification failed", {
      error: err instanceof Error ? err.message : String(err),
      sigPrefix: sig.slice(0, 24),           // safe to log — not the secret
      bodyLength: rawBody.length,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  // ── Idempotency: record event first; duplicate = silent 200 ──────────────
  const { error: insertError } = await admin.from("stripe_events").insert({
    id: event.id,
    type: event.type,
    payload: event.data as unknown as Json,
  });

  const duplicateUnprocessed = insertError?.code === "23505";
  if (duplicateUnprocessed) {
    const { data: existingEvent, error: fetchError } = await admin
      .from("stripe_events")
      .select("processed_at")
      .eq("id", event.id)
      .maybeSingle();

    if (fetchError) {
      console.error("[webhook] failed to check duplicate event:", fetchError);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (existingEvent?.processed_at) {
      return NextResponse.json({ received: true });
    }
  }
  if (insertError && !duplicateUnprocessed) {
    console.error("[webhook] failed to log event:", insertError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  bizLog.stripeWebhookReceived(event.type, (event.data.object as { customer?: string }).customer ?? undefined);

  // ── Route events ─────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(
          event.data.object as Stripe.Checkout.Session,
          admin
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(
          event.data.object as Stripe.Subscription,
          admin,
          stripe
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
          admin
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(
          event.data.object as Stripe.Invoice,
          admin,
          stripe
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
          admin,
          stripe
        );
        break;

      case "charge.refunded":
        await handleChargeRefunded(
          event.data.object as Stripe.Charge,
          admin,
          stripe  // kept for signature compatibility
        );
        break;

      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(
          event.data.object as Stripe.Subscription,
          admin,
          stripe
        );
        break;

      default:
        break;
    }
  } catch (err) {
    bizLog.stripeWebhookFailed(event.type, err instanceof Error ? err.message : String(err));
    console.error(`[webhook] error handling ${event.type} (${event.id}):`, err);
    // Return 500 → Stripe retries. stripe_events row already exists so next
    // attempt hits the idempotency guard and re-processes cleanly.
    await admin
      .from("stripe_events")
      .update({
        processing_error: err instanceof Error ? err.message : String(err),
      })
      .eq("id", event.id);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  await admin
    .from("stripe_events")
    .update({ processed_at: new Date().toISOString(), processing_error: null })
    .eq("id", event.id);

  return NextResponse.json({ received: true });
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
  admin: ReturnType<typeof createAdminClient>
) {
  const userId = session.client_reference_id;
  const customerId = session.customer as string;
  if (!userId || !customerId) return;

  // Link customer only if not already set — the checkout route sets it before
  // creating the session, so this is a no-op in the happy path. It covers the
  // rare edge case where the checkout route crashed after creating the customer
  // but before saving the ID to the profile.
  await admin
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", userId)
    .is("stripe_customer_id", null);
}

async function handleSubscriptionUpsert(
  sub: Stripe.Subscription,
  admin: ReturnType<typeof createAdminClient>,
  stripe: Stripe
) {
  const userId = await resolveUserId(sub.customer as string, admin, stripe);
  if (!userId) {
    console.warn("[webhook] could not resolve user_id for customer", sub.customer);
    return;
  }

  const priceId = sub.items.data[0]?.price?.id ?? "";

  const { error: upsertError } = await admin.from("subscriptions").upsert(
    {
      id: sub.id,
      user_id: userId,
      status: sub.status,
      price_id: priceId,
      plan: planFromPriceId(priceId),
      interval: intervalFromSub(sub),
      current_period_end: periodEndFromSub(sub),
      cancel_at_period_end: sub.cancel_at_period_end,
      trial_end: sub.trial_end
        ? new Date(sub.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (upsertError) {
    if (upsertError.code === "23505") {
      // Partial unique index violation: user already has an active/trialing/past_due sub
      // with a different ID (e.g. test-mode duplicate). Log and skip — the existing sub wins.
      console.warn(
        "[webhook] subscription upsert skipped — unique index conflict for user",
        userId, "sub", sub.id, upsertError.message
      );
      return;
    }
    throw upsertError;
  }

  // Sync plan on profiles for fast reads
  await admin
    .from("profiles")
    .update({ plan: planFromPriceId(priceId) })
    .eq("id", userId);
}

async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
  admin: ReturnType<typeof createAdminClient>
) {
  // Look up user before updating status
  const { data } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("id", sub.id)
    .maybeSingle();

  await admin
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("id", sub.id);

  if (data?.user_id) {
    await admin.from("profiles").update({ plan: "free" }).eq("id", data.user_id);
  }
}

async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  admin: ReturnType<typeof createAdminClient>,
  stripe: Stripe
) {
  const customerId = invoice.customer as string;
  const userId = await resolveUserId(customerId, admin, stripe);
  if (!userId) return;

  const paymentIntentId = paymentIntentIdFromInvoice(invoice);

  await admin.from("invoices").upsert(
    {
      id: invoice.id,
      user_id: userId,
      amount_paid: invoice.amount_paid,
      amount_due: invoice.amount_due,
      currency: invoice.currency,
      status: invoice.status ?? "paid",
      hosted_invoice_url: invoice.hosted_invoice_url ?? null,
      invoice_pdf: invoice.invoice_pdf ?? null,
      payment_intent_id: paymentIntentId,
      invoice_number: invoice.number ?? null,
      period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
    },
    { onConflict: "id" }
  );
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  admin: ReturnType<typeof createAdminClient>,
  stripe: Stripe
) {
  const customerId = invoice.customer as string;
  const userId = await resolveUserId(customerId, admin, stripe);
  if (!userId) return;

  // Cache the open invoice
  await admin.from("invoices").upsert(
    {
      id: invoice.id,
      user_id: userId,
      amount_paid: 0,
      amount_due: invoice.amount_due,
      currency: invoice.currency,
      status: "open",
      hosted_invoice_url: invoice.hosted_invoice_url ?? null,
      invoice_pdf: invoice.invoice_pdf ?? null,
      invoice_number: invoice.number ?? null,
      period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
    },
    { onConflict: "id" }
  );

  // Belt-and-suspenders: flip subscription to past_due immediately.
  // Stripe fires subscription.updated too, but if that event arrives first
  // and fails, this ensures the status is never stuck in a wrong state.
  const subscriptionId = subscriptionIdFromInvoice(invoice);

  if (subscriptionId) {
    const { error } = await admin
      .from("subscriptions")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("id", subscriptionId);

    if (error) {
      console.warn("[webhook] could not set past_due on subscription", subscriptionId, error.message);
    }
  }
}

async function handleChargeRefunded(
  charge: Stripe.Charge,
  admin: ReturnType<typeof createAdminClient>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _stripe: Stripe
) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent as { id?: string } | null)?.id;

  if (!paymentIntentId) return;

  // Match via payment_intent_id stored at invoice.paid time — reliable and no extra API calls.
  const { error } = await admin
    .from("invoices")
    .update({ status: "void" })
    .eq("payment_intent_id", paymentIntentId);

  if (error) {
    console.warn("[webhook] charge.refunded: could not void invoice for pi", paymentIntentId, error.message);
  }
}

async function handleTrialWillEnd(
  sub: Stripe.Subscription,
  admin: ReturnType<typeof createAdminClient>,
  stripe: Stripe
) {
  // Stripe fires this 3 days before trial ends. Keep our DB in sync and
  // create an in-app notification so the user gets a nudge.
  const userId = await resolveUserId(sub.customer as string, admin, stripe);
  if (!userId) return;

  const trialEnd = sub.trial_end
    ? new Date(sub.trial_end * 1000).toISOString()
    : null;

  // Ensure trial_end is up to date in our subscriptions table
  if (trialEnd) {
    await admin
      .from("subscriptions")
      .update({ trial_end: trialEnd, updated_at: new Date().toISOString() })
      .eq("id", sub.id);
  }

  // Insert an in-app notification if the notifications table exists
  const trialEndDate = trialEnd
    ? new Date(trialEnd).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : "soon";

  await admin.from("notifications").insert({
    user_id: userId,
    type: "trial_ending",
    title: "Your trial ends " + trialEndDate,
    message: "Add a payment method to keep your Pro access after the trial.",
    read: false,
  }).then(({ error }) => {
    if (error) console.warn("[webhook] trial_will_end: could not insert notification", error.message);
  });
}

// ── Utilities ─────────────────────────────────────────────────────────────────

async function resolveUserId(
  customerId: string,
  admin: ReturnType<typeof createAdminClient>,
  stripe: Stripe
): Promise<string | null> {
  // Fast path: profiles table
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (profile?.id) return profile.id;

  // Slow path: Stripe customer metadata (handles edge cases)
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return (customer as Stripe.Customer).metadata?.supabase_user_id ?? null;
  } catch {
    return null;
  }
}
