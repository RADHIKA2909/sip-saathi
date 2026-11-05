import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck, BookOpenCheck, UserX, PlayCircle, FlaskConical } from "lucide-react";
import { ButtonLink, Card } from "@/components/ui";

const FEATURES = [
  { href: "/concern", title: "Concern Decoder", body: "Describe what worries you. Get a plain-language explanation grounded in SEBI and AMFI education material." },
  { href: "/journey", title: "SIP Journey Mirror", body: "See what you have contributed and how consistent your instalments have been. No invented returns." },
  { href: "/market", title: "Market Context", body: "Contribution, market value, gain or loss, volatility and time horizon, explained with your own numbers." },
  { href: "/advice", title: "Conflicting Advice Decoder", body: "Paste what you heard. See which parts are checkable facts, opinions, assumptions or unsupported claims." },
  { href: "/payment", title: "Payment Help", body: "A failed instalment, a paused mandate and a stopped SIP are different things. Learn which is which." },
  { href: "/canvas", title: "Decision Clarity Canvas", body: "Bring it together: what you know, what is missing, and questions to reflect on. No recommendation." },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="hero-gradient rounded-3xl border border-border/70 bg-surface px-5 py-10 sm:px-10 sm:py-14">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-surface px-3 py-1 text-xs font-medium text-accent-strong">
          Independent educational prototype · no account needed
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Your SIP journey, <span className="text-accent-strong">made clearer.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Market dips, tiny-feeling amounts, conflicting tips and failed payments can make a first SIP confusing. SIP Saathi explains what is happening in plain language,
          shows its sources, and leaves every decision to you.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonLink href="/concern">Start with your concern <ArrowRight size={16} aria-hidden /></ButtonLink>
          <ButtonLink href="/scenarios" variant="secondary"><PlayCircle size={16} aria-hidden /> Try 3 scenarios</ButtonLink>
        </div>
      </section>

      <section aria-labelledby="boundaries" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <h2 id="boundaries" className="sr-only">What SIP Saathi does and does not do</h2>
        {[
          { icon: BookOpenCheck, t: "Grounded", b: "Every point cites a passage from a verified regulator or industry education source." },
          { icon: ShieldCheck, t: "Never advice", b: "No fund picks, no return predictions, no continue/pause/stop recommendations, no pressure." },
          { icon: Lock, t: "Private by design", b: "No account. Identifiers like PAN or account numbers are removed. Analytics are counts only." },
          { icon: UserX, t: "No live access", b: "SIP Saathi is not connected to any bank, app or fund house and never claims to see your account." },
        ].map(({ icon: Icon, t, b }) => (
          <div key={t} className="rounded-2xl border border-border bg-surface p-5">
            <Icon size={20} className="text-accent-strong" aria-hidden />
            <p className="mt-3 font-semibold">{t}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{b}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="explore">
        <h2 id="explore" className="mb-4 text-lg font-semibold tracking-tight">Explore</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className="group rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-md">
              <p className="flex items-center justify-between font-semibold">
                {f.title} <ArrowRight size={16} className="text-muted transition-transform group-hover:translate-x-0.5" aria-hidden />
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <Card className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="flex items-center gap-2 font-semibold"><FlaskConical size={18} className="text-accent-strong" aria-hidden /> For assessors and mentors</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            The hypothesis behind this prototype is <em>untested</em>: that first-time investors facing volatility, conflicting information or unclear progress may struggle to
            make informed continuation decisions. The discovery evidence is qualitative (18 public conversations), not representative. Run the evaluation suite or read the limitations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/eval" variant="secondary">Evaluation Lab</ButtonLink>
          <ButtonLink href="/about" variant="ghost">Research status</ButtonLink>
        </div>
      </Card>
    </div>
  );
}
