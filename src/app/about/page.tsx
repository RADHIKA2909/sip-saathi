import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2, Users, FlaskRound } from "lucide-react";
import { Card, PageHeader } from "@/components/ui";
import { SOURCES } from "@/content/kb/sources";

export const metadata: Metadata = { title: "About, research status and limitations" };

const THEMES: [string, number][] = [["Knowledge gaps", 7], ["Market anxiety", 6], ["Motivation / progress", 4], ["Fund-choice anxiety", 4], ["Continuation enablers", 3], ["Payment friction", 2], ["Financial pressure", 1]];

export default function About() {
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="About" title="Research status, evidence and limitations">
        SIP Saathi is an independent NextLeap product management graduation project, inspired by modern Indian investing apps. It is not affiliated with Groww or any other platform, fund house, bank or regulator.
      </PageHeader>

      <section aria-labelledby="ev" className="grid gap-4 lg:grid-cols-3">
        <h2 id="ev" className="sr-only">Evidence status</h2>
        <Card>
          <FileCheck2 className="text-accent-strong" aria-hidden />
          <h3 className="mt-3 font-semibold">Actual public-source evidence</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/85">
            <li>AI-assisted discovery screened <strong>377</strong> public records and selected <strong>18</strong> qualitative conversations.</li>
            <li>The knowledge base: {SOURCES.length} public regulator and industry education sources, each fetched and read on its retrieval date (<Link className="font-medium text-accent-strong underline" href="/sources">see the source manifest</Link>).</li>
          </ul>
        </Card>
        <Card>
          <Users className="text-warn" aria-hidden />
          <h3 className="mt-3 font-semibold">Simulated scenarios</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/85">
            <li>Six AI-generated personas were used as fictional design and test scenarios only.</li>
            <li>The three assessor scenarios and the demo SIP data are fictional.</li>
            <li>No interviews or usability tests with real investors have been completed for this MVP.</li>
          </ul>
        </Card>
        <Card>
          <FlaskRound className="text-info" aria-hidden />
          <h3 className="mt-3 font-semibold">Untested hypotheses</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/85">
            <li>First-time SIP investors facing volatility, conflicting information or unclear progress <em>may</em> struggle to make informed continuation decisions.</li>
            <li>Grounded, neutral explanations <em>may</em> improve understanding and perceived clarity.</li>
            <li>Any effect on 12-month active-SIP retention is unknown and unmeasured.</li>
          </ul>
        </Card>
      </section>

      <Card>
        <h2 className="font-semibold">Discovery themes (overlapping, from 18 conversations)</h2>
        <p className="mt-1 text-sm text-muted">One conversation can show several themes. These counts are not prevalence estimates and say nothing about causes.</p>
        <table className="mt-3 w-full max-w-md text-sm">
          <caption className="sr-only">Number of conversations showing each theme</caption>
          <thead className="text-xs text-muted"><tr><th scope="col" className="py-1.5 text-left">Theme</th><th scope="col" className="py-1.5 text-right">Conversations</th></tr></thead>
          <tbody>{THEMES.map(([t, n]) => <tr key={t} className="border-t border-border"><td className="py-1.5">{t}</td><td className="py-1.5 text-right tabular-nums">{n}</td></tr>)}</tbody>
        </table>
        <h3 className="mt-6 font-semibold">Discovery classifier evaluation (separate from the MVP evaluation)</h3>
        <p className="mt-1 text-sm leading-relaxed text-foreground/85">
          On 20 human-approved examples: theme micro-F1 68%, SIP status accuracy 90%, first-time label accuracy 90%, 19 of 20 quotes verbatim, and one potentially invented detail flagged. This is a small
          sample and does not amount to full validation. The MVP&apos;s own evaluation is in the <Link href="/eval" className="font-medium text-accent-strong underline">Evaluation Lab</Link>.
        </p>
      </Card>

      <Card id="modes" className="scroll-mt-28">
        <h2 className="font-semibold">How answers are produced</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground/85">
          <li><strong>Input screen</strong>: personal identifiers removed; distress, prompt injection, fund-pick and prediction requests routed to preapproved responses without calling AI.</li>
          <li><strong>Classify and retrieve</strong>: a rule-based classifier picks a concern; up to four approved passages are selected deterministically.</li>
          <li><strong>Generate</strong> (live mode only): the model must answer only from those passages, citing them, as structured output.</li>
          <li><strong>Validate</strong>: schema, citations (exist and were retrieved), numbers present in sources, lexical support estimate, and nine safety rules. Failure leads to a preapproved fallback.</li>
          <li><strong>Judge</strong> (optional): a separate AI review that can block but never approve. It is fallible.</li>
        </ol>
        <p className="mt-3 text-sm text-foreground/85">
          <strong>Educational demo mode</strong> appears when no AI key is configured: preapproved, source-cited content selected by rules, labelled on every answer. No live AI generation is claimed in that mode.
        </p>
      </Card>

      <Card>
        <h2 className="font-semibold">Limitations</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/85">
          <li>Safety rules are pattern-based. They can miss unsafe phrasing they weren&apos;t written for, and can over-block safe text (which only produces a fallback).</li>
          <li>The &ldquo;claims supported&rdquo; check measures word overlap with sources. It is not proof of factual accuracy.</li>
          <li>The knowledge base is small (about 30 passages) and paraphrased by the developers. The project owner re-checked them against their sources on 7 November 2026, and sources can change after that date.</li>
          <li>Some sources (Mutual Funds Sahi Hai pages) don&apos;t show a publication date, and rules can change after the retrieval date.</li>
          <li>English only. Not tested with screen-reader users or real first-time investors.</li>
          <li>No account, portfolio, mandate or market integrations. Nothing here reflects anyone&apos;s real status.</li>
        </ul>
      </Card>
    </div>
  );
}
