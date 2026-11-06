import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { PASSAGES } from "@/content/kb/passages";
import { KB_VERSION, SOURCES } from "@/content/kb/sources";

export const metadata: Metadata = { title: "Source manifest" };

export default function SourcesPage() {
  return (
    <div>
      <PageHeader eyebrow={`Knowledge base ${KB_VERSION}`} title="Source manifest">
        Every source SIP Saathi can cite, with the exact passages it is allowed to use. Each source was fetched and read on its retrieval date. Passages are close paraphrases, and text in quotation marks is copied exactly.
        The project owner re-checked the passages against their original sources on 7 November 2026.
      </PageHeader>
      <div className="space-y-4">
        {SOURCES.map((s) => (
          <Card key={s.id} as="article" id={s.id}>
            <h2 className="font-semibold leading-snug">{s.title}</h2>
            <p className="mt-1 text-sm text-muted">{s.publisher} · {s.format} · Published: {s.published} · Retrieved: {s.retrieved}</p>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 break-all text-sm font-medium text-accent-strong underline underline-offset-2">
              {s.url} <ExternalLink size={12} aria-hidden /><span className="sr-only">(opens in a new tab)</span>
            </a>
            <ul className="mt-4 space-y-3">
              {PASSAGES.filter((p) => p.sourceId === s.id).map((p) => (
                <li key={p.contentId} className="rounded-xl bg-surface-2 p-3 text-sm leading-relaxed">
                  <p className="mb-1 font-mono text-xs text-muted">{p.contentId} · {p.locator}</p>
                  {p.text}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
