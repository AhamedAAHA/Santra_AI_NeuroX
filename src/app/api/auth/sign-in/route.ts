import { NextResponse } from "next/server";
import { authenticateUser, createUser } from "@/lib/auth/users";
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
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

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
    console.error("Sign-in failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not sign in." },
      { status: 500 },
    );
  }
}
