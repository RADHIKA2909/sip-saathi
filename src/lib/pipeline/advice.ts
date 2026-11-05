import { runSafetyRules } from "../safety/rules";
import { screenInput } from "../safety/screen";
import { AdviceGeneratedSchema, type AdviceResult, type CheckResult, type InputFlag, type StatementAnalysis, type StatementKind } from "../types";
import { classify } from "./classify";
import { resolveAll, retrieve } from "./retrieve";

/**
 * Deterministic statement labelling, used in demo mode and as the fallback when live output fails
 * validation. It looks for linguistic markers only; it never decides whether a statement is true.
 */
const UNSUPPORTED_RE =
  /\b(guarantee[sd]?|assured|risk[- ]free|sure[- ]shot|never (lose|loses|fall|falls|go down)|always (rise|rises|go up|goes up|recover|recovers|wins?)|100%|definitely|certainly|for sure|can'?t lose|no risk|will (definitely |surely )?(double|triple|recover|crash|bounce back)|doubles? (your money|in))\b/i;
const ASSUMPTION_RE =
  /\b(if|unless|assuming|once|as long as|when the market|after the (election|budget)|by next (year|month)|in (a|the) (few|next) (years?|months?)|will|going to|expected to|likely to|eventually|sooner or later)\b/i;
const OPINION_RE =
  /\b(i think|i feel|i believe|in my (view|opinion)|imo|best|worst|better|overrated|underrated|waste|pointless|smart|stupid|good idea|bad idea|should|must|need to|only fools|everyone (should|knows))\b/i;
const FACT_RE =
  /\b(sebi|amfi|rule|regulation|guideline|circular|required|requires|minimum|charge[sd]?|fee|penalt(y|ies)|exit load|nav|lock-?in|tax|consecutive|cancel(led|s)?|registered|per (month|year)|\d+)\b/i;

export function labelStatement(s: string): { kind: StatementKind; reason: string; howToCheck: string } {
  if (UNSUPPORTED_RE.test(s))
    return {
      kind: "unsupported_claim",
      reason: "It promises a certain outcome or uses absolute language. Regulator education material states that mutual fund returns are not guaranteed, so a promise like this cannot be supported by any source.",
      howToCheck: "Ask what evidence the claim is based on, and compare it with the risk section of the scheme's documents.",
    };
  if (FACT_RE.test(s) && !OPINION_RE.test(s))
    return {
      kind: "verifiable_fact",
      reason: "It makes a specific claim about a rule, number, charge or process. That kind of claim can be checked, but SIP Saathi has not verified it.",
      howToCheck: "Check the scheme's documents, your provider's terms, or the investor-education pages of SEBI or AMFI.",
    };
  if (ASSUMPTION_RE.test(s))
    return {
      kind: "assumption",
      reason: "It depends on a condition or on what happens in the future, which nobody can know in advance.",
      howToCheck: "Identify the condition it depends on and ask how likely it is and what happens if it does not hold.",
    };
  if (OPINION_RE.test(s))
    return {
      kind: "opinion",
      reason: "It expresses a judgement or preference. Opinions can be useful, but they reflect the speaker's own situation and views.",
      howToCheck: "Ask whether the person's goals, time horizon and risk comfort are similar to yours.",
    };
  return {
    kind: "opinion",
    reason: "It does not contain a specific checkable fact, a promise or a clear condition, so it is treated as a general opinion.",
    howToCheck: "Ask the source what the statement is based on.",
  };
}

const LIMITATIONS = [
  "SIP Saathi does not browse the internet and has not verified any of these statements against live sources.",
  "A label describes the type of statement, not whether it is true. A checkable fact can still be wrong, and an opinion can still be reasonable.",
  "Related material comes from SIP Saathi's approved knowledge base and is shown as background. It does not prove or disprove a statement.",
];

export interface AdviceOptions {
  generate?: (statements: string[], passageIds: string[]) => Promise<{ data: unknown; model: string }>;
}

export function adviceDeterministic(statements: string[], flags: InputFlag[], masked: boolean, started: number, versions: AdviceResult["safety"]["versions"], mode: "demo" | "fallback", fallbackReason?: AdviceResult["safety"]["fallbackReason"], checks: CheckResult[] = []): AdviceResult {
  const items: StatementAnalysis[] = statements.map((statement) => {
    const l = labelStatement(statement);
    const category = classify(statement).category;
    const related = resolveAll(retrieve(category === "general_knowledge" ? "conflicting_information" : category, statement, 2).map((p) => p.contentId));
    return { statement, ...l, related, flags: [] };
  });
  const outputChecks = runSafetyRules(items.flatMap((i) => [i.reason, i.howToCheck]));
  return { mode, items, limitations: LIMITATIONS, safety: { checks: [...checks, ...outputChecks], inputFlags: flags, masked, fallbackReason, latencyMs: Date.now() - started, versions } };
}

/** Validate a model's labelling. Returns failing checks, or the parsed items. */
export function validateAdvice(raw: unknown, count: number, allowedIds: string[]): { checks: CheckResult[]; ok: boolean; data?: ReturnType<typeof AdviceGeneratedSchema.parse> } {
  const parsed = AdviceGeneratedSchema.safeParse(raw);
  const checks: CheckResult[] = [{ id: "schema_valid", label: "Output matches the required structure", passed: parsed.success }];
  if (!parsed.success) return { checks, ok: false };
  const d = parsed.data;
  const indices = new Set(d.items.map((i) => i.index));
  const coverage = indices.size === count && [...indices].every((i) => i < count);
  checks.push({ id: "all_statements_labelled", label: "Every statement received exactly one label", passed: coverage });
  const badIds = d.items.flatMap((i) => i.contentIds).filter((id) => !allowedIds.includes(id));
  checks.push({ id: "references_retrieved", label: "Related material comes only from retrieved passages", passed: badIds.length === 0, ...(badIds.length ? { detail: badIds.join(", ") } : {}) });
  const claimsVerified = d.items.some((i) => /\b(i|we) (verified|checked|confirmed|looked up)\b|\bthis is (true|false|correct|incorrect)\b/i.test(`${i.reason} ${i.howToCheck}`));
  checks.push({ id: "no_verification_claims", label: "Does not claim to have verified a statement", passed: !claimsVerified });
  checks.push(...runSafetyRules(d.items.flatMap((i) => [i.reason, i.howToCheck])));
  return { checks, ok: checks.every((c) => c.passed), data: d };
}

export function screenStatements(statements: string[]): { masked: string[]; flags: InputFlag[]; maskedAny: boolean; injection: boolean } {
  const flags = new Map<string, InputFlag>();
  let maskedAny = false;
  let injection = false;
  const masked = statements.map((s) => {
    const r = screenInput(s);
    if (r.maskedCount) maskedAny = true;
    if (r.flags.some((f) => f.id === "prompt_injection")) injection = true;
    for (const f of r.flags) if (f.id === "sensitive_data" || f.id === "prompt_injection") flags.set(f.id, f);
    return r.masked;
  });
  return { masked, flags: [...flags.values()], maskedAny, injection };
}

export { LIMITATIONS as ADVICE_LIMITATIONS };
