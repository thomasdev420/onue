import { NextResponse } from 'next/server';
import { amplyLog } from '@/app/lib/amplyRoute/amplyLog';
import { getPlatformMetricsSnapshot } from '@/app/lib/amplyRoute/routeDecisionLog';
import { withV1TraceHeaders } from '@/app/lib/amplyRoute/v1TraceHeaders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

const METHODOLOGY =
  'Each count is one successful POST /api/v1/route response (HTTP 200). ' +
  '"Listed" decisions are those where the winning provider had a paid catalog tier (catalog_listing other than organic) at routing time. ' +
  'Category is taken from the live catalog row. Optional body.referral_tag on POST /api/v1/route stores an attribution token (e.g. campaign or ?ref=) for future breakdowns.';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request) {
  const requestId = crypto.randomUUID();
  const t0 = performance.now();
  const selfUrl = new URL(request.url);

  const snap = await getPlatformMetricsSnapshot();
  const computeMs = performance.now() - t0;
  const computeRounded = Math.round(computeMs);

  amplyLog({
    level: 'info',
    msg: 'v1.platform_metrics',
    request_id: requestId,
    compute_ms: computeRounded,
    telemetry_ready: snap.telemetry_ready,
    decisions_last_30d: snap.decisions_last_30d,
  });

  return NextResponse.json(
    {
      ok: true,
      methodology: METHODOLOGY,
      methodology_url: `${selfUrl.origin}${selfUrl.pathname}`,
      ...snap,
      request_id: requestId,
      compute_ms: computeRounded,
    },
    { headers: withV1TraceHeaders(corsHeaders, { requestId, computeMs }) },
  );
}
