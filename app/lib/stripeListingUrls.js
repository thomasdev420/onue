/**
 * Stripe Payment Link URLs (NEXT_PUBLIC_* — set in Vercel, redeploy).
 * @param {'basic_listing' | 'featured' | 'sponsored_top3'} tierKey
 * @returns {string} URL or ''
 */
export function getStripeListingUrl(tierKey) {
  const map = {
    basic_listing: process.env.NEXT_PUBLIC_STRIPE_LISTING_BASIC_URL,
    featured: process.env.NEXT_PUBLIC_STRIPE_LISTING_FEATURED_URL,
    sponsored_top3: process.env.NEXT_PUBLIC_STRIPE_LISTING_SPOTLIGHT_URL,
  };
  const raw = map[tierKey];
  return typeof raw === "string" ? raw.trim() : "";
}
