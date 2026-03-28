/**
 * Single source of truth for product + public API version strings (Next.js app).
 * Set NEXT_PUBLIC_AMPLY_PRODUCT_VERSION in env to override (shown in UI + /api/v1/status).
 */
const raw =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_AMPLY_PRODUCT_VERSION?.trim()) ||
  (typeof process !== "undefined" && process.env.AMPLY_PRODUCT_VERSION?.trim()) ||
  "3.1.11";

export const AMPLY_PRODUCT_VERSION = raw;

/** Display label e.g. v3.1.11 */
export function amplyVersionLabel() {
  return `v${AMPLY_PRODUCT_VERSION}`;
}
