import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

/**
 * Small persistence interface: JSON documents plus string-keyed hashes.
 * - Upstash Redis when UPSTASH_REDIS_REST_URL / _TOKEN are set (production on Vercel).
 * - JSON files under .data/ otherwise (local development).
 * - In-memory when running on Vercel without Redis; data is lost on cold start and the UI says so.
 */
export interface Store {
  mode: "redis" | "file" | "memory";
  persistent: boolean;
  getJSON<T>(key: string): Promise<T | null>;
  setJSON<T>(key: string, value: T): Promise<void>;
  hgetall<T>(key: string): Promise<Record<string, T>>;
  hset<T>(key: string, entries: Record<string, T>): Promise<void>;
  hdel(key: string, fields: string[]): Promise<void>;
  /** Atomically add `by` to a numeric hash field and return the new value. */
  hincr(key: string, field: string, by?: number): Promise<number>;
  /** Set a key that expires after ttlSeconds (best effort for file/memory stores). */
  incrWithTtl(key: string, ttlSeconds: number): Promise<number>;
}

const PREFIX = "sip-saathi:";

function redisStore(url: string, token: string): Store {
  const redis = new Redis({ url, token });
  return {
    mode: "redis",
    persistent: true,
    async getJSON<T>(key: string) {
      return (await redis.get<T>(PREFIX + key)) ?? null;
    },
    async setJSON(key, value) {
      await redis.set(PREFIX + key, value);
    },
    async hgetall<T>(key: string) {
      return ((await redis.hgetall<Record<string, T>>(PREFIX + key)) ?? {}) as Record<string, T>;
    },
    async hset(key, entries) {
      if (Object.keys(entries).length) await redis.hset(PREFIX + key, entries);
    },
    async hdel(key, fields) {
      if (fields.length) await redis.hdel(PREFIX + key, ...fields);
    },
    async hincr(key, field, by = 1) {
      return redis.hincrby(PREFIX + key, field, by);
    },
    async incrWithTtl(key, ttlSeconds) {
      const n = await redis.incr(PREFIX + key);
      if (n === 1) await redis.expire(PREFIX + key, ttlSeconds);
      return n;
    },
  };
}

function fileStore(dir: string): Store {
  const file = (key: string) => path.join(dir, key.replace(/[^a-zA-Z0-9._-]/g, "_") + ".json");
  // Serialise writes per key so concurrent requests don't clobber each other.
  const locks = new Map<string, Promise<unknown>>();
  async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = locks.get(key) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    locks.set(key, next.catch(() => undefined));
    return next;
  }
  async function read<T>(key: string): Promise<T | null> {
    try {
      return JSON.parse(await fs.readFile(file(key), "utf8")) as T;
    } catch {
      return null;
    }
  }
  async function write(key: string, value: unknown) {
    await fs.mkdir(dir, { recursive: true });
    const tmp = file(key) + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(value, null, 1));
    await fs.rename(tmp, file(key));
  }
  return {
    mode: "file",
    persistent: true,
    getJSON: read,
    setJSON: (key, value) => withLock(key, () => write(key, value)),
    async hgetall<T>(key: string) {
      return (await read<Record<string, T>>(key)) ?? {};
    },
    hset: (key, entries) =>
      withLock(key, async () => write(key, { ...((await read<Record<string, unknown>>(key)) ?? {}), ...entries })),
    hdel: (key, fields) =>
      withLock(key, async () => {
        const cur = (await read<Record<string, unknown>>(key)) ?? {};
        for (const f of fields) delete cur[f];
        await write(key, cur);
      }),
    hincr: (key, field, by = 1) =>
      withLock(key, async () => {
        const cur = (await read<Record<string, number>>(key)) ?? {};
        cur[field] = (Number(cur[field]) || 0) + by;
        await write(key, cur);
        return cur[field];
      }),
    incrWithTtl: (key, ttlSeconds) => memoryCounter(key, ttlSeconds),
  };
}

// Rate-limit counters never need to persist, so file mode keeps them in memory too.
const counters = new Map<string, { n: number; expires: number }>();
function memoryCounter(key: string, ttlSeconds: number): Promise<number> {
  const now = Date.now();
  const cur = counters.get(key);
  const next = cur && cur.expires > now ? { n: cur.n + 1, expires: cur.expires } : { n: 1, expires: now + ttlSeconds * 1000 };
  counters.set(key, next);
  if (counters.size > 5000) for (const [k, v] of counters) if (v.expires <= now) counters.delete(k);
  return Promise.resolve(next.n);
}

function memoryStore(): Store {
  const docs = new Map<string, unknown>();
  return {
    mode: "memory",
    persistent: false,
    async getJSON<T>(key: string) {
      return (docs.get(key) as T) ?? null;
    },
    async setJSON(key, value) {
      docs.set(key, structuredClone(value));
    },
    async hgetall<T>(key: string) {
      return { ...((docs.get(key) as Record<string, T>) ?? {}) };
    },
    async hset(key, entries) {
      docs.set(key, { ...((docs.get(key) as object) ?? {}), ...entries });
    },
    async hdel(key, fields) {
      const cur = { ...((docs.get(key) as Record<string, unknown>) ?? {}) };
      for (const f of fields) delete cur[f];
      docs.set(key, cur);
    },
    async hincr(key, field, by = 1) {
      const cur = { ...((docs.get(key) as Record<string, number>) ?? {}) };
      cur[field] = (Number(cur[field]) || 0) + by;
      docs.set(key, cur);
      return cur[field];
    },
    incrWithTtl: (key, ttlSeconds) => memoryCounter(key, ttlSeconds),
  };
}

let store: Store | null = null;

export function getStore(): Store {
  if (store) return store;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) store = redisStore(url, token);
  else if (process.env.VERCEL) store = memoryStore();
  else store = fileStore(path.join(process.cwd(), ".data"));
  return store;
}

/** Storage keys used across the app. No key ever holds user free text or financial amounts. */
export const KEYS = {
  aiCooldown: "ai-pause",
  eventCounts: "events:counts",
  eventDaily: (day: string) => `events:day:${day}`,
  feedback: "feedback:counts",
  evalRuns: "eval:runs",
  evalRun: (id: string) => `eval:run:${id}`,
  evalReviews: "eval:reviews",
  scenarioCache: (key: string) => `cache:scenario:${key}`,
  rate: (bucket: string) => `rate:${bucket}`,
} as const;

/** For tests: drop the cached store so env changes take effect. */
export function resetStoreForTests() {
  store = null;
}
