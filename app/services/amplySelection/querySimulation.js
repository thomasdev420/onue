import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

let openaiClient = null;
let anthropicClient = null;

function getOpenAI() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is required');
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function getAnthropic() {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Simulate a shopper asking an AI assistant (no browsing tools; plain completion).
 */
export async function runSimulatedQuery(queryText, provider, productHint) {
  const system = `You are a helpful shopping assistant. Answer as you normally would for a user choosing products. Be specific with brand and product names when you can. Keep the answer under 350 words.`;

  const user = productHint
    ? `${queryText}\n\n(Context: the business cares whether their offering "${productHint}" appears in your answer.)`
    : queryText;

  if (provider === 'openai') {
    const model = process.env.AMPLY_SIMULATION_MODEL_OPENAI || 'gpt-4o-mini';
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    const text = completion.choices[0]?.message?.content || '';
    return { provider, model, text, usage: completion.usage };
  }

  if (provider === 'anthropic') {
    const client = getAnthropic();
    if (!client) {
      return { provider, model: 'skipped', text: '', skipped: true, reason: 'ANTHROPIC_API_KEY not set' };
    }
    const model = process.env.AMPLY_SIMULATION_MODEL_CLAUDE || 'claude-3-5-haiku-20241022';
    const msg = await client.messages.create({
      model,
      max_tokens: 900,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const block = msg.content?.find((b) => b.type === 'text');
    const text = block?.text || '';
    return { provider, model, text, usage: { input_tokens: msg.usage?.input_tokens, output_tokens: msg.usage?.output_tokens } };
  }

  throw new Error(`Unknown provider: ${provider}`);
}

export function getDefaultProviders() {
  const providers = ['openai'];
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push('anthropic');
  }
  return providers;
}
