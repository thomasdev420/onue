/**
 * Routing score engine (parity with amply-api/app/providers.py).
 */

const FILTER_COMPLEXITY = new Set(['low', 'medium', 'high']);
const WORKLOAD_TYPE = new Set(['insert_heavy', 'query_heavy', 'hybrid']);

const COST_QUOTE_DIM_CAP = 25_000;

function parseVectorCount(task) {
  const t = String(task).toLowerCase();
  let m = t.match(/(\d+(?:,\d{3})*|\d+)\s*k\b/);
  if (m) {
    const raw = m[1].replace(/,/g, '');
    return parseInt(raw, 10) * 1000;
  }
  m = t.match(/(\d+(?:,\d{3})*|\d+)\s*(?:million|m)\b/);
  if (m) {
    const raw = m[1].replace(/,/g, '');
    return Math.round(parseFloat(raw) * 1_000_000);
  }
  m = t.match(/\b(\d{4,})\s*(?:vector|vec|embedding|point)/);
  if (m) return parseInt(m[1].replace(/,/g, ''), 10);
  m = t.match(/store\s+(\d+(?:,\d{3})*|\d+)\b/);
  if (m) return parseInt(m[1].replace(/,/g, ''), 10);
  return 100_000;
}

export function estimateDimUnits(task, dimension, workloadType) {
  const dim = dimension && dimension > 0 ? dimension : 1536;
  const n = Math.max(1000, parseVectorCount(task));
  const base = n * dim;
  const wt = (workloadType || 'hybrid').toLowerCase();
  if (wt === 'insert_heavy') return base * 1.1;
  if (wt === 'query_heavy') return base * 0.35;
  return base * 0.65;
}

export function estimatedCostUsd(providers, pid, dimUnits) {
  const row = providers[pid];
  const perM = row.cost_per_1m_dims_usd;
  const basis = Math.min(Math.max(dimUnits, 1), COST_QUOTE_DIM_CAP);
  const millions = basis / 1_000_000;
  const raw = millions * perM;
  return { costUsd: Math.round(Math.max(raw, 0.0001) * 1e6) / 1e6, basis };
}

function minMaxNormalize(values, lowerIsBetter) {
  const vals = Object.values(values);
  if (!vals.length) return {};
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  if (Math.abs(hi - lo) < 1e-12) {
    return Object.fromEntries(Object.keys(values).map((k) => [k, 1]));
  }
  const out = {};
  for (const [k, v] of Object.entries(values)) {
    const t = (v - lo) / (hi - lo);
    out[k] = lowerIsBetter ? 1 - t : t;
  }
  return out;
}

function normalizeWeights(w) {
  const s = Object.values(w).reduce((a, b) => a + b, 0);
  if (s <= 0) {
    return { success: 0.25, latency: 0.25, cost: 0.25, reliability: 0.25 };
  }
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v / s]));
}

export function taskWeights(workloadType, filterComplexity) {
  let w = { success: 0.4, latency: 0.3, cost: 0.2, reliability: 0.1 };
  let wt = (workloadType || 'hybrid').toLowerCase();
  if (!WORKLOAD_TYPE.has(wt)) wt = 'hybrid';
  let fc = (filterComplexity || 'medium').toLowerCase();
  if (!FILTER_COMPLEXITY.has(fc)) fc = 'medium';

  if (wt === 'insert_heavy') {
    w = { ...w, latency: w.latency * 1.35, cost: w.cost * 0.9, success: w.success * 0.95 };
  } else if (wt === 'query_heavy') {
    w = { ...w, latency: w.latency * 0.92, cost: w.cost * 1.12, success: w.success * 1.02 };
  }
  if (fc === 'high') {
    w = { ...w, latency: w.latency * 1.15, success: w.success * 1.05 };
  } else if (fc === 'low') {
    w = { ...w, cost: w.cost * 1.08 };
  }
  return normalizeWeights(w);
}

export function scoreProviders(providers, options) {
  const {
    budgetUsd = 0.01,
    latencyTargetMs = 200,
    workloadType = null,
    filterComplexity = null,
  } = options;

  const ids = Object.keys(providers);
  const p99 = Object.fromEntries(ids.map((pid) => [pid, Number(providers[pid].p99_latency_ms)]));
  const cost = Object.fromEntries(
    ids.map((pid) => [pid, Number(providers[pid].cost_per_1m_dims_usd)]),
  );
  const success = Object.fromEntries(
    ids.map((pid) => [pid, Number(providers[pid].success_rate_last_24h)]),
  );
  const reliability = Object.fromEntries(ids.map((pid) => [pid, Number(providers[pid].win_rate)]));

  const latNorm = minMaxNormalize(p99, true);
  const costNorm = minMaxNormalize(cost, true);

  function costEffective(pid) {
    const c = cost[pid];
    if (budgetUsd > 0 && c > budgetUsd * 50) return costNorm[pid] * 0.85;
    return costNorm[pid];
  }

  function latEffective(pid) {
    if (latencyTargetMs > 0 && p99[pid] > latencyTargetMs * 3) return latNorm[pid] * 0.9;
    return latNorm[pid];
  }

  const w = taskWeights(workloadType, filterComplexity);
  const composite = {};
  const components = {};

  for (const pid of ids) {
    const comp = {
      success: success[pid],
      latency: latEffective(pid),
      cost: costEffective(pid),
      reliability: reliability[pid],
    };
    components[pid] = comp;
    composite[pid] = Object.keys(w).reduce((sum, k) => sum + comp[k] * w[k], 0);
  }

  const winner = ids.reduce((a, b) => (composite[a] >= composite[b] ? a : b));
  return { winner, composite, components };
}

export function buildWhy(providers, winner, runnerUp, dimension, workloadType) {
  const w = providers[winner];
  const dimNote = dimension ? `${dimension}-dim ` : '';
  let wt = (workloadType || 'hybrid').toLowerCase();
  if (!WORKLOAD_TYPE.has(wt)) wt = 'hybrid';
  const loadPhrase =
    wt === 'insert_heavy' ? 'insert-heavy ' : wt === 'query_heavy' ? 'query-heavy ' : 'hybrid ';

  const main = `Top composite score for ${dimNote}${loadPhrase}vector workloads (p99 ${w.p99_latency_ms} ms, $${w.cost_per_1m_dims_usd}/1M dims, ${(w.success_rate_last_24h * 100).toFixed(1)}% success last 24h).`;

  if (!runnerUp) return main;
  const r = providers[runnerUp];
  const reasons = [];
  if (w.p99_latency_ms < r.p99_latency_ms) {
    reasons.push(`slower p99 (${r.p99_latency_ms} ms vs ${w.p99_latency_ms} ms)`);
  }
  if (w.cost_per_1m_dims_usd < r.cost_per_1m_dims_usd) {
    reasons.push(`higher $/1M dims ($${r.cost_per_1m_dims_usd} vs $${w.cost_per_1m_dims_usd})`);
  }
  if (w.success_rate_last_24h > r.success_rate_last_24h) {
    reasons.push(
      `lower 24h success (${(r.success_rate_last_24h * 100).toFixed(1)}% vs ${(w.success_rate_last_24h * 100).toFixed(1)}%)`,
    );
  }
  if (!reasons.length) return main;
  return `${main} vs runner-up ${r.display_name}: ${reasons.slice(0, 2).join('; ')}.`;
}

export function publicProviderSnapshot(providers, pid, compositeScore) {
  const row = providers[pid];
  const listing = row.catalog_listing || 'organic';
  const out = {
    id: pid,
    display_name: row.display_name,
    p99_latency_ms: row.p99_latency_ms,
    cost_per_1m_dims_usd: row.cost_per_1m_dims_usd,
    success_rate_last_24h: row.success_rate_last_24h,
    success_rate_last_7d: row.success_rate_last_7d,
    win_rate: row.win_rate,
    catalog_listing: listing,
    placement_disclosure:
      listing === 'organic'
        ? 'Metrics only; no paid placement.'
        : 'Paid catalog placement — routing scores still use the same published metrics.',
  };
  if (compositeScore != null) out.live_composite_score = Math.round(compositeScore * 1e4) / 1e4;
  return out;
}
