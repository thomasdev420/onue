/**
 * One JSON line per event for Vercel log drains (grep-friendly); drains can forward to APM.
 * Set AMPLY_LOG_STRUCTURED=0 for human-readable console (local debug).
 */

function shouldStructured() {
  if (process.env.AMPLY_LOG_STRUCTURED === '0') return false;
  return true;
}

/**
 * @param {Record<string, unknown>} event
 */
export function amplyLog(event) {
  const base = {
    ts: new Date().toISOString(),
    svc: 'amply',
    ...event,
  };
  if (shouldStructured()) {
    console.log(JSON.stringify(base));
    return;
  }
  const msg = typeof event.msg === 'string' ? event.msg : event.message || 'event';
  console.log(`[amply] ${msg}`, event);
}
