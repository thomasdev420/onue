/**
 * Single Stripe Payment Link for provider catalog listings (NEXT_PUBLIC_*; Vercel, then redeploy).
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
 * First step for providers: sales page at /providers when checkout is configured, else intake only.
 * Stripe opens from that page (or from /providers/join if no Payment Link).
 * @returns {{ href: string }}
 */
export function getListingPayLink() {
  if (getStripeListingPaymentUrl()) return { href: "/providers" };
  return { href: "/providers/join" };
}

/** True when NEXT_PUBLIC_STRIPE_LISTING_URL (or legacy basic URL) is set. */
export function isListingCheckoutConfigured() {
  return Boolean(getStripeListingPaymentUrl());
}
