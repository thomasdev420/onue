/**
 * Single Stripe Payment Link for provider catalog listings (NEXT_PUBLIC_* — Vercel, then redeploy).
 * @returns {string} URL or ''
 */
export function getStripeListingPaymentUrl() {
  const raw =
    process.env.NEXT_PUBLIC_STRIPE_LISTING_URL?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_LISTING_BASIC_URL?.trim() ||
    "";
  return raw;
}
