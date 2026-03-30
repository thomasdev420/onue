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

/**
 * Primary “get listed / pay” href: Stripe checkout when configured, else intake form (no Payment Link yet).
 * @returns {{ href: string, external: boolean }}
 */
export function getListingPayLink() {
  const stripe = getStripeListingPaymentUrl();
  if (stripe) return { href: stripe, external: true };
  return { href: "/providers/join", external: false };
}
