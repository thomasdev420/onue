export class AmplyApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown);
}

export type WorkloadType = 'insert_heavy' | 'query_heavy' | 'hybrid';
export type FilterComplexity = 'low' | 'medium' | 'high';

export interface RouteTaskOptions {
  baseUrl?: string;
  apiKey: string;
  task: string;
  dimension?: number;
  workloadType?: WorkloadType;
  filterComplexity?: FilterComplexity;
  budgetUsd?: number;
  latencyTargetMs?: number;
}

export interface RouteTaskResponse {
  recommended: string;
  score: number;
  estimated_cost_usd: number;
  expected_p99_latency_ms: number;
  success_rate_last_24h: number;
  success_rate_last_7d: number;
  why: string;
  request_id: string;
  compute_ms: number;
  raw_metrics?: Record<string, unknown>;
}

export function routeTask(opts: RouteTaskOptions): Promise<RouteTaskResponse>;
