import { NextResponse } from 'next/server';

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
      version: '1.0.5-mvp',
      description:
        'Machine-friendly vector routing: scores providers from catalog metrics (Supabase Postgres).',
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
              description: 'ok, data_mode, diagnostics, catalog_freshness, auth_mode, rate_limit',
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
              description: 'recommended, score, raw_metrics, request_id',
            },
            '400': { description: 'Validation error' },
            '401': { description: 'When AMPLY_API_KEYS is set: missing/invalid Bearer token' },
            '429': { description: 'When rate limit enabled (AMPLY_V1_RATE_LIMIT_PER_MIN)' },
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
