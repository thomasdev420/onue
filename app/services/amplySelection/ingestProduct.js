import { fetchPageText } from './fetchPageText.js';
import { normalizeToCanonicalProduct } from './canonicalProduct.js';
import { AmplySelectionEvents } from './events.js';

/**
 * Ingest product from public URL to canonical JSON (MVP).
 */
export async function ingestProductFromUrl(url) {
  const page = await fetchPageText(url);
  const { canonical, model, usage } = await normalizeToCanonicalProduct(page);

  return {
    event: AmplySelectionEvents.PRODUCT_INGESTED,
    sourceType: 'url',
    sourceUrl: page.url,
    canonical,
    rawPageExcerpt: page.excerpt.slice(0, 4000),
    normalizationModel: model,
    usage,
  };
}
