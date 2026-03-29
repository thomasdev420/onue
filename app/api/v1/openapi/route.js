import { NextResponse } from 'next/server';
import { AMPLY_PRODUCT_VERSION } from '@/app/lib/amplyProductVersion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

function buildSpec(baseUrl) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Amply Routing API',
      version: AMPLY_PRODUCT_VERSION,
      description:
        'Machine-friendly vector routing: scores providers from catalog metrics (Supabase Postgres).\n\n' +
        'Latency semantics: **Wall RTT** is full client round-trip (network + edge). **Server compute** is handler time only—use JSON `compute_ms` and the `X-Amply-Compute-Ms` response header (and `compute_*` fields from scripts/synthetic-probe.mjs) for SLO tracking; the ~200ms product bar applies to server compute, not necessarily to wall RTT from arbitrary clients or CI runners.',
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/api/v1/openapi': {
        get: {
          summary: 'OpenAPI document',
          operationId: 'getOpenApi',
          responses: { '200': { description: 'This document (JSON)' } },
        },
      },
      '/api/v1/status': {
        get: {
          summary: 'Health and catalog diagnostics',
          operationId: 'getStatus',
          responses: {
            '200': {
              description:
                'ok, data_mode, diagnostics (includes catalog_metrics_age_hours, catalog_metrics_stale vs AMPLY_CATALOG_STALE_AFTER_HOURS), catalog_freshness, auth_mode, rate_limit, request_id, compute_ms (handler time only). Headers: X-Amply-Request-Id, X-Amply-Compute-Ms (matches compute_ms). Wall RTT is not the same as compute_ms.',
            },
          },
        },
      },
      '/api/v1/providers': {
        get: {
          summary: 'Public provider snapshot with default composite scores',
          operationId: 'listProviders',
          responses: { '200': { description: 'providers[], default_scoring_weights' } },
        },
      },
      '/api/v1/route': {
        post: {
          summary: 'Recommend a vector DB provider for a task',
          operationId: 'postRoute',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['task'],
                  properties: {
                    task: { type: 'string', description: 'Workload description (1–8000 chars)' },
                    budget_usd: { type: 'number', minimum: 0 },
                    latency_target_ms: { type: 'number', minimum: 0 },
                    dimension: { type: 'integer', minimum: 1, maximum: 65536 },
                    filter_complexity: { enum: ['low', 'medium', 'high'] },
                    workload_type: { enum: ['insert_heavy', 'query_heavy', 'hybrid'] },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description:
                'recommended, score, raw_metrics, request_id, compute_ms (handler time only). Headers: X-Amply-Request-Id, X-Amply-Compute-Ms. Compare compute_ms across deploys; wall RTT depends on client location.',
            },
            '400': { description: 'Validation error; body includes request_id when applicable' },
            '401': { description: 'When AMPLY_API_KEYS is set: missing/invalid Bearer token + request_id' },
            '429': { description: 'When rate limit enabled (AMPLY_V1_RATE_LIMIT_PER_MIN) + request_id' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Optional. Required only if AMPLY_API_KEYS is set on the server.',
        },
      },
    },
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request) {
  const origin = new URL(request.url).origin;
  return NextResponse.json(buildSpec(origin), { headers: corsHeaders });
}
