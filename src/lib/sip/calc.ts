/**
 * SIP Journey Mirror arithmetic. Contributions only: nothing here estimates returns,
 * market value, or growth, and nothing should be added that does.
 */

export interface JourneyInput {
  /** Monthly instalment in whole rupees. */
  monthlyAmount: number;
  /** First scheduled instalment month, "YYYY-MM". */
  startMonth: string;
  /** Number of instalments that went through successfully. */
  successfulInstalments: number;
  /** Month to measure up to, "YYYY-MM". */
  asOfMonth: string;
  /** Whether the as-of month's instalment date has already passed. */
  includeAsOfMonth: boolean;
}

export interface JourneyStats {
  scheduledInstalments: number;
  successfulInstalments: number;
  missedInstalments: number;
  /** Successful / scheduled, as a percentage with one decimal place. Null when nothing was scheduled yet. */
  consistencyPct: number | null;
  totalContributed: number;
  /** Cumulative contributed after each successful instalment, for the chart. */
  cumulative: { instalment: number; total: number }[];
}

export type JourneyResult = { ok: true; stats: JourneyStats } | { ok: false; errors: Partial<Record<keyof JourneyInput, string>> };

export const LIMITS = { minAmount: 100, maxAmount: 1_000_000, maxMonths: 600 } as const;

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function parseMonth(m: string): { y: number; m: number } | null {
  const match = MONTH_RE.exec(m);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) };
}

/** Whole calendar months from a to b (b − a). Both "YYYY-MM". */
export function monthsBetween(a: string, b: string): number {
  const pa = parseMonth(a);
  const pb = parseMonth(b);
  if (!pa || !pb) throw new Error("Invalid month");
  return (pb.y - pa.y) * 12 + (pb.m - pa.m);
}

/** Instalments that should have been attempted from startMonth up to asOfMonth. */
export function scheduledInstalments(startMonth: string, asOfMonth: string, includeAsOfMonth: boolean): number {
  const diff = monthsBetween(startMonth, asOfMonth);
  if (diff < 0) return 0;
  return diff + (includeAsOfMonth ? 1 : 0);
}

export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function computeJourney(input: JourneyInput): JourneyResult {
  const errors: Partial<Record<keyof JourneyInput, string>> = {};
  const { monthlyAmount, startMonth, successfulInstalments, asOfMonth, includeAsOfMonth } = input;

  if (!Number.isFinite(monthlyAmount) || !Number.isInteger(monthlyAmount)) errors.monthlyAmount = "Enter a whole rupee amount.";
  else if (monthlyAmount < LIMITS.minAmount || monthlyAmount > LIMITS.maxAmount)
    errors.monthlyAmount = `Enter an amount between ₹${LIMITS.minAmount} and ₹${LIMITS.maxAmount.toLocaleString("en-IN")}.`;

  if (!parseMonth(startMonth)) errors.startMonth = "Choose the month of your first instalment.";
  if (!parseMonth(asOfMonth)) errors.asOfMonth = "Invalid reference month.";

  if (!errors.startMonth && !errors.asOfMonth) {
    const diff = monthsBetween(startMonth, asOfMonth);
    if (diff < 0) errors.startMonth = "Start month cannot be in the future.";
    else if (diff > LIMITS.maxMonths) errors.startMonth = "Start month is too far in the past.";
  }

  if (!Number.isFinite(successfulInstalments) || !Number.isInteger(successfulInstalments) || successfulInstalments < 0)
    errors.successfulInstalments = "Enter a whole number of instalments (0 or more).";

  if (Object.keys(errors).length) return { ok: false, errors };

  const scheduled = scheduledInstalments(startMonth, asOfMonth, includeAsOfMonth);
  if (successfulInstalments > scheduled) {
    return {
      ok: false,
      errors: {
        successfulInstalments:
          scheduled === 0
            ? "No instalment has been due yet for this start month."
            : `That is more than the ${scheduled} instalment${scheduled === 1 ? "" : "s"} scheduled since your start month.`,
      },
    };
  }

  const cumulative = Array.from({ length: successfulInstalments }, (_, i) => ({ instalment: i + 1, total: (i + 1) * monthlyAmount }));
  return {
    ok: true,
    stats: {
      scheduledInstalments: scheduled,
      successfulInstalments,
      missedInstalments: scheduled - successfulInstalments,
      consistencyPct: scheduled === 0 ? null : Math.round((successfulInstalments / scheduled) * 1000) / 10,
      totalContributed: monthlyAmount * successfulInstalments,
      cumulative,
    },
  };
}

/** Gain or loss given a market value the user typed from their own statement. */
export function gainLoss(totalContributed: number, statementValue: number): { amount: number; pctOfContributed: number | null } {
  const amount = Math.round((statementValue - totalContributed) * 100) / 100;
  return {
    amount,
    pctOfContributed: totalContributed > 0 ? Math.round((amount / totalContributed) * 1000) / 10 : null,
  };
}

/** Units bought and average cost for a list of hypothetical NAVs at a fixed instalment. */
export function rupeeCostAverage(instalment: number, navs: number[]): { units: number[]; totalUnits: number; totalInvested: number; averageCost: number | null } {
  const valid = navs.filter((n) => Number.isFinite(n) && n > 0);
  const units = valid.map((n) => instalment / n);
  const totalUnits = units.reduce((a, b) => a + b, 0);
  const totalInvested = instalment * valid.length;
  return { units, totalUnits, totalInvested, averageCost: totalUnits > 0 ? totalInvested / totalUnits : null };
}

export function formatINR(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/** Fixed demo journey so the Mirror never needs real data. Clearly labelled as demo in the UI. */
export const DEMO_JOURNEY: JourneyInput = {
  monthlyAmount: 500,
  startMonth: "2025-11",
  successfulInstalments: 10,
  asOfMonth: "2026-10",
  includeAsOfMonth: true,
};
