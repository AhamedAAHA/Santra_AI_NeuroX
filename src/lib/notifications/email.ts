const RESEND_SANDBOX_SENDER = "onboarding@resend.dev";

export function getWatchEmailFromAddress() {
  return process.env.SANTRA_EMAIL_FROM?.trim() || process.env.RESEND_FROM_EMAIL?.trim() || "";
}

/** Resend account owner inbox — required when using onboarding@resend.dev. */
export function getSandboxDeliveryEmail() {
  return process.env.SANTRA_EMAIL_SANDBOX_TO?.trim() || process.env.RESEND_SANDBOX_TO?.trim() || "";
}

export function isWatchEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && getWatchEmailFromAddress());
}

/** True when the shared Resend test sender is used (only delivers to the Resend account owner). */
export function isSandboxSender() {
  return getWatchEmailFromAddress().toLowerCase().includes(RESEND_SANDBOX_SENDER);
}

/**
 * In sandbox mode, Resend only accepts the account-owner inbox.
 * Redirect there when SANTRA_EMAIL_SANDBOX_TO is set.
 */
export function resolveWatchEmailRecipient(accountEmail: string): {
  to: string;
  redirected: boolean;
  accountEmail: string;
} {
  const account = accountEmail.trim();
  if (!account) {
    return { to: "", redirected: false, accountEmail: "" };
  }
  if (!isSandboxSender()) {
    return { to: account, redirected: false, accountEmail: account };
  }
  const sandboxTo = getSandboxDeliveryEmail();
  if (sandboxTo && sandboxTo.toLowerCase() !== account.toLowerCase()) {
    return { to: sandboxTo, redirected: true, accountEmail: account };
  }
  return { to: account, redirected: false, accountEmail: account };
}

export function getWatchEmailConfigStatus() {
  const hasApiKey = Boolean(process.env.RESEND_API_KEY?.trim());
  const from = getWatchEmailFromAddress();
  const sandbox = isSandboxSender();
  const sandboxTo = getSandboxDeliveryEmail() || null;
  return {
    configured: hasApiKey && Boolean(from),
    hasApiKey,
    from: from || null,
    sandbox,
    sandboxTo,
    /** True when sandbox is active but no owner inbox override is configured. */
    sandboxNeedsOwner: sandbox && !sandboxTo,
  };
}

export type SendWatchEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type SendWatchEmailResult =
  | { ok: true; id?: string; to: string; redirected?: boolean }
  | { ok: false; skipped: true; reason: string; hint?: string }
  | { ok: false; skipped?: false; error: string; status?: number; hint?: string; to?: string };

function hintForFailure(status: number, message: string) {
  const lower = message.toLowerCase();

  if (status === 403 && lower.includes("testing emails")) {
    return `Resend sandbox restriction: "${getWatchEmailFromAddress()}" can only deliver to the email that owns your Resend account. Set SANTRA_EMAIL_SANDBOX_TO to that inbox, or verify a domain and set SANTRA_EMAIL_FROM.`;
  }
  if (status === 401 || status === 403) {
    return "Check RESEND_API_KEY — it may be invalid, revoked, or missing sending permission.";
  }
  if (status === 422 && lower.includes("testing email address")) {
    return "Resend rejected the recipient because no domain is verified. Set SANTRA_EMAIL_SANDBOX_TO to your Resend account email, or verify a domain.";
  }
  if (status === 422 && lower.includes("from")) {
    return "The SANTRA_EMAIL_FROM address is not verified in Resend. Verify the domain or use onboarding@resend.dev for testing.";
  }
  if (status === 429) {
    return "Resend rate limit hit. Wait a moment and retry.";
  }
  return undefined;
}

/** Send via Resend HTTP API. Fail-open when not configured. */
export async function sendWatchAlertEmail(input: SendWatchEmailInput): Promise<SendWatchEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getWatchEmailFromAddress();

  if (!apiKey || !from) {
    return {
      ok: false,
      skipped: true,
      reason: "Email is not configured.",
      hint: "Set RESEND_API_KEY and SANTRA_EMAIL_FROM in .env.local, then restart the dev server.",
    };
  }

  const resolved = resolveWatchEmailRecipient(input.to);
  const to = resolved.to;
  if (!to) {
    return { ok: false, skipped: true, reason: "No recipient email on this account." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    const raw = await response.text().catch(() => "");
    type ResendPayload = { id?: string; message?: string; name?: string };
    let payload: ResendPayload | null = null;
    try {
      payload = raw ? (JSON.parse(raw) as ResendPayload) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message = payload?.message || raw || `Resend request failed (${response.status})`;
      console.warn(`Resend send failed (${response.status}) to=${to} from=${from}: ${message}`);
      return {
        ok: false,
        error: message,
        status: response.status,
        hint: hintForFailure(response.status, message),
        to,
      };
    }

    if (resolved.redirected) {
      console.info(`Sandbox email redirected ${resolved.accountEmail} → ${to}`);
    }

    return { ok: true, id: payload?.id, to, redirected: resolved.redirected };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email.";
    console.warn(`Resend request error to=${to}: ${message}`);
    return { ok: false, error: message, to };
  }
}
