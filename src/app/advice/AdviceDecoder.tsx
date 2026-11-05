"use client";
import { useRef, useState } from "react";
import { AlertCircle, Plus, Trash2, Wand2, Info } from "lucide-react";
import { Feedback } from "@/components/Feedback";
import { ModeLabel, SafetyPanel } from "@/components/SafetyPanel";
import { SourceCard } from "@/components/SourceCard";
import { Badge, Button, Callout, Card, PageHeader } from "@/components/ui";
import { api } from "@/lib/client/api";
import { SESSION_KEYS, writeSession } from "@/lib/client/session";
import { STATEMENT_KIND_LABEL, type AdviceResult, type StatementKind } from "@/lib/types";

const TONE: Record<StatementKind, "accent" | "info" | "warn" | "danger"> = { verifiable_fact: "accent", opinion: "info", assumption: "warn", unsupported_claim: "danger" };
const EXAMPLES = ["SIPs never lose money if you hold for 5 years.", "A monthly SIP is cancelled after 3 failed instalments in a row.", "I think small SIPs are a waste of time."];

export function AdviceDecoder() {
  const [items, setItems] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdviceResult | null>(null);
  const out = useRef<HTMLDivElement>(null);
  const valid = items.map((s) => s.trim()).filter((s) => s.length >= 3);

  async function submit(list = valid) {
    if (!list.length) { setError("Enter at least one statement of 3 or more characters."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await api.advice(list);
      setResult(r);
      writeSession(SESSION_KEYS.advice, r);
      requestAnimationFrame(() => out.current?.focus());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div>
        <PageHeader eyebrow="Conflicting Advice Decoder" title="Untangle what you've heard">
          Paste up to three short statements from friends, videos or posts. SIP Saathi labels the <em>type</em> of each statement. It does not browse the web or verify claims.
        </PageHeader>
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-3">
          {items.map((s, i) => (
            <div key={i}>
              <label htmlFor={`st${i}`} className="mb-1 block text-sm font-medium">Statement {i + 1}</label>
              <div className="flex gap-2">
                <textarea id={`st${i}`} rows={2} maxLength={280} value={s} onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.value : x)))}
                  className="w-full rounded-xl border border-border-strong bg-surface p-3 text-[15px]" placeholder="e.g. Stop your SIP before the crash" />
                {items.length > 1 && (
                  <button type="button" aria-label={`Remove statement ${i + 1}`} onClick={() => setItems(items.filter((_, j) => j !== i))} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-muted hover:bg-surface-2">
                    <Trash2 size={16} aria-hidden />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {items.length < 3 && <Button variant="ghost" onClick={() => setItems([...items, ""])}><Plus size={16} aria-hidden /> Add statement</Button>}
            <Button variant="ghost" onClick={() => { setItems(EXAMPLES); void submit(EXAMPLES); }}><Wand2 size={16} aria-hidden /> Try examples</Button>
          </div>
          <Button type="submit" disabled={loading || !valid.length}>{loading ? "Decoding…" : "Decode statements"}</Button>
          <p className="text-xs text-muted">Don&apos;t paste personal details. Identifiers are removed automatically.</p>
        </form>
      </div>

      <div ref={out} tabIndex={-1} className="space-y-4 outline-none" aria-live="polite" aria-label="Statement analysis">
        {loading && <div className="space-y-3" role="status" aria-label="Decoding statements">{[0, 1].map((i) => <div key={i} className="skeleton h-28 w-full rounded-2xl" />)}</div>}
        {error && <Callout tone="danger" icon={<AlertCircle size={18} aria-hidden />} title="Couldn't decode">{error}</Callout>}
        {result && !loading && (
          <div className="animate-rise space-y-4">
            <div className="flex flex-wrap items-center gap-2"><ModeLabel mode={result.mode} />{result.safety.masked && <Badge tone="info">Personal details removed</Badge>}</div>
            {result.items.map((it, i) => (
              <Card key={i}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[15px] font-medium">“{it.statement}”</p>
                  <Badge tone={TONE[it.kind]}>{STATEMENT_KIND_LABEL[it.kind]}</Badge>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90"><span className="font-semibold">Why: </span>{it.reason}</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90"><span className="font-semibold">How you could check: </span>{it.howToCheck}</p>
                {it.related.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-medium text-muted">Related background (does not prove or disprove the statement)</p>
                    <div className="space-y-2">{it.related.map((r) => <SourceCard key={r.contentId} r={r} />)}</div>
                  </div>
                )}
              </Card>
            ))}
            <Callout tone="warn" icon={<Info size={18} aria-hidden />} title="Limitations">
              <ul className="list-disc space-y-1 pl-4">{result.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
            </Callout>
            <SafetyPanel mode={result.mode} checks={result.safety.checks} inputFlags={result.safety.inputFlags} masked={result.safety.masked} fallbackReason={result.safety.fallbackReason}
              model={result.safety.model} versions={result.safety.versions} latencyMs={result.safety.latencyMs} />
            <Feedback surface="advice" />
          </div>
        )}
        {!result && !loading && !error && (
          <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border-strong bg-surface/60 p-8 text-center">
            <div className="max-w-sm">
              <p className="font-semibold">Four labels</p>
              <ul className="mt-3 space-y-2 text-left text-sm">
                <li><Badge tone="accent">Checkable fact</Badge> a specific claim you could look up (not confirmed here)</li>
                <li><Badge tone="info">Opinion</Badge> a judgement or preference</li>
                <li><Badge tone="warn">Assumption</Badge> depends on a condition or the future</li>
                <li><Badge tone="danger">Unsupported claim</Badge> a promise or certainty no source could back</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
