import { NextResponse } from "next/server";
import { z } from "zod";
import { liveAIEnabled } from "@/lib/ai/client";
import { recordEvent } from "@/lib/analytics/server";
import { jsonError } from "@/lib/server/guard";
import { rateLimit } from "@/lib/server/ratelimit";
import { EVAL_CASES } from "@/eval/cases";
import { addCaseResult, ensureRun, finishRun, getRun, listRuns, startRun } from "@/eval/execute";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("run");
  if (id) {
    const run = await getRun(id);
    return run ? NextResponse.json(run) : jsonError("Run not found.", 404);
  }
  return NextResponse.json({ runs: await listRuns() });
}

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("case"), runId: z.string().uuid(), caseId: z.string().regex(/^MVP-\d{2}$/) }),
  z.object({ action: z.literal("finish"), runId: z.string().uuid() }),
]);

export async function POST(req: Request) {
  const limited = await rateLimit(req, "eval", 90);
  if (limited) return limited;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid evaluation request.");
  const b = parsed.data;

  // Anyone can run the suite. It uses the live model whenever one is configured. Starts are limited
  // per client because each live run makes about 35 model calls against the shared quota.
  const mode = liveAIEnabled() ? "live" : "demo";
  if (b.action === "start") {
    const tooMany = await rateLimit(req, "eval-start", 6, 3600);
    if (tooMany) return tooMany;
    const run = await startRun(mode);
    return NextResponse.json({ runId: run.id, mode, model: run.model, versions: run.versions, caseIds: EVAL_CASES.map((c) => c.id), redTeam: run.redTeam });
  }

  // Serverless instances don't share in-memory storage, so a later request may not find the run.
  await ensureRun(b.runId, mode);
  if (b.action === "case") {
    const r = await addCaseResult(b.runId, b.caseId);
    return r ? NextResponse.json({ result: r.result }) : jsonError("Case or run not found, or run already finished.", 404);
  }
  const run = await finishRun(b.runId);
  if (!run) return jsonError("Run not found.", 404);
  const passed = run.results.filter((r) => r.passed).length;
  await recordEvent("evaluation_result", { mode: run.requestedMode, passed, total: run.results.length }).catch(() => undefined);
  return NextResponse.json({ run });
}
