import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANT: Record<Variant, string> = {
  primary: "bg-accent-strong text-white hover:bg-[#006a4e] shadow-sm",
  secondary: "bg-surface text-foreground border border-border-strong hover:bg-surface-2",
  ghost: "text-accent-strong hover:bg-accent-soft",
  danger: "bg-surface text-danger border border-danger/40 hover:bg-danger-soft",
};
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 min-h-11";

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" className={cx(BASE, VARIANT[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(BASE, VARIANT[variant], className)} {...props} />;
}

export function Card({ className, children, as: Tag = "section", ...rest }: { className?: string; children: ReactNode; as?: "section" | "div" | "article" } & Record<string, unknown>) {
  return (
    <Tag className={cx("rounded-2xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,20,0.04)] sm:p-6", className)} {...rest}>
      {children}
    </Tag>
  );
}

type Tone = "neutral" | "accent" | "warn" | "danger" | "info";
const TONE: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-border",
  accent: "bg-accent-soft text-accent-strong border-accent/20",
  warn: "bg-warn-soft text-warn border-warn/20",
  danger: "bg-danger-soft text-danger border-danger/20",
  info: "bg-info-soft text-info border-info/20",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", TONE[tone], className)}>{children}</span>;
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 sm:mb-8">
      {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent-strong">{eyebrow}</p>}
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

export function Callout({ tone = "info", title, children, icon }: { tone?: Tone; title?: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <div className={cx("flex gap-3 rounded-xl border p-4 text-sm leading-relaxed", TONE[tone])} role="note">
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="text-foreground/90">
        {title && <p className="mb-0.5 font-semibold text-foreground">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton h-4", className)} aria-hidden="true" />;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
