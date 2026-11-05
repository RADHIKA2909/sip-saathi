"use client";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { track } from "@/lib/analytics/client";
import { cx } from "./ui";

type Surface = "decoder" | "advice" | "canvas" | "payment" | "journey" | "market";

function Scale({ label, value, onChange, name }: { label: string; value: number | null; onChange: (n: number) => void; name: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={cx("grid h-10 w-10 cursor-pointer place-items-center rounded-lg border text-sm font-medium transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--ring)]",
            value === n ? "border-accent-strong bg-accent-soft text-accent-strong" : "border-border bg-surface hover:bg-surface-2")}>
            <input type="radio" className="sr-only" name={name} value={n} checked={value === n} onChange={() => onChange(n)} />
            {n}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Feedback({ surface }: { surface: Surface }) {
  const [usefulness, setU] = useState<number | null>(null);
  const [clarity, setC] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <p className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent-soft p-4 text-sm text-accent-strong" role="status">
        <CheckCircle2 size={18} aria-hidden /> Thank you. Only your two ratings were recorded, nothing else.
      </p>
    );
  return (
    <form
      className="rounded-xl border border-border bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!usefulness && !clarity) return;
        track("helpfulness_feedback", { surface, usefulness: usefulness ?? undefined, clarity: clarity ?? undefined });
        setSent(true);
      }}
    >
      <p className="text-sm font-semibold">Was this helpful? <span className="font-normal text-muted">(optional)</span></p>
      <p className="mb-3 text-xs text-muted">1 = not at all, 5 = very. Only these ratings are stored, with no text and no financial details.</p>
      <div className="flex flex-wrap gap-5">
        <Scale label="Usefulness" name={`${surface}-u`} value={usefulness} onChange={setU} />
        <Scale label="Clarity" name={`${surface}-c`} value={clarity} onChange={setC} />
      </div>
      <button type="submit" disabled={!usefulness && !clarity} className="mt-4 min-h-11 rounded-xl border border-border-strong px-4 text-sm font-semibold disabled:opacity-50">
        Send ratings
      </button>
    </form>
  );
}
