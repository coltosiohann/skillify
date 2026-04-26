import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { confirmEmail?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (!user.email || body.confirmEmail !== user.email) {
    return NextResponse.json(
      { error: "Type your account email to confirm deletion." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // 1. Look up Stripe customer before we lose the profile
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  // 2. Delete Stripe customer — removes payment methods, cancels active subs,
  //    and satisfies GDPR right-to-erasure for billing data.
  if (profile?.stripe_customer_id) {
    try {
      const stripe = getStripe();
      await stripe.customers.del(profile.stripe_customer_id);
    } catch (err) {
      // Log but don't block deletion — customer may already be deleted in Stripe
      console.error("[account/delete] stripe customer deletion failed", err);
    }
  }

  // 3. Delete the Supabase auth user — cascades to profiles, subscriptions,
  //    invoices, courses, progress via ON DELETE CASCADE foreign keys.
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("[account/delete] supabase user deletion failed", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
