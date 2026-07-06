import dns from "node:dns";
import { MongoClient, type MongoClientOptions } from "mongodb";
import {
  getMongoDbName,
  getMongoDirectUri,
  getMongoSrvUri,
  getMongoUri,
  isMongoConfigured,
  mongoConnectionHint,
} from "@/lib/mongo/config";

declare global {
  // eslint-disable-next-line no-var
  var __santraMongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var __santraMongoIndexes: Promise<void> | undefined;
}

let clientPromise: Promise<MongoClient> | null = null;

// Some ISPs fail SRV lookups; public DNS fixes mongodb+srv resolution.
dns.setServers(["8.8.8.8", "1.1.1.1", "208.67.222.222"]);

const clientOptions: MongoClientOptions = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
};

async function connectWithUri(uri: string) {
  const client = new MongoClient(uri, clientOptions);
  await client.connect();
  return client;
}

async function connectMongo() {
  if (!isMongoConfigured()) {
    throw new Error("MONGODB_URI is not configured.");
  }

  const direct = getMongoDirectUri();
  if (direct) {
    return connectWithUri(direct);
  }

  const srv = getMongoSrvUri();
  const fallback = getMongoUri();

  if (srv) {
    try {
      return await connectWithUri(srv);
    } catch (error) {
      if (!fallback || fallback === srv) throw error;
      return connectWithUri(fallback);
    }
  }

  if (fallback) {
    return connectWithUri(fallback);
  }

  throw new Error("MONGODB_URI is not configured.");
}

export function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    const reuse = global.__santraMongoClient;
    if (reuse) {
      clientPromise = Promise.resolve(reuse);
      return clientPromise;
    }

    clientPromise = connectMongo()
      .then((client) => {
        if (process.env.NODE_ENV !== "production") {
          global.__santraMongoClient = client;
        }
        return client;
      })
      .catch((error) => {
        clientPromise = null;
        throw new Error(mongoConnectionHint(error));
      });
  }

  return clientPromise;
}

export async function getDb() {
  const client = await getMongoClient();
  return client.db(getMongoDbName());
}

async function ensureIndexes(db: Awaited<ReturnType<typeof getDb>>) {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("monitors").createIndex({ user_id: 1, created_at: -1 }),
    db.collection("signals").createIndex({ user_id: 1, created_at: -1 }),
    db.collection("signals").createIndex({ run_id: 1 }),
    db.collection("intelligence_runs").createIndex({ user_id: 1, created_at: -1 }),
    db.collection("intelligence_reports").createIndex({ user_id: 1, created_at: -1 }),
    db.collection("intelligence_reports").createIndex({ monitor_id: 1, created_at: -1 }),
    db.collection("chat_threads").createIndex({ user_id: 1, updated_at: -1 }),
    db.collection("chat_messages").createIndex({ thread_id: 1, created_at: 1 }),
    db.collection("pending_actions").createIndex({ user_id: 1, status: 1, created_at: -1 }),
    db.collection("monitor_timeline_events").createIndex({ user_id: 1, created_at: -1 }),
    db.collection("monitor_detected_changes").createIndex({ user_id: 1, detected_at: -1 }),
    db.collection("monitor_page_snapshots").createIndex({ monitor_id: 1, url: 1, collected_at: -1 }),
    db.collection("monitor_events").createIndex({ monitor_id: 1, signal_id: 1 }, { unique: true }),
    db.collection("api_usage").createIndex({ user_id: 1, action: 1, window_start: 1 }, { unique: true }),
    db.collection("provider_usage_daily").createIndex({ usage_date: 1, provider: 1 }, { unique: true }),
  ]);
}

export async function ensureMongoReady() {
  if (!isMongoConfigured()) return;
  if (!global.__santraMongoIndexes) {
    global.__santraMongoIndexes = getDb().then(ensureIndexes);
  }
  await global.__santraMongoIndexes;
}

/** Diagnostic: check whether Atlas SRV DNS has propagated. */
export async function probeMongoDns(host = "cluster0.2gwkohl.mongodb.net") {
  const { promises: dnsPromises } = await import("node:dns");
  dnsPromises.setServers(["8.8.8.8", "1.1.1.1"]);
  let srv = false;
  let txt: string | null = null;
  try {
    const records = await dnsPromises.resolveSrv(`_mongodb._tcp.${host}`);
    srv = records.length > 0;
  } catch {
    srv = false;
  }
  try {
    const records = await dnsPromises.resolveTxt(host);
    txt = records.flat().join("");
  } catch {
    txt = null;
  }
  return { srv, txt, provisioning: Boolean(txt && !srv), usingDirect: Boolean(process.env.MONGODB_URI_DIRECT?.trim()) };
}
