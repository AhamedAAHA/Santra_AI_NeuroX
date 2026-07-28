/** Demo / degraded-runtime flags. Phase 2: live systems only — demo is opt-in via env. */
export function allowDemoRuntimeFallback() {
  return process.env.SENTRA_ALLOW_DEMO_FALLBACK === "true";
}

export function allowDemoLlmFallback() {
  return allowDemoRuntimeFallback();
}

export function allowDemoAuthFallback() {
  return allowDemoRuntimeFallback();
}
