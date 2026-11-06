import { z } from "zod";

export const CATEGORIES = [
  "negative_returns",
  "small_contributions",
  "conflicting_information",
  "payment_failure",
  "affordability",
  "general_knowledge",
  "out_of_scope",
] as const;
export type ConcernCategory = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<ConcernCategory, string> = {
  negative_returns: "Market ups and downs",
  small_contributions: "Small contributions",
  conflicting_information: "Conflicting information",
  payment_failure: "Payment failure",
  affordability: "Affordability",
  general_knowledge: "General SIP question",
  out_of_scope: "Outside what SIP Saathi covers",
};

/** Reasons a preapproved response is shown instead of a generated one. */
export const FALLBACK_REASONS = [
  "distress",
  "prompt_injection",
  "fund_recommendation",
  "return_prediction",
  "schema_invalid",
  "unsupported_reference",
  "ungrounded_claim",
  "safety_rule",
  "judge_blocked",
  "provider_error",
  "quota",
] as const;
export type FallbackReason = (typeof FALLBACK_REASONS)[number];

export const FALLBACK_REASON_LABEL: Record<FallbackReason, string> = {
  distress: "Message suggested serious distress, so financial content was withheld",
  prompt_injection: "Message tried to change the assistant's instructions",
  fund_recommendation: "Asked for a fund pick, which SIP Saathi never gives",
  return_prediction: "Asked for a prediction or guarantee, which SIP Saathi never gives",
  schema_invalid: "AI output did not match the required structure",
  unsupported_reference: "AI output cited material outside the approved sources",
  ungrounded_claim: "AI output contained a claim not supported by the cited source",
  safety_rule: "AI output broke a safety rule",
  judge_blocked: "The AI quality judge flagged the output",
  provider_error: "The AI provider returned an error",
  quota: "The free AI quota is used up for now",
};

export type ResponseMode = "live" | "demo" | "fallback";

export interface ResolvedReference {
  contentId: string;
  sourceId: string;
  sourceTitle: string;
  publisher: string;
  url: string;
  published: string;
  retrieved: string;
  locator: string;
  passage: string;
}

export interface CheckResult {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

export interface InputFlag {
  id: "prompt_injection" | "fund_recommendation" | "return_prediction" | "distress" | "sensitive_data" | "decision_request" | "source_request" | "emotional_load";
  label: string;
}

export interface JudgeReport {
  ran: boolean;
  verdict?: "pass" | "block";
  grounded?: boolean;
  adviceRisk?: "none" | "low" | "high";
  issues?: string[];
  error?: string;
}

export interface SafetyReport {
  inputFlags: InputFlag[];
  masked: boolean;
  classifier: { deterministic: ConcernCategory; ai?: ConcernCategory; agreed?: boolean; alternatives: ConcernCategory[] };
  retrieved: string[];
  checks: CheckResult[];
  judge: JudgeReport;
  fallbackReason?: FallbackReason;
  /** Short machine-readable notes on why live generation was not used. */
  demoReason?: "no_key" | "forced_demo";
  versions: { prompt: string; kb: string; policy: string };
  model?: string;
  latencyMs: number;
  cached?: { at: string };
}

export interface ExplanationPoint {
  text: string;
  contentIds: string[];
}

export interface DecodeResult {
  mode: ResponseMode;
  responseId: string; // id of preapproved content, or "generated"
  category: ConcernCategory;
  /** The person's words with identifiers removed. Absent for routed messages, so they are never echoed. */
  concernText?: string;
  intent: string;
  summary: string;
  points: ExplanationPoint[];
  uncertainty: { level: "low" | "medium" | "high"; notes: string[] };
  reflectionQuestions: string[];
  references: ResolvedReference[];
  nextSteps: { label: string; href: string }[];
  safety: SafetyReport;
}

/** What the model must return. Kept small so it validates reliably. */
export const GeneratedSchema = z.object({
  category: z.enum(CATEGORIES),
  intent: z.string().min(3).max(200),
  summary: z.string().min(10).max(400),
  points: z
    .array(z.object({ text: z.string().min(10).max(400), contentIds: z.array(z.string()).min(1).max(3) }))
    .min(1)
    .max(5),
  uncertaintyLevel: z.enum(["low", "medium", "high"]),
  uncertaintyNotes: z.array(z.string().min(5).max(300)).max(4),
  reflectionQuestions: z.array(z.string().min(10).max(200)).min(2).max(4),
});
export type Generated = z.infer<typeof GeneratedSchema>;

/** JSON schema sent to the provider (mirrors GeneratedSchema). */
export const GENERATED_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["category", "intent", "summary", "points", "uncertaintyLevel", "uncertaintyNotes", "reflectionQuestions"],
  properties: {
    category: { type: "string", enum: [...CATEGORIES] },
    intent: { type: "string", description: "One short sentence: what the person is trying to understand." },
    summary: { type: "string", description: "One or two plain-language sentences framing the explanation." },
    points: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "contentIds"],
        properties: {
          text: { type: "string" },
          contentIds: { type: "array", minItems: 1, maxItems: 3, items: { type: "string" } },
        },
      },
    },
    uncertaintyLevel: { type: "string", enum: ["low", "medium", "high"] },
    uncertaintyNotes: { type: "array", maxItems: 4, items: { type: "string" } },
    reflectionQuestions: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
  },
} as const;

export const DecodeRequestSchema = z.object({
  text: z.string().trim().max(600).optional().default(""),
  category: z.enum(CATEGORIES).optional(),
  scenarioId: z.enum(["A", "A-unsafe", "B", "C", "E"]).optional(),
});
export type DecodeRequest = z.input<typeof DecodeRequestSchema>;

// --- Conflicting advice decoder ---------------------------------------------------------------

export const STATEMENT_KINDS = ["verifiable_fact", "opinion", "assumption", "unsupported_claim"] as const;
export type StatementKind = (typeof STATEMENT_KINDS)[number];

export const STATEMENT_KIND_LABEL: Record<StatementKind, string> = {
  verifiable_fact: "Checkable fact",
  opinion: "Opinion",
  assumption: "Assumption",
  unsupported_claim: "Unsupported claim",
};

export interface StatementAnalysis {
  statement: string;
  kind: StatementKind;
  reason: string;
  howToCheck: string;
  related: ResolvedReference[];
  flags: string[];
}

export interface AdviceResult {
  mode: ResponseMode;
  items: StatementAnalysis[];
  limitations: string[];
  safety: { checks: CheckResult[]; inputFlags: InputFlag[]; masked: boolean; model?: string; fallbackReason?: FallbackReason; latencyMs: number; versions: { prompt: string; kb: string; policy: string } };
}

export const AdviceRequestSchema = z.object({
  statements: z.array(z.string().trim().min(3).max(280)).min(1).max(3),
});

export const AdviceGeneratedSchema = z.object({
  items: z
    .array(
      z.object({
        index: z.number().int().min(0).max(2),
        kind: z.enum(STATEMENT_KINDS),
        reason: z.string().min(10).max(300),
        howToCheck: z.string().min(10).max(300),
        contentIds: z.array(z.string()).max(2),
      }),
    )
    .min(1)
    .max(3),
});
export type AdviceGenerated = z.infer<typeof AdviceGeneratedSchema>;

export const ADVICE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "kind", "reason", "howToCheck", "contentIds"],
        properties: {
          index: { type: "integer" },
          kind: { type: "string", enum: [...STATEMENT_KINDS] },
          reason: { type: "string" },
          howToCheck: { type: "string" },
          contentIds: { type: "array", maxItems: 2, items: { type: "string" } },
        },
      },
    },
  },
} as const;
