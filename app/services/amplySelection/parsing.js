import OpenAI from 'openai';

let openaiClient = null;

function getOpenAI() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is required for parsing');
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Parse assistant answer: was the tracked product mentioned / chosen / ranked?
 */
export async function parseAssistantAnswer(rawText, canonicalProduct) {
  const model = process.env.AMPLY_PARSE_MODEL || 'gpt-4o-mini';
  const openai = getOpenAI();

  const productName = canonicalProduct?.name || '';
  const brand = canonicalProduct?.brand || '';

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You evaluate an AI assistant reply for a business monitoring "AI selection".
Return ONLY JSON:
{
  "mentioned": boolean,
  "selected_as_best": boolean,
  "position_estimate": number | null,
  "confidence": number,
  "reason": string (short)
}
Rules:
- mentioned: true if the product/brand is clearly referenced (name or unmistakable alias).
- selected_as_best: true if this product is the single recommended choice OR tied for #1.
- position_estimate: 1 = top pick, 2 = second, etc. null if not ranked/list not clear.
- confidence: 0-1 how sure you are.`,
      },
      {
        role: 'user',
        content: `Target product name: ${productName}
Target brand: ${brand || 'n/a'}

Assistant reply:
---
${rawText.slice(0, 8000)}
---`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty parse response');

  const parsed = JSON.parse(raw);
  return {
    mentioned: Boolean(parsed.mentioned),
    selected_as_best: Boolean(parsed.selected_as_best),
    position_estimate:
      typeof parsed.position_estimate === 'number' ? parsed.position_estimate : null,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    reason: typeof parsed.reason === 'string' ? parsed.reason : '',
    model,
  };
}

/**
 * Aggregate runs into 0-100 style scores (MVP heuristic).
 */
export function aggregateScores(runs) {
  const valid = runs.filter((r) => r.rawText && !r.skipped && r.parse);
  if (valid.length === 0) {
    return { visibilityScore: 0, selectionScore: 0, runs: valid.length };
  }

  let mentionWeight = 0;
  let selectWeight = 0;
  let wSum = 0;

  for (const r of valid) {
    const w = r.parse?.confidence ?? 0.5;
    wSum += w;
    if (r.parse?.mentioned) mentionWeight += w;
    if (r.parse?.selected_as_best) selectWeight += w;
  }

  const visibilityScore = wSum > 0 ? Math.round((mentionWeight / wSum) * 1000) / 10 : 0;
  const selectionScore = wSum > 0 ? Math.round((selectWeight / wSum) * 1000) / 10 : 0;

  return { visibilityScore, selectionScore, runs: valid.length };
}
