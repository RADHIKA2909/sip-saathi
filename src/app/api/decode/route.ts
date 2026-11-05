import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/analytics/server";
import { cacheKeyFor, decodeConcern } from "@/lib/pipeline/decode";
import { SCENARIO_TEXT } from "@/lib/scenarios";
import { jsonError } from "@/lib/server/guard";
import { rateLimit } from "@/lib/server/ratelimit";
import { DecodeRequestSchema } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const limited = await rateLimit(req, "decode", 12);
  if (limited) return limited;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Request body must be JSON.");
  }
  const parsed = DecodeRequestSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please enter a question of up to 600 characters, or choose a concern.");
  const { text, category, scenarioId } = parsed.data;

  // Scenario requests use fixed server-side text, so their live output can be cached safely.
  const scenario = scenarioId ? SCENARIO_TEXT[scenarioId] : undefined;
  const input = scenario ? scenario.text : text;
  if (!input && !category) return jsonError("Please enter a question or choose a concern.");

  const result = await decodeConcern(input, scenario?.category ?? category, scenario ? { cacheKey: cacheKeyFor(scenarioId!) } : {});
  if (result.mode === "fallback" && result.safety.fallbackReason) {
    await recordEvent("safe_fallback_triggered", { reason: result.safety.fallbackReason }).catch(() => undefined);
  }
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
