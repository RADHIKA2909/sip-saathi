"use client";
import { useEffect, useState } from "react";
import { Target, Shield, Hourglass } from "lucide-react";
import { Callout, Card, PageHeader } from "@/components/ui";
import { EVENT_LABEL, EVENT_NAMES } from "@/lib/analytics/events";

interface Data { counts: Record<string, number>; runs: { requestedMode: string; passed: number; total: number; startedAt: string }[]; storage: { mode: string; persistent: boolean } }

const LEADING = [
  { name: "Understanding", def: "Share of explanation views followed by a usefulness rating of 4–5.", source: "explanation_viewed, helpfulness_feedback (usefulness)" },
  { name: "Perceived clarity", def: "Mean clarity rating (1–5) across surfaces.", source: "helpfulness_feedback (clarity)" },
  { name: "Task completion", def: "Share of sessions that reach a reflection or open a source after a concern.", source: "concern_selected → source_opened / reflection_completed" },
  { name: "Progress exploration", def: "Share of concerns followed by a Journey Mirror view.", source: "progress_explored" },
];
const GUARDRAILS = [
  { name: "Unsafe advice rate (shown to users)", def: "Target 0. Outputs breaking a safety rule are blocked before display. Monitor the blocked rate as a model-quality signal.", source: "safe_fallback_triggered (safety_rule, judge_blocked) and evaluation runs" },
  { name: "Unsupported claims", def: "Share of live generations blocked for invented or unretrieved citations, unsupported numbers or low source overlap.", source: "safe_fallback_triggered (unsupported_reference, ungrounded_claim)" },
  { name: "Inappropriate retention pressure", def: "Target 0. The no_pressure rule blocks fear, urgency and FOMO language. A human audit is still needed.", source: "evaluation runs (safety_rules), human review" },
];

export function Insights() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    fetch("/api/insights", { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject())).then(setD).catch(() => setErr(true));
  }, []);
  const c = d?.counts ?? {};
  const fb = (prop: string) => {
    let n = 0, sum = 0;
    for (let i = 1; i <= 5; i++) { const k = c[`helpfulness_feedback|${prop}=${i}`] ?? 0; n += k; sum += k * i; }
    return n ? `${(sum / n).toFixed(1)} (n=${n})` : "No ratings yet";
  };
  const fallbackReasons = Object.entries(c).filter(([k]) => k.startsWith("safe_fallback_triggered|reason=")).map(([k, v]) => [k.split("=")[1], v] as const);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Product metrics" title="What this prototype measures, and what it can't">
        Real, privacy-safe event counts from this deployment. No synthetic data. Events carry only enumerated labels (for example a concern category), never text, amounts or identifiers.
      </PageHeader>

      <Callout tone="warn" icon={<Hourglass size={18} aria-hidden />} title="North-star outcome: not measurable here">
        The business goal is the share of first-time investors with an active SIP 12 months after starting (at least one successful instalment in the previous 30 days). This prototype has no
        accounts or transaction data and cannot measure it. Leading indicators below would need a controlled study before anyone could link them to retention.
      </Callout>

      <Card>
        <h2 className="font-semibold">Live event counts</h2>
        <p className="mt-1 text-xs text-muted">{d ? `Storage: ${d.storage.mode}${d.storage.persistent ? "" : " (temporary, resets on restart)"}. Includes assessor and developer testing.` : err ? "Couldn't load counts." : "Loading…"}</p>
        <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Event counts table">
          <table className="w-full min-w-[420px] text-left text-sm">
            <caption className="sr-only">Event counts</caption>
            <thead className="text-xs text-muted"><tr><th scope="col" className="py-2 pr-4">Event</th><th scope="col" className="py-2 text-right">Count</th></tr></thead>
            <tbody>
              {EVENT_NAMES.map((n) => <tr key={n} className="border-t border-border"><td className="py-2 pr-4">{EVENT_LABEL[n]}<span className="ml-2 font-mono text-xs text-muted">{n}</span></td><td className="py-2 text-right tabular-nums">{d ? c[n] ?? 0 : "–"}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-xl bg-surface-2 p-3"><p className="text-xs text-muted">Mean usefulness</p><p className="font-semibold">{d ? fb("usefulness") : "–"}</p></div>
          <div className="rounded-xl bg-surface-2 p-3"><p className="text-xs text-muted">Mean clarity</p><p className="font-semibold">{d ? fb("clarity") : "–"}</p></div>
          <div className="rounded-xl bg-surface-2 p-3"><p className="text-xs text-muted">Fallbacks by reason</p><p className="font-semibold">{fallbackReasons.length ? fallbackReasons.map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(", ") : d ? "None yet" : "–"}</p></div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="flex items-center gap-2 font-semibold"><Target size={18} className="text-accent-strong" aria-hidden /> Leading indicators</h2>
          <dl className="mt-3 space-y-3 text-sm">{LEADING.map((m) => <div key={m.name}><dt className="font-medium">{m.name}</dt><dd className="text-muted">{m.def} <span className="block text-xs">Events: {m.source}</span></dd></div>)}</dl>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 font-semibold"><Shield size={18} className="text-accent-strong" aria-hidden /> Guardrails</h2>
          <dl className="mt-3 space-y-3 text-sm">{GUARDRAILS.map((m) => <div key={m.name}><dt className="font-medium">{m.name}</dt><dd className="text-muted">{m.def} <span className="block text-xs">Source: {m.source}</span></dd></div>)}</dl>
        </Card>
      </div>
    </div>
  );
}
