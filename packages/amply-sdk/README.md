# amply-sdk

Official JavaScript / TypeScript client for the [Amply](https://www.useamply.com) routing API (`POST /api/v1/route`).

## Install

```bash
npm install amply-sdk
```

If the package is not yet on npm, install from the monorepo:

```bash
npm install github:thomasdev420/onue#main:packages/amply-sdk
```

## Quick usage

```ts
import { routeTask } from "amply-sdk";

const result = await routeTask({
  apiKey: process.env.AMPLY_API_KEY!,
  task: "Store 1M 1536-dim vectors with metadata filters and low-latency queries",
  dimension: 1536,
  workloadType: "hybrid",
  filterComplexity: "high",
});

console.log(result.recommended, result.why);
```

## Requirements

Node.js **18+** (global `fetch`). For older Node, polyfill `fetch` or use `undici`.

## License

MIT
