"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, HelpCircle, Lightbulb, Printer, Search, Trash2, Compass } from "lucide-react";
import { Feedback } from "@/components/Feedback";
import { Badge, Button, ButtonLink, Callout, Card, PageHeader } from "@/components/ui";
import { track } from "@/lib/analytics/client";
import { readSession, SESSION_KEYS, writeSession } from "@/lib/client/session";
import { computeJourney, formatINR } from "@/lib/sip/calc";
import { CATEGORY_LABEL, STATEMENT_KIND_LABEL, type AdviceResult, type ConcernCategory, type DecodeResult } from "@/lib/types";
import type { StoredJourney } from "../journey/JourneyMirror";

const MISSING: Record<ConcernCategory, string[]> = {
  negative_returns: ["The current value on your own statement", "The risk-o-meter level of your scheme", "When you expect to need this money", "Whether your goal or situation has changed"],
  small_contributions: ["The goal this SIP is for, and its rough cost", "Your time horizon for that goal", "How much room your monthly budget has, including for emergencies"],
  conflicting_information: ["Who gave each piece of advice, and whether they are registered", "What each claim is based on", "Whether the advice fits your own goal and horizon"],
  payment_failure: ["The failure reason from your bank or app", "Whether the mandate is active, paused or expired", "How many instalments in a row have failed", "Your provider's confirmation of the SIP's status"],
  affordability: ["Your essential expenses over the next few months", "Whether you have an emergency buffer", "Your scheme's exit load and your provider's pause options", "Any upcoming income changes"],
  general_knowledge: ["Which part of your SIP is unclear", "Where your statement and scheme documents are"],
  out_of_scope: ["Whether your question relates to a mutual fund SIP"],
};

export function ClarityCanvas() {
  const [ready, setReady] = useState(false);
  const [decode, setDecode] = useState<DecodeResult | null>(null);
  const [journey, setJourney] = useState<StoredJourney | null>(null);
  const [advice, setAdvice] = useState<AdviceResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setDecode(readSession<DecodeResult>(SESSION_KEYS.decode));
    setJourney(readSession<StoredJourney>(SESSION_KEYS.journey));
    setAdvice(readSession<AdviceResult>(SESSION_KEYS.advice));
    setAnswers(readSession<Record<string, string>>(SESSION_KEYS.reflections) ?? {});
    setReady(true);
  }, []);

  const setAnswer = (q: string, v: string) => {
    const next = { ...answers, [q]: v };
    setAnswers(next);
    writeSession(SESSION_KEYS.reflections, next);
  };

  if (!ready) return <div className="skeleton h-64 w-full rounded-2xl" role="status" aria-label="Loading canvas" />;

  const category = decode?.category;
  const jr = journey ? computeJourney(journey.input) : null;
  const questions = decode?.reflectionQuestions ?? [];
  const answered = questions.filter((q) => (answers[q] ?? "").trim().length > 0).length;
  const empty = !decode && !journey && !advice;

  return (
    <div>
      <PageHeader eyebrow="Decision Clarity Canvas" title="Everything in one place, and the decision stays yours">
        A summary of what you explored in this tab. It contains no recommendation to continue, pause or stop. It stays in this browser tab and is cleared when you close it.
      </PageHeader>

      {empty ? (
        <Card className="text-center">
          <Compass className="mx-auto text-accent-strong" aria-hidden />
          <p className="mt-3 font-semibold">Your canvas is empty</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">Decode a concern, explore your journey, or check some advice first. The canvas fills in from what you do in this tab.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <ButtonLink href="/concern">Decode a concern</ButtonLink>
            <ButtonLink href="/journey" variant="secondary">Journey Mirror</ButtonLink>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="no-print flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => window.print()}><Printer size={16} aria-hidden /> Print or save as PDF</Button>
            <Button variant="ghost" onClick={() => { Object.values(SESSION_KEYS).forEach((k) => writeSession(k, null)); setDecode(null); setJourney(null); setAdvice(null); setAnswers({}); }}>
              <Trash2 size={16} aria-hidden /> Clear canvas
            </Button>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <h2 className="flex items-center gap-2 font-semibold"><ClipboardList size={18} className="text-accent-strong" aria-hidden /> 1. Your concern</h2>
              {decode ? (
                <div className="mt-3 space-y-2 text-sm">
                  <Badge>{CATEGORY_LABEL[decode.category]}</Badge>
                  <p className="leading-relaxed">{decode.intent}</p>
                </div>
              ) : <p className="mt-3 text-sm text-muted">Not explored yet. <Link className="font-semibold text-accent-strong underline" href="/concern">Decode a concern</Link></p>}
            </Card>

            <Card>
              <h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 size={18} className="text-accent-strong" aria-hidden /> 2. Known facts</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                {jr?.ok && journey && (
                  <li>
                    {journey.dataset === "demo" && <Badge tone="warn" className="mr-1">Demo data</Badge>}
                    {jr.stats.successfulInstalments} of {jr.stats.scheduledInstalments} scheduled instalments succeeded ({jr.stats.consistencyPct ?? "–"}% consistency); {formatINR(jr.stats.totalContributed)} contributed.
                  </li>
                )}
                {decode?.points.slice(0, 3).map((p) => <li key={p.text} className="text-foreground/90">{p.text} <span className="text-xs text-muted">(sourced)</span></li>)}
                {advice?.items.map((it) => <li key={it.statement}>“{it.statement}” was labelled <strong>{STATEMENT_KIND_LABEL[it.kind].toLowerCase()}</strong> (type of statement, not verified).</li>)}
                {!jr?.ok && !decode && !advice && <li className="text-muted">Nothing yet.</li>}
              </ul>
            </Card>

            <Card>
              <h2 className="flex items-center gap-2 font-semibold"><Search size={18} className="text-accent-strong" aria-hidden /> 3. Missing information</h2>
              <p className="mt-1 text-xs text-muted">Things SIP Saathi can&apos;t know, but which may matter to you.</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                {(category ? MISSING[category] : MISSING.general_knowledge).map((m) => <li key={m}>{m}</li>)}
                {decode?.uncertainty.notes.map((n) => <li key={n} className="text-foreground/80">{n}</li>)}
              </ul>
            </Card>

            <Card>
              <h2 className="flex items-center gap-2 font-semibold"><Lightbulb size={18} className="text-accent-strong" aria-hidden /> 4. General considerations</h2>
              <p className="mt-1 text-xs text-muted">From the sources behind your explanation. These are general, not personal.</p>
              {decode ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {decode.references.map((r) => (
                    <li key={r.contentId} className="rounded-lg bg-surface-2 px-3 py-2"><span className="font-medium">{r.publisher.replace(/ \(.*\)/, "")}:</span> {r.passage}</li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-sm text-muted">Decode a concern to see sourced considerations.</p>}
            </Card>
          </div>

          <Card>
            <h2 className="flex items-center gap-2 font-semibold"><HelpCircle size={18} className="text-accent-strong" aria-hidden /> 5. Reflection questions</h2>
            <p className="mt-1 text-xs text-muted">Optional. Your notes stay in this browser tab and are never sent anywhere.</p>
            {questions.length ? (
              <div className="mt-4 space-y-4">
                {questions.map((q, i) => (
                  <div key={q}>
                    <label htmlFor={`rq${i}`} className="block text-sm font-medium">{q}</label>
                    <textarea id={`rq${i}`} rows={2} className="mt-1.5 w-full rounded-xl border border-border-strong bg-surface p-3 text-sm" value={answers[q] ?? ""} onChange={(e) => setAnswer(q, e.target.value)} />
                  </div>
                ))}
                <div className="no-print flex flex-wrap items-center gap-3">
                  <Button disabled={answered === 0 || completed} onClick={() => { track("reflection_completed", { answered }); setCompleted(true); }}>
                    {completed ? "Reflection saved in this tab" : "Mark reflection complete"}
                  </Button>
                  <span className="text-xs text-muted">{answered} of {questions.length} answered. Only the count is recorded, never your words.</span>
                </div>
              </div>
            ) : <p className="mt-3 text-sm text-muted">Decode a concern to get reflection questions.</p>}
          </Card>

          <Callout tone="neutral" title="No recommendation">
            SIP Saathi deliberately doesn&apos;t tell you whether to continue, pause or stop. For a personal recommendation, a SEBI-registered professional can review your full situation.
          </Callout>
          <div className="no-print"><Feedback surface="canvas" /></div>
        </div>
      )}
    </div>
  );
}
