import "server-only";
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getStore, KEYS } from "../store";

/**
 * Simple fixed-window rate limit per client. The IP is hashed (never stored raw) and the counter
 * expires after the window.
 */
export async function rateLimit(req: Request, scope: string, defaultLimit: number, windowSeconds = 60): Promise<NextResponse | null> {
  // RATE_LIMIT_MULTIPLIER lets test environments raise every limit at once.
  const limit = defaultLimit * Math.max(1, Number(process.env.RATE_LIMIT_MULTIPLIER) || 1);
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const salt = process.env.RATE_LIMIT_SALT ?? "sip-saathi";
  const id = createHash("sha256").update(`${salt}|${ip}`).digest("hex").slice(0, 16);
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  try {
    const n = await getStore().incrWithTtl(KEYS.rate(`${scope}:${id}:${window}`), windowSeconds + 5);
    if (n > limit) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429, headers: { "Retry-After": String(windowSeconds) } });
    }
  } catch {
    /* if the store is unavailable, do not block the user */
  }
  return null;
}
