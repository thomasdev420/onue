/**
 * @typedef {Object} RouteTaskOptions
 * @property {string} [baseUrl='https://www.useamply.com']
 * @property {string} apiKey
 * @property {string} task
 * @property {number} [dimension]
 * @property {'insert_heavy'|'query_heavy'|'hybrid'} [workloadType]
 * @property {'low'|'medium'|'high'} [filterComplexity]
 * @property {number} [budgetUsd]
 * @property {number} [latencyTargetMs]
 */

const DEFAULT_BASE = 'https://www.useamply.com';

export class AmplyApiError extends Error {
  /**
   * @param {number} status
   * @param {unknown} body
   */
  constructor(status, body) {
    super(typeof body?.detail === 'string' ? body.detail : `Amply API error HTTP ${status}`);
    this.name = 'AmplyApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * @param {RouteTaskOptions} opts
 * @returns {Promise<Record<string, unknown>>}
 */
export async function routeTask(opts) {
  const {
    baseUrl = DEFAULT_BASE,
    apiKey,
    task,
    dimension,
    workloadType,
    filterComplexity,
    budgetUsd,
    latencyTargetMs,
  } = opts;

  if (!apiKey || typeof apiKey !== 'string') {
    throw new TypeError('apiKey is required');
  }
  if (!task || typeof task !== 'string') {
    throw new TypeError('task is required');
  }

  const origin = baseUrl.replace(/\/$/, '');
  const url = `${origin}/api/v1/route`;

  /** @type {Record<string, unknown>} */
  const payload = { task: task.trim() };
  if (dimension != null) payload.dimension = dimension;
  if (workloadType != null) payload.workload_type = workloadType;
  if (filterComplexity != null) payload.filter_complexity = filterComplexity;
  if (budgetUsd != null) payload.budget_usd = budgetUsd;
  if (latencyTargetMs != null) payload.latency_target_ms = latencyTargetMs;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  /** @type {Record<string, unknown>} */
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new AmplyApiError(res.status, { detail: text.slice(0, 300) });
  }

  if (!res.ok) {
    throw new AmplyApiError(res.status, data);
  }

  return data;
}
