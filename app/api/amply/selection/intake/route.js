export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { ingestProductFromUrl } from '../../../../services/amplySelection/ingestProduct.js';
import { getSupabaseServiceRole, isSupabaseServiceConfigured } from '../../../../services/amplySelection/supabaseAdmin.js';
import { getSelectionUserEmail } from '../_auth.js';

/**
 * POST { url }: scrape + LLM canonical product, persist amply_products.
 */
export async function POST(request) {
  try {
    const userEmail = await getSelectionUserEmail();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseServiceConfigured()) {
      return NextResponse.json(
        {
          error: 'Supabase service role not configured',
          hint: 'Set SUPABASE_SERVICE_ROLE_KEY and run database_setup_amply_selection.sql in Supabase SQL editor.',
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const url = typeof body?.url === 'string' ? body.url.trim() : '';
    if (!url) {
      return NextResponse.json({ error: 'Missing "url" in JSON body' }, { status: 400 });
    }

    const ingested = await ingestProductFromUrl(url);

    const supabase = getSupabaseServiceRole();
    const { data, error } = await supabase
      .from('amply_products')
      .insert({
        user_id: userEmail,
        source_type: ingested.sourceType,
        source_url: ingested.sourceUrl,
        canonical_jsonb: ingested.canonical,
        raw_page_excerpt: ingested.rawPageExcerpt,
      })
      .select('id')
      .single();

    if (error) {
      console.error('amply_products insert:', error);
      return NextResponse.json(
        { error: error.message, hint: 'Ensure amply_products table exists (database_setup_amply_selection.sql)' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      productId: data.id,
      canonical: ingested.canonical,
      sourceUrl: ingested.sourceUrl,
    });
  } catch (e) {
    console.error('selection intake:', e);
    return NextResponse.json({ error: e.message || 'Intake failed' }, { status: 500 });
  }
}
