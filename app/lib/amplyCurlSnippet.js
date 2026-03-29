/** Shared curl builder for landing + API console (same payload contract). */

export const DEFAULT_TASK =
  'store 100k 1536 dimensional vectors with metadata filters and run 50 similarity queries';

export function buildPayload(task) {
  return {
    task: task.trim() || DEFAULT_TASK,
    dimension: 1536,
    workload_type: 'hybrid',
    filter_complexity: 'high',
  };
}

/** Bash-safe single-quoted string: wrap in '...' with '\'' for embedded quotes */
export function bashSingleQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

export function buildCurlSnippet(routeUrl, taskInput) {
  const payload = buildPayload(taskInput);
  const bodyCompact = JSON.stringify(payload);
  const d = bashSingleQuote(bodyCompact);
  return `curl -s -X POST "${routeUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d ${d}`;
}
