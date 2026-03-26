/**
 * Amply Phase 0 — Next.js App Router API
 *
 * POST | GET /api/phase0
 * Same pipeline as scripts/amply-phase0-prototype.js (Pinecone: ampley-demo, 100 vectors, 10 queries).
 *
 * Env: PINECONE_API_KEY, optional PINECONE_SERVERLESS_REGION (default us-east-1)
 * Demo UI: /phase0-demo
 */

import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

/** Node runtime required for Pinecone SDK (not Edge). */
export const runtime = 'nodejs';

/** Always run fresh; no static caching of this route. */
export const dynamic = 'force-dynamic';

const INDEX_NAME = 'ampley-demo';
const DIMENSION = 8;
const METRIC = 'cosine';
const VECTOR_COUNT = 100;
const QUERY_RUNS = 10;
const TOP_K = 5;
const ESTIMATED_COST_PER_1M_OPS_USD = 12.4;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

function randomUnitVector(dim) {
  const v = Array.from({ length: dim }, () => Math.random() * 2 - 1);
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return null;
  const n = sortedAsc.length;
  const idx = Math.ceil((p / 100) * n) - 1;
  return sortedAsc[Math.max(0, Math.min(n - 1, idx))];
}

function scoreFromLatencyMs(p50) {
  const s = 1 - Math.min(p50 / 800, 0.25);
  return Math.round(Math.max(0.75, Math.min(0.99, s)) * 100) / 100;
}

async function ensureIndex(pc) {
  const { indexes = [] } = await pc.listIndexes();
  const existing = indexes.find((i) => i.name === INDEX_NAME);
  if (existing) {
    if (existing.dimension !== DIMENSION) {
      throw new Error(
        `Index "${INDEX_NAME}" exists with dimension ${existing.dimension}; expected ${DIMENSION}.`,
      );
    }
    console.log(`[phase0] index "${INDEX_NAME}" already exists (dim ${DIMENSION}, ${METRIC})`);
    return;
  }

  const region = process.env.PINECONE_SERVERLESS_REGION || 'us-east-1';
  console.log(`[phase0] creating index "${INDEX_NAME}" (serverless aws/${region})`);
  await pc.createIndex({
    name: INDEX_NAME,
    dimension: DIMENSION,
    metric: METRIC,
    spec: { serverless: { cloud: 'aws', region } },
    waitUntilReady: true,
    suppressConflicts: true,
  });
}

async function seedVectors(index) {
  const records = [];
  for (let i = 0; i < VECTOR_COUNT; i++) {
    records.push({
      id: `vec-${i}`,
      values: randomUnitVector(DIMENSION),
      metadata: {
        phase: 'phase0',
        idx: i,
        label: `dummy-${i}`,
        batch_id: `b${Math.floor(i / 20)}`,
      },
    });
  }
  await index.upsert({ records });
  console.log(`[phase0] upsert complete: ${VECTOR_COUNT} records (${DIMENSION}d unit vectors)`);
}

/**
 * Latency via Date.now() for consistent behavior in serverless / Vercel
 * (avoids relying on performance.now() semantics across runtimes).
 */
async function runQueries(index) {
  const latenciesMs = [];
  const errors = [];

  for (let q = 0; q < QUERY_RUNS; q++) {
    const vector = randomUnitVector(DIMENSION);
    const t0 = Date.now();
    try {
      await index.query({
        vector,
        topK: TOP_K,
        includeMetadata: true,
      });
      const ms = Date.now() - t0;
      latenciesMs.push(ms);
      console.log(`[phase0] query ${q} ok ${ms}ms (topK=${TOP_K})`);
    } catch (e) {
      errors.push({ query: q, message: e.message || String(e) });
      console.warn(`[phase0] query ${q} failed:`, e.message || e);
    }
  }

  return { latenciesMs, errors };
}

async function runPhase0Pipeline() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    const err = new Error('Missing PINECONE_API_KEY in environment (.env / .env.local).');
    err.statusCode = 503;
    throw err;
  }

  console.log('[phase0] pipeline start');
  const pc = new Pinecone({ apiKey });

  await ensureIndex(pc);
  const index = pc.index(INDEX_NAME);

  console.log('[phase0] upserting', VECTOR_COUNT, 'vectors');
  await seedVectors(index);

  console.log(`[phase0] running ${QUERY_RUNS} queries (topK=${TOP_K})`);
  const { latenciesMs, errors } = await runQueries(index);

  const sorted = [...latenciesMs].sort((a, b) => a - b);
  const successRate = QUERY_RUNS === 0 ? 0 : (QUERY_RUNS - errors.length) / QUERY_RUNS;

  const p50 = sorted.length ? percentile(sorted, 50) : null;
  const p95 = sorted.length ? percentile(sorted, 95) : null;
  const p99 = sorted.length ? percentile(sorted, 99) : null;

  const pineconeScore = p50 != null ? scoreFromLatencyMs(p50) : 0.85;

  console.log(
    '[phase0] latency summary ms — p50:',
    p50?.toFixed(1),
    'p95:',
    p95?.toFixed(1),
    'p99:',
    p99?.toFixed(1),
    'successRate:',
    successRate,
  );

  const result = {
    recommended: {
      provider: 'Pinecone',
      provider_id: 'pinecone_serverless',
      index: INDEX_NAME,
      confidence: pineconeScore,
    },
    rankings: [
      { provider_id: 'pinecone_serverless', rank: 1, score: pineconeScore },
      { provider_id: 'qdrant_cloud', rank: 2, score: 0.78 },
      { provider_id: 'weaviate_cloud', rank: 3, score: 0.71 },
    ],
    metrics: {
      p50_latency_ms: p50 != null ? Math.round(p50 * 10) / 10 : null,
      p95_latency_ms: p95 != null ? Math.round(p95 * 10) / 10 : null,
      p99_latency_ms: p99 != null ? Math.round(p99 * 10) / 10 : null,
      success_rate_7d: Math.round(successRate * 1000) / 1000,
      estimated_cost_per_1m_ops_usd: ESTIMATED_COST_PER_1M_OPS_USD,
    },
    why:
      `Pinecone is the only provider exercised in this Phase 0 run: index "${INDEX_NAME}" with ${VECTOR_COUNT} random ` +
      `${DIMENSION}d unit vectors (${METRIC}). Measured p50≈${p50?.toFixed(1) ?? 'n/a'}ms over ${QUERY_RUNS} queries with ` +
      `${(successRate * 100).toFixed(0)}% success in this sample. It is recommended for this workload because it is the ` +
      `live backend under test; qdrant_cloud and weaviate_cloud ranks are illustrative placeholders.`,
    errors: errors.length ? errors : undefined,
    prototype: {
      query_runs: QUERY_RUNS,
      vectors_upserted: VECTOR_COUNT,
      note: 'success_rate_7d is derived from the 10 prototype queries, not production 7-day telemetry.',
    },
  };

  console.log('[phase0] pipeline done — successful queries:', latenciesMs.length, '/', QUERY_RUNS);
  return result;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST() {
  try {
    const payload = await runPhase0Pipeline();
    return NextResponse.json(payload, { status: 200, headers: corsHeaders });
  } catch (e) {
    const code = e.statusCode || 500;
    console.error('[phase0] pipeline error:', e.message || e);
    return NextResponse.json(
      { error: true, message: e.message || String(e) },
      { status: code, headers: corsHeaders },
    );
  }
}

export async function GET() {
  return POST();
}
