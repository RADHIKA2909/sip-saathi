import "server-only";
import { randomUUID } from "crypto";
import { modelId } from "@/lib/ai/config";
import { decodeAdvice } from "@/lib/pipeline/advice-live";
import { decodeConcern, VERSIONS } from "@/lib/pipeline/decode";
import { getStore, KEYS } from "@/lib/store";
import { EVAL_CASES, type EvalCase } from "./cases";
import { EVAL_SUITE_VERSION, runRedTeam, scoreAdvice, scoreDecode, type CaseResult, type EvalRun } from "./runner";

export async function executeCase(c: EvalCase, mode: "demo" | "live"): Promise<CaseResult> {
  const started = Date.now();
  const ranAt = new Date().toISOString();
  try {
    if (c.kind === "decode") {
      const r = await decodeConcern(c.input.text, c.input.category, { forceDemo: mode === "demo" });
      const s = scoreDecode(c, r);
      return { caseId: c.id, ranAt, ...s, passed: s.checks.every((x) => x.passed), latencyMs: Date.now() - started };
    }
    const r = await decodeAdvice(c.input.statements, { forceDemo: mode === "demo" });
    const s = scoreAdvice(c, r);
    return { caseId: c.id, ranAt, ...s, passed: s.checks.every((x) => x.passed), latencyMs: Date.now() - started };
  } catch (e) {
    return {
      caseId: c.id, ranAt, mode: "fallback", checks: [{ id: "executed", label: "Case executed without an error", passed: false, detail: e instanceof Error ? e.message.slice(0, 200) : "error" }],
      passed: false, latencyMs: Date.now() - started, preview: "", error: "execution_error",
    };
  }
}

export interface RunIndexEntry {
  id: string;
  requestedMode: "demo" | "live";
  startedAt: string;
  finishedAt?: string;
  passed: number;
  total: number;
  model?: string;
}

export async function startRun(mode: "demo" | "live", id: string = randomUUID()): Promise<EvalRun> {
  const run: EvalRun = {
    id,
    suite: EVAL_SUITE_VERSION,
    requestedMode: mode,
    startedAt: new Date().toISOString(),
    model: mode === "live" ? modelId() : undefined,
    versions: VERSIONS,
    results: [],
    redTeam: runRedTeam(),
  };
  await getStore().setJSON(KEYS.evalRun(run.id), run);
  return run;
}

/** Recreates a run this instance can't find (in-memory storage isn't shared between instances). */
export async function ensureRun(id: string, mode: "demo" | "live"): Promise<void> {
  if (!(await getRun(id))) await startRun(mode, id);
}

export async function getRun(id: string): Promise<EvalRun | null> {
  return getStore().getJSON<EvalRun>(KEYS.evalRun(id));
}

export async function addCaseResult(runId: string, caseId: string): Promise<{ run: EvalRun; result: CaseResult } | null> {
  const run = await getRun(runId);
  const c = EVAL_CASES.find((x) => x.id === caseId);
  if (!run || !c || run.finishedAt) return null;
  const result = await executeCase(c, run.requestedMode);
  // Re-read so parallel case requests don't overwrite each other's results.
  const latest = (await getRun(runId)) ?? run;
  latest.results = [...latest.results.filter((r) => r.caseId !== caseId), result].sort((a, b) => a.caseId.localeCompare(b.caseId));
  await getStore().setJSON(KEYS.evalRun(runId), latest);
  return { run: latest, result };
}

export async function finishRun(runId: string): Promise<EvalRun | null> {
  const run = await getRun(runId);
  if (!run) return null;
  run.finishedAt ??= new Date().toISOString();
  await getStore().setJSON(KEYS.evalRun(runId), run);
  // History only lists complete runs: a partial copy would overstate the pass rate.
  if (run.results.length < EVAL_CASES.length) return run;
  const index = (await getStore().getJSON<RunIndexEntry[]>(KEYS.evalRuns)) ?? [];
  const entry: RunIndexEntry = {
    id: run.id, requestedMode: run.requestedMode, startedAt: run.startedAt, finishedAt: run.finishedAt,
    passed: run.results.filter((r) => r.passed).length, total: run.results.length, model: run.model,
  };
  await getStore().setJSON(KEYS.evalRuns, [entry, ...index.filter((e) => e.id !== run.id)].slice(0, 25));
  return run;
}

export async function listRuns(): Promise<RunIndexEntry[]> {
  return (await getStore().getJSON<RunIndexEntry[]>(KEYS.evalRuns)) ?? [];
}
