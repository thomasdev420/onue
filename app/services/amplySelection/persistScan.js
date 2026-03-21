/**
 * Persist scan + query runs to Supabase (service role).
 */
export async function persistScanResult(supabase, { productId, result, status = 'completed', errorMessage = null }) {
  const { visibilityScore, selectionScore, queryRuns } = result;

  const { data: scanRow, error: scanError } = await supabase
    .from('amply_scans')
    .insert({
      product_id: productId,
      status,
      visibility_score: visibilityScore,
      selection_score: selectionScore,
      query_count: queryRuns?.length ?? 0,
      error_message: errorMessage,
      meta_jsonb: {
        providers: result.providers,
        queries: result.queries,
      },
    })
    .select('id')
    .single();

  if (scanError) {
    throw new Error(`Failed to insert scan: ${scanError.message}`);
  }

  const scanId = scanRow.id;

  if (queryRuns?.length) {
    const inserts = queryRuns.map((r) => ({
      scan_id: scanId,
      model: `${r.provider}:${r.model}`,
      query_text: r.queryText,
      raw_response: r.rawText || null,
      parsed_jsonb: r.parse || {},
      mentioned: r.parse?.mentioned ?? null,
      selected_as_best: r.parse?.selected_as_best ?? null,
      position_estimate: r.parse?.position_estimate ?? null,
    }));

    const { error: runsError } = await supabase.from('amply_query_runs').insert(inserts);
    if (runsError) {
      throw new Error(`Failed to insert query runs: ${runsError.message}`);
    }
  }

  return { scanId };
}
