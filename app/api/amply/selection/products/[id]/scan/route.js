export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { executeSelectionScan } from '../../../../../../services/amplySelection/runScan.js';
import { persistScanResult } from '../../../../../../services/amplySelection/persistScan.js';
import { getSupabaseServiceRole, isSupabaseServiceConfigured } from '../../../../../../services/amplySelection/supabaseAdmin.js';
import { getSelectionUserEmail } from '../../../_auth.js';

/**
 * POST: run visibility/selection simulation for a stored product.
 */
export async function POST(request, context) {
  try {
    const userEmail = await getSelectionUserEmail();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isSupabaseServiceConfigured()) {
      return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 503 });
    }

    const { id: productId } = await context.params;
    if (!productId) {
      return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
    }

    const supabase = getSupabaseServiceRole();

    const { data: product, error: pErr } = await supabase
      .from('amply_products')
      .select('id, canonical_jsonb')
      .eq('id', productId)
      .eq('user_id', userEmail)
      .maybeSingle();

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }
    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const queryCount = typeof body?.queryCount === 'number' ? body.queryCount : undefined;

    let result;
    try {
      result = await executeSelectionScan(product.canonical_jsonb, { queryCount });
    } catch (scanErr) {
      console.error('executeSelectionScan:', scanErr);
      await persistScanResult(supabase, {
        productId,
        result: {
          visibilityScore: 0,
          selectionScore: 0,
          queryRuns: [],
          providers: [],
          queries: [],
        },
        status: 'failed',
        errorMessage: scanErr.message,
      });
      return NextResponse.json({ error: scanErr.message || 'Scan failed' }, { status: 500 });
    }

    const { scanId } = await persistScanResult(supabase, { productId, result });

    return NextResponse.json({
      scanId,
      visibilityScore: result.visibilityScore,
      selectionScore: result.selectionScore,
      queryCount: result.queryRuns?.length ?? 0,
      providers: result.providers,
      summary: {
        runs: result.queryRuns.map((r) => ({
          provider: r.provider,
          model: r.model,
          query: r.queryText,
          mentioned: r.parse?.mentioned ?? null,
          selectedAsBest: r.parse?.selected_as_best ?? null,
          skipped: Boolean(r.skipped),
        })),
      },
    });
  } catch (e) {
    console.error('selection scan POST:', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
