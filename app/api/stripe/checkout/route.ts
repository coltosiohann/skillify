import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isPriceAllowed, PRICE_IDS } from "@/lib/billing/stripe";
import { env } from "@/lib/env";
import { validateOrigin } from "@/lib/api/csrf";
import { withValidation } from "@/lib/api/parseJsonBody";

export const runtime = "nodejs";

const CheckoutSchema = z
  .object({
    priceId: z.string().min(1).optional(),
    planKey: z.enum(["pro_monthly", "pro_annual"]).optional(),
  })
  .refine((body) => body.priceId || body.planKey, {
    message: "priceId or planKey is required",
  });

export const POST = withValidation(CheckoutSchema, async (req: NextRequest, body) => {
  const csrfError = validateOrigin(req);
  if (csrfError) return csrfError;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const priceId = body.priceId ?? PRICE_IDS[body.planKey as keyof typeof PRICE_IDS];
    if (!priceId || !isPriceAllowed(priceId)) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const stripe = getStripe();
    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, full_name")
      .eq("id", user.id)
      .single();

    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (existingSub) {
      const customerId = profile?.stripe_customer_id;
      if (!customerId) {
        return NextResponse.json({ url: `${env.NEXT_PUBLIC_APP_URL}/settings?tab=billing` });
      }
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`,
      });
      return NextResponse.json({ url: portalSession.url });
    }

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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      customer_update: { address: "auto", name: "auto" },
      tax_id_collection: { enabled: true },
      payment_method_collection: "if_required",
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: user.id },
      },
      success_url: `${env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/billing/canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
