import "server-only";
import { createHash, randomUUID } from "crypto";
import { KB_VERSION } from "@/content/kb/sources";
import { callStructured, describeError, liveAIEnabled, aiConfigured } from "../ai/client";
import { judgeEnabled, modelId } from "../ai/config";
import { AIQuotaError } from "../ai/quota";
import { POLICY_VERSION } from "../safety/rules";
import { screenInput } from "../safety/screen";
import { logDiagnostic } from "../server/log";
import { getStore, KEYS } from "../store";
import {
  GENERATED_JSON_SCHEMA,
  type CheckResult,
  type ConcernCategory,
  type DecodeResult,
  type FallbackReason,
  type Generated,
  type JudgeReport,
  type SafetyReport,
} from "../types";
import { classify } from "./classify";
import { buildDecoderUser, buildJudgeUser, DECODER_SYSTEM, JUDGE_JSON_SCHEMA, JUDGE_SYSTEM, PROMPT_VERSION } from "./prompts";
import { CATEGORY_RESPONSES, NEXT_STEPS, SPECIAL_RESPONSES, type PreapprovedResponse } from "./responses";
import { resolveAll, retrieve } from "./retrieve";
import { checkContent, validateGenerated } from "./validate";

export const VERSIONS = { prompt: PROMPT_VERSION, kb: KB_VERSION, policy: POLICY_VERSION } as const;

export interface DecodeOptions {
  /** Force the preapproved path (Evaluation Lab demo runs, tests). */
  forceDemo?: boolean;
  /** Scenario requests have fixed text, so their live output may be cached (never user free text). */
  cacheKey?: string;
  /** Test hook: replaces the model call. */
  generate?: (system: string, user: string) => Promise<{ data: unknown; model: string }>;
  judge?: (system: string, user: string) => Promise<{ data: unknown; model: string }>;
}

interface JudgeRaw {
  grounded: boolean;
  adviceRisk: "none" | "low" | "high";
  issues: string[];
}

function fromPreapproved(
  r: PreapprovedResponse,
  category: ConcernCategory,
  mode: DecodeResult["mode"],
  safety: SafetyReport,
): DecodeResult {
  return {
    mode,
    responseId: r.id,
    category,
    intent: r.intent,
    summary: r.summary,
    points: r.points,
    uncertainty: r.uncertainty,
    reflectionQuestions: r.reflectionQuestions,
    references: resolveAll(r.points.flatMap((p) => p.contentIds)),
    nextSteps: NEXT_STEPS[category],
    safety,
  };
}

function preapprovedChecks(r: PreapprovedResponse): CheckResult[] {
  return checkContent(
    { intent: r.intent, summary: r.summary, points: r.points, uncertaintyNotes: r.uncertainty.notes, reflectionQuestions: r.reflectionQuestions },
    {},
  ).checks;
}

async function readCache(key: string): Promise<DecodeResult | null> {
  try {
    const hit = await getStore().getJSON<{ at: string; result: DecodeResult }>(KEYS.scenarioCache(key));
    if (!hit || Date.now() - Date.parse(hit.at) > 24 * 3600_000) return null;
    return { ...hit.result, safety: { ...hit.result.safety, cached: { at: hit.at } } };
  } catch {
    return null;
  }
}

async function writeCache(key: string, result: DecodeResult) {
  try {
    await getStore().setJSON(KEYS.scenarioCache(key), { at: new Date().toISOString(), result });
  } catch {
    /* caching is best effort */
  }
}

export function cacheKeyFor(scenarioId: string): string {
  return createHash("sha256").update(`${scenarioId}|${VERSIONS.prompt}|${VERSIONS.kb}|${VERSIONS.policy}|${modelId()}`).digest("hex").slice(0, 24);
}

export async function decodeConcern(text: string, hint: ConcernCategory | undefined, opts: DecodeOptions = {}): Promise<DecodeResult> {
  const started = Date.now();
  const screen = screenInput(text);
  const cls = classify(screen.masked, hint);
  const base = (): SafetyReport => ({
    inputFlags: screen.flags,
    masked: screen.maskedCount > 0,
    classifier: { deterministic: cls.category, alternatives: cls.alternatives },
    retrieved: [],
    checks: [],
    judge: { ran: false },
    versions: VERSIONS,
    latencyMs: 0,
  });

  const finish = (r: DecodeResult): DecodeResult => {
    r.safety.latencyMs = Date.now() - started;
    void logDiagnostic("decode", {
      mode: r.mode,
      category: r.category,
      fallbackReason: r.safety.fallbackReason ?? null,
      failedChecks: r.safety.checks.filter((c) => !c.passed).map((c) => c.id),
      flags: r.safety.inputFlags.map((f) => f.id),
      latencyMs: r.safety.latencyMs,
    });
    return r;
  };

  // 1. Routes decided by the input screen never reach the model.
  if (screen.route) {
    const special = SPECIAL_RESPONSES[screen.route];
    const safety = { ...base(), fallbackReason: screen.route as FallbackReason, checks: preapprovedChecks(special) };
    return finish(fromPreapproved(special, special.category, "fallback", safety));
  }

  const category = cls.category;
  const passages = retrieve(category, screen.masked);
  const retrievedIds = passages.map((p) => p.contentId);

  const preapproved = (mode: DecodeResult["mode"], extra: Partial<SafetyReport>): DecodeResult => {
    const r = CATEGORY_RESPONSES[category];
    const notes = [...r.uncertainty.notes];
    if (cls.confidence === "low" && cls.alternatives.length) notes.push("Your question could also relate to another concern. Choosing a concern can give a more focused explanation.");
    const safety = { ...base(), retrieved: retrievedIds, checks: preapprovedChecks(r), ...extra };
    return fromPreapproved({ ...r, uncertainty: { ...r.uncertainty, notes } }, category, mode, safety);
  };

  // 2. Educational demo mode: preapproved content, clearly labelled.
  const live = !opts.forceDemo && (opts.generate ? true : liveAIEnabled());
  if (!live) {
    return finish(preapproved("demo", { demoReason: opts.forceDemo || aiConfigured() ? "forced_demo" : "no_key" }));
  }

  if (opts.cacheKey && !opts.generate) {
    const cached = await readCache(opts.cacheKey);
    if (cached) return finish(cached);
  }

  // 3. Live generation.
  const user = buildDecoderUser(screen.masked, category, passages);
  let generated: { data: unknown; model: string };
  try {
    generated = opts.generate
      ? await opts.generate(DECODER_SYSTEM, user)
      : await callStructured<unknown>({ system: DECODER_SYSTEM, user, schema: GENERATED_JSON_SCHEMA as unknown as Record<string, unknown>, maxTokens: 2000 });
  } catch (e) {
    const reason: FallbackReason = e instanceof AIQuotaError ? "quota" : "provider_error";
    void logDiagnostic("provider_error", { reason, message: describeError(e).slice(0, 200) });
    return finish(preapproved("fallback", { fallbackReason: reason, model: modelId() }));
  }

  // 4. Deterministic validation.
  const v = validateGenerated(generated.data, retrievedIds, screen.masked);
  const aiCategory = v.data?.category;
  const classifier = { deterministic: cls.category, ai: aiCategory, agreed: aiCategory ? aiCategory === cls.category : undefined, alternatives: cls.alternatives };
  if (v.failReason || !v.data) {
    return finish(preapproved("fallback", { fallbackReason: v.failReason ?? "schema_invalid", checks: v.checks, classifier, model: generated.model }));
  }

  // 5. Optional AI judge: it can only block, never override a deterministic failure.
  let judge: JudgeReport = { ran: false };
  if (judgeEnabled()) {
    try {
      const j = opts.judge
        ? await opts.judge(JUDGE_SYSTEM, buildJudgeUser(JSON.stringify(v.data), passages))
        : await callStructured<JudgeRaw>({ system: JUDGE_SYSTEM, user: buildJudgeUser(JSON.stringify(v.data), passages), schema: JUDGE_JSON_SCHEMA as unknown as Record<string, unknown>, maxTokens: 600 });
      const raw = j.data as Partial<JudgeRaw>;
      if (typeof raw?.grounded !== "boolean" || !["none", "low", "high"].includes(String(raw?.adviceRisk))) throw new Error("Judge returned an invalid structure");
      const block = !raw.grounded || raw.adviceRisk === "high";
      judge = { ran: true, verdict: block ? "block" : "pass", grounded: raw.grounded, adviceRisk: raw.adviceRisk, issues: (raw.issues ?? []).slice(0, 5).map((s) => String(s).slice(0, 200)) };
    } catch (e) {
      // A judge failure does not block: deterministic checks already passed. It is recorded.
      judge = { ran: false, error: describeError(e).slice(0, 160) };
    }
  }
  if (judge.verdict === "block") {
    return finish(preapproved("fallback", { fallbackReason: "judge_blocked", checks: v.checks, classifier, judge, model: generated.model }));
  }

  const d: Generated = v.data;
  // When the rule-based label is confident it decides routing, so next steps stay predictable;
  // when it is not (or the model says out of scope), the model's label is used.
  const finalCategory: ConcernCategory = cls.confidence === "low" || d.category === "out_of_scope" ? d.category : cls.category;
  const result: DecodeResult = {
    mode: "live",
    responseId: "generated",
    category: finalCategory,
    intent: d.intent,
    summary: d.summary,
    points: d.points,
    uncertainty: {
      level: d.uncertaintyLevel,
      notes: [...d.uncertaintyNotes, ...(classifier.agreed === false ? [`The AI read this as "${d.category.replace(/_/g, " ")}" while the rule-based classifier read it as "${cls.category.replace(/_/g, " ")}".`] : [])],
    },
    reflectionQuestions: d.reflectionQuestions,
    references: resolveAll(d.points.flatMap((p) => p.contentIds)),
    nextSteps: NEXT_STEPS[finalCategory],
    safety: { ...base(), retrieved: retrievedIds, checks: v.checks, classifier, judge, model: generated.model },
  };
  const final = finish(result);
  if (opts.cacheKey && !opts.generate) await writeCache(opts.cacheKey, final);
  return final;
}

export function newRunId(): string {
  return randomUUID();
}
