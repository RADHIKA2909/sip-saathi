import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAdmin } from "@/lib/server/guard";
import { EVAL_CASES } from "@/eval/cases";
import { saveReview } from "@/eval/execute";

export const runtime = "nodejs";

const Body = z.object({
  runId: z.string().regex(/^(baseline|[0-9a-f-]{36})$/),
  caseId: z.string().refine((id) => EVAL_CASES.some((c) => c.id === id), "Unknown case"),
  clarity: z.number().int().min(1).max(5).nullable(),
  factualQuality: z.number().int().min(1).max(5).nullable(),
  notes: z.string().max(500).default(""),
});

/** Human review of an evaluation case. Requires ADMIN_TOKEN when set; the UI warns when it is not. */
export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid review.");
  await saveReview(parsed.data.runId, parsed.data.caseId, { clarity: parsed.data.clarity, factualQuality: parsed.data.factualQuality, notes: parsed.data.notes, reviewedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
