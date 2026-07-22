/** User-facing hint for configuring LLM API keys (local vs hosted). */
export function getLlmProviderSetupMessage() {
  if (process.env.NODE_ENV === "production") {
    return "Add AIML_API_KEY or FEATHERLESS_API_KEY in Vercel → Project → Environment Variables, then redeploy.";
  }
  return "Add AIML_API_KEY or FEATHERLESS_API_KEY to .env.local, then restart npm run dev.";
}

export function getAimlSetupMessage() {
  if (process.env.NODE_ENV === "production") {
    return "Add AIML_API_KEY from aimlapi.com in Vercel → Environment Variables, then redeploy.";
  }
  return "Add AIML_API_KEY from aimlapi.com to .env.local, then restart npm run dev.";
}
