"use client";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, HelpCircle, AlertTriangle, LifeBuoy } from "lucide-react";
import { track } from "@/lib/analytics/client";
import { CATEGORY_LABEL, type DecodeResult } from "@/lib/types";
import { Feedback } from "./Feedback";
import { ModeLabel, SafetyPanel } from "./SafetyPanel";
import { SourceCard } from "./SourceCard";
import { Badge, Card } from "./ui";

export function DecodeResultView({ result, compact = false, showFeedback = true }: { result: DecodeResult; compact?: boolean; showFeedback?: boolean }) {
  const r = result;
  useEffect(() => {
    track("explanation_viewed", { category: r.category, mode: r.mode });
  }, [r]);
  const refIndex = new Map(r.references.map((x, i) => [x.contentId, i + 1]));
  const distress = r.responseId === "pre-distress-v1";

  return (
    <div className="animate-rise space-y-4" aria-live="polite">
      <Card className={distress ? "border-info/30" : ""}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <ModeLabel mode={r.mode} demoReason={r.safety.demoReason} />
          {!distress && <Badge>{CATEGORY_LABEL[r.category]}</Badge>}
          {r.safety.masked && <Badge tone="info">Personal details removed</Badge>}
        </div>
        {distress && <LifeBuoy className="mb-2 text-info" aria-hidden />}
        <p className="text-xs font-medium uppercase tracking-wide text-muted">What you seem to be asking</p>
        <p className="mt-1 text-sm text-foreground/80">{r.intent}</p>
        <h2 className="mt-4 text-lg font-semibold leading-snug tracking-tight sm:text-xl">{r.summary}</h2>

        <ul className="mt-5 space-y-3">
          {r.points.map((p, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <span>
                {p.text}{" "}
                {p.contentIds.map((id) => (
                  <a key={id} href={`#ref-${id}`} className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-accent-soft px-1 align-text-top text-[11px] font-semibold text-accent-strong"
                    aria-label={`Source ${refIndex.get(id)}`}
                    onClick={() => {
                      const d = document.getElementById(`ref-${id}`) as HTMLDetailsElement | null;
                      if (d) d.open = true;
                    }}>
                    {refIndex.get(id)}
                  </a>
                ))}
              </span>
            </li>
          ))}
        </ul>

        {r.uncertainty.notes.length > 0 && (
          <div className="mt-5 rounded-xl border border-warn/20 bg-warn-soft/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-warn"><AlertTriangle size={16} aria-hidden /> What SIP Saathi can&apos;t know</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/85">
              {r.uncertainty.notes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <p className="flex items-center gap-2 text-sm font-semibold"><HelpCircle size={16} className="text-accent-strong" aria-hidden /> Questions you could reflect on</p>
          <ul className="mt-2 space-y-1.5 text-sm text-foreground/85">
            {r.reflectionQuestions.map((q, i) => <li key={i} className="rounded-lg bg-surface-2 px-3 py-2">{q}</li>)}
          </ul>
          <p className="mt-2 text-xs text-muted">SIP Saathi does not recommend continuing, pausing or stopping. These questions are for your own thinking.</p>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold">Sources ({r.references.length})</h3>
        <div className="space-y-2">
          {r.references.map((ref, i) => <SourceCard key={ref.contentId} r={ref} index={i + 1} />)}
        </div>
      </Card>

      <SafetyPanel mode={r.mode} checks={r.safety.checks} inputFlags={r.safety.inputFlags} judge={r.safety.judge} fallbackReason={r.safety.fallbackReason}
        masked={r.safety.masked} model={r.safety.model} versions={r.safety.versions} latencyMs={r.safety.latencyMs} cachedAt={r.safety.cached?.at} classifier={r.safety.classifier}
        defaultOpen={compact} />

      {!compact && r.nextSteps.length > 0 && (
        <nav aria-label="Next steps" className="flex flex-wrap gap-2">
          {r.nextSteps.map((s) => (
            <Link key={s.href} href={s.href} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2">
              {s.label} <ArrowRight size={14} aria-hidden />
            </Link>
          ))}
        </nav>
      )}
      {showFeedback && !compact && <Feedback surface="decoder" />}
    </div>
  );
}

export function ResultSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Preparing explanation">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="skeleton h-5 w-40" />
        <div className="skeleton mt-4 h-6 w-4/5" />
        <div className="skeleton mt-5 h-4 w-full" />
        <div className="skeleton mt-2 h-4 w-11/12" />
        <div className="skeleton mt-2 h-4 w-3/4" />
      </div>
      <p className="text-center text-xs text-muted">Screening input, retrieving approved sources and checking the answer…</p>
    </div>
  );
}
