import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/analytics/server";
import { decodeAdvice } from "@/lib/pipeline/advice-live";
import { jsonError } from "@/lib/server/guard";
import { rateLimit } from "@/lib/server/ratelimit";
import { AdviceRequestSchema } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const limited = await rateLimit(req, "advice", 10);
  if (limited) return limited;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Request body must be JSON.");
  }
  const parsed = AdviceRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError("Enter one to three statements, each between 3 and 280 characters.");
  const result = await decodeAdvice(parsed.data.statements);
  if (result.mode === "fallback" && result.safety.fallbackReason) {
    await recordEvent("safe_fallback_triggered", { reason: result.safety.fallbackReason }).catch(() => undefined);
  }
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
