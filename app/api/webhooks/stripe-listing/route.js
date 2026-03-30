import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { amplyLog } from '@/app/lib/amplyRoute/amplyLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** @returns {Stripe} */
function stripeClient() {
  const key =
    process.env.STRIPE_SECRET_KEY?.trim() || 'sk_test_0000000000000000000000000000000000000000000000000000';
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' });
}

/**
 * Stripe → Amply: Payment Link / subscription lifecycle for catalog listings.
 * Configure STRIPE_WEBHOOK_SECRET and point the endpoint at /api/webhooks/stripe-listing
 * (Dashboard → Developers → Webhooks, or Payment Link “after payment” compatible events).
 */
export async function POST(request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    amplyLog({
      level: 'warn',
      msg: 'stripe_listing_webhook.misconfigured',
      detail: 'STRIPE_WEBHOOK_SECRET unset',
    });
    return NextResponse.json({ ok: false, detail: 'webhook not configured' }, { status: 503 });
  }

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ ok: false, detail: 'missing stripe-signature' }, { status: 400 });
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ ok: false, detail: 'invalid body' }, { status: 400 });
  }

  let event;
  try {
    const stripe = stripeClient();
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (e) {
    amplyLog({
      level: 'warn',
      msg: 'stripe_listing_webhook.signature_failed',
      detail: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ ok: false, detail: 'invalid signature' }, { status: 400 });
  }

  const allowed = new Set(
    (process.env.STRIPE_LISTING_WEBHOOK_EVENTS || 'checkout.session.completed,invoice.paid')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

  if (!allowed.has(event.type)) {
    amplyLog({ level: 'info', msg: 'stripe_listing_webhook.ignored_type', type: event.type });
    return NextResponse.json({ received: true, ignored: true });
  }

  const summary = summarizeListingEvent(event);
  amplyLog({
    level: 'info',
    msg: 'stripe_listing_webhook',
    stripe_event_id: event.id,
    stripe_event_type: event.type,
    ...summary,
  });

  await maybeNotifyListingEmail(event.type, summary);

  return NextResponse.json({ received: true });
}

function summarizeListingEvent(event) {
  const o = event.data?.object;
  if (event.type === 'checkout.session.completed' && o && typeof o === 'object') {
    return {
      payer_email: o.customer_details?.email || o.customer_email || null,
      payer_name: o.customer_details?.name || null,
      amount_total_cents: o.amount_total ?? null,
      currency: o.currency || null,
      session_id: o.id,
      payment_status: o.payment_status || null,
    };
  }
  if (event.type === 'invoice.paid' && o && typeof o === 'object') {
    const sub = o.subscription;
    return {
      payer_email: o.customer_email || null,
      amount_paid_cents: o.amount_paid ?? null,
      currency: o.currency || null,
      invoice_id: o.id,
      subscription_id: typeof sub === 'string' ? sub : sub?.id || null,
    };
  }
  return { note: 'minimal_summary', object_id: o && typeof o === 'object' ? o.id : null };
}

async function maybeNotifyListingEmail(eventType, summary) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  const to = process.env.LISTING_NOTIFY_EMAIL?.trim() || 'support@useamply.com';
  if (!apiKey || !from) {
    amplyLog({
      level: 'info',
      msg: 'stripe_listing_webhook.notify_skipped',
      reason: 'set RESEND_API_KEY and RESEND_FROM to email yourself on each event',
    });
    return;
  }

  const subject = `Amply listing: ${eventType}${summary.payer_email ? ` (${summary.payer_email})` : ''}`;
  const text = [
    `Event: ${eventType}`,
    `Time: ${new Date().toISOString()}`,
    '',
    JSON.stringify(summary, null, 2),
    '',
    'Fulfillment: see docs/operations/PROVIDER_LISTING_FULFILLMENT.md',
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    amplyLog({
      level: 'error',
      msg: 'stripe_listing_webhook.resend_failed',
      status: res.status,
      body_preview: body.slice(0, 400),
    });
  }
}
