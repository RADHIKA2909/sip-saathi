import { describe, expect, it } from "vitest";
import { CASE_TYPES, EVAL_CASES } from "@/eval/cases";
import { executeCase } from "@/eval/execute";
import { BASELINE_REVIEWS } from "@/eval/baseline/reviews";
import run from "@/eval/baseline/run.json";
import { runRedTeam } from "@/eval/runner";

describe("evaluation suite definition", () => {
  it("has at least 20 cases, unique ids, every type, all reviewed", () => {
    expect(EVAL_CASES.length).toBeGreaterThanOrEqual(20);
    expect(new Set(EVAL_CASES.map((c) => c.id)).size).toBe(EVAL_CASES.length);
    for (const t of CASE_TYPES) expect(EVAL_CASES.some((c) => c.type === t), t).toBe(true);
    for (const c of EVAL_CASES) expect(c.humanReview).toBe("reviewed");
  });
});

describe("evaluation suite in demo mode (executable)", () => {
  it.each(EVAL_CASES.map((c) => [c.id, c] as const))("%s passes all automated checks", async (_, c) => {
    const r = await executeCase(c, "demo");
    expect(r.checks.filter((x) => !x.passed)).toEqual([]);
  });
});

describe("validator red-team", () => {
  it.each(runRedTeam().map((r) => [r.id, r] as const))("%s is blocked for the expected reason", (_, r) => {
    expect(r.blocked).toBe(true);
    expect(r.expectedFailuresCaught).toBe(true);
  });
});

describe("saved run shown by default", () => {
  it("is a complete live run with no provider outages", () => {
    expect(run.requestedMode).toBe("live");
    // The saved run is the reviewed record, so it stays on the versions it ran with.
    expect(run.versions.prompt).toMatch(/^prompt-v\d+$/);
    expect(run.results.map((r) => r.caseId)).toEqual(EVAL_CASES.map((c) => c.id));
    for (const r of run.results) expect(["provider_error", "quota"]).not.toContain(r.fallbackReason);
  });
  it("has a rating and note for every case", () => {
    for (const c of EVAL_CASES) {
      const review = BASELINE_REVIEWS[c.id];
      expect(review, c.id).toBeDefined();
      expect(review.clarity).toBeGreaterThanOrEqual(1);
      expect(review.factualQuality).toBeLessThanOrEqual(5);
      expect(review.notes.length).toBeGreaterThan(10);
      expect(review.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
