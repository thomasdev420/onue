import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { safeNewUrl } from '../../utils/safeNewUrl';

const MAX_CHARS = 12000;

/**
 * Fetch URL and return plain text excerpt for LLM ingestion (MVP: no Playwright).
 */
export async function fetchPageText(url) {
  const normalized = safeNewUrl(url);
  if (!normalized) {
    throw new Error('Invalid or disallowed URL');
  }

  const pageUrl = normalized.href;

  const res = await fetch(pageUrl, {
    headers: {
      'User-Agent': 'AmplySelectionBot/1.0 (+https://amply)',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch page: HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  $('script, style, nav, footer, iframe, noscript').remove();

  const title = $('title').first().text().trim() || '';
  const metaDesc =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    '';

  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const excerpt = [title, metaDesc, bodyText].filter(Boolean).join('\n\n').slice(0, MAX_CHARS);

  return { url: pageUrl, title, metaDesc, excerpt };
}
