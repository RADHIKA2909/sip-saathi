"use client";
import { EVAL_CASES } from "@/eval/cases";
import type { CaseOutput, CaseResult, EvalRun } from "@/eval/runner";

export interface Review { clarity: number | null; factualQuality: number | null; notes: string; reviewedAt?: string }

const CHECKS = [
  ["schema_valid", "Schema"],
  ["safety_rules", "Safety rules"],
  ["references_valid", "References"],
  ["expected_behavior", "Expected behaviour"],
  ["fallback_behavior", "Fallback"],
] as const;

function outputText(o?: CaseOutput): { intent: string; answer: string; points: string; uncertainty: string; reflection: string; sources: string } {
  if (o?.items) {
    return {
      intent: "",
      answer: o.items.map((i) => `"${i.statement}" → ${i.kind.replace(/_/g, " ")}. ${i.reason} How to check: ${i.howToCheck}`).join("\n\n"),
      points: "",
      uncertainty: (o.limitations ?? []).join("\n"),
      reflection: "",
      sources: [...new Set(o.items.flatMap((i) => i.related))].join("\n"),
    };
  }
  return {
    intent: o?.intent ?? "",
    answer: o?.summary ?? "",
    points: (o?.points ?? []).map((p) => `• ${p.text} [${p.contentIds.join(", ")}]`).join("\n"),
    uncertainty: (o?.uncertainty ?? []).join("\n"),
    reflection: (o?.reflectionQuestions ?? []).join("\n"),
    sources: (o?.references ?? []).map((r) => `${r.source}, ${r.locator}: ${r.url}`).join("\n"),
  };
}

const local = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-IN") : "");

/** Builds the workbook in the browser, so it works for any run on screen whatever the server stored. */
export async function buildEvaluationWorkbook(run: EvalRun, reviewFor: (caseId: string) => Review | undefined) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "SIP Saathi";
  wb.created = new Date();

  const styleHeader = (sheet: import("exceljs").Worksheet) => {
    const row = sheet.getRow(1);
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00795A" } };
    row.alignment = { vertical: "middle", wrapText: true };
    row.height = 32;
    sheet.views = [{ state: "frozen", ySplit: 1, xSplit: sheet.name === "Test cases" ? 1 : 0 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
    sheet.eachRow((r, n) => { if (n > 1) r.alignment = { vertical: "top", wrapText: true }; });
  };

  const results = new Map<string, CaseResult>(run.results.map((r) => [r.caseId, r]));
  const passed = run.results.filter((r) => r.passed).length;

  const summary = wb.addWorksheet("Summary");
  summary.columns = [{ width: 34 }, { width: 80 }];
  const reviewed = EVAL_CASES.filter((c) => reviewFor(c.id)).length;
  const rows: [string, string | number][] = [
    ["SIP Saathi MVP evaluation", ""],
    ["Cases passing every automated check", `${passed}/${run.results.length}`],
    ["Cases with a review", `${reviewed}/${EVAL_CASES.length}`],
    ["Response source", run.requestedMode === "live" ? `Live AI (${run.model ?? "model not recorded"})` : "Preapproved content (no AI calls)"],
    ["Started", local(run.startedAt)],
    ["Finished", local(run.finishedAt)],
    ["Suite", run.suite],
    ["Versions", Object.values(run.versions).filter(Boolean).join(", ")],
    ["Red-team drafts blocked as expected", `${(run.redTeam ?? []).filter((r) => r.blocked && r.expectedFailuresCaught).length}/${(run.redTeam ?? []).length}`],
    ["Clarity scale", "1 = hard for a first-time investor to follow; 5 = plain language, no unexplained jargon"],
    ["Factual quality scale", "1 = contains errors or unsupported claims; 5 = every statement matches its cited source"],
    ["Scope", "24 developer-written cases. Separate from the discovery classifier evaluation. Passing automated checks does not show usefulness to real investors."],
    ["Disclaimer", "Independent student prototype. Educational only, not investment advice. Not affiliated with any investment platform."],
  ];
  rows.forEach((r) => summary.addRow(r));
  summary.getRow(1).font = { bold: true, size: 14 };
  summary.eachRow((r) => { r.alignment = { vertical: "top", wrapText: true }; r.getCell(1).font = { bold: true, size: r.number === 1 ? 14 : 11 }; });

  const cases = wb.addWorksheet("Test cases");
  cases.columns = [
    { header: "Case ID", key: "id", width: 10 },
    { header: "Type", key: "type", width: 18 },
    { header: "Title", key: "title", width: 28 },
    { header: "Input", key: "input", width: 48 },
    { header: "Expected safe behaviour", key: "expected", width: 52 },
    { header: "Result", key: "result", width: 9 },
    { header: "Response type", key: "mode", width: 12 },
    { header: "Fallback reason", key: "fallback", width: 20 },
    { header: "Category", key: "category", width: 20 },
    { header: "What the person seems to be asking", key: "intent", width: 36 },
    { header: "Answer", key: "answer", width: 60 },
    { header: "Explanation points", key: "points", width: 70 },
    { header: "Uncertainty notes", key: "uncertainty", width: 48 },
    { header: "Reflection questions", key: "reflection", width: 44 },
    { header: "Sources", key: "sources", width: 60 },
    ...CHECKS.map(([id, label]) => ({ header: label, key: id, width: 12 })),
    { header: "Failed check details", key: "failed", width: 44 },
    { header: "Why a draft was rejected", key: "rejected", width: 44 },
    { header: "Quality judge", key: "judge", width: 30 },
    { header: "Latency (ms)", key: "latency", width: 10 },
    { header: "Model", key: "model", width: 22 },
    { header: "Ran at", key: "ranAt", width: 22 },
    { header: "Human review: clarity (1–5)", key: "clarity", width: 14 },
    { header: "Human review: factual quality (1–5)", key: "factual", width: 14 },
    { header: "Human review: notes", key: "notes", width: 60 },
    { header: "Human review: status", key: "status", width: 14 },
    { header: "Human review: date", key: "reviewedOn", width: 14 },
  ];
  for (const c of EVAL_CASES) {
    const r = results.get(c.id);
    const o = outputText(r?.output);
    const review = reviewFor(c.id);
    const row = cases.addRow({
      id: c.id, type: c.type.replace(/_/g, " "), title: c.title,
      input: c.kind === "decode" ? c.input.text : c.input.statements.join("\n"),
      expected: c.expectedBehavior,
      result: r ? (r.passed ? "PASS" : "FAIL") : "Not run",
      mode: r?.mode ?? "", fallback: r?.fallbackReason ?? "", category: r?.category?.replace(/_/g, " ") ?? "",
      ...o,
      ...Object.fromEntries(CHECKS.map(([id]) => { const k = r?.checks.find((x) => x.id === id); return [id, k ? (k.passed ? "Pass" : "Fail") : ""]; })),
      failed: (r?.checks ?? []).filter((x) => !x.passed).map((x) => `${x.id}${x.detail ? `: ${x.detail}` : ""}`).join("\n"),
      rejected: (r?.rejectedDraft ?? []).join("\n"),
      judge: r?.judge ?? "", latency: r?.latencyMs ?? "", model: r?.model ?? "", ranAt: local(r?.ranAt),
      clarity: review?.clarity ?? "", factual: review?.factualQuality ?? "", notes: review?.notes ?? "",
      status: review ? "Reviewed" : "Pending",
      reviewedOn: review?.reviewedAt ? new Date(review.reviewedAt).toLocaleDateString("en-IN") : "",
    });
    const cell = row.getCell("result");
    cell.font = { bold: true, color: { argb: r?.passed ? "FF00795A" : "FFB4232F" } };
  }
  styleHeader(cases);

  const checks = wb.addWorksheet("Check details");
  checks.columns = [
    { header: "Case ID", key: "id", width: 10 },
    { header: "Check", key: "check", width: 22 },
    { header: "Description", key: "label", width: 60 },
    { header: "Result", key: "result", width: 9 },
    { header: "Detail", key: "detail", width: 70 },
  ];
  for (const r of run.results) for (const k of r.checks) checks.addRow({ id: r.caseId, check: k.id, label: k.label, result: k.passed ? "Pass" : "Fail", detail: k.detail ?? "" });
  styleHeader(checks);

  const red = wb.addWorksheet("Red-team");
  red.columns = [
    { header: "ID", key: "id", width: 9 },
    { header: "Unsafe draft (developer-written)", key: "title", width: 44 },
    { header: "Blocked", key: "blocked", width: 10 },
    { header: "Blocked for expected reason", key: "expected", width: 16 },
    { header: "Checks that failed", key: "failed", width: 70 },
  ];
  for (const r of run.redTeam ?? []) red.addRow({ id: r.id, title: r.title, blocked: r.blocked ? "Yes" : "No", expected: r.expectedFailuresCaught ? "Yes" : "No", failed: r.failed.join(", ") });
  styleHeader(red);

  return wb;
}

export async function downloadEvaluation(run: EvalRun, reviewFor: (caseId: string) => Review | undefined) {
  const wb = await buildEvaluationWorkbook(run, reviewFor);
  const blob = new Blob([await wb.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sip-saathi-evaluation-${(run.finishedAt ?? run.startedAt).slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
