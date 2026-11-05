"use client";
import { ExternalLink, FileText } from "lucide-react";
import { track } from "@/lib/analytics/client";
import type { ResolvedReference } from "@/lib/types";

export function SourceCard({ r, index }: { r: ResolvedReference; index?: number }) {
  return (
    <details id={`ref-${r.contentId}`} className="group rounded-xl border border-border bg-surface open:bg-accent-softer" onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && track("source_opened", { sourceId: r.sourceId })}>
      <summary className="flex cursor-pointer list-none items-start gap-3 rounded-xl p-3.5 [&::-webkit-details-marker]:hidden">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-accent-soft text-xs font-semibold text-accent-strong" aria-hidden>
          {index ?? <FileText size={14} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium leading-snug">{r.sourceTitle}</span>
          <span className="mt-0.5 block text-xs text-muted">
            {r.publisher} · {r.locator}
          </span>
        </span>
        <span className="text-xs font-medium text-accent-strong group-open:hidden">Show</span>
        <span className="hidden text-xs font-medium text-accent-strong group-open:inline">Hide</span>
      </summary>
      <div className="border-t border-border px-3.5 pb-3.5 pt-3 text-sm leading-relaxed">
        <p className="text-foreground/90">{r.passage}</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted">
          <dt>Published</dt>
          <dd>{r.published}</dd>
          <dt>Retrieved</dt>
          <dd>{r.retrieved}</dd>
          <dt>Content ID</dt>
          <dd className="font-mono">{r.contentId}</dd>
        </dl>
        <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent-strong underline underline-offset-2">
          Open original source <ExternalLink size={12} aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </details>
  );
}
