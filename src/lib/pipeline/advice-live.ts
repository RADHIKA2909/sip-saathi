import "server-only";
import { callStructured, describeError, liveAIEnabled } from "../ai/client";
import { modelId } from "../ai/config";
import { AIQuotaError } from "../ai/quota";
import { logDiagnostic } from "../server/log";
import { ADVICE_JSON_SCHEMA, type AdviceResult, type StatementAnalysis } from "../types";
import { ADVICE_LIMITATIONS, adviceDeterministic, screenStatements, validateAdvice, type AdviceOptions } from "./advice";
import { VERSIONS } from "./decode";
import { ADVICE_SYSTEM, buildAdviceUser } from "./prompts";
import { resolveAll, retrieve } from "./retrieve";

export async function decodeAdvice(statements: string[], opts: AdviceOptions & { forceDemo?: boolean } = {}): Promise<AdviceResult> {
  const started = Date.now();
  const screen = screenStatements(statements);
  const done = (r: AdviceResult) => {
    void logDiagnostic("advice", { mode: r.mode, count: r.items.length, fallbackReason: r.safety.fallbackReason ?? null, failedChecks: r.safety.checks.filter((c) => !c.passed).map((c) => c.id) });
    return r;
  };

  if (screen.injection) return done(adviceDeterministic(screen.masked, screen.flags, screen.maskedAny, started, VERSIONS, "fallback", "prompt_injection"));
  const live = !opts.forceDemo && (opts.generate ? true : liveAIEnabled());
  if (!live) return done(adviceDeterministic(screen.masked, screen.flags, screen.maskedAny, started, VERSIONS, "demo"));

  const passages = retrieve("conflicting_information", screen.masked.join(" "), 4);
  const ids = passages.map((p) => p.contentId);
  let gen: { data: unknown; model: string };
  try {
    gen = opts.generate
      ? await opts.generate(screen.masked, ids)
      : await callStructured<unknown>({ system: ADVICE_SYSTEM, user: buildAdviceUser(screen.masked, passages), schema: ADVICE_JSON_SCHEMA as unknown as Record<string, unknown>, maxTokens: 1500 });
  } catch (e) {
    void logDiagnostic("provider_error", { scope: "advice", message: describeError(e).slice(0, 200) });
    const r = adviceDeterministic(screen.masked, screen.flags, screen.maskedAny, started, VERSIONS, "fallback", e instanceof AIQuotaError ? "quota" : "provider_error");
    r.safety.model = modelId();
    return done(r);
  }

  const v = validateAdvice(gen.data, screen.masked.length, ids);
  if (!v.ok || !v.data) {
    const reason = v.checks.find((c) => !c.passed)?.id === "schema_valid" ? "schema_invalid" : v.checks.some((c) => c.id === "references_retrieved" && !c.passed) ? "unsupported_reference" : "safety_rule";
    const r = adviceDeterministic(screen.masked, screen.flags, screen.maskedAny, started, VERSIONS, "fallback", reason, v.checks.filter((c) => !c.passed));
    r.safety.model = gen.model;
    return done(r);
  }

  const items: StatementAnalysis[] = screen.masked.map((statement, i) => {
    const it = v.data!.items.find((x) => x.index === i)!;
    return { statement, kind: it.kind, reason: it.reason, howToCheck: it.howToCheck, related: resolveAll(it.contentIds), flags: [] };
  });
  return done({
    mode: "live",
    items,
    limitations: ADVICE_LIMITATIONS,
    safety: { checks: v.checks, inputFlags: screen.flags, masked: screen.maskedAny, model: gen.model, latencyMs: Date.now() - started, versions: VERSIONS },
  });
}
