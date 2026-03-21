import OpenAI from 'openai';

let openaiClient = null;

function getOpenAI() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is required for product normalization');
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Target shape for canonical product (matches AMPLY_ARCHITECTURE.md intent).
 */
export const CANONICAL_PRODUCT_JSON_SCHEMA_HINT = `{
  "name": string,
  "brand": string | null,
  "category": string,
  "niche": string,
  "price_hint": string | null,
  "differentiators": string[],
  "target_customer": string | null,
  "summary": string
}`;

/**
 * Normalize scraped text into canonical product JSON via structured LLM output.
 */
export async function normalizeToCanonicalProduct(pageContext) {
  const model = process.env.AMPLY_CANONICAL_MODEL || 'gpt-4o-mini';

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You extract a canonical product/brand record for AI shopping-assistant simulation.
Return ONLY valid JSON matching this shape:
${CANONICAL_PRODUCT_JSON_SCHEMA_HINT}
Use null where unknown. differentiators: max 5 short strings. summary: max 2 sentences.`,
      },
      {
        role: 'user',
        content: `Page URL: ${pageContext.url}
Title: ${pageContext.title || 'n/a'}
Meta: ${pageContext.metaDesc || 'n/a'}

Body excerpt:
${pageContext.excerpt}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty normalization response');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON from normalization model');
  }

  return {
    canonical: parsed,
    model,
    usage: completion.usage,
  };
}
