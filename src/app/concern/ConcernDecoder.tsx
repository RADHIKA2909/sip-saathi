"use client";
import { useRef, useState } from "react";
import { Activity, TrendingDown, Coins, MessagesSquare, CreditCard, Wallet, AlertCircle, Send } from "lucide-react";
import { DecodeResultView, ResultSkeleton } from "@/components/DecodeResultView";
import { Button, Callout, PageHeader, cx } from "@/components/ui";
import { track } from "@/lib/analytics/client";
import { api } from "@/lib/client/api";
import { SESSION_KEYS, writeSession } from "@/lib/client/session";
import { CANVAS_EXAMPLE } from "@/lib/scenarios";
import type { ConcernCategory, DecodeResult } from "@/lib/types";

const CHIPS: { id: ConcernCategory; label: string; icon: typeof TrendingDown; prompt: string }[] = [
  { id: "negative_returns", label: "I can't tell how my SIP is progressing", icon: Activity, prompt: CANVAS_EXAMPLE },
  { id: "negative_returns", label: "My SIP shows negative returns", icon: TrendingDown, prompt: "My SIP shows negative returns. What does that mean?" },
  { id: "small_contributions", label: "My contribution feels too small", icon: Coins, prompt: "My monthly SIP amount feels too small to matter." },
  { id: "conflicting_information", label: "I keep hearing conflicting advice", icon: MessagesSquare, prompt: "I keep hearing conflicting advice about SIPs and don't know what to believe." },
  { id: "payment_failure", label: "An instalment failed", icon: CreditCard, prompt: "One of my SIP instalments failed. What does that mean?" },
  { id: "affordability", label: "Money is tight right now", icon: Wallet, prompt: "Money is tight right now and I'm finding my SIP hard to afford." },
];

const MAX = 600;

export function ConcernDecoder() {
  const [text, setText] = useState("");
  const [chip, setChip] = useState<ConcernCategory | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DecodeResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  async function submit(category?: ConcernCategory, override?: string) {
    const body = { text: (override ?? text).trim(), category };
    if (!body.text && !category) {
      setError("Type a question or choose one of the concerns above.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    track("concern_selected", { category: category ?? "general_knowledge", via: body.text && !override ? "free_text" : "chip" });
    try {
      const r = await api.decode(body);
      setResult(r);
      writeSession(SESSION_KEYS.decode, r);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div>
        <PageHeader eyebrow="AI Concern Decoder" title="What's on your mind about your SIP?">
          Choose a concern or describe it in your own words. Please don&apos;t include your PAN, account numbers or other personal details.
        </PageHeader>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Common concerns</legend>
          <div className="grid gap-2">
            {CHIPS.map((c) => {
              const Icon = c.icon;
              const on = chip === c.id && text === c.prompt;
              return (
                <button key={c.prompt} type="button" aria-pressed={on} disabled={loading}
                  onClick={() => { setChip(c.id); setText(c.prompt); void submit(c.id, c.prompt); }}
                  className={cx("flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                    on ? "border-accent-strong bg-accent-soft text-accent-strong" : "border-border bg-surface hover:border-border-strong hover:bg-surface-2")}>
                  <Icon size={18} aria-hidden className={on ? "text-accent-strong" : "text-muted"} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <form className="mt-6" onSubmit={(e) => { e.preventDefault(); setChip(undefined); void submit(undefined); }}>
          <label htmlFor="q" className="mb-2 block text-sm font-semibold">Or ask in your own words</label>
          <textarea id="q" value={text} maxLength={MAX} rows={4} onChange={(e) => setText(e.target.value)} aria-describedby="q-help"
            placeholder="e.g. My SIP value dropped after I started. Did I do something wrong?"
            className="w-full resize-y rounded-xl border border-border-strong bg-surface p-3.5 text-[15px] leading-relaxed placeholder:text-muted/70" />
          <div id="q-help" className="mt-1 flex justify-between text-xs text-muted">
            <span>Educational answers only, never a recommendation.</span>
            <span aria-live="polite">{text.length}/{MAX}</span>
          </div>
          <Button type="submit" className="mt-3 w-full sm:w-auto" disabled={loading || !text.trim()}>
            <Send size={16} aria-hidden /> {loading ? "Decoding…" : "Decode my concern"}
          </Button>
        </form>
      </div>

      <div ref={resultRef} tabIndex={-1} className="outline-none" aria-label="Explanation">
        {loading && <ResultSkeleton />}
        {error && (
          <Callout tone="danger" icon={<AlertCircle size={18} aria-hidden />} title="We couldn't get an explanation">
            {error}{" "}
            <button type="button" className="font-semibold underline" onClick={() => void submit(chip)}>Try again</button>
          </Callout>
        )}
        {result && !loading && <DecodeResultView result={result} />}
        {!result && !loading && !error && (
          <div className="grid h-full min-h-64 place-items-center rounded-2xl border border-dashed border-border-strong bg-surface/60 p-8 text-center">
            <div>
              <p className="font-semibold">Your explanation will appear here</p>
              <p className="mt-1 max-w-sm text-sm text-muted">It will show which sources were used, what SIP Saathi can&apos;t know, and every safety check that ran.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
