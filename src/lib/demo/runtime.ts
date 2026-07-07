/** Shared demo / degraded-runtime flags (Cloudflare without MongoDB driver, no LLM key). */
export function allowDemoRuntimeFallback() {
  if (process.env.SENTRA_ALLOW_DEMO_FALLBACK === "true") return true;
  if (process.env.SENTRA_ALLOW_DEMO_FALLBACK === "false") return false;
  return process.env.NODE_ENV !== "production";
}

export function allowDemoLlmFallback() {
  return allowDemoRuntimeFallback();
}

export function allowDemoAuthFallback() {
  return allowDemoRuntimeFallback();
}
