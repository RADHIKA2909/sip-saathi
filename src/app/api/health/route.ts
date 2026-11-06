import { NextResponse } from "next/server";
import { aiConfigured, liveAIEnabled } from "@/lib/ai/client";
import { aiProvider, forcedDemo, judgeEnabled, modelId } from "@/lib/ai/config";
import { getCooldown } from "@/lib/ai/quota";
import { VERSIONS } from "@/lib/pipeline/decode";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public status: booleans and labels only, never keys. */
export async function GET() {
  const store = getStore();
  const live = liveAIEnabled();
  return NextResponse.json({
    mode: live ? "live" : "demo",
    demoReason: live ? null : forcedDemo() && aiConfigured() ? "forced_demo" : "no_key",
    provider: live ? aiProvider() : null,
    model: live ? modelId() : null,
    judge: live && judgeEnabled(),
    quotaPausedUntil: live ? await getCooldown() : null,
    storage: { mode: store.mode, persistent: store.persistent },
    versions: VERSIONS,
  });
}
