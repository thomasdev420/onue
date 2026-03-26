/** 15-minute UTC bucket label (parity with amply-api main.py). */
export function benchmarkTimestampIso() {
  const now = new Date();
  const slot = Math.floor(now.getUTCMinutes() / 15) * 15;
  const aligned = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      slot,
      0,
      0,
    ),
  );
  return aligned.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
