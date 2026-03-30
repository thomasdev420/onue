# Provider catalog listing: fulfillment runbook

Internal checklist after a customer pays for a catalog listing (Stripe Payment Link, **$249/mo** as of site copy). Customer email comes from Stripe (checkout receipt and **GET Stripe → Customers / Payment** or webhook payload).

## 1. Confirm payment

- In [Stripe Dashboard](https://dashboard.stripe.com), open the successful Payment / Subscription / Checkout session.
- Note **customer email** (and name if present). This is the primary contact for outreach.

## 2. Verify identity (light touch)

- Optional: confirm the domain or product matches a real infrastructure vendor (vector DB, embeddings, inference, adjacent).
- If email is missing or looks wrong, use Stripe customer record or dispute flow before spending editorial time.

## 3. Collect listing assets (email)

Send a short email from `support@useamply.com` (or your ops inbox) asking for:

- Company legal / display name
- Product name as it should appear in the catalog
- Logo (PNG or SVG, readable at small size)
- One-line description (under ~160 characters recommended)
- Optional: docs URL, regions, category preference

Reply **SLA target**: within **~2 business days** after you have what you need (align with marketing copy).

## 4. Update catalog / API surface

- Add or update the provider row in the catalog source (Postgres / Supabase as configured for `GET /api/v1/providers`).
- Set **`catalog_listing`** to the appropriate paid label (e.g. `basic_listing`) so disclosure stays honest.
- Confirm the row appears on **`/catalog`** and in **`GET /api/v1/providers`** with correct placement badge.

## 5. Close the loop

- Reply to the customer with the live catalog URL and any caveats (e.g. metrics refresh cadence).
- If they need changes later, treat as support (same thread).

## Refunds & failed payments

**Refunds:** Listing fees are **non-refundable** after fulfillment has started (review or publication), except where law requires otherwise (see Terms). If they cancel **before** you’ve started review, you may refund at your discretion via Stripe.

**Failed renewals:** Subscription failed? Stripe will retry per your Stripe settings. Pause or remove paid placement if the subscription stays unpaid; document the decision internally. Use plain language in email: payment didn’t go through, fix card in Stripe customer portal (if enabled), or contact support.

## Automation

- Webhook: **`POST /api/webhooks/stripe-listing`** (see `deploy-setup.md`) logs `stripe_listing_webhook` events and can email **`LISTING_NOTIFY_EMAIL`** via Resend when configured.
