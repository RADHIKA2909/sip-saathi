"use client";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Feedback } from "@/components/Feedback";
import { SourceCard } from "@/components/SourceCard";
import { Badge, Callout, Card, PageHeader, cx } from "@/components/ui";
import { readSession, SESSION_KEYS } from "@/lib/client/session";
import { resolveAll } from "@/lib/pipeline/retrieve";
import { computeJourney, formatINR, gainLoss, rupeeCostAverage } from "@/lib/sip/calc";
import type { StoredJourney } from "../journey/JourneyMirror";

function Concept({ id, n, title, children, sources }: { id: string; n: number; title: string; children: React.ReactNode; sources: string[] }) {
  return (
    <Card as="section" aria-labelledby={`${id}-h`} id={id} className="scroll-mt-28">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-sm font-semibold text-accent-strong" aria-hidden>{n}</span>
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-h`} className="text-lg font-semibold tracking-tight">{title}</h2>
          <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-foreground/90">{children}</div>
          <div className="mt-4 space-y-2">{resolveAll(sources).map((r) => <SourceCard key={r.contentId} r={r} />)}</div>
        </div>
      </div>
    </Card>
  );
}

const parseNum = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(/,/g, "")));

export function MarketExplainer() {
  const [contributed, setContributed] = useState("");
  const [value, setValue] = useState("");
  const [prefilled, setPrefilled] = useState(false);
  const [instalment, setInstalment] = useState("1000");
  const [navs, setNavs] = useState(["20", "10"]);

  useEffect(() => {
    const j = readSession<StoredJourney>(SESSION_KEYS.journey);
    if (j) {
      const r = computeJourney(j.input);
      if (r.ok) { setContributed(String(r.stats.totalContributed)); setPrefilled(true); }
    }
  }, []);

  const c = parseNum(contributed);
  const v = parseNum(value);
  const gl = Number.isFinite(c) && Number.isFinite(v) && c >= 0 && v >= 0 ? gainLoss(c, v) : null;
  const rca = rupeeCostAverage(parseNum(instalment), navs.map(parseNum));
  const instValid = Number.isFinite(parseNum(instalment)) && parseNum(instalment) > 0;

  return (
    <div>
      <PageHeader eyebrow="Market Context Explainer" title="Five ideas that make a SIP statement readable">
        No forecasts and no reassurance that losses will recover. Just what the numbers mean, using figures you type in yourself.
      </PageHeader>
      <nav aria-label="On this page" className="mb-6 flex flex-wrap gap-2 text-sm">
        {[["contribution", "Contribution"], ["market-value", "Market value"], ["gain-loss", "Gain or loss"], ["volatility", "Volatility"], ["time-horizon", "Time horizon"]].map(([id, l]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-border bg-surface px-3 py-1.5 font-medium hover:bg-surface-2">{l}</a>
        ))}
      </nav>
      <div className="space-y-5">
        <Concept id="contribution" n={1} title="Contribution: the money you put in" sources={["amfi-guide-sip-definition"]}>
          <p>Your contribution is the total of all instalments that actually went through. It only changes when you invest or when an instalment fails. It does not move with the market.</p>
        </Concept>
        <Concept id="market-value" n={2} title="Market value: what your units are worth today" sources={["amfi-guide-units-at-nav", "amfi-guide-nav-definition"]}>
          <p>Each instalment buys <strong>units</strong> at that day&apos;s NAV. Market value = units you hold × the latest NAV. Because NAV changes every trading day, market value changes too, even when you do nothing.</p>
        </Concept>
        <Concept id="gain-loss" n={3} title="Gain or loss: the gap between the two" sources={["amfi-guide-risks"]}>
          <p>Gain or loss = market value − contribution. A negative number means today&apos;s value is below what you put in. It describes the present moment, not what will happen next.</p>
          <div className="rounded-xl border border-border bg-surface-2/60 p-4">
            <p className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold">Try it with your own statement <Badge tone="neutral">Stays in your browser</Badge></p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="contrib" className="mb-1 block text-sm font-medium">Total contributed (₹)</label>
                <input id="contrib" inputMode="decimal" className="input" value={contributed} onChange={(e) => { setContributed(e.target.value.replace(/[^\d.]/g, "")); setPrefilled(false); }} placeholder="5000" />
                {prefilled && <p className="mt-1 text-xs text-muted">Prefilled from your Journey Mirror.</p>}
              </div>
              <div>
                <label htmlFor="mv" className="mb-1 block text-sm font-medium">Current value on your statement (₹)</label>
                <input id="mv" inputMode="decimal" className="input" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))} placeholder="4600" />
              </div>
            </div>
            <div className="mt-4" aria-live="polite">
              {gl ? (
                <p className="text-sm">
                  Based on the values you entered:{" "}
                  <strong className={cx("tabular-nums", gl.amount < 0 ? "text-danger" : "text-accent-strong")}>
                    {gl.amount < 0 ? "−" : gl.amount > 0 ? "+" : ""}{formatINR(Math.abs(gl.amount))}
                  </strong>
                  {gl.pctOfContributed !== null && <> ({gl.pctOfContributed > 0 ? "+" : ""}{gl.pctOfContributed}% of what you contributed)</>}
                  . {gl.amount < 0 ? "Your units are currently worth less than you put in." : gl.amount > 0 ? "Your units are currently worth more than you put in." : "Your units are currently worth what you put in."}
                </p>
              ) : (
                <p className="text-sm text-muted">Enter both numbers to see the gap. SIP Saathi never fetches or guesses market values.</p>
              )}
            </div>
          </div>
        </Concept>
        <Concept id="volatility" n={4} title="Volatility: values move up and down" sources={["amfi-guide-equity-volatile", "sebi-booklet-volatility-risk", "amfi-guide-rupee-cost-averaging"]}>
          <p>Equity scheme values can swing in the short term. With a fixed instalment, a lower NAV buys more units and a higher NAV buys fewer. Try hypothetical NAVs below to see the arithmetic. This illustrates the mechanism only and is not a prediction.</p>
          <div className="rounded-xl border border-border bg-surface-2/60 p-4">
            <p className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold">Unit arithmetic <Badge tone="warn">Hypothetical numbers, not market data</Badge></p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="inst" className="mb-1 block text-sm font-medium">Instalment (₹)</label>
                <input id="inst" inputMode="decimal" className="input" value={instalment} onChange={(e) => setInstalment(e.target.value.replace(/[^\d.]/g, ""))} />
              </div>
              {navs.map((n, i) => (
                <div key={i}>
                  <label htmlFor={`nav${i}`} className="mb-1 block text-sm font-medium">Month {i + 1} NAV (₹)</label>
                  <input id={`nav${i}`} inputMode="decimal" className="input" value={n} onChange={(e) => setNavs(navs.map((x, j) => (j === i ? e.target.value.replace(/[^\d.]/g, "") : x)))} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              {navs.length < 6 && <button type="button" className="min-h-10 rounded-lg px-3 text-sm font-semibold text-accent-strong hover:bg-accent-soft" onClick={() => setNavs([...navs, ""])}>+ Add a month</button>}
              {navs.length > 2 && <button type="button" className="min-h-10 rounded-lg px-3 text-sm font-semibold text-muted hover:bg-surface-2" onClick={() => setNavs(navs.slice(0, -1))}>Remove last</button>}
            </div>
            <div className="mt-3 text-sm" aria-live="polite">
              {instValid && rca.averageCost !== null ? (
                <p>
                  {rca.units.map((u, i) => <span key={i}>Month {i + 1}: {u.toFixed(2)} units. </span>)}
                  Total <strong className="tabular-nums">{rca.totalUnits.toFixed(2)} units</strong> for {formatINR(rca.totalInvested)}, an average cost of{" "}
                  <strong className="tabular-nums">₹{rca.averageCost.toFixed(2)}</strong> per unit.
                </p>
              ) : (
                <p className="text-muted">Enter a positive instalment and at least one positive NAV.</p>
              )}
              <p className="mt-2 text-xs text-muted">AMFI notes that this averaging does not guarantee profits or prevent losses.</p>
            </div>
          </div>
        </Concept>
        <Concept id="time-horizon" n={5} title="Time horizon: when you will need the money" sources={["sebi-booklet-goal-horizons", "amfi-guide-goal-based"]}>
          <p>SEBI&apos;s booklet groups goals into three horizons. Knowing yours helps you judge whether short-term movements matter for your goal. Only you can decide what fits.</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[["Short term", "A few months to 1 year"], ["Medium term", "1 to 8 years"], ["Long term", "8 years or more"]].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-border bg-surface p-3"><p className="text-sm font-semibold">{t}</p><p className="text-sm text-muted">{d}</p></div>
            ))}
          </div>
        </Concept>
        <Callout tone="info" icon={<Info size={18} aria-hidden />} title="What this page will never do">
          Forecast markets, say when a loss will recover, estimate future returns or tell you whether to continue. For questions about your specific holdings, your provider&apos;s statement and the scheme documents are the authoritative sources.
        </Callout>
        <Feedback surface="market" />
      </div>
    </div>
  );
}
