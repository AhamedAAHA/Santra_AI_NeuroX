import { NextResponse } from "next/server";
import { ensureMongoReady, getDb, probeMongoDns } from "@/lib/mongo/client";
import { getMongoDbName, getMongoUri, isMongoConfigured, mongoConnectionHint } from "@/lib/mongo/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json({
      configured: false,
      ready: false,
      error: "MONGODB_URI is not set in .env.local",
    });
  }

  const host = process.env.MONGODB_URI?.match(/@([^/?]+)/)?.[1] ?? "cluster0.2gwkohl.mongodb.net";
  const dns = await probeMongoDns(host).catch(() => null);

  try {
    await ensureMongoReady();
    const db = await getDb();
    await db.command({ ping: 1 });
    return NextResponse.json({
      configured: true,
      ready: true,
      database: getMongoDbName(),
      host,
      dns,
    });
  } catch (error) {
    const hint = mongoConnectionHint(error);
    return NextResponse.json({
      configured: true,
      ready: false,
      error: hint,
      host,
      dns,
      uriMode: getMongoUri()?.startsWith("mongodb+srv://") ? "srv" : "direct",
      fix:
        dns?.provisioning
          ? "Atlas cluster is still deploying (TXT exists, SRV missing). Wait 5–15 min until Cluster0 is Active."
          : "In Atlas → Connect → Drivers, disable 'Use SRV connection string' and set MONGODB_URI_DIRECT in .env.local",
    });
  }
}
