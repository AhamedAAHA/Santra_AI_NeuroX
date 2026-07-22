import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth/users";
import { buildSessionCookie } from "@/lib/auth/session";
import { isMongoConfigured } from "@/lib/mongo/config";
import { ensureMongoReady } from "@/lib/mongo/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB is not configured." }, { status: 503 });
  }

  try {
    await ensureMongoReady();
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      companyName?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const companyName = body.companyName?.trim() || undefined;

    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const user = await createUser({ email, password, companyName });
    const session = {
      userId: user.id,
      email: user.email,
      companyName: user.company_name ?? undefined,
      signedInAt: new Date().toISOString(),
    };

    const cookie = buildSessionCookie(session);
    const response = NextResponse.json({ ok: true, session });
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error) {
    console.error("Sign-up route failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create account." },
      { status: 500 },
    );
  }
}
