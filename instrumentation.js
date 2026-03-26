/**
 * Runs once when the Node server starts (Next.js instrumentation).
 * OpenAI SDK and others expect global File on some code paths; Node 18 CI lacks it.
 */
export async function register() {
  if (typeof globalThis.File === 'undefined') {
    globalThis.File = class File {
      constructor(bits, name, options) {
        this.name = String(name ?? '');
      }
    };
  }
}
