"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { ModeBadge } from "./ModeBadge";
import { cx } from "./ui";

const PRIMARY = [
  { href: "/concern", label: "Decode a concern" },
  { href: "/journey", label: "Journey Mirror" },
  { href: "/market", label: "Market context" },
  { href: "/advice", label: "Advice decoder" },
  { href: "/payment", label: "Payment help" },
  { href: "/canvas", label: "Clarity canvas" },
];
const SECONDARY = [
  { href: "/scenarios", label: "Try 3 scenarios" },
  { href: "/eval", label: "Evaluation Lab" },
  { href: "/insights", label: "Metrics" },
  { href: "/about", label: "About & limits" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (href: string) => path === href || path.startsWith(href + "/");

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:shadow">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center" aria-label="SIP Saathi home">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ModeBadge />
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-xl border border-border lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            </button>
          </div>
        </div>
        <nav aria-label="Main" className="mx-auto hidden max-w-6xl flex-wrap items-center gap-1 px-4 pb-2 sm:px-6 lg:flex">
          {PRIMARY.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
              className={cx("whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm transition-colors", active(l.href) ? "bg-accent-soft font-semibold text-accent-strong" : "text-muted hover:bg-surface-2 hover:text-foreground")}>
              {l.label}
            </Link>
          ))}
          <span className="mx-2 h-5 w-px bg-border" aria-hidden />
          {SECONDARY.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
              className={cx("whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm transition-colors", active(l.href) ? "bg-accent-soft font-semibold text-accent-strong" : "text-muted hover:bg-surface-2 hover:text-foreground")}>
              {l.label}
            </Link>
          ))}
        </nav>
        {open && (
          <nav id="mobile-nav" aria-label="Main" className="border-t border-border bg-surface px-4 py-3 lg:hidden">
            <ul className="grid gap-1">
              {[...PRIMARY, ...SECONDARY].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} aria-current={active(l.href) ? "page" : undefined}
                    className={cx("block rounded-lg px-3 py-3 text-[15px]", active(l.href) ? "bg-accent-soft font-semibold text-accent-strong" : "text-foreground hover:bg-surface-2")}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-2 px-4 py-8 text-xs leading-relaxed text-muted sm:px-6">
          <p>
            <strong className="text-foreground">SIP Saathi is an independent student prototype</strong> (NextLeap product management graduation project). It is not
            affiliated with, endorsed by, or connected to any investment platform, fund house, bank or regulator.
          </p>
          <p>
            Educational information only. Not investment advice, not a recommendation to start, continue, pause or stop any SIP, and not a prediction of returns.
            Mutual fund investments are subject to market risks; read all scheme-related documents carefully.
          </p>
          <p>
            No account needed. Do not enter PAN, account numbers or other personal details.{" "}
            <Link href="/about" className="font-medium text-accent-strong underline underline-offset-2">Research status and limitations</Link>
          </p>
        </div>
      </footer>
    </>
  );
}
