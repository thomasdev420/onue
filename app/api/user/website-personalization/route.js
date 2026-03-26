export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import { ingestProductFromUrl } from '../../../services/amplySelection/ingestProduct.js';

function normalizeInputUrl(raw) {
  const t = typeof raw === 'string' ? raw.trim() : '';
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function mapIngestToBusinessPayload(sourceUrl, canonical) {
  const host = (() => {
    try {
      return new URL(sourceUrl).hostname.replace(/^www\./i, '');
    } catch {
      return '';
    }
  })();

  const companyName =
    (canonical?.brand && String(canonical.brand).trim()) ||
    (canonical?.name && String(canonical.name).trim()) ||
    host ||
    'Your business';

  const productType =
    [canonical?.category, canonical?.niche].filter(Boolean).join(' · ') || 'General';

  const parts = [];
  if (canonical?.summary) parts.push(String(canonical.summary));
  if (Array.isArray(canonical?.differentiators) && canonical.differentiators.length) {
    parts.push(`Differentiators: ${canonical.differentiators.slice(0, 5).join('; ')}`);
  }
  if (canonical?.target_customer) parts.push(`Target: ${canonical.target_customer}`);
  const productInfo =
    parts.join('\n\n').trim() ||
    (canonical?.summary ? String(canonical.summary) : `Business context extracted from ${sourceUrl}.`);

  const extractedData = {
    companyName,
    productType,
    productInfo,
    companyUrl: sourceUrl,
  };

  const businessInfo = {
    companyName,
    productType,
    description: (canonical?.summary && String(canonical.summary)) || productInfo.slice(0, 800),
  };

  return { websiteUrl: sourceUrl, extractedData, businessInfo };
}

/**
 * POST { url } — fetch page, LLM-extract product/brand facts (same pipeline as AI Selection intake).
 * Client merges into existing onboarding work_data and calls saveUserWork.
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const isDev = process.env.NODE_ENV === 'development';
    // Local dev: allow scan without sign-in (same idea as /api/user/context).
    if (!session?.user?.email && !isDev) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const normalized = normalizeInputUrl(body?.url);
    if (!normalized) {
      return NextResponse.json({ error: 'Missing or invalid url' }, { status: 400 });
    }

    const ingested = await ingestProductFromUrl(normalized);
    const payload = mapIngestToBusinessPayload(ingested.sourceUrl, ingested.canonical);

    return NextResponse.json({
      ok: true,
      ...payload,
      canonical: ingested.canonical,
    });
  } catch (e) {
    console.error('website-personalization:', e);
    const message = e?.message || 'Scan failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
