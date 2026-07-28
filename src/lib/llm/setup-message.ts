/** User-facing hint for configuring LLM API keys (local vs hosted). */
export function getLlmProviderSetupMessage() {
  if (process.env.NODE_ENV === "production") {
    return "Add AIML_API_KEY or FEATHERLESS_API_KEY in Vercel → Project → Environment Variables, then redeploy.";
  }
  return "Add AIML_API_KEY or FEATHERLESS_API_KEY to .env.local, then restart npm run dev.";
}