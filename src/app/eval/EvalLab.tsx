"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Download, FlaskConical, Play, ShieldCheck, XCircle } from "lucide-react";
import { Badge, Button, Callout, Card, PageHeader, Stat, cx } from "@/components/ui";
import { useHealth } from "@/lib/client/health";
import { downloadEvaluation, type Review } from "@/lib/client/exportEval";
import { BASELINE_FOLLOWUPS } from "@/eval/baseline/reviews";
import { EVAL_CASES, type EvalCase } from "@/eval/cases";
import type { CaseOutput, CaseResult, EvalRun, RedTeamResult } from "@/eval/runner";

interface RunIndexEntry { id: string; requestedMode: "demo" | "live"; startedAt: string; finishedAt?: string; passed: number; total: number; model?: string }
interface LabData { runs: RunIndexEntry[] }

const REVIEWS_KEY = "sip-saathi:eval-reviews";

/** A visitor's reviews stay in their own browser, so nobody can change what other visitors see. */
function readLocalReviews(): Record<string, Review> {
  try {
    return JSON.parse(localStorage.getItem(REVIEWS_KEY) ?? "{}") as Record<string, Review>;
  } catch {
    return {};
  }
}

const CHECK_LABEL: Record<string, string> = {
  schema_valid: "Schema", safety_rules: "Safety rules", references_valid: "References", expected_behavior: "Expected behaviour", fallback_behavior: "Fallback", executed: "Executed",
};

export function EvalLab({ baseline, baselineReviews }: { baseline: EvalRun; baselineReviews: Record<string, Review> }) {
  const health = useHealth();
  const [data, setData] = useState<LabData | null>(null);
  const [run, setRun] = useState<EvalRun>(baseline);
  const [myRun, setMyRun] = useState<EvalRun | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [localReviews, setLocalReviews] = useState<Record<string, Review>>({});
  const cancel = useRef(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/eval", { cache: "no-store" });
      if (r.ok) setData((await r.json()) as LabData);
    } catch {
      /* the completed run on screen doesn't depend on this */
    }
  }, []);

  useEffect(() => {
    void load();
    setLocalReviews(readLocalReviews());
  }, [load]);

  function saveReview(runId: string, caseId: string, review: Review) {
    const next = { ...localReviews, [`${runId}|${caseId}`]: review };
    setLocalReviews(next);
    try {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(next));
      return true;
    } catch {
      return false;
    }
  }

  const reviewFor = (runId: string, caseId: string): Review | undefined =>
    localReviews[`${runId}|${caseId}`] ?? (runId === baseline.id ? baselineReviews[caseId] : undefined);

  async function exportRun() {
    setExporting(true);
    setError(null);
    try {
      await downloadEvaluation(run, (caseId) => reviewFor(run.id, caseId));
    } catch {
      setError("Couldn't create the Excel file. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  async function call<T>(body: unknown): Promise<T> {
    const res = await fetch("/api/eval", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((j as { error?: string }).error ?? `Request failed (${res.status})`);
    return j as T;
  }

  async function start() {
    setError(null);
    cancel.current = false;
    try {
      const s = await call<{ runId: string; mode: "demo" | "live"; model?: string; versions: EvalRun["versions"]; caseIds: string[]; redTeam: RedTeamResult[] }>({ action: "start" });
      const partial: EvalRun = { id: s.runId, suite: "", requestedMode: s.mode, model: s.model, startedAt: new Date().toISOString(), versions: s.versions, results: [], redTeam: s.redTeam };
      setRun(partial);
      setProgress({ done: 0, total: s.caseIds.length });
      const results: CaseResult[] = [];
      for (const [i, caseId] of s.caseIds.entries()) {
        if (cancel.current) break;
        const r = await call<{ result: CaseResult }>({ action: "case", runId: s.runId, caseId });
        results.push(r.result);
        setRun({ ...partial, results: [...results] });
        setProgress({ done: i + 1, total: s.caseIds.length });
      }
      const f = await call<{ run: EvalRun }>({ action: "finish", runId: s.runId });
      // The results collected here are complete even if another server instance handled "finish".
      const finished = { ...partial, results, finishedAt: f.run.finishedAt };
      setRun(finished);
      setMyRun(finished);
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed.");
    } finally {
      setProgress(null);
    }
  }

  const running = progress !== null;
  const passed = run.results.filter((r) => r.passed).length;
  const byCheck: Record<string, { p: number; t: number }> = {};
  for (const r of run.results) for (const c of r.checks) { byCheck[c.id] ??= { p: 0, t: 0 }; byCheck[c.id].t++; if (c.passed) byCheck[c.id].p++; }
  const redTeam = run.redTeam ?? [];
  const historyRow = "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-surface-2";

  return (
    <div>
      <PageHeader eyebrow="Evaluation Lab" title="MVP evaluation results">
        24 test cases written by the developers, each with an expected safe behaviour. The results below come from a completed run, so you can read or export them straight away. Press run to repeat the evaluation yourself.
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="flex items-center gap-2 font-semibold"><FlaskConical size={18} className="text-accent-strong" aria-hidden /> Run it again</h2>
          <p className="mt-1 text-sm text-muted">
            {health?.mode === "demo"
              ? "No AI model is configured here, so this run uses preapproved content and doesn't test model behaviour."
              : "Sends all 24 cases through the real pipeline, including the AI model and quality judge. It takes 3 to 6 minutes, and results can differ between runs because the model does."}
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Button variant="secondary" onClick={() => void start()} disabled={running}><Play size={16} aria-hidden /> Run evaluation</Button>
            {running && <Button variant="ghost" onClick={() => (cancel.current = true)}>Stop after current case</Button>}
          </div>
          {running && progress && (
            <div className="mt-4" role="status">
              <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} /></div>
              <p className="mt-1 text-xs text-muted">{progress.done} of {progress.total} cases run</p>
            </div>
          )}
          {error && <div className="mt-3"><Callout tone="danger" icon={<AlertCircle size={18} aria-hidden />}>{error}</Callout></div>}
        </Card>
        <Card>
          <h2 className="font-semibold">Run history</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {myRun && (
              <li>
                <button type="button" className={historyRow} onClick={() => setRun(myRun)}>
                  <span><Badge tone="accent">Your run</Badge> <span className="text-muted">{new Date(myRun.startedAt).toLocaleString("en-IN")}</span></span>
                  <span className="tabular-nums font-medium">{myRun.results.filter((r) => r.passed).length}/{myRun.results.length}</span>
                </button>
              </li>
            )}
            <li>
              <button type="button" className={historyRow} onClick={() => setRun(baseline)}>
                <span><Badge>Saved run</Badge> <span className="text-muted">{new Date(baseline.startedAt).toLocaleString("en-IN")}</span></span>
                <span className="tabular-nums font-medium">{baseline.results.filter((r) => r.passed).length}/{baseline.results.length}</span>
              </button>
            </li>
            {data?.runs.filter((r) => r.id !== myRun?.id).slice(0, 5).map((r) => (
              <li key={r.id}>
                <button type="button" className={historyRow}
                  onClick={async () => { const rr = await fetch(`/api/eval?run=${r.id}`); if (rr.ok) setRun(await rr.json()); }}>
                  <span className="text-muted">{new Date(r.startedAt).toLocaleString("en-IN")}</span>
                  <span className="tabular-nums font-medium">{r.passed}/{r.total}</span>
                </button>
              </li>
            ))}
          </ul>
          {health && !health.storage.persistent && <p className="mt-3 text-xs text-muted">New runs stay available until you close this page. Export them to keep a copy.</p>}
        </Card>
      </div>

      <section className="mt-6 space-y-4" aria-labelledby="res-h">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="res-h" className="text-lg font-semibold tracking-tight">
            {run.finishedAt ? "Results" : "Running…"} <span className="text-sm font-normal text-muted">({run.model ?? "preapproved content"}, {new Date(run.startedAt).toLocaleString("en-IN")})</span>
          </h2>
          <Button onClick={() => void exportRun()} disabled={!run.finishedAt || exporting}><Download size={16} aria-hidden /> {exporting ? "Preparing…" : "Export to Excel"}</Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Cases passed" value={`${passed}/${run.results.length}`} />
          {Object.entries(byCheck).map(([id, v]) => <Stat key={id} label={CHECK_LABEL[id] ?? id} value={`${v.p}/${v.t}`} />)}
        </div>
        {run.id === baseline.id && (
          <Callout tone="accent" title="Fixed after this review">
            <p>This run keeps its original answers as the reviewed record. The live product has since changed:</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">{BASELINE_FOLLOWUPS.map((f) => <li key={f}>{f}</li>)}</ul>
          </Callout>
        )}
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-border">
            {EVAL_CASES.map((c) => <CaseRow key={`${run.id}-${c.id}`} c={c} result={run.results.find((r) => r.caseId === c.id)} review={reviewFor(run.id, c.id)} onSave={(r) => saveReview(run.id, c.id, r)} />)}
          </ul>
        </Card>
      </section>

      <Card className="mt-6">
        <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} className="text-accent-strong" aria-hidden /> Validator red-team ({redTeam.filter((r) => r.blocked && r.expectedFailuresCaught).length}/{redTeam.length} blocked as expected)</h2>
        <p className="mt-1 text-sm text-muted">Deliberately unsafe drafts written by the developers (not AI output), fed through the real validator. Reported separately from the 24 cases.</p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {redTeam.map((r) => (
            <li key={r.id} className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2">
              {r.blocked && r.expectedFailuresCaught ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-strong" aria-label="blocked" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-danger" aria-label="not blocked" />}
              <span><span className="font-mono text-xs text-muted">{r.id}</span> {r.title}<span className="block text-xs text-muted">Failed checks: {r.failed.join(", ") || "none"}</span></span>
            </li>
          ))}
        </ul>
      </Card>

      <Callout tone="neutral" title="What this evaluation is and isn't">
        It is separate from the discovery classifier evaluation (20 human-approved examples; theme micro-F1 68%), which measured a different system. Passing these automated checks shows the
        prototype behaves as designed on these 24 inputs. It doesn&apos;t show that answers are clear, complete or useful to real investors; that needs user research.
        The &ldquo;claims supported&rdquo; check is a lexical-overlap estimate, not proof of factual accuracy.
      </Callout>
    </div>
  );
}

function OutputView({ o }: { o: CaseOutput }) {
  const list = (title: string, items?: string[]) => items?.length ? (
    <div><p className="font-semibold">{title}</p><ul className="mt-1 list-disc space-y-1 pl-4">{items.map((x) => <li key={x}>{x}</li>)}</ul></div>
  ) : null;
  return (
    <div className="space-y-2 rounded-lg bg-surface p-3 text-xs leading-relaxed text-foreground/85">
      <p className="text-sm font-semibold text-foreground">Output</p>
      {o.summary && <p>{o.summary}</p>}
      {list("Explanation", o.points?.map((p) => p.text))}
      {o.items?.map((i) => <p key={i.statement}><span className="font-semibold">{i.kind.replace(/_/g, " ")}:</span> {i.reason} {i.howToCheck}</p>)}
      {list("Uncertainty", o.uncertainty ?? o.limitations)}
      {list("Reflection questions", o.reflectionQuestions)}
      {list("Sources", o.references?.map((r) => `${r.source}, ${r.locator}`))}
    </div>
  );
}

function CaseRow({ c, result, review, onSave }: { c: EvalCase; result?: CaseResult; review?: Review; onSave: (r: Review) => boolean }) {
  const [open, setOpen] = useState(false);
  const [clarity, setClarity] = useState<string>(review?.clarity ? String(review.clarity) : "");
  const [factual, setFactual] = useState<string>(review?.factualQuality ? String(review.factualQuality) : "");
  const [notes, setNotes] = useState(review?.notes ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  // Saved reviews load after the first render, so keep the fields in step with them.
  useEffect(() => {
    setClarity(review?.clarity ? String(review.clarity) : "");
    setFactual(review?.factualQuality ? String(review.factualQuality) : "");
    setNotes(review?.notes ?? "");
  }, [review]);
  const input = c.kind === "decode" ? c.input.text : c.input.statements.join(" / ");

  function save() {
    const saved = onSave({ clarity: clarity ? Number(clarity) : null, factualQuality: factual ? Number(factual) : null, notes, reviewedAt: new Date().toISOString() });
    setMsg(saved ? "Saved in this browser." : "Couldn't save in this browser.");
  }

  return (
    <li>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 sm:px-5">
        {!result ? <span className="h-4 w-4 shrink-0 rounded-full border-2 border-border-strong" aria-label="not run" /> : result.passed ? <CheckCircle2 size={18} className="shrink-0 text-accent-strong" aria-label="passed" /> : <XCircle size={18} className="shrink-0 text-danger" aria-label="failed" />}
        <span className="font-mono text-xs text-muted">{c.id}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.title}</span>
        <span className="hidden sm:inline"><Badge>{c.type.replace(/_/g, " ")}</Badge></span>
        {result && <span className="hidden text-xs text-muted md:inline">{result.mode}{result.fallbackReason ? ` · ${result.fallbackReason}` : ""}</span>}
        <ChevronDown size={16} className={cx("shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border bg-surface-2/40 px-4 py-4 text-sm sm:px-5">
          <p><span className="font-semibold">Input:</span> “{input}”</p>
          <p><span className="font-semibold">Expected safe behaviour:</span> {c.expectedBehavior}</p>
          {result ? (
            <>
              <ul className="space-y-1">
                {result.checks.map((ch) => (
                  <li key={ch.id} className="flex gap-2">
                    {ch.passed ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-strong" aria-label="passed" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-danger" aria-label="failed" />}
                    <span>{ch.label}{ch.detail && <span className="block text-xs text-muted">{ch.detail}</span>}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted">Ran {new Date(result.ranAt).toLocaleString("en-IN")} · {result.latencyMs} ms{result.model ? ` · ${result.model}` : ""}</p>
              {result.rejectedDraft?.length ? <p className="text-xs text-muted"><span className="font-semibold text-foreground">Why the draft was rejected:</span> {result.rejectedDraft.join("; ")}</p> : null}
              {result.output ? <OutputView o={result.output} /> : result.preview && <p className="rounded-lg bg-surface p-3 text-xs leading-relaxed text-foreground/80"><span className="font-semibold">Output preview:</span> {result.preview}</p>}
            </>
          ) : <p className="text-muted">Not run in this run.</p>}
          <fieldset className="rounded-xl border border-border bg-surface p-3">
            <legend className="px-1 text-xs font-semibold">Human review {review ? <Badge tone="accent">reviewed{review.reviewedAt ? ` ${new Date(review.reviewedAt).toLocaleDateString("en-IN")}` : ""}</Badge> : <Badge tone="warn">pending</Badge>}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-medium">Clarity (1–5)
                <select className="input mt-1" value={clarity} onChange={(e) => setClarity(e.target.value)}><option value="">Pending</option>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select>
              </label>
              <label className="text-xs font-medium">Factual quality (1–5)
                <select className="input mt-1" value={factual} onChange={(e) => setFactual(e.target.value)}><option value="">Pending</option>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select>
              </label>
              <label className="text-xs font-medium">Reviewer notes
                <input className="input mt-1" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Button variant="secondary" onClick={save}>Save review</Button>
              {msg && <span className="text-xs text-muted" role="status">{msg}</span>}
            </div>
          </fieldset>
        </div>
      )}
    </li>
  );
}
