"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Building2, CircleSlash, PauseCircle, XCircle, Unplug } from "lucide-react";
import { Feedback } from "@/components/Feedback";
import { SourceCard } from "@/components/SourceCard";
import { Callout, Card, PageHeader, cx } from "@/components/ui";
import { resolveAll } from "@/lib/pipeline/retrieve";

const STATES = [
  {
    icon: XCircle, title: "Failed instalment", tone: "text-danger",
    what: "One scheduled debit did not go through. The SIP itself is still registered.",
    points: [
      "Fund houses don't penalise a missed instalment, but your bank may charge for a dishonoured auto-debit.",
      "For a monthly SIP, 3 consecutive failed instalments mean it is treated as ceased (SEBI guidelines, as noted by AMFI).",
    ],
    sources: ["mfsh-missed-payments", "amfi-sebi-cessation-rule"],
  },
  {
    icon: PauseCircle, title: "Paused mandate", tone: "text-warn",
    what: "The payment instruction (for example a UPI AutoPay mandate) is put on hold, usually by you from your payment app.",
    points: [
      "NPCI's UPI AutoPay guideline says a mandate can be paused or revoked anytime.",
      "Some providers also offer an SIP pause facility. Terms differ, so check your provider's own details.",
    ],
    sources: ["npci-autopay-mandate"],
  },
  {
    icon: CircleSlash, title: "Stopped (ceased) SIP", tone: "text-muted",
    what: "The SIP registration has ended, either at your request or after consecutive failures. No further instalments are debited.",
    points: [
      "Units already bought stay invested and can be redeemed, subject to the scheme's exit load and tax rules.",
      "You can start a new SIP later, even in the same folio, but it is set up as a fresh SIP.",
    ],
    sources: ["mfsh-restart-sip", "amfi-guide-redemption"],
  },
];

const CHECKLIST = [
  "Read the failure message from your bank or app. It often states a reason.",
  "Check whether the account balance was available on the debit date, including any minimum balance your bank requires.",
  "Open your payment or banking app and see whether the mandate shows as active, paused or expired.",
  "Check that the mandate's maximum amount is not lower than your instalment (for example after a step-up).",
  "Check whether this was a single failure or the latest in a row.",
  "Contact your SIP provider or bank with the date and amount. Only they can confirm the actual status.",
  "If the provider doesn't resolve a complaint, SEBI's SCORES portal is the escalation route.",
];

export function PaymentHelp() {
  const [done, setDone] = useState<boolean[]>(CHECKLIST.map(() => false));
  return (
    <div>
      <PageHeader eyebrow="Payment Help" title="Failed, paused or stopped? They're not the same">
        SIP Saathi has no connection to any bank, payment app or fund house. It can explain the terms and give general steps. Your provider or bank holds your actual status.
      </PageHeader>

      <Callout tone="info" icon={<Unplug size={18} aria-hidden />} title="No live integrations">
        Nothing on this page reads your account. Never share OTPs, UPI PINs or passwords with anyone, including tools like this one.
      </Callout>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {STATES.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} as="article">
              <Icon size={22} className={s.tone} aria-hidden />
              <h2 className="mt-3 text-lg font-semibold tracking-tight">{s.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{s.what}</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/85">{s.points.map((p) => <li key={p}>{p}</li>)}</ul>
              <div className="mt-4 space-y-2">{resolveAll(s.sources).map((r) => <SourceCard key={r.contentId} r={r} />)}</div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card>
          <h2 className="text-lg font-semibold tracking-tight">General troubleshooting steps</h2>
          <p className="mb-4 mt-1 text-xs text-muted">Generic steps written for this prototype, not taken from a specific source and not specific to any provider. Ticks stay on this page only.</p>
          <ul className="space-y-2">
            {CHECKLIST.map((c, i) => (
              <li key={c}>
                <label className={cx("flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-relaxed transition-colors", done[i] ? "border-accent/30 bg-accent-softer" : "border-border hover:bg-surface-2")}>
                  <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent-strong)]" checked={done[i]} onChange={() => setDone(done.map((d, j) => (j === i ? !d : d)))} />
                  <span className={done[i] ? "text-muted line-through" : ""}>{c}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted" aria-live="polite">{done.filter(Boolean).length} of {CHECKLIST.length} checked</p>
        </Card>
        <div className="space-y-4">
          <Card>
            <h2 className="flex items-center gap-2 text-base font-semibold"><Building2 size={18} className="text-accent-strong" aria-hidden /> Where to raise an issue</h2>
            <div className="mt-3 space-y-2">{resolveAll(["amfi-guide-grievance", "sebi-ppt-helplines"]).map((r) => <SourceCard key={r.contentId} r={r} />)}</div>
          </Card>
          <Link href="/concern" className="flex min-h-12 items-center justify-between rounded-xl border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2">
            Describe your payment issue in the Concern Decoder <ArrowRight size={16} aria-hidden />
          </Link>
          <Feedback surface="payment" />
        </div>
      </div>
    </div>
  );
}
