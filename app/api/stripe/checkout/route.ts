import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isPriceAllowed } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { priceId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { priceId } = body;

  // Server-side allowlist — never trust client
  if (!priceId || !isPriceAllowed(priceId)) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const stripe = getStripe();
  const admin = createAdminClient();

  // Look up existing Stripe customer
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, full_name")
    .eq("id", user.id)
    .single();

  // Check for existing active/trialing subscription — send to Portal instead
  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (existingSub) {
    // User already subscribed — return portal URL
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile!.stripe_customer_id!,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    });
    return NextResponse.json({ url: portalSession.url });
  }

  // Create customer if not exists
  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create(
      {
        email: user.email,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      },
      { idempotencyKey: `create-customer-${user.id}` }
    );
    customerId = customer.id;

    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: user.id },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/canceled`,
    },
    { idempotencyKey: `checkout-${user.id}-${priceId}` }
  );

  return NextResponse.json({ url: session.url });
}
