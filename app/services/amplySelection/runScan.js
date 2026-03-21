import { buildSimulationQueries } from './queryTemplates.js';
import { runSimulatedQuery, getDefaultProviders } from './querySimulation.js';
import { parseAssistantAnswer, aggregateScores } from './parsing.js';

/**
 * Execute a full selection scan (sync MVP; queue later).
 */
export async function executeSelectionScan(canonicalProduct, options = {}) {
  const queryCount = options.queryCount ?? Number(process.env.AMPLY_SCAN_QUERY_COUNT || 6);
  const providers = options.providers || getDefaultProviders();

  const queries = buildSimulationQueries(canonicalProduct, { count: queryCount });
  const productHint = [canonicalProduct?.name, canonicalProduct?.brand].filter(Boolean).join(' | ');

  const rows = [];

  for (const queryText of queries) {
    for (const provider of providers) {
      const sim = await runSimulatedQuery(queryText, provider, productHint);
      if (sim.skipped) {
        rows.push({
          queryText,
          provider,
          model: sim.model,
          rawText: '',
          skipped: true,
          reason: sim.reason,
          parse: null,
        });
        continue;
      }

      const parse = await parseAssistantAnswer(sim.text, canonicalProduct);
      rows.push({
        queryText,
        provider,
        model: sim.model,
        rawText: sim.text,
        usage: sim.usage,
        parse,
      });
    }
  }

  const { visibilityScore, selectionScore } = aggregateScores(rows);

  return {
    queries,
    providers,
    visibilityScore,
    selectionScore,
    queryRuns: rows,
  };
}
