import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, PRICE_IDS } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Protect with a shared secret so only cron/admin can trigger this.
function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get("x-reconcile-secret");
  return !!process.env.RECONCILE_SECRET && token === process.env.RECONCILE_SECRET;
}

function planFromPriceId(priceId: string): "pro" | "free" {
  return Object.values(PRICE_IDS).includes(priceId) ? "pro" : "free";
}

function intervalFromSub(sub: Stripe.Subscription): "month" | "year" {
  const interval = sub.items.data[0]?.price?.recurring?.interval;
  return interval === "year" ? "year" : "month";
}

function periodEndFromSub(sub: Stripe.Subscription): string {
  const item = sub.items.data[0];
  const ts = item?.current_period_end ?? sub.billing_cycle_anchor;
  return new Date(ts * 1000).toISOString();
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  const admin = createAdminClient();
  const drift: string[] = [];
  const fixed: string[] = [];

  const stripeSubsIter = stripe.subscriptions.list({
    status: "all",
    limit: 100,
    expand: ["data.customer"],
  });

  for await (const stripeSub of stripeSubsIter) {
    // Canceled subscriptions are terminal history; webhooks handle those.
    if (stripeSub.status === "canceled") continue;

    const customerId =
      typeof stripeSub.customer === "string"
        ? stripeSub.customer
        : stripeSub.customer.id;

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (!profile?.id) {
      drift.push(`stripe sub ${stripeSub.id}: no matching profile for customer ${customerId}`);
      continue;
    }

    const { data: dbSub } = await admin
      .from("subscriptions")
      .select("id, status, price_id, plan, interval, current_period_end, cancel_at_period_end, trial_end")
      .eq("id", stripeSub.id)
      .maybeSingle();

    const priceId = stripeSub.items.data[0]?.price?.id ?? "";
    const plan = planFromPriceId(priceId);
    const snapshot = {
      id: stripeSub.id,
      user_id: profile.id,
      status: stripeSub.status,
      price_id: priceId,
      plan,
      interval: intervalFromSub(stripeSub),
      current_period_end: periodEndFromSub(stripeSub),
      cancel_at_period_end: stripeSub.cancel_at_period_end,
      trial_end: stripeSub.trial_end
        ? new Date(stripeSub.trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    };

    const differs = !dbSub ||
      dbSub.status !== snapshot.status ||
      dbSub.price_id !== snapshot.price_id ||
      dbSub.plan !== snapshot.plan ||
      dbSub.interval !== snapshot.interval ||
      dbSub.current_period_end !== snapshot.current_period_end ||
      dbSub.cancel_at_period_end !== snapshot.cancel_at_period_end ||
      dbSub.trial_end !== snapshot.trial_end;

    if (!differs) continue;

    drift.push(
      dbSub
        ? `sub ${stripeSub.id}: DB snapshot differs from Stripe - fixing`
        : `stripe sub ${stripeSub.id} (${stripeSub.status}) missing from DB for user ${profile.id} - fixing`
    );

    const { error: upsertError } = await admin
      .from("subscriptions")
      .upsert(snapshot, { onConflict: "id" });

    if (upsertError) {
      drift.push(`sub ${stripeSub.id}: repair failed - ${upsertError.message}`);
      continue;
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({ plan })
      .eq("id", profile.id);

    if (profileError) {
      drift.push(`profile ${profile.id}: plan repair failed - ${profileError.message}`);
      continue;
    }

    fixed.push(stripeSub.id);
  }

  console.log("[reconcile] drift:", drift.length, "fixed:", fixed.length, drift);

  return NextResponse.json({
    ok: true,
    driftCount: drift.length,
    fixedCount: fixed.length,
    drift,
    fixed,
  });
}
