export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getSupabaseServiceRole, isSupabaseServiceConfigured } from '../../../../../services/amplySelection/supabaseAdmin.js';
import { getSelectionUserEmail } from '../../_auth.js';

export async function GET(request, context) {
  try {
    const userEmail = await getSelectionUserEmail();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseServiceConfigured()) {
      return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 503 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
    }

    const supabase = getSupabaseServiceRole();

    const { data: product, error: pErr } = await supabase
      .from('amply_products')
      .select('id, source_url, source_type, canonical_jsonb, created_at')
      .eq('id', id)
      .eq('user_id', userEmail)
      .maybeSingle();

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }
    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: latestScan } = await supabase
      .from('amply_scans')
      .select('id, status, visibility_score, selection_score, query_count, created_at, meta_jsonb')
      .eq('product_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ product, latestScan: latestScan || null });
  } catch (e) {
    console.error('selection product GET:', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
