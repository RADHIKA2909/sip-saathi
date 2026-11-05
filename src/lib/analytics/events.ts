import { z } from "zod";
import { CATEGORIES, FALLBACK_REASONS } from "../types";

/**
 * Privacy-safe product analytics. Each event has a fixed set of enumerated properties, so no free
 * text, amount, date or identifier can be recorded. Unknown events or properties are rejected.
 */
export const EVENT_SCHEMAS = {
  concern_selected: z.object({ category: z.enum(CATEGORIES), via: z.enum(["chip", "free_text", "scenario"]) }),
  explanation_viewed: z.object({ category: z.enum(CATEGORIES), mode: z.enum(["live", "demo", "fallback"]) }),
  source_opened: z.object({ sourceId: z.string().regex(/^[a-z0-9-]{3,60}$/) }),
  progress_explored: z.object({ dataset: z.enum(["demo", "manual"]) }),
  reflection_completed: z.object({ answered: z.number().int().min(1).max(10) }),
  helpfulness_feedback: z.object({ usefulness: z.number().int().min(1).max(5).optional(), clarity: z.number().int().min(1).max(5).optional(), surface: z.enum(["decoder", "advice", "canvas", "payment", "journey", "market"]) }),
  safe_fallback_triggered: z.object({ reason: z.enum(FALLBACK_REASONS) }),
  evaluation_result: z.object({ mode: z.enum(["demo", "live"]), passed: z.number().int().min(0).max(100), total: z.number().int().min(0).max(100) }),
  scenario_completed: z.object({ scenario: z.enum(["A", "B", "C"]) }),
} as const;

export type EventName = keyof typeof EVENT_SCHEMAS;
export const EVENT_NAMES = Object.keys(EVENT_SCHEMAS) as EventName[];

export const EVENT_LABEL: Record<EventName, string> = {
  concern_selected: "Concern selected",
  explanation_viewed: "Explanation viewed",
  source_opened: "Source opened",
  progress_explored: "Progress explored (Journey Mirror)",
  reflection_completed: "Reflection completed",
  helpfulness_feedback: "Helpfulness feedback",
  safe_fallback_triggered: "Safe fallback triggered",
  evaluation_result: "Evaluation result",
  scenario_completed: "Assessor scenario completed",
};

/** Properties whose values are aggregated into counters (enumerations only). */
export const COUNTED_PROPS: Partial<Record<EventName, string[]>> = {
  concern_selected: ["category", "via"],
  explanation_viewed: ["mode", "category"],
  safe_fallback_triggered: ["reason"],
  helpfulness_feedback: ["usefulness", "clarity", "surface"],
  progress_explored: ["dataset"],
  evaluation_result: ["mode"],
  scenario_completed: ["scenario"],
  source_opened: ["sourceId"],
};

export const EventRequestSchema = z.object({ name: z.enum(EVENT_NAMES as [EventName, ...EventName[]]), props: z.record(z.string(), z.unknown()).default({}) });
