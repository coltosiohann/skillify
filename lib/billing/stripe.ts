import Stripe from "stripe";

// Singleton — reused across hot-reloads in dev, single instance in prod.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Allowed Price IDs — validated server-side before creating sessions.
export const PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL!,
} as const;

export type PriceKey = keyof typeof PRICE_IDS;

export function isPriceAllowed(priceId: string): boolean {
  return Object.values(PRICE_IDS).includes(priceId);
}
