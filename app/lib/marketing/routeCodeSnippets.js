import { buildCurlSnippet, DEFAULT_TASK } from '@/app/lib/amplyCurlSnippet';

/** @param {string} baseNoTrail */
export function snippetCurl(baseNoTrail) {
  return buildCurlSnippet(`${baseNoTrail}/api/v1/route`, DEFAULT_TASK);
}

/** @param {string} baseNoTrail e.g. https://www.useamply.com */
export function snippetTypeScript(baseNoTrail) {
  return `import { routeTask } from "amply-sdk";

const result = await routeTask({
  baseUrl: "${baseNoTrail}",
  apiKey: process.env.AMPLY_API_KEY!,
  task: ${JSON.stringify(DEFAULT_TASK)},
  dimension: 1536,
  workloadType: "hybrid",
  filterComplexity: "high",
});

console.log(result.recommended, result.score);
console.log(result.why);`;
}

/** @param {string} baseNoTrail */
export function snippetPython(baseNoTrail) {
  return `import os
from amply_sdk import route_task

result = route_task(
    base_url="${baseNoTrail}",
    api_key=os.environ["AMPLY_API_KEY"],
    task=${JSON.stringify(DEFAULT_TASK)},
    dimension=1536,
    workload_type="hybrid",
    filter_complexity="high",
)
print(result["recommended"], result.get("score"))
print(result.get("why"))`;
}

/** @param {string} origin window.location.origin */
export function defaultBaseUrl(origin) {
  if (origin && /^https?:\/\//i.test(origin)) {
    return origin.replace(/\/$/, '');
  }
  return 'https://www.useamply.com';
}
