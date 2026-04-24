import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, PRICE_IDS } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
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
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  // ── Idempotency: record event first; duplicate = silent 200 ──────────────
  const { error: insertError } = await admin.from("stripe_events").insert({
    id: event.id,
    type: event.type,
    payload: event.data as unknown as Json,
  });

  if (insertError?.code === "23505") {
    return NextResponse.json({ received: true });
  }
  if (insertError) {
    console.error("[webhook] failed to log event:", insertError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

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
          stripe
        );
        break;

      default:
        break;
    }
  } catch (err) {
    console.error(`[webhook] error handling ${event.type} (${event.id}):`, err);
    // Return 500 → Stripe retries. stripe_events row already exists so next
    // attempt hits the idempotency guard and re-processes cleanly.
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

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

  // Belt-and-suspenders: ensure customer is linked even if checkout route missed it
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

  await admin.from("subscriptions").upsert(
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

  await admin.from("invoices").upsert(
    {
      id: invoice.id,
      user_id: userId,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status ?? "paid",
      hosted_invoice_url: invoice.hosted_invoice_url ?? null,
      invoice_pdf: invoice.invoice_pdf ?? null,
    },
    { onConflict: "id" }
  );
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  admin: ReturnType<typeof createAdminClient>,
  stripe: Stripe
) {
  // Stripe will also fire subscription.updated with status=past_due.
  // We still cache the open invoice so the user can see it.
  const customerId = invoice.customer as string;
  const userId = await resolveUserId(customerId, admin, stripe);
  if (!userId) return;

  await admin.from("invoices").upsert(
    {
      id: invoice.id,
      user_id: userId,
      amount_paid: 0,
      currency: invoice.currency,
      status: "open",
      hosted_invoice_url: invoice.hosted_invoice_url ?? null,
      invoice_pdf: invoice.invoice_pdf ?? null,
    },
    { onConflict: "id" }
  );
}

async function handleChargeRefunded(
  charge: Stripe.Charge,
  admin: ReturnType<typeof createAdminClient>,
  stripe: Stripe
) {
  // In Clover API, Charge no longer carries a direct invoice reference.
  // Look up recent invoices for this customer and find one whose confirmation
  // secret references this charge's payment intent.
  const customerId =
    typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
  if (!customerId) return;

  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  // Fetch the PaymentIntent to get the invoice via confirmation_secret
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    // invoice field was removed from PI in Clover; list invoices for customer instead
    const { data: invList } = await stripe.invoices.list({ customer: customerId, limit: 10 });
    const matched = invList.find(
      (inv) => inv.confirmation_secret?.client_secret?.startsWith("pi_" + pi.id.slice(3))
    );
    if (matched) {
      await admin.from("invoices").update({ status: "void" }).eq("id", matched.id);
    }
  } catch {
    // Non-critical: Portal always shows accurate refund status to the user
  }
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
