/**
 * Domain-style query templates for AI selection simulation (MVP subset).
 * Filled with product name / category / niche.
 */

export function buildSimulationQueries(product, options = {}) {
  const count = Math.min(Math.max(options.count ?? 6, 3), 12);
  const name = product?.name || 'this product';
  const category = product?.category || 'products';
  const niche = product?.niche || category;

  const pool = [
    `What is the best ${category} to buy right now for everyday use? Name specific brands or products and say why.`,
    `I'm shopping for ${niche}. What are the top 3 options you'd recommend?`,
    `Compare the best ${category} in terms of value for money. Which one would you pick?`,
    `If I can only buy one ${category} this month, what should I get?`,
    `List the best ${niche} for someone on a budget, with one clear winner.`,
    `Experts often debate ${category}: what do you recommend and which product is the standout?`,
    `For ${niche}, which product is most trustworthy and recommended?`,
    `What ${category} would you suggest for a gift? Pick a single best option if possible.`,
  ];

  return pool.slice(0, count);
}
