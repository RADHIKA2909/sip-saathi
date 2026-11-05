import { NextResponse } from "next/server";
import { readEventCounts } from "@/lib/analytics/server";
import { listRuns } from "@/eval/execute";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [counts, runs] = await Promise.all([readEventCounts().catch(() => ({})), listRuns().catch(() => [])]);
  const store = getStore();
  return NextResponse.json({ counts, runs: runs.slice(0, 5), storage: { mode: store.mode, persistent: store.persistent } }, { headers: { "Cache-Control": "no-store" } });
}
