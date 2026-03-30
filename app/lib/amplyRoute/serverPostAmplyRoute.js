import { amplyLog } from '@/app/lib/amplyRoute/amplyLog';

/**
 * Server-only: POST JSON to Amply routing (your deploy or https://www.useamply.com).
 * Never import from client components — keep the API key in env or server-only options.
 *
 * @param {Record<string, unknown>} body - task, dimension, workload_type, etc.
 * @param {{
 *   baseUrl?: string,
 *   apiKey?: string,
 *   fetchImpl?: typeof fetch
 * }} [options]
 * @returns {Promise<{ ok: true, data: Record<string, unknown>, wall_ms: number } | { ok: false, status: number, data?: Record<string, unknown>, wall_ms: number }>}
 */
export async function serverPostAmplyRoute(body, options = {}) {
  const baseRaw = (options.baseUrl ?? process.env.AMPLY_ROUTE_API_BASE ?? '').trim();
  const base = (baseRaw || 'https://www.useamply.com').replace(/\/$/, '');
  const apiKey = (options.apiKey ?? process.env.AMPLY_ROUTE_SERVER_KEY ?? '').trim();
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!apiKey) {
    amplyLog({
      level: 'error',
      msg: 'amply.server_route.misconfigured',
      detail: 'Set AMPLY_ROUTE_SERVER_KEY (server env) or pass options.apiKey',
    });
    return { ok: false, status: 0, wall_ms: 0 };
  }

  const t0 = Date.now();
  let res;
  try {
    res = await fetchImpl(`${base}/api/v1/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const wall_ms = Date.now() - t0;
    amplyLog({
      level: 'error',
      msg: 'amply.server_route.fetch_failed',
      wall_ms,
      err: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, status: 0, wall_ms };
  }

  const wall_ms = Date.now() - t0;
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    amplyLog({
      level: 'warn',
      msg: 'amply.server_route.http_error',
      status: res.status,
      request_id: data.request_id,
      detail: data.detail,
      wall_ms,
      compute_ms: data.compute_ms,
    });
    return { ok: false, status: res.status, data, wall_ms };
  }

  return { ok: true, data, wall_ms };
}
