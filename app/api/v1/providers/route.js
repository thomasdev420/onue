import { NextResponse } from 'next/server';
import { publicProviderSnapshot, scoreProviders, taskWeights } from '@/app/lib/amplyRoute/engine';
import { loadProviders } from '@/app/lib/amplyRoute/loadProviders';
import { getSupabaseServiceRole } from '@/app/services/amplySelection/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const admin = getSupabaseServiceRole();
  const { providers, catalog_freshness } = await loadProviders(admin);
  const w = taskWeights(null, null);
  const { composite } = scoreProviders(providers, {
    budgetUsd: 0.01,
    latencyTargetMs: 200,
    workloadType: 'hybrid',
    filterComplexity: 'medium',
  });
  const items = Object.keys(providers).map((pid) =>
    publicProviderSnapshot(providers, pid, composite[pid]),
  );
  return NextResponse.json(
    { providers: items, default_scoring_weights: w, catalog_freshness: catalog_freshness ?? null },
    { headers: corsHeaders },
  );
}
