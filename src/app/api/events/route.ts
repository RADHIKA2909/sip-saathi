import { NextResponse } from "next/server";
import { EventRequestSchema } from "@/lib/analytics/events";
import { recordEvent } from "@/lib/analytics/server";
import { jsonError } from "@/lib/server/guard";
import { rateLimit } from "@/lib/server/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = await rateLimit(req, "events", 120);
  if (limited) return limited;
  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return jsonError("Request body must be JSON.");
  }
  const parsed = EventRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError("Unknown event.");
  const r = await recordEvent(parsed.data.name, parsed.data.props).catch(() => ({ ok: false as const, error: "Storage unavailable." }));
  if (!r.ok) return jsonError(r.error);
  return NextResponse.json({ ok: true });
}
