"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { ContributionChart } from "@/components/ContributionChart";
import { Feedback } from "@/components/Feedback";
import { Badge, Callout, Card, PageHeader, Stat, cx } from "@/components/ui";
import { track } from "@/lib/analytics/client";
import { SESSION_KEYS, readSession, writeSession } from "@/lib/client/session";
import { computeJourney, currentMonth, DEMO_JOURNEY, formatINR, type JourneyInput } from "@/lib/sip/calc";

export interface StoredJourney { dataset: "demo" | "manual"; input: JourneyInput }

export function JourneyMirror() {
  const [dataset, setDataset] = useState<"demo" | "manual">("demo");
  const [form, setForm] = useState({ monthlyAmount: "", startMonth: "", successfulInstalments: "", includeAsOfMonth: true });
  const [submitted, setSubmitted] = useState<JourneyInput | null>(null);

  useEffect(() => {
    const s = readSession<StoredJourney>(SESSION_KEYS.journey);
    if (s?.dataset === "manual") {
      setDataset("manual");
      setForm({ monthlyAmount: String(s.input.monthlyAmount), startMonth: s.input.startMonth, successfulInstalments: String(s.input.successfulInstalments), includeAsOfMonth: s.input.includeAsOfMonth });
      setSubmitted(s.input);
    }
  }, []);

  const input: JourneyInput | null = dataset === "demo" ? DEMO_JOURNEY : submitted;
  const result = useMemo(() => (input ? computeJourney(input) : null), [input]);

  useEffect(() => {
    if (result?.ok && input) {
      track("progress_explored", { dataset });
      // Browsing the demo tab must not replace a journey already on the Canvas.
      if (dataset === "manual" || !readSession(SESSION_KEYS.journey)) writeSession<StoredJourney>(SESSION_KEYS.journey, { dataset, input });
    }
  }, [result, input, dataset]);

  const draft: JourneyInput = {
    monthlyAmount: Number(form.monthlyAmount),
    startMonth: form.startMonth,
    successfulInstalments: form.successfulInstalments === "" ? NaN : Number(form.successfulInstalments),
    asOfMonth: currentMonth(),
    includeAsOfMonth: form.includeAsOfMonth,
  };
  const errors = submitted && dataset === "manual" && result && !result.ok ? result.errors : {};

  return (
    <div>
      <PageHeader eyebrow="SIP Journey Mirror" title="See your contributions and consistency">
        Contributions only. SIP Saathi never shows or estimates returns, and it has no connection to your real portfolio.
      </PageHeader>

      <div role="tablist" aria-label="Data source" className="mb-6 inline-flex rounded-xl border border-border bg-surface p-1">
        {(["demo", "manual"] as const).map((d) => (
          <button key={d} role="tab" type="button" aria-selected={dataset === d} onClick={() => setDataset(d)}
            className={cx("min-h-10 rounded-lg px-4 text-sm font-medium", dataset === d ? "bg-accent-soft text-accent-strong" : "text-muted hover:text-foreground")}>
            {d === "demo" ? "Demo data" : "Enter my own"}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <Card className="self-start">
          {dataset === "demo" ? (
            <div className="space-y-3 text-sm">
              <Badge tone="warn">Fictional demo data</Badge>
              <p className="leading-relaxed text-muted">A made-up SIP used for illustration, not a real person or account:</p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                <dt className="text-muted">Monthly amount</dt><dd className="font-medium">{formatINR(DEMO_JOURNEY.monthlyAmount)}</dd>
                <dt className="text-muted">First instalment</dt><dd className="font-medium">November 2025</dd>
                <dt className="text-muted">Measured up to</dt><dd className="font-medium">October 2026 (included)</dd>
                <dt className="text-muted">Successful instalments</dt><dd className="font-medium">{DEMO_JOURNEY.successfulInstalments}</dd>
              </dl>
            </div>
          ) : (
            <form noValidate onSubmit={(e) => { e.preventDefault(); setSubmitted(draft); }} className="space-y-4">
              <p className="text-xs text-muted">Stays in this browser tab only. Nothing here is sent to a server.</p>
              <Field id="amt" label="Monthly instalment (₹)" error={errors.monthlyAmount}>
                <input id="amt" inputMode="numeric" value={form.monthlyAmount} onChange={(e) => setForm({ ...form, monthlyAmount: e.target.value.replace(/[^\d]/g, "") })}
                  className="input" placeholder="500" aria-invalid={Boolean(errors.monthlyAmount)} aria-describedby={errors.monthlyAmount ? "amt-err" : undefined} />
              </Field>
              <Field id="start" label="Month of first instalment" error={errors.startMonth}>
                <input id="start" type="month" max={currentMonth()} value={form.startMonth} onChange={(e) => setForm({ ...form, startMonth: e.target.value })}
                  className="input" aria-invalid={Boolean(errors.startMonth)} aria-describedby={errors.startMonth ? "start-err" : undefined} />
              </Field>
              <Field id="succ" label="Successful instalments so far" error={errors.successfulInstalments}>
                <input id="succ" inputMode="numeric" value={form.successfulInstalments} onChange={(e) => setForm({ ...form, successfulInstalments: e.target.value.replace(/[^\d]/g, "") })}
                  className="input" placeholder="10" aria-invalid={Boolean(errors.successfulInstalments)} aria-describedby={errors.successfulInstalments ? "succ-err" : undefined} />
              </Field>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent-strong)]" checked={form.includeAsOfMonth} onChange={(e) => setForm({ ...form, includeAsOfMonth: e.target.checked })} />
                This month&apos;s instalment date has already passed
              </label>
              <button type="submit" className="min-h-11 w-full rounded-xl bg-accent-strong px-4 text-sm font-semibold text-white hover:bg-[#006a4e]">Show my journey</button>
              <p className="text-xs text-muted">Find these numbers in your app or account statement. Assumes the same amount every month.</p>
            </form>
          )}
        </Card>

        <div className="space-y-4" aria-live="polite">
          {result?.ok ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Total contributed" value={formatINR(result.stats.totalContributed)} hint="Amount × successful instalments" />
                <Stat label="Consistency" value={result.stats.consistencyPct === null ? "–" : `${result.stats.consistencyPct}%`} hint="Successful ÷ scheduled" />
                <Stat label="Scheduled" value={result.stats.scheduledInstalments} hint="Since first instalment" />
                <Stat label="Missed or failed" value={result.stats.missedInstalments} />
              </div>
              <Card>
                <h2 className="text-sm font-semibold">Cumulative contributions</h2>
                <p className="mb-3 text-xs text-muted">Money you put in, by successful instalment. This is not market value.</p>
                <ContributionChart data={result.stats.cumulative} />
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-medium text-accent-strong">View as table</summary>
                  <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-border" tabIndex={0} role="region" aria-label="Contributions table">
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">Cumulative contributions by successful instalment</caption>
                      <thead className="bg-surface-2 text-xs text-muted"><tr><th scope="col" className="px-3 py-2">Instalment</th><th scope="col" className="px-3 py-2">Total contributed</th></tr></thead>
                      <tbody>{result.stats.cumulative.map((r) => <tr key={r.instalment} className="border-t border-border"><td className="px-3 py-1.5 tabular-nums">{r.instalment}</td><td className="px-3 py-1.5 tabular-nums">{formatINR(r.total)}</td></tr>)}</tbody>
                    </table>
                  </div>
                </details>
              </Card>
              <Callout tone="info" icon={<Info size={18} aria-hidden />} title="What this does and doesn't show">
                These figures are arithmetic on the numbers {dataset === "demo" ? "in the demo" : "you entered"}. They don&apos;t show market value, gains or losses, because SIP Saathi has no
                access to NAVs or your holdings. To compare with your statement&apos;s value, use{" "}
                <Link href="/market" className="font-semibold text-accent-strong underline">Market context</Link>.
                {result.stats.missedInstalments > 0 && <> For missed instalments, see <Link href="/payment" className="font-semibold text-accent-strong underline">Payment help</Link>.</>}
              </Callout>
              <div className="flex flex-wrap gap-2">
                <Link href="/canvas" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2">Add to Decision Clarity Canvas <ArrowRight size={14} aria-hidden /></Link>
              </div>
              <Feedback surface="journey" />
            </>
          ) : dataset === "manual" && !submitted ? (
            <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border-strong bg-surface/60 p-8 text-center">
              <div><p className="font-semibold">Enter your details to see your journey</p><p className="mt-1 text-sm text-muted">Or switch to demo data to explore first.</p></div>
            </div>
          ) : (
            result && !result.ok && <Callout tone="danger" title="Please check the highlighted fields">Fix the fields on the left and try again.</Callout>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error && <p id={`${id}-err`} className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
