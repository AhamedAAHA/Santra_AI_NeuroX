export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Prefer IPv4 so outbound HTTPS (OAuth, webhooks) does not hang on broken IPv6.
  // Hide require from Edge/Webpack analyzers with eval.
  try {
    const req = (0, eval)("require") as NodeRequire;
    const dns = req("dns") as typeof import("dns");
    if (typeof dns.setDefaultResultOrder === "function") {
      dns.setDefaultResultOrder("ipv4first");
    }
  } catch {
    // ignore
  }

  const { ensurePlatformSecrets, schedulePlatformSecretsRefresh } = await import(
    "@/lib/secrets/platform-secrets"
  );
  await ensurePlatformSecrets();
  schedulePlatformSecretsRefresh();
}
