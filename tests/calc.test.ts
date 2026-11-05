import { describe, expect, it } from "vitest";
import { computeJourney, DEMO_JOURNEY, gainLoss, monthsBetween, rupeeCostAverage, scheduledInstalments } from "@/lib/sip/calc";

describe("monthsBetween / scheduledInstalments", () => {
  it("counts calendar months across years", () => {
    expect(monthsBetween("2025-11", "2026-10")).toBe(11);
    expect(monthsBetween("2026-01", "2026-01")).toBe(0);
  });
  it("includes or excludes the as-of month", () => {
    expect(scheduledInstalments("2025-11", "2026-10", true)).toBe(12);
    expect(scheduledInstalments("2025-11", "2026-10", false)).toBe(11);
    expect(scheduledInstalments("2026-10", "2026-10", false)).toBe(0);
    expect(scheduledInstalments("2026-12", "2026-10", true)).toBe(0);
  });
});

describe("computeJourney", () => {
  it("computes the demo journey exactly", () => {
    const r = computeJourney(DEMO_JOURNEY);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.stats.scheduledInstalments).toBe(12);
    expect(r.stats.successfulInstalments).toBe(10);
    expect(r.stats.missedInstalments).toBe(2);
    expect(r.stats.totalContributed).toBe(5000);
    expect(r.stats.consistencyPct).toBe(83.3);
    expect(r.stats.cumulative.at(-1)).toEqual({ instalment: 10, total: 5000 });
  });
  it("100% when all instalments succeed", () => {
    const r = computeJourney({ ...DEMO_JOURNEY, successfulInstalments: 12 });
    expect(r.ok && r.stats.consistencyPct).toBe(100);
  });
  it("rejects more successes than scheduled", () => {
    const r = computeJourney({ ...DEMO_JOURNEY, successfulInstalments: 13 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.successfulInstalments).toMatch(/12 instalments/);
  });
  it("rejects future start, bad amounts, fractional counts", () => {
    expect(computeJourney({ ...DEMO_JOURNEY, startMonth: "2027-01" }).ok).toBe(false);
    expect(computeJourney({ ...DEMO_JOURNEY, monthlyAmount: 50 }).ok).toBe(false);
    expect(computeJourney({ ...DEMO_JOURNEY, monthlyAmount: 500.5 }).ok).toBe(false);
    expect(computeJourney({ ...DEMO_JOURNEY, successfulInstalments: 2.5 }).ok).toBe(false);
    expect(computeJourney({ ...DEMO_JOURNEY, successfulInstalments: -1 }).ok).toBe(false);
    expect(computeJourney({ ...DEMO_JOURNEY, startMonth: "2026-13" }).ok).toBe(false);
  });
  it("null consistency when nothing is due yet", () => {
    const r = computeJourney({ ...DEMO_JOURNEY, startMonth: "2026-10", includeAsOfMonth: false, successfulInstalments: 0 });
    expect(r.ok && r.stats.consistencyPct).toBe(null);
  });
});

describe("gainLoss and rupeeCostAverage", () => {
  it("computes gain/loss from a user-entered value", () => {
    expect(gainLoss(5000, 4600)).toEqual({ amount: -400, pctOfContributed: -8 });
    expect(gainLoss(0, 100).pctOfContributed).toBe(null);
  });
  it("reproduces AMFI's illustrative example (NAV 20 then 10)", () => {
    const r = rupeeCostAverage(1000, [20, 10]);
    expect(r.totalUnits).toBe(150);
    expect(r.totalInvested).toBe(2000);
    expect(r.averageCost?.toFixed(2)).toBe("13.33");
  });
  it("ignores invalid NAVs", () => {
    expect(rupeeCostAverage(1000, [0, -5, NaN]).averageCost).toBe(null);
  });
});
