import "server-only";
import { getStore, KEYS } from "../store";
import { modelId } from "./config";

// Shared pause after the provider's free quota runs out, so every visitor sees the same
// "try again after" time and nobody keeps calling a model that will only refuse.

export const QUOTA_MESSAGE = "The free AI quota has been used up for now, so new AI runs are paused.";

export class AIQuotaError extends Error {
  constructor(public retryAt: string) {
    super(QUOTA_MESSAGE);
  }
}

interface Pause {
  until: string;
  model: string; // quotas are per model, so switching models lifts the pause
}

/** ISO time until which AI runs are paused, or null when they are allowed. */
export async function getCooldown(): Promise<string | null> {
  try {
    const c = await getStore().getJSON<Pause>(KEYS.aiCooldown);
    return c && c.model === modelId() && Date.parse(c.until) > Date.now() ? c.until : null;
  } catch {
    return null;
  }
}

export async function setCooldown(until: Date): Promise<string> {
  const iso = until.toISOString();
  const current = await getCooldown();
  if (!current || Date.parse(current) < until.getTime()) await getStore().setJSON<Pause>(KEYS.aiCooldown, { until: iso, model: modelId() });
  return current && Date.parse(current) > until.getTime() ? current : iso;
}

/** Gemini's daily free quotas reset at midnight Pacific time. */
export function nextPacificMidnight(now = new Date()): Date {
  const pt = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  // toLocaleString drops milliseconds, so round the zone offset to whole minutes.
  const offsetMs = Math.round((now.getTime() - pt.getTime()) / 60_000) * 60_000;
  const midnight = new Date(pt);
  midnight.setHours(24, 0, 0, 0);
  return new Date(midnight.getTime() + offsetMs);
}

interface QuotaViolation {
  quotaId?: string;
}

/**
 * Reads a 429 error body. It is a daily limit only when every violated quota is a per-day one;
 * per-minute limits just ask us to wait the retryDelay the provider gives.
 */
export function parseRateLimit(message: string): { daily: boolean; retryDelayMs: number | null } {
  let violations: QuotaViolation[] = [];
  let delay: string | undefined;
  const start = message.indexOf("{");
  try {
    const body = JSON.parse(message.slice(start)) as { error?: { details?: { violations?: QuotaViolation[]; retryDelay?: string }[] } };
    const details = body.error?.details ?? [];
    violations = details.flatMap((d) => d.violations ?? []);
    delay = details.find((d) => d.retryDelay)?.retryDelay;
  } catch {
    delay = message.match(/"?retryDelay"?\s*:\s*"([\d.]+s)"/)?.[1] ?? message.match(/retry in ([\d.]+)s/i)?.[1]?.concat("s");
  }
  const ids = violations.map((v) => v.quotaId ?? "");
  const daily = ids.length > 0 ? ids.every((id) => /PerDay/i.test(id)) : /PerDay/i.test(message) && !/PerMinute|per minute/i.test(message);
  const secs = delay ? Number.parseFloat(delay) : NaN;
  return { daily, retryDelayMs: Number.isFinite(secs) ? Math.ceil(secs * 1000) : null };
}
