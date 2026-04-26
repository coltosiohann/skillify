import Stripe from "stripe";
import { env } from "@/lib/env";

// Singleton — reused across hot-reloads in dev, single instance in prod.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required for billing routes");
  }
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Allowed Price IDs — validated server-side before creating sessions.
export const PRICE_IDS = {
  pro_monthly: env.STRIPE_PRICE_PRO_MONTHLY,
  pro_annual: env.STRIPE_PRICE_PRO_ANNUAL,
} as const;

export type PriceKey = keyof typeof PRICE_IDS;

export function isPriceAllowed(priceId: string): boolean {
  return Object.values(PRICE_IDS).includes(priceId);
}
