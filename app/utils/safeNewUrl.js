export function safeNewUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    return new URL(url);
  } catch {
    return null;
  }
} 