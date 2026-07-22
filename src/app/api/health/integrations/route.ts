import { NextResponse } from "next/server";
import { getIntegrationStatusWithDiscovery } from "@/lib/integrations";
import { ensureMongoReady } from "@/lib/mongo/client";
import { isMongoConfigured } from "@/lib/mongo/config";

export const runtime = "nodejs";

export async function GET() {
  const status = await getIntegrationStatusWithDiscovery();
  let mongodbReady = false;

  if (isMongoConfigured()) {
    try {
      await ensureMongoReady();
      mongodbReady = true;
    } catch {
      mongodbReady = false;
    }
  }

  return NextResponse.json({ ...status, mongodbReady });
}
