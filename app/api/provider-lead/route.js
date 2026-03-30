import { NextResponse } from 'next/server';
import { amplyLog } from '@/app/lib/amplyRoute/amplyLog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TIER = new Set(['unsure', 'basic_listing', 'featured', 'sponsored_top3', 'enterprise_call']);

/**
 * Provider intake: logs structured event (Vercel logs / drains). Follow up manually or wire Resend later.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, detail: 'Invalid JSON' }, { status: 400 });
  }

  const company = typeof body.company === 'string' ? body.company.trim().slice(0, 200) : '';
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 320) : '';
  const providerName = typeof body.provider_name === 'string' ? body.provider_name.trim().slice(0, 200) : '';
  const tierInterest =
    typeof body.tier_interest === 'string' ? body.tier_interest.trim() : 'unsure';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : '';

  if (!company || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, detail: 'company and valid email are required' },
      { status: 400 },
    );
  }
  const tier = TIER.has(tierInterest) ? tierInterest : 'unsure';

  amplyLog({
    level: 'info',
    msg: 'provider_lead.intake',
    company,
    email,
    provider_name: providerName || null,
    tier_interest: tier,
    message_preview: message ? message.slice(0, 240) : null,
  });

  return NextResponse.json({
    ok: true,
    detail:
      'Received. We review listings within ~2 business days after payment or call — see email confirmation when Stripe/Calendly is connected.',
  });
}
