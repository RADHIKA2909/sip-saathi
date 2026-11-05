import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { PASSAGES } from "@/content/kb/passages";
import { SOURCES } from "@/content/kb/sources";
import { classify } from "@/lib/pipeline/classify";
import { CATEGORY_RESPONSES, SPECIAL_RESPONSES } from "@/lib/pipeline/responses";
import { retrieve } from "@/lib/pipeline/retrieve";
import { checkContent } from "@/lib/pipeline/validate";
import { renderSourcesDoc } from "../scripts/sources-doc";
import { renderPolicyDoc } from "../scripts/policy-doc";
import { CATEGORIES } from "@/lib/types";

describe("knowledge base integrity", () => {
  it("every passage points to a manifest source", () => {
    const ids = new Set(SOURCES.map((s) => s.id));
    for (const p of PASSAGES) expect(ids.has(p.sourceId), p.contentId).toBe(true);
  });
  it("ids are unique and every source is used", () => {
    expect(new Set(PASSAGES.map((p) => p.contentId)).size).toBe(PASSAGES.length);
    for (const s of SOURCES) expect(PASSAGES.some((p) => p.sourceId === s.id), s.id).toBe(true);
  });
  it("sources have https URLs and retrieval dates", () => {
    for (const s of SOURCES) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("docs/SOURCES.md is in sync with the manifest (run npm run docs:sources)", () => {
    const doc = readFileSync(path.join(__dirname, "..", "docs", "SOURCES.md"), "utf8");
    expect(doc).toBe(renderSourcesDoc());
  });
  it("docs/PROMPTS_AND_SAFETY.md matches the running prompts and rules (run npm run docs:sources)", () => {
    expect(readFileSync(path.join(__dirname, "..", "docs", "PROMPTS_AND_SAFETY.md"), "utf8")).toBe(renderPolicyDoc());
  });
});

describe("preapproved responses pass the same validation as AI output", () => {
  const all = [...Object.entries(CATEGORY_RESPONSES), ...Object.entries(SPECIAL_RESPONSES)];
  it.each(all)("%s", (_, r) => {
    const { checks } = checkContent({ intent: r.intent, summary: r.summary, points: r.points, uncertaintyNotes: r.uncertainty.notes, reflectionQuestions: r.reflectionQuestions }, {});
    expect(checks.filter((c) => !c.passed)).toEqual([]);
  });
  it("covers every category", () => {
    for (const c of CATEGORIES) expect(CATEGORY_RESPONSES[c]).toBeDefined();
  });
});

describe("classifier and retrieval", () => {
  it.each([
    ["My SIP is showing -8% and the value is down", "negative_returns"],
    ["Only ₹500 a month, does it matter?", "small_contributions"],
    ["My autopay mandate failed", "payment_failure"],
    ["A youtuber said SIPs are a scam, my uncle says the opposite", "conflicting_information"],
    ["I lost my job and can't afford the SIP", "affordability"],
    ["Should I put money in bitcoin instead?", "out_of_scope"],
    ["hello", "general_knowledge"],
  ])("%s → %s", (text, cat) => {
    expect(classify(text).category).toBe(cat);
  });
  it("returns pinned passages first and at most 4", () => {
    const r = retrieve("payment_failure", "my instalment failed");
    expect(r.length).toBeLessThanOrEqual(4);
    expect(r.map((p) => p.contentId).slice(0, 2)).toEqual(["mfsh-missed-payments", "amfi-sebi-cessation-rule"]);
  });
  it("is deterministic", () => {
    expect(retrieve("negative_returns", "value down")).toEqual(retrieve("negative_returns", "value down"));
  });
  it("every preapproved response cites only passages its category can retrieve, or special ones", () => {
    for (const [cat, r] of Object.entries(CATEGORY_RESPONSES)) {
      const ids = r.points.flatMap((p) => p.contentIds);
      for (const id of ids) expect(PASSAGES.some((p) => p.contentId === id), `${cat}:${id}`).toBe(true);
    }
  });
});
