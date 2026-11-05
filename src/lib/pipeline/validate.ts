import { PASSAGE_BY_ID } from "@/content/kb/passages";
import { runSafetyRules } from "../safety/rules";
import { GeneratedSchema, type CheckResult, type ExplanationPoint, type FallbackReason, type Generated } from "../types";

const STOP = new Set(
  "about above after again also among an and any are aren't because been before being below between both but can cannot could did does doing down during each from further have having here into itself just more most much must only other over same should some such than that their them then there these they this those through under until very were what when where which while will with would your yours you're also like may might says said say".split(" "),
);

function stem(w: string): string {
  return w.replace(/(ings|ing|ies|ied|es|ed|s)$/, "").replace(/(ly)$/, "");
}

function contentWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/₹/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 3 && !STOP.has(w))
    .map(stem);
}

/** Share of a claim's content words that also appear in its cited passages. */
export function overlapScore(claim: string, passages: string[]): number {
  const cw = contentWords(claim);
  if (!cw.length) return 1;
  const pool = new Set(passages.flatMap(contentWords));
  return cw.filter((w) => pool.has(w)).length / cw.length;
}

export const OVERLAP_THRESHOLD = 0.3;

const NUM_RE = /\d[\d,]*(\.\d+)?/g;
function numbers(s: string): string[] {
  return (s.match(NUM_RE) ?? []).map((n) => n.replace(/,/g, ""));
}

export interface ValidationOutcome {
  checks: CheckResult[];
  failReason?: FallbackReason;
}

/** Checks shared by generated and preapproved content. */
export function checkContent(
  c: { summary: string; points: ExplanationPoint[]; uncertaintyNotes: string[]; reflectionQuestions: string[]; intent?: string },
  opts: { retrieved?: string[]; userText?: string },
): ValidationOutcome {
  const checks: CheckResult[] = [];
  const cited = c.points.flatMap((p) => p.contentIds);

  const unknown = cited.filter((id) => !PASSAGE_BY_ID.has(id));
  checks.push({
    id: "references_in_kb",
    label: "Every reference exists in the approved knowledge base",
    passed: unknown.length === 0,
    ...(unknown.length ? { detail: `Unknown: ${unknown.join(", ")}` } : {}),
  });

  if (opts.retrieved) {
    const outside = cited.filter((id) => PASSAGE_BY_ID.has(id) && !opts.retrieved!.includes(id));
    checks.push({
      id: "references_retrieved",
      label: "References come only from passages retrieved for this question",
      passed: outside.length === 0,
      ...(outside.length ? { detail: `Not retrieved: ${outside.join(", ")}` } : {}),
    });
  }

  const uncited = c.points.filter((p) => p.contentIds.length === 0);
  checks.push({ id: "claims_cited", label: "Every explanation point cites a source", passed: uncited.length === 0 });

  const allowedNums = new Set(numbers(opts.userText ?? ""));
  const badNums: string[] = [];
  const lowOverlap: string[] = [];
  for (const p of c.points) {
    const texts = p.contentIds.map((id) => PASSAGE_BY_ID.get(id)?.text ?? "");
    const pool = new Set(texts.flatMap(numbers));
    for (const n of numbers(p.text)) if (!pool.has(n) && !allowedNums.has(n)) badNums.push(n);
    const score = overlapScore(p.text, texts);
    if (score < OVERLAP_THRESHOLD) lowOverlap.push(`${Math.round(score * 100)}% “${p.text.slice(0, 50)}…”`);
  }
  checks.push({
    id: "numbers_grounded",
    label: "Every number in a point appears in its cited source",
    passed: badNums.length === 0,
    ...(badNums.length ? { detail: `Unsupported numbers: ${[...new Set(badNums)].join(", ")}` } : {}),
  });
  checks.push({
    id: "claims_supported",
    label: `Each point shares at least ${OVERLAP_THRESHOLD * 100}% of its key terms with its cited source (automated estimate)`,
    passed: lowOverlap.length === 0,
    ...(lowOverlap.length ? { detail: lowOverlap.join("; ") } : {}),
  });

  const safety = runSafetyRules([c.intent ?? "", c.summary, ...c.points.map((p) => p.text), ...c.uncertaintyNotes, ...c.reflectionQuestions]);
  checks.push(...safety);

  const failed = (id: string) => checks.some((x) => x.id === id && !x.passed);
  const failReason: FallbackReason | undefined =
    failed("references_in_kb") || failed("references_retrieved")
      ? "unsupported_reference"
      : failed("claims_cited") || failed("numbers_grounded") || failed("claims_supported")
        ? "ungrounded_claim"
        : safety.some((s) => !s.passed)
          ? "safety_rule"
          : undefined;
  return { checks, failReason };
}

export function validateGenerated(raw: unknown, retrieved: string[], userText: string): ValidationOutcome & { data?: Generated } {
  const parsed = GeneratedSchema.safeParse(raw);
  const schemaCheck: CheckResult = {
    id: "schema_valid",
    label: "Output matches the required structure",
    passed: parsed.success,
    ...(parsed.success ? {} : { detail: parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }),
  };
  if (!parsed.success) return { checks: [schemaCheck], failReason: "schema_invalid" };
  const d = parsed.data;
  const outcome = checkContent(
    { intent: d.intent, summary: d.summary, points: d.points, uncertaintyNotes: d.uncertaintyNotes, reflectionQuestions: d.reflectionQuestions },
    { retrieved, userText },
  );
  return { checks: [schemaCheck, ...outcome.checks], failReason: outcome.failReason, data: d };
}
