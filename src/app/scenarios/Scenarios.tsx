"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Play, ShieldAlert, Timer, XCircle } from "lucide-react";
import { DecodeResultView, ResultSkeleton } from "@/components/DecodeResultView";
import { Badge, Button, Callout, Card, PageHeader, cx } from "@/components/ui";
import { track } from "@/lib/analytics/client";
import { api } from "@/lib/client/api";
import { SESSION_KEYS, writeSession } from "@/lib/client/session";
import { validateGenerated } from "@/lib/pipeline/validate";
import { RED_TEAM } from "@/eval/redteam";
import { SCENARIOS, type Scenario } from "@/lib/scenarios";
import { computeJourney, DEMO_JOURNEY, formatINR } from "@/lib/sip/calc";
import type { DecodeResult } from "@/lib/types";

type Id = Scenario["id"];

export function Scenarios() {
  const [active, setActive] = useState<Id>("A");
  const s = SCENARIOS.find((x) => x.id === active)!;
  return (
    <div>
      <PageHeader eyebrow="Assessor walkthrough" title="Try 3 scenarios">
        Each takes about a minute. They follow different paths through the same pipeline, and each shows how a safety check changes what you see. The people described are fictional design scenarios, not research participants.
      </PageHeader>
      <div role="tablist" aria-label="Scenarios" className="mb-6 grid gap-2 sm:grid-cols-3">
        {SCENARIOS.map((x) => (
          <button key={x.id} role="tab" type="button" aria-selected={active === x.id} aria-controls={`panel-${x.id}`} id={`tab-${x.id}`} onClick={() => setActive(x.id)}
            className={cx("rounded-2xl border p-4 text-left transition-colors", active === x.id ? "border-accent-strong bg-accent-soft" : "border-border bg-surface hover:bg-surface-2")}>
            <span className={cx("text-xs font-semibold", active === x.id ? "text-accent-strong" : "text-muted")}>Scenario {x.id}</span>
            <span className="mt-1 block font-semibold leading-snug">{x.title}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${s.id}`} aria-labelledby={`tab-${s.id}`}>
        <ScenarioRunner key={s.id} s={s} />
      </div>
    </div>
  );
}

function useTimer(running: boolean) {
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  return { begin: () => { setStart(Date.now()); setNow(Date.now()); }, seconds: start ? Math.max(0, Math.round((now - start) / 1000)) : 0, started: start !== null };
}

function ScenarioRunner({ s }: { s: Scenario }) {
  const [main, setMain] = useState<DecodeResult | null>(null);
  const [follow, setFollow] = useState<DecodeResult | null>(null);
  const [redteam, setRedteam] = useState(false);
  const [loading, setLoading] = useState<"main" | "follow" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const timer = useTimer(!done);

  async function run(which: "main" | "follow") {
    if (which === "main") timer.begin();
    setLoading(which);
    setError(null);
    try {
      if (which === "main") {
        track("concern_selected", { category: s.category, via: "scenario" });
        const r = await api.decode({ scenarioId: s.id });
        setMain(r);
        writeSession(SESSION_KEYS.decode, r);
      } else if (s.followUp.id === "A-unsafe") {
        setFollow(await api.decode({ scenarioId: "A-unsafe" }));
      } else if (s.followUp.id === "C-pii") {
        setFollow(await api.decode({ text: s.followUp.text }));
      } else {
        setRedteam(true);
      }
      if (which === "follow" && !done) { setDone(true); track("scenario_completed", { scenario: s.id }); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
      <div className="space-y-4">
        <Card>
          <Badge tone="warn">Fictional scenario</Badge>
          <p className="mt-3 text-sm text-muted">{s.persona}</p>
          <blockquote className="mt-3 rounded-xl border-l-4 border-accent bg-accent-softer p-3 text-[15px] leading-relaxed">“{s.text}”</blockquote>
          <p className="mt-3 text-xs text-muted"><span className="font-semibold text-foreground">Safety focus:</span> {s.safetyFocus}</p>
          <Button className="mt-4 w-full" onClick={() => void run("main")} disabled={loading !== null}>
            <Play size={16} aria-hidden /> {main ? "Run again" : "Step 1: Run this scenario"}
          </Button>
        </Card>
        {main && (
          <Card className="animate-rise">
            <p className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert size={18} className="text-info" aria-hidden /> Step 2: {s.followUp.label}</p>
            {s.followUp.text && <blockquote className="mt-2 rounded-xl bg-surface-2 p-3 text-sm">“{s.followUp.text}”</blockquote>}
            <p className="mt-2 text-xs leading-relaxed text-muted">{s.followUp.explains}</p>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => void run("follow")} disabled={loading !== null}>{s.followUp.label}</Button>
          </Card>
        )}
        {timer.started && (
          <p className="flex items-center gap-1.5 text-xs text-muted" aria-live="off"><Timer size={14} aria-hidden /> {timer.seconds}s elapsed{done ? " · scenario complete" : ""}</p>
        )}
        {s.id === "B" && main && <BJourney />}
      </div>

      <div className="space-y-6">
        {error && <Callout tone="danger" icon={<AlertCircle size={18} aria-hidden />} title="Couldn't run the scenario">{error} <button type="button" className="font-semibold underline" onClick={() => void run(main ? "follow" : "main")}>Try again</button></Callout>}
        {loading === "main" && <ResultSkeleton />}
        {main && loading !== "main" && <DecodeResultView result={main} compact showFeedback={false} />}
        {loading === "follow" && <ResultSkeleton />}
        {follow && (
          <section aria-labelledby="fu-h" className="space-y-3">
            <h2 id="fu-h" className="text-sm font-semibold uppercase tracking-wide text-muted">Follow-up result</h2>
            <DecodeResultView result={follow} compact showFeedback={false} />
          </section>
        )}
        {redteam && <RedTeamDemo />}
        {done && (
          <Card className="animate-rise">
            <p className="flex items-center gap-2 font-semibold"><CheckCircle2 size={18} className="text-accent-strong" aria-hidden /> Scenario {s.id} complete</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {main?.nextSteps.map((n) => <Link key={n.href} href={n.href} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2">{n.label} <ArrowRight size={14} aria-hidden /></Link>)}
              <Link href="/eval" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2">See all 24 evaluation cases <ArrowRight size={14} aria-hidden /></Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function BJourney() {
  const r = computeJourney(DEMO_JOURNEY);
  if (!r.ok) return null;
  return (
    <Card>
      <p className="text-sm font-semibold">The same ₹500 SIP in the Journey Mirror</p>
      <p className="mt-1 text-xs text-muted">Fictional demo data. Contributions only, no projections.</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-surface-2 p-2"><dt className="text-xs text-muted">Contributed</dt><dd className="font-semibold tabular-nums">{formatINR(r.stats.totalContributed)}</dd></div>
        <div className="rounded-lg bg-surface-2 p-2"><dt className="text-xs text-muted">Consistency</dt><dd className="font-semibold tabular-nums">{r.stats.consistencyPct}%</dd></div>
      </dl>
      <Link href="/journey" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-strong underline">Open the Journey Mirror</Link>
    </Card>
  );
}

function RedTeamDemo() {
  const fixture = RED_TEAM.find((f) => f.id === "RT-06")!;
  const v = validateGenerated(fixture.output, fixture.retrieved, "");
  const out = fixture.output as { summary: string };
  return (
    <Card className="animate-rise">
      <div className="flex flex-wrap items-center gap-2"><Badge tone="danger">Blocked draft</Badge><Badge>Written by developers, not AI</Badge></div>
      <p className="mt-3 rounded-xl border border-danger/20 bg-danger-soft p-3 text-sm italic">“{out.summary}”</p>
      <ul className="mt-4 space-y-1.5 text-sm">
        {v.checks.map((c) => (
          <li key={c.id} className="flex gap-2">
            {c.passed ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent-strong" aria-label="passed" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-danger" aria-label="failed" />}
            <span>{c.label}{c.detail && <span className="block text-xs text-muted">{c.detail}</span>}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">
        Result: <strong>{v.failReason ? "blocked" : "allowed"}</strong>. A real AI answer that failed like this would never be shown. The user would see the preapproved small-contributions response instead, like the one above.
      </p>
    </Card>
  );
}
