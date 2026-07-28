import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/users";
import { isMongoConfigured } from "@/lib/mongo/config";
import { getWatchEmailConfigStatus, sendWatchAlertEmail } from "@/lib/notifications/email";
import { formatWatchTestEmail } from "@/lib/notifications/format-watch";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const status = getWatchEmailConfigStatus();
  let email = auth.user.email ?? null;

  if (isMongoConfigured()) {
    const user = await findUserById(auth.user.id).catch(() => null);
    email = user?.email ?? email;
  }

  return NextResponse.json({ ...status, email });
}

export async function POST() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const status = getWatchEmailConfigStatus();
  if (!status.configured) {
    return NextResponse.json(
      {
        error: "Email is not configured.",
        hint: "Set RESEND_API_KEY and SANTRA_EMAIL_FROM in .env.local, then restart the dev server.",
      },
      { status: 503 },
    );
  }

  let email = auth.user.email ?? null;
  if (isMongoConfigured()) {
    const user = await findUserById(auth.user.id).catch(() => null);
    email = user?.email ?? email;
  }

  if (!email) {
    return NextResponse.json(
      {
        error: "No email address on this account.",
        hint: "Sign in with an email account so SANTRA knows where to send alerts.",
      },
      { status: 400 },
    );
  }

  const template = formatWatchTestEmail(email);
  const result = await sendWatchAlertEmail({
    to: email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });

  if (!result.ok) {
    const reason = "skipped" in result && result.skipped ? result.reason : result.error;
    return NextResponse.json(
      {
        error: reason,
        hint: result.hint,
        status: "status" in result ? result.status : undefined,
        from: status.from,
        to: email,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    sent: true,
    to: email,
    from: status.from,
    messageId: result.id,
    sandbox: status.sandbox,
  });
}
