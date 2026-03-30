/** Single source for marketing pricing tables (homepage + /pricing). */

export const PRICING_DISCLAIMER =
  "Design partner pricing — quotas are our targets while usage metering and Stripe checkout roll out. Overage may be invoiced during the pilot; fair-use limits apply to prevent abuse.";

export const PRICING_COLUMNS = [
  { key: "free", title: "Free", priceLine: "$0" },
  { key: "pro", title: "Pro", priceLine: "$29/mo" },
  { key: "enterprise", title: "Enterprise", priceLine: "Custom" },
];

export const PRICING_ROWS = [
  {
    label: "Monthly routing calls (POST /api/v1/route)",
    free: "10,000 included",
    pro: "100,000 included",
    enterprise: "Volume commits & private terms",
  },
  {
    label: "Overage",
    free: "— (upgrade or pause)",
    pro: "$0.25 per 1,000 calls",
    enterprise: "Contracted $/M calls",
  },
  {
    label: "Burst / rate limit",
    free: "Up to ~120 req/min per IP (shared)",
    pro: "Same class; higher tiers on request",
    enterprise: "Dedicated capacity & SLAs",
  },
  {
    label: "Support",
    free: "Docs & community",
    pro: "Email (business hours)",
    enterprise: "Dedicated + Slack",
  },
  {
    label: "Deployment",
    free: "Amply Cloud",
    pro: "Amply Cloud",
    enterprise: "VPC, SSO, audit logs (roadmap)",
  },
];
