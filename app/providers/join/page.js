import { redirect } from "next/navigation";

/** Legacy URL from older funnels; listing is Stripe-only now. */
export default function ProviderJoinRedirectPage() {
  redirect("/providers");
}
